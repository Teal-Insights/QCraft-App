[**@qcraft/engine**](../README.md)

***

[@qcraft/engine](../README.md) / AdapterOptions

# Interface: AdapterOptions

Defined in: [packages/qcraft-engine-ts/src/adapters.ts:47](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/adapters.ts#L47)

## Properties

### allowMissingOecd?

> `optional` **allowMissingOecd?**: `boolean`

Defined in: [packages/qcraft-engine-ts/src/adapters.ts:59](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/adapters.ts#L59)

Proceed without the OECD series. `productivity_level_oecd_percent` then falls back to
an OECD level of 1.0 and is meaningless — do not chart it. Nothing else is affected:
no other module reads that column.

***

### oecdProductivity?

> `optional` **oecdProductivity?**: readonly [`ProductivityInputRow`](ProductivityInputRow.md)[]

Defined in: [packages/qcraft-engine-ts/src/adapters.ts:53](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/adapters.ts#L53)

OECD (`iso3c = "OED"`) productivity levels. The columnar format carries only the
target country's series, but `productivityCountry` needs the OECD aggregate for
`productivity_level_oecd_percent`.
