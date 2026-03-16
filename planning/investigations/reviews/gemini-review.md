# Review of WEO-BOUNDARY-INVESTIGATION.md

**1. Excel formula verification**
- **Severity:** LOW
- **Section:** Investigation 1 (Baseline sheet formulas) & Investigation 2 (Paris sheet row 8)
- **Finding:** The column letter offsets cited in the document are mathematically sound and internally consistent. Since the Baseline sheet begins 2009 at column D (index 4), 2029 is correctly mapped to `X` (4 + 20) and 2030 to `Y` (4 + 21). The Macrofiscal sheet begins 2001 at column C (index 3), correctly placing 2029 at `AE` (3 + 28). The cited formulas (e.g., `=X7*(1+Y11/100)*(1+Y12/100)`) perfectly align with this relative referencing.

**2. The counter variable discrepancy**
- **Severity:** HIGH
- **Section:** Investigation 6 (Module-by-Module Transition) and Implications (Point 6)
- **Finding:** The investigation asserts that both productivity and inflation logistics start in 2030 with `counter=1`. However, the external inflation oracle specifies `counter=2` for 2030. The investigation is internally consistent with its own logic (assuming the first post-WEO year is counter 1), but fails to verify the actual counter index values (e.g., `B23` in the Excel Inflation sheet). If inflation indeed uses `counter=2` in 2030, the investigation's generalization in Point 6 is technically incorrect and misses a crucial module-specific offset.

**3. PYTHON_REIMPLEMENTATION_GUIDE addendum**
- **Severity:** MEDIUM
- **Section:** Implications (Point 8)
- **Finding:** The error table claims the guide has wrong formulas in "5 of 7 modules", listing demography, baseline_v1, interest_rate, fiscal, and climate. It omits Productivity and Inflation entirely. The table is incomplete. The investigation should verify whether the guide correctly handles the sigmoid logistic formulas, the back-calculation boundary for productivity, and the inflation target logic. It is highly likely the guide contains errors for these two modules as well, given the WEO boundary shift.

**4. Demography as "special case"**
- **Severity:** HIGH
- **Section:** Investigation 5 (Employment Growth) vs Investigation 6 (Module-by-Module Transition)
- **Finding:** There is a direct contradiction regarding employment growth. Investigation 5 empirically proves that "Employment growth is ALWAYS derived from working-age population ratio, even during WEO period" using Excel formulas (rows 11 for 2028-2030). However, Investigation 6 hand-waves this away, falsely claiming the first projected year for demography is 2029 based on User Guide text ("from 2029 onwards"). The investigation prioritizes inaccurate documentation over its own Excel formula evidence, obscuring the fact that employment growth has no 2029 boundary at all.

**5. Missing edge cases**
- **Severity:** HIGH
- **Section:** Investigation 5 (Interest Rate Anchor) and Implications (Point 5)
- **Finding:** The investigation correctly identifies that missing data for Afghanistan causes `#VALUE!` errors in Excel because it hardcodes the 2029 column. However, its proposed Python implementation (`macrofiscal_at_weo_max_year["nominal_interest_rate"]`) reproduces this exact flaw. It assumes `weo_max_year` (2029) has complete data for all countries. The investigation fails to define a fallback or forward-fill mechanism for countries with shorter macrofiscal data series, guaranteeing runtime errors in Python for incomplete datasets.

**6. Year range: 2009-2099 vs YEAR_END=2100**
- **Severity:** MEDIUM
- **Section:** Investigation 4 & Implications (Point 7)
- **Finding:** The investigation reinterprets `YEAR_END = 2100` as an exclusive bound to justify `range(2009, 2100)` producing the correct 91 rows for the 2009-2099 period. While mathematically yielding 91 values, this is semantically dangerous. If `YEAR_END` is used in other contexts (e.g., UI display, inclusive bounds in pandas `loc`), it will create off-by-one errors. The mathematically robust approach is to define `YEAR_END = 2099` and use `range(YEAR_START, YEAR_END + 1)`.