---
issue: 7
module: climate
---

## Goal

Implement `calc_climate_scenario()` — takes baseline fiscal projections and climate GDP loss data, returns climate-adjusted fiscal projections for a single scenario. Called 6 times (once per scenario).

## Tests to Write First

1. Intermediate parity: all 21 columns match golden master for each of 6 scenarios (Paris, Moderate, High, Hot, Hot Adapted, Hot Unadapted)
2. Final parity: debt_to_gdp and fiscal ratios at key years (2023, 2030, 2050, 2075, 2099) match final golden master
3. Domain rule: NO debt floor (debt_to_gdp can go negative, unlike baseline)
4. Domain rule: employment_growth unchanged from baseline
5. Domain rule: with rigidity=1.0, primary expenditure levels match baseline exactly

## Implementation Steps

1. Accept baseline (fiscal), baseline_v1, interest_rate, and climate_variation as inputs
2. Phase 1: Adjust productivity by climate_variation for years >= 2030
3. Phase 2: Recursive GDP recomputation (for-loop, years >= 2030)
4. Phase 3: Expenditure recalibration using rigidity parameter
5. Phase 4: Revenue = baseline ratio * scenario GDP
6. Phase 5: Recursive fiscal calculation (for-loop, NO debt floor)

## Out of Scope

- Loading climate parquet data (data_loader responsibility)
- Discrete risks (Uganda golden master has all zeros; accept but skip if None)
- Fiscal rule within climate scenarios (not applied per oracle)
