---
editUrl: false
next: false
prev: false
title: "inflationCountry"
---

> **inflationCountry**(`macrofiscalDeflator`, `iso3c`, `options?`): [`InflationRow`](/QCraft-App/docs/reference/typescript/interfaces/inflationrow/)[]

Defined in: [packages/qcraft-engine-ts/src/inflation.ts:29](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/inflation.ts#L29)

Compute inflation (GDP deflator growth) for a single country.

## Parameters

### macrofiscalDeflator

readonly [`DeflatorInputRow`](/QCraft-App/docs/reference/typescript/interfaces/deflatorinputrow/)[]

Rows of (iso3c, country, years, gdp_deflator), where the
  deflator is an index (e.g. 2015 = 100), not a growth rate.

### iso3c

`string`

### options?

[`InflationOptions`](/QCraft-App/docs/reference/typescript/interfaces/inflationoptions/) = `{}`

## Returns

[`InflationRow`](/QCraft-App/docs/reference/typescript/interfaces/inflationrow/)[]

91 rows (2009–2099).
