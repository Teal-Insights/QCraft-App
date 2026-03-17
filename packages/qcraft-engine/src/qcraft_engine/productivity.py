"""Productivity module — labor productivity growth with logistic convergence.

Computes a long-run trajectory of labor productivity growth (GDP per employed
person) from 2009 to 2099. Historical growth comes from WDI data, WEO-period
years use productivity_start as a placeholder (overwritten by baseline_v1),
and projection years use a logistic convergence function.

Also computes cumulative productivity level and productivity relative to OECD.
"""

import math

import polars as pl

YEAR_START = 2009
YEAR_END = 2099
LOGISTIC_RATE = 0.5
LOGISTIC_TURNING_POINT = 15
OECD_ISO3C = "OED"


def _logistic_growth(
    counter: int,
    start: float,
    end: float,
    rate: float = LOGISTIC_RATE,
    turning_point: int = LOGISTIC_TURNING_POINT,
) -> float:
    """Compute productivity growth using the asymmetric logistic convergence.

    growth = start + (end - start) * (1 / (1 + exp(-rate * (counter - tp))))^rate
    """
    sigmoid = 1.0 / (1.0 + math.exp(-rate * (counter - turning_point)))
    return start + (end - start) * (sigmoid**rate)


def productivity_country(
    productivity_data: pl.DataFrame,
    iso3c: str,
    productivity_start: float = 5.0,
    productivity_end: float = 1.2,
    weo_max_year: int = 2029,
    oecd_growth_rate: float = 1.1,
) -> pl.DataFrame:
    """Compute productivity outputs for a single country.

    Args:
        productivity_data: DataFrame with columns iso3c, years, productivity_level.
            Must include historical WDI data for the target country (through 2021)
            and optionally OECD data (iso3c="OED") for relative-level computation.
        iso3c: 3-letter ISO country code (e.g. "UGA").
        productivity_start: Starting growth rate (%) for logistic convergence.
        productivity_end: Long-run convergence target growth rate (%).
        weo_max_year: Last year of WEO/macrofiscal data (typically 2029).
        oecd_growth_rate: Annual OECD productivity growth rate (%) for projection.

    Returns:
        DataFrame with columns: years, productivity_growth_rate_percent,
        productivity_level, productivity_level_oecd_percent.
        Years 2009-2099 (91 rows).
    """
    # --- Extract country historical data ---
    country_data = (
        productivity_data.filter(pl.col("iso3c") == iso3c)
        .sort("years")
        .select("years", "productivity_level")
    )
    if country_data.is_empty():
        msg = f"No data found for iso3c='{iso3c}' in productivity_data"
        raise ValueError(msg)
    last_wdi_year = int(country_data["years"].max())  # type: ignore[arg-type]

    # Build lists for all years 2009-2099
    years_list: list[int] = list(range(YEAR_START, YEAR_END + 1))
    growth_list: list[float] = []
    level_list: list[float] = []

    # Historical levels lookup (includes pre-2009 for growth calc)
    hist_levels: dict[int, float] = {}
    for row in country_data.iter_rows(named=True):
        hist_levels[int(row["years"])] = float(row["productivity_level"])

    # --- Compute growth rates and levels for each year ---
    for year in years_list:
        if year <= last_wdi_year and year in hist_levels:
            # Historical: growth from consecutive levels
            level = hist_levels[year]
            if (year - 1) in hist_levels:
                growth = (level / hist_levels[year - 1]) * 100 - 100
            else:
                growth = 0.0  # No prior year available
            growth_list.append(growth)
            level_list.append(level)
        elif year <= weo_max_year:
            # WEO placeholder: use productivity_start
            growth = productivity_start
            prev_level = level_list[-1] if level_list else hist_levels[last_wdi_year]
            level = prev_level * (1 + growth / 100)
            growth_list.append(growth)
            level_list.append(level)
        else:
            # Projection: logistic convergence
            counter = year - weo_max_year
            growth = _logistic_growth(counter, productivity_start, productivity_end)
            prev_level = level_list[-1]
            level = prev_level * (1 + growth / 100)
            growth_list.append(growth)
            level_list.append(level)

    # --- OECD relative level ---
    oecd_data = (
        productivity_data.filter(pl.col("iso3c") == OECD_ISO3C)
        .sort("years")
        .select("years", "productivity_level")
    )

    # Build OECD levels for all output years
    oecd_hist: dict[int, float] = {}
    for row in oecd_data.iter_rows(named=True):
        oecd_hist[int(row["years"])] = float(row["productivity_level"])

    oecd_levels: list[float] = []

    for year in years_list:
        if year in oecd_hist:
            oecd_levels.append(oecd_hist[year])
        elif oecd_levels:
            # Project from last known OECD level
            prev_oecd = oecd_levels[-1]
            oecd_levels.append(prev_oecd * (1 + oecd_growth_rate / 100))
        else:
            oecd_levels.append(1.0)  # fallback

    oecd_pct_list = [
        (lvl / oecd * 100) if oecd > 0 else 0.0
        for lvl, oecd in zip(level_list, oecd_levels)
    ]

    return pl.DataFrame(
        {
            "years": years_list,
            "productivity_growth_rate_percent": growth_list,
            "productivity_level": level_list,
            "productivity_level_oecd_percent": oecd_pct_list,
        }
    )
