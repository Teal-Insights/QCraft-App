[**@qcraft/engine**](../README.md)

***

[@qcraft/engine](../README.md) / buildMacroForFiscal

# Function: buildMacroForFiscal()

> **buildMacroForFiscal**(`macrofiscal`, `iso3c`): [`MacroFiscalRow`](../interfaces/MacroFiscalRow.md)[]

Defined in: [packages/qcraft-engine-ts/src/pipeline.ts:82](https://github.com/Teal-Insights/QCraft-App/blob/a6313ad7f8f38e174bd38c89e3419ee1be79cda9/packages/qcraft-engine-ts/src/pipeline.ts#L82)

Macro input for `interestRateCountry` and `baselineCountry`.

Drops rows with null `nominal_gdp`/`revenue` (truly missing data) but forward-fills
null `interest_rate_percent` so the year sequence stays contiguous.

## Parameters

### macrofiscal

readonly [`MacroRawRow`](../interfaces/MacroRawRow.md)[]

### iso3c

`string`

## Returns

[`MacroFiscalRow`](../interfaces/MacroFiscalRow.md)[]
