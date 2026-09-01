# VINTAGE-TOGGLE — how the app and engine choose a data vintage

**Lane 3 / TEA-1401 · 2026-08-26**

## The layout

```
data/
  processed/                    <- what the app actually loads (the ACTIVE vintage)
    macrofiscal.parquet
    demography.parquet
    productivity.parquet
    climate.parquet
    ACTIVE_VINTAGE              <- written by `qcraft-pipeline select`
  vintages/
    weo-2024-10/                <- FROZEN. Verification vintage.
      *.parquet
      manifest.json
    weo-2026-04/                <- refreshed by the pipeline
      *.parquet
      manifest.json
      json/
        index.json
        UGA.json, KEN.json, ...  (175 files, one per selectable country)
```

`data/vintages/` is the store; `data/processed/` is the pointer.

## How selection works today

`load_parquet_data()` already takes the directory as an argument:

```python
def load_parquet_data(data_dir: Path | None = None) -> dict[str, pl.DataFrame]:
    if data_dir is None:
        _DATA_DIR = _find_project_root() / "data" / "processed"
```

So there are exactly two ways to pick a vintage, and **no engine or app code
changes were needed for either**:

**1. Programmatic — pass the directory.** Anything that imports the engine
directly (tests, scripts, notebooks, the sanity harness in this lane) selects a
vintage by path:

```python
from pathlib import Path
from qcraft_engine.data_loader import load_parquet_data, run_pipeline

data = load_parquet_data(Path("data/vintages/weo-2026-04"))
results = run_pipeline(data, "UGA")
```

**2. For the app — repoint `data/processed`.** `apps/qcraft-app/app.py` calls
`load_parquet_data()` with no argument at import time, so the app always reads
`data/processed/`. Switch it with:

```bash
uv run --package qcraft-pipeline qcraft-pipeline select weo-2026-04   # new data
uv run --package qcraft-pipeline qcraft-pipeline select weo-2024-10   # back to frozen
```

`select` copies the four Parquet files into `data/processed/` and writes an
`ACTIVE_VINTAGE` file so it is obvious which one is live. It copies rather than
symlinks because `scripts/deploy.sh` bundles `data/processed/` into
`deploy-bundle/data_processed/` for shinyapps.io, and a symlink would not
survive that.

## Oct 2024 stays the verification vintage

`weo-2024-10` is frozen and is what parity is measured against.

- `packages/qcraft-engine/tests/golden_masters/` and
  `verification-logs/golden-masters/` (147 countries, V2 parity) were produced
  against WEO Oct 2024. They are the source of truth for "does the engine still
  compute Q-CRAFT correctly", and that question is separate from "is the data
  current".
- The engine test suite does not read `data/processed/` at all — expected values
  come from CSV fixtures — so switching the active vintage cannot make the golden
  master tests pass or fail. Verified: 198/198 pass with `weo-2026-04` active.
- Therefore **do not re-baseline the golden masters against the new vintage.**
  If a parity question comes up, run against `weo-2024-10`.

The practical rule: *the engine is verified against Oct 2024, the Explorer is
demonstrated on April 2026.*

## Adding the next vintage

Everything version-specific is in `pipeline/src/qcraft_pipeline/config.py`:
`VINTAGE_ID`, the WEO dataflow id, the WPP filenames, and the year bounds. Bump
those, run `qcraft-pipeline run`, and a new directory appears under
`data/vintages/`. Older vintages are never touched.

One thing to check when the horizon moves: `MACROFISCAL_YEAR_MAX` is pinned to
2029 on purpose, because the engine's `PROJ_START` is 2030. Raising it needs an
engine change first — see `.change-requests/PIPELINE-2026-08-26.md`.

## What is and is not in git

Parquet is gitignored repo-wide, as it was before this lane. Per-country JSON
payloads are gitignored too, since they are regenerable build artifacts that
would churn on every vintage. What *is* committed, so a vintage stays reviewable:

- `data/vintages/*/manifest.json` — sources, URLs, sha256 of every raw download,
  row/country counts per dataset
- `data/vintages/*/json/index.json` — the country list

Rebuild everything else with one command. `pipeline/.cache/` holds the raw
downloads (~290 MB) and is also gitignored; a rebuild reuses it and only re-hits
the network with `--force-download`.
