"""Climate scenario module (calc_climate_scenario).

Recomputes fiscal projections under climate-adjusted productivity growth.
Called once per scenario (6 times total). Uses explicit Python for-loops
for recursive GDP and debt dynamics (domain rule #1).

Key domain rules:
- NO debt floor: climate scenarios can produce negative debt-to-GDP (rule #3)
- Employment growth unchanged from baseline
- Interest rate and inflation unchanged from baseline
- No fiscal rule applied within climate scenarios
- Expenditure rigidity 1.0 = sticky (worst case), 0.0 = flexible (rule #4)
"""

import polars as pl

YEAR_START = 2009
YEAR_END = 2099


def calc_climate_scenario(
    data_baseline: pl.DataFrame,
    data_baseline_v1: pl.DataFrame,
    data_interest: pl.DataFrame,
    climate_variation: pl.DataFrame,
    expenditure_rigidity: float = 1.0,
    data_risk: pl.DataFrame | None = None,
) -> pl.DataFrame:
    """Compute climate-adjusted fiscal projections for one scenario.

    Args:
        data_baseline: Output of baseline_country() (fiscal module). Columns:
            years, revenue, revenue_percent_gdp, primary_expenditure,
            primary_expenditure_percent_gdp, debt_to_gdp, debt, etc.
        data_baseline_v1: Output of baseline_v1(). Columns:
            years, employment_growth, labour_productivity_growth,
            gdp_deflator_growth_percent, nominal_gdp, real_gdp,
            nominal_gdp_growth_percent.
        data_interest: Output of interest_rate_country(). Columns:
            years, nominal_interest_rate.
        climate_variation: DataFrame with columns: years, climate_variation.
            The year-over-year productivity growth shock. Zero for years
            <= WEO_MAX_YEAR, nonzero from climate impact start year.
        expenditure_rigidity: 0.0 (flexible) to 1.0 (sticky, default).
        data_risk: Optional discrete risks DataFrame. If provided, must have
            columns: years, revenue_risk, expenditure_risk (% GDP).

    Returns:
        DataFrame with 21 columns, years 2009-2099 (91 rows).
    """
    # Sort all inputs
    bv1 = data_baseline_v1.filter(
        pl.col("years").is_between(YEAR_START, YEAR_END)
    ).sort("years")
    fiscal = data_baseline.filter(
        pl.col("years").is_between(YEAR_START, YEAR_END)
    ).sort("years")
    interest = data_interest.filter(
        pl.col("years").is_between(YEAR_START, YEAR_END)
    ).sort("years")
    cv = climate_variation.sort("years")

    # Determine WEO_MAX_YEAR: last year where climate_variation is 0
    # (climate impacts start at WEO_MAX_YEAR + 1)
    cv_years = cv["years"].to_list()
    cv_vals = cv["climate_variation"].to_list()

    # Find WEO_MAX_YEAR from the data: the year before first nonzero variation
    weo_max_year = YEAR_START
    for y, v in zip(cv_years, cv_vals):
        if v != 0.0:
            weo_max_year = y - 1
            break
    else:
        # All zeros — no climate impact. Use last year before projection.
        weo_max_year = 2029

    # Build lookups from baseline_v1
    bv1_lookup: dict[int, dict[str, float]] = {}
    for row in bv1.iter_rows(named=True):
        y = int(row["years"])
        bv1_lookup[y] = {
            "employment_growth": float(row["employment_growth"]),
            "labour_productivity_growth": float(row["labour_productivity_growth"]),
            "gdp_deflator_growth_percent": float(row["gdp_deflator_growth_percent"]),
            "nominal_gdp": float(row["nominal_gdp"]),
            "real_gdp": float(row["real_gdp"]),
            "nominal_gdp_growth_percent": float(row["nominal_gdp_growth_percent"]),
        }

    # Build lookup from fiscal (baseline_country output)
    fiscal_lookup: dict[int, dict[str, float]] = {}
    for row in fiscal.iter_rows(named=True):
        y = int(row["years"])
        fiscal_lookup[y] = {
            "revenue": float(row["revenue"]),
            "revenue_percent_gdp": float(row["revenue_percent_gdp"]),
            "primary_expenditure": float(row["primary_expenditure"]),
            "primary_expenditure_percent_gdp": float(
                row["primary_expenditure_percent_gdp"]
            ),
            "primary_balance": float(row["primary_balance"]),
            "primary_balance_percent_gdp": float(row["primary_balance_percent_gdp"]),
            "interest_expenditure": float(row["interest_expenditure"]),
            "interest_expenditure_percent_gdp": float(
                row["interest_expenditure_percent_gdp"]
            ),
            "total_expenditure": float(row["total_expenditure"]),
            "overall_balance": float(row["overall_balance"]),
            "overall_balance_percent_gdp": float(row["overall_balance_percent_gdp"]),
            "debt_to_gdp": float(row["debt_to_gdp"]),
            "debt": float(row["debt"]),
        }

    # Build lookup from interest rate
    interest_lookup: dict[int, float] = {}
    for row in interest.iter_rows(named=True):
        interest_lookup[int(row["years"])] = float(row["nominal_interest_rate"])

    # Build climate variation lookup
    cv_lookup: dict[int, float] = {}
    for y, v in zip(cv_years, cv_vals):
        cv_lookup[int(y)] = float(v)

    # Build discrete risk lookups
    risk_rev_lookup: dict[int, float] = {}
    risk_exp_lookup: dict[int, float] = {}
    if data_risk is not None:
        for row in data_risk.iter_rows(named=True):
            y = int(row["years"])
            risk_rev_lookup[y] = float(row["revenue_risk"])
            risk_exp_lookup[y] = float(row["expenditure_risk"])

    # Output arrays
    years_out = list(range(YEAR_START, YEAR_END + 1))
    n = len(years_out)

    # GDP arrays
    labour_prod_growth = [0.0] * n
    real_gdp_growth = [0.0] * n
    nominal_gdp_growth = [0.0] * n
    nominal_gdp = [0.0] * n
    real_gdp = [0.0] * n
    employment_growth = [0.0] * n

    # Fiscal arrays
    revenue = [0.0] * n
    revenue_pct = [0.0] * n
    primary_exp = [0.0] * n
    primary_exp_pct = [0.0] * n
    primary_bal = [0.0] * n
    primary_bal_pct = [0.0] * n
    interest_exp = [0.0] * n
    interest_exp_pct = [0.0] * n
    total_exp = [0.0] * n
    overall_bal = [0.0] * n
    overall_bal_pct = [0.0] * n
    debt_to_gdp = [0.0] * n
    debt = [0.0] * n
    dspb: list[float | None] = [None] * n

    # Phase 1-2: Fill WEO period (years <= WEO_MAX_YEAR) from baseline
    for i, year in enumerate(years_out):
        if year > weo_max_year:
            break

        bv = bv1_lookup[year]
        fl = fiscal_lookup[year]

        # GDP columns from baseline_v1
        labour_prod_growth[i] = bv["labour_productivity_growth"]
        real_gdp_growth[i] = float(
            bv1.filter(pl.col("years") == year)["real_gdp_growth_percent"][0]
        )
        nominal_gdp_growth[i] = bv["nominal_gdp_growth_percent"]
        nominal_gdp[i] = bv["nominal_gdp"]
        real_gdp[i] = bv["real_gdp"]
        employment_growth[i] = bv["employment_growth"]

        # Fiscal columns from baseline_country
        revenue[i] = fl["revenue"]
        revenue_pct[i] = fl["revenue_percent_gdp"]
        primary_exp[i] = fl["primary_expenditure"]
        primary_exp_pct[i] = fl["primary_expenditure_percent_gdp"]
        primary_bal[i] = fl["primary_balance"]
        primary_bal_pct[i] = fl["primary_balance_percent_gdp"]
        interest_exp[i] = fl["interest_expenditure"]
        interest_exp_pct[i] = fl["interest_expenditure_percent_gdp"]
        total_exp[i] = fl["total_expenditure"]
        overall_bal[i] = fl["overall_balance"]
        overall_bal_pct[i] = fl["overall_balance_percent_gdp"]
        debt_to_gdp[i] = fl["debt_to_gdp"]
        debt[i] = fl["debt"]

        # DSPB (from 2010 onward)
        if i > 0:
            nom_rate = interest_lookup[year]
            gdp_g = nominal_gdp_growth[i]
            dspb[i] = debt_to_gdp[i - 1] * (nom_rate - gdp_g) / 100 / (1 + gdp_g / 100)

    # Phase 2-5: Recursive computation for projection years
    for i, year in enumerate(years_out):
        if year <= weo_max_year:
            continue

        bv = bv1_lookup[year]
        fl = fiscal_lookup[year]
        nom_rate = interest_lookup[year]
        variation = cv_lookup.get(year, 0.0)
        inflation = bv["gdp_deflator_growth_percent"]

        # Phase 1: Adjust productivity
        employment_growth[i] = bv["employment_growth"]
        labour_prod_growth[i] = bv["labour_productivity_growth"] + variation

        # Phase 2: Recompute GDP (recursive)
        real_gdp_growth[i] = (1 + employment_growth[i] / 100) * (
            1 + labour_prod_growth[i] / 100
        ) * 100 - 100
        nominal_gdp_growth[i] = (1 + real_gdp_growth[i] / 100) * (
            1 + inflation / 100
        ) * 100 - 100
        real_gdp[i] = real_gdp[i - 1] * (1 + real_gdp_growth[i] / 100)
        nominal_gdp[i] = nominal_gdp[i - 1] * (1 + nominal_gdp_growth[i] / 100)

        # Phase 3: Expenditure recalibration
        baseline_pexp = fl["primary_expenditure"]
        baseline_pexp_pct = fl["primary_expenditure_percent_gdp"]
        primary_exp_with_baseline_pct = baseline_pexp_pct * nominal_gdp[i] / 100
        recalibration = baseline_pexp - primary_exp_with_baseline_pct
        primary_exp[i] = baseline_pexp - (1 - expenditure_rigidity) * recalibration

        # Phase 4: Revenue (constant ratio from baseline)
        revenue_pct[i] = fl["revenue_percent_gdp"]
        revenue[i] = revenue_pct[i] / 100 * nominal_gdp[i]

        # Apply discrete risks if provided
        if data_risk is not None:
            rev_risk = risk_rev_lookup.get(year, 0.0)
            exp_risk = risk_exp_lookup.get(year, 0.0)
            revenue[i] += rev_risk / 100 * nominal_gdp[i]
            primary_exp[i] += exp_risk / 100 * nominal_gdp[i]

        # Phase 5: Recursive fiscal (NO debt floor)
        primary_exp_pct[i] = primary_exp[i] / nominal_gdp[i] * 100
        primary_bal[i] = revenue[i] - primary_exp[i]
        primary_bal_pct[i] = primary_bal[i] / nominal_gdp[i] * 100

        # Debt dynamics — NO max(0, ...)
        debt_to_gdp[i] = (
            debt_to_gdp[i - 1]
            * (1 + nom_rate / 100)
            / (1 + nominal_gdp_growth[i] / 100)
            - primary_bal_pct[i]
        )

        # Debt level
        debt[i] = debt_to_gdp[i] / 100 * nominal_gdp[i]

        # Interest expenditure (prior-year debt * current rate)
        interest_exp[i] = debt[i - 1] * nom_rate / 100
        interest_exp_pct[i] = interest_exp[i] / nominal_gdp[i] * 100

        # Total expenditure and overall balance
        total_exp[i] = primary_exp[i] + interest_exp[i]
        overall_bal[i] = revenue[i] - total_exp[i]
        overall_bal_pct[i] = overall_bal[i] / nominal_gdp[i] * 100

        # DSPB
        dspb[i] = (
            debt_to_gdp[i - 1]
            * (nom_rate - nominal_gdp_growth[i])
            / 100
            / (1 + nominal_gdp_growth[i] / 100)
        )

    return pl.DataFrame(
        {
            "years": years_out,
            "revenue": revenue,
            "revenue_percent_gdp": revenue_pct,
            "primary_expenditure": primary_exp,
            "primary_expenditure_percent_gdp": primary_exp_pct,
            "primary_balance": primary_bal,
            "primary_balance_percent_gdp": primary_bal_pct,
            "interest_expenditure": interest_exp,
            "interest_expenditure_percent_gdp": interest_exp_pct,
            "total_expenditure": total_exp,
            "overall_balance": overall_bal,
            "overall_balance_percent_gdp": overall_bal_pct,
            "debt_to_gdp": debt_to_gdp,
            "debt": debt,
            "debt_stabilizing_primary_balance": dspb,
            "labour_productivity_growth": labour_prod_growth,
            "real_gdp_growth_percent": real_gdp_growth,
            "nominal_gdp_growth_percent": nominal_gdp_growth,
            "nominal_gdp": nominal_gdp,
            "real_gdp": real_gdp,
            "employment_growth": employment_growth,
        }
    )
