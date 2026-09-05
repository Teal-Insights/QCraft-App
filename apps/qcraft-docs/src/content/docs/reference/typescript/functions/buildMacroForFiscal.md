---
editUrl: false
next: false
prev: false
title: "buildMacroForFiscal"
---

> **buildMacroForFiscal**(`macrofiscal`, `iso3c`): [`MacroFiscalRow`](/QCraft-App/docs/reference/typescript/interfaces/macrofiscalrow/)[]

Defined in: [packages/qcraft-engine-ts/src/pipeline.ts:82](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/pipeline.ts#L82)

Macro input for `interestRateCountry` and `baselineCountry`.

Drops rows with null `nominal_gdp`/`revenue` (truly missing data) but forward-fills
null `interest_rate_percent` so the year sequence stays contiguous.

## Parameters

### macrofiscal

readonly [`MacroRawRow`](/QCraft-App/docs/reference/typescript/interfaces/macrorawrow/)[]

### iso3c

`string`

## Returns

[`MacroFiscalRow`](/QCraft-App/docs/reference/typescript/interfaces/macrofiscalrow/)[]
