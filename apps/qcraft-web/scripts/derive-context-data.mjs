/**
 * Derive the source-data fixtures the parameter context panels draw on.
 *
 * Source (read-only, outside this clone):
 *   ../SHARED/sample-data/{UGA,KEN,BGD}.json
 *   produced by scripts/export_country_json.py, which slices the four Parquet
 *   files extracted from the IMF FAD Q-CRAFT Excel workbook v10. Vintage
 *   weo-2024-10, the frozen verification vintage the golden masters were
 *   computed against (SHARED/VINTAGE-TOGGLE.md).
 *
 * Underlying sources, per SHARED/DATA-NOTES.md section 2:
 *   demography    UN World Population Prospects (workbook records WPP 2022),
 *                 population in THOUSANDS, 1 July, variants Medium/High/Low
 *   macrofiscal   IMF World Economic Outlook, October 2024, 2001-2029
 *   productivity  World Bank WDI, GDP per person employed, constant PPP $,
 *                 1991-2022
 *
 * Why derived fixtures rather than the JSON itself: the three country files are
 * ~0.7 MB together and carry four slices each, most of which the panels never
 * touch. The three CSVs below are under 60 KB together and are the only source
 * data the Explorer bundle carries.
 *
 * Why these three countries: UGA is the country the golden-master fixtures
 * cover, and KEN and BGD are the two the engine lane published alongside it.
 * They also happen to be a good demographic contrast, which is what the
 * demography panel needs: Uganda's working-age population still grows past
 * 2 percent a year at 2050, Kenya's is near 1.5, and Bangladesh's has already
 * turned negative under the Medium variant.
 *
 * Correctness checks, run at authoring time (2026-08-26) and pinned in
 * tests/context.model.test.ts:
 *   - Medium-variant working-age growth derived from demography.csv reproduces
 *     packages/qcraft-engine/tests/golden_masters/intermediate/demography/
 *     uganda.csv for all 90 growth years.
 *   - macrofiscal.csv interest_rate_percent at 2029 reproduces the anchor the
 *     interest-rate golden master projects from.
 *
 * Regenerate:
 *   node scripts/derive-context-data.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SOURCE_DIR = new URL('../../../../SHARED/sample-data/', import.meta.url);
const OUT_DIR = new URL('../src/context/data/', import.meta.url);

const COUNTRIES = ['UGA', 'KEN', 'BGD'];
const VARIANTS = ['Low', 'Medium', 'High'];
/** The two age groups the engine reads: 15-64 drives employment, Total drives spending. */
const AGE_GROUPS = { '15-64': 'working_age', Total: 'total' };

/** The engine's own window. Earlier demography years are not projected against. */
const DEMOG_YEAR_START = 2009;
const DEMOG_YEAR_END = 2099;

mkdirSync(fileURLToPath(OUT_DIR), { recursive: true });

const load = (iso3c) =>
  JSON.parse(readFileSync(fileURLToPath(new URL(`${iso3c}.json`, SOURCE_DIR)), 'utf8'));

const inputs = new Map(COUNTRIES.map((iso3c) => [iso3c, load(iso3c)]));

const write = (name, header, rows) => {
  const path = fileURLToPath(new URL(name, OUT_DIR));
  writeFileSync(path, `${[header, ...rows].join('\n')}\n`);
  console.log(`Wrote ${rows.length} rows to ${name}`);
};

// ── demography.csv ───────────────────────────────────────────────────────────
// Long format: one row per country, measure, variant and year. Levels rather
// than growth rates, because the panel derives growth the same way
// demography_country() does and a stored growth column would be a second
// implementation of that arithmetic.
{
  const rows = [];
  for (const iso3c of COUNTRIES) {
    const input = inputs.get(iso3c);
    const byKey = new Map();
    for (const row of input.demography) {
      const measure = AGE_GROUPS[row.age_group];
      if (!measure) continue;
      byKey.set(`${measure}|${row.status}|${row.years}`, row.values);
    }
    for (const measure of Object.values(AGE_GROUPS)) {
      for (const variant of VARIANTS) {
        for (let year = DEMOG_YEAR_START; year <= DEMOG_YEAR_END; year += 1) {
          const value = byKey.get(`${measure}|${variant}|${year}`);
          if (value == null) {
            throw new Error(`No ${iso3c} ${measure} ${variant} value for ${year}`);
          }
          rows.push([iso3c, measure, variant, year, value].join(','));
        }
      }
    }
  }
  write('demography.csv', 'iso3c,measure,variant,years,value', rows);
}

// ── macrofiscal.csv ──────────────────────────────────────────────────────────
// Two columns out of twenty-four: the deflator index the inflation panel turns
// into a growth record, and the effective interest rate the rate panel anchors
// its three approaches on.
{
  const rows = [];
  for (const iso3c of COUNTRIES) {
    for (const row of inputs.get(iso3c).macrofiscal) {
      if (row.gdp_deflator == null) {
        throw new Error(`No ${iso3c} deflator for ${row.years}`);
      }
      rows.push(
        [
          iso3c,
          row.years,
          row.gdp_deflator,
          // Nulls are real: Bangladesh has no debt figure for the first two
          // years, so the derived rate is undefined there. Written empty and
          // skipped by the reader rather than zero-filled, which would draw a
          // line through a year that has no observation.
          row.interest_rate_percent == null ? '' : row.interest_rate_percent,
        ].join(','),
      );
    }
  }
  write('macrofiscal.csv', 'iso3c,years,gdp_deflator,interest_rate_percent', rows);
}

// ── productivity.csv ─────────────────────────────────────────────────────────
// The WDI record, plus the OECD aggregate the engine measures catch-up against.
// OED is identical in all three source files; taken from the first.
{
  const rows = [];
  const seen = new Set();
  for (const iso3c of COUNTRIES) {
    for (const row of inputs.get(iso3c).productivity) {
      const key = `${row.iso3c}|${row.years}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push([row.iso3c, row.years, row.productivity_level].join(','));
    }
  }
  rows.sort();
  write('productivity.csv', 'iso3c,years,productivity_level', rows);
}

// ── countries.csv ────────────────────────────────────────────────────────────
// The display names, so no component has to hard-code "Uganda".
{
  const rows = COUNTRIES.map((iso3c) => [iso3c, inputs.get(iso3c).country].join(','));
  write('countries.csv', 'iso3c,name', rows);
}
