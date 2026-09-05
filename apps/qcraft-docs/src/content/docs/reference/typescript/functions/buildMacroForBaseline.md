---
editUrl: false
next: false
prev: false
title: "buildMacroForBaseline"
---

> **buildMacroForBaseline**(`macrofiscal`, `iso3c`): [`MacroBaselineRow`](/QCraft-App/docs/reference/typescript/interfaces/macrobaselinerow/)[]

Defined in: [packages/qcraft-engine-ts/src/pipeline.ts:50](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/pipeline.ts#L50)

Macro input for `baselineV1`. Drops rows with any null growth rate (the first year has no prior).

## Parameters

### macrofiscal

readonly [`MacroRawRow`](/QCraft-App/docs/reference/typescript/interfaces/macrorawrow/)[]

### iso3c

`string`

## Returns

[`MacroBaselineRow`](/QCraft-App/docs/reference/typescript/interfaces/macrobaselinerow/)[]
