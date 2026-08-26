/**
 * Minimal CSV reader for the frozen golden-master fixtures.
 *
 * Mirrors how `test_golden_masters.py` reads them: a blank cell is a null, and the
 * literal `#REF!` (an Excel export artefact) is also a null. Fixtures are read-only —
 * nothing here ever writes back.
 */

import { readFileSync } from 'node:fs';

const NULL_TOKENS = new Set(['', '#REF!', 'NA', 'null']);

/** One parsed row: header name -> string | number | null. */
export type CsvRow = Record<string, string | number | null>;

function splitLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else inQuotes = false;
      } else current += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') {
      fields.push(current);
      current = '';
    } else current += ch;
  }
  fields.push(current);
  return fields;
}

/** Parse a CSV file, coercing numeric-looking cells to numbers. */
export function readCsv(path: string): CsvRow[] {
  const text = readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  const header = splitLine(lines[0]!).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const fields = splitLine(line);
    const row: CsvRow = {};
    header.forEach((name, i) => {
      const raw = (fields[i] ?? '').trim();
      if (NULL_TOKENS.has(raw)) {
        row[name] = null;
        return;
      }
      const num = Number(raw);
      row[name] = raw !== '' && Number.isFinite(num) ? num : raw;
    });
    return row;
  });
}

/** Read a required numeric column, asserting the fixture actually has numbers there. */
export function numColumn(rows: readonly CsvRow[], name: string): number[] {
  return rows.map((r, i) => {
    const v = r[name];
    if (typeof v !== 'number') {
      throw new Error(`Column '${name}' row ${i} is not numeric: ${JSON.stringify(v)}`);
    }
    return v;
  });
}

/** Read a nullable numeric column. */
export function nullableColumn(rows: readonly CsvRow[], name: string): (number | null)[] {
  return rows.map((r, i) => {
    const v = r[name];
    if (v === null) return null;
    if (typeof v !== 'number') {
      throw new Error(`Column '${name}' row ${i} is not numeric: ${JSON.stringify(v)}`);
    }
    return v;
  });
}
