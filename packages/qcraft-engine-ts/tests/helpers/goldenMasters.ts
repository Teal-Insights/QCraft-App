/**
 * Loaders for the frozen golden-master fixtures in `packages/qcraft-engine/tests/golden_masters/`.
 *
 * THE CONTRACT. These CSVs are read-only. Every expected value in this test suite comes
 * from them — nothing is hard-coded and nothing is computed with engine code
 * (AGENTS.md review rule #1).
 *
 * The input fixtures are reconstructed from the golden masters exactly the way the
 * Python suites do it (see `test_demography.py`, `test_productivity.py`, ...). That is
 * not circular: the reconstructed columns are pass-through inputs the engine copies
 * rather than derives, so a wrong formula still shows up as a mismatch.
 */

import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  BaselineV1Row,
  ClimateVariationRow,
  DeflatorInputRow,
  DemographyInputRow,
  DemographyRow,
  FiscalRow,
  InflationRow,
  InterestRateRow,
  MacroBaselineRow,
  MacroFiscalRow,
  ProductivityInputRow,
  ProductivityRow,
} from '../../src/index.js';
import { type CsvRow, numColumn, readCsv } from './csv.js';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Repo root — walk up until the Python engine package is visible. */
function findRepoRoot(): string {
  let current = resolve(HERE, '..', '..');
  for (let i = 0; i < 10; i += 1) {
    if (existsSync(join(current, 'packages', 'qcraft-engine', 'tests', 'golden_masters'))) {
      return current;
    }
    current = dirname(current);
  }
  throw new Error('Cannot locate repo root (packages/qcraft-engine/tests/golden_masters)');
}

export const REPO_ROOT = findRepoRoot();
export const GOLDEN_DIR = join(
  REPO_ROOT,
  'packages',
  'qcraft-engine',
  'tests',
  'golden_masters',
);
export const INTERMEDIATE_DIR = join(GOLDEN_DIR, 'intermediate');
export const FINAL_DIR = join(GOLDEN_DIR, 'final');

export const ISO3C = 'UGA';
export const COUNTRY = 'Uganda';
/** Last WEO year for the Uganda fixtures. */
export const WEO_MAX_YEAR = 2029;

/**
 * OECD productivity growth back-computed from the golden master. The User Guide rounds
 * it to "1.1%"; `test_productivity.py` uses this full-precision value.
 */
export const OECD_GROWTH_RATE = 1.118596;

/** The six climate scenarios: (engine key, fixture-file prefix, final-CSV label). */
export const SCENARIOS = [
  { key: 'Paris', file: 'paris', label: 'Paris' },
  { key: 'Moderate', file: 'moderate', label: 'Moderate' },
  { key: 'High', file: 'high', label: 'High' },
  { key: 'Hot', file: 'hot', label: 'Hot' },
  { key: 'Hot_Adapted', file: 'hot_adapted', label: 'Hot Adapted' },
  { key: 'Hot_Unadapted', file: 'hot_unadapted', label: 'Hot Unadapted' },
] as const;

// ── Raw fixture readers ──────────────────────────────────────────────────────

const cache = new Map<string, CsvRow[]>();

function load(path: string): CsvRow[] {
  let rows = cache.get(path);
  if (!rows) {
    rows = readCsv(path);
    cache.set(path, rows);
  }
  return rows;
}

export const gmDemography = (): CsvRow[] => load(join(INTERMEDIATE_DIR, 'demography', 'uganda.csv'));
export const gmProductivity = (): CsvRow[] => load(join(INTERMEDIATE_DIR, 'productivity', 'uganda.csv'));
export const gmInflation = (): CsvRow[] => load(join(INTERMEDIATE_DIR, 'inflation', 'uganda.csv'));
export const gmBaselineV1 = (): CsvRow[] => load(join(INTERMEDIATE_DIR, 'baseline_v1', 'uganda.csv'));
export const gmInterestRate = (): CsvRow[] => load(join(INTERMEDIATE_DIR, 'interest_rate', 'uganda.csv'));
export const gmFiscal = (): CsvRow[] => load(join(INTERMEDIATE_DIR, 'fiscal', 'uganda.csv'));
export const gmClimate = (filePrefix: string): CsvRow[] =>
  load(join(INTERMEDIATE_DIR, 'climate', `${filePrefix}_uganda.csv`));
export const gmFinal = (): CsvRow[] => load(join(FINAL_DIR, 'uganda.csv'));

const years = (rows: readonly CsvRow[]): number[] => numColumn(rows, 'years');

// ── Golden masters re-typed as engine rows (used as *inputs* downstream) ──────

/** The demography golden master, typed as `demographyCountry` output. */
export function demographyGoldenAsRows(): DemographyRow[] {
  return gmDemography().map((r) => ({
    years: r['years'] as number,
    working_age_population: r['working_age_population'] as number,
    total_population: r['total_population'] as number,
    demography_growth_working_age: r['demography_growth_working_age'] as number | null,
    demography_growth_total: r['demography_growth_total'] as number | null,
    iso3c: ISO3C,
    country: COUNTRY,
  }));
}

/** The inflation golden master, typed as `inflationCountry` output. */
export function inflationGoldenAsRows(): InflationRow[] {
  return gmInflation().map((r) => ({
    iso3c: ISO3C,
    country: COUNTRY,
    years: r['years'] as number,
    inflation: r['inflation'] as number,
  }));
}

/** The productivity golden master, typed as `productivityCountry` output. */
export function productivityGoldenAsRows(): ProductivityRow[] {
  return gmProductivity().map((r) => ({
    years: r['years'] as number,
    productivity_growth_rate_percent: r['productivity_growth_rate_percent'] as number,
    productivity_level: r['productivity_level'] as number,
    productivity_level_oecd_percent: r['productivity_level_oecd_percent'] as number,
  }));
}

/** The baseline_v1 golden master, typed as `baselineV1` output. */
export function baselineV1GoldenAsRows(): BaselineV1Row[] {
  return gmBaselineV1().map((r) => ({
    iso3c: ISO3C,
    country: COUNTRY,
    years: r['years'] as number,
    working_age_population: r['working_age_population'] as number,
    employment_growth: r['employment_growth'] as number,
    labour_productivity_growth: r['labour_productivity_growth'] as number,
    gdp_deflator_growth_percent: r['gdp_deflator_growth_percent'] as number,
    real_gdp: r['real_gdp'] as number,
    real_gdp_growth_percent: r['real_gdp_growth_percent'] as number,
    nominal_gdp: r['nominal_gdp'] as number,
    nominal_gdp_growth_percent: r['nominal_gdp_growth_percent'] as number,
    population_growth: r['population_growth'] as number,
  }));
}

/** The interest_rate golden master, typed as `interestRateCountry` output. */
export function interestRateGoldenAsRows(): InterestRateRow[] {
  return gmInterestRate().map((r) => ({
    iso3c: ISO3C,
    country: COUNTRY,
    years: r['years'] as number,
    nominal_interest_rate: r['nominal_interest_rate'] as number,
    inflation: r['inflation'] as number,
    nominal_gdp_growth_percent: r['nominal_gdp_growth_percent'] as number,
    real_interest_rate: r['real_interest_rate'] as number,
    interest_growth_differential: r['interest_growth_differential'] as number,
  }));
}

/** The fiscal golden master, typed as `baselineCountry` output. */
export function fiscalGoldenAsRows(): FiscalRow[] {
  return gmFiscal().map((r) => ({
    years: r['years'] as number,
    revenue: r['revenue'] as number,
    revenue_percent_gdp: r['revenue_percent_gdp'] as number,
    primary_expenditure: r['primary_expenditure'] as number,
    primary_expenditure_percent_gdp: r['primary_expenditure_percent_gdp'] as number,
    primary_balance: r['primary_balance'] as number,
    primary_balance_percent_gdp: r['primary_balance_percent_gdp'] as number,
    interest_expenditure: r['interest_expenditure'] as number,
    interest_expenditure_percent_gdp: r['interest_expenditure_percent_gdp'] as number,
    total_expenditure: r['total_expenditure'] as number,
    overall_balance: r['overall_balance'] as number,
    overall_balance_percent_gdp: r['overall_balance_percent_gdp'] as number,
    debt_to_gdp: r['debt_to_gdp'] as number,
    debt: r['debt'] as number,
    debt_stabilizing_primary_balance: r['debt_stabilizing_primary_balance'] as number | null,
    fiscal_gap: r['fiscal_gap'] as number | null,
  }));
}

// ── Reconstructed engine inputs (mirrors the Python fixtures) ─────────────────

/** Long-format UN WPP input rebuilt from the demography golden master. */
export function demographyInput(): DemographyInputRow[] {
  const rows: DemographyInputRow[] = [];
  for (const r of gmDemography()) {
    const year = r['years'] as number;
    rows.push({
      iso3c: ISO3C,
      country: COUNTRY,
      years: year,
      age_group: '15-64',
      status: 'Medium',
      values: r['working_age_population'] as number,
    });
    rows.push({
      iso3c: ISO3C,
      country: COUNTRY,
      years: year,
      age_group: 'Total',
      status: 'Medium',
      values: r['total_population'] as number,
    });
  }
  return rows;
}

/**
 * WDI productivity levels rebuilt from the golden master.
 *
 * The country's 2008 level is back-solved from the 2009 growth rate; OECD levels are
 * back-solved from `productivity_level / (productivity_level_oecd_percent / 100)`.
 */
export function productivityInput(): ProductivityInputRow[] {
  const gm = gmProductivity();
  const byYear = new Map(gm.map((r) => [r['years'] as number, r]));

  const r2009 = byYear.get(2009)!;
  const level2009 = r2009['productivity_level'] as number;
  const growth2009 = r2009['productivity_growth_rate_percent'] as number;

  const rows: ProductivityInputRow[] = [
    { iso3c: ISO3C, years: 2008, productivity_level: level2009 / (1 + growth2009 / 100) },
  ];
  for (const r of gm) {
    const y = r['years'] as number;
    if (y >= 2009 && y <= 2021) {
      rows.push({ iso3c: ISO3C, years: y, productivity_level: r['productivity_level'] as number });
    }
  }

  // OECD aggregate. The 2008 entry is never read by the engine (output starts at 2009)
  // but keeps the input shape faithful to the Python fixture.
  const oecd2009 = level2009 / ((r2009['productivity_level_oecd_percent'] as number) / 100);
  rows.push({ iso3c: 'OED', years: 2008, productivity_level: oecd2009 / (1 + 2.6392 / 100) });
  for (const r of gm) {
    const y = r['years'] as number;
    if (y >= 2009 && y <= 2022) {
      rows.push({
        iso3c: 'OED',
        years: y,
        productivity_level:
          (r['productivity_level'] as number) /
          ((r['productivity_level_oecd_percent'] as number) / 100),
      });
    }
  }
  return rows;
}

/**
 * GDP deflator index rebuilt from the golden-master inflation rates.
 *
 * `deflator(t) = deflator(t-1) * (1 + inflation(t)/100)`, starting from an arbitrary
 * base of 100 in 2008. Only historical years (through 2029) are needed.
 */
export function deflatorInput(): DeflatorInputRow[] {
  const rows: DeflatorInputRow[] = [
    { iso3c: ISO3C, country: COUNTRY, years: 2008, gdp_deflator: 100 },
  ];
  for (const r of gmInflation()) {
    const year = r['years'] as number;
    if (year > WEO_MAX_YEAR) continue;
    const prev = rows.at(-1)!.gdp_deflator;
    rows.push({
      iso3c: ISO3C,
      country: COUNTRY,
      years: year,
      gdp_deflator: prev * (1 + (r['inflation'] as number) / 100),
    });
  }
  return rows;
}

/** WEO-period macro input for `baselineV1`, taken from the baseline_v1 golden master. */
export function macroForBaselineInput(): MacroBaselineRow[] {
  return gmBaselineV1()
    .filter((r) => (r['years'] as number) <= WEO_MAX_YEAR)
    .map((r) => ({
      iso3c: ISO3C,
      country: COUNTRY,
      years: r['years'] as number,
      real_gdp: r['real_gdp'] as number,
      nominal_gdp: r['nominal_gdp'] as number,
      real_gdp_growth_percent: r['real_gdp_growth_percent'] as number,
      nominal_gdp_growth_percent: r['nominal_gdp_growth_percent'] as number,
      gdp_deflator_growth_percent: r['gdp_deflator_growth_percent'] as number,
    }));
}

/**
 * WEO-period macrofiscal input for `interestRateCountry` and `baselineCountry`.
 *
 * Fiscal aggregates come from the fiscal golden master, `nominal_gdp` from baseline_v1,
 * and `interest_rate_percent` from the interest_rate golden master — all pass-through
 * historical values, not engine-derived ones.
 */
export function macroForFiscalInput(): MacroFiscalRow[] {
  const fiscalWeo = gmFiscal().filter((r) => (r['years'] as number) <= WEO_MAX_YEAR);
  const bv1ByYear = new Map(gmBaselineV1().map((r) => [r['years'] as number, r]));
  const irByYear = new Map(gmInterestRate().map((r) => [r['years'] as number, r]));

  return fiscalWeo.map((r) => {
    const year = r['years'] as number;
    return {
      iso3c: ISO3C,
      country: COUNTRY,
      years: year,
      revenue: r['revenue'] as number,
      revenue_percent_gdp: r['revenue_percent_gdp'] as number,
      primary_expenditure: r['primary_expenditure'] as number,
      primary_expenditure_percent_gdp: r['primary_expenditure_percent_gdp'] as number,
      primary_balance: r['primary_balance'] as number,
      primary_balance_percent_gdp: r['primary_balance_percent_gdp'] as number,
      interest_expenditure: r['interest_expenditure'] as number,
      interest_expenditure_percent_gdp: r['interest_expenditure_percent_gdp'] as number,
      total_expenditure: r['total_expenditure'] as number,
      overall_balance: r['overall_balance'] as number,
      overall_balance_percent_gdp: r['overall_balance_percent_gdp'] as number,
      debt_to_gdp: r['debt_to_gdp'] as number,
      debt: r['debt'] as number,
      nominal_gdp: bv1ByYear.get(year)!['nominal_gdp'] as number,
      interest_rate_percent: irByYear.get(year)!['nominal_interest_rate'] as number,
    };
  });
}

/** Macrofiscal input for the interest-rate module (only `interest_rate_percent` is read). */
export function macroForInterestInput(): MacroFiscalRow[] {
  return macroForFiscalInput();
}

/**
 * Climate variation derived from the scenario golden master:
 * `variation(t) = climate_prod(t) - baseline_prod(t)`, zero through WEO_MAX_YEAR.
 */
export function climateVariationFromGolden(filePrefix: string): ClimateVariationRow[] {
  const bv1 = gmBaselineV1();
  const scn = gmClimate(filePrefix);
  const ys = years(bv1);
  return ys.map((year, i) => ({
    years: year,
    climate_variation:
      year <= WEO_MAX_YEAR
        ? 0.0
        : (scn[i]!['labour_productivity_growth'] as number) -
          (bv1[i]!['labour_productivity_growth'] as number),
  }));
}
