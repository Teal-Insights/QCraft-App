---
editUrl: false
next: false
prev: false
title: "fromColumnarCountryInput"
---

> **fromColumnarCountryInput**(`source`, `options?`): [`CountryInput`](/QCraft-App/docs/reference/typescript/interfaces/countryinput/)

Defined in: [packages/qcraft-engine-ts/src/adapters.ts:85](https://github.com/Teal-Insights/QCraft-App/blob/a6313ad7f8f38e174bd38c89e3419ee1be79cda9/packages/qcraft-engine-ts/src/adapters.ts#L85)

Convert Lane 3's columnar per-country JSON into the row-oriented `CountryInput` the
engine consumes.

## Parameters

### source

[`ColumnarCountryInput`](/QCraft-App/docs/reference/typescript/interfaces/columnarcountryinput/)

### options?

[`AdapterOptions`](/QCraft-App/docs/reference/typescript/interfaces/adapteroptions/) = `{}`

## Returns

[`CountryInput`](/QCraft-App/docs/reference/typescript/interfaces/countryinput/)

## Throws

if the OECD productivity series is neither supplied nor explicitly waived.
