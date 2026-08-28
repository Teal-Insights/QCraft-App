/**
 * The context panels are only worth showing if the lines in them are the same
 * numbers the projection rests on. These tests pin every series the panels draw
 * against the engine's golden masters.
 *
 * Per CLAUDE.md domain rule 5 nothing here hard-codes an expected value: every
 * assertion loads its target from a golden-master CSV or from the bundled source
 * data, and the two are compared.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { MODES } from '../src/content/modes';
import { num, parseCsv } from '../src/engine/csv';
import {
  GM_INFLATION,
  GM_NOMINAL_RATE,
  GM_PRODUCTIVITY_GROWTH,
  SOURCES,
  WEO_MAX_YEAR,
  deflatorIndex,
  effectiveRate,
  hasContextData,
  populationLevels,
} from '../src/context/sources';
import {
  YEAR_END,
  inflationAssumption,
  inflationRecord,
  interestRateApproaches,
  pathsAgree,
  productivityAssumption,
  productivityRecord,
  variantGrowth,
  variantsDivergeAfter,
} from '../src/context/model';

const goldenMaster = (path: string) =>
  parseCsv(
    readFileSync(
      fileURLToPath(
        new URL(
          `../../../packages/qcraft-engine/tests/golden_masters/intermediate/${path}`,
          import.meta.url,
        ),
      ),
      'utf8',
    ),
  );

/** Floating point only; every comparison below is of one arithmetic to itself. */
const EXACT = 1e-9;

/**
 * The golden masters were computed on the frozen verification vintage, so every
 * comparison against them reads the frozen record. The panels themselves read
 * whichever vintage the mode is in; the suite below the golden-master blocks is
 * what holds that the two vintages are genuinely different records.
 */
const FROZEN = MODES.verified.vintage;
const CURRENT = MODES.current.vintage;

describe('demography, against the demography golden master', () => {
  const master = goldenMaster('demography/uganda.csv');

  it('working-age growth at the Medium variant reproduces every year', () => {
    const derived = new Map(
      variantGrowth(FROZEN, 'UGA', 'working_age', 'Medium').map((p) => [p.year, p.value]),
    );

    let compared = 0;
    for (const row of master) {
      const year = num(row, 'years');
      // The master's growth columns are empty in its first year, which has no
      // prior year to grow from. Nothing to compare there.
      if (row.demography_growth_working_age === '') continue;
      expect(derived.get(year), `working-age growth ${year}`).toBeCloseTo(
        num(row, 'demography_growth_working_age'),
        9,
      );
      compared += 1;
    }
    expect(compared).toBe(master.length - 1);
  });

  it('total population growth reproduces every year', () => {
    const derived = new Map(
      variantGrowth(FROZEN, 'UGA', 'total', 'Medium').map((p) => [p.year, p.value]),
    );
    for (const row of master) {
      if (row.demography_growth_total === '') continue;
      expect(derived.get(num(row, 'years'))).toBeCloseTo(
        num(row, 'demography_growth_total'),
        9,
      );
    }
  });

  it('the levels themselves match, not just the growth rates', () => {
    const levels = populationLevels(FROZEN, 'UGA', 'working_age', 'Medium')!;
    for (const row of master) {
      expect(levels.get(num(row, 'years'))).toBe(num(row, 'working_age_population'));
    }
  });
});

describe('demography, the property the panel teaches', () => {
  it('reports a divergence year the data actually supports', () => {
    for (const iso3c of ['UGA', 'KEN', 'BGD']) {
      const diverge = variantsDivergeAfter(FROZEN, iso3c, 'working_age');
      expect(diverge, `${iso3c} divergence year`).not.toBeNull();

      const low = populationLevels(FROZEN, iso3c, 'working_age', 'Low')!;
      const high = populationLevels(FROZEN, iso3c, 'working_age', 'High')!;
      // Identical up to and including the reported year, different the year after.
      expect(low.get(diverge!)).toBe(high.get(diverge!));
      expect(low.get(diverge! + 1)).not.toBe(high.get(diverge! + 1));
    }
  });

  it('covers the three bundled countries and reports others as unavailable', () => {
    expect(hasContextData('UGA')).toBe(true);
    expect(hasContextData('KEN')).toBe(true);
    expect(hasContextData('BGD')).toBe(true);
    expect(hasContextData('ZZZ')).toBe(false);
    expect(variantGrowth(FROZEN, 'ZZZ', 'working_age', 'Medium')).toEqual([]);
  });
});

describe('productivity, against the productivity golden master', () => {
  it('the WDI record reproduces the master through the last WDI year', () => {
    const record = new Map(productivityRecord('UGA').map((p) => [p.year, p.value]));
    // The master's column is the WDI record up to 2022 and back-calculated after,
    // so only the record years are a like-for-like comparison.
    const recordYears = [...record.keys()].filter((y) => y >= 2010 && y <= 2022);
    expect(recordYears.length).toBe(13);
    for (const year of recordYears) {
      expect(record.get(year), `productivity growth ${year}`).toBeCloseTo(
        GM_PRODUCTIVITY_GROWTH.get(year)!,
        9,
      );
    }
  });

  it('the assumption path at the engine defaults reproduces the master from 2030', () => {
    // 5.0 and 1.2 are ENGINE_DEFAULTS, which the master was computed at.
    const path = productivityAssumption(5.0, 1.2);
    expect(path[0].year).toBe(WEO_MAX_YEAR + 1);
    expect(path[path.length - 1].year).toBe(YEAR_END);
    for (const point of path) {
      expect(point.value, `productivity ${point.year}`).toBeCloseTo(
        GM_PRODUCTIVITY_GROWTH.get(point.year)!,
        9,
      );
    }
  });
});

describe('inflation, against the inflation golden master', () => {
  it('the deflator record reproduces the master through the WEO horizon', () => {
    const record = inflationRecord(FROZEN, 'UGA');
    expect(record[record.length - 1].year).toBe(WEO_MAX_YEAR);
    for (const point of record) {
      // The master starts in 2009; the bundled deflator index reaches back to
      // 2001, so only the overlap is comparable.
      const expected = GM_INFLATION.get(point.year);
      if (expected == null) continue;
      expect(point.value, `inflation ${point.year}`).toBeCloseTo(expected, 9);
    }
  });

  it('reproduces the master from 2030 at the parameters the master was built with', () => {
    // 3.5 / 3.5, not the 5.0 that constants.py publishes as the start default.
    // See .change-requests/INFLATION-DEFAULT-2026-08-26.md. Pinning the model at
    // the parameters the fixture actually represents proves the arithmetic is
    // right without asserting a default the fixture contradicts.
    const path = inflationAssumption(3.5, 3.5);
    for (const point of path) {
      expect(point.value, `inflation ${point.year}`).toBeCloseTo(
        GM_INFLATION.get(point.year)!,
        9,
      );
    }
  });

  it('the published default start does NOT reproduce the master, which is the open question', () => {
    const published = inflationAssumption(5.0, 3.5);
    const fixture = inflationAssumption(3.5, 3.5);
    expect(pathsAgree(published, fixture)).toBe(false);
  });
});

describe('interest rate, against the interest-rate golden master', () => {
  const observed = effectiveRate(FROZEN, 'UGA')!;
  const paths = interestRateApproaches(observed)!;

  it('anchors on the last observed year of the WEO extract', () => {
    expect(paths.anchorYear).toBe(WEO_MAX_YEAR);
    expect(paths.anchorRate).toBeCloseTo(GM_NOMINAL_RATE.get(WEO_MAX_YEAR)!, EXACT);
  });

  it('the observed record matches the master for every historical year', () => {
    for (const point of paths.record) {
      const expected = GM_NOMINAL_RATE.get(point.year);
      if (expected == null) continue;
      expect(point.value, `observed rate ${point.year}`).toBeCloseTo(expected, 9);
    }
  });

  it('the nominal approach reproduces the master for every projection year', () => {
    // The master was computed at interest_rate_mode = "Nominal interest rate",
    // so this approach is a like-for-like parity check on the whole path.
    const nominal = paths.projections['Nominal interest rate'];
    expect(nominal[0].year).toBe(WEO_MAX_YEAR + 1);
    expect(nominal[nominal.length - 1].year).toBe(YEAR_END);
    for (const point of nominal) {
      expect(point.value, `nominal ${point.year}`).toBeCloseTo(
        GM_NOMINAL_RATE.get(point.year)!,
        9,
      );
    }
  });

  it('the differential approach meets the nominal approach in its first year', () => {
    // Its first projected year holds the differential against the anchor year's
    // own growth, which reconstructs the anchor rate exactly. Any drift here
    // means the differential was computed off the wrong year.
    const differential = paths.projections['Interest-growth differential'];
    expect(differential[0].year).toBe(WEO_MAX_YEAR + 1);
    expect(differential[0].value).toBeCloseTo(paths.anchorRate, 9);
  });

  it('the real approach rebuilds the nominal rate from the projection inflation', () => {
    // At a flat 3.5% deflator growth and a 1% long-run real rate, the Fisher
    // relation gives one constant nominal rate. Derived from the fixture, not
    // hard-coded: (1 + r)(1 + pi) - 1.
    const real = paths.projections['Real interest rate'];
    const inflation = GM_INFLATION.get(2050)!;
    const expected = (1 + 1.0 / 100) * (1 + inflation / 100) * 100 - 100;
    expect(real.find((p) => p.year === 2051)!.value).toBeCloseTo(expected, 9);
  });

  it('the three approaches are three different paths', () => {
    const [nominal, differential, real] = [
      paths.projections['Nominal interest rate'],
      paths.projections['Interest-growth differential'],
      paths.projections['Real interest rate'],
    ];
    expect(pathsAgree(nominal, differential)).toBe(false);
    expect(pathsAgree(nominal, real)).toBe(false);
    expect(pathsAgree(differential, real)).toBe(false);
  });

  it('returns null rather than guessing when a country has no observed rate', () => {
    expect(interestRateApproaches(new Map())).toBeNull();
  });
});

// ── The record is per vintage ────────────────────────────────────────────────
//
// Held item (3) of Teal's 2026-08-27 night resolutions. Before the freeze these
// panels read one frozen extract whatever mode the app was in, so a Current-mode
// user was shown the October 2024 record under a Current-mode stamp. The three
// tests below are the ones that would have caught that, and the one that stops
// it coming back is the first: the two vintages must not be the same numbers.

describe('the panel record is scoped by vintage', () => {
  it('draws different population numbers in the two modes', () => {
    // WPP 2022 against WPP 2024, on the number the demography panel puts in
    // front of the user. If these ever coincide the scoping has collapsed back
    // to one record and the panels are lying about their mode again.
    const frozen = populationLevels(FROZEN, 'UGA', 'working_age', 'Medium')!;
    const current = populationLevels(CURRENT, 'UGA', 'working_age', 'Medium')!;
    expect(frozen.get(2050)).toBeDefined();
    expect(current.get(2050)).toBeDefined();
    expect(current.get(2050)).not.toBe(frozen.get(2050));
  });

  it('draws a different deflator record in the two modes', () => {
    const frozen = deflatorIndex(FROZEN, 'UGA')!;
    const current = deflatorIndex(CURRENT, 'UGA')!;
    expect(current.get(2020)).not.toBe(frozen.get(2020));
  });

  it('carries all three bundled countries in both vintages', () => {
    for (const iso3c of ['UGA', 'KEN', 'BGD']) {
      for (const vintage of [FROZEN, CURRENT]) {
        expect(
          variantGrowth(vintage, iso3c, 'working_age', 'Medium').length,
          `${iso3c} ${vintage}`,
        ).toBeGreaterThan(80);
      }
    }
  });

  it('falls back to the frozen record for a vintage it does not carry', () => {
    // An imported run file can name a vintage this build never shipped. Showing
    // the frozen record beats showing an empty panel, and the mode stamp in the
    // panel shell is what tells the reader which record they are looking at.
    const unknown = populationLevels('weo-1999-01', 'UGA', 'working_age', 'Medium')!;
    const frozen = populationLevels(FROZEN, 'UGA', 'working_age', 'Medium')!;
    expect(unknown.get(2050)).toBe(frozen.get(2050));
  });

  it('names the release each mode actually draws, in the panel source line', () => {
    expect(SOURCES.macrofiscal(FROZEN)).toContain('October 2024');
    expect(SOURCES.macrofiscal(CURRENT)).toContain('April 2026');
    expect(SOURCES.demography(FROZEN)).toContain('2022 revision');
    expect(SOURCES.demography(CURRENT)).toContain('2024 revision');
  });

  it('keeps productivity unscoped, and says why in the line it prints', () => {
    // The pipeline carries WDI forward unchanged and every vintage manifest
    // records that. scripts/derive-context-data.mjs fails if that stops being
    // true, so one table is the honest shape rather than two identical ones.
    expect(SOURCES.productivity).toContain('both data modes');
    expect(productivityRecord('UGA').length).toBeGreaterThan(20);
  });
});
