---
title: "Use the API at the documented source revision"
description: "Supported source boundaries and reproducible reference generation."
---

**Import the browser engine through its public TypeScript entry point.** It exports seven core calculations, `runPipeline`, shaping helpers, adapters, constants, errors and row types. The [entry point](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/index.ts) is the authority for exports. The older handwritten `engine-api.md` predates two parameters and should be read with the current type definitions.

- [TypeScript definitions](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/types.ts): includes `long_run_interest_rate` and `productivity_turning_point`.
- [Python source](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine/src/qcraft_engine): use module-qualified imports, for example `qcraft_engine.data_loader.run_pipeline`. The package `__init__.py` does not re-export the public functions.
- [TypeScript pipeline](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/pipeline.ts): accepts raw row arrays through `CountryInput`.
- [Columnar adapter](https://github.com/Teal-Insights/QCraft-App/blob/b484f858dd978c5045a5d01a8a7386153eca2230/packages/qcraft-engine-ts/src/adapters.ts): accepts the alternate columnar payload, with an explicit OECD-series policy.

**Read the generated reference beside the source.** The [TypeScript API](reference/typescript/readme.md) is generated with TypeDoc from the public entry point and the engine build configuration. The [Python API](reference/python.md) is an AST inventory of module-qualified public functions, exception constructors, annotations, defaults and complete docstrings. Neither generator imports or executes Python calculation code. Source links resolve to the exact engine revision printed below, once that candidate is published.

**Snapshots also remain readable in a repository checkout.** `apps/qcraft-docs/reference-snapshots/typescript/` contains ordinary Markdown with relative links. The Python page and its JSON inventory are committed too. Source comments explain the implementation; the [assumptions](assumptions.md) and [verification](verification.md) pages define the limits of the evidence.

**Regenerate against the pinned source before changing API text.** See the docs package README for the exact commands. The generators reject another engine commit. A normal site build uses the committed snapshots and needs no engine checkout. Independent reference review is pending for this candidate.
