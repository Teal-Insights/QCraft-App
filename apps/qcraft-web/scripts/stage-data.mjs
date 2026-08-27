/**
 * Stage per-country engine inputs into `public/data/<vintage>/`.
 *
 * The Explorer fetches one country's inputs on demand rather than bundling 175
 * of them twice over (see src/engine/countryData.ts). Vite serves `public/`
 * verbatim in dev and copies it into `dist/` on build, so staging is the whole
 * of the wiring.
 *
 * Files are hard-linked, not copied: the two vintages are about 84 MB together,
 * the source and destination are on one filesystem, and a hard link is instant
 * and costs no extra disk. A copy is the fallback for the case where they are
 * not (a different volume, or a filesystem without links).
 *
 * `public/data/` is gitignored, exactly like the Parquet and JSON it comes from.
 * Regenerate the source with:
 *
 *   uv run --package qcraft-pipeline python scripts/build_vintage_json.py weo-2024-10
 *   uv run --package qcraft-pipeline qcraft-pipeline run
 */

import { copyFileSync, existsSync, linkSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..');
const repoRoot = resolve(appRoot, '../..');

/** Must agree with MODES in src/content/modes.ts. */
const VINTAGES = ['weo-2024-10', 'weo-2026-04'];

const REBUILD_HINT = (vintage) =>
  vintage === 'weo-2026-04'
    ? 'uv run --package qcraft-pipeline qcraft-pipeline run'
    : `uv run --package qcraft-pipeline python scripts/build_vintage_json.py ${vintage}`;

let staged = 0;
let linked = 0;
let copied = 0;

for (const vintage of VINTAGES) {
  const source = join(repoRoot, 'data', 'vintages', vintage, 'json');
  const dest = join(appRoot, 'public', 'data', vintage);

  if (!existsSync(source)) {
    console.error(
      `stage-data: ${source} does not exist.\n` +
        `The Explorer cannot run ${vintage} without it. Build it with:\n` +
        `  ${REBUILD_HINT(vintage)}`,
    );
    process.exit(1);
  }

  // Rebuild the destination each run. Staleness here is a wrong number on a
  // ministry laptop, and the operation is cheap.
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });

  const files = readdirSync(source).filter(
    // index.json is committed and imported at build time by qcraftAdapter.ts,
    // so it does not need to be fetchable.
    (name) => name.endsWith('.json') && name !== 'index.json',
  );

  if (files.length === 0) {
    console.error(`stage-data: ${source} holds no country payloads. Run:\n  ${REBUILD_HINT(vintage)}`);
    process.exit(1);
  }

  for (const name of files) {
    const from = join(source, name);
    const to = join(dest, name);
    try {
      linkSync(from, to);
      linked += 1;
    } catch {
      copyFileSync(from, to);
      copied += 1;
    }
    staged += 1;
  }

  const bytes = files.reduce((sum, name) => sum + statSync(join(source, name)).size, 0);
  console.log(
    `stage-data: ${vintage}  ${files.length} countries  ${(bytes / 1e6).toFixed(1)} MB -> public/data/${vintage}`,
  );
}

console.log(`stage-data: ${staged} files staged (${linked} linked, ${copied} copied).`);
