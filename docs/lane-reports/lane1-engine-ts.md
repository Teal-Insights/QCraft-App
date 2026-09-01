# Lane 1 — Morning Report (TEA-1399)

**Port `qcraft-engine` to TypeScript with golden-master parity.**
Wed 2026-08-26, unattended run. Branch `feat/lane1-engine-ts`, local commits only (no push).

---

## Status: done

| Deliverable | State |
| --- | --- |
| `packages/qcraft-engine-ts` — 7 modules + pipeline, strict TS, zero runtime deps | done |
| Vitest harness over every golden-master CSV at the pytest tolerances | **67/67 green** |
| `engine-api.md` + copy in `SHARED/` | done |
| Exporter script + 3 sample country JSONs in `SHARED/sample-data/` | done |
| Parity summary table | below |
| typecheck / lint / test / build | all green |

**Headline:** the TypeScript engine reproduces Python `run_pipeline()` to **1.1e-16** —
every module, every column, every year, and every null position — and passes
**147/147 PARITY_PASS** against the Excel-derived golden masters over 72,030 comparisons,
the same result `verification-logs/PARITY_REPORT.md` reports for the Python engine.

---

## Verify commands

```bash
cd packages/qcraft-engine-ts
npm install --include=dev     # --include=dev is REQUIRED: NODE_ENV=production is set in
                              # the agent shell, which makes npm silently skip devDeps
npm test                      # 67 checks; writes artifacts/parity-summary*.md
npm run typecheck             # tsc --noEmit, strict + noUncheckedIndexedAccess
npm run lint                  # eslint, type-checked config
npm run build                 # emits dist/ with .d.ts

# Multi-country Excel parity (needs data not in the repo):
cd ../..
uv run --with polars --with pyarrow python scripts/export_country_json.py \
    --all --out-dir /tmp/qcraft-country-json
cd packages/qcraft-engine-ts && npm run parity:excel -- /tmp/qcraft-country-json
```

The Python side still works — `uv run pytest packages/qcraft-engine/tests/` is unaffected
(see "uv workspace" under Decisions).

---

## Parity summary

### A. Frozen golden masters — `packages/qcraft-engine/tests/golden_masters/`

The contract named in the brief. Every one of the 13 CSVs is exercised: 6 intermediate
modules, all 6 climate scenarios, and the final summary. Tolerances are copied from
`packages/qcraft-engine/tests/test_*.py`; no expected value is hard-coded or produced by
engine code.

> **The brief says "many countries"; the fixtures are Uganda only.** All 13 files are
> `uganda.csv` / `*_uganda.csv`. Multi-country coverage exists elsewhere —
> `verification-logs/golden-masters/` (147 countries) — so I ran that too, as section B.

Worst absolute deviation per metric (full table in `artifacts/parity-summary.md`):

| Module | Series × rows | Worst metric | Max abs deviation | Tolerance |
| --- | --- | --- | ---: | --- |
| demography | 1 × 91 | all four columns | **0** | abs 0.5 / 0.001 |
| inflation | 1 × 91 | `inflation` | **0** | abs 1e-4 |
| productivity | 1 × 83 | `productivity_growth_rate_percent` | 1.78e-14 | abs 1e-3 |
| baseline_v1 | 1 × 91 | all nine columns | **0** | abs 1e-4 … rel 1e-6 |
| interest_rate | 1 × 91 | all five columns | **0** | abs 1e-4 / 1e-3 |
| fiscal | 1 × 91 | `debt` | 5.59e-8 | rel 1e-4 |
| fiscal | 1 × 91 | `debt_to_gdp` | 1.35e-13 | abs 1e-3 |
| climate (6 scenarios) | 6 × 546 | `debt` | 7.08e-8 | rel 1e-4 |
| climate (6 scenarios) | 6 × 546 | `debt_to_gdp` | 1.71e-13 | abs 1e-3 |
| final summary | 35 rows × 6 cols | `debt_to_gdp` | 1.71e-13 | abs 0.01 |

`debt` is a level in the billions, so 7.1e-8 is ~1e-15 relative — floating-point noise, not
a formula difference.

Two windows are compared exactly the way the pytest suites compare them, and both skips
are pinned by their own tests so nothing is silently uncovered:

- **`productivity` 2022–2029** — the fixture holds Excel's back-calculated series;
  `productivityCountry` emits a `productivity_start` placeholder there that `baselineV1`
  overwrites. Two added tests assert (a) the engine really does emit 5.0 across that
  window, and (b) the fixture values there are byte-identical to the `baseline_v1` fixture,
  which *is* compared over the full horizon. `productivity_level` and
  `productivity_level_oecd_percent` compound off that placeholder, so they are compared
  over 2009–2021 only — same as `test_productivity.py`.
- **`population_growth` 2009** — no t-1 population in range; `test_baseline_v1.py` skips it
  identically.

### B. Excel-derived golden masters — `verification-logs/golden-masters/` (147 countries)

Replays `scripts/verify/phase2_breadth.py` through the TS engine with that harness's own
parameters (Excel defaults: `debt_target=60`, `fiscal_rule=Yes`, `rigidity=1.0`,
inflation 3.5/3.5), metric mapping and thresholds.

**147/147 PARITY_PASS · 0 FAIL · 0 REVIEW · 72,030 comparisons**

| Metric | Worst deviation | Where | Threshold |
| --- | ---: | --- | --- |
| `debt_to_gdp` | 1.17e-12 pp | BOL @ 2099 | 0.5 pp fail / 0.1 pp review |
| `primary_expenditure_percent_gdp` | 1.56e-13 pp | KWT @ 2091 | 0.5 pp |
| `primary_balance_percent_gdp` | 1.49e-13 pp | KWT @ 2091 | 0.5 pp |
| `revenue_percent_gdp` | 7.11e-14 pp | CYP @ 2088 | 0.5 pp |
| `nominal_interest_rate` | 1.88e-4 relative | BRN @ 2030 | 1e-3 relative |
| `real_gdp_growth_percent` | 2.08e-13 relative | CYP @ 2052 | 1e-3 relative |
| `nominal_gdp` | 1.26e-15 relative | CYP @ 2074 | 1e-3 relative |

`overall_balance_percent_gdp` and `interest_expenditure_percent_gdp` are in the harness's
metric list but blank in every exported CSV, so they contribute no comparisons here. They
are covered in section A instead.

### C. Cross-engine check — TS vs Python `run_pipeline`

Ran both engines on Uganda from the same Parquet data and diffed every column of all 12
result frames (6 modules + 6 scenarios):

**Worst relative deviation 1.148e-16 · 0 null-placement mismatches.**

That is machine epsilon: the port is numerically equivalent, not merely within tolerance.

---

## Key decisions

**Row objects, not columns.** Each module returns `Row[]` with snake_case fields identical
to the Polars column names and the CSV headers. A fixture row and an engine row are the
same shape, which makes parity checkable by eye, and `Row[]` is what D3/React want anyway.

**`mustGet` throws where Python raises `KeyError`.** A missing year in JS would return
`undefined` and silently poison the arithmetic with `NaN`, so the TS engine would disagree
with Python *without failing*. Throwing keeps both engines failing on the same inputs —
which is why ~13 of 198 countries error identically in both.

**Input shaping lives in the engine, not the exporter.** `export_country_json.py` emits raw
slices; `buildMacroForFiscal` / `buildMacroForBaseline` / `buildMacroDeflator` /
`buildClimateVariation` port `data_loader.py`'s filtering and forward-fill. One home for the
rules, and the UI lane can re-derive if it ever needs to.

**uv workspace.** The root `pyproject.toml` globs `packages/*`, so adding a TypeScript
package broke `uv run` for the *entire repo* (including `uv run pytest`). Added
`exclude = ["packages/qcraft-engine-ts"]` to `[tool.uv.workspace]` — three lines, and the
Python toolchain works again for every lane. This is the one file I touched outside my
package; it is not on CLAUDE.md's do-not-edit list, and leaving it broken would have
blocked lanes 2 and 3.

**Tolerances are copied, never tuned.** Where the pytest suites assert nothing (six climate
columns), I applied the analogous fiscal tolerance rather than leaving them unchecked —
strengthening coverage, not relaxing it.

---

## Findings

### 1. `_build_climate_variation` does not reproduce the climate fixtures — change request filed

`.change-requests/climate-variation-2026-08-26.md`.

The climate productivity shock is derived two different ways:

| Where | Derivation |
| --- | --- |
| `data_loader._build_climate_variation()` (production) | first difference of the NGFS GDP-loss index |
| `test_climate.py::_build_climate_variation()` (fixtures) | difference of the two productivity series |

They are not algebraically equal. Uganda, production path vs. fixture:

| Scenario | Δ in the shock itself | Δ `debt_to_gdp` | 2099 pipeline / fixture |
| --- | ---: | ---: | ---: |
| Moderate | 3.2e-8 pp | 0.0000 pp | 47.16 / 47.16 |
| Paris | 3.6e-5 pp | 0.0254 pp | 39.13 / 39.16 |
| High | 5.2e-4 pp | 0.1558 pp | 67.66 / 67.82 |
| Hot Adapted | 8.0e-4 pp | 0.2173 pp | 71.80 / 72.02 |
| Hot | 2.4e-3 pp | 0.7794 pp | 93.18 / 93.96 |
| Hot Unadapted | 6.2e-3 pp | **2.3349 pp** | 124.52 / 126.86 |

A ~6e-3 pp error in the shock compounds into 2.3 pp of debt-to-GDP over 70 years.

**Not a port defect** — both engines agree to 1.1e-16, so Python diverges from its own
fixtures identically. `test_climate.py` never catches it because it injects the
fixture-derived variation and never calls the production builder. Consistent with
`PARITY_REPORT.md`, which passes climate ratio metrics at ±0.5 pp — a bar the four milder
scenarios clear and Hot Unadapted does not.

Worked around, not blocked: the golden-master suite is green, and the end-to-end test holds
climate `debt_to_gdp` to an explicitly-labelled 2.5 pp *regression bound* rather than
claiming parity there. Resolving it needs the Excel workbook (source-of-truth rank 1), so
it is a domain call, not a TypeScript one.

### 2. The six scenarios are not a severity ladder — flagged to the UI lane

Uganda `debt_to_gdp` at 2099: Paris 39.2 · **Baseline 47.0** · Moderate 47.2 · High 67.8 ·
Hot+Adapted 72.0 · Hot 94.0 · Hot+Unadapted 126.9.

`High` (4°C+) lands *below* `Hot` (3°C) — they come from different NGFS damage pathways and
are not rank-ordered by warming alone. Paris sits below baseline. A sequential colour ramp
implying one ordered scale would misrepresent the data; `engine-api.md` §6 and §7 say so
explicitly.

### 3. `demography` returns 92 rows on real data, not 91

`demography_country` filters `years >= 2009` with no upper bound, and UN WPP runs to 2100.
Docstring and fixtures both say 91. Faithfully ported (the TS engine does the same); nothing
downstream reads past 2099, so it is cosmetic. Not filed — flagging it here.

### 4. Bangladesh does not run

BGD is one of the 13 `PYTHON_ERROR` countries in `PARITY_REPORT.md` — macrofiscal gaps make
the pipeline throw in both engines. The sample JSON is exported and valid; `runPipeline` on
it raises `Missing … for year …`. Useful as the UI's error-path fixture. Uganda and Kenya
both run clean.

### 5. Two per-country JSON producers with incompatible shapes — adapter written

Lane 3 also emits per-country JSON (`data/vintages/<vintage>/json/<ISO3>.json`). Same
top-level keys as mine (`iso3c`, `country`, `macrofiscal`, `demography`, `productivity`,
`climate`), different inner shape: **columnar** arrays with demography nested under
`variants` and climate under `scenarios`, versus my **row-oriented** objects. Easy to mix
up, and lane 2 would have hit it.

Rather than just flag it, I added `fromColumnarCountryInput()` so the engine accepts either
producer. Verified against Lane 3's actual `SHARED/sample-outputs/{UGA,KEN}.json` (vintage
`weo-2026-04`): both run clean, 91 rows, correct scenario ordering.

One real gap found while doing it: **the columnar format carries no OECD productivity
series.** `productivityCountry` needs `iso3c = "OED"` rows for
`productivity_level_oecd_percent`; without them it falls back to an OECD level of 1.0 and
emits a meaningless number *without failing*. The adapter therefore refuses to run unless
the caller passes `oecdProductivity` or explicitly sets `allowMissingOecd: true`. Nothing
else is affected — no other module reads that column, and a test pins that claim.

Worth Lane 3 adding the `OED` series to the columnar export.

---

## Shared artifacts

| Path | Contents |
| --- | --- |
| `SHARED/engine-api.md` | Types, signatures, units, nullable columns, data provenance, error contract, worked Uganda run, domain rules the UI must not "fix" |
| `SHARED/sample-data/UGA.json` | Uganda, 231 KB — the golden-master country |
| `SHARED/sample-data/KEN.json` | Kenya, 229 KB — clean second country |
| `SHARED/sample-data/BGD.json` | Bangladesh, 237 KB — **error-path fixture, does not run** |

`engine-api.md` is also at `packages/qcraft-engine-ts/engine-api.md`; the SHARED copy is
kept in sync on every API change.

---

## Where the Shiny app's data lives

`load_parquet_data()` resolves `<project-root>/data/processed/` — four Parquet files that
are **not in this repo** (`*.parquet` is gitignored). Copies on this machine:

| Path | Notes |
| --- | --- |
| `~/Library/CloudStorage/Dropbox/Mac/Documents/QCraft-App/data/processed/` | primary; the exporter's first choice |
| `…/QCraft-App/deploy-bundle/data_processed/` | flattened copy shipped to shinyapps.io |
| `…/QCraft-Verification/data/processed/` | copy used by the Excel parity harness |
| `<sprint>/lane3-data/data/processed/` | Lane 3's clone |

Schemas are documented in `engine-api.md` §3.1. `scripts/export_country_json.py`
searches these paths in order, or takes `--data-dir`.

---

## Open questions for Teal

1. **Climate variation derivation** (finding 1) — which is authoritative against the Excel
   workbook: the GDP-loss first difference or the productivity delta? Affects Hot Unadapted
   by 2.3 pp, which is material for a training that walks through exactly that scenario.
2. **Golden-master breadth** — the brief expected many countries in
   `tests/golden_masters/`; it is Uganda only. Should the Uganda-shaped intermediate
   fixtures be generated for a handful more countries, or is
   `verification-logs/golden-masters/` (147, baseline-only, 2030–2099) the intended
   multi-country contract? I treated the latter as authoritative for breadth.
3. **Which JSON producer wins?** (finding 5) Lane 3's vintage pipeline and my exporter
   both emit per-country JSON in different shapes. The engine now accepts both, but lane 2
   should be told which is canonical — I'd suggest Lane 3's, since it carries the vintage
   id, provided it adds the `OED` productivity series.
4. **Publishing** — the package is `@qcraft/engine`, local only. No `npm link`, no registry,
   no remote. Say how lane 2 should consume it (workspace dep, path dep, or vendored)
   and I will wire it.
5. **Trunk-based discipline** — CLAUDE.md wants an issue and a PR per unit of work; the
   brief forbids pushing. I committed locally to `feat/lane1-engine-ts` in 7 commits and
   filed no GitHub issue. Flagging the deliberate conflict.

---

## Commit log

```
  50a6b16 feat(engine-ts): port the 7 qcraft-engine modules + pipeline to strict TypeScript
  87cbd14 test(engine-ts): vitest golden-master sweep over all 13 fixture CSVs
  75207f6 docs(engine-ts): engine-api.md for the UI lane
  26d25dc change-request: climate — see .change-requests/climate-variation-2026-08-26.md
  d2f1cf0 feat: per-country JSON exporter + end-to-end pipeline parity test
  f0f54d0 feat(engine-ts): 147-country Excel parity script + eslint config
```

## Not done / out of scope

- No `npm link` or registry publish (brief forbids publishing).
- `scripts/excel-parity.ts` is not in `npm test` — it needs ~40 MB of exported JSON that is
  not in the repo. Run it via `npm run parity:excel` after exporting.
- The Python `qcraft-engine` is untouched apart from the three-line `pyproject.toml`
  workspace exclusion.
- No UI work; that is lane 2's.
