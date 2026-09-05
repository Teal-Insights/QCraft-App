---
editUrl: false
next: false
prev: false
title: "interestRateCountry"
---

> **interestRateCountry**(`dfBaselineV1`, `macrofiscal`, `iso3c`, `options?`): [`InterestRateRow`](/QCraft-App/docs/reference/typescript/interfaces/interestraterow/)[]

Defined in: [packages/qcraft-engine-ts/src/interestRate.ts:32](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/interestRate.ts#L32)

Compute interest rate projections for a single country.

## Parameters

### dfBaselineV1

readonly [`BaselineV1Row`](/QCraft-App/docs/reference/typescript/interfaces/baselinev1row/)[]

Output of `baselineV1`.

### macrofiscal

readonly [`MacroFiscalRow`](/QCraft-App/docs/reference/typescript/interfaces/macrofiscalrow/)[]

Historical macrofiscal rows carrying `interest_rate_percent`.

### iso3c

`string`

### options?

[`InterestRateOptions`](/QCraft-App/docs/reference/typescript/interfaces/interestrateoptions/) = `{}`

## Returns

[`InterestRateRow`](/QCraft-App/docs/reference/typescript/interfaces/interestraterow/)[]

91 rows (2009–2099).
