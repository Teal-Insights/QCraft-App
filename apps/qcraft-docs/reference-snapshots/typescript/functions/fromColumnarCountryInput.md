[**@qcraft/engine**](../README.md)

***

[@qcraft/engine](../README.md) / fromColumnarCountryInput

# Function: fromColumnarCountryInput()

> **fromColumnarCountryInput**(`source`, `options?`): [`CountryInput`](../interfaces/CountryInput.md)

Defined in: [packages/qcraft-engine-ts/src/adapters.ts:85](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/adapters.ts#L85)

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
