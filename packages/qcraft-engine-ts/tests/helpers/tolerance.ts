/**
 * Tolerance checks matching `polars.testing.assert_series_equal(check_exact=False, ...)`.
 *
 * Polars applies `|a - b| <= abs_tol + rel_tol * |b|`, treats two nulls as equal, and
 * fails when only one side is null. `test_*.py` in packages/qcraft-engine is the source
 * of the tolerance numbers used by the suites — they are copied, never loosened.
 */

export interface Tolerance {
  absTol?: number;
  relTol?: number;
}

export interface Deviation {
  /** Largest observed |actual - expected| across the compared rows. */
  maxAbs: number;
  /** Index of the row where `maxAbs` occurred, or -1 when nothing was compared. */
  atIndex: number;
}

function withinTolerance(
  actual: number,
  expected: number,
  { absTol = 0, relTol = 0 }: Tolerance,
): boolean {
  if (Number.isNaN(actual) && Number.isNaN(expected)) return true;
  return Math.abs(actual - expected) <= absTol + relTol * Math.abs(expected);
}

/**
 * Assert two numeric series match within tolerance.
 *
 * @returns The worst absolute deviation, so callers can build a parity table.
 */
export function assertSeriesClose(
  label: string,
  actual: readonly (number | null)[],
  expected: readonly (number | null)[],
  tolerance: Tolerance,
): Deviation {
  if (actual.length !== expected.length) {
    throw new Error(
      `${label}: length mismatch (actual ${actual.length}, expected ${expected.length})`,
    );
  }

  let maxAbs = 0;
  let atIndex = -1;
  const failures: string[] = [];

  for (let i = 0; i < expected.length; i += 1) {
    const a = actual[i]!;
    const e = expected[i]!;

    if (a === null || e === null) {
      if (a !== e) failures.push(`  [${i}] null mismatch: actual=${a}, expected=${e}`);
      continue;
    }

    const diff = Math.abs(a - e);
    if (Number.isFinite(diff) && diff > maxAbs) {
      maxAbs = diff;
      atIndex = i;
    }
    if (!withinTolerance(a, e, tolerance)) {
      failures.push(`  [${i}] actual=${a}, expected=${e}, diff=${diff}`);
    }
  }

  if (failures.length > 0) {
    const shown = failures.slice(0, 5).join('\n');
    const more = failures.length > 5 ? `\n  ...and ${failures.length - 5} more` : '';
    throw new Error(
      `${label}: ${failures.length} value(s) outside tolerance ` +
        `(abs_tol=${tolerance.absTol ?? 0}, rel_tol=${tolerance.relTol ?? 0}):\n${shown}${more}`,
    );
  }

  return { maxAbs, atIndex };
}
