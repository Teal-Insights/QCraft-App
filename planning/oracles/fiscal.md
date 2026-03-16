# Oracle Packet: fiscal (baseline_country)

> **This is the most complex module in Q-CRAFT.** It implements the recursive fiscal
> projection engine: revenue, expenditure, debt dynamics, fiscal rule feedback, and
> derived indicators. Every variable depends on the prior year's state. An error in
> year t propagates to every year after t.

---

## Economic Logic

The fiscal module (`baseline_country`) takes the macroeconomic projections produced by
`baseline_v1` (real/nominal GDP, employment, productivity, inflation, population) and
the interest rate profile from `interest_rate_country`, then projects government
finances from 2009 through 2099 (or the user-selected end year).

**What it computes and why:**

1. **Revenue projection.** Government revenue is assumed to maintain a constant ratio to
   nominal GDP after the WEO horizon. This means revenue grows at the same rate as
   nominal GDP. The economic intuition: tax policy does not change, so the effective
   tax rate (revenue/GDP) stays fixed. During the WEO period, actual historical
   revenue data is used.

2. **Primary expenditure projection (with rigidity).** Primary expenditure (total
   spending minus interest payments) grows multiplicatively by three factors:
   productivity growth, inflation, and total population growth. The economic intuition:
   the government maintains the real value of goods and services per citizen, plus
   benefits from economy-wide productivity gains. Note that expenditure uses *total*
   population growth (not working-age), while revenue uses *nominal GDP* growth (which
   depends on working-age population). This asymmetry is a key driver of long-run
   fiscal pressure in countries with aging populations.

3. **Primary balance.** Simply revenue minus primary expenditure. A negative primary
   balance (deficit) puts upward pressure on debt.

4. **Interest expenditure.** The cost of servicing existing debt: prior-year debt stock
   multiplied by the current-year nominal interest rate divided by 100. This is
   computed from the *level* of debt (in LCU billions), not from debt-to-GDP.

5. **Debt dynamics (the core recursive equation).** The debt-to-GDP ratio evolves as:
   `d(t) = d(t-1) * (1 + i(t)/100) / (1 + g(t)/100) - pb(t)`
   where `d` is debt-to-GDP, `i` is the nominal interest rate, `g` is nominal GDP
   growth, and `pb` is the primary balance as a share of GDP. In the baseline, this is
   floored at zero: `d(t) = max(0, ...)`. In climate scenarios, the floor is NOT
   applied.

6. **Debt level.** `debt(t) = debt_to_gdp(t) / 100 * nominal_gdp(t)`. This is derived
   from the ratio, not computed independently.

7. **Fiscal rule feedback loop.** If the user enables the fiscal rule ("Yes") and sets a
   debt target, Q-CRAFT computes how much expenditure must be adjusted to stabilize
   debt at that target. The adjustment (fiscal_gap in LCU levels) is applied to
   *next year's* primary expenditure (additive, in levels). The rule activates only
   when debt is rising above the target or falling below it.

8. **Debt-Stabilizing Primary Balance (DSPB).** The primary balance that would keep the
   debt-to-GDP ratio unchanged from the prior year:
   `dspb(t) = d(t-1) * (i(t) - g(t)) / 100 / (1 + g(t)/100)`
   This tells policymakers: "If your primary balance equals this number, debt/GDP
   stays flat."

9. **Fiscal gap.** The difference between the actual primary balance (% GDP) and the
   DSPB, converted to LCU levels:
   `fiscal_gap(t) = (pb_pct_gdp(t) - dspb(t)) / 100 * nominal_gdp(t)`
   A positive fiscal gap means the country has fiscal space (primary balance exceeds
   what is needed to stabilize debt). A negative fiscal gap means consolidation is
   needed.

---

## Excel Source Sheets

The fiscal calculations live in the **Baseline** sheet of the Excel workbook
(`qcraft-toolv10.xlsx`). The sheet has 51 rows and 96 columns (years 2009-2099+).

**Row map (Baseline sheet):**

| Row(s)  | Content                                      | Units     |
|---------|----------------------------------------------|-----------|
| 3-7     | Inputs pulled from blue sheets (demography, macrofiscal) | Various |
| 8-14    | Calculated macro variables (employment, productivity, GDP growth, deflator, population growth) | Per cent |
| 15-17   | Fiscal ratios: Revenue, Total Expenditure, Interest Expenditure (% NGDP) | % NGDP |
| 18-20   | Fiscal ratios: Primary Expenditure, Primary Balance, Overall Balance (% NGDP) | % NGDP |
| 21      | Revenue (% NGDP) -- repeated/reference | % NGDP |
| 22      | Total Expenditure (% NGDP) | % NGDP |
| 23      | Interest Expenditure (% NGDP) | % NGDP |
| 25      | Revenue (Level, LCU billions) | Level |
| 26      | Total Expenditure (Level) | Level |
| 27      | Interest Expenditure (Level) | Level |
| 28      | Primary Expenditure (Level) | Level |
| 29-30   | Primary Balance, Overall Balance (Level) | Level |
| 33      | Nominal Interest Rate (%) | Per cent |
| 35      | Debt-to-GDP ratio (%) | Per cent |
| 36      | Debt (Level, LCU billions) | Level |
| 37      | Debt-Stabilizing Primary Balance (DSPB) (% NGDP) | % NGDP |
| 38-39   | Fiscal rule trajectory / fiscal rule value | Various |
| 40      | Fiscal Gap (Level, LCU billions) | Level |

**Key column ranges:** Columns B through CS (approximately), mapping to years 2009 through 2099.

**During the WEO period (years <= WEO_MAX_YEAR = 2028):**
- Revenue, expenditure, balances, and debt are pulled directly from the Macrofiscal
  input sheet (historical/WEO projection data).
- Formulas reference `=Macrofiscal!...` cells.

**Beyond WEO (years > 2028):**
- All fiscal variables are computed recursively using the formulas described below.

---

## Key Formulas

### Historical / WEO Period (years <= WEO_MAX_YEAR)

All fiscal data comes directly from the macrofiscal Parquet/input data. No
computation is needed -- just look up the values by country and year.

Revenue, primary expenditure, primary balance, overall balance, interest expenditure,
and debt are all read from the macrofiscal data in both level and % GDP forms.

### Projection Period (years > WEO_MAX_YEAR)

The following formulas must be computed **in sequence for each year t**, using the
result from year t-1. This is a for-loop, not a vectorized operation.

#### Step 1: Revenue

```
revenue(t) = revenue(t-1) * (1 + nominal_gdp_growth(t) / 100)
revenue_percent_gdp(t) = revenue(t) / nominal_gdp(t) * 100
```

Revenue grows at the nominal GDP growth rate, keeping the revenue-to-GDP ratio
constant. The `nominal_gdp_growth(t)` comes from `baseline_v1` output.

#### Step 2: Primary Expenditure (MULTIPLICATIVE growth)

```
primary_expenditure(t) = primary_expenditure(t-1)
    * (1 + labour_productivity_growth(t) / 100)
    * (1 + inflation(t) / 100)
    * (1 + total_population_growth(t) / 100)
    + fiscal_rule_value(t-1)
```

**CRITICAL:** The three growth factors are multiplied together, NOT added:
`(1+a) * (1+b) * (1+c)`, NOT `(1 + a + b + c)`.

The `fiscal_rule_value(t-1)` is an additive adjustment in LCU level terms, applied
AFTER the multiplicative growth. It is NOT a rate. It is zero when the fiscal rule is
off ("No") or when the rule does not trigger.

**Growth factor sources:**
- `labour_productivity_growth(t)` -- from `baseline_v1` output
- `inflation(t)` -- from `inflation_country` output (also in `baseline_v1` as
  `gdp_deflator_growth_percent`)
- `total_population_growth(t)` -- from `baseline_v1` output (the `population_growth`
  column, which uses *total* population, not working-age)

```
primary_expenditure_percent_gdp(t) = primary_expenditure(t) / nominal_gdp(t) * 100
```

#### Step 3: Primary Balance

```
primary_balance(t) = revenue(t) - primary_expenditure(t)
primary_balance_percent_gdp(t) = primary_balance(t) / nominal_gdp(t) * 100
```

#### Step 4: Debt-to-GDP Ratio (THE CORE RECURSIVE EQUATION)

```
debt_to_gdp(t) = max(0,
    debt_to_gdp(t-1) * (1 + nominal_interest_rate(t) / 100)
                     / (1 + nominal_gdp_growth(t) / 100)
    - primary_balance_percent_gdp(t)
)
```

**BASELINE ONLY: Apply `max(0, ...)`.**
Climate scenarios do NOT apply this floor. This is a critical asymmetry.

The `nominal_interest_rate(t)` comes from the `interest_rate_country` output.

#### Step 5: Debt Level

```
debt(t) = debt_to_gdp(t) / 100 * nominal_gdp(t)
```

Debt level is derived from the ratio, not computed independently.

#### Step 6: Interest Expenditure

```
interest_expenditure(t) = debt(t-1) * nominal_interest_rate(t) / 100
interest_expenditure_percent_gdp(t) = interest_expenditure(t) / nominal_gdp(t) * 100
```

Note: uses **prior-year debt level** `debt(t-1)` times **current-year interest rate**.

#### Step 7: Total Expenditure and Overall Balance

```
total_expenditure(t) = primary_expenditure(t) + interest_expenditure(t)
overall_balance(t) = revenue(t) - total_expenditure(t)
overall_balance_percent_gdp(t) = overall_balance(t) / nominal_gdp(t) * 100
```

#### Step 8: Debt-Stabilizing Primary Balance (DSPB)

```
dspb(t) = debt_to_gdp(t-1)
    * (nominal_interest_rate(t) - nominal_gdp_growth(t)) / 100
    / (1 + nominal_gdp_growth(t) / 100)
```

Note: uses `debt_to_gdp(t-1)` -- the **prior year's** debt-to-GDP ratio.

DSPB is only defined for projection years. It is blank/NaN for the first year (2009)
and may also be blank for 2010 (the first year where t-1 data exists is the second
year in the series). In the golden master, DSPB begins being populated from 2010
onward.

#### Step 9: Fiscal Gap

```
fiscal_gap(t) = (primary_balance_percent_gdp(t) - dspb(t)) / 100 * nominal_gdp(t)
```

The fiscal gap is in LCU level terms. Positive = fiscal space, negative = need for
consolidation. In the golden master, fiscal_gap is blank for years before the fiscal
rule becomes relevant (typically before WEO_MAX_YEAR - 2 or so, and always blank for
2009).

#### Step 10: Fiscal Rule Value (feedback loop)

```
if fiscal_rule == "No":
    fiscal_rule_value(t) = 0
else:
    debt_trajectory = 1 if debt_to_gdp(t) > debt_to_gdp(t-1) else 2
    # 1 = rising, 2 = falling

    if debt_trajectory == 1 and debt_to_gdp(t) > debt_target:
        # Debt is rising AND above target -> activate rule (cut spending)
        fiscal_rule_value(t) = fiscal_gap(t)
    elif debt_trajectory == 2 and debt_to_gdp(t) < debt_target:
        # Debt is falling AND below target -> activate rule (increase spending)
        fiscal_rule_value(t) = fiscal_gap(t)
    else:
        fiscal_rule_value(t) = 0
```

The fiscal_rule_value(t) is applied to expenditure at time t+1 (i.e., the NEXT
year's primary expenditure calculation uses fiscal_rule_value(t-1)).

**Key behavior:** The fiscal rule creates a feedback loop:
- fiscal_gap depends on primary_balance and dspb
- primary_balance depends on primary_expenditure
- primary_expenditure depends on fiscal_rule_value from the prior year
- fiscal_rule_value depends on fiscal_gap

This loop is resolved naturally by the sequential for-loop: compute everything for
year t, then move to year t+1.

---

## Inputs

| Input | Source | Columns Used |
|-------|--------|-------------|
| `data_baseline` (DataFrame) | `baseline_v1()` output | `years`, `nominal_gdp`, `nominal_gdp_growth_percent`, `real_gdp`, `real_gdp_growth_percent`, `employment_growth`, `labour_productivity_growth`, `gdp_deflator_growth_percent`, `population_growth` |
| `data_interest` (DataFrame) | `interest_rate_country()` output | `years`, `nominal_interest_rate`, `inflation`, `nominal_gdp_growth_percent` |
| `data_macrofiscal` (DataFrame) | Loaded from `macrofiscal.parquet` | `iso3c`, `years`, `revenue` (level), `expenditure` (level), `interest_expenditure` (derived), `primary_balance` (level), `overall_balance` (level), `debt` (level & % GDP), `nominal_gdp`, and corresponding `_percent_gdp` columns |
| `debt_target` (float) | User parameter | Default: 60 (percent of GDP) |
| `fiscal_rule` (str) | User parameter | "Yes" or "No" (default: "Yes") |
| `iso3c` (str) | User parameter | Country ISO3 code (e.g., "UGA") |

**Macrofiscal data notes:**
- Historical fiscal data (WEO period) provides: revenue, expenditure, overall_balance,
  primary_balance, debt -- all in both LCU level and % GDP forms.
- Interest expenditure during the WEO period is derived as:
  `interest_expenditure = overall_balance - primary_balance` (i.e., the difference
  between overall and primary balance, with appropriate sign handling) or equivalently
  `interest_expenditure = total_expenditure - primary_expenditure`.
- In the Excel: `interest_expenditure = primary_balance - overall_balance` because
  overall_balance is more negative than primary_balance by the amount of interest
  expense.

---

## Outputs

The function returns a single Polars DataFrame with columns:

| Column | Description | Units |
|--------|-------------|-------|
| `years` | Year (2009-2099) | int |
| `revenue` | Government revenue | LCU billions |
| `revenue_percent_gdp` | Revenue as share of GDP | % |
| `primary_expenditure` | Primary expenditure (excl. interest) | LCU billions |
| `primary_expenditure_percent_gdp` | Primary expenditure as share of GDP | % |
| `primary_balance` | Revenue minus primary expenditure | LCU billions |
| `primary_balance_percent_gdp` | Primary balance as share of GDP | % |
| `interest_expenditure` | Interest payments on debt | LCU billions |
| `interest_expenditure_percent_gdp` | Interest payments as share of GDP | % |
| `total_expenditure` | Primary expenditure + interest expenditure | LCU billions |
| `overall_balance` | Revenue minus total expenditure | LCU billions |
| `overall_balance_percent_gdp` | Overall balance as share of GDP | % |
| `debt_to_gdp` | Debt-to-GDP ratio | % |
| `debt` | Government debt stock | LCU billions |
| `debt_stabilizing_primary_balance` | DSPB | % NGDP |
| `fiscal_gap` | Fiscal gap | LCU billions |

**Downstream consumers:**
- `calc_climate_scenario()` reads the baseline fiscal output to compute climate
  scenario fiscal projections. It needs the baseline primary expenditure levels and
  primary expenditure % GDP for the recalibration calculation.
- The Shiny UI reads the fiscal output for all baseline tab charts and value boxes.
- The final golden master test (`tests/golden_masters/final/uganda.csv`) compares
  `revenue_percent_gdp`, `primary_expenditure_percent_gdp`,
  `primary_balance_percent_gdp`, `interest_expenditure_percent_gdp`,
  `overall_balance_percent_gdp`, and `debt_to_gdp` across all 7 scenarios.

---

## Gotchas

This section is intentionally long. The fiscal module has more failure modes than any
other module in Q-CRAFT.

### G1. MUST use explicit Python for-loop -- NO vectorized Polars

**CLAUDE.md Rule 1 (verbatim):**
> "Fiscal recursion uses explicit Python for-loops, never vectorized Polars operations.
> Row-by-row iteration with t-1 lookups. This is non-negotiable."

The debt dynamics equation creates a true recursive dependency: `d(t)` depends on
`d(t-1)`, which depends on `d(t-2)`, etc. You CANNOT use Polars `.shift()`,
`.cum_sum()`, `.cumulative_eval()`, or `.map_elements()` for this. You must use a
plain Python for-loop iterating year by year.

The same applies to the fiscal rule feedback loop: `fiscal_rule_value(t)` depends on
`fiscal_gap(t)` which depends on `primary_balance(t)` which depends on
`fiscal_rule_value(t-1)`.

### G2. Expenditure growth is MULTIPLICATIVE, not additive

**CLAUDE.md Rule 2 (verbatim):**
> "Expenditure growth is multiplicative: (1+a)*(1+b)*(1+c). Never additive. Never try
> to 'fix' the dimensional inconsistency in fiscal adjustment -- the design is
> intentional."

WRONG: `primary_exp(t) = primary_exp(t-1) * (1 + productivity + inflation + pop_growth)`
RIGHT: `primary_exp(t) = primary_exp(t-1) * (1 + productivity/100) * (1 + inflation/100) * (1 + pop_growth/100)`

The difference is small for low rates but compounds over 70 years. It WILL cause
golden master test failures.

### G3. Debt floor asymmetry -- baseline applies max(0), climate does NOT

**CLAUDE.md Rule 3 (verbatim):**
> "Debt floor asymmetry: Baseline applies max(0, debt). Climate scenarios do NOT. This
> is a critical domain rule. Check it in tests."

In the baseline `debt_to_gdp(t) = max(0, ...)`. In climate scenarios, the debt-to-GDP
ratio can go negative (which is economically implausible but matches the Excel). This
matters for countries that start with very low debt.

### G4. Expenditure rigidity semantics

**CLAUDE.md Rule 4 (verbatim):**
> "Expenditure rigidity 1.0 = sticky (worst case), 0.0 = flexible. Do not confuse this
> scale with other indexes."

In the baseline module, expenditure rigidity is NOT used (it only applies in climate
scenarios). But the fiscal module must produce the output that the climate module
reads, so the column names and semantics must be consistent.

- rigidity = 1.0: expenditure stays at baseline LCU level (worst case for fiscal
  balance under climate change, because GDP falls but spending does not)
- rigidity = 0.0: expenditure adjusts to maintain baseline expenditure-to-GDP ratio
  (best case)

### G5. Fiscal rule value is additive in LEVELS, not a rate

The fiscal_rule_value is in LCU billions. It is added to the primary expenditure
level AFTER the multiplicative growth factors are applied:

```
primary_exp(t) = primary_exp(t-1) * (1+a) * (1+b) * (1+c) + fiscal_rule_value(t-1)
```

Do NOT try to make this dimensionally consistent. The fiscal rule adjustment is an
absolute LCU amount that shifts the expenditure level. This is how the Excel works.

### G6. Fiscal rule uses LAGGED fiscal gap

The fiscal_rule_value computed at time t is applied to primary expenditure at time
t+1. In the for-loop:
- Compute fiscal_gap(t) and fiscal_rule_value(t) at the end of year t
- Use fiscal_rule_value(t) when computing primary_expenditure(t+1)

This lag means the fiscal rule never perfectly achieves the debt target -- it
asymptotically approaches it. This is by design (per the User Guide: "As the process
of fiscal adjustment involves lags, the debt ceiling target is never precisely
achieved").

### G7. Interest expenditure uses PRIOR-YEAR debt

```
interest_expenditure(t) = debt(t-1) * nominal_interest_rate(t) / 100
```

NOT `debt(t)`. The government pays interest on last year's debt stock.

### G8. Revenue uses nominal GDP growth, expenditure uses different drivers

Revenue and expenditure grow at DIFFERENT rates:
- Revenue: grows at `nominal_gdp_growth(t)` (driven by working-age population,
  productivity, and inflation)
- Expenditure: grows at `productivity(t) * inflation(t) * total_population(t)` (driven
  by total population, productivity, and inflation)

The difference between working-age population growth and total population growth is
what causes the primary expenditure-to-GDP ratio to diverge from the revenue-to-GDP
ratio over time. This is the core demographic fiscal pressure mechanism.

### G9. DSPB formula uses prior-year debt-to-GDP

```
dspb(t) = debt_to_gdp(t-1) * (interest_rate(t) - gdp_growth(t)) / 100
           / (1 + gdp_growth(t) / 100)
```

Both `interest_rate(t)` and `gdp_growth(t)` are current-year values, but
`debt_to_gdp(t-1)` is the prior year. Do not confuse the time subscripts.

### G10. Fiscal gap sign convention

A POSITIVE fiscal gap means fiscal space (primary balance exceeds DSPB -- debt is
falling faster than needed or the country has room to loosen policy). A NEGATIVE
fiscal gap means fiscal consolidation is needed.

In the golden master for Uganda, fiscal_gap first appears as a non-empty value around
year 2026 and is positive (Uganda has fiscal space under default assumptions with the
fiscal rule on).

### G11. Blank / NaN values in early years

In the golden master:
- `debt_stabilizing_primary_balance` is blank for 2009 (no t-1 data)
- `fiscal_gap` is blank for 2009 and for several early years where the fiscal rule
  hasn't started being evaluated

Do not fill these with zeros. They should be null/NaN.

### G12. WEO transition: interest expenditure during historical period

During the WEO period, interest expenditure is derived from the macrofiscal data:
```
interest_expenditure = primary_balance - overall_balance
```
(because overall_balance = primary_balance - interest_expenditure)

Or equivalently:
```
interest_expenditure = total_expenditure - primary_expenditure
```

Make sure the sign convention is correct. In the golden master, interest expenditure
is always positive (it is a cost), and overall_balance is more negative than
primary_balance.

### G13. Debt-to-GDP during WEO comes from macrofiscal data

During the WEO period, `debt_to_gdp` and `debt` are read directly from macrofiscal
data. They are NOT computed from the debt dynamics equation. The recursive computation
only begins at `WEO_MAX_YEAR + 1` (year 2029 in the current data).

### G14. Order of operations within each year

For each year t > WEO_MAX_YEAR, compute in this exact order:
1. Revenue (depends only on t-1 revenue and current GDP growth)
2. Primary expenditure (depends on t-1 expenditure, current growth rates, and t-1
   fiscal rule value)
3. Primary balance (= revenue - primary expenditure)
4. Debt-to-GDP ratio (depends on t-1 debt ratio, current interest rate, current GDP
   growth, current primary balance % GDP)
5. Debt level (= debt_to_gdp * nominal_gdp / 100)
6. Interest expenditure (depends on t-1 debt level and current interest rate)
7. Total expenditure and overall balance
8. DSPB (depends on t-1 debt ratio, current interest and growth rates)
9. Fiscal gap (depends on current primary balance and current DSPB)
10. Fiscal rule value (depends on current debt trajectory and fiscal gap)

Getting this order wrong will cause subtle off-by-one errors.

### G15. Golden master tests are the source of truth

**CLAUDE.md Rule 5 (verbatim):**
> "Golden master tests are the source of truth for parity. Never hard-code expected
> values. Always load from CSV."

Load expected values from
`tests/golden_masters/intermediate/fiscal/uganda.csv` and compare.

**CLAUDE.md Rule 6 (verbatim):**
> "Intermediate golden masters catch compensating errors. An agent can get the right
> final answer by making two opposite mistakes. Tests must verify intermediate columns
> too."

Test ALL 16 columns, not just debt_to_gdp. Two bugs can cancel out in debt_to_gdp
while being visible in revenue or expenditure separately.

### G16. Fiscal rule trajectory detection

The debt trajectory check is:
```python
debt_trajectory = 1 if debt_to_gdp(t) > debt_to_gdp(t-1) else 2
```
- 1 = debt is rising
- 2 = debt is falling or unchanged

This is NOT a derivative or growth rate -- it is a simple level comparison.

### G17. Units consistency

All level variables (revenue, expenditure, debt, fiscal_gap) are in **LCU billions**.
All ratio variables (*_percent_gdp, debt_to_gdp) are in **percent** (not fractions).
Interest rate and GDP growth from upstream modules are also in **percent**.

When dividing, remember to divide by 100 where needed:
- `debt_to_gdp / 100 * nominal_gdp` gives debt in LCU billions
- `interest_rate / 100 * debt` gives interest expenditure in LCU billions
- `primary_balance / nominal_gdp * 100` gives primary balance as % GDP

---

## Fixture Path

- **Intermediate:** `tests/golden_masters/intermediate/fiscal/uganda.csv`
  - 92 rows (years 2009-2099 inclusive, plus header = 91 data rows)
  - 16 columns: years, revenue, revenue_percent_gdp, primary_expenditure,
    primary_expenditure_percent_gdp, primary_balance, primary_balance_percent_gdp,
    interest_expenditure, interest_expenditure_percent_gdp, total_expenditure,
    overall_balance, overall_balance_percent_gdp, debt_to_gdp, debt,
    debt_stabilizing_primary_balance, fiscal_gap

- **Final:** `tests/golden_masters/final/uganda.csv`
  - Contains all 7 scenarios (Baseline + 6 climate) at all years
  - Columns: scenario, year, revenue_percent_gdp, primary_expenditure_percent_gdp,
    primary_balance_percent_gdp, interest_expenditure_percent_gdp,
    overall_balance_percent_gdp, debt_to_gdp
  - Only % GDP ratios and debt_to_gdp are compared in the final test (not levels)

**Uganda golden master defaults (for baseline):**
- Country: Uganda (UGA)
- Demography: Medium
- Productivity start: 5.0, end: 1.2
- Inflation start: 3.5, end: 3.5
- Interest rate type: "Nominal interest rate" (constant at WEO last year value)
- Fiscal rule: "Yes"
- Debt target: 60
- Expenditure rigidity: 1.0

---

## Key Observations from the Uganda Golden Master

Examining the fiscal golden master data:

1. **Revenue % GDP** is ~10% in 2009, rises to ~18.6% by 2028 (WEO data), and stays
   constant at ~18.585% thereafter (constant ratio assumption working correctly).

2. **Primary expenditure % GDP** is ~11% in 2009, fluctuates during WEO period, then
   settles around 19.2-19.7% in the projection period and gradually evolves. It does
   NOT stay constant -- it drifts because expenditure and GDP grow at different rates.

3. **Debt-to-GDP** falls from ~51% in 2023 to ~35% around 2030 (WEO data shows
   consolidation), then slowly rises to ~47% by 2099. The fiscal rule keeps it from
   exploding.

4. **Fiscal gap** is empty for 2009 and most of the WEO period, then appears starting
   around 2026 with positive values (Uganda has fiscal space), and gradually decreases.

5. **DSPB** is empty for 2009, then populated from 2010 onward. The values become less
   negative over time as the interest-growth differential tightens.
