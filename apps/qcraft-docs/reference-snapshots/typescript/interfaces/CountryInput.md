[**@qcraft/engine**](../README.md)

***

[@qcraft/engine](../README.md) / CountryInput

# Interface: CountryInput

Defined in: [packages/qcraft-engine-ts/src/types.ts:258](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L258)

## Properties

### climate

> **climate**: [`ClimateInputRow`](ClimateInputRow.md)[]

Defined in: [packages/qcraft-engine-ts/src/types.ts:269](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L269)

FADCP GDP-loss rows for all six scenarios.

***

### country

> **country**: `string`

Defined in: [packages/qcraft-engine-ts/src/types.ts:261](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L261)

***

### demography

> **demography**: [`DemographyInputRow`](DemographyInputRow.md)[]

Defined in: [packages/qcraft-engine-ts/src/types.ts:263](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L263)

UN WPP long format, all variants.

***

### horizonPolicy?

> `optional` **horizonPolicy?**: [`HorizonPolicy`](HorizonPolicy.md)

Defined in: [packages/qcraft-engine-ts/src/types.ts:259](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L259)

***

### iso3c

> **iso3c**: `string`

Defined in: [packages/qcraft-engine-ts/src/types.ts:260](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L260)

***

### macrofiscal

> **macrofiscal**: [`MacroRawRow`](MacroRawRow.md)[]

Defined in: [packages/qcraft-engine-ts/src/types.ts:267](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L267)

Raw WEO macrofiscal rows for this country.

***

### productivity

> **productivity**: [`ProductivityInputRow`](ProductivityInputRow.md)[]

Defined in: [packages/qcraft-engine-ts/src/types.ts:265](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L265)

WDI levels for this country plus the OECD aggregate (`iso3c = "OED"`).
