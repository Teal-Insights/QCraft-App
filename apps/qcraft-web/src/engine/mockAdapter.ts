/**
 * Fixture-backed engine adapter.
 *
 * This is a MOCK in the sense that it does not compute — but every number it
 * serves is real Q-CRAFT output. It reads the engine's own golden masters:
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
 * ── What this adapter CANNOT do ───────────────────────────────────────────────
 * The golden masters were produced at one parameter set: the engine defaults.
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

import { num, parseCsv, type CsvRow } from './csv';
import {
  SCENARIO_DISPLAY_ORDER,
  SCENARIO_LABELS,
  type ClimateScenario,
  type CountryOption,
  type EngineAdapter,
  type EngineParams,
  type EngineResult,
  type FiscalYear,
  type GdpYear,
  type ScenarioSeries,
} from './types';

/**
 * Parameter defaults, copied from DEFAULTS in
 * packages/qcraft-engine/src/qcraft_engine/constants.py (read 2026-08-26).
 *
 * The first five were previously fixed inside the pipeline and never surfaced
 * by the Shiny app — this UI exposes them, so these values are what the sidebar
 * must start on for the app to open on the same projection the Shiny Explorer
 * shows.
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
 * Last year of WEO history/forecast. PROJ_START (2030) - 1, from
 * packages/qcraft-engine/src/qcraft_engine/constants.py.
 */
export const WEO_BOUNDARY_YEAR = 2029;

/** The fixtures carry no country column; UGA is the only country they cover. */
const FIXTURE_COUNTRY: CountryOption = { iso3c: 'UGA', name: 'Uganda' };

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

/** Human-readable diff between the requested params and what the fixtures hold. */
function describeIgnoredParams(params: EngineParams) {
  const fields: Array<{ key: keyof EngineParams; label: string }> = [
    { key: 'iso3c', label: 'Country' },
    { key: 'demography_variant', label: 'Demography variant' },
    { key: 'productivity_start', label: 'Productivity growth (start)' },
    { key: 'productivity_end', label: 'Productivity growth (long-run)' },
    { key: 'inflation_start', label: 'Inflation (start)' },
    { key: 'inflation_end', label: 'Inflation (long-run)' },
    { key: 'interest_rate_mode', label: 'Interest-rate approach' },
    { key: 'debt_target', label: 'Debt target' },
    { key: 'fiscal_rule', label: 'Fiscal rule' },
    { key: 'expenditure_rigidity', label: 'Expenditure rigidity' },
  ];

  return fields
    .filter(({ key }) => params[key] !== ENGINE_DEFAULTS[key])
    .map(({ key, label }) => ({
      label,
      requested: String(params[key]),
      used: String(ENGINE_DEFAULTS[key]),
    }));
}

export const mockAdapter: EngineAdapter = {
  listCountries: () => [FIXTURE_COUNTRY],

  defaults: () => ({ ...ENGINE_DEFAULTS }),

  run(params: EngineParams): EngineResult {
    return {
      iso3c: FIXTURE_COUNTRY.iso3c,
      countryName: FIXTURE_COUNTRY.name,
      scenarios: SCENARIOS,
      weoBoundaryYear: WEO_BOUNDARY_YEAR,
      provenance: {
        kind: 'fixture',
        source:
          'Q-CRAFT engine golden masters for Uganda ' +
          '(packages/qcraft-engine/tests/golden_masters/), computed at engine defaults',
        ignoredParams: describeIgnoredParams(params),
      },
    };
  },
};
