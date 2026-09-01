/**
 * Per-column tolerances, copied from the pytest suites in
 * `packages/qcraft-engine/tests/`. Never loosen one to make a test pass — a widening
 * tolerance is a parity failure in disguise.
 *
 * Columns the Python suites do not assert on (six climate columns) are held to the
 * tolerance the analogous fiscal column uses: `rel 1e-4` for levels, `abs 1e-3` for
 * ratios. That strengthens coverage rather than relaxing it.
 */

import type { Tolerance } from './tolerance.js';

/** Rows to skip for a given column, expressed as a year predicate. */
export interface ColumnSpec extends Tolerance {
  /** Only compare years where this returns true. Defaults to all years. */
  years?: (year: number) => boolean;
  /** Why rows are skipped — surfaced in the parity summary. */
  skipReason?: string;
}

const fromYear =
  (first: number) =>
  (year: number): boolean =>
    year >= first;

export const DEMOGRAPHY: Record<string, ColumnSpec> = {
  working_age_population: { absTol: 0.5 },
  total_population: { absTol: 0.5 },
  demography_growth_working_age: { absTol: 0.001 },
  demography_growth_total: { absTol: 0.001 },
};

/**
 * The productivity fixture is Excel's productivity series, so 2022-2029 carries the
 * WEO-period values that `baselineV1` back-calculates. `productivityCountry` emits
 * `productivityStart` as a placeholder across that window on purpose — baselineV1
 * overwrites it before anything downstream sees it. `test_productivity.py` compares
 * 2010-2021 and 2030+ for growth and 2009-2021 for levels for exactly this reason;
 * the level and OECD-ratio columns compound off the placeholder, so they diverge from
 * 2022 onward and are compared over the historical window only.
 *
 * `baseline_v1.labour_productivity_growth` is checked against the same fixture values
 * across the full horizon, so the WEO window is covered — just by the module that
 * actually produces it.
 */
const beforeWeoWindow = (year: number): boolean => year <= 2021;
const outsideWeoWindow = (year: number): boolean => year <= 2021 || year >= 2030;

export const PRODUCTIVITY: Record<string, ColumnSpec> = {
  productivity_growth_rate_percent: {
    absTol: 0.001,
    years: outsideWeoWindow,
    skipReason: '2022-2029 is the WEO placeholder window, back-calculated by baseline_v1',
  },
  productivity_level: {
    absTol: 0.01,
    relTol: 1e-6,
    years: beforeWeoWindow,
    skipReason: 'levels compound off the WEO placeholder growth from 2022',
  },
  productivity_level_oecd_percent: {
    absTol: 0.001,
    relTol: 1e-6,
    years: beforeWeoWindow,
    skipReason: 'derived from productivity_level, same placeholder divergence',
  },
};

export const INFLATION: Record<string, ColumnSpec> = {
  inflation: { absTol: 0.0001 },
};

export const BASELINE_V1: Record<string, ColumnSpec> = {
  working_age_population: { absTol: 0.01 },
  employment_growth: { absTol: 0.0001 },
  labour_productivity_growth: { absTol: 0.001 },
  gdp_deflator_growth_percent: { absTol: 0.0001 },
  real_gdp: { relTol: 1e-6 },
  real_gdp_growth_percent: { absTol: 0.001 },
  nominal_gdp: { relTol: 1e-6 },
  nominal_gdp_growth_percent: { absTol: 0.001 },
  // 2009 has no prior year in the engine's demography input, so it computes 0.0 while
  // the Excel-derived fixture carries a value. test_baseline_v1.py skips it the same way.
  population_growth: {
    absTol: 0.0001,
    years: fromYear(2010),
    skipReason: '2009 has no t-1 population in the engine input',
  },
};

export const INTEREST_RATE: Record<string, ColumnSpec> = {
  nominal_interest_rate: { absTol: 0.0001 },
  inflation: { absTol: 0.0001 },
  nominal_gdp_growth_percent: { absTol: 0.001 },
  real_interest_rate: { absTol: 0.001 },
  interest_growth_differential: { absTol: 0.001 },
};

export const FISCAL: Record<string, ColumnSpec> = {
  revenue: { relTol: 1e-4 },
  revenue_percent_gdp: { absTol: 0.001 },
  primary_expenditure: { relTol: 1e-4 },
  primary_expenditure_percent_gdp: { absTol: 0.001 },
  primary_balance: { relTol: 1e-4 },
  primary_balance_percent_gdp: { absTol: 0.001 },
  interest_expenditure: { relTol: 1e-4 },
  interest_expenditure_percent_gdp: { absTol: 0.001 },
  total_expenditure: { relTol: 1e-4 },
  overall_balance: { relTol: 1e-4 },
  overall_balance_percent_gdp: { absTol: 0.001 },
  debt_to_gdp: { absTol: 0.001 },
  debt: { relTol: 1e-4 },
  debt_stabilizing_primary_balance: {
    absTol: 0.001,
    years: fromYear(2010),
    skipReason: 'null in 2009 (needs t-1 debt)',
  },
  fiscal_gap: { relTol: 1e-4 },
};

export const CLIMATE: Record<string, ColumnSpec> = {
  labour_productivity_growth: { absTol: 1e-6 },
  real_gdp_growth_percent: { absTol: 1e-4 },
  nominal_gdp_growth_percent: { absTol: 1e-3 },
  nominal_gdp: { relTol: 1e-6 },
  real_gdp: { relTol: 1e-6 },
  employment_growth: { absTol: 1e-10 },
  revenue: { relTol: 1e-4 },
  revenue_percent_gdp: { absTol: 0.001 },
  primary_expenditure: { relTol: 1e-4 },
  primary_expenditure_percent_gdp: { absTol: 0.001 },
  primary_balance: { relTol: 1e-4 },
  primary_balance_percent_gdp: { absTol: 0.001 },
  interest_expenditure: { relTol: 1e-4 },
  interest_expenditure_percent_gdp: { absTol: 0.001 },
  total_expenditure: { relTol: 1e-4 },
  overall_balance: { relTol: 1e-4 },
  overall_balance_percent_gdp: { absTol: 0.001 },
  debt_to_gdp: { absTol: 0.001 },
  debt: { relTol: 1e-4 },
  debt_stabilizing_primary_balance: {
    absTol: 0.001,
    years: fromYear(2010),
    skipReason: 'null in 2009 (needs t-1 debt)',
  },
};

/** `test_climate.py::test_final_golden_master_parity` uses abs 0.01 on every column. */
export const FINAL: Tolerance = { absTol: 0.01 };
