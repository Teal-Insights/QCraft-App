---
editUrl: false
next: false
prev: false
title: "productivityCountry"
---

> **productivityCountry**(`productivityData`, `iso3c`, `options?`): [`ProductivityRow`](/QCraft-App/docs/reference/typescript/interfaces/productivityrow/)[]

Defined in: [packages/qcraft-engine-ts/src/productivity.ts:43](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/productivity.ts#L43)

Compute productivity outputs for a single country.

## Parameters

### productivityData

readonly [`ProductivityInputRow`](/QCraft-App/docs/reference/typescript/interfaces/productivityinputrow/)[]

WDI levels for the target country, plus optionally the OECD
  aggregate under `iso3c = "OED"` for the relative-level column.

### iso3c

`string`

### options?

[`ProductivityOptions`](/QCraft-App/docs/reference/typescript/interfaces/productivityoptions/) = `{}`

## Returns

[`ProductivityRow`](/QCraft-App/docs/reference/typescript/interfaces/productivityrow/)[]

91 rows (2009–2099).
