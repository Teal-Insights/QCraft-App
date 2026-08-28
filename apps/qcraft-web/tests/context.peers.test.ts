/**
 * The cross-country reference set, checked against the files it is built from.
 *
 * Two kinds of test here, and the second is the one that matters.
 *
 * The first kind checks the code: quantiles come out ordered, a peer set always
 * contains the country whose peers it is, a fit reproduces a slope worked out
 * by hand.
 *
 * The second kind checks the CONTRACT BETWEEN THE FILES AND THE READER. These
 * CSVs are parsed in the browser by a deliberate `split(',')` with no quote
 * handling (`src/engine/csv.ts` says why). That is fine as long as no cell ever
 * contains a comma, and catastrophic the day one does: a quoted field does not
 * fail, it shifts every column after it by one and renders as a plausible wrong
 * number. It has already happened once in this lane, when three reading labels
 * were written with commas in them and half the rigidity chart silently
 * vanished. So the shape of the files is asserted here as well as guarded in
 * the generator.
 */

import { describe, expect, it } from 'vitest';

import peersCsv from '../src/context/data/peers.csv?raw';
import statsCsv from '../src/context/data/peer-stats.csv?raw';
import readingsCsv from '../src/context/data/rigidity-readings.csv?raw';
import pointsCsv from '../src/context/data/rigidity-points.csv?raw';

import {
  DEFAULT_PEER_VINTAGE,
  PEER_COUNTRIES,
  distribution,
  peerCountry,
  peerScopeName,
  peerScopes,
  peerSet,
  percentileOf,
  placeInWords,
  rigidityPoints,
  rigidityReadings,
  rigiditySpan,
  robustDomain,
  statValue,
} from '../src/context/peers';
import { composeNote } from '../src/components/context/RationaleAction';
import { fitCountry } from '../src/components/context/RigidityCharts';
import { RATIONALE_MAX_LENGTH } from '../src/content/params';

const V = DEFAULT_PEER_VINTAGE;

describe('the bundled files match what the browser reader can parse', () => {
  const files = {
    'peers.csv': peersCsv,
    'peer-stats.csv': statsCsv,
    'rigidity-readings.csv': readingsCsv,
    'rigidity-points.csv': pointsCsv,
  };

  it('carries no quote and no cell containing a comma', () => {
    for (const [name, text] of Object.entries(files)) {
      expect(text.includes('"'), `${name} has a quoted field`).toBe(false);
    }
  });

  it('has the same number of cells on every row of a file', () => {
    for (const [name, text] of Object.entries(files)) {
      const rows = text.trim().split(/\r?\n/);
      const width = rows[0].split(',').length;
      const ragged = rows.findIndex((row) => row.split(',').length !== width);
      expect(ragged, `${name} row ${ragged} is ragged`).toBe(-1);
    }
  });
});

describe('peer groups', () => {
  it('covers every selectable country', () => {
    expect(PEER_COUNTRIES.length).toBe(175);
    expect(PEER_COUNTRIES.every((c) => c.region.length > 0)).toBe(true);
  });

  it('puts every country in exactly one region, and the regions partition the set', () => {
    const byRegion = new Map<string, number>();
    for (const country of PEER_COUNTRIES) {
      byRegion.set(country.region, (byRegion.get(country.region) ?? 0) + 1);
    }
    expect([...byRegion.values()].reduce((a, b) => a + b, 0)).toBe(
      PEER_COUNTRIES.length,
    );
    // Five continents, and none of them a group of one.
    expect(byRegion.size).toBe(5);
    expect(Math.min(...byRegion.values())).toBeGreaterThan(1);
  });

  it('never offers a peer set that leaves the country out of it', () => {
    for (const country of PEER_COUNTRIES) {
      for (const scope of peerScopes(country.iso3c)) {
        const set = peerSet(country.iso3c, scope.value);
        expect(
          set.some((c) => c.iso3c === country.iso3c),
          `${country.iso3c} is missing from its own ${scope.value} set`,
        ).toBe(true);
      }
    }
  });

  /**
   * A subregion of two is not a peer set, so the generator blanks it and the
   * scope list drops it. The countries that lose it must still get a region.
   */
  it('drops the subregion scope where the subregion is too small', () => {
    const withoutSubregion = PEER_COUNTRIES.filter((c) => !c.subregion);
    expect(withoutSubregion.length).toBeGreaterThan(0);
    for (const country of withoutSubregion) {
      const scopes = peerScopes(country.iso3c).map((s) => s.value);
      expect(scopes).not.toContain('subregion');
      expect(scopes).toContain('region');
    }
  });

  it('keeps the similarity band to a fixed size and centres it on the country', () => {
    const uganda = peerSet('UGA', 'similar');
    expect(uganda.length).toBe(40);
    expect(uganda.some((c) => c.iso3c === 'UGA')).toBe(true);
    // A band on output per worker should not be reaching the richest economies.
    const own = peerCountry('UGA')!.outputPerWorker!;
    const furthest = Math.max(
      ...uganda.map((c) => Math.abs(Math.log(c.outputPerWorker!) - Math.log(own))),
    );
    expect(furthest).toBeLessThan(Math.log(10));
  });

  it('names the scope the way the caption will say it', () => {
    expect(peerScopeName('UGA', 'region')).toBe('Africa');
    expect(peerScopeName('UGA', 'subregion')).toBe('Eastern Africa');
    expect(peerScopeName('UGA', 'world')).toBe('All countries');
  });
});

describe('distributions', () => {
  it('returns ordered quantiles and counts what the source does not cover', () => {
    const dist = distribution(V, 'UGA', 'world', 'debt_weo_last');
    expect(dist).toBeDefined();
    const { p10, p25, median, p75, p90, points, missing } = dist!;
    expect(p10).toBeLessThanOrEqual(p25);
    expect(p25).toBeLessThanOrEqual(median);
    expect(median).toBeLessThanOrEqual(p75);
    expect(p75).toBeLessThanOrEqual(p90);
    expect(points.length + missing).toBe(peerSet('UGA', 'world').length);
  });

  it('sorts the points ascending, which the strip relies on', () => {
    const dist = distribution(V, 'UGA', 'region', 'inflation_weo_last')!;
    const values = dist.points.map((p) => p.value);
    expect([...values].sort((a, b) => a - b)).toEqual(values);
  });

  it('reports a percentile consistent with the points behind it', () => {
    const dist = distribution(V, 'UGA', 'world', 'debt_weo_last')!;
    const own = statValue(V, 'UGA', 'debt_weo_last')!;
    const place = percentileOf(dist, own);
    const manual =
      (dist.points.filter((p) => p.value <= own).length / dist.points.length) * 100;
    expect(place).toBeCloseTo(manual, 10);
    expect(place).toBeGreaterThan(0);
    expect(place).toBeLessThanOrEqual(100);
  });

  it('refuses to draw a distribution over three countries', () => {
    // Every row the panels ask for has to be either a real distribution or
    // absent, never a box plot over a handful of observations.
    for (const country of PEER_COUNTRIES) {
      for (const scope of peerScopes(country.iso3c)) {
        const dist = distribution(V, country.iso3c, scope.value, 'debt_weo_last');
        if (dist) expect(dist.points.length).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it('describes a place in words that match the number', () => {
    expect(placeInWords(95)).toBe('in the top tenth');
    expect(placeInWords(50)).toBe('near the middle');
    expect(placeInWords(5)).toBe('in the bottom tenth');
  });
});

describe('the axis a distribution is drawn on', () => {
  it('trims the tail so the middle of the distribution is readable', () => {
    const dist = distribution(V, 'UGA', 'world', 'debt_weo_last')!;
    const values = dist.points.map((p) => p.value);
    const [lo, hi] = robustDomain(values);
    expect(hi).toBeLessThan(Math.max(...values));
    expect(hi - lo).toBeGreaterThan(dist.p75 - dist.p25);
  });

  it('never pushes the country or the setting off the end of the axis', () => {
    const dist = distribution(V, 'UGA', 'world', 'debt_weo_last')!;
    const values = dist.points.map((p) => p.value);
    const outlier = Math.max(...values);
    const [lo, hi] = robustDomain(values, [outlier, -5]);
    expect(lo).toBeLessThanOrEqual(-5);
    expect(hi).toBeGreaterThanOrEqual(outlier);
  });
});

describe('expenditure rigidity', () => {
  it('carries six readings for the world and for every region', () => {
    const world = rigidityReadings(V, 'World');
    expect(world.length).toBe(6);
    for (const region of new Set(PEER_COUNTRIES.map((c) => c.region))) {
      expect(rigidityReadings(V, region).length, region).toBe(6);
    }
  });

  it('falls back to the world readings for a scope with no estimate', () => {
    expect(rigidityReadings(V, 'Atlantis')).toEqual(rigidityReadings(V, 'World'));
  });

  /**
   * The interval is the regression's own, carried through `1 - beta`, so the
   * low end of rigidity comes from the HIGH end of the slope. Getting that
   * backwards would draw an interval that is correct in width and inverted in
   * meaning, which no eye would catch.
   */
  it('keeps the interval the right way round', () => {
    for (const reading of rigidityReadings(V, 'World')) {
      expect(reading.low).toBeLessThan(reading.rigidity);
      expect(reading.rigidity).toBeLessThan(reading.high);
    }
  });

  it('reports a span that no single reading spans on its own', () => {
    const readings = rigidityReadings(V, 'World');
    const span = rigiditySpan(readings)!;
    expect(span.low).toBeLessThan(span.high);
    expect(span.low).toBe(Math.min(...readings.map((r) => r.rigidity)));
    expect(span.high).toBe(Math.max(...readings.map((r) => r.rigidity)));
  });

  /**
   * The claim the panel makes in its own caption. If a later data refresh made
   * the readings agree, the caption would be wrong and this test is where that
   * shows up.
   */
  it('supports a range rather than a number, and none of it reaches the default', () => {
    const span = rigiditySpan(rigidityReadings(V, 'World'))!;
    expect(span.high - span.low).toBeGreaterThan(0.1);
    expect(span.high).toBeLessThan(1.0);
  });

  it('fits a country slope that matches the same slope worked out directly', () => {
    const points = rigidityPoints(V, 'UGA');
    expect(points.length).toBeGreaterThan(15);
    const fit = fitCountry(points)!;

    const n = points.length;
    const mx = points.reduce((a, p) => a + p.gdpGrowth, 0) / n;
    const my = points.reduce((a, p) => a + p.expenditureGrowth, 0) / n;
    let sxx = 0;
    let sxy = 0;
    for (const p of points) {
      sxx += (p.gdpGrowth - mx) ** 2;
      sxy += (p.gdpGrowth - mx) * (p.expenditureGrowth - my);
    }
    expect(fit.slope).toBeCloseTo(sxy / sxx, 12);
    expect(fit.observations).toBe(n);
    expect(fit.standardError).toBeGreaterThan(0);
  });

  it('declines to fit a country with almost no record', () => {
    expect(fitCountry([])).toBeUndefined();
    expect(
      fitCountry([
        { year: 2001, gdpGrowth: 1, expenditureGrowth: 1, weakYear: false },
        { year: 2002, gdpGrowth: 2, expenditureGrowth: 2, weakYear: true },
      ]),
    ).toBeUndefined();
  });
});

describe('the rationale sentence', () => {
  it('never writes more than the sidebar input will hold', () => {
    const long = 'x'.repeat(400);
    expect(composeNote('', long).length).toBe(RATIONALE_MAX_LENGTH);
    expect(composeNote('already here', long).length).toBe(RATIONALE_MAX_LENGTH);
  });

  it('appends rather than replacing what the user has typed', () => {
    expect(composeNote('Charter ceiling.', 'Africa median 51%.')).toBe(
      'Charter ceiling. Africa median 51%.',
    );
  });

  it('does not add the same sentence twice', () => {
    const first = composeNote('', 'Africa median 51%.');
    expect(composeNote(first, 'Africa median 51%.')).toBe(first);
  });
});

describe('vintages', () => {
  it('carries both, and falls back rather than returning nothing for an unknown one', () => {
    expect(statValue('weo-2026-04', 'UGA', 'debt_weo_last')).toBeDefined();
    expect(statValue('weo-2024-10', 'UGA', 'debt_weo_last')).toBeDefined();
    expect(statValue('weo-1999-01', 'UGA', 'debt_weo_last')).toBe(
      statValue(DEFAULT_PEER_VINTAGE, 'UGA', 'debt_weo_last'),
    );
  });

  /**
   * The two vintages disagree about Uganda's 2029 debt ratio by 17 points of
   * GDP, which is the whole argument for the data-mode switch. Pinned so that a
   * panel showing one vintage's number under the other's badge would fail here.
   */
  it('does not quietly serve one vintage under the other', () => {
    const frozen = statValue('weo-2024-10', 'UGA', 'debt_weo_last')!;
    const current = statValue('weo-2026-04', 'UGA', 'debt_weo_last')!;
    expect(Math.abs(current - frozen)).toBeGreaterThan(10);
  });

  /**
   * Serbia, and the defect that is now repaired.
   *
   * CC-5 found Kosovo's population filed under iso3c SRB beside Serbia's in the
   * frozen vintage, so `demography_country("SRB")` raised there and the
   * derivation left Serbia out of the frozen reference set. It was handed to
   * CC-6, CC-6 repaired the Parquet, and the reference table was regenerated at
   * the freeze. This assertion is the inverse of the one it replaces: Serbia now
   * has a frozen-vintage statistic, and a Serbian user opening the demography
   * panel in Verified mode finds their own country on the strip.
   *
   * docs/parameter-data.md section 10 records both halves.
   */
  it('carries Serbia in both vintages, now that the frozen demography is repaired', () => {
    expect(statValue('weo-2024-10', 'SRB', 'demography_wa_growth')).toBeDefined();
    expect(statValue('weo-2026-04', 'SRB', 'demography_wa_growth')).toBeDefined();
  });
});
