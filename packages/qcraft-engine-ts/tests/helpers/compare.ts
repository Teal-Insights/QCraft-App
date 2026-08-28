/**
 * Glue between an engine result, a golden-master CSV, and the parity recorder.
 */

import type { CsvRow } from './csv.js';
import type { ColumnSpec } from './tolerances.js';
import { assertSeriesClose } from './tolerance.js';
import { record } from './parityRecorder.js';

/** Engine row types are interfaces (no index signature), so read columns through this. */
function cell(row: object, column: string): number | null {
  const value = (row as Record<string, unknown>)[column];
  return value === undefined || value === null ? null : (value as number);
}

/**
 * Compare every column in `specs` between an engine result and a golden-master frame,
 * asserting tolerance and recording the worst deviation.
 *
 * @param module Label used in error messages (e.g. "climate/Paris").
 * @param recordAs Label the deviation is filed under; defaults to `module`.
 */
export function compareFrame<T extends { years: number }>(
  module: string,
  actual: readonly T[],
  expected: readonly CsvRow[],
  specs: Record<string, ColumnSpec>,
  recordAs = module,
): void {
  if (actual.length !== expected.length) {
    throw new Error(
      `${module}: row count mismatch (actual ${actual.length}, expected ${expected.length})`,
    );
  }

  const actualYears = actual.map((r) => r.years);
  for (let i = 0; i < actualYears.length; i += 1) {
    const expectedYear = expected[i]!['years'];
    if (actualYears[i] !== expectedYear) {
      throw new Error(
        `${module}: year mismatch at row ${i} (${actualYears[i]} vs ${String(expectedYear)})`,
      );
    }
  }

  for (const [column, spec] of Object.entries(specs)) {
    const keep = spec.years ?? ((): boolean => true);
    const idx: number[] = [];
    actualYears.forEach((y, i) => {
      if (keep(y)) idx.push(i);
    });

    const a = idx.map((i) => cell(actual[i]!, column));
    const e = idx.map((i) => cell(expected[i]!, column));

    const dev = assertSeriesClose(`${module}.${column}`, a, e, spec);
    const worstYear = dev.atIndex >= 0 ? String(actualYears[idx[dev.atIndex]!]) : 'n/a';
    record(recordAs, column, dev.maxAbs, idx.length, spec, worstYear);
  }
}

/**
 * Assert nulls sit in exactly the same rows on both sides.
 *
 * `test_fiscal.py::test_fiscal_gap_parity` checks this explicitly: a value in a row the
 * fixture leaves blank is a real bug even when every other number matches.
 */
export function assertNullPositions<T extends { years: number }>(
  label: string,
  actual: readonly T[],
  expected: readonly CsvRow[],
  column: string,
): void {
  const a = actual.filter((r) => cell(r, column) === null).map((r) => r.years);
  const e = expected.filter((r) => cell(r, column) === null).map((r) => r['years'] as number);
  if (a.length !== e.length || a.some((y, i) => y !== e[i])) {
    throw new Error(
      `${label}.${column}: null year mismatch\n  actual:   ${JSON.stringify(a)}\n  expected: ${JSON.stringify(e)}`,
    );
  }
}
