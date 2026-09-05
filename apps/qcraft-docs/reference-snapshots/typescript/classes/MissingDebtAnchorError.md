[**@qcraft/engine**](../README.md)

***

[@qcraft/engine](../README.md) / MissingDebtAnchorError

# Class: MissingDebtAnchorError

Defined in: [packages/qcraft-engine-ts/src/errors.ts:44](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/errors.ts#L44)

No debt figure in the year the projection starts from.

The recursion carries debt forward from the last WEO year, so without that
year's debt there is no starting point and nothing downstream is defined.
Zambia and Libya are the live cases: the WEO suppresses Zambia's debt
projection while its restructuring is unresolved, and carries no debt series
for Libya in any year.

## Extends

- [`QCraftDataError`](QCraftDataError.md)

## Constructors

### Constructor

> **new MissingDebtAnchorError**(`iso3c`, `year`, `field?`): `MissingDebtAnchorError`

Defined in: [packages/qcraft-engine-ts/src/errors.ts:45](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/errors.ts#L45)

#### Parameters

##### iso3c

`string`

##### year

`number`

##### field?

`string` = `'debt_to_gdp'`

#### Returns

`MissingDebtAnchorError`

#### Overrides

[`QCraftDataError`](QCraftDataError.md).[`constructor`](QCraftDataError.md#constructor)

## Properties

### cause?

> `optional` **cause?**: `unknown`

Defined in: ../docs-refresh/apps/qcraft-docs/node\_modules/typescript/lib/lib.es2022.error.d.ts:24

#### Inherited from

[`QCraftDataError`](QCraftDataError.md).[`cause`](QCraftDataError.md#cause)

***

### field

> `readonly` **field**: `string`

Defined in: [packages/qcraft-engine-ts/src/errors.ts:21](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/errors.ts#L21)

#### Inherited from

[`QCraftDataError`](QCraftDataError.md).[`field`](QCraftDataError.md#field)

***

### iso3c

> `readonly` **iso3c**: `string`

Defined in: [packages/qcraft-engine-ts/src/errors.ts:19](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/errors.ts#L19)

#### Inherited from

[`QCraftDataError`](QCraftDataError.md).[`iso3c`](QCraftDataError.md#iso3c)

***

### message

> **message**: `string`

Defined in: ../docs-refresh/apps/qcraft-docs/node\_modules/typescript/lib/lib.es5.d.ts:1075

#### Inherited from

[`QCraftDataError`](QCraftDataError.md).[`message`](QCraftDataError.md#message)

***

### name

> **name**: `string`

Defined in: ../docs-refresh/apps/qcraft-docs/node\_modules/typescript/lib/lib.es5.d.ts:1074

#### Inherited from

[`QCraftDataError`](QCraftDataError.md).[`name`](QCraftDataError.md#name)

***

### stack?

> `optional` **stack?**: `string`

Defined in: ../docs-refresh/apps/qcraft-docs/node\_modules/typescript/lib/lib.es5.d.ts:1076

#### Inherited from

[`QCraftDataError`](QCraftDataError.md).[`stack`](QCraftDataError.md#stack)

***

### year

> `readonly` **year**: `number`

Defined in: [packages/qcraft-engine-ts/src/errors.ts:20](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/errors.ts#L20)

#### Inherited from

[`QCraftDataError`](QCraftDataError.md).[`year`](QCraftDataError.md#year)
