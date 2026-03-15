# Q-CRAFT Explorer

A Python web application that reimplements the IMF's [Q-CRAFT](https://www.imf.org/en/Topics/climate-change/quantitative-climate-risk-assessment-fiscal-tool) (Quantitative Climate Risk Assessment Fiscal Tool) as an interactive, modern web interface.

Q-CRAFT projects how climate change affects government debt for 171+ economies through 2099, combining macroeconomic projections with climate damage estimates.

## Status

**Pre-release** — Under active development for March 2026 demo.

## Architecture

UV workspace monorepo with two packages:

- **`packages/qcraft-engine/`** — Standalone calculation engine (7 pure functions, Polars DataFrames)
- **`apps/qcraft-app/`** — Shiny for Python web interface with Plotly visualizations

## Quick Start

```bash
# Install uv (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Clone and install
git clone https://github.com/YOUR_USERNAME/qcraft-explorer.git
cd qcraft-explorer
uv sync --all-packages

# Run tests
uv run pytest packages/qcraft-engine/tests/ -v

# Run the app
uv run shiny run apps/qcraft-app/src/qcraft_app/app.py
```

## Stack

- **Python 3.12+** with UV for package management
- **Polars** for data operations (not pandas)
- **Shiny for Python** + **Plotly** for the web interface
- **pytest** + golden master testing for Excel parity verification
- **Ruff** + **Pyright** for linting and type checking

## License

MIT
