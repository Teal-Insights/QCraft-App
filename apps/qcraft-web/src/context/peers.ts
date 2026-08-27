/**
 * The cross-country reference set: where every selectable country sits on the
 * statistic behind each parameter, and which countries count as peers.
 *
 * The panels built in run 4 answer "what does the source say about my country".
 * This module is the second question, "where does my country sit", and it is a
 * different kind of claim, so the two are kept apart in the code as well as in
 * the reading order of the panel.
 *
 * Nothing here is fitted, smoothed or imputed in the browser. Every number is
 * read out of a CSV that `scripts/derive_peer_data.py` wrote from the bundled
 * vintages, and what each statistic may and may not be used to claim is written
 * down in docs/parameter-data.md. Read section 7 before touching anything
 * rigidity-shaped.
 */

import peersCsv from './data/peers.csv?raw';
import statsCsv from './data/peer-stats.csv?raw';
import rigidityPointsCsv from './data/rigidity-points.csv?raw';
import rigidityReadingsCsv from './data/rigidity-readings.csv?raw';

import { parseCsv, type CsvRow } from '../engine/csv';

/**
 * Vintage the panels read when the adapter reports something the reference set
 * does not carry. It is the frozen verification vintage, which is what the
 * fixture adapter serves today.
 */
export const DEFAULT_PEER_VINTAGE = 'weo-2024-10';

/** Year the demography statistic is read at, matching the derivation. */
export const PEER_DEMOGRAPHY_YEAR = 2050;

/** Last WEO year, which is where every forecast statistic is read. */
export const PEER_WEO_YEAR = 2029;

/** Last outturn year common to both vintages. See docs/parameter-data.md §2. */
export const PEER_HISTORY_YEAR = 2023;

/** How many countries the "similar output per worker" band holds. */
const SIMILARITY_BAND = 40;

/**
 * An empty cell is a country the source has no observation for. Undefined
 * rather than zero: a missing debt ratio drawn at zero would put a country at
 * the bottom of a distribution it is simply not in.
 */
const maybe = (row: CsvRow, column: string): number | undefined => {
  const raw = row[column];
  if (raw === undefined || raw === '') return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
};

export interface PeerCountry {
  iso3c: string;
  name: string;
  region: string;
  /** Empty where the country's subregion is too small to be a peer set. */
  subregion: string;
  /** WDI GDP per person employed, constant PPP dollars, 2022. */
  outputPerWorker?: number;
}

export const PEER_COUNTRIES: readonly PeerCountry[] = parseCsv(peersCsv).map((row) => ({
  iso3c: row.iso3c,
  name: row.name,
  region: row.region,
  subregion: row.subregion,
  outputPerWorker: maybe(row, 'output_per_worker'),
}));

const BY_ISO = new Map(PEER_COUNTRIES.map((c) => [c.iso3c, c]));

export const peerCountry = (iso3c: string) => BY_ISO.get(iso3c);

/** The statistics, one per numeric column of peer-stats.csv. */
export type StatKey =
  | 'demography_wa_growth'
  | 'demography_wa_growth_low'
  | 'demography_wa_growth_high'
  | 'demography_variant_spread'
  | 'productivity_hist_long'
  | 'productivity_hist_decade'
  | 'productivity_weo_residual'
  | 'inflation_weo_last'
  | 'inflation_hist_median'
  | 'inflation_recent_median'
  | 'interest_rate_weo_last'
  | 'interest_growth_differential_weo_last'
  | 'debt_weo_last'
  | 'debt_hist_last'
  | 'debt_hist_min';

const STATS: Map<string, Map<string, Partial<Record<StatKey, number>>>> = (() => {
  const out = new Map<string, Map<string, Partial<Record<StatKey, number>>>>();
  for (const row of parseCsv(statsCsv)) {
    let byCountry = out.get(row.vintage);
    if (!byCountry) {
      byCountry = new Map();
      out.set(row.vintage, byCountry);
    }
    const values: Partial<Record<StatKey, number>> = {};
    for (const key of Object.keys(row) as Array<keyof CsvRow>) {
      if (key === 'vintage' || key === 'iso3c') continue;
      const value = maybe(row, key as string);
      if (value !== undefined) values[key as StatKey] = value;
    }
    byCountry.set(row.iso3c, values);
  }
  return out;
})();

/** Which vintages the reference set carries, so a caller can fall back knowingly. */
export const PEER_VINTAGES = [...STATS.keys()];

const resolveVintage = (vintage: string) =>
  STATS.has(vintage) ? vintage : DEFAULT_PEER_VINTAGE;

export function statValue(
  vintage: string,
  iso3c: string,
  stat: StatKey,
): number | undefined {
  return STATS.get(resolveVintage(vintage))?.get(iso3c)?.[stat];
}

// ── Peer groups ──────────────────────────────────────────────────────────────

/**
 * The axes a user can compare along.
 *
 * Region and subregion come out of the UN WPP location hierarchy that the
 * pipeline already downloads. There is no income-group axis because no bundled
 * file carries income-group membership: WPP publishes the aggregates without
 * the memberships, and the IMF codelist carries names only. `similar` is the
 * nearest-neighbour band on WDI output per worker, which is a distance rather
 * than a classification, and is labelled as one. docs/parameter-data.md §8.
 */
export type PeerScope = 'world' | 'region' | 'subregion' | 'similar';

export interface PeerScopeOption {
  value: PeerScope;
  label: string;
  /** How many countries the scope holds for this country, including itself. */
  count: number;
}

/** The countries in a scope, always including the subject country itself. */
export function peerSet(iso3c: string, scope: PeerScope): PeerCountry[] {
  const self = BY_ISO.get(iso3c);
  if (!self) return [];

  switch (scope) {
    case 'world':
      return [...PEER_COUNTRIES];
    case 'region':
      return PEER_COUNTRIES.filter((c) => c.region === self.region);
    case 'subregion':
      return self.subregion
        ? PEER_COUNTRIES.filter((c) => c.subregion === self.subregion)
        : PEER_COUNTRIES.filter((c) => c.region === self.region);
    case 'similar': {
      if (self.outputPerWorker === undefined) return [...PEER_COUNTRIES];
      const anchor = self.outputPerWorker;
      // Ranked by log distance, because the measure spans two orders of
      // magnitude and a linear distance would make every low-income country
      // everyone else's neighbour.
      return PEER_COUNTRIES.filter((c) => c.outputPerWorker !== undefined)
        .map((c) => ({
          country: c,
          distance: Math.abs(Math.log(c.outputPerWorker!) - Math.log(anchor)),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, SIMILARITY_BAND)
        .map((entry) => entry.country);
    }
  }
}

/** The scope choices to offer, named for what they actually contain. */
export function peerScopes(iso3c: string): PeerScopeOption[] {
  const self = BY_ISO.get(iso3c);
  if (!self) return [];
  const scopes: PeerScope[] = self.subregion
    ? ['world', 'region', 'subregion', 'similar']
    : ['world', 'region', 'similar'];
  const label: Record<PeerScope, string> = {
    world: 'All countries',
    region: self.region,
    subregion: self.subregion,
    similar: 'Similar output per worker',
  };
  return scopes.map((scope) => ({
    value: scope,
    label: label[scope],
    count: peerSet(iso3c, scope).length,
  }));
}

/** A group's name as the caption should say it, for the scope in force. */
export function peerScopeName(iso3c: string, scope: PeerScope): string {
  return peerScopes(iso3c).find((s) => s.value === scope)?.label ?? 'All countries';
}

// ── Distributions ────────────────────────────────────────────────────────────

export interface PeerPoint {
  iso3c: string;
  name: string;
  value: number;
}

export interface Distribution {
  /** Every country in scope that has an observation, ascending by value. */
  points: PeerPoint[];
  /** Countries in scope the source has no observation for. */
  missing: number;
  p10: number;
  p25: number;
  median: number;
  p75: number;
  p90: number;
}

/** Linear-interpolated quantile of a sorted array, the D3/R type-7 convention. */
function quantile(sorted: number[], p: number): number {
  if (!sorted.length) return Number.NaN;
  if (sorted.length === 1) return sorted[0];
  const position = (sorted.length - 1) * p;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (position - lower) * (sorted[upper] - sorted[lower]);
}

export function distribution(
  vintage: string,
  iso3c: string,
  scope: PeerScope,
  stat: StatKey,
): Distribution | undefined {
  const set = peerSet(iso3c, scope);
  if (!set.length) return undefined;

  const points: PeerPoint[] = [];
  let missing = 0;
  for (const country of set) {
    const value = statValue(vintage, country.iso3c, stat);
    if (value === undefined) {
      missing += 1;
      continue;
    }
    points.push({ iso3c: country.iso3c, name: country.name, value });
  }
  // Fewer than four observations is not a distribution and quantiles drawn over
  // it would be three countries wearing a box plot.
  if (points.length < 4) return undefined;

  points.sort((a, b) => a.value - b.value);
  const values = points.map((p) => p.value);
  return {
    points,
    missing,
    p10: quantile(values, 0.1),
    p25: quantile(values, 0.25),
    median: quantile(values, 0.5),
    p75: quantile(values, 0.75),
    p90: quantile(values, 0.9),
  };
}

/**
 * The span to draw a distribution over.
 *
 * Debt ratios, inflation and effective rates all have a long right tail: one
 * country at 250% of GDP pushes the median and the middle half of the other
 * hundred and seventy into the left fifth of the axis, where nobody can read
 * them. So the axis covers the 2nd to 98th percentile and the strip pins the
 * countries outside it to the edge with an arrow and a count, the way a box
 * plot puts outliers outside the whiskers rather than rescaling for them.
 *
 * `mustInclude` is the country's own value and the user's setting. Those two
 * are never allowed off the axis, whatever percentile they sit at, because the
 * whole panel is about where they are.
 */
export function robustDomain(
  values: number[],
  mustInclude: number[] = [],
): [number, number] {
  if (!values.length) return [0, 1];
  const sorted = [...values].sort((a, b) => a - b);
  let lo = quantile(sorted, 0.02);
  let hi = quantile(sorted, 0.98);
  for (const value of mustInclude) {
    if (Number.isFinite(value)) {
      lo = Math.min(lo, value);
      hi = Math.max(hi, value);
    }
  }
  const pad = Math.max((hi - lo) * 0.05, 0.2);
  return [lo - pad, hi + pad];
}

/**
 * Where a value falls in a distribution, as a percentage of countries at or
 * below it. Reported for the country's own statistic and for the user's
 * setting, which is the comparison the panel exists to make.
 */
export function percentileOf(dist: Distribution, value: number): number {
  const atOrBelow = dist.points.filter((p) => p.value <= value).length;
  return (atOrBelow / dist.points.length) * 100;
}

/** English for a percentile, so a caption does not read like a lab report. */
export function placeInWords(percentile: number): string {
  if (percentile >= 90) return 'in the top tenth';
  if (percentile >= 75) return 'in the top quarter';
  if (percentile >= 60) return 'above the middle';
  if (percentile > 40) return 'near the middle';
  if (percentile > 25) return 'below the middle';
  if (percentile > 10) return 'in the bottom quarter';
  return 'in the bottom tenth';
}

// ── Expenditure rigidity ─────────────────────────────────────────────────────

/**
 * One country-year: how fast the economy grew and how fast primary spending
 * grew. The scatter of these is the whole evidence base for rigidity, and the
 * point of drawing it is that a reader can see it does not pin the number down.
 */
export interface RigidityPoint {
  year: number;
  gdpGrowth: number;
  expenditureGrowth: number;
  /** Real growth below this country's own median for the period. */
  weakYear: boolean;
}

const RIGIDITY_POINTS: Map<string, Map<string, RigidityPoint[]>> = (() => {
  const out = new Map<string, Map<string, RigidityPoint[]>>();
  for (const row of parseCsv(rigidityPointsCsv)) {
    let byCountry = out.get(row.vintage);
    if (!byCountry) {
      byCountry = new Map();
      out.set(row.vintage, byCountry);
    }
    const list = byCountry.get(row.iso3c) ?? [];
    list.push({
      year: Number(row.years),
      gdpGrowth: Number(row.gdp_growth),
      expenditureGrowth: Number(row.expenditure_growth),
      weakYear: row.weak_year === '1',
    });
    byCountry.set(row.iso3c, list);
  }
  return out;
})();

export function rigidityPoints(vintage: string, iso3c: string): RigidityPoint[] {
  return RIGIDITY_POINTS.get(resolveVintage(vintage))?.get(iso3c) ?? [];
}

/**
 * One pooled estimate of the expenditure elasticity, converted to the scale the
 * parameter is set on.
 *
 * `rigidity` is 1 minus the elasticity, because climate.py holds primary
 * expenditure at `PE_base * (1 + (1 - rigidity) * g)` for a proportional GDP
 * shock. The interval is the regression's own 95 percent interval carried
 * through the same subtraction, so `low` comes from the high end of the slope.
 */
export interface RigidityReading {
  scope: string;
  reading: string;
  order: number;
  rigidity: number;
  low: number;
  high: number;
  observations: number;
  countries: number;
  rSquared: number;
}

const RIGIDITY_READINGS: Map<string, RigidityReading[]> = (() => {
  const out = new Map<string, RigidityReading[]>();
  for (const row of parseCsv(rigidityReadingsCsv)) {
    const beta = Number(row.beta);
    const se = Number(row.se);
    const list = out.get(row.vintage) ?? [];
    list.push({
      scope: row.scope,
      reading: row.reading,
      order: Number(row.sort_order),
      rigidity: 1 - beta,
      low: 1 - (beta + 1.96 * se),
      high: 1 - (beta - 1.96 * se),
      observations: Number(row.n),
      countries: Number(row.countries),
      rSquared: Number(row.r2),
    });
    out.set(row.vintage, list);
  }
  return out;
})();

/**
 * The readings for one scope. `region` falls back to the world set for a
 * country whose region has no estimate, which is announced by the returned
 * scope name rather than silently.
 */
export function rigidityReadings(
  vintage: string,
  scope: 'World' | string,
): RigidityReading[] {
  const all = RIGIDITY_READINGS.get(resolveVintage(vintage)) ?? [];
  const rows = all.filter((r) => r.scope === scope);
  return (rows.length ? rows : all.filter((r) => r.scope === 'World')).sort(
    (a, b) => a.order - b.order,
  );
}

/** The width of what the record supports: the extremes across all readings. */
export function rigiditySpan(
  readings: RigidityReading[],
): { low: number; high: number } | undefined {
  if (!readings.length) return undefined;
  return {
    low: Math.min(...readings.map((r) => r.rigidity)),
    high: Math.max(...readings.map((r) => r.rigidity)),
  };
}
