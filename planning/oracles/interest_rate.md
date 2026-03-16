# Oracle Packet: interest_rate

## Economic Logic

The `interest_rate_country` function projects the **nominal interest rate** on government debt from the last WEO year (2028) through 2099 under three user-selectable approaches, then derives the real interest rate and the interest-growth differential from it.

The interest rate is **the single most consequential assumption for long-run debt dynamics**. In the debt-dynamics equation `d(t) = d(t-1) * (1+i)/(1+g) - pb(t)`, the interest rate `i` directly determines whether debt is self-reinforcing (i > g, unfavorable) or self-correcting (i < g, favorable). Small errors in interest rate projection compound over 70 years into dramatically wrong debt paths.

### The Three Modes

The user selects one of three approaches via `select_rate` on the Dashboard (cell B28):

1. **"Nominal interest rate"** (constant nominal rate)
   - The nominal interest rate stays fixed at its last WEO value (2028) for all projection years.
   - Simplest assumption. Appropriate when the user has no strong view on long-run rate dynamics.
   - Risk: if the economy converges toward OECD productivity levels, a constant nominal rate may produce persistently negative or persistently large real interest rates, which is unrealistic.

2. **"Interest-growth differential"** (constant IGD)
   - The **spread** between the interest rate and nominal GDP growth stays constant at its last WEO value.
   - This is the most economically nuanced default: as the economy grows faster or slower, the nominal rate tracks GDP growth while maintaining a constant wedge.
   - The nominal rate is back-calculated each year from the previous year's nominal GDP growth plus the constant differential.
   - Captures the idea that in the long run, interest rates and growth tend to co-move.

3. **"Real interest rate"** (constant real rate, i.e., r-star)
   - The user provides a long-run real interest rate (default: 1.0%). The nominal rate is then derived each year by applying the Fisher equation to the inflation projection from the previous year.
   - Useful when the first two options produce prolonged periods of negative real rates. The User Guide recommends this as a fallback.

### Why This Module Matters

Interest rate projections feed directly into `baseline_country` (Section 4.6 of the SPEC), where they enter the debt-dynamics recursion and the computation of interest expenditure. Getting the interest rate wrong cascades into wrong debt, wrong interest expenditure, wrong overall balance, and wrong fiscal rule behavior. The interest-growth differential column is also shown directly in the Output Baseline charts.

---

## Excel Source Sheets

### Primary: "Interest Rate" sheet (316 rows x 100 cols)

This is a **blue input worksheet** that computes the interest rate projection for the selected country.

**Row layout (approximate, per Figure 6 in User Guide, p.15):**

| Row | Content | Notes |
|-----|---------|-------|
| 1 | Country name | Pulled from Dashboard!C12 |
| 2 | Nominal interest rate (%) | Row of values, 2002-2099. Historical: from Macrofiscal implicit rate. Projection: depends on mode. |
| 3 | Nominal GDP growth (%) | Pulled from Baseline sheet |
| 4 | Inflation (baseline) | Pulled from Inflation sheet |
| 5 | Real interest rate (%) | Derived: Fisher equation on rows 2 and 4 |
| 6 | Interest-growth differential | Derived: from rows 2 and 3 |
| ~8 | "Last year of WEO" section | Anchors: base_nominal_rate, base_igd |
| ~9 | Interest rate approach selector | Links to Dashboard B28 |
| ~10 | Long-run real rate assumption | Links to Dashboard B29 (default 1.0) |
| ~12-14 | "Long-run assumption" row | Counter 1,2,3... for projection years. Shows the mode-dependent nominal rate |
| ~16-19 | "Output" section | Nominal interest rate, Nominal GDP growth, Real interest rate, Interest-growth differential -- the final time series |

### Supporting: "Macrofiscal" sheet

- **Row 2 (Nominal interest rate historical):** The implicit interest rate is computed from Macrofiscal data as `interest_expenditure / debt_stock * 100`. Specifically, the Excel formula pattern is `=D11/D10*100` where row 11 is interest expenditure (LCU billions) and row 10 is debt (LCU billions). This gives the **implicit weighted-average nominal rate** on outstanding debt.
- The Interest Rate sheet pulls this historical series for years 2002-2028 (or through WEO_MAX_YEAR).

### Supporting: "Dashboard" sheet

- **B28:** Interest rate approach selector -- "Nominal interest rate", "Interest-growth differential", or "Real interest rate"
- **B29:** Long-run real interest rate assumption (default: 1.0%)

### Supporting: "Baseline" sheet

- Provides `nominal_gdp_growth_percent` for each year, which is needed for the IGD mode and for deriving the interest-growth differential column.

### Supporting: "Inflation" sheet

- Provides the `inflation` series (GDP deflator growth %), needed for the real interest rate mode (Fisher equation) and for the derived real_interest_rate column.

---

## Key Formulas

### Historical Period (years <= WEO_MAX_YEAR, i.e., 2009-2028)

All values come directly from the Macrofiscal sheet:

```
nominal_interest_rate(t) = interest_expenditure(t) / debt(t-1) * 100
    where interest_expenditure = primary_balance - overall_balance
    and debt is gross debt (LCU billions)

inflation(t) = gdp_deflator_growth(t)  [from Macrofiscal]

nominal_gdp_growth(t) = from Macrofiscal

real_interest_rate(t) = (nominal_interest_rate(t)/100 - inflation(t)/100) / (1 + inflation(t)/100) * 100

interest_growth_differential(t) = (nominal_interest_rate(t)/100 - nominal_gdp_growth(t)/100) / (1 + nominal_gdp_growth(t)/100) * 100
```

### Anchor Values (from last WEO year = 2028)

```
base_nominal_rate = macrofiscal[WEO_MAX_YEAR].nominal_interest_rate
    For Uganda: ~7.85% (see golden master year 2028)

base_igd = macrofiscal[WEO_MAX_YEAR].interest_growth_differential
    For Uganda: ~-2.72% (see golden master year 2028)
```

### Projection Period (years > WEO_MAX_YEAR, i.e., 2029-2099)

**Mode 1: "Nominal interest rate" (constant nominal)**
```
nominal_interest_rate(t) = base_nominal_rate    [constant for all t]
```

**Mode 2: "Interest-growth differential" (constant IGD)**
```
nominal_interest_rate(t) = (1 + nominal_gdp_growth(t-1)/100) * (1 + base_igd/100) * 100 - 100
```
CRITICAL: This uses nominal GDP growth from the **previous year** (t-1), not the current year. The shift is clearly visible in the golden master: year 2029's nominal rate uses 2028's GDP growth.

**Mode 3: "Real interest rate" (constant real rate)**
```
nominal_interest_rate(t) = (1 + long_run_interest_rate/100) * (1 + inflation(t-1)/100) * 100 - 100
```
CRITICAL: This also uses the **previous year's** inflation (t-1), not the current year. The Fisher equation is applied with a one-year lag.

### Derived Columns (all years, including projection)

```
real_interest_rate(t) = (nominal_interest_rate(t)/100 - inflation(t)/100) / (1 + inflation(t)/100) * 100

interest_growth_differential(t) = (nominal_interest_rate(t)/100 - nominal_gdp_growth(t)/100) / (1 + nominal_gdp_growth(t)/100) * 100
```

Note: The derived columns use the **current year's** inflation and GDP growth (no lag). The lag only applies to the nominal rate projection formula in modes 2 and 3.

---

## Inputs

| Input | Source | Notes |
|-------|--------|-------|
| `df_baseline_v1` | Output of `baseline_v1()` | Provides `nominal_gdp_growth_percent` and `gdp_deflator_growth_percent` (=inflation) for each year |
| `iso3c` | User parameter | Country code, e.g., "UGA" |
| `select_rate` | Dashboard B28 | One of: "Nominal interest rate", "Interest-growth differential", "Real interest rate" |
| `long_run_interest_rate` | Dashboard B29 | Default: 1.0. Only used when select_rate = "Real interest rate" |
| Macrofiscal data | `data/processed/macrofiscal.parquet` | Historical nominal interest rate (implicit), nominal GDP growth, inflation, interest-growth differential through WEO_MAX_YEAR |

### What This Module Reads From `df_baseline_v1`

- `nominal_gdp_growth_percent` -- needed for IGD mode projection and for the derived `interest_growth_differential` column
- `gdp_deflator_growth_percent` -- this IS the inflation series; needed for Real rate mode and for the derived `real_interest_rate` column

### What This Module Reads From Macrofiscal

- Historical `nominal_interest_rate` (the implicit rate = interest expenditure / prior-year debt * 100) for years through WEO_MAX_YEAR
- Historical `interest_growth_differential` for years through WEO_MAX_YEAR
- The **anchor values** at WEO_MAX_YEAR: `base_nominal_rate` and `base_igd`

---

## Outputs

A Polars DataFrame with columns:

| Column | Type | Description |
|--------|------|-------------|
| `years` | int | 2009 through 2099 |
| `nominal_interest_rate` | float | Percent. The projected (or historical) nominal rate on government debt |
| `inflation` | float | Percent. GDP deflator growth rate (passthrough from baseline/macrofiscal) |
| `nominal_gdp_growth_percent` | float | Percent. Nominal GDP growth (passthrough from baseline) |
| `real_interest_rate` | float | Percent. Fisher-equation-derived real rate |
| `interest_growth_differential` | float | Percent. The (i - g) / (1 + g) spread. Positive = unfavorable debt dynamics |

### Downstream Consumers

1. **`baseline_country` (fiscal module):** Uses `nominal_interest_rate` for:
   - Debt dynamics: `d(t) = d(t-1) * (1 + i/100) / (1 + g/100) - pb(t)`
   - Interest expenditure: `interest_exp(t) = debt(t-1) * nominal_interest_rate(t) / 100`
   - Debt-stabilizing primary balance: `dspb(t) = d(t-1) * (i(t) - g(t)) / 100 / (1 + g(t)/100)`

2. **`calc_climate_scenario`:** Uses the same interest rate series (interest rates are NOT adjusted in climate scenarios -- they remain at baseline values).

3. **UI / Output Baseline:** The `nominal_interest_rate`, `real_interest_rate`, and `interest_growth_differential` are displayed in the "Interest Rate" chart on the Output Baseline worksheet and in the Baseline tab of the app (chart 4: "Interest Expenditure % NGDP + Interest Rate").

---

## Gotchas

### 1. The t-1 Lag in IGD and Real Rate Modes

Both "Interest-growth differential" mode and "Real interest rate" mode use the **previous year's** GDP growth or inflation, NOT the current year. This is called out in SPEC.md section 4.5:

- IGD: `nominal_rate(t) = (1 + nominal_gdp_growth(t-1)/100) * (1 + base_igd/100) * 100 - 100`
- Real: `nominal_rate(t) = (1 + long_run_interest_rate/100) * (1 + inflation(t-1)/100) * 100 - 100`

If you use current-year values, you will get wrong numbers for every year. The golden master makes this testable.

### 2. The Derived Columns Use Current-Year Values (No Lag)

The `real_interest_rate` and `interest_growth_differential` are computed using **current-year** inflation and GDP growth. Do not confuse the lag in the projection formula with the lag in the derived columns -- there is no lag in the derived columns.

```
real_interest_rate(t) uses inflation(t)        [current year]
interest_growth_differential(t) uses gdp_growth(t)  [current year]
```

### 3. The Golden Master Uses "Nominal interest rate" Mode (Constant Nominal)

Looking at the golden master data for Uganda, the nominal rate is constant at ~8.039% for all projection years (2029-2099), confirming the golden master was generated with `select_rate = "Nominal interest rate"`. The anchor value comes from the last WEO year (2028): 7.849797... rounds to ~8.039 at 2029 (actually it appears the anchor is taken from 2029 row in the Macrofiscal data, which itself shows ~8.039).

**Correction on close inspection:** The nominal rate becomes constant at `8.039026657461907` starting from year 2029 onward. Year 2028 has `7.849797722732102`. This means `base_nominal_rate` is taken from year **2029** in the Macrofiscal data (the last row of WEO projections before the Q-CRAFT projection begins), OR it is computed slightly differently. Verify against the Macrofiscal parquet carefully.

### 4. Inflation Is Constant at 3.5% in Projection Period

For Uganda's golden master, inflation = 3.5 for all years >= 2029 (the projection period), confirming the inflation convergence function has already settled to the "end" value by then (Uganda default: inflation_start = 3.5, inflation_end = 3.5, so it is constant immediately).

### 5. Real Interest Rate Derived via Fisher Equation, Not Simple Subtraction

```
CORRECT:   real_rate = (nominal/100 - inflation/100) / (1 + inflation/100) * 100
INCORRECT: real_rate = nominal - inflation
```

The simple subtraction would give approximately correct results for low inflation, but would fail the golden master tolerance for countries with high inflation. For Uganda year 2009: nominal = 5.22%, inflation = 17.43%, real = -10.40% (Fisher), vs. simple subtraction = -12.21%.

### 6. Interest-Growth Differential Also Uses Fisher-Style Formula

```
CORRECT:   igd = (nominal/100 - gdp_growth/100) / (1 + gdp_growth/100) * 100
INCORRECT: igd = nominal - gdp_growth
```

Same Fisher-equation structure. The denominator matters because GDP growth can be double-digit.

### 7. Historical Interest Rate Is an Implicit Rate

The historical nominal interest rate is NOT a policy rate or a market rate. It is the **implicit weighted-average rate** on government debt, computed as:
```
nominal_interest_rate(t) = interest_expenditure(t) / debt(t-1) * 100
```
This reflects the actual cost of the government's debt portfolio, including concessional loans, domestic bonds, etc.

### 8. Interest Rates Do NOT Change Under Climate Scenarios

In Q-CRAFT, interest rates are exogenous and remain at baseline values across all climate scenarios. This is a deliberate simplification -- the tool does not model how climate-driven GDP declines might raise sovereign risk premia. The interest rate module only needs to be computed once per parameter set (not per scenario).

### 9. This Module Is NOT Recursive

Unlike `baseline_country` and `calc_climate_scenario`, the interest rate module does **not** have a fiscal feedback loop. It can be computed in a single vectorized pass (no for-loop required). The nominal rate depends only on the previous year's GDP growth (mode 2) or inflation (mode 3), both of which are already fully determined by `baseline_v1`.

### 10. WEO_MAX_YEAR = 2028

The golden master data shows the transition from variable historical rates to the constant projection rate between years 2028 and 2029. The SPEC confirms `WEO_MAX_YEAR = 2028`.

### 11. The `iso3c` and `country` Columns

The golden master CSV does NOT include `iso3c` or `country` columns -- it only has the 6 numeric columns. However, the SPEC signature says the return DataFrame should include `iso3c, country` in its output. Verify whether the test fixture expects these metadata columns or just the numeric ones.

---

## Fixture Path
- Intermediate: `tests/golden_masters/intermediate/interest_rate/uganda.csv`
- Final: `tests/golden_masters/final/uganda.csv`

### Golden Master Sanity Checks (Uganda, "Nominal interest rate" mode)

| Year | nominal_interest_rate | inflation | nominal_gdp_growth | real_interest_rate | interest_growth_differential |
|------|----------------------|-----------|-------------------|-------------------|---------------------------|
| 2009 | 5.218 | 17.430 | 26.905 | -10.399 | -17.089 |
| 2028 | 7.850 | 4.519 | 10.871 | 3.187 | -2.725 |
| 2029 | 8.039 | 4.834 | 11.030 | 3.058 | -2.694 |
| 2030 | 8.039 | 3.500 | 12.136 | 4.386 | -3.654 |
| 2050 | 8.039 | 3.500 | 7.044 | 4.386 | 0.929 |
| 2099 | 8.039 | 3.500 | 4.844 | 4.386 | 3.047 |

Key observations from the golden master:
- Nominal rate becomes constant at 8.039026657461907 from year 2029 onward
- Inflation drops to exactly 3.5 from year 2030 onward (year 2029 still has historical/WEO value of 4.834)
- Real interest rate is constant at 4.385533002378653 from year 2030 onward (because both nominal rate and inflation are constant)
- Interest-growth differential trends upward over time because nominal GDP growth is slowing (demographic transition), while the nominal rate is fixed
- By ~2046, the IGD turns positive (interest rate exceeds GDP growth), signaling the onset of unfavorable debt dynamics for Uganda under baseline assumptions
