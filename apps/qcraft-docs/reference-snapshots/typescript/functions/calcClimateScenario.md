[**@qcraft/engine**](../README.md)

***

[@qcraft/engine](../README.md) / calcClimateScenario

# Function: calcClimateScenario()

> **calcClimateScenario**(`dataBaseline`, `dataBaselineV1`, `dataInterest`, `climateVariation`, `options?`): [`ClimateRow`](../interfaces/ClimateRow.md)[]

Defined in: [packages/qcraft-engine-ts/src/climate.ts:44](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/climate.ts#L44)

Compute climate-adjusted fiscal projections for one scenario.

## Parameters

### dataBaseline

readonly [`FiscalRow`](../interfaces/FiscalRow.md)[]

Output of `baselineCountry` (the fiscal module).

### dataBaselineV1

readonly [`BaselineV1Row`](../interfaces/BaselineV1Row.md)[]

Output of `baselineV1`.

### dataInterest

readonly [`InterestRateRow`](../interfaces/InterestRateRow.md)[]

Output of `interestRateCountry`.

### climateVariation

readonly [`ClimateVariationRow`](../interfaces/ClimateVariationRow.md)[]

Year-over-year productivity growth shock; zero through
  WEO_MAX_YEAR, which is how the function infers where projections begin.

### options?

[`ClimateOptions`](../interfaces/ClimateOptions.md) = `{}`

## Returns

[`ClimateRow`](../interfaces/ClimateRow.md)[]

91 rows (2009–2099) with 21 columns.
