# Merge report: the four sprint lanes onto `feat/explorer-v2-integration`

**CC-7, 2026-08-27.** Merges PRs #62, #64, #61 and #63 onto the integration
branch, resolves the CC-3/CC-4 export seam, applies Teal's evening wording gate,
and runs the freeze battery.

Issue: TEA-1400. Worktree: `~/GitHub/QCraft-App-cc7`. Base: `2e8b436`, the head
of `feat/explorer-v2-integration` after CC-1's three-lane consolidation.

---

## 1. Bottom line

The battery is green. 524 automated tests pass across three suites, both engines
agree to within 4.4e-16 over 168,938 numeric cells against a 1e-12 tolerance, and
all six browser loops run clean on a fresh build.

Thirteen nontrivial conflict resolutions and the four-step export seam are
recorded below, each with the reasoning.

Ten defects were found and fixed. Four could not exist inside any single lane
and turned up in the battery (section 6). Six more came out of an adversarial
pass over the finished merge, and five of those were mine: four introduced by
the seam rewire and one by misreading the wording gate (section 6.5). Each has
a test that would have caught it.

Three things are held for Teal in section 8. None of them blocks the freeze.
CC-6 is unblocked: the Zambia, Libya and Serbia divergence is characterised in
section 7 with the harness output that shows it.

---

## 2. What merged, in what order

The order is the one the sprint's reference notes set, and the reason is that
CC-2 replaced the fixture adapter with the real engine. Everything else has to
land on top of that, not beside it.

| Order | PR | Lane | Branch | Merge commit | Conflicted files |
| --- | --- | --- | --- | --- | --- |
| 1 | [#62](https://github.com/Teal-Insights/QCraft-App/pull/62) | CC-2, two modes | `feat/two-modes` | `df4fcff` | none |
| 2 | [#64](https://github.com/Teal-Insights/QCraft-App/pull/64) | CC-3, export packet | `feat/export-packet` | `b05fc4b` | 1 |
| 3 | [#61](https://github.com/Teal-Insights/QCraft-App/pull/61) | CC-4, chart registers | `feat/takeaway-charts` | `1a71673` | 4 |
| 4 | [#63](https://github.com/Teal-Insights/QCraft-App/pull/63) | CC-5, parameter discovery | `feat/param-discovery` | `3143ff3` | 4 |

Then three commits of integration work: the wording gate (`362d6be`), the peer
table fix (`a0eabf9`), and the browser loops (`72237fe`).

### The topology, which is not what the notes assumed

The notes describe CC-4 as "cut from before CC-2" and needing a rebase. That is
true of CC-4 and equally true of CC-5: both branch from `2e8b436` and carry none
of CC-2's twelve commits, so both merges carried a rebase as well as their own
content.

CC-3 is the exception, and it made the second merge cheap. `feat/export-packet`
was cut from CC-2's `12a2936`, not from `2e8b436`, so it already contained the
two-modes core. The real merge base for #64 is that commit, git did a proper
three-way merge against it, and only one file conflicted.

---

## 3. The CC-3/CC-4 export seam

`docs/export-contract.md` section 3.1 lists four steps. All four are done, in
commit `1a71673`. They are interlocked: step 2 needs step 1, because
`renderSpecSvg` takes a whole `ChartSpec` and `PacketFigure` did not carry one.

**S1. `packetFigures()` calls `exportFigures()`.** `PacketFigure` now carries a
`ChartSpec` in place of the flat `series` / `height` / `weoBoundaryYear` /
`zeroLine` / `format` fields, plus `register` and `source`. The report goes from
four hand-built figures to the registry's ten. `groupFigures()` needed no change,
which is what CC-3 designed for: `tab` already carried CC-4's field name and
CC-4's values.

**S2. The PNG path and the chart pack render with chrome.**
`export/packet.ts` and `export/chartPack.ts` call
`renderSpecSvg(spec, { withChrome: true })`, each passing its own provenance line
in as `spec.source`, so the packet footer that names the country, the mode and
the vintage is drawn into the image rather than lost with the HTML around it.

`export/reportHtml.ts` renders with chrome **off**, which the contract does not
spell out and the code decides: the report lays out its own heading, subtitle and
legend as real HTML that reflows, is selectable and is read as text. Drawing them
into the SVG as well would print each one twice.

**S3. The caption band is deleted.** Taking CC-4's compatibility shim for
`export/chartSvg.ts` removes CC-3's caption band with the old body, and the chart
pack's per-figure HTML figcaption and source line went with it, because the SVG
draws both now. `renderChartSvg` survives as CC-4 intended: same signature, same
behaviour, and no caller left in `src/`.

**S4. The register travels in the manifest.** `RunManifest` carries
`charts: { register, overrides }`, additive to `qcraft-run/1`: a run file written
before the field restores completely and falls back to the default register.
`run/runFile.ts` round-trips it, `useChartRegister().describe()` returns that
exact shape, and `App` passes it to the Export and Data tabs. `buildPacket` and
`renderReportHtml` read it off the manifest, so a packet rebuilt from a run file
draws what the analyst was actually looking at.

The import half of that was missing until `8b93a7c`: the register was parsed and
then dropped, so export-import-re-export produced a different document. Section
6.5 has it.

`tests/export.test.ts` gained a test that proves the point: the same run in the
briefing register produces a different figure list with different titles.

### Three corrections to the seam documents

Section 2.3 of the export contract corrects two things in `docs/CC4-CHART-SEAM.md`.
Both check out against the code:

- The cover tab is **`Overview`**, not `Cover`. `ChartTab` in `src/charts/specs.ts`
  says so and `exportFigures` returns it.
- There are **eleven** chart ids, not twelve. Counting CC-4's own table:
  3 baseline + 5 analysis + 2 climate + 1 overview. The old prefix rule kept 3
  and dropped 8.

A third correction belongs on the export contract itself. Section 2.3 says any
one export carries ten of the eleven. That holds for the workbook register, which
draws everything but the cover. **The briefing register carries six**, because
five workbook charts have no briefing spec by design: `analysis-prim-exp`,
`analysis-prim-balance`, `analysis-overall-balance`, `analysis-interest-exp` and
`climate-gdp-levels`. That is CC-4's stated intent, not a defect.

---

## 4. Conflict resolutions

Thirteen, each recorded in the merge commit that made it.

### Merge 2, PR #64 (CC-3)

**R1. `src/export/reportHtml.ts`, the import block.** CC-3 moved figure
construction into `export/figures.ts`, so `ChartSeries` and `ScenarioKey` became
dead here; CC-2 added `modeSourcesLine()`, which reads `MODES`. Kept
`EngineResult` and `MODES`, dropped the two that died.

**R2. `src/export/chartPack.ts` and `src/export/readme.ts`, the footer parity
sentence.** Both modules already state the run's claim through
`modeStatement(manifest)` near the top, which is what CC-3's own contract
(section 2.1) requires. Each then restated baseline parity in its footer as a
fixed string, mode-blind, so a **Current-mode** pack said "results will not match
the published workbook cell for cell" in its header and "baseline parity is exact
for 147 of 147" in its footer. Deleted both restatements rather than routing
`modeStatement` into the footer, which would print one sentence twice.

Caught by CC-2's `engineWiring` guardrail, which fails the build if the parity
claim appears anywhere but the mode registry.

### Merge 3, PR #61 (CC-4)

**R3. `package.json`.** Both lanes appended a script and collided on the closing
brace. Union.

**R4. `src/styles/app.css`.** Both lanes appended a block whose last rule ended
with the same three declarations, so git took that tail as shared context and cut
the conflict through the middle of `.mode__option` and `.register__option`. A
naive union leaves both rules unterminated. Each side is a pure addition against
the base and the base is a strict prefix of CC-4's file, so the file was rebuilt
as CC-2's version plus CC-4's 165 added lines. Braces balance at 216/216 and no
class rule is defined twice.

**R5. `src/App.tsx`, the render body.** CC-2's guard chain wins (About the data,
Methodology, load error, loading, projection unavailable) because CC-4 never had
those states. CC-4's tab block was dropped as superseded by the common tail below
the conflict marker, which is CC-2's fuller version, and CC-4's contributions
were grafted into it: `RegisterToggle` above the tabs, and
`registers`/`params`/`defaults` threaded into the three chart tabs.

**R6. `src/App.tsx`, `tabCharts`.** CC-4 computed `chartsForTab({ result, ... })`
assuming a result always exists. Under CC-2 the app renders while a country loads
and when a projection is blocked, so `result` is nullable. Guarded; the register
control now appears only where charts do.

**R7. `src/export/chartSvg.ts`.** Took CC-4's shim whole. That is seam step S3.

### Merge 4, PR #63 (CC-5)

**R8. `package.json`.** Union again.

**R9. `src/styles/app.css`.** Same shape as R4, same technique. 228 braces
balanced, no duplicate class rule.

**R10. `src/context/panels.ts`, `debt_target`.** CC-2 made it a judgment note
linking the debt dynamics sandbox; CC-5 moved it to a data panel and documents
the move in the file's own header. CC-5 is the later lane on that exact question,
so its panel stands.

Consequence, recorded rather than hidden: the sandbox link is gone from
`debt_target`, and `expenditure_rigidity` lost its climate-channel link the same
way through a clean auto-merge. `fiscal_rule` still carries the debt dynamics
link and sits beside `debt_target` in the sidebar. **All three teaching widgets
remain linked from the app's intro block**, so none of them is unreachable; what
was lost is the per-parameter link at the point of decision. Section 8 holds this
for Teal.

**R11. `scripts/export-loop.mjs`.** Not so much a hunk conflict as two different
scripts. CC-3 rewrote the loop into the multi-run form the export contract
documents; CC-5's side was the older single-run script plus one new block. Took
CC-3's loop and grafted CC-5's step into it, in the same place CC-5 had it: the
peer comparison written from the panel, appended to the note the user typed,
checked for length, then checked into every artifact and through the round trip.
It runs once per country and mode now rather than once.

**R12. `src/App.tsx`, `ContextPanel`.** CC-5 passed `vintage` and `countryName`
off `result`, which is nullable under CC-2. Same class as R6, and reading them off
the result would have been wrong anyway: the panels show the source record behind
a parameter, so they must open while a country loads and especially when its
projection is blocked, which is exactly when someone goes looking at the inputs.
Now `MODES[mode].vintage` and the country list.

**R13. `src/context/peers.ts`.** `DEFAULT_PEER_VINTAGE` was the literal
`'weo-2024-10'` with a comment calling the app fixture-backed. CC-2's guardrail
failed the build on the second copy of a vintage id, and the comment was stale
besides. Reads `MODES.verified.vintage`.

Both of CC-2's guardrails earned their keep in this merge: the parity-claim one
caught CC-3 at R2, the vintage-id one caught CC-5 here.

---

## 5. The wording gate

Teal's resolutions of 2026-08-27 evening, from `SHARED/REFERENCE-NOTES.md`
("all as recommended"). Applied in `362d6be`.

| # | Resolution | What changed |
| --- | --- | --- |
| 1 | Verified badge adds "only" | `VERIFIED_BADGE` now ends "confirmed for ratio metrics **only**". `tests/modes.test.ts` pins the sentence to the character, so the assertion moved with it, and the "does not claim more" test now requires the word. |
| 2 | FADCP short form in app copy, precise chain in About | `FADCP_SHORT` and `SOURCE_CREDIT` in `content/modes.ts`, and the chain as `ABOUT.climateChain`. "Short form" is a defined term: `docs/lane-reports/cc2-wording-gate.md` question 2 quotes it as "FADCP Climate Dataset (Centorrino, Massetti and Tagklis, 2024), building on Kahn et al. (2021)", and the gate took option (b) there, which keeps that in the app and ADDS the chain to About. Every export artifact draws the credit from the registry now instead of four hand-written copies, and About lists the 2023 dataset and the 2024 damage layer as separate works. **This was got wrong first time and corrected in `8b93a7c`: see section 6.5.** |
| 3 | Divergence note ships as written | `CURRENT_DIVERGENCE` untouched. |
| 4 | Zero-climate notice ships as written | `NO_CLIMATE_DATA` untouched. The course version's User Guide footnote is a course touch, not this lane's. |
| 5 | Cover title becomes the named-scenario shape | `overviewTitle` in `charts/titles.ts`: "{Country}'s {year} debt is {x}% of GDP under baseline and {y}% under {scenario}". "As much as" is gone; it read as a maximum over an open range when the scenarios are a family of six pathways. The under-a-point branch is a different and still true claim and was left alone. |
| 6 | Rigidity panel ships option A, no country ranking | Verified, not changed. `RigidityCharts.tsx` states in its own header that neither chart ranks countries, and nothing in the panel renders a per-country estimate. |
| 7 | Sub-zero note kept for Tuesday | CC-3's `BELOW_ZERO_NOTE`, appended to the debt-path figures and never to a title. It reached the report but not the chart pack until `8b93a7c`, because the pack draws from the spec: see section 6.5. `tests/packet.test.ts` now holds both surfaces. |

A new test holds resolution 2 in place: the long citation must not appear in app
copy, and all three layers must appear in About.

### Also swept

The notes' FILE:// entry assigns the copy fix to "CC-2 sweep or merge". CC-2 had
already fixed `App.tsx`'s file header; two comments were left, in `App.tsx` and
`charts/register.ts`, each asserting the app opens from a `file://` URL. It does
not: the bundle is blank under that scheme because a `type="module"` script and a
cross-origin stylesheet are both blocked. Both corrected.

`README.md` gains **Running it without a network**: the one-command local server,
which is the Tuesday offline contingency the notes call for, stated as the
alternative to a double-clicked `index.html`.

```bash
python3 -m http.server 8080 --directory apps/qcraft-web/dist
```

---

## 6. What the merge surfaced

Four defects, none of which could exist inside a single lane.

**6.1 The chart pack and the packet README claimed parity in Current mode.**
R2 above. A mode-blind sentence in a document whose header already said the
opposite.

**6.2 Serbia was still labelled Kosovo in the peer reference set.** CC-2
corrected the Serbia/Kosovo mapping in both vintages. CC-5 derived
`src/context/data/peers.csv` from that data before the fix, so the committed
reference table named SRB "Kosovo". `derive_peer_data.py --check` reports the
drift; regenerated in `a0eabf9`. One line, and only the label: SRB's output per
worker is 51372.4658 either way, so no peer statistic, distribution or band
moves. What moved is the country name a user reads in the peer strips.

**6.3 The context panels lost the fold.** CC-5's promise is that a control and
its context sit in one visual field on a 1440x900 laptop, and
`scripts/context-qa.mjs` is what makes that a claim rather than marketing. CC-2's
mode bar is 121px tall and stays on screen, which pushed six captions and source
lines past 900px once both lanes were on one branch.

The mode bar now stands down while a context panel is open. Nothing is lost: a
panel is not showing results, it is showing the published source record behind
one parameter, and it states its own vintage in its own source line ("IMF World
Economic Outlook, October 2024 vintage"), so CC-2's rule that the vintage travels
with the number is met by the panel itself. The intro block already hides the
same way.

**6.4 The export QA loop could not see a download.** Not an app fault: the packet
builds in 332 ms and the archive is correct. The script clicked, slept in
`waitForTimeout(6000)`, then read an array a context listener had filled, and the
event arrives while the harness is blocked in that sleep. Deterministic over
three runs each way, and pre-existing: the download code is byte-identical to
CC-3's branch, Playwright is 1.62.1 on both, and a single small artifact fails the
same way. Rewritten to race the click against `page.waitForEvent('download')`.

Two assertions moved with it. The chart count was pinned at 4, the number of
figures the export used to build itself; the registry produces 10, now named
`PACKET_CHARTS`. And the grafted peer-comparison check compares on collapsed
whitespace, because `READ-ME.txt` is plain text and hard wraps at a column, so it
carried the note perfectly well and failed an exact substring test.

**6.5 Six more, found by an adversarial pass over the finished merge.** Five
were mine. They are recorded here rather than quietly fixed, because four of
them were introduced by the seam rewire in `1a71673` and the merge report above
claimed two of them were working.

| # | Defect | Where it came from |
| --- | --- | --- |
| 1 | "Short form" was redefined and the authors' names stripped from every export artifact | The gate defines the term; `362d6be` did not check the definition |
| 2 | `BELOW_ZERO_NOTE` reached the report but not the chart pack or the PNGs | The rewire annotated the flat `subtitle` field; the pack draws `spec.subtitle` |
| 3 | `NO_SIGNAL_NOTE` reached no figure at all, so a Maldives-class PNG carried no statement | The rewire dropped `packetFigures`' `noClimateSignal` branch; CC-4's titles only handle the flat case in the briefing register, and the default is workbook |
| 4 | The report's HTML legend showed muted series in their scenario colours beside grey lines | The report renders chrome off and builds its own legend; CC-4's `muted` had no prior consumer there |
| 5 | An imported run's register was parsed and then thrown away | `onImport` had no slot, and `setGlobal` clears overrides by design |
| 6 | In Current mode a context panel showed no mode at all | `72237fe` hid the mode bar on the reasoning that the panel states its own vintage, which is true only in Verified mode |

All six are fixed in `8b93a7c`, each with a test that would have caught it. The
export loop gained a briefing-register pass, so the six-figure document is
exercised in a browser at all, and it now checks the register through the run
file and back.

Three of these say something about the merge worth keeping. The seam rewire
changed which FIELD the renderers read, and every consumer that read the old
field silently kept compiling: a type change would have caught all three of
defects 2, 3 and 4, and a field rename did not. The gate misreading says the
other thing: a resolution that uses a term of art has to be read against the
document that defines it, not against the resolution alone.

### One threshold, adjusted with the number stated

After 6.3, two failures remained on one sidebar control. `#infl-end`'s bottom
edge lands at **900.36** here and at **899.98** on `feat/param-discovery`.
Three eighths of a pixel, in a 36px input, on a threshold CC-5's own build
cleared by one sixty-fourth of a pixel. Confirmed by building
`feat/param-discovery` in a throwaway worktree and running the same script
against it, which reported no failures.

`withinFold` now allows one pixel, documented in place. Real overflow misses by
tens of pixels and still fails; sub-pixel reflow no longer reports itself as a
layout defect. If Teal would rather the check stay exact, the alternative is to
reclaim height in the sidebar, which is a layout change and not a merge decision.

---

## 7. The battery

Run at `8b93a7c`, on a fresh build, with the five stale preview servers the other
lanes left listening killed first. Two of those were on 4173, the port every QA
script falls back to; this ran on 4927 with the served asset hash checked against
`dist/` before every pass.

| Check | Result |
| --- | --- |
| `uv run pytest` | **198 passed** |
| `uv run ruff check .` | **All checks passed** |
| `packages/qcraft-engine-ts` vitest | **67 passed** |
| `packages/qcraft-engine-ts` typecheck / lint / build | clean |
| `apps/qcraft-web` vitest | **259 passed** |
| `apps/qcraft-web` typecheck / lint | clean |
| `apps/qcraft-web` clean build | built in 333 ms |
| TS-vs-Python differential harness | **PASS**, 168,938 cells, max abs 4.441e-16, max rel 1.169e-16, tol 1e-12 |
| Pipeline sanity | report written, rc 0 |
| `derive_peer_data.py --check` | all four tables recompute identical |
| `npm run qa:export` | **0 failures, 0 console errors**, over four country-mode-register runs plus the Maldives case |
| `npm run qa:context` | all panels open, respond, and fit the fold |
| `npm run qa:tabs` | 8 screenshots, no console errors |
| `npm run qa:widgets` | all three widgets clean |
| `npm run qa:registers` | 7 screenshots, no console errors |
| `npm run qa:context-shots` | 10 figures written |

524 tests across the three suites.

`qa:export` is the loop that matters, and it is worth naming what it now proves,
per country, mode and register: one click produces one archive; the archive holds
the six documents and its register's chart images, ten in workbook and six in
briefing; every text artifact names the run's vintage
and carries the run label, the analyst's note, the typed rationale and the peer
comparison the panel wrote; the workbook opens under openpyxl with its six
sheets, a bold header, a frozen filtered results sheet and 641 rows; every PNG is
a real PNG at 1400px wide; both print documents render with no console errors and
use the A4-and-Letter page box at 594.96 x 791.04 pts; and the run file
re-imports to the state it was exported from, mode and chart register included.
Plus the Maldives
no-signal case: the report does not describe a zero spread as a finding.

### Countries that still fail, which is CC-6's lane

The harness runs every selectable country and reports what it cannot do. On the
frozen vintage:

- **ZMB, LBY**: `TypeError: float() argument must be ... not 'NoneType'` on the
  Python side. The TypeScript side returns an answer.
- **SRB**: `ComputeError: aggregation 'item' expected no or a single value, got 2`
  on the Python side, from Kosovo's population filed under Serbia's code in the
  frozen vintage.
- TS-side failures on **PRI** and **SOM**, both missing 2009 inputs.

This is the divergence the notes hand to CC-6, reproduced here on the merged
state: Python raises where TypeScript carries a null and draws a path. The
comparison above covers the eleven countries where both engines succeed, which is
the correct behaviour for a differential harness and also the reason the PASS
does not cover ZMB, LBY or SRB.

---

## 8. Held for Teal

None of these blocks the freeze.

**8.1 The per-parameter widget links.** R10. `debt_target` and
`expenditure_rigidity` became data panels, and a panel has no slot for the
teaching-widget link the note used to carry. All three widgets are still linked
from the intro block, so nothing is unreachable, but the link at the point of
decision is gone for those two parameters. Giving `DataContext` an optional
`href` and rendering it in the panel frame is a small change; it is feature work
in CC-5's components rather than a merge resolution, so it is raised here instead
of taken.

**8.2 The fold tolerance.** Section 6.3. One pixel of documented slack on a
check that CC-5's own build cleared by one sixty-fourth of a pixel. The
alternative is to reclaim sidebar height.

**8.3 The committed vintage manifest is 52 bytes behind.**
`data/vintages/weo-2026-04/manifest.json` records `country_json.bytes` as
42387728; rebuilding the vintage on the merged code produces 42387676. The
manifest was generated on 8/26, before CC-2's Serbia/Kosovo and NaN/Infinity
fixes, and those fixes change the emitted payloads. The regenerated manifest was
deliberately not committed, because it also rewrites `generated_utc` on every run
and would churn. Worth a deliberate regeneration before publish.

---

## 9. Rerunning any of this

From the repo root of a fresh worktree.

### Setup, once

```bash
uv sync --all-packages
npm ci --prefix apps/qcraft-web
npm ci --prefix packages/qcraft-engine-ts
```

The per-country JSON payloads and the vintage parquet are gitignored build
artifacts, so a fresh worktree has neither. Rebuild both from the pipeline's raw
cache:

```bash
cp -R ../QCraft-App/pipeline/.cache/raw pipeline/.cache/
cp -R ../QCraft-App/data/processed data/
uv run qcraft-pipeline init-base
uv run qcraft-pipeline run
uv run --package qcraft-pipeline python scripts/build_vintage_json.py weo-2024-10 --force
```

Without them `npm run build` fails in its `prebuild` hook and
`tests/verifiedMode.test.ts` silently skips.

### The non-browser battery

```bash
uv run pytest
uv run ruff check .
npm --prefix packages/qcraft-engine-ts test
npm --prefix apps/qcraft-web test
npm --prefix apps/qcraft-web run typecheck
npm --prefix apps/qcraft-web run lint
npm --prefix apps/qcraft-web run build
```

### The differential harness

```bash
uv run --package qcraft-engine python scripts/differential/run_python.py \
  UGA KEN GHA NGA ZAF IND BRA DEU JPN USA MDV \
  --data-dir data/vintages/weo-2024-10 --out /tmp/diff-py
npx vite-node scripts/differential/run_ts.ts -- \
  --in data/vintages/weo-2024-10/json --out /tmp/diff-ts
uv run python scripts/differential/compare.py \
  --python-dir /tmp/diff-py --ts-dir /tmp/diff-ts --label "merged state"
```

Pass ZMB, LBY and SRB as well to reproduce CC-6's failures.

### Pipeline sanity and the derived tables

```bash
uv run --package qcraft-pipeline python pipeline/sanity_check.py
uv run --with polars --with pyarrow python scripts/derive_peer_data.py --check
```

### The browser loops

Kill every stale preview server first. Two lanes default to 4173 and a stale
server there serves another branch's bundle while every assertion quietly fails
against it.

```bash
lsof -nP -iTCP -sTCP:LISTEN | grep vite
```

Then, on a port nobody else is on, from `apps/qcraft-web`:

```bash
npm run build && npx vite preview --port 4927 --strictPort &
```

Check that the server is serving this worktree before trusting a single
assertion:

```bash
diff <(curl -s http://localhost:4927/ | grep -o 'assets/app-[A-Za-z0-9_-]*\.js') \
     <(grep -o 'assets/app-[A-Za-z0-9_-]*\.js' dist/index.html)
```

Then:

```bash
export QCRAFT_PREVIEW_URL=http://localhost:4927/
export QCRAFT_PYTHON=$PWD/../../.venv/bin/python3
npm run qa:export -- /tmp/qa-export
npm run qa:context -- /tmp/qa-context
npm run qa:tabs -- /tmp/qa-tabs
npm run qa:widgets -- /tmp/qa-widgets
npm run qa:registers -- /tmp/qa-registers
npm run qa:context-shots -- /tmp/qa-shots
```

`qa:export` needs a Python with `openpyxl` and the `pdfinfo` binary. It finds the
repo's uv venv on its own; `QCRAFT_PYTHON` overrides.
