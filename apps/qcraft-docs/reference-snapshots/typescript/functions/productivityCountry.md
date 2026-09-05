[**@qcraft/engine**](../README.md)

***

[@qcraft/engine](../README.md) / productivityCountry

# Function: productivityCountry()

> **productivityCountry**(`productivityData`, `iso3c`, `options?`): [`ProductivityRow`](../interfaces/ProductivityRow.md)[]

Defined in: [packages/qcraft-engine-ts/src/productivity.ts:43](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/productivity.ts#L43)

Compute productivity outputs for a single country.

## Parameters

### productivityData

readonly [`ProductivityInputRow`](../interfaces/ProductivityInputRow.md)[]

WDI levels for the target country, plus optionally the OECD
  aggregate under `iso3c = "OED"` for the relative-level column.

### iso3c

`string`

### options?

[`ProductivityOptions`](../interfaces/ProductivityOptions.md) = `{}`

## Returns

[`ProductivityRow`](../interfaces/ProductivityRow.md)[]

91 rows (2009–2099).
