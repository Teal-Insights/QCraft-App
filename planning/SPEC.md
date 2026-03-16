# Q-CRAFT Explorer: Technical Specification

**Version:** 2.0 (post-brainstorming revision)
**Date:** March 14, 2026
**Author:** Teal Insights
**Status:** Ready for cross-model review, then implementation

---

## 1. Executive Summary

Build a polished Python web application that reimplements the IMF's Q-CRAFT (Quantitative Climate Risk Assessment Fiscal Tool) as a demonstration of the SovTech approach. The app must achieve **calculation parity** with the existing IMF Excel tool (v10) while delivering substantially better UX, data visualization, and accessibility for policymakers.

**Strategic framing:** Q-CRAFT Explorer is an **MVP of an MVP**. It demonstrates, in a low-stakes, tractable setting, what the SovTech approach looks like for the LIC-DSF (the 86-tab, 200,000+ formula spreadsheet that governs tens of billions in lending decisions). If this works, it proves the approach scales.

**Primary audience:** IMF Fiscal Affairs Department staff (Raissi, Iossifov, Rahman) and World Bank climate finance teams — people who *built* or *use* Q-CRAFT and will evaluate this closely. Secondary audience: Ministry of Finance economists who use Q-CRAFT during C-PIMA assessments.

**Demo date:** March 18-20, 2026 (DC meetings with IMF/World Bank/TNC)
**Delivery target:** Spring Meetings, mid-April 2026

### 1.1 Design Philosophy

**Three-layer V1 pattern** (applies to every input and feature):

1. **Layer 1 (MVP): Match what the Excel does.** Same defaults, same presentation. Parity is the foundation.
2. **Layer 2 (V1 enhancement): Link to guidance at point of need.** Tooltip or question-mark icon next to each parameter linking to the relevant section of the Q-CRAFT companion guide.
3. **Layer 3 (Post-V1, informed by IMF feedback): Opinionated defaults, sensitivity previews, peer comparisons.** These are design questions for the people who built Q-CRAFT.

The companion guide IS the design improvement. Making existing IMF guidance accessible at the point of need — not inventing new defaults — is the biggest UX win for V1.

Additional design principles (see DESIGN-PRINCIPLES.md for full treatment):

- **Tidy Tools Manifesto:** Design the "pit of success" — the path of least resistance leads to a defensible analysis.
- **Don Norman:** Affordances, signifiers, constraints, mappings, feedback, conceptual models, discoverability.
- **CLI Guidelines:** Progressive disclosure — simple defaults first, complexity on demand.
- **Storytelling with Data:** Start with gray, label directly, clear titles that state findings.

### 1.2 Success Criteria

1. **Parity:** For Uganda (golden master country), the Python app produces the same fiscal projections as the IMF Excel tool (within ±0.1 pp for ratios, ±0.01% for levels).
2. **Polish:** Deployed on shinyapps.io. Looks professional — good colors, good font, polished feel. The 20% effort that delivers 80% of perceived quality.
3. **Modularity visible:** Front end and calculation engine are separate packages. This is a talking point at the demo.
4. **Feedback:** Link to Google Form for structured feedback and champion identification.
5. **Export:** CSV data tables and chart pack (PNG/SVG) for MVP. Excel workbook is post-MVP.

### 1.3 March 18 Demo Scope (Cut Line)

**In scope for March 18:**

- Uganda with golden master testing (1-2 countries verified)
- Baseline tab with cards and charts
- Analysis tab with scenario comparison
- Climate tab with GDP loss visualization
- Hero chart applying Storytelling with Data principles
- Sidebar with all inputs matching Excel defaults
- Tooltips linking to companion guide sections
- Deployed on shinyapps.io + runs locally on laptop
- CSV export, chart pack export
- Google Form link for feedback
- Professional README on GitHub

**Deferred to post-March 18:**

- Multi-country comparison tab
- World choropleth map
- Discrete risks tab (editable grid)
- Excel workbook export
- Guided tour / onboarding
- Auto-generated narrative insights
- "What If" quick-toggle mode
- Assumption provenance / session logging
- REST API

---

## 2. Technical Architecture

### 2.1 Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | [Shiny for Python](https://shiny.posit.co/py/) | Reactive programming; Posit ecosystem; dual deployment (local + shinyapps.io) |
| **Charts** | [Plotly](https://plotly.com/python/) | Interactive, publication-quality; hover tooltips; PNG/SVG export |
| **Tables** | [Great Tables](https://posit-dev.github.io/great-tables/) or `itables` | Sortable, filterable, styled |
| **Data layer** | [Polars](https://pola.rs/) | Human-readable pipelines (tidyverse philosophy applied to Python); fast; composable |
| **Numeric** | NumPy | Vectorized operations for recursive calculations |
| **Data extraction** | [openpyxl](https://openpyxl.readthedocs.io/) | Extract data directly from Excel tool |
| **Static chart export** | [kaleido](https://github.com/plotly/Kaleido) | Chart pack generation (PNG/SVG) |
| **Data format** | Parquet files (extracted from Excel via openpyxl) | Fast reads, columnar, compressed |
| **Deployment** | shinyapps.io (hosted) + local (laptop) | Dual mode: workshop access + offline demos |
| **Project management** | [UV](https://docs.astral.sh/uv/) | Fast, modern Python project/dependency management |
| **Linting** | [Ruff](https://docs.astral.sh/ruff/) | Replaces flake8/black/isort; fast |
| **Type checking** | [Pyright](https://github.com/microsoft/pyright) | Best Polars support |
| **Testing** | [pytest](https://docs.pytest.org/) | Real TDD, not mocked |
| **CI** | GitHub Actions | Lint + type check + test on every PR |
| **Visual QA** | Playwright (or equivalent) | Screenshot + AI review before UI features are declared done |

### 2.2 Fallback

If Shiny for Python cannot support tabbed navigation, reactive sidebar inputs, and conditional panel rendering within 2 hours of prototyping, switch to Panel.

### 2.3 Project Structure (UV Workspace Monorepo)

```
qcraft-explorer/
├── AGENTS.md                      # Cross-model project context (committed)
├── CLAUDE.md -> AGENTS.md         # Symlink for Claude Code
├── README.md                      # Professional README with shinyapps.io link
├── LICENSE                        # MIT
├── pyproject.toml                 # UV workspace root
├── .gitignore                     # See section 2.4
│
├── .ai-context/                   # NOT committed — brainstorming, strategy, logs
│   ├── BRAINSTORM.md
│   ├── DESIGN-PRINCIPLES.md
│   ├── SESSION-HANDOFF.md
│   ├── PROCESS-LOG.md
│   ├── WEEKEND-WORKFLOW.md
│   ├── Q-CRAFT-DEEP-DIVE.md
│   └── research/
│       ├── RESEARCH-LICDSF-INTEGRATION.md
│       ├── RESEARCH-ENGINEERING-TOOLCHAIN.md
│       └── RESEARCH-GOLDEN-MASTER-TESTING.md
│
├── packages/
│   └── qcraft-engine/             # Standalone calculation engine package
│       ├── pyproject.toml
│       ├── src/
│       │   └── qcraft_engine/
│       │       ├── __init__.py
│       │       ├── constants.py       # Colors, scenarios, defaults
│       │       ├── data_loader.py     # Load Parquet files, derive constants
│       │       ├── demography.py      # demography_country()
│       │       ├── productivity.py    # productivity_country()
│       │       ├── inflation.py       # inflation_country()
│       │       ├── baseline.py        # baseline_v1()
│       │       ├── interest_rate.py   # interest_rate_country()
│       │       ├── fiscal.py          # baseline_country()
│       │       └── climate.py         # calc_climate_scenario()
│       └── tests/
│           ├── conftest.py
│           ├── test_demography.py
│           ├── test_productivity.py
│           ├── test_inflation.py
│           ├── test_baseline.py
│           ├── test_fiscal.py
│           ├── test_climate.py
│           └── test_parity.py         # Golden master: Excel vs Python
│
├── apps/
│   └── qcraft-app/                # Shiny for Python front end
│       ├── pyproject.toml         # Depends on qcraft-engine
│       ├── app.py                 # Main entry point
│       └── src/
│           └── qcraft_app/
│               ├── __init__.py
│               ├── theme.py           # Colors, fonts, Plotly theme, CSS
│               ├── components.py      # Value boxes, cards, chart cards
│               ├── sidebar.py         # Input sidebar
│               ├── tabs/
│               │   ├── __init__.py
│               │   ├── baseline.py
│               │   ├── analysis.py
│               │   ├── climate.py
│               │   ├── data.py
│               │   └── methodology.py
│               └── charts/
│                   ├── __init__.py
│                   ├── plotly_theme.py
│                   ├── scenario_charts.py
│                   ├── baseline_charts.py
│                   └── climate_charts.py
│
├── data/
│   ├── raw/                       # Excel tool (gitignored — large/proprietary)
│   │   └── qcraft-toolv10.xlsx
│   └── processed/                 # Parquet files (committed — small, needed for app)
│       ├── macrofiscal.parquet
│       ├── productivity.parquet
│       ├── demography.parquet
│       └── climate.parquet
│
├── scripts/
│   └── extract_excel_data.py      # openpyxl extraction → Parquet
│
├── tests/
│   └── golden_masters/            # Expected outputs from Excel (committed)
│       └── uganda/
│           ├── baseline.csv
│           └── scenarios.csv
│
└── www/                           # Static assets for Shiny app
    ├── styles.css
    └── favicon.png
```

### 2.4 .gitignore

```gitignore
# Sensitive planning context (brainstorming, personal comments, strategy)
.ai-context/

# SpecFlow / session logs
.specstory/

# Raw data (large/proprietary)
data/raw/

# Python
__pycache__/
*.pyc
.venv/
.uv/

# IDE
.vscode/
.idea/

# OS
.DS_Store

# Deployment
*.env
```

---

## 3. Data Pipeline

### 3.1 Source Data

All data is extracted directly from the IMF Excel tool v10 (`qcraft-toolv10.xlsx`) using openpyxl. No RDS files, no R dependencies.

| Dataset | Source Sheet | Key Columns | Notes |
|---------|-------------|-------------|-------|
| **Macrofiscal** | "Macrofiscal" (skip 65 rows) | iso3c, country, years, real_gdp, nominal_gdp, revenue, debt, ... | IMF WEO April 2024; 171 countries × ~28 years |
| **Productivity** | "Productivity" | iso3c, years, productivity_level, productivity_growth | World Bank WDI; GDP per employed person |
| **Demography** | "Demography" | iso3c, years, age_group, status, values | UN WPP 2022; ~171 × ~90 years × 3 variants × 4 groups |
| **Climate** | "Climate Database" (skip 24 rows) | iso3c, climate_scenario, years, values (% GDP loss) | FADCP (Massetti & Tagklis 2023); 171 × 6 scenarios × ~85 years |

### 3.2 Extraction Script

```python
# scripts/extract_excel_data.py
# Reads directly from qcraft-toolv10.xlsx via openpyxl, writes Parquet via Polars
# No R dependencies. Extracts exactly the same data the Excel tool uses.
```

### 3.3 Derived Constants (computed at app startup)

```python
WEO_MAX_YEAR: int           # max(macrofiscal.years) → 2028
PICK_COUNTRY: list[str]     # sorted unique country names
PICK_PROJECTION_YEARS: list[int]  # demography years > WEO_MAX_YEAR
YEAR_START = 2009
YEAR_END = 2100
PROJ_START = 2031
```

---

## 4. Calculation Engine — Complete Specification

The engine consists of 7 pure functions with no side effects. Each takes data + parameters, returns a Polars DataFrame. All functions live in the `qcraft-engine` package and are independently testable.

### 4.1 Demography (`demography_country`)

**Inputs:** `iso3c: str`, `level: str` ("Medium" | "High" | "Low")

**Logic:**
1. Filter `DEMOGRAPHY` data for country, selected variant, years ≥ 2009
2. Extract age groups: "15-64" (working age), "Total", "0-14", "65+"
3. Pivot to columns: `working_age_population`, `total_population`
4. Compute growth rates: `demography_growth_working_age`, `demography_growth_total`
5. Compute shares: `working_age_share = working_age / total * 100`
6. Compute dependency ratios

**Returns:** DataFrame with columns: `iso3c, country, years, working_age_population, total_population, demography_growth_working_age, demography_growth_total, demography_level_*`

### 4.2 Productivity (`productivity_country`)

**Inputs:** `iso3c: str`, `productivity_start: float` (default 5.0), `productivity_end: float` (default 1.2)

**Logic:**
1. Get historical productivity data from WDI (GDP per employed person)
2. Compute historical growth rate
3. Extend through WEO horizon using `productivity_start` rate
4. Beyond WEO horizon: **logistic convergence function**

```
For each year t beyond WEO max year:
    counter = t - WEO_MAX_YEAR  (1-indexed)
    rate = 0.5
    turning_point = 15
    growth(t) = start + (end - start) × ((1 / (1 + exp(-rate × (counter - turning_point))))^rate)
```

5. Compute cumulative productivity level
6. Compute productivity relative to OECD (OECD grows at 1.1% historical average)

**Returns:** DataFrame with columns: `years, productivity_growth_rate_percent, productivity_level, productivity_level_oecd_percent`

**GOTCHA:** This is logistic convergence, not linear. Getting this wrong produces visibly different long-run trajectories. Test explicitly.

### 4.3 Inflation (`inflation_country`)

**Inputs:** `iso3c: str`, `start: float`, `end: float`, `rate: float` (fixed 0.5), `turning_point: int` (fixed 5)

**Logic:**
1. Get historical inflation (GDP deflator growth %) from macrofiscal data
2. Beyond WEO max year: same **logistic convergence** as productivity

**Returns:** DataFrame with columns: `iso3c, country, years, inflation`

### 4.4 Baseline V1 (`baseline_v1`)

**Inputs:** `data_inflation: DataFrame`, `data_demography: DataFrame`, `iso3c: str`, `level: str`, `productivity_start: float`, `productivity_end: float`

**Logic — Phase 1: Employment Growth**
1. During WEO period (years ≤ WEO_MAX_YEAR):
   - `employment_growth = (real_gdp_growth/100 - productivity_growth/100) / (1 + productivity_growth/100) × 100`
2. Beyond WEO horizon:
   - `employment_growth = (working_age_pop(t) / working_age_pop(t-1)) × 100 - 100`

**Logic — Phase 2: Recalculate productivity during WEO overlap**
- For years in range `[WEO_MAX_YEAR - 6, WEO_MAX_YEAR]`:
   - `productivity = (real_gdp_growth/100 - employment_growth/100) / (1 + employment_growth/100) × 100`

**Logic — Phase 3: Recursive GDP Computation (beyond WEO)**
```
For each year t > WEO_MAX_YEAR:
    real_gdp(t) = real_gdp(t-1) × (1 + employment_growth(t)/100) × (1 + productivity_growth(t)/100)
    real_gdp_growth(t) = (real_gdp(t) / real_gdp(t-1)) × 100 - 100
    gdp_deflator_growth(t) = inflation(t)
    nominal_gdp(t) = nominal_gdp(t-1) × (1 + real_gdp_growth(t)/100) × (1 + gdp_deflator_growth(t)/100)
    nominal_gdp_growth(t) = (nominal_gdp(t) / nominal_gdp(t-1)) × 100 - 100
```

**Returns:** DataFrame with: `iso3c, country, years, working_age_population, employment_growth, labour_productivity_growth, gdp_deflator_growth_percent, real_gdp, real_gdp_growth_percent, nominal_gdp, nominal_gdp_growth_percent, population_growth`

### 4.5 Interest Rate (`interest_rate_country`)

**Inputs:** `df_baseline_v1: DataFrame`, `iso3c: str`, `select_rate: str`, `long_run_interest_rate: float`

**Logic:**

Get base values from last WEO year:
- `base_nominal_rate = macrofiscal[WEO_MAX_YEAR].interest_rate_percent`
- `base_igd = macrofiscal[WEO_MAX_YEAR].interest_growth_differential`

For projection years, compute nominal interest rate depending on `select_rate`:

**Option 1: "Nominal interest rate"** — `nominal_rate(t) = base_nominal_rate` (constant)

**Option 2: "Interest-growth differential"** — `nominal_rate(t) = (1 + nominal_gdp_growth(t-1)/100) × (1 + base_igd/100) × 100 - 100`
Note: uses GDP growth from the **previous** year (shifted +1).

**Option 3: "Real interest rate"** — `nominal_rate(t) = (1 + long_run_interest_rate/100) × (1 + inflation(t-1)/100) × 100 - 100`

Derived columns:
```
real_rate(t) = (nominal_rate(t)/100 - inflation(t)/100) / (1 + inflation(t)/100) × 100
igd(t) = (nominal_rate(t)/100 - gdp_growth(t)/100) / (1 + gdp_growth(t)/100) × 100
```

**Returns:** DataFrame with: `iso3c, country, years, nominal_interest_rate, inflation, nominal_gdp_growth_percent, real_interest_rate, interest_growth_differential`

### 4.6 Baseline Country (`baseline_country`)

**Inputs:** `data_baseline: DataFrame` (from baseline_v1), `data_interest: DataFrame`, `data_macrofiscal: DataFrame`, `debt_target: float`, `fiscal_rule: str` ("Yes"|"No"), `iso3c: str`

**Logic — Recursive fiscal computation beyond WEO:**

```
For each year t > WEO_MAX_YEAR:

    # 1. Revenue (grows with nominal GDP → constant revenue-to-GDP ratio)
    revenue(t) = revenue(t-1) × (1 + nominal_gdp_growth(t)/100)

    # 2. Primary Expenditure
    primary_expenditure(t) = primary_expenditure(t-1)
        × (1 + productivity_growth(t)/100)
        × (1 + inflation(t)/100)
        × (1 + total_population_growth(t)/100)
        + fiscal_rule_value(t-1)

    # 3. Primary Balance
    primary_balance(t) = revenue(t) - primary_expenditure(t)

    # 4. Debt Dynamics (THE CORE EQUATION)
    debt_to_gdp(t) = max(0,
        debt_to_gdp(t-1) × (1 + interest_rate(t)/100) / (1 + nominal_gdp_growth(t)/100)
        - primary_balance_percent_gdp(t)
    )

    # 5. Interest Expenditure
    interest_expenditure(t) = debt(t-1) × (interest_rate(t)/100)

    # 6. Total Expenditure and Overall Balance
    total_expenditure(t) = primary_expenditure(t) + interest_expenditure(t)
    overall_balance(t) = revenue(t) - total_expenditure(t)

    # 7. Debt-Stabilizing Primary Balance
    dspb(t) = debt_to_gdp(t-1) × (interest_rate(t) - nominal_gdp_growth(t))/100
              / (1 + nominal_gdp_growth(t)/100)

    # 8. Fiscal Rule
    fiscal_gap(t) = (primary_balance_percent_gdp(t) - dspb(t))/100 × nominal_gdp(t)
    debt_trajectory = 1 if debt_to_gdp(t) > debt_to_gdp(t-1) else 2
    if fiscal_rule == "No": fiscal_rule_value(t) = 0
    elif rising and above target: fiscal_rule_value(t) = fiscal_gap(t)
    elif falling and below target: fiscal_rule_value(t) = fiscal_gap(t)
    else: fiscal_rule_value(t) = 0
```

**GOTCHA:** The fiscal rule creates a feedback loop. Expenditure rigidity=1.0 is the "sticky" case (worst for fiscal balances). Test both endpoints explicitly.

**Returns:** Full DataFrame with all baseline fiscal indicators, years 2009-2100.

### 4.7 Climate Scenario (`calc_climate_scenario`)

**Inputs:** `data_baseline: DataFrame`, `iso3c: str`, `expenditure_rigidity: float` (0-1), `scenario_name: str`, `data_risk: DataFrame | None`

**Logic — Three-phase computation:**

**Phase 1: Adjust productivity and recompute GDP**
```
For each year t > WEO_MAX_YEAR:
    climate_variation(t) = year-over-year change in GDP index from FADCP
    productivity_growth(t) = baseline_productivity_growth(t) + climate_variation(t)
    real_gdp_growth(t) = (1 + employment_growth(t)/100) × (1 + productivity_growth(t)/100) × 100 - 100
    nominal_gdp(t) = nominal_gdp(t-1) × (1 + nominal_gdp_growth(t)/100)
```

**Phase 2: Expenditure recalibration**
```
    primary_exp_with_baseline_pct = baseline_primary_exp_percent × scenario_nominal_gdp / 100
    recalibration = baseline_primary_expenditure - primary_exp_with_baseline_pct
```

**Phase 3: Full fiscal recalculation**
```
    primary_expenditure(t) = baseline_primary_expenditure(t)
        - (1 - expenditure_rigidity) × recalibration(t)
    debt_to_gdp(t) = debt_to_gdp(t-1) × (1+r(t)/100) / (1+g(t)/100) - pb(t)
```

**Expenditure rigidity:**
- `1.0`: Expenditure stays at baseline level. As GDP falls, expenditure-to-GDP rises. Worst case.
- `0.0`: Expenditure adjusts immediately. Expenditure-to-GDP ratio stays at baseline ratio.

---

## 5. User Interface Specification

### 5.1 Navigation Structure (March 18 Scope)

| Tab | Purpose | March 18? |
|-----|---------|-----------|
| **Baseline** | Baseline scenario results (cards + charts + table) | Yes |
| **Analysis** | Cross-scenario comparison (hero chart + all scenarios) | Yes |
| **Climate** | Climate impact visualization (GDP loss, index, variation) | Yes |
| **Data** | Browse/download data tables | Yes |
| **Methodology** | Technical documentation + link to companion guide | Yes |
| Comparison | Multi-country comparison + map | Post-demo |
| Discrete Risks | Revenue/expenditure shock grids | Post-demo |

### 5.2 Visual Design

**Professional polish is a hard requirement.** The app must not look like a prototype. Key design targets:

- Clean sans-serif font (Inter or system-ui)
- Navy/teal color palette with warm accents
- Consistent card components with subtle shadows
- Ample whitespace, not cramped
- Charts with Storytelling with Data principles (gray first, highlight what matters, direct labels)

**Visual QA workflow:** Before any UI feature is declared done, use Playwright (or equivalent) to:
1. Screenshot the feature in the browser
2. AI reviews for: alignment, spacing, color consistency, readability
3. AI reviews output values against known Q-CRAFT results for sanity

### 5.3 Color Palette

```python
COLORS = {
    # Primary brand
    "navy": "#1A237E",
    "navy_light": "#3949AB",
    "teal": "#00897B",
    "teal_light": "#26A69A",
    "coral": "#E53935",
    "amber": "#FF8F00",

    # Neutrals
    "white": "#FFFFFF",
    "slate_50": "#F8F9FA",
    "slate_800": "#212529",

    # Scenario colors
    "Baseline": "#4E79A7",
    "Paris": "#59A14F",
    "Moderate": "#F28E2B",
    "High": "#E15759",
    "Hot": "#B07AA1",
    "Hot Adapted": "#76B7B2",
    "Hot Unadapted": "#FF9DA7",
}
```

### 5.4 Sidebar Inputs

All inputs match Excel defaults exactly (Layer 1). Each has a tooltip linking to the companion guide (Layer 2).

| Input | Type | Default | Range | Tooltip links to |
|-------|------|---------|-------|-----------------|
| Country | Searchable select | — | 171 countries | Guide: country selection |
| Demography | Radio | Medium | Medium/High/Low | Guide: population variants |
| Projection Ends | Slider | 2100 | 2031-2100 | Guide: time horizon |
| Fiscal Rule | Toggle | Yes | Yes/No | Guide: fiscal rules |
| Debt Target | Numeric | 60 | 0-300 | Guide: debt targets |
| Productivity Start | Numeric | 5.0 | -5 to 20 | Guide: productivity calibration |
| Productivity End | Numeric | 1.2 | -5 to 20 | Guide: long-run convergence |
| Inflation Start | Numeric | 3.5 | -5 to 30 | Guide: inflation calibration |
| Inflation End | Numeric | 3.5 | -5 to 30 | Guide: inflation targets |
| Interest Rate Type | Select | "Nominal" | 3 options | Guide: interest rate approaches |
| Interest Rate Value | Numeric | 1.0 | -10 to 30 | Guide: rate calibration |
| Expenditure Rigidity | Slider | 1.0 | 0.0-1.0 | Guide: expenditure rigidity |

**Expenditure rigidity slider labels (plain language):**
- Left end (0.0): "Spending adjusts fully with growth"
- Right end (1.0): "Spending stays constant regardless of growth"

**Reset button:** Returns all parameters to defaults.

### 5.5 Baseline Tab

**Row 1:** 12 year-comparison cards (4 columns × 3 rows)
- Each card: indicator name, value at WEO_MAX_YEAR, value at projection end
- Footer: colored bar (green = improvement, red = deterioration)

**Row 2-4:** 6 charts (2 columns × 3 rows)
1. Nominal GDP Growth Decomposition
2. Revenue & Primary Expenditure % NGDP
3. Budget Balance % NGDP
4. Interest Expenditure % NGDP + Interest Rate
5. Interest Expenditure to Revenue %
6. Debt-to-GDP %

**Row 5:** Indicator comparison table with year range slider

### 5.6 Analysis Tab (Hero Chart Lives Here)

**Hero chart:** Debt-to-GDP trajectories, all scenarios overlaid. Applies SWD principles:
- Start with gray lines for non-focal scenarios
- Highlight the selected/focal scenario in bold color
- Fiscal rule as dashed overlay line
- Direct labels on lines (no separate legend)
- Title states the finding, not just the variable name
- Maximum 3 scenarios highlighted at once

**Below hero chart:** 6 smaller charts showing all 7 scenarios for each fiscal indicator.

**Scenario comparison table** with year range slider.

### 5.7 Climate Tab

**2×2 grid:**
1. % Level GDP Loss (all 6 scenarios)
2. GDP Index (base = 100)
3. Variation on LP Growth (year-over-year)
4. Documentation card (explains charts, cites Kahn et al. 2021)

### 5.8 Data Tab

**Controls:** Display (Baseline/Climate), Layout (Wide/Long), Download button (CSV).

### 5.9 Methodology Tab

Static content with embedded link to companion guide (Quarto book). Includes mathematical reference card and links to source papers.

### 5.10 Feedback

**Not an in-app tab.** A prominent "Give Feedback" button in the header links to a Google Form.

Google Form captures:
- Name (optional)
- Organization
- Role
- "How useful would this tool be for your work?" (1-5)
- "What would you change or add?" (text)
- "Would you be willing to do a 30-minute design session with us?" (yes/no + email)

Goal: identify champions for deeper engagement.

---

## 6. Chart Specification

### 6.1 Plotly Theme

```python
PLOTLY_THEME = {
    "font_family": "Inter, system-ui, sans-serif",
    "font_size": 12,
    "font_color": "#495057",
    "plot_bgcolor": "#FFFFFF",
    "paper_bgcolor": "#FFFFFF",
    "xaxis": {"gridcolor": "#E9ECEF", "showgrid": True, "zeroline": False},
    "yaxis": {"gridcolor": "#E9ECEF", "showgrid": True, "zeroline": True, "zerolinecolor": "#ADB5BD"},
    "legend": {"orientation": "h", "yanchor": "bottom", "y": 1.02, "xanchor": "center", "x": 0.5},
    "hovermode": "x unified",
    "modebar_remove": ["lasso2d", "select2d"],
}
```

### 6.2 Interactive Features

All charts support: hover tooltips, legend toggle, data zoom (range slider), save as PNG/SVG.

---

## 7. Export Specification

### 7.1 MVP: CSV + Chart Pack

**CSV:** Download baseline and scenario data as clean CSV files.

**Chart pack:** ZIP of PNGs containing all rendered charts, generated via Plotly's kaleido.

### 7.2 Post-MVP: Excel Workbook

Styled .xlsx with sheets: Summary, Baseline, Scenarios, Climate Data, Parameters. Header row with navy background, alternating row colors, number formatting.

---

## 8. Parity Testing

### 8.1 Strategy

Golden master testing: extract known outputs from the Excel tool, compare against Python engine outputs.

### 8.2 Golden Master Country: Uganda

Uganda is the flagship C-PIMA case study. The approach:
1. Extract the input parameters used in the Uganda C-PIMA (documented in annex)
2. Run those same parameters through the Excel tool, capture outputs at key years
3. Run the same inputs through the Python engine
4. Compare: 6 indicators × 7 scenarios at key years (2030, 2050, 2070, 2099)

**Pass criterion:** ±0.1 pp for ratios, ±0.01% for levels.

**March 18 target:** ~100 assertions (12 indicators × 7 scenarios × 1 year, plus spot checks).

### 8.3 Known Gotchas (from golden master research)

1. **Logistic convergence, not linear.** Productivity and inflation use a logistic function, not a linear interpolation.
2. **Expenditure rigidity=1.0 is the "sticky" case.** Easy to reverse the semantics.
3. **Fiscal rule feedback loop.** Tests must run the full recursive calculation, not just one year.
4. **Debt floor at 0.** The R code uses a quirky if_else; Python should use max(0, ...).
5. **Interest rate shift.** IGD mode uses previous year's GDP growth (t-1), not current year.
6. **WEO overlap recalculation.** Productivity is back-calculated during the WEO-to-projection overlap years.
7. **Revenue constant ratio.** Revenue grows with nominal GDP (constant revenue-to-GDP ratio), not constant level.

### 8.4 Edge Case Countries (post-March 18)

- Countries with negative real interest rates
- Countries where fiscal rule triggers trajectory switch
- Countries with debt > 100% GDP
- Countries with declining working-age population
- A SIDS (Fiji or Jamaica)

---

## 9. Deployment

### 9.1 shinyapps.io (Primary for March Demo)

Deploy via rsconnect-python or Posit CLI. Teal Insights has a subscription.

### 9.2 Local Mode

`uv run shiny run apps/qcraft-app/app.py` — runs on laptop without WiFi.

### 9.3 Docker (Post-MVP)

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install uv && uv sync
EXPOSE 8080
CMD ["uv", "run", "shiny", "run", "apps/qcraft-app/app.py", "--host", "0.0.0.0", "--port", "8080"]
```

---

## 10. Engineering Practices

### 10.1 The "Vibe Engineering, Not Vibe Coding" Standard

The codebase must visibly demonstrate engineering best practices. The demo audience includes people with software sophistication who will judge whether this is serious work.

- **UV** for dependency management (lockfile, reproducible builds)
- **Ruff** for linting and formatting
- **Pyright** for type checking (best Polars support)
- **Real TDD:** Tests written before implementation. Not mocked. Not hard-coded expected values.
- **Trunk-based development:** GitHub issue per unit of work, feature branch, PR to merge
- **CI pipeline:** GitHub Actions runs lint + type check + test on every PR
- **RoboRev** (backlog): Adversarial code review using multiple AI models

### 10.2 AI Coding Failure Modes to Police

1. Mocked tests that don't test anything
2. Defensive over-engineering (unnecessary abstraction layers)
3. Not actually doing TDD (tests fitted to implementation)
4. Silent type errors
5. Brittle string formatting (hard-coded country names)
6. Copy-paste patterns instead of shared functions

### 10.3 Visual QA Loop

For every UI change:
1. Playwright screenshots the app
2. AI reviews aesthetics (spacing, alignment, color, typography)
3. AI reviews output sanity (do numbers look reasonable for the country?)
4. Only then is the feature declared done

---

## 11. Implementation Plan

### Phase 1: Foundation (Session 1)
- UV workspace setup (root + qcraft-engine + qcraft-app)
- Extract data from Excel → Parquet via openpyxl
- Constants module
- Data loader
- CI pipeline (GitHub Actions: ruff + pyright + pytest)

### Phase 2: Engine (Sessions 2-3)
- All 7 engine functions with TDD
- Uganda golden master extraction and parity tests
- ~100 assertions passing

### Phase 3: UI Shell (Session 4)
- Shiny app scaffold with sidebar and navigation
- Baseline tab (cards + charts)
- Visual QA loop established (Playwright + AI review)

### Phase 4: Full Demo (Session 5)
- Analysis tab with hero chart (SWD principles)
- Climate tab
- Data tab with CSV export
- Chart pack export
- Methodology tab
- Google Form link
- Deploy to shinyapps.io

### Phase 5: Polish (Session 6)
- Tooltips linked to companion guide sections
- Country context card in sidebar
- README for GitHub
- Final parity validation
- Visual QA pass on all tabs

---

## 12. Mathematical Reference Card

### Production Function
```
Y(t) = A(t) × L(t)
N(t) = Y(t) × P(t)
```

### Debt Dynamics
```
d(t) = d(t-1) × (1+i)/(1+g) - pb(t)
```

### Debt-Stabilizing Primary Balance
```
dspb(t) = d(t-1) × (i(t) - g(t)) / (1 + g(t))
```

### Logistic Convergence
```
f(t) = start + (end - start) × (1 / (1 + exp(-rate × (t - turning_point))))^rate
```
Productivity: rate=0.5, turning_point=15. Inflation: rate=0.5, turning_point=5.

### Climate Impact Channel
```
productivity_growth_scenario(t) = productivity_growth_baseline(t) + climate_variation(t)
```

### Expenditure Rigidity
```
primary_exp_scenario(t) = baseline_primary_exp(t) - (1 - rigidity) × recalibration(t)
```

---

## 13. Key Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Shiny for Python too immature | Medium | High | Prototype early; fall back to Panel |
| Calculation parity fails | Low | Critical | Golden master tests; systematic port |
| March 18 timeline too aggressive | High | Medium | Scope cut defined above; engine parity + 3 tabs is minimum viable demo |
| shinyapps.io deployment issues | Low | Medium | Local mode always works as backup |
| Demo WiFi issues | Medium | Medium | App runs fully offline on laptop |

---

## 14. References

1. Kahn, M.E., Mohaddes, K., Ng, R.N.C., Pesaran, M.H., Raissi, M., & Yang, J.-C. (2021). Long-term macroeconomic effects of climate change. *Energy Economics*, 104, 105624.
2. Centorrino, S., Massetti, E., & Tagklis, F. (2024). Climate Effects on GDP Growth: Updated Estimates. *IMF Reference Guide*.
3. Tim, T. & Rahman, J. (2024). Q-CRAFT User Guide, Version 1.0. IMF FAD.
4. IMF (2024). World Economic Outlook Database, April 2024.
5. United Nations (2022). World Population Prospects 2022.

---

*This specification incorporates all decisions from 6 rounds of structured brainstorming (see .ai-context/BRAINSTORM.md). It is designed to be implementation-ready for Claude Code, Codex, or Gemini, using AGENTS.md for cross-model context.*
