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
