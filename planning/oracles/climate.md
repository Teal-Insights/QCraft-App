# Oracle Packet: climate (`calc_climate_scenario`)

## Economic Logic

The climate module answers: "How do long-term fiscal projections change when climate change reduces economic productivity?" It takes the completed baseline fiscal projection and re-runs the entire macro-fiscal calculation under each of six climate warming scenarios, producing an alternative debt-to-GDP trajectory for each.

**Transmission mechanism (three channels):**

1. **Productivity channel (primary).** The FADCP Climate Dataset (Massetti & Tagklis 2023, updating Kahn et al. 2021) provides country-specific estimates of cumulative % GDP loss under each warming scenario. Q-CRAFT converts these level losses into year-over-year productivity growth shocks (`climate_variation`). Lower productivity growth feeds through to lower real GDP growth, lower nominal GDP, and therefore lower government revenue (since revenue-to-GDP ratio is held constant).

2. **Expenditure rigidity channel.** Primary expenditure is initially assumed to remain at baseline *levels* in local currency terms (rigidity = 1.0). Because nominal GDP is lower under climate scenarios, the expenditure-to-GDP *ratio* rises. The `expenditure_rigidity` parameter (0.0 to 1.0) controls how much expenditure adjusts downward toward the baseline ratio. At rigidity = 0.0, the government fully reprices expenditure to maintain the baseline expenditure-to-GDP ratio.

3. **Debt dynamics feedback.** Lower GDP growth worsens the interest-rate-growth differential, causing debt-to-GDP to rise faster. Higher debt raises interest expenditure, which further worsens the overall balance and compounds debt accumulation.

**The six scenarios** represent different warming trajectories and adaptation speeds:

| Scenario | IPCC Basis | Warming by 2100 | Adaptation Parameter (m) |
|---|---|---|---|
| **Paris** | SSP1-2.6 | <2C | 30 (default) |
| **Moderate** | SSP2-4.5 | ~1.6C | 30 (default) |
| **High** | SSP3-7.0 (median) | ~2.5C | 30 (default) |
| **Hot** | SSP3-7.0 (90th pct) | ~3.5C | 30 (default) |
| **Hot Adapted** | SSP3-7.0 (90th pct) | ~3.5C | 20 (faster adaptation) |
| **Hot Unadapted** | SSP3-7.0 (90th pct) | ~3.5C | 50 (slower adaptation) |

Paris produces the smallest GDP losses (~1% by 2099). Hot Unadapted produces the largest (potentially 7-13% of GDP). The adaptation parameter `m` in the Kahn et al. (2021) framework controls how many years it takes a country to adapt to higher temperatures. Lower `m` = faster adaptation = less severe long-run impact.

Climate impacts begin affecting fiscal projections starting in year PROJ_START (2031, i.e., the first year after WEO_MAX_YEAR). All years up through WEO_MAX_YEAR (2028) match the baseline exactly.

---

## Excel Source Sheets

**Climate Database** (1,223 rows x 180 cols, skip 24 header rows):
- Contains % GDP loss by scenario and country
- 6 blocks of 198 countries each:
  - Paris: rows 26-223
  - Moderate: rows 226-423
  - High: rows 426-623
  - Hot: rows 626-823
  - Hot Adapted: rows 826-1023
  - Hot Unadapted: rows 1026-1223
- Columns: years 2015-2099
- Values: cumulative % GDP level loss (negative numbers = loss)

**Climate Data** (1,254 rows x 180 cols):
- Display sheet pulling from Climate Database via formulas
- Row sections for each scenario:
  - % GDP Level Loss (raw from Climate Database)
  - GDP Index = 100 + % GDP loss
  - Variation on LP Growth = year-over-year change in GDP index (the productivity shock)

**Scenario sheets** (Paris, Moderate, High, Hot, Hot Adapted, Hot Unadapted):
- Each is 54 rows x 96 cols
- Mirrors the Baseline sheet structure exactly
- Key row mapping (same across all 6 scenario sheets):
  - Row 3: Working age (15-64) population (Level) -- from Demography
  - Row 4: Total Population (Level) -- from Demography
  - Row 5: Real GDP (Level) -- from Macrofiscal / calculated after WEO
  - Row 6: Nominal GDP (Level) -- from Macrofiscal / calculated after WEO
  - Row 7: GDP deflator (Level) -- from Macrofiscal / calculated after WEO
  - **Row 8: Labour productivity growth (%) -- ADJUSTED by climate variation**
  - Row 9: Real GDP growth (%)
  - Row 10: GDP deflator growth (%)
  - Row 11: Nominal GDP growth (%)
  - Row 12: Population growth (%)
  - Row 13: Nominal GDP (Level, recalculated)
  - Row 14: Real GDP (Level, recalculated)
  - Row 17: Revenue (% NGDP) -- same ratio as baseline
  - Row 18: Total expenditure (% NGDP)
  - Row 19: Interest expenditure (% NGDP)
  - Row 20: Primary expenditure (% NGDP)
  - Row 21: Primary balance (% NGDP)
  - Row 22: Overall balance (% NGDP)
  - Row 24: Revenue (Level)
  - Row 25: Total expenditure (Level)
  - Row 26: Interest expenditure (Level)
  - Row 27: Primary expenditure (Level)
  - Row 28: Primary balance (Level)
  - Row 29: Overall balance (Level)
  - Row 32: Interest rate (%)
  - Row 34: Debt-to-GDP (%)
  - Row 35: Debt (Level)
  - Row 36: Debt-Stabilizing Primary Balance (% NGDP)

**Discrete Risks** (13 rows x 73 cols):
- Optional fiscal shocks per scenario (revenue and expenditure, % GDP)
- 2030-2102 time horizon
- Can be left empty (all zeros) -- Uganda golden master uses zeros

---

## Key Formulas

### Phase 1: Compute climate variation and adjust productivity

```
# Climate Database provides cumulative % GDP level loss per year
# GDP Index = 100 + pct_gdp_loss  (e.g., if loss is -3.2%, index = 96.8)

# Climate variation = year-over-year change in GDP index
# This is the productivity growth SHOCK applied each year
climate_variation(t) = gdp_index(t) - gdp_index(t-1)
# For the first projection year, variation = gdp_index(PROJ_START) - gdp_index(PROJ_START - 1)

# Adjusted productivity growth
labour_productivity_growth(t) = baseline_productivity_growth(t) + climate_variation(t)
```

### Phase 2: Recompute GDP with adjusted productivity

```
# Employment growth is UNCHANGED from baseline
employment_growth(t) = baseline_employment_growth(t)

# Real GDP growth recalculated with climate-adjusted productivity
real_gdp_growth(t) = (1 + employment_growth(t)/100) * (1 + labour_productivity_growth(t)/100) * 100 - 100

# Nominal GDP growth
nominal_gdp_growth(t) = (1 + real_gdp_growth(t)/100) * (1 + inflation(t)/100) * 100 - 100

# GDP levels (recursive)
real_gdp(t) = real_gdp(t-1) * (1 + real_gdp_growth(t)/100)
nominal_gdp(t) = nominal_gdp(t-1) * (1 + nominal_gdp_growth(t)/100)
```

### Phase 3: Expenditure recalibration

```
# What baseline expenditure would be as a % of SCENARIO nominal GDP
primary_exp_with_baseline_pct(t) = baseline_primary_exp_percent_gdp(t) * scenario_nominal_gdp(t) / 100

# The recalibration amount (how much expenditure "should" adjust)
recalibration(t) = baseline_primary_expenditure(t) - primary_exp_with_baseline_pct(t)

# Scenario primary expenditure
primary_expenditure(t) = baseline_primary_expenditure(t) - (1 - expenditure_rigidity) * recalibration(t)

# At rigidity=1.0: primary_expenditure = baseline_primary_expenditure (NO adjustment, worst case)
# At rigidity=0.0: primary_expenditure = primary_exp_with_baseline_pct (FULL adjustment to maintain ratio)
```

### Phase 4: Revenue (constant ratio to scenario GDP)

```
# Revenue-to-GDP ratio is preserved from baseline
revenue_percent_gdp(t) = baseline_revenue_percent_gdp(t)
revenue(t) = revenue_percent_gdp(t) / 100 * scenario_nominal_gdp(t)
```

### Phase 5: Recursive fiscal calculation (for-loop, year by year)

```
For each year t > WEO_MAX_YEAR:

    # Primary balance
    primary_balance(t) = revenue(t) - primary_expenditure(t)
    primary_balance_percent_gdp(t) = primary_balance(t) / nominal_gdp(t) * 100

    # Debt dynamics -- NO max(0, ...) floor
    debt_to_gdp(t) = debt_to_gdp(t-1) * (1 + interest_rate(t)/100) / (1 + nominal_gdp_growth(t)/100)
                      - primary_balance_percent_gdp(t)

    # Interest expenditure
    interest_expenditure(t) = debt(t-1) * interest_rate(t) / 100
    interest_expenditure_percent_gdp(t) = interest_expenditure(t) / nominal_gdp(t) * 100

    # Debt level
    debt(t) = debt_to_gdp(t) / 100 * nominal_gdp(t)

    # Total expenditure and overall balance
    total_expenditure(t) = primary_expenditure(t) + interest_expenditure(t)
    overall_balance(t) = revenue(t) - total_expenditure(t)
    overall_balance_percent_gdp(t) = overall_balance(t) / nominal_gdp(t) * 100

    # Debt-stabilizing primary balance
    dspb(t) = debt_to_gdp(t-1) * (interest_rate(t) - nominal_gdp_growth(t)) / 100
               / (1 + nominal_gdp_growth(t)/100)
```

### Phase 6: Discrete risks (optional, additive)

```
# If data_risk DataFrame is provided and non-empty:
revenue(t) += discrete_risk_revenue(t) / 100 * nominal_gdp(t)
primary_expenditure(t) += discrete_risk_expenditure(t) / 100 * nominal_gdp(t)
# These are % of GDP shocks added to levels
# Uganda golden master uses all zeros (no discrete risks)
```

---

## Inputs

| Input | Source | Description |
|---|---|---|
| `data_baseline` | `baseline_country()` output (fiscal module) | Full baseline DataFrame with all fiscal columns, years 2009-2100 |
| `iso3c` | User selection | Country ISO3 code (e.g., "UGA") |
| `expenditure_rigidity` | User parameter, default 1.0 | Float 0.0-1.0. Controls expenditure adjustment. 1.0 = sticky (worst case) |
| `scenario_name` | One of 6 scenario strings | "Paris", "Moderate", "High", "Hot", "Hot Adapted", "Hot Unadapted" |
| `data_risk` | Discrete Risks sheet (optional) | DataFrame with revenue/expenditure shocks (% GDP) per year. Can be None |
| Climate parquet | `data/processed/climate.parquet` | FADCP dataset: % GDP loss by country, scenario, year |
| Baseline V1 data | `baseline_v1()` output | Needed for employment_growth, productivity_growth, inflation |
| Interest rate data | `interest_rate_country()` output | Nominal interest rate series |

**Key derived inputs from baseline:**
- `baseline_primary_expenditure` (levels, LCU billions)
- `baseline_primary_exp_percent_gdp` (ratio)
- `baseline_revenue_percent_gdp` (ratio)
- `baseline_productivity_growth` (%)
- `employment_growth` (%) -- reused unchanged
- `inflation` / `gdp_deflator_growth` (%) -- reused unchanged
- `nominal_interest_rate` (%) -- reused unchanged
- `debt_to_gdp` at WEO_MAX_YEAR -- starting point for recursive debt calculation

---

## Outputs

The function `calc_climate_scenario()` is called 6 times, once per scenario. Each call returns a Polars DataFrame with the following columns for years 2009-2100:

| Column | Unit | Description |
|---|---|---|
| `years` | int | Year |
| `revenue` | LCU billions | Government revenue (level) |
| `revenue_percent_gdp` | % | Revenue as share of nominal GDP |
| `primary_expenditure` | LCU billions | Primary expenditure (level) |
| `primary_expenditure_percent_gdp` | % | Primary expenditure as share of nominal GDP |
| `primary_balance` | LCU billions | Revenue minus primary expenditure |
| `primary_balance_percent_gdp` | % | Primary balance as share of nominal GDP |
| `interest_expenditure` | LCU billions | Interest payments on debt |
| `interest_expenditure_percent_gdp` | % | Interest expenditure as share of nominal GDP |
| `total_expenditure` | LCU billions | Primary + interest expenditure |
| `overall_balance` | LCU billions | Revenue minus total expenditure |
| `overall_balance_percent_gdp` | % | Overall balance as share of nominal GDP |
| `debt_to_gdp` | % | Debt as share of nominal GDP |
| `debt` | LCU billions | Gross government debt (level) |
| `debt_stabilizing_primary_balance` | % NGDP | DSPB |
| `labour_productivity_growth` | % | Climate-adjusted productivity growth |
| `real_gdp_growth_percent` | % | Real GDP growth rate |
| `nominal_gdp_growth_percent` | % | Nominal GDP growth rate |
| `nominal_gdp` | LCU billions | Nominal GDP level |
| `real_gdp` | LCU billions | Real GDP level |
| `employment_growth` | % | Employment growth (unchanged from baseline) |

**Note:** The climate intermediate golden master does NOT include `fiscal_gap` (unlike the fiscal/baseline golden master). It DOES include GDP-related columns (`labour_productivity_growth`, `real_gdp_growth_percent`, `nominal_gdp_growth_percent`, `nominal_gdp`, `real_gdp`, `employment_growth`) that the fiscal golden master omits.

**Final golden master** (`tests/golden_masters/final/uganda.csv`) contains summary rows for all 7 scenarios (Baseline + 6 climate) with columns: `scenario`, `year`, `revenue_percent_gdp`, `primary_expenditure_percent_gdp`, `primary_balance_percent_gdp`, `interest_expenditure_percent_gdp`, `overall_balance_percent_gdp`, `debt_to_gdp`.

---

## Gotchas

### 1. DEBT FLOOR ASYMMETRY (CRITICAL -- Domain Rule 3)

> **Baseline applies `max(0, debt_to_gdp)`. Climate scenarios do NOT.**

This is verbatim from CLAUDE.md Rule 3: "Debt floor asymmetry: Baseline applies max(0, debt). Climate scenarios do NOT. This is a critical domain rule. Check it in tests."

In the baseline/fiscal module:
```python
debt_to_gdp[t] = max(0, debt_to_gdp[t-1] * (1+r)/(1+g) - pb[t])
```

In the climate module, there is NO floor:
```python
debt_to_gdp[t] = debt_to_gdp[t-1] * (1+r)/(1+g) - pb[t]
# NO max(0, ...) wrapper
```

This means climate scenarios can produce negative debt-to-GDP ratios if conditions warrant. Do NOT add `max(0, ...)` to climate scenario debt calculations.

### 2. FISCAL RECURSION MUST USE EXPLICIT FOR-LOOPS (Domain Rule 1)

The entire Phase 5 calculation (debt dynamics, interest expenditure, fiscal balances) must be implemented as an explicit Python for-loop iterating year by year. Do NOT use Polars `.shift()`, `.cum_sum()`, `map_elements()`, or any vectorized approach for the recursive fiscal calculation. Each year depends on the prior year's debt level.

### 3. EXPENDITURE GROWTH IS MULTIPLICATIVE (Domain Rule 2)

In the baseline, primary expenditure grows as:
```python
primary_expenditure(t) = primary_expenditure(t-1)
    * (1 + productivity_growth(t)/100)
    * (1 + inflation(t)/100)
    * (1 + total_population_growth(t)/100)
    + fiscal_rule_value(t-1)
```
This multiplicative structure is used to produce the baseline expenditure levels that the climate module then takes as input. The climate module does NOT re-derive expenditure from growth factors -- it takes baseline expenditure levels and applies the rigidity-based recalibration.

### 4. EXPENDITURE RIGIDITY SEMANTICS (Domain Rule 4)

- `rigidity = 1.0` means expenditure is STICKY at baseline levels. This is the worst case for fiscal balances because as GDP falls, the expenditure-to-GDP ratio rises.
- `rigidity = 0.0` means expenditure is FULLY FLEXIBLE. The government immediately adjusts spending to maintain the baseline expenditure-to-GDP ratio.
- Do NOT reverse this scale. The default is 1.0 (worst case).

### 5. CLIMATE VARIATION IS YEAR-OVER-YEAR, NOT CUMULATIVE LEVEL

The Climate Database stores cumulative % GDP level losses. But what gets added to productivity growth is the year-over-year CHANGE in the GDP index (the first difference), not the cumulative level. This is the "Variation on LP Growth" row in the Climate Data sheet.

```python
gdp_index = 100 + pct_gdp_loss  # cumulative level
climate_variation = gdp_index[t] - gdp_index[t-1]  # year-over-year change
```

If you accidentally use the cumulative level instead of the first difference, productivity will be massively over-penalized.

### 6. YEARS BEFORE PROJ_START MATCH BASELINE EXACTLY

For years <= WEO_MAX_YEAR (2028), all scenario values are identical to baseline. Climate impacts only begin at year PROJ_START (2031, the first projection year after WEO). The year 2029-2030 transition depends on WEO_MAX_YEAR and when climate data begins affecting calculations. Verify against golden master.

### 7. EMPLOYMENT GROWTH IS UNCHANGED

Climate shocks affect productivity only. Employment growth is taken directly from the baseline without modification. The climate variation is added to productivity growth, and the combined effect flows through to real GDP growth via the multiplicative identity:
```
real_gdp_growth = (1 + employment_growth/100) * (1 + productivity_growth/100) * 100 - 100
```

### 8. INTEREST RATE IS UNCHANGED FROM BASELINE

The nominal interest rate schedule is identical across all scenarios. Climate change does not affect interest rates in Q-CRAFT. The worsening debt dynamics come entirely from lower GDP growth and deteriorating primary balances.

### 9. INFLATION IS UNCHANGED FROM BASELINE

Per the User Guide (p. 33): "Inflation is assumed to remain unchanged in different climate scenarios." The GDP deflator growth rate is the same as baseline in all climate scenarios.

### 10. THE MODULE RUNS 6 TIMES

`calc_climate_scenario()` is called once for each of the 6 scenarios with a different `scenario_name` parameter. Each call produces a separate DataFrame. The function signature and logic are identical across all 6 -- only the climate damage data differs.

### 11. REVENUE RATIO IS CONSTANT (SAME AS BASELINE)

Revenue-to-GDP ratio in each climate scenario equals the baseline ratio. Revenue *levels* are lower because nominal GDP is lower. Do not accidentally hold revenue levels constant -- that would be wrong. Revenue tracks GDP.

### 12. NO FISCAL RULE IN CLIMATE SCENARIOS

The fiscal rule adjustment (from the baseline/fiscal module) is NOT applied in climate scenarios. The climate module takes baseline expenditure levels as-is and applies only the rigidity recalibration. There is no `fiscal_rule_value` term in the climate expenditure calculation.

### 13. GOLDEN MASTER TESTS LOAD FROM CSV

Per Domain Rule 5: never hard-code expected values. All test assertions must load expected values from the golden master CSV files. Each scenario has its own CSV file.

---

## Fixture Path

### Intermediate (one per scenario):
- `tests/golden_masters/intermediate/climate/paris_uganda.csv`
- `tests/golden_masters/intermediate/climate/moderate_uganda.csv`
- `tests/golden_masters/intermediate/climate/high_uganda.csv`
- `tests/golden_masters/intermediate/climate/hot_uganda.csv`
- `tests/golden_masters/intermediate/climate/hot_adapted_uganda.csv`
- `tests/golden_masters/intermediate/climate/hot_unadapted_uganda.csv`

### Final (all scenarios in one file):
- `tests/golden_masters/final/uganda.csv`

The final golden master contains rows for scenario = "Baseline", "Paris", "Moderate", "High", "Hot", "Hot Adapted", "Hot Unadapted" at key years, with columns: `scenario`, `year`, `revenue_percent_gdp`, `primary_expenditure_percent_gdp`, `primary_balance_percent_gdp`, `interest_expenditure_percent_gdp`, `overall_balance_percent_gdp`, `debt_to_gdp`.
