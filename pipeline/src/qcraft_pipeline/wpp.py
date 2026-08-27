"""UN WPP 2024 -> demography.parquet.

Reproduces the workbook's Demography sheet: 1 July population in thousands for
three age groups and three projection variants, 1950-2100.
"""

from pathlib import Path

import polars as pl

from qcraft_pipeline import config

_COLUMNS = [
    "ISO3_code",
    "LocTypeName",
    "Location",
    "Variant",
    "Time",
    "AgeGrpStart",
    "PopTotal",
]
_DTYPES = {
    "ISO3_code": pl.String,
    "LocTypeName": pl.String,
    "Location": pl.String,
    "Variant": pl.String,
    "Time": pl.Int64,
    "AgeGrpStart": pl.Int64,
    "PopTotal": pl.Float64,
}


def _read(path: Path, variants: list[str]) -> pl.DataFrame:
    return pl.read_csv(path, columns=_COLUMNS, schema_overrides=_DTYPES).filter(
        (pl.col("LocTypeName") == config.WPP_LOCATION_TYPE)
        & pl.col("Variant").is_in(variants)
        & pl.col("ISO3_code").is_not_null()
        & (pl.col("ISO3_code") != "")
        & pl.col("Time").is_between(
            config.DEMOGRAPHY_YEAR_MIN, config.DEMOGRAPHY_YEAR_MAX
        )
    )


def _collapse_age_groups(df: pl.DataFrame) -> pl.DataFrame:
    """Sum 5-year age bands into 15-64, 65+ and Total, then go long."""
    grouped = df.group_by("ISO3_code", "Location", "Variant", "Time").agg(
        pl.col("PopTotal").sum().alias("Total"),
        pl.col("PopTotal")
        .filter(pl.col("AgeGrpStart").is_between(15, 60))
        .sum()
        .alias("15-64"),
        pl.col("PopTotal").filter(pl.col("AgeGrpStart") >= 65).sum().alias("65+"),
    )
    return grouped.unpivot(
        index=["ISO3_code", "Location", "Variant", "Time"],
        on=["15-64", "65+", "Total"],
        variable_name="age_group",
        value_name="values",
    )


def build_demography(
    medium_path: Path,
    variants_path: Path,
    base_names: dict[str, str],
) -> pl.DataFrame:
    """Build the demography table for the new vintage.

    Args:
        medium_path: WPP2024 Medium-variant 5-year-age-group CSV (gzipped).
        variants_path: WPP2024 other-variants CSV (gzipped); High and Low are read
            from it and everything else discarded.
        base_names: iso3c -> country name from the base vintage, preferred over the
            WPP location label so country names stay stable across vintages.

    The High and Low files only cover the projection period (2024 onward) because
    the variants are identical to Medium over the estimation period. The engine
    reads a single variant across 2009-2099 and would KeyError on the gap, so the
    pre-fork years are backfilled from Medium — which is what the IMF workbook
    shipped and is what the variants mean.
    """
    medium = _collapse_age_groups(_read(medium_path, ["Medium"]))
    wanted = [v for v in config.WPP_VARIANTS if v != "Medium"]
    variants = _collapse_age_groups(_read(variants_path, wanted))

    fork_year = int(variants["Time"].min())  # type: ignore[arg-type]
    history = medium.filter(pl.col("Time") < fork_year)
    backfill = [
        history.with_columns(pl.lit(variant).alias("Variant")) for variant in wanted
    ]

    df = pl.concat([medium, variants, *backfill])

    df = df.rename(
        {"ISO3_code": "iso3c", "Time": "years", "Variant": "status"}
    ).with_columns(
        pl.col("iso3c")
        .replace_strict(base_names, default=None)
        .fill_null(pl.col("Location"))
        .alias("country")
    )

    return df.select("iso3c", "country", "years", "age_group", "status", "values").sort(
        "iso3c", "years", "age_group", "status"
    )
