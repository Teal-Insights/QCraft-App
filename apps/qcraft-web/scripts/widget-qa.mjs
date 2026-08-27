/**
 * Visual QA for the three teaching widgets.
 *
 * These are the parts of the app a typecheck is least able to judge. A widget
 * can compile, render, and still fail its brief by scrolling, by hiding a
 * control below the fold, by printing a caption that contradicts its own chart,
 * or by animating so fast that nothing reads as movement. This script drives
 * each route the way a trainer would and leaves screenshots to look at.
 *
 *   npm run build
 *   npm run preview -- --port 4173 &
 *   node scripts/widget-qa.mjs [outDir]
 *
 * It asserts the two structural properties the brief is explicit about, and
 * exits non-zero on a console error or a failed assertion:
 *
 *   1. NO SCROLLING. The document must not be taller than the viewport, at a
 *      projector size and at a laptop size. The slider and the line it moves
 *      have to be in one visual field.
 *   2. THE PRIMARY CHART STAYS READABLE. "Fits without scrolling" is not the
 *      same as "works": the climate widget once fitted a 620px iframe by
 *      squeezing its debt fan, the thing it is named after, down to twenty
 *      pixels. So the last chart on the page must keep a real plot area.
 *   3. THE CAPTION MOVES. The caption text before the interaction and after it
 *      must differ, because a caption that does not narrate the change is not
 *      doing the job the brief gives it.
 */

import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const OUT = process.argv[2] ?? '/tmp/qcraft-widgets';
const BASE = process.env.QCRAFT_PREVIEW_URL ?? 'http://localhost:4173/';

/** Each route, and the one interaction that should make its caption move. */
const ROUTES = [
  {
    slug: 'debt-dynamics',
    name: 'The debt equation sandbox',
    async interact(page) {
      await page.getByRole('button', { name: 'r equals g' }).click();
    },
  },
  {
    slug: 'growth',
    name: 'Where growth comes from',
    async interact(page) {
      await page.getByRole('radio', { name: 'Low' }).click();
    },
  },
  {
    slug: 'climate-channel',
    name: 'How warming reaches the debt line',
    async interact(page) {
      // Home on a focused range input drives it to its minimum. Driving the
      // control the way a keyboard user would beats reaching into the DOM to
      // set .value, which fires no event a React onChange would hear.
      await page.locator('#rigidity').focus();
      await page.keyboard.press('Home');
    },
  },
];

/*
 * Three sizes, because these widgets have three real homes: projected in the
 * training room, opened on a laptop, and iframed into a Quarto course page at
 * whatever box the page gives them. The iframe size is the one most likely to
 * break, and the one nobody looks at until the course is built.
 */
const VIEWPORTS = [
  { label: 'projector', width: 1440, height: 900 },
  { label: 'laptop', width: 1280, height: 720 },
  { label: 'iframe', width: 900, height: 620 },
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const problems = [];

for (const route of ROUTES) {
  for (const viewport of VIEWPORTS) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
    });
    page.on('console', (m) => {
      if (m.type() === 'error') problems.push(`${route.slug} [${viewport.label}]: ${m.text()}`);
    });
    page.on('pageerror', (e) =>
      problems.push(`${route.slug} [${viewport.label}]: pageerror: ${e.message}`),
    );

    await page.goto(`${BASE}widgets/${route.slug}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);

    const title = await page.locator('.widget__title').textContent();
    if (!title) problems.push(`${route.slug} [${viewport.label}]: no title rendered`);

    // 1. No scrolling. Measured from the body box against the viewport rather
    // than from inside the page, so this file stays plain Node with no browser
    // globals in it.
    const body = await page.locator('body').boundingBox();
    const overflow = Math.round(body.height - viewport.height);
    if (overflow > 1) {
      problems.push(
        `${route.slug} [${viewport.label}]: page scrolls by ${overflow}px, ` +
          'so the control and its chart are not in one visual field',
      );
    }

    // 2. The chart the widget is named after keeps a usable plot area. It is
    // always the LAST one on the page: the climate widget puts its cause chart
    // first and its debt fan second, and the fan is the payoff.
    const MIN_PLOT_HEIGHT = 140;
    const plots = page.locator('.wc__plot-wrap');
    const primary = await plots.nth((await plots.count()) - 1).boundingBox();
    if (primary.height < MIN_PLOT_HEIGHT) {
      problems.push(
        `${route.slug} [${viewport.label}]: primary chart is only ` +
          `${Math.round(primary.height)}px tall, under the ${MIN_PLOT_HEIGHT}px floor`,
      );
    }

    await page.screenshot({ path: `${OUT}/${route.slug}-${viewport.label}-default.png` });

    // 3. The caption narrates the change.
    const before = await page.locator('.widget__caption').textContent();
    await route.interact(page);
    await page.waitForTimeout(800);
    const after = await page.locator('.widget__caption').textContent();
    if (before === after) {
      problems.push(`${route.slug} [${viewport.label}]: caption did not change on interaction`);
    }

    const predict = await page.locator('.wpredict').getAttribute('class');
    if (!predict.includes('wpredict--revealed')) {
      problems.push(`${route.slug} [${viewport.label}]: predict-first did not reveal`);
    }

    await page.screenshot({ path: `${OUT}/${route.slug}-${viewport.label}-changed.png` });
    console.log(`${route.slug} [${viewport.label}]: ${title.trim().slice(0, 60)}`);
    await page.close();
  }
}

await browser.close();

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n${problems.join('\n')}`);
  process.exit(1);
}
console.log(`\nall three widgets clean; screenshots in ${OUT}`);
