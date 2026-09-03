# CC-26: the accuracy pass before the FAD viewing

**Status:** in review. Branch `feat/accuracy-pass`, cut from `freeze-2026-08-29c`
(the deployed Explorer), worktree `~/GitHub/QCraft-App-cc26`, trail TEA-1400,
GitHub issue #78. Spec: the 2026-09-02 audit (plan sections 1.1 to 1.5, decisions 1.5
binding; audit-detail A and B). Standing order: inscrutably accurate first.

**Bottom line.** The four copy blockers are gone from the running app. The Explorer
now says only what the IMF workbook and the User Guide (Tim and Rahman, 2024) say
about the six scenarios, the citations, the counterfactual, the verifier and the
defaults. The two inputs the workbook lets a user set and the Explorer froze, the
long-run real rate (Dashboard!C29) and the productivity Turning Point
(Productivity!J21), are parameters in both engines and the sidebar. The fiscal rule
replicates the workbook's three-way sign test exactly. Seven new Excel golden masters
cover every path that had no Excel comparison, and both engines reproduce all seven,
baseline and six scenarios, to 1e-6 of a percentage point.

## What changed

**Block 1, the blockers (commit `bae433a`).**
- Scenario labels are the guide's six names in `constants.py`, `constants.ts`,
  `apps/qcraft-web/src/engine/types.ts` and `engine-api.md`: Paris, Moderate, High,
  Hot, Hot adapted, Hot unadapted. Every legend, table, CSV and xlsx header, widget and
  annex reads the one label map, so the change reached them all through one edit. The
  family grouping and the adaptation lightness ramp (`HOT_FAMILY`) are untouched.
- The reasoning that lived in the `types.ts` comment (Hot is the 90th percentile of the
  same SSP3-7.0 models whose median is High) is now user-facing as
  `SCENARIO_FAMILY_NOTE` in the new `content/scenarios.ts`, printed under the scenario
  list on the Methodology tab and carried in the Climate tab's guidance.
- `content/scenarios.ts` holds the guide's six definitions (sections II.C and IV.B) with
  the adaptation windows m = 30, 20 and 50 years as one constant, and a one-clause form
  for the Climate lede, which now lists six.
- `content/references.ts` holds every citation, rendered by both the Methodology and
  About-the-data tabs through one component. Batini et al. (2024) is gone from the
  tab and the README. The workbook is cited to the IMF Fiscal Affairs Department
  (Version 1.0_11-15-2024), the User Guide to Tim and Rahman (2024), and Centorrino,
  Massetti and Tagklis (2024) carries "Climate Effects on GDP Growth: Updated
  Estimates of Kahn et al. (2021)", Reference Guide.

**Block 2, honesty toward the workbook (commit `e4d09d1`).**
- The climate counterfactual is the trend-warming path (temperatures continuing their
  1960-2014 trend, guide lines 144 and 1347), and About the data now says why Paris can
  show a GDP gain.
- Verified badge: "Teal Insights verified baseline parity for 147 of 147 tested
  countries; climate-scenario parity confirmed for ratio metrics only. Reproduces the
  IMF Excel workbook." The `modes.test.ts` gate was re-pinned to the character.
- "Engine default" is "Explorer default" in every user-visible string (sidebar,
  export tab, provenance notice, report, chart pack, read-me, workbook, CSV trailer,
  panels, widgets, run-file warnings). One sidebar sentence, `EXPLORER_DEFAULTS_NOTE`:
  "The IMF workbook ships with no considered default. These are this tool's starting
  values, the same for every country."
- About the data gains "What the IMF workbook offers that this tool does not yet",
  driven by `ABOUT.workbookOnly`. An item that names a parameter key drops off the
  list the moment that key is registered in `content/params.ts`; the real rate and
  Turning Point items retired themselves when Block 3 landed, and the test
  `accuracy.test.ts` proves the mechanism both ways. Three items remain: own-data paste
  into the blue cells, the Discrete Risks worksheet, the OECD realism check.
- Country count: "175 countries with WEO and UN coverage. Eleven of them have no
  climate estimate (User Guide footnote 12)". The no-climate notice cites the footnote.
- Minor wording: rigidity described as the guide describes it (1.0 keeps the baseline
  level, 0.0 keeps the baseline share) and filed under a new "Climate scenarios"
  sidebar heading with a matching `ParamGroup`; debt-target and fiscal-rule help say
  what the workbook does (cut primary expenditure by the gap, target approached not
  hit; the guide's starting posture of No and 0); the Verified vintage quotes Dashboard
  B10; "pathways" is "scenarios" in the report, the workbook, the chart subtitle and
  the climate widget; "Uganda's WEO forecast for 2029 is 36%"; the floor asymmetry is
  the workbook's construction in the Methodology notes and the climate widget
  footnote; the 2030 note gives the guide's reason (section II.C); the Methodology
  climate sentence matches About (a slowdown in productivity growth); "frontier" is
  "the OECD".

**Block 3, the frozen inputs and the rule edges (commits `852a779`, `ae6ec72`).**
- `long_run_interest_rate` (default 1.0) and `productivity_turning_point` (default 15)
  in `PipelineParams` (TS), `DEFAULTS` (both engines), `run_pipeline` and `runPipeline`,
  `productivity_country` and `productivityCountry` (new `turning_point` argument), and
  `EngineParams` plus the registry in the Explorer. The registry drives the manifest,
  the report annex, the CSV trailer and the workbook, so both parameters travel into
  every export; `accuracy.test.ts` pins the CSV trailer and the annex.
- Sidebar: the real rate shows only when the approach is Real interest rate, labelled
  "Long-run real interest rate (% real, long run)"; the Turning Point sits under the
  productivity fields with a note naming the halfway year. Both carry the provenance
  chip, the rationale line and a Context button.
- Panels: the interest-rate panel projects the constant-real path at the rate set and
  draws the observed Fisher real rate as a dashed record; the productivity panel draws
  the assumption on the chosen Turning Point and annotates the halfway year.
- Run files: strict validation stays. A file written before 0.3.0 restores the two
  missing parameters at the Explorer default with a warning naming them and the version
  that added them (`ADDED_IN` in `runFile.ts`). App version 0.3.0.
- Fiscal rule, both engines: `_fiscal_rule_value` / `fiscalRuleValueFor` replicate
  `Baseline!CL46` (direction 1 rising, 2 falling, 0 flat), `CL47` (the gap only strictly
  above the target while rising), `CL48` (only strictly below while falling), `CL42`
  (0 when flat) and the target-0 disable in `C47/C48`. The seven domain rules are
  intact: the loops are explicit, the adjustment is additive in levels, the baseline
  floor is `max(0, ...)` and the scenarios have none.

**Verification assets.**
- `scripts/verify/excel_edges.py` drives Excel through xlwings and writes
  `packages/qcraft-engine/tests/golden_masters/excel_edges/*.csv`; the README beside
  them names the cells set for each case.
- `tests/test_excel_edges.py` and `tests/excel-edges.test.ts` run each case in each
  engine against its CSV: 7 cases x 7 sheets = 49 checks per engine, ratios at 1e-6 pp,
  levels at 1e-9 relative. All 98 pass.
- `verification-logs/SENSITIVITY_COMBINATIONS.md` publishes the 25 combinations (5
  countries x 5 parameter sets from `phase3_sensitivity.py`) and the 30 climate runs,
  with their checkpointed results.
- Fixtures added for the two new golden-master countries: `MOZ.json` and `ARE.json`
  under `tests/fixtures/countries/weo-2024-10/` and
  `packages/qcraft-engine-ts/tests/fixtures/` (the same payloads the app serves).

## The golden masters, and what they settled

| Case | Country | Cells | Python | TypeScript |
|---|---|---|---|---|
| `real_rate_2p5` | Uganda | C28 = Real interest rate (a), C29 = 2.5 | pass | pass |
| `turning_point_10` | Uganda | Productivity!J21 = 10 | pass | pass |
| `target_0_rule_yes` | Uganda | C33 = Yes, C34 = 0 | pass | pass |
| `floor_bound_rule_yes` | Mozambique | C33 = Yes, C34 = 5 | pass | pass |
| `floor_bound_rule_no` | UAE | C33 = No, C34 = 0 | pass | pass |
| `igd_mode` | Uganda | C28 = Interest-growth differential | pass | pass |
| `rigidity_0` | Uganda | C38 = 0 | pass | pass |

Before the rule fix, `target_0_rule_yes` and `floor_bound_rule_yes` failed in both
engines on every sheet (14 failures each), and the other five passed. That is the
audit's F3 reproduced and closed: the target-0 and flat-debt edges were real
departures, and no other case moved.

Finding the floor-bound country took a sweep of all 197 payloads: at the workbook's
shipped values (rule Yes, target 60) no country's baseline debt reaches the zero floor,
so edge (b) is unreachable there. With the rule on and a target of 5, Angola,
Mozambique and Malawi reach the floor (Mozambique from 2038, for 43 years). With the
rule off, 59 countries do. Mozambique at target 5 and the UAE with the rule off are the
two masters.

Two things the workbook taught the driver, both recorded in the README:
- The Dashboard's dropdown text for the real-rate option is `Real interest rate (a)`,
  the `(a)` pointing at footnote cell B29. `Interest Rate!A14` compares that text to
  `A17:A19` exactly, so the engine's enum string matches nothing and blanks the rate
  row. The engine's enum is unchanged; the driver maps it.
- The IMF file opens without a link dialog only through LaunchServices. The earlier
  verify scripts copied it into the Office group container, and on this machine that
  folder now raises a macOS data-access prompt that blocks every process touching it.

## Every audit finding, with its status

Audit A (engine parity):

| # | Finding | Status |
|---|---|---|
| F1 | Real rate frozen at 1.0 | fixed: parameter in both engines, sidebar under Real mode, golden master at 2.5 |
| F2 | Discrete Risks absent | deferred to Phase 1 per plan 2.5 (both engines still accept `RiskRow[]` per call) |
| F3 | Rule edges (a, b, c) | fixed in both engines; (a) and (b) have golden masters; (c) is measure-zero and covered by the same branch |
| F4 | OECD relative level not shown, post-2021 level compounds off the placeholder | deferred (Phase 1); named on screen in the workbook-only list |
| F5 | Turning points hardcoded | fixed for productivity (parameter, golden master at 10); inflation's stays 5, which the guide does not offer to change |
| F6 | Explorer defaults differ from Excel as shipped | labelled, per decision 1.5.2 |
| F7 | IGD, real, rule No, rigidity 0, High/Low, turning points untested; 25 combinations unlisted | list published; golden masters for real, IGD, rigidity 0, turning point, rule No, target 0, floor. Disagreement below on what was already tested |
| F8 | Workbook defects to report upstream | unchanged; for the courtesy note after the demo |
| F9 | Same-year interest anchor | unchanged, documented |
| F10 | WEO boundary per country | unchanged |
| F11 | Start productivity as a period label | deferred |

Disagreement with A, section 3 and F7: the audit lists IGD mode, rule "No" and
rigidity 0.0 as untested against Excel. `scripts/verify/phase3_sensitivity.py` tested
all three on five countries (`igd_mode`, `no_rule`, `flexible_high_target` with
rigidity 0.0 and target 70), PARITY_PASS at 0.0 pp per `phase3_checkpoint.json`. The
audit could not see the script because its working set was self-contained, which is
exactly why the list is now published. The new masters add CSVs for those paths anyway,
so the claim is checkable in the repo rather than in a checkpoint file. One nuance the
audit's "1e-12 pp" phrasing hides: the phase scripts classify PARITY_PASS at 0.1 pp,
and the recorded worst differences are 0.0 at their printed precision. The new suites
assert 1e-6 pp, which both engines meet.

Audit B (copy):

| # | Finding | Status |
|---|---|---|
| 1 | Temperature suffixes | fixed |
| 2 | NGFS-style descriptions | fixed |
| 3 | Batini reference | fixed |
| 4 | Centorrino title | fixed |
| 5 | No-warming counterfactual | fixed |
| 6 | Badge names no verifier | fixed |
| 7 | Engine default | fixed |
| 8 | Silence on the five gaps | fixed, data-driven |
| 9 | Guide called internal | fixed |
| 10 | 175 with complete data | fixed |
| 11 | Real rate value not settable | fixed by Block 3; help text names the field |
| 12 | Rigidity "barely adjusts" | fixed |
| 13 | Rigidity under Fiscal policy | fixed: Climate scenarios heading and group |
| 14 | Debt target "adjusts the primary balance" | fixed |
| 15 | 2029/2030 boundary wording | fixed |
| 16 | "workbook v10" | fixed |
| 17 | "pathways" | fixed |
| 18 | "Three files" | fixed |
| 19 | "ended 2029 at 36%" | fixed |
| 20 | Damage functions as level shocks | fixed |
| 21 | "engine's own design" | fixed |
| 22 | Footnote 12 not cited | fixed |
| 23 | FADCP short form | left as gated (cc2-wording-gate) |

Not in the kickoff and left alone, for the record: the "long run" versus "End" label
(B section 5), because the label is pinned in the manifest tests and every exported
annex, and the guide itself uses both words; "Demography variant" versus the guide's
"demographic scenario"; and the guide's own OECD 1.1 versus 1.2 inconsistency (F8).

## Decisions taken in this lane

- Branch from the tag, not `main`: `main` carries only the CI pin and none of the
  Explorer source the audit line numbers point at.
- The kickoff's sentences with semicolons became two sentences where the style guide
  wanted it (the defaults note, the country count); the Verified badge keeps the
  kickoff's exact wording because the gate test pins it to the character.
- The Methodology list followed `SCENARIO_DISPLAY_ORDER` when this lane closed. Teal's
  call, applied by CC-28 on 2026-09-03: that list alone reads in the guide's order,
  Paris, Moderate, High, Hot, Hot adapted, Hot unadapted (`SCENARIO_GUIDE_ORDER` in
  `content/scenarios.ts`, pinned by `tests/methodologyOrder.test.ts`); every legend,
  chart and the Climate lede keep the adaptation ordering.
- The UN DESA entry left the reference list: the population release is a data source
  that changes with the mode and is listed per mode above the references.
- The "long-run" wording for the real rate follows the workbook's own label,
  "Assumed long-run real interest rate" (Interest Rate!A21).
- The floor-bound master uses a target of 5 because no country reaches the floor with
  the rule on at any target of 20 or above; the case is about the edge, not the target.
- The `MOZ` and `ARE` fixtures are committed (about 250 KB each) so the suites run on a
  fresh clone, matching how `UGA.json` is already handled.

## The battery

Baseline before any change: pytest 215, ruff clean, pyright 0 errors, TS engine 83,
web 304, typecheck and lint clean.

After, run 2026-09-02 on the final commit:

| Check | Result |
|---|---|
| `uv run pytest packages/qcraft-engine/tests` | 266 passed (51 new: 49 Excel edges, 2 labels) |
| `uv run ruff check .` | clean |
| `uv run pyright packages/qcraft-engine/` | 0 errors, 0 warnings |
| TS engine `vitest` | 134 passed (51 new) |
| TS engine typecheck, lint | clean |
| Web `vitest` | 335 passed (31 new gate and parameter tests) |
| Web typecheck, lint, build | clean |
| Seven tabs screenshotted (`scripts/screenshot.mjs`) | `docs/screenshots/cc26/`, zero console errors |
| Interactive checks | the real-rate field appears only under Real mode; the interest-rate panel draws the constant-real path at 2.5 and the Fisher record; the productivity panel marks the halfway year |

Re-run by CC-28 on 2026-09-03 at the tip `32e0b0e` (the Methodology order change on
top of the commits above): pytest 266, ruff clean, pyright 0 errors, TS engine 134,
web vitest 338 (3 new, the order test), typecheck, lint and build clean, the seven tabs
re-shot into `docs/screenshots/cc26/` with zero console errors. At that point
`scripts/freeze-check.sh` still held the 2026-08-27 wording for the Verified badge (gate
1) and the zero-climate notice body (gate 4), both replaced by this lane under decisions
1.5 (audit B findings 6 and 22), so its copy half failed on those two strings. Teal
re-pinned both in `f625e0b` the same day, after `b34668c` made the chart pack's parameter
count read from the registry (it had said "lists all ten" with twelve registered).
CC-28's `381c04b` pins that count to the registry in the test and retires the last three
"ten" comments. Re-run at `381c04b`: web vitest 341, typecheck, lint and build clean,
seven tabs with zero console errors, `scripts/freeze-check.sh` PASS.

## Pin instruction for the next freeze

Tag the tip of this branch `freeze-2026-09-03` and move two lines in
`.github/workflows/companion-guide.yml` together, the way #74 pinned `freeze-2026-08-29c`:
the `app_ref` default (both the input default and `APP_REF`) from `freeze-2026-08-29c` to
`freeze-2026-09-03`, and

```
EXPLORER_DIST_SHA256: 1e79547cb1972e47c83e6ec452447d20d445391a4cadf4f9c0b1819416a51b6d   # freeze-2026-09-03
```

| Pin | Computed at | Status |
| --- | --- | --- |
| `6ef4632097e15e5c5ad1561bee6b43ba1e93fc0ad8056b0f94908008a7df6c57` | `32e0b0e`, 2026-09-03 morning | superseded: `b34668c` changed two chart-pack strings (the parameter count now reads from the registry) |
| `1e79547cb1972e47c83e6ec452447d20d445391a4cadf4f9c0b1819416a51b6d` | `381c04b`, 2026-09-03 afternoon | current |

Both with the workflow's own method (sha256 of the sorted per-file sha256 manifest of
`apps/qcraft-web/dist` with `data/` excluded, 32 files) at
`VITE_BASE_PATH=/QCraft-App/explorer/` on Node 25.9.0, each byte-stable across two
consecutive builds. The method was checked by rebuilding `freeze-2026-08-29c`, which
reproduced the outgoing pin `d44c5c1a...94bea` exactly. Commits after `381c04b` on this
branch are documentation only and do not enter the bundle; the CC-28 hand-off report
records the rebuild at the final tip.

## Pointers

- Audit: `01-PROJECTS/_Personal/Personal Chief of Staff/2026-09-02_QCraft-Explorer-Audit/`
- Kickoff: `kickoffs/CC-26-accuracy-lane.md`
- Golden masters: `packages/qcraft-engine/tests/golden_masters/excel_edges/README.md`
- Sensitivity list: `verification-logs/SENSITIVITY_COMBINATIONS.md`
- Content modules the copy now reads from: `apps/qcraft-web/src/content/scenarios.ts`,
  `content/references.ts`, `content/modes.ts` (`ABOUT.workbookOnly`)
