/**
 * CSV of results, with the run's provenance travelling inside the file.
 *
 * A table export is the most forwardable thing in a packet: it opens in Excel,
 * gets pasted into a deck, and arrives without the report or the run JSON that
 * carried the caveats. The LIC-DSF scenario tool says this in its own comment
 * (licdsf-scenario-tool/ui/export.py) and answers it by appending the claim
 * status to every table it writes. Same answer here: the numbers come first so
 * the file parses cleanly as data, then a blank line, then the run manifest as
 * label/value rows.
 *
 * That ordering matters. Anything that reads the file as a table gets a clean
 * rectangle; anyone who scrolls down finds out what they are holding.
 */

import type { EngineResult, ScenarioKey } from '../engine/types';
import {
  manifestRows,
  modeLine,
  modeStatement,
  type RunManifest,
} from '../run/manifest';

export const RESULT_COLUMNS = [
  { key: 'year', label: 'Year', digits: 0 },
  { key: 'debt_to_gdp', label: 'Debt/GDP (%)', digits: 2 },
  { key: 'revenue_percent_gdp', label: 'Revenue (% GDP)', digits: 2 },
  { key: 'primary_expenditure_percent_gdp', label: 'Prim. exp. (% GDP)', digits: 2 },
  { key: 'primary_balance_percent_gdp', label: 'Prim. balance (% GDP)', digits: 2 },
  { key: 'interest_expenditure_percent_gdp', label: 'Interest (% GDP)', digits: 2 },
  { key: 'overall_balance_percent_gdp', label: 'Overall balance (% GDP)', digits: 2 },
] as const;

/** RFC 4180 quoting. Rationale notes are free text and will contain commas. */
export function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const row = (cells: Array<string | number>) => cells.map(csvCell).join(',');

/**
 * The run manifest as CSV rows, appended after the data.
 *
 * Named "Run manifest" rather than "Notes" because that is what it is: the same
 * object the run JSON carries, rendered for someone who only ever opens the CSV.
 */
function manifestTrailer(manifest: RunManifest): string[] {
  const lines: string[] = [
    '',
    row(['Run manifest']),
    row(['Application', `${manifest.app.name} ${manifest.app.version}`]),
    row(['Generated', manifest.generatedAt]),
    row(['Country', `${manifest.country.name} (${manifest.country.iso3c})`]),
    row(['Data mode', modeLine(manifest)]),
    row(['What that mode claims', modeStatement(manifest)]),
    row(['Data vintage', manifest.dataVintage]),
    row(['Results basis', manifest.engine.source]),
  ];

  if (manifest.engine.kind !== 'engine') {
    lines.push(
      row([
        'NOT RECOMPUTED',
        'These values were produced at the engine defaults and do not reflect ' +
          'the parameters below. See the Parameters section for what was ' +
          'requested and what was used.',
      ]),
    );
  }

  lines.push('');
  lines.push(row(['Parameters']));
  lines.push(row(['Parameter', 'Value', 'Default', 'State', 'Rationale']));
  for (const p of manifestRows(manifest)) {
    lines.push(row([p.label, p.display, p.defaultDisplay, p.state, p.note ?? '']));
  }

  if (manifest.engine.ignoredParams.length) {
    lines.push('');
    lines.push(row(['Parameters the results do NOT reflect']));
    lines.push(row(['Parameter', 'You set', 'Results show']));
    for (const p of manifest.engine.ignoredParams) {
      lines.push(row([p.label, p.requested, p.used]));
    }
  }

  return lines;
}

const fiscalCells = (f: Record<string, number>) =>
  RESULT_COLUMNS.map((c) => f[c.key].toFixed(c.digits));

/** One scenario's annual fiscal path. */
export function buildScenarioCsv(
  result: EngineResult,
  scenarioKey: ScenarioKey,
  manifest: RunManifest,
): string {
  const scenario = result.scenarios.find((s) => s.key === scenarioKey);
  const lines = [row(RESULT_COLUMNS.map((c) => c.key))];
  for (const f of scenario?.fiscal ?? []) {
    lines.push(fiscalCells(f as unknown as Record<string, number>).join(','));
  }
  return [...lines, ...manifestTrailer(manifest)].join('\n') + '\n';
}

/** Every scenario stacked, with a `scenario` column. This is the packet's CSV. */
export function buildAllScenariosCsv(
  result: EngineResult,
  manifest: RunManifest,
): string {
  const lines = [row(['scenario', ...RESULT_COLUMNS.map((c) => c.key)])];
  for (const s of result.scenarios) {
    for (const f of s.fiscal) {
      lines.push(
        [s.key, ...fiscalCells(f as unknown as Record<string, number>)].join(','),
      );
    }
  }
  return [...lines, ...manifestTrailer(manifest)].join('\n') + '\n';
}
