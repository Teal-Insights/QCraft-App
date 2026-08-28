/**
 * Multi-country parity against the Excel-derived golden masters.
 *
 * `verification-logs/golden-masters/<ISO3>.csv` holds 147 countries the Python engine was
 * verified against the IMF Q-CRAFT workbook v10 (see `verification-logs/PARITY_REPORT.md`,
 * "147/147 PARITY_PASS"). This script re-runs that comparison through the TypeScript
 * engine, reusing the metric mapping, parameters and thresholds from
 * `scripts/verify/phase2_breadth.py` verbatim.
 *
 * It is NOT part of `npm test`: it needs per-country JSON exported from the Parquet data,
 * which is not in the repo. Run:
 *
 *   uv run --with polars --with pyarrow python scripts/export_country_json.py \
 *       --all --out-dir /tmp/qcraft-country-json
 *   npx vite-node scripts/excel-parity.ts -- /tmp/qcraft-country-json
 */

import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename, join } from 'node:path';

import { runPipeline, type CountryInput, type PipelineParams } from '../src/index.js';
import { readCsv } from '../tests/helpers/csv.js';
import { REPO_ROOT } from '../tests/helpers/goldenMasters.js';

/** `excel_defaults` from verification-logs/phase0_config.json. Note debt_target 60, not the app's 50. */
const EXCEL_DEFAULTS: PipelineParams = {
  demography_variant: 'Medium',
  productivity_start: 5,
  productivity_end: 1.2,
  inflation_start: 3.5,
  inflation_end: 3.5,
  interest_rate_mode: 'Nominal interest rate',
  debt_target: 60,
  fiscal_rule: 'Yes',
  expenditure_rigidity: 1,
};

/** METRIC_TO_ENGINE from phase2_breadth.py. */
const RATIO_METRICS = {
  debt_to_gdp: 'fiscal',
  revenue_percent_gdp: 'fiscal',
  primary_expenditure_percent_gdp: 'fiscal',
  primary_balance_percent_gdp: 'fiscal',
  overall_balance_percent_gdp: 'fiscal',
  interest_expenditure_percent_gdp: 'fiscal',
} as const;

const LEVEL_METRICS = {
  nominal_gdp: 'baseline_v1',
  real_gdp_growth_percent: 'baseline_v1',
  nominal_interest_rate: 'interest_rate',
} as const;

/** Thresholds from phase2_breadth.py: pp for ratios, relative for levels. */
const FAIL_PP = 0.5;
const REVIEW_PP = 0.1;
const LEVEL_REL = 0.001;

interface CountryResult {
  iso3c: string;
  status: 'PARITY_PASS' | 'PARITY_REVIEW' | 'PARITY_FAIL' | 'ENGINE_ERROR';
  worstDiff: number;
  worstMetric: string | null;
  worstYear: number | null;
  levelWarnings: number;
  comparisons: number;
  error?: string;
}

function main(): void {
  const jsonDir = process.argv[2] ?? '/tmp/qcraft-country-json';
  const goldenDir = join(REPO_ROOT, 'verification-logs', 'golden-masters');

  if (!existsSync(jsonDir)) {
    console.error(`Country JSON directory not found: ${jsonDir}`);
    console.error('Export it first with scripts/export_country_json.py --all');
    process.exit(2);
  }

  const isoCodes = readdirSync(goldenDir)
    .filter((f) => f.endsWith('.csv'))
    .map((f) => basename(f, '.csv'))
    .sort();

  // Worst deviation per metric across every country, for the parity summary table.
  const perMetric = new Map<string, { max: number; iso: string; year: number; n: number }>();
  const results: CountryResult[] = [];

  for (const iso3c of isoCodes) {
    const jsonPath = join(jsonDir, `${iso3c}.json`);
    if (!existsSync(jsonPath)) {
      results.push({
        iso3c, status: 'ENGINE_ERROR', worstDiff: 0, worstMetric: null, worstYear: null,
        levelWarnings: 0, comparisons: 0, error: 'no exported JSON (not in all 4 datasets)',
      });
      continue;
    }

    let engine;
    try {
      const input = JSON.parse(readFileSync(jsonPath, 'utf8')) as CountryInput;
      engine = runPipeline(input, EXCEL_DEFAULTS);
    } catch (err) {
      results.push({
        iso3c, status: 'ENGINE_ERROR', worstDiff: 0, worstMetric: null, worstYear: null,
        levelWarnings: 0, comparisons: 0, error: err instanceof Error ? err.message : String(err),
      });
      continue;
    }

    const byYear = {
      fiscal: new Map(engine.fiscal.map((r) => [r.years, r as unknown as Record<string, number>])),
      baseline_v1: new Map(engine.baseline_v1.map((r) => [r.years, r as unknown as Record<string, number>])),
      interest_rate: new Map(engine.interest_rate.map((r) => [r.years, r as unknown as Record<string, number>])),
    };

    let worstDiff = 0;
    let worstMetric: string | null = null;
    let worstYear: number | null = null;
    let levelWarnings = 0;
    let comparisons = 0;
    let anyFail = false;
    let anyReview = false;

    for (const row of readCsv(join(goldenDir, `${iso3c}.csv`))) {
      if (row['scenario'] !== 'Baseline') continue;
      const year = row['year'];
      if (typeof year !== 'number' || year < 2030 || year > 2099) continue;

      for (const [metric, table] of Object.entries(RATIO_METRICS)) {
        const excel = row[metric];
        if (typeof excel !== 'number') continue;
        const engineRow = byYear[table as keyof typeof byYear].get(year);
        const value = engineRow?.[metric];
        if (typeof value !== 'number' || !Number.isFinite(value)) continue;

        comparisons += 1;
        const diff = Math.abs(excel - value);
        if (diff > worstDiff) { worstDiff = diff; worstMetric = metric; worstYear = year; }
        if (diff > FAIL_PP) anyFail = true;
        else if (diff > REVIEW_PP) anyReview = true;

        const prev = perMetric.get(metric);
        if (!prev || diff > prev.max) perMetric.set(metric, { max: diff, iso: iso3c, year, n: (prev?.n ?? 0) + 1 });
        else prev.n += 1;
      }

      for (const [metric, table] of Object.entries(LEVEL_METRICS)) {
        const excel = row[metric];
        if (typeof excel !== 'number') continue;
        const engineRow = byYear[table as keyof typeof byYear].get(year);
        const value = engineRow?.[metric];
        if (typeof value !== 'number' || !Number.isFinite(value)) continue;

        comparisons += 1;
        const diff = Math.abs(excel - value);
        const denom = Math.max(Math.abs(excel), Math.abs(value), 1e-9);
        if (diff / denom > LEVEL_REL) levelWarnings += 1;

        const key = `${metric} (relative)`;
        const rel = diff / denom;
        const prev = perMetric.get(key);
        if (!prev || rel > prev.max) perMetric.set(key, { max: rel, iso: iso3c, year, n: (prev?.n ?? 0) + 1 });
        else prev.n += 1;
      }
    }

    const status = anyFail
      ? 'PARITY_FAIL'
      : anyReview || levelWarnings > 0
        ? 'PARITY_REVIEW'
        : 'PARITY_PASS';

    results.push({ iso3c, status, worstDiff, worstMetric, worstYear, levelWarnings, comparisons });
  }

  const tally = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`\nCountries in verification-logs/golden-masters: ${isoCodes.length}`);
  for (const [status, count] of Object.entries(tally).sort()) console.log(`  ${status.padEnd(14)} ${count}`);
  console.log(`  total comparisons: ${results.reduce((a, r) => a + r.comparisons, 0)}`);

  const notPass = results.filter((r) => r.status !== 'PARITY_PASS');
  if (notPass.length > 0) {
    console.log('\nNot PARITY_PASS:');
    for (const r of notPass) {
      console.log(`  ${r.iso3c}  ${r.status.padEnd(14)} worst=${r.worstDiff.toFixed(6)}pp ` +
        `${r.worstMetric ?? ''}@${r.worstYear ?? ''} levelWarn=${r.levelWarnings}${r.error ? `  ${r.error}` : ''}`);
    }
  }

  console.log('\nWorst deviation per metric across all countries:');
  const metricRows = [...perMetric.entries()].sort((a, b) => b[1].max - a[1].max);
  for (const [metric, s] of metricRows) {
    console.log(`  ${metric.padEnd(38)} ${s.max.toExponential(3)}  (${s.iso}@${s.year}, n=${s.n})`);
  }

  const outDir = join(REPO_ROOT, 'packages', 'qcraft-engine-ts', 'artifacts');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, 'excel-parity.json'),
    `${JSON.stringify({ params: EXCEL_DEFAULTS, tally, results, perMetric: Object.fromEntries(perMetric) }, null, 2)}\n`,
    'utf8',
  );
  console.log(`\nWrote ${join(outDir, 'excel-parity.json')}`);

  process.exit(results.some((r) => r.status === 'PARITY_FAIL') ? 1 : 0);
}

main();
