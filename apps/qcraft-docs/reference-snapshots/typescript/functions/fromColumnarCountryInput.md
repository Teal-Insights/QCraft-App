[**@qcraft/engine**](../README.md)

***

[@qcraft/engine](../README.md) / fromColumnarCountryInput

# Function: fromColumnarCountryInput()

> **fromColumnarCountryInput**(`source`, `options?`): [`CountryInput`](../interfaces/CountryInput.md)

Defined in: [packages/qcraft-engine-ts/src/adapters.ts:85](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/packages/qcraft-engine-ts/src/adapters.ts#L85)

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
