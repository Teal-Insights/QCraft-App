---
issue: 2
module: productivity
---

## Goal

Implement `productivity_country()` with logistic convergence for labor productivity growth, cumulative levels, and OECD-relative benchmarking — matching golden master parity for Uganda.

## Tests to Write First

1. Row count (91 rows, 2009-2099)
2. Historical growth rates (2010-2021) match golden master
3. Logistic convergence growth rates (2030-2099) match golden master
4. Spot-check logistic formula at key years (2030, 2043, 2070)
5. Level compounding formula is correct (unit test)

## Implementation Steps

1. Logistic convergence function: `start + (end - start) * (1/(1+exp(-rate*(counter-tp))))^rate`
2. Historical growth from WDI levels (2009-2021, needs 2008 for first growth)
3. WEO placeholder growth (2022-2029): use productivity_start
4. Projection growth (2030-2099): logistic convergence
5. Cumulative level: compound from last historical value
6. OECD relative level: historical OECD levels + projected at fixed rate

## Out of Scope

- WEO overlap back-calculation (belongs in baseline_v1 Phase 2)
- Inflation dependency (productivity is real, not nominal)
- Multi-country batch processing
