"""Fiscal projection module (baseline_country).

Computes the recursive fiscal projection: revenue, expenditure, debt dynamics,
fiscal rule feedback, and derived indicators for years 2009-2099. This is the
most complex module in Q-CRAFT — every variable depends on prior-year state.

Uses explicit Python for-loops for the recursive computation (domain rule #1).
"""

import math

import polars as pl

YEAR_START = 2009
YEAR_END = 2099


def baseline_country(
    data_baseline: pl.DataFrame,
    data_interest: pl.DataFrame,
    data_macrofiscal: pl.DataFrame,
    debt_target: float,
    fiscal_rule: str,
    iso3c: str,
) -> pl.DataFrame:
    """Compute baseline fiscal projections for a single country.

    Args:
        data_baseline: Output of baseline_v1(). Must have columns:
            years, nominal_gdp, nominal_gdp_growth_percent,
            labour_productivity_growth, gdp_deflator_growth_percent,
            population_growth.
        data_interest: Output of interest_rate_country(). Must have columns:
            years, nominal_interest_rate.
        data_macrofiscal: Historical macrofiscal data (WEO period). Must have
            columns: iso3c, years, revenue, primary_expenditure, primary_balance,
            overall_balance, debt_to_gdp, debt, interest_expenditure, nominal_gdp,
            and corresponding _percent_gdp columns.
        debt_target: Debt-to-GDP target for fiscal rule (default 60).
        fiscal_rule: "Yes" or "No".
        iso3c: 3-letter ISO country code.

    Returns:
        DataFrame with 16 columns: years, revenue, revenue_percent_gdp,
        primary_expenditure, primary_expenditure_percent_gdp, primary_balance,
        primary_balance_percent_gdp, interest_expenditure,
        interest_expenditure_percent_gdp, total_expenditure, overall_balance,
        overall_balance_percent_gdp, debt_to_gdp, debt,
        debt_stabilizing_primary_balance, fiscal_gap.
        Years 2009-2099 (91 rows).
    """
    # Determine WEO_MAX_YEAR from macrofiscal data
    macro_country = data_macrofiscal.filter(pl.col("iso3c") == iso3c).sort("years")
    weo_max_year = int(macro_country["years"].max())  # type: ignore[arg-type]

    # Build lookups from macrofiscal (WEO period)
    macro_lookup: dict[int, dict[str, float]] = {}
    for row in macro_country.iter_rows(named=True):
        y = int(row["years"])
        macro_lookup[y] = {
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
            "nominal_gdp": float(row["nominal_gdp"]),
        }

    # Build lookups from baseline_v1
    baseline = data_baseline.filter(
        pl.col("years").is_between(YEAR_START, YEAR_END)
    ).sort("years")
    nominal_gdp_lookup: dict[int, float] = {}
    nominal_gdp_growth_lookup: dict[int, float] = {}
    productivity_growth_lookup: dict[int, float] = {}
    inflation_lookup: dict[int, float] = {}
    pop_growth_lookup: dict[int, float] = {}
    for row in baseline.iter_rows(named=True):
        y = int(row["years"])
        nominal_gdp_lookup[y] = float(row["nominal_gdp"])
        nominal_gdp_growth_lookup[y] = float(row["nominal_gdp_growth_percent"])
        productivity_growth_lookup[y] = float(row["labour_productivity_growth"])
        inflation_lookup[y] = float(row["gdp_deflator_growth_percent"])
        pop_growth_lookup[y] = float(row["population_growth"])

    # Build lookup from interest rate
    interest = data_interest.filter(
        pl.col("years").is_between(YEAR_START, YEAR_END)
    ).sort("years")
    interest_rate_lookup: dict[int, float] = {}
    for row in interest.iter_rows(named=True):
        interest_rate_lookup[int(row["years"])] = float(row["nominal_interest_rate"])

    # Output arrays
    years_out = list(range(YEAR_START, YEAR_END + 1))
    n = len(years_out)

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
    fiscal_gap: list[float | None] = [None] * n
    fiscal_rule_value = [0.0] * n

    # Fill WEO period from macrofiscal
    for i, year in enumerate(years_out):
        if year > weo_max_year:
            break

        m = macro_lookup[year]
        revenue[i] = m["revenue"]
        revenue_pct[i] = m["revenue_percent_gdp"]
        primary_exp[i] = m["primary_expenditure"]
        primary_exp_pct[i] = m["primary_expenditure_percent_gdp"]
        primary_bal[i] = m["primary_balance"]
        primary_bal_pct[i] = m["primary_balance_percent_gdp"]
        interest_exp[i] = m["interest_expenditure"]
        interest_exp_pct[i] = m["interest_expenditure_percent_gdp"]
        total_exp[i] = m["total_expenditure"]
        overall_bal[i] = m["overall_balance"]
        overall_bal_pct[i] = m["overall_balance_percent_gdp"]
        debt_to_gdp[i] = m["debt_to_gdp"]
        debt[i] = m["debt"]

        # DSPB: computed from 2010 onward (needs t-1 data)
        if i > 0:
            nom_rate = interest_rate_lookup[year]
            gdp_g = nominal_gdp_growth_lookup[year]
            dspb[i] = debt_to_gdp[i - 1] * (nom_rate - gdp_g) / 100 / (1 + gdp_g / 100)

        # Fiscal gap: needs DSPB
        if dspb[i] is not None:
            ngdp = nominal_gdp_lookup[year]
            dspb_val: float = dspb[i]  # type: ignore[assignment]
            fg = (primary_bal_pct[i] - dspb_val) / 100 * ngdp
            fiscal_gap[i] = fg

            # Fiscal rule during WEO period
            if fiscal_rule == "No":
                fiscal_rule_value[i] = 0.0
            elif i > 0:
                rising = debt_to_gdp[i] > debt_to_gdp[i - 1]
                above_target = debt_to_gdp[i] > debt_target
                if (rising and above_target) or (not rising and not above_target):
                    fiscal_rule_value[i] = fg
                else:
                    fiscal_rule_value[i] = 0.0

    # Recursive projection beyond WEO
    for i, year in enumerate(years_out):
        if year <= weo_max_year:
            continue

        ngdp = nominal_gdp_lookup[year]
        ngdp_growth = nominal_gdp_growth_lookup[year]
        prod_growth = productivity_growth_lookup[year]
        infl = inflation_lookup[year]
        pop_growth = pop_growth_lookup[year]
        nom_rate = interest_rate_lookup[year]

        # Step 1: Revenue
        revenue[i] = revenue[i - 1] * (1 + ngdp_growth / 100)
        revenue_pct[i] = revenue[i] / ngdp * 100

        # Step 2: Primary expenditure (multiplicative growth + fiscal rule lag)
        primary_exp[i] = (
            primary_exp[i - 1]
            * (1 + prod_growth / 100)
            * (1 + infl / 100)
            * (1 + pop_growth / 100)
            + fiscal_rule_value[i - 1]
        )
        primary_exp_pct[i] = primary_exp[i] / ngdp * 100

        # Step 3: Primary balance
        primary_bal[i] = revenue[i] - primary_exp[i]
        primary_bal_pct[i] = primary_bal[i] / ngdp * 100

        # Step 4: Debt-to-GDP (baseline applies max(0, ...))
        raw_debt_to_gdp = (
            debt_to_gdp[i - 1] * (1 + nom_rate / 100) / (1 + ngdp_growth / 100)
            - primary_bal_pct[i]
        )
        debt_to_gdp[i] = max(0.0, raw_debt_to_gdp)

        # Step 5: Debt level
        debt[i] = debt_to_gdp[i] / 100 * ngdp

        # Step 6: Interest expenditure (prior-year debt * current rate)
        interest_exp[i] = debt[i - 1] * nom_rate / 100
        interest_exp_pct[i] = interest_exp[i] / ngdp * 100

        # Step 7: Total expenditure and overall balance
        total_exp[i] = primary_exp[i] + interest_exp[i]
        overall_bal[i] = revenue[i] - total_exp[i]
        overall_bal_pct[i] = overall_bal[i] / ngdp * 100

        # Step 8: DSPB
        dspb[i] = (
            debt_to_gdp[i - 1]
            * (nom_rate - ngdp_growth)
            / 100
            / (1 + ngdp_growth / 100)
        )

        # Step 9: Fiscal gap
        fg = (primary_bal_pct[i] - dspb[i]) / 100 * ngdp  # type: ignore[operator]
        fiscal_gap[i] = fg

        # Step 10: Fiscal rule value (applied to NEXT year's expenditure)
        if fiscal_rule == "No":
            fiscal_rule_value[i] = 0.0
        else:
            rising = debt_to_gdp[i] > debt_to_gdp[i - 1]
            above_target = debt_to_gdp[i] > debt_target
            if (rising and above_target) or (not rising and not above_target):
                fiscal_rule_value[i] = fg
            else:
                fiscal_rule_value[i] = 0.0

    # Convert NaN fiscal_gap values to None for null representation
    fiscal_gap_clean: list[float | None] = [
        None if v is None or (isinstance(v, float) and math.isnan(v)) else v
        for v in fiscal_gap
    ]

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
            "fiscal_gap": fiscal_gap_clean,
        }
    )
