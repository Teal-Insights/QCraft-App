# Companion Guide — Council Review Synthesis

**Date:** 2026-03-17
**Reviewers:** Claude Opus 4.6, ChatGPT, Gemini
**Documents reviewed:** Preface, Parts 1-3, Glossary, References
**Source materials verified against:** IMF User Guide v10 (full 38 pages), SPEC.md, CLAUDE.md, app source code

---

## Summary Statistics

| Category | Claude | ChatGPT | Gemini | Total |
|----------|--------|---------|--------|-------|
| VALID BUG | 3 | 5 | 1 | 9 |
| VALID ADDITION | 3 | 1 | 1 | 5 |
| VALID CLARITY | 5 | 1 | 2 | 8 |
| FALSE POSITIVE | 1 | 0 | 0 | 1 |

**Total findings:** 23 (after deduplication)
**Fixes applied:** 13 (all VALID BUGs + high-severity VALID ADDITIONs/CLARITYs)

---

## Convergence (flagged by 2+ reviewers)

1. **Debt dynamics equation contains spurious `climate_t` term** — Claude #1, ChatGPT #2. Both independently identified that the equation `d_t = d_{t-1} × (1+r)/(1+g) - pb_t + climate_t` does not match the User Guide p. 31 equation `D_{t+1} = D_t * [(1+i)/(1+g)] - pb_t`. Climate impacts flow through reduced growth (g) and worsened primary balance (pb), not through a separate additive term. The glossary entry correctly omits `climate_t`, creating an internal inconsistency. **Verified against User Guide p. 31, pp. 33-36.**

2. **V1 capabilities overstated** — Claude #4, ChatGPT #1, ChatGPT #3, ChatGPT #5. Multiple passages describe the Explorer as if it already exposes productivity, inflation, and interest rate controls, "makes every assumption visible and adjustable," and has broadly verified parity. The shipped V1 app has exactly 5 sidebar inputs (country, demography_variant, debt_target, fiscal_rule, expenditure_rigidity). Uganda is the only golden-master-verified country. Data loads from bundled Parquet files, not from a live feed. **Verified against `apps/qcraft-app/app.py:49-102` and `tests/golden_masters/`.**

3. **Massetti author typo** — Claude #9, Gemini #2. Both flagged "Emanuele Massetti E." as a stray initial. **Note:** the User Guide references (p. 37) contain the same error, so this was likely copied from the source. Still a typo.

---

## Classification Rules

- **VALID BUG:** Factually wrong, contradicts User Guide or SPEC, or would embarrass us in front of Tim, Rahman, Carey, or Plamen. MUST be fixed.
- **VALID ADDITION:** Missing information that would strengthen the guide. Fix if low-effort; note for future if not.
- **VALID CLARITY:** Not wrong, but could be clearer. Fix if the edit is surgical.
- **FALSE POSITIVE:** Reviewer concern is unfounded. Explained briefly.

---

## All Findings (deduplicated, ranked by severity)

| # | Finding | Reviewer(s) | Category | Severity | Action |
|---|---------|-------------|----------|----------|--------|
| 1 | Debt dynamics equation has spurious `+ climate_t` | Claude, ChatGPT | VALID BUG | HIGH | **Fixed.** Removed additive term; updated explanation and symbol table |
| 2 | V1 described as having productivity/inflation/interest rate controls | ChatGPT, Claude | VALID BUG | HIGH | **Fixed.** Rewrote "How the Explorer works" and Part 3 to match V1's 5 parameters |
| 3 | "makes every assumption visible and adjustable" — false for V1 | ChatGPT | VALID BUG | HIGH | **Fixed.** Changed to describe actual V1 capabilities |
| 4 | Verification language overstated (top-level claim) | ChatGPT | VALID BUG | HIGH | **Fixed.** Changed "verified parity" to "tested parity" and qualified scope |
| 5 | Climate scenario warming levels conflate High and Hot | Claude | VALID BUG | MED | **Fixed.** Used User Guide Table 1 best estimates (wrt present) with distinct values |
| 6 | Debt-target ranges presented as IMF guidance without citation | ChatGPT | VALID BUG | MED | **Fixed.** Reframed as practitioner heuristics, not authoritative ranges |
| 7 | "complete, verified data" conflates availability with validation | ChatGPT | VALID BUG | MED | **Fixed.** Changed to "complete data coverage" |
| 8 | Massetti author typo ("Emanuele Massetti E.") | Claude, Gemini | VALID BUG | LOW | **Fixed.** Removed stray "E." |
| 9 | Missing climate impact start year (2030) | Claude | VALID ADDITION | MED | **Fixed.** Added to Part 1 climate section and Part 2 climate tab section |
| 10 | Missing glossary terms (WEO, DSA, LIC-DSF, DIGNAD) | Gemini | VALID ADDITION | MED | **Fixed.** Added four glossary entries |
| 11 | Missing partial-equilibrium framing in Part 1 | Claude | VALID ADDITION | LOW | **Fixed.** Added sentence in "What Q-CRAFT computes" section |
| 12 | Missing adaptation spending caveat | Claude | VALID CLARITY | MED | **Fixed.** Added to climate scenarios callout box |
| 13 | Expenditure growth not stated as multiplicative | Claude | VALID CLARITY | MED | **Fixed.** Added parenthetical noting multiplicative form |
| 14 | Capacity development "stretch further" claim too strong | ChatGPT | VALID CLARITY | LOW | Deferred — acceptable as positioning language for V1 |
| 15 | Revenue growth explanation slightly imprecise | Claude | VALID CLARITY | LOW | Deferred — current phrasing is adequate for audience |
| 16 | Fiscal rule trigger conditions not explained | Claude | VALID CLARITY | LOW | Deferred — too much detail for Part 2; covered by User Guide reference |
| 17 | Missing workflow guidance for DSA/C-PIMA use cases | ChatGPT | VALID ADDITION | MED | Deferred — requires substantial new content; noted for V2 |
| 18 | Climate data attribution could be more precise | Claude | VALID ADDITION | LOW | Deferred — current attribution is accurate enough |
| 19 | PDF rendering of collapsible callouts | Gemini | VALID CLARITY | LOW | Deferred — HTML is primary format; PDF renders expanded (acceptable) |
| 20 | PDF rendering of glossary span classes | Gemini | VALID CLARITY | LOW | Deferred — not actionable for tomorrow |
| 21 | OECD productivity rate 1.1% vs 1.2% | Claude | FALSE POSITIVE | — | The companion guide does not state the OECD comparison rate. The "1.2%" on line 17 refers to the Dashboard productivity default, which IS 1.2% per User Guide Figure 2. The User Guide itself is inconsistent (p. 12 says 1.1%, p. 27 says 1.2%). No companion guide fix needed. |

---

## Verification Notes

For every VALID BUG, the reviewer's claim was verified against the User Guide PDF before applying the fix:

- **#1 (debt equation):** User Guide p. 31 confirms `D_{t+1} = D_t * [(1+i)/(1+g)] - pb_t`. No climate term. Climate transmission described on pp. 33-36 goes through productivity and expenditure channels.
- **#2-4 (V1 capabilities):** App source code `apps/qcraft-app/app.py:49-102` confirms exactly 5 inputs. Test suite is Uganda-centric. Data loads from local Parquet.
- **#5 (warming levels):** User Guide Table 1 (p. 33) gives best estimates wrt present: Paris 0.7°C, Moderate 1.6°C, High 2.5°C, Hot 3.5°C. High and Hot are 1°C apart, not the same range.
- **#6 (debt targets):** User Guide pp. 15-18 discusses fiscal rule setup but does NOT provide country-type ranges.
- **#7 ("verified data"):** Code shows the country filter is a data-completeness check, not a parity-verification filter.
- **#8 (Massetti):** User Guide p. 37 has the same "E." typo; confirmed author name is simply "Emanuele Massetti."
- **#9 (2030 start):** User Guide p. 19: "Q-CRAFT assumes that fiscal projections will be affected by climate change scenarios starting in 2030."
