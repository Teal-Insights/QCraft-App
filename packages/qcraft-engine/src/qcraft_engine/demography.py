"""Demography module — population projections from UN WPP data.

Extracts working-age (15-64) and total population for a country and
demographic variant, then computes year-over-year growth rates. This is
pure data lookup — no logistic convergence or projection formulas.
"""

import polars as pl

YEAR_START = 2009


def demography_country(
    demography_data: pl.DataFrame,
    iso3c: str,
    level: str,
) -> pl.DataFrame:
    """Compute demography outputs for a single country and variant.

    Args:
        demography_data: Long-format DataFrame with columns:
            iso3c, country, years, age_group, status, values.
            age_group includes "15-64" (working age) and "Total".
            values are population in thousands.
        iso3c: 3-letter ISO country code (e.g. "UGA").
        level: Demographic variant — "Medium", "High", or "Low".

    Returns:
        DataFrame with columns: years, working_age_population,
        total_population, demography_growth_working_age,
        demography_growth_total, iso3c, country.
        Years 2009-2099 (91 rows). Growth rates are null for year 2009.
    """
    # Filter for country, variant, and relevant age groups
    filtered = demography_data.filter(
        (pl.col("iso3c") == iso3c)
        & (pl.col("status") == level)
        & (pl.col("years") >= YEAR_START)
        & (pl.col("age_group").is_in(["15-64", "Total"]))
    )

    # Get country name from data
    country_name = filtered["country"][0]

    # Pivot age groups to columns
    pivoted = (
        filtered.pivot(
            on="age_group",
            index="years",
            values="values",
        )
        .sort("years")
        .rename({"15-64": "working_age_population", "Total": "total_population"})
    )

    # Compute YoY growth rates: (pop(t) / pop(t-1)) * 100 - 100
    result = pivoted.with_columns(
        (
            pl.col("working_age_population")
            / pl.col("working_age_population").shift(1)
            * 100
            - 100
        ).alias("demography_growth_working_age"),
        (
            pl.col("total_population") / pl.col("total_population").shift(1) * 100 - 100
        ).alias("demography_growth_total"),
    )

    # Add metadata columns for downstream consumers
    result = result.with_columns(
        pl.lit(iso3c).alias("iso3c"),
        pl.lit(country_name).alias("country"),
    )

    # Return with columns in expected order
    return result.select(
        "years",
        "working_age_population",
        "total_population",
        "demography_growth_working_age",
        "demography_growth_total",
        "iso3c",
        "country",
    )
