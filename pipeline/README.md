# `pipeline/` — Q-CRAFT data refresh

Refreshes the Explorer's four input tables to a new IMF WEO / UN WPP vintage and
emits both the Parquet the engine reads and per-country JSON for the web app.

## Run it

Two commands, from the repo root. The first is one-time setup, the second is the
pipeline.

```bash
# 1. Freeze the currently bundled data as the weo-2024-10 verification vintage.
#    Reads data/processed/, never writes to it.
uv run --package qcraft-pipeline qcraft-pipeline init-base

# 2. Fetch, build, validate, emit.
uv run --package qcraft-pipeline qcraft-pipeline run
```

`run` is idempotent and offline after the first pass: raw downloads are cached in
`pipeline/.cache/raw/` and reused. Two consecutive runs produce byte-identical
Parquet and JSON. Add `--force-download` to re-hit the network.

Output lands in `data/vintages/weo-2026-04/`:

```
macrofiscal.parquet  demography.parquet  productivity.parquet  climate.parquet
manifest.json        json/index.json     json/<ISO3>.json  (175 files)
```

To point the Shiny app at it: `qcraft-pipeline select weo-2026-04`
(see `VINTAGE-TOGGLE.md`).

`init-base` needs `data/processed/*.parquet` to exist. They are gitignored, so on
a fresh clone copy them in first — `DATA-NOTES.md` §1 says where they live.

## What it does

| Table | Source | Vintage |
|---|---|---|
| `macrofiscal` | IMF WEO via SDMX, 8 indicators | **April 2026** |
| `demography` | UN WPP, 1 July population by 5-year age group | **2024 revision** |
| `productivity` | carried forward | Oct 2024 |
| `climate` | carried forward | Oct 2024 |

Productivity and climate have no public April-2026 upstream — both are embedded
in the IMF Q-CRAFT workbook. Carrying them forward is also correct: the engine
only reads historical productivity levels before `weo_max_year - 6`, and
back-calculates productivity from WEO growth after that. `DATA-NOTES.md` §6.

WEO is fetched from `api.imf.org` rather than the bulk `.ashx` file because
`www.imf.org` returns 403 host-wide from this machine
(`BLOCKED-imf-bulk-download.md`).

## Layout

| File | Role |
|---|---|
| `config.py` | everything vintage-specific: URLs, indicator map, year bounds |
| `fetch.py` | cached downloads + sha256 |
| `weo.py` | SDMX long format -> macrofiscal, including all derived columns |
| `wpp.py` | WPP 5-year bands -> 15-64 / 65+ / Total by variant |
| `carry.py` | base-vintage reads, country-name continuity, dedupe |
| `validate.py` | structural checks; a failure blocks the write |
| `emit.py` | Parquet, per-country JSON, manifest |
| `cli.py` | `init-base`, `run`, `select` |

Pointing at a later WEO release should mean editing `config.py` and nothing else.

## Validation

`run` refuses to write if any check fails (override with `--allow-invalid`):

- **schema** — column names, order and dtypes identical to the frozen vintage
- **keys** — no duplicate `(iso3c, years, ...)` rows (this is what caught the
  Kosovo/Serbia collision)
- **units** — median new/base ratio on settled history (≤2019) must be near 1, so
  a missing `1e9` divisor cannot slip through
- **ranges** — year bounds, `|debt_to_gdp| ≤ 1000%`, positive nominal GDP,
  expected variants and age groups, non-negative population, `Total ≥ 15-64 + 65+`
- **coverage** — every (country, variant, age group) spans all 151 years, so the
  engine cannot KeyError on a hole

## Per-country JSON

Column-oriented, so it stays compact (~35 KB/country, 6.1 MB total) and drops
straight into a charting library:

```jsonc
{
  "iso3c": "UGA", "country": "Uganda", "vintage": "weo-2026-04",
  "macrofiscal":  { "years": [2001, ...], "real_gdp": [...], "debt_to_gdp": [...] },
  "demography":   { "years": [1950, ...],
                    "variants": { "Medium": { "15-64": [...], "65+": [...],
                                              "Total": [...] }, "High": {}, "Low": {} } },
  "productivity": { "years": [...], "productivity_level": [...] },
  "climate":      { "years": [2015, ...], "scenarios": { "Paris": [...], ... } }
}
```

Written only for the 175 countries present in all four tables — the same set
`get_country_list()` puts in the app's dropdown. No timestamp is embedded, so the
files are stable across runs and diff cleanly.
