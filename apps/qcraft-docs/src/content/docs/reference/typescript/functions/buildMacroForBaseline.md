---
editUrl: false
next: false
prev: false
title: "buildMacroForBaseline"
---

> **buildMacroForBaseline**(`macrofiscal`, `iso3c`): [`MacroBaselineRow`](/QCraft-App/docs/reference/typescript/interfaces/macrobaselinerow/)[]

Defined in: [packages/qcraft-engine-ts/src/pipeline.ts:51](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/pipeline.ts#L51)

Macro input for `baselineV1`. Drops rows with any null growth rate (the first year has no prior).

## Parameters

### macrofiscal

readonly [`MacroRawRow`](/QCraft-App/docs/reference/typescript/interfaces/macrorawrow/)[]

### iso3c

`string`

## Returns

[`MacroBaselineRow`](/QCraft-App/docs/reference/typescript/interfaces/macrobaselinerow/)[]
