---
editUrl: false
next: false
prev: false
title: "demographyCountry"
---

> **demographyCountry**(`demographyData`, `iso3c`, `level`): [`DemographyRow`](/QCraft-App/docs/reference/typescript/interfaces/demographyrow/)[]

Defined in: [packages/qcraft-engine-ts/src/demography.ts:21](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/packages/qcraft-engine-ts/src/demography.ts#L21)

Compute demography outputs for a single country and variant.

## Parameters

### demographyData

readonly [`DemographyInputRow`](/QCraft-App/docs/reference/typescript/interfaces/demographyinputrow/)[]

Long-format rows (iso3c, country, years, age_group, status, values).
  `age_group` must include "15-64" and "Total"; `values` are population in thousands.

### iso3c

`string`

3-letter ISO country code (e.g. "UGA").

### level

`string`

Demographic variant — "Medium", "High", or "Low".

## Returns

[`DemographyRow`](/QCraft-App/docs/reference/typescript/interfaces/demographyrow/)[]

91 rows (2009–2099). Growth rates are null for 2009.
