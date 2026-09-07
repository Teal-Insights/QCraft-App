// Checkpoint 2: reproduce the accepted live-browser packet (R-003, target 60)
// with the engine at the packet's own params, and compare every numeric cell
// of its results.csv (7 series x 91 years x 6 columns, 2 decimals).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runPipeline } from '@qcraft/engine';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const packet = join(root, 'evidence/packet');
const stem = 'qcraft-UGA-20260906-131857';
const run = JSON.parse(readFileSync(join(packet, `${stem}-run.json`), 'utf8'));
const csv = readFileSync(join(packet, `${stem}-results.csv`), 'utf8').trim().split('\n');
const input = JSON.parse(readFileSync(join(root, 'public/data/weo-2026-04-full-horizon-v1/UGA.json'), 'utf8'));

if (run.inputSha256 !== input.horizonPolicy.inputSha256) {
  throw new Error(`inputSha256 mismatch: packet ${run.inputSha256} vs payload ${input.horizonPolicy.inputSha256}`);
}
const { iso3c, ...params } = run.params;
const result = runPipeline(input, params);

const header = csv[0].split(',');
const cols = header.slice(2);
const series = (name) => (name === 'Baseline' ? result.fiscal : result.climate[name]);
let compared = 0;
let mismatches = [];
let rowsChecked = 0;
for (const line of csv.slice(1)) {
  const cells = line.split(',');
  const [scenario, year] = cells;
  const rows = series(scenario);
  if (!rows) continue; // metadata rows (Country, Run manifest, Application)
  const r = rows.find((x) => x.years === Number(year));
  rowsChecked += 1;
  cols.forEach((c, i) => {
    const expected = cells[i + 2];
    const got = r[c].toFixed(2);
    compared += 1;
    if (got !== expected) mismatches.push({ scenario, year, col: c, expected, got });
  });
}
console.log(`Packet ${stem}: params ${JSON.stringify(params)}`);
console.log(`Rows checked: ${rowsChecked}, cells compared: ${compared}, mismatches: ${mismatches.length}`);
if (mismatches.length) {
  console.log(mismatches.slice(0, 20));
  process.exit(1);
}
const at = (rows, y) => rows.find((r) => r.years === y).debt_to_gdp.toFixed(2);
console.log(`Headline at target 60: Baseline 2099 ${at(result.fiscal, 2099)}, Hot 2099 ${at(result.climate.Hot, 2099)}, Hot_Unadapted 2099 ${at(result.climate.Hot_Unadapted, 2099)}`);
console.log('MATCH');
