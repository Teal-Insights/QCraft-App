/**
 * The engine seam — the single import point for every component.
 *
 * ── Current state (2026-08-26) ────────────────────────────────────────────────
 * MOCK-BACKED. `SHARED/engine-api.md` does not exist yet, so there is no
 * published contract to code against and no TypeScript engine to call. Until
 * lane 1 lands one, `engine` is the fixture adapter: real Q-CRAFT golden-master
 * output for Uganda at engine defaults, served without recomputation.
 *
 * ── Swapping in the real engine ───────────────────────────────────────────────
 * 1. Read SHARED/engine-api.md.
 * 2. Add `src/engine/qcraftAdapter.ts` implementing `EngineAdapter` (types.ts)
 *    over the real engine. If its call signature differs from `run_pipeline()`,
 *    translate inside that file — `EngineParams` deliberately mirrors the Python
 *    `params` dict, so the translation should be thin or empty.
 * 3. Change the one line below.
 * 4. Set `provenance.kind` to 'engine' and return an empty `ignoredParams`. The
 *    UI's mock notice disappears on its own — it is driven entirely by
 *    provenance, not by a flag anyone has to remember to flip.
 *
 * No component imports `mockAdapter` directly; grep for it and this file plus
 * its test should be the only hits.
 */

import { mockAdapter } from './mockAdapter';
import type { EngineAdapter } from './types';

export const engine: EngineAdapter = mockAdapter;

export * from './types';
export { ENGINE_DEFAULTS, WEO_BOUNDARY_YEAR } from './mockAdapter';
