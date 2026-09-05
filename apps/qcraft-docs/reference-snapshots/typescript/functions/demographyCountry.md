[**@qcraft/engine**](../README.md)

***

[@qcraft/engine](../README.md) / demographyCountry

# Function: demographyCountry()

> **demographyCountry**(`demographyData`, `iso3c`, `level`): [`DemographyRow`](../interfaces/DemographyRow.md)[]

Defined in: [packages/qcraft-engine-ts/src/demography.ts:21](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/demography.ts#L21)

Compute demography outputs for a single country and variant.

## Parameters

### demographyData

readonly [`DemographyInputRow`](../interfaces/DemographyInputRow.md)[]

Long-format rows (iso3c, country, years, age_group, status, values).
  `age_group` must include "15-64" and "Total"; `values` are population in thousands.

### iso3c

`string`

3-letter ISO country code (e.g. "UGA").

### level

`string`

Demographic variant — "Medium", "High", or "Low".

## Returns

[`DemographyRow`](../interfaces/DemographyRow.md)[]

91 rows (2009–2099). Growth rates are null for 2009.
