"""Data loading and pipeline orchestration for Q-CRAFT Explorer."""

from pathlib import Path

import polars as pl

from qcraft_engine.baseline_v1 import baseline_v1
from qcraft_engine.climate import calc_climate_scenario
from qcraft_engine.constants import (
    CLIMATE_SCENARIOS,
    DEFAULTS,
    YEAR_END,
    YEAR_START,
)
from qcraft_engine.demography import demography_country
from qcraft_engine.fiscal import baseline_country
from qcraft_engine.inflation import inflation_country
from qcraft_engine.interest_rate import interest_rate_country
from qcraft_engine.productivity import productivity_country


def _find_project_root() -> Path:
    """Find project root by looking for pyproject.toml + packages/."""
    current = Path(__file__).resolve().parent
    for _ in range(10):
        if (current / "pyproject.toml").exists() and (current / "packages").exists():
            return current
        current = current.parent
    msg = "Cannot find project root"
    raise FileNotFoundError(msg)


DATA_DIR = _find_project_root() / "data" / "processed"


def load_parquet_data(
    data_dir: Path | None = None,
) -> dict[str, pl.DataFrame]:
    """Load all Parquet files."""
    d = data_dir or DATA_DIR
    return {
        "macrofiscal": pl.read_parquet(d / "macrofiscal.parquet"),
        "demography": pl.read_parquet(d / "demography.parquet"),
        "productivity": pl.read_parquet(d / "productivity.parquet"),
        "climate": pl.read_parquet(d / "climate.parquet"),
    }


def get_country_list(
    data: dict[str, pl.DataFrame],
) -> list[dict[str, str]]:
    """Get sorted list of {iso3c, country} dicts."""
    df = data["macrofiscal"]
    countries = df.select("iso3c", "country").unique().drop_nulls().sort("country")
    return countries.to_dicts()


def _build_macrofiscal_deflator(
    macrofiscal: pl.DataFrame,
    iso3c: str,
) -> pl.DataFrame:
    """Build the macrofiscal_deflator input for inflation_country().

    Needs: iso3c, country, years, gdp_deflator (the INDEX, not growth).
    The WEO macrofiscal data has the raw deflator index.
    """
    return (
        macrofiscal.filter(pl.col("iso3c") == iso3c)
        .select("iso3c", "country", "years", "gdp_deflator")
        .sort("years")
    )


def _build_macrofiscal_for_baseline(
    macrofiscal: pl.DataFrame,
    iso3c: str,
) -> pl.DataFrame:
    """Build macrofiscal input for baseline_v1().

    Needs: iso3c, years, real_gdp, nominal_gdp,
    real_gdp_growth_percent, nominal_gdp_growth_percent,
    gdp_deflator_growth_percent.
    Filters out rows with null growth rates (first year has no prior).
    """
    return (
        macrofiscal.filter(
            (pl.col("iso3c") == iso3c)
            & pl.col("real_gdp_growth_percent").is_not_null()
            & pl.col("nominal_gdp_growth_percent").is_not_null()
            & pl.col("gdp_deflator_growth_percent").is_not_null()
        )
        .select(
            "iso3c",
            "country",
            "years",
            "real_gdp",
            "nominal_gdp",
            "real_gdp_growth_percent",
            "nominal_gdp_growth_percent",
            "gdp_deflator_growth_percent",
        )
        .sort("years")
    )


def _build_macrofiscal_for_fiscal(
    macrofiscal: pl.DataFrame,
    iso3c: str,
) -> pl.DataFrame:
    """Build macrofiscal input for baseline_country() (fiscal).

    Needs all fiscal columns plus nominal_gdp and interest_rate_percent.
    Filters out rows with null nominal_gdp/revenue (truly missing data)
    but fills null interest_rate_percent with 0.0 to preserve contiguous
    year sequences needed by the engine.
    """
    return (
        macrofiscal.filter(
            (pl.col("iso3c") == iso3c)
            & pl.col("nominal_gdp").is_not_null()
            & pl.col("revenue").is_not_null()
        )
        .with_columns(
            pl.col("interest_rate_percent").fill_null(0.0),
        )
        .select(
            "iso3c",
            "country",
            "years",
            "revenue",
            "revenue_percent_gdp",
            "primary_expenditure",
            "primary_expenditure_percent_gdp",
            "primary_balance",
            "primary_balance_percent_gdp",
            "interest_expenditure",
            "interest_expenditure_percent_gdp",
            "total_expenditure",
            "overall_balance",
            "overall_balance_percent_gdp",
            "debt_to_gdp",
            "debt",
            "nominal_gdp",
            "interest_rate_percent",
        )
        .sort("years")
    )


def _build_climate_variation(
    climate_data: pl.DataFrame,
    iso3c: str,
    scenario: str,
    weo_max_year: int = 2029,
) -> pl.DataFrame:
    """Build climate_variation DataFrame from GDP loss % data.

    The climate module expects: years, climate_variation (LP growth shock).
    We derive this from cumulative GDP loss using first differences
    (per oracle: climate_variation = gdp_index[t] - gdp_index[t-1]):
    - GDP_index(t) = 100 + gdp_loss_percent(t)
    - climate_variation(t) = gdp_index(t) - gdp_index(t-1)

    Variation is zero for years <= weo_max_year because the engine
    determines its WEO boundary from the first nonzero variation.
    Climate shocks apply only during the projection period.
    """
    scn = climate_data.filter(
        (pl.col("iso3c") == iso3c) & (pl.col("climate_scenario") == scenario)
    ).sort("years")

    # Build full year range
    years = list(range(YEAR_START, YEAR_END + 1))
    gdp_loss_lookup: dict[int, float] = {}
    for row in scn.iter_rows(named=True):
        gdp_loss_lookup[int(row["years"])] = float(row["gdp_loss_percent"])

    # Compute GDP index and first-difference variation
    # Only apply from projection period (weo_max_year + 1)
    variations: list[float] = []
    prev_index = 100.0 + gdp_loss_lookup.get(weo_max_year, 0.0)
    for y in years:
        if y <= weo_max_year:
            variations.append(0.0)
        else:
            gdp_loss = gdp_loss_lookup.get(y, 0.0)
            current_index = 100.0 + gdp_loss
            var = current_index - prev_index  # First difference, NOT percent change
            variations.append(var)
            prev_index = current_index

    return pl.DataFrame({"years": years, "climate_variation": variations})


def run_pipeline(
    data: dict[str, pl.DataFrame],
    iso3c: str,
    params: dict | None = None,
) -> dict[str, pl.DataFrame]:
    """Run full Q-CRAFT pipeline for one country.

    Args:
        data: Output of load_parquet_data().
        iso3c: 3-letter ISO country code.
        params: Optional parameter overrides. Keys:
            demography_variant, productivity_start, productivity_end,
            inflation_start, inflation_end, interest_rate_mode,
            debt_target, fiscal_rule, expenditure_rigidity.

    Returns:
        Dict with keys: demography, productivity, inflation,
        baseline_v1, interest_rate, fiscal, and one per climate
        scenario (e.g. "Paris", "Moderate", etc.).
    """
    p = {**DEFAULTS, **(params or {})}

    # 1. Demography
    demo = demography_country(
        demography_data=data["demography"],
        iso3c=iso3c,
        level=p["demography_variant"],
    )

    # 2. Productivity
    prod = productivity_country(
        productivity_data=data["productivity"],
        iso3c=iso3c,
        productivity_start=p["productivity_start"],
        productivity_end=p["productivity_end"],
    )

    # 3. Inflation
    macro_deflator = _build_macrofiscal_deflator(data["macrofiscal"], iso3c)
    infl = inflation_country(
        macrofiscal_deflator=macro_deflator,
        iso3c=iso3c,
        inflation_start=p["inflation_start"],
        inflation_end=p["inflation_end"],
    )

    # 4. Baseline V1
    macro_baseline = _build_macrofiscal_for_baseline(data["macrofiscal"], iso3c)
    bv1 = baseline_v1(
        data_demography=demo,
        data_inflation=infl,
        data_productivity=prod,
        macrofiscal=macro_baseline,
        iso3c=iso3c,
    )

    # 5. Interest rate
    macro_full = _build_macrofiscal_for_fiscal(data["macrofiscal"], iso3c)
    ir = interest_rate_country(
        df_baseline_v1=bv1,
        macrofiscal=macro_full,
        iso3c=iso3c,
        select_rate=p["interest_rate_mode"],
    )

    # 6. Fiscal (baseline_country)
    fiscal = baseline_country(
        data_baseline=bv1,
        data_interest=ir,
        data_macrofiscal=macro_full,
        debt_target=p["debt_target"],
        fiscal_rule=p["fiscal_rule"],
        iso3c=iso3c,
    )

    results: dict[str, pl.DataFrame] = {
        "demography": demo,
        "productivity": prod,
        "inflation": infl,
        "baseline_v1": bv1,
        "interest_rate": ir,
        "fiscal": fiscal,
    }

    # 7. Climate scenarios
    for scenario in CLIMATE_SCENARIOS:
        cv = _build_climate_variation(data["climate"], iso3c, scenario)
        climate_result = calc_climate_scenario(
            data_baseline=fiscal,
            data_baseline_v1=bv1,
            data_interest=ir,
            climate_variation=cv,
            expenditure_rigidity=p["expenditure_rigidity"],
        )
        results[scenario] = climate_result

    return results
