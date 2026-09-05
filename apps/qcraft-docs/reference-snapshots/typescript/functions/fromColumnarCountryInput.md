[**@qcraft/engine**](../README.md)

***

[@qcraft/engine](../README.md) / fromColumnarCountryInput

# Function: fromColumnarCountryInput()

> **fromColumnarCountryInput**(`source`, `options?`): [`CountryInput`](../interfaces/CountryInput.md)

Defined in: [packages/qcraft-engine-ts/src/adapters.ts:85](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/adapters.ts#L85)

Convert Lane 3's columnar per-country JSON into the row-oriented `CountryInput` the
engine consumes.

## Parameters

### source

[`ColumnarCountryInput`](../interfaces/ColumnarCountryInput.md)

### options?

[`AdapterOptions`](../interfaces/AdapterOptions.md) = `{}`

## Returns

[`CountryInput`](../interfaces/CountryInput.md)

## Throws

if the OECD productivity series is neither supplied nor explicitly waived.
