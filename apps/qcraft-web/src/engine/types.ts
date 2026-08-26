/**
 * The engine seam.
 *
 * Everything the UI knows about the Q-CRAFT engine is in this file. Today the
 * only implementation is the fixture-backed mock in `mockAdapter.ts`. When the
 * TypeScript engine lands (lane 1, published to SHARED/engine-api.md), the swap
 * is: write a second module satisfying `EngineAdapter` and change the one export
 * in `adapter.ts`. No component imports anything but this module and `adapter.ts`.
 *
 * Field names and units are taken from the Python engine so the two stay
 * legible against each other:
 *   packages/qcraft-engine/src/qcraft_engine/{fiscal,baseline_v1,climate}.py
 * All `*_percent_gdp` and `debt_to_gdp` values are percentages (51.03 = 51.03%),
 * not fractions.
 */

/** Scenario keys, matching `CLIMATE_SCENARIOS` in qcraft_engine/constants.py. */
export const CLIMATE_SCENARIOS = [
  'Paris',
  'Moderate',
  'Hot',
  'Hot_Adapted',
  'Hot_Unadapted',
  'High',
] as const;

export type ClimateScenario = (typeof CLIMATE_SCENARIOS)[number];

/** The baseline path plus the six climate scenarios. */
export type ScenarioKey = 'Baseline' | ClimateScenario;

/** Display labels, from `SCENARIO_LABELS` in qcraft_engine/constants.py. */
export const SCENARIO_LABELS: Record<ScenarioKey, string> = {
  Baseline: 'Baseline',
  Paris: 'Paris-Aligned (1.5°C)',
  Moderate: 'Moderate (2°C)',
  Hot: 'Hot (3°C)',
  Hot_Adapted: 'Hot + Adapted',
  Hot_Unadapted: 'Hot + Unadapted',
  High: 'High (4°C+)',
};

/**
 * Warming-severity order, used to index the ordinal colour ramp in theme.ts.
 * This is the documented warming level of each pathway (1.5 / 2 / 3 / 3 / 3 /
 * 4+), NOT the order of fiscal outcomes — under the NGFS damage functions those
 * two can disagree (for Uganda, High (4°C+) ends below Hot (3°C)). Colour
 * encodes the scenario's warming assumption; the chart shows the consequence.
 */
export const WARMING_ORDER: ClimateScenario[] = [
  'Paris',
  'Moderate',
  'Hot_Adapted',
  'Hot',
  'Hot_Unadapted',
  'High',
];

/** Interest-rate approach. Strings are the engine's `select_rate` values. */
export const INTEREST_RATE_MODES = [
  'Nominal interest rate',
  'Interest-growth differential',
  'Real interest rate',
] as const;

export type InterestRateMode = (typeof INTEREST_RATE_MODES)[number];

export const DEMOGRAPHY_VARIANTS = ['Medium', 'High', 'Low'] as const;
export type DemographyVariant = (typeof DEMOGRAPHY_VARIANTS)[number];

export const FISCAL_RULE_CHOICES = ['Yes', 'No'] as const;
export type FiscalRuleChoice = (typeof FISCAL_RULE_CHOICES)[number];

/**
 * Every user-settable parameter. Keys match the `params` dict accepted by
 * `run_pipeline()` in packages/qcraft-engine/src/qcraft_engine/data_loader.py
 * so an eventual TS engine can take this object unchanged.
 */
export interface EngineParams {
  iso3c: string;
  demography_variant: DemographyVariant;
  productivity_start: number;
  productivity_end: number;
  inflation_start: number;
  inflation_end: number;
  interest_rate_mode: InterestRateMode;
  debt_target: number;
  fiscal_rule: FiscalRuleChoice;
  expenditure_rigidity: number;
}

/** One year of the fiscal path. */
export interface FiscalYear {
  year: number;
  revenue_percent_gdp: number;
  primary_expenditure_percent_gdp: number;
  primary_balance_percent_gdp: number;
  interest_expenditure_percent_gdp: number;
  overall_balance_percent_gdp: number;
  debt_to_gdp: number;
}

/** One year of the GDP path, used by the Climate tab. */
export interface GdpYear {
  year: number;
  /** Real GDP, LCU billions. */
  real_gdp: number;
}

/** A named path through the projection. */
export interface ScenarioSeries {
  key: ScenarioKey;
  label: string;
  fiscal: FiscalYear[];
  gdp: GdpYear[];
}

export interface CountryOption {
  iso3c: string;
  name: string;
}

/**
 * How the returned numbers were produced. The UI surfaces this verbatim — a
 * ministry user must never have to guess whether a line is engine output or a
 * stand-in.
 */
export interface Provenance {
  /** 'engine' once lane 1's TS engine is wired; 'fixture' for the mock. */
  kind: 'engine' | 'fixture';
  /** One-line description of where the numbers came from. */
  source: string;
  /**
   * Parameters the caller set that the current backend could NOT honour.
   * Empty means every parameter in the request was actually applied.
   */
  ignoredParams: Array<{ label: string; requested: string; used: string }>;
}

export interface EngineResult {
  iso3c: string;
  countryName: string;
  /** Baseline first, then the six climate scenarios in warming order. */
  scenarios: ScenarioSeries[];
  /** Last year of WEO history/forecast; the projection runs past it. */
  weoBoundaryYear: number;
  provenance: Provenance;
}

/** The one interface an engine implementation has to satisfy. */
export interface EngineAdapter {
  /** Countries this backend can project. */
  listCountries(): CountryOption[];
  /** Parameter defaults. */
  defaults(): EngineParams;
  run(params: EngineParams): EngineResult;
}
