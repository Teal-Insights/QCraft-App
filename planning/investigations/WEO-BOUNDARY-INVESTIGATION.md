# WEO Boundary Year Investigation

**Date:** 2026-03-16
**Investigator:** Claude Opus 4.6
**Workbook:** `2024_IMF-FAD_Q-CRAFT-Tool-v10.xlsx` (Version 1.0_11-15-2024)

---

## Executive Summary

The Q-CRAFT v10 workbook's macrofiscal data extends through **2029**, consistent with the **October 2024 WEO vintage**. The SPEC's `WEO_MAX_YEAR = 2028` is wrong. The data extent (2029) matches the October 2024 WEO publication, and the SPEC value (2028) matches the April 2024 WEO — most likely because the SPEC was written against the earlier vintage and not updated when the workbook was refreshed to v10.

This is **not an off-by-one error in the IMF's template** — the template is internally consistent. It is a **documentation lag** between the SPEC and the workbook. No workbook metadata or changelog confirms the WEO vintage directly; this attribution is inferred from the data extent. Confirmation is listed as IMF meeting question #1.

---

## Investigation 1: WEO Boundary Year

### Evidence

**Macrofiscal sheet:** 8 variable blocks, each covering years 2001-2029. Year headers in row 2, columns C (2001) through AE (2029).

| Variable | Uganda (last year) | Kenya (last year) | Ghana (last year) |
|----------|-------------------|-------------------|-------------------|
| Real GDP | 2029 | 2029 | 2029 |
| Nominal GDP | 2029 | 2029 | 2029 |
| GDP Deflator | 2029 | 2029 | 2029 |
| Revenue | 2029 | 2029 | 2029 |
| Expenditure | 2029 | 2029 | 2029 |
| Overall Balance | 2029 | 2029 | 2029 |
| Primary Balance | 2029 | 2029 | 2029 |
| Debt | 2029 | 2029 | 2029 |

**All 8 variables, all 3 countries: data through 2029. No variable stops at 2028.**

**Baseline sheet row annotations** (column A):

| Row | Content | Annotation |
|-----|---------|------------|
| 7 | Real GDP (level) | `Input (Macrofiscal)/Calculation (after 2029)` |
| 8 | Nominal GDP (level) | `Input (Macrofiscal)/Calculation (after 2029)` |
| 13 | Real GDP growth | `Input (Macrofiscal)/Calculation (after 2029)` |
| 15 | Nominal GDP growth | `Input (Macrofiscal)/Calculation (after 2029)` |
| 18 | Revenue (% NGDP) | `Input (Macrofiscal)/Calculation (after 2029)` |
| 35 | Gross debt (level) | `Input (Macrofiscal)/Calculation (after 2029)` |
| 36 | Gross debt (% GDP) | `Input (Macrofiscal)/Calculation (after 2029)` |

Every annotated row says **"after 2029"**, not "after 2028."

**Baseline sheet formulas at the 2029/2030 boundary:**

| Row | Variable | Year 2029 formula | Year 2030 formula |
|-----|----------|------------------|------------------|
| 7 | Real GDP | `=Macrofiscal!AE3` | `=X7*(1+Y11/100)*(1+Y12/100)` |
| 13 | Real GDP growth | `=Macrofiscal!AE13` | `=Y7/X7*100-100` |
| 14 | GDP deflator growth | `=Inflation!AC3` | `=Inflation!AD3` |
| 36 | Debt-to-GDP | `=Macrofiscal!AE19` | `=IF((X36*(1+Y33/100)/(1+Y15/100)-Y22)<0,0,...)` |

Year 2029: reads from Macrofiscal (WEO data). Year 2030: engine calculation begins.

**Read Me sheet** (row 13): "See the Macrofiscal worksheet for automatically generated charts for diagnostics **to 2029**"

### Conclusion

**WEO_MAX_YEAR = 2029.** The correct implementation is:

```python
WEO_MAX_YEAR = max(macrofiscal.years)  # 2029 for v10
```

The SPEC's `WEO_MAX_YEAR = 2028` is a documentation artifact from the April 2024 WEO vintage. The engine should derive this at runtime, not hardcode it.

---

## Investigation 2: Climate Impact Start Year

### Evidence

**Paris scenario sheet (row 8, column A annotation):**
```
Input (Baseline worksheet)/Calculation (from 2030, using data from Baseline worksheet and Climate Data worksheet)
```

**Paris sheet row 8 (productivity growth) formulas:**

| Year | Formula | Meaning |
|------|---------|---------|
| 2028 | `=Baseline!W12` | Pure baseline copy |
| 2029 | `=Baseline!X12` | Pure baseline copy |
| **2030** | **`=Baseline!Y12+'Climate Data'!R17`** | **First climate adjustment** |
| 2031 | `=Baseline!Z12+'Climate Data'!S17` | Climate adjustment |

All 6 scenario sheets have identical structure. Climate impacts begin in **2030**.

**Dashboard:** No PROJ_START parameter exists. The start year is hardcoded in the scenario sheet formulas.

**Climate Database:** Raw damage data exists from 2015 onward, but the scenario sheets ignore it before 2030 by copying baseline values directly.

**User Guide corroboration (4 independent confirmations):**

1. **User Guide p.19** states verbatim: *"Q-CRAFT assumes that fiscal projections will be affected by climate change scenarios starting in 2030."*
2. **User Guide p.26** (Section IV, Demography): Employment is projected *"from 2029 onwards"* — confirming 2029 is the last WEO year, making 2030 the first fully-projected year where climate divergence can begin.
3. **User Guide footnote 13** (p.19): References Aligishiev, Bellon, and Massetti (2022) for adaptation integration over "short to medium term," which is consistent with a 2030 start (one year into the projection horizon).
4. **Discrete Risks sheet:** Covers years 2030-2102, independently confirming the 2030 start year for climate-related fiscal impacts.

### Conclusion

**Climate impacts begin in 2030**, not 2031. The SPEC's `PROJ_START = 2031` is **definitively wrong**, confirmed by FOUR independent sources:

| Source | Evidence |
|--------|----------|
| Excel formulas | Paris row 8: `=Baseline!Y12+'Climate Data'!R17` at 2030 column |
| User Guide p.19 | *"starting in 2030"* (verbatim) |
| Discrete Risks sheet | Year range begins at 2030 |
| Golden master data | Climate scenarios diverge from baseline at year 2030 |

```python
CLIMATE_START_YEAR = 2030  # Hardcoded in Excel scenario sheet formulas
```

This is exactly `WEO_MAX_YEAR + 1` (2029 + 1 = 2030), which makes economic sense: WEO projections through 2029 are treated as "known," and climate divergence begins at the first fully projected year.

**Confidence qualifier:** For v10, climate start = 2030 is confirmed by four independent sources. However, whether this is structurally linked to `WEO_MAX_YEAR + 1` (i.e., would shift to 2031 if a future WEO extends to 2030) or is a fixed calendar year is unproven. The IMF meeting question #3 is designed to resolve this. For v10 implementation, use 2030; for forward-compatibility, implement as `WEO_MAX_YEAR + 1` but validate against golden masters.

---

## Investigation 3: Inflation Target Fallback

### Evidence

**Dashboard cells:**
- C24 (Inflation Start): 3.5 (hard-coded value, no formula)
- C25 (Inflation End): 3.5 (hard-coded value, no formula)

**Inflation sheet structure:**
- Row 3: Time series. Years 2002-2029: `=Macrofiscal!<col>15` (GDP deflator growth from WEO). Years 2030+: `=<col>9` (sigmoid projection)
- Row 6: Parameters: Start (=Dashboard!C24), End (=Dashboard!C25), Rate (0.5), Turning Point (5)
- Row 9: Sigmoid-interpolated values using the logistic formula

**No lookup table for inflation targets exists anywhere in the workbook.** No Central Bank target rates by country. No regional average sheet. The inflation Start/End values are entirely user-specified.

**User Guide corroboration:**

1. **User Guide pp.13-14** states: *"The inflation rate assumptions should be entered by the user and should reflect the Central Bank's inflation target."* It then says: *"If there is no Central Bank inflation target, a practical approach is that a user could consider an average inflation rate from neighboring countries or regional economic blocs."*
2. **User Guide p.28** (Section IV): *"Inflation is assumed to be stable in line with the Central Bank's target in the long run."*
3. The key phrase is **"a practical approach is that a user could consider"** — this is advisory language directed at the human analyst, NOT a programmatic fallback. The word "could" (not "the tool will") confirms there is no automated mechanism.

**GDP Deflator data for Uganda (2025-2029):**

| Year | Deflator Index | Implied Inflation (%) |
|------|---------------|----------------------|
| 2025 | 140.667 | 4.53 |
| 2026 | 147.787 | 5.06 |
| 2027 | 154.651 | 4.65 |
| 2028 | 161.639 | 4.52 |
| 2029 | 169.453 | 4.83 |

These are WEO-projected values. The golden master shows 2030 = 3.5%, confirming the sigmoid takes over with Start=End=3.5%.

### Conclusion

**There is no automated fallback mechanism.** This resolves the "NEEDS DOMAIN EXPERT" flag from the inflation oracle review. The User Guide (pp.13-14) confirms the inflation parameters are entirely user-specified. The advice about "neighboring countries or regional economic blocs" is guidance for the human analyst, not a workbook feature.

**Implications for the Python implementation:**

1. **Engine layer:** Takes `inflation_start` and `inflation_end` as function parameters. No fallback logic needed — if the user doesn't provide values, the engine should raise an error, not guess.
2. **UI/app layer:** Should display tooltip guidance matching the User Guide's advice: "Enter the Central Bank's inflation target. If no target exists, consider using an average from neighboring countries or regional economic blocs."
3. **Country defaults:** The Excel Dashboard cells B24/B25 are hard-coded values that get set when a country is selected (likely by the user, not by a lookup). For the golden master, Uganda uses 3.5/3.5. Whether the Excel pre-populates defaults per country or always shows the same defaults is an open question for the IMF meeting.

---

## Investigation 4: Year Range Consistency

### Golden Master Year Ranges

| Module | First Year | Last Year | Rows |
|--------|-----------|----------|------|
| demography | 2009 | 2099 | 91 |
| productivity | 2009 | 2099 | 91 |
| inflation | 2009 | 2099 | 91 |
| baseline_v1 | 2009 | 2099 | 91 |
| interest_rate | 2009 | 2099 | 91 |
| fiscal | 2009 | 2099 | 91 |
| climate/paris | 2009 | 2099 | 91 |
| climate/moderate | 2009 | 2099 | 91 |
| climate/high | 2009 | 2099 | 91 |
| climate/hot | 2009 | 2099 | 91 |
| climate/hot_adapted | 2009 | 2099 | 91 |
| climate/hot_unadapted | 2009 | 2099 | 91 |
| final | 2023 | 2099 | 35 (7 scenarios x 5 snapshot years: 2023, 2030, 2050, 2075, 2099) |

**All modules are perfectly consistent: 2009-2099, 91 years.**

**Baseline sheet year range:** Columns D through CR = years 2009 through 2099 (91 years). The sheet does NOT include year 2100.

### Conclusion

The SPEC's `YEAR_END = 2100` is an exclusive upper bound: `range(2009, 2100)` = [2009, 2099]. The workbook confirms this — the Baseline sheet has 91 columns covering 2009-2099. There is no year 2100 data anywhere in the workbook outputs. Using an inclusive constant (`YEAR_LAST = 2099`) is recommended to avoid off-by-one risk if the value is reused in non-range contexts (UI labels, pandas `.loc`, loop conditions).

---

## Investigation 5: Additional Formula Findings

### Productivity Convergence
- **Rate** = 0.5 (hardcoded in Productivity sheet cell G21)
- **Turning Point** = 15 (hardcoded in Productivity sheet cell J21)
- The User Guide footnote 7 says the turning point "can be adjusted" — this refers to the user editing cell J21 directly. It is NOT on the Dashboard.
- The sigmoid formula in cell B24: `=$C$21+($E$21-$C$21)*((1/(1+EXP(-$G$21*(B23-$J$21)))^$G$21))`

### Inflation Convergence
- **Rate** = 0.5 (hardcoded in Inflation sheet cell G6)
- **Turning Point** = 5 (hardcoded in Inflation sheet cell J6)
- Same sigmoid formula as productivity, just different parameters.

### Interest Rate Anchor
- Cell B10 formula: `=Macrofiscal!AE18` — this is the 2029 value (column AE = year 2029)
- Row 17 (constant nominal mode): `=$B$10` for all projection years
- **The anchor is definitively the 2029 Macrofiscal value**, not the 2028 value
- For Uganda: this would be the implicit interest rate computed from 2029 WEO data
- Current workbook shows `#VALUE!` because Afghanistan (current selection) has missing data

### Baseline Debt Floor
- Year 2030 debt-to-GDP formula: `=IF((X36*(1+Y33/100)/(1+Y15/100)-Y22)<0, 0, ((X36*(1+Y33/100)/(1+Y15/100)-Y22)))`
- This confirms `max(0, debt_dynamics)` for baseline
- The climate scenario sheets do NOT have this `IF(...<0, 0, ...)` wrapper (confirmed in Investigation 2 subagent output)

### Employment Growth
- Row 11 formula pattern for 2028-2030: `=W5/V5*100-100`, `=X5/W5*100-100`, `=Y5/X5*100-100`
- **Employment growth is ALWAYS derived from working-age population ratio**, even during WEO period
- This is NOT a residual from GDP and productivity during WEO — the Baseline sheet derives it from demography
- However, the Productivity sheet BACK-CALCULATES productivity from employment growth and GDP growth: Row 12 for 2028-2029 is `=(W13/100-W11/100)/(1+W11/100)*100`

### Productivity Back-Calculation Boundary
- Productivity sheet row 6 formulas:
  - Year 2028: `=Baseline!W12` (reads back-calculated value from Baseline)
  - Year 2029: `=Baseline!X12` (reads back-calculated value from Baseline)
  - Year 2030: `=AE3/AD3*100-100` (computes from sigmoid levels)
- The back-calculation extends through 2029 (not 2028), because WEO data covers through 2029

---

## Investigation 6: Cross-Module WEO Boundary Consistency

This investigation synthesizes how the WEO boundary manifests across all engine modules. It is the connective tissue between Investigations 1, 2, and 5.

### Evidence: Module-by-Module Transition

| Module | Last WEO-derived year | First projected year | Evidence |
|--------|----------------------|---------------------|----------|
| Demography | N/A (UN data, not WEO) | N/A (employment always = WAP growth) | Investigation 5: Baseline rows 11 use WAP ratio for ALL years including 2028-2029. User Guide p.26 "from 2029 onwards" refers to when employment matters for GDP projection (after WEO GDP data ends), not when the WAP formula changes. |
| Productivity | 2029 (back-calculated) | 2030 (logistic, counter=1) | Golden master: 2029=2.47%, 2030=4.89%; Baseline row 12 formula at 2029 is back-calc |
| Inflation | 2029 (deflator growth) | 2030 (logistic, counter=1) | Golden master: 2029=4.83%, 2030=3.5%; Inflation sheet row 3 at 2029=`Macrofiscal!AE15` |
| Baseline_v1 | 2029 (WEO GDP levels/growth) | 2030 (recursive GDP) | Baseline row 7 at 2029=`Macrofiscal!AE3`, at 2030=`X7*(1+Y11/100)*(1+Y12/100)` |
| Interest Rate | 2029 (macrofiscal implicit rate) | 2030 (constant/projected) | Interest Rate row 3 at 2029=`Macrofiscal!AE18`, at 2030=`B14` (long-run mode) |
| Fiscal | 2029 (WEO revenue/expenditure/debt) | 2030 (recursive fiscal) | Baseline row 36 at 2029=`Macrofiscal!AE19`, at 2030=`IF((X36*(1+Y33/100)/(1+Y15/100)-Y22)<0,0,...)` |
| Climate | 2029 (= baseline exactly) | 2030 (first climate variation) | Paris row 8 at 2029=`Baseline!X12`, at 2030=`Baseline!Y12+'Climate Data'!R17` |

### Key Pattern

**ALL modules transition at the 2029→2030 boundary.** There is no module that transitions at 2028→2029 or at 2030→2031. The boundary is perfectly consistent across the entire workbook.

The demography module is a special case: it uses UN World Population Prospects data (not WEO), and employment growth is ALWAYS computed as `WAP(t)/WAP(t-1)*100-100` — even during the WEO period (confirmed by Excel Baseline row 11 formulas in Investigation 5). The User Guide (p.26) phrase "from 2029 onwards" refers to when employment growth *matters for GDP projection* (because after WEO GDP data ends, GDP is computed from employment + productivity), not to when the employment formula changes.

### Conclusion

The SPEC's `WEO_MAX_YEAR = 2028` is systematically off by one year across **every module**, most likely because the SPEC was written against an earlier WEO vintage (consistent with April 2024, ending 2028), while v10's data extends through 2029 (consistent with October 2024 WEO). This is not an isolated error in one module — it's a single root cause that propagates to all seven engine functions.

---

## Conclusions

### 1. The SPEC has three incorrect constants

| Constant | SPEC Value | Correct Value | Source of Correct Value |
|----------|-----------|---------------|------------------------|
| `WEO_MAX_YEAR` | 2028 | 2029 | Macrofiscal columns end at 2029; Baseline says "after 2029" |
| `PROJ_START` | 2031 | 2030 | Climate scenario formulas begin adjustment at 2030 |
| `YEAR_END` | 2100 | Use `YEAR_LAST = 2099` (inclusive) | Baseline sheet covers 2009-2099 (91 years) |

### 2. These are documentation errors, not template errors

The Excel workbook is internally consistent:
- WEO data through 2029
- Baseline calculation begins 2030
- Climate impacts begin 2030
- Output covers 2009-2099

The SPEC was most likely written when the April 2024 WEO (ending 2028) was current. The workbook was most likely updated to v10 with the October 2024 WEO (ending 2029), but the SPEC was not refreshed. (No workbook provenance metadata confirms this; the attribution is inferred from the data extent matching the October 2024 WEO.)

### 3. The engine should derive, not hardcode

```python
WEO_MAX_YEAR = max(macrofiscal["years"])  # 2029 for v10, could change with future WEO
CLIMATE_START_YEAR = WEO_MAX_YEAR + 1     # 2030
YEAR_START = 2009
YEAR_LAST = 2099    # Last year in output (inclusive)
YEAR_RANGE = range(YEAR_START, YEAR_LAST + 1)  # 2009..2099, 91 years
```

---

## Questions for IMF (Wednesday Meeting)

These are technically precise questions Teal can raise diplomatically. Ordered by priority — Q1 is the most valuable (tests forward-compatibility), Q2-3 are critical for parity, the rest fill gaps.

1. **Future WEO Compatibility:** "Is Q-CRAFT designed to be updated with new WEO vintages? Specifically, if the April 2025 WEO extends to 2030, would the Macrofiscal sheet be updated to column AF, and would the Baseline/Inflation/Interest Rate sheets automatically shift their transition point to 2031? We're building the Python engine to derive WEO_MAX_YEAR dynamically rather than hardcoding it."

2. **WEO Vintage:** "We noticed the v10 Macrofiscal sheet extends through 2029, which is consistent with the October 2024 WEO. Can you confirm which WEO vintage v10 uses? The User Guide references 2028 in several places, and we want to make sure we're calibrating the Python engine to the right data source."

3. **Climate Start Year:** "The climate scenario sheets apply their first productivity adjustment in 2030. Is this start year structurally tied to the end of WEO data (i.e., WEO_MAX_YEAR + 1), or is it a fixed design choice? This matters for whether a future WEO update would automatically shift the climate start year."

4. **Dashboard Defaults Per Country:** "When a user selects a different country on the Dashboard, do the inflation, productivity, and interest rate defaults change automatically (e.g., pre-populated from a lookup table), or do they remain at fixed defaults (5.0/1.2 for productivity, 3.5/3.5 for inflation) that the user must manually adjust? This affects whether we can extract country-specific defaults for the Python app."

5. **Inflation/Productivity Parameters:** "The sigmoid turning point for inflation (5) is hardcoded in the Inflation sheet, while the User Guide footnote 7 mentions it 'can be adjusted.' Is this an advanced-user feature, or is there a plan to expose it on the Dashboard in a future version?"

6. **Interest Rate Anchor Year:** "The Interest Rate sheet anchors the constant nominal rate to the last year of WEO data (currently 2029 via `=Macrofiscal!AE18`). Is this intentional — that the anchor moves automatically when the WEO vintage is updated?"

7. **Year Range:** "The Baseline sheet covers 2009-2099 (91 years). The User Guide mentions 2100 in some places. Is the intent for projections to run through 2099 inclusive, with 2100 as an exclusive upper bound?"

8. **Discrete Risks Year Range:** "The Discrete Risks sheet covers 2030-2102 (73 years), while the Baseline and climate scenario sheets cover 2009-2099 (91 years). Is the extra 3-year range in Discrete Risks intentional, or should the Python engine truncate at 2099?"

---

## Implications for Engine Implementation

### 1. WEO_MAX_YEAR must be derived at runtime

```python
# In constants.py or data_loader.py
WEO_MAX_YEAR: int = macrofiscal_df["years"].max()
# Currently 2029 for v10, but will shift when WEO is updated
```

**Do not hardcode 2028 or 2029.** The engine should work with any WEO vintage.

**Validation guards (from council review):**
- Verify year columns are contiguous (no gaps)
- Verify all 8 macrofiscal series (GDP, deflator, revenue, expenditure, debt, etc.) extend to the same max year for the selected country
- Verify max year is reasonable (2025-2035 range for near-term WEO vintages)
- If any series is shorter than max year for a given country, raise a data quality warning (Afghanistan is known to have incomplete data causing `#VALUE!` in Excel)

### 2. Climate start year = WEO_MAX_YEAR + 1

```python
CLIMATE_START_YEAR: int = WEO_MAX_YEAR + 1  # 2030 for v10
```

For years up to and including WEO_MAX_YEAR, climate scenario values must exactly equal baseline values.

### 3. The back-calculation window extends through WEO_MAX_YEAR

The SPEC says `[WEO_MAX_YEAR - 6, WEO_MAX_YEAR]`. With WEO_MAX_YEAR = 2029, this is [2023, 2029] — 7 years. The Excel formulas confirm productivity back-calculation runs through 2029 (inclusive).

### 4. Employment growth is from demography, not a WEO residual

The Baseline sheet computes employment growth as `WAP(t)/WAP(t-1)*100-100` for ALL years (including WEO period), not as a residual from GDP and productivity. The SPEC's Phase 1 formula for WEO period employment (`(real_gdp_growth - productivity_growth) / (1 + productivity_growth)`) is the inverse: it's used to back-calculate productivity, not to derive employment.

**Correction to SPEC Section 4.4:**
- Phase 1 should say: Employment growth = WAP growth for all years
- Phase 2: Productivity during [WEO_MAX_YEAR-6, WEO_MAX_YEAR] is back-calculated from WEO GDP growth and employment growth
- This is what the Excel actually does: Row 11 (employment) always uses demography, Row 12 (productivity) uses back-calculation during WEO overlap

### 5. Interest rate anchor = Macrofiscal value at WEO_MAX_YEAR

```python
base_nominal_rate = macrofiscal_at_weo_max_year["nominal_interest_rate"]
# For Uganda v10: this is the 2029 value (~8.04%)
```

### 6. Inflation transition

The Inflation sheet reads from Macrofiscal through 2029, then switches to the sigmoid. The sigmoid counter=1 corresponds to year 2030 (the first post-WEO year). For Uganda with Start=End=3.5%, the transition happens at year 2030: the value jumps from 4.83% (2029 WEO) to 3.5% (sigmoid with start=end).

### 7. Year range for output

```python
YEAR_LAST = 2099   # Last year in output (inclusive)
YEAR_RANGE = range(YEAR_START, YEAR_LAST + 1)  # 2009..2099, 91 years
```

Using an inclusive `YEAR_LAST = 2099` avoids off-by-one risk if the constant is reused in non-range contexts (UI labels, pandas `.loc`, loop conditions).

### 8. PYTHON_REIMPLEMENTATION_GUIDE is systematically unreliable

Cross-model review (Gemini round) identified that the `PYTHON_REIMPLEMENTATION_GUIDE.md` contains wrong formulas or significant omissions in **all 7 modules**. These errors compound the WEO boundary confusion because the guide was also written against the older WEO vintage. Specific errors confirmed by Excel formula inspection:

| Module | Guide Error | Correct (per Excel) |
|--------|-----------|-------------------|
| demography | Single `pop_growth` — no working-age vs total distinction | Two separate growth rates drive different fiscal channels |
| productivity | Linear interpolation: `start - (start - end) * (year - 2030) / 70` | Logistic sigmoid with rate=0.5, turning_point=15 |
| inflation | Projection convergence not specified; says "constant at end-rate after 2030" | Logistic sigmoid with rate=0.5, turning_point=5 (same function as productivity) |
| baseline_v1 | Additive GDP: `prod + employment` | Multiplicative: `(1+emp/100)*(1+prod/100)` |
| baseline_v1 | Employment as function of productivity and population | Employment = WAP ratio for all years; productivity is the residual |
| interest_rate | Only 2 modes (Constant, Real Rate) | 3 modes — missing Interest-Growth Differential |
| fiscal | Debt: `debt*(1+r) + deficit` | DSA: `d*(1+r)/(1+g) - primary_balance` |
| climate | Test: `baseline_debt > hot_debt` | Backwards — hot scenario worsens debt |
| climate | Nominal GDP: `*(1+real_growth)*(1+inflation)` | Uses `nominal_gdp_growth` directly (avoids double-counting) |

**The guide has errors or omissions in every module and should be treated as the LOWEST authority source.** It sits below the SPEC in the source-of-truth hierarchy and must never override Excel-verified formulas.

### 9. Golden master tests are the final arbiter

All of the above conclusions are confirmed by the golden master CSVs. If there's any remaining ambiguity, load the golden master value — per the Source of Truth Hierarchy in CLAUDE.md: Excel workbook formulas > Parquet data > User Guide > SPEC.
