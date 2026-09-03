/**
 * The six climate scenarios, in the IMF User Guide's own words.
 *
 * Source: Tim, T. and Rahman, J. (2024), Climate Change Fiscal Risks: User
 * Guide for Q-CRAFT, Version 1.0, section II.C (the six summaries) and section
 * IV.B (the SSP detail and the adaptation parameter m). Every sentence here is
 * that text in substance. Nothing is added from NGFS or any other scenario
 * family, because the 2026-09-02 audit found the previous descriptions ("net
 * zero by 2050", "current pledges") were NGFS language the guide never uses.
 *
 * One record feeds the Methodology tab, the Climate tab lede and the widget
 * captions, so the app cannot describe a scenario two different ways.
 */

import {
  SCENARIO_DISPLAY_ORDER,
  SCENARIO_LABELS,
  type ClimateScenario,
} from '../engine/types';

/**
 * The guide's adaptation parameter m, in years: how long a country takes to
 * adapt to a persistent temperature increase in the Kahn et al. (2021)
 * framework. Hot uses the framework's 30. The two variants move only this.
 */
export const ADAPTATION_WINDOW_YEARS = {
  Hot: 30,
  Hot_Adapted: 20,
  Hot_Unadapted: 50,
} as const;

export const SCENARIO_DESCRIPTIONS: Record<ClimateScenario, string> = {
  Paris:
    'Based on the SSP1-2.6 IPCC scenario, in which the commitments made at the ' +
    '2015 Paris summit are met. Emissions are cut significantly, keeping the ' +
    'global temperature increase above its pre-industrial level below 2°C at ' +
    'the end of the century.',
  Moderate:
    'Based on the SSP2-4.5 IPCC scenario. Emissions keep rising in line with ' +
    'present trends and stabilise at the end of the century, with a ' +
    'temperature increase similar to the 1960-2014 trend. Mitigation policies ' +
    'continue along the observed trend, but countries do not take more ' +
    'aggressive action to fulfil their Paris commitments.',
  High:
    'Based on the high-emissions SSP3-7.0 IPCC scenario. Rather than ' +
    'intensifying mitigation, countries scale back the policies they have ' +
    'implemented, in a fragmented world with limited energy-efficiency ' +
    'improvements and continued use of fossil fuels. Temperatures are the ' +
    'median of the climate models that ran SSP3-7.0.',
  Hot:
    'Emissions as in High, but the temperature path is the 90th percentile of ' +
    'the climate models that ran SSP3-7.0, instead of the median. Countries ' +
    `adapt to the higher temperatures over ${ADAPTATION_WINDOW_YEARS.Hot} years, ` +
    'the adaptation window in Kahn et al. (2021).',
  Hot_Adapted:
    'The same temperature increases as Hot, but countries adapt to them more ' +
    `quickly: over ${ADAPTATION_WINDOW_YEARS.Hot_Adapted} years instead of ` +
    `${ADAPTATION_WINDOW_YEARS.Hot}. Effects are less severe than in Hot. The ` +
    'dataset carries no estimate of what faster adaptation costs.',
  Hot_Unadapted:
    'The same temperature increases as Hot, but countries adapt to them more ' +
    `slowly: over ${ADAPTATION_WINDOW_YEARS.Hot_Unadapted} years instead of ` +
    `${ADAPTATION_WINDOW_YEARS.Hot}. Effects are more severe than in Hot.`,
};

/** One clause per scenario, for a lede that has to fit above a chart. */
export const SCENARIO_SHORT: Record<ClimateScenario, string> = {
  Paris: 'SSP1-2.6, Paris commitments met, warming kept below 2°C',
  Moderate: 'SSP2-4.5, present trends continue',
  High: 'SSP3-7.0, the median of the climate models',
  Hot: 'SSP3-7.0, the 90th percentile of the same models',
  Hot_Adapted: `Hot’s temperatures, adaptation over ${ADAPTATION_WINDOW_YEARS.Hot_Adapted} years instead of ${ADAPTATION_WINDOW_YEARS.Hot}`,
  Hot_Unadapted: `Hot’s temperatures, adaptation over ${ADAPTATION_WINDOW_YEARS.Hot_Unadapted} years instead of ${ADAPTATION_WINDOW_YEARS.Hot}`,
};

/**
 * Why the six are drawn as three scenarios plus one family, and why Hot is
 * not a rung above High. This is the reasoning that used to live only in a
 * code comment beside the labels (engine/types.ts); it is what a reader who
 * expects a temperature ladder needs to see.
 */
export const SCENARIO_FAMILY_NOTE =
  'The six are not one ladder of warming. High and the three Hot scenarios all ' +
  'sit on SSP3-7.0: High takes the median across the climate models and Hot ' +
  'takes the 90th percentile of the same models, so Hot is the hotter of the ' +
  'two. Hot adapted and Hot unadapted keep Hot’s temperatures and change only ' +
  `how fast countries adapt (${ADAPTATION_WINDOW_YEARS.Hot_Adapted}, ` +
  `${ADAPTATION_WINDOW_YEARS.Hot} and ${ADAPTATION_WINDOW_YEARS.Hot_Unadapted} years). ` +
  'The User Guide gives no per-scenario temperature except for Paris, ' +
  '“below 2°C” (sections II.C and IV.B).';

/**
 * The User Guide's reading order for the six (sections II.C and IV.B): the
 * three scenarios, then Hot and its two adaptation variants. Used only where
 * the scenarios are listed with their definitions, on the Methodology tab
 * (Teal's call, 2026-09-03). Legends, charts and the Climate lede keep
 * SCENARIO_DISPLAY_ORDER, which orders the Hot family by adaptation speed so
 * the lightness ramp reads.
 */
export const SCENARIO_GUIDE_ORDER: ClimateScenario[] = [
  'Paris',
  'Moderate',
  'High',
  'Hot',
  'Hot_Adapted',
  'Hot_Unadapted',
];

/** The Climate tab lede: all six, one clause each, in display order. */
export function scenarioLede(): string {
  return SCENARIO_DISPLAY_ORDER.map(
    (key) => `${SCENARIO_LABELS[key]}: ${SCENARIO_SHORT[key]}.`,
  ).join(' ');
}
