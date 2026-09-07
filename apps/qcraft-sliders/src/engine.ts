// Engine access. Everything numeric comes from @qcraft/engine; nothing here
// reimplements a formula. The reference settings are the engine DEFAULTS, which
// are also what the Explorer opens on for every country (its sidebar cites the
// same table); the `preset=teaching` label names these same values. They are
// spelled out so the page never depends on a default it did not name.
import {
  runPipeline,
  DEFAULTS,
  type CountryInput,
  type PipelineParams,
  type PipelineResult,
} from '@qcraft/engine';

export type Params = PipelineParams;
export type Result = PipelineResult;

export const SHARED: Params = {
  demography_variant: 'Medium',
  productivity_start: 5.0,
  productivity_end: 1.2,
  productivity_turning_point: 15,
  inflation_start: 5.0,
  inflation_end: 3.5,
  interest_rate_mode: 'Nominal interest rate',
  long_run_interest_rate: 1.0,
  debt_target: 50.0,
  fiscal_rule: 'Yes',
  expenditure_rigidity: 1.0,
};

for (const k of Object.keys(SHARED) as (keyof Params)[]) {
  if (DEFAULTS[k] !== SHARED[k]) {
    throw new Error(`Reference setting ${k} differs from the engine default (${String(DEFAULTS[k])}).`);
  }
}

/** Years shown on every chart. The long-run start comes from the loaded country. */
export const CHART_START = 2023;
export const CHART_END = 2099;

export type SeriesKey = 'Baseline' | 'Paris' | 'Moderate' | 'High' | 'Hot' | 'Hot_Adapted' | 'Hot_Unadapted';

export const SERIES_LABEL: Record<SeriesKey, string> = {
  Baseline: 'Baseline (no climate shock)',
  Paris: 'Paris',
  Moderate: 'Moderate',
  High: 'High',
  Hot: 'Hot',
  Hot_Adapted: 'Hot adapted',
  Hot_Unadapted: 'Hot unadapted',
};

export interface Point { year: number; value: number }

/** One row of public/data/countries.json (from the inputs archive manifest). */
export interface CountryRow {
  iso3c: string;
  country: string;
  coverageStatus: 'full' | 'shorter' | 'unsupported';
  coverageReason: string | null;
  weoMaxYear: number | null;
  sourceWeoMaxYear: number;
  projectionStartYear: number | null;
  inputSha256: string;
}
export interface CountryIndex {
  dataRevision: string;
  calculationPolicy: string;
  sourceVintage: string;
  label: string;
  countries: CountryRow[];
}

let country: CountryInput | null = null;
const cache = new Map<string, Result>();

export async function loadIndex(url: string): Promise<CountryIndex> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url}: ${res.status}`);
  return (await res.json()) as CountryIndex;
}

export async function loadCountry(url: string): Promise<CountryInput> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url}: ${res.status}`);
  country = (await res.json()) as CountryInput;
  cache.clear();
  return country;
}

export function countryInput(): CountryInput {
  if (!country) throw new Error('Country input not loaded');
  return country;
}

/** Run the engine at SHARED plus overrides. Cached by parameter set. */
export function run(overrides: Partial<Params> = {}): Result {
  const p: Params = { ...SHARED, ...overrides };
  const key = JSON.stringify(p);
  let r = cache.get(key);
  if (!r) {
    r = runPipeline(countryInput(), p);
    cache.set(key, r);
  }
  return r;
}

export const reference = () => run({});

/** Last WEO year and first long-run year for the loaded country, from the engine's horizon policy. */
export function horizon(): { weoMaxYear: number; longRunStart: number } {
  const hp = reference().horizonPolicy;
  if (!hp || hp.weoMaxYear == null) throw new Error('No horizon policy on this run');
  return { weoMaxYear: hp.weoMaxYear, longRunStart: hp.weoMaxYear + 1 };
}

/** Debt-to-GDP for one series, chart years only. */
export function debtSeries(result: Result, key: SeriesKey): Point[] {
  const rows = key === 'Baseline' ? result.fiscal : result.climate[key]!;
  return rows
    .filter((r) => r.years >= CHART_START && r.years <= CHART_END)
    .map((r) => ({ year: r.years, value: r.debt_to_gdp }));
}

export function valueAt(series: Point[], year: number): number {
  const p = series.find((d) => d.year === year);
  if (!p) throw new Error(`No value for ${year}`);
  return p.value;
}

type Field = string;

/**
 * Pull one field for one series across the chart years. Fiscal fields live on
 * `fiscal` (Baseline) or `climate[key]`; growth fields live on `baseline_v1`
 * for the Baseline and on the climate rows for a scenario; inflation, interest
 * and demography are scenario-independent in Q-CRAFT and read from their own
 * module output.
 */
export function fieldSeries(result: Result, key: SeriesKey, field: Field): Point[] {
  const inflationFields = new Set(['inflation']);
  const interestFields = new Set(['nominal_interest_rate', 'real_interest_rate', 'interest_growth_differential']);
  const demographyFields = new Set(['demography_growth_working_age', 'demography_growth_total', 'working_age_population', 'total_population']);
  const growthFields = new Set(['real_gdp', 'nominal_gdp', 'labour_productivity_growth', 'employment_growth', 'real_gdp_growth_percent', 'nominal_gdp_growth_percent']);

  let rows: Record<string, unknown>[];
  if (inflationFields.has(field)) rows = result.inflation as unknown as Record<string, unknown>[];
  else if (interestFields.has(field)) rows = result.interest_rate as unknown as Record<string, unknown>[];
  else if (demographyFields.has(field)) rows = result.demography as unknown as Record<string, unknown>[];
  else if (growthFields.has(field) && key === 'Baseline') rows = result.baseline_v1 as unknown as Record<string, unknown>[];
  else if (key === 'Baseline') rows = result.fiscal as unknown as Record<string, unknown>[];
  else rows = result.climate[key] as unknown as Record<string, unknown>[];

  return rows
    .filter((r) => (r.years as number) >= CHART_START && (r.years as number) <= CHART_END)
    .map((r) => ({ year: r.years as number, value: r[field] as number }))
    .filter((d) => d.value !== null && Number.isFinite(d.value));
}

/** Rebase a level series so that `baseYear` (default: the last WEO year) = 100. */
export function index100(series: Point[], baseYear = horizon().weoMaxYear): Point[] {
  const base = valueAt(series, baseYear);
  return series.map((d) => ({ year: d.year, value: (100 * d.value) / base }));
}
