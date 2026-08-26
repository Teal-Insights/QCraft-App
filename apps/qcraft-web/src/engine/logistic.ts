/**
 * The engine's logistic convergence, ported once.
 *
 * Two things in the engine converge a rate from a start value to a long-run
 * value along this curve: labour productivity growth
 * (packages/qcraft-engine/src/qcraft_engine/productivity.py, `_logistic_growth`)
 * and GDP deflator growth (inflation.py, which imports the same function). They
 * differ only in the turning point.
 *
 * This lived in src/widgets/models/growthPath.ts until the parameter context
 * panels needed the same curve. Two ports of one formula is how the app ends up
 * drawing a path in the sidebar that disagrees with the path in a widget, so
 * there is one definition and both import it. Pinned against the golden masters
 * by tests/widgets.growthPath.test.ts and tests/context.model.test.ts.
 */

/** Verbatim from productivity.py and inflation.py. */
export const LOGISTIC_RATE = 0.5;
export const PRODUCTIVITY_TURNING_POINT = 15;
export const INFLATION_TURNING_POINT = 5;

/**
 * The asymmetric logistic the engine converges every rate with.
 *
 *   growth = start + (end - start) * sigmoid(rate * (counter - turningPoint)) ^ rate
 *
 * The outer `** rate` is not a typo in the engine and is not one here: it is
 * what makes the transition asymmetric, slow to leave the start value and slow
 * to settle at the end value.
 *
 * `counter` is years past the last WEO year, so the first projected year is 1.
 */
export function logisticGrowth(
  counter: number,
  start: number,
  end: number,
  rate = LOGISTIC_RATE,
  turningPoint = PRODUCTIVITY_TURNING_POINT,
): number {
  const sigmoid = 1 / (1 + Math.exp(-rate * (counter - turningPoint)));
  return start + (end - start) * sigmoid ** rate;
}
