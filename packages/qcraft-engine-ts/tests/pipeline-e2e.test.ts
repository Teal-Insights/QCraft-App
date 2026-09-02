/**
 * End-to-end pipeline parity: real data path, no reconstructed fixtures.
 *
 * `golden-masters.test.ts` feeds each module inputs rebuilt from the golden masters. This
 * file instead runs `runPipeline` on `tests/fixtures/UGA.json` — the actual export of
 * `data/processed/*.parquet` — and checks the result against the same frozen fixtures. It
 * therefore covers the input-shaping layer (`buildMacroForFiscal` and friends) that the
 * per-module suites bypass.
 *
 * Parameters below are the ones that produced the fixtures (see `test_fiscal.py`:
 * `debt_target=60`, `fiscal_rule="Yes"`; `test_inflation.py`: inflation 3.5/3.5), NOT the
 * app's `DEFAULTS`.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

import { runPipeline, type CountryInput, type PipelineParams } from '../src/index.js';
import { compareFrame } from './helpers/compare.js';
import { writeParitySummary } from './helpers/parityRecorder.js';
import { assertSeriesClose } from './helpers/tolerance.js';
import * as TOL from './helpers/tolerances.js';
import {
  REPO_ROOT,
  SCENARIOS,
  gmBaselineV1,
  gmClimate,
  gmDemography,
  gmFiscal,
  gmInflation,
  gmInterestRate,
} from './helpers/goldenMasters.js';

const FIXTURE = join(import.meta.dirname, 'fixtures', 'UGA.json');

/** The parameter set the Uganda golden masters were generated with. */
const GOLDEN_PARAMS: PipelineParams = {
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

const input = JSON.parse(readFileSync(FIXTURE, 'utf8')) as CountryInput;
const result = runPipeline(input, GOLDEN_PARAMS);

/** UN WPP runs to 2100, so demography carries one row past the 2099 engine horizon. */
const toHorizon = <T extends { years: number }>(rows: readonly T[]): T[] =>
  rows.filter((r) => r.years <= 2099);

describe('runPipeline on exported parquet data', () => {
  it('produces 91 projection years per module', () => {
    expect(result.baseline_v1).toHaveLength(91);
    expect(result.fiscal).toHaveLength(91);
    expect(result.interest_rate).toHaveLength(91);
    for (const scenario of SCENARIOS) {
      expect(result.climate[scenario.key]).toHaveLength(91);
    }
  });

  it('emits every climate scenario key', () => {
    expect(Object.keys(result.climate).sort()).toEqual(SCENARIOS.map((s) => s.key).sort());
  });
});

describe('baseline chain matches the golden masters end-to-end', () => {
  it('demography', () => {
    compareFrame('e2e/demography', toHorizon(result.demography), gmDemography(), TOL.DEMOGRAPHY, 'e2e');
  });

  it('inflation', () => {
    compareFrame('e2e/inflation', result.inflation, gmInflation(), TOL.INFLATION, 'e2e');
  });

  it('baseline_v1', () => {
    compareFrame('e2e/baseline_v1', result.baseline_v1, gmBaselineV1(), TOL.BASELINE_V1, 'e2e');
  });

  it('interest_rate', () => {
    compareFrame('e2e/interest_rate', result.interest_rate, gmInterestRate(), TOL.INTEREST_RATE, 'e2e');
  });

  it('fiscal', () => {
    compareFrame('e2e/fiscal', result.fiscal, gmFiscal(), TOL.FISCAL, 'e2e');
  });
});

describe('climate scenarios end-to-end', () => {
  /**
   * A full parity assertion, on the same per-column tolerances as the baseline chain.
   *
   * Until 2026-08-27 this was a loose 2.5 pp drift bound, because both engines derived
   * the productivity shock as an arithmetic FIRST DIFFERENCE of the GDP-loss index while
   * the fixtures carry a growth rate. The shock is added to labour productivity growth,
   * so it has to be a percent change of the index; correcting that in
   * `buildClimateVariation` collapsed the worst-case gap from 2.33 pp to fixture parity.
   * See `.change-requests/climate-variation-2026-08-26.md`.
   */
  it.each(SCENARIOS.map((s) => [s.key, s.file] as const))(
    '%s matches the golden masters end-to-end',
    (key, file) => {
      compareFrame(`e2e/climate/${key}`, result.climate[key]!, gmClimate(file), TOL.CLIMATE, 'e2e');
    },
  );

  it('preserves the scenario ordering the contract pins', () => {
    // Mirrors test_golden_masters.py::test_climate_debt_ordering_end_of_period.
    const last = (rows: readonly { debt_to_gdp: number }[]): number => rows.at(-1)!.debt_to_gdp;
    const hot = last(result.climate['Hot']!);
    const hotUnadapted = last(result.climate['Hot_Unadapted']!);
    const baseline = result.fiscal.at(-1)!.debt_to_gdp;

    expect(hotUnadapted).toBeGreaterThan(hot);
    expect(hot).toBeGreaterThan(baseline);
  });

  it('applies no debt floor, unlike the baseline (domain rule #3)', () => {
    expect(result.fiscal.every((r) => r.debt_to_gdp >= 0)).toBe(true);
    // Uganda never goes negative, so assert the absence of clamping structurally: a
    // clamped series would be flat at exactly 0 somewhere it should have gone below.
    for (const scenario of SCENARIOS) {
      expect(result.climate[scenario.key]!.some((r) => r.debt_to_gdp === 0)).toBe(false);
    }
  });
});

describe('parameter plumbing', () => {
  it('fiscal_rule="No" changes the projection', () => {
    const noRule = runPipeline(input, { ...GOLDEN_PARAMS, fiscal_rule: 'No' });
    expect(noRule.fiscal.at(-1)!.debt_to_gdp).not.toBeCloseTo(
      result.fiscal.at(-1)!.debt_to_gdp,
      6,
    );
  });

  it('rigidity=0.0 holds expenditure at the baseline GDP share', () => {
    const flexible = runPipeline(input, { ...GOLDEN_PARAMS, expenditure_rigidity: 0.0 });
    const proj = flexible.climate['Hot']!.filter((r) => r.years >= 2030);
    const baselinePct = new Map(result.fiscal.map((r) => [r.years, r.primary_expenditure_percent_gdp]));
    assertSeriesClose(
      'rigidity=0 primary_expenditure_percent_gdp',
      proj.map((r) => r.primary_expenditure_percent_gdp),
      proj.map((r) => baselinePct.get(r.years)!),
      { absTol: 1e-9 },
    );
  });

  it('each interest-rate mode produces a distinct projection', () => {
    const modes = [
      'Nominal interest rate',
      'Interest-growth differential',
      'Real interest rate',
    ] as const;
    const rates2099 = modes.map(
      (m) => runPipeline(input, { ...GOLDEN_PARAMS, interest_rate_mode: m })
        .interest_rate.at(-1)!.nominal_interest_rate,
    );
    expect(new Set(rates2099.map((r) => r.toFixed(6))).size).toBe(3);
  });
});

afterAll(() => {
  // Vitest isolates modules per file, so this recorder is separate from the one in
  // golden-masters.test.ts and gets its own summary.
  writeParitySummary(
    join(REPO_ROOT, 'packages', 'qcraft-engine-ts', 'artifacts', 'parity-summary-e2e.json'),
    join(REPO_ROOT, 'packages', 'qcraft-engine-ts', 'artifacts', 'parity-summary-e2e.md'),
    {
      contract: 'packages/qcraft-engine/tests/golden_masters',
      path: 'runPipeline on tests/fixtures/UGA.json (exported from data/processed/*.parquet)',
      countries: ['Uganda'],
      note: 'Baseline chain only; climate scenarios are held to a regression bound, see .change-requests/climate-variation-2026-08-26.md',
    },
  );
});
