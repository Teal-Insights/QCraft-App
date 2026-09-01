/**
 * Parity for the climate-channel widget, and the check that licenses it.
 *
 * The widget recomputes the fiscal block of each climate scenario so the
 * rigidity slider can move. That is only honest if the recomputation IS the
 * engine's. The first test settles it: at the engine default rigidity of 1.0,
 * the recomputation must reproduce all six Uganda climate golden masters
 * exactly, year by year, on both debt and the primary balance.
 *
 * Expected values are loaded from the golden-master CSVs, never hard-coded
 * (CLAUDE.md, review rule 1). No production code is used to build them.
 *
 * The remaining tests pin the three domain rules the climate module is most
 * often got wrong: rigidity semantics (rule 4), the absent debt floor (rule 3),
 * and the scenario ordering the contract requires (SHARED/engine-api.md 7).
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { num, parseCsv } from '../src/engine/csv';
import {
  DEFAULT_RIGIDITY,
  SCENARIO_DISPLAY_ORDER,
  WEO_MAX_YEAR,
  YEAR_END,
  allChannelPaths,
  baselinePath,
  channelPath,
} from '../src/widgets/models/climateChannel';
import type { ClimateScenario } from '../src/engine/types';

const INTERMEDIATE = '../../../packages/qcraft-engine/tests/golden_masters/intermediate/';

const readMaster = (path: string) =>
  parseCsv(readFileSync(fileURLToPath(new URL(INTERMEDIATE + path, import.meta.url)), 'utf8'));

/** Golden-master filenames are snake_case lower; scenario keys are not. */
const MASTER_FILE: Record<ClimateScenario, string> = {
  Paris: 'paris_uganda.csv',
  Moderate: 'moderate_uganda.csv',
  Hot: 'hot_uganda.csv',
  Hot_Adapted: 'hot_adapted_uganda.csv',
  Hot_Unadapted: 'hot_unadapted_uganda.csv',
  High: 'high_uganda.csv',
};

const goldenScenario = (key: ClimateScenario) =>
  new Map(readMaster(`climate/${MASTER_FILE[key]}`).map((row) => [num(row, 'years'), row]));

const GOLDEN_FISCAL = new Map(
  readMaster('fiscal/uganda.csv').map((row) => [num(row, 'years'), row]),
);

describe('channelPath at the engine default rigidity', () => {
  it.each(SCENARIO_DISPLAY_ORDER)(
    'reproduces the %s golden master exactly',
    (key) => {
      const golden = goldenScenario(key);
      const path = channelPath(key, DEFAULT_RIGIDITY);

      expect(path.years).toHaveLength(YEAR_END - WEO_MAX_YEAR + 1);

      for (const year of path.years) {
        if (year.year === WEO_MAX_YEAR) continue; // seed year, taken from baseline
        const row = golden.get(year.year);
        expect(row, `no golden row for ${key} in ${year.year}`).toBeDefined();
        expect(year.debtToGdp).toBeCloseTo(num(row!, 'debt_to_gdp'), 8);
        expect(year.primaryBalancePct).toBeCloseTo(
          num(row!, 'primary_balance_percent_gdp'),
          10,
        );
      }
    },
  );

  it('seeds from the baseline debt ratio in the last WEO year', () => {
    const seed = num(GOLDEN_FISCAL.get(WEO_MAX_YEAR)!, 'debt_to_gdp');
    for (const path of allChannelPaths(DEFAULT_RIGIDITY)) {
      expect(path.years[0].year).toBe(WEO_MAX_YEAR);
      expect(path.years[0].debtToGdp).toBeCloseTo(seed, 10);
    }
  });
});

describe('the expenditure-rigidity channel', () => {
  it('shuts the primary-balance channel completely at rigidity 0', () => {
    // Rule 4: 0.0 is fully flexible. Spending falls in step with GDP, so the
    // ratio is untouched and the scenario's primary balance equals the
    // baseline's, loaded from the fiscal golden master.
    for (const path of allChannelPaths(0)) {
      for (const year of path.years) {
        if (year.year === WEO_MAX_YEAR) continue;
        expect(year.primaryBalancePct).toBeCloseTo(
          num(GOLDEN_FISCAL.get(year.year)!, 'primary_balance_percent_gdp'),
          10,
        );
      }
    }
  });

  it('makes sticky spending the worse case wherever GDP falls short', () => {
    // Rule 4, stated as the thing a reader would check. Rigidity holds spending
    // at its baseline LEVEL, so it amplifies whichever way GDP moved: worse for
    // the five scenarios that lose GDP, better for Paris-Aligned, which gains
    // it. A reversed sign convention fails on both halves.
    const sticky = allChannelPaths(1);
    const flexible = allChannelPaths(0);
    for (let i = 0; i < sticky.length; i += 1) {
      const end = (p: (typeof sticky)[number]) => p.years[p.years.length - 1];
      const gains = end(sticky[i]).gdpShortfall > 0;
      if (gains) {
        expect(end(sticky[i]).debtToGdp).toBeLessThan(end(flexible[i]).debtToGdp);
      } else {
        expect(end(sticky[i]).debtToGdp).toBeGreaterThan(end(flexible[i]).debtToGdp);
      }
    }
  });

  it('moves monotonically between the two ends', () => {
    const endDebt = [0, 0.25, 0.5, 0.75, 1].map(
      (rigidity) => {
        const years = channelPath('Hot', rigidity).years;
        return years[years.length - 1].debtToGdp;
      },
    );
    for (let i = 1; i < endDebt.length; i += 1) {
      expect(endDebt[i]).toBeGreaterThan(endDebt[i - 1]);
    }
  });
});

describe('domain rules', () => {
  it('applies no debt floor in climate scenarios (rule 3)', () => {
    // Paris at fully flexible spending is the mildest case the widget can
    // produce. Whether or not it goes negative, no value may be clamped at
    // zero, so assert against the unclamped recursion rather than a magnitude:
    // a max(0, ...) would show up as a run of exact zeros.
    for (const path of allChannelPaths(0)) {
      expect(path.years.some((y) => y.debtToGdp === 0)).toBe(false);
    }
  });

  it('widens each scenario away from the baseline without changing its sign', () => {
    // Five of the six lose GDP against the baseline. Paris-Aligned GAINS it,
    // because the baseline already carries current-policy damage and a
    // 1.5C world carries less. The widget copy has to survive that, so the
    // test asserts a widening deviation rather than a shortfall.
    for (const path of allChannelPaths(DEFAULT_RIGIDITY)) {
      const first = path.years[1];
      const last = path.years[path.years.length - 1];
      expect(Math.abs(last.gdpShortfall)).toBeGreaterThan(Math.abs(first.gdpShortfall));
      expect(Math.sign(last.gdpShortfall)).toBe(Math.sign(first.gdpShortfall));
    }
    const paris = channelPath('Paris', DEFAULT_RIGIDITY).years;
    expect(paris[paris.length - 1].gdpShortfall).toBeGreaterThan(0);
  });

  it('orders scenarios as pathways then the Hot family, not as a severity ramp', () => {
    // SHARED/engine-api.md section 7. High ends BELOW Hot for Uganda, so a
    // display order sorted by outcome would contradict the contract.
    expect(SCENARIO_DISPLAY_ORDER).toEqual([
      'Paris',
      'Moderate',
      'High',
      'Hot_Adapted',
      'Hot',
      'Hot_Unadapted',
    ]);
    const end = new Map(
      allChannelPaths(DEFAULT_RIGIDITY).map((p) => [
        p.key,
        p.years[p.years.length - 1].debtToGdp,
      ]),
    );
    expect(end.get('High')!).toBeLessThan(end.get('Hot')!);
  });
});

describe('baselinePath', () => {
  it('is the fiscal golden master, unmodified', () => {
    for (const year of baselinePath()) {
      expect(year.debtToGdp).toBeCloseTo(
        num(GOLDEN_FISCAL.get(year.year)!, 'debt_to_gdp'),
        10,
      );
    }
    expect(baselinePath().every((y) => y.gdpShortfall === 0)).toBe(true);
  });
});
