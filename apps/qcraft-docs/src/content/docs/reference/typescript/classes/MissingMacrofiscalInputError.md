---
editUrl: false
next: false
prev: false
title: "MissingMacrofiscalInputError"
---

Defined in: [packages/qcraft-engine-ts/src/errors.ts:64](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/errors.ts#L64)

A macrofiscal series the engine reads has a hole inside the WEO window.

Distinct from a missing anchor: the projection could start, but one of the
aggregates it copies through is absent for a year it does read. Singapore,
Samoa and Macao SAR are the live cases, all missing primary expenditure and
the interest split that depends on it.

## Extends

- [`QCraftDataError`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/)

## Constructors

### Constructor

> **new MissingMacrofiscalInputError**(`iso3c`, `year`, `field`): `MissingMacrofiscalInputError`

Defined in: [packages/qcraft-engine-ts/src/errors.ts:65](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/errors.ts#L65)

#### Parameters

##### iso3c

`string`

##### year

`number`

##### field

`string`

#### Returns

`MissingMacrofiscalInputError`

#### Overrides

[`QCraftDataError`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/).[`constructor`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/#constructor)

## Properties

### cause?

> `optional` **cause?**: `unknown`

Defined in: ../docs-refresh/apps/qcraft-docs/node\_modules/typescript/lib/lib.es2022.error.d.ts:24

#### Inherited from

[`QCraftDataError`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/).[`cause`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/#cause)

***

### field

> `readonly` **field**: `string`

Defined in: [packages/qcraft-engine-ts/src/errors.ts:21](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/errors.ts#L21)

#### Inherited from

[`QCraftDataError`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/).[`field`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/#field)

***

### iso3c

> `readonly` **iso3c**: `string`

Defined in: [packages/qcraft-engine-ts/src/errors.ts:19](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/errors.ts#L19)

#### Inherited from

[`QCraftDataError`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/).[`iso3c`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/#iso3c)

***

### message

> **message**: `string`

Defined in: ../docs-refresh/apps/qcraft-docs/node\_modules/typescript/lib/lib.es5.d.ts:1075

#### Inherited from

[`QCraftDataError`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/).[`message`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/#message)

***

### name

> **name**: `string`

Defined in: ../docs-refresh/apps/qcraft-docs/node\_modules/typescript/lib/lib.es5.d.ts:1074

#### Inherited from

[`QCraftDataError`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/).[`name`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/#name)

***

### stack?

> `optional` **stack?**: `string`

Defined in: ../docs-refresh/apps/qcraft-docs/node\_modules/typescript/lib/lib.es5.d.ts:1076

#### Inherited from

[`QCraftDataError`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/).[`stack`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/#stack)

***

### year

> `readonly` **year**: `number`

Defined in: [packages/qcraft-engine-ts/src/errors.ts:20](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/errors.ts#L20)

#### Inherited from

[`QCraftDataError`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/).[`year`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/#year)
