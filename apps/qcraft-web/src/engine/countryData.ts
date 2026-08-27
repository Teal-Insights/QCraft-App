/**
 * Country input loading, per mode, plus the coverage checks the notices read.
 *
 * ── Why the data is fetched rather than bundled ───────────────────────────────
 * One country's raw input slices are about 240 KB of JSON, and there are 175 of
 * them in each of two vintages. Bundling that is 82 MB in the initial payload
 * for a tool people open on ministry laptops. So each country is fetched the
 * first time it is selected and kept in memory afterwards: the first click on a
 * country costs one request, every later click on it costs nothing, and
 * switching modes on the same country costs one request for the other vintage.
 *
 * The files are staged into `public/data/<vintage>/` by
 * `scripts/stage-data.mjs`, which runs before `dev` and `build`. They are
 * regenerable build artifacts and are gitignored, exactly like the Parquet they
 * come from.
 *
 * ── What "no data" means here ─────────────────────────────────────────────────
 * Three different things, and the app says which one it is:
 *   - the file will not load, or the engine throws on it: nothing to draw
 *   - the debt series has no value at the year the projection starts from: the
 *     engine would anchor the whole path on a missing number, so we stop
 *   - the climate slice is all zeros: the baseline is fine, the scenarios are
 *     not estimates
 * The checks are derived from each country's own data rather than from a list of
 * country codes, so they stay true when a vintage changes underneath them.
 */

import type { CountryInput, MacroRawRow } from '@qcraft/engine';

import { MODES, type ModeId } from '../content/modes';

/** Where a country's payload lives, relative to the deployed app. */
function countryUrl(vintage: string, iso3c: string): string {
  const base = import.meta.env.BASE_URL;
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}data/${vintage}/${iso3c}.json`;
}

/** Cache key. Two vintages of one country are two different payloads. */
const cacheKey = (vintage: string, iso3c: string) => `${vintage}:${iso3c}`;

const cache = new Map<string, CountryInput>();
const inFlight = new Map<string, Promise<CountryInput>>();

/**
 * Load one country's inputs for one mode.
 *
 * Concurrent callers for the same country share one request: a user clicking
 * quickly through a list should not open six connections for the country they
 * settled on.
 */
export function loadCountryInput(mode: ModeId, iso3c: string): Promise<CountryInput> {
  const { vintage } = MODES[mode];
  const key = cacheKey(vintage, iso3c);

  const cached = cache.get(key);
  if (cached) return Promise.resolve(cached);

  const pending = inFlight.get(key);
  if (pending) return pending;

  const request = fetch(countryUrl(vintage, iso3c))
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `Could not load ${iso3c} for ${vintage} (HTTP ${response.status}).`,
        );
      }
      const input = (await response.json()) as CountryInput;
      cache.set(key, input);
      return input;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, request);
  return request;
}

/** Test seam: drop everything held in memory. */
export function clearCountryCache(): void {
  cache.clear();
  inFlight.clear();
}

// ── Coverage ─────────────────────────────────────────────────────────────────

/** Why a country cannot be projected, when it cannot. */
export type ProjectionBlock = 'missing-inputs' | 'no-debt-anchor';

export interface Coverage {
  /**
   * False when every climate estimate for this country is zero or absent. All
   * six scenarios then land exactly on the baseline, which is missing data
   * rather than an absence of risk.
   */
  hasClimateData: boolean;
  /** Set when the projection must not be drawn. */
  block: ProjectionBlock | null;
  /**
   * The last year of WEO history and forecast for this country. The projection
   * anchors on this year's debt stock.
   */
  weoMaxYear: number | null;
  /** History years whose debt-to-GDP is missing. Reported, not blocking. */
  historyGapYears: number[];
}

function macroRows(input: CountryInput): MacroRawRow[] {
  return [...input.macrofiscal].sort((a, b) => a.years - b.years);
}

/**
 * Read a country's coverage off its own inputs.
 *
 * The debt anchor is the test that matters. `baselineCountry` copies WEO fiscal
 * aggregates straight through for every year up to the country's last WEO year,
 * then projects forward from that year's debt stock. If the source has no debt
 * figure there, the projection starts from a number that does not exist, and
 * the TypeScript engine will happily carry it forward as a debt path pinned near
 * zero rather than raising (the Python engine raises instead). Zambia and Libya
 * are the live cases; see the CC-2 report and the CC-6 lane.
 */
export function readCoverage(input: CountryInput): Coverage {
  const rows = macroRows(input);
  if (rows.length === 0) {
    return {
      hasClimateData: false,
      block: 'missing-inputs',
      weoMaxYear: null,
      historyGapYears: [],
    };
  }

  const weoMaxYear = rows[rows.length - 1]!.years;
  const anchor = rows[rows.length - 1]!;
  const anchored = isNumber(anchor.debt_to_gdp) && isNumber(anchor.debt);

  const historyGapYears = rows
    .filter((r) => !isNumber(r.debt_to_gdp))
    .map((r) => r.years);

  const hasClimateData = input.climate.some(
    (r) => isNumber(r.gdp_loss_percent) && r.gdp_loss_percent !== 0,
  );

  return {
    hasClimateData,
    block: anchored ? null : 'no-debt-anchor',
    weoMaxYear,
    historyGapYears,
  };
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
