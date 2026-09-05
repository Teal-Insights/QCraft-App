[**@qcraft/engine**](../README.md)

***

[@qcraft/engine](../README.md) / ClimateOptions

# Interface: ClimateOptions

Defined in: [packages/qcraft-engine-ts/src/climate.ts:27](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/climate.ts#L27)

## Properties

### dataRisk?

> `optional` **dataRisk?**: readonly [`RiskRow`](RiskRow.md)[] \| `null`

Defined in: [packages/qcraft-engine-ts/src/climate.ts:31](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/climate.ts#L31)

Optional discrete revenue/expenditure shocks, in % of GDP.

***

### expenditureRigidity?

> `optional` **expenditureRigidity?**: `number`

Defined in: [packages/qcraft-engine-ts/src/climate.ts:29](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/climate.ts#L29)

0.0 (flexible) to 1.0 (sticky, default). 1.0 keeps expenditure at baseline levels.
