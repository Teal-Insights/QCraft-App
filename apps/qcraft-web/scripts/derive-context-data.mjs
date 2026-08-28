/**
 * Derive the source-data fixtures the parameter context panels draw on.
 *
 * Source: `data/vintages/<vintage>/json/{UGA,KEN,BGD}.json`, the same payloads
 * the Explorer itself fetches. They are gitignored build artifacts, so rebuild
 * them first:
 *
 *   uv run --package qcraft-pipeline qcraft-pipeline run
 *   uv run --package qcraft-pipeline python scripts/build_vintage_json.py weo-2024-10
 *
 * ── Why both vintages, added at the freeze ────────────────────────────────────
 * These fixtures used to come from ../SHARED/sample-data/, a frozen slice of
 * weo-2024-10 alone. That was the right source while the app was
 * fixture-backed and had one vintage. It is the wrong one now: a user in
 * Current mode reads WEO April 2026 numbers off every chart and then opens a
 * context panel that shows them the October 2024 record without saying so.
 *
 * The difference is not cosmetic. Uganda's working-age population at 2050 is
 * 57,115 thousand under WPP 2022 and 55,240 under WPP 2024, and that is the
 * exact number the demography panel asks the user to form a view against.
 *
 * Teal's 2026-08-27 night held-item resolution (3): rerun the derivation
 * against weo-2026-04 and scope the panel records by vintage, so Current-mode
 * panels draw Current-vintage records. The mode stamp in the panel shell stays
 * either way; it is now a label on the right record rather than a caveat on the
 * wrong one.
 *
 * Underlying sources, per SHARED/DATA-NOTES.md section 2:
 *   demography    UN World Population Prospects, population in THOUSANDS,
 *                 1 July, variants Medium/High/Low. WPP 2022 in the frozen
 *                 vintage (as bundled in the workbook), WPP 2024 in the current
 *                 one.
 *   macrofiscal   IMF World Economic Outlook: October 2024 frozen, April 2026
 *                 current, 2001-2029 in both.
 *   productivity  World Bank WDI, GDP per person employed, constant PPP $,
 *                 1991-2022. NOT vintage-scoped: the pipeline carries this
 *                 table forward unchanged, which each vintage's manifest.json
 *                 records, so two copies would assert a difference the data
 *                 does not have. The check below fails if that ever stops
 *                 being true.
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

const VINTAGE_DIR = new URL('../../../data/vintages/', import.meta.url);
const OUT_DIR = new URL('../src/context/data/', import.meta.url);

/**
 * The vintages, oldest first.
 *
 * Must agree with MODES in src/content/modes.ts, exactly as
 * scripts/stage-data.mjs must: this is a build script and cannot import a
 * TypeScript module, so the registry is mirrored here rather than read. The app
 * side has no such literal, which is what tests/engineWiring.test.ts enforces.
 */
const VINTAGES = ['weo-2024-10', 'weo-2026-04'];

const COUNTRIES = ['UGA', 'KEN', 'BGD'];
const VARIANTS = ['Low', 'Medium', 'High'];
/** The two age groups the engine reads: 15-64 drives employment, Total drives spending. */
const AGE_GROUPS = { '15-64': 'working_age', Total: 'total' };

/** The engine's own window. Earlier demography years are not projected against. */
const DEMOG_YEAR_START = 2009;
const DEMOG_YEAR_END = 2099;

mkdirSync(fileURLToPath(OUT_DIR), { recursive: true });

const load = (vintage, iso3c) => {
  const path = fileURLToPath(new URL(`${vintage}/json/${iso3c}.json`, VINTAGE_DIR));
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(
      `Cannot read ${path}. The per-country payloads are gitignored build ` +
        `artifacts; rebuild them with \`qcraft-pipeline run\` and ` +
        `\`scripts/build_vintage_json.py weo-2024-10\`.`,
      { cause: error },
    );
  }
};

/** vintage -> iso3c -> payload. */
const inputs = new Map(
  VINTAGES.map((vintage) => [
    vintage,
    new Map(COUNTRIES.map((iso3c) => [iso3c, load(vintage, iso3c)])),
  ]),
);

/** The frozen vintage, whose rows the golden-master checks pin. */
const [BASE_VINTAGE] = VINTAGES;

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
  for (const vintage of VINTAGES) {
    for (const iso3c of COUNTRIES) {
      const input = inputs.get(vintage).get(iso3c);
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
              throw new Error(
                `No ${iso3c} ${measure} ${variant} value for ${year} in ${vintage}`,
              );
            }
            rows.push([vintage, iso3c, measure, variant, year, value].join(','));
          }
        }
      }
    }
  }
  write('demography.csv', 'vintage,iso3c,measure,variant,years,value', rows);
}

// ── macrofiscal.csv ──────────────────────────────────────────────────────────
// Two columns out of twenty-four: the deflator index the inflation panel turns
// into a growth record, and the effective interest rate the rate panel anchors
// its three approaches on.
{
  const rows = [];
  for (const vintage of VINTAGES) {
    for (const iso3c of COUNTRIES) {
    for (const row of inputs.get(vintage).get(iso3c).macrofiscal) {
      if (row.gdp_deflator == null) {
        throw new Error(`No ${iso3c} deflator for ${row.years} in ${vintage}`);
      }
      rows.push(
        [
          vintage,
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
  }
  write(
    'macrofiscal.csv',
    'vintage,iso3c,years,gdp_deflator,interest_rate_percent',
    rows,
  );
}

// ── productivity.csv ─────────────────────────────────────────────────────────
// The WDI record, plus the OECD aggregate the engine measures catch-up against.
// OED is identical in all three source files; taken from the first.
{
  const forVintage = (vintage) => {
    const rows = [];
    const seen = new Set();
    for (const iso3c of COUNTRIES) {
      for (const row of inputs.get(vintage).get(iso3c).productivity) {
        const key = `${row.iso3c}|${row.years}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push([row.iso3c, row.years, row.productivity_level].join(','));
      }
    }
    rows.sort();
    return rows;
  };

  // One table, and the assertion that earns it. Each vintage's manifest.json
  // records productivity as carried forward, so the rows must be identical; if
  // a future release refreshes WDI this fails here rather than shipping a
  // silently stale panel.
  const base = forVintage(BASE_VINTAGE);
  for (const vintage of VINTAGES.slice(1)) {
    const other = forVintage(vintage);
    if (other.join('\n') !== base.join('\n')) {
      throw new Error(
        `productivity differs between ${BASE_VINTAGE} and ${vintage}. It is ` +
          `carried forward in every vintage manifest, so this file is written ` +
          `once and unscoped. Scope it by vintage before shipping this.`,
      );
    }
  }
  write('productivity.csv', 'iso3c,years,productivity_level', base);
}

// ── countries.csv ────────────────────────────────────────────────────────────
// The display names, so no component has to hard-code "Uganda".
{
  const rows = COUNTRIES.map((iso3c) =>
    [iso3c, inputs.get(BASE_VINTAGE).get(iso3c).country].join(','),
  );
  write('countries.csv', 'iso3c,name', rows);
}
