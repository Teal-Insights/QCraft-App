/**
 * Small shared helpers.
 *
 * `mustGet` exists because a missing key in Python raises `KeyError` and stops the
 * pipeline, while a missing key in JS yields `undefined` and silently poisons the
 * arithmetic with NaN. Throwing keeps the two engines failing on the same inputs.
 */

import { MissingYearError } from './errors.js';

export function mustGet<T>(map: Map<number, T>, year: number, what: string): T {
  const value = map.get(year);
  if (value === undefined) {
    throw new MissingYearError(year, what);
  }
  return value;
}

/** Logistic convergence used by both productivity and inflation. */
export function logisticGrowth(
  counter: number,
  start: number,
  end: number,
  rate = 0.5,
  turningPoint = 15,
): number {
  const sigmoid = 1 / (1 + Math.exp(-rate * (counter - turningPoint)));
  return start + (end - start) * sigmoid ** rate;
}

/** Polars renders NaN as a distinct value; the CSV fixtures carry it as a blank. */
export function nanToNull(value: number): number | null {
  return Number.isNaN(value) ? null : value;
}
