[**@qcraft/engine**](../README.md)

***

[@qcraft/engine](../README.md) / PipelineParams

# Interface: PipelineParams

Defined in: [packages/qcraft-engine-ts/src/types.ts:272](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L272)

## Properties

### debt\_target

> **debt\_target**: `number`

Defined in: [packages/qcraft-engine-ts/src/types.ts:287](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L287)

***

### demography\_variant

> **demography\_variant**: `string`

Defined in: [packages/qcraft-engine-ts/src/types.ts:273](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L273)

***

### expenditure\_rigidity

> **expenditure\_rigidity**: `number`

Defined in: [packages/qcraft-engine-ts/src/types.ts:289](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L289)

***

### fiscal\_rule

> **fiscal\_rule**: [`FiscalRuleSetting`](../type-aliases/FiscalRuleSetting.md)

Defined in: [packages/qcraft-engine-ts/src/types.ts:288](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L288)

***

### inflation\_end

> **inflation\_end**: `number`

Defined in: [packages/qcraft-engine-ts/src/types.ts:277](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L277)

***

### inflation\_start

> **inflation\_start**: `number`

Defined in: [packages/qcraft-engine-ts/src/types.ts:276](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L276)

***

### interest\_rate\_mode

> **interest\_rate\_mode**: [`InterestRateMode`](../type-aliases/InterestRateMode.md)

Defined in: [packages/qcraft-engine-ts/src/types.ts:278](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L278)

***

### long\_run\_interest\_rate

> **long\_run\_interest\_rate**: `number`

Defined in: [packages/qcraft-engine-ts/src/types.ts:280](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L280)

Dashboard!C29: long-run real rate (%), used only under "Real interest rate".

***

### productivity\_end

> **productivity\_end**: `number`

Defined in: [packages/qcraft-engine-ts/src/types.ts:275](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L275)

***

### productivity\_start

> **productivity\_start**: `number`

Defined in: [packages/qcraft-engine-ts/src/types.ts:274](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L274)

***

### productivity\_turning\_point

> **productivity\_turning\_point**: `number`

Defined in: [packages/qcraft-engine-ts/src/types.ts:286](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/types.ts#L286)

Productivity!J21: the logistic Turning Point timing parameter, in years
after the WEO boundary. Higher values shift the transition later. The guide
says it can be adjusted (footnote 7); the Rate (0.5) cannot.
