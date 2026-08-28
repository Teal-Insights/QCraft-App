"""Interest rate projection module.

Projects the nominal interest rate on government debt under three user-selectable
approaches, then derives the real interest rate and interest-growth differential.
This module is NOT recursive — it can be computed in a single pass since all inputs
(GDP growth, inflation) are fully determined by baseline_v1.
"""

import polars as pl

from qcraft_engine.errors import MissingYearError

YEAR_START = 2009
YEAR_END = 2099


def interest_rate_country(
    df_baseline_v1: pl.DataFrame,
    macrofiscal: pl.DataFrame,
    iso3c: str,
    select_rate: str = "Nominal interest rate",
    long_run_interest_rate: float = 1.0,
) -> pl.DataFrame:
    """Compute interest rate projections for a single country.

    Args:
        df_baseline_v1: Output of baseline_v1(). Must have columns:
            years, nominal_gdp_growth_percent, gdp_deflator_growth_percent.
        macrofiscal: Historical macrofiscal data. Must have columns:
            iso3c, years, interest_rate_percent.
        iso3c: 3-letter ISO country code (e.g. "UGA").
        select_rate: One of "Nominal interest rate", "Interest-growth differential",
            or "Real interest rate".
        long_run_interest_rate: Long-run real rate assumption (default 1.0%).
            Only used when select_rate = "Real interest rate".

    Returns:
        DataFrame with columns: iso3c, country, years, nominal_interest_rate,
        inflation, nominal_gdp_growth_percent, real_interest_rate,
        interest_growth_differential. Years 2009-2099 (91 rows).
    """
    # Get country name from baseline
    country_filtered = df_baseline_v1.filter(pl.col("iso3c") == iso3c)
    if country_filtered.is_empty():
        msg = f"No data found for iso3c='{iso3c}' in df_baseline_v1"
        raise ValueError(msg)
    country_name: str = country_filtered["country"][0]

    # Extract historical nominal interest rate from macrofiscal
    macro_country = macrofiscal.filter(pl.col("iso3c") == iso3c).sort("years")
    if macro_country.is_empty():
        msg = f"No data found for iso3c='{iso3c}' in macrofiscal"
        raise ValueError(msg)
    weo_max_year = int(macro_country["years"].max())  # type: ignore[arg-type]

    # Build lookup: year -> historical nominal interest rate
    hist_rate: dict[int, float] = {}
    for row in macro_country.iter_rows(named=True):
        hist_rate[int(row["years"])] = float(row["interest_rate_percent"])

    # Anchor values from last macrofiscal year
    base_nominal_rate = hist_rate[weo_max_year]

    # Build lookups from baseline_v1 (filter by iso3c for multi-country safety)
    baseline = df_baseline_v1.filter(
        (pl.col("iso3c") == iso3c) & pl.col("years").is_between(YEAR_START, YEAR_END)
    ).sort("years")
    gdp_growth_lookup: dict[int, float] = {}
    inflation_lookup: dict[int, float] = {}
    for row in baseline.iter_rows(named=True):
        y = int(row["years"])
        gdp_growth_lookup[y] = float(row["nominal_gdp_growth_percent"])
        inflation_lookup[y] = float(row["gdp_deflator_growth_percent"])

    # Compute base IGD at anchor year (needed for IGD mode)
    anchor_gdp_growth = gdp_growth_lookup[weo_max_year]
    base_igd = (
        (base_nominal_rate / 100 - anchor_gdp_growth / 100)
        / (1 + anchor_gdp_growth / 100)
        * 100
    )

    # Build output arrays
    years_out = list(range(YEAR_START, YEAR_END + 1))
    nominal_rate_out: list[float] = []
    inflation_out: list[float] = []
    gdp_growth_out: list[float] = []

    for year in years_out:
        inflation_out.append(inflation_lookup[year])
        gdp_growth_out.append(gdp_growth_lookup[year])

        if year <= weo_max_year:
            # Historical period: use macrofiscal values
            if year not in hist_rate:
                raise MissingYearError(year, "interest_rate_percent")
            nominal_rate_out.append(hist_rate[year])
        else:
            # Projection period: depends on mode
            if select_rate == "Nominal interest rate":
                nominal_rate_out.append(base_nominal_rate)
            elif select_rate == "Interest-growth differential":
                # Uses previous year's GDP growth (t-1 lag)
                prev_gdp_growth = gdp_growth_lookup[year - 1]
                rate = (1 + prev_gdp_growth / 100) * (1 + base_igd / 100) * 100 - 100
                nominal_rate_out.append(rate)
            elif select_rate == "Real interest rate":
                # Uses previous year's inflation (t-1 lag)
                prev_inflation = inflation_lookup[year - 1]
                rate = (1 + long_run_interest_rate / 100) * (
                    1 + prev_inflation / 100
                ) * 100 - 100
                nominal_rate_out.append(rate)
            else:
                msg = f"Unknown select_rate: {select_rate!r}"
                raise ValueError(msg)

    # Derive real interest rate and interest-growth differential (no lag)
    real_rate_out: list[float] = []
    igd_out: list[float] = []

    for i in range(len(years_out)):
        nom = nominal_rate_out[i]
        infl = inflation_out[i]
        gdp_g = gdp_growth_out[i]

        # Fisher equation
        real_rate = (nom / 100 - infl / 100) / (1 + infl / 100) * 100
        real_rate_out.append(real_rate)

        # Interest-growth differential
        igd = (nom / 100 - gdp_g / 100) / (1 + gdp_g / 100) * 100
        igd_out.append(igd)

    return pl.DataFrame(
        {
            "iso3c": [iso3c] * len(years_out),
            "country": [country_name] * len(years_out),
            "years": years_out,
            "nominal_interest_rate": nominal_rate_out,
            "inflation": inflation_out,
            "nominal_gdp_growth_percent": gdp_growth_out,
            "real_interest_rate": real_rate_out,
            "interest_growth_differential": igd_out,
        }
    )
