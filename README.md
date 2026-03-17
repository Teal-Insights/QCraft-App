# Q-CRAFT Explorer

**Quantitative Climate Risk Assessment Fiscal Tool**

An interactive web application that reimplements the IMF's Q-CRAFT fiscal projection model. The tool covers 197 countries with baseline fiscal projections (debt, revenue, expenditure, balances) from 2009–2099, and overlays six climate scenarios — from Paris-Aligned (1.5°C) through Hot Unadapted — to show how climate change affects sovereign debt trajectories.

![Q-CRAFT Explorer — Baseline tab for Uganda](docs/screenshots/hero.png)

**[Live demo](https://tealinsights.shinyapps.io/q-craft_explorer1/)**

## Quick start

```bash
uv sync
uv run shiny run apps/qcraft-app/app.py
```

Open http://localhost:8000 in your browser.

## Architecture

The project is a Python monorepo with two packages:

- **`packages/qcraft-engine`** — 7 pure-function engine modules (demography, productivity, inflation, baseline GDP, interest rates, fiscal, climate) that compose into a single `run_pipeline()` call. All functions take and return Polars DataFrames.
- **`apps/qcraft-app`** — Shiny for Python UI with Plotly charts. Four tabs: Baseline (summary cards + debt/revenue/balance charts), Analysis (climate scenario debt overlay), Climate (GDP trajectories), and Data.

## Data

197 countries extracted from the IMF Q-CRAFT Excel workbook via openpyxl. Stored as Parquet files in `data/processed/` (macrofiscal, demography, productivity, climate GDP loss).

## Testing

```bash
uv run pytest tests/
```

198 golden-master tests verify engine output against reference values extracted from the original Excel workbook. Type checking and linting:

```bash
uv run pyright packages/qcraft-engine/
uv run ruff check .
```

## Credits

Built for The Nature Conservancy (TNC) workshop by [Teal Insights](https://tealinsights.com). Based on the IMF Q-CRAFT methodology.
