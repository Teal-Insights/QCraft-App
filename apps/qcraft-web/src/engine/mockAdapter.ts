/**
 * Fixture-backed engine double. TEST FIXTURE ONLY.
 *
 * This backed the app until the TypeScript engine was wired in (see
 * qcraftAdapter.ts). It is kept because it is the one source of a real Q-CRAFT
 * result that needs nothing but committed files: the export, manifest, selector
 * and copy suites run against it on a fresh clone, with no Parquet, no staged
 * JSON and no network.
 *
 * It does not compute — but every number it serves is real Q-CRAFT output. It
 * reads the engine's own golden masters:
 *
 *   packages/qcraft-engine/tests/golden_masters/intermediate/fiscal/uganda.csv
 *   packages/qcraft-engine/tests/golden_masters/intermediate/baseline_v1/uganda.csv
 *   packages/qcraft-engine/tests/golden_masters/intermediate/climate/*_uganda.csv
 *
 * Why the intermediate masters and not final/uganda.csv: `final/uganda.csv` is a
 * five-year snapshot (2023, 2030, 2050, 2075, 2099) — too sparse to draw a line
 * from. The intermediate masters are the same source of truth at full annual
 * resolution (2009-2099, 91 rows). `final/uganda.csv` is used as the parity
 * check instead: tests/adapter.test.ts asserts this adapter reproduces it
 * exactly at those five years. So the charts are truthful AND pinned.
 *
 * ── What this fixture CANNOT do ───────────────────────────────────────────────
 * The golden masters were produced at one parameter set: the Explorer defaults.
 * There is no way to recompute from them, so moving a slider cannot change these
 * numbers. Rather than fabricate a response — the failure mode that matters most
 * for a ministry audience — `run()` returns the default-parameter output and
 * lists every deviating parameter in `provenance.ignoredParams`, which the UI
 * renders as a standing notice. Same for country: only Uganda has fixtures.
 */

import fiscalCsv from '../../../../packages/qcraft-engine/tests/golden_masters/intermediate/fiscal/uganda.csv?raw';
import baselineV1Csv from '../../../../packages/qcraft-engine/tests/golden_masters/intermediate/baseline_v1/uganda.csv?raw';
import parisCsv from '../../../../packages/qcraft-engine/tests/golden_masters/intermediate/climate/paris_uganda.csv?raw';
import moderateCsv from '../../../../packages/qcraft-engine/tests/golden_masters/intermediate/climate/moderate_uganda.csv?raw';
import hotCsv from '../../../../packages/qcraft-engine/tests/golden_masters/intermediate/climate/hot_uganda.csv?raw';
import hotAdaptedCsv from '../../../../packages/qcraft-engine/tests/golden_masters/intermediate/climate/hot_adapted_uganda.csv?raw';
import hotUnadaptedCsv from '../../../../packages/qcraft-engine/tests/golden_masters/intermediate/climate/hot_unadapted_uganda.csv?raw';
import highCsv from '../../../../packages/qcraft-engine/tests/golden_masters/intermediate/climate/high_uganda.csv?raw';

import { PARAM_FIELDS } from '../content/params';
import { num, parseCsv, type CsvRow } from './csv';
import { ENGINE_DEFAULTS, WEO_BOUNDARY_YEAR } from './qcraftAdapter';
import {
  SCENARIO_DISPLAY_ORDER,
  SCENARIO_LABELS,
  type ClimateScenario,
  type CountryOption,
  type EngineParams,
  type EngineResult,
  type FiscalYear,
  type GdpYear,
  type ScenarioSeries,
} from './types';

/** The fixtures carry no country column; UGA is the only country they cover. */
const FIXTURE_COUNTRY: CountryOption = { iso3c: 'UGA', name: 'Uganda' };

/**
 * The data vintage these fixtures were computed against.
 *
 * The golden masters were produced from WEO October 2024, which is the FROZEN
 * verification vintage: SHARED/DATA-NOTES.md section 2 (macrofiscal.parquet =
 * "IMF World Economic Outlook, WEO October 2024") and SHARED/VINTAGE-TOGGLE.md
 * ("weo-2024-10 is frozen and is what parity is measured against ... do not
 * re-baseline the golden masters against the new vintage").
 *
 * So a fixture-backed run is a weo-2024-10 run, even though the Shiny Explorer
 * is demonstrated on weo-2026-04. The manifest has to say which, or the report
 * cannot be reproduced from itself.
 */
export const FIXTURE_VINTAGE = 'weo-2024-10';

const CLIMATE_CSV: Record<ClimateScenario, string> = {
  Paris: parisCsv,
  Moderate: moderateCsv,
  Hot: hotCsv,
  Hot_Adapted: hotAdaptedCsv,
  Hot_Unadapted: hotUnadaptedCsv,
  High: highCsv,
};

function toFiscalYear(row: CsvRow): FiscalYear {
  return {
    year: num(row, 'years'),
    revenue_percent_gdp: num(row, 'revenue_percent_gdp'),
    primary_expenditure_percent_gdp: num(row, 'primary_expenditure_percent_gdp'),
    primary_balance_percent_gdp: num(row, 'primary_balance_percent_gdp'),
    interest_expenditure_percent_gdp: num(row, 'interest_expenditure_percent_gdp'),
    overall_balance_percent_gdp: num(row, 'overall_balance_percent_gdp'),
    debt_to_gdp: num(row, 'debt_to_gdp'),
  };
}

function toGdpYear(row: CsvRow): GdpYear {
  return { year: num(row, 'years'), real_gdp: num(row, 'real_gdp') };
}

/**
 * Built once at module load. The fixtures are static, so re-parsing 250 KB of
 * CSV on every slider change would be pure waste.
 */
const SCENARIOS: ScenarioSeries[] = (() => {
  const baselineFiscal = parseCsv(fiscalCsv).map(toFiscalYear);
  const baselineGdp = parseCsv(baselineV1Csv).map(toGdpYear);

  const baseline: ScenarioSeries = {
    key: 'Baseline',
    label: SCENARIO_LABELS.Baseline,
    fiscal: baselineFiscal,
    gdp: baselineGdp,
  };

  const climate = SCENARIO_DISPLAY_ORDER.map((key): ScenarioSeries => {
    const rows = parseCsv(CLIMATE_CSV[key]);
    return {
      key,
      label: SCENARIO_LABELS[key],
      fiscal: rows.map(toFiscalYear),
      gdp: rows.map(toGdpYear),
    };
  });

  return [baseline, ...climate];
})();

/**
 * Human-readable diff between the requested params and what the fixtures hold.
 *
 * Labels and value formatting come from PARAM_FIELDS so this disclosure names a
 * parameter exactly as the sidebar and the exported run manifest do.
 */
function describeIgnoredParams(params: EngineParams) {
  return PARAM_FIELDS.filter(
    ({ key }) => params[key] !== ENGINE_DEFAULTS[key],
  ).map(({ key, label, format }) => ({
    label,
    requested: format(params[key]),
    used: format(ENGINE_DEFAULTS[key]),
  }));
}

/**
 * The fixture's own narrow interface. It deliberately does NOT satisfy
 * `EngineAdapter`: it cannot load a country, cannot honour a parameter, and
 * pretending otherwise is what would let it back into the app by accident.
 */
export interface FixtureEngine {
  listCountries(): CountryOption[];
  defaults(): EngineParams;
  run(params: EngineParams): EngineResult;
}

export const fixtureEngine: FixtureEngine = {
  listCountries: () => [FIXTURE_COUNTRY],

  defaults: () => ({ ...ENGINE_DEFAULTS }),

  run(params: EngineParams): EngineResult {
    return {
      iso3c: FIXTURE_COUNTRY.iso3c,
      countryName: FIXTURE_COUNTRY.name,
      scenarios: SCENARIOS,
      weoBoundaryYear: WEO_BOUNDARY_YEAR,
      // Uganda's WEO series runs to the boundary, so the fixture is not an
      // anchor-shifted country and never was.
      anchorShift: null,
      provenance: {
        kind: 'fixture',
        // The masters were computed on weo-2024-10, which is the vintage
        // Verified mode runs, so that is the mode these numbers belong to.
        mode: 'verified',
        source:
          'Q-CRAFT engine golden masters for Uganda ' +
          '(packages/qcraft-engine/tests/golden_masters/), computed at Explorer defaults',
        dataVintage: FIXTURE_VINTAGE,
        ignoredParams: describeIgnoredParams(params),
      },
    };
  },
};
