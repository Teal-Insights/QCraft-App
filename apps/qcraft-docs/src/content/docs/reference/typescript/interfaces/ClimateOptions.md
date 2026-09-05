---
editUrl: false
next: false
prev: false
title: "ClimateOptions"
---

Defined in: [packages/qcraft-engine-ts/src/climate.ts:27](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/climate.ts#L27)

## Properties

### climateStartYear?

> `optional` **climateStartYear?**: `number`

Defined in: [packages/qcraft-engine-ts/src/climate.ts:29](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/climate.ts#L29)

Explicit first application year for the rolling profile; legacy callers retain inference.

***

### dataRisk?

> `optional` **dataRisk?**: readonly [`RiskRow`](/QCraft-App/docs/reference/typescript/interfaces/riskrow/)[] \| `null`

Defined in: [packages/qcraft-engine-ts/src/climate.ts:33](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/climate.ts#L33)

Optional discrete revenue/expenditure shocks, in % of GDP.

***

### expenditureRigidity?

> `optional` **expenditureRigidity?**: `number`

Defined in: [packages/qcraft-engine-ts/src/climate.ts:31](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/climate.ts#L31)

0.0 (flexible) to 1.0 (sticky, default). 1.0 keeps expenditure at baseline levels.
