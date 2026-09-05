/** Export context grounded in Q-CRAFT User Guide sections I, II.C and IV.B. */
import { ADAPTATION_WINDOW_YEARS } from '../content/scenarios';

export const BASELINE_CONTEXT =
  'Climate effects are measured relative to a baseline in which temperatures ' +
  'continue along their 1960-2014 trend.';

export const SCENARIO_COMPARISON_NOTE =
  'Paris, Moderate and High use SSP1-2.6, SSP2-4.5 and the median SSP3-7.0 ' +
  'temperature path respectively. Hot uses the 90th-percentile SSP3-7.0 path. ' +
  'Hot adapted and Hot unadapted keep Hot’s temperatures and change its ' +
  `${ADAPTATION_WINDOW_YEARS.Hot}-year adaptation window to ` +
  `${ADAPTATION_WINDOW_YEARS.Hot_Adapted} and ${ADAPTATION_WINDOW_YEARS.Hot_Unadapted} years respectively.`;

export const CLIMATE_SCOPE_NOTE =
  'These scenarios apply FADCP temperature-related GDP effects through labour ' +
  'productivity and the fiscal accounts. Sea-level rise, individual disasters, ' +
  'tipping points and adaptation spending costs are outside these projections. ' +
  'The displayed range describes these selected scenarios, not total ' +
  'climate-fiscal risk. Source: Q-CRAFT User Guide, sections I, II.C and IV.B.';

export const RUN_RESTORE_NOTE =
  'Import restores the recorded settings and notes. Reproducing exact results ' +
  'also requires a compatible engine and matching input data.';
