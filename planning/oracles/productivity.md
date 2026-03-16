# Oracle Packet: productivity

## Economic Logic

The productivity module computes a long-run trajectory of **labor productivity growth** (GDP per employed person) from 2009 to 2099. It serves three purposes in Q-CRAFT:

1. **Historical record (2009-2021):** Load observed productivity levels from the World Bank WDI dataset and compute year-over-year growth rates.
2. **WEO overlap (2022-2028):** During the IMF WEO horizon, productivity growth is *derived* -- it is not an independent input. It is back-calculated from the WEO real GDP growth forecast and demographic employment growth. This happens in `baseline_v1`, not in this module. The productivity module simply carries forward the `productivity_start` rate for these years.
3. **Projection (2029-2099):** Apply a **logistic convergence function** that smoothly transitions the growth rate from `productivity_start` (default 5.0%) to `productivity_end` (default 1.2%) over the projection horizon. This is NOT linear interpolation.

The module also computes:
- **Productivity level** (cumulative, in constant US$2021 PPP): starting from the historical WDI level, compounded forward by the growth rate each year.
- **Productivity relative to OECD (%):** The country's productivity level expressed as a percent of a synthetic OECD benchmark that grows at a fixed 1.1% per year (the OECD historical average from 1991-2022; the user guide PDF p.12/p.27 cites 1.2% but the Excel uses 1.1% -- **follow the Excel**).

Downstream, productivity growth is a key input to the production function: `Real GDP = Productivity x Employment`. The baseline_v1 module uses productivity growth to decompose GDP growth and project real GDP forward. Climate scenarios then shock productivity growth to model GDP losses.

## Excel Source Sheets

### Productivity sheet (312 rows x 101 cols)
- **Row 1:** Headers -- `years` running from approximately 2001 to 2099 across columns.
- **Row 2:** `Productivity level (US$2021 PPP)` -- the historical and projected levels for the selected country. Historical data from WB WDI through 2021. WEO-period values (2022-2028) and projection values (2029-2099) are formula-computed.
- **Row 3:** `Productivity level (% of OECD)` -- the country's level as a percentage of the OECD benchmark.
- **Row 4:** `Productivity growth (%)` -- year-over-year growth rate. This is the primary output consumed by other modules.
- **Row 23:** User-overridable row -- users can hard-paste their own productivity trajectory here to override the logistic convergence formula.

### Dashboard sheet
- **Cell B20:** `productivity_start` (default 5.0%) -- the starting growth rate at the beginning of the projection period.
- **Cell B21:** `productivity_end` (default 1.2%) -- the long-run convergence target growth rate.
- The logistic function parameters `rate` (0.5) and `turning_point` (15) are hardcoded in the Productivity sheet formulas (rose-pink cells, not user-modifiable per the user guide footnote 7, p.12).

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

### 2. WEO-period growth rate (2022-2028)
In this module, use the `productivity_start` parameter directly as the growth rate. However, note that baseline_v1 will **overwrite** productivity growth for years in the range `[WEO_MAX_YEAR - 6, WEO_MAX_YEAR]` (i.e., 2023-2028) using a back-calculation from WEO real GDP growth and employment growth. The productivity module itself does not do this back-calculation.

IMPORTANT: Looking at the golden master data, the WEO-period values (2022-2028) in the intermediate productivity CSV show specific values that differ from the `productivity_start` default. For example, 2023 shows 1.14%, 2024 shows 2.38%, etc. These appear to be **derived from WEO real GDP** data during the overlap period. The exact mechanism: during WEO years, productivity growth = `(real_gdp_growth/100 - employment_growth/100) / (1 + employment_growth/100) * 100`. This derivation may happen inside the Productivity sheet itself (pulling from Macrofiscal and Demography data) rather than only in baseline_v1.

### 3. Logistic convergence function (2029-2099)
```
For each year t beyond WEO_MAX_YEAR (2028):
    counter = t - WEO_MAX_YEAR       # 1-indexed: 1 for 2029, 2 for 2030, etc.
    rate = 0.5                        # Fixed, not user-modifiable
    turning_point = 15                # Fixed, not user-modifiable

    growth(t) = productivity_start + (productivity_end - productivity_start)
                * ((1 / (1 + exp(-rate * (counter - turning_point)))) ^ rate)
```

With defaults (start=5.0, end=1.2, rate=0.5, turning_point=15):
- At counter=1 (year 2029): growth is close to `productivity_start` (5.0%)
- At counter=15 (year 2043): growth is near the inflection point (~2.7%)
- At counter=30+ (year 2058+): growth has converged close to `productivity_end` (1.2%)

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
| `productivity_start` | Dashboard B20 (default 5.0) | Starting productivity growth rate (%) at the beginning of projection |
| `productivity_end` | Dashboard B21 (default 1.2) | Long-run convergence target growth rate (%) |
| Historical productivity levels | `data/processed/productivity.parquet` | WB WDI data: GDP per employed person (constant 2021 US$ PPP), through 2021 |
| WEO-period macrofiscal data | `data/processed/macrofiscal.parquet` | Real GDP, GDP deflator for deriving productivity during WEO overlap |
| Demography data | Demography module output | Working-age population growth for employment derivation during WEO period |

### Hardcoded parameters (not user-modifiable)
| Parameter | Value | Location in Excel |
|-----------|-------|-------------------|
| `rate` | 0.5 | Productivity sheet, rose-pink cell |
| `turning_point` | 15 | Productivity sheet, rose-pink cell |
| `oecd_growth_rate` | 1.1% | Productivity sheet (user guide says 1.2% on p.27 but Excel uses 1.1%; **follow Excel**) |

## Outputs

The function `productivity_country()` returns a Polars DataFrame with these columns:

| Column | Type | Description | Unit |
|--------|------|-------------|------|
| `years` | int | Year from 2009 to 2099 | -- |
| `productivity_growth_rate_percent` | float | Year-over-year productivity growth | % |
| `productivity_level` | float | Cumulative productivity level | US$2021 PPP |
| `productivity_level_oecd_percent` | float | Productivity relative to OECD | % |

### Downstream consumers
1. **`baseline_v1()`** -- Uses `productivity_growth_rate_percent` as a core input for the production function. During the WEO overlap years (2023-2028), baseline_v1 overwrites this with a back-calculated value derived from WEO GDP growth and employment growth. For years beyond WEO (2029+), uses the logistic convergence values directly.
2. **`calc_climate_scenario()`** -- Takes baseline productivity growth and subtracts the climate-induced GDP variation to get scenario-specific productivity growth: `productivity_growth_scenario(t) = productivity_growth_baseline(t) + climate_variation(t)`.
3. **UI / Charts** -- The Productivity worksheet in Excel shows two charts: (a) productivity growth rate trajectory, and (b) productivity level as % of OECD. These serve as a realism check for the user.

## Gotchas

### 1. Logistic convergence, NOT linear interpolation
The PYTHON_REIMPLEMENTATION_GUIDE.md incorrectly states "Linear interpolation from start to end." The SPEC.md and the Excel tool both use a **logistic (sigmoid) convergence function** with `rate=0.5` and `turning_point=15`. The user guide PDF confirms this in footnote 7 on p.12. Getting this wrong produces visibly different long-run trajectories and will fail golden master tests.

### 2. The exponent `^rate` on the sigmoid
The logistic function is: `start + (end - start) * (1 / (1 + exp(-rate * (counter - turning_point)))) ^ rate`. Note the `^rate` (i.e., `^0.5`) exponent applied to the sigmoid output. This is NOT a standard logistic function. It is an asymmetric logistic that converges faster from the top and slower toward the bottom. Missing this exponent will cause parity failures.

### 3. Counter is 1-indexed from WEO_MAX_YEAR
`counter = year - WEO_MAX_YEAR`, so for year 2029 (the first projection year), counter = 1. For year 2028 (WEO_MAX_YEAR), counter = 0. If you use 0-indexed counting, the entire curve shifts by one year and parity will fail.

### 4. WEO_MAX_YEAR = 2028
The current IMF WEO dataset extends through 2028 (not 2029). The projection starts at year 2029. This is a derived constant from `max(macrofiscal.years)`.

### 5. OECD growth rate: Excel says 1.1%, user guide says 1.2%
The user guide PDF (p.12 and p.27) states OECD productivity grows at "1.1 percent per year" in one place and "the historical average rate of 1.2 percent" in another. **Follow the Excel workbook formulas** per the source-of-truth hierarchy. Examine the actual value in the Productivity sheet. The golden master data will resolve any ambiguity.

### 6. Productivity during WEO years is derived, not assumed
During the WEO horizon (2022-2028), the productivity growth rate is **not** simply the `productivity_start` parameter. It is derived from WEO real GDP growth and employment growth using: `productivity = (real_gdp_growth/100 - employment_growth/100) / (1 + employment_growth/100) * 100`. This derivation either happens within the Productivity sheet itself or in baseline_v1's Phase 2. The golden master intermediate CSV confirms WEO-period values differ from the start parameter (e.g., 2023=1.14%, 2024=2.38% vs. start=5.0%).

### 7. Some countries lack WDI productivity data
The user guide footnote 8 (p.13) lists ~20 economies without WB WDI productivity data (Andorra, Aruba, Dominica, Eritrea, etc.). For these countries, the module must handle missing data gracefully. Uganda is not one of them.

### 8. Historical data may have structural breaks
The WDI productivity data can have structural breaks or gaps. Uganda's data shows a spike in 2011 (+5.65%) and a dip in 2021 (-1.70%, pandemic effect). The module should not smooth or adjust these -- it passes them through as-is.

### 9. This module does NOT depend on the inflation module
Productivity is a real (not nominal) concept. It does not use inflation data. It only needs WDI historical data, macrofiscal GDP data (for WEO-period back-calculation), and the two user parameters.

### 10. Golden master row count
The intermediate golden master has 91 rows of data (years 2009-2099 inclusive). The function must return exactly this range.

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

Note the jump from 2.47% (2029) to 4.89% (2030). This is because 2029 is the last WEO-derived year and 2030 is the first pure logistic-convergence year starting near `productivity_start` (5.0%). This discontinuity is expected behavior -- it reflects the transition from WEO back-calculation to the user-specified productivity trajectory.
