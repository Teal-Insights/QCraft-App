---
editUrl: false
next: false
prev: false
title: "ClimateOptions"
---

Defined in: [packages/qcraft-engine-ts/src/climate.ts:27](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/climate.ts#L27)

## Properties

### dataRisk?

> `optional` **dataRisk?**: readonly [`RiskRow`](/QCraft-App/docs/reference/typescript/interfaces/riskrow/)[] \| `null`

Defined in: [packages/qcraft-engine-ts/src/climate.ts:31](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/climate.ts#L31)

Optional discrete revenue/expenditure shocks, in % of GDP.

***

### expenditureRigidity?

> `optional` **expenditureRigidity?**: `number`

Defined in: [packages/qcraft-engine-ts/src/climate.ts:29](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/climate.ts#L29)

0.0 (flexible) to 1.0 (sticky, default). 1.0 keeps expenditure at baseline levels.
