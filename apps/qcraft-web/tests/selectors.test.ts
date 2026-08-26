/**
 * Tests for the derived quantities the UI states as findings.
 *
 * These matter because the app puts them in chart TITLES and callout text — "the
 * gap is 87.7 points of GDP", "costs Uganda 5.9% of GDP". A wrong number there
 * is worse than a wrong pixel: it is a claim a ministry reader will repeat.
 *
 * Expected values are recomputed from the golden-master CSVs inside each test,
 * never hard-coded (AGENTS.md, "GOLDEN MASTER TESTS").
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { engine, ENGINE_DEFAULTS } from '../src/engine/adapter';
import { num, parseCsv } from '../src/engine/csv';
import {
  gdpShortfallSeries,
  scenarioColor,
  scenarioSpread,
  valueAt,
} from '../src/selectors';
import { series as palette } from '../src/theme';
import { WARMING_ORDER } from '../src/engine/types';

const masterPath = (rel: string) =>
  fileURLToPath(
    new URL(`../../../packages/qcraft-engine/tests/golden_masters/${rel}`, import.meta.url),
  );

const HORIZON = 2099;
const result = engine.run(ENGINE_DEFAULTS);

describe('scenarioSpread', () => {
  it('reports the best and worst climate scenarios and their gap', () => {
    // Independently derive the expected best/worst from the final master, which
    // the adapter does not read.
    const rows = parseCsv(readFileSync(masterPath('final/uganda.csv'), 'utf8'))
      .filter((r) => num(r, 'year') === HORIZON && r.scenario !== 'Baseline')
      .map((r) => ({ scenario: r.scenario, debt: num(r, 'debt_to_gdp') }))
      .sort((a, b) => a.debt - b.debt);

    const expectedBest = rows[0];
    const expectedWorst = rows[rows.length - 1];

    const spread = scenarioSpread(result, HORIZON);
    expect(spread).toBeDefined();
    expect(spread!.best.value).toBeCloseTo(expectedBest.debt, 9);
    expect(spread!.worst.value).toBeCloseTo(expectedWorst.debt, 9);
    expect(spread!.spread).toBeCloseTo(expectedWorst.debt - expectedBest.debt, 9);
  });

  it('excludes the baseline from the climate comparison', () => {
    const spread = scenarioSpread(result, HORIZON);
    expect(spread!.best.key).not.toBe('Baseline');
    expect(spread!.worst.key).not.toBe('Baseline');
  });

  it('returns undefined for a year outside the projection', () => {
    expect(scenarioSpread(result, 1800)).toBeUndefined();
  });
});

describe('gdpShortfallSeries', () => {
  const shortfall = gdpShortfallSeries(result);

  it('holds the baseline flat at zero', () => {
    const baseline = shortfall.find((s) => s.key === 'Baseline');
    expect(baseline).toBeDefined();
    for (const point of baseline!.points) {
      expect(point.value).toBeCloseTo(0, 12);
    }
  });

  it('matches (scenario / baseline - 1) computed straight from the fixtures', () => {
    const baselineGdp = new Map(
      parseCsv(readFileSync(masterPath('intermediate/baseline_v1/uganda.csv'), 'utf8')).map(
        (r) => [num(r, 'years'), num(r, 'real_gdp')],
      ),
    );
    const hotUnadapted = parseCsv(
      readFileSync(masterPath('intermediate/climate/hot_unadapted_uganda.csv'), 'utf8'),
    );

    const actual = shortfall.find((s) => s.key === 'Hot_Unadapted');
    expect(actual).toBeDefined();

    for (const row of hotUnadapted) {
      const year = num(row, 'years');
      const base = baselineGdp.get(year)!;
      const expected = (num(row, 'real_gdp') / base - 1) * 100;
      const point = actual!.points.find((p) => p.year === year);
      expect(point, `missing ${year}`).toBeDefined();
      expect(point!.value, `Hot_Unadapted ${year}`).toBeCloseTo(expected, 9);
    }
  });

  it('shows no divergence before the WEO boundary', () => {
    // Climate shocks start after the WEO horizon, so every scenario must sit on
    // the baseline through it. This is the check that would catch an off-by-one
    // in how the shock is applied.
    for (const s of shortfall) {
      for (const point of s.points.filter((p) => p.year <= result.weoBoundaryYear)) {
        expect(Math.abs(point.value), `${s.key} ${point.year}`).toBeLessThan(0.01);
      }
    }
  });

  it('leaves the worst scenario below baseline at the horizon', () => {
    const worst = shortfall
      .filter((s) => s.key !== 'Baseline')
      .map((s) => s.points.find((p) => p.year === HORIZON)!.value)
      .sort((a, b) => a - b)[0];
    expect(worst).toBeLessThan(0);
  });
});

describe('scenarioColor', () => {
  it('gives the baseline its own family, not a ramp step', () => {
    expect(scenarioColor('Baseline')).toBe(palette.baseline);
    expect(palette.warming).not.toContain(scenarioColor('Baseline'));
  });

  it('assigns ramp steps in warming order, one per scenario', () => {
    const assigned = WARMING_ORDER.map(scenarioColor);
    expect(assigned).toEqual([...palette.warming]);
    // No two scenarios share a colour.
    expect(new Set(assigned).size).toBe(WARMING_ORDER.length);
  });
});

describe('valueAt', () => {
  it('reads a known fixture value', () => {
    const rows = parseCsv(readFileSync(masterPath('final/uganda.csv'), 'utf8'));
    const expected = rows.find((r) => r.scenario === 'Baseline' && num(r, 'year') === 2050)!;
    const baseline = result.scenarios.find((s) => s.key === 'Baseline');
    expect(valueAt(baseline, 2050, 'debt_to_gdp')).toBeCloseTo(
      num(expected, 'debt_to_gdp'),
      9,
    );
  });

  it('returns undefined for a missing year', () => {
    const baseline = result.scenarios.find((s) => s.key === 'Baseline');
    expect(valueAt(baseline, 1800, 'debt_to_gdp')).toBeUndefined();
  });
});
