# Lane 4 morning report: course restructure, Modules 0-6 (TEA-948)

Branch: `feat/lane4-course`. Nothing pushed, no remotes added. Run date 2026-08-26.

## Status

Done. `quarto render docs/companion-guide` passes clean (exit 0, no warnings, no unresolved cross-references), HTML and PDF both build, and the committed PDF artifact is regenerated.

## What changed

The companion guide is now a seven-module course instead of three parts.

| File | Provenance |
|---|---|
| `index.qmd` | Rewritten preface: module table, "start at M0", corrected description of the co-design material |
| `m0-start-here.qmd` | New |
| `m1-how-qcraft-thinks.qmd` | `git mv` from `part1-policy.qmd`, then rebuilt |
| `m2-debt-equation.qmd` | New (Path A) |
| `m3-parameters.qmd` | `git mv` from `part2-using.qmd`, then rebuilt |
| `m4-uganda-end-to-end.qmd` | New, absorbing the results-interpretation prose from old Part 2 |
| `m5-boundaries.qmd` | New, absorbing the caveat material scattered across old Parts 1 and 2 |
| `m6-capstone.qmd` | New |
| `appendix-codesign.qmd` | `git mv` from `part3-codesign.qmd`, reframed as out-of-path, parity wording corrected |

Renames were committed as pure renames first, so the reflow shows up as edits rather than as delete-plus-add.

**Where the old prose went.** Roughly 70 percent of the existing text is relocated rather than rewritten, as the redesign plan intended.

- Old 1.1 (MoF-economist vignette) → M1, verbatim
- Old 1.2 (what Q-CRAFT computes, equation, symbol table) → M1
- Old 1.2.2 (the seven-paragraph prose wall) → M1, rebuilt as a table plus seven mini-diagrams plus a self-check
- Old 1.2 debt-floor asymmetry callout → M5
- Old 1.2 scenario table → M1 (collapsed); its conservatism paragraph → M5
- Old 1.3 (how the Explorer works) → split: early win to M1, tab orientation to M3
- Old 1.4 (verification) → M1, once, with corrected wording
- Old 2.1 (Quick Start) → M1 as the 10-minute Uganda early win
- Old 2.2 (five parameters, What/Why/How-to-set) → M3, kept intact, with new layers on top
- Old 2.3 (four tabs, Baseline Sanity Check) → M4, inside the worked case
- Old 2.4 (what the numbers mean) → M5
- Old Part 3 → appendix, out of the learning path

## Definition-of-done check

- [x] All module files exist and render
- [x] Existing prose relocated per the blueprint
- [x] Behavioral objectives (Bloom verbs, 3-5, workplace performances) on all seven modules
- [x] Concept-map scaffolds: the master map appears in all seven modules with the current node lit; M1 adds seven per-module mini-diagrams; M2 adds a partial map to complete
- [x] Self-check scaffolds: M1 where-does-it-live, M2 three-claims, M3 one defend-your-choice per parameter (5), M4 completion and independent problems, M5 which-tool five-item, M6 retake of the M0 inventory
- [x] Marker inventory below

## Marker inventory

| Module | Lines | Objectives | Mermaid | DRAFT FOR TEAL | SCREENSHOT-TODO | WIDGET-TODO | Other TODO |
|---|---|---|---|---|---|---|---|
| M0 start here | 180 | 4 | 1 | 3 | 0 | 0 | 0 |
| M1 equation + modules | 314 | 4 | 10 | 1 | 1 | 1 | 0 |
| M2 debt equation | 245 | 4 | 3 | 4 | 1 | 1 | 0 |
| M3 parameters | 298 | 4 | 1 | 5 | 1 | 1 | 0 |
| M4 Uganda end to end | 301 | 5 | 1 | 6 | 2 | 0 | 1 |
| M5 boundaries | 197 | 4 | 1 | 4 | 0 | 0 | 1 |
| M6 capstone | 162 | 4 | 1 | 2 | 0 | 0 | 2 |
| **Total** | **1,697** | **29** | **18** | **25** | **5** | **3** | **4** |

`appendix-codesign.qmd` (91), `index.qmd` (41), `glossary.qmd` (43) and `references.qmd` (17) carry no markers.

**DRAFT FOR TEAL blocks, by kind.** M0's three concept-inventory questions with their answers; M1's self-check answers; M2's four new explanations (identity from words, the r-minus-g sign trace, the debt-stabilizing primary balance, self-check answers); M3's five defend-your-choice answers including the rigidity argument; M4's six interpretation blocks including the model two-paragraph write-up; M5's four (conservatism hazard, floor asymmetry reading rule, why the comparison is a search, which-tool answers); M6's rubric and the retake answers. Every one is best-effort text in your voice's general direction, not an attempt at your finished voice on a new argument.

**SCREENSHOT-TODO (5).** M1 Analysis tab with the baseline-to-Hot gap called out; M2 Baseline tab showing deficit alongside a stable ratio; M3 rigidity 1.0 versus 0.0 on matched axes; M4 Baseline tab three-chart annotated, and M4 Climate tab GDP index with labels on the data. No screenshots were fabricated.

**Other TODO (4).** M4: verify the "4 percent of GDP" perspective comparator against a named budget line before shipping. M5: seed the country-comparison exercise with two or three verified pairs. M6: replace the common-errors list with pilot-observed errors; produce the workshop artefacts (task cards, poll items, peer-review sheet).

**WIDGET-TODO (3).** Anchors in M1, M2 and M3 for the lane 2 intuition widgets, per the 8/26 pm note in SHARED/REFERENCE-NOTES.md. Not embedded, since the integration pass runs after this lane and run 3 both land. The surrounding prose carries the full idea on its own, so the modules work without the widgets.

## Uganda Fiscal Risks Statement: found

Downloaded to `source-materials/2024_MoFPED_Uganda-Fiscal-Risk-Statement-FY2024-25.pdf` (31 pages, 1.1 MB, verified `%PDF`).

- Source: `https://www.finance.go.ug/sites/default/files/2024-05/Fiscal%20Risk%20Statement%20FY%2024-25.pdf`, reached via `https://www.finance.go.ug/search/node?keys=fiscal+risk`. Read-only GET.
- The FY 24/25 edition is the latest published on the site. The other two hits are FY 2020/21 and November 2018.
- Note: `.gitignore` excludes `source-materials/` and `*.pdf`, so the file is on disk in this clone but not committed. That matches how the repo already treats source materials.

**It is better than expected.** Section III (pp. 13-17) is a Q-CRAFT write-up, sourced to "QCRAFT (2023)". M4 now uses its real structure as the target format and reproduces its Table 5 baseline fiscal path. Every Uganda number quoted in the course comes from either that statement or the C-PIMA high-level summary:

- Baseline fiscal path 2023/2050/2075/2099, including debt at 47.1 → 36.2 → 35.8 → 47.5 percent of GDP (FRS Table 5)
- Hot scenario: about 4 percent GDP loss by end of century; primary deficit 0.7 points worse than baseline; debt over 18 points higher (FRS Section III)
- Debt passes the 50 percent of GDP fiscal rule ceiling in the High, Hot and Vulnerable scenarios (FRS Section III)
- Debt at 66 percent versus 47.5 percent baseline; impact milder than other SSA countries (C-PIMA high-level summary, IMF 2024)
- Public debt 46.9 percent at June 2023 from 48.4 percent at June 2022, the fall partly a nominal-GDP effect (FRS Section IV)

One naming difference worth knowing before the session: the Statement reports five scenarios and calls the last one "Vulnerable" where the Explorer says "Hot Unadapted". M1 flags this.

## Binding content rules

- **Parity.** Stated once, in M1, as "baseline parity is exact for 147 of 147 tested countries" plus "climate-scenario parity is confirmed for ratio metrics". M1 adds an explicit sentence on what the second claim does not cover. The appendix's old "well over 140 countries, 0.0 across the board" line is replaced with the same wording. No broader claim anywhere.
- **Climate source.** README's two "NGFS Phase IV" errors fixed (commit `5632250`). The guide prose was already correct on FADCP; swept and confirmed.
- **Show-don't-tell.** Auto data loading is demonstrated in the M1 ten-minute run rather than asserted; guidance at point of need appears as the What/Why/How-to-set blocks in M3; documented rationale is the Document it blocks feeding the export packet; fast polished output is the Data tab export in M4 Step 6. No marketing language in the modules; the SovTech pitch is confined to the appendix.
- **No em-dashes.** Swept, zero in the guide.

## Things for you to decide

1. **`apps/qcraft-app/app.py` still says NGFS in six places** (lines 354, 389, 461, 515, 544, 546), including a citation block that credits "NGFS (2023), NGFS Climate Scenarios". I did not touch it: it is another lane's file and editing it risks a conflict. It is the same factual error as the README, and it is visible in the shipped app's Methodology tab, so it should be fixed before Sept 1.
2. **Country count disagreement.** README says 175 countries, the guide says 197 (in M1 about the IMF workbook, and in M3 about the Explorer's own coverage). Both cannot be right about the Explorer. I left the guide's numbers as they were rather than guess.
3. **The M4 model write-up's closing sentence** does policy advocacy ("meeting Uganda's Paris commitments and building expenditure flexibility both reduce this exposure"). In a risk document that may be a step too far. Flagged inside the DRAFT block.
4. **Rubric weights** in M6 (40/20/25/15) are a proposal, not a decision.
5. **M2's fate.** It is written as skippable Path A material. If the Sept 1 session has more Climate Finance Unit staff than macro staff, it may deserve to be non-optional.

## Not done, and why

- **Videos.** The Pedagogy Toolkit's 6-minute video slots are not scaffolded. Out of scope for a mechanical restructure and there is no video pipeline in this repo.
- **Workshop artefacts.** Task cards, polls and the peer-review sheet are tracked as a TODO in M6 rather than built. The redesign plan puts them in a later week.
- **Pilot.** The common-errors list in M6 is derived from the misconceptions the course was designed against, not from watching anyone. Marked as a hypothesis in the file.

## Commits

```
5632250 fix(README): climate damage source is the FADCP Climate Dataset, not NGFS Phase IV
b31b7c2 docs(guide): rename part files to their module destinations
2e40eeb docs(guide): add M0 (start here) and rebuild M1 (equation + seven modules)
10a20ea docs(guide): add M2 (debt equation, Path A) and rebuild M3 (parameters as judgment calls)
02209db docs(guide): add M4, the Uganda worked case end to end
ee2c171 docs(guide): add M5 (boundaries) and M6 (capstone and wrapper)
8fdad75 docs(guide): wire the module skeleton into the book and rebuild the PDF
836baae docs(guide): mark every judgment answer as DRAFT FOR TEAL and collapse it
```
