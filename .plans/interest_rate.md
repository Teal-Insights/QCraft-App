---
issue: 5
module: interest_rate
---

## Goal

Implement `interest_rate_country()` to project nominal interest rates under three user-selectable modes, then derive real interest rate and interest-growth differential. Must achieve golden master parity for Uganda.

## Tests to Write First

1. Structure tests: row count (91), year range (2009-2099), column names
2. Historical period parity: nominal_interest_rate matches golden master for 2009-2029
3. Projection period parity: nominal_interest_rate constant at 8.039 for 2029-2099 (Nominal mode)
4. Derived columns parity: real_interest_rate and interest_growth_differential match golden master
5. Spot checks at key years: 2009 (high inflation), 2029 (boundary), 2050, 2099

## Implementation Steps

1. Read historical nominal_interest_rate from macrofiscal for years through WEO boundary
2. Read nominal_gdp_growth_percent and gdp_deflator_growth_percent from df_baseline_v1
3. Compute anchor values (base_nominal_rate, base_igd) from last macrofiscal year
4. Project nominal rate based on select_rate mode (3 modes)
5. Derive real_interest_rate via Fisher equation and interest_growth_differential
6. Return DataFrame with iso3c, country, years, and 5 numeric columns

## Out of Scope

- Climate scenario adjustments (interest rates are exogenous)
- Data loading (function takes DataFrames as input)
- UI integration
