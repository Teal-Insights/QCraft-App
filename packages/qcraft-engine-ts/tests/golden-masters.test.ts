/**
 * Golden-master parity sweep — THE CONTRACT.
 *
 * Runs every CSV in `packages/qcraft-engine/tests/golden_masters/` (6 intermediate
 * modules + 6 climate scenarios + the final summary) through the TypeScript engine at
 * the tolerances the pytest suites use. Every expected value is loaded from CSV; none
 * is hard-coded or produced by engine code (AGENTS.md review rule #1).
 *
 * The run also writes `artifacts/parity-summary.{json,md}` — the max-abs-deviation
 * table that MORNING-REPORT.md quotes.
 */

import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

import {
  baselineCountry,
  baselineV1,
  calcClimateScenario,
  demographyCountry,
  inflationCountry,
  interestRateCountry,
  productivityCountry,
} from '../src/index.js';
import { assertNullPositions, compareFrame } from './helpers/compare.js';
import { assertSeriesClose } from './helpers/tolerance.js';
import { record, writeParitySummary } from './helpers/parityRecorder.js';
import * as TOL from './helpers/tolerances.js';
import {
  COUNTRY,
  ISO3C,
  OECD_GROWTH_RATE,
  SCENARIOS,
  baselineV1GoldenAsRows,
  climateVariationFromGolden,
  deflatorInput,
  demographyInput,
  fiscalGoldenAsRows,
  gmBaselineV1,
  gmClimate,
  gmDemography,
  gmFinal,
  gmFiscal,
  gmInflation,
  gmInterestRate,
  gmProductivity,
  demographyGoldenAsRows,
  inflationGoldenAsRows,
  interestRateGoldenAsRows,
  macroForBaselineInput,
  macroForFiscalInput,
  productivityGoldenAsRows,
  productivityInput,
  REPO_ROOT,
} from './helpers/goldenMasters.js';

const EXPECTED_ROWS = 91; // 2009-2099 inclusive

/** Deviations from the final summary are folded into one "final" module row per metric. */
function recordFinal(metric: string, maxAbs: number, year: number): void {
  record('final', metric, maxAbs, 1, TOL.FINAL, String(year));
}

describe('demography golden master', () => {
  const result = demographyCountry(demographyInput(), ISO3C, 'Medium');
  const golden = gmDemography();

  it('spans 2009-2099', () => {
    expect(result).toHaveLength(EXPECTED_ROWS);
    expect(golden).toHaveLength(EXPECTED_ROWS);
    expect(result[0]!.years).toBe(2009);
    expect(result.at(-1)!.years).toBe(2099);
  });

  it('carries metadata for downstream consumers', () => {
    expect(result[0]!.iso3c).toBe(ISO3C);
    expect(result[0]!.country).toBe(COUNTRY);
  });

  it('leaves 2009 growth null rather than zero', () => {
    expect(result[0]!.demography_growth_working_age).toBeNull();
    expect(result[0]!.demography_growth_total).toBeNull();
    // The fixture agrees — this is a contract property, not an engine quirk.
    expect(golden[0]!['demography_growth_working_age']).toBeNull();
  });

  it('matches every column', () => {
    compareFrame('demography', result, golden, TOL.DEMOGRAPHY);
  });

  it('rejects an unknown country', () => {
    expect(() => demographyCountry(demographyInput(), 'ZZZ', 'Medium')).toThrow(/No data found/);
  });
});

describe('productivity golden master', () => {
  const result = productivityCountry(productivityInput(), ISO3C, {
    oecdGrowthRate: OECD_GROWTH_RATE,
  });
  const golden = gmProductivity();

  it('spans 2009-2099', () => {
    expect(result).toHaveLength(EXPECTED_ROWS);
    expect(golden).toHaveLength(EXPECTED_ROWS);
  });

  it('matches every column', () => {
    compareFrame('productivity', result, golden, TOL.PRODUCTIVITY);
  });

  it('uses productivity_start across the WEO window (2022-2029)', () => {
    // Deliberate placeholder: baseline_v1 back-calculates the real value from real GDP
    // growth. The fixture carries Excel's back-calculated series, which is why the
    // sweep skips this window for productivity and covers it under baseline_v1.
    for (const row of result.filter((r) => r.years >= 2022 && r.years <= 2029)) {
      expect(row.productivity_growth_rate_percent).toBeCloseTo(5.0, 10);
    }
  });

  it('WEO-window fixture values are the ones baseline_v1 produces', () => {
    // Guards the claim above: the productivity fixture and the baseline_v1 fixture
    // agree across 2022-2029, so nothing is left unverified by the skip.
    const bv1 = new Map(gmBaselineV1().map((r) => [r['years'] as number, r]));
    for (const row of golden.filter((r) => (r['years'] as number) >= 2022)) {
      expect(bv1.get(row['years'] as number)!['labour_productivity_growth']).toBe(
        row['productivity_growth_rate_percent'],
      );
    }
  });

  it('compounds levels from its own growth rates', () => {
    for (let i = 1; i < result.length; i += 1) {
      const expected = result[i - 1]!.productivity_level * (1 + result[i]!.productivity_growth_rate_percent / 100);
      expect(result[i]!.productivity_level).toBeCloseTo(expected, 10);
    }
  });

  it('rejects an unknown country', () => {
    expect(() => productivityCountry(productivityInput(), 'ZZZ')).toThrow(/No data found/);
  });
});

describe('inflation golden master', () => {
  const result = inflationCountry(deflatorInput(), ISO3C, {
    inflationStart: 3.5,
    inflationEnd: 3.5,
  });
  const golden = gmInflation();

  it('spans 2009-2099', () => {
    expect(result).toHaveLength(EXPECTED_ROWS);
    expect(golden).toHaveLength(EXPECTED_ROWS);
  });

  it('matches every column', () => {
    compareFrame('inflation', result, golden, TOL.INFLATION);
  });

  it('converges monotonically when start > end', () => {
    const proj = inflationCountry(deflatorInput(), ISO3C, {
      inflationStart: 8.0,
      inflationEnd: 2.0,
    }).filter((r) => r.years >= 2030);
    for (let i = 1; i < proj.length; i += 1) {
      expect(proj[i]!.inflation).toBeLessThanOrEqual(proj[i - 1]!.inflation + 1e-10);
    }
    expect(proj.at(-1)!.inflation).toBeCloseTo(2.0, 2);
  });

  it('rejects an unknown country', () => {
    expect(() => inflationCountry(deflatorInput(), 'ZZZ')).toThrow(/No data found/);
  });
});

describe('baseline_v1 golden master', () => {
  const result = baselineV1(
    demographyGoldenAsRows(),
    inflationGoldenAsRows(),
    productivityGoldenAsRows(),
    macroForBaselineInput(),
    ISO3C,
  );
  const golden = gmBaselineV1();

  it('spans 2009-2099 and exposes the golden-master columns plus metadata', () => {
    expect(result).toHaveLength(EXPECTED_ROWS);
    const gmCols = new Set(Object.keys(golden[0]!));
    const resultCols = new Set(Object.keys(result[0]!));
    resultCols.delete('iso3c');
    resultCols.delete('country');
    expect([...resultCols].sort()).toEqual([...gmCols].sort());
  });

  it('matches every column', () => {
    compareFrame('baseline_v1', result, golden, TOL.BASELINE_V1);
  });

  it('rejects an unknown country', () => {
    expect(() =>
      baselineV1(
        demographyGoldenAsRows(),
        inflationGoldenAsRows(),
        productivityGoldenAsRows(),
        macroForBaselineInput(),
        'ZZZ',
      ),
    ).toThrow(/No data found/);
  });
});

describe('interest_rate golden master', () => {
  const result = interestRateCountry(
    baselineV1GoldenAsRows(),
    macroForFiscalInput(),
    ISO3C,
    { selectRate: 'Nominal interest rate', longRunInterestRate: 1.0 },
  );
  const golden = gmInterestRate();

  it('spans 2009-2099 and exposes the golden-master columns plus metadata', () => {
    expect(result).toHaveLength(EXPECTED_ROWS);
    const gmCols = new Set(Object.keys(golden[0]!));
    const resultCols = new Set(Object.keys(result[0]!));
    resultCols.delete('iso3c');
    resultCols.delete('country');
    expect([...resultCols].sort()).toEqual([...gmCols].sort());
  });

  it('matches every column', () => {
    compareFrame('interest_rate', result, golden, TOL.INTEREST_RATE);
  });

  it('rejects an unknown country', () => {
    expect(() =>
      interestRateCountry(baselineV1GoldenAsRows(), macroForFiscalInput(), 'ZZZ'),
    ).toThrow(/No data found/);
  });
});

describe('fiscal golden master', () => {
  const result = baselineCountry(
    baselineV1GoldenAsRows(),
    interestRateGoldenAsRows(),
    macroForFiscalInput(),
    ISO3C,
    { debtTarget: 60.0, fiscalRule: 'Yes' },
  );
  const golden = gmFiscal();

  it('spans 2009-2099 and exposes exactly the golden-master columns', () => {
    expect(result).toHaveLength(EXPECTED_ROWS);
    expect(Object.keys(result[0]!).sort()).toEqual(Object.keys(golden[0]!).sort());
  });

  it('matches every column', () => {
    compareFrame('fiscal', result, golden, TOL.FISCAL);
  });

  it('places fiscal_gap and DSPB nulls exactly where the fixture does', () => {
    assertNullPositions('fiscal', result, golden, 'fiscal_gap');
    assertNullPositions('fiscal', result, golden, 'debt_stabilizing_primary_balance');
    expect(result[0]!.debt_stabilizing_primary_balance).toBeNull();
  });

  it('applies the baseline debt floor (domain rule #3)', () => {
    expect(result.every((r) => r.debt_to_gdp >= 0)).toBe(true);
  });

  it('rejects an unknown country', () => {
    expect(() =>
      baselineCountry(
        baselineV1GoldenAsRows(),
        interestRateGoldenAsRows(),
        macroForFiscalInput(),
        'ZZZ',
        { debtTarget: 60.0, fiscalRule: 'Yes' },
      ),
    ).toThrow(/No data found/);
  });
});

describe('climate golden masters', () => {
  const runScenario = (file: string, rigidity = 1.0) =>
    calcClimateScenario(
      fiscalGoldenAsRows(),
      baselineV1GoldenAsRows(),
      interestRateGoldenAsRows(),
      climateVariationFromGolden(file),
      { expenditureRigidity: rigidity, dataRisk: null },
    );

  it.each(SCENARIOS.map((s) => [s.key, s.file] as const))(
    '%s matches every column',
    (key, file) => {
      const result = runScenario(file);
      const golden = gmClimate(file);
      expect(result).toHaveLength(EXPECTED_ROWS);
      expect(Object.keys(result[0]!).sort()).toEqual(Object.keys(golden[0]!).sort());
      compareFrame(`climate/${key}`, result, golden, TOL.CLIMATE, 'climate');
    },
  );

  it('does NOT apply a debt floor (domain rule #3)', () => {
    // Paris is the fixture the Python suite uses for this; it was produced unclamped.
    const result = runScenario('paris');
    const golden = gmClimate('paris');
    assertSeriesClose(
      'climate/Paris.debt_to_gdp (unclamped)',
      result.map((r) => r.debt_to_gdp),
      golden.map((r) => r['debt_to_gdp'] as number),
      { absTol: 0.001 },
    );
    // Guard against a stray Math.max(0, ...) that the fixture happens to tolerate.
    expect(result.some((r) => r.debt_to_gdp < 0)).toBe(
      golden.some((r) => (r['debt_to_gdp'] as number) < 0),
    );
  });

  it('rigidity 1.0 keeps expenditure at baseline levels (domain rule #4)', () => {
    const result = runScenario('paris', 1.0);
    assertSeriesClose(
      'climate rigidity=1.0 primary_expenditure',
      result.map((r) => r.primary_expenditure),
      gmFiscal().map((r) => r['primary_expenditure'] as number),
      { relTol: 1e-6 },
    );
  });

  it('rigidity 0.0 keeps expenditure at the baseline SHARE of GDP (domain rule #4)', () => {
    const result = runScenario('paris', 0.0);
    const baselinePct = gmFiscal().map((r) => r['primary_expenditure_percent_gdp'] as number);
    const proj = result.filter((r) => r.years >= 2030);
    const expectedPct = baselinePct.slice(result.findIndex((r) => r.years === 2030));
    assertSeriesClose(
      'climate rigidity=0.0 primary_expenditure_percent_gdp',
      proj.map((r) => r.primary_expenditure_percent_gdp),
      expectedPct,
      { absTol: 1e-9 },
    );
  });

  it('keeps employment growth identical to baseline', () => {
    for (const { key, file } of SCENARIOS) {
      const result = runScenario(file);
      assertSeriesClose(
        `climate/${key}.employment_growth`,
        result.map((r) => r.employment_growth),
        baselineV1GoldenAsRows().map((r) => r.employment_growth),
        { absTol: 1e-10 },
      );
    }
  });

  it('keeps revenue_percent_gdp consistent with revenue/GDP under discrete risks', () => {
    const risk = Array.from({ length: 91 }, (_, i) => ({
      years: 2009 + i,
      revenue_risk: 2009 + i >= 2030 ? -0.5 : 0.0,
      expenditure_risk: 0.0,
    }));
    const result = calcClimateScenario(
      fiscalGoldenAsRows(),
      baselineV1GoldenAsRows(),
      interestRateGoldenAsRows(),
      climateVariationFromGolden('paris'),
      { expenditureRigidity: 1.0, dataRisk: risk },
    ).filter((r) => r.years >= 2030);

    assertSeriesClose(
      'climate risk revenue_percent_gdp',
      result.map((r) => r.revenue_percent_gdp),
      result.map((r) => (r.revenue / r.nominal_gdp) * 100),
      { absTol: 1e-10 },
    );
  });
});

describe('final golden master', () => {
  const final = gmFinal();

  const KEY_COLUMNS = [
    'revenue_percent_gdp',
    'primary_expenditure_percent_gdp',
    'primary_balance_percent_gdp',
    'interest_expenditure_percent_gdp',
    'overall_balance_percent_gdp',
    'debt_to_gdp',
  ] as const;

  it('covers Baseline plus all six climate scenarios', () => {
    const labels = new Set(final.map((r) => r['scenario'] as string));
    expect(labels.has('Baseline')).toBe(true);
    for (const { label } of SCENARIOS) expect(labels.has(label)).toBe(true);
  });

  it('Baseline rows match the fiscal module', () => {
    const fiscal = baselineCountry(
      baselineV1GoldenAsRows(),
      interestRateGoldenAsRows(),
      macroForFiscalInput(),
      ISO3C,
      { debtTarget: 60.0, fiscalRule: 'Yes' },
    );
    const byYear = new Map(fiscal.map((r) => [r.years, r]));

    for (const row of final.filter((r) => r['scenario'] === 'Baseline')) {
      const year = row['year'] as number;
      const actual = byYear.get(year)!;
      const a = KEY_COLUMNS.map((c) => actual[c]);
      const e = KEY_COLUMNS.map((c) => row[c] as number);
      assertSeriesClose(`final/Baseline ${year}`, a, e, TOL.FINAL);
      KEY_COLUMNS.forEach((c, i) => {
        recordFinal(c, Math.abs(a[i]! - e[i]!), year);
      });
    }
  });

  it.each(SCENARIOS.map((s) => [s.key, s.file, s.label] as const))(
    '%s rows match the climate module',
    (_key, file, label) => {
      const result = calcClimateScenario(
        fiscalGoldenAsRows(),
        baselineV1GoldenAsRows(),
        interestRateGoldenAsRows(),
        climateVariationFromGolden(file),
        { expenditureRigidity: 1.0, dataRisk: null },
      );
      const byYear = new Map(result.map((r) => [r.years, r]));

      const rows = final.filter((r) => r['scenario'] === label);
      expect(rows.length).toBeGreaterThan(0);

      for (const row of rows) {
        const year = row['year'] as number;
        const actual = byYear.get(year)!;
        const a = KEY_COLUMNS.map((c) => actual[c]);
        const e = KEY_COLUMNS.map((c) => row[c] as number);
        assertSeriesClose(`final/${label} ${year}`, a, e, TOL.FINAL);
        KEY_COLUMNS.forEach((c, i) => {
          recordFinal(c, Math.abs(a[i]! - e[i]!), year);
        });
      }
    },
  );
});

afterAll(() => {
  writeParitySummary(
    join(REPO_ROOT, 'packages', 'qcraft-engine-ts', 'artifacts', 'parity-summary.json'),
    join(REPO_ROOT, 'packages', 'qcraft-engine-ts', 'artifacts', 'parity-summary.md'),
    {
      contract: 'packages/qcraft-engine/tests/golden_masters',
      countries: [COUNTRY],
      note: 'Uganda is the only country present in the frozen golden-master fixtures.',
    },
  );
});
