# Oracle Packet: baseline_v1

## Economic Logic

The `baseline_v1` module is the core GDP projection engine of Q-CRAFT. It takes demographic projections (working-age population growth), productivity assumptions (logistic convergence from a start to an end rate), and inflation projections, then computes a complete time series of real GDP, nominal GDP, employment growth, and their growth rates from 2009 through 2099.

The underlying economic model is a simple production function: **Real GDP = Employment x Productivity** (Y = A * L). Nominal GDP adds the price level: **N = Y * P**. Growth in nominal GDP is therefore approximately the sum of employment growth, productivity growth, and inflation (GDP deflator growth). The approximation becomes exact when using multiplicative compounding: `(1 + emp_growth) * (1 + prod_growth) * (1 + inflation)`.

During the WEO historical/forecast period (2009 through WEO_MAX_YEAR), all GDP levels and growth rates come directly from IMF WEO data via the macrofiscal parquet. Employment growth equals WAP(t)/WAP(t-1)*100-100 for **all years** (confirmed by Excel Baseline sheet row 11 formulas). During the WEO overlap window [WEO_MAX_YEAR-6, WEO_MAX_YEAR], *productivity* is back-calculated as a residual from observed real GDP growth and WAP-derived employment growth. Beyond the WEO horizon, GDP is computed forward recursively from the prior year's level using employment growth (from WAP) and productivity growth (from logistic convergence).

**WEO_MAX_YEAR = 2029** (derived from `max(macrofiscal.years)` at runtime). The SPEC's value of 2028 is a documentation error — see `planning/investigations/WEO-BOUNDARY-INVESTIGATION.md`. The macrofiscal parquet contains data through 2029, the Excel analysis documents say "Historical data: 2001-2029" and "Projected period: 2030-2099", and the golden master confirms that year 2029 carries macrofiscal-derived values (e.g., GDP deflator growth = 4.83%, not the logistic convergence value of 3.5%). The projection period starts at years > 2029 (i.e., 2030+).

This module does NOT compute fiscal variables (revenue, expenditure, debt). Those are handled by `baseline_country` (the fiscal module). This module produces the macroeconomic foundation that the fiscal module consumes.

## Excel Source Sheets

**Primary sheet:** "Baseline" (51 rows x 96 columns, covering years 2009-2099)

### Baseline Sheet Row Map (Excel row numbers)

| Row | Variable | Units | Source/Notes |
|-----|----------|-------|--------------|
| 2 | Years | - | Counter 2009-2099 |
| 3 | Counter | - | 1-indexed counter used for logistic convergence |
| 5 | Working age (15-64) population | Level (thousands) | From Demography sheet; `=Demography!B$4` pattern |
| 6 | Total Population | Level (thousands) | From Demography sheet; `=Demography!B$5` |
| 7 | Real GDP | Level (LCU, billions) | Rows 7: WEO period from Macrofiscal!L2 etc; post-WEO recursively computed |
| 8 | Nominal GDP | Level (LCU, billions) | WEO period from Macrofiscal!L3; post-WEO recursively computed |
| 9 | GDP deflator | Index | From Macrofiscal!L4 |
| 11 | Employment growth | Per cent | = WAP(t)/WAP(t-1)*100-100 for ALL years (confirmed by Excel row 11 formulas) |
| 12 | Labour productivity growth | Per cent | From Productivity sheet during WEO; logistic convergence post-WEO |
| 13 | Real GDP growth | Per cent | From Macrofiscal!L12 during WEO; computed post-WEO |
| 14 | GDP deflator growth | Per cent | From Macrofiscal!L14 during WEO; = inflation post-WEO |
| 15 | Nominal GDP growth | Per cent | From Macrofiscal!L15 during WEO; computed post-WEO |
| 16 | Population growth | Per cent | `=Demography!BL5/Demography!BK5*100-100` pattern |

**Supporting sheets read by Baseline:**
- **Macrofiscal**: Real GDP (row range 67-264), Nominal GDP (268-465), GDP Deflator (469-666) -- all historical/WEO data through 2029
- **Demography**: Working-age population (15-64) and total population by selected scenario (Medium/High/Low)
- **Productivity**: Productivity growth trajectory (logistic convergence from start to end rate)
- **Inflation**: GDP deflator growth projection (logistic convergence from start to end rate)
- **Dashboard**: User parameters (country, demography scenario, productivity start/end, inflation start/end)

## Key Formulas

### Phase 0: WEO-Period Data Loading (years <= WEO_MAX_YEAR)

Before any derivation, the following columns are loaded directly from macrofiscal parquet data for the WEO period. These are NOT computed by baseline_v1 -- they are read as-is:

- `real_gdp` -- from macrofiscal (Real GDP levels)
- `nominal_gdp` -- from macrofiscal (Nominal GDP levels)
- `real_gdp_growth_percent` -- from macrofiscal (Real GDP growth %)
- `nominal_gdp_growth_percent` -- from macrofiscal (Nominal GDP growth %)
- `gdp_deflator_growth_percent` -- from macrofiscal GDP deflator index: `(deflator(t) / deflator(t-1)) * 100 - 100`

During this period, real GDP growth is an INPUT (from WEO), not derived from employment + productivity. The derivation direction flips after the WEO horizon (see Gotcha #11).

### Phase 1: Employment Growth (ALL years)

Employment growth equals working-age population (WAP) growth for **all years**, including the WEO period. This is confirmed by the Excel Baseline sheet row 11 formulas, which always use `=WAP(t)/WAP(t-1)*100-100` (i.e., `=Demography!C4/Demography!B4*100-100` pattern). There is no residual derivation for employment growth — it is purely demographic.

```
employment_growth(t) = (working_age_pop(t) / working_age_pop(t-1)) * 100 - 100
```

This was verified in Investigation 5 of the WEO Boundary Investigation (`planning/investigations/WEO-BOUNDARY-INVESTIGATION.md`): Baseline sheet row 11 uses the WAP ratio formula for every year, not a back-calculation from GDP growth.

### Phase 2: Productivity Recalculation During WEO Overlap (years in [WEO_MAX_YEAR - 6, WEO_MAX_YEAR], i.e., 2023-2029)

For the last ~7 years of the WEO period (2023-2029), productivity is the residual back-calculated from WEO real GDP growth and the WAP-derived employment growth from Phase 1:

```
productivity_growth = (real_gdp_growth/100 - employment_growth/100) / (1 + employment_growth/100) * 100
```

**Why this back-calculation exists:** The `productivity_country()` module provides a logistic convergence trajectory starting from `productivity_start`. But during the WEO overlap years, the actual IMF GDP growth forecasts imply a different productivity path. To ensure the production function identity `Y = A * L` holds exactly during these transition years, baseline_v1 overwrites the productivity module's values with the back-calculated residual. This prevents a discontinuity at the WEO-to-projection boundary.

**Ownership boundary:** `productivity_country()` provides the initial productivity trajectory for ALL years, but baseline_v1 OVERWRITES the values for years in [WEO_MAX_YEAR - 6, WEO_MAX_YEAR] with this back-calculation. The productivity module does not know about this overwrite. The final `labour_productivity_growth` column in the output reflects the overwritten values during the overlap and the logistic convergence values for projection years.

### Phase 3: Post-WEO Employment Growth (years > WEO_MAX_YEAR)

Same formula as Phase 1 -- employment growth equals WAP growth for ALL years, including post-WEO. This phase is listed separately for clarity, but the formula is identical:

```
employment_growth(t) = (working_age_pop(t) / working_age_pop(t-1)) * 100 - 100
```

### Phase 4: Recursive GDP Computation (years > WEO_MAX_YEAR)

For each year t beyond WEO_MAX_YEAR, computed sequentially (each year depends on the prior year):

```
real_gdp(t) = real_gdp(t-1) * (1 + employment_growth(t)/100) * (1 + productivity_growth(t)/100)

real_gdp_growth(t) = (real_gdp(t) / real_gdp(t-1)) * 100 - 100

gdp_deflator_growth(t) = inflation(t)    # from the inflation module

nominal_gdp(t) = nominal_gdp(t-1) * (1 + real_gdp_growth(t)/100) * (1 + gdp_deflator_growth(t)/100)

nominal_gdp_growth(t) = (nominal_gdp(t) / nominal_gdp(t-1)) * 100 - 100
```

### Population Growth (all years)

```
population_growth(t) = (total_population(t) / total_population(t-1)) * 100 - 100
```

Note: This uses the `total_population` column from the `data_demography` input (sourced from the Demography sheet row 6), NOT working-age population. The golden master column name is `population_growth`.

### Growth Decomposition Identity

The key identity is multiplicative, not additive:

```
(1 + nominal_gdp_growth/100) = (1 + employment_growth/100) * (1 + productivity_growth/100) * (1 + gdp_deflator_growth/100)
```

This means nominal GDP growth approximately equals `employment_growth + productivity_growth + inflation`, but the exact calculation uses the multiplicative form.

## Inputs

| Input | Source Module | Key Columns Used |
|-------|-------------|-----------------|
| `data_demography` | `demography_country()` | `years`, `working_age_population`, `total_population` (for population_growth) |
| `data_inflation` | `inflation_country()` | `years`, `inflation` (GDP deflator growth %) |
| `iso3c` | User selection | Country ISO3 code (e.g., "UGA") |
| `level` | User selection | Demography scenario: "Medium", "High", or "Low" |
| `productivity_start` | User input | Start productivity growth rate (default 5.0%) |
| `productivity_end` | User input | End productivity growth rate (default 1.2%) |

The module also internally calls `productivity_country()` to get the productivity growth trajectory, and reads from the Macrofiscal parquet for historical real GDP, nominal GDP, real GDP growth, nominal GDP growth, and GDP deflator growth.

## Outputs

**Returned DataFrame columns** (per SPEC section 4.4):

| Column | Description | Units |
|--------|-------------|-------|
| `iso3c` | Country ISO3 code | string |
| `country` | Country name | string |
| `years` | Year (2009-2099) | integer |
| `working_age_population` | 15-64 age group population | thousands |
| `employment_growth` | Employment growth rate | percent |
| `labour_productivity_growth` | Labour productivity growth rate | percent |
| `gdp_deflator_growth_percent` | GDP deflator (inflation) growth rate | percent |
| `real_gdp` | Real GDP level | LCU, billions |
| `real_gdp_growth_percent` | Real GDP growth rate | percent |
| `nominal_gdp` | Nominal GDP level | LCU, billions |
| `nominal_gdp_growth_percent` | Nominal GDP growth rate | percent |
| `population_growth` | Total population growth rate | percent |

**Downstream consumers:**
- `interest_rate_country()` -- needs `nominal_gdp_growth_percent` for IGD interest rate mode
- `baseline_country()` (fiscal module) -- needs all GDP levels, growth rates, productivity, inflation, and population growth to compute revenue, expenditure, debt dynamics
- `calc_climate_scenario()` -- needs baseline GDP levels and growth rates as the starting point for climate-adjusted scenarios
- UI charts -- nominal GDP growth decomposition chart, baseline tab value cards

## Gotchas

### 1. Productivity Back-Calculation Formula is NOT Simple Subtraction

During the WEO overlap window [WEO_MAX_YEAR-6, WEO_MAX_YEAR], the productivity back-calculation uses the **exact** production function inversion, not a simple difference:

WRONG: `productivity_growth = real_gdp_growth - employment_growth`
RIGHT: `productivity_growth = (real_gdp_growth/100 - employment_growth/100) / (1 + employment_growth/100) * 100`

The denominator `(1 + employment_growth/100)` matters. Note: employment growth itself is simply `WAP(t)/WAP(t-1)*100-100` for all years -- no inversion formula needed.

### 2. WEO_MAX_YEAR Determination and the 2029 Anomaly

**Confirmed:** `WEO_MAX_YEAR = max(macrofiscal.years) = 2029`. The SPEC's value of 2028 is a documentation error (see `planning/investigations/WEO-BOUNDARY-INVESTIGATION.md`). The macrofiscal parquet contains data through 2029, the Excel analysis documents say "Historical data: 2001-2029" and "Projected period: 2030-2099", and the golden master confirms that year 2029 carries macrofiscal-derived GDP deflator growth (4.83%, not the logistic convergence value 3.5%), while 2030 is the first year with the convergence value.

**Practical resolution:** Set `WEO_MAX_YEAR = max(macrofiscal.years)` at runtime. This will resolve to 2029, and projections start at 2030. Do NOT hardcode 2028 or 2029.

### 3. Productivity Recalculation During WEO Overlap

For years 2023-2029, productivity is the residual back-calculated from WEO GDP growth and the WAP-derived employment growth. This is NOT the productivity from the Productivity sheet for those years. The purpose is to ensure internal consistency: the production function identity `Y = A * L` must hold exactly during the handoff years.

### 4. Nominal GDP Growth is Multiplicative, Not Additive

WRONG: `nominal_gdp_growth = real_gdp_growth + inflation`
RIGHT: `nominal_gdp(t) = nominal_gdp(t-1) * (1 + real_gdp_growth(t)/100) * (1 + gdp_deflator_growth(t)/100)`

The growth rate is then derived from the levels: `(nominal_gdp(t) / nominal_gdp(t-1)) * 100 - 100`. This ensures levels and rates are perfectly consistent.

### 5. Recursive Computation Requires Explicit For-Loop

Per CLAUDE.md Domain Rule #1: "Fiscal recursion uses explicit Python for-loops, never vectorized Polars operations." The GDP projection beyond WEO is recursive (each year depends on the previous year's level). This MUST be implemented as a Python for-loop, not with Polars `.shift()`, `.cum_sum()`, or `.map_elements()`.

### 6. Population Growth Uses Total Population, Not Working-Age

The `population_growth` column uses total population from the demography module, while `employment_growth` (all years) uses working-age (15-64) population. Do not confuse these two demographic series.

### 7. Productivity Convergence is Logistic, Not Linear

The productivity trajectory from `productivity_start` to `productivity_end` uses a **logistic (S-curve) function**, not linear interpolation:

```
growth(t) = start + (end - start) * ((1 / (1 + exp(-rate * (counter - turning_point)))) ^ rate)
```

Where `rate = 0.5`, `turning_point = 15`, and `counter` is 1-indexed from the first year after WEO_MAX_YEAR. The PYTHON_REIMPLEMENTATION_GUIDE incorrectly states this is linear interpolation -- the SPEC.md and the User Guide footnote 7 confirm it is logistic. Per the source of truth hierarchy, Excel formulas > SPEC.md > reimplementation guide.

### 8. GDP Deflator Growth During WEO Period Comes From Macrofiscal Data

During the WEO period, GDP deflator growth is NOT from the inflation module. It is calculated from the GDP deflator index in the macrofiscal data: `(deflator(t) / deflator(t-1)) * 100 - 100`. Only after WEO_MAX_YEAR does `gdp_deflator_growth = inflation` (from the inflation module's logistic convergence).

### 9. First Year (2009) Has No Growth Rate Relative to Prior Year

The golden master shows growth rates starting from 2009, but these are computed from 2008 data (which exists in the macrofiscal database but is not in the output range). The first row of the golden master CSV includes growth rates for 2009.

### 10. Golden Master Column Names vs SPEC Column Names

The golden master CSV uses slightly different column names than the SPEC:
- Golden master: `labour_productivity_growth` vs SPEC mentions `labour_productivity_growth`
- Golden master: `gdp_deflator_growth_percent` vs SPEC says `gdp_deflator_growth_percent`
- Golden master: `real_gdp_growth_percent` vs SPEC says `real_gdp_growth_percent`
- Golden master: `nominal_gdp_growth_percent` vs SPEC says `nominal_gdp_growth_percent`

Always match the golden master CSV column names exactly when constructing the output DataFrame.

### 11. WEO Period Data Flow Direction

During WEO period: GDP levels and growth rates come FROM macrofiscal data, employment growth comes FROM WAP (demography), and PRODUCTIVITY is the back-calculated residual during the overlap window [WEO_MAX_YEAR-6, WEO_MAX_YEAR]. During projection period: employment growth comes FROM WAP (demography), productivity comes FROM logistic convergence, and GDP levels are DERIVED. The key direction flip is for GDP and productivity, not employment growth (which is always WAP-derived).

### 12. CRITICAL: PYTHON_REIMPLEMENTATION_GUIDE.md Contains Wrong Formulas

The `PYTHON_REIMPLEMENTATION_GUIDE.md` has **two significant errors** in its Phase 1 formulas. Per the source of truth hierarchy (Excel > Parquet > User Guide > SPEC > agent reasoning), the guide is the lowest-authority source. Do NOT follow the guide's formulas -- use the Excel-verified formulas in this oracle instead.

**WARNING 1: Wrong employment growth formula.** The guide gives:
```
employment_growth[year] = (prod_growth[year] - pop_growth[year]) / (1 + pop_growth[year])
```
This is wrong in three ways:
1. It uses `pop_growth` (total population growth) instead of working-age population growth. Employment growth is derived from the 15-64 cohort, not total population (see Gotcha #6).
2. Post-WEO, employment growth is simply `(working_age_pop(t) / working_age_pop(t-1)) * 100 - 100` -- it is NOT derived from productivity and population at all. The guide's formula has no basis in the Excel formulas for the projection period.
3. During ALL years (including the WEO period), employment growth = WAP(t)/WAP(t-1)*100-100 (confirmed by Excel Baseline sheet row 11 formulas). During the WEO overlap window [WEO_MAX_YEAR-6, WEO_MAX_YEAR], PRODUCTIVITY is the residual back-calculated from GDP growth and WAP-derived employment growth -- the guide has the causality completely backwards. See Phase 1 and Phase 2 above.

**WARNING 2: Wrong additive GDP growth formula.** The guide gives:
```
real_gdp_growth[year] = prod_growth[year] + employment_growth[year]
```
This is ADDITIVE and incorrect. The correct formula is MULTIPLICATIVE:
```
real_gdp(t) = real_gdp(t-1) * (1 + employment_growth(t)/100) * (1 + productivity_growth(t)/100)
```
The additive approximation produces compounding errors over the 70-year projection period (2029-2099). Per CLAUDE.md Domain Rule #2: growth is multiplicative `(1+a)*(1+b)*(1+c)`, never additive. See also Gotcha #4 (nominal GDP) and the Phase 4 formulas in this oracle for the correct multiplicative form.

## Fixture Path
- Intermediate: tests/golden_masters/intermediate/baseline_v1/uganda.csv
- Final: tests/golden_masters/final/uganda.csv

The intermediate fixture has 91 rows (years 2009-2099) and 10 columns. Note: the intermediate golden master CSV does NOT include `iso3c` or `country` columns (these are added by the function per SPEC but not stored in the CSV fixture). The final fixture includes fiscal variables across all 7 scenarios (Baseline + 6 climate scenarios) and is produced by the full pipeline (baseline_country + climate scenarios).

## Verification Checkpoints

From the Uganda golden master intermediate CSV, spot-check these values:

| Year | real_gdp | nominal_gdp | employment_growth | productivity_growth | gdp_deflator_growth | Notes |
|------|----------|-------------|-------------------|--------------------|----|------|
| 2009 | 74760 | 48948 | 3.946 | 3.966 | 17.43 | All from macrofiscal; employment from WAP |
| 2028 | 213222.5 | 344651.5 | 3.422 | 2.568 | 4.52 | Second-to-last WEO year; employment from WAP, productivity BACK-CALCULATED |
| 2029 | 225825.5 | 382666.8 | 3.360 | 2.467 | 4.83 | Last WEO_MAX_YEAR; employment from WAP, productivity BACK-CALCULATED; deflator macrofiscal-derived (NOT 3.5) |
| 2050 | 800765.4 | 2794476.8 | 2.106 | 1.291 | 3.50 | Mid-century; full projection mode |
| 2099 | 2195480.0 | 41342985.8 | 0.098 | 1.200 | 3.50 | End of century, productivity near end rate |

Key observations:
- Productivity converges to ~1.2% by end of century (the `productivity_end` default)
- Employment growth declines over time as Uganda's working-age population growth slows
- GDP deflator growth is 3.5% for all projection years (the default inflation assumption)
- Real GDP growth declines from ~6% in 2030 to ~1.3% in 2099 as demographic dividend fades
