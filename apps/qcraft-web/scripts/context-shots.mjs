/**
 * Publication shots of the parameter context panels.
 *
 * Separate from context-qa.mjs on purpose: that script is a gate and shoots
 * whole viewports so a failure can be seen in situ. This one shoots the panel
 * alone at each state worth showing, for the run report now and for the
 * course's M3 figures later, which need the same panels at the same slugs.
 *
 *   npm run build
 *   npm run preview -- --port 4173 &
 *   node scripts/context-shots.mjs [outDir]
 *
 * Every filename is the figure slug the panel declares, so a figure in the
 * guide and the panel in the app cannot drift apart without the name drifting
 * too.
 */

import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const OUT = process.argv[2] ?? '/tmp/qcraft-context-shots';
const URL_BASE = process.env.QCRAFT_PREVIEW_URL ?? 'http://localhost:4173/';

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(URL_BASE, { waitUntil: 'networkidle' });

const open = async (param) =>
  page
    .getByRole('button', {
      name: new RegExp(
        `(source data behind|context for) ${param.replace(/[()%.,]/g, '\\$&')}$`,
        'i',
      ),
    })
    .click()
    .then(() => page.waitForTimeout(400));

const close = async () =>
  page
    .getByRole('button', { name: 'Back to the charts' })
    .click()
    .then(() => page.waitForTimeout(200));

/**
 * A chip, by its accessible name. Strings match exactly, because the view
 * toggle and the scope chips both start with "All countries" and a substring
 * match would pick whichever the DOM happened to put first.
 */
const pick = async (name) => {
  await page
    .getByRole('radio', typeof name === 'string' ? { name, exact: true } : { name })
    .first()
    .click();
  await page.waitForTimeout(400);
};

const shot = async (name) => {
  await page.locator('.cpanel').screenshot({ path: `${OUT}/${name}.png` });
  console.log(`wrote ${OUT}/${name}.png`);
};

/**
 * One entry per shot: which panel to open, what to click once inside, and the
 * filename. Ordered so each panel's states are together.
 */
const PEERS = 'All countries';
const WORLD = /^All countries \(/;

const SHOTS = [
  ['Expenditure rigidity', [], 'fig-param-rigidity-readings'],
  ['Expenditure rigidity', [/^Africa$/], 'fig-param-rigidity-readings-region'],
  ['Expenditure rigidity', [/own years/], 'fig-param-rigidity-scatter'],
  ['Debt target (% GDP)', [WORLD], 'fig-param-debt-target-world'],
  ['Debt target (% GDP)', [/^Eastern Africa/], 'fig-param-debt-target-subregion'],
  ['Productivity growth, long run (%)', [PEERS, WORLD], 'fig-param-productivity-peers'],
  [
    'Productivity growth, long run (%)',
    [PEERS, /^Similar output per worker/],
    'fig-param-productivity-similar',
  ],
  ['Inflation, long run (%)', [PEERS, WORLD], 'fig-param-inflation-peers'],
  ['Interest-rate approach', [PEERS, WORLD], 'fig-param-interest-rate-peers'],
  ['Demography variant', [PEERS, WORLD], 'fig-param-demography-peers'],
];

for (const [param, clicks, name] of SHOTS) {
  await open(param);
  for (const click of clicks) await pick(click);
  await shot(name);
  await close();
}

await browser.close();
