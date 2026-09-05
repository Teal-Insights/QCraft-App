[**@qcraft/engine**](../README.md)

***

[@qcraft/engine](../README.md) / buildMacroForBaseline

# Function: buildMacroForBaseline()

> **buildMacroForBaseline**(`macrofiscal`, `iso3c`): [`MacroBaselineRow`](../interfaces/MacroBaselineRow.md)[]

Defined in: [packages/qcraft-engine-ts/src/pipeline.ts:51](https://github.com/Teal-Insights/QCraft-App/blob/a6313ad7f8f38e174bd38c89e3419ee1be79cda9/packages/qcraft-engine-ts/src/pipeline.ts#L51)

Macro input for `baselineV1`. Drops rows with any null growth rate (the first year has no prior).

## Parameters

### macrofiscal

readonly [`MacroRawRow`](../interfaces/MacroRawRow.md)[]

### iso3c

`string`

## Returns

[`MacroBaselineRow`](../interfaces/MacroBaselineRow.md)[]
