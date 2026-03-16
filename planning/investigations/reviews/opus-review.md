# Opus Review of WEO-BOUNDARY-INVESTIGATION.md

**Reviewer:** Claude Opus 4.6 (domain review pass)
**Date:** 2026-03-16
**Reviewed document:** `planning/investigations/WEO-BOUNDARY-INVESTIGATION.md`
**Also consulted:** Gemini and Codex reviews, oracle packets (inflation, productivity), golden master CSVs, SPEC.md

---

## Evidence Quality

### The core boundary finding is solid

The 2029/2030 boundary claim is well-supported by multiple independent sources: Macrofiscal column headers (line 34), Baseline sheet row annotations (lines 40-48), formula inspection at the transition (lines 50-59), Read Me sheet text (line 61), and golden master data. I independently verified:

- Inflation golden master: 2029=4.833%, 2030=3.5% (sharp transition)
- Productivity golden master: 2029=2.467%, 2030=4.885% (logistic kicks in)
- Baseline vs Paris climate: identical through 2029, diverge at 2030

This is the strongest evidence in the document and is sufficient for the IMF meeting.

### The WEO vintage attribution is an inference, not a finding

Lines 11-13 and 264-286 state as fact that "the SPEC was written when April 2024 WEO was current" and "the workbook was updated to v10 with October 2024 WEO." No evidence is presented for either claim — no version history, no WEO vintage metadata from the workbook, no changelog. The Codex review correctly flagged this (finding #1). The investigation should label this as a **hypothesis** consistent with the evidence, not a confirmed root cause. For the IMF meeting, present it as: "We observe the boundary is at 2029; is this because v10 uses the October 2024 WEO?"

### The final golden master table is misleading

Line 188 claims "final | 2023 | 2099 | 35" in the year range table. This implies a continuous 35-year time series. In reality, the final golden master contains 7 scenarios x 5 snapshot years (2023, 2030, 2050, 2075, 2099) = 35 rows. This is a sparse sampling, not a full projection. An autonomous agent reading "35 rows" next to "2023-2099" could misinterpret this as a 35-year range starting at 2065. The table should note the snapshot structure explicitly.

### The PROJ_START=2030 case is the strongest finding

Four genuinely independent sources confirm 2030 (lines 108-115): Excel formula structure, User Guide verbatim text, Discrete Risks sheet range, and golden master divergence. This is model investigative work — each source confirms the claim through a different evidentiary pathway. No gaps here.

---

## IMF Meeting Questions

### Questions 1 and 3 are too confirmatory

Question 1 (line 303) leads with "We've confirmed that..." and asks IMF to agree. Question 3 (line 307) similarly front-loads the conclusion. An IMF FAD team member will either rubber-stamp or feel cornered. Reframe as open questions:

- **Q1 better:** "What WEO vintage does the v10 Macrofiscal sheet use? We see data extending through 2029 and want to confirm the source."
- **Q3 better:** "What determines the first year of climate impact in the scenario sheets — is it always 2030, or does it track the end of WEO data?"

### Question 2 is the most valuable question

Line 305 ("Is Q-CRAFT designed to be updated with new WEO vintages?") directly tests the dynamic-vs-fixed design hypothesis. If IMF says "yes, everything shifts," the dynamic `WEO_MAX_YEAR` implementation is correct. If they say "no, we manually update," the engine should still derive it but the team knows not to assume structural invariants. This question should move to position 1.

### Question 4 is critical and under-prioritized

Line 309 ("do inflation/productivity/interest rate defaults change per country?") has direct implementation consequences. If there's a hidden lookup table, the Python app needs country-specific defaults. If it's manual entry, the app needs good UI guidance. This should be question 2 or 3, not question 4.

### Missing question: inflation counter offset

The investigation does not resolve whether the inflation logistic counter at 2030 is 1 or 2. The productivity oracle says counter=1 at 2030 (with WEO_MAX_YEAR=2029). The inflation oracle says counter=2 at 2030 (because it was written with WEO_MAX_YEAR=2028, and deflator data extends one year past). With the corrected WEO_MAX_YEAR=2029, the formula `counter = year - WEO_MAX_YEAR` gives counter=1 at 2030 for both modules. But the inflation oracle explicitly says the deflator index extends one year past WEO_MAX_YEAR, which would push the first logistic year to 2031 and give counter=2 at 2031 — contradicting the golden master.

This cannot be resolved from the Uganda golden master because start=end=3.5% makes all counter values produce the same output. A good IMF question would be: "For inflation, does the logistic convergence counter start at 1 or 2 in the first projection year? We want to verify using a country where inflation_start differs from inflation_end."

### Missing question: discrete risks integration

The investigation mentions the Discrete Risks sheet covers 2030-2102 (line 104) but does not investigate how discrete risks integrate into the fiscal projections. If this sheet feeds into debt dynamics, the engine needs to handle it. Worth asking: "How do the Discrete Risks sheet values feed into the scenario projections? Is this an additive shock to expenditure, or a separate output?"

---

## Cross-Module Consistency Table (Investigation 6)

### Demography row contradicts Investigation 5

The Gemini review (finding #4) caught this and I concur. Lines 246-260: the table says demography's first projected year is "2029 (employment = WAP growth)" citing the User Guide. But Investigation 5 (lines 226-228) proves from Excel formulas that "Employment growth is ALWAYS derived from working-age population ratio, even during WEO period." These are contradictory. If employment growth is always WAP-derived, demography has no WEO boundary — it is purely UN data throughout. The table should say "N/A" for both "Last WEO-derived year" and "First projected year," or clarify that the User Guide text "from 2029 onwards" refers to a different concept (perhaps when employment-GDP linkage begins, not when WAP-based employment growth begins).

### Interest rate evidence column is imprecise

Line 252: "Interest Rate row 3 at 2029=`Macrofiscal!AE18`, at 2030=`B14` (long-run mode)." Investigation 5 (line 214) says the anchor is cell B10 with formula `=Macrofiscal!AE18`, and row 17 is constant nominal: `=$B$10`. The table's "row 3" and "`B14`" don't match the detailed findings. An agent following the table would look at the wrong cells.

### The table omits the inflation counter ambiguity

The productivity row correctly notes "counter=1" at 2030, but the inflation row does not specify which counter value applies. Given the unresolved discrepancy between the productivity oracle (counter=1 at 2030) and the inflation oracle (counter=2 at 2030), this omission hides a real implementation risk.

---

## Implementation Implications

### Rule 1 (derive WEO_MAX_YEAR at runtime) needs validation guards

Line 325: `WEO_MAX_YEAR: int = macrofiscal_df["years"].max()` assumes contiguous, complete data at the boundary. The Codex review (finding #2) details the ragged-data risk. The implementation should validate: (a) years are contiguous, (b) all required series (GDP, deflator, revenue, expenditure, debt) have non-null values at the boundary year, (c) the boundary is consistent across the macrofiscal blocks. Without this, a country with partial 2029 data could silently produce wrong results.

### Rule 2 (CLIMATE_START_YEAR = WEO_MAX_YEAR + 1) is unproven as a structural rule

Lines 331-337 present this as a derivable relationship. The Codex review (finding #3) correctly notes this could be a fixed calendar year (always 2030) rather than a dynamic function of WEO_MAX_YEAR. The investigation should flag this as "verified for v10, requires IMF confirmation for generalization." An agent implementing `CLIMATE_START_YEAR = WEO_MAX_YEAR + 1` will silently break if a future WEO extends to 2030 but climate impacts remain fixed at 2030.

### Rule 4 (employment = WAP growth for all years) contradicts the SPEC

Lines 344-350 propose correcting SPEC Section 4.4. This is the right conclusion per Excel evidence, but the correction is stated as an implementation instruction rather than a change request. Per CLAUDE.md's Change Request Protocol, this should be filed as a `.change-requests/baseline_v1-*.md` document, not embedded in an investigation. An autonomous agent may read this and change the SPEC directly, violating the "do NOT edit SPEC.md" rule.

### Rule 6 (inflation transition) glosses over the counter issue

Lines 359-361 say "the sigmoid counter=1 corresponds to year 2030." This directly contradicts the inflation oracle packet (line 80: "2030 gets counter=2"). The investigation does not resolve this contradiction. For Uganda with start=end=3.5%, the output is the same regardless. For any country with start != end, this is a parity-breaking bug waiting to happen. The implementation rule should say: "Counter value at 2030 is unresolved for inflation — verify with a non-trivial parameter set before implementing."

### Rule 8 (PYTHON_REIMPLEMENTATION_GUIDE is unreliable) is useful but incomplete

Lines 370-384 list 7 specific errors across 5 modules. The Gemini review (finding #3) noted that productivity and inflation are missing from the table. Given the investigation found errors in 5/7 modules, the a priori probability of errors in the remaining 2 is high. The table should either confirm correctness for productivity/inflation or list their errors too.

### Rule 9 (golden masters are final arbiter) has an operational gap

Lines 386-388 say to load golden master values when ambiguous. But the golden masters only cover Uganda. If the engine needs to handle Kenya, Ghana, or other countries, there is no golden master to arbitrate. The implementation rules should note: "Golden masters are available only for Uganda. For other countries, the Source of Truth Hierarchy applies, and edge cases (e.g., missing data, different parameter defaults) may require IMF clarification."

---

## What's Missing

### No investigation of the Excel sigmoid cell references

The investigation cites the productivity sigmoid formula (line 206) as `=$C$21+($E$21-$C$21)*((1/(1+EXP(-$G$21*(B23-$J$21)))^$G$21))`. The variable `B23` is the counter row, but the investigation never verifies what row 23 contains or how the counter is initialized. For the inflation sheet, the analogous cell reference would resolve the counter=1 vs counter=2 dispute. This is the most important missing evidence.

### No investigation of the Interest Rate "long-run" mode formulas

Investigation 5 (lines 213-218) covers the constant nominal mode but doesn't examine the other two modes (Real Rate, Interest-Growth Differential). The SPEC and oracle packet describe three modes. The investigation should verify which modes exist in Excel and what formulas they use, since the PYTHON_REIMPLEMENTATION_GUIDE is known to be wrong about this module.

### No investigation of fiscal rule mechanics

The investigation verifies the debt floor asymmetry (lines 220-223) but doesn't examine the fiscal rule feedback loop — the most complex and error-prone part of the engine. Given that the investigation found the WEO boundary is wrong in the SPEC, the fiscal rule's recursive dependence on prior-year state should also be verified at the 2029/2030 transition.

### No examination of the Discrete Risks sheet structure

Line 104 mentions "Discrete Risks sheet: Covers years 2030-2102" as evidence for climate start year, but doesn't investigate the sheet further. The year range 2030-2102 (73 years) is different from the main projection range 2030-2099 (70 years). Why does it extend to 2102? Does this sheet feed into the main projections? This is an unexplained anomaly.

### No cross-country validation

All evidence comes from Uganda. The investigation claims the WEO boundary is universal (line 258: "ALL modules transition at the 2029 to 2030 boundary"), but this is only verified for one country. A spot-check of Kenya or Ghana would strengthen the claim. The investigation itself notes Afghanistan shows `#VALUE!` errors (line 218), suggesting country-specific data gaps exist.
