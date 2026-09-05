---
editUrl: false
next: false
prev: false
title: "MissingYearError"
---

Defined in: [packages/qcraft-engine-ts/src/errors.ts:85](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/errors.ts#L85)

A year the projection reads has no row at all.

Distinct from a null cell: the series simply does not reach back that far.
Somalia's WEO record starts in 2011 and Puerto Rico's interest rate has no
2009, while the projection starts at 2009 for every country.

This is what `mustGet` throws. The message carries no country code because
`mustGet` does not know one, and the Python side matches it exactly.

## Extends

- [`QCraftDataError`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/)

## Constructors

### Constructor

> **new MissingYearError**(`year`, `field`): `MissingYearError`

Defined in: [packages/qcraft-engine-ts/src/errors.ts:86](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/errors.ts#L86)

#### Parameters

##### year

`number`

##### field

`string`

#### Returns

`MissingYearError`

#### Overrides

[`QCraftDataError`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/).[`constructor`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/#constructor)

## Properties

### cause?

> `optional` **cause?**: `unknown`

Defined in: ../source/apps/qcraft-docs/node\_modules/typescript/lib/lib.es2022.error.d.ts:24

#### Inherited from

[`QCraftDataError`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/).[`cause`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/#cause)

***

### field

> `readonly` **field**: `string`

Defined in: [packages/qcraft-engine-ts/src/errors.ts:21](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/errors.ts#L21)

#### Inherited from

[`QCraftDataError`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/).[`field`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/#field)

***

### iso3c

> `readonly` **iso3c**: `string`

Defined in: [packages/qcraft-engine-ts/src/errors.ts:19](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/errors.ts#L19)

#### Inherited from

[`QCraftDataError`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/).[`iso3c`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/#iso3c)

***

### message

> **message**: `string`

Defined in: ../source/apps/qcraft-docs/node\_modules/typescript/lib/lib.es5.d.ts:1075

#### Inherited from

[`QCraftDataError`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/).[`message`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/#message)

***

### name

> **name**: `string`

Defined in: ../source/apps/qcraft-docs/node\_modules/typescript/lib/lib.es5.d.ts:1074

#### Inherited from

[`QCraftDataError`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/).[`name`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/#name)

***

### stack?

> `optional` **stack?**: `string`

Defined in: ../source/apps/qcraft-docs/node\_modules/typescript/lib/lib.es5.d.ts:1076

#### Inherited from

[`QCraftDataError`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/).[`stack`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/#stack)

***

### year

> `readonly` **year**: `number`

Defined in: [packages/qcraft-engine-ts/src/errors.ts:20](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/errors.ts#L20)

#### Inherited from

[`QCraftDataError`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/).[`year`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/#year)
