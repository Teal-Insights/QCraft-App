/**
 * Parity for the growth widget.
 *
 * Expected values come from the engine's own golden master, loaded from CSV,
 * never hard-coded (CLAUDE.md, review rule 1). The claim is exact equality on
 * every projection year, not a tolerance band: the widget runs the engine's
 * formulas, so anything short of floating-point noise means it has drifted.
 *
 * Note the parameter set. The Uganda golden masters were generated at
 * inflation_start = 3.5, not the 5.0 that constants.py and SHARED/engine-api.md
 * publish as the default. That disagreement is written up in
 * .change-requests/INFLATION-DEFAULT-2026-08-26.md. The test pins the model
 * against the parameters the fixtures actually represent; the widget opens on
 * the published default. Loosening the tolerance to make one set of numbers
 * cover both would have hidden the discrepancy.
 */

import { describe, expect, it } from 'vitest';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { num, parseCsv } from '../src/engine/csv';
import {
  DEMOGRAPHY_VARIANTS,
  GROWTH_DEFAULTS,
  WEO_MAX_YEAR,
  YEAR_END,
  growthPath,
} from '../src/widgets/models/growthPath';

const INTERMEDIATE = '../../../packages/qcraft-engine/tests/golden_masters/intermediate/';

const readMaster = (path: string) =>
  parseCsv(readFileSync(fileURLToPath(new URL(INTERMEDIATE + path, import.meta.url)), 'utf8'));

const GOLDEN = new Map(readMaster('baseline_v1/uganda.csv').map((row) => [num(row, 'years'), row]));

/** The parameters the Uganda fixtures were computed at. See the header note. */
const FIXTURE_PARAMS = { ...GROWTH_DEFAULTS, inflationStart: 3.5 };

describe('growthPath', () => {
  it('reproduces the baseline_v1 golden master on every projection year', () => {
    const path = growthPath(FIXTURE_PARAMS);
    expect(path).toHaveLength(YEAR_END - WEO_MAX_YEAR);

    for (const year of path) {
      const golden = GOLDEN.get(year.year);
      expect(golden, `no golden row for ${year.year}`).toBeDefined();
      expect(year.employment).toBeCloseTo(num(golden!, 'employment_growth'), 10);
      expect(year.productivity).toBeCloseTo(
        num(golden!, 'labour_productivity_growth'),
        10,
      );
      expect(year.inflation).toBeCloseTo(num(golden!, 'gdp_deflator_growth_percent'), 10);
      expect(year.realGrowth).toBeCloseTo(num(golden!, 'real_gdp_growth_percent'), 10);
      expect(year.nominalGrowth).toBeCloseTo(
        num(golden!, 'nominal_gdp_growth_percent'),
        10,
      );
    }
  });

  it('takes its Medium employment path from the demography golden master', () => {
    const wap = new Map(
      readMaster('demography/uganda.csv').map((row) => [
        num(row, 'years'),
        num(row, 'working_age_population'),
      ]),
    );
    for (const year of growthPath(FIXTURE_PARAMS)) {
      const expected = (wap.get(year.year)! / wap.get(year.year - 1)! - 1) * 100;
      expect(year.employment).toBeCloseTo(expected, 10);
    }
  });

  it('stacks without a gap: the bands and the compounding term sum to the total', () => {
    for (const variant of DEMOGRAPHY_VARIANTS) {
      for (const year of growthPath({ ...GROWTH_DEFAULTS, demographyVariant: variant })) {
        const stacked =
          year.employment + year.productivity + year.inflation + year.compounding;
        expect(stacked).toBeCloseTo(year.nominalGrowth, 10);
      }
    }
  });

  it('has compounding strictly positive whenever all three rates are positive', () => {
    for (const year of growthPath(GROWTH_DEFAULTS)) {
      if (year.employment > 0 && year.productivity > 0 && year.inflation > 0) {
        expect(year.compounding).toBeGreaterThan(0);
      }
    }
  });

  it('separates the three UN WPP variants, and only after the near term', () => {
    const [medium, high, low] = DEMOGRAPHY_VARIANTS.map((variant) =>
      growthPath({ ...GROWTH_DEFAULTS, demographyVariant: variant }),
    );
    const at = (path: typeof medium, year: number) =>
      path.find((row) => row.year === year)!.employment;

    // The cohorts already born are common to all three variants.
    expect(at(high, 2035)).toBeCloseTo(at(low, 2035), 10);
    // By the end of the century the fertility assumptions have fully separated.
    expect(at(high, 2099)).toBeGreaterThan(at(medium, 2099));
    expect(at(medium, 2099)).toBeGreaterThan(at(low, 2099));
    expect(at(low, 2099)).toBeLessThan(0);
  });

  it('converges productivity to the long-run slider value', () => {
    const path = growthPath({ ...GROWTH_DEFAULTS, productivityEnd: 2.4 });
    expect(path[path.length - 1].productivity).toBeCloseTo(2.4, 6);
  });
});
