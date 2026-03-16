# Oracle Packet: Demography

## Economic Logic

The demography module is the foundation of Q-CRAFT's long-term projection engine. It provides population projections that drive two critical downstream calculations:

1. **Employment growth** (post-WEO horizon): After the IMF WEO projection period ends (2028), employment growth is assumed to equal the growth rate of the working-age population (ages 15-64). This is the key linkage -- demography becomes the sole driver of labor supply growth in the long run.

2. **Primary expenditure growth**: Primary expenditure grows with total population (not working-age population), reflecting the idea that government spending per capita on public goods and services remains constant in real terms. The divergence between working-age and total population growth is economically significant -- countries experiencing aging (where total population grows faster than working-age population due to rising elderly shares) face fiscal pressure because expenditure grows faster than revenue.

The module takes UN World Population Prospects data for a selected country and demographic variant (Low/Medium/High), extracts population by age group, and computes the growth rates that downstream modules need.

The user's choice of demographic variant (Low/Medium/High) reflects different fertility assumptions from the UN projections. For most developing countries, the gap between High and Low variants widens dramatically over the projection horizon, making this one of the most consequential user choices in the entire tool.

## Excel Source Sheets

### Primary: "Demography" sheet (1,925 rows x 157 cols)

The Demography sheet contains UN World Population Prospects 2022 data organized as follows:

- **Columns A onward**: Years spanning 1950-2099 (approximately 150 columns of annual data)
- **Row structure**: Multiple blocks organized by demographic scenario and age group
  - Three scenario variants: Low, Medium, High
  - Within each variant, rows for age groups:
    - "Children" / "Below 15" (ages 0-14)
    - "Working age" (ages 15-64)
    - "Elderly" / "65+" (ages 65+)
  - Plus derived rows for dependency ratio
- **Units**: Population in thousands (this is standard UN WPP format)

### Secondary: "Dashboard" sheet

- **Cell B17**: Selected demographic scenario ("Low", "Medium", or "High")
- This value controls which rows of the Demography sheet are used

### Secondary: "Baseline" sheet

The Baseline sheet reads demography data via formulas:
- **Row 3** ("Input (Demography)"): Working age (15-64) population -- Level
  - Formula pattern: `=Demography!BK4` (references the Demography sheet, Medium scenario, 15-64 row)
- **Row 4** ("Input (Demography)"): Total Population -- Level
  - Formula pattern: `=Demography!BK5` (references the Demography sheet, Medium scenario, Total row)
- **Row 15** ("Calculation"): Population growth -- Per cent
  - Formula pattern: `=Demography!BK5/Demography!BJ5*100-100`
  - This computes `(total_pop(t) / total_pop(t-1)) * 100 - 100`

## Key Formulas

### 1. Filter and extract population data

From the raw Demography sheet, extract four series for the selected country and variant:
- `working_age_population`: Population aged 15-64 (in thousands)
- `total_population`: Total population (in thousands)
- The "0-14" and "65+" age groups are present in the sheet but only used for display (dependency ratio charts); they are NOT directly used in the engine calculation

### 2. Growth rate of working-age population

```
demography_growth_working_age(t) = (working_age_population(t) / working_age_population(t-1)) * 100 - 100
```

This is undefined (null) for the first year (2009). For subsequent years, it is the year-over-year percent change.

**This drives employment growth post-WEO.** In the Baseline sheet (row 7), for years > WEO_MAX_YEAR (2028):
```
employment_growth(t) = (working_age_pop(t) / working_age_pop(t-1)) * 100 - 100
```
Which is exactly `demography_growth_working_age(t)`.

### 3. Growth rate of total population

```
demography_growth_total(t) = (total_population(t) / total_population(t-1)) * 100 - 100
```

This is undefined (null) for the first year (2009). For subsequent years, it is the year-over-year percent change.

**This drives primary expenditure growth post-WEO.** In the Baseline sheet (row 15):
```
population_growth(t) = (total_pop(t) / total_pop(t-1)) * 100 - 100
```
This is used in the expenditure growth formula: `primary_expenditure(t) = primary_expenditure(t-1) * (1 + productivity_growth/100) * (1 + inflation/100) * (1 + total_population_growth/100)`

### 4. Working-age share (for display/analysis)

```
working_age_share(t) = working_age_population(t) / total_population(t) * 100
```

This is a derived metric used in charts and the Demography sheet's "Share" charts. It shows the demographic dividend or drag.

### 5. Dependency ratio (for display/analysis)

```
dependency_ratio(t) = (total_population(t) - working_age_population(t)) / working_age_population(t)
```

Or equivalently: `(children + elderly) / working_age`. This is displayed in the Demography sheet charts but is NOT used in the engine calculations.

## Inputs

| Input | Source | Description |
|-------|--------|-------------|
| `iso3c` | User selection (Dashboard C12) | 3-letter ISO country code |
| `level` | User selection (Dashboard B17) | Demographic variant: "Medium", "High", or "Low" |
| `DEMOGRAPHY` parquet/data | Extracted from "Demography" Excel sheet | Raw population data: iso3c, years, age_group, status (variant), values |

The raw demography data as extracted to Parquet is expected to be in long format with columns like:
- `iso3c`: Country code
- `country`: Country name
- `years`: Integer year
- `age_group`: One of "15-64", "Total", "0-14", "65+"
- `status`: One of "Medium", "High", "Low"
- `values`: Population in thousands

## Outputs

The `demography_country()` function returns a Polars DataFrame with these columns:

| Column | Type | Description | Used By |
|--------|------|-------------|---------|
| `years` | Int | Year (2009-2099) | All downstream |
| `working_age_population` | Float | Population aged 15-64, in thousands | `baseline_v1` (employment growth post-WEO) |
| `total_population` | Float | Total population, in thousands | `baseline_v1` (population growth for expenditure) |
| `demography_growth_working_age` | Float | YoY growth rate of working-age pop (%) | `baseline_v1` (row 7: employment growth) |
| `demography_growth_total` | Float | YoY growth rate of total pop (%) | `baseline_v1` (row 15: population growth), `baseline_country` (expenditure growth) |

### Downstream consumers:

1. **`baseline_v1()`** (SPEC section 4.4): Uses `working_age_population` to compute employment growth post-WEO. Uses `total_population` growth for the population_growth column (Baseline row 15). Population growth feeds into primary expenditure growth.

2. **`baseline_country()`** (SPEC section 4.6): Uses `demography_growth_total` (total population growth) in the multiplicative expenditure growth formula: `primary_expenditure(t) = primary_expenditure(t-1) * (1+productivity/100) * (1+inflation/100) * (1+total_pop_growth/100)`.

3. **Climate scenario sheets** (`calc_climate_scenario()`, SPEC section 4.7): Inherit demography from the baseline -- climate change does NOT alter demographic projections in Q-CRAFT.

## Gotchas

### 1. Working-age vs. total population -- the critical distinction

Revenue (and nominal GDP) grows with **working-age** population growth (via employment growth). Primary expenditure grows with **total** population growth. This asymmetry is the demographic mechanism in Q-CRAFT. Getting this wrong (e.g., using total population for both, or working-age for both) will produce wrong fiscal results that may look plausible but will fail parity tests.

- Working-age pop growth drives: employment --> real GDP --> nominal GDP --> revenue
- Total pop growth drives: primary expenditure

### 2. Year range starts at 2009, NOT 1950

The Demography Excel sheet contains data from 1950-2099, but the engine only uses years >= 2009 (YEAR_START). The SPEC says: "Filter DEMOGRAPHY data for country, selected variant, years >= 2009." The golden master CSV confirms this: it starts at year 2009.

### 3. Growth rates are null for the first year

The golden master CSV shows that `demography_growth_working_age` and `demography_growth_total` are empty/null for year 2009 (the first year). This is correct -- you cannot compute a growth rate without a prior year. Do NOT fill this with 0; leave it as null.

### 4. Population units: thousands

UN WPP data is typically in thousands of persons. The golden master confirms Uganda 2009 working-age population = 15,169 (thousands), i.e., ~15.2 million people. The Excel Demography sheet uses the same units. Do not accidentally multiply or divide by 1000.

### 5. No logistic convergence -- this is pure data lookup

Unlike the productivity and inflation modules which use a logistic convergence function for projection years, the demography module is a pure data extraction. The UN WPP already provides projections through 2099 under all three variants. There is no formula to "project" population -- it is simply read from the data.

### 6. Age group naming may vary

In the raw Excel data, age groups might be labeled differently than expected. Check for:
- "15-64" vs "Working age" vs "working_age"
- "Total" vs "total" vs "All ages"
- "0-14" vs "Below 15" vs "Children"
- "65+" vs "Elderly" vs "65 and over"

The extraction script must normalize these to consistent names.

### 7. Demography is scenario-invariant across climate scenarios

Climate change does NOT alter population projections in Q-CRAFT. All climate scenarios (Paris through Hot Unadapted) use the same demographic data as the baseline. Only the user's choice of Low/Medium/High variant changes the demographics. This is a deliberate simplification noted in the User Guide.

### 8. The Baseline sheet formula references are positional, not named

The Baseline sheet references the Demography sheet by cell position (e.g., `=Demography!BK4`), which means the column offset depends on the year. Column BK in the Demography sheet corresponds to a specific year. The Python reimplementation does not need to replicate this lookup mechanism -- it uses the extracted Parquet data directly. But when validating against Excel, be aware that the Baseline sheet picks up demography values via these positional references.

### 9. CLAUDE.md domain rules that apply to demography

- **Rule 5**: Golden master tests are the source of truth. Never hard-code expected values. Always load from CSV.
- **Rule 6**: Intermediate golden masters catch compensating errors. The demography golden master is an intermediate check -- verify its columns before moving to baseline_v1.
- **Source of truth hierarchy**: Excel workbook formulas > Parquet data > User guide > SPEC.md > Agent reasoning. If the golden master CSV disagrees with the SPEC description, the golden master wins.

### 10. The dependency ratio and age shares are for display only

The Demography Excel sheet calculates dependency ratios and population shares by age group. These appear in the sheet's charts (Figure 4 in the User Guide). However, the engine module does NOT need to compute or return these unless they are needed for the UI. The golden master CSV does NOT include dependency ratio columns -- only `years`, `working_age_population`, `total_population`, `demography_growth_working_age`, and `demography_growth_total`.

### 11. Growth rate formula precision

The growth rate formula is: `(pop(t) / pop(t-1)) * 100 - 100`, NOT `(pop(t) - pop(t-1)) / pop(t-1) * 100`. Both are mathematically equivalent, but use the form that matches the Excel formulas exactly to avoid floating-point discrepancies. The Excel Baseline sheet row 15 uses: `=Demography!BK5/Demography!BJ5*100-100`.

### 12. User Guide says "1950-2100" but golden master ends at 2099

The User Guide (p.10) says demography data spans "1950-2100" and the Demography sheet has data through that range. However, the projection horizon in Q-CRAFT is 2009-2099 (YEAR_END = 2100 in the SPEC but the last year in the golden master is 2099). Verify: is the last year 2099 or 2100? The golden master CSV ends at 2099. Follow the golden master.

## Fixture Path

- Intermediate: `tests/golden_masters/intermediate/demography/uganda.csv`
- Final: `tests/golden_masters/final/uganda.csv`

### Golden master column inventory (from `uganda.csv`):

```
years,working_age_population,total_population,demography_growth_working_age,demography_growth_total
```

- 91 rows of data (2009-2099)
- `working_age_population`: Integer values in thousands (e.g., 15169 for 2009)
- `total_population`: Integer values in thousands (e.g., 31413 for 2009)
- `demography_growth_working_age`: Float percentage (e.g., 3.4478... for 2010), null for 2009
- `demography_growth_total`: Float percentage (e.g., 2.9574... for 2010), null for 2009

### Sample values for spot-checking:

| Year | working_age_pop | total_pop | growth_working_age | growth_total |
|------|----------------|-----------|-------------------|-------------|
| 2009 | 15,169 | 31,413 | (null) | (null) |
| 2010 | 15,692 | 32,342 | 3.4478 | 2.9574 |
| 2028 | 30,979 | 55,501 | 3.4219 | 2.6390 |
| 2050 | 57,115 | 87,622 | 2.1059 | 1.6673 |
| 2099 | 87,159 | 131,840 | 0.0976 | 0.2349 |

Note for 2099: Working-age growth (0.098%) is much lower than total population growth (0.235%), reflecting an aging Uganda where the elderly share is growing. This is the demographic drag that causes expenditure-to-GDP ratios to rise over time in the baseline.
