/**
 * The engine seam: the single import point for every component.
 *
 * ── Current state (2026-08-27) ────────────────────────────────────────────────
 * ENGINE-BACKED. `engine` is `qcraftAdapter`, which runs
 * `packages/qcraft-engine-ts` over the per-country inputs of whichever data mode
 * is selected. Every exposed parameter is live, and all 175 countries in each
 * vintage are selectable.
 *
 * Two steps, not one, because loading a country is asynchronous and running the
 * projection is not:
 *
 *     const context = await engine.prepare(mode, iso3c);   // fetch + check
 *     const outcome = engine.run(context, params);          // ~3 ms, pure
 *
 * `run` returns an outcome union rather than a result, because "this country's
 * source data cannot support a projection" is an ordinary answer for a handful
 * of countries and has to reach the screen as a sentence.
 *
 * ── The fixture adapter is deliberately NOT re-exported here ──────────────────
 * `mockAdapter.ts` is the golden-master double that used to back the app. It is
 * now a TEST FIXTURE only, and tests import it from its own module rather than
 * through this one, because re-exporting it drags 250 KB of golden-master CSV
 * into the production bundle to serve numbers no user will ever see. Measured:
 * removing the re-export took a 257 KB chunk out of `dist`.
 *
 * `tests/engineWiring.test.ts` fails if any module under `src/` imports it.
 */

import { qcraftAdapter } from './qcraftAdapter';
import type { EngineAdapter } from './types';

export const engine: EngineAdapter = qcraftAdapter;

export * from './types';
export { ENGINE_DEFAULTS, WEO_BOUNDARY_YEAR } from './qcraftAdapter';
export { toEngineResult, toPipelineParams } from './pipelineResult';
export { loadCountryInput, readCoverage, clearCountryCache } from './countryData';
export type { Coverage, ProjectionBlock } from './countryData';
