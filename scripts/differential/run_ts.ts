/**
 * Run the TypeScript engine over exported country JSON and dump results.
 *
 * The TS half of the TypeScript-vs-Python differential; `run_python.py` is the
 * other half and `compare.py` diffs the two dumps.
 *
 *   npx vite-node scripts/differential/run_ts.ts -- \
 *     --in <exported-json-dir> --out <dump-dir> [--params <json>]
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { runPipeline, type CountryInput, type PipelineParams } from '../../packages/qcraft-engine-ts/src/index.js';

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

const inDir = arg('--in');
const outDir = arg('--out');
if (!inDir || !outDir) {
  console.error('usage: run_ts.ts --in <dir> --out <dir> [--params <file>]');
  process.exit(2);
}

const paramsFile = arg('--params');
const params: Partial<PipelineParams> = paramsFile
  ? (JSON.parse(readFileSync(paramsFile, 'utf8')) as Partial<PipelineParams>)
  : {};

mkdirSync(outDir, { recursive: true });

let ok = 0;
const failed: string[] = [];
for (const file of readdirSync(inDir).filter((f) => f.endsWith('.json')).sort()) {
  const iso3c = basename(file, '.json');
  try {
    const input = JSON.parse(readFileSync(join(inDir, file), 'utf8')) as CountryInput;
    const result = runPipeline(input, params);
    // Flatten `climate` so both dumps share one shape: one key per module and
    // one per scenario, exactly as Python's run_pipeline returns them.
    const { climate, ...modules } = result;
    const payload: Record<string, unknown> = { ...modules, ...climate };
    writeFileSync(join(outDir, file), JSON.stringify(payload));
    ok += 1;
  } catch (err) {
    failed.push(`${iso3c}: ${(err as Error).message}`);
  }
}

console.log(`ts: ${ok} ok -> ${outDir}`);
for (const f of failed) console.log(`ts: FAILED ${f}`);
process.exit(failed.length ? 1 : 0);
