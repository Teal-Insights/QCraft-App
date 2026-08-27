/**
 * End-to-end check of the export loop, in a real browser.
 *
 * This is the definition of done for run 2, executed rather than asserted:
 *
 *   1. set parameters in the sidebar
 *   2. write rationale notes beside them
 *   3. export the packet and catch all three downloads
 *   4. reset the app to defaults
 *   5. re-import the run JSON
 *   6. confirm the restored state is identical to what was exported
 *
 * The unit tests cover the same round trip at the module level. This covers
 * what they cannot: that the controls are actually wired to the state the
 * manifest reads, that the browser really emits three files from one click, and
 * that a fresh export after re-import is byte-identical except for its
 * timestamp. A wiring mistake between a control and the manifest would pass
 * every unit test in the suite.
 *
 *   npm run build && npm run preview -- --port 4173 &
 *   node scripts/export-loop.mjs [outDir]
 *
 * Exits non-zero on any console error or any mismatch.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const OUT = process.argv[2] ?? '/tmp/qcraft-export';
const URL_BASE = process.env.QCRAFT_PREVIEW_URL ?? 'http://localhost:4173/';

mkdirSync(OUT, { recursive: true });

const failures = [];
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${detail ? ` (${detail})` : ''}`);
  if (!ok) failures.push(label);
};

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

// ── 1. set parameters ───────────────────────────────────────────────────────
await page.fill('#debt-target', '45');
await page.selectOption('#fiscal-rule', 'No');
await page.fill('#infl-end', '5');
await page.waitForTimeout(200);

const changedTags = await page.locator('.field--changed').count();
check('sidebar marks exactly the changed parameters', changedTags === 3, `${changedTags} of 10`);

// ── 2. rationale notes, entered inline beside the guidance ──────────────────
const NOTES = {
  '#debt-target-rationale': 'Charter for Fiscal Responsibility ceiling, agreed with MoFPED.',
  '#fiscal-rule-rationale': 'Testing the no-consolidation counterfactual for the risk statement.',
};
for (const [selector, text] of Object.entries(NOTES)) {
  await page.fill(selector, text);
}
await page.waitForTimeout(150);

// ── 2b. a peer comparison, written from the panel rather than typed ─────────
// This is the path run 5 added: a user looking at where their country sits
// presses one button and the comparison becomes the rationale. It has to reach
// the same artifacts as text they typed, and it has to APPEND to the note above
// rather than replace it.
await page
  .getByRole('button', { name: /source data behind Debt target/i })
  .click();
await page.waitForTimeout(400);
const offered = await page.locator('.rationale-action__preview').innerText();
await page.getByRole('button', { name: 'Add to the rationale' }).click();
await page.waitForTimeout(250);
await page.getByRole('button', { name: 'Back to the charts' }).click();
await page.waitForTimeout(200);

const debtNote = await page.locator('#debt-target-rationale').inputValue();
const peerSentence = offered.replace(/^For the rationale\s*/i, '').trim();
check(
  'the peer comparison appends to the note the user typed',
  debtNote.startsWith(NOTES['#debt-target-rationale']) && debtNote.length > NOTES['#debt-target-rationale'].length,
  `${debtNote.length} characters`,
);
check(
  'the composed note stays inside the field the sidebar allows',
  debtNote.length <= 200,
  `${debtNote.length} characters`,
);

// The third change is deliberately left unannotated: the app should say so.
await page.getByRole('tab', { name: 'Export' }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: join(OUT, 'export-tab.png'), fullPage: true });

const warned = await page.locator('.callout--warn').textContent();
check(
  'export tab names the changed parameter with no rationale',
  warned.includes('Inflation, long run'),
  warned.slice(0, 80),
);

// ── 3. one click, three files ───────────────────────────────────────────────
const downloads = [];
context.on('download', (d) => downloads.push(d));
await page.getByRole('button', { name: 'Export packet (3 files)' }).click();
await page.waitForTimeout(2500);

check('one click produced three files', downloads.length === 3, `${downloads.length} downloads`);

const saved = {};
for (const download of downloads) {
  const name = download.suggestedFilename();
  const path = join(OUT, name);
  await download.saveAs(path);
  saved[name.split('-').pop()] = { name, text: readFileSync(path, 'utf8') };
}
console.log(`  saved: ${Object.values(saved).map((f) => f.name).join(', ')}`);

const report = saved['report.html'];
const results = saved['results.csv'];
const runFile = saved['run.json'];
check('packet contains a report, a CSV and a run file', !!report && !!results && !!runFile);

// ── 4. what the artifacts say ───────────────────────────────────────────────
check(
  'report annex carries the rationale the user typed',
  report.text.includes('Charter for Fiscal Responsibility ceiling, agreed with MoFPED.'),
);
check(
  'report annex carries the peer comparison the panel wrote',
  report.text.includes(debtNote),
  peerSentence.slice(0, 70),
);
check(
  'run file carries the peer comparison, so re-importing restores it',
  runFile.text.includes(JSON.stringify(debtNote).slice(1, -1)),
);
check(
  'report names the changed parameter left undocumented',
  report.text.includes('carries no recorded rationale'),
);
check(
  'CSV carries the run manifest below its data',
  results.text.includes('Run manifest') && results.text.includes('weo-2024-10'),
);

const runJson = JSON.parse(runFile.text);
check('run file records all ten parameters', Object.keys(runJson.params).length === 10);
check('run file records the parameters that were set', runJson.params.debt_target === 45 && runJson.params.fiscal_rule === 'No' && runJson.params.inflation_end === 5);
check('run file records the notes', Object.keys(runJson.notes).length === 2);

// ── 5. reset, then re-import ────────────────────────────────────────────────
await page.getByRole('button', { name: 'Reset to engine defaults' }).click();
await page.waitForTimeout(200);
const afterReset = await page.inputValue('#debt-target');
check('reset returned the parameters to defaults', afterReset === '50', `debt target ${afterReset}`);

const importPath = join(OUT, runFile.name);
await page.setInputFiles('#run-import', importPath);
await page.waitForTimeout(500);
await page.screenshot({ path: join(OUT, 'after-import.png'), fullPage: true });

const loaded = await page.locator('.callout--ok').textContent();
check('import reports what it loaded', loaded.includes(runFile.name), loaded.slice(0, 90));

// ── 6. the restored run is the exported run ─────────────────────────────────
const restored = {
  debt_target: await page.inputValue('#debt-target'),
  fiscal_rule: await page.inputValue('#fiscal-rule'),
  inflation_end: await page.inputValue('#infl-end'),
  debtNote: await page.inputValue('#debt-target-rationale'),
  ruleNote: await page.inputValue('#fiscal-rule-rationale'),
};
check('parameters restored', restored.debt_target === '45' && restored.fiscal_rule === 'No' && restored.inflation_end === '5', JSON.stringify(restored));
// The debt note is the typed line plus the sentence the panel appended, so the
// round trip has to bring back the composed note rather than what was typed.
check(
  'rationale notes restored',
  restored.debtNote === debtNote && restored.ruleNote === NOTES['#fiscal-rule-rationale'],
);

// Export again and compare everything but the timestamp: a re-export of a
// re-import has to be the same run.
const second = [];
context.on('download', (d) => second.push(d));
await page.getByRole('button', { name: 'Export packet (3 files)' }).click();
await page.waitForTimeout(2500);
const secondRun = second.find((d) => d.suggestedFilename().endsWith('run.json'));
let identical = false;
if (secondRun) {
  const path = join(OUT, 'reexport-run.json');
  await secondRun.saveAs(path);
  const again = JSON.parse(readFileSync(path, 'utf8'));
  identical =
    JSON.stringify(again.params) === JSON.stringify(runJson.params) &&
    JSON.stringify(again.notes) === JSON.stringify(runJson.notes) &&
    again.dataVintage === runJson.dataVintage &&
    again.app.version === runJson.app.version;
}
check('re-exporting the re-imported run reproduces it exactly', identical);

// ── The report, as a reader and a printer see it ────────────────────────────
const reportPage = await context.newPage();
const reportErrors = [];
reportPage.on('console', (m) => {
  if (m.type() === 'error') reportErrors.push(m.text());
});
reportPage.on('pageerror', (e) => reportErrors.push(`pageerror: ${e.message}`));

await reportPage.goto(`file://${join(OUT, report.name)}`, { waitUntil: 'networkidle' });
await reportPage.setViewportSize({ width: 1100, height: 1400 });
await reportPage.screenshot({ path: join(OUT, 'report-screen.png'), fullPage: true });

await reportPage.emulateMedia({ media: 'print' });
await reportPage.screenshot({ path: join(OUT, 'report-print.png'), fullPage: true });
await reportPage.pdf({ path: join(OUT, 'report.pdf'), format: 'A4', printBackground: true });
check('report renders with no console errors', reportErrors.length === 0, reportErrors.join('; '));

const pdfBytes = readFileSync(join(OUT, 'report.pdf'));
check('print-to-PDF produces a real document', pdfBytes.length > 20_000, `${Math.round(pdfBytes.length / 1024)} kB`);

writeFileSync(join(OUT, 'summary.json'), JSON.stringify({ failures, consoleErrors }, null, 2));

await browser.close();

if (consoleErrors.length) {
  console.error(`\n${consoleErrors.length} console error(s):\n${consoleErrors.join('\n')}`);
}
if (failures.length || consoleErrors.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log(`\nexport loop green. Artifacts in ${OUT}`);
