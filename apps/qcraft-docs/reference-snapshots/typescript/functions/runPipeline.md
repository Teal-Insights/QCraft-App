[**@qcraft/engine**](../README.md)

***

[@qcraft/engine](../README.md) / runPipeline

# Function: runPipeline()

> **runPipeline**(`input`, `params?`): [`PipelineResult`](../interfaces/PipelineResult.md)

Defined in: [packages/qcraft-engine-ts/src/pipeline.ts:161](https://github.com/Teal-Insights/QCraft-App/blob/251e2196f4f7cc47b59f8bcb36ac4e7b1778c0f4/packages/qcraft-engine-ts/src/pipeline.ts#L161)

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
