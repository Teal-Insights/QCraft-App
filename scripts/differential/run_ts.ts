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

/**
 * The permanent country set, shared with run_python.py. Passing `--all` reads
 * every payload in the input directory instead, which is what the completeness
 * sweep wants.
 */
const spec = JSON.parse(
  readFileSync(join(import.meta.dirname, 'countries.json'), 'utf8'),
) as { countries: string[] };
const useAll = process.argv.includes('--all');
const files = useAll
  ? readdirSync(inDir)
      .filter((f) => f.endsWith('.json'))
      .sort()
  : spec.countries.map((iso) => `${iso}.json`).sort();

let ok = 0;
const failed: string[] = [];
for (const file of files) {
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
    // A refusal is a result, recorded in the shape compare.py reads. Dropping
    // it is how the Zambia and Libya divergence stayed invisible: Python raised,
    // this engine returned a debt path anchored at zero, and neither dump ever
    // met the other.
    const e = err as Error;
    writeFileSync(
      join(outDir, `${iso3c}.failure.json`),
      JSON.stringify({ error: e.constructor.name, message: e.message }),
    );
    failed.push(`${iso3c}: ${e.constructor.name}: ${e.message}`);
  }
}

console.log(`ts: ${ok} ok, ${failed.length} refused -> ${outDir}`);
for (const f of failed) console.log(`ts: refused ${f}`);
// Refusing is not an error here; compare.py decides whether the two engines
// refused the same countries for the same reason.
process.exit(0);
