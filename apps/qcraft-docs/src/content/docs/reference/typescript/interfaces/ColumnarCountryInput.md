---
editUrl: false
next: false
prev: false
title: "ColumnarCountryInput"
---

Defined in: [packages/qcraft-engine-ts/src/adapters.ts:28](https://github.com/Teal-Insights/QCraft-App/blob/a6313ad7f8f38e174bd38c89e3419ee1be79cda9/packages/qcraft-engine-ts/src/adapters.ts#L28)

The columnar shape emitted by the Lane 3 vintage pipeline.

## Properties

### climate

> **climate**: `object`

Defined in: [packages/qcraft-engine-ts/src/adapters.ts:40](https://github.com/Teal-Insights/QCraft-App/blob/a6313ad7f8f38e174bd38c89e3419ee1be79cda9/packages/qcraft-engine-ts/src/adapters.ts#L40)

#### scenarios

> **scenarios**: `Record`\<`string`, (`number` \| `null`)[]\>

scenario -> cumulative GDP loss (% of baseline).

#### years

> **years**: `number`[]

***

### country

> **country**: `string`

Defined in: [packages/qcraft-engine-ts/src/adapters.ts:30](https://github.com/Teal-Insights/QCraft-App/blob/a6313ad7f8f38e174bd38c89e3419ee1be79cda9/packages/qcraft-engine-ts/src/adapters.ts#L30)

***

### demography

> **demography**: `object`

Defined in: [packages/qcraft-engine-ts/src/adapters.ts:34](https://github.com/Teal-Insights/QCraft-App/blob/a6313ad7f8f38e174bd38c89e3419ee1be79cda9/packages/qcraft-engine-ts/src/adapters.ts#L34)

#### variants

> **variants**: `Record`\<`string`, `Record`\<`string`, (`number` \| `null`)[]\>\>

variant -> age group -> series, e.g. `variants.Medium['15-64']`.

#### years

> **years**: `number`[]

***

### iso3c

> **iso3c**: `string`

Defined in: [packages/qcraft-engine-ts/src/adapters.ts:29](https://github.com/Teal-Insights/QCraft-App/blob/a6313ad7f8f38e174bd38c89e3419ee1be79cda9/packages/qcraft-engine-ts/src/adapters.ts#L29)

***

### macrofiscal

> **macrofiscal**: `object` & `Record`\<`string`, (`number` \| `null`)[]\>

Defined in: [packages/qcraft-engine-ts/src/adapters.ts:33](https://github.com/Teal-Insights/QCraft-App/blob/a6313ad7f8f38e174bd38c89e3419ee1be79cda9/packages/qcraft-engine-ts/src/adapters.ts#L33)

#### Type Declaration

##### years

> **years**: `number`[]

***

### productivity

> **productivity**: `object`

Defined in: [packages/qcraft-engine-ts/src/adapters.ts:39](https://github.com/Teal-Insights/QCraft-App/blob/a6313ad7f8f38e174bd38c89e3419ee1be79cda9/packages/qcraft-engine-ts/src/adapters.ts#L39)

#### productivity\_level

> **productivity\_level**: (`number` \| `null`)[]

#### years

> **years**: `number`[]

***

### vintage?

> `optional` **vintage?**: `string`

Defined in: [packages/qcraft-engine-ts/src/adapters.ts:32](https://github.com/Teal-Insights/QCraft-App/blob/a6313ad7f8f38e174bd38c89e3419ee1be79cda9/packages/qcraft-engine-ts/src/adapters.ts#L32)

Vintage id, e.g. "weo-2026-04". Present in the Lane 3 output, unused by the engine.
