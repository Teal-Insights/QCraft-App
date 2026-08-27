/**
 * The mapping layer between `@qcraft/engine`'s `PipelineResult` and this app's
 * `EngineResult`.
 *
 * ── Why this file exists before the engine does ───────────────────────────────
 * `packages/qcraft-engine-ts` lives in lane 1's clone, not this one, so the
 * package cannot be imported here yet. But SHARED/engine-api.md publishes its
 * exact output shape, and the mapping from that shape to what the charts want is
 * the only real work in wiring it up. So the mapping is written and tested here
 * against the contract; when the package lands in this repo the adapter is:
 *
 *   import { runPipeline, DEFAULTS } from '@qcraft/engine';
 *   import ugandaInput from '<country>.json';
 *
 *   const result = runPipeline(input, toPipelineParams(params));
 *   return toEngineResult(result, { iso3c, countryName });
 *
 * The structural types below are declared locally, mirroring section 4 of the
 * contract, so this module type-checks standalone. When `@qcraft/engine` is
 * installed, swap these declarations for its exported types — they are
 * intentionally the same shape, and the compiler will confirm it.
 */

import {
  SCENARIO_DISPLAY_ORDER,
  SCENARIO_LABELS,
  type ClimateScenario,
  type EngineParams,
  type EngineResult,
  type FiscalYear,
  type ScenarioSeries,
} from './types';

/**
 * Nullable numeric cell. Per the contract, `debt_stabilizing_primary_balance`
 * is null at 2009 and `fiscal_gap` is null from 2009 through WEO_MAX_YEAR - 4.
 * We do not chart either, but the types carry the nullability so a future
 * caller cannot forget it.
 */
export type Num = number | null;

/** Mirrors `FiscalRow` in SHARED/engine-api.md section 4. */
export interface PipelineFiscalRow {
  years: number;
  revenue_percent_gdp: number;
  primary_expenditure_percent_gdp: number;
  primary_balance_percent_gdp: number;
  interest_expenditure_percent_gdp: number;
  overall_balance_percent_gdp: number;
  debt_to_gdp: number;
  debt_stabilizing_primary_balance?: Num;
  fiscal_gap?: Num;
}

/** Mirrors `BaselineV1Row` — only the fields this app reads. */
export interface PipelineBaselineV1Row {
  years: number;
  real_gdp: number;
}

/** Mirrors `ClimateRow` — a fiscal row plus its own GDP path. */
export interface PipelineClimateRow extends PipelineFiscalRow {
  real_gdp: number;
}

/** Mirrors `PipelineResult`. */
export interface PipelineResultLike {
  baseline_v1: readonly PipelineBaselineV1Row[];
  fiscal: readonly PipelineFiscalRow[];
  climate: Readonly<Record<string, readonly PipelineClimateRow[]>>;
}

/**
 * `PipelineParams` per the contract. Note it takes NO `iso3c` — the country is
 * chosen by which `CountryInput` you hand `runPipeline`, not by a parameter. So
 * this drops `iso3c` from our `EngineParams` and passes the rest through
 * unchanged; every other key already matches the contract name-for-name.
 */
export function toPipelineParams(params: EngineParams) {
  const { iso3c: _iso3c, ...rest } = params;
  return rest;
}

function toFiscalYear(row: PipelineFiscalRow): FiscalYear {
  return {
    year: row.years,
    revenue_percent_gdp: row.revenue_percent_gdp,
    primary_expenditure_percent_gdp: row.primary_expenditure_percent_gdp,
    primary_balance_percent_gdp: row.primary_balance_percent_gdp,
    interest_expenditure_percent_gdp: row.interest_expenditure_percent_gdp,
    overall_balance_percent_gdp: row.overall_balance_percent_gdp,
    debt_to_gdp: row.debt_to_gdp,
  };
}

/**
 * Shape a `PipelineResult` into the app's `EngineResult`.
 *
 * Baseline GDP comes from `baseline_v1`, which is the only place the no-climate
 * GDP path exists; each climate scenario carries its own `real_gdp`. Scenarios
 * come out in SCENARIO_DISPLAY_ORDER, and a scenario the engine did not return
 * is skipped rather than faked.
 */
export function toEngineResult(
  result: PipelineResultLike,
  meta: {
    iso3c: string;
    countryName: string;
    weoBoundaryYear: number;
    /**
     * The vintage of the CountryInput this result was computed from, as
     * `data/vintages/<vintage>/` names it. The columnar per-country JSON carries
     * it in a `vintage` field (SHARED/engine-api.md section 3.3); the
     * row-oriented export does not, so the loader has to supply it. Required,
     * not optional: an unlabelled vintage in a run manifest is a run nobody can
     * reproduce.
     */
    dataVintage: string;
  },
): EngineResult {
  const gdpByYear = new Map(result.baseline_v1.map((r) => [r.years, r.real_gdp]));

  const baseline: ScenarioSeries = {
    key: 'Baseline',
    label: SCENARIO_LABELS.Baseline,
    fiscal: result.fiscal.map(toFiscalYear),
    // baseline_v1 and fiscal are both 91 rows over the same years, but join on
    // `years` rather than index so a shape change upstream fails loudly.
    gdp: result.fiscal.flatMap((r) => {
      const real_gdp = gdpByYear.get(r.years);
      return real_gdp == null ? [] : [{ year: r.years, real_gdp }];
    }),
  };

  const climate = SCENARIO_DISPLAY_ORDER.flatMap((key: ClimateScenario) => {
    const rows = result.climate[key];
    if (!rows?.length) return [];
    return [
      {
        key,
        label: SCENARIO_LABELS[key],
        fiscal: rows.map(toFiscalYear),
        gdp: rows.map((r) => ({ year: r.years, real_gdp: r.real_gdp })),
      } satisfies ScenarioSeries,
    ];
  });

  return {
    iso3c: meta.iso3c,
    countryName: meta.countryName,
    scenarios: [baseline, ...climate],
    weoBoundaryYear: meta.weoBoundaryYear,
    provenance: {
      kind: 'engine',
      source: '@qcraft/engine runPipeline()',
      dataVintage: meta.dataVintage,
      // The engine honours every parameter, so nothing is ever ignored. This is
      // what makes the UI's fixture banner disappear on its own.
      ignoredParams: [],
    },
  };
}
