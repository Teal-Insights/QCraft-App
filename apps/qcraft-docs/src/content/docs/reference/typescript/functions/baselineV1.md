---
editUrl: false
next: false
prev: false
title: "baselineV1"
---

> **baselineV1**(`dataDemography`, `dataInflation`, `dataProductivity`, `macrofiscal`, `iso3c`): [`BaselineV1Row`](/QCraft-App/docs/reference/typescript/interfaces/baselinev1row/)[]

Defined in: [packages/qcraft-engine-ts/src/baselineV1.ts:28](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/packages/qcraft-engine-ts/src/baselineV1.ts#L28)

Compute baseline GDP projections for a single country.

## Parameters

### dataDemography

readonly [`DemographyRow`](/QCraft-App/docs/reference/typescript/interfaces/demographyrow/)[]

Output of `demographyCountry`.

### dataInflation

readonly [`InflationRow`](/QCraft-App/docs/reference/typescript/interfaces/inflationrow/)[]

Output of `inflationCountry`.

### dataProductivity

readonly [`ProductivityRow`](/QCraft-App/docs/reference/typescript/interfaces/productivityrow/)[]

Output of `productivityCountry`.

### macrofiscal

readonly [`MacroBaselineRow`](/QCraft-App/docs/reference/typescript/interfaces/macrobaselinerow/)[]

WEO-period macro data; its last year defines WEO_MAX_YEAR.

### iso3c

`string`

## Returns

[`BaselineV1Row`](/QCraft-App/docs/reference/typescript/interfaces/baselinev1row/)[]

91 rows (2009–2099).
