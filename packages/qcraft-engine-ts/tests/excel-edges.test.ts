/**
 * Excel golden masters for the parameter paths the 2026-09-02 audit found untested.
 *
 * Each CSV in `packages/qcraft-engine/tests/golden_masters/excel_edges/` was read out of
 * Microsoft Excel running the IMF Q-CRAFT workbook v1.0 (11-15-2024) with the Dashboard
 * cells named in the README beside it (`scripts/verify/excel_edges.py` wrote them). The
 * engine runs on the same country's frozen weo-2024-10 payload with the matching
 * parameters and every metric the workbook exposes is compared year by year, 2030 to
 * 2099, for the baseline and the six scenarios.
 *
 * Expected values come only from the CSVs (AGENTS.md review rule 1). Tolerances are the
 * ones the 147-country breadth run met. CC-26, audit A findings F1, F3, F5 and F7.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { runPipeline, type CountryInput, type PipelineParams } from '../src/index.js';
import { readCsv, type CsvRow } from './helpers/csv.js';
import { GOLDEN_DIR } from './helpers/goldenMasters.js';

const EDGES = join(GOLDEN_DIR, 'excel_edges');
const FIXTURES = join(import.meta.dirname, 'fixtures');

const EXCEL_DEFAULTS: PipelineParams = {
  demography_variant: 'Medium',
  productivity_start: 5.0,
  productivity_end: 1.2,
  inflation_start: 3.5,
  inflation_end: 3.5,
  interest_rate_mode: 'Nominal interest rate',
  long_run_interest_rate: 1.0,
  productivity_turning_point: 15,
  debt_target: 60.0,
  fiscal_rule: 'Yes',
  expenditure_rigidity: 1.0,
};

/** label -> [iso3c, overrides]. Mirrors CASES in scripts/verify/excel_edges.py. */
const CASES: Record<string, [string, Partial<PipelineParams>]> = {
  real_rate_2p5: ['UGA', { interest_rate_mode: 'Real interest rate', long_run_interest_rate: 2.5 }],
  turning_point_10: ['UGA', { productivity_turning_point: 10 }],
  target_0_rule_yes: ['UGA', { debt_target: 0.0, fiscal_rule: 'Yes' }],
  floor_bound_rule_yes: ['MOZ', { debt_target: 5.0, fiscal_rule: 'Yes' }],
  floor_bound_rule_no: ['ARE', { fiscal_rule: 'No', debt_target: 0.0 }],
  igd_mode: ['UGA', { interest_rate_mode: 'Interest-growth differential' }],
  rigidity_0: ['UGA', { expenditure_rigidity: 0.0 }],
};

const SCENARIOS = ['Paris', 'Moderate', 'Hot', 'Hot_Adapted', 'Hot_Unadapted', 'High'];
const RATIOS = [
  'debt_to_gdp',
  'revenue_percent_gdp',
  'primary_expenditure_percent_gdp',
  'primary_balance_percent_gdp',
  'overall_balance_percent_gdp',
  'interest_expenditure_percent_gdp',
] as const;
const ABS_PP = 1e-6;
const REL_LEVEL = 1e-9;

const loadInput = (iso3c: string): CountryInput =>
  JSON.parse(readFileSync(join(FIXTURES, `${iso3c}.json`), 'utf8')) as CountryInput;

const golden = (label: string): CsvRow[] => readCsv(join(EDGES, `${label}.csv`));

function close(a: number, b: number, absTol: number, relTol: number): boolean {
  return Math.abs(a - b) <= Math.max(absTol, relTol * Math.max(Math.abs(a), Math.abs(b)));
}

/** Compare one Excel column against one engine column over 2030 to 2099. */
function compare(
  gold: CsvRow[],
  rows: ReadonlyArray<object>,
  excelCol: string,
  engineCol: string,
  absTol: number,
  relTol: number,
  where: string,
): void {
  if (!gold.some((r) => r[excelCol] !== null && r[excelCol] !== '')) return;
  const byYear = new Map(
    (rows as ReadonlyArray<Record<string, unknown>>).map((r) => [Number(r['years']), r]),
  );
  const bad: string[] = [];
  for (const g of gold) {
    const year = Number(g['year']);
    const expected = g[excelCol];
    if (expected === null || expected === '') continue;
    const actual = Number(byYear.get(year)?.[engineCol]);
    if (!close(Number(expected), actual, absTol, relTol)) {
      bad.push(`${where} ${excelCol} ${year}: excel=${expected} engine=${actual}`);
    }
  }
  expect(bad, bad.slice(0, 8).join('\n')).toEqual([]);
}

for (const [label, [iso3c, overrides]] of Object.entries(CASES)) {
  const path = join(EDGES, `${label}.csv`);
  // The describe body runs at collection time even when skipped, so the CSV
  // and the engine run are loaded lazily, once, on first use.
  let cache: { result: ReturnType<typeof runPipeline>; all: CsvRow[] } | null = null;
  const load = () => {
    cache ??= {
      result: runPipeline(loadInput(iso3c), { ...EXCEL_DEFAULTS, ...overrides }),
      all: golden(label),
    };
    return cache;
  };
  describe.skipIf(!existsSync(path))(`Excel edge golden master: ${label}`, () => {

    it('reproduces the Baseline sheet', () => {
      const { result, all } = load();
      const gold = all.filter((r) => r['scenario'] === 'Baseline');
      expect(gold).toHaveLength(70);
      for (const m of RATIOS) compare(gold, result.fiscal, m, m, ABS_PP, 0, `${label} Baseline`);
      compare(gold, result.baseline_v1, 'nominal_gdp', 'nominal_gdp', 0, REL_LEVEL, label);
      compare(gold, result.baseline_v1, 'real_gdp', 'real_gdp', 0, REL_LEVEL, label);
      compare(gold, result.baseline_v1, 'real_gdp_growth_percent', 'real_gdp_growth_percent', ABS_PP, 0, label);
      compare(gold, result.baseline_v1, 'nominal_gdp_growth_percent', 'nominal_gdp_growth_percent', ABS_PP, 0, label);
      compare(gold, result.baseline_v1, 'productivity_growth_percent', 'labour_productivity_growth', ABS_PP, 0, label);
      compare(gold, result.interest_rate, 'nominal_interest_rate', 'nominal_interest_rate', ABS_PP, 0, label);
    });

    for (const scenario of SCENARIOS) {
      it(`reproduces the ${scenario} sheet`, () => {
        const { result, all } = load();
        const gold = all.filter((r) => r['scenario'] === scenario);
        expect(gold).toHaveLength(70);
        const rows = result.climate[scenario]!;
        for (const m of RATIOS) compare(gold, rows, m, m, ABS_PP, 0, `${label} ${scenario}`);
        compare(gold, rows, 'nominal_gdp', 'nominal_gdp', 0, REL_LEVEL, `${label} ${scenario}`);
        compare(gold, rows, 'real_gdp', 'real_gdp', 0, REL_LEVEL, `${label} ${scenario}`);
        compare(gold, rows, 'real_gdp_growth_percent', 'real_gdp_growth_percent', ABS_PP, 0, `${label} ${scenario}`);
        compare(gold, rows, 'nominal_gdp_growth_percent', 'nominal_gdp_growth_percent', ABS_PP, 0, `${label} ${scenario}`);
      });
    }
  });
}
