/**
 * Tests for the `@qcraft/engine` -> `EngineResult` mapping.
 *
 * The engine package is not in this clone yet, so these build a
 * `PipelineResult`-shaped object out of the golden-master CSVs — the same files
 * the engine's own suite asserts against, per SHARED/engine-api.md ("Contract:
 * packages/qcraft-engine/tests/golden_masters/"). That makes this a real test of
 * the mapping against real engine-shaped rows, and it means the day the package
 * lands the only new risk is the import itself.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { num, parseCsv } from '../src/engine/csv';
import {
  toEngineResult,
  toPipelineParams,
  type PipelineClimateRow,
  type PipelineFiscalRow,
  type PipelineResultLike,
} from '../src/engine/pipelineResult';
import { ENGINE_DEFAULTS } from '../src/engine/adapter';
import { CLIMATE_SCENARIOS } from '../src/engine/types';

const masterPath = (rel: string) =>
  fileURLToPath(
    new URL(`../../../packages/qcraft-engine/tests/golden_masters/${rel}`, import.meta.url),
  );

const readRows = (rel: string) => parseCsv(readFileSync(masterPath(rel), 'utf8'));

/** `Hot_Adapted` -> `hot_adapted_uganda.csv`. */
const climateFile = (key: string) => `intermediate/climate/${key.toLowerCase()}_uganda.csv`;

function fiscalRow(row: Record<string, string>): PipelineFiscalRow {
  return {
    years: num(row, 'years'),
    revenue_percent_gdp: num(row, 'revenue_percent_gdp'),
    primary_expenditure_percent_gdp: num(row, 'primary_expenditure_percent_gdp'),
    primary_balance_percent_gdp: num(row, 'primary_balance_percent_gdp'),
    interest_expenditure_percent_gdp: num(row, 'interest_expenditure_percent_gdp'),
    overall_balance_percent_gdp: num(row, 'overall_balance_percent_gdp'),
    debt_to_gdp: num(row, 'debt_to_gdp'),
  };
}

/** A PipelineResult built from the golden masters the engine is pinned to. */
const pipelineResult: PipelineResultLike = {
  fiscal: readRows('intermediate/fiscal/uganda.csv').map(fiscalRow),
  baseline_v1: readRows('intermediate/baseline_v1/uganda.csv').map((r) => ({
    years: num(r, 'years'),
    real_gdp: num(r, 'real_gdp'),
  })),
  climate: Object.fromEntries(
    CLIMATE_SCENARIOS.map((key) => [
      key,
      readRows(climateFile(key)).map(
        (r): PipelineClimateRow => ({ ...fiscalRow(r), real_gdp: num(r, 'real_gdp') }),
      ),
    ]),
  ),
};

const META = {
  iso3c: 'UGA',
  countryName: 'Uganda',
  weoBoundaryYear: 2029,
  // The golden masters this fixture is built from are the frozen weo-2024-10
  // verification vintage (SHARED/VINTAGE-TOGGLE.md), which is Verified mode.
  dataVintage: 'weo-2024-10',
  mode: 'verified',
} as const;

describe('toEngineResult', () => {
  const mapped = toEngineResult(pipelineResult, META);

  it('emits the baseline plus six scenarios in display order', () => {
    expect(mapped.scenarios.map((s) => s.key)).toEqual([
      'Baseline',
      'Paris',
      'Moderate',
      'High',
      'Hot_Adapted',
      'Hot',
      'Hot_Unadapted',
    ]);
  });

  it('reports engine provenance with nothing ignored', () => {
    // This is what makes the fixture banner disappear without a manual flag.
    expect(mapped.provenance.kind).toBe('engine');
    expect(mapped.provenance.ignoredParams).toEqual([]);
  });

  it('carries fiscal values through unchanged', () => {
    const rows = readRows('intermediate/fiscal/uganda.csv');
    const baseline = mapped.scenarios[0];
    for (const row of rows) {
      const year = num(row, 'years');
      const got = baseline.fiscal.find((f) => f.year === year)!;
      expect(got.debt_to_gdp, `${year}`).toBeCloseTo(num(row, 'debt_to_gdp'), 12);
      expect(got.revenue_percent_gdp, `${year}`).toBeCloseTo(
        num(row, 'revenue_percent_gdp'),
        12,
      );
    }
  });

  it('joins the baseline GDP path from baseline_v1 by year, not by index', () => {
    const rows = readRows('intermediate/baseline_v1/uganda.csv');
    const baseline = mapped.scenarios[0];
    expect(baseline.gdp.length).toBe(rows.length);
    for (const row of rows) {
      const year = num(row, 'years');
      const got = baseline.gdp.find((g) => g.year === year)!;
      expect(got.real_gdp, `${year}`).toBeCloseTo(num(row, 'real_gdp'), 6);
    }
  });

  it('takes each climate scenario GDP from that scenario, not the baseline', () => {
    // A copy/paste slip here would silently flatten the Climate tab to zero
    // deviation, which is exactly the bug that looks like "no climate damage".
    const rows = readRows(climateFile('Hot_Unadapted'));
    const scenario = mapped.scenarios.find((s) => s.key === 'Hot_Unadapted')!;
    for (const row of rows) {
      const year = num(row, 'years');
      const got = scenario.gdp.find((g) => g.year === year)!;
      expect(got.real_gdp, `${year}`).toBeCloseTo(num(row, 'real_gdp'), 6);
    }
    const baselineGdp = mapped.scenarios[0].gdp.find((g) => g.year === 2099)!.real_gdp;
    expect(scenario.gdp.find((g) => g.year === 2099)!.real_gdp).toBeLessThan(baselineGdp);
  });

  it('skips a scenario the engine did not return rather than inventing one', () => {
    const partial = toEngineResult(
      { ...pipelineResult, climate: { Paris: pipelineResult.climate.Paris } },
      META,
    );
    expect(partial.scenarios.map((s) => s.key)).toEqual(['Baseline', 'Paris']);
  });
});

describe('toPipelineParams', () => {
  it('drops iso3c and passes every other key through unchanged', () => {
    // The contract's PipelineParams has no iso3c — the country is selected by
    // which CountryInput is handed to runPipeline.
    const out = toPipelineParams(ENGINE_DEFAULTS);
    expect(out).not.toHaveProperty('iso3c');
    expect(out).toEqual({
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
