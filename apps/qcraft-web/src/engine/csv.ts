/**
 * Minimal CSV reader for the engine golden-master fixtures.
 *
 * The fixtures are engine-written CSVs (polars `write_csv`): no embedded commas,
 * no quotes, no newlines inside fields, empty string for null. A dependency-free
 * split is enough and keeps the failure mode obvious — anything fancier arriving
 * in these files should be a loud parse error, not a silently-mangled number.
 *
 * The masters are written with CRLF endings, so rows are split on /\r?\n/ — a
 * bare '\n' split leaves '\r' glued to the last column's name and every last
 * cell, which surfaces as a "column is missing" error naming a column that is
 * plainly there.
 */

export type CsvRow = Record<string, string>;

export function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const cells = line.split(',');
    const row: CsvRow = {};
    header.forEach((name, i) => {
      row[name] = cells[i] ?? '';
    });
    return row;
  });
}

/**
 * Read a numeric cell. Throws rather than coercing: a fixture column that has
 * been renamed upstream should stop the build, not render as a flat line at
 * zero. `null` is returned only for genuinely empty cells, which the engine
 * writes for the first year of lagged columns.
 */
export function num(row: CsvRow, column: string): number {
  const raw = row[column];
  if (raw === undefined) {
    throw new Error(
      `Column "${column}" is missing from the fixture (columns: ${Object.keys(row).join(', ')})`,
    );
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`Column "${column}" is not a finite number: ${JSON.stringify(raw)}`);
  }
  return value;
}
