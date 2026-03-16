# Oracle Packet: baseline_v1

## Economic Logic

The `baseline_v1` module is the core GDP projection engine of Q-CRAFT. It takes demographic projections (working-age population growth), productivity assumptions (logistic convergence from a start to an end rate), and inflation projections, then computes a complete time series of real GDP, nominal GDP, employment growth, and their growth rates from 2009 through 2099.

The underlying economic model is a simple production function: **Real GDP = Employment x Productivity** (Y = A * L). Nominal GDP adds the price level: **N = Y * P**. Growth in nominal GDP is therefore approximately the sum of employment growth, productivity growth, and inflation (GDP deflator growth). The approximation becomes exact when using multiplicative compounding: `(1 + emp_growth) * (1 + prod_growth) * (1 + inflation)`.

During the WEO historical/forecast period (2009-2028), all GDP levels and growth rates come directly from IMF WEO data. Employment growth is *derived* as a residual from observed real GDP growth and productivity growth. Beyond the WEO horizon (2029+), the model flips: employment growth is *assumed* to equal working-age population growth (from UN demography data), and GDP is computed forward recursively from the prior year's level.

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
| 11 | Employment growth | Per cent | **Derived** during WEO; assumed = WAP growth post-WEO |
| 12 | Labour productivity growth | Per cent | From Productivity sheet during WEO; logistic convergence post-WEO |
| 13 | Real GDP growth | Per cent | From Macrofiscal!L12 during WEO; computed post-WEO |
| 14 | GDP deflator growth | Per cent | From Macrofiscal!L14 during WEO; = inflation post-WEO |
| 15 | Nominal GDP growth | Per cent | From Macrofiscal!L15 during WEO; computed post-WEO |
| 16 | Population growth | Per cent | `=Demography!BL5/Demography!BK5*100-100` pattern |

**Supporting sheets read by Baseline:**
- **Macrofiscal**: Real GDP (row range 67-264), Nominal GDP (268-465), GDP Deflator (469-666) -- all historical/WEO data through 2028
- **Demography**: Working-age population (15-64) and total population by selected scenario (Medium/High/Low)
- **Productivity**: Productivity growth trajectory (logistic convergence from start to end rate)
- **Inflation**: GDP deflator growth projection (logistic convergence from start to end rate)
- **Dashboard**: User parameters (country, demography scenario, productivity start/end, inflation start/end)

## Key Formulas

### Phase 1: Employment Growth Derivation (WEO period, years <= 2028)

During the WEO period, employment growth is backed out as a residual from observed real GDP growth and observed productivity growth:

```
employment_growth = (real_gdp_growth/100 - productivity_growth/100) / (1 + productivity_growth/100) * 100
```

In Excel (Baseline row 11): `=(D15/100-D14/100)/(1+D14/100)*100` where D15 is real GDP growth and D14 is productivity growth. Note: In the Excel, the row references for real GDP growth and productivity growth are rows 13 and 12 respectively for the Baseline sheet, but the formula pattern is the same.

This comes from rearranging the production function identity: if `(1+g_Y) = (1+g_L)*(1+g_A)`, then `g_L = (g_Y - g_A) / (1 + g_A)`.

### Phase 2: Productivity Recalculation During WEO Overlap (years in [WEO_MAX_YEAR - 6, WEO_MAX_YEAR], i.e., 2022-2028)

For the last ~7 years of the WEO period, productivity is back-calculated from the WEO real GDP growth and the employment growth derived in Phase 1:

```
productivity_growth = (real_gdp_growth/100 - employment_growth/100) / (1 + employment_growth/100) * 100
```

This ensures smooth handoff between the WEO data period and the projection period where productivity follows the logistic convergence path.

### Phase 3: Post-WEO Employment Growth (years > 2028)

After the WEO horizon, employment growth is assumed to equal working-age population growth:

```
employment_growth(t) = (working_age_pop(t) / working_age_pop(t-1)) * 100 - 100
```

### Phase 4: Recursive GDP Computation (years > 2028)

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

Note: This uses **total** population, not working-age population. The golden master column name is `population_growth`.

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

### 1. Employment Growth Formula is NOT Simple Subtraction

The employment growth derivation uses the **exact** production function inversion, not a simple difference:

WRONG: `employment_growth = real_gdp_growth - productivity_growth`
RIGHT: `employment_growth = (real_gdp_growth/100 - productivity_growth/100) / (1 + productivity_growth/100) * 100`

The denominator `(1 + productivity_growth/100)` matters. Getting this wrong will produce errors that compound over the projection period.

### 2. WEO_MAX_YEAR = 2028

The IMF WEO April 2024 data runs through 2028 (not 2029 or 2030). The projection period starts at 2029. The constant `WEO_MAX_YEAR` must be 2028. Check by inspecting the max year in the macrofiscal parquet data.

### 3. Productivity Recalculation During WEO Overlap

For years 2022-2028, productivity is back-calculated from WEO GDP growth and the derived employment growth. This is NOT the productivity from the Productivity sheet for those years. The purpose is to ensure internal consistency: the production function identity `Y = A * L` must hold exactly during the handoff years.

### 4. Nominal GDP Growth is Multiplicative, Not Additive

WRONG: `nominal_gdp_growth = real_gdp_growth + inflation`
RIGHT: `nominal_gdp(t) = nominal_gdp(t-1) * (1 + real_gdp_growth(t)/100) * (1 + gdp_deflator_growth(t)/100)`

The growth rate is then derived from the levels: `(nominal_gdp(t) / nominal_gdp(t-1)) * 100 - 100`. This ensures levels and rates are perfectly consistent.

### 5. Recursive Computation Requires Explicit For-Loop

Per CLAUDE.md Domain Rule #1: "Fiscal recursion uses explicit Python for-loops, never vectorized Polars operations." The GDP projection beyond WEO is recursive (each year depends on the previous year's level). This MUST be implemented as a Python for-loop, not with Polars `.shift()`, `.cum_sum()`, or `.map_elements()`.

### 6. Population Growth Uses Total Population, Not Working-Age

The `population_growth` column uses total population from the demography module, while `employment_growth` (post-WEO) uses working-age (15-64) population. Do not confuse these two demographic series.

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

During WEO period: GDP levels and growth rates come FROM macrofiscal data, and employment growth is DERIVED. During projection period: employment growth comes FROM demography, and GDP levels are DERIVED. Understanding this direction flip is essential.

## Fixture Path
- Intermediate: tests/golden_masters/intermediate/baseline_v1/uganda.csv
- Final: tests/golden_masters/final/uganda.csv

The intermediate fixture has 91 rows (years 2009-2099) and 10 columns. The final fixture includes fiscal variables across all 7 scenarios (Baseline + 6 climate scenarios) and is produced by the full pipeline (baseline_country + climate scenarios).

## Verification Checkpoints

From the Uganda golden master intermediate CSV, spot-check these values:

| Year | real_gdp | nominal_gdp | employment_growth | productivity_growth | Notes |
|------|----------|-------------|-------------------|--------------------|----|
| 2009 | 74760 | 48948 | 3.946 | 3.966 | First year, all from WEO |
| 2028 | 213222.5 | 344651.5 | 3.422 | 2.568 | Last WEO year |
| 2029 | 225825.5 | 382666.8 | 3.360 | 2.467 | First projection year |
| 2050 | 800765.4 | 2794476.8 | 2.106 | 1.291 | Mid-century |
| 2099 | 2195480.0 | 41342985.8 | 0.098 | 1.200 | End of century, productivity near end rate |

Key observations:
- Productivity converges to ~1.2% by end of century (the `productivity_end` default)
- Employment growth declines over time as Uganda's working-age population growth slows
- GDP deflator growth is 3.5% for all projection years (the default inflation assumption)
- Real GDP growth declines from ~8% in 2029 to ~1.3% in 2099 as demographic dividend fades
