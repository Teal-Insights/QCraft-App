[**@qcraft/engine**](../README.md)

***

[@qcraft/engine](../README.md) / buildClimateVariation

# Function: buildClimateVariation()

> **buildClimateVariation**(`climateData`, `iso3c`, `scenario`, `weoMaxYear?`): [`ClimateVariationRow`](../interfaces/ClimateVariationRow.md)[]

Defined in: [packages/qcraft-engine-ts/src/pipeline.ts:128](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/pipeline.ts#L128)

Turn cumulative GDP-loss levels into the year-over-year productivity shock the
climate module expects.

`gdp_index(t) = 100 + gdp_loss_percent(t)`, and
`climate_variation(t) = 100 * (gdp_index(t) / gdp_index(t-1) - 1)` — the year-over-year
PERCENT CHANGE of the GDP index, not an arithmetic first difference of index levels.
The shock is added to labour productivity growth, so it has to be a growth rate.
Variation is zero through `weoMaxYear`. Current supplies an explicit climate
start; only legacy callers infer a boundary from the first nonzero entry.

## Parameters

### climateData

readonly [`ClimateInputRow`](../interfaces/ClimateInputRow.md)[]

### iso3c

`string`

### scenario

`string`

### weoMaxYear?

`number` = `2029`

## Returns

[`ClimateVariationRow`](../interfaces/ClimateVariationRow.md)[]
