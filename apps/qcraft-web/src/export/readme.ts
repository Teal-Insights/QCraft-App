import { identityRows } from '../run/manifest';
/**
 * READ-ME.txt: the first thing in the archive, for the person who did not ask
 * for it.
 *
 * A packet is forwarded. Somebody who never opened the Explorer receives a zip
 * with eight files in it and has to decide which one to open and whether the
 * numbers can be cited. This file answers both in plain text, which is the one
 * format that opens on every machine with no application and no rendering.
 *
 * The structure is taken from the LIC-DSF scenario tool's briefing pack, which
 * ships the same file for the same reason and states the principle in its own
 * source: the claim status has to travel inside the artifact, because the
 * artifact is what gets forwarded. So the mode, the vintage and what the mode
 * entitles a reader to say are in the first screen, above the file list.
 */

import type { EngineResult } from '../engine/types';
import { manifestRows, modeLine, modeStatement, type RunManifest } from '../run/manifest';
import { formatReportDate } from './reportHtml';
import {
  anchorNote,
  BELOW_ZERO_NOTE,
  goesBelowZero,
  keyFigures,
  noClimateSignal,
  NO_SIGNAL_NOTE,
  type PacketFigure,
} from './figures';
import { SOURCE_CREDIT } from '../content/modes';
import { BASELINE_CONTEXT, CLIMATE_SCOPE_NOTE, RUN_RESTORE_NOTE } from './narrative';

/** Hard-wrap prose to a width a plain-text reader can take. */
function wrap(text: string, width = 78): string {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (!line) {
        line = word;
      } else if (`${line} ${word}`.length <= width) {
        line = `${line} ${word}`;
      } else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines.join('\n');
}

const rule = (title: string) => `${title}\n${'-'.repeat(title.length)}`;

export function buildReadme(
  manifest: RunManifest,
  result: EngineResult,
  figures: PacketFigure[],
): string {
  const dateHuman = formatReportDate(manifest.generatedAt);
  const rows = manifestRows(manifest);
  const changed = rows.filter((r) => r.state === 'changed');
  const undocumented = changed.filter((r) => !r.note);

  const out: string[] = [
    `Q-CRAFT Explorer export packet`,
    `${manifest.country.name} (${manifest.country.iso3c}), generated ${dateHuman}`,
    '',
  ];

  if (manifest.annotations.label) {
    out.push(wrap(`Run: ${manifest.annotations.label}`), '');
  }

  out.push(
    rule('What these numbers may be used to claim'),
    '',
    wrap(`${modeLine(manifest)}, data vintage ${manifest.dataVintage}.`),
    ...identityRows(manifest).map(([label, value]) => wrap(`${label}: ${value}`)),
    '',
    wrap(modeStatement(manifest)),
    '',
  );

  if (manifest.engine.kind !== 'engine') {
    out.push(
      wrap(
        'NOT RECOMPUTED. These values were produced at the Explorer defaults and ' +
          'do not reflect the parameters recorded in this packet. The report and ' +
          'the workbook name every parameter this applies to.',
      ),
      '',
    );
  }

  if (noClimateSignal(result)) {
    out.push(wrap(NO_SIGNAL_NOTE), '');
  }

  // Beside the other two run-level caveats, for the same reason they are here.
  // The README is the first thing opened in the archive and often the only
  // thing read, and a reader who meets a debt path of minus 473 per cent in the
  // workbook with no sentence anywhere is entitled to think the tool broke.
  //
  // Run-level here, chart-level on the figures: this file is prose about the
  // whole run, so the question it answers is whether ANY path in the packet
  // goes below zero, not whether one particular chart draws one.
  if (goesBelowZero(result)) {
    out.push(wrap(BELOW_ZERO_NOTE), '');
  }

  // Beside the mode statement rather than buried in the annex: the anchor year
  // qualifies every number in the packet, exactly as the vintage does.
  const anchor = anchorNote(result);
  if (anchor) out.push(wrap(anchor), '');

  out.push(rule('Scope of the projections'), '', wrap(BASELINE_CONTEXT), '', wrap(CLIMATE_SCOPE_NOTE), '');

  out.push(rule('Start here'), '');
  out.push(
    wrap(
      'Open the report first. It is a single HTML file: any browser opens it, ' +
        'and its own Print command saves it as a PDF. Everything else in this ' +
        'packet is a different view of the same run.',
    ),
    '',
  );

  const files: Array<[string, string]> = [
    ['READ-ME.txt', 'This file.'],
    ['*-report.html', 'The scenario report: findings, charts, key numbers, assumptions annex.'],
    ['*.xlsx', 'The workbook. Six sheets, starting with a README sheet. Keep working in it.'],
    [
      '*-chart-pack.html',
      'Every chart, one message each, laid out to print. Open it and use Print.',
    ],
    ['*-results.csv', 'Every scenario and year as one table, with the run manifest below it.'],
    ['*-run.json', 'The recorded settings and notes. Import them into Q-CRAFT Explorer; see the reproduction conditions below.'],
  ];
  if (figures.length) {
    files.push([
      'charts/*.png',
      `${figures.length} chart images at twice screen resolution, each carrying its own ` +
        'title and provenance line, for a slide or a memo.',
    ]);
  }

  out.push(rule('What is in the packet'), '');
  for (const [name, description] of files) {
    out.push(wrap(`${name}\n    ${description}`, 78));
  }
  out.push('');

  const tiles = keyFigures(result);
  if (tiles.length) {
    out.push(rule('The headline numbers'), '');
    for (const tile of tiles) {
      out.push(wrap(`${tile.label}: ${tile.value}${tile.detail ? ` (${tile.detail})` : ''}`));
    }
    out.push('');
  }

  out.push(rule('What was assumed'), '');
  out.push(
    wrap(
      changed.length
        ? `${changed.length} of ${rows.length} parameters ${
            changed.length === 1 ? 'was' : 'were'
          } moved away from the Explorer default. The full list, with the analyst's ` +
          'reasons, is in the report annex and on the workbook’s Assumptions sheet.'
        : `Every parameter was left at its Explorer default. The full list is in the ` +
          'report annex and on the workbook’s Assumptions sheet.',
    ),
    '',
  );

  for (const row of changed) {
    out.push(
      wrap(
        `  ${row.label}: ${row.display} (default ${row.defaultDisplay})` +
          `${row.note ? `\n      ${row.note}` : ''}`,
      ),
    );
  }
  if (changed.length) out.push('');

  if (undocumented.length) {
    out.push(
      wrap(
        `${undocumented.length} changed parameter${undocumented.length === 1 ? '' : 's'} ` +
          `carries no recorded reason: ${undocumented.map((r) => r.label).join(', ')}.`,
      ),
      '',
    );
  }

  if (manifest.annotations.note) {
    out.push(rule('The analyst’s note'), '', wrap(manifest.annotations.note), '');
  }

  out.push(
    rule('Reproducing this run'),
    '',
    wrap(
      'The run JSON carries every parameter, every reason and the data mode. ' +
        'Load it with "Import a run" on the Export tab of Q-CRAFT Explorer and ' +
        `the application returns to this exact configuration. ${RUN_RESTORE_NOTE} Everything in this ` +
        'packet is produced in the browser; nothing was uploaded to produce it.',
    ),
    '',
    rule('Sources and standing'),
    '',
    wrap(
      'Q-CRAFT Explorer is a free, open-source reimplementation of the IMF’s ' +
        'Quantitative Climate Risk Assessment Fiscal Tool, by Teal Insights and ' +
        'NatureFinance. This is not an official IMF product and nothing in this ' +
        'packet is an IMF view. The IMF workbook and the IMF training materials ' +
        'remain the authoritative versions of the method.',
    ),
    '',
    wrap(SOURCE_CREDIT),
    '',
    wrap(
      `Generated by ${manifest.app.name} ${manifest.app.version} on ` +
        `${manifest.generatedAt}.`,
    ),
    '',
  );

  return `${out.join('\n')}`;
}
