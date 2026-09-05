---
editUrl: false
next: false
prev: false
title: "MissingDebtAnchorError"
---

Defined in: [packages/qcraft-engine-ts/src/errors.ts:44](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/packages/qcraft-engine-ts/src/errors.ts#L44)

No debt figure in the year the projection starts from.

The recursion carries debt forward from the last WEO year, so without that
year's debt there is no starting point and nothing downstream is defined.
Zambia and Libya are the live cases: the WEO suppresses Zambia's debt
projection while its restructuring is unresolved, and carries no debt series
for Libya in any year.

## Extends

- [`QCraftDataError`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/)

## Constructors

### Constructor

> **new MissingDebtAnchorError**(`iso3c`, `year`, `field?`): `MissingDebtAnchorError`

Defined in: [packages/qcraft-engine-ts/src/errors.ts:45](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/packages/qcraft-engine-ts/src/errors.ts#L45)

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

Defined in: [packages/qcraft-engine-ts/src/errors.ts:21](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/packages/qcraft-engine-ts/src/errors.ts#L21)

#### Inherited from

[`QCraftDataError`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/).[`field`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/#field)

***

### iso3c

> `readonly` **iso3c**: `string`

Defined in: [packages/qcraft-engine-ts/src/errors.ts:19](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/packages/qcraft-engine-ts/src/errors.ts#L19)

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

Defined in: [packages/qcraft-engine-ts/src/errors.ts:20](https://github.com/Teal-Insights/QCraft-App/blob/83cab39790a9186c6f468b85bf8221ad52b72731/packages/qcraft-engine-ts/src/errors.ts#L20)

#### Inherited from

[`QCraftDataError`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/).[`year`](/QCraft-App/docs/reference/typescript/classes/qcraftdataerror/#year)
