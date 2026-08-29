/**
 * Regression loop for the CC-16 HCD micro-fixes (audit F-4, F-13, F-3, F-2).
 *
 * Each check drives the exact moment the 2026-08 HCD audit screenshotted, on
 * the real app, because that is where every one of these defects lived: a
 * hover state the unit suite cannot see, a download completing, a field
 * emptied under the analyst's cursor.
 *
 *   A1 (F-4): the active mode pill stays legible under the pointer at the
 *       moment of switching. The audit measured ink on ink there.
 *   A2 (F-13): the packet button is legible while hovered, and returns to its
 *       resting style after a completed download. The audit's after-download
 *       shot is white text on the generic hover's pale background.
 *   A4 (F-3): an emptied numeric field never becomes an assumption of zero.
 *       The audit watched the headline recompute and "0" rerender mid-edit.
 *   A5 (F-2 partial): 999 in a max-15 field gets a flag beside the field on
 *       blur. The projection still computes with it; the stale-state hold is
 *       deliberately v2.1's, and the test pins that boundary too.
 *
 *   npm run build
 *   npm run preview -- --port 4173 &
 *   node scripts/microfix-qa.mjs [outDir]
 *
 * Exits non-zero on any failed check or console error.
 */

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const OUT = process.argv[2] ?? '/tmp/qcraft-microfix';
const URL_BASE = process.env.QCRAFT_PREVIEW_URL ?? 'http://localhost:4173/';

/** The training-room floor, and the audit's viewport. */
const VIEWPORT = { width: 1440, height: 900 };

mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${detail}]` : ''}`);
  if (!ok) failures += 1;
};

/** WCAG relative luminance of an rgb(...) computed-style string. */
const luminance = (rgb) => {
  const [r, g, b] = rgb
    .match(/\d+(\.\d+)?/g)
    .slice(0, 3)
    .map((v) => {
      const c = Number(v) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** WCAG contrast ratio between two computed rgb(...) strings. */
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const styleOf = (page, selector) =>
  page.$eval(selector, (el) => {
    const cs = getComputedStyle(el);
    return {
      color: cs.color,
      bg: cs.backgroundColor,
      hovered: el.matches(':hover'),
      disabled: el.disabled ?? false,
      label: el.textContent,
    };
  });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: VIEWPORT,
  acceptDownloads: true,
});
const page = await context.newPage();

const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});

await page.goto(URL_BASE, { waitUntil: 'networkidle' });

/* ── A1: the mode pill at the moment of switching ─────────────────────────── */

// The audit's gesture: the pointer travels to Verified, rests there, clicks.
await page.hover('.mode__option:not(.mode__option--active)');
await page.click('.mode__option:not(.mode__option--active)');
// The switch refetches the vintage; wait for the active class to arrive on the
// pill under the pointer.
await page.waitForFunction(
  () => document.querySelector('.mode__option--active')?.matches(':hover'),
  null,
  { timeout: 15_000 },
);

let pill = await styleOf(page, '.mode__option--active');
check(
  'A1: active pill label is legible under the pointer at the switch',
  pill.hovered && contrast(pill.color, pill.bg) >= 4.5,
  `${pill.label}: ${pill.color} on ${pill.bg}, contrast ${contrast(pill.color, pill.bg).toFixed(2)}`,
);
await page.screenshot({ path: join(OUT, 'a1-pill-hover.png') });

// Back to Current the same way; both directions matter on a projector.
await page.hover('.mode__option:not(.mode__option--active)');
await page.click('.mode__option:not(.mode__option--active)');
await page.waitForFunction(
  () => document.querySelector('.mode__option--active')?.matches(':hover'),
  null,
  { timeout: 15_000 },
);
pill = await styleOf(page, '.mode__option--active');
check(
  'A1: same on the switch back',
  pill.hovered && contrast(pill.color, pill.bg) >= 4.5,
  `${pill.label}: ${pill.color} on ${pill.bg}`,
);

/* ── A2: the packet button, hovered and after a completed download ────────── */

await page.click('button:text-is("Export")');
const packetButton = 'button.button--primary';
await page.waitForSelector(packetButton);

await page.hover(packetButton);
let btn = await styleOf(page, packetButton);
check(
  'A2: packet button is legible while hovered',
  btn.hovered && contrast(btn.color, btn.bg) >= 4.5,
  `${btn.color} on ${btn.bg}, contrast ${contrast(btn.color, btn.bg).toFixed(2)}`,
);

// The download, awaited on the event rather than slept through.
const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 90_000 }).catch(() => null),
  page.click(packetButton),
]);
check('A2: the click produced a download', download !== null);
if (download) await download.saveAs(join(OUT, download.suggestedFilename()));

// The moment the audit screenshotted: download done, pointer still on the
// button. The button must be back at rest: enabled, resting label, legible.
await page.waitForFunction(
  (sel) => {
    const el = document.querySelector(sel);
    return el && !el.disabled && /Download the packet/.test(el.textContent);
  },
  packetButton,
  { timeout: 90_000 },
);
btn = await styleOf(page, packetButton);
check(
  'A2: after the download completes it is back at rest and legible under the pointer',
  btn.hovered && !btn.disabled && contrast(btn.color, btn.bg) >= 4.5,
  `${btn.color} on ${btn.bg}, contrast ${contrast(btn.color, btn.bg).toFixed(2)}`,
);
await page.screenshot({ path: join(OUT, 'a2-button-after-download.png') });

/* ── A4: the emptied field (audit shot 12b) ───────────────────────────────── */

await page.click('button:text-is("Baseline")');
const headline = () => page.$eval('.card__value', (el) => el.textContent);
const field = '#prod-start';

const before = await headline();
await page.fill(field, '');
// Give a wrong recompute every chance to land before asserting it did not.
await page.waitForTimeout(600);

check(
  'A4: emptying the field never writes 0 back into the input',
  (await page.inputValue(field)) === '',
  `input reads "${await page.inputValue(field)}"`,
);
check(
  'A4: the projection holds the last valid value, not zero',
  (await headline()) === before,
  `headline ${before} -> ${await headline()}`,
);
const emptyFlag = await page.$eval('.field__flag', (el) => el.textContent).catch(() => null);
check(
  'A4: the field is flagged while empty',
  emptyFlag === 'No value yet. The projection keeps the last value, 5.',
  `flag: ${emptyFlag}`,
);
await page.screenshot({ path: join(OUT, 'a4-emptied.png') });

// Leaving the field restores the last valid value and clears the flag.
await page.click('h1');
check(
  'A4: on blur the last valid value returns to the box',
  (await page.inputValue(field)) === '5',
  `input reads "${await page.inputValue(field)}"`,
);
check('A4: the flag clears on blur', (await page.$('.field__flag')) === null);
check('A4: the projection never moved', (await headline()) === before);

/* ── A5: 999 in a max-15 field (audit shot 12d) ───────────────────────────── */

await page.fill(field, '999');
await page.waitForTimeout(600);
const at999 = await headline();
// The engine still computes at 999: A5 is additive by design, the stale-state
// hold is v2.1's. This assertion pins that boundary; the v2.1 lane flips it.
check(
  'A5: the projection still recomputes at 999 (engine untouched by design)',
  at999 !== before,
  `headline ${before} -> ${at999}`,
);
check(
  'A5: no flag while the analyst is still in the field',
  (await page.$('.field__flag')) === null,
);

await page.click('h1');
const rangeFlag = await page.$eval('.field__flag', (el) => el.textContent).catch(() => null);
check(
  'A5: on blur the flag names the declared range beside the field',
  rangeFlag ===
    'Outside the range this field accepts (-5 to 15). The projection is still computed with 999.',
  `flag: ${rangeFlag}`,
);
check(
  'A5: the typed value is preserved, not clamped or discarded',
  (await page.inputValue(field)) === '999',
  `input reads "${await page.inputValue(field)}"`,
);
await page.screenshot({ path: join(OUT, 'a5-999-blur.png') });

// A valid value clears the flag.
await page.fill(field, '5');
await page.click('h1');
check('A5: a valid value clears the flag', (await page.$('.field__flag')) === null);

/* ── The console stayed clean ─────────────────────────────────────────────── */

check('console: zero errors', consoleErrors.length === 0, consoleErrors.join(' | '));

await browser.close();
console.log(failures === 0 ? '\nmicrofix-qa: all checks passed' : `\nmicrofix-qa: ${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
