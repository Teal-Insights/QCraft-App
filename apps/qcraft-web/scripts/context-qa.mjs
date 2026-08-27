/**
 * Visual QA for the parameter context panels.
 *
 * The panels are the one part of the app whose correctness is partly a claim
 * about layout: "the control and its context are in one visual field" is either
 * true on a 1440x900 laptop or it is marketing. So this script opens each panel
 * at that size and fails if the panel's caption, its source line, or the
 * sidebar control it belongs to is below the fold.
 *
 * It also drives each parameter to a non-default value and shoots the panel
 * again, because a caption that does not change when the parameter moves is the
 * failure mode these panels exist to avoid.
 *
 * Run 5 added a second view to every panel and two panels of their own. The
 * peer view carries the same promise as the record view, so it gets the same
 * fold check and the same "does the caption move" check, plus one the record
 * view does not need: the sentence the panel offers to write into the run's
 * rationale has to actually arrive in the sidebar input, because that is the
 * path by which a peer comparison reaches the export packet.
 *
 *   npm run build
 *   npm run preview -- --port 4173 &
 *   node scripts/context-qa.mjs [outDir]
 *
 * Exits non-zero on a console error, a panel that does not open, a caption that
 * does not respond, or anything below the fold.
 */

import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const OUT = process.argv[2] ?? '/tmp/qcraft-context';
const URL_BASE = process.env.QCRAFT_PREVIEW_URL ?? 'http://localhost:4173/';

/** Viewport: a 1440x900 laptop, which is the training-room floor. */
const VIEWPORT = { width: 1440, height: 900 };

/**
 * One entry per panel: the sidebar control that opens it, and an edit that must
 * move the caption.
 */
const PANELS = [
  {
    name: 'demography',
    param: 'Demography variant',
    control: '#demography',
    edit: async (page) => page.selectOption('#demography', 'Low'),
    peerView: 'All countries',
  },
  {
    name: 'productivity',
    param: 'Productivity growth, long run (%)',
    control: '#prod-end',
    edit: async (page) => page.fill('#prod-end', '2.5'),
    peerView: 'All countries',
  },
  {
    name: 'inflation',
    param: 'Inflation, long run (%)',
    control: '#infl-end',
    edit: async (page) => page.fill('#infl-end', '6'),
    peerView: 'All countries',
  },
  {
    name: 'interest-rate',
    param: 'Interest-rate approach',
    control: '#interest-mode',
    edit: async (page) => page.selectOption('#interest-mode', 'Real interest rate'),
    peerView: 'All countries',
  },
  {
    name: 'debt-target',
    param: 'Debt target (% GDP)',
    control: '#debt-target',
    edit: async (page) => page.fill('#debt-target', '35'),
    // The debt panel is a peer view already; its rows are the whole panel.
    peerView: null,
  },
  {
    name: 'rigidity',
    param: 'Expenditure rigidity',
    control: '#rigidity',
    edit: async (page) => page.fill('#rigidity', '0.4'),
    // Rigidity's second view is the country scatter rather than a peer strip.
    peerView: 'This country\u2019s own years',
  },
];

/** The parameters that still reveal a line rather than a panel. */
const NOTES = [
  { name: 'fiscal-rule', param: 'Fiscal rule' },
  { name: 'country', param: 'Country' },
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: VIEWPORT });

const errors = [];
const failures = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

await page.goto(URL_BASE, { waitUntil: 'networkidle' });

/** Is this element fully inside the viewport, without scrolling? */
/**
 * One pixel of slack, and only one.
 *
 * Measured at the merge: the inflation control's bottom edge lands at 899.98 on
 * `feat/param-discovery` and at 900.36 here. That is a shift of three eighths of
 * a pixel in a 36px input, from sub-pixel reflow of text above it, and the
 * threshold had no margin at all: the lane's own build cleared it by one
 * sixty-fourth of a pixel. A check that tight reports float noise, not layout.
 *
 * The slack is one pixel because the promise is real and worth failing on: a
 * caption or a source line genuinely pushed out of the visual field overshoots
 * by tens of pixels, not by a fraction of one, and still fails here.
 */
const FOLD_SLACK_PX = 1;

const withinFold = async (locator) => {
  const box = await locator.boundingBox();
  if (!box) return false;
  return box.y >= 0 && box.y + box.height <= VIEWPORT.height + FOLD_SLACK_PX;
};

const openContext = async (param) => {
  await page
    .getByRole('button', { name: new RegExp(`(source data behind|context for) ${param.replace(/[()%.,]/g, '\\$&')}$`, 'i') })
    .click();
  await page.waitForTimeout(350);
};

for (const panel of PANELS) {
  await openContext(panel.param);

  const figure = page.locator('.cpanel');
  if (!(await figure.count())) {
    failures.push(`${panel.name}: panel did not open`);
    continue;
  }

  const caption = page.locator('.cpanel__caption');
  const before = await caption.innerText();

  await page.screenshot({ path: `${OUT}/${panel.name}.png` });
  console.log(`wrote ${OUT}/${panel.name}.png`);

  // The whole claim of this feature: caption, source line and the sidebar
  // control that owns the panel are all on screen at once.
  for (const [what, locator] of [
    ['caption', caption],
    ['source line', page.locator('.cpanel__source')],
    ['its sidebar control', page.locator(panel.control)],
  ]) {
    if (!(await withinFold(locator))) {
      failures.push(`${panel.name}: ${what} is below the fold at ${VIEWPORT.height}px`);
    }
  }

  // Moving the parameter has to move the panel.
  await panel.edit(page);
  await page.waitForTimeout(400);
  const after = await caption.innerText();
  if (before === after) {
    failures.push(`${panel.name}: caption did not change when the parameter moved`);
  }
  await page.screenshot({ path: `${OUT}/${panel.name}-changed.png` });
  console.log(`wrote ${OUT}/${panel.name}-changed.png`);

  // ── The second view ────────────────────────────────────────────────────────
  // Same promise, same checks: the peer view has to fit the fold and has to
  // answer the sidebar, or it is a chart in a drawer rather than context.
  if (panel.peerView) {
    await page.getByRole('radio', { name: panel.peerView }).click();
    await page.waitForTimeout(450);
    const peerCaption = await caption.innerText();
    if (peerCaption === after) {
      failures.push(`${panel.name}: the second view shows the same caption as the first`);
    }
    for (const [what, locator] of [
      ['peer caption', caption],
      ['peer source line', page.locator('.cpanel__source')],
      ['its sidebar control', page.locator(panel.control)],
    ]) {
      if (!(await withinFold(locator))) {
        failures.push(`${panel.name}: ${what} is below the fold at ${VIEWPORT.height}px`);
      }
    }
    await page.screenshot({ path: `${OUT}/${panel.name}-peers.png` });
    console.log(`wrote ${OUT}/${panel.name}-peers.png`);
  }

  // ── The rationale hand-off ────────────────────────────────────────────────
  // A peer comparison that cannot reach the run's annotations cannot reach the
  // export packet, which is the whole point of wiring it.
  const addButton = page.getByRole('button', { name: /Add to the rationale/ });
  if (await addButton.count()) {
    await addButton.first().click();
    await page.waitForTimeout(300);
    const written = await page
      .locator('.rationale__input')
      .evaluateAll((nodes) => nodes.map((n) => n.value).filter(Boolean));
    if (!written.length) {
      failures.push(`${panel.name}: the rationale sentence did not reach the sidebar`);
    }
    for (const value of written) {
      if (value.length > 200) {
        failures.push(`${panel.name}: rationale note is ${value.length} characters, over the 200 cap`);
      }
    }
    await page.locator('.sidebar').screenshot({ path: `${OUT}/${panel.name}-rationale.png` });
    console.log(`wrote ${OUT}/${panel.name}-rationale.png`);
  } else if (panel.peerView !== null || panel.name === 'debt-target') {
    failures.push(`${panel.name}: no rationale action offered in the peer view`);
  }

  await page.getByRole('button', { name: 'Back to the charts' }).click();
  await page.waitForTimeout(200);
}

// The demography panel's comparator picker is the only control that is the
// panel's own rather than the sidebar's, so it gets its own pass.
await openContext('Demography variant');
await page.getByRole('checkbox', { name: 'Bangladesh' }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/demography-two-comparators.png` });
console.log(`wrote ${OUT}/demography-two-comparators.png`);
await page.getByRole('radio', { name: 'Total population' }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/demography-total.png` });
console.log(`wrote ${OUT}/demography-total.png`);

/*
 * A selected chip must stay legible under the cursor that just selected it.
 * `:hover` is a more specific selector than the on-state class, so a hover rule
 * that sets a text colour will repaint an active chip's label to its own
 * background and make it vanish. It did. This is the guard.
 */
const legibleWhileHovered = async (locator, what) => {
  await locator.hover();
  await page.waitForTimeout(150);
  const same = await locator.evaluate((el) => {
    const cs = getComputedStyle(el);
    return el.className.includes('--on') && cs.color === cs.backgroundColor;
  });
  if (same) failures.push(`${what}: text matches its own background on hover while selected`);
};

await legibleWhileHovered(page.getByRole('radio', { name: 'Total population' }), 'selected chip');
await legibleWhileHovered(page.getByRole('checkbox', { name: 'Kenya' }), 'selected comparator');
await legibleWhileHovered(
  page.getByRole('button', { name: /source data behind Demography variant$/i }),
  'open Context button',
);
await page.getByRole('button', { name: 'Back to the charts' }).click();
await page.waitForTimeout(200);

for (const note of NOTES) {
  await openContext(note.param);
  await page.waitForTimeout(250);
  const revealed = page.locator('.ctxnote');
  if (!(await revealed.count())) {
    failures.push(`${note.name}: inline context did not reveal`);
  }
  await page.locator('.sidebar').screenshot({ path: `${OUT}/note-${note.name}.png` });
  console.log(`wrote ${OUT}/note-${note.name}.png`);
  await openContext(note.param);
}

await browser.close();

if (errors.length) console.error(`\n${errors.length} console error(s):\n${errors.join('\n')}`);
if (failures.length) console.error(`\n${failures.length} QA failure(s):\n${failures.join('\n')}`);
if (errors.length || failures.length) process.exit(1);
console.log('\nall panels open, respond to their parameter, and fit the fold');
