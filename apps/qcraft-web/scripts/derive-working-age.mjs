/**
 * Derive the Uganda working-age population fixture the growth widget draws on.
 *
 * Source (read-only, outside this clone):
 *   ../SHARED/sample-data/UGA.json
 *   produced by scripts/export_country_json.py, which slices the UN WPP
 *   demography.parquet extracted from the IMF Q-CRAFT Excel workbook v10.
 *   Vintage weo-2024-10, the frozen verification vintage the golden masters
 *   were computed against (SHARED/VINTAGE-TOGGLE.md).
 *
 * Why a derived fixture rather than the JSON itself: UGA.json is ~230 KB and
 * carries four unrelated slices. The widget needs one column, three variants,
 * 91 years. The output below is under 3 KB and is the only demography the
 * widget bundle carries.
 *
 * Why the three variants matter: the Medium/High/Low split is the one growth
 * input a finance ministry cannot legislate, and by 2099 the Low variant has
 * Uganda's working-age population shrinking while High still grows near 1% a
 * year. That divergence is the widget's teaching point, so it has to be real
 * UN WPP data, not a stylised offset.
 *
 * Correctness check, run at authoring time (2026-08-26): the Medium column
 * reproduces packages/qcraft-engine/tests/golden_masters/intermediate/
 * demography/uganda.csv exactly, 91 of 91 years, which is how we know the
 * sample JSON and the golden masters share a vintage.
 *
 * Regenerate:
 *   node scripts/derive-working-age.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SOURCE = fileURLToPath(
  new URL(
    '../../../../SHARED/sample-data/UGA.json',
    import.meta.url,
  ),
);
const OUT = fileURLToPath(new URL('../src/widgets/data/ugandaWorkingAge.csv', import.meta.url));

const YEAR_START = 2009;
const YEAR_END = 2099;
const VARIANTS = ['Medium', 'High', 'Low'];

const input = JSON.parse(readFileSync(SOURCE, 'utf8'));

/** Working-age (15-64) population, thousands, by variant and year. */
const byVariant = new Map(VARIANTS.map((v) => [v, new Map()]));
for (const row of input.demography) {
  if (row.age_group !== '15-64') continue;
  const bucket = byVariant.get(row.status);
  if (bucket) bucket.set(row.years, row.values);
}

const lines = ['years,Medium,High,Low'];
for (let year = YEAR_START; year <= YEAR_END; year += 1) {
  const cells = VARIANTS.map((v) => {
    const value = byVariant.get(v).get(year);
    if (value == null) throw new Error(`No ${v} working-age value for ${year}`);
    return value;
  });
  lines.push([year, ...cells].join(','));
}

writeFileSync(OUT, `${lines.join('\n')}\n`);
console.log(`Wrote ${lines.length - 1} years to ${OUT}`);
