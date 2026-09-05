[**@qcraft/engine**](../README.md)

***

[@qcraft/engine](../README.md) / baselineV1

# Function: baselineV1()

> **baselineV1**(`dataDemography`, `dataInflation`, `dataProductivity`, `macrofiscal`, `iso3c`): [`BaselineV1Row`](../interfaces/BaselineV1Row.md)[]

Defined in: [packages/qcraft-engine-ts/src/baselineV1.ts:28](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/packages/qcraft-engine-ts/src/baselineV1.ts#L28)

Compute baseline GDP projections for a single country.

## Parameters

### dataDemography

readonly [`DemographyRow`](../interfaces/DemographyRow.md)[]

Output of `demographyCountry`.

### dataInflation

readonly [`InflationRow`](../interfaces/InflationRow.md)[]

Output of `inflationCountry`.

### dataProductivity

readonly [`ProductivityRow`](../interfaces/ProductivityRow.md)[]

Output of `productivityCountry`.

### macrofiscal

readonly [`MacroBaselineRow`](../interfaces/MacroBaselineRow.md)[]

WEO-period macro data; its last year defines WEO_MAX_YEAR.

### iso3c

`string`

## Returns

[`BaselineV1Row`](../interfaces/BaselineV1Row.md)[]

91 rows (2009–2099).
