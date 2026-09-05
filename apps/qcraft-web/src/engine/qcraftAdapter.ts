/**
 * The real engine adapter: `@qcraft/engine` over per-mode country inputs.
 *
 * ── What changed and why ──────────────────────────────────────────────────────
 * Until this file existed the Explorer served golden-master fixtures: real
 * Q-CRAFT output, for Uganda, at Explorer defaults, and unable to respond to a
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

import { buildClimateVariation, MissingDebtAnchorError, runPipeline, type HorizonPolicy, type PipelineParams } from '@qcraft/engine';

import currentIndex from '../../../../data/vintages/weo-2026-04-full-horizon-v1/json/index.json';
import verifiedIndex from '../../../../data/vintages/weo-2024-10/json/index.json';

import { MODES, type ModeId } from '../content/modes';
import { loadCountryInput, readCoverage, type Coverage } from './countryData';
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
  long_run_interest_rate: 1.0,
  productivity_turning_point: 15,
  debt_target: 50.0,
  fiscal_rule: 'Yes',
  expenditure_rigidity: 1.0,
};

/** Legacy workbook cap, used only by the frozen Verified profile. */
export const WEO_BOUNDARY_YEAR = 2029;

/** Where the WEO boundary actually falls for one country. */
export const boundaryYearFor = (weoMaxYear: number | null): number =>
  weoMaxYear === null ? WEO_BOUNDARY_YEAR : Math.min(weoMaxYear, WEO_BOUNDARY_YEAR);

/**
 * Did the engine anchor earlier than the source's own last year?
 *
 * Only when the two genuinely differ. A country whose WEO series simply ends
 * early is not anchor-shifted: the workbook would anchor on the same year, and
 * saying "this starts from 2026" about a country whose data stops in 2026
 * explains nothing. What is worth naming is the gap, which is where this tool
 * and the workbook part company.
 *
 * Six countries reach a result this way. On the frozen vintage: Lebanon (2023),
 * Sri Lanka (2022), Syria (2010) and West Bank and Gaza (2023). On the April
 * 2026 vintage: Ecuador (2025) and West Bank and Gaza (2024). Afghanistan is
 * shifted on the frozen vintage and refuses anyway, for want of a debt anchor.
 * The list is derived, never stored: it is a property of each vintage.
 */
export const anchorShiftOf = (
  coverage: Coverage,
): { anchorYear: number; sourceMaxYear: number } | null => {
  const { weoMaxYear, sourceMaxYear } = coverage;
  if (weoMaxYear === null || sourceMaxYear === null) return null;
  if (weoMaxYear >= sourceMaxYear) return null;
  return { anchorYear: weoMaxYear, sourceMaxYear };
};

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
      coverage: mode === 'current' && input.horizonPolicy?.weoMaxYear != null
        ? { ...readCoverage({ ...input, macrofiscal: input.macrofiscal.filter(r => r.years <= input.horizonPolicy!.weoMaxYear!) }),
            weoMaxYear: input.horizonPolicy.weoMaxYear,
            sourceMaxYear: input.horizonPolicy.sourceWeoMaxYear }
        : readCoverage(input),
      input,
    };
  },

  run(context, params): EngineOutcome {
    if (context.mode === 'current') {
      const h = context.input.horizonPolicy;
      if (h?.id !== 'current-full-weo-v1' || h.dataRevision !== 'weo-2026-04-full-horizon-v1') {
        return { ok: false, block: 'missing-inputs', detail: 'Current requires the full WEO input revision; reload this release.' };
      }
      if (h.coverageStatus === 'unsupported') return { ok: false, block: 'missing-inputs', detail: h.coverageReason ?? 'The Current inputs do not support a complete calculation.' };
    }
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
      const legacyBoundary = boundaryYearFor(context.coverage.weoMaxYear);
      const legacyShock = buildClimateVariation(context.input.climate, context.iso3c, 'Paris', legacyBoundary)
        .find(r => r.climate_variation !== 0)?.years ?? 2030;
      const horizonPolicy: HorizonPolicy = context.input.horizonPolicy ?? {
        id: 'verified-workbook-v1', dataRevision: 'weo-2024-10', sourceVintage: 'weo-2024-10',
        sourceWeoMaxYear: context.coverage.sourceMaxYear ?? legacyBoundary,
        weoMaxYear: legacyBoundary, projectionStartYear: legacyBoundary + 1,
        climateStartYear: legacyShock, climateAnchorYear: legacyBoundary,
        wdiLastYear: Math.max(...context.input.productivity.filter(r => r.iso3c === context.iso3c).map(r => r.years)),
        coverageStatus: legacyBoundary < (context.coverage.sourceMaxYear ?? legacyBoundary) ? 'shorter' : 'full',
        coverageReason: null,
        inputSha256: (currentIndex.verifiedInputHashes as Record<string, string>)[context.iso3c] ?? '',
      };
      const shaped = toEngineResult(result, {
          iso3c: context.iso3c,
          countryName: context.countryName,
          weoBoundaryYear: horizonPolicy.weoMaxYear!,
          anchorShift: anchorShiftOf(context.coverage),
          mode: context.mode,
          dataVintage: MODES[context.mode].vintage,
        });
      return { ok: true, result: { ...shaped, horizonPolicy,
        baselineContext: result.baseline_v1, interestContext: result.interest_rate,
        provenance: { ...shaped.provenance, dataRevision: horizonPolicy.dataRevision,
          calculationPolicy: horizonPolicy.id, inputSha256: horizonPolicy.inputSha256 } } };
    } catch (error) {
      // The engine throws by design when a lookup it needs is absent
      // (SHARED/engine-api.md section 8). Two countries hit this in both
      // vintages: Puerto Rico has no interest rate for 2009, Somalia has no
      // macrofiscal row for 2009. Catching it here is what turns a blank screen
      // into a sentence that says which country and why.
      //
      // The anchor case is separated out because it reads the same to the
      // engine and differently to a user: "we cannot compute this" and "we
      // could draw something but you should not cite it" are different
      // statements to a ministry. `readCoverage` normally catches it before the
      // engine runs, so reaching here means the two checks disagreed, and the
      // engine is the one that decides.
      if (error instanceof MissingDebtAnchorError) {
        return {
          ok: false,
          block: 'no-debt-anchor',
          detail: error.message,
        };
      }
      return {
        ok: false,
        block: 'missing-inputs',
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
