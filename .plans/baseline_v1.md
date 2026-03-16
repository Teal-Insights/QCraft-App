---
issue: 4
module: baseline_v1
---

## Goal

Implement baseline_v1() — the core GDP projection engine that computes employment growth, productivity (back-calculated during WEO overlap), and recursive real/nominal GDP for 2009-2099, achieving golden master parity for Uganda.

## Tests to Write First

1. Row count (91 rows), year range (2009-2099), column names match golden master
2. Employment growth parity (all years) — WAP(t)/WAP(t-1)*100-100
3. Productivity back-calculation parity (WEO overlap years 2023-2029)
4. Real GDP and nominal GDP parity (WEO period + projection period)
5. GDP deflator growth parity (macrofiscal-derived WEO period + inflation post-WEO)
6. Population growth parity (total pop, not WAP)
7. Spot checks at key years: 2009, 2029 (WEO boundary), 2050, 2099

## Implementation Steps

1. Build input data fixtures from golden master + upstream golden masters (demography, productivity, inflation)
2. Load macrofiscal data (real_gdp, nominal_gdp, deflator growth) for WEO period from golden master
3. Phase 1: Employment growth = WAP(t)/WAP(t-1)*100-100 for ALL years
4. Phase 2: Back-calculate productivity during [WEO_MAX_YEAR-6, WEO_MAX_YEAR]
5. Phase 3: Use logistic convergence productivity for years > WEO_MAX_YEAR (from productivity_country)
6. Phase 4: Recursive GDP computation (for-loop) for years > WEO_MAX_YEAR
7. Assemble output DataFrame with correct column names

## Out of Scope

- Fiscal variables (revenue, expenditure, debt) — handled by baseline_country
- Interest rate computation — handled by interest_rate_country
- Climate scenario adjustments — handled by calc_climate_scenario
