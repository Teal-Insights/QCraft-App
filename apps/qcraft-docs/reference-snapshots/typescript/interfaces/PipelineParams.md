[**@qcraft/engine**](../README.md)

***

[@qcraft/engine](../README.md) / PipelineParams

# Interface: PipelineParams

Defined in: [packages/qcraft-engine-ts/src/types.ts:254](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/types.ts#L254)

## Properties

### debt\_target

> **debt\_target**: `number`

Defined in: [packages/qcraft-engine-ts/src/types.ts:269](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/types.ts#L269)

***

### demography\_variant

> **demography\_variant**: `string`

Defined in: [packages/qcraft-engine-ts/src/types.ts:255](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/types.ts#L255)

***

### expenditure\_rigidity

> **expenditure\_rigidity**: `number`

Defined in: [packages/qcraft-engine-ts/src/types.ts:271](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/types.ts#L271)

***

### fiscal\_rule

> **fiscal\_rule**: [`FiscalRuleSetting`](../type-aliases/FiscalRuleSetting.md)

Defined in: [packages/qcraft-engine-ts/src/types.ts:270](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/types.ts#L270)

***

### inflation\_end

> **inflation\_end**: `number`

Defined in: [packages/qcraft-engine-ts/src/types.ts:259](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/types.ts#L259)

***

### inflation\_start

> **inflation\_start**: `number`

Defined in: [packages/qcraft-engine-ts/src/types.ts:258](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/types.ts#L258)

***

### interest\_rate\_mode

> **interest\_rate\_mode**: [`InterestRateMode`](../type-aliases/InterestRateMode.md)

Defined in: [packages/qcraft-engine-ts/src/types.ts:260](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/types.ts#L260)

***

### long\_run\_interest\_rate

> **long\_run\_interest\_rate**: `number`

Defined in: [packages/qcraft-engine-ts/src/types.ts:262](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/types.ts#L262)

Dashboard!C29: long-run real rate (%), used only under "Real interest rate".

***

### productivity\_end

> **productivity\_end**: `number`

Defined in: [packages/qcraft-engine-ts/src/types.ts:257](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/types.ts#L257)

***

### productivity\_start

> **productivity\_start**: `number`

Defined in: [packages/qcraft-engine-ts/src/types.ts:256](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/types.ts#L256)

***

### productivity\_turning\_point

> **productivity\_turning\_point**: `number`

Defined in: [packages/qcraft-engine-ts/src/types.ts:268](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/types.ts#L268)

Productivity!J21: the logistic Turning Point timing parameter, in years
after the WEO boundary. Higher values shift the transition later. The guide
says it can be adjusted (footnote 7); the Rate (0.5) cannot.
