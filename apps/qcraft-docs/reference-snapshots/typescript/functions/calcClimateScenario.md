[**@qcraft/engine**](../README.md)

***

[@qcraft/engine](../README.md) / calcClimateScenario

# Function: calcClimateScenario()

> **calcClimateScenario**(`dataBaseline`, `dataBaselineV1`, `dataInterest`, `climateVariation`, `options?`): [`ClimateRow`](../interfaces/ClimateRow.md)[]

Defined in: [packages/qcraft-engine-ts/src/climate.ts:46](https://github.com/Teal-Insights/QCraft-App/blob/a6313ad7f8f38e174bd38c89e3419ee1be79cda9/packages/qcraft-engine-ts/src/climate.ts#L46)

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
  WEO_MAX_YEAR. Current passes climateStartYear; legacy callers retain inference.

### options?

[`ClimateOptions`](../interfaces/ClimateOptions.md) = `{}`

## Returns

[`ClimateRow`](../interfaces/ClimateRow.md)[]

91 rows (2009–2099) with 21 columns.
