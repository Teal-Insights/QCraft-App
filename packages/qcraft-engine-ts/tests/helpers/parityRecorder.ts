/**
 * Collects the worst absolute deviation per (module, metric) so the suite can emit the
 * parity summary table that MORNING-REPORT.md carries.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export interface ParityEntry {
  module: string;
  metric: string;
  /** How many series were folded into this row (e.g. 6 climate scenarios). */
  series: number;
  rows: number;
  maxAbs: number;
  absTol: number;
  relTol: number;
  worstAt: string;
}

const entries = new Map<string, ParityEntry>();

export function record(
  module: string,
  metric: string,
  maxAbs: number,
  rows: number,
  tolerance: { absTol?: number; relTol?: number },
  worstAt: string,
): void {
  const key = `${module}::${metric}`;
  const existing = entries.get(key);
  if (existing) {
    existing.series += 1;
    existing.rows += rows;
    if (maxAbs > existing.maxAbs) {
      existing.maxAbs = maxAbs;
      existing.worstAt = worstAt;
    }
    return;
  }
  entries.set(key, {
    module,
    metric,
    series: 1,
    rows,
    maxAbs,
    absTol: tolerance.absTol ?? 0,
    relTol: tolerance.relTol ?? 0,
    worstAt,
  });
}

export function snapshot(): ParityEntry[] {
  return [...entries.values()];
}

/** Write the collected deviations as JSON plus a markdown table. */
export function writeParitySummary(jsonPath: string, markdownPath: string, meta: object): void {
  const rows = snapshot().sort(
    (a, b) => a.module.localeCompare(b.module) || a.metric.localeCompare(b.metric),
  );

  mkdirSync(dirname(jsonPath), { recursive: true });
  writeFileSync(jsonPath, `${JSON.stringify({ ...meta, metrics: rows }, null, 2)}\n`, 'utf8');

  const fmt = (v: number): string => {
    if (v === 0) return '0';
    if (v < 1e-9) return v.toExponential(2);
    return v < 1 ? v.toExponential(2) : v.toPrecision(4);
  };

  const lines = [
    '| Module | Metric | Series | Rows | Max abs deviation | Tolerance (abs / rel) |',
    '| --- | --- | ---: | ---: | ---: | --- |',
    ...rows.map(
      (r) =>
        `| ${r.module} | \`${r.metric}\` | ${r.series} | ${r.rows} | ${fmt(r.maxAbs)} | ${r.absTol} / ${r.relTol} |`,
    ),
  ];
  mkdirSync(dirname(markdownPath), { recursive: true });
  writeFileSync(markdownPath, `${lines.join('\n')}\n`, 'utf8');
}
