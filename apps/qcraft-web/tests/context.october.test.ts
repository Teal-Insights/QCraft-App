import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { distribution, PEER_WEO_YEAR, statValue } from '../src/context/peers';
import { populationLevels } from '../src/context/sources';
import { referenceLabel } from '../src/context/references';

const directory = fileURLToPath(new URL('../../../data/vintages/weo-2026-10-full-horizon-v1/json/', import.meta.url));
const october = 'weo-2026-10';

describe('October reference lineage', () => {
  it('retains WPP levels and gives them their actual source date', () => {
    expect(populationLevels(october, 'UGA', 'working_age', 'Medium')).toEqual(
      populationLevels('weo-2026-04', 'UGA', 'working_age', 'Medium'),
    );
    expect(referenceLabel(october, 'demography')).toContain('2024 revision');
    expect(referenceLabel(october, 'productivity')).toContain('1991 to 2022');
  });
});

// Release inputs are staged separately from Git. The always-on reference tests
// above still run on an ordinary clone; this source-to-reference check additionally
// runs whenever the exact candidate payloads are staged, including release QA.
describe.skipIf(!existsSync(`${directory}/KOR.json`))('October references against staged source payloads', () => {
  for (const iso3c of ['UGA', 'ALB', 'SEN', 'KOR']) {
    it(`${iso3c}: uses source fields at the fixed reference year independently of model support`, () => {
      const input = JSON.parse(readFileSync(`${directory}/${iso3c}.json`, 'utf8'));
      const row = input.macrofiscal.find((r: { years: number }) => r.years === PEER_WEO_YEAR);
      const fields = {
        debt_weo_last: row.debt_to_gdp,
        inflation_weo_last: row.gdp_deflator_growth_percent,
        interest_rate_weo_last: row.interest_rate_percent,
      } as const;
      for (const [stat, source] of Object.entries(fields)) {
        const value = statValue(october, iso3c, stat as keyof typeof fields);
        if (source === null || !Number.isFinite(source)) expect(value).toBeUndefined();
        else expect(value).toBeCloseTo(source as number, 4);
      }
      if (iso3c === 'KOR') {
        expect(input.horizonPolicy.coverageStatus).toBe('unsupported');
        expect(statValue(october, iso3c, 'debt_weo_last')).toBeDefined();
        expect(distribution(october, iso3c, 'world', 'debt_weo_last')?.points.some(p => p.iso3c === iso3c)).toBe(true);
      }
      const dist = distribution(october, iso3c, 'world', 'debt_weo_last');
      expect(dist!.points.length + dist!.missing).toBe(175);
    });
  }
});
