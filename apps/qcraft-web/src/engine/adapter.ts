/**
 * The engine seam — the single import point for every component.
 *
 * ── Current state (2026-08-26) ────────────────────────────────────────────────
 * MOCK-BACKED. The contract (SHARED/engine-api.md) is published and this app is
 * coded against it, but `packages/qcraft-engine-ts` lives in lane 1's clone, not
 * this one, so `@qcraft/engine` cannot be imported here yet. Until it can,
 * `engine` is the fixture adapter: real Q-CRAFT golden-master output for Uganda
 * at engine defaults, served without recomputation.
 *
 * The mapping work is already done and tested — see `pipelineResult.ts` and
 * `tests/pipelineResult.test.ts`, which exercise it against golden-master rows
 * in the contract's own shape.
 *
 * ── Swapping in the real engine ───────────────────────────────────────────────
 * Once `packages/qcraft-engine-ts` is in this repo (lane 1 merged to main):
 *
 * 1. `npm install` the workspace package. Note SHARED/engine-api.md section 10
 *    hits the same NODE_ENV trap this app already works around in `.npmrc`.
 *
 * 2. Country inputs: the engine eats one JSON blob per country, produced by
 *    `scripts/export_country_json.py`. Samples for UGA / KEN / BGD are in
 *    SHARED/sample-data/ at ~0.25 MB each. For 175 countries do NOT bundle them
 *    — fetch on demand from `public/data/<ISO3>.json` and cache, or the initial
 *    payload becomes ~40 MB.
 *
 * 3. Write `qcraftAdapter.ts`:
 *
 *      import { runPipeline } from '@qcraft/engine';
 *      import { toEngineResult, toPipelineParams } from './pipelineResult';
 *
 *      run(params) {
 *        const input = loadCountry(params.iso3c);
 *        const result = runPipeline(input, toPipelineParams(params));
 *        return toEngineResult(result, {
 *          iso3c: input.iso3c,
 *          countryName: input.country,
 *          weoBoundaryYear: WEO_BOUNDARY_YEAR,
 *        });
 *      }
 *
 *    `PipelineResultLike` in pipelineResult.ts mirrors the contract's
 *    `PipelineResult`; when the package is installed, replace those local
 *    declarations with its exported types and let the compiler confirm the
 *    shapes agree.
 *
 * 4. WRAP IT IN try/catch. Section 8 of the contract: missing lookups throw
 *    rather than returning undefined, on purpose, and roughly 13 of 198
 *    countries fail this way (Bangladesh is the documented error-path fixture).
 *    Catch and mark the country unavailable — do not let it blank the charts.
 *
 * 5. Nothing else changes. `toEngineResult` already reports
 *    `provenance.kind: 'engine'` with an empty `ignoredParams`, so the UI's
 *    fixture banner removes itself — no flag to remember, no dead code to find.
 *
 * No component imports `mockAdapter` directly; grep for it and this file plus
 * its test should be the only hits.
 */

import { mockAdapter } from './mockAdapter';
import type { EngineAdapter } from './types';

export const engine: EngineAdapter = mockAdapter;

export * from './types';
export { ENGINE_DEFAULTS, FIXTURE_VINTAGE, WEO_BOUNDARY_YEAR } from './mockAdapter';
export { toEngineResult, toPipelineParams } from './pipelineResult';
