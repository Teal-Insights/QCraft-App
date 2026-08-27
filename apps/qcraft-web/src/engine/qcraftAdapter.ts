/**
 * The real engine adapter: `@qcraft/engine` over per-mode country inputs.
 *
 * ── What changed and why ──────────────────────────────────────────────────────
 * Until this file existed the Explorer served golden-master fixtures: real
 * Q-CRAFT output, for Uganda, at engine defaults, and unable to respond to a
 * slider or a country change. That was the honest thing to ship while the
 * TypeScript engine lived in another clone. It stopped being the honest thing to
 * ship the moment the app gained a data mode switch, because a mode that changes
 * the label without changing the numbers is the one failure this feature exists
 * to prevent.
 *
 * So the engine is wired: 175 countries, two vintages, every exposed parameter
 * live. `packages/qcraft-engine-ts` reproduces the Python engine to one unit in
 * the last place over 614,320 cells (INTEGRATION-REPORT.md section 5.2), and the
 * Python engine is what the 147/147 parity result was measured on. Verified mode
 * therefore runs the verified chain rather than describing it.
 *
 * ── The country lists ─────────────────────────────────────────────────────────
 * `index.json` is committed for each vintage (VINTAGE-TOGGLE.md: the country
 * list is what keeps a vintage reviewable), so the picker is populated at build
 * time and needs no request. The payloads themselves are fetched per country;
 * see countryData.ts.
 */

import { runPipeline, type PipelineParams } from '@qcraft/engine';

import currentIndex from '../../../../data/vintages/weo-2026-04/json/index.json';
import verifiedIndex from '../../../../data/vintages/weo-2024-10/json/index.json';

import { MODES, type ModeId } from '../content/modes';
import { loadCountryInput, readCoverage } from './countryData';
import { toEngineResult, toPipelineParams } from './pipelineResult';
import type {
  CountryContext,
  CountryOption,
  EngineAdapter,
  EngineParams,
  EngineOutcome,
} from './types';

/**
 * Parameter defaults, from DEFAULTS in
 * packages/qcraft-engine/src/qcraft_engine/constants.py. Re-stated here rather
 * than imported from the engine so `tests/adapter.test.ts` keeps pinning them:
 * a silent change to the engine's defaults would otherwise change what the app
 * opens on with nothing failing.
 */
export const ENGINE_DEFAULTS: EngineParams = {
  iso3c: 'UGA',
  demography_variant: 'Medium',
  productivity_start: 5.0,
  productivity_end: 1.2,
  inflation_start: 5.0,
  inflation_end: 3.5,
  interest_rate_mode: 'Nominal interest rate',
  debt_target: 50.0,
  fiscal_rule: 'Yes',
  expenditure_rigidity: 1.0,
};

/**
 * The latest year the WEO boundary can fall on. PROJ_START (2030) - 1, from the
 * engine's constants.
 *
 * It is the same in both modes on purpose. WEO April 2026 forecasts through
 * 2031, and the pipeline truncates at 2029 to hold the IMF method's boundary
 * (see .change-requests/PIPELINE-2026-08-26.md and docs/data-vintages.md).
 *
 * It is a CAP, not the answer, and the difference is visible on screen. The
 * engine takes `min(the country's last WEO year, 2029)` as the year it projects
 * from, so a country whose WEO series stops earlier starts projecting earlier.
 * Six countries in the April 2026 release do: Syria's data ends in 2010, Sri
 * Lanka's in 2024, Afghanistan's, Lebanon's and West Bank and Gaza's in 2025,
 * Bolivia's in 2026. Shading 2009 to 2029 as observed data for those countries
 * would show seventeen years of projection as though it were history.
 */
export const WEO_BOUNDARY_YEAR = 2029;

/** Where the WEO boundary actually falls for one country. */
export const boundaryYearFor = (weoMaxYear: number | null): number =>
  weoMaxYear === null ? WEO_BOUNDARY_YEAR : Math.min(weoMaxYear, WEO_BOUNDARY_YEAR);

interface VintageIndex {
  vintage: string;
  label: string;
  count: number;
  countries: Array<{ iso3c: string; country: string }>;
}

const INDEX_BY_MODE: Record<ModeId, VintageIndex> = {
  current: currentIndex as VintageIndex,
  verified: verifiedIndex as VintageIndex,
};

/** Country options for a mode, in the order the index lists them (by name). */
function countriesFor(mode: ModeId): CountryOption[] {
  return INDEX_BY_MODE[mode].countries.map(({ iso3c, country }) => ({
    iso3c,
    name: country,
  }));
}

/**
 * Guard: a vintage index that does not describe the vintage the mode names is a
 * wiring mistake that would mislabel every export. Fail at module load, where a
 * developer sees it, rather than on a ministry laptop.
 */
for (const mode of Object.keys(INDEX_BY_MODE) as ModeId[]) {
  const declared = MODES[mode].vintage;
  const actual = INDEX_BY_MODE[mode].vintage;
  if (declared !== actual) {
    throw new Error(
      `Mode "${mode}" names vintage ${declared} but its index.json says ${actual}.`,
    );
  }
}

const nameFor = (mode: ModeId, iso3c: string) =>
  INDEX_BY_MODE[mode].countries.find((c) => c.iso3c === iso3c)?.country ?? iso3c;

export const qcraftAdapter: EngineAdapter = {
  listCountries: (mode) => countriesFor(mode),

  defaults: () => ({ ...ENGINE_DEFAULTS }),

  async prepare(mode, iso3c): Promise<CountryContext> {
    const input = await loadCountryInput(mode, iso3c);
    return {
      mode,
      iso3c,
      // The payload names the country; the index is the fallback, because a
      // report headed by an ISO code is a report nobody reads.
      countryName: input.country || nameFor(mode, iso3c),
      coverage: readCoverage(input),
      input,
    };
  },

  run(context, params): EngineOutcome {
    if (context.coverage.block === 'no-debt-anchor') {
      return {
        ok: false,
        block: 'no-debt-anchor',
        detail:
          `The source data has no government debt figure for ` +
          `${context.countryName} at ${context.coverage.weoMaxYear ?? WEO_BOUNDARY_YEAR}, ` +
          `which is the year the projection starts from.`,
      };
    }

    try {
      const result = runPipeline(
        context.input,
        toPipelineParams(params) as Partial<PipelineParams>,
      );
      return {
        ok: true,
        result: toEngineResult(result, {
          iso3c: context.iso3c,
          countryName: context.countryName,
          weoBoundaryYear: boundaryYearFor(context.coverage.weoMaxYear),
          mode: context.mode,
          dataVintage: MODES[context.mode].vintage,
        }),
      };
    } catch (error) {
      // The engine throws by design when a lookup it needs is absent
      // (SHARED/engine-api.md section 8). Two countries hit this in both
      // vintages: Puerto Rico has no interest rate for 2009, Somalia has no
      // macrofiscal row for 2009. Catching it here is what turns a blank screen
      // into a sentence that says which country and why.
      return {
        ok: false,
        block: 'missing-inputs',
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
