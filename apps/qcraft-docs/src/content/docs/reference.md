---
title: "Use the API at the documented source revision"
description: "Supported source boundaries and reproducible reference generation."
---

**Import the browser engine through its public TypeScript entry point.** It exports seven core calculations, `runPipeline`, shaping helpers, adapters, constants, errors and row types. The [entry point](https://github.com/Teal-Insights/QCraft-App/blob/fdcdbfe2164ced3baab8e2a5910857dd85750477/packages/qcraft-engine-ts/src/index.ts) is the authority for exports. The older handwritten `engine-api.md` predates two parameters and should be read with the current type definitions.

- [TypeScript definitions](https://github.com/Teal-Insights/QCraft-App/blob/fdcdbfe2164ced3baab8e2a5910857dd85750477/packages/qcraft-engine-ts/src/types.ts): includes `long_run_interest_rate` and `productivity_turning_point`.
- [Python source](https://github.com/Teal-Insights/QCraft-App/blob/fdcdbfe2164ced3baab8e2a5910857dd85750477/packages/qcraft-engine/src/qcraft_engine): use module-qualified imports, for example `qcraft_engine.data_loader.run_pipeline`. The package `__init__.py` does not re-export the public functions.
- [TypeScript pipeline](https://github.com/Teal-Insights/QCraft-App/blob/fdcdbfe2164ced3baab8e2a5910857dd85750477/packages/qcraft-engine-ts/src/pipeline.ts): accepts raw row arrays through `CountryInput`.
- [Columnar adapter](https://github.com/Teal-Insights/QCraft-App/blob/fdcdbfe2164ced3baab8e2a5910857dd85750477/packages/qcraft-engine-ts/src/adapters.ts): accepts the alternate columnar payload, with an explicit OECD-series policy.

**Generated references are being prepared against this exact checkout.** Until they pass source and build review, the permanent links above are the supported reference route. The source commit is printed below. No unversioned package-registry API is implied.

