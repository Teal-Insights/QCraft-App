/**
 * Visual QA: screenshot every tab of the built app and report console errors.
 *
 * The chart code is imperative D3 that a typecheck cannot judge — label
 * collisions, truncated axis ticks, and "the title claims a divergence you
 * cannot see" are only visible by looking. This is how you look.
 *
 *   npm run build
 *   npm run preview -- --port 4173 &
 *   node scripts/screenshot.mjs [outDir]
 *
 * Exits non-zero if the page logs any console or page error.
 */

import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const OUT = process.argv[2] ?? '/tmp/qcraft-shots';
const URL_BASE = process.env.QCRAFT_PREVIEW_URL ?? 'http://localhost:4173/';
const TABS = [
  'Baseline',
  'Analysis',
  'Climate',
  'Data',
  'Export',
  'Methodology',
  'About the data',
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

await page.goto(URL_BASE, { waitUntil: 'networkidle' });

for (const tab of TABS) {
  // exact: the "Data" tab and the "About the data" tab both match a loose
  // name lookup, which Playwright refuses as ambiguous.
  await page.getByRole('tab', { name: tab, exact: true }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${tab}.png`, fullPage: true });
  console.log(`wrote ${OUT}/${tab}.png`);
}

// Exercise the crosshair tooltip on the Analysis overlay.
await page.getByRole('tab', { name: 'Analysis' }).click();
await page.waitForTimeout(300);
const plot = page.locator('.chart__plot').first();
await plot.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
const box = await plot.boundingBox();
await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.5);
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/Analysis-tooltip.png` });
console.log(`wrote ${OUT}/Analysis-tooltip.png`);

await browser.close();

if (errors.length) {
  console.error(`\n${errors.length} console error(s):\n${errors.join('\n')}`);
  process.exit(1);
}
console.log('\nno console errors');
