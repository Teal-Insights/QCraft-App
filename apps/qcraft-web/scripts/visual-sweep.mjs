/**
 * The freeze visual sweep: every surface the app can show, in both modes, both
 * chart registers and both training-room viewport sizes.
 *
 * This is not the same job as scripts/screenshot.mjs, which shoots the tabs to
 * catch console errors. This one exists so a person (or a visual model) can
 * LOOK at the whole product in one sitting before it freezes: spacing,
 * hierarchy, alignment, label collisions, colour, and the states nobody visits
 * on the happy path, which are exactly the ones that ship broken.
 *
 * Deliberately included, because they are where design debt hides:
 *   - the loading state, caught by throttling the country payload
 *   - the three coverage notices, each on a country that really triggers it
 *   - every context panel, in both modes, now that the record is vintage-scoped
 *   - the teaching widgets, which are separate builds
 *
 *   npm run build
 *   npx vite preview --port <port> --strictPort &
 *   QCRAFT_PREVIEW_URL=http://localhost:<port>/ node scripts/visual-sweep.mjs [outDir]
 *
 * Exits non-zero on a console error, so a sweep that looks fine but throws is
 * still a failed sweep.
 */

import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const OUT = process.argv[2] ?? '/tmp/qcraft-sweep';
const URL_BASE = process.env.QCRAFT_PREVIEW_URL ?? 'http://localhost:4173/';

/** The training-room floor, and the smaller laptop that turns up beside it. */
const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1280x800', width: 1280, height: 800 },
];

const CHART_TABS = ['Baseline', 'Analysis', 'Climate'];
const PROSE_TABS = ['Data', 'Export', 'Methodology', 'About the data'];
const REGISTERS = ['Workbook', 'Briefing'];
const MODES = ['Current', 'Verified'];

const PANELS = [
  { name: 'demography', param: 'Demography variant' },
  { name: 'productivity', param: 'Productivity growth, long run (%)' },
  { name: 'inflation', param: 'Inflation, long run (%)' },
  { name: 'interest-rate', param: 'Interest-rate approach' },
  { name: 'debt-target', param: 'Debt target (% GDP)' },
  { name: 'rigidity', param: 'Expenditure rigidity' },
];

/**
 * The notices, each on a country that actually triggers it in that mode. None
 * of these is reachable from the default country, which is why they are the
 * screens most likely to have gone unlooked-at.
 */
const NOTICES = [
  { name: 'notice-no-climate', country: 'MDV', mode: 'Current' },
  { name: 'notice-unavailable', country: 'ZMB', mode: 'Current' },
  { name: 'notice-anchor-current', country: 'ECU', mode: 'Current' },
  { name: 'notice-anchor-verified', country: 'SYR', mode: 'Verified' },
];

const WIDGETS = [
  { name: 'widget-debt-dynamics', path: 'widgets/debt-dynamics/' },
  { name: 'widget-growth', path: 'widgets/growth/' },
  { name: 'widget-climate-channel', path: 'widgets/climate-channel/' },
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const errors = [];
let shots = 0;

const shoot = async (page, name, full = false) => {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  shots += 1;
  console.log(`  ${name}.png`);
};

const setMode = async (page, mode) => {
  const button = page.locator('.mode__switch').getByRole('radio', { name: mode, exact: true });
  if ((await button.getAttribute('aria-checked')) === 'true') return;
  await button.click();
  await page.waitForTimeout(700);
};

/**
 * The GLOBAL register control, not a per-chart override.
 *
 * Every chart carries its own register radio with the same two labels, so a
 * bare role lookup finds four of them. Scoped to the global control's own
 * radiogroup, which is the one this sweep is exercising.
 */
const setRegister = async (page, register) => {
  const button = page
    .locator('.register__control')
    .getByRole('radio', { name: register, exact: true });
  if ((await button.getAttribute('aria-checked')) === 'true') return;
  await button.click();
  await page.waitForTimeout(400);
};

const openTab = async (page, tab) => {
  await page.getByRole('tab', { name: tab, exact: true }).click();
  await page.waitForTimeout(450);
};

const openPanel = async (page, param) => {
  await page
    .getByRole('button', {
      name: new RegExp(
        `(source data behind|context for) ${param.replace(/[()%.,]/g, '\\$&')}$`,
        'i',
      ),
    })
    .click();
  await page.waitForTimeout(450);
};

for (const viewport of VIEWPORTS) {
  console.log(`\n${viewport.name}`);
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
  });
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`[${viewport.name}] ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`[${viewport.name}] pageerror: ${e.message}`));

  // ── The loading state ──────────────────────────────────────────────────────
  // Held open by delaying the country payload. It is on screen for about a
  // second in real use and is the first thing anybody sees.
  //
  // The handler stays installed for the whole run and is switched off by a
  // flag rather than unrouted: unrouting while a delayed handler is still
  // sleeping leaves it to resume against a route Playwright has already
  // reclaimed.
  let slowPayloads = true;
  await page.route('**/data/**/*.json', async (route) => {
    if (slowPayloads) await new Promise((r) => setTimeout(r, 2500));
    await route.continue();
  });
  await page.goto(URL_BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  await shoot(page, `${viewport.name}__state-loading`);

  slowPayloads = false;
  await page.goto(URL_BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  for (const mode of MODES) {
    await setMode(page, mode);
    const m = mode.toLowerCase();

    for (const tab of CHART_TABS) {
      await openTab(page, tab);
      for (const register of REGISTERS) {
        await setRegister(page, register);
        await shoot(page, `${viewport.name}__${m}__${tab}__${register.toLowerCase()}`);
      }
      await setRegister(page, 'Workbook');
    }

    for (const tab of PROSE_TABS) {
      await openTab(page, tab);
      await shoot(page, `${viewport.name}__${m}__${tab.replace(/ /g, '-')}`);
      // The prose tabs run past the fold; the scrolling view is the one a
      // reader actually gets, so both are worth having.
      await shoot(page, `${viewport.name}__${m}__${tab.replace(/ /g, '-')}__full`, true);
    }

    await openTab(page, 'Baseline');
    for (const panel of PANELS) {
      await openPanel(page, panel.param);
      await shoot(page, `${viewport.name}__${m}__panel-${panel.name}`);
      await page.getByRole('button', { name: 'Back to the charts' }).click();
      await page.waitForTimeout(300);
    }
  }

  // ── The notices ────────────────────────────────────────────────────────────
  for (const notice of NOTICES) {
    await setMode(page, notice.mode);
    await page.selectOption('#country', notice.country);
    await page.waitForTimeout(1400);
    await openTab(page, 'Baseline');
    await shoot(page, `${viewport.name}__${notice.name}`);
  }
  await page.selectOption('#country', 'UGA');
  await page.waitForTimeout(1200);

  await page.close();

  // ── The widgets, separate builds ───────────────────────────────────────────
  for (const widget of WIDGETS) {
    const wpage = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
    });
    wpage.on('pageerror', (e) => errors.push(`[${widget.name}] pageerror: ${e.message}`));
    await wpage.goto(`${URL_BASE}${widget.path}`, { waitUntil: 'networkidle' });
    await wpage.waitForTimeout(900);
    await shoot(wpage, `${viewport.name}__${widget.name}`);
    await wpage.close();
  }
}

await browser.close();

console.log(`\n${shots} screenshots in ${OUT}`);
if (errors.length) {
  console.error(`\n${errors.length} console error(s):\n${errors.join('\n')}`);
  process.exit(1);
}
console.log('no console errors');
