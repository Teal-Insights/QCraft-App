/**
 * The workbook, described before it is written.
 *
 * ── Why a spec ────────────────────────────────────────────────────────────────
 * Writing a real .xlsx needs a library, and a library needs a browser or a
 * bundler to run. Everything worth testing about the workbook is upstream of
 * that: which sheets exist, what each column is called, which cell carries which
 * number, whether the analyst's rationale survived, whether the claim status is
 * on the first sheet a reader opens. So the workbook is a plain object here and
 * `workbookXlsx.ts` turns it into bytes. The spec is asserted on in vitest with
 * no DOM and no library; the serializer is a thin, boring adapter.
 *
 * ── Why an .xlsx at all, when there is already a CSV ──────────────────────────
 * Because the people this is for work in Excel and should keep working in Excel.
 * The both-tools argument the training rests on is explicit that the IMF builds
 * in Excel deliberately and that every ministry has it. A CSV is a handoff; a
 * workbook with named sheets, frozen headers, number formats and a filter is a
 * place to keep going. The wide sheets exist for exactly that reason: a reader
 * who wants a chart of debt by scenario should be able to select a rectangle and
 * press the chart button, not pivot a long table first.
 *
 * ── What travels ──────────────────────────────────────────────────────────────
 * The README sheet is first in the tab order and carries the mode, the claim
 * sentence, both vintages, the app version, the run label, the analyst's note
 * and the attribution. The LIC-DSF scenario tool learned this the hard way and
 * says so in its own comment: a pack is the artifact most likely to be forwarded
 * to someone who never saw the app, so the claim status has to travel inside it.
 * A workbook is more forwardable than a pack.
 */

import type { EngineResult, ScenarioKey } from '../engine/types';
import {
  manifestRows,
  modeLine,
  modeStatement,
  type RunManifest,
} from '../run/manifest';
import { findScenario, gdpShortfallSeries } from '../selectors';
import {
  BELOW_ZERO_NOTE,
  goesBelowZero,
  HORIZON,
  keyFigures,
  noClimateSignal,
  NO_SIGNAL_NOTE,
  REPORT_YEARS,
} from './figures';
import { RESULT_COLUMNS } from './resultsCsv';
import { SOURCE_CREDIT } from '../content/modes';
import { BASELINE_CONTEXT, CLIMATE_SCOPE_NOTE, RUN_RESTORE_NOTE } from './narrative';

export type CellValue = string | number | null;

export interface SheetColumn {
  header: string;
  /** Approximate character width. Excel's own unit, which is what the library takes. */
  width: number;
  /** Excel number format, e.g. '0.00'. Omitted leaves the cell as text or General. */
  numFmt?: string;
  /** Long free text needs wrapping or it runs across the sheet. */
  wrap?: boolean;
}

/** Prose above the table. A README sheet is all blocks and no table. */
export type SheetBlock =
  | { kind: 'title'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'text'; text: string }
  /** Rendered in the caution colour: claim status, missing data, ignored parameters. */
  | { kind: 'caution'; text: string }
  | { kind: 'pair'; label: string; value: string }
  | { kind: 'blank' };

export interface SheetTable {
  columns: SheetColumn[];
  rows: CellValue[][];
  freezeHeader: boolean;
  autoFilter: boolean;
}

export interface SheetSpec {
  /** Excel caps sheet names at 31 characters and bans []:*?/\\ . */
  name: string;
  /** One line, listed on the README so a reader knows where to go. */
  purpose: string;
  blocks: SheetBlock[];
  table?: SheetTable;
}

export interface WorkbookSpec {
  /** Document title, into the file's own properties. */
  title: string;
  creator: string;
  sheets: SheetSpec[];
}

/**
 * Excel's sheet-name rules, applied rather than assumed.
 *
 * A country name reaches a sheet name nowhere today, but the extension point for
 * CC-4 means a figure title could, and an illegal character makes the whole file
 * refuse to open rather than degrading. Cheaper to enforce here than to debug in
 * a training room.
 */
export function safeSheetName(name: string): string {
  const cleaned = name.replace(/[[\]:*?/\\]/g, ' ').replace(/\s+/g, ' ').trim();
  return (cleaned || 'Sheet').slice(0, 31);
}

const PCT_FMT = '0.00';
const YEAR_FMT = '0';

/** Scenario order for the wide sheets: baseline first, then display order. */
const scenarioOrder = (result: EngineResult): ScenarioKey[] =>
  result.scenarios.map((s) => s.key);

function readmeSheet(manifest: RunManifest, result: EngineResult, sheets: SheetSpec[]): SheetSpec {
  const blocks: SheetBlock[] = [
    { kind: 'title', text: `Q-CRAFT scenario run: ${manifest.country.name}` },
  ];

  if (manifest.annotations.label) {
    blocks.push({ kind: 'text', text: manifest.annotations.label });
  }

  blocks.push(
    { kind: 'blank' },
    { kind: 'heading', text: 'What this workbook is' },
    {
      kind: 'text',
      text:
        `A long-term fiscal projection for ${manifest.country.name} under a baseline ` +
        'and six climate scenarios, exported from Q-CRAFT Explorer. Every number ' +
        'here is engine output for the parameters on the Assumptions sheet. The ' +
        'sheets are ordinary tables, so extend them, chart them and pivot them.',
    },
    { kind: 'blank' },
    { kind: 'heading', text: 'What these numbers may be used to claim' },
    { kind: 'pair', label: 'Data mode', value: modeLine(manifest) },
    { kind: 'pair', label: 'Data vintage', value: manifest.dataVintage },
    // Verbatim from content/modes.ts, which is where every claim about the IMF
    // original is written and reviewed. A workbook is the most forwardable thing
    // in the packet, so the claim rides on its first sheet.
    { kind: 'caution', text: modeStatement(manifest) },
    { kind: 'text', text: BASELINE_CONTEXT },
    { kind: 'text', text: CLIMATE_SCOPE_NOTE },
  );

  if (manifest.engine.kind !== 'engine') {
    blocks.push({
      kind: 'caution',
      text:
        'NOT RECOMPUTED. These values were produced at the Explorer defaults and ' +
        'do not reflect the parameters on the Assumptions sheet. The Assumptions ' +
        'sheet names every parameter this applies to.',
    });
  }

  if (noClimateSignal(result)) {
    blocks.push({ kind: 'caution', text: NO_SIGNAL_NOTE });
  }

  // The Debt by scenario sheet carries the negative column, and this sheet is
  // the one a reader meets first. Without this the workbook states a debt path
  // of minus 473 per cent of GDP and explains it nowhere: the only sub-zero
  // words anywhere in the file were on the Key numbers sheet, and only when the
  // worst scenario happens to be negative in 2099.
  if (goesBelowZero(result)) {
    blocks.push({ kind: 'caution', text: BELOW_ZERO_NOTE });
  }

  blocks.push(
    { kind: 'blank' },
    { kind: 'heading', text: 'This run' },
    {
      kind: 'pair',
      label: 'Country',
      value: `${manifest.country.name} (${manifest.country.iso3c})`,
    },
    { kind: 'pair', label: 'Generated', value: manifest.generatedAt },
    {
      kind: 'pair',
      label: 'Application',
      value: `${manifest.app.name} ${manifest.app.version}`,
    },
    { kind: 'pair', label: 'Results basis', value: manifest.engine.source },
    { kind: 'pair', label: 'Run file schema', value: manifest.schema },
  );

  if (manifest.annotations.note) {
    blocks.push(
      { kind: 'blank' },
      { kind: 'heading', text: 'The analyst’s note' },
      { kind: 'text', text: manifest.annotations.note },
    );
  }

  blocks.push({ kind: 'blank' }, { kind: 'heading', text: 'The sheets' });
  for (const sheet of sheets) {
    blocks.push({ kind: 'pair', label: sheet.name, value: sheet.purpose });
  }

  blocks.push(
    { kind: 'blank' },
    { kind: 'heading', text: 'Reproducing this run' },
    {
      kind: 'text',
      text:
        'The run JSON exported alongside this workbook carries every parameter ' +
        'and every note. Load it with Import a run on the Export tab of Q-CRAFT ' +
        `Explorer and the application returns to this exact configuration. ${RUN_RESTORE_NOTE}`,
    },
    { kind: 'blank' },
    { kind: 'heading', text: 'Sources and standing' },
    {
      kind: 'text',
      text:
        'Q-CRAFT Explorer is a free, open-source reimplementation of the IMF’s ' +
        'Quantitative Climate Risk Assessment Fiscal Tool, by Teal Insights and ' +
        'NatureFinance. This is not an official IMF product and nothing here is ' +
        'an IMF view.',
    },
    {
      kind: 'text',
      text: SOURCE_CREDIT,
    },
  );

  return { name: 'README', purpose: 'Start here: what this run is and what it may claim.', blocks };
}

function assumptionsSheet(manifest: RunManifest): SheetSpec {
  const rows = manifestRows(manifest);
  const changed = rows.filter((r) => r.state === 'changed');
  const undocumented = changed.filter((r) => !r.note);

  const blocks: SheetBlock[] = [
    { kind: 'title', text: 'Inputs and assumptions' },
    {
      kind: 'text',
      text: changed.length
        ? `${changed.length} of ${rows.length} parameters ${
            changed.length === 1 ? 'was' : 'were'
          } moved away from the Explorer default. All ${rows.length} are listed, so ` +
          'what was left alone is as visible as what was changed.'
        : `Every parameter was left at its Explorer default. All ${rows.length} are ` +
          'listed, so that is visible rather than assumed.',
    },
  ];

  if (undocumented.length) {
    blocks.push({
      kind: 'caution',
      text:
        `${undocumented.length} changed parameter${undocumented.length === 1 ? '' : 's'} ` +
        `carries no recorded rationale: ${undocumented.map((r) => r.label).join(', ')}.`,
    });
  }

  blocks.push({ kind: 'blank' });

  const table: SheetTable = {
    columns: [
      { header: 'Parameter', width: 30 },
      { header: 'Value', width: 26 },
      { header: 'Explorer default', width: 26 },
      { header: 'State', width: 11 },
      { header: 'Group', width: 20 },
      { header: 'Rationale recorded by the analyst', width: 64, wrap: true },
    ],
    rows: rows.map((r) => [r.label, r.display, r.defaultDisplay, r.state, r.group, r.note ?? '']),
    freezeHeader: true,
    autoFilter: true,
  };

  if (manifest.engine.ignoredParams.length) {
    // Appended as data rows rather than a second table: one rectangle per sheet
    // keeps the filter honest, and a reader scrolling the parameter list finds
    // the disclosure attached to the list it is about.
    table.rows.push([]);
    table.rows.push(['Parameters the results do NOT reflect', 'You set', 'Results show', '', '', '']);
    for (const p of manifest.engine.ignoredParams) {
      table.rows.push([p.label, p.requested, p.used, '', '', '']);
    }
  }

  return {
    name: 'Assumptions',
    purpose: 'Every parameter, its default, and why it was set that way.',
    blocks,
    table,
  };
}

/** Year rows, one column per scenario. The sheet you can chart without pivoting. */
function wideSheet(
  result: EngineResult,
  opts: {
    name: string;
    purpose: string;
    title: string;
    lede: string;
    numFmt: string;
    valueAtYear: (key: ScenarioKey, year: number) => number | undefined;
  },
): SheetSpec {
  const keys = scenarioOrder(result);
  const labels = new Map(result.scenarios.map((s) => [s.key, s.label]));
  const years = [...new Set(result.scenarios.flatMap((s) => s.fiscal.map((f) => f.year)))].sort(
    (a, b) => a - b,
  );

  return {
    name: opts.name,
    purpose: opts.purpose,
    blocks: [
      { kind: 'title', text: opts.title },
      { kind: 'text', text: opts.lede },
      { kind: 'blank' },
    ],
    table: {
      columns: [
        { header: 'Year', width: 8, numFmt: YEAR_FMT },
        ...keys.map((k) => ({
          header: labels.get(k) ?? k,
          width: 18,
          numFmt: opts.numFmt,
        })),
      ],
      rows: years.map((year) => [
        year,
        ...keys.map((k) => opts.valueAtYear(k, year) ?? null),
      ]),
      freezeHeader: true,
      autoFilter: false,
    },
  };
}

/** Every scenario, every year, every fiscal series. The complete rectangle. */
function longSheet(result: EngineResult): SheetSpec {
  const rows: CellValue[][] = [];
  for (const s of result.scenarios) {
    for (const f of s.fiscal) {
      const record = f as unknown as Record<string, number>;
      rows.push([
        s.label,
        s.key,
        ...RESULT_COLUMNS.map((c) => record[c.key]),
      ]);
    }
  }

  return {
    name: 'Results (all series)',
    purpose: 'Every scenario, every year, every fiscal series. Filterable.',
    blocks: [
      { kind: 'title', text: 'All results' },
      {
        kind: 'text',
        text:
          'One row per scenario and year. Use the filter on the Scenario column ' +
          'to isolate a pathway, or pivot on it. All shares are percentages.',
      },
      { kind: 'blank' },
    ],
    table: {
      columns: [
        { header: 'Scenario', width: 22 },
        { header: 'Scenario key', width: 16 },
        ...RESULT_COLUMNS.map((c) => ({
          header: c.label,
          width: c.key === 'year' ? 8 : 20,
          numFmt: c.digits === 0 ? YEAR_FMT : PCT_FMT,
        })),
      ],
      rows,
      freezeHeader: true,
      autoFilter: true,
    },
  };
}

/** The report's headline table, so the workbook and the report agree by construction. */
function keyNumbersSheet(result: EngineResult): SheetSpec {
  const shortfallByKey = new Map(
    gdpShortfallSeries(result).map((s) => [
      s.key,
      s.points.find((p) => p.year === HORIZON)?.value,
    ]),
  );

  const rows: CellValue[][] = result.scenarios.map((s) => [
    s.label,
    ...REPORT_YEARS.map(
      (year) => s.fiscal.find((f) => f.year === year)?.debt_to_gdp ?? null,
    ),
    shortfallByKey.get(s.key) ?? null,
  ]);

  const blocks: SheetBlock[] = [
    { kind: 'title', text: 'Key numbers' },
    {
      kind: 'text',
      text:
        'Gross public debt as a share of GDP at the engine’s reporting years, ' +
        `and real GDP in ${HORIZON} relative to the baseline path. All figures ` +
        'in percent. These are the same numbers the exported report prints.',
    },
    { kind: 'blank' },
  ];

  for (const tile of keyFigures(result)) {
    blocks.splice(blocks.length - 1, 0, {
      kind: 'pair',
      label: tile.label,
      value: tile.detail ? `${tile.value} (${tile.detail})` : tile.value,
    });
  }

  return {
    name: 'Key numbers',
    purpose: 'The headline table, matching the exported report.',
    blocks,
    table: {
      columns: [
        { header: 'Scenario', width: 22 },
        ...REPORT_YEARS.map((y) => ({
          header: `Debt/GDP ${y}`,
          width: 14,
          numFmt: PCT_FMT,
        })),
        { header: `GDP vs baseline ${HORIZON}`, width: 22, numFmt: PCT_FMT },
      ],
      rows,
      freezeHeader: true,
      autoFilter: false,
    },
  };
}

export function buildWorkbookSpec(
  manifest: RunManifest,
  result: EngineResult,
): WorkbookSpec {
  const debtByYear = new Map(
    result.scenarios.map((s) => [
      s.key,
      new Map(s.fiscal.map((f) => [f.year, f.debt_to_gdp])),
    ]),
  );

  const shortfallByYear = new Map(
    gdpShortfallSeries(result).map((s) => [
      s.key,
      new Map(s.points.map((p) => [p.year, p.value])),
    ]),
  );

  const baseline = findScenario(result, 'Baseline');

  const sheets: SheetSpec[] = [
    assumptionsSheet(manifest),
    keyNumbersSheet(result),
    wideSheet(result, {
      name: 'Debt by scenario',
      purpose: 'Debt-to-GDP, years down and scenarios across. Chart-ready.',
      title: 'Gross public debt, percent of GDP',
      lede:
        'Years down the rows, scenarios across the columns. Select the block ' +
        'and insert a line chart to reproduce the report’s scenario figure.' +
        (baseline ? '' : ' No baseline path was returned for this run.'),
      numFmt: PCT_FMT,
      valueAtYear: (key, year) => debtByYear.get(key)?.get(year),
    }),
    wideSheet(result, {
      name: 'GDP vs baseline',
      purpose: 'Each scenario’s real GDP against the baseline path, in percent.',
      title: 'Real GDP relative to the baseline path, percent',
      lede:
        'Each scenario’s real GDP is shown as a percentage difference from the ' +
        'baseline reference path. Negative values are below that path; positive ' +
        `values are above it. The baseline is the flat zero column. ${BASELINE_CONTEXT}`,
      numFmt: PCT_FMT,
      valueAtYear: (key, year) => shortfallByYear.get(key)?.get(year),
    }),
    longSheet(result),
  ];

  return {
    title: `Q-CRAFT scenario run: ${manifest.country.name}`,
    creator: `${manifest.app.name} ${manifest.app.version}`,
    sheets: [readmeSheet(manifest, result, sheets), ...sheets].map((sheet) => ({
      ...sheet,
      name: safeSheetName(sheet.name),
    })),
  };
}
