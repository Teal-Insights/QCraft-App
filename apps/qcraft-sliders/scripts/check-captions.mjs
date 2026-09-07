// Wiring check: for each panel's try value, compute the 2099 debt in Node and
// confirm the number appears in the caption Chrome rendered (shots/dom-try*.html).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runPipeline } from '@qcraft/engine';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const input = JSON.parse(readFileSync(join(root, 'public/data/weo-2026-04-full-horizon-v1/UGA.json'), 'utf8'));
const at = (rows, y) => rows.find((r) => r.years === y).debt_to_gdp;

// Mirror of the try values in src/panels.ts, in panel order.
const TRIES = [
  ['demography', { demography_variant: 'Low' }],
  ['productivity-start', { productivity_start: 3.0 }],
  ['productivity-end', { productivity_end: 2.0 }],
  ['turning-point', { productivity_turning_point: 30 }],
  ['inflation-start', { inflation_start: 8.0 }],
  ['inflation-end', { inflation_end: 6.0 }],
  ['interest', { interest_rate_mode: 'Real interest rate', long_run_interest_rate: 1.0 }],
  ['debt-target', { debt_target: 70 }],
  ['fiscal-rule', { fiscal_rule: 'No' }],
  ['rigidity', { expenditure_rigidity: 0.0 }, 'Hot'],
  ['climate', {}, 'Hot'],
];

const caps = (file) => {
  const html = readFileSync(join(root, 'shots', file), 'utf8');
  return [...html.matchAll(/<p class="caption[^"]*"[^>]*>(.*?)<\/p>/gs)].map((m) => m[1].replace(/&[a-z]+;/g, ' '));
};

let failures = 0;
for (const [file, on] of [['dom-try.html', 'Baseline'], ['dom-try-hot.html', 'Hot']]) {
  const rendered = caps(file);
  TRIES.forEach(([id, params, fixed], i) => {
    const key = fixed ?? on;
    const r = runPipeline(input, params);
    const v99 = at(key === 'Baseline' ? r.fiscal : r.climate[key], 2099).toFixed(1);
    const ok = rendered[i].includes(`Debt in 2099: ${v99} `) || rendered[i].includes(`Debt in 2099: ${v99.replace('-', '−')} `);
    if (!ok) failures += 1;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${file} ${id} on ${key}: expected 2099 = ${v99}`);
  });
}
console.log(failures ? `${failures} FAILURES` : 'ALL CAPTIONS MATCH NODE');
process.exit(failures ? 1 : 0);
