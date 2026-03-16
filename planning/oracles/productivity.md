# Oracle Packet: productivity

## Economic Logic

The productivity module computes a long-run trajectory of **labor productivity growth** (GDP per employed person) from 2009 to 2099. It serves three purposes in Q-CRAFT:

1. **Historical record (2009-2021):** Load observed productivity levels from the World Bank WDI dataset and compute year-over-year growth rates.
2. **WEO-derived period (2022-2029):** During the IMF WEO horizon, productivity growth is *derived* -- it is not an independent input. Per the User Guide (p.12): "Q-CRAFT uses the WB WDI data for productivity growth until 2021 and derives productivity growth for the period between 2022 and 2028 from the WEO projection of real GDP growth and the UN projection of the working-age population growth." The year 2029 is also WEO-derived in the golden master (2.47%, not logistic ~4.89%). The back-calculation happens in `baseline_v1` Phase 2, not in this module. **What this module outputs for 2022-2029 will be overwritten by baseline_v1.**
3. **Projection (2030-2099):** Apply a **logistic convergence function** that smoothly transitions the growth rate from `productivity_start` (default 5.0%) to `productivity_end` (default 1.2%) over the projection horizon. This is NOT linear interpolation. The golden master confirms 2030 is the first logistic year (4.89%, near start=5.0%).

**IMPORTANT -- module boundary:** The User Guide (p.12) says "The productivity growth thus calculated in 2028 is the 'start' productivity growth rate -- that is, it is the productivity growth rate in 2029, the start of the Q-CRAFT projection period." This means `productivity_start` (Dashboard default 5.0%) is the user's chosen starting rate for the logistic trajectory beginning at 2030, NOT the WEO-derived value at 2029. The module returns logistic values for 2030+; baseline_v1 overwrites 2022-2029 with back-calculated values.

The module also computes:
- **Productivity level** (cumulative, in constant US$2021 PPP): starting from the historical WDI level, compounded forward by the growth rate each year.
- **Productivity relative to OECD (%):** The country's productivity level expressed as a percent of a synthetic OECD benchmark that grows at a fixed rate per year. The User Guide is internally inconsistent: p.12 says "1.1 percent per year that has been achieved between 1991-2022", while p.27 says "the historical average rate of 1.2 percent." **Follow the Excel workbook formulas** per the source-of-truth hierarchy. The golden master data will resolve any ambiguity (see Gotcha #5).

Downstream, productivity growth is a key input to the production function: `Real GDP = Productivity x Employment`. The baseline_v1 module uses productivity growth to decompose GDP growth and project real GDP forward. Climate scenarios then shock productivity growth to model GDP losses.

## Excel Source Sheets

### Productivity sheet (312 rows x 101 cols)
- **Row 1:** Headers -- `years` running from approximately 2001 to 2099 across columns.
- **Row 2:** `Productivity level (US$2021 PPP)` -- the historical and projected levels for the selected country. Historical data from WB WDI through 2021. WEO-period values (2022-2029) and projection values (2030-2099) are formula-computed.
- **Row 3:** `Productivity level (% of OECD)` -- the country's level as a percentage of the OECD benchmark.
- **Row 4:** `Productivity growth (%)` -- year-over-year growth rate. This is the primary output consumed by other modules.
- **Row 23:** User-overridable row -- users can hard-paste their own productivity trajectory here to override the logistic convergence formula.

### Dashboard sheet
- **Cell B20:** `productivity_start` (default 5.0%) -- the starting growth rate at the beginning of the projection period.
- **Cell B21:** `productivity_end` (default 1.2%) -- the long-run convergence target growth rate.
- The logistic function parameters `rate` (0.5) and `turning_point` (15) are in rose-pink cells in the Productivity sheet. Per User Guide footnote 7 (p.12): `rate` (0.5) "should not be changed", but `turning_point` "can be adjusted" by the user. For implementation, treat `turning_point=15` as the default but note it is technically user-modifiable (unlike `rate`).

### Macrofiscal sheet
- Provides real GDP data needed for the WEO-period productivity back-calculation (done in baseline_v1, not here).

### Demography sheet
- Provides working-age population data needed for employment growth calculation (done in baseline_v1, not here).

## Key Formulas

### 1. Historical productivity growth rate (2009-2021)
```
productivity_growth(t) = (productivity_level(t) / productivity_level(t-1)) * 100 - 100
```
Where `productivity_level` comes from WB WDI data (GDP per employed person in constant 2021 US$ PPP).

### 2. WEO-period growth rate (2022-2029)

**What the User Guide says (p.12):** "Q-CRAFT uses the WB WDI data for productivity growth until 2021 and derives productivity growth for the period between 2022 and 2028 from the WEO projection of real GDP growth and the UN projection of the working-age population growth."

**What SPEC 4.4 says:** baseline_v1 Phase 2 overwrites productivity for years in `[WEO_MAX_YEAR - 6, WEO_MAX_YEAR]` (i.e., 2022-2028 with WEO_MAX_YEAR=2028) using: `productivity = (real_gdp_growth/100 - employment_growth/100) / (1 + employment_growth/100) * 100`.

**What the golden master shows:** The intermediate productivity CSV has WEO-derived values for 2022-2029 that differ from `productivity_start` (5.0%). For example: 2022=0.07%, 2023=1.14%, 2024=2.38%, 2029=2.47%. The year 2029 is clearly WEO-derived (not logistic), as logistic(counter=1) would be ~4.89%.

**Module boundary (important for implementation):** The productivity module itself does NOT do the WEO back-calculation. SPEC 4.2 says "Extend through WEO horizon using `productivity_start` rate." However, the golden master intermediate CSV for productivity already contains WEO-derived values, suggesting the Excel Productivity sheet pulls from Macrofiscal/Demography data directly. For the Python implementation, the productivity module should output logistic values from 2030 onward; baseline_v1 will overwrite 2022-2029 with back-calculated values. The intermediate golden master tests the combined output (after baseline_v1 overwrite).

### 3. Logistic convergence function (2030-2099)

**CRITICAL: The golden master proves the logistic function starts at 2030, NOT 2029.** Year 2029 shows 2.47% (WEO-derived), while 2030 shows 4.89% (logistic, near start=5.0%). The SPEC says `counter = t - WEO_MAX_YEAR` with WEO_MAX_YEAR=2028, which gives counter=1 for 2029 and counter=2 for 2030. However, logistic(counter=1) = ~4.89% and logistic(counter=2) = ~4.85%, which matches 2030 and 2031 in the golden master. This means either: (a) the macrofiscal data actually extends through 2029 making WEO_MAX_YEAR=2029, or (b) year 2029 is handled specially. The Excel analysis documents confirm "Historical period: 2001-2029, Projected: 2030-2099."

**Recommended implementation:** Use `counter = t - 2029` (so counter=1 for 2030) OR equivalently `counter = t - WEO_MAX_YEAR` where WEO_MAX_YEAR resolves to 2029 from `max(macrofiscal.years)`. The SPEC annotation "2028" may be stale; verify at runtime.

```
For each year t in the projection period (2030-2099):
    counter = t - WEO_MAX_YEAR       # With WEO_MAX_YEAR=2029: counter=1 for 2030
    rate = 0.5                        # Fixed, should not be changed
    turning_point = 15                # Default 15, user-adjustable per User Guide footnote 7

    growth(t) = productivity_start + (productivity_end - productivity_start)
                * ((1 / (1 + exp(-rate * (counter - turning_point)))) ^ rate)
```

With defaults (start=5.0, end=1.2, rate=0.5, turning_point=15):
- At counter=1 (year 2030): growth is close to `productivity_start` (~4.89%)
- At counter=14 (year 2043): growth is near the inflection point (~2.67%)
- At counter=29+ (year 2058+): growth has converged close to `productivity_end` (1.2%)

**CRITICAL:** The exponent is `^rate` (i.e., `^0.5`), applied to the entire logistic sigmoid fraction. This is `(sigmoid)^0.5`, not `sigmoid` alone. This subtlety affects the shape of the convergence curve.

### 4. Cumulative productivity level
```
productivity_level(t) = productivity_level(t-1) * (1 + productivity_growth(t) / 100)
```
Starting from the last historical WDI value and compounding forward.

### 5. OECD benchmark and relative level
```
oecd_level(t) = oecd_level(t-1) * (1 + oecd_growth_rate / 100)
```
Where `oecd_growth_rate` = 1.1% per year (constant).

The OECD base level is the OECD average productivity in the WDI base year. The golden master shows Uganda at ~6.68% of OECD in 2009, rising to ~14.22% by 2099 with default parameters.

```
productivity_level_oecd_percent(t) = productivity_level(t) / oecd_level(t) * 100
```

## Inputs

| Input | Source | Description |
|-------|--------|-------------|
| `iso3c` | User selection | Country ISO3 code (e.g., "UGA") |
| `productivity_start` | Dashboard B20 (default 5.0) | Starting productivity growth rate (%) for the logistic convergence. This is the Dashboard default, NOT the WEO-derived value at 2028/2029. Per User Guide (p.12), "The productivity growth thus calculated in 2028 is the 'start' productivity growth rate." Users are expected to set this based on WEO-derived context. |
| `productivity_end` | Dashboard B21 (default 1.2) | Long-run convergence target growth rate (%) |
| Historical productivity levels | `data/processed/productivity.parquet` | WB WDI data: GDP per employed person (constant 2021 US$ PPP), through 2021 |
| WEO-period macrofiscal data | `data/processed/macrofiscal.parquet` | Real GDP, GDP deflator for deriving productivity during WEO overlap |
| Demography data | Demography module output | Working-age population growth for employment derivation during WEO period |

### Fixed and default parameters
| Parameter | Value | Modifiable? | Location in Excel | Notes |
|-----------|-------|-------------|-------------------|-------|
| `rate` | 0.5 | No (User Guide fn.7: "should not be changed") | Productivity sheet, rose-pink cell | |
| `turning_point` | 15 | Yes (User Guide fn.7: "This parameter can be adjusted") | Productivity sheet, rose-pink cell | Default 15; user can change in Excel |
| `oecd_growth_rate` | 1.1% or 1.2% | No | Productivity sheet | User Guide p.12 says 1.1%, p.27 says 1.2%. **Follow the Excel formulas** per source-of-truth hierarchy. Golden master resolves this. |

## Outputs

The function `productivity_country()` returns a Polars DataFrame with these columns:

| Column | Type | Description | Unit |
|--------|------|-------------|------|
| `years` | int | Year from 2009 to 2099 | -- |
| `productivity_growth_rate_percent` | float | Year-over-year productivity growth | % |
| `productivity_level` | float | Cumulative productivity level | US$2021 PPP |
| `productivity_level_oecd_percent` | float | Productivity relative to OECD | % |

### Downstream consumers
1. **`baseline_v1()`** -- Uses `productivity_growth_rate_percent` as a core input for the production function. During the WEO overlap years (2022-2029), baseline_v1 overwrites productivity with back-calculated values derived from WEO GDP growth and employment growth (SPEC 4.4 Phase 2 specifies `[WEO_MAX_YEAR - 6, WEO_MAX_YEAR]`). For years beyond WEO (2030+), uses the logistic convergence values directly.
2. **`calc_climate_scenario()`** -- Takes baseline productivity growth and subtracts the climate-induced GDP variation to get scenario-specific productivity growth: `productivity_growth_scenario(t) = productivity_growth_baseline(t) + climate_variation(t)`.
3. **UI / Charts** -- The Productivity worksheet in Excel shows two charts: (a) productivity growth rate trajectory, and (b) productivity level as % of OECD. These serve as a realism check for the user.

## Gotchas

### 1. Logistic convergence, NOT linear interpolation
Multiple sources incorrectly state this is linear:
- **PYTHON_REIMPLEMENTATION_GUIDE.md** (line 128): "Linear interpolation from start to end" and (line 385): "Linear productivity trend: Productivity growth interpolates linearly 2030-2099." These are **stale/incorrect**.
- **User Guide p.12 main text**: "gradually changing to the 'end' period assumption by the 2090s using a linear trajectory." This contradicts **footnote 7 on the same page**, which says "The productivity convergence trajectory is based on a logistics function."

The SPEC.md, footnote 7, and the Excel formulas all confirm a **logistic (sigmoid) convergence function** with `rate=0.5` and `turning_point=15`. Per the source-of-truth hierarchy (Excel > User Guide > SPEC), the logistic function is correct. Getting this wrong produces visibly different long-run trajectories and will fail golden master tests.

### 2. The exponent `^rate` on the sigmoid
The logistic function is: `start + (end - start) * (1 / (1 + exp(-rate * (counter - turning_point)))) ^ rate`. Note the `^rate` (i.e., `^0.5`) exponent applied to the sigmoid output. This is NOT a standard logistic function. It is an asymmetric logistic that converges faster from the top and slower toward the bottom. Missing this exponent will cause parity failures.

### 3. Counter is 1-indexed from WEO_MAX_YEAR
`counter = year - WEO_MAX_YEAR`, so for year 2030 (the first logistic projection year), counter = 1 (if WEO_MAX_YEAR=2029). If you use 0-indexed counting, the entire curve shifts by one year and parity will fail. **Verify at runtime:** the counter must produce logistic(counter=1) = ~4.89% at year 2030 to match the golden master.

### 4. WEO_MAX_YEAR: SPEC says 2028, Excel analysis says 2029
The SPEC (Section 3.3) annotates `WEO_MAX_YEAR = max(macrofiscal.years) -> 2028`. However, the Excel analysis documents consistently state "Historical period: 2001-2029, Projected: 2030-2099" and the User Guide (p.12) says the projection starts at 2029. The golden master confirms 2029 is the last WEO-derived year and 2030 is the first logistic year. **At runtime, compute `WEO_MAX_YEAR = max(macrofiscal.years)` -- do not hardcode.** If the macrofiscal parquet contains 2029, WEO_MAX_YEAR will be 2029 and the counter will be correct. The SPEC annotation "2028" is likely stale or refers to a different vintage of WEO data.

### 5. OECD growth rate: User Guide contradicts itself (1.1% vs 1.2%)
The User Guide has an internal contradiction:
- **p.12:** "OECD productivity continues to grow at **1.1 percent** per year that has been achieved between 1991-2022"
- **p.27:** "OECD productivity continues to grow at the **historical average rate of 1.2 percent**"

**Follow the Excel workbook formulas** per the source-of-truth hierarchy (Excel > User Guide). Examine the actual OECD growth rate value in the Productivity sheet. The golden master data will resolve the ambiguity -- verify which rate reproduces the `productivity_level_oecd_percent` column exactly.

### 6. Productivity during WEO years is derived, not assumed
During the WEO horizon (2022-2029), the productivity growth rate is **not** simply the `productivity_start` parameter. Per the User Guide (p.12): productivity is "derived for the period between 2022 and 2028 from the WEO projection of real GDP growth and the UN projection of the working-age population growth." The formula (SPEC 4.4 Phase 2): `productivity = (real_gdp_growth/100 - employment_growth/100) / (1 + employment_growth/100) * 100`. This derivation happens in baseline_v1's Phase 2 (the productivity module itself uses `productivity_start` as a placeholder per SPEC 4.2 step 3). The golden master intermediate CSV confirms WEO-period values differ from the start parameter (e.g., 2022=0.07%, 2023=1.14%, 2024=2.38%, 2029=2.47% vs. start=5.0%).

### 7. Some countries lack WDI productivity data
The user guide footnote 8 (p.13) lists ~20 economies without WB WDI productivity data (Andorra, Aruba, Dominica, Eritrea, etc.). For these countries, the module must handle missing data gracefully. Uganda is not one of them.

### 8. Historical data may have structural breaks
The WDI productivity data can have structural breaks or gaps. Uganda's data shows a spike in 2011 (+5.65%) and a dip in 2021 (-1.70%, pandemic effect). The module should not smooth or adjust these -- it passes them through as-is.

### 9. This module does NOT depend on the inflation module
Productivity is a real (not nominal) concept. It does not use inflation data. It only needs WDI historical data, macrofiscal GDP data (for WEO-period back-calculation), and the two user parameters.

### 10. Golden master row count
The intermediate golden master has 91 rows of data (years 2009-2099 inclusive). The function must return exactly this range.

### 11. Historical benchmarking aids (Table A and Table B) from User Guide pp.12-13
The User Guide (p.12) and Excel Productivity sheet (Figure 5, p.13) include:
- **Table A:** Average productivity growth rates over three periods using WB WDI data: 1991-2022, 2007-19 (GFC to pre-pandemic), and 2014-19 (five years to pre-pandemic cyclical peak). These help users contextualize the `productivity_start` parameter.
- **Table B:** Historical (1991-2021, 2007-19, 2014-19) productivity growth rates for country groupings (by World Bank income classification), helping users choose a plausible `productivity_end` convergence target.
These tables are reference data displayed in the Excel UI; they are not inputs to the logistic computation.

### 12. PYTHON_REIMPLEMENTATION_GUIDE.md is stale on productivity
The PYTHON_REIMPLEMENTATION_GUIDE.md (lines 128, 373, 385) states "linear interpolation" and "Linear productivity trend." This is **incorrect** -- the actual function is logistic. Treat this document as stale for productivity convergence. The SPEC.md and User Guide footnote 7 are authoritative.

## Fixture Path

- Intermediate: `tests/golden_masters/intermediate/productivity/uganda.csv`
- Final: `tests/golden_masters/final/uganda.csv`

### Golden master column mapping
The intermediate productivity fixture has exactly 4 columns:
```
years, productivity_growth_rate_percent, productivity_level, productivity_level_oecd_percent
```

### Key validation data points (from golden master)
| Year | Growth Rate (%) | Level (US$ PPP) | % of OECD |
|------|----------------|-----------------|-----------|
| 2009 | 3.97 | 6,502.49 | 6.68 |
| 2021 | -1.70 | 7,275.93 | 6.67 |
| 2028 | 2.57 | 9,757.15 | 8.35 |
| 2029 | 2.47 | 10,245.01 | 8.67 |
| 2030 | 4.89 | 10,745.51 | 9.00 |
| 2050 | 1.29 | 20,366.48 | 13.65 |
| 2070 | 1.20 | 25,890.66 | 13.89 |
| 2099 | 1.20 | 36,591.32 | 14.22 |

Note the jump from 2.47% (2029) to 4.89% (2030). This is because 2029 is the last WEO-derived year (back-calculated from WEO GDP growth and employment) and 2030 is the first pure logistic-convergence year with counter=1, starting near `productivity_start` (5.0%). This discontinuity is expected behavior -- it reflects the transition from WEO back-calculation to the user-specified productivity trajectory. The User Guide (p.12) explicitly states: "The productivity growth thus calculated in 2028 is the 'start' productivity growth rate -- that is, it is the productivity growth rate in 2029, the start of the Q-CRAFT projection period." This confirms the logistic formula begins producing values at 2030.
