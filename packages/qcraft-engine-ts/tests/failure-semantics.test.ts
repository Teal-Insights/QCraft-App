/**
 * The TypeScript half of the failure-semantics contract.
 *
 * The Python engine raised on Zambia and Libya while this one carried the null
 * forward and drew a debt path anchored at zero. Zambia's debt is about 127 per
 * cent of GDP in the last year the WEO publishes it, and the chart showed it at
 * zero from 2029 on; Libya, which has no debt series in any year, was given a
 * path that climbs to 56 per cent by 2099. A wrong answer that looks like an
 * answer is worse than a refusal, and Zambia is a live partner.
 *
 * Both engines now refuse, with the same message, so the differential harness
 * can compare the refusals as strings. The fixtures under tests/fixtures/countries
 * are the same files the Python tests read.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runPipeline } from '../src/index.js';
import { MissingDebtAnchorError, MissingMacrofiscalInputError } from '../src/errors.js';
import type { CountryInput } from '../src/types.js';

const FIXTURES = join(import.meta.dirname, '..', '..', '..', 'tests', 'fixtures', 'countries');
const VINTAGES = ['weo-2024-10', 'weo-2026-04'] as const;

function load(vintage: string, iso3c: string): CountryInput {
  return JSON.parse(readFileSync(join(FIXTURES, vintage, `${iso3c}.json`), 'utf8')) as CountryInput;
}

describe('a missing debt anchor', () => {
  for (const vintage of VINTAGES) {
    for (const iso3c of ['ZMB', 'LBY']) {
      it(`${iso3c} refuses on ${vintage} instead of drawing a path`, () => {
        expect(() => runPipeline(load(vintage, iso3c), {})).toThrow(MissingDebtAnchorError);
      });

      it(`${iso3c} names the country, the year and the field on ${vintage}`, () => {
        let caught: unknown;
        try {
          runPipeline(load(vintage, iso3c), {});
        } catch (err) {
          caught = err;
        }
        const err = caught as MissingDebtAnchorError;
        expect(err).toBeInstanceOf(MissingDebtAnchorError);
        expect(err.iso3c).toBe(iso3c);
        expect(err.field).toBe('debt_to_gdp');
        expect(err.year).toBe(2029);
        // Character for character what the Python engine raises. compare.py
        // asserts the two are equal, so this string is a contract.
        expect(err.message).toBe(
          `No debt anchor for ${iso3c}: debt_to_gdp is missing for 2029, ` +
            'the last WEO year, which is the year the projection starts from',
        );
      });
    }
  }

  it('Zambia no longer reports a debt ratio of zero', () => {
    // The regression this whole lane exists for. Before the fix the frozen
    // vintage returned 0.000 for 2029, 2030 and 2050 against a real 2023 level
    // of 127.3 per cent.
    expect(() => runPipeline(load('weo-2024-10', 'ZMB'), {})).toThrow();
  });

  it('Libya is not given a debt build-up it never had', () => {
    const input = load('weo-2024-10', 'LBY');
    expect(input.macrofiscal.every((r) => r.debt === null)).toBe(true);
    expect(() => runPipeline(input, {})).toThrow(MissingDebtAnchorError);
  });
});

describe('years the projection does not read', () => {
  it('a hole before 2009 does not block a country', () => {
    const input = load('weo-2024-10', 'UGA');
    const holed: CountryInput = {
      ...input,
      macrofiscal: input.macrofiscal.map((r) =>
        r.years < 2009 ? { ...r, debt_to_gdp: null, debt: null } : r,
      ),
    };
    expect(() => runPipeline(holed, {})).not.toThrow();
  });

  it('a hole inside the window is named rather than carried', () => {
    const input = load('weo-2024-10', 'UGA');
    const holed: CountryInput = {
      ...input,
      macrofiscal: input.macrofiscal.map((r) =>
        r.years === 2015 ? { ...r, primary_expenditure: null } : r,
      ),
    };
    let caught: unknown;
    try {
      runPipeline(holed, {});
    } catch (err) {
      caught = err;
    }
    const err = caught as MissingMacrofiscalInputError;
    expect(err).toBeInstanceOf(MissingMacrofiscalInputError);
    expect(err.field).toBe('primary_expenditure');
    expect(err.year).toBe(2015);
    expect(err.message).toBe('Missing macrofiscal input for UGA: primary_expenditure is null for 2015');
  });
});

describe('the countries that still run', () => {
  for (const vintage of VINTAGES) {
    it(`Uganda projects on ${vintage}`, () => {
      const result = runPipeline(load(vintage, 'UGA'), {});
      expect(result.fiscal).toHaveLength(91);
    });

    it(`Serbia projects on ${vintage}`, () => {
      const result = runPipeline(load(vintage, 'SRB'), {});
      expect(result.fiscal).toHaveLength(91);
      const anchor = result.fiscal.find((r) => r.years === 2029)!;
      expect(anchor.debt_to_gdp).toBeGreaterThan(20);
      expect(anchor.debt_to_gdp).toBeLessThan(120);
    });
  }
});
