"""Build the 'what the source shows' figures for Module 3.

Every parameter in Q-CRAFT Explorer is a judgment call, and a judgment call is
easier to make when you can see what the underlying source actually publishes.
These figures draw that source data straight from the Parquet inputs the
Explorer itself runs on, so a reader can form their own view rather than take
the guide's word for a default.

Five figures come out:

    param-country-context      debt-to-GDP, WEO history and forecast
    param-demography-variants  working-age population under the three UN variants
    param-rigidity-record      revenue and primary expenditure as shares of GDP
    param-productivity         growth in output per worker, against the Explorer default
    param-inflation            GDP deflator growth, against the Explorer default

Colours are the reference categorical slots 1 to 3 (blue, orange, aqua), which
validate on all pairs against a white surface, plus a single-hue blue ordinal
ramp for the three UN variants, which are ordered rather than categorical. Aqua
sits below 3:1 on white, so every series carries a direct label at its end.

Run from the repository root, with data/processed/*.parquet in place:

    uv run --no-project --with polars python3 scripts/build_parameter_context.py

Then rasterise for the PDF with scripts/rasterise_figures.py.
"""

from __future__ import annotations

import html
import math
from pathlib import Path

import polars as pl

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "data" / "processed"
FIG_DIR = REPO_ROOT / "docs" / "companion-guide" / "figures"

# Three countries whose mechanisms differ. Ethiopia's working-age population is
# still climbing, Thailand's has turned down, and Uganda is the guide's worked
# case and verification country.
COUNTRIES = [("ETH", "Ethiopia"), ("THA", "Thailand"), ("UGA", "Uganda")]

# Reference categorical slots 1-3. Validated all-pairs on a white surface:
# worst CVD deltaE 9.2, worst normal-vision deltaE 24.0.
SERIES = ["#2a78d6", "#eb6834", "#1baf7a"]
# Single-hue blue ordinal ramp for Low, Medium, High. Monotone in lightness,
# light end clears the surface at 2.11:1.
VARIANT_COLOUR = {"Low": "#86b6ef", "Medium": "#2a78d6", "High": "#104281"}

INK = "#2C3E50"
MUTED = "#63757F"
GRID = "#E6EBEF"
AXIS = "#C4CED5"
FORECAST_BAND = "#F2F5F7"

VIEW_W = 680
FIRST_FORECAST_YEAR = 2024  # WEO October 2024 publishes actuals through 2023.


def esc(value: str) -> str:
    return html.escape(value, quote=False)


def text(
    x: float,
    y: float,
    content: str,
    size: float,
    fill: str,
    weight: str = "400",
    anchor: str = "start",
    halo: bool = False,
) -> str:
    """A label. halo=True paints it on a surface-coloured outline, for labels
    that have to sit on top of the data."""
    relief = ' stroke="#FFFFFF" stroke-width="3.5" paint-order="stroke"' if halo else ""
    return (
        f'<text class="qcf-sans" x="{x:.1f}" y="{y:.1f}" font-size="{size}" '
        f'font-weight="{weight}" fill="{fill}" text-anchor="{anchor}"{relief}>'
        f"{esc(content)}</text>"
    )


def nice_ticks(lo: float, hi: float, count: int = 4) -> list[float]:
    """Round tick values covering the range, so the axis reads in clean numbers."""
    span = hi - lo
    if span <= 0:
        return [lo]
    raw = span / count
    magnitude = 10 ** math.floor(math.log10(raw))
    for factor in (1, 2, 2.5, 5, 10):
        step = magnitude * factor
        if raw <= step:
            break
    start = math.floor(lo / step) * step
    ticks = []
    value = start
    while value <= hi + step / 2:
        if value >= lo - step / 2:
            ticks.append(round(value, 6))
        value += step
    return ticks


_CLIP_COUNTER = [0]


class Panel:
    """One plot area, with scales and the furniture that goes round it."""

    def __init__(
        self,
        x: float,
        y: float,
        w: float,
        h: float,
        xlim: tuple[float, float],
        ylim: tuple[float, float],
        log: bool = False,
    ) -> None:
        self.x, self.y, self.w, self.h = x, y, w, h
        self.xlim, self.ylim, self.log = xlim, ylim, log
        _CLIP_COUNTER[0] += 1
        self.clip_id = f"qcf-clip-{_CLIP_COUNTER[0]}"
        self._labels: list[tuple[float, str, str]] = []

    def clip(self) -> str:
        """Nothing drawn inside a panel is allowed to escape it."""
        return (
            f'<clipPath id="{self.clip_id}"><rect x="{self.x - 1:.1f}" '
            f'y="{self.y - 1:.1f}" width="{self.w + 2:.1f}" height="{self.h + 2:.1f}"/>'
            "</clipPath>"
        )

    def px(self, value: float) -> float:
        lo, hi = self.xlim
        return self.x + (value - lo) / (hi - lo) * self.w

    def py(self, value: float) -> float:
        lo, hi = self.ylim
        if self.log:
            lo, hi, value = math.log10(lo), math.log10(hi), math.log10(max(value, 1e-6))
        return self.y + self.h - (value - lo) / (hi - lo) * self.h

    def grid(self, ticks: list[float], labels: bool = True, unit: str = "") -> str:
        parts = []
        for value in ticks:
            y = self.py(value)
            parts.append(
                f'<line x1="{self.x:.1f}" y1="{y:.1f}" x2="{self.x + self.w:.1f}" '
                f'y2="{y:.1f}" stroke="{GRID}" stroke-width="1"/>'
            )
            if labels:
                shown = f"{value:g}{unit}"
                parts.append(text(self.x - 7, y + 3.5, shown, 10, MUTED, anchor="end"))
        return "".join(parts)

    def x_axis(self, ticks: list[int]) -> str:
        base = self.y + self.h
        parts = [
            f'<line x1="{self.x:.1f}" y1="{base:.1f}" x2="{self.x + self.w:.1f}" '
            f'y2="{base:.1f}" stroke="{AXIS}" stroke-width="1"/>'
        ]
        for value in ticks:
            parts.append(
                text(self.px(value), base + 15, str(value), 10, MUTED, anchor="middle")
            )
        return "".join(parts)

    def forecast_band(self, start: float, label: str = "WEO forecast") -> str:
        x0 = self.px(start)
        return "".join(
            [
                f'<rect x="{x0:.1f}" y="{self.y:.1f}" width="{self.x + self.w - x0:.1f}" '
                f'height="{self.h:.1f}" fill="{FORECAST_BAND}"/>',
                text(x0 + 4, self.y + 12, label, 9.5, MUTED),
            ]
        )

    def line(self, points: list[tuple[float, float]], colour: str, width: float = 2) -> str:
        drawn = " ".join(f"{self.px(x):.1f},{self.py(y):.1f}" for x, y in points)
        return (
            f'<polyline clip-path="url(#{self.clip_id})" points="{drawn}" fill="none" '
            f'stroke="{colour}" stroke-width="{width}" stroke-linejoin="round" '
            f'stroke-linecap="round"/>'
        )

    def band(self, points: list[tuple[float, float, float]], colour: str) -> str:
        top = " ".join(f"{self.px(x):.1f},{self.py(hi):.1f}" for x, _, hi in points)
        bottom = " ".join(
            f"{self.px(x):.1f},{self.py(lo):.1f}" for x, lo, _ in reversed(points)
        )
        return (
            f'<polygon clip-path="url(#{self.clip_id})" points="{top} {bottom}" '
            f'fill="{colour}" fill-opacity="0.10"/>'
        )

    def rule(self, value: float, label: str, colour: str = MUTED) -> str:
        y = self.py(value)
        return "".join(
            [
                f'<line x1="{self.x:.1f}" y1="{y:.1f}" x2="{self.x + self.w:.1f}" '
                f'y2="{y:.1f}" stroke="{colour}" stroke-width="1" stroke-dasharray="4 3"/>',
                text(self.x + 4, y - 5, label, 9.5, colour, halo=True),
            ]
        )

    def end_label(self, points: list[tuple[float, float]], name: str, colour: str) -> str:
        """Queue a direct label at the line's end. Collisions resolve in flush()."""
        x, y = points[-1]
        self._labels.append((self.py(y), name, colour))
        return (
            f'<circle cx="{self.px(x):.1f}" cy="{self.py(y):.1f}" r="3.2" '
            f'fill="{colour}" stroke="#FFFFFF" stroke-width="2"/>'
        )

    def flush_labels(self, gap: float = 13) -> str:
        """Push stacked end labels apart rather than letting them overprint."""
        placed: list[tuple[float, str, str]] = []
        for y, name, colour in sorted(self._labels):
            if placed and y - placed[-1][0] < gap:
                y = placed[-1][0] + gap
            placed.append((y, name, colour))
        self._labels = []
        return "".join(
            text(self.x + self.w + 8, y + 3.5, name, 11, INK, weight="600")
            for y, name, _ in placed
        )


def frame(height: float, title: str, subtitle: str, source: str, body: str) -> str:
    style = (
        "<style>"
        '.qcf-sans{font-family:"Söhne","Inter",system-ui,-apple-system,sans-serif;}'
        "</style>"
    )
    head = "".join(
        [
            text(0, 18, title, 15, INK, weight="600"),
            text(0, 36, subtitle, 11.5, MUTED),
        ]
    )
    foot = text(0, height - 6, source, 9.5, MUTED)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VIEW_W} {height}" '
        f'role="img" aria-label="{html.escape(title, quote=True)}. {html.escape(subtitle, quote=True)}" '
        f'preserveAspectRatio="xMidYMid meet">'
        f"<title>{esc(title)}</title>{style}{head}{body}{foot}</svg>"
    )


def load() -> dict[str, pl.DataFrame]:
    return {
        name: pl.read_parquet(DATA_DIR / f"{name}.parquet")
        for name in ("macrofiscal", "demography", "productivity")
    }


# --------------------------------------------------------------------------


def _series(macro: pl.DataFrame, iso: str, column: str, since: int = 0) -> list[tuple[float, float]]:
    rows = (
        macro.filter((pl.col("iso3c") == iso) & (pl.col("years") >= since))
        .select("years", column)
        .drop_nulls()
        .sort("years")
    )
    return list(zip(rows["years"].to_list(), rows[column].to_list()))


def figure_country_context(data: dict[str, pl.DataFrame]) -> str:
    macro = data["macrofiscal"]
    height, right = 300, 84
    panel = Panel(46, 62, VIEW_W - 46 - right, height - 118, (2001, 2029), (0, 110))
    ticks = [0, 25, 50, 75, 100]
    body = [panel.clip(), panel.forecast_band(FIRST_FORECAST_YEAR)]
    body.append(panel.grid(ticks, unit="%"))
    body.append(panel.x_axis([2001, 2008, 2015, 2022, 2029]))
    for (iso, name), colour in zip(COUNTRIES, SERIES):
        points = _series(macro, iso, "debt_to_gdp")
        body.append(panel.line(points, colour))
        body.append(panel.end_label(points, name, colour))
    body.append(panel.flush_labels())
    return frame(
        height,
        "What the tool loads when you pick a country",
        "General government gross debt, percent of GDP. The figure you sanity-check on the Baseline chart is the last of these.",
        "Source: IMF World Economic Outlook, October 2024, as bundled with Q-CRAFT Explorer. Shaded years are the forecast.",
        "".join(body),
    )


def figure_demography_variants(data: dict[str, pl.DataFrame]) -> str:
    demo = data["demography"]
    height = 300
    gap, left, right = 30, 50, 14
    panel_w = (VIEW_W - left - right - 2 * gap) / 3
    body: list[str] = []
    ylim, ticks = (20, 500), [25, 50, 100, 200, 400]
    for index, (iso, name) in enumerate(COUNTRIES):
        px = left + index * (panel_w + gap)
        panel = Panel(px, 68, panel_w, height - 122, (2024, 2100), ylim, log=True)
        body.append(panel.clip())
        body.append(panel.grid(ticks, labels=index == 0))
        body.append(panel.x_axis([2024, 2060, 2100]))
        body.append(text(px, 60, name, 12.5, INK, weight="600"))
        variants = {}
        for variant in ("Low", "Medium", "High"):
            rows = (
                demo.filter(
                    (pl.col("iso3c") == iso)
                    & (pl.col("age_group") == "15-64")
                    & (pl.col("status") == variant)
                    & (pl.col("years") >= 2024)
                )
                .select("years", "values")
                .sort("years")
            )
            base = rows["values"][0]
            variants[variant] = [
                (year, value / base * 100)
                for year, value in zip(rows["years"].to_list(), rows["values"].to_list())
            ]
        spread = [
            (year, low, high)
            for (year, low), (_, high) in zip(variants["Low"], variants["High"])
        ]
        body.append(panel.band(spread, VARIANT_COLOUR["Medium"]))
        for variant in ("Low", "High", "Medium"):
            width = 2.2 if variant == "Medium" else 1.4
            body.append(panel.line(variants[variant], VARIANT_COLOUR[variant], width))
        if index == 0:
            for variant in ("High", "Medium", "Low"):
                last = variants[variant][-1]
                body.append(
                    text(
                        panel.px(last[0]) - 4,
                        panel.py(last[1]) + 3.5,
                        variant,
                        10,
                        INK,
                        weight="600",
                        anchor="end",
                        halo=True,
                    )
                )
    return frame(
        height,
        "The three UN variants, on three different demographies",
        "Population aged 15 to 64, indexed to 100 in 2024, on a log scale. The gap is the uncertainty you choose inside.",
        "Source: UN World Population Prospects 2022, as bundled with Q-CRAFT Explorer. Medium is the tool's default.",
        "".join(body),
    )


def figure_rigidity_record(data: dict[str, pl.DataFrame]) -> str:
    macro = data["macrofiscal"]
    height = 312
    gap, left, right = 30, 50, 14
    panel_w = (VIEW_W - left - right - 2 * gap) / 3
    body: list[str] = []
    ticks = [10, 15, 20, 25]
    for index, (iso, name) in enumerate(COUNTRIES):
        px = left + index * (panel_w + gap)
        panel = Panel(px, 84, panel_w, height - 138, (2001, 2029), (6, 28))
        body.append(panel.clip())
        body.append(panel.forecast_band(FIRST_FORECAST_YEAR, "WEO"))
        body.append(panel.grid(ticks, labels=index == 0, unit="%"))
        body.append(panel.x_axis([2001, 2015, 2029]))
        body.append(text(px, 76, name, 12.5, INK, weight="600"))
        for column, colour in (
            ("primary_expenditure_percent_gdp", SERIES[1]),
            ("revenue_percent_gdp", SERIES[0]),
        ):
            body.append(panel.line(_series(macro, iso, column), colour))
    body.append(
        "".join(
            [
                f'<circle cx="4" cy="54" r="3.6" fill="{SERIES[1]}"/>',
                text(13, 58, "primary expenditure", 11, INK, weight="600"),
                f'<circle cx="128" cy="54" r="3.6" fill="{SERIES[0]}"/>',
                text(137, 58, "revenue", 11, INK, weight="600"),
            ]
        )
    )
    return frame(
        height,
        "How far spending has actually moved with GDP",
        "Both as a percent of GDP. Where the two ratios drift apart, spending is not tracking the economy.",
        "Source: IMF World Economic Outlook, October 2024. Shaded years are the forecast.",
        "".join(body),
    )


def figure_productivity(data: dict[str, pl.DataFrame]) -> str:
    prod = data["productivity"]
    height, right = 290, 84
    panel = Panel(46, 62, VIEW_W - 46 - right, height - 118, (1996, 2022), (-3, 9))
    body = [panel.clip(), panel.grid([-3, 0, 3, 6, 9], unit="%")]
    body.append(panel.x_axis([1996, 2004, 2012, 2022]))
    for (iso, name), colour in zip(COUNTRIES, SERIES):
        rows = (
            prod.filter(pl.col("iso3c") == iso)
            .select("years", "productivity_level")
            .drop_nulls()
            .sort("years")
            .with_columns(
                (
                    (pl.col("productivity_level") / pl.col("productivity_level").shift(1) - 1)
                    * 100
                ).alias("growth")
            )
            .with_columns(pl.col("growth").rolling_mean(window_size=5).alias("smoothed"))
            .filter(pl.col("years") >= 1996)
            .drop_nulls("smoothed")
        )
        points = list(zip(rows["years"].to_list(), rows["smoothed"].to_list()))
        body.append(panel.line(points, colour))
        body.append(panel.end_label(points, name, colour))
    body.append(panel.rule(1.2, "the tool's long-run default, 1.2 percent"))
    body.append(panel.flush_labels())
    return frame(
        height,
        "What output per worker has actually done",
        "Growth in GDP per employed person, five-year trailing average. The Explorer default slides every country from 5.0 percent to 1.2 percent.",
        "Source: World Bank World Development Indicators, as bundled with Q-CRAFT Explorer.",
        "".join(body),
    )


def figure_inflation(data: dict[str, pl.DataFrame]) -> str:
    macro = data["macrofiscal"]
    height, right = 290, 84
    panel = Panel(46, 62, VIEW_W - 46 - right, height - 118, (2001, 2029), (-5, 35))
    body = [panel.clip(), panel.forecast_band(FIRST_FORECAST_YEAR)]
    body.append(panel.grid([0, 10, 20, 30], unit="%"))
    body.append(panel.x_axis([2001, 2008, 2015, 2022, 2029]))
    for (iso, name), colour in zip(COUNTRIES, SERIES):
        points = _series(macro, iso, "gdp_deflator_growth_percent")
        body.append(panel.line(points, colour))
        body.append(panel.end_label(points, name, colour))
    body.append(panel.rule(3.5, "the tool's long-run default, 3.5 percent"))
    body.append(panel.flush_labels())
    return frame(
        height,
        "What the price path has actually done",
        "GDP deflator growth, percent a year. The Explorer default slides every country from 5.0 percent to 3.5 percent.",
        "Source: IMF World Economic Outlook, October 2024. Shaded years are the forecast.",
        "".join(body),
    )


CAPTIONS = {
    "param-country-context": (
        "Three countries the tool already holds data for. Debt ratios differ by more "
        "than a factor of three across them, which is why the first thing you do "
        "after selecting a country is check the number the Baseline chart reports."
    ),
    "param-demography-variants": (
        "The demography control picks one of these three lines. In a country whose "
        "working-age population is still climbing the variants separate slowly. In "
        "one where it has turned down, the choice between Low and High is the "
        "difference between a workforce at a quarter of today's and one at three "
        "quarters."
    ),
    "param-rigidity-record": (
        "Rigidity is a claim about how these two lines move together. Where "
        "expenditure holds its share of GDP while revenue falls, the budget has "
        "behaved as though rigidity is high."
    ),
    "param-productivity": (
        "The Explorer default slides productivity growth from 5.0 percent to 1.2 percent "
        "for every country. Set that path against what output per worker has actually "
        "done before you quote a result that depends on it."
    ),
    "param-inflation": (
        "The Explorer default slides inflation from 5.0 percent to 3.5 percent for every "
        "country. The three records here start in very different places, which is what "
        "the single default is averaging over."
    ),
}


def include_snippet(name: str, svg: str) -> str:
    """Inline SVG for the HTML book, the rasterised PNG everywhere else."""
    caption = CAPTIONS[name]
    return (
        "<!-- Generated by scripts/build_parameter_context.py. Do not edit by hand. -->\n\n"
        "```{=html}\n"
        '<figure class="qc-fig">\n'
        f"{svg}\n"
        f"<figcaption>{esc(caption)}</figcaption>\n"
        "</figure>\n"
        "```\n\n"
        '::: {.content-hidden when-format="html"}\n'
        f"![{caption}](figures/{name}.png)\n"
        ":::\n"
    )


FIGURES = {
    "param-country-context": figure_country_context,
    "param-demography-variants": figure_demography_variants,
    "param-rigidity-record": figure_rigidity_record,
    "param-productivity": figure_productivity,
    "param-inflation": figure_inflation,
}


def main() -> None:
    if not DATA_DIR.exists():
        msg = (
            f"{DATA_DIR} is missing. These figures read the same processed Parquet "
            "inputs the Explorer runs on."
        )
        raise FileNotFoundError(msg)
    FIG_DIR.mkdir(parents=True, exist_ok=True)
    data = load()
    for name, build in FIGURES.items():
        svg = build(data)
        (FIG_DIR / f"{name}.svg").write_text(svg + "\n")
        (FIG_DIR / f"_{name}.qmd").write_text(include_snippet(name, svg))
        print(f"wrote {name}.svg and its include")


if __name__ == "__main__":
    main()
