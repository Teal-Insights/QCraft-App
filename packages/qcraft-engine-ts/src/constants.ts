/** Q-CRAFT constants — scenario definitions, colours, defaults. Mirrors `qcraft_engine.constants`. */

import type { PipelineParams } from './types.js';

export const YEAR_START = 2009;
export const YEAR_END = 2099;
/** First year after the WEO horizon. */
export const PROJ_START = 2030;

export const CLIMATE_SCENARIOS = [
  'Paris',
  'Moderate',
  'Hot',
  'Hot_Adapted',
  'Hot_Unadapted',
  'High',
] as const;

export type ClimateScenario = (typeof CLIMATE_SCENARIOS)[number];

/**
 * The IMF User Guide's names (Tim and Rahman, 2024, section II.C). No
 * temperature suffixes: the guide gives none except "below 2°C" for Paris, and
 * Hot is the 90th percentile of the same SSP3-7.0 models whose median is High.
 */
export const SCENARIO_LABELS: Record<ClimateScenario, string> = {
  Paris: 'Paris',
  Moderate: 'Moderate',
  Hot: 'Hot',
  Hot_Adapted: 'Hot adapted',
  Hot_Unadapted: 'Hot unadapted',
  High: 'High',
};

export const COLORS: Record<string, string> = {
  baseline: '#2C3E50',
  Paris: '#27AE60',
  Moderate: '#3498DB',
  Hot: '#E67E22',
  Hot_Adapted: '#9B59B6',
  Hot_Unadapted: '#E74C3C',
  High: '#C0392B',
  accent: '#1ABC9C',
  muted: '#BDC3C7',
  background: '#FAFBFC',
};

export const DEFAULTS: PipelineParams & { iso3c: string } = {
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

/** All output years, 2009–2099 inclusive (91 entries). */
export function projectionYears(): number[] {
  const years: number[] = [];
  for (let y = YEAR_START; y <= YEAR_END; y += 1) years.push(y);
  return years;
}
