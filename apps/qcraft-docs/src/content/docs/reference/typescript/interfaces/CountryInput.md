---
editUrl: false
next: false
prev: false
title: "CountryInput"
---

Defined in: [packages/qcraft-engine-ts/src/types.ts:241](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/packages/qcraft-engine-ts/src/types.ts#L241)

Everything the engine needs for one country, as emitted by
`scripts/export_country_json.py`. Slices are raw: the engine derives the
module-specific inputs itself.

## Properties

### climate

> **climate**: [`ClimateInputRow`](/QCraft-App/docs/reference/typescript/interfaces/climateinputrow/)[]

Defined in: [packages/qcraft-engine-ts/src/types.ts:251](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/packages/qcraft-engine-ts/src/types.ts#L251)

FADCP GDP-loss rows for all six scenarios.

***

### country

> **country**: `string`

Defined in: [packages/qcraft-engine-ts/src/types.ts:243](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/packages/qcraft-engine-ts/src/types.ts#L243)

***

### demography

> **demography**: [`DemographyInputRow`](/QCraft-App/docs/reference/typescript/interfaces/demographyinputrow/)[]

Defined in: [packages/qcraft-engine-ts/src/types.ts:245](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/packages/qcraft-engine-ts/src/types.ts#L245)

UN WPP long format, all variants.

***

### iso3c

> **iso3c**: `string`

Defined in: [packages/qcraft-engine-ts/src/types.ts:242](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/packages/qcraft-engine-ts/src/types.ts#L242)

***

### macrofiscal

> **macrofiscal**: [`MacroRawRow`](/QCraft-App/docs/reference/typescript/interfaces/macrorawrow/)[]

Defined in: [packages/qcraft-engine-ts/src/types.ts:249](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/packages/qcraft-engine-ts/src/types.ts#L249)

Raw WEO macrofiscal rows for this country.

***

### productivity

> **productivity**: [`ProductivityInputRow`](/QCraft-App/docs/reference/typescript/interfaces/productivityinputrow/)[]

Defined in: [packages/qcraft-engine-ts/src/types.ts:247](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/packages/qcraft-engine-ts/src/types.ts#L247)

WDI levels for this country plus the OECD aggregate (`iso3c = "OED"`).
