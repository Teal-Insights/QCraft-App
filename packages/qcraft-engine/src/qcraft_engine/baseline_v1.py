"""Baseline V1 module — core GDP projection engine.

Computes employment growth, labour productivity (with WEO overlap back-calculation),
and recursive real/nominal GDP projections from 2009 through 2099. This is the
macroeconomic foundation consumed by the fiscal module (baseline_country).
"""

import polars as pl

YEAR_START = 2009
YEAR_END = 2099


def baseline_v1(
    data_demography: pl.DataFrame,
    data_inflation: pl.DataFrame,
    data_productivity: pl.DataFrame,
    macrofiscal: pl.DataFrame,
    iso3c: str,
) -> pl.DataFrame:
    """Compute baseline GDP projections for a single country.

    Args:
        data_demography: Output of demography_country(). Must have columns:
            years, working_age_population, total_population, iso3c, country.
        data_inflation: Output of inflation_country(). Must have columns:
            years, inflation.
        data_productivity: Output of productivity_country(). Must have columns:
            years, productivity_growth_rate_percent.
        macrofiscal: WEO-period macrofiscal data. Must have columns:
            iso3c, years, real_gdp, nominal_gdp, real_gdp_growth_percent,
            nominal_gdp_growth_percent, gdp_deflator_growth_percent.
        iso3c: 3-letter ISO country code (e.g. "UGA").

    Returns:
        DataFrame with columns: iso3c, country, years, working_age_population,
        employment_growth, labour_productivity_growth, gdp_deflator_growth_percent,
        real_gdp, real_gdp_growth_percent, nominal_gdp, nominal_gdp_growth_percent,
        population_growth. Years 2009-2099 (91 rows).
    """
    # Determine WEO_MAX_YEAR from macrofiscal data
    macro_country = macrofiscal.filter(pl.col("iso3c") == iso3c).sort("years")
    weo_max_year = int(macro_country["years"].max())  # type: ignore[arg-type]

    # Key boundaries
    overlap_start = weo_max_year - 6  # productivity back-calculation starts here
    emp_wap_start = weo_max_year - 7  # employment switches to WAP growth here

    # Get country name
    country_name: str = data_demography.filter(pl.col("iso3c") == iso3c)["country"][0]

    # Build lookups from inputs
    wap_lookup: dict[int, float] = {}
    total_pop_lookup: dict[int, float] = {}
    for row in data_demography.sort("years").iter_rows(named=True):
        y = int(row["years"])
        wap_lookup[y] = float(row["working_age_population"])
        total_pop_lookup[y] = float(row["total_population"])

    inflation_lookup: dict[int, float] = {}
    for row in (
        data_inflation.filter(pl.col("years").is_between(YEAR_START, YEAR_END))
        .sort("years")
        .iter_rows(named=True)
    ):
        inflation_lookup[int(row["years"])] = float(row["inflation"])

    prod_lookup: dict[int, float] = {}
    for row in (
        data_productivity.filter(pl.col("years").is_between(YEAR_START, YEAR_END))
        .sort("years")
        .iter_rows(named=True)
    ):
        prod_lookup[int(row["years"])] = float(row["productivity_growth_rate_percent"])

    macro_lookup: dict[int, dict[str, float]] = {}
    for row in macro_country.iter_rows(named=True):
        y = int(row["years"])
        macro_lookup[y] = {
            "real_gdp": float(row["real_gdp"]),
            "nominal_gdp": float(row["nominal_gdp"]),
            "real_gdp_growth_percent": float(row["real_gdp_growth_percent"]),
            "nominal_gdp_growth_percent": float(row["nominal_gdp_growth_percent"]),
            "gdp_deflator_growth_percent": float(row["gdp_deflator_growth_percent"]),
        }

    # Output lists
    years_out: list[int] = list(range(YEAR_START, YEAR_END + 1))
    wap_out: list[float] = []
    emp_growth_out: list[float] = []
    prod_growth_out: list[float] = []
    deflator_growth_out: list[float] = []
    real_gdp_out: list[float] = []
    real_gdp_growth_out: list[float] = []
    nominal_gdp_out: list[float] = []
    nominal_gdp_growth_out: list[float] = []
    pop_growth_out: list[float] = []

    for i, year in enumerate(years_out):
        wap = wap_lookup[year]
        wap_out.append(wap)
        prev_year = year - 1

        # --- Population growth from total population ---
        if prev_year in total_pop_lookup and year in total_pop_lookup:
            pop_growth = (
                total_pop_lookup[year] / total_pop_lookup[prev_year]
            ) * 100 - 100
        else:
            pop_growth = 0.0
        pop_growth_out.append(pop_growth)

        if year <= weo_max_year:
            # === WEO period: GDP levels/growth from macrofiscal ===
            m = macro_lookup[year]
            real_gdp_out.append(m["real_gdp"])
            nominal_gdp_out.append(m["nominal_gdp"])
            real_gdp_growth_out.append(m["real_gdp_growth_percent"])
            nominal_gdp_growth_out.append(m["nominal_gdp_growth_percent"])
            deflator_growth_out.append(m["gdp_deflator_growth_percent"])

            if year >= emp_wap_start:
                # Employment = WAP growth (for overlap and transition years)
                if prev_year in wap_lookup:
                    emp_growth = (wap / wap_lookup[prev_year]) * 100 - 100
                else:
                    emp_growth = 0.0

                if year >= overlap_start:
                    # Productivity = back-calculated residual
                    rgdp_g = m["real_gdp_growth_percent"]
                    prod_growth = (
                        (rgdp_g / 100 - emp_growth / 100) / (1 + emp_growth / 100) * 100
                    )
                else:
                    # Transition year: productivity from productivity module
                    prod_growth = prod_lookup[year]
            else:
                # Early WEO: productivity from module, employment = residual
                prod_growth = prod_lookup[year]
                rgdp_g = m["real_gdp_growth_percent"]
                emp_growth = (
                    (rgdp_g / 100 - prod_growth / 100) / (1 + prod_growth / 100) * 100
                )

            emp_growth_out.append(emp_growth)
            prod_growth_out.append(prod_growth)

        else:
            # === Post-WEO: projection period ===
            # Employment = WAP growth
            if prev_year in wap_lookup:
                emp_growth = (wap / wap_lookup[prev_year]) * 100 - 100
            else:
                emp_growth = 0.0
            emp_growth_out.append(emp_growth)

            # Productivity from logistic convergence (productivity module)
            prod_growth = prod_lookup[year]
            prod_growth_out.append(prod_growth)

            # GDP deflator growth = inflation from the inflation module
            deflator_g = inflation_lookup[year]
            deflator_growth_out.append(deflator_g)

            # Recursive GDP computation (for-loop per domain rule #1)
            prev_real_gdp = real_gdp_out[i - 1]
            real_gdp = prev_real_gdp * (1 + emp_growth / 100) * (1 + prod_growth / 100)
            real_gdp_out.append(real_gdp)

            real_gdp_g = (real_gdp / prev_real_gdp) * 100 - 100
            real_gdp_growth_out.append(real_gdp_g)

            prev_nominal_gdp = nominal_gdp_out[i - 1]
            nominal_gdp = (
                prev_nominal_gdp * (1 + real_gdp_g / 100) * (1 + deflator_g / 100)
            )
            nominal_gdp_out.append(nominal_gdp)

            nominal_gdp_g = (nominal_gdp / prev_nominal_gdp) * 100 - 100
            nominal_gdp_growth_out.append(nominal_gdp_g)

    return pl.DataFrame(
        {
            "iso3c": [iso3c] * len(years_out),
            "country": [country_name] * len(years_out),
            "years": years_out,
            "working_age_population": wap_out,
            "employment_growth": emp_growth_out,
            "labour_productivity_growth": prod_growth_out,
            "gdp_deflator_growth_percent": deflator_growth_out,
            "real_gdp": real_gdp_out,
            "real_gdp_growth_percent": real_gdp_growth_out,
            "nominal_gdp": nominal_gdp_out,
            "nominal_gdp_growth_percent": nominal_gdp_growth_out,
            "population_growth": pop_growth_out,
        }
    )
