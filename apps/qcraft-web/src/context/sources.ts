/**
 * The bundled source data the parameter context panels draw on, and where every
 * number in it came from.
 *
 * Two kinds of data meet here and the panels must never blur them:
 *
 *   SOURCE DATA is what the UN, the IMF and the World Bank publish. It is the
 *   record a user is being asked to form a view against. It lives in
 *   src/context/data/*.csv, derived from SHARED/sample-data by
 *   scripts/derive-context-data.mjs.
 *
 *   ENGINE OUTPUT is what Q-CRAFT computed from that record at one parameter
 *   set. It lives in the golden masters the mock adapter already reads. It is
 *   the answer, not the evidence, and it is Uganda-only.
 *
 * Every panel labels which of the two each line is, because "what the source
 * publishes" and "what the model made of it" are different claims and a
 * ministry reader is entitled to tell them apart.
 */

import demographyCsv from './data/demography.csv?raw';
import macrofiscalCsv from './data/macrofiscal.csv?raw';
import productivityCsv from './data/productivity.csv?raw';
import countriesCsv from './data/countries.csv?raw';

import productivityGmCsv from '../../../../packages/qcraft-engine/tests/golden_masters/intermediate/productivity/uganda.csv?raw';
import inflationGmCsv from '../../../../packages/qcraft-engine/tests/golden_masters/intermediate/inflation/uganda.csv?raw';
import interestRateGmCsv from '../../../../packages/qcraft-engine/tests/golden_masters/intermediate/interest_rate/uganda.csv?raw';

import { num, parseCsv } from '../engine/csv';

/** Which country the golden-master engine paths describe. */
export const GOLDEN_MASTER_ISO3C = 'UGA';

/** Last WEO year. Everything after is projection under every source here. */
export const WEO_MAX_YEAR = 2029;

/** Last year of the WDI productivity record (SHARED/DATA-NOTES.md section 3). */
export const WDI_MAX_YEAR = 2022;

export type DemographyMeasure = 'working_age' | 'total';

/**
 * Provenance strings, one per bundled source, quoted from
 * SHARED/DATA-NOTES.md section 2. Panels render these verbatim rather than
 * paraphrasing, so what the app claims about its data and what the data lane
 * documented cannot drift apart.
 */
export const SOURCES = {
  demography:
    'UN World Population Prospects, Medium, High and Low variants, population ' +
    'in thousands at 1 July. Bundled inside the IMF FAD Q-CRAFT workbook v10, ' +
    'which records the 2022 revision.',
  macrofiscal:
    'IMF World Economic Outlook, October 2024 vintage, 2001 to 2029. History ' +
    'and forecast are one series in this extract and are not separated.',
  productivity:
    'World Bank World Development Indicators, GDP per person employed at ' +
    'constant PPP dollars, 1991 to 2022.',
  goldenMaster:
    'Q-CRAFT engine golden masters for Uganda ' +
    '(packages/qcraft-engine/tests/golden_masters/), computed at the engine ' +
    'defaults.',
} as const;

/** Display names for the countries the context data covers. */
export const CONTEXT_COUNTRIES: ReadonlyArray<{ iso3c: string; name: string }> =
  parseCsv(countriesCsv).map((row) => ({ iso3c: row.iso3c, name: row.name }));

const COUNTRY_NAME = new Map(CONTEXT_COUNTRIES.map((c) => [c.iso3c, c.name]));

export const contextCountryName = (iso3c: string) => COUNTRY_NAME.get(iso3c) ?? iso3c;

export const hasContextData = (iso3c: string) => COUNTRY_NAME.has(iso3c);

/** A year-indexed series, the shape every builder in model.ts consumes. */
export type Series = Map<number, number>;

// ── Demography: population levels by country, measure and variant ────────────
const DEMOGRAPHY: Map<string, Series> = (() => {
  const out = new Map<string, Series>();
  for (const row of parseCsv(demographyCsv)) {
    const key = `${row.iso3c}|${row.measure}|${row.variant}`;
    let series = out.get(key);
    if (!series) {
      series = new Map();
      out.set(key, series);
    }
    series.set(num(row, 'years'), num(row, 'value'));
  }
  return out;
})();

/**
 * Population level in thousands, by variant. Undefined when the country is not
 * in the bundled context set; callers surface that rather than drawing nothing.
 */
export function populationLevels(
  iso3c: string,
  measure: DemographyMeasure,
  variant: string,
): Series | undefined {
  return DEMOGRAPHY.get(`${iso3c}|${measure}|${variant}`);
}

// ── Macrofiscal: the deflator index and the effective interest rate ──────────
const DEFLATOR = new Map<string, Series>();
const EFFECTIVE_RATE = new Map<string, Series>();
for (const row of parseCsv(macrofiscalCsv)) {
  const year = num(row, 'years');
  if (!DEFLATOR.has(row.iso3c)) DEFLATOR.set(row.iso3c, new Map());
  if (!EFFECTIVE_RATE.has(row.iso3c)) EFFECTIVE_RATE.set(row.iso3c, new Map());
  DEFLATOR.get(row.iso3c)!.set(year, num(row, 'gdp_deflator'));
  // Empty means the derived rate has no observation that year, which happens
  // where WEO carries no debt stock. Skipped, not zero-filled.
  if (row.interest_rate_percent !== '') {
    EFFECTIVE_RATE.get(row.iso3c)!.set(year, num(row, 'interest_rate_percent'));
  }
}

export const deflatorIndex = (iso3c: string) => DEFLATOR.get(iso3c);
export const effectiveRate = (iso3c: string) => EFFECTIVE_RATE.get(iso3c);

// ── Productivity: WDI levels, plus the OECD aggregate ────────────────────────
const PRODUCTIVITY = new Map<string, Series>();
for (const row of parseCsv(productivityCsv)) {
  if (!PRODUCTIVITY.has(row.iso3c)) PRODUCTIVITY.set(row.iso3c, new Map());
  PRODUCTIVITY.get(row.iso3c)!.set(num(row, 'years'), num(row, 'productivity_level'));
}

export const productivityLevels = (iso3c: string) => PRODUCTIVITY.get(iso3c);

// ── Engine output: the golden-master paths, Uganda only ──────────────────────
const column = (csv: string, name: string): Series => {
  const out: Series = new Map();
  for (const row of parseCsv(csv)) out.set(num(row, 'years'), num(row, name));
  return out;
};

/**
 * Productivity growth as the engine computed it. Two regimes in one column:
 * through 2022 it is the WDI record, from 2023 to 2029 it is the residual
 * `baseline_v1` back-calculates out of WEO real GDP growth and employment
 * growth, and from 2030 it is the logistic convergence the sidebar controls.
 */
export const GM_PRODUCTIVITY_GROWTH = column(
  productivityGmCsv,
  'productivity_growth_rate_percent',
);

/** GDP deflator growth as the engine computed it. */
export const GM_INFLATION = column(inflationGmCsv, 'inflation');

/** The nominal rate on government debt as the engine projected it. */
export const GM_NOMINAL_RATE = column(interestRateGmCsv, 'nominal_interest_rate');

/**
 * Nominal GDP growth and deflator growth from the same golden master. The three
 * interest-rate approaches are functions of these two, so keeping them together
 * with the rate is what lets the panel project all three off one fixture.
 */
export const GM_NOMINAL_GDP_GROWTH = column(
  interestRateGmCsv,
  'nominal_gdp_growth_percent',
);
export const GM_DEFLATOR_GROWTH = column(interestRateGmCsv, 'inflation');
