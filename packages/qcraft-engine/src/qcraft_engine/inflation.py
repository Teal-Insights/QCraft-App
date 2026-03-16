"""Inflation module — GDP deflator growth with logistic convergence.

Projects the GDP deflator growth rate from the historical period through 2099.
Historical values are derived from macrofiscal deflator data; projection years
use logistic convergence toward a user-specified long-run inflation target.
"""

import polars as pl

from qcraft_engine.productivity import _logistic_growth

YEAR_START = 2009
YEAR_END = 2099
LOGISTIC_RATE = 0.5
LOGISTIC_TURNING_POINT = 5


def inflation_country(
    macrofiscal_deflator: pl.DataFrame,
    iso3c: str,
    inflation_start: float = 3.5,
    inflation_end: float = 3.5,
) -> pl.DataFrame:
    """Compute inflation (GDP deflator growth) for a single country.

    Args:
        macrofiscal_deflator: DataFrame with columns iso3c, country, years,
            gdp_deflator. The deflator is an index (e.g. base 2015=100).
        iso3c: 3-letter ISO country code (e.g. "UGA").
        inflation_start: Starting inflation rate (%) for logistic convergence.
        inflation_end: Long-run inflation target (%).

    Returns:
        DataFrame with columns: iso3c, country, years, inflation.
        Years 2009-2099 (91 rows).
    """
    # Filter and sort country deflator data
    country = macrofiscal_deflator.filter(pl.col("iso3c") == iso3c).sort("years")
    country_name: str = country["country"][0]

    # Build deflator lookup for historical inflation computation
    deflator: dict[int, float] = {}
    for row in country.iter_rows(named=True):
        deflator[int(row["years"])] = float(row["gdp_deflator"])

    # WEO_MAX_YEAR = last year we can compute deflator growth
    # (need t and t-1 in the deflator index)
    max_deflator_year = max(deflator.keys())
    weo_max_year = max_deflator_year  # last year with macrofiscal-derived inflation

    years_list: list[int] = list(range(YEAR_START, YEAR_END + 1))
    inflation_list: list[float] = []

    for year in years_list:
        if year <= weo_max_year and year in deflator and (year - 1) in deflator:
            # Historical: deflator growth rate
            infl = (deflator[year] / deflator[year - 1]) * 100 - 100
            inflation_list.append(infl)
        else:
            # Projection: logistic convergence
            counter = year - weo_max_year
            infl = _logistic_growth(
                counter,
                inflation_start,
                inflation_end,
                rate=LOGISTIC_RATE,
                turning_point=LOGISTIC_TURNING_POINT,
            )
            inflation_list.append(infl)

    return pl.DataFrame(
        {
            "iso3c": [iso3c] * len(years_list),
            "country": [country_name] * len(years_list),
            "years": years_list,
            "inflation": inflation_list,
        }
    )
