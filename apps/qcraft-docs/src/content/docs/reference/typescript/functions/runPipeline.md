---
editUrl: false
next: false
prev: false
title: "runPipeline"
---

> **runPipeline**(`input`, `params?`): [`PipelineResult`](/QCraft-App/docs/reference/typescript/interfaces/pipelineresult/)

Defined in: [packages/qcraft-engine-ts/src/pipeline.ts:160](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/pipeline.ts#L160)

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
