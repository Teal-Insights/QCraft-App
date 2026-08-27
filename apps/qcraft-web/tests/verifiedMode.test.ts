/**
 * The Verified badge, checked against the thing it claims.
 *
 * The badge says the tool matches the official IMF Excel workbook. Verified mode
 * runs `@qcraft/engine` over the frozen `weo-2024-10` payloads, and the golden
 * masters in `packages/qcraft-engine/tests/golden_masters/` are what the 147/147
 * parity result was measured on. So the claim reduces to one testable statement:
 * running Verified mode on Uganda has to reproduce `final/uganda.csv`, every
 * scenario, every snapshot year.
 *
 * That is the whole feature in one assertion. If the vintage payloads, the
 * adapter, the parameter mapping or the result mapping drift, this fails before
 * anyone sees the badge on a screen.
 *
 * ── Why this one skips ────────────────────────────────────────────────────────
 * It reads a per-country payload, and those are gitignored build artifacts
 * (42 MB per vintage). Every other suite runs on a fresh clone with no data, and
 * that property is worth keeping. So this suite skips loudly, naming the command
 * that produces what it needs, rather than failing a clone that never had it.
 */

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { runPipeline, type CountryInput } from '@qcraft/engine';

import { MODES } from '../src/content/modes';
import { readCoverage } from '../src/engine/countryData';
import {
  ENGINE_DEFAULTS,
  WEO_BOUNDARY_YEAR,
  boundaryYearFor,
} from '../src/engine/qcraftAdapter';
import { toEngineResult, toPipelineParams } from '../src/engine/pipelineResult';
import type { EngineParams } from '../src/engine/types';
import { num, parseCsv } from '../src/engine/csv';
import type { FiscalYear, ScenarioKey } from '../src/engine/types';

const payloadPath = (vintage: string, iso3c: string) =>
  fileURLToPath(
    new URL(`../../../data/vintages/${vintage}/json/${iso3c}.json`, import.meta.url),
  );

const FINAL_MASTER = fileURLToPath(
  new URL(
    '../../../packages/qcraft-engine/tests/golden_masters/final/uganda.csv',
    import.meta.url,
  ),
);

const VERIFIED = MODES.verified.vintage;
const CURRENT = MODES.current.vintage;

const havePayloads =
  existsSync(payloadPath(VERIFIED, 'UGA')) && existsSync(payloadPath(CURRENT, 'UGA'));

const MODE_COUNTRIES: string[] = havePayloads
  ? (
      JSON.parse(
        readFileSync(
          fileURLToPath(
            new URL(`../../../data/vintages/${VERIFIED}/json/index.json`, import.meta.url),
          ),
          'utf8',
        ),
      ) as { countries: Array<{ iso3c: string }> }
    ).countries.map((c) => c.iso3c)
  : [];

const load = (vintage: string, iso3c: string) =>
  JSON.parse(readFileSync(payloadPath(vintage, iso3c), 'utf8')) as CountryInput;

/**
 * The parameters the Uganda golden masters were generated with.
 *
 * NOT the app's defaults, and the difference matters. `packages/qcraft-engine-ts`
 * states them in `tests/pipeline-e2e.test.ts`, citing the pytest suites:
 * `test_fiscal.py` uses `debt_target=60`, `test_inflation.py` uses inflation
 * 3.5/3.5. The app opens on `debt_target=50` and inflation 5.0/3.5, which is a
 * different run and therefore a different set of numbers. Comparing the app's
 * defaults to the masters would fail by about 0.02 pp and mean nothing.
 */
const GOLDEN_PARAMS: EngineParams = {
  ...ENGINE_DEFAULTS,
  inflation_start: 3.5,
  inflation_end: 3.5,
  debt_target: 60.0,
};

const runMode = (
  mode: 'current' | 'verified',
  iso3c: string,
  params: EngineParams = ENGINE_DEFAULTS,
) => {
  const input = load(MODES[mode].vintage, iso3c);
  return toEngineResult(runPipeline(input, toPipelineParams(params)), {
    iso3c,
    countryName: input.country,
    weoBoundaryYear: WEO_BOUNDARY_YEAR,
    mode,
    dataVintage: MODES[mode].vintage,
  });
};

/** `final/uganda.csv` scenario labels -> our scenario keys. */
const SCENARIO_BY_MASTER_LABEL: Record<string, ScenarioKey> = {
  Baseline: 'Baseline',
  Paris: 'Paris',
  Moderate: 'Moderate',
  Hot: 'Hot',
  'Hot Adapted': 'Hot_Adapted',
  'Hot Unadapted': 'Hot_Unadapted',
  High: 'High',
};

const COMPARED_COLUMNS: Array<keyof FiscalYear> = [
  'revenue_percent_gdp',
  'primary_expenditure_percent_gdp',
  'primary_balance_percent_gdp',
  'interest_expenditure_percent_gdp',
  'overall_balance_percent_gdp',
  'debt_to_gdp',
];

/**
 * `test_climate.py::test_final_golden_master_parity` compares the final master on
 * an absolute tolerance of 0.01 across every column, and
 * `packages/qcraft-engine-ts/tests/helpers/tolerances.ts` copies that as
 * `TOL.FINAL`. The masters are Excel-extracted, so this is an engine-vs-workbook
 * comparison and 0.01 is the bar the parity claim was measured at. Never loosen
 * it: a widening tolerance is a parity failure in disguise.
 */
const FINAL_ABS_TOL = 0.01;

describe.skipIf(!havePayloads)('Verified mode against the golden master', () => {
  const result = runMode('verified', 'UGA', GOLDEN_PARAMS);
  const rows = parseCsv(readFileSync(FINAL_MASTER, 'utf8'));

  it('reads a non-empty final golden master', () => {
    expect(rows.length).toBeGreaterThan(0);
  });

  it('reproduces every scenario at every snapshot year', () => {
    for (const row of rows) {
      const key = SCENARIO_BY_MASTER_LABEL[row.scenario];
      expect(key, `unmapped scenario label ${JSON.stringify(row.scenario)}`).toBeDefined();

      const year = num(row, 'year');
      const series = result.scenarios.find((s) => s.key === key);
      expect(series, `missing scenario ${key}`).toBeDefined();

      const actual = series!.fiscal.find((f) => f.year === year);
      expect(actual, `missing ${key} ${year}`).toBeDefined();

      for (const column of COMPARED_COLUMNS) {
        expect(
          Math.abs(actual![column] - num(row, column)),
          `${key} ${year} ${column}: engine ${actual![column]} vs master ${num(row, column)}`,
        ).toBeLessThanOrEqual(FINAL_ABS_TOL);
      }
    }
  });

  it('reports Verified provenance, with the frozen vintage named', () => {
    expect(result.provenance.kind).toBe('engine');
    expect(result.provenance.mode).toBe('verified');
    expect(result.provenance.dataVintage).toBe('weo-2024-10');
    // The engine honours every parameter, so nothing is ever ignored.
    expect(result.provenance.ignoredParams).toEqual([]);
  });
});

describe.skipIf(!havePayloads)('the two modes are actually different runs', () => {
  it('produces a different debt path for the same country and parameters', () => {
    const verified = runMode('verified', 'UGA');
    const current = runMode('current', 'UGA');

    const debtAt = (r: typeof verified, year: number) =>
      r.scenarios[0]!.fiscal.find((f) => f.year === year)!.debt_to_gdp;

    // The control the whole feature rests on: if these agreed, the switch would
    // be changing a label and nothing else, which is the failure this feature
    // exists to prevent.
    expect(debtAt(current, 2099)).not.toBeCloseTo(debtAt(verified, 2099), 3);
    expect(current.provenance.dataVintage).not.toBe(verified.provenance.dataVintage);
  });
});

describe.skipIf(!havePayloads)('coverage, read off real payloads', () => {
  it('finds no climate estimates for the Maldives, in either mode', () => {
    for (const vintage of [VERIFIED, CURRENT]) {
      expect(readCoverage(load(vintage, 'MDV')).hasClimateData, vintage).toBe(false);
    }
  });

  it('finds climate estimates for Uganda, in either mode', () => {
    for (const vintage of [VERIFIED, CURRENT]) {
      expect(readCoverage(load(vintage, 'UGA')).hasClimateData, vintage).toBe(true);
    }
  });

  it('blocks Zambia and Libya for want of a debt anchor, in either mode', () => {
    for (const vintage of [VERIFIED, CURRENT]) {
      for (const iso3c of ['ZMB', 'LBY']) {
        expect(readCoverage(load(vintage, iso3c)).block, `${vintage} ${iso3c}`).toBe(
          'no-debt-anchor',
        );
      }
    }
  });

  it('blocks Afghanistan in Verified mode and clears it in Current mode', () => {
    // The clearest case that coverage is a property of the vintage, not of the
    // country. The frozen vintage carries Afghanistan rows through 2029 with
    // every fiscal value null from 2026; the April 2026 release stops at 2025
    // with real numbers, so the projection anchors on 2025 and runs.
    expect(readCoverage(load(VERIFIED, 'AFG')).block).toBe('no-debt-anchor');
    expect(readCoverage(load(CURRENT, 'AFG')).block).toBeNull();
  });

  it('counts the blocked countries in each mode', () => {
    // The census docs/country-coverage.md reports, asserted so the notice copy
    // and the documentation cannot drift apart from the data.
    const census = (vintage: string) =>
      MODE_COUNTRIES.filter((iso3c) => readCoverage(load(vintage, iso3c)).block !== null);

    expect(census(VERIFIED).sort()).toEqual([
      'AFG', 'LBN', 'LBY', 'LKA', 'PSE', 'SOM', 'SYR', 'ZMB',
    ]);
    expect(census(CURRENT).sort()).toEqual(['ECU', 'LBY', 'PSE', 'SOM', 'ZMB']);
  });

  it('counts the countries with no climate estimates in each mode', () => {
    const census = (vintage: string) =>
      MODE_COUNTRIES.filter((iso3c) => !readCoverage(load(vintage, iso3c)).hasClimateData);

    // The eleven from INTEGRATION-REPORT.md section 7.2, and the same eleven in
    // both vintages because the climate dataset is carried forward unchanged.
    const expected = [
      'BHR', 'BRB', 'HKG', 'LCA', 'MAC', 'MDV', 'MLT', 'PSE', 'SGP', 'TLS', 'TON',
    ];
    expect(census(VERIFIED).sort()).toEqual(expected);
    expect(census(CURRENT).sort()).toEqual(expected);
  });

  it('puts the WEO boundary where the country\'s data actually ends', () => {
    // Nearly every country runs to 2029 and the boundary is 2029. Six in the
    // April 2026 release do not, and shading their projection as observed data
    // would be a chart that lies: Syria's WEO series ends in 2010, so seventeen
    // years of projection would sit inside the "history" band.
    expect(boundaryYearFor(readCoverage(load(CURRENT, 'UGA')).weoMaxYear)).toBe(2029);
    expect(boundaryYearFor(readCoverage(load(CURRENT, 'SYR')).weoMaxYear)).toBe(2010);
    expect(boundaryYearFor(readCoverage(load(CURRENT, 'LKA')).weoMaxYear)).toBe(2024);
    // The frozen vintage carries every country to 2029, so the cap binds there.
    expect(boundaryYearFor(readCoverage(load(VERIFIED, 'SYR')).weoMaxYear)).toBe(2029);
  });

  it('names Serbia as Serbia', () => {
    // SRB carried the label "Kosovo" over Serbia's data in every dataset until
    // the emitter was corrected. A trainee picking a country must get that
    // country.
    for (const vintage of [VERIFIED, CURRENT]) {
      expect(load(vintage, 'SRB').country, vintage).toBe('Serbia');
    }
  });
});

if (!havePayloads) {
  describe('Verified mode parity', () => {
    it.skip(
      'needs the vintage payloads: uv run --package qcraft-pipeline python ' +
        'scripts/build_vintage_json.py weo-2024-10, and qcraft-pipeline run for ' +
        'weo-2026-04',
      () => {},
    );
  });
}
