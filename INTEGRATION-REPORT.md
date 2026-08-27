# Integration report: feat/explorer-v2-integration

**CC-1, 2026-08-27.** Consolidates the three sprint lanes from
`~/candidates/qcraft-sprint-2026-08-26/` into the canonical repo, resolves the engine
lane's climate change request, and runs the acceptance battery.

Issues: TEA-1399 (engine port), TEA-1400 (Explorer UI), TEA-1401 (data pipeline).

Base: `main` at `0fb5eb1`. All three lane clones branched from that same commit, so every
merge was a true three-way merge with no rebase.

---

## 1. Bottom line

The battery is green. 399 automated tests pass across three suites, the two engines agree
to one unit in the last place over 614,320 numeric cells, and the data pipeline rebuilds
its vintage byte-identically from cache.

One defect surfaced and is fixed: both engines derived the climate productivity shock with
the wrong formula. Details in section 4.

Two findings are held for Teal in section 7. Neither blocks CC-2 through CC-5.

---

## 2. What merged

| Order | Lane | Branch | Merge commit | Conflicts |
| --- | --- | --- | --- | --- |
| 1 | lane1-engine-ts | `feat/lane1-engine-ts` | `fb14f57` | none |
| 2 | lane3-data | `feat/lane3-data` | `850c670` | 2 |
| 3 | lane2-ui | `feat/lane2-ui` | `c023c7e` | 1 |

161 files changed, 33,050 insertions, 48 deletions.

The lanes turned out to be almost entirely additive. They touched only three files in
common: `pyproject.toml`, `.gitignore`, and `uv.lock`.

### What each lane brought

- **lane1-engine-ts.** `packages/qcraft-engine-ts`, a strict-TypeScript port of the seven
  engine modules and `run_pipeline`, with a 67-test vitest suite, `engine-api.md` for the
  UI lane, and `scripts/export_country_json.py`.
- **lane3-data.** `pipeline/`, the WEO April 2026 plus UN WPP 2024 refresh, the
  `data/vintages/` layout with `weo-2024-10` frozen as the verification vintage, a
  validation stage, and per-country JSON emission.
- **lane2-ui.** `apps/qcraft-web`, the React 18 and D3 Explorer: five tabs, the exposed
  parameter sidebar, export packet v1 (HTML report, CSV, run JSON), the three teaching
  widgets at `/widgets/*`, and the parameter context panels.

---

## 3. Conflict resolutions

Three conflicts, all recorded here. The stated rule was to favour the later lane for UI
files and the engine lane for engine files. Neither conflict was a UI or engine file, so
both needed a different call, and both are noted as such.

### 3.1 `pyproject.toml`, `[tool.uv.workspace]` (lane3 merge, then lane2 merge)

Each lane edited the same three lines for a different reason. Lane 1 excluded the
TypeScript package, lane 2 excluded the npm app, lane 3 added `pipeline` as a member.

**Resolved as a union, not by favouring a side.** Taking either side alone breaks `uv run`
across the repo: dropping the excludes makes uv demand a `pyproject.toml` from a
TypeScript package and an npm app, and dropping the member removes the pipeline from the
workspace.

```toml
members = ["packages/*", "apps/*", "pipeline"]
exclude = ["packages/qcraft-engine-ts", "apps/qcraft-web"]
```

The second occurrence, during the lane2 merge, resolved to the union already in HEAD,
which subsumes lane 2's edit.

Verified: `uv sync --all-packages` and `uv run pytest` both succeed.

### 3.2 `MORNING-REPORT.md` (add/add, all three lanes)

Each lane committed its own run report at the same path. Git saw an add/add conflict on
the lane3 merge and would have seen a second on the lane2 merge.

**Resolved by keeping all three at distinct paths** rather than picking a winner. Choosing
one lane's report would have destroyed the other two lanes' provenance a day before the
dry run.

- `docs/lane-reports/lane1-engine-ts.md`
- `docs/lane-reports/lane3-data.md`
- `docs/lane-reports/lane2-ui.md`

Contents are unmodified from each lane.

### 3.3 `.gitignore`

No conflict. Lane 3 added its block at line 43 and lane 2 appended at the end, so git
merged both cleanly. Both blocks are present and verified.

### 3.4 Data that did not merge

`data/processed/` and `data/vintages/*/*.parquet` are gitignored repo-wide, by design and
unchanged from before this sprint, so the merge carried none of it. The parquet files were
copied from the lane3 clone into the working tree. They are regenerable: section 6.3 shows
the rebuild reproducing them byte for byte.

---

## 4. The climate change request

`.change-requests/climate-variation-2026-08-26.md`, raised by lane 1. **Accepted, with the
derivation reversed from what the request proposed.** The change request file carries the
full resolution; the summary follows.

### What the request found

`_build_climate_variation()` in the production path and a local reimplementation in
`test_climate.py` derived the productivity shock two different ways, and the six climate
scenarios drifted between them by up to 2.33 pp of debt-to-GDP by 2099.

### What settles it

The request proposed changing the production path to match the fixture path. That is the
wrong direction. The fixture path recovers the shock by inverting the golden master
(`climate_prod - baseline_prod`), so it reproduces the golden master whatever the
production path does. It could not have adjudicated anything.

Both candidate formulas were tested directly against the Excel-extracted climate golden
masters for Uganda, all six scenarios, every projection year 2030 to 2099, where
`I(t) = 100 + gdp_loss_percent(t)`:

| Derivation | Max absolute error vs golden masters |
| --- | ---: |
| `I(t) - I(t-1)`, the first difference both engines shipped | 6.2e-3 pp |
| `100 * (I(t) / I(t-1) - 1)`, the percent change | **7.1e-15 pp** |

Percent change reproduces the workbook to machine epsilon in all six scenarios. The
reason is dimensional, and the change request identified it correctly before drawing the
opposite conclusion: the shock is added to labour productivity *growth*, so it has to be a
growth rate. Differencing index levels is a good approximation only while the index sits
near 100, which is why the error tracked scenario severity and compounded over 70 years.

### Root cause

`planning/oracles/climate.md` described the workbook's "Variation on LP Growth" row as a
"year-over-year change in GDP index" and rendered it in pseudocode as a subtraction. Both
engines implemented the pseudocode faithfully. The oracle is a derived analysis document,
below the workbook and the Excel-extracted golden masters in the AGENTS.md source-of-truth
hierarchy, and on this point it was wrong.

### What changed (commit `6b42136`)

- `packages/qcraft-engine/src/qcraft_engine/data_loader.py`, `_build_climate_variation`.
- `packages/qcraft-engine-ts/src/pipeline.ts`, `buildClimateVariation`.
- `packages/qcraft-engine/tests/test_climate.py`. The local reimplementation is gone. All
  nine call sites now drive the production function, so the climate golden masters pin the
  production path for the first time. Inputs come from a new committed fixture,
  `tests/fixtures/uganda_climate_input.csv`, extracted from the frozen `weo-2024-10`
  vintage, which keeps the suite hermetic on a fresh clone.
- `packages/qcraft-engine-ts/tests/pipeline-e2e.test.ts`. The 2.5 pp drift bound is
  replaced by a full `compareFrame` against `TOL.CLIMATE`, the same per-column tolerances
  the baseline chain uses.
- `planning/oracles/climate.md`. Formula and gotcha section corrected, with the history
  noted so the bug cannot be reintroduced from the oracle.

Golden masters were not touched. No file listed as read-only in CLAUDE.md was edited.

### Scale of the correction

Uganda, `debt_target=60`, `fiscal_rule=Yes`, `rigidity=1.0`, debt-to-GDP at 2099. The
"before" column is what the tool would have shown at the Uganda training.

| Scenario | Before | After (matches fixtures) | Change |
| --- | ---: | ---: | ---: |
| Moderate | 47.16 | 47.16 | 0.00 |
| Paris | 39.13 | 39.16 | +0.03 |
| High | 67.66 | 67.82 | +0.16 |
| Hot Adapted | 71.80 | 72.02 | +0.22 |
| Hot | 93.18 | 93.96 | +0.78 |
| Hot Unadapted | 124.52 | 126.86 | +2.34 |

The correction moves severe scenarios upward. The old numbers understated climate debt
impact.

---

## 5. Battery results

All green. Run on macOS 15.6, Python 3.12, Node via the committed lockfiles.

| Check | Result |
| --- | --- |
| `uv run pytest` | **198 passed** |
| vitest, `packages/qcraft-engine-ts` | **67 passed** (3 files) |
| vitest, `apps/qcraft-web` | **134 passed** (10 files) |
| `uv run ruff check .` | **All checks passed** |
| `uv run pyright` | 80 errors, unchanged from `main` (section 5.1) |
| `npm run typecheck`, both packages | clean |
| `npm run lint`, both packages | clean |
| `npm run build`, both packages | clean |
| TS-vs-Python differential | **PASS**, max relative deviation 1.16e-16 |
| Data pipeline smoke | **PASS**, rebuild byte-identical |

### 5.1 The pyright count

pyright reports 80 errors. The same 80 errors, in the same five files, are present on
`main` at `0fb5eb1`, verified by running pyright in a clean worktree of `main`. The merge
introduces none.

| File | Errors | Cause |
| --- | ---: | --- |
| `apps/qcraft-app/app.py` | 76 | the pre-existing Shiny app |
| `scripts/verify/phase{1,2,3}_*.py` | 3 | `xlwings` not installed (Excel harness) |
| `scripts/visual_qa.py` | 1 | `playwright` not installed |

Zero errors in any file any lane added. Clearing them is out of scope for this
consolidation and belongs with whoever owns the legacy Shiny app.

### 5.2 TS-vs-Python differential

10 countries, both vintages, two parameter sets, all 12 modules, every column and year.

Countries: UGA, KEN, ETH, NGA, GHA, IND, BRA, JPN, DEU, MDV. Chosen for spread across
region, income level, and debt profile, with Uganda first as the training country.

| Run | Cells compared | Max absolute | Max relative | Result |
| --- | ---: | ---: | ---: | --- |
| weo-2024-10, default params | 153,580 | 4.44e-16 | 1.16e-16 | PASS |
| weo-2024-10, golden params | 153,580 | 4.44e-16 | 1.16e-16 | PASS |
| weo-2026-04, default params | 153,580 | 4.44e-16 | 1.16e-16 | PASS |
| weo-2026-04, golden params | 153,580 | 4.44e-16 | 1.16e-16 | PASS |
| **Total** | **614,320** | **4.44e-16** | **1.16e-16** | **PASS** |

Tolerance is 1e-12 relative. The two engines are ports of one another, so the bar is
floating-point agreement rather than the golden-master tolerances. The observed worst case
is one unit in the last place of a double.

The four runs report identical worst-case statistics, which needed a control before the
PASS could be trusted. Three controls confirm the comparison is not vacuous:

1. The two parameter sets do change results: Uganda `fiscal.debt_to_gdp` differs by up to
   0.351 pp, `inflation.inflation` by 0.982 pp.
2. The two vintages change results substantially: Uganda `Hot_Unadapted.debt_to_gdp`
   differs by up to 43.74 pp, `fiscal.debt_to_gdp` by 17.12 pp.
3. The worst-case cell is `labour_productivity_growth`, which is upstream of both
   `debt_target` and `inflation_start` and therefore invariant to the parameter change.
   The identical statistic is a floor set by double rounding, not a stuck comparison.

### 5.3 Data pipeline smoke

`qcraft-pipeline run` executed end to end offline from the 285 MB raw cache carried over
from the lane3 clone: fetch, build, validate, emit. Validation reported all checks passed.

Output: macrofiscal 5,625 rows across 197 countries; demography 322,083 rows across 237;
productivity 5,470 rows across 176; climate 100,470 rows across 197. 175 countries
selectable, matching the committed `json/index.json`.

**All four rebuilt parquet tables are byte-identical to the committed `weo-2026-04`
vintage.** The vintage is reproducible from raw inputs.

Engine smoke on the rebuilt vintage, Uganda plus five diverse countries, all producing 12
modules of 91 rows:

| Country | debt/GDP 2029 | 2099 baseline | 2099 Hot Unadapted |
| --- | ---: | ---: | ---: |
| UGA | 53.45 | 52.21 | 170.56 |
| KEN | 73.55 | 73.30 | 159.82 |
| ETH | 31.15 | 51.59 | 73.70 |
| IND | 80.61 | 83.66 | 221.63 |
| BRA | 104.14 | 99.47 | 349.03 |
| MDV | 132.47 | 58.34 | 58.34 |

The MDV row is what surfaced finding 7.2.

Lane 3's own `pipeline/sanity_check.py` also ran clean across its 10-country old-vintage
versus new-vintage comparison.

### 5.4 Em-dash sweep

The site QA gate binding lane 2 requires zero em-dashes on the rendered surface, including
client-rendered React strings that a `dist/` grep misses.

**The shipped surface is clean.** No em-dash appears in any built `.js`, `.css`, or `.html`
file. The only occurrences in `dist/` are inside four `.js.map` sourcemaps, which embed
original source including comments and are not served to a reader.

51 em-dashes remain in `apps/qcraft-web` source, all inside code comments rather than
user-facing string literals. They do not reach the browser. Whether the workspace ban
extends to code comments is a call for whoever owns the freeze, not something this
consolidation changed.

---

## 6. Rerun commands

From the repo root, on `feat/explorer-v2-integration`.

### 6.1 Setup

```bash
uv sync --all-packages
(cd packages/qcraft-engine-ts && npm ci)
(cd apps/qcraft-web && npm ci)
```

Parquet data is gitignored. Either copy it, or rebuild it with section 6.3:

```bash
rsync -a ~/candidates/qcraft-sprint-2026-08-26/lane3-data/data/ data/
```

### 6.2 Core battery

```bash
uv run pytest
uv run ruff check .
uv run pyright
(cd packages/qcraft-engine-ts && npm test && npm run typecheck && npm run lint && npm run build)
(cd apps/qcraft-web && npm test && npm run typecheck && npm run lint && npm run build)
```

### 6.3 Data pipeline

```bash
rsync -a ~/candidates/qcraft-sprint-2026-08-26/lane3-data/pipeline/.cache/ pipeline/.cache/
uv run --package qcraft-pipeline qcraft-pipeline run --out /tmp/vintage-rebuild
uv run --package qcraft-pipeline python pipeline/sanity_check.py
```

Add `--force-download` to re-fetch the raw inputs instead of using the cache.

### 6.4 TS-vs-Python differential

```bash
W=/tmp/qcraft-diff
for V in weo-2024-10 weo-2026-04; do
  uv run --package qcraft-engine python scripts/export_country_json.py \
    UGA KEN ETH NGA GHA IND BRA JPN DEU MDV \
    --data-dir data/vintages/$V --out-dir $W/$V/input
  uv run --package qcraft-engine python scripts/differential/run_python.py \
    UGA KEN ETH NGA GHA IND BRA JPN DEU MDV \
    --data-dir data/vintages/$V --out $W/$V/py
  npx vite-node scripts/differential/run_ts.ts -- --in $W/$V/input --out $W/$V/ts
  uv run --package qcraft-engine python scripts/differential/compare.py \
    --python-dir $W/$V/py --ts-dir $W/$V/ts --label $V
done
```

Pass `--params <file>` to `run_python.py` and `run_ts.ts` together to run a non-default
parameter set. `compare.py` exits non-zero on any deviation above `--tol`, default 1e-12.

### 6.5 Em-dash sweep

```bash
EMDASH=$(printf '\xe2\x80\x94')
grep -rl "$EMDASH" apps/qcraft-web/dist \
  --include='*.js' --include='*.css' --include='*.html'
```

Expect no output.

---

## 7. Held for Teal

Both items are recorded here rather than acted on, because both change what the tool says
about itself. Neither blocks CC-2 through CC-5.

### 7.1 The parity wording, now that climate reproduces the fixtures

The binding wording is "baseline parity exact for 147/147 tested countries;
climate-scenario parity confirmed for ratio metrics only." That wording was written when
the production path drifted from the climate fixtures by up to 2.33 pp. It no longer
describes what the engine does.

The wording is unchanged everywhere pending a call. This is a claim about the IMF
original, so it is Teal's to make, not the integrator's. See the gate raised alongside
this report.

### 7.2 Eleven selectable countries have no climate signal

26 countries in the climate dataset carry an all-zero GDP-loss slice in both vintages. 11
are selectable in the Explorer:

Bahrain, Barbados, Hong Kong SAR, St. Lucia, Macao SAR, **Maldives**, Malta, West Bank and
Gaza, Singapore, Timor-Leste, Tonga.

For these, all six climate scenarios lie exactly on the baseline. Uganda's Hot Unadapted
path reaches 170.56% of GDP by 2099; Maldives shows 58.34% under every scenario, identical
to its baseline to 1e-12.

The FADCP dataset is temperature-driven and has no coverage for these mostly small island
and microstate economies. Nothing in the Explorer says so. A trainee who picks Maldives
sees six scenarios on one line and no explanation, which reads as "climate has no fiscal
effect on the Maldives."

This connects to the honest-broker stance already agreed: sea-level rise is one of the
documented exclusions, and these are the countries where that exclusion bites hardest.
The fix is a UI affordance and a line of copy, which is CC-2 through CC-5 territory rather
than this consolidation's.

### 7.3 Two smaller findings, recorded but not held

**Zambia does not run.** `run_pipeline("ZMB")` raises `TypeError` in `fiscal.py:79` on a
null `debt_to_gdp`, in both vintages and on `main` at `0fb5eb1`. It behaves like the 13
countries the Excel parity harness lists as `PYTHON_ERROR`, but it is not on that list.
This matters because the reference notes name Zambia as a welcome course example. ZMB was
swapped for NGA in the differential set.

**NGFS attribution.** The binding note names the FADCP Climate Dataset (Centorrino,
Massetti and Tagklis, 2024) as the damage source and calls the NGFS line an error.
`README.md` lines 5 and 16 still say NGFS, as do several code comments, a type doc, and
one user-facing string: the climate widget standfirst in
`apps/qcraft-web/src/widgets/climateChannel/ClimateChannelWidget.tsx:159` reads "Uganda
under six NGFS pathways". Lane 2 already enforces the correct attribution in the export
packet, so the exported artifact is right. This was left alone to avoid colliding with
whichever downstream lane owns the copy pass, and the widget string is user-facing
material for Tuesday.

---

## 8. Branch state

- Branch `feat/explorer-v2-integration`, pushed. Draft PR only. Nothing merged to `main`.
- Lane clones are attached as local remotes `lane1`, `lane2`, `lane3`. They have no
  upstream of their own, so anyone reproducing this needs the clones on disk.
