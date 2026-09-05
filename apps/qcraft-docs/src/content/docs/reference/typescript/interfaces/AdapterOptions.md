---
editUrl: false
next: false
prev: false
title: "AdapterOptions"
---

Defined in: [packages/qcraft-engine-ts/src/adapters.ts:47](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/adapters.ts#L47)

## Properties

### allowMissingOecd?

> `optional` **allowMissingOecd?**: `boolean`

Defined in: [packages/qcraft-engine-ts/src/adapters.ts:59](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/adapters.ts#L59)

Proceed without the OECD series. `productivity_level_oecd_percent` then falls back to
an OECD level of 1.0 and is meaningless — do not chart it. Nothing else is affected:
no other module reads that column.

***

### oecdProductivity?

> `optional` **oecdProductivity?**: readonly [`ProductivityInputRow`](/QCraft-App/docs/reference/typescript/interfaces/productivityinputrow/)[]

Defined in: [packages/qcraft-engine-ts/src/adapters.ts:53](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/adapters.ts#L53)

OECD (`iso3c = "OED"`) productivity levels. The columnar format carries only the
target country's series, but `productivityCountry` needs the OECD aggregate for
`productivity_level_oecd_percent`.
