---
editUrl: false
next: false
prev: false
title: "QCraftDataError"
---

Defined in: [packages/qcraft-engine-ts/src/errors.ts:18](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/errors.ts#L18)

A country's source data cannot support the projection that was asked for.

## Extends

- `Error`

## Extended by

- [`MissingDebtAnchorError`](/QCraft-App/docs/reference/typescript/classes/missingdebtanchorerror/)
- [`MissingMacrofiscalInputError`](/QCraft-App/docs/reference/typescript/classes/missingmacrofiscalinputerror/)
- [`MissingYearError`](/QCraft-App/docs/reference/typescript/classes/missingyearerror/)

## Constructors

### Constructor

> **new QCraftDataError**(`message`, `iso3c`, `year`, `field`): `QCraftDataError`

Defined in: [packages/qcraft-engine-ts/src/errors.ts:23](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/errors.ts#L23)

#### Parameters

##### message

`string`

##### iso3c

`string`

##### year

`number`

##### field

`string`

#### Returns

`QCraftDataError`

#### Overrides

`Error.constructor`

## Properties

### cause?

> `optional` **cause?**: `unknown`

Defined in: ../docs-refresh/apps/qcraft-docs/node\_modules/typescript/lib/lib.es2022.error.d.ts:24

#### Inherited from

`Error.cause`

***

### field

> `readonly` **field**: `string`

Defined in: [packages/qcraft-engine-ts/src/errors.ts:21](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/errors.ts#L21)

***

### iso3c

> `readonly` **iso3c**: `string`

Defined in: [packages/qcraft-engine-ts/src/errors.ts:19](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/errors.ts#L19)

***

### message

> **message**: `string`

Defined in: ../docs-refresh/apps/qcraft-docs/node\_modules/typescript/lib/lib.es5.d.ts:1075

#### Inherited from

`Error.message`

***

### name

> **name**: `string`

Defined in: ../docs-refresh/apps/qcraft-docs/node\_modules/typescript/lib/lib.es5.d.ts:1074

#### Inherited from

`Error.name`

***

### stack?

> `optional` **stack?**: `string`

Defined in: ../docs-refresh/apps/qcraft-docs/node\_modules/typescript/lib/lib.es5.d.ts:1076

#### Inherited from

`Error.stack`

***

### year

> `readonly` **year**: `number`

Defined in: [packages/qcraft-engine-ts/src/errors.ts:20](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/errors.ts#L20)
