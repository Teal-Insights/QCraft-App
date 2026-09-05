---
editUrl: false
next: false
prev: false
title: "calcClimateScenario"
---

> **calcClimateScenario**(`dataBaseline`, `dataBaselineV1`, `dataInterest`, `climateVariation`, `options?`): [`ClimateRow`](/QCraft-App/docs/reference/typescript/interfaces/climaterow/)[]

Defined in: [packages/qcraft-engine-ts/src/climate.ts:46](https://github.com/Teal-Insights/QCraft-App/blob/a6313ad7f8f38e174bd38c89e3419ee1be79cda9/packages/qcraft-engine-ts/src/climate.ts#L46)

Compute climate-adjusted fiscal projections for one scenario.

## Parameters

### dataBaseline

readonly [`FiscalRow`](/QCraft-App/docs/reference/typescript/interfaces/fiscalrow/)[]

Output of `baselineCountry` (the fiscal module).

### dataBaselineV1

readonly [`BaselineV1Row`](/QCraft-App/docs/reference/typescript/interfaces/baselinev1row/)[]

Output of `baselineV1`.

### dataInterest

readonly [`InterestRateRow`](/QCraft-App/docs/reference/typescript/interfaces/interestraterow/)[]

Output of `interestRateCountry`.

### climateVariation

readonly [`ClimateVariationRow`](/QCraft-App/docs/reference/typescript/interfaces/climatevariationrow/)[]

Year-over-year productivity growth shock; zero through
  WEO_MAX_YEAR. Current passes climateStartYear; legacy callers retain inference.

### options?

[`ClimateOptions`](/QCraft-App/docs/reference/typescript/interfaces/climateoptions/) = `{}`

## Returns

[`ClimateRow`](/QCraft-App/docs/reference/typescript/interfaces/climaterow/)[]

91 rows (2009–2099) with 21 columns.
