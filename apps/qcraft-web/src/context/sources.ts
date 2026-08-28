/**
 * The bundled source data the parameter context panels draw on, and where every
 * number in it came from.
 *
 * Two kinds of data meet here and the panels must never blur them:
 *
 *   SOURCE DATA is what the UN, the IMF and the World Bank publish. It is the
 *   record a user is being asked to form a view against. It lives in
 *   src/context/data/*.csv, derived from the vintage payloads themselves by
 *   scripts/derive-context-data.mjs.
 *
 *   ENGINE OUTPUT is what Q-CRAFT computed from that record at one parameter
 *   set. It lives in the golden masters the mock adapter already reads. It is
 *   the answer, not the evidence, and it is Uganda-only.
 *
 * Every panel labels which of the two each line is, because "what the source
 * publishes" and "what the model made of it" are different claims and a
 * ministry reader is entitled to tell them apart.
 *
 * ── Vintage scoping, added at the freeze ──────────────────────────────────────
 * The record is per vintage, so every lookup here takes one. It has to: WPP
 * 2022 and WPP 2024 disagree about Uganda's 2050 working-age population by
 * 1.9 million people, and that is the number the demography panel asks a user
 * to form a view against. Before this, a Current-mode panel showed the October
 * 2024 record under a Current-mode stamp.
 *
 * Productivity is the one exception and it is asserted rather than assumed: the
 * pipeline carries the WDI table forward unchanged, each vintage's
 * manifest.json records that, and the generator fails if the two vintages ever
 * stop agreeing. Two identical copies would claim a difference the data does
 * not have.
 *
 * No vintage id and no release name is written in this file. Both come from the
 * mode registry, which is the rule tests/engineWiring.test.ts enforces.
 */

import demographyCsv from './data/demography.csv?raw';
import macrofiscalCsv from './data/macrofiscal.csv?raw';
import productivityCsv from './data/productivity.csv?raw';
import countriesCsv from './data/countries.csv?raw';

import productivityGmCsv from '../../../../packages/qcraft-engine/tests/golden_masters/intermediate/productivity/uganda.csv?raw';
import inflationGmCsv from '../../../../packages/qcraft-engine/tests/golden_masters/intermediate/inflation/uganda.csv?raw';
import interestRateGmCsv from '../../../../packages/qcraft-engine/tests/golden_masters/intermediate/interest_rate/uganda.csv?raw';

import { DATASET, MODES, releaseFor } from '../content/modes';
import { num, parseCsv } from '../engine/csv';

/** Which country the golden-master engine paths describe. */
export const GOLDEN_MASTER_ISO3C = 'UGA';

/**
 * Which vintage the golden-master engine paths were computed on.
 *
 * Read off the mode registry, not written here. It matters because a panel that
 * projects on a golden-master growth path has to read its OBSERVED record from
 * the same vintage: anchoring the April 2026 effective rate onto the October
 * 2024 growth path would produce three curves that are neither vintage and
 * cannot be cited as either. Those panels say which vintage they are on in
 * their source line, whatever mode the app is in.
 */
export const GOLDEN_MASTER_VINTAGE = MODES.verified.vintage;

/** Last WEO year. Everything after is projection under every source here. */
export const WEO_MAX_YEAR = 2029;

/** Last year of the WDI productivity record (SHARED/DATA-NOTES.md section 3). */
export const WDI_MAX_YEAR = 2022;

export type DemographyMeasure = 'working_age' | 'total';

/**
 * Provenance strings, one per bundled source, following SHARED/DATA-NOTES.md
 * section 2. Panels render these verbatim rather than paraphrasing, so what the
 * app claims about its data and what the data lane documented cannot drift
 * apart.
 *
 * The two that change with the vintage are functions of it, and the release
 * name inside each comes from the mode registry rather than from a literal
 * here. A panel drawing the April 2026 record now says so.
 */
export const SOURCES = {
  demography: (vintage: string) =>
    `${releaseFor(vintage, 'demography')}. Medium, High and Low variants, ` +
    'population in thousands at 1 July.',
  macrofiscal: (vintage: string) =>
    `${releaseFor(vintage, 'macrofiscal')}, 2001 to ${WEO_MAX_YEAR}. History ` +
    'and forecast are one series in this extract and are not separated.',
  /**
   * Not a function of the vintage, because the table is not. Every vintage
   * carries the same WDI record forward, and says so in its manifest.
   */
  productivity:
    'World Bank World Development Indicators, GDP per person employed at ' +
    'constant PPP dollars, 1991 to 2022. The same record in both data modes: ' +
    'the newer WEO release carries it forward unchanged.',
  goldenMaster:
    'Q-CRAFT engine golden masters for Uganda ' +
    '(packages/qcraft-engine/tests/golden_masters/), computed at the engine ' +
    'defaults.',
} as const;

/** Series names, re-exported so a panel can label a row without a literal. */
export { DATASET };

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
    const key = `${row.vintage}|${row.iso3c}|${row.measure}|${row.variant}`;
    let series = out.get(key);
    if (!series) {
      series = new Map();
      out.set(key, series);
    }
    series.set(num(row, 'years'), num(row, 'value'));
  }
  return out;
})();

/** Which vintages the bundled record carries, so a caller can fall back knowingly. */
export const RECORD_VINTAGES = [
  ...new Set(parseCsv(demographyCsv).map((row) => row.vintage)),
];

/**
 * Fall back to the frozen vintage for anything the record does not carry.
 *
 * The same rule `peers.ts` applies to the reference tables, for the same
 * reason: an imported run file can name a vintage this build was not shipped
 * with, and showing the frozen record is better than showing an empty panel.
 * Which vintage is frozen is not decided here; the first row of the bundled
 * record decides it, and the generator writes them oldest first.
 */
const resolveVintage = (vintage: string) =>
  DEMOGRAPHY.has(`${vintage}|UGA|working_age|Medium`) ? vintage : RECORD_VINTAGES[0]!;

/**
 * Population level in thousands, by vintage and variant. Undefined when the
 * country is not in the bundled context set; callers surface that rather than
 * drawing nothing.
 */
export function populationLevels(
  vintage: string,
  iso3c: string,
  measure: DemographyMeasure,
  variant: string,
): Series | undefined {
  return DEMOGRAPHY.get(`${resolveVintage(vintage)}|${iso3c}|${measure}|${variant}`);
}

// ── Macrofiscal: the deflator index and the effective interest rate ──────────
const DEFLATOR = new Map<string, Series>();
const EFFECTIVE_RATE = new Map<string, Series>();
for (const row of parseCsv(macrofiscalCsv)) {
  const year = num(row, 'years');
  const key = `${row.vintage}|${row.iso3c}`;
  if (!DEFLATOR.has(key)) DEFLATOR.set(key, new Map());
  if (!EFFECTIVE_RATE.has(key)) EFFECTIVE_RATE.set(key, new Map());
  DEFLATOR.get(key)!.set(year, num(row, 'gdp_deflator'));
  // Empty means the derived rate has no observation that year, which happens
  // where WEO carries no debt stock. Skipped, not zero-filled.
  if (row.interest_rate_percent !== '') {
    EFFECTIVE_RATE.get(key)!.set(year, num(row, 'interest_rate_percent'));
  }
}

export const deflatorIndex = (vintage: string, iso3c: string) =>
  DEFLATOR.get(`${resolveVintage(vintage)}|${iso3c}`);
export const effectiveRate = (vintage: string, iso3c: string) =>
  EFFECTIVE_RATE.get(`${resolveVintage(vintage)}|${iso3c}`);

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
