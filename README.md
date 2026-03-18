# Q-CRAFT Explorer

**A free, open-source reimplementation of the IMF's Quantitative Climate Risk Assessment Fiscal Tool (Q-CRAFT)**

Q-CRAFT Explorer projects long-term fiscal outcomes (2009-2099) under different climate scenarios for 175 countries. It combines IMF World Economic Outlook data, UN population projections, and NGFS climate damage functions to show how warming affects sovereign debt sustainability.

This is not an official IMF product. It is an independent project by [Teal Insights](https://tealinsights.com) and [NatureFinance](https://naturefinance.net) that aims for full parity with the original Excel-based tool. This is an initial version. We welcome feedback and contributions.

![Q-CRAFT Explorer — Baseline tab for Uganda](docs/screenshots/hero.png)

**[Live App](https://tealinsights.shinyapps.io/q-craft_explorer1/)** | **[Companion Guide](https://teal-insights.github.io/QCraft-App/)** | **[Companion Guide (PDF)](https://teal-insights.github.io/QCraft-App/Q-CRAFT-Explorer-Companion-Guide.pdf)**

## Key features

- **175 countries** with WEO macroeconomic data and UN population projections
- **6 climate scenarios** from Paris-Aligned (1.5C) through Hot Unadapted, based on NGFS Phase IV damage functions
- **Interactive charts** for debt-to-GDP, revenue, expenditure, fiscal balances, and GDP trajectories
- **Adjustable parameters**: demography variant, debt target, fiscal rule, expenditure rigidity
- **Data export** for baseline and all-scenario results (CSV)
- **Verified**: 147 of 147 tested countries achieve perfect baseline parity with the original Excel tool

## Quick start

```bash
uv sync
uv run shiny run apps/qcraft-app/app.py
```

Open http://localhost:8000 in your browser.

## Architecture

The project is a Python monorepo with two main components:

- **`packages/qcraft-engine/`** — Seven pure-function engine modules (demography, productivity, inflation, baseline GDP, interest rates, fiscal, climate) that compose into a single `run_pipeline()` call. All functions take and return Polars DataFrames. Fiscal recursion uses explicit year-by-year iteration to ensure correct state dependence.

- **`apps/qcraft-app/`** — Shiny for Python UI with Plotly charts. Five tabs: Baseline (summary cards + debt/revenue/balance charts), Analysis (climate scenario comparison), Climate (GDP impact trajectories), Data (table + CSV export), and Methodology.

Data is extracted from the IMF Q-CRAFT Excel workbook and stored as Parquet files in `data/processed/`.

## Verification

147 of 147 tested countries achieve perfect baseline parity (0.0 percentage point deviation) with the original IMF Excel tool. An additional 25 parameter sensitivity combinations were tested, all passing. Climate scenario parity is confirmed for ratio metrics (debt-to-GDP, revenue, expenditure as percent of GDP) across all tested countries and scenarios.

```bash
uv run pytest tests/        # 198 golden-master tests
uv run pyright packages/qcraft-engine/
uv run ruff check .
```

Full verification results are in `verification-logs/`.

## Documentation

- **[Companion Guide](https://teal-insights.github.io/QCraft-App/)** — What Q-CRAFT computes, how to use the Explorer, how to get involved
- **[Companion Guide (PDF)](https://teal-insights.github.io/QCraft-App/Q-CRAFT-Explorer-Companion-Guide.pdf)** — For offline reading and sharing

## License

MIT

## Credits

Built by [Teal Insights](https://tealinsights.com) and [NatureFinance](https://naturefinance.net). Based on the IMF Q-CRAFT methodology (Batini et al., 2024).

We welcome feedback: [lte@tealinsights.com](mailto:lte@tealinsights.com?subject=Q-CRAFT%20Explorer%20Feedback)
