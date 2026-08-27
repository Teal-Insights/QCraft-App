/**
 * Run facts: the numbers a takeaway title is computed from.
 *
 * A title in the briefing register is a template plus facts from THIS run.
 * "Under the hot scenario, debt passes the fiscal ceiling in 2041" is only
 * honest if 2041 came out of the projection rather than out of the sentence.
 * So every fact a title can state is computed here first, as a plain value, and
 * the title module is a pure function of these.
 *
 * Keeping them separate has a second use: a fact can be absent. The Uganda
 * baseline never crosses its debt target, so `thresholdCrossing` returns
 * undefined and the title module says so instead of naming a year that is not
 * there. A canned title cannot do that, which is the whole argument for
 * computing them.
 */

import type { EngineParams, EngineResult, ScenarioKey } from '../engine/adapter';
import { PARAM_FIELDS, type ParamKey } from '../content/params';
import type { ChartPoint } from './types';
import { findScenario, valueAt, type FiscalMetric } from '../selectors';

/** Last projection year. The engine runs 2009 to 2099 (constants.YEAR_END). */
export const HORIZON_YEAR = 2099;

/**
 * The parameters the charted numbers were actually produced with.
 *
 * The fixture-backed adapter serves one parameter set and reports every setting
 * it could not honour in `provenance.ignoredParams`. A debt target rule drawn at
 * a value the run did not use would be a chart claiming something false about
 * its own data, so the rule is drawn at what was used, and the caller labels it
 * with that value.
 *
 * With a real engine behind the adapter `ignoredParams` is empty and this
 * returns the requested parameters unchanged.
 */
export function effectiveParams(
  result: EngineResult,
  requested: EngineParams,
  defaults: EngineParams,
): EngineParams {
  const ignored = new Set(result.provenance.ignoredParams.map((p) => p.label));
  if (!ignored.size) return requested;

  const out = { ...requested };
  for (const field of PARAM_FIELDS) {
    if (ignored.has(field.label)) {
      const key = field.key as ParamKey;
      (out as Record<string, unknown>)[key] = defaults[key];
    }
  }
  return out;
}

/** True when the run could not honour the setting the sidebar is showing. */
export function isParamInForce(result: EngineResult, key: ParamKey): boolean {
  const field = PARAM_FIELDS.find((f) => f.key === key);
  if (!field) return true;
  return !result.provenance.ignoredParams.some((p) => p.label === field.label);
}

export interface PathFacts {
  first: ChartPoint;
  last: ChartPoint;
  peak: ChartPoint;
  trough: ChartPoint;
  /** The path's value at the WEO boundary, where the projection takes over. */
  atBoundary?: ChartPoint;
}

export function pathFacts(points: ChartPoint[], boundaryYear?: number): PathFacts | undefined {
  if (!points.length) return undefined;
  let peak = points[0]!;
  let trough = points[0]!;
  for (const p of points) {
    if (p.value > peak.value) peak = p;
    if (p.value < trough.value) trough = p;
  }
  return {
    first: points[0]!,
    last: points[points.length - 1]!,
    peak,
    trough,
    atBoundary: boundaryYear == null ? undefined : points.find((p) => p.year === boundaryYear),
  };
}

export interface ThresholdCrossing {
  /** The first year on the far side of the threshold. */
  year: number;
  direction: 'above' | 'below';
}

export interface ThresholdFacts {
  value: number;
  /** Where the path ends up relative to the threshold. */
  endsAbove: boolean;
  /** Where the path sits when the projection takes over. */
  startsAbove: boolean;
  /**
   * The crossing that decides the end state, if there is one. A path that
   * wanders across the target repeatedly gets the LAST crossing in its ending
   * direction, because that is the one a reader is asking about when they ask
   * when the target is breached.
   */
  crossing?: ThresholdCrossing;
  /** Every crossing, for a caller that wants to say the path is not monotone. */
  crossings: ThresholdCrossing[];
}

/**
 * Where a path sits against a constant threshold, over the projection window.
 *
 * `from` defaults to the whole series. Pass the WEO boundary year to ignore
 * crossings inside the observed record: "debt passed 50% in 2016" is history,
 * not a projection finding, and a title that states it as a finding misleads.
 */
export function thresholdFacts(
  points: ChartPoint[],
  value: number,
  from?: number,
): ThresholdFacts | undefined {
  const window = from == null ? points : points.filter((p) => p.year >= from);
  if (window.length < 2) return undefined;

  const crossings: ThresholdCrossing[] = [];
  for (let i = 1; i < window.length; i += 1) {
    const prev = window[i - 1]!.value;
    const here = window[i]!.value;
    if (prev <= value && here > value) {
      crossings.push({ year: window[i]!.year, direction: 'above' });
    } else if (prev >= value && here < value) {
      crossings.push({ year: window[i]!.year, direction: 'below' });
    }
  }

  const endsAbove = window[window.length - 1]!.value > value;
  const wanted = endsAbove ? 'above' : 'below';
  const crossing = [...crossings].reverse().find((c) => c.direction === wanted);

  return {
    value,
    endsAbove,
    startsAbove: window[0]!.value > value,
    crossing,
    crossings,
  };
}

export interface Envelope {
  lower: ChartPoint[];
  upper: ChartPoint[];
}

/**
 * The min and max across a set of series, year by year.
 *
 * This is the shape the scenario fan is drawn as in the briefing register. It
 * is a summary of exactly the paths passed in and nothing else, so the caller
 * decides whether the baseline belongs inside the envelope. On the debt and GDP
 * charts it does not: the baseline is the reference the climate range is read
 * against, not one of the outcomes in the range.
 */
export function envelope(seriesPoints: ChartPoint[][]): Envelope | undefined {
  const present = seriesPoints.filter((p) => p.length);
  if (present.length < 2) return undefined;

  const years = new Map<number, number[]>();
  for (const points of present) {
    for (const p of points) {
      const bucket = years.get(p.year);
      if (bucket) bucket.push(p.value);
      else years.set(p.year, [p.value]);
    }
  }

  const sorted = [...years.entries()]
    .filter(([, vs]) => vs.length === present.length)
    .sort((a, b) => a[0] - b[0]);

  return {
    lower: sorted.map(([year, vs]) => ({ year, value: Math.min(...vs) })),
    upper: sorted.map(([year, vs]) => ({ year, value: Math.max(...vs) })),
  };
}

export interface ScenarioExtreme {
  key: ScenarioKey;
  label: string;
  value: number;
}

/** Best and worst climate scenario on a fiscal metric in one year. */
export function fiscalExtremes(
  result: EngineResult,
  metric: FiscalMetric,
  year: number,
): { best: ScenarioExtreme; worst: ScenarioExtreme; spread: number } | undefined {
  const values = result.scenarios
    .filter((s) => s.key !== 'Baseline')
    .map((s) => ({ key: s.key, label: s.label, value: valueAt(s, year, metric) }))
    .filter((v): v is ScenarioExtreme => v.value != null);
  if (values.length < 2) return undefined;

  const sorted = [...values].sort((a, b) => a.value - b.value);
  const best = sorted[0]!;
  const worst = sorted[sorted.length - 1]!;
  return { best, worst, spread: worst.value - best.value };
}

/**
 * Each climate scenario's real GDP as a percentage deviation from the baseline,
 * in one year. Negative is a shortfall.
 */
export function gdpShortfallExtremes(
  result: EngineResult,
  year: number,
): { best: ScenarioExtreme; worst: ScenarioExtreme; spread: number } | undefined {
  const baseline = findScenario(result, 'Baseline');
  const base = baseline?.gdp.find((g) => g.year === year)?.real_gdp;
  if (!base) return undefined;

  const values = result.scenarios
    .filter((s) => s.key !== 'Baseline')
    .map((s) => {
      const gdp = s.gdp.find((g) => g.year === year)?.real_gdp;
      return gdp == null ? undefined : { key: s.key, label: s.label, value: (gdp / base - 1) * 100 };
    })
    .filter((v): v is ScenarioExtreme => v != null);
  if (values.length < 2) return undefined;

  const sorted = [...values].sort((a, b) => a.value - b.value);
  return {
    // On a shortfall the WORST outcome is the most negative one, so the sort
    // order is the reverse of the debt chart's. Naming them by meaning rather
    // than by position is what keeps the titles from inverting.
    worst: sorted[0]!,
    best: sorted[sorted.length - 1]!,
    spread: sorted[sorted.length - 1]!.value - sorted[0]!.value,
  };
}
