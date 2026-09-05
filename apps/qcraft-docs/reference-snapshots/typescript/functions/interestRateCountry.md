[**@qcraft/engine**](../README.md)

***

[@qcraft/engine](../README.md) / interestRateCountry

# Function: interestRateCountry()

> **interestRateCountry**(`dfBaselineV1`, `macrofiscal`, `iso3c`, `options?`): [`InterestRateRow`](../interfaces/InterestRateRow.md)[]

Defined in: [packages/qcraft-engine-ts/src/interestRate.ts:32](https://github.com/Teal-Insights/QCraft-App/blob/a6313ad7f8f38e174bd38c89e3419ee1be79cda9/packages/qcraft-engine-ts/src/interestRate.ts#L32)

Compute interest rate projections for a single country.

## Parameters

### dfBaselineV1

readonly [`BaselineV1Row`](../interfaces/BaselineV1Row.md)[]

Output of `baselineV1`.

### macrofiscal

readonly [`MacroFiscalRow`](../interfaces/MacroFiscalRow.md)[]

Historical macrofiscal rows carrying `interest_rate_percent`.

### iso3c

`string`

### options?

[`InterestRateOptions`](../interfaces/InterestRateOptions.md) = `{}`

## Returns

[`InterestRateRow`](../interfaces/InterestRateRow.md)[]

91 rows (2009–2099).
