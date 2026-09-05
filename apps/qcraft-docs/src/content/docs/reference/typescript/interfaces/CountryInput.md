---
editUrl: false
next: false
prev: false
title: "CountryInput"
---

Defined in: [packages/qcraft-engine-ts/src/types.ts:258](https://github.com/Teal-Insights/QCraft-App/blob/a6313ad7f8f38e174bd38c89e3419ee1be79cda9/packages/qcraft-engine-ts/src/types.ts#L258)

## Properties

### climate

> **climate**: [`ClimateInputRow`](/QCraft-App/docs/reference/typescript/interfaces/climateinputrow/)[]

Defined in: [packages/qcraft-engine-ts/src/types.ts:269](https://github.com/Teal-Insights/QCraft-App/blob/a6313ad7f8f38e174bd38c89e3419ee1be79cda9/packages/qcraft-engine-ts/src/types.ts#L269)

FADCP GDP-loss rows for all six scenarios.

***

### country

> **country**: `string`

Defined in: [packages/qcraft-engine-ts/src/types.ts:261](https://github.com/Teal-Insights/QCraft-App/blob/a6313ad7f8f38e174bd38c89e3419ee1be79cda9/packages/qcraft-engine-ts/src/types.ts#L261)

***

### demography

> **demography**: [`DemographyInputRow`](/QCraft-App/docs/reference/typescript/interfaces/demographyinputrow/)[]

Defined in: [packages/qcraft-engine-ts/src/types.ts:263](https://github.com/Teal-Insights/QCraft-App/blob/a6313ad7f8f38e174bd38c89e3419ee1be79cda9/packages/qcraft-engine-ts/src/types.ts#L263)

UN WPP long format, all variants.

***

### horizonPolicy?

> `optional` **horizonPolicy?**: [`HorizonPolicy`](/QCraft-App/docs/reference/typescript/interfaces/horizonpolicy/)

Defined in: [packages/qcraft-engine-ts/src/types.ts:259](https://github.com/Teal-Insights/QCraft-App/blob/a6313ad7f8f38e174bd38c89e3419ee1be79cda9/packages/qcraft-engine-ts/src/types.ts#L259)

***

### iso3c

> **iso3c**: `string`

Defined in: [packages/qcraft-engine-ts/src/types.ts:260](https://github.com/Teal-Insights/QCraft-App/blob/a6313ad7f8f38e174bd38c89e3419ee1be79cda9/packages/qcraft-engine-ts/src/types.ts#L260)

***

### macrofiscal

> **macrofiscal**: [`MacroRawRow`](/QCraft-App/docs/reference/typescript/interfaces/macrorawrow/)[]

Defined in: [packages/qcraft-engine-ts/src/types.ts:267](https://github.com/Teal-Insights/QCraft-App/blob/a6313ad7f8f38e174bd38c89e3419ee1be79cda9/packages/qcraft-engine-ts/src/types.ts#L267)

Raw WEO macrofiscal rows for this country.

***

### productivity

> **productivity**: [`ProductivityInputRow`](/QCraft-App/docs/reference/typescript/interfaces/productivityinputrow/)[]

Defined in: [packages/qcraft-engine-ts/src/types.ts:265](https://github.com/Teal-Insights/QCraft-App/blob/a6313ad7f8f38e174bd38c89e3419ee1be79cda9/packages/qcraft-engine-ts/src/types.ts#L265)

WDI levels for this country plus the OECD aggregate (`iso3c = "OED"`).
