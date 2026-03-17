"""Q-CRAFT Explorer — Shiny for Python entry point."""

from pathlib import Path

import plotly.graph_objects as go
from qcraft_app.plotly_theme import (
    NAVY,
    add_weo_boundary,
    add_zero_line,
    make_line_chart,
)
from qcraft_engine.constants import COLORS, DEFAULTS, SCENARIO_LABELS
from qcraft_engine.data_loader import get_country_list, load_parquet_data, run_pipeline
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
        ui.input_select(
            "demography_variant",
            "Demography variant",
            choices=["Medium", "High", "Low"],
            selected=DEFAULTS["demography_variant"],
        ),
        ui.input_numeric(
            "debt_target",
            "Debt target (% GDP)",
            value=DEFAULTS["debt_target"],
            min=0,
            max=200,
        ),
        ui.input_select(
            "fiscal_rule",
            "Fiscal rule",
            choices=["Yes", "No"],
            selected=DEFAULTS["fiscal_rule"],
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
            "1.0 = sticky (worst case), 0.0 = flexible",
            style="font-size: 0.75rem; color: #7F8C8D; margin-top: -8px;",
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
                ui.p("Climate scenario analysis with debt trajectory overlay."),
                output_widget("chart_scenario_debt", height="450px"),
                style="padding: 1.5rem;",
            ),
        ),
        ui.nav_panel(
            "Climate",
            ui.div(
                ui.h4("Climate GDP Impact"),
                ui.p("GDP loss trajectories across climate scenarios."),
                output_widget("chart_climate_gdp", height="450px"),
                style="padding: 1.5rem;",
            ),
        ),
        ui.nav_panel(
            "Data",
            ui.div(
                ui.p(
                    "Coming soon — data export",
                    class_="stub-message",
                ),
                style="padding: 2rem;",
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
        return run_pipeline(DATA, input.country(), params)

    @reactive.calc
    def country_name():
        return COUNTRY_CHOICES.get(input.country(), input.country())

    # ── Summary cards ─────────────────────────────────────────────────────

    @render.text
    def card_debt():
        fiscal = pipeline_results()["fiscal"]
        row = fiscal.filter(fiscal["years"] == 2050)
        if len(row) > 0:
            return f"{row['debt_to_gdp'][0]:.1f}"
        return "—"

    @render.text
    def card_revenue():
        fiscal = pipeline_results()["fiscal"]
        row = fiscal.filter(fiscal["years"] == 2050)
        if len(row) > 0:
            return f"{row['revenue_percent_gdp'][0]:.1f}"
        return "—"

    @render.text
    def card_balance():
        fiscal = pipeline_results()["fiscal"]
        row = fiscal.filter(fiscal["years"] == 2050)
        if len(row) > 0:
            return f"{row['primary_balance_percent_gdp'][0]:.1f}"
        return "—"

    # ── Baseline tab charts ───────────────────────────────────────────────

    @render_plotly
    def chart_debt():
        fiscal = pipeline_results()["fiscal"]
        years = fiscal["years"].to_list()
        debt = fiscal["debt_to_gdp"].to_list()

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
                x=years,
                y=debt,
                mode="lines",
                name="Baseline",
                line=dict(color=COLORS["baseline"], width=2.5),
                showlegend=False,
            )
        )

        # Direct label at end
        fig.add_annotation(
            x=years[-1],
            y=debt[-1],
            text=f"{debt[-1]:.1f}%",
            showarrow=False,
            xanchor="left",
            xshift=5,
            font=dict(size=11, color=COLORS["baseline"]),
        )

        add_weo_boundary(fig)
        return fig

    @render_plotly
    def chart_rev_exp():
        fiscal = pipeline_results()["fiscal"]
        years = fiscal["years"].to_list()

        fig = make_line_chart(
            title="Revenue and Expenditure (% GDP)",
            yaxis_title="% GDP",
            height=330,
        )

        fig.add_trace(
            go.Scatter(
                x=years,
                y=fiscal["revenue_percent_gdp"].to_list(),
                mode="lines",
                name="Revenue",
                line=dict(color=COLORS["accent"], width=2),
            )
        )
        fig.add_trace(
            go.Scatter(
                x=years,
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
        fiscal = pipeline_results()["fiscal"]
        years = fiscal["years"].to_list()

        fig = make_line_chart(
            title="Fiscal Balances (% GDP)",
            yaxis_title="% GDP",
            height=330,
        )

        fig.add_trace(
            go.Scatter(
                x=years,
                y=fiscal["primary_balance_percent_gdp"].to_list(),
                mode="lines",
                name="Primary Balance",
                line=dict(color=COLORS["Moderate"], width=2),
            )
        )
        fig.add_trace(
            go.Scatter(
                x=years,
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

    @render_plotly
    def chart_scenario_debt():
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

        # Baseline
        years = fiscal["years"].to_list()
        fig.add_trace(
            go.Scatter(
                x=years,
                y=fiscal["debt_to_gdp"].to_list(),
                mode="lines",
                name="Baseline",
                line=dict(color=COLORS["baseline"], width=2.5),
            )
        )

        # Climate scenarios
        for scenario in SCENARIO_LABELS:
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

        add_weo_boundary(fig)
        return fig

    # ── Climate tab ───────────────────────────────────────────────────────

    @render_plotly
    def chart_climate_gdp():
        results = pipeline_results()

        fig = make_line_chart(
            title=(f"Real GDP Under Climate Scenarios — {country_name()}"),
            yaxis_title="Real GDP (LCU, Bil)",
            height=450,
        )
        fig.update_layout(margin=dict(t=100))

        # Baseline real GDP from baseline_v1
        bv1 = results["baseline_v1"]
        years = bv1["years"].to_list()
        fig.add_trace(
            go.Scatter(
                x=years,
                y=bv1["real_gdp"].to_list(),
                mode="lines",
                name="Baseline",
                line=dict(color=COLORS["baseline"], width=2.5),
            )
        )

        # Climate scenarios
        for scenario in SCENARIO_LABELS:
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


app = App(app_ui, server, static_assets=WWW_DIR)
