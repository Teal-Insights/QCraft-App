[**@qcraft/engine**](../README.md)

***

[@qcraft/engine](../README.md) / productivityCountry

# Function: productivityCountry()

> **productivityCountry**(`productivityData`, `iso3c`, `options?`): [`ProductivityRow`](../interfaces/ProductivityRow.md)[]

Defined in: [packages/qcraft-engine-ts/src/productivity.ts:43](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/productivity.ts#L43)

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
