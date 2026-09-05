---
editUrl: false
next: false
prev: false
title: "MacroRawRow"
---

Defined in: [packages/qcraft-engine-ts/src/types.ts:209](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L209)

One raw macrofiscal row as stored in `macrofiscal.parquet`. Cells are nullable
because the WEO source is sparse; `buildMacro*` in `pipeline.ts` filters and
forward-fills exactly the way `data_loader.py` does.

## Properties

### country

> **country**: `string`

Defined in: [packages/qcraft-engine-ts/src/types.ts:211](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L211)

***

### debt

> **debt**: [`Num`](/QCraft-App/docs/reference/typescript/type-aliases/num/)

Defined in: [packages/qcraft-engine-ts/src/types.ts:220](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L220)

***

### debt\_to\_gdp

> **debt\_to\_gdp**: [`Num`](/QCraft-App/docs/reference/typescript/type-aliases/num/)

Defined in: [packages/qcraft-engine-ts/src/types.ts:232](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L232)

***

### expenditure

> **expenditure**: [`Num`](/QCraft-App/docs/reference/typescript/type-aliases/num/)

Defined in: [packages/qcraft-engine-ts/src/types.ts:217](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L217)

***

### gdp\_deflator

> **gdp\_deflator**: [`Num`](/QCraft-App/docs/reference/typescript/type-aliases/num/)

Defined in: [packages/qcraft-engine-ts/src/types.ts:215](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L215)

***

### gdp\_deflator\_growth\_percent

> **gdp\_deflator\_growth\_percent**: [`Num`](/QCraft-App/docs/reference/typescript/type-aliases/num/)

Defined in: [packages/qcraft-engine-ts/src/types.ts:223](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L223)

***

### interest\_expenditure

> **interest\_expenditure**: [`Num`](/QCraft-App/docs/reference/typescript/type-aliases/num/)

Defined in: [packages/qcraft-engine-ts/src/types.ts:225](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L225)

***

### interest\_expenditure\_percent\_gdp

> **interest\_expenditure\_percent\_gdp**: [`Num`](/QCraft-App/docs/reference/typescript/type-aliases/num/)

Defined in: [packages/qcraft-engine-ts/src/types.ts:231](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L231)

***

### interest\_rate\_percent

> **interest\_rate\_percent**: [`Num`](/QCraft-App/docs/reference/typescript/type-aliases/num/)

Defined in: [packages/qcraft-engine-ts/src/types.ts:233](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L233)

***

### iso3c

> **iso3c**: `string`

Defined in: [packages/qcraft-engine-ts/src/types.ts:210](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L210)

***

### nominal\_gdp

> **nominal\_gdp**: [`Num`](/QCraft-App/docs/reference/typescript/type-aliases/num/)

Defined in: [packages/qcraft-engine-ts/src/types.ts:214](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L214)

***

### nominal\_gdp\_growth\_percent

> **nominal\_gdp\_growth\_percent**: [`Num`](/QCraft-App/docs/reference/typescript/type-aliases/num/)

Defined in: [packages/qcraft-engine-ts/src/types.ts:222](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L222)

***

### overall\_balance

> **overall\_balance**: [`Num`](/QCraft-App/docs/reference/typescript/type-aliases/num/)

Defined in: [packages/qcraft-engine-ts/src/types.ts:218](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L218)

***

### overall\_balance\_percent\_gdp

> **overall\_balance\_percent\_gdp**: [`Num`](/QCraft-App/docs/reference/typescript/type-aliases/num/)

Defined in: [packages/qcraft-engine-ts/src/types.ts:230](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L230)

***

### primary\_balance

> **primary\_balance**: [`Num`](/QCraft-App/docs/reference/typescript/type-aliases/num/)

Defined in: [packages/qcraft-engine-ts/src/types.ts:219](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L219)

***

### primary\_balance\_percent\_gdp

> **primary\_balance\_percent\_gdp**: [`Num`](/QCraft-App/docs/reference/typescript/type-aliases/num/)

Defined in: [packages/qcraft-engine-ts/src/types.ts:229](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L229)

***

### primary\_expenditure

> **primary\_expenditure**: [`Num`](/QCraft-App/docs/reference/typescript/type-aliases/num/)

Defined in: [packages/qcraft-engine-ts/src/types.ts:224](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L224)

***

### primary\_expenditure\_percent\_gdp

> **primary\_expenditure\_percent\_gdp**: [`Num`](/QCraft-App/docs/reference/typescript/type-aliases/num/)

Defined in: [packages/qcraft-engine-ts/src/types.ts:228](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L228)

***

### real\_gdp

> **real\_gdp**: [`Num`](/QCraft-App/docs/reference/typescript/type-aliases/num/)

Defined in: [packages/qcraft-engine-ts/src/types.ts:213](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L213)

***

### real\_gdp\_growth\_percent

> **real\_gdp\_growth\_percent**: [`Num`](/QCraft-App/docs/reference/typescript/type-aliases/num/)

Defined in: [packages/qcraft-engine-ts/src/types.ts:221](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L221)

***

### revenue

> **revenue**: [`Num`](/QCraft-App/docs/reference/typescript/type-aliases/num/)

Defined in: [packages/qcraft-engine-ts/src/types.ts:216](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L216)

***

### revenue\_percent\_gdp

> **revenue\_percent\_gdp**: [`Num`](/QCraft-App/docs/reference/typescript/type-aliases/num/)

Defined in: [packages/qcraft-engine-ts/src/types.ts:227](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L227)

***

### total\_expenditure

> **total\_expenditure**: [`Num`](/QCraft-App/docs/reference/typescript/type-aliases/num/)

Defined in: [packages/qcraft-engine-ts/src/types.ts:226](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L226)

***

### years

> **years**: `number`

Defined in: [packages/qcraft-engine-ts/src/types.ts:212](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L212)
