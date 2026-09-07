// Checkpoint 1: run the engine under Node on Uganda Current at the shared
// teaching settings and print debt-to-GDP for 2031, 2050, 2099.
// Writes numbers-check.md next to the project root.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runPipeline, DEFAULTS } from '@qcraft/engine';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const input = JSON.parse(readFileSync(join(root, 'public/data/weo-2026-04-full-horizon-v1/UGA.json'), 'utf8'));

// The shared teaching settings. These are the engine DEFAULTS; spelled out so the
// check is explicit rather than implicit.
const SHARED = {
  demography_variant: 'Medium',
  productivity_start: 5.0,
  productivity_end: 1.2,
  productivity_turning_point: 15,
  inflation_start: 5.0,
  inflation_end: 3.5,
  interest_rate_mode: 'Nominal interest rate',
  long_run_interest_rate: 1.0,
  debt_target: 50.0,
  fiscal_rule: 'Yes',
  expenditure_rigidity: 1.0,
};

for (const k of Object.keys(SHARED)) {
  if (DEFAULTS[k] !== SHARED[k]) throw new Error(`Engine default differs for ${k}: ${DEFAULTS[k]}`);
}

const YEARS = [2031, 2050, 2099];
const at = (rows, y) => rows.find((r) => r.years === y).debt_to_gdp;

const ref = runPipeline(input, SHARED);
const rig0 = runPipeline(input, { ...SHARED, expenditure_rigidity: 0.0 });

const hp = ref.horizonPolicy;
const lines = [];
lines.push('# numbers-check: Uganda, Current mode, shared teaching settings');
lines.push('');
lines.push(`Engine: @qcraft/engine (packages/qcraft-engine-ts at app source a6313ad7), run under Node ${process.version}.`);
lines.push(`Input: payloads/weo-2026-04-full-horizon-v1/UGA.json, inputSha256 ${hp.inputSha256}.`);
lines.push(`Policy: ${hp.id}; revision ${hp.dataRevision}; WEO through ${hp.weoMaxYear}; projection and climate from ${hp.climateStartYear}; coverage ${hp.coverageStatus}.`);
lines.push('');
lines.push('Settings: ' + Object.entries(SHARED).map(([k, v]) => `${k}=${v}`).join(', '));
lines.push('');
lines.push('Debt-to-GDP, percent of GDP:');
lines.push('');
lines.push('| Run | 2031 | 2050 | 2099 |');
lines.push('|---|---:|---:|---:|');
const row = (label, rows) => `| ${label} | ${YEARS.map((y) => at(rows, y).toFixed(2)).join(' | ')} |`;
lines.push(row('Baseline (no climate shock)', ref.fiscal));
lines.push(row('Hot, rigidity 1.0 (shared)', ref.climate.Hot));
lines.push(row('Hot, rigidity 0.0', rig0.climate.Hot));
lines.push('');
const d = (a, b, y) => (at(a, y) - at(b, y)).toFixed(2);
lines.push(`Hot minus Baseline: ${d(ref.climate.Hot, ref.fiscal, 2050)} points at 2050, ${d(ref.climate.Hot, ref.fiscal, 2099)} points at 2099.`);
lines.push(`Hot rigidity 1.0 minus rigidity 0.0: ${d(ref.climate.Hot, rig0.climate.Hot, 2050)} points at 2050, ${d(ref.climate.Hot, rig0.climate.Hot, 2099)} points at 2099.`);
lines.push('');
lines.push('All six scenarios at 2099, shared settings:');
lines.push('');
for (const s of ['Paris', 'Moderate', 'High', 'Hot_Adapted', 'Hot', 'Hot_Unadapted']) {
  lines.push(`- ${s}: ${at(ref.climate[s], 2099).toFixed(2)}`);
}
lines.push('');
lines.push(`Generated ${new Date().toISOString()}.`);

const out = lines.join('\n') + '\n';
writeFileSync(join(root, 'numbers-check.md'), out);
process.stdout.write(out);
