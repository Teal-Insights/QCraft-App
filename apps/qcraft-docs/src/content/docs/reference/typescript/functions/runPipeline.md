---
editUrl: false
next: false
prev: false
title: "runPipeline"
---

> **runPipeline**(`input`, `params?`): [`PipelineResult`](/QCraft-App/docs/reference/typescript/interfaces/pipelineresult/)

Defined in: [packages/qcraft-engine-ts/src/pipeline.ts:161](https://github.com/Teal-Insights/QCraft-App/blob/a6313ad7f8f38e174bd38c89e3419ee1be79cda9/packages/qcraft-engine-ts/src/pipeline.ts#L161)

Run the full Q-CRAFT pipeline for one country.

## Parameters

### input

[`CountryInput`](/QCraft-App/docs/reference/typescript/interfaces/countryinput/)

One country's raw slices (see `scripts/export_country_json.py`).

### params?

`Partial`\<[`PipelineParams`](/QCraft-App/docs/reference/typescript/interfaces/pipelineparams/)\> = `{}`

Parameter overrides; anything omitted falls back to `DEFAULTS`.

## Returns

[`PipelineResult`](/QCraft-App/docs/reference/typescript/interfaces/pipelineresult/)
