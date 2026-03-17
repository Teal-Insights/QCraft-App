"""Q-CRAFT Explorer — Shiny for Python entry point."""

import io
from pathlib import Path

import plotly.graph_objects as go
import polars as pl
from qcraft_app.plotly_theme import (
    NAVY,
    add_weo_boundary,
    add_zero_line,
    make_line_chart,
)
from qcraft_engine.constants import (
    CLIMATE_SCENARIOS,
    COLORS,
    DEFAULTS,
    SCENARIO_LABELS,
)
from qcraft_engine.data_loader import (
    get_country_list,
    load_parquet_data,
    run_pipeline,
)
from shiny import App, Inputs, Outputs, Session, reactive, render, ui
from shinywidgets import output_widget, render_plotly

# ── Load data at startup ──────────────────────────────────────────────────────

DATA = load_parquet_data()
COUNTRIES = get_country_list(DATA)
COUNTRY_CHOICES = {c["iso3c"]: c["country"] for c in COUNTRIES}

WWW_DIR = Path(__file__).parent / "www"

# ── UI ────────────────────────────────────────────────────────────────────────

app_ui = ui.page_sidebar(
    ui.sidebar(
        ui.div(
            ui.h4("Q-CRAFT Explorer"),
            ui.p(
                "Quantitative Climate Risk Assessment Fiscal Tool",
                class_="subtitle",
            ),
            class_="app-header",
        ),
        ui.hr(),
        ui.input_select(
            "country",
            "Country",
            choices=COUNTRY_CHOICES,
            selected=DEFAULTS["iso3c"],
        ),
        # Country context card
        ui.output_ui("country_context"),
        ui.input_select(
            "demography_variant",
            "Demography variant",
            choices=["Medium", "High", "Low"],
            selected=DEFAULTS["demography_variant"],
        ),
        ui.p(
            "UN population projection. Medium = central estimate.",
            class_="param-help",
        ),
        ui.input_numeric(
            "debt_target",
            "Debt target (% GDP)",
            value=DEFAULTS["debt_target"],
            min=0,
            max=200,
        ),
        ui.p(
            "Target debt-to-GDP ratio. The fiscal rule adjusts the "
            "primary balance toward this level over time.",
            class_="param-help",
        ),
        ui.input_select(
            "fiscal_rule",
            "Fiscal rule",
            choices=["Yes", "No"],
            selected=DEFAULTS["fiscal_rule"],
        ),
        ui.p(
            "When Yes, applies fiscal consolidation toward the debt target.",
            class_="param-help",
        ),
        ui.input_slider(
            "expenditure_rigidity",
            "Expenditure rigidity",
            min=0.0,
            max=1.0,
            value=DEFAULTS["expenditure_rigidity"],
            step=0.1,
        ),
        ui.p(
            "How sticky is government spending? "
            "1.0 = barely adjusts to shocks (worst case). "
            "0.0 = fully flexible.",
            class_="param-help",
        ),
        ui.hr(),
        ui.a(
            "Send feedback",
            href="mailto:lte@tealinsights.com?subject=Q-CRAFT%20Explorer%20Feedback",
            target="_blank",
            style="font-size: 0.85rem; color: #1ABC9C;",
        ),
        width=300,
    ),
    ui.head_content(
        ui.include_css(WWW_DIR / "styles.css"),
    ),
    ui.navset_tab(
        ui.nav_panel(
            "Baseline",
            ui.div(
                ui.layout_columns(
                    ui.value_box(
                        "Debt-to-GDP (2050)",
                        ui.output_text("card_debt"),
                        showcase=ui.span(
                            "%",
                            style="font-size: 1.5rem; color: #BDC3C7;",
                        ),
                    ),
                    ui.value_box(
                        "Revenue (2050, % GDP)",
                        ui.output_text("card_revenue"),
                        showcase=ui.span(
                            "%",
                            style="font-size: 1.5rem; color: #BDC3C7;",
                        ),
                    ),
                    ui.value_box(
                        "Primary Balance (2050, % GDP)",
                        ui.output_text("card_balance"),
                        showcase=ui.span(
                            "%",
                            style="font-size: 1.5rem; color: #BDC3C7;",
                        ),
                    ),
                    col_widths=[4, 4, 4],
                ),
                output_widget("chart_debt", height="420px"),
                ui.div(
                    ui.div(
                        output_widget("chart_rev_exp", height="350px"),
                        class_="chart-half",
                    ),
                    ui.div(
                        output_widget("chart_balances", height="350px"),
                        class_="chart-half",
                    ),
                    class_="chart-row",
                ),
                style="padding-top: 1rem;",
            ),
        ),
        ui.nav_panel(
            "Analysis",
            ui.div(
                ui.h4("Scenario Comparison"),
                ui.p(
                    "How does climate change affect long-term debt sustainability? "
                    "Compare baseline fiscal projections against six climate scenarios."
                ),
                ui.output_ui("scenario_comparison_cards"),
                output_widget("chart_scenario_debt", height="450px"),
                style="padding: 1.5rem;",
            ),
        ),
        ui.nav_panel(
            "Climate",
            ui.div(
                ui.h4("Climate GDP Impact"),
                ui.div(
                    ui.tags.p(
                        ui.tags.strong("Paris-Aligned (1.5°C):"),
                        " Aggressive mitigation limits warming. ",
                        ui.tags.strong("Moderate (2°C):"),
                        " Current pledges trajectory. ",
                        ui.tags.strong("Hot (3°C):"),
                        " Insufficient action. ",
                        ui.tags.strong("High (4°C+):"),
                        " Worst-case warming.",
                    ),
                    class_="climate-explainer",
                ),
                output_widget("chart_climate_gdp", height="420px"),
                ui.h4(
                    "GDP Index (Base Year = 100)",
                    style="margin-top: 1.5rem;",
                ),
                ui.p(
                    "Relative GDP trajectories rebased to 100 "
                    "to show divergence from baseline."
                ),
                output_widget("chart_climate_gdp_index", height="420px"),
                style="padding: 1.5rem;",
            ),
        ),
        ui.nav_panel(
            "Data",
            ui.div(
                ui.h4("Data Explorer"),
                ui.div(
                    ui.download_button(
                        "download_baseline",
                        "Download Baseline CSV",
                        class_="btn btn-outline-primary btn-sm",
                    ),
                    ui.download_button(
                        "download_scenarios",
                        "Download All Scenarios CSV",
                        class_="btn btn-outline-primary btn-sm",
                    ),
                    class_="data-controls",
                ),
                ui.output_data_frame("data_table"),
                style="padding: 1.5rem;",
            ),
        ),
        ui.nav_panel(
            "Methodology",
            ui.div(
                ui.h4("Q-CRAFT Model Overview"),
                ui.p(
                    "The Quantitative Climate Risk Assessment "
                    "Fiscal Tool (Q-CRAFT) projects long-term "
                    "fiscal trajectories under climate change "
                    "scenarios. It combines demographic, macro"
                    "economic, and climate science inputs to "
                    "estimate how climate shocks affect debt "
                    "sustainability."
                ),
                ui.h4("Key Equations"),
                ui.tags.p(ui.tags.strong("Real GDP Growth")),
                ui.div(
                    "g(t) = pop_growth(t) × productivity_growth(t) × inflation(t)",
                    class_="equation-block",
                ),
                ui.p(
                    "Real GDP is driven by demographic change "
                    "(working-age population), labour "
                    "productivity convergence, and GDP "
                    "deflator dynamics."
                ),
                ui.tags.p(ui.tags.strong("Debt Dynamics")),
                ui.div(
                    "d(t) = d(t−1) × (1 + r) / (1 + g) − pb(t)",
                    class_="equation-block",
                ),
                ui.p(
                    "Where d is debt-to-GDP, r is the "
                    "effective interest rate, g is nominal "
                    "GDP growth, and pb is the primary "
                    "balance as a share of GDP."
                ),
                ui.tags.p(ui.tags.strong("Climate Impact")),
                ui.div(
                    "GDP_climate(t) = GDP_baseline(t) × (1 + climate_shock(t))",
                    class_="equation-block",
                ),
                ui.p(
                    "Climate damage functions from NGFS scenarios are applied as "
                    "cumulative growth shocks to baseline GDP, propagating through "
                    "the full fiscal framework."
                ),
                ui.h4("Sources & References"),
                ui.tags.ul(
                    ui.tags.li(
                        "Batini, N. et al. (2024). ",
                        ui.tags.em("Accounting for Nature in Fiscal Frameworks."),
                        " IMF Working Paper.",
                    ),
                    ui.tags.li(
                        "Kahn, M.E. et al. (2021). ",
                        ui.tags.em(
                            "Long-Term Macroeconomic Effects of Climate Change."
                        ),
                        " Journal of Monetary Economics.",
                    ),
                    ui.tags.li(
                        "NGFS Climate Scenarios (2023). ",
                        "Network for Greening the Financial System.",
                    ),
                    ui.tags.li(
                        "IMF Q-CRAFT Methodology. ",
                        "Fiscal Affairs Department, International Monetary Fund.",
                    ),
                    class_="source-list",
                ),
                class_="methodology-section",
            ),
        ),
    ),
    title="Q-CRAFT Explorer",
)

# ── Server ────────────────────────────────────────────────────────────────────


def server(input: Inputs, output: Outputs, session: Session):
    @reactive.calc
    def pipeline_results():
        params = {
            "demography_variant": input.demography_variant(),
            "debt_target": input.debt_target(),
            "fiscal_rule": input.fiscal_rule(),
            "expenditure_rigidity": input.expenditure_rigidity(),
        }
        try:
            return run_pipeline(DATA, input.country(), params)
        except (ValueError, TypeError, KeyError) as e:
            return {"_error": str(e)}

    @reactive.calc
    def pipeline_error():
        r = pipeline_results()
        return r.get("_error") if isinstance(r, dict) else None

    @reactive.calc
    def country_name():
        return COUNTRY_CHOICES.get(input.country(), input.country())

    @reactive.calc
    def fiscal_2050():
        if pipeline_error():
            return pl.DataFrame()
        fiscal = pipeline_results()["fiscal"]
        return fiscal.filter(pl.col("years") == 2050)

    # ── Country context card ───────────────────────────────────────────────

    @render.ui
    def country_context():
        iso3c = input.country()
        macro = DATA["macrofiscal"].filter(pl.col("iso3c") == iso3c)
        demo = DATA["demography"].filter(pl.col("iso3c") == iso3c)

        parts = []

        # Latest WEO debt-to-GDP
        debt_row = (
            macro.filter(pl.col("debt_to_gdp").is_not_null())
            .sort("years", descending=True)
            .head(1)
        )
        if not debt_row.is_empty():
            yr = int(debt_row["years"].item())
            val = debt_row["debt_to_gdp"].item()
            parts.append(
                ui.div(
                    ui.p(f"Debt-to-GDP ({yr})", class_="ctx-label"),
                    ui.p(f"{val:.1f}%", class_="ctx-value"),
                )
            )

        # Latest population
        pop_row = (
            demo.filter(pl.col("population").is_not_null())
            .sort("years", descending=True)
            .head(1)
        )
        if not pop_row.is_empty():
            pop = pop_row["population"].item()
            if pop >= 1e9:
                pop_str = f"{pop / 1e9:.2f}B"
            elif pop >= 1e6:
                pop_str = f"{pop / 1e6:.1f}M"
            elif pop >= 1e3:
                pop_str = f"{pop / 1e3:.0f}K"
            else:
                pop_str = f"{pop:,.0f}"
            parts.append(
                ui.div(
                    ui.p("Population", class_="ctx-label"),
                    ui.p(pop_str, class_="ctx-value"),
                )
            )

        if not parts:
            return ui.div()

        return ui.div(*parts, class_="country-context")

    def _error_figure(msg: str) -> go.Figure:
        """Return a blank figure with an error annotation."""
        fig = make_line_chart(title="", height=300)
        fig.add_annotation(
            text=msg,
            x=0.5,
            y=0.5,
            xref="paper",
            yref="paper",
            showarrow=False,
            font=dict(size=14, color="#7F8C8D"),
        )
        fig.update_xaxes(visible=False)
        fig.update_yaxes(visible=False)
        return fig

    # ── Summary cards ─────────────────────────────────────────────────────

    @render.text
    def card_debt():
        row = fiscal_2050()
        if row.is_empty():
            return "—"
        return f"{row.get_column('debt_to_gdp').item():.1f}"

    @render.text
    def card_revenue():
        row = fiscal_2050()
        if row.is_empty():
            return "—"
        return f"{row.get_column('revenue_percent_gdp').item():.1f}"

    @render.text
    def card_balance():
        row = fiscal_2050()
        if row.is_empty():
            return "—"
        return f"{row.get_column('primary_balance_percent_gdp').item():.1f}"

    # ── Baseline tab charts ───────────────────────────────────────────────

    @render_plotly
    def chart_debt():
        if pipeline_error():
            return _error_figure(pipeline_error())
        fiscal = pipeline_results()["fiscal"]

        fig = make_line_chart(
            title=f"Debt-to-GDP Projection — {country_name()}",
            yaxis_title="Debt-to-GDP (%)",
            height=400,
        )

        # Historical shading (2009-2029)
        fig.add_vrect(
            x0=2009,
            x1=2029,
            fillcolor="#F0F3F4",
            opacity=0.5,
            line_width=0,
        )

        fig.add_trace(
            go.Scatter(
                x=fiscal["years"].to_list(),
                y=fiscal["debt_to_gdp"].to_list(),
                mode="lines",
                name="Baseline",
                line=dict(color=COLORS["baseline"], width=3),
                showlegend=False,
            )
        )

        # Direct label at end
        if not fiscal.is_empty():
            last_debt = fiscal.get_column("debt_to_gdp").last()
            fig.add_annotation(
                x=fiscal.get_column("years").last(),
                y=last_debt,
                text=f"{last_debt:.1f}%",
                showarrow=False,
                xanchor="left",
                xshift=5,
                font=dict(size=11, color=COLORS["baseline"]),
            )

        add_weo_boundary(fig)
        return fig

    @render_plotly
    def chart_rev_exp():
        if pipeline_error():
            return _error_figure(pipeline_error())
        fiscal = pipeline_results()["fiscal"]

        fig = make_line_chart(
            title="Revenue & Expenditure (% GDP)",
            yaxis_title="% GDP",
            height=330,
        )

        fig.add_trace(
            go.Scatter(
                x=fiscal["years"].to_list(),
                y=fiscal["revenue_percent_gdp"].to_list(),
                mode="lines",
                name="Revenue",
                line=dict(color=COLORS["accent"], width=2),
            )
        )
        fig.add_trace(
            go.Scatter(
                x=fiscal["years"].to_list(),
                y=fiscal["primary_expenditure_percent_gdp"].to_list(),
                mode="lines",
                name="Primary Expenditure",
                line=dict(color=COLORS["Hot"], width=2),
            )
        )

        add_weo_boundary(fig)
        return fig

    @render_plotly
    def chart_balances():
        if pipeline_error():
            return _error_figure(pipeline_error())
        fiscal = pipeline_results()["fiscal"]

        fig = make_line_chart(
            title="Fiscal Balances (% GDP)",
            yaxis_title="% GDP",
            height=330,
        )

        fig.add_trace(
            go.Scatter(
                x=fiscal["years"].to_list(),
                y=fiscal["primary_balance_percent_gdp"].to_list(),
                mode="lines",
                name="Primary Balance",
                line=dict(color=COLORS["Moderate"], width=2),
            )
        )
        fig.add_trace(
            go.Scatter(
                x=fiscal["years"].to_list(),
                y=fiscal["overall_balance_percent_gdp"].to_list(),
                mode="lines",
                name="Overall Balance",
                line=dict(color=COLORS["High"], width=2),
            )
        )

        add_weo_boundary(fig)
        add_zero_line(fig)
        return fig

    # ── Analysis tab ──────────────────────────────────────────────────────

    @render.ui
    def scenario_comparison_cards():
        if pipeline_error():
            return ui.p(
                pipeline_error(),
                class_="stub-message",
            )
        results = pipeline_results()
        fiscal = results["fiscal"]

        def _debt_at_year(key: str, year: int) -> str:
            if key == "Baseline":
                df = fiscal
            elif key in results:
                df = results[key]
            else:
                return "—"
            row = df.filter(pl.col("years") == year)
            if row.is_empty():
                return "—"
            return f"{row.get_column('debt_to_gdp').item():.1f}%"

        scenarios = [
            ("Baseline", "Baseline"),
            ("Paris", "Paris (1.5°C)"),
            ("Hot_Unadapted", "Hot Unadapted"),
        ]

        cards = []
        for key, label in scenarios:
            val_2050 = _debt_at_year(key, 2050)
            val_2099 = _debt_at_year(key, 2099)
            cards.append(
                ui.div(
                    ui.p(label, class_="sc-title"),
                    ui.p(val_2050, class_="sc-value"),
                    ui.p(f"2099: {val_2099}", class_="sc-subtitle"),
                    class_="scenario-card",
                )
            )

        return ui.div(*cards, class_="scenario-cards")

    @render_plotly
    def chart_scenario_debt():
        if pipeline_error():
            return _error_figure(pipeline_error())
        results = pipeline_results()
        fiscal = results["fiscal"]

        fig = make_line_chart(
            title=(f"Debt-to-GDP Under Climate Scenarios — {country_name()}"),
            yaxis_title="Debt-to-GDP (%)",
            height=450,
        )
        fig.update_layout(margin=dict(t=100))

        # Historical shading
        fig.add_vrect(
            x0=2009,
            x1=2029,
            fillcolor="#F0F3F4",
            opacity=0.5,
            line_width=0,
        )

        # Baseline — visually dominant
        fig.add_trace(
            go.Scatter(
                x=fiscal["years"].to_list(),
                y=fiscal["debt_to_gdp"].to_list(),
                mode="lines",
                name="Baseline",
                line=dict(color=COLORS["baseline"], width=3.5),
            )
        )

        # Climate scenarios
        for scenario in CLIMATE_SCENARIOS:
            if scenario in results:
                scn = results[scenario]
                fig.add_trace(
                    go.Scatter(
                        x=scn["years"].to_list(),
                        y=scn["debt_to_gdp"].to_list(),
                        mode="lines",
                        name=SCENARIO_LABELS[scenario],
                        line=dict(
                            color=COLORS.get(scenario, NAVY),
                            width=2,
                        ),
                    )
                )

        # Direct labels at end for bookend scenarios
        for key in ["Paris", "Hot_Unadapted"]:
            if key in results:
                scn = results[key]
                if not scn.is_empty():
                    last_val = scn.get_column("debt_to_gdp").last()
                    fig.add_annotation(
                        x=scn.get_column("years").last(),
                        y=last_val,
                        text=f"{last_val:.0f}%",
                        showarrow=False,
                        xanchor="left",
                        xshift=5,
                        font=dict(
                            size=10,
                            color=COLORS.get(key, NAVY),
                        ),
                    )

        add_weo_boundary(fig)
        return fig

    # ── Climate tab ───────────────────────────────────────────────────────

    @render_plotly
    def chart_climate_gdp():
        if pipeline_error():
            return _error_figure(pipeline_error())
        results = pipeline_results()

        fig = make_line_chart(
            title=(f"Real GDP Under Climate Scenarios — {country_name()}"),
            yaxis_title="Real GDP (LCU, Bil)",
            height=420,
        )
        fig.update_layout(margin=dict(t=100))
        fig.update_yaxes(tickformat=".0f")

        # Baseline real GDP from baseline_v1
        bv1 = results["baseline_v1"]
        fig.add_trace(
            go.Scatter(
                x=bv1["years"].to_list(),
                y=bv1["real_gdp"].to_list(),
                mode="lines",
                name="Baseline",
                line=dict(color=COLORS["baseline"], width=3),
            )
        )

        # Climate scenarios
        for scenario in CLIMATE_SCENARIOS:
            if scenario in results:
                scn = results[scenario]
                fig.add_trace(
                    go.Scatter(
                        x=scn["years"].to_list(),
                        y=scn["real_gdp"].to_list(),
                        mode="lines",
                        name=SCENARIO_LABELS[scenario],
                        line=dict(
                            color=COLORS.get(scenario, NAVY),
                            width=1.5,
                        ),
                    )
                )

        add_weo_boundary(fig)
        return fig

    @render_plotly
    def chart_climate_gdp_index():
        if pipeline_error():
            return _error_figure(pipeline_error())
        results = pipeline_results()

        fig = make_line_chart(
            title=f"GDP Index Under Climate Scenarios — {country_name()}",
            yaxis_title="GDP Index (2029 = 100)",
            height=420,
        )
        fig.update_layout(margin=dict(t=100))
        fig.update_yaxes(tickformat=".0f")

        bv1 = results["baseline_v1"]
        base_2029 = bv1.filter(pl.col("years") == 2029)
        if base_2029.is_empty():
            return fig

        base_val = base_2029.get_column("real_gdp").item()
        if base_val == 0:
            return fig

        # Baseline index
        years = bv1["years"].to_list()
        baseline_idx = [v / base_val * 100 for v in bv1["real_gdp"].to_list()]
        fig.add_trace(
            go.Scatter(
                x=years,
                y=baseline_idx,
                mode="lines",
                name="Baseline",
                line=dict(color=COLORS["baseline"], width=3),
            )
        )

        # Climate scenario indices
        for scenario in CLIMATE_SCENARIOS:
            if scenario in results:
                scn = results[scenario]
                scn_idx = [v / base_val * 100 for v in scn["real_gdp"].to_list()]
                fig.add_trace(
                    go.Scatter(
                        x=scn["years"].to_list(),
                        y=scn_idx,
                        mode="lines",
                        name=SCENARIO_LABELS[scenario],
                        line=dict(
                            color=COLORS.get(scenario, NAVY),
                            width=1.5,
                        ),
                    )
                )

        add_weo_boundary(fig)
        return fig

    # ── Data tab ──────────────────────────────────────────────────────────

    @render.data_frame
    def data_table():
        if pipeline_error():
            err_df = pl.DataFrame({"Message": [pipeline_error()]}).to_pandas()
            return render.DataGrid(err_df, width="100%")
        fiscal = pipeline_results()["fiscal"]
        display_cols = [
            "years",
            "debt_to_gdp",
            "revenue_percent_gdp",
            "primary_expenditure_percent_gdp",
            "primary_balance_percent_gdp",
            "overall_balance_percent_gdp",
        ]
        available = [c for c in display_cols if c in fiscal.columns]
        df = fiscal.select(available).to_pandas()
        # Round numeric columns
        for col in df.columns:
            if col != "years" and df[col].dtype in ("float64", "float32"):
                df[col] = df[col].round(2)
        df = df.rename(
            columns={
                "years": "Year",
                "debt_to_gdp": "Debt/GDP (%)",
                "revenue_percent_gdp": "Revenue (% GDP)",
                "primary_expenditure_percent_gdp": "Prim. Exp. (% GDP)",
                "primary_balance_percent_gdp": "Prim. Balance (% GDP)",
                "overall_balance_percent_gdp": "Overall Balance (% GDP)",
            }
        )
        return render.DataGrid(df, width="100%", height="500px", filters=True)

    @render.download(
        filename=lambda: f"qcraft_baseline_{input.country()}.csv",
    )
    def download_baseline():
        if pipeline_error():
            yield f"Error: {pipeline_error()}"
            return
        fiscal = pipeline_results()["fiscal"]
        buf = io.StringIO()
        fiscal.to_pandas().to_csv(buf, index=False)
        yield buf.getvalue()

    @render.download(
        filename=lambda: f"qcraft_all_scenarios_{input.country()}.csv",
    )
    def download_scenarios():
        if pipeline_error():
            yield f"Error: {pipeline_error()}"
            return
        results = pipeline_results()
        frames = []

        # Baseline
        fiscal = results["fiscal"].clone()
        fiscal = fiscal.with_columns(pl.lit("Baseline").alias("scenario"))
        frames.append(fiscal)

        # Climate scenarios
        for scenario in CLIMATE_SCENARIOS:
            if scenario in results:
                scn = results[scenario].clone()
                scn = scn.with_columns(
                    pl.lit(SCENARIO_LABELS[scenario]).alias("scenario")
                )
                frames.append(scn)

        stacked = pl.concat(frames, how="diagonal")
        buf = io.StringIO()
        stacked.to_pandas().to_csv(buf, index=False)
        yield buf.getvalue()


app = App(app_ui, server, static_assets=WWW_DIR)
