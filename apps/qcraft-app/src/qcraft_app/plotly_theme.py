"""Q-CRAFT Plotly theme — SWD-inspired, professional charting."""

import plotly.graph_objects as go
from qcraft_engine.constants import PROJ_START

FONT_FAMILY = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

# Color palette
NAVY = "#2C3E50"
TEAL = "#1ABC9C"
LIGHT_GRAY = "#ECF0F1"
MID_GRAY = "#BDC3C7"
DARK_GRAY = "#7F8C8D"
WHITE = "#FFFFFF"
BACKGROUND = "#FAFBFC"

QCRAFT_TEMPLATE = go.layout.Template(
    layout=go.Layout(
        font=dict(family=FONT_FAMILY, size=13, color=NAVY),
        title=dict(
            font=dict(size=16, color=NAVY, family=FONT_FAMILY),
            x=0.0,
            xanchor="left",
            pad=dict(b=10),
        ),
        plot_bgcolor=WHITE,
        paper_bgcolor=BACKGROUND,
        xaxis=dict(
            gridcolor=LIGHT_GRAY,
            linecolor=MID_GRAY,
            linewidth=1,
            showgrid=False,
            zeroline=False,
        ),
        yaxis=dict(
            gridcolor="#E8ECEE",
            linecolor=MID_GRAY,
            linewidth=1,
            showgrid=True,
            zeroline=False,
            tickformat=".1f",
            title=dict(standoff=15),
        ),
        margin=dict(l=55, r=50, t=60, b=45),
        hovermode="x unified",
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.05,
            xanchor="left",
            x=0,
            font=dict(size=11),
        ),
    )
)


def make_line_chart(
    title: str = "",
    yaxis_title: str = "",
    height: int = 400,
) -> go.Figure:
    """Create a pre-themed empty figure for line charts."""
    fig = go.Figure()
    fig.update_layout(
        template=QCRAFT_TEMPLATE,
        title=dict(text=title),
        yaxis=dict(title=yaxis_title),
        height=height,
    )
    return fig


def add_weo_boundary(fig: go.Figure, weo_year: int = PROJ_START - 1) -> None:
    """Add a vertical dashed line at the WEO horizon boundary."""
    fig.add_vline(
        x=weo_year,
        line=dict(color="#95A5A6", width=1.5, dash="dash"),
    )
    fig.add_annotation(
        x=weo_year,
        y=1.0,
        yref="paper",
        text="<b>WEO</b>",
        showarrow=False,
        font=dict(size=9, color="#95A5A6"),
        xshift=12,
        yshift=-10,
    )


def add_zero_line(fig: go.Figure) -> None:
    """Add a horizontal line at y=0."""
    fig.add_hline(
        y=0,
        line=dict(color=DARK_GRAY, width=1),
    )
