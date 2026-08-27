# Oracle Packet: climate (`calc_climate_scenario`)

## Economic Logic

The climate module answers: "How do long-term fiscal projections change when climate change reduces economic productivity?" It takes the completed baseline fiscal projection and re-runs the entire macro-fiscal calculation under each of six climate warming scenarios, producing an alternative debt-to-GDP trajectory for each.

**Transmission mechanism (three channels):**

1. **Productivity channel (primary).** The FADCP Climate Dataset (Massetti & Tagklis 2023, updating Kahn et al. 2021) provides country-specific estimates of cumulative % GDP loss under each warming scenario. Q-CRAFT converts these level losses into year-over-year productivity growth shocks (`climate_variation`). Lower productivity growth feeds through to lower real GDP growth, lower nominal GDP, and therefore lower government revenue (since revenue-to-GDP ratio is held constant).

2. **Expenditure rigidity channel.** Primary expenditure is initially assumed to remain at baseline *levels* in local currency terms (rigidity = 1.0). Because nominal GDP is lower under climate scenarios, the expenditure-to-GDP *ratio* rises. The `expenditure_rigidity` parameter (0.0 to 1.0) controls how much expenditure adjusts downward toward the baseline ratio. At rigidity = 0.0, the government fully reprices expenditure to maintain the baseline expenditure-to-GDP ratio.

3. **Debt dynamics feedback.** Lower GDP growth worsens the interest-rate-growth differential, causing debt-to-GDP to rise faster. Higher debt raises interest expenditure, which further worsens the overall balance and compounds debt accumulation.

**The six scenarios** represent different warming trajectories and adaptation speeds. (Note: The User Guide Section IV.B header says "Five climate change scenarios" but then lists six. The correct count is 6. The "five" in the header likely refers to the five underlying temperature pathways -- Paris, Moderate, High, Hot are distinct warming levels, while Hot Adapted and Hot Unadapted are adaptation variants of Hot, sharing the same warming trajectory. The FADCP dataset footnote 16 in the User Guide also refers to "five scenarios." For implementation, treat all 6 as separate scenarios.)

| Scenario | IPCC Basis | Warming by 2100 (best est.) | Warming by 2100 (very likely range) | Adaptation Parameter (m) |
|---|---|---|---|---|
| **Paris** | SSP1-2.6 | 0.7C | 0.2 to 1.3C | 30 (default) |
| **Moderate** | SSP2-4.5 | 1.6C | 1.0 to 2.4C | 30 (default) |
| **High** | SSP3-7.0 (median) | 2.5C | 1.7 to 3.5C | 30 (default) |
| **Hot** | SSP3-7.0 (90th pct) | 3.5C | n/a | 30 (default) |
| **Hot Adapted** | SSP3-7.0 (90th pct) | 3.5C | n/a | 20 (faster adaptation) |
| **Hot Unadapted** | SSP3-7.0 (90th pct) | 3.5C | n/a | 50 (slower adaptation) |

*Source: User Guide Table 1 (IPCC Global Mean Surface Temperature Change wrt Present, 2081-2100 period). Temperatures are relative to present, not pre-industrial. Hot/Hot Adapted/Hot Unadapted use the 90th percentile of models under SSP3-7.0, so the "very likely range" column does not apply.*

Paris produces the smallest GDP losses (~1% by 2099). Hot Unadapted produces the largest (potentially 7-13% of GDP). The adaptation parameter `m` in the Kahn et al. (2021) framework controls how many years it takes a country to adapt to higher temperatures. Lower `m` = faster adaptation = less severe long-run impact.

**Adaptation parameter `m` -- what it is and is NOT (User Guide p.36):**
- `m` is baked into the FADCP climate dataset. It is NOT a user-adjustable parameter in Q-CRAFT. The climate parquet file already contains the pre-computed GDP loss estimates for each (scenario, m) combination.
- Hot Adapted (m=20): countries adapt to higher temperature in 20 years rather than 30. Macroeconomic effects are less severe than Hot.
- Hot Unadapted (m=50): countries adapt in 50 years. Effects are more severe than Hot.
- The User Guide explicitly states: "the dataset does not have any estimates of climate adaptation spending." Changing `m` does NOT include the cost of adaptation investment -- only the benefit of reduced climate damage. This is a known limitation.

**Climate impact start year (RESOLVED):**

**Climate impacts begin in 2030, not 2031.** The SPEC's `PROJ_START = 2031` is definitively wrong. Four independent sources confirm 2030:

1. **Excel formulas:** Paris row 8, year 2030 = `=Baseline!Y12+'Climate Data'!R17` (first climate adjustment). Year 2029 = `=Baseline!X12` (pure baseline copy).
2. **User Guide p.19:** *"Q-CRAFT assumes that fiscal projections will be affected by climate change scenarios starting in 2030."*
3. **Discrete Risks sheet:** Year range begins at 2030.
4. **Scenario sheet annotations:** Column A says `"Calculation (from 2030, using data from Baseline worksheet and Climate Data worksheet)"`.

This is exactly `WEO_MAX_YEAR + 1` (2029 + 1 = 2030). Years 2009-2029 match the baseline exactly. See `planning/investigations/WEO-BOUNDARY-INVESTIGATION.md` for the full evidence dossier.

---

## Excel Source Sheets

**Climate Database** (1,223 rows x 180 cols, skip 24 header rows):
- Contains % GDP loss by scenario and country
- 6 blocks of 198 rows each (matching the Macrofiscal country list), BUT the User Guide (p.19) states "estimates are provided for 171 economies." The remaining 27 economies (footnote 12: Andorra, Antigua and Barbuda, Aruba, Bahrain, Barbados, Dominica, Hong Kong SAR, Kiribati, Kosovo, Macao SAR, Maldives, Malta, Marshall Islands, Micronesia, Nauru, Palau, Seychelles, Singapore, St Kitts and Nevis, St Lucia, Taiwan Province of China, Timor-Leste, Tonga, Tuvalu, West Bank and Gaza) have no climate estimates available and will have null/zero values in the dataset. Implementation must handle these missing-data countries gracefully.
- 6 blocks of 198 rows each:
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
  - Variation on LP Growth = year-over-year percent change of the GDP index (the productivity shock; a growth rate, not a level difference)

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
- 2030-2102 time horizon (73 year columns)
- Row layout:
  - Row 1: Headers (years 2030-2102)
  - Rows 2-7: Revenue shocks (% of GDP) -- one row per scenario (Paris, Moderate, High, Hot, Hot Adapted, Hot Unadapted)
  - Rows 8-13: Primary expenditure shocks (% of GDP) -- one row per scenario (same order)
- Values are in % of GDP and are ADDITIVE to the scenario calculations
- For the Uganda golden master, all values are zero
- Revenue effects are typically negative (revenue loss). Expenditure effects are typically positive (spending increase).
- User Guide (p.20-21): Users manually enter discrete fiscal risks based on historical experience with natural disasters and climate-related fiscal events (e.g., 0.5% GDP expenditure shock per disaster, 0.5% GDP revenue loss)

Extraction for a given scenario:
```python
discrete_risk_revenue[t] = discrete_risks_sheet[scenario_row_revenue, year_col]  # % of GDP
discrete_risk_expenditure[t] = discrete_risks_sheet[scenario_row_expenditure, year_col]  # % of GDP
```

Applied in Phase 6:
```python
revenue(t) += discrete_risk_revenue(t) / 100 * scenario_nominal_gdp(t)
primary_expenditure(t) += discrete_risk_expenditure(t) / 100 * scenario_nominal_gdp(t)
```

---

## Key Formulas

### Phase 1: Compute climate variation and adjust productivity [VECTORIZABLE]

```
# Climate Database provides cumulative % GDP level loss per year
# GDP Index = 100 + pct_gdp_loss  (e.g., if loss is -3.2%, index = 96.8)

# Climate variation = year-over-year PERCENT CHANGE in the GDP index
# This is the productivity growth SHOCK applied each year. It is a growth rate,
# because it is added to a growth rate; it is NOT the arithmetic difference of
# two index levels. (Corrected 2026-08-27: this block said
# `gdp_index(t) - gdp_index(t-1)` and both engines implemented it that way. See
# `.change-requests/climate-variation-2026-08-26.md`.)
climate_variation(t) = 100 * (gdp_index(t) / gdp_index(t-1) - 1)

# For the first climate impact year (2030), variation uses gdp_index(2029) as the base
# The Climate Database contains data from 2015 onward, so gdp_index(2029) is available.
# For years before the climate impact start (2009-2029), climate_variation = 0
# (no climate adjustment, scenario matches baseline exactly).
#
# Note: gdp_index values for early years (2015-2029) are typically very close to 100
# since cumulative GDP losses are small in the near term. The variation in these years
# is also small but nonzero in the raw data. We only START applying it at the climate
# impact start year (2030).

# Adjusted productivity growth
labour_productivity_growth(t) = baseline_productivity_growth(t) + climate_variation(t)
```

**Sign convention:** `climate_variation` values are typically NEGATIVE because they represent GDP losses. The formula `productivity_growth(t) = baseline_productivity_growth(t) + climate_variation(t)` REDUCES productivity growth because `climate_variation` is negative. Do NOT negate it -- the addition of a negative number is the subtraction. The `Q-CRAFT_DETAILED_ANALYSIS.txt` phrases this as "Baseline productivity - Climate GDP loss impact," which is mathematically equivalent to `baseline + variation` when variation is negative.

For the Hot Unadapted scenario (worst case), climate_variation values can be as large as -2 to -3 percentage points per year by end of century, significantly dragging down productivity growth.

### Phase 2: Recompute GDP with adjusted productivity [RECURSIVE -- for-loop required]

```
# Employment growth is UNCHANGED from baseline
employment_growth(t) = baseline_employment_growth(t)

# Real GDP growth recalculated with climate-adjusted productivity
real_gdp_growth(t) = (1 + employment_growth(t)/100) * (1 + labour_productivity_growth(t)/100) * 100 - 100

# Nominal GDP growth
nominal_gdp_growth(t) = (1 + real_gdp_growth(t)/100) * (1 + inflation(t)/100) * 100 - 100

# GDP levels (recursive -- each year depends on the prior year's GDP level)
real_gdp(t) = real_gdp(t-1) * (1 + real_gdp_growth(t)/100)
nominal_gdp(t) = nominal_gdp(t-1) * (1 + nominal_gdp_growth(t)/100)

# INITIALIZATION: For years before the climate impact start year (2009-2029),
# scenario GDP levels equal baseline GDP levels exactly.
# The recursive computation begins at the climate impact start year (2030).
# real_gdp(2029) = baseline_real_gdp(2029)  -- the seed value
# nominal_gdp(2029) = baseline_nominal_gdp(2029)  -- the seed value
```

### Phase 3: Expenditure recalibration

**Important:** `baseline_primary_expenditure` here means the POST-fiscal-rule expenditure levels from the `baseline_country()` output (the fiscal module). This is the final baseline expenditure after all baseline calculations including the fiscal rule feedback loop. It is NOT the pre-fiscal-rule expenditure from `baseline_v1()`.

```
# [VECTORIZABLE -- depends on Phase 2 GDP output, but no year-over-year recursion within this phase]
# What baseline expenditure would be as a % of SCENARIO nominal GDP
primary_exp_with_baseline_pct(t) = baseline_primary_exp_percent_gdp(t) * scenario_nominal_gdp(t) / 100

# The recalibration amount (how much expenditure "should" adjust)
recalibration(t) = baseline_primary_expenditure(t) - primary_exp_with_baseline_pct(t)

# Scenario primary expenditure
primary_expenditure(t) = baseline_primary_expenditure(t) - (1 - expenditure_rigidity) * recalibration(t)

# At rigidity=1.0: primary_expenditure = baseline_primary_expenditure (NO adjustment, worst case)
# At rigidity=0.0: primary_expenditure = primary_exp_with_baseline_pct (FULL adjustment to maintain ratio)
```

### Phase 4: Revenue (constant ratio to scenario GDP) [VECTORIZABLE]

```
# Revenue-to-GDP ratio is preserved from baseline
# IMPORTANT: Revenue is computed by applying the baseline RATIO to the SCENARIO GDP level.
# This is NOT a growth-rate approach (i.e., NOT revenue(t) = revenue(t-1) * (1 + scenario_ngdp_growth)).
# The ratio approach ensures revenue tracks scenario GDP exactly, while the growth-rate
# approach could accumulate rounding differences. Use the ratio approach.
revenue_percent_gdp(t) = baseline_revenue_percent_gdp(t)
revenue(t) = revenue_percent_gdp(t) / 100 * scenario_nominal_gdp(t)
```

### Phase 5: Recursive fiscal calculation [RECURSIVE -- for-loop required, Domain Rule 1]

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

### Phase 6: Discrete risks (optional, additive) [VECTORIZABLE -- applied before Phase 5 recursion]

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

The Climate Database stores cumulative % GDP level losses. What gets added to productivity growth is the year-over-year percent change of the GDP index, not the cumulative level. This is the "Variation on LP Growth" row in the Climate Data sheet.

```python
gdp_index = 100 + pct_gdp_loss                              # cumulative level
climate_variation = 100 * (gdp_index[t] / gdp_index[t-1] - 1)   # growth rate
```

If you use the cumulative level instead, productivity is massively over-penalized.

**Percent change, not arithmetic difference.** An earlier version of this file wrote
`gdp_index[t] - gdp_index[t-1]`, and both engines implemented that. The two agree only
while the index sits at 100; they separate as losses accumulate, because a difference of
index levels is not a growth rate. Measured on the Uganda golden masters, the difference
form drifts up to 6.2e-3 pp in the shock itself and 2.33 pp of debt-to-GDP by 2099 under
Hot Unadapted, while the percent-change form reproduces every scenario to 7.1e-15.

### 6. YEAR BOUNDARY CONVENTIONS (CRITICAL -- three distinct boundaries)

There are three distinct year boundaries in the climate module. Getting these wrong produces off-by-one errors:

1. **WEO_MAX_YEAR = 2029:** Last year of IMF WEO data (v10 uses October 2024 WEO). All economic variables through this year come from the Macrofiscal database.
2. **Baseline projection start = 2030 (WEO_MAX_YEAR + 1):** The baseline module starts its recursive GDP/fiscal calculations here. Years 2009-2029 are historical/WEO.
3. **Climate impact start = 2030 (per User Guide p.19):** The User Guide states climate scenarios affect projections "starting in 2030." The Discrete Risks sheet covers 2030-2102. This means year 2029 in the climate scenario should match baseline exactly (no climate variation applied), and year 2030 is the first year where `climate_variation` is nonzero.

**Resolution:** For years 2009-2029, all climate scenario values equal baseline values exactly. Climate variation is applied starting from year 2030. The first `climate_variation(2030) = gdp_index(2030) - gdp_index(2029)`. **Verify against golden master** -- if year 2029 shows any divergence from baseline, this boundary is wrong.

Note: SPEC.md defines `PROJ_START = 2031`, which conflicts with the User Guide's 2030. Per the source of truth hierarchy (Excel formulas > User Guide > SPEC), follow the User Guide unless the golden master proves otherwise.

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

**Economic reasoning:** The fiscal rule in the baseline represents an *intentional policy response* to stabilize debt. Climate scenarios are designed to show the *unmitigated fiscal impact* of climate change. If the fiscal rule were applied in climate scenarios, it would partially offset the climate damage by forcing expenditure adjustment, which would understate the fiscal risk. The expenditure rigidity parameter serves a different purpose -- it models the *structural ability* of governments to adjust spending, not a deliberate stabilization policy.

**Interaction with baseline expenditure:** The baseline expenditure levels used as input to the climate module DO include the fiscal rule's effect (since they come from `baseline_country()` output). So the fiscal rule influences the *starting point* of climate scenarios but does not operate within them.

### 13. GOLDEN MASTER TESTS LOAD FROM CSV

Per Domain Rule 5: never hard-code expected values. All test assertions must load expected values from the golden master CSV files. Each scenario has its own CSV file.

### 14. WARNING: PYTHON_REIMPLEMENTATION_GUIDE IS WRONG HERE

**Wrong test assertion:** The guide's Section 6 (Testing Strategy) asserts: `baseline_debt_2099 > hot_scenario_debt_2099`. This is BACKWARDS. Climate impacts worsen fiscal outcomes, so hot scenario debt should be GREATER than baseline debt. The correct assertion is: `hot_scenario_debt_2099 > baseline_debt_2099`. Our golden master test `test_climate_debt_ordering_end_of_period` already has this correct.

**Wrong nominal GDP formula:** The guide gives: `nominal_gdp[year] = nominal_gdp[year-1] * (1 + real_gdp_growth[year]) * (1 + inflation[year])`. This re-multiplies by inflation separately. The SPEC (Section 4.7) and the Excel formulas use `nominal_gdp_growth` directly: `nominal_gdp(t) = nominal_gdp(t-1) * (1 + nominal_gdp_growth(t)/100)`, where `nominal_gdp_growth` already incorporates both real growth and inflation. Using the guide's formula double-counts inflation in the nominal-to-real relationship.

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
