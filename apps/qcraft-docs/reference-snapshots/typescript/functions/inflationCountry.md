[**@qcraft/engine**](../README.md)

***

[@qcraft/engine](../README.md) / inflationCountry

# Function: inflationCountry()

> **inflationCountry**(`macrofiscalDeflator`, `iso3c`, `options?`): [`InflationRow`](../interfaces/InflationRow.md)[]

Defined in: [packages/qcraft-engine-ts/src/inflation.ts:29](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/packages/qcraft-engine-ts/src/inflation.ts#L29)

Compute inflation (GDP deflator growth) for a single country.

## Parameters

### macrofiscalDeflator

readonly [`DeflatorInputRow`](../interfaces/DeflatorInputRow.md)[]

Rows of (iso3c, country, years, gdp_deflator), where the
  deflator is an index (e.g. 2015 = 100), not a growth rate.

### iso3c

`string`

### options?

[`InflationOptions`](../interfaces/InflationOptions.md) = `{}`

## Returns

[`InflationRow`](../interfaces/InflationRow.md)[]

91 rows (2009–2099).
