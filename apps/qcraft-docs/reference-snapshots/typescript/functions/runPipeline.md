[**@qcraft/engine**](../README.md)

***

[@qcraft/engine](../README.md) / runPipeline

# Function: runPipeline()

> **runPipeline**(`input`, `params?`): [`PipelineResult`](../interfaces/PipelineResult.md)

Defined in: [packages/qcraft-engine-ts/src/pipeline.ts:160](https://github.com/Teal-Insights/QCraft-App/blob/0f03e7767251953bed1dfc14b6886967f2b275ce/packages/qcraft-engine-ts/src/pipeline.ts#L160)

Run the full Q-CRAFT pipeline for one country.

## Parameters

### input

[`CountryInput`](../interfaces/CountryInput.md)

One country's raw slices (see `scripts/export_country_json.py`).

### params?

`Partial`\<[`PipelineParams`](../interfaces/PipelineParams.md)\> = `{}`

Parameter overrides; anything omitted falls back to `DEFAULTS`.

## Returns

[`PipelineResult`](../interfaces/PipelineResult.md)
