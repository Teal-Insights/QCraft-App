/**
 * What each context panel draws, as pure functions over the bundled sources.
 *
 * Nothing here is a stylised illustration. Every projection is the engine's own
 * arithmetic ported from the Python, and every record is the published series
 * the engine reads. tests/context.model.test.ts pins both halves against the
 * golden masters.
 *
 * The one thing this module cannot do is recompute the projection. Interest
 * rates depend on nominal GDP growth, which depends on the whole baseline, so
 * the rate approaches are projected on the golden master's growth and deflator
 * path. `interestRateApproaches` says so in its return value rather than in a
 * comment nobody reads, and the panel prints it.
 */

import {
  INFLATION_TURNING_POINT,
  LOGISTIC_RATE,
  PRODUCTIVITY_TURNING_POINT,
  logisticGrowth,
} from '../engine/logistic';
import type { ChartPoint } from '../charts/types';
import {
  GM_DEFLATOR_GROWTH,
  GM_NOMINAL_GDP_GROWTH,
  WEO_MAX_YEAR,
  type Series,
  deflatorIndex,
  effectiveRate,
  populationLevels,
  productivityLevels,
  type DemographyMeasure,
} from './sources';

export const YEAR_END = 2099;

/**
 * Long-run real rate the engine assumes under the "Real interest rate"
 * approach. `long_run_interest_rate` default in
 * packages/qcraft-engine/src/qcraft_engine/interest_rate.py.
 */
export const LONG_RUN_REAL_RATE = 1.0;

/** Year-over-year growth of a level series, in percent. The engine's formula. */
export function growthOf(levels: Series, from: number, to: number): ChartPoint[] {
  const out: ChartPoint[] = [];
  for (let year = from; year <= to; year += 1) {
    const prior = levels.get(year - 1);
    const value = levels.get(year);
    if (prior == null || value == null || prior === 0) continue;
    out.push({ year, value: (value / prior) * 100 - 100 });
  }
  return out;
}

/** A year-indexed series as chart points, over a window, skipping gaps. */
export function pointsOf(series: Series, from: number, to: number): ChartPoint[] {
  const out: ChartPoint[] = [];
  for (let year = from; year <= to; year += 1) {
    const value = series.get(year);
    if (value != null) out.push({ year, value });
  }
  return out;
}

// ── Demography ───────────────────────────────────────────────────────────────

/**
 * Population growth under one UN variant, derived exactly as
 * `demography_country()` derives it: the year-over-year growth of the level.
 *
 * `from` defaults to 2010 because 2009 is the first year in the bundled extract
 * and has no prior year to grow from, which is also why the demography golden
 * master's growth columns are null in 2009.
 */
export function variantGrowth(
  iso3c: string,
  measure: DemographyMeasure,
  variant: string,
  from = 2010,
  to = YEAR_END,
): ChartPoint[] {
  const levels = populationLevels(iso3c, measure, variant);
  if (!levels) return [];
  return growthOf(levels, from, to);
}

/**
 * The last year the three variants are still identical.
 *
 * This is not a constant to be looked up, it is a property of the data, and it
 * is the single most useful thing the demography panel can tell someone: the
 * variant you pick cannot move the working-age population until the children
 * whose numbers the variants disagree about have grown into the labour force.
 * Returns null if the variants differ from the first year, or if the country is
 * not in the bundled set.
 */
export function variantsDivergeAfter(
  iso3c: string,
  measure: DemographyMeasure,
): number | null {
  const low = populationLevels(iso3c, measure, 'Low');
  const medium = populationLevels(iso3c, measure, 'Medium');
  const high = populationLevels(iso3c, measure, 'High');
  if (!low || !medium || !high) return null;

  let last: number | null = null;
  for (const year of [...medium.keys()].sort((a, b) => a - b)) {
    if (low.get(year) === medium.get(year) && medium.get(year) === high.get(year)) {
      last = year;
    } else {
      break;
    }
  }
  return last;
}

/** Spread between the High and Low variant growth rates at one year, in points. */
export function variantSpreadAt(
  iso3c: string,
  measure: DemographyMeasure,
  year: number,
): number | null {
  const high = variantGrowth(iso3c, measure, 'High', year, year)[0];
  const low = variantGrowth(iso3c, measure, 'Low', year, year)[0];
  if (!high || !low) return null;
  return high.value - low.value;
}

// ── Productivity and inflation ───────────────────────────────────────────────

/**
 * Labour productivity growth as the World Bank's levels imply it.
 * The record ends in 2022; from 2023 the engine stops reading WDI and
 * back-calculates, which is a different claim and gets a different line.
 */
export function productivityRecord(iso3c: string, from = 2001): ChartPoint[] {
  const levels = productivityLevels(iso3c);
  if (!levels) return [];
  return growthOf(levels, from, YEAR_END);
}

/**
 * GDP deflator growth from the WEO deflator index, which is what
 * `inflation_country()` computes for the historical period.
 */
export function inflationRecord(iso3c: string, from = 2002): ChartPoint[] {
  const index = deflatorIndex(iso3c);
  if (!index) return [];
  return growthOf(index, from, WEO_MAX_YEAR);
}

/**
 * The path a start value and a long-run value imply, on the engine's logistic.
 * Projection years only: before 2030 the engine reads the record, so drawing an
 * assumption there would claim the parameter does work it does not do.
 */
export function assumptionPath(
  start: number,
  end: number,
  turningPoint: number,
): ChartPoint[] {
  const out: ChartPoint[] = [];
  for (let year = WEO_MAX_YEAR + 1; year <= YEAR_END; year += 1) {
    out.push({
      year,
      value: logisticGrowth(year - WEO_MAX_YEAR, start, end, LOGISTIC_RATE, turningPoint),
    });
  }
  return out;
}

export const productivityAssumption = (start: number, end: number) =>
  assumptionPath(start, end, PRODUCTIVITY_TURNING_POINT);

export const inflationAssumption = (start: number, end: number) =>
  assumptionPath(start, end, INFLATION_TURNING_POINT);

/**
 * Do two paths agree closely enough to be one line on a chart?
 *
 * Used to decide whether the panel needs to draw the projection's own path
 * beside the user's assumption. A tenth of a percentage point is the smallest
 * difference the sidebar can express, so anything under half of that is the
 * same setting arrived at by a different route.
 */
export function pathsAgree(a: ChartPoint[], b: ChartPoint[], tolerance = 0.05): boolean {
  if (a.length !== b.length) return false;
  return a.every((point, i) => Math.abs(point.value - b[i].value) <= tolerance);
}

// ── Interest rate ────────────────────────────────────────────────────────────

export type RateApproach =
  | 'Nominal interest rate'
  | 'Interest-growth differential'
  | 'Real interest rate';

export interface ApproachPaths {
  /** The observed effective rate, shared by all three approaches. */
  record: ChartPoint[];
  /** One projected path per approach, from 2030. */
  projections: Record<RateApproach, ChartPoint[]>;
  /** The rate the projections anchor on: the last observed year. */
  anchorYear: number;
  anchorRate: number;
  /**
   * The interest-growth differential at the anchor year, which the differential
   * approach then holds fixed. Reported because it is the number that decides
   * whether that approach projects a rising or a falling rate.
   */
  anchorDifferential: number;
}

/**
 * The three approaches, projected forward for the golden-master country.
 *
 * Ported from `interest_rate_country()` in
 * packages/qcraft-engine/src/qcraft_engine/interest_rate.py. Historical years
 * take the observed rate under all three; projection years differ:
 *
 *   Nominal        hold the last observed nominal rate
 *   Differential   hold the gap to nominal GDP growth, so the rate tracks growth
 *                  (uses the PRIOR year's growth, as the engine does)
 *   Real           hold the real rate at 1.0% and rebuild the nominal rate from
 *                  the PRIOR year's inflation
 *
 * `growth` and `inflation` are the engine's own baseline path, taken from the
 * interest-rate golden master. That is the honest limit of this panel: it shows
 * what each approach implies on the projection the app is currently drawing, not
 * on a projection recomputed for moved parameters. The fixture cannot recompute
 * and the panel does not pretend it can.
 */
export function interestRateApproaches(
  observed: Series,
  growth: Series = GM_NOMINAL_GDP_GROWTH,
  inflation: Series = GM_DEFLATOR_GROWTH,
  longRunRealRate = LONG_RUN_REAL_RATE,
): ApproachPaths | null {
  const observedYears = [...observed.keys()].sort((a, b) => a - b);
  if (!observedYears.length) return null;

  const anchorYear = observedYears[observedYears.length - 1];
  const anchorRate = observed.get(anchorYear)!;
  const anchorGrowth = growth.get(anchorYear);
  if (anchorGrowth == null) return null;

  const anchorDifferential =
    ((anchorRate / 100 - anchorGrowth / 100) / (1 + anchorGrowth / 100)) * 100;

  const projections: Record<RateApproach, ChartPoint[]> = {
    'Nominal interest rate': [],
    'Interest-growth differential': [],
    'Real interest rate': [],
  };

  for (let year = anchorYear + 1; year <= YEAR_END; year += 1) {
    const priorGrowth = growth.get(year - 1);
    const priorInflation = inflation.get(year - 1);
    if (priorGrowth == null || priorInflation == null) break;

    projections['Nominal interest rate'].push({ year, value: anchorRate });
    projections['Interest-growth differential'].push({
      year,
      value: (1 + priorGrowth / 100) * (1 + anchorDifferential / 100) * 100 - 100,
    });
    projections['Real interest rate'].push({
      year,
      value: (1 + longRunRealRate / 100) * (1 + priorInflation / 100) * 100 - 100,
    });
  }

  return {
    record: pointsOf(observed, observedYears[0], anchorYear),
    projections,
    anchorYear,
    anchorRate,
    anchorDifferential,
  };
}

/** The value a path ends on, for captions. */
export const endValue = (points: ChartPoint[]): number | null =>
  points.length ? points[points.length - 1].value : null;

/** The value a path takes at one year, for captions. */
export const valueAt = (points: ChartPoint[], year: number): number | null =>
  points.find((p) => p.year === year)?.value ?? null;

export { effectiveRate, WEO_MAX_YEAR };
