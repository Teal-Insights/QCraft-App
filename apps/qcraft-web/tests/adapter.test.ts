/**
 * Parity check: the fixture adapter must reproduce the engine's FINAL golden
 * master exactly.
 *
 * The adapter reads the intermediate golden masters (annual resolution, needed
 * to draw lines). `final/uganda.csv` is an independent five-year snapshot of the
 * same run. Asserting one against the other catches the failure this app is most
 * exposed to: a column renamed or reordered upstream, silently changing which
 * number the chart draws.
 *
 * Expected values are loaded from the CSV, never hard-coded (AGENTS.md, "GOLDEN
 * MASTER TESTS").
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { parseCsv, num } from '../src/engine/csv';
import { engine, ENGINE_DEFAULTS, WEO_BOUNDARY_YEAR } from '../src/engine/adapter';
import { formatParam, paramLabel } from '../src/content/params';
import type { FiscalYear, ScenarioKey } from '../src/engine/types';

const FINAL_MASTER = fileURLToPath(
  new URL(
    '../../../packages/qcraft-engine/tests/golden_masters/final/uganda.csv',
    import.meta.url,
  ),
);

/** `scenario` labels as written in final/uganda.csv -> our scenario keys. */
const SCENARIO_BY_MASTER_LABEL: Record<string, ScenarioKey> = {
  Baseline: 'Baseline',
  Paris: 'Paris',
  Moderate: 'Moderate',
  Hot: 'Hot',
  'Hot Adapted': 'Hot_Adapted',
  'Hot Unadapted': 'Hot_Unadapted',
  High: 'High',
};

/** Columns present in both the final master and `FiscalYear`. */
const COMPARED_COLUMNS: Array<keyof FiscalYear> = [
  'revenue_percent_gdp',
  'primary_expenditure_percent_gdp',
  'primary_balance_percent_gdp',
  'interest_expenditure_percent_gdp',
  'overall_balance_percent_gdp',
  'debt_to_gdp',
];

describe('fixture engine adapter', () => {
  const result = engine.run(ENGINE_DEFAULTS);
  const rows = parseCsv(readFileSync(FINAL_MASTER, 'utf8'));

  it('reads a non-empty final golden master', () => {
    expect(rows.length).toBeGreaterThan(0);
  });

  it('matches the final golden master at every snapshot year and scenario', () => {
    for (const row of rows) {
      const key = SCENARIO_BY_MASTER_LABEL[row.scenario];
      expect(key, `unmapped scenario label ${JSON.stringify(row.scenario)}`).toBeDefined();

      const year = num(row, 'year');
      const series = result.scenarios.find((s) => s.key === key);
      expect(series, `adapter is missing scenario ${key}`).toBeDefined();

      const actual = series!.fiscal.find((f) => f.year === year);
      expect(actual, `adapter is missing ${key} ${year}`).toBeDefined();

      for (const column of COMPARED_COLUMNS) {
        // Tolerance covers float round-tripping through CSV text only; these
        // are the same computed values, not an independent re-derivation.
        expect(
          actual![column],
          `${key} ${year} ${column}`,
        ).toBeCloseTo(num(row, column), 9);
      }
    }
  });

  it('serves the baseline and all six climate scenarios at annual resolution', () => {
    // Display order groups the 3C family last, per SHARED/engine-api.md section 7.
    expect(result.scenarios.map((s) => s.key)).toEqual([
      'Baseline',
      'Paris',
      'Moderate',
      'High',
      'Hot_Adapted',
      'Hot',
      'Hot_Unadapted',
    ]);
    for (const series of result.scenarios) {
      // 2009-2099 inclusive.
      expect(series.fiscal.length, series.key).toBe(91);
      expect(series.gdp.length, series.key).toBe(91);
      expect(series.fiscal[0].year).toBe(2009);
      expect(series.fiscal[series.fiscal.length - 1].year).toBe(2099);
    }
  });

  it('projects past the WEO boundary', () => {
    const baseline = result.scenarios[0];
    expect(baseline.fiscal.some((f) => f.year > WEO_BOUNDARY_YEAR)).toBe(true);
  });

  it('reports fixture provenance and flags nothing when run at defaults', () => {
    expect(result.provenance.kind).toBe('fixture');
    expect(result.provenance.ignoredParams).toEqual([]);
  });

  it('records the vintage the golden masters were computed against', () => {
    // weo-2024-10 is the FROZEN verification vintage the masters were built
    // from (SHARED/VINTAGE-TOGGLE.md). The run manifest reports whatever this
    // says, so it must not quietly claim the demo vintage.
    expect(result.provenance.dataVintage).toBe('weo-2024-10');
  });

  it('names every parameter it could not honour, as the registry names it', () => {
    const off = engine.run({
      ...ENGINE_DEFAULTS,
      debt_target: 30,
      fiscal_rule: 'No',
      inflation_end: 2,
    });
    expect(off.provenance.ignoredParams.map((p) => p.label).sort()).toEqual(
      [
        paramLabel('debt_target'),
        paramLabel('fiscal_rule'),
        paramLabel('inflation_end'),
      ].sort(),
    );
    // Requested-vs-used is formatted the same way the sidebar and the manifest
    // format it, so the three never disagree about what a value looks like.
    const debt = off.provenance.ignoredParams.find(
      (p) => p.label === paramLabel('debt_target'),
    );
    expect(debt).toEqual({
      label: paramLabel('debt_target'),
      requested: formatParam('debt_target', 30),
      used: formatParam('debt_target', ENGINE_DEFAULTS.debt_target),
    });
  });
});

describe('engine defaults', () => {
  it('match DEFAULTS in qcraft_engine/constants.py', () => {
    // Guards the sidebar's opening state against silent drift from the engine.
    expect(ENGINE_DEFAULTS).toEqual({
      iso3c: 'UGA',
      demography_variant: 'Medium',
      productivity_start: 5.0,
      productivity_end: 1.2,
      inflation_start: 5.0,
      inflation_end: 3.5,
      interest_rate_mode: 'Nominal interest rate',
      debt_target: 50.0,
      fiscal_rule: 'Yes',
      expenditure_rigidity: 1.0,
    });
  });
});
