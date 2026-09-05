[**@qcraft/engine**](../README.md)

***

[@qcraft/engine](../README.md) / MissingMacrofiscalInputError

# Class: MissingMacrofiscalInputError

Defined in: [packages/qcraft-engine-ts/src/errors.ts:64](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/errors.ts#L64)

A macrofiscal series the engine reads has a hole inside the WEO window.

Distinct from a missing anchor: the projection could start, but one of the
aggregates it copies through is absent for a year it does read. Singapore,
Samoa and Macao SAR are the live cases, all missing primary expenditure and
the interest split that depends on it.

## Extends

- [`QCraftDataError`](QCraftDataError.md)

## Constructors

### Constructor

> **new MissingMacrofiscalInputError**(`iso3c`, `year`, `field`): `MissingMacrofiscalInputError`

Defined in: [packages/qcraft-engine-ts/src/errors.ts:65](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/errors.ts#L65)

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

[`QCraftDataError`](QCraftDataError.md).[`constructor`](QCraftDataError.md#constructor)

## Properties

### cause?

> `optional` **cause?**: `unknown`

Defined in: ../source/apps/qcraft-docs/node\_modules/typescript/lib/lib.es2022.error.d.ts:24

#### Inherited from

[`QCraftDataError`](QCraftDataError.md).[`cause`](QCraftDataError.md#cause)

***

### field

> `readonly` **field**: `string`

Defined in: [packages/qcraft-engine-ts/src/errors.ts:21](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/errors.ts#L21)

#### Inherited from

[`QCraftDataError`](QCraftDataError.md).[`field`](QCraftDataError.md#field)

***

### iso3c

> `readonly` **iso3c**: `string`

Defined in: [packages/qcraft-engine-ts/src/errors.ts:19](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/errors.ts#L19)

#### Inherited from

[`QCraftDataError`](QCraftDataError.md).[`iso3c`](QCraftDataError.md#iso3c)

***

### message

> **message**: `string`

Defined in: ../source/apps/qcraft-docs/node\_modules/typescript/lib/lib.es5.d.ts:1075

#### Inherited from

[`QCraftDataError`](QCraftDataError.md).[`message`](QCraftDataError.md#message)

***

### name

> **name**: `string`

Defined in: ../source/apps/qcraft-docs/node\_modules/typescript/lib/lib.es5.d.ts:1074

#### Inherited from

[`QCraftDataError`](QCraftDataError.md).[`name`](QCraftDataError.md#name)

***

### stack?

> `optional` **stack?**: `string`

Defined in: ../source/apps/qcraft-docs/node\_modules/typescript/lib/lib.es5.d.ts:1076

#### Inherited from

[`QCraftDataError`](QCraftDataError.md).[`stack`](QCraftDataError.md#stack)

***

### year

> `readonly` **year**: `number`

Defined in: [packages/qcraft-engine-ts/src/errors.ts:20](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/errors.ts#L20)

#### Inherited from

[`QCraftDataError`](QCraftDataError.md).[`year`](QCraftDataError.md#year)
