---
editUrl: false
next: false
prev: false
title: "buildMacroForFiscal"
---

> **buildMacroForFiscal**(`macrofiscal`, `iso3c`): [`MacroFiscalRow`](/QCraft-App/docs/reference/typescript/interfaces/macrofiscalrow/)[]

Defined in: [packages/qcraft-engine-ts/src/pipeline.ts:81](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/pipeline.ts#L81)

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
