/**
 * The debt sandbox is the one widget model with no golden master behind it: it
 * holds the three rates constant on purpose, which no engine run does. So it is
 * pinned by the ALGEBRA rather than by expected values. Every assertion below
 * is an identity that has to hold for any inputs, which is a stronger claim
 * than three hard-coded numbers would be, and it keeps CLAUDE.md's rule against
 * hard-coded expected values intact.
 *
 * The formula itself is pinned against the real engine by
 * tests/widgets.climateChannel.test.ts, which runs the same recursion against
 * all six Uganda climate golden masters.
 */

import { describe, expect, it } from 'vitest';

import {
  DEBT_PRESETS,
  HORIZON,
  START_YEAR,
  UGANDA_LIKE,
  debtPath,
  steadyState,
  type DebtInputs,
} from '../src/widgets/models/debtPath';

const CASES: DebtInputs[] = [
  UGANDA_LIKE,
  { interestRate: 12, growthRate: 6, primaryBalance: -2, initialDebt: 80 },
  { interestRate: 4, growthRate: 4, primaryBalance: 1.5, initialDebt: 45 },
  { interestRate: 0, growthRate: 15, primaryBalance: -5, initialDebt: 20 },
];

describe('debtPath', () => {
  it('covers the stated horizon inclusive of the starting year', () => {
    const path = debtPath(UGANDA_LIKE);
    expect(path).toHaveLength(HORIZON + 1);
    expect(path[0].year).toBe(START_YEAR);
    expect(path[0].debtToGdp).toBe(UGANDA_LIKE.initialDebt);
    expect(path[path.length - 1].year).toBe(START_YEAR + HORIZON);
  });

  it('decomposes exactly: every year of change is snowball plus primary balance', () => {
    for (const inputs of CASES) {
      const path = debtPath(inputs);
      for (let t = 1; t < path.length; t += 1) {
        const change = path[t].debtToGdp - path[t - 1].debtToGdp;
        expect(change).toBeCloseTo(path[t].snowball + path[t].primaryBalanceEffect, 10);
      }
    }
  });

  it('zeroes the snowball when interest equals growth, whatever the other inputs', () => {
    for (const inputs of CASES) {
      const path = debtPath({ ...inputs, growthRate: inputs.interestRate });
      for (let t = 1; t < path.length; t += 1) {
        expect(path[t].snowball).toBeCloseTo(0, 12);
        // With the snowball gone the ratio moves by exactly minus the balance.
        expect(path[t].debtToGdp - path[t - 1].debtToGdp).toBeCloseTo(
          -inputs.primaryBalance,
          10,
        );
      }
    }
  });

  it('signs the snowball by the interest-growth differential', () => {
    const adverse = debtPath({ ...UGANDA_LIKE, growthRate: 4 });
    const favourable = debtPath({ ...UGANDA_LIKE, growthRate: 14 });
    expect(adverse[1].snowball).toBeGreaterThan(0);
    expect(favourable[1].snowball).toBeLessThan(0);
  });

  it('converges on the steady state when growth outruns interest', () => {
    for (const inputs of CASES) {
      const target = steadyState(inputs);
      if (target === undefined) continue;
      // Uganda's factor is 1.08/1.10, so the gap decays by only 1.8% a year:
      // a 30-year horizon is nowhere near the fixed point and a 400-year one is
      // still 0.006 off it. Run it out until the decay term is gone.
      const long = debtPath(inputs, 3000);
      expect(long[long.length - 1].debtToGdp).toBeCloseTo(target, 8);
    }
  });

  it('has no steady state when interest is at or above growth', () => {
    expect(steadyState({ ...UGANDA_LIKE, growthRate: UGANDA_LIKE.interestRate })).toBeUndefined();
    expect(steadyState({ ...UGANDA_LIKE, growthRate: 2 })).toBeUndefined();
  });

  it('applies no debt floor, per domain rule 3 for non-baseline paths', () => {
    const path = debtPath({
      interestRate: 2,
      growthRate: 12,
      primaryBalance: 4,
      initialDebt: 10,
    });
    expect(path[path.length - 1].debtToGdp).toBeLessThan(0);
  });

  it('ships presets that each land on a different side of the differential', () => {
    const differentials = DEBT_PRESETS.map((p) => p.inputs.growthRate - p.inputs.interestRate);
    expect(differentials.filter((d) => d === 0)).toHaveLength(1);
    expect(new Set(differentials).size).toBe(DEBT_PRESETS.length);
  });
});
