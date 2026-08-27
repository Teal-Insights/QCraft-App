/**
 * End-to-end check of the export loop, in a real browser, on two countries in
 * both data modes.
 *
 * This is the definition of done for the full packet, executed rather than
 * asserted. For each of four runs (two countries times two modes) it:
 *
 *   1. picks the mode and the country, and waits for the engine to run
 *   2. sets parameters, writes rationale notes, a run label and an analyst note
 *   3. downloads the packet, which is one zip
 *   4. unpacks it and checks every artifact is what it claims to be:
 *      the workbook opens in a real spreadsheet reader, the PNGs are PNGs at
 *      twice the requested size, the CSV parses, the run JSON round-trips
 *   5. prints the report and the chart pack to PDF the way a user would
 *   6. resets the app, re-imports the run file, and confirms the restored state
 *      is the exported state, notes and annotations included
 *
 * The unit tests cover the same round trip at the module level. This covers what
 * they cannot: that the controls are wired to the state the manifest reads, that
 * one click really produces one archive, that a browser canvas really rasterizes
 * the charts, and that the mode a user picked is the mode stamped on the files.
 *
 *   npm run build && npm run preview -- --port 4173 &
 *   node scripts/export-loop.mjs [outDir]
 *
 * Exits non-zero on any console error or any failed check.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { chromium } from 'playwright';

/**
 * A Python with openpyxl, for reading the workbook back.
 *
 * The repo's uv venv has it; a bare `python3` on a fresh machine usually does
 * not. Checked in order and reported, rather than failing with an import error
 * that looks like a bug in the export.
 */
const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PYTHON = [
  process.env.QCRAFT_PYTHON,
  join(APP_ROOT, '../../.venv/bin/python3'),
  // A git worktree keeps the venv in the primary checkout, not beside itself.
  join(APP_ROOT, '../../../QCraft-App/.venv/bin/python3'),
  'python3',
].find((candidate) => candidate && (candidate === 'python3' || existsSync(candidate)));

const OUT = process.argv[2] ?? '/tmp/qcraft-export';
const URL_BASE = process.env.QCRAFT_PREVIEW_URL ?? 'http://localhost:4173/';

/**
 * Two countries and both modes.
 *
 * Uganda is the training country and the one every golden master is built on.
 * Kenya is a genuinely different fiscal profile in the same region, so a bug
 * that happens to be invisible at Uganda's debt level has somewhere to show.
 * Maldives is not here but is checked separately below: its climate slice is
 * all zeros, which is the case where a computed takeaway title can state a
 * finding the data does not support.
 */
const RUNS = [
  { mode: 'Current', country: 'UGA', name: 'Uganda' },
  { mode: 'Verified', country: 'UGA', name: 'Uganda' },
  { mode: 'Current', country: 'KEN', name: 'Kenya' },
  { mode: 'Verified', country: 'KEN', name: 'Kenya' },
];

const VINTAGE = { Current: 'weo-2026-04', Verified: 'weo-2024-10' };

const NOTES = {
  '#debt-target-rationale': 'Charter for Fiscal Responsibility ceiling, agreed with MoFPED.',
  '#fiscal-rule-rationale': 'Testing the no-consolidation counterfactual for the risk statement.',
};
const RUN_LABEL = 'Tighter ceiling, FY2025/26 planning';
const RUN_NOTE =
  'Run for the Fiscal Risk Statement annex.\n\nThe ceiling is the Charter figure, not the ' +
  'current stock. The no-rule counterfactual is here to size the gap, not as a forecast.';

const failures = [];
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? ` (${detail})` : ''}`);
  if (!ok) failures.push(label);
};

/** PNG dimensions, read out of the IHDR chunk rather than trusted. */
function pngSize(bytes) {
  const magic = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (magic.some((b, i) => bytes[i] !== b)) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

/** Unpack with the system unzip, so the reader is not the writer. */
function unzip(zipPath, dir) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  execFileSync('unzip', ['-q', '-o', zipPath, '-d', dir]);
  const walk = (base, prefix = '') =>
    readdirSync(join(dir, base), { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory()
        ? walk(join(base, entry.name), `${prefix}${entry.name}/`)
        : [`${prefix}${entry.name}`],
    );
  return walk('.');
}

/**
 * Open the workbook in something that is not the writer.
 *
 * openpyxl is the check that matters here: it parses the OOXML rather than
 * trusting that a zip with the right extension is a spreadsheet. Sheet names,
 * a header row and a numeric cell all have to come back.
 */
function readWorkbook(path) {
  const script = `
import json, sys
from openpyxl import load_workbook
wb = load_workbook(sys.argv[1])
out = {"sheets": wb.sheetnames, "cells": {}}
for name in wb.sheetnames:
    ws = wb[name]
    out["cells"][name] = {"max_row": ws.max_row, "max_col": ws.max_column}
ws = wb["Results (all series)"]
header = [c.value for c in ws[ws.freeze_panes and int(ws.freeze_panes[1:]) - 1 or 1]]
out["results_header"] = header
out["results_bold"] = bool(ws[int(ws.freeze_panes[1:]) - 1][0].font.bold)
out["results_filter"] = str(ws.auto_filter.ref)
out["results_freeze"] = ws.freeze_panes
numeric = [c.value for c in ws[int(ws.freeze_panes[1:])] if isinstance(c.value, (int, float))]
out["results_numeric"] = numeric[:4]
readme = wb["README"]
out["readme_text"] = "\\n".join(
    str(c.value) for row in readme.iter_rows() for c in row if c.value is not None
)
print(json.dumps(out))
`;
  return JSON.parse(
    execFileSync(PYTHON, ['-c', script, path], { encoding: 'utf8', maxBuffer: 8 << 20 }),
  );
}

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  acceptDownloads: true,
});
const page = await context.newPage();

const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

await page.goto(URL_BASE, { waitUntil: 'networkidle' });

/** Wait for a country's inputs to arrive and the charts to be drawn from them. */
async function settle() {
  await page.waitForFunction(
    () => document.querySelectorAll('svg path[stroke]').length > 0,
    { timeout: 20_000 },
  );
  await page.waitForTimeout(250);
}

for (const run of RUNS) {
  const tag = `${run.country}-${run.mode.toLowerCase()}`;
  console.log(`\n=== ${run.name}, ${run.mode} mode ===`);

  await page.getByRole('tab', { name: 'Baseline' }).click();
  await page.getByRole('radio', { name: run.mode, exact: true }).click();
  await page.selectOption('#country', run.country);
  await settle();

  // ── parameters and the analyst's words ────────────────────────────────────
  await page.fill('#debt-target', '45');
  await page.selectOption('#fiscal-rule', 'No');
  await page.fill('#infl-end', '5');
  await settle();

  for (const [selector, text] of Object.entries(NOTES)) await page.fill(selector, text);

  // ── a peer comparison, written from the panel rather than typed ────────────
  // The path run 5 added: a user looking at where their country sits presses
  // one button and the comparison becomes the rationale. It has to APPEND to
  // the note above rather than replace it, and it has to reach the artifacts
  // exactly as typed text does.
  await page.getByRole('button', { name: /source data behind Debt target/i }).click();
  await page.waitForTimeout(400);
  const offered = await page.locator('.rationale-action__preview').innerText();
  await page.getByRole('button', { name: 'Add to the rationale' }).click();
  await page.waitForTimeout(250);
  await page.getByRole('button', { name: 'Back to the charts' }).click();
  await page.waitForTimeout(200);

  const debtNote = await page.locator('#debt-target-rationale').inputValue();
  const peerSentence = offered.replace(/^For the rationale\s*/i, '').trim();
  check(
    `${tag}: the peer comparison appends to the note the user typed`,
    debtNote.startsWith(NOTES['#debt-target-rationale']) &&
      debtNote.length > NOTES['#debt-target-rationale'].length,
    `${debtNote.length} characters`,
  );
  check(
    `${tag}: the composed note stays inside the field the sidebar allows`,
    debtNote.length <= 200,
    `${debtNote.length} characters`,
  );

  await page.getByRole('tab', { name: 'Export' }).click();
  await page.waitForTimeout(300);
  await page.fill('#run-label', RUN_LABEL);
  await page.fill('#run-note', RUN_NOTE);
  await page.waitForTimeout(200);
  await page.screenshot({ path: join(OUT, `${tag}-export-tab.png`), fullPage: true });

  // The third change is deliberately left unannotated; the app should say so.
  const warned = await page.locator('.callout--warn').textContent();
  check(
    `${tag}: export tab names the changed parameter with no rationale`,
    warned.includes('Inflation, long run'),
    warned.slice(0, 70),
  );

  // ── one click, one archive ────────────────────────────────────────────────
  const downloads = [];
  const collect = (d) => downloads.push(d);
  context.on('download', collect);
  await page.getByRole('button', { name: /Download the packet/ }).click();
  await page.waitForTimeout(6000);
  context.off('download', collect);

  check(`${tag}: one click produced one file`, downloads.length === 1, `${downloads.length}`);
  if (downloads.length !== 1) continue;

  const zipName = downloads[0].suggestedFilename();
  const zipPath = join(OUT, zipName);
  await downloads[0].saveAs(zipPath);
  const dir = join(OUT, tag);
  const names = unzip(zipPath, dir);
  console.log(`  ${zipName}: ${names.length} entries`);

  const find = (suffix) => names.find((n) => n.endsWith(suffix));
  const read = (name) => readFileSync(join(dir, name));
  const text = (name) => read(name).toString('utf8');

  check(
    `${tag}: packet holds the six documents and the chart images`,
    ['READ-ME.txt', '-report.html', '.xlsx', '-chart-pack.html', '-results.csv', '-run.json'].every(
      (s) => find(s),
    ) && names.filter((n) => n.startsWith('charts/')).length === 4,
    names.join(', '),
  );

  // ── every artifact says which data it stands on ───────────────────────────
  const vintage = VINTAGE[run.mode];
  for (const suffix of ['READ-ME.txt', '-report.html', '-chart-pack.html', '-results.csv', '-run.json']) {
    const name = find(suffix);
    if (!name) continue;
    const body = text(name);
    check(`${tag}: ${suffix} names the ${run.mode} vintage`, body.includes(vintage));
    check(`${tag}: ${suffix} carries the run label`, body.includes(RUN_LABEL));
    check(
      `${tag}: ${suffix} carries the analyst note`,
      body.includes('Run for the Fiscal Risk Statement annex.'),
    );
    check(
      `${tag}: ${suffix} carries the rationale the user typed`,
      body.includes('Charter for Fiscal Responsibility ceiling, agreed with MoFPED.'),
    );
    check(
      `${tag}: ${suffix} carries the peer comparison the panel wrote`,
      body.includes(suffix === '-run.json' ? JSON.stringify(debtNote).slice(1, -1) : debtNote),
      peerSentence.slice(0, 70),
    );
  }

  const runJson = JSON.parse(text(find('-run.json')));
  check(`${tag}: run file records the mode the user picked`, runJson.mode === run.mode.toLowerCase(), runJson.mode);
  check(`${tag}: run file records the country`, runJson.country.iso3c === run.country);
  check(
    `${tag}: run file records the parameters that were set`,
    runJson.params.debt_target === 45 &&
      runJson.params.fiscal_rule === 'No' &&
      runJson.params.inflation_end === 5,
  );
  check(`${tag}: run file records both notes`, Object.keys(runJson.notes).length === 2);
  check(
    `${tag}: run file records the annotations`,
    runJson.annotations.label === RUN_LABEL && runJson.annotations.note.includes('Charter figure'),
  );

  // ── the workbook is a workbook ────────────────────────────────────────────
  const wb = readWorkbook(join(dir, find('.xlsx')));
  check(
    `${tag}: workbook opens and has the six sheets`,
    JSON.stringify(wb.sheets) ===
      JSON.stringify([
        'README',
        'Assumptions',
        'Key numbers',
        'Debt by scenario',
        'GDP vs baseline',
        'Results (all series)',
      ]),
    wb.sheets.join(' | '),
  );
  check(`${tag}: workbook header row is bold`, wb.results_bold === true);
  check(`${tag}: workbook results sheet is frozen and filtered`, !!wb.results_freeze && wb.results_filter !== 'None', `${wb.results_freeze} / ${wb.results_filter}`);
  check(
    `${tag}: workbook results sheet holds every scenario and year`,
    wb.cells['Results (all series)'].max_row > 600,
    `${wb.cells['Results (all series)'].max_row} rows`,
  );
  check(`${tag}: workbook README names the vintage`, wb.readme_text.includes(vintage));
  check(
    `${tag}: workbook README carries the analyst note`,
    wb.readme_text.includes('Run for the Fiscal Risk Statement annex.'),
  );

  // ── the chart images are images, at twice the size ────────────────────────
  for (const name of names.filter((n) => n.startsWith('charts/'))) {
    const size = pngSize(read(name));
    check(
      `${tag}: ${name} is a PNG at 2x`,
      size !== null && size.width === 1400 && size.height > 640,
      size ? `${size.width}x${size.height}` : 'not a PNG',
    );
  }

  // ── the two print documents, printed ──────────────────────────────────────
  for (const [kind, suffix] of [
    ['report', '-report.html'],
    ['chart-pack', '-chart-pack.html'],
  ]) {
    const docPage = await context.newPage();
    const docErrors = [];
    docPage.on('console', (m) => {
      if (m.type() === 'error') docErrors.push(m.text());
    });
    docPage.on('pageerror', (e) => docErrors.push(`pageerror: ${e.message}`));

    await docPage.goto(`file://${join(dir, find(suffix))}`, { waitUntil: 'networkidle' });
    await docPage.setViewportSize({ width: 1100, height: 1400 });
    await docPage.screenshot({ path: join(OUT, `${tag}-${kind}-screen.png`), fullPage: true });
    await docPage.emulateMedia({ media: 'print' });
    // printBackground false is Chrome's own default, which is the setting a
    // ministry user will actually print with.
    const pdfPath = join(OUT, `${tag}-${kind}.pdf`);
    // preferCSSPageSize is what makes the document's own @page box apply.
    // Without it Playwright imposes Letter and the page box the stylesheet
    // computes is never exercised, so the check would prove nothing.
    await docPage.pdf({ path: pdfPath, printBackground: false, preferCSSPageSize: true });
    check(`${tag}: ${kind} renders with no console errors`, docErrors.length === 0, docErrors.join('; '));

    // 210mm by 279mm in PostScript points, which is the A4 and Letter
    // intersection the stylesheet declares. If this drifts, one of the two
    // paper sizes silently repaginates.
    const box = execFileSync('pdfinfo', [pdfPath], { encoding: 'utf8' }).match(
      /Page size:\s+([\d.]+) x ([\d.]+) pts/,
    );
    check(
      `${tag}: ${kind} uses the A4 and Letter page box`,
      !!box && Math.abs(Number(box[1]) - 595) < 1.5 && Math.abs(Number(box[2]) - 791) < 1.5,
      box ? `${box[1]} x ${box[2]} pts` : 'no page size',
    );
    check(
      `${tag}: ${kind} prints to a real PDF`,
      readFileSync(pdfPath).length > 20_000,
      `${Math.round(readFileSync(pdfPath).length / 1024)} kB`,
    );
    await docPage.close();
  }

  // ── reset, re-import, and confirm the run came back whole ─────────────────
  await page.getByRole('tab', { name: 'Baseline' }).click();
  await page.getByRole('button', { name: 'Reset to engine defaults' }).click();
  await settle();
  check(
    `${tag}: reset returned the parameters to defaults`,
    (await page.inputValue('#debt-target')) === '50',
  );

  await page.getByRole('tab', { name: 'Export' }).click();
  await page.setInputFiles('#run-import', join(dir, find('-run.json')));
  // The import switches mode and country, so the engine reloads. Wait for the
  // confirmation the tab itself renders rather than for charts: the Export tab
  // has none.
  await page.waitForSelector('.callout--ok', { timeout: 20_000 });

  const restored = {
    label: await page.inputValue('#run-label'),
    note: await page.inputValue('#run-note'),
  };
  await page.getByRole('tab', { name: 'Baseline' }).click();
  await settle();
  Object.assign(restored, {
    debt_target: await page.inputValue('#debt-target'),
    fiscal_rule: await page.inputValue('#fiscal-rule'),
    inflation_end: await page.inputValue('#infl-end'),
    country: await page.inputValue('#country'),
    debtNote: await page.inputValue('#debt-target-rationale'),
  });

  check(
    `${tag}: import restores the parameters`,
    restored.debt_target === '45' &&
      restored.fiscal_rule === 'No' &&
      restored.inflation_end === '5' &&
      restored.country === run.country,
    JSON.stringify(restored),
  );
  // The typed line plus the sentence the panel appended, so the round trip has
  // to bring back the composed note rather than what was typed.
  check(`${tag}: import restores the rationale notes`, restored.debtNote === debtNote);
  check(
    `${tag}: import restores the run label and the analyst note`,
    restored.label === RUN_LABEL && restored.note === RUN_NOTE,
  );
  check(
    `${tag}: import restores the mode`,
    (await page
      .getByRole('radio', { name: run.mode, exact: true })
      .getAttribute('aria-checked')) === 'true',
  );
}

// ── the country with no climate signal ──────────────────────────────────────
// Maldives carries an all-zero climate slice, so every scenario returns the
// baseline. The failure to guard against is a computed title reporting that as
// a finding: "scenarios spread 2099 debt across 0 points of GDP".
console.log('\n=== Maldives, the no-signal case ===');
await page.getByRole('tab', { name: 'Baseline' }).click();
await page.getByRole('radio', { name: 'Current', exact: true }).click();
await page.selectOption('#country', 'MDV');
await settle();
await page.getByRole('tab', { name: 'Export' }).click();
await page.waitForTimeout(300);

const mdvDownloads = [];
const mdvCollect = (d) => mdvDownloads.push(d);
context.on('download', mdvCollect);
await page.getByRole('button', { name: /Download the packet/ }).click();
await page.waitForTimeout(6000);
context.off('download', mdvCollect);

if (mdvDownloads.length === 1) {
  const zipPath = join(OUT, mdvDownloads[0].suggestedFilename());
  await mdvDownloads[0].saveAs(zipPath);
  const dir = join(OUT, 'MDV');
  const names = unzip(zipPath, dir);
  const report = readFileSync(join(dir, names.find((n) => n.endsWith('-report.html'))), 'utf8');
  check(
    'MDV: the report does not report a spread the data does not carry',
    !/spread of 0\.0 points/.test(report) && !/across 0 points of GDP/.test(report),
  );
  check(
    'MDV: the report says the dataset has no coverage',
    report.includes('no coverage for this economy'),
  );
  check(
    'MDV: the report does not call a zero spread the climate-fiscal risk',
    !report.includes('That spread is the climate-fiscal risk'),
  );
} else {
  check('MDV: one click produced one file', false, `${mdvDownloads.length} downloads`);
}

writeFileSync(join(OUT, 'summary.json'), JSON.stringify({ failures, consoleErrors }, null, 2));
await browser.close();

if (consoleErrors.length) {
  console.error(`\n${consoleErrors.length} console error(s):\n${consoleErrors.join('\n')}`);
}
console.log(`\n${failures.length} failure(s). Artifacts in ${OUT}`);
if (failures.length || consoleErrors.length) process.exit(1);
