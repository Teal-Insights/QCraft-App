/**
 * Visual QA for the two chart registers.
 *
 * Screenshots every chart tab in BOTH registers, plus one per-chart override,
 * and reports console errors. The chart code is imperative D3 that a typecheck
 * cannot judge: a bracket landing on a direct label, a threshold rule crossing
 * its own label, an envelope swallowing the line the title is about. Those are
 * only visible by looking, and there are now twice as many of them.
 *
 *   npm run build
 *   npm run preview -- --port 4183 &
 *   QCRAFT_PREVIEW_URL=http://localhost:4183/ node scripts/register-qa.mjs [outDir]
 *
 * The port matters. Other lanes in this sprint leave a preview on the default
 * 4173, and a QA pass that silently screenshots somebody else's build is worse
 * than no QA pass. Pass QCRAFT_PREVIEW_URL and check what answers on it.
 *
 * Exits non-zero if the page logs any console or page error.
 */

import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const OUT = process.argv[2] ?? '/tmp/qcraft-registers';
const URL_BASE = process.env.QCRAFT_PREVIEW_URL ?? 'http://localhost:4183/';
const TABS = ['Baseline', 'Analysis', 'Climate'];
const REGISTERS = ['Workbook', 'Briefing'];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

await page.goto(URL_BASE, { waitUntil: 'networkidle' });

/** The global control, which is the one inside `.register`. */
async function setRegister(name) {
  await page.locator('.register__option', { hasText: name }).click();
  await page.waitForTimeout(400);
}

for (const register of REGISTERS) {
  await setRegister(register);
  for (const tab of TABS) {
    await page.getByRole('tab', { name: tab }).click();
    await page.waitForTimeout(500);
    const file = `${OUT}/${tab}-${register}.png`;
    await page.screenshot({ path: file, fullPage: true });
    console.log(`wrote ${file}`);
  }
}

// One per-chart override, to prove a single chart can disagree with the page.
await setRegister('Workbook');
await page.getByRole('tab', { name: 'Baseline' }).click();
await page.waitForTimeout(300);
await page.locator('.chart__register-option', { hasText: 'Briefing' }).first().click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/Baseline-override.png`, fullPage: true });
console.log(`wrote ${OUT}/Baseline-override.png`);

await browser.close();

if (errors.length) {
  console.error(`\n${errors.length} console error(s):\n${errors.join('\n')}`);
  process.exit(1);
}
console.log('\nno console errors');
