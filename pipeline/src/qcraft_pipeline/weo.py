"""IMF WEO (SDMX) -> macrofiscal.parquet.

Reproduces, from the API, exactly what scripts/extract_excel_data.py produced from
the Q-CRAFT workbook's Macrofiscal sheet: the same eight WEO series plus the same
derived columns, in the same order and units.
"""

import json
from pathlib import Path

import polars as pl

from qcraft_pipeline import config


def _country_names(codelist_path: Path) -> dict[str, str]:
    """iso3 -> country name from the IMF CL_COUNTRY codelist."""
    payload = json.loads(codelist_path.read_text())
    codes = payload["data"]["codelists"][0]["codes"]
    return {c["id"]: c["name"] for c in codes if c.get("name")}


def _long_to_wide(raw_csv: Path, year_max: int | None = None) -> pl.DataFrame:
    """SDMX long format -> one row per (iso3c, years), one column per indicator."""
    df = (
        pl.read_csv(
            raw_csv,
            infer_schema_length=0,
            columns=["COUNTRY", "INDICATOR", "TIME_PERIOD", "OBS_VALUE"],
        )
        .filter(~pl.col("COUNTRY").is_in(list(config.WEO_DROP_CODES)))
        .with_columns(
            pl.col("COUNTRY").replace(config.WEO_CODE_TO_ISO3).alias("iso3c"),
            pl.col("TIME_PERIOD").cast(pl.Int64).alias("years"),
            pl.col("OBS_VALUE").cast(pl.Float64, strict=False).alias("value"),
        )
        .filter(
            pl.col("years").is_between(
                config.MACROFISCAL_YEAR_MIN - 1,
                year_max if year_max is not None else config.MACROFISCAL_YEAR_MAX,
            )
        )
    )

    # National-currency levels arrive in units; the engine expects billions.
    df = df.with_columns(
        pl.when(pl.col("INDICATOR").is_in(list(config.WEO_INDEX_INDICATORS)))
        .then(pl.col("value"))
        .otherwise(pl.col("value") / config.WEO_UNIT_DIVISOR)
        .alias("value")
    )

    wide = df.pivot(index=["iso3c", "years"], on="INDICATOR", values="value")

    # A country missing an entire series still needs the column, filled with nulls.
    missing = [i for i in config.WEO_INDICATORS if i not in wide.columns]
    if missing:
        wide = wide.with_columns(
            [pl.lit(None, dtype=pl.Float64).alias(i) for i in missing]
        )

    return wide.rename(dict(config.WEO_INDICATORS)).sort("iso3c", "years")


def _add_derived_columns(df: pl.DataFrame) -> pl.DataFrame:
    """The derived block, in the same order as the workbook extractor."""
    df = df.with_columns(
        (
            pl.col("real_gdp") / pl.col("real_gdp").shift(1).over("iso3c") * 100 - 100
        ).alias("real_gdp_growth_percent"),
        (
            pl.col("nominal_gdp") / pl.col("nominal_gdp").shift(1).over("iso3c") * 100
            - 100
        ).alias("nominal_gdp_growth_percent"),
        (
            pl.col("gdp_deflator") / pl.col("gdp_deflator").shift(1).over("iso3c") * 100
            - 100
        ).alias("gdp_deflator_growth_percent"),
        (pl.col("revenue") - pl.col("primary_balance")).alias("primary_expenditure"),
        (pl.col("expenditure") - (pl.col("revenue") - pl.col("primary_balance"))).alias(
            "interest_expenditure"
        ),
        pl.col("expenditure").alias("total_expenditure"),
    )

    df = df.with_columns(
        (pl.col("revenue") / pl.col("nominal_gdp") * 100).alias("revenue_percent_gdp"),
        (pl.col("primary_expenditure") / pl.col("nominal_gdp") * 100).alias(
            "primary_expenditure_percent_gdp"
        ),
        (pl.col("primary_balance") / pl.col("nominal_gdp") * 100).alias(
            "primary_balance_percent_gdp"
        ),
        (pl.col("overall_balance") / pl.col("nominal_gdp") * 100).alias(
            "overall_balance_percent_gdp"
        ),
        (pl.col("interest_expenditure") / pl.col("nominal_gdp") * 100).alias(
            "interest_expenditure_percent_gdp"
        ),
        (pl.col("debt") / pl.col("nominal_gdp") * 100).alias("debt_to_gdp"),
    )

    # Same-year debt in the denominator, matching the workbook. Not a typo — see
    # DATA-NOTES.md section 5(b).
    return df.with_columns(
        (pl.col("interest_expenditure") / pl.col("debt") * 100).alias(
            "interest_rate_percent"
        ),
    )


def build_macrofiscal(
    raw_csv: Path,
    codelist_path: Path,
    base_names: dict[str, str],
    *,
    year_max: int | None = None,
) -> pl.DataFrame:
    """Build the macrofiscal table for the new vintage.

    Args:
        raw_csv: SDMX CSV from fetch.fetch_all()["weo"].
        codelist_path: IMF CL_COUNTRY JSON.
        base_names: iso3c -> country name from the base vintage. Preferred over the
            codelist so the app's country dropdown labels do not churn between
            vintages; the codelist only fills in codes the base vintage lacked.
    """
    wide = _long_to_wide(raw_csv, year_max)
    df = _add_derived_columns(wide)

    # Growth needs year_min - 1 as a lag source; drop it once growth is computed.
    df = df.filter(pl.col("years") >= config.MACROFISCAL_YEAR_MIN)

    codelist_names = _country_names(codelist_path)
    names = {
        iso: base_names.get(iso) or codelist_names.get(iso) or iso
        for iso in df["iso3c"].unique().to_list()
    }
    df = df.with_columns(pl.col("iso3c").replace_strict(names).alias("country"))

    ordered = [
        "iso3c",
        "years",
        *config.WEO_INDICATORS.values(),
        "real_gdp_growth_percent",
        "nominal_gdp_growth_percent",
        "gdp_deflator_growth_percent",
        "primary_expenditure",
        "interest_expenditure",
        "total_expenditure",
        "revenue_percent_gdp",
        "primary_expenditure_percent_gdp",
        "primary_balance_percent_gdp",
        "overall_balance_percent_gdp",
        "interest_expenditure_percent_gdp",
        "debt_to_gdp",
        "interest_rate_percent",
        "country",
    ]
    return df.select(ordered).sort("iso3c", "years")
