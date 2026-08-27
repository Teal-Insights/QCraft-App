# CC-2: Two modes, honestly labelled

**2026-08-27.** Branch `feat/two-modes`, cut from `feat/explorer-v2-integration`
at `2e8b436`. Issues TEA-1401 (data) and TEA-1400 (UI surface).

CC-1 reported green, so the dependency gate was clear at the start.

---

## 1. Bottom line

The Explorer has two data modes, and the switch changes the numbers rather than
the label. Making that true meant wiring the real TypeScript engine, which was
not in the brief and turned out to be the brief's precondition.

The battery is green: 198 Python tests, 173 web tests, 67 engine tests, ruff
clean, pyright unchanged at CC-1's 80 pre-existing errors, typecheck, lint and
build clean, seven tabs screenshotted with no console errors.

Five defects surfaced along the way, all fixed. Four are in section 4 and one is
the reason section 2 exists.

**One gate is open** and everything is built behind it: the exact IMF-facing
wording. Section 9.

---

## 2. The decision that shaped the lane

The brief says Current mode runs "latest vintages from the pipeline, same
engine". The Explorer had no engine. It served golden-master fixtures: real
Q-CRAFT output, for Uganda, at engine defaults, unable to respond to a slider or
a country change. `mockAdapter.ts` said so plainly and was right to.

A mode switch on top of that would have changed a badge and nothing else. On
Tuesday, a trainee picking Kenya in Current mode would have seen Uganda's
October 2024 numbers under an April 2026 label. That is precisely the failure the
feature exists to prevent, so the fixture had to go.

Nothing in the sprint's file territories owns "wire the engine". It sits inside
CC-2's data and config territory by necessity, and the pieces were already in
place: lane 1 shipped `packages/qcraft-engine-ts` with 67 passing golden-master
tests, lane 2 shipped the result-mapping layer and its tests, and CC-1 measured
the two engines agreeing to one unit in the last place over 614,320 cells. The
work was connecting them, not building them.

Decided rather than gated, because it is an implementation question the repo
answers. Recorded here because it is the largest thing this lane did.

---

## 3. What shipped

### 3.1 The engine, wired

`src/engine/qcraftAdapter.ts` runs `@qcraft/engine` over per-mode country inputs.
175 countries per vintage, every exposed parameter live.

The seam splits in two, because loading is asynchronous and running is not:

```ts
const context = await engine.prepare(mode, iso3c);   // fetch + coverage check
const outcome = engine.run(context, params);          // pure, about 3 ms
```

`run` returns an outcome union rather than a result. "This country's source data
cannot support a projection" is an ordinary answer for a handful of countries and
has to reach the screen as a sentence, not as a blank chart.

Country payloads are fetched, not bundled: 175 countries times two vintages is
84 MB. `apps/qcraft-web/scripts/stage-data.mjs` hard-links them into
`public/data/<vintage>/` before `dev` and `build`. Each country costs one request
the first time it is opened and nothing afterwards.

The engine is reached by a Vite alias and a matching tsconfig path rather than a
built package, so `dev`, `build` and `test` all see one set of files and there is
no build-ordering step. The web app's TypeScript target moved to ES2022, which
the engine already targets, because the engine uses `Array.prototype.at`.

The golden-master fixture stays as `mockAdapter.ts` for tests only. It is no
longer re-exported through `adapter.ts`: that re-export was pulling 247 KB of CSV
into the Explorer bundle to serve numbers no user sees.

### 3.2 The mode switch

Current (WEO April 2026 + UN WPP 2024) is the default. Verified (WEO October 2024
+ UN WPP 2022) is one click away.

The switch sits above the tab strip, so it is on screen on every tab and beside
every chart, and it does not fold away when a context panel opens. The intro
block does fold away, because it is orientation; which vintage produced a number
is part of the number.

Mode travels into:

| Artifact | How it appears |
| --- | --- |
| HTML report | Title block row, status banner, annex, colophon |
| Results CSV | Two rows in the run-manifest trailer: the mode and what it claims |
| Run JSON | A `mode` field beside `dataVintage` |
| Every chart | Through the mode bar above it |

Importing a run restores its mode with its parameters. A run file exported before
modes existed recovers its mode from its vintage id, and says so as a warning; a
file with neither opens in the default mode and says that too.

Every IMF-facing sentence lives in `src/content/modes.ts`, so the wording gate is
one file rather than a hunt through components. `tests/engineWiring.test.ts`
fails the build if a second copy of the parity claim or a hard-coded vintage id
appears anywhere else in `src/`.

### 3.3 About the data

A seventh tab, reachable from a button in the mode bar. Per-mode source tables
with publication dates, the FADCP provenance and its documented exclusions, the
2030 convention including the cases where it is not 2030, and the
not-an-IMF-product line.

The Methodology tab's data-source list was mode-blind, mixed two vintages (WEO
October 2024 beside WPP 2024) and credited productivity to the wrong publisher.
It now reads the same registry.

### 3.4 Two honest notices

Required by the 2026-08-27 gate resolution, and extended by what the sweep found.

**No climate estimates.** Eleven selectable countries carry an all-zero climate
slice, so all six scenarios land exactly on the baseline. The notice says the
estimate is missing rather than zero, names sea-level rise and disasters as
channels outside the model everywhere, and says the baseline is unaffected and
usable. The IMF's own User Guide footnote 12 lists the same economies as having
no climate estimates, so this is the tool agreeing with the workbook rather than
apologising for it.

**Cannot be projected.** Four to nine countries per mode, depending on the mode.
Two shapes, one sentence each: the engine threw, or the debt series has no value
at the year the projection anchors on. The second is the dangerous one, because
the TypeScript engine does not throw on it, it silently produces a debt path
anchored at zero (section 4.2).

Both conditions are derived from each country's own data rather than a baked
list, so they stay true when a vintage changes or when CC-6 fixes Zambia.

The notice offers the other mode, and probes first. Coverage genuinely differs:
Afghanistan, Lebanon, Sri Lanka and Syria run in Current but not Verified;
Ecuador runs in Verified but not Current. Zambia and Libya run in neither, and
the notice says so rather than sending a trainee to click a switch that lands
them on the same wall.

---

## 4. Defects found and fixed

### 4.1 The pipeline emitted invalid JSON

`emit.py` wrote bare `NaN` and `Infinity` tokens into the per-country payloads.
Neither is valid JSON, so `JSON.parse` rejects the whole file. Brunei, Macao SAR
and Timor-Leste shipped as unparseable payloads in both vintages, and would have
been three hard failures in the Explorer.

Polars nulls and NaN now both map to JSON null, which is what the engine already
handles, and `json.dumps` runs with `allow_nan=False` so a survivor raises at
build time rather than failing silently in a browser. `export_country_json.py`
had always done this; the two producers now agree.

Countries running under the TypeScript engine went from 170 to 173 of 175, in
both vintages. Commit `8ab291d`.

### 4.2 Serbia was labelled Kosovo

Every dataset carries Serbia's data under `SRB` and labels it "Kosovo". A trainee
picking "Kosovo" in the Explorer was shown Serbia's fiscal path, and Serbia was
not in the list at all.

The label is wrong, not the data. `SRB` 2020 nominal GDP is 5,504.4 bn RSD, which
is Serbia's; Kosovo reports in euro and is two orders of magnitude smaller. The
April 2026 vintage carries Kosovo separately as `XKX`. The demography under `SRB`
is 6.9 million people, Serbia without Kosovo. The name comes from the workbook
extractor's `pycountry.search_fuzzy("Kosovo")` resolving to `SRB`, which
DATA-NOTES.md section 5a documents, and the pipeline carries country names
forward from the base vintage, so it survived the refresh.

The frozen vintage additionally carries 1,359 duplicate demography keys under
`SRB`: Serbia's series and Kosovo's, side by side. `demography_country` filters on
the code alone, so which one won was arbitrary. The emitter now drops the other
entity's rows and raises rather than picking when the duplicate cannot be
resolved by name.

No parity claim is affected: `SRB` is one of the 13 `PYTHON_ERROR` countries in
`verification-logs/parity_results.csv`, so it was never among the 147 that
passed. Commit `2ae2eae`.

The repair is at the JSON emit boundary, so the Explorer and the Python Shiny app
now differ for Serbia: the Shiny app still reads the contaminated Parquet.
Recorded rather than fixed, because repairing the frozen Parquet is out of bounds
and the Shiny app is not Tuesday's surface.

### 4.3 The WEO boundary was a constant

The chart shades observed and forecast data up to the WEO boundary, and the
boundary was hard-coded to 2029. Correct for Uganda, which was all the fixture
could serve. Wrong for six countries in the April 2026 release: Syria's WEO
series ends in 2010, Sri Lanka's in 2024, Afghanistan's, Lebanon's and West Bank
and Gaza's in 2025, Bolivia's in 2026.

The engine already projects from `min(the country's last WEO year, 2029)`, so for
Syria the tool was drawing seventeen years of projection inside a band labelled as
data. Read per country now, with 2029 as the cap. Commit `31ab104`.

### 4.4 The golden masters are not at the app's defaults

Writing the Verified parity test surfaced this. The Uganda golden masters were
generated at `debt_target=60` and inflation 3.5/3.5, not at the app's defaults of
`debt_target=50` and inflation 5.0/3.5. `mockAdapter.ts` asserts the opposite in
its own docstring, so the fixture-backed app was serving a `debt_target=60` run
while reporting "all parameters are at their engine defaults".

Wiring the real engine retires that path. Recorded so nobody reintroduces it, and
the parity test now names the golden parameters explicitly.

### 4.5 The NGFS attribution was wrong twice

The reference notes name the NGFS attribution an error and assign the sweep here.
Reading the IMF's own User Guide shows the source is wrong AND the scenario family
is wrong.

The six scenarios are IPCC SSP pathways: Paris on SSP1-2.6, Moderate on SSP2-4.5,
High on SSP3-7.0, Hot as the 90th percentile of the climate models on that same
SSP3-7.0, with Hot Adapted and Hot Unadapted varying adaptation speed at that
temperature. None of them is an NGFS pathway. That also explains, better than the
old comment did, why High lands below Hot: same emissions scenario, different
percentile.

Fixed in user-facing copy (README lede and features, the climate widget
standfirst that is on a projector on Tuesday, six strings in the Shiny app's live
Methodology panel) and in comments and the engine contract. The Shiny app also
credited productivity to "Penn World Table / ILO"; DATA-NOTES.md section 2 says
World Bank WDI, so that is corrected too. Historical run reports are left alone:
they are records of what was found. Commit `e8c20f6`.

---

## 5. Country coverage, both modes

Computed from the payloads themselves, and asserted in
`tests/verifiedMode.test.ts` so the documentation cannot drift from the data.

| | Verified (weo-2024-10) | Current (weo-2026-04) |
| --- | ---: | ---: |
| Selectable | 175 | 175 |
| Run under the engine | 173 | 173 |
| Blocked: no debt anchor | 8 | 5 |
| No climate estimates | 11 | 11 |

**Blocked, Verified:** Afghanistan, Lebanon, Libya, Sri Lanka, West Bank and Gaza,
Somalia, Syria, Zambia.

**Blocked, Current:** Ecuador, Libya, West Bank and Gaza, Somalia, Zambia.

**Throwing in both:** Puerto Rico (no `interest_rate_percent` for 2009) and
Somalia (no macrofiscal row for 2009). Caught and reported by name.

**No climate estimates, both modes, identical:** Bahrain, Barbados, Hong Kong SAR,
St. Lucia, Macao SAR, Maldives, Malta, West Bank and Gaza, Singapore, Timor-Leste,
Tonga. Matches INTEGRATION-REPORT.md section 7.2 exactly, and matches the IMF User
Guide's own footnote 12.

### For CC-6

Three findings this lane cannot fix, since the engine is theirs:

1. **Zambia and Libya produce a silent wrong answer, not an error.** The Python
   engine raises `TypeError` on the null `debt_to_gdp`. The TypeScript engine
   does not: it carries the null through and produces a debt path pinned near
   zero. Zambia's Current-mode baseline reads 0.0% of GDP from 2030 to 2050 and
   4.0% by 2099, with Hot Unadapted at 156.3%. Those numbers are drawable and
   meaningless. The UI now blocks them, but the engine divergence is real and the
   differential harness missed it because Zambia was swapped out for Nigeria and
   Libya was never in the set.
2. **The block condition to reuse.** `readCoverage` in
   `src/engine/countryData.ts` is the check: the country's last macrofiscal row
   must carry both `debt` and `debt_to_gdp`. It is the anchor the fiscal
   recursion projects from.
3. **The notice surface is ready.** If CC-6 fixes Zambia, nothing here needs
   changing: the condition is derived from the data, so a fixed Zambia simply
   stops being blocked.

---

## 6. Battery

| Check | Result |
| --- | --- |
| `uv run pytest` | **198 passed** |
| `uv run ruff check .` | **All checks passed** |
| `uv run pyright` | 80 errors, unchanged from CC-1's baseline |
| vitest, `apps/qcraft-web` | **173 passed** (13 files, up from 134 in 10) |
| vitest, `packages/qcraft-engine-ts` | **67 passed** |
| `npm run typecheck` | clean |
| `npm run lint` | clean |
| `npm run build` | clean |
| Visual QA, seven tabs | no console errors |
| Em-dash sweep, built JS/CSS/HTML | none |
| Verified mode vs `final/uganda.csv` | **within 0.01 abs**, every scenario, every snapshot year |
| Engine sweep, both vintages | 173 of 175 each |
| Export packet, both modes | mode, vintage and claim present in all three artifacts; run JSON round-trips its mode |

### Rerun

```bash
# Data
uv run --package qcraft-pipeline python scripts/build_vintage_json.py weo-2024-10
uv run --package qcraft-pipeline qcraft-pipeline run
npm --prefix apps/qcraft-web run stage:data

# Battery
uv run pytest && uv run ruff check . && uv run pyright
(cd packages/qcraft-engine-ts && npm test)
(cd apps/qcraft-web && npm test && npm run typecheck && npm run lint && npm run build)

# Visual QA
(cd apps/qcraft-web && npx vite preview --port 4173 --strictPort &)
(cd apps/qcraft-web && node scripts/screenshot.mjs /tmp/qcraft-shots)

# Every country, both vintages
npx vite-node scripts/differential/run_ts.ts -- \
  --in data/vintages/weo-2024-10/json --out /tmp/sweep/verified
npx vite-node scripts/differential/run_ts.ts -- \
  --in data/vintages/weo-2026-04/json --out /tmp/sweep/current
```

---

## 7. Files, and territory

Inside CC-2's territory (data, config, About panel):

- `pipeline/src/qcraft_pipeline/emit.py`, `scripts/build_vintage_json.py`
- `data/vintages/weo-2024-10/json/index.json` (new, committed)
- `apps/qcraft-web/src/content/modes.ts` (new, and the whole wording gate)
- `apps/qcraft-web/src/engine/{qcraftAdapter,countryData}.ts` (new)
- `apps/qcraft-web/src/components/{ModeSwitch,CoverageNotices}.tsx` (new)
- `apps/qcraft-web/src/components/tabs/AboutDataTab.tsx` (new)
- `apps/qcraft-web/scripts/stage-data.mjs` (new)
- `docs/data-vintages.md` (new)

Outside it, and why:

| File | Why |
| --- | --- |
| `src/App.tsx` | Mode is app state. Unavoidable. |
| `src/engine/{types,adapter,mockAdapter,pipelineResult}.ts` | The seam the mode travels through. |
| `src/run/{manifest,runFile}.ts`, `src/export/{reportHtml,resultsCsv}.ts` | CC-3's territory. The brief requires mode in every export, so the edits are additive and listed here for CC-3 to reconcile: a `mode` field on `RunManifest`, `modeLine`/`modeStatement` helpers, and four call sites that render them. |
| `src/components/tabs/ExportTab.tsx` | CC-3's. `onImport` gained a mode argument; without it an imported run reproduces the parameters against the wrong vintage. |
| `src/components/tabs/MethodologyTab.tsx` | Its data-source list was a provenance claim. Now reads the registry. |
| `src/theme.ts` | CC-4's. Comment-only, NGFS sweep. |
| `apps/qcraft-app/app.py` | The live Shiny app. User-facing NGFS and productivity attribution. |
| `packages/qcraft-engine-ts/{src/types.ts,engine-api.md}` | Lane 1's. Comment and doc only, NGFS sweep. |
| `apps/qcraft-web/scripts/screenshot.mjs` | QA needed to know about the new tab. |

Nothing was merged to `main`. The branch is pushed and the PR is a draft.

---

## 8. A coordination hazard, for the orchestrator

CC-2 through CC-6 were all launched with `cd ~/GitHub/QCraft-App`, which is one
clone with one working tree and one HEAD. They are not isolated from each other.

This lane's git reflog records what that means in practice. After
`git checkout -b feat/two-modes`, another session checked out
`feat/export-packet`, then `feat/param-discovery`, then `feat/takeaway-charts`,
then `feat/explorer-v2-integration`. HEAD was on the shared integration branch by
the time this lane committed, so all nine of this lane's commits landed there
rather than on `feat/two-modes`.

Caught at push time and repaired without loss: `feat/two-modes` was pointed at
the work, `feat/explorer-v2-integration` was pointed back at `origin`, and
nothing was pushed to the integration branch. Every one of the nine commits is
authored by this lane and touches only files this lane wrote, verified by
`git diff --stat` against origin before the repair, so no other lane's work was
swept in.

Two things could still go wrong for the lanes still running:

1. **Commits landing on the wrong branch.** Any lane that committed while another
   had HEAD elsewhere has the same problem, and may not have noticed. Worth each
   lane checking `git branch --show-current` against its own branch name before
   pushing.
2. **Uncommitted work colliding.** Four sessions editing one checkout means a
   `git add -A` in one lane can commit another lane's half-finished edits. This
   lane used `git add -A` several times. It got away with it because the other
   lanes happened to have nothing uncommitted at those moments, which is luck
   rather than design.

The fix for the next sprint is `git worktree add` per lane, or one clone per
lane as the overnight lane sprint used. Nothing to do about it mid-flight beyond
each lane checking its branch before it pushes.

## 9. The gate

Open, and everything is built behind it. See the gate raised alongside this
report: the exact IMF-facing wording of the badges, the divergence note and the
About panel, plus two findings from the research leg that touch attribution.
Nothing in the copy changes without Teal's call.
