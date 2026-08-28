/**
 * Adapter tests: Lane 3's columnar per-country JSON must drive the engine to exactly the
 * same numbers as this lane's row-oriented export.
 *
 * The columnar input here is derived FROM the committed row fixture rather than vendored
 * from Lane 3, so the test is self-contained and cannot drift when Lane 3 re-exports.
 * It checks the mapping, not Lane 3's file.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  fromColumnarCountryInput,
  hasOecdSeries,
  runPipeline,
  type ColumnarCountryInput,
  type CountryInput,
  type PipelineParams,
  type ProductivityInputRow,
} from '../src/index.js';

const rowInput = JSON.parse(
  readFileSync(join(import.meta.dirname, 'fixtures', 'UGA.json'), 'utf8'),
) as CountryInput;

const PARAMS: PipelineParams = {
  demography_variant: 'Medium',
  productivity_start: 5.0,
  productivity_end: 1.2,
  inflation_start: 3.5,
  inflation_end: 3.5,
  interest_rate_mode: 'Nominal interest rate',
  debt_target: 60.0,
  fiscal_rule: 'Yes',
  expenditure_rigidity: 1.0,
};

/** Pivot the row fixture into the columnar shape Lane 3 emits. */
function toColumnar(input: CountryInput): ColumnarCountryInput {
  const macroYears = input.macrofiscal.map((r) => r.years);
  const macrofiscal: Record<string, unknown> = { years: macroYears };
  for (const column of Object.keys(input.macrofiscal[0]!)) {
    if (column === 'iso3c' || column === 'country' || column === 'years') continue;
    macrofiscal[column] = input.macrofiscal.map(
      (r) => (r as unknown as Record<string, number | null>)[column] ?? null,
    );
  }

  const demoYears = [...new Set(input.demography.map((r) => r.years))].sort((a, b) => a - b);
  const variants: Record<string, Record<string, (number | null)[]>> = {};
  for (const row of input.demography) {
    (variants[row.status] ??= {})[row.age_group] ??= demoYears.map(() => null);
    variants[row.status]![row.age_group]![demoYears.indexOf(row.years)] = row.values;
  }

  const own = input.productivity.filter((r) => r.iso3c === input.iso3c);
  const climateYears = [...new Set(input.climate.map((r) => r.years))].sort((a, b) => a - b);
  const scenarios: Record<string, (number | null)[]> = {};
  for (const row of input.climate) {
    (scenarios[row.climate_scenario] ??= climateYears.map(() => null))[
      climateYears.indexOf(row.years)
    ] = row.gdp_loss_percent;
  }

  return {
    iso3c: input.iso3c,
    country: input.country,
    vintage: 'weo-2024-10',
    macrofiscal: macrofiscal as ColumnarCountryInput['macrofiscal'],
    demography: { years: demoYears, variants },
    productivity: {
      years: own.map((r) => r.years),
      productivity_level: own.map((r) => r.productivity_level),
    },
    climate: { years: climateYears, scenarios },
  };
}

const columnar = toColumnar(rowInput);
const oecd: ProductivityInputRow[] = rowInput.productivity.filter((r) => r.iso3c === 'OED');

describe('columnar input adapter', () => {
  it('refuses to run without the OECD series unless waived', () => {
    expect(() => fromColumnarCountryInput(columnar)).toThrow(/OECD productivity series/);
    expect(() =>
      fromColumnarCountryInput(columnar, { allowMissingOecd: true }),
    ).not.toThrow();
  });

  it('reports whether the OECD series is present', () => {
    expect(hasOecdSeries(fromColumnarCountryInput(columnar, { oecdProductivity: oecd }))).toBe(true);
    expect(hasOecdSeries(fromColumnarCountryInput(columnar, { allowMissingOecd: true }))).toBe(false);
  });

  it('drives the pipeline to identical results', () => {
    const fromRows = runPipeline(rowInput, PARAMS);
    const fromColumns = runPipeline(
      fromColumnarCountryInput(columnar, { oecdProductivity: oecd }),
      PARAMS,
    );

    expect(fromColumns.fiscal).toEqual(fromRows.fiscal);
    expect(fromColumns.baseline_v1).toEqual(fromRows.baseline_v1);
    expect(fromColumns.interest_rate).toEqual(fromRows.interest_rate);
    expect(fromColumns.inflation).toEqual(fromRows.inflation);
    expect(fromColumns.productivity).toEqual(fromRows.productivity);
    for (const scenario of Object.keys(fromRows.climate)) {
      expect(fromColumns.climate[scenario]).toEqual(fromRows.climate[scenario]);
    }
  });

  it('without OECD, only productivity_level_oecd_percent degrades', () => {
    const withOecd = runPipeline(
      fromColumnarCountryInput(columnar, { oecdProductivity: oecd }),
      PARAMS,
    );
    const without = runPipeline(
      fromColumnarCountryInput(columnar, { allowMissingOecd: true }),
      PARAMS,
    );

    // The degraded column really is different...
    expect(without.productivity[0]!.productivity_level_oecd_percent).not.toBeCloseTo(
      withOecd.productivity[0]!.productivity_level_oecd_percent,
      6,
    );
    // ...and nothing else moves, because no other module reads it.
    expect(without.fiscal).toEqual(withOecd.fiscal);
    expect(without.baseline_v1).toEqual(withOecd.baseline_v1);
    expect(
      without.productivity.map((r) => r.productivity_growth_rate_percent),
    ).toEqual(withOecd.productivity.map((r) => r.productivity_growth_rate_percent));
  });
});
