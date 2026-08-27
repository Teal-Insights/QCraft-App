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

import type { CountryInput } from '@qcraft/engine';

import type { ModeId } from '../content/modes';
import type { Coverage, ProjectionBlock } from './countryData';

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
 * Display order: the three standalone pathways, then the 3°C family.
 *
 * This grouping is required by the engine contract, SHARED/engine-api.md §7:
 *
 *   "`High` (67.8) lands below `Hot` (94.0), which reads backwards if you assume
 *    the labels are a temperature ladder. They are not — `High` and the `Hot*`
 *    family come from different IPCC SSP scenarios, so they aren't
 *    rank-ordered by warming alone. Do not present the six as a single ordered
 *    severity scale, and don't apply a sequential colour ramp implying one.
 *    Group `Hot` / `Hot_Adapted` / `Hot_Unadapted` as a family and treat
 *    `Paris` / `Moderate` / `High` as separate pathways."
 *
 * The reason, from the Q-CRAFT User Guide section IV.B: the six are IPCC SSP
 * scenarios, and `Hot` is not a hotter emissions path than `High`. Both sit on
 * SSP3-7.0; `High` takes the median across the climate models and `Hot` takes
 * the 90th percentile of the same ones. `Hot_Adapted` and `Hot_Unadapted` hold
 * that temperature and vary how fast countries adapt.
 *
 * `HOT_FAMILY` is ordered by adaptation, which IS a real ordering within the
 * family — more adaptation spending buys down more of the same 3°C damage — so
 * it is the one place a lightness ramp is warranted. See theme.ts.
 */
export const PATHWAY_SCENARIOS: ClimateScenario[] = ['Paris', 'Moderate', 'High'];

export const HOT_FAMILY: ClimateScenario[] = ['Hot_Adapted', 'Hot', 'Hot_Unadapted'];

export const SCENARIO_DISPLAY_ORDER: ClimateScenario[] = [
  ...PATHWAY_SCENARIOS,
  ...HOT_FAMILY,
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
  /** 'engine' for the TypeScript engine; 'fixture' for the golden-master double. */
  kind: 'engine' | 'fixture';
  /** One-line description of where the numbers came from. */
  source: string;
  /**
   * Which data mode produced these numbers. Carried beside `dataVintage` rather
   * than derived from it, because the mode is what a reader recognises and the
   * vintage id is what a rebuild needs. Both travel into every export.
   */
  mode: ModeId;
  /**
   * Which vintage of the input data produced these numbers, as the vintage
   * store names it (SHARED/VINTAGE-TOGGLE.md): 'weo-2024-10', 'weo-2026-04'.
   *
   * The run manifest has to record this. Two runs with identical parameters
   * and different vintages are different runs, and a report that does not say
   * which one it came from cannot be reproduced from itself.
   */
  dataVintage: string;
  /**
   * Parameters the caller set that the current backend could NOT honour.
   * Empty means every parameter in the request was actually applied.
   */
  ignoredParams: Array<{ label: string; requested: string; used: string }>;
}

export interface EngineResult {
  iso3c: string;
  countryName: string;
  /** Baseline first, then the six climate scenarios in display order. */
  scenarios: ScenarioSeries[];
  /** Last year of WEO history/forecast; the projection runs past it. */
  weoBoundaryYear: number;
  provenance: Provenance;
}

/**
 * One country's inputs, resolved for one mode and ready to run.
 *
 * Loading is async (a country's inputs are fetched, not bundled) and running is
 * not, so the two are separate steps. Every parameter change re-runs against a
 * context that is already in hand, which is why moving a slider stays instant.
 */
export interface CountryContext {
  mode: ModeId;
  iso3c: string;
  countryName: string;
  coverage: Coverage;
  /** The engine's own input shape. Opaque to components. */
  input: CountryInput;
}

/**
 * What a run produced, or why it produced nothing.
 *
 * A country whose source data cannot support a projection is a normal outcome,
 * not an exception to swallow: two countries throw outright and two more have no
 * debt figure to anchor on. The union makes the caller handle that case, which
 * is how the honest notice reaches the screen instead of an empty chart.
 */
export type EngineOutcome =
  | { ok: true; result: EngineResult }
  | { ok: false; block: ProjectionBlock; detail: string };

/** The one interface an engine implementation has to satisfy. */
export interface EngineAdapter {
  /** Countries this backend can project in the given mode. */
  listCountries(mode: ModeId): CountryOption[];
  /** Parameter defaults. */
  defaults(): EngineParams;
  /** Fetch and check one country's inputs for one mode. */
  prepare(mode: ModeId, iso3c: string): Promise<CountryContext>;
  /** Pure and synchronous, given a prepared context. */
  run(context: CountryContext, params: EngineParams): EngineOutcome;
}
