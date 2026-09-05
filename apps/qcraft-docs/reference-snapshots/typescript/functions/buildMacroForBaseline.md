[**@qcraft/engine**](../README.md)

***

[@qcraft/engine](../README.md) / buildMacroForBaseline

# Function: buildMacroForBaseline()

> **buildMacroForBaseline**(`macrofiscal`, `iso3c`): [`MacroBaselineRow`](../interfaces/MacroBaselineRow.md)[]

Defined in: [packages/qcraft-engine-ts/src/pipeline.ts:50](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/packages/qcraft-engine-ts/src/pipeline.ts#L50)

Macro input for `baselineV1`. Drops rows with any null growth rate (the first year has no prior).

## Parameters

### macrofiscal

readonly [`MacroRawRow`](../interfaces/MacroRawRow.md)[]

### iso3c

`string`

## Returns

[`MacroBaselineRow`](../interfaces/MacroBaselineRow.md)[]
