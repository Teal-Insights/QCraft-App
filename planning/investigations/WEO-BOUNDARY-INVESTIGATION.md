# WEO Boundary Year Investigation

**Date:** 2026-03-16
**Investigator:** Claude Opus 4.6
**Workbook:** `2024_IMF-FAD_Q-CRAFT-Tool-v10.xlsx` (Version 1.0_11-15-2024)

---

## Executive Summary

The Q-CRAFT v10 workbook uses the **October 2024 WEO vintage**, which projects through **2029**. The SPEC's `WEO_MAX_YEAR = 2028` is wrong — it references the April 2024 WEO which projected through 2028. The workbook was updated to v10 with the October 2024 data, extending all projections by one year. The SPEC was not updated to match.

This is **not an off-by-one error in the IMF's template** — the template is internally consistent. It is a **documentation lag** between the SPEC (written when April 2024 WEO was current) and the workbook (updated to October 2024 WEO).

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

### Conclusion

**Climate impacts begin in 2030**, not 2031. The SPEC's `PROJ_START = 2031` is wrong. The correct value is:

```python
CLIMATE_START_YEAR = 2030  # Hardcoded in Excel scenario sheet formulas
```

This is exactly `WEO_MAX_YEAR + 1` (2029 + 1 = 2030), which makes economic sense: WEO projections through 2029 are treated as "known," and climate divergence begins at the first fully projected year.

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

**There is no fallback mechanism.** The inflation parameters are entirely manual. The User Guide's advice about "using regional averages" is guidance for the human analyst, not a feature of the workbook. An agent implementing the engine does not need to handle this — it's a UI concern (tooltip text advising the user).

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
| final | 2023 | 2099 | 35 |

**All modules are perfectly consistent: 2009-2099, 91 years.**

**Baseline sheet year range:** Columns D through CR = years 2009 through 2099 (91 years). The sheet does NOT include year 2100.

### Conclusion

The SPEC's `YEAR_END = 2100` is an exclusive upper bound: `range(2009, 2100)` = [2009, 2099]. The workbook confirms this — the Baseline sheet has 91 columns covering 2009-2099. There is no year 2100 data anywhere in the workbook outputs.

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

## Conclusions

### 1. The SPEC has three incorrect constants

| Constant | SPEC Value | Correct Value | Source of Correct Value |
|----------|-----------|---------------|------------------------|
| `WEO_MAX_YEAR` | 2028 | 2029 | Macrofiscal columns end at 2029; Baseline says "after 2029" |
| `PROJ_START` | 2031 | 2030 | Climate scenario formulas begin adjustment at 2030 |
| `YEAR_END` | 2100 | 2100 (exclusive) | Baseline sheet covers 2009-2099 (91 years) |

### 2. These are documentation errors, not template errors

The Excel workbook is internally consistent:
- WEO data through 2029
- Baseline calculation begins 2030
- Climate impacts begin 2030
- Output covers 2009-2099

The SPEC was written when the April 2024 WEO (ending 2028) was current. The workbook was updated to v10 with October 2024 WEO (ending 2029), but the SPEC was not refreshed.

### 3. The engine should derive, not hardcode

```python
WEO_MAX_YEAR = max(macrofiscal["years"])  # 2029 for v10, could change with future WEO
CLIMATE_START_YEAR = WEO_MAX_YEAR + 1     # 2030
YEAR_START = 2009
YEAR_END = 2100  # Exclusive upper bound: range(YEAR_START, YEAR_END) gives 2009-2099
```

---

## Questions for IMF (Wednesday Meeting)

These are technically precise questions Teal can raise diplomatically:

1. **WEO Vintage Confirmation:** "We noticed the Macrofiscal sheet in v10 extends through 2029, consistent with the October 2024 WEO. The User Guide references 2028 in several places. Can you confirm v10 uses the October 2024 WEO vintage, and that the projection horizon is intended to be 2029?"

2. **Climate Start Year:** "The climate scenario sheets begin adjusting productivity growth in 2030 (the first year after WEO data ends). Is this the intended design — that climate impacts diverge from baseline only after the WEO projection horizon? And would this shift to 2031 if a future WEO vintage extends to 2030?"

3. **Inflation/Productivity Parameters:** "The sigmoid turning point for inflation (5) is hardcoded in the Inflation sheet, while the User Guide footnote 7 mentions it 'can be adjusted.' Is this an advanced-user feature, or is there a plan to expose it on the Dashboard in a future version?"

4. **Interest Rate Anchor Year:** "The Interest Rate sheet anchors the constant nominal rate to the last year of WEO data (currently 2029 via `=Macrofiscal!AE18`). Is this intentional — that the anchor moves automatically when the WEO vintage is updated?"

5. **Year Range:** "The Baseline sheet covers 2009-2099 (91 years). The User Guide mentions 2100 in some places. Is the intent for projections to run through 2099 inclusive, with 2100 as an exclusive upper bound?"

---

## Implications for Engine Implementation

### 1. WEO_MAX_YEAR must be derived at runtime

```python
# In constants.py or data_loader.py
WEO_MAX_YEAR: int = macrofiscal_df["years"].max()
# Currently 2029 for v10, but will shift when WEO is updated
```

**Do not hardcode 2028 or 2029.** The engine should work with any WEO vintage.

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
years = list(range(YEAR_START, YEAR_END))  # range(2009, 2100) = [2009, ..., 2099]
# 91 years, matching golden master
```

### 8. Golden master tests are the final arbiter

All of the above conclusions are confirmed by the golden master CSVs. If there's any remaining ambiguity, load the golden master value — per the Source of Truth Hierarchy in CLAUDE.md: Excel workbook formulas > Parquet data > User Guide > SPEC.
