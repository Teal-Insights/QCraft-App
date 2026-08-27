# Change Request: climate — `_build_climate_variation` does not reproduce the climate golden masters

Raised by the Lane 1 TypeScript port (TEA-1399), 2026-08-26.

## What I expected

`run_pipeline()` driven from `data/processed/*.parquet` should reproduce
`packages/qcraft-engine/tests/golden_masters/intermediate/climate/*_uganda.csv`, the same
way it reproduces every other intermediate golden master.

## What I found

It reproduces demography, inflation, baseline_v1, interest_rate and fiscal to machine
epsilon, but the six climate scenarios drift. The cause is that the climate productivity
shock is derived two different ways:

| Where | Derivation |
| --- | --- |
| `data_loader._build_climate_variation()` (production path) | `variation(t) = (100 + gdp_loss(t)) - (100 + gdp_loss(t-1))` — first difference of the NGFS GDP-loss index |
| `tests/test_climate.py::_build_climate_variation()` (fixture path) | `variation(t) = climate_prod(t) - baseline_prod(t)` — difference of the two productivity series |

These are not algebraically equal. A GDP-index first difference is a change in an index
level; the productivity delta is a difference of growth rates. They agree closely but not
exactly, and the gap compounds over 70 projection years.

Measured for Uganda (`debt_target=60`, `fiscal_rule=Yes`, `rigidity=1.0`), production path
vs. golden master:

| Scenario | max abs Δ in the variation itself (pp) | max abs Δ `debt_to_gdp` (pp) | `debt_to_gdp` 2099 (pipeline / fixture) |
| --- | ---: | ---: | ---: |
| Moderate | 3.2e-8 | 0.0000 | 47.16 / 47.16 |
| Paris | 3.6e-5 | 0.0254 | 39.13 / 39.16 |
| High | 5.2e-4 | 0.1558 | 67.66 / 67.82 |
| Hot Adapted | 8.0e-4 | 0.2173 | 71.80 / 72.02 |
| Hot | 2.4e-3 | 0.7794 | 93.18 / 93.96 |
| Hot Unadapted | 6.2e-3 | 2.3349 | 124.52 / 126.86 |

So the shock itself is right to ~6e-3 pp at worst, but 70 years of compounding turns that
into 2.3 pp of debt-to-GDP in the most severe scenario.

## This is not a port defect

The TypeScript engine reproduces Python `run_pipeline()` to **1.1e-16** across every
module, column, year and null position for Uganda — including the climate scenarios. Both
engines diverge from the climate fixtures identically, because both use the production
derivation. `test_climate.py` never notices because it injects the fixture-derived
variation directly, bypassing `_build_climate_variation()` entirely.

The existing Excel parity work is consistent with this: `verification-logs/PARITY_REPORT.md`
reports climate ratio metrics as PASS at a ±0.5pp threshold, which the four milder
scenarios clear and Hot Unadapted (2.33pp) does not.

## Proposed fix

Decide which derivation is authoritative against the Excel workbook (source-of-truth rank
1) and make both paths use it. Most likely `_build_climate_variation()` should derive the
shock from the productivity series rather than the GDP-loss index, matching the fixtures —
but that is a domain call for the workbook formulas to settle, not something to change
from the TypeScript side.

Whatever is decided, `test_climate.py` should exercise `_build_climate_variation()` rather
than reimplementing it, so the production path is what the golden masters actually pin.

## Status

**Worked around, not blocked.** Both engines behave identically, so the port is faithful
and the TS golden-master suite is green (45/45) against the frozen fixtures. The
TypeScript end-to-end test asserts the baseline chain strictly, and holds the climate
scenarios to an explicitly-labelled regression bound rather than claiming parity there.

## Files

- `packages/qcraft-engine/src/qcraft_engine/data_loader.py` (`_build_climate_variation`)
- `packages/qcraft-engine/tests/test_climate.py` (`_build_climate_variation`)
- `packages/qcraft-engine-ts/src/pipeline.ts` (`buildClimateVariation` — faithful port of the former)
- `packages/qcraft-engine-ts/tests/pipeline-e2e.test.ts`

---

# Resolution (2026-08-27, integration lane CC-1)

**Accepted, with the derivation reversed from what this request proposed.**

## What settles it

The request proposed making `_build_climate_variation()` derive the shock from the
productivity series, matching the fixture path. That is the wrong direction. Neither
derivation was right, and the fixture path could not have told us so: it recovers the
variation by inverting the golden master (`climate_prod - baseline_prod`), so it
reproduces the golden master by construction whatever the production path does.

Testing both candidate formulas directly against the Excel-extracted climate golden
masters for Uganda, all six scenarios, every projection year 2030-2099:

| Derivation | max abs error vs golden masters |
| --- | ---: |
| `I(t) - I(t-1)` (first difference, what both engines shipped) | 6.2e-3 pp |
| `100 * (I(t) / I(t-1) - 1)` (percent change) | **7.1e-15 pp** |

where `I(t) = 100 + gdp_loss_percent(t)`.

Percent change reproduces the workbook to machine epsilon in all six scenarios. The
first difference does not. The reason is dimensional, and the request identified it
correctly before drawing the opposite conclusion: the shock is added to labour
productivity GROWTH, so it has to be a growth rate. Differencing index levels is only a
good approximation while the index sits near 100, which is why the error tracks scenario
severity and compounds over the 70 projection years.

## Root cause

`planning/oracles/climate.md` described the "Variation on LP Growth" row as a
"year-over-year change in GDP index" and rendered it in pseudocode as a subtraction. Both
engines implemented the pseudocode faithfully. The oracle is a derived analysis document,
below the workbook and the Excel-extracted golden masters in the source-of-truth
hierarchy, and on this point it was wrong.

## What changed

- `packages/qcraft-engine/src/qcraft_engine/data_loader.py` — `_build_climate_variation`
  now computes the percent change.
- `packages/qcraft-engine-ts/src/pipeline.ts` — `buildClimateVariation`, the same.
- `packages/qcraft-engine/tests/test_climate.py` — the local reimplementation is gone.
  Every call site now drives the production `_build_climate_variation`, so the climate
  golden masters pin the production path for the first time. Inputs come from a new
  committed fixture, `tests/fixtures/uganda_climate_input.csv`, extracted from the frozen
  `weo-2024-10` vintage, so the suite stays hermetic on a fresh clone.
- `packages/qcraft-engine-ts/tests/pipeline-e2e.test.ts` — the 2.5 pp regression bound is
  replaced by a full `compareFrame` against `TOL.CLIMATE`, the same per-column tolerances
  the baseline chain uses.
- `planning/oracles/climate.md` — the formula and the gotcha section corrected, with the
  history noted so the bug cannot be reintroduced from the oracle.

## Verification

198 pytest and 67 vitest pass. Golden masters were not touched. Uganda debt-to-GDP at
2099 now reproduces the fixtures in every scenario, including Hot Unadapted, which was
the 2.33 pp outlier.

## Held for Teal

This changes what the tool computes for climate scenarios, so it bears on the binding
parity wording ("climate-scenario parity confirmed for ratio metrics only"). The wording
is unchanged pending Teal's call. See the gate in `INTEGRATION-REPORT.md`.
