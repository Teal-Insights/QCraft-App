# Oracle Review Synthesis

**Date:** 2026-03-16
**Reviewers:** Claude Opus 4.6, Codex
**Modules reviewed:** All 7 engine modules

---

## Summary Statistics

| Category | Demography | Productivity | Inflation | Baseline_v1 | Interest Rate | Fiscal | Climate | Total |
|----------|-----------|-------------|-----------|------------|--------------|--------|---------|-------|
| VALID BUG | 1 | 4 | 5 | 2 | 5 | 2 | 4 | 23 |
| VALID ADDITION | 3 | 4 | 4 | 4 | 6 | 7 | 8 | 36 |
| VALID CLARITY | 6 | 9 | 6 | 5 | 6 | 8 | 5 | 45 |
| FALSE POSITIVE | 1 | 0 | 0 | 3 | 0 | 2 | 0 | 6 |
| NEEDS DOMAIN EXPERT | 0 | 0 | ~~1~~ 0 | 0 | 0 | 0 | ~~1~~ 0 | ~~2~~ 0 |

**Total findings processed:** 112
**Total fixes applied:** 106 (was 104, +2 resolved from domain expert)
**False positives ignored:** 6
**Flagged for domain expert:** ~~2~~ **0 — all resolved** (see WEO investigation)

---

## Cross-Cutting Themes

### 1. WEO_MAX_YEAR boundary (affects: productivity, inflation, baseline_v1, interest_rate)
All four reviewers flagged the same issue: SPEC says `WEO_MAX_YEAR = 2028`, but golden master data shows 2029 values are WEO-derived (not projected). Resolution: the macrofiscal data extends through 2029 for some variables. All oracles now document this as a source conflict and instruct agents to use `max(macrofiscal.years)` at runtime rather than hardcoding 2028.

### 2. Output schemas missing iso3c/country (affects: demography, inflation, baseline_v1, interest_rate)
SPEC return schemas include `iso3c` and `country` columns, but golden master CSVs don't have them. All four oracles now list the full SPEC schema with a note that golden master tests should compare only numeric columns.

### 3. Source-backed rules vs golden-master-driven conclusions (affects: all modules)
Both reviewers flagged that oracles relied too heavily on golden master behavior without citing source documents. All oracles now explicitly label source-backed rules vs fixture-derived observations and use the source-of-truth hierarchy (Excel > Parquet > User Guide > SPEC > agent reasoning).

### 4. PYTHON_REIMPLEMENTATION_GUIDE is stale (affects: productivity, inflation)
The guide says "linear interpolation" for productivity and inflation convergence. All three authoritative sources (Excel formulas, SPEC, User Guide footnotes) use logistic convergence. Productivity oracle now explicitly marks the guide as stale on this point.

### 5. Year range: 2099 vs 2100 (affects: all modules)
SPEC says `YEAR_END = 2100`, golden masters end at 2099. Resolution: `YEAR_END` is an exclusive upper bound; output range is `range(2009, 2100)` = 2009-2099 inclusive.

---

## Demography

| Finding | Reviewer(s) | Category | Action |
|---------|------------|----------|--------|
| Output schema missing iso3c, country, demography_level_* per SPEC 4.1 | Codex | VALID BUG | Added full SPEC schema to Outputs section with golden master note |
| Year 2099 vs 2100 presented as settled instead of source conflict | Both | VALID CLARITY | Created top-level "Year Range: Source Conflict and Resolution" section with 5-source table |
| Total population may need to be derived from age subgroups | Claude | VALID ADDITION | Added note that Total may be sum of Children+Working age+Elderly per User Guide Figure 4 |
| Employment-to-working-age transition year not explicit | Claude | VALID ADDITION | Added "from 2029 onwards" with User Guide p.26 economic rationale |
| Users can overwrite UN projections in Excel | Codex | VALID ADDITION | Added "User overwrite capability" subsection |
| Population units "typically" → should be definitive | Claude | VALID CLARITY | Changed to "in thousands (definitive)" with golden master confirmation |
| Age group naming speculative → should be definitive table | Claude | VALID CLARITY | Created definitive table mapping Excel labels to engine keys |
| Raw worksheet coverage vs engine output coverage conflated | Codex | VALID CLARITY | Separated into distinct sections with clear ranges |
| Golden-master-driven claims vs source-document rules mixed | Codex | VALID CLARITY | Labeled each conclusion with its evidence source |
| Dependency ratio already documented | Claude | FALSE POSITIVE | Oracle already covers this in Key Formulas and Gotcha #10 |

## Productivity

| Finding | Reviewer(s) | Category | Action |
|---------|------------|----------|--------|
| Counter starts at 2030 not 2029 — golden master confirms | Claude | VALID BUG | Fixed all counter examples; updated WEO boundary documentation |
| Overwrite window is 2022-2028 per SPEC, oracle said 2023-2028 | Codex | VALID BUG | Fixed to 2022-2028 |
| turning_point=15 is adjustable per User Guide footnote 7 | Codex | VALID BUG | Updated parameter table to show modifiable |
| OECD rate presented as 1.1% without source resolution | Both | VALID BUG | Now shows both values (1.1% p.12, 1.2% p.27) with follow-Excel instruction |
| Module boundary between productivity and baseline_v1 unclear | Both | VALID CLARITY | Added explicit module boundary block |
| Three incompatible stories for 2022-2028 handling | Codex | VALID CLARITY | Rewrote with four labeled subsections per source |
| User Guide says "linear" but footnote 7 and SPEC say logistic | Codex | VALID ADDITION | Called out contradiction explicitly |
| PYTHON_REIMPLEMENTATION_GUIDE stale on "linear interpolation" | Codex | VALID ADDITION | Added explicit staleness note with line references |
| Table A/B benchmarking aids from User Guide omitted | Both | VALID ADDITION | Added Gotcha #11 documenting reference data |
| productivity_start meaning conflated with WEO-derived value | Claude | VALID CLARITY | Updated inputs table with explicit distinction |

## Inflation

| Finding | Reviewer(s) | Category | Action |
|---------|------------|----------|--------|
| WEO boundary: 2029 presented as settled, should be source conflict | Both | VALID BUG | Rewrote as explicit SOURCE CONFLICT with evidence table |
| Output schema missing iso3c and country per SPEC 4.3 | Codex | VALID BUG | Added all four SPEC-mandated columns |
| Inconsistent "2009-2028" vs "2009-2029" throughout | Codex | VALID BUG | Standardized to "2009-2029" matching golden master |
| Default 3.5/3.5 not scoped to Uganda | Claude | VALID BUG | Scoped all references to "Uganda defaults" |
| YEAR_END=2100 vs output 2099 unresolved | Codex | VALID BUG | Resolved as exclusive upper bound |
| Parameter-setting calibration logic from User Guide pp.13-14 | Both | VALID ADDITION | Added parameter-setting guidance section |
| GDP deflator vs CPI convergence rationale | Claude | VALID ADDITION | Added User Guide p.28 footnote 14 quote |
| turning_point=5 rationale missing | Claude | VALID ADDITION | Added economic reasoning |
| Logistic function redundant with productivity | Claude | VALID CLARITY | Added "SAME function, different turning_point" header |
| Gotcha #7 needs test recommendation for start != end | Claude | VALID CLARITY | Added concrete test parameters |
| WEO boundary scattered across 3 locations | Claude | VALID CLARITY | Consolidated into single section |
| Fallback for countries without inflation target | Codex | ~~NEEDS DOMAIN EXPERT~~ **RESOLVED** | No automated fallback. User Guide pp.13-14: "a user *could consider*" is advisory, not programmatic. Engine takes params with no fallback. |

## Baseline_v1

| Finding | Reviewer(s) | Category | Action |
|---------|------------|----------|--------|
| Output missing iso3c and country per SPEC 4.4 | Codex | VALID BUG | Added to output table |
| 2029 cutover presented as uncontested | Both | VALID BUG | Added source conflict documentation |
| Excel row references inconsistent (D14/D15 vs D12/D13) | Claude | VALID CLARITY | Fixed formula to match Excel analysis (D12/D13) |
| WEO-period data comes from macrofiscal, not recomputed | Claude | VALID ADDITION | Added Phase 0 (WEO-Period Data Loading) |
| Real GDP growth during WEO is an INPUT, not derived | Claude | VALID ADDITION | Documented in Phase 0 |
| Employment-to-working-age rationale missing | Codex | VALID ADDITION | Added User Guide p.26 rationale |
| Phase 2 doesn't explain WHY back-calculation exists | Claude | VALID CLARITY | Added "Why this back-calculation exists" paragraph |
| Ownership boundary between productivity and baseline_v1 fuzzy | Codex | VALID CLARITY | Added explicit ownership paragraph |
| Population growth formula not linked to total_population | Claude | VALID CLARITY | Updated with explicit formula and source |
| First year 2009 requires 2008 data — already in Gotcha #9 | Claude | FALSE POSITIVE | Already documented |
| working_age_population not used downstream | Claude | FALSE POSITIVE | It IS used (employment growth post-WEO) |
| Users can hard-paste DSA projections | Codex | FALSE POSITIVE | Excel UI feature, not engine logic |

## Interest Rate

| Finding | Reviewer(s) | Category | Action |
|---------|------------|----------|--------|
| Anchor value 7.85% vs 8.04% — resolved via User Guide p.14 | Both | VALID BUG | Anchor is 2029 value (8.039%), not 2028 (7.850%) |
| Historical rate uses debt(t-1) but Excel uses debt(t) | Both | VALID BUG | Changed to debt(t) matching Excel formula |
| Output missing iso3c and country per SPEC 4.5 | Codex | VALID BUG | Added to output table |
| Dashboard label mapping for 3 interest rate options | Claude | VALID ADDITION | Added full mapping table |
| IGD economic intuition from User Guide p.14 | Claude | VALID ADDITION | Added User Guide quote |
| When to use each option guidance | Claude | VALID ADDITION | Added subsection from User Guide pp.14-15 |
| Interest_expenditure reads from macrofiscal, not derived | Claude | VALID ADDITION | Added clarification |
| IGD warning for countries with demographic change | Codex | VALID ADDITION | Added User Guide footnote 9 caveat |
| Source disagree on dashboard choices (2 vs 3 options) | Codex | VALID ADDITION | Added mapping with resolution |
| t-1 lag needs worked example | Claude | VALID CLARITY | Added worked example with Uganda values |
| Gotcha #3 speculative — now resolved with source citation | Both | VALID CLARITY | Rewrote with User Guide p.14 as primary evidence |
| Module-to-baseline_v1 data flow unclear | Claude | VALID CLARITY | Added "Data flow summary" paragraph |
| Fixture-driven vs source-driven gotchas | Codex | VALID CLARITY | Reordered with source citations first |

## Fiscal

| Finding | Reviewer(s) | Category | Action |
|---------|------------|----------|--------|
| DSPB "only defined for projection years" — wrong per User Guide | Codex | VALID BUG | Fixed: computed from 2010 onward (wherever t-1 exists) |
| fiscal_gap "blank in early years" — not source-documented | Codex | VALID BUG | Replaced fixture-specific claim with source-document rule |
| DSPB notation inconsistency (percent vs decimal) | Claude | VALID CLARITY | Added notation reconciliation block |
| "Debt ceiling/floor" terminology not mapped | Both | VALID ADDITION | Added terminology mapping to Economic Logic |
| Revenue economic reasoning from User Guide p.28 | Claude | VALID ADDITION | Enhanced with "broadest tax base" explanation |
| Expenditure uses total pop — economic reasoning from User Guide p.28-29 | Claude | VALID ADDITION | Enhanced with "no policy change" explanation |
| fiscal_rule="No" behavior not documented | Claude | VALID ADDITION | Added subsection |
| Partial-equilibrium caveat missing | Codex | VALID ADDITION | Added User Guide citation |
| Horizon conflict 2099 vs 2100 | Codex | VALID ADDITION | Added horizon note with source hierarchy |
| Interest expenditure sign needs worked example | Claude | VALID ADDITION | Added concrete numbers |
| G14 (order of operations) buried at position 14/17 | Claude | VALID CLARITY | Promoted to Tier 1, first entry |
| 17 gotchas overwhelming | Claude | VALID CLARITY | Organized into 3 severity tiers |
| Mixes workbook rules with repo AGENTS rules | Codex | VALID CLARITY | Added `[repo engineering rule]` labels |
| Climate concepts in baseline oracle | Codex | VALID CLARITY | Labeled as "downstream context only" |
| fiscal_rule default — User Guide says start with "No" | Codex | FALSE POSITIVE | Pedagogical guidance, not different default. SPEC says "Yes". |
| Fiscal rule lag — already in G6 | Claude | FALSE POSITIVE | Already documented with User Guide quote |

## Climate

| Finding | Reviewer(s) | Category | Action |
|---------|------------|----------|--------|
| PROJ_START 2031 vs User Guide 2030 — critical off-by-one | Both | VALID BUG | Defaulted to 2030 per source hierarchy; documented as verify-against-golden-master |
| Gotcha #6 unresolved flag — needs resolution | Claude | VALID BUG | Rewrote as fully resolved three-boundary specification |
| 198 vs 171 countries — User Guide says 171 have data | Codex | VALID BUG | Added: 198 rows in Excel, 171 with data; listed 27 missing |
| baseline_primary_expenditure source ambiguous | Claude | VALID BUG | Made explicit: post-fiscal-rule from baseline_country() |
| Adaptation parameter m not explained | Both | VALID ADDITION | Added full section with User Guide p.36 citation |
| climate_variation first-year computation | Claude | VALID ADDITION | Added comments explaining gdp_index(2029) availability |
| Revenue: ratio-times-level, not growth-rate approach | Claude | VALID ADDITION | Added warning in Phase 4 |
| Discrete Risks worksheet structure | Claude | VALID ADDITION | Expanded with row layout from User Guide p.20-21 |
| No fiscal rule in climate — reasoning | Claude | VALID ADDITION | Added economic reasoning to Gotcha 12 |
| Scenario warming numbers undocumented | Codex | VALID ADDITION | Added User Guide Table 1 data with source |
| 2029 matches baseline under 2030 start rule | Codex | VALID ADDITION | Added to Gotcha 6 |
| "Five" vs "six" scenarios terminology | Both | VALID CLARITY | Added note explaining mismatch |
| Phase headers don't mark vectorizable vs recursive | Claude | VALID CLARITY | Added [VECTORIZABLE] and [RECURSIVE] annotations |
| GDP seed values for first projection year | Claude | VALID CLARITY | Added initialization block showing baseline values |
| Climate-data availability vs sheet structure conflated | Codex | VALID CLARITY | Separated structural fact from data availability |
| Climate start year needs golden master verification | — | ~~NEEDS DOMAIN EXPERT~~ **RESOLVED** | 2030 confirmed by 4 sources: Excel formulas, User Guide p.19, Discrete Risks sheet, golden master data. See WEO investigation. |

---

## Items Flagged for Domain Expert (Teal) — ALL RESOLVED

~~1. **Inflation: Fallback for countries without Central Bank inflation target.**~~ **RESOLVED:** The WEO boundary investigation (Investigation 3) confirmed there is no automated fallback in the workbook. The User Guide pp.13-14 uses advisory language ("a user *could consider*") directed at the human analyst. The engine takes parameters directly; the UI layer provides tooltip guidance.

~~2. **Climate: Exact start year of climate impacts (2030 vs 2031).**~~ **RESOLVED:** The WEO boundary investigation (Investigation 2) confirmed 2030 from four independent sources: Excel formulas, User Guide p.19 ("starting in 2030"), Discrete Risks sheet range (2030-2102), and golden master data. The SPEC's `PROJ_START = 2031` is definitively wrong.
