"""Build the module exhibits: one or two figures per module, hand-authored SVG.

Prose is the wrong medium for a pipeline, a decision rule, a threshold or a
side-by-side comparison. Larkin and Simon's point is that a diagram wins exactly
where the reader would otherwise have to mentally simulate structure, and each
figure here sits on a passage where that was happening.

The design language is the deck's, rendered on the course palette and the
bundled open faces: tinted panels, ink banner headers, numbered circles and
condensed capital labels. The deck reaches for Söhne Schmal Kräftig for the
caps; there is no condensed face in the open set, so the caps here are Inter
SemiBold with tracking opened up, which is the same device in the type the
repository can actually ship.

Eleven figures come out:

    m0-paths               the three routes, and the one module a path drops
    m1-ten-minutes         zero to a projection, in six moves
    m1-parity              the parity pipeline, and the two claims it supports
    m2-equation-annotated  the debt dynamics equation, term by term
    m2-scoreboard          three percentage points of differential, ten years
    m3-controls            which of the three numbers each control moves
    m4-seven-steps         the sanity check as a gate rather than a step
    m4-fan-readings        three readings of the same fan chart, on real output
    m5-exclusions          one channel modelled, six not, all one direction
    m5-debt-floor          why a floored baseline breaks the vertical gap
    m6-packet              what you hand over, and how it is marked

Two of them are drawn from data in this repository rather than from assertion:
m2-scoreboard iterates the debt dynamics equation directly, and m4-fan-readings
reads the golden-master Uganda run under
packages/qcraft-engine/tests/golden_masters/.

Run from the repository root:

    python3 scripts/build_exhibits.py

Then rasterise for the PDF with scripts/rasterise_figures.py.
"""

from __future__ import annotations

import csv
import html
import math
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
FIG_DIR = REPO_ROOT / "docs" / "companion-guide" / "figures"
GOLDEN = REPO_ROOT / "packages" / "qcraft-engine" / "tests" / "golden_masters"

VIEW_W = 680

# The course palette, from docs/companion-guide/_custom.css.
INK = "#2C3E50"
ACCENT = "#1ABC9C"
ACCENT_DARK = "#16A085"
MUTED = "#63757F"
LINE = "#CBD5DB"
SOFT = "#F5F7F9"
TINT = "#E7F6F2"
PANEL_LINE = "#E1E7EB"
GRID = "#E6EBEF"
AXIS = "#C4CED5"
WHITE = "#FFFFFF"

# Reference categorical slots, validated all-pairs on a white surface in
# scripts/build_parameter_context.py.
BLUE = "#2a78d6"
ORANGE = "#eb6834"
GREEN = "#1baf7a"
RED = "#C0392B"
AMBER = "#C9871F"

# Matching pale tints for the annotated equation, light enough to carry ink.
BLUE_TINT = "#E3EEFB"
ORANGE_TINT = "#FBEBE2"
GREEN_TINT = "#E2F4EE"


# --------------------------------------------------------------------------
# Primitives
# --------------------------------------------------------------------------


def esc(value: str) -> str:
    return html.escape(value, quote=False)


def approx_width(text: str, size: float, tracking: float = 0.0) -> float:
    """Rough advance width, for sizing a banner or a chip to its label."""
    return len(text) * (size * 0.58 + tracking)


def box(x: float, y: float, w: float, h: float) -> dict:
    return {"x": x, "y": y, "w": w, "h": h, "cx": x + w / 2, "cy": y + h / 2}


def rect(
    b: dict,
    fill: str,
    stroke: str = "none",
    r: float = 5,
    width: float = 1.3,
    dash: str = "",
) -> str:
    dashed = f' stroke-dasharray="{dash}"' if dash else ""
    return (
        f'<rect x="{b["x"]:.1f}" y="{b["y"]:.1f}" width="{b["w"]:.1f}" '
        f'height="{b["h"]:.1f}" rx="{r}" ry="{r}" fill="{fill}" stroke="{stroke}" '
        f'stroke-width="{width}"{dashed}/>'
    )


def text(
    x: float,
    y: float,
    content: str,
    size: float,
    fill: str,
    weight: str = "400",
    anchor: str = "start",
    cls: str = "qcx-sans",
    italic: bool = False,
    tracking: float = 0.0,
    halo: bool = False,
) -> str:
    style = ' font-style="italic"' if italic else ""
    track = f' letter-spacing="{tracking}"' if tracking else ""
    relief = ' stroke="#FFFFFF" stroke-width="3.5" paint-order="stroke"' if halo else ""
    return (
        f'<text class="{cls}" x="{x:.1f}" y="{y:.1f}" font-size="{size}" '
        f'font-weight="{weight}" fill="{fill}" text-anchor="{anchor}"'
        f"{style}{track}{relief}>{esc(content)}</text>"
    )


def caps(
    x: float,
    y: float,
    content: str,
    size: float = 9.5,
    fill: str = MUTED,
    anchor: str = "start",
) -> str:
    """The condensed all-caps label, in the open stack: tracking does the work."""
    return text(
        x, y, content.upper(), size, fill, weight="600", anchor=anchor, tracking=1.4
    )


def banner(x: float, y: float, content: str, w: float | None = None) -> str:
    """The ink banner header: a filled bar carrying a caps label."""
    label = content.upper()
    width = w if w is not None else approx_width(label, 10.5, 1.6) + 24
    b = box(x, y, width, 24)
    return rect(b, INK, r=3) + caps(x + 12, y + 16, content, 10.5, WHITE)


def circ(cx: float, cy: float, n: str, r: float = 11, fill: str = ACCENT) -> str:
    """The numbered circle."""
    return (
        f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r}" fill="{fill}"/>'
        + text(cx, cy + 4.2, n, r * 1.05, WHITE, weight="600", anchor="middle")
    )


def arrow(
    x1: float, y1: float, x2: float, y2: float, colour: str = LINE, width: float = 1.5
) -> str:
    marker = "qcx-head" if colour == LINE else "qcx-head-accent"
    return (
        f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
        f'stroke="{colour}" stroke-width="{width}" marker-end="url(#{marker})"/>'
    )


def elbow(pts: list[tuple[float, float]], colour: str = LINE, dash: str = "") -> str:
    d = " ".join(("M" if i == 0 else "L") + f"{x:.1f} {y:.1f}" for i, (x, y) in enumerate(pts))
    marker = "qcx-head" if colour == LINE else "qcx-head-accent"
    dashed = f' stroke-dasharray="{dash}"' if dash else ""
    return (
        f'<path d="{d}" fill="none" stroke="{colour}" stroke-width="1.5"'
        f'{dashed} marker-end="url(#{marker})"/>'
    )


def frame(
    height: float, title: str, subtitle: str, source: str | list[str], body: str
) -> str:
    """The same head-and-foot the M3 source figures use, so all the course
    figures read as one family."""
    style = (
        "<style>"
        '.qcx-sans{font-family:"Söhne","Inter",system-ui,-apple-system,sans-serif;}'
        '.qcx-serif{font-family:"Tiempos Headline","IBM Plex Serif",Georgia,serif;}'
        "</style>"
    )
    defs = (
        "<defs>"
        f'<marker id="qcx-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" '
        f'markerHeight="6" orient="auto-start-reverse">'
        f'<path d="M 0 1 L 9 5 L 0 9 z" fill="{LINE}"/></marker>'
        f'<marker id="qcx-head-accent" viewBox="0 0 10 10" refX="9" refY="5" '
        f'markerWidth="6" markerHeight="6" orient="auto-start-reverse">'
        f'<path d="M 0 1 L 9 5 L 0 9 z" fill="{ACCENT_DARK}"/></marker>'
        f'<marker id="qcx-head-red" viewBox="0 0 10 10" refX="9" refY="5" '
        f'markerWidth="6" markerHeight="6" orient="auto-start-reverse">'
        f'<path d="M 0 1 L 9 5 L 0 9 z" fill="{RED}"/></marker>'
        "</defs>"
    )
    head = text(0, 18, title, 15, INK, weight="600") + text(0, 36, subtitle, 11.5, MUTED)
    source_lines = [source] if isinstance(source, str) else list(source)
    foot = "".join(
        text(0, height - 6 - 13 * (len(source_lines) - 1 - i), line, 9.5, MUTED)
        for i, line in enumerate(source_lines)
    )
    alt = f"{title}. {subtitle}"
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VIEW_W} {height}" '
        f'role="img" aria-label="{html.escape(alt, quote=True)}" '
        f'preserveAspectRatio="xMidYMid meet">'
        f"<title>{esc(title)}</title>{defs}{style}{head}{body}{foot}</svg>"
    )


def stacked(x: float, y: float, lines: list[str], size: float, fill: str,
            leading: float, weight: str = "400", anchor: str = "start") -> str:
    return "".join(
        text(x, y + i * leading, line, size, fill, weight=weight, anchor=anchor)
        for i, line in enumerate(lines)
    )


# --------------------------------------------------------------------------
# A small plotting panel, for the two data figures
# --------------------------------------------------------------------------


class Panel:
    def __init__(self, x, y, w, h, xlim, ylim) -> None:
        self.x, self.y, self.w, self.h = x, y, w, h
        self.xlim, self.ylim = xlim, ylim

    def px(self, v: float) -> float:
        lo, hi = self.xlim
        return self.x + (v - lo) / (hi - lo) * self.w

    def py(self, v: float) -> float:
        lo, hi = self.ylim
        return self.y + self.h - (v - lo) / (hi - lo) * self.h

    def grid(self, ticks: list[float], unit: str = "") -> str:
        out = []
        for v in ticks:
            yy = self.py(v)
            out.append(
                f'<line x1="{self.x:.1f}" y1="{yy:.1f}" x2="{self.x + self.w:.1f}" '
                f'y2="{yy:.1f}" stroke="{GRID}" stroke-width="1"/>'
            )
            out.append(text(self.x - 7, yy + 3.5, f"{v:g}{unit}", 10, MUTED, anchor="end"))
        return "".join(out)

    def x_axis(self, ticks: list[int]) -> str:
        base = self.y + self.h
        out = [
            f'<line x1="{self.x:.1f}" y1="{base:.1f}" x2="{self.x + self.w:.1f}" '
            f'y2="{base:.1f}" stroke="{AXIS}" stroke-width="1"/>'
        ]
        for v in ticks:
            out.append(text(self.px(v), base + 15, str(v), 10, MUTED, anchor="middle"))
        return "".join(out)

    def line(self, points, colour: str, width: float = 2, dash: str = "") -> str:
        drawn = " ".join(f"{self.px(x):.1f},{self.py(y):.1f}" for x, y in points)
        dashed = f' stroke-dasharray="{dash}"' if dash else ""
        return (
            f'<polyline points="{drawn}" fill="none" stroke="{colour}" '
            f'stroke-width="{width}" stroke-linejoin="round" stroke-linecap="round"'
            f"{dashed}/>"
        )

    def band(self, points, colour: str, opacity: float = 0.10) -> str:
        top = " ".join(f"{self.px(x):.1f},{self.py(hi):.1f}" for x, _, hi in points)
        bot = " ".join(
            f"{self.px(x):.1f},{self.py(lo):.1f}" for x, lo, _ in reversed(points)
        )
        return (
            f'<polygon points="{top} {bot}" fill="{colour}" fill-opacity="{opacity}"/>'
        )


# --------------------------------------------------------------------------
# M0: the three routes
# --------------------------------------------------------------------------

MODULES = ["M0", "M1", "M2", "M3", "M4", "M5", "M6"]
# full, part or skip, per path.
# Module 2 assembles the whole tool, so no path drops it. What the faster
# paths drop is its Step 1, which is revision for anyone who already owns the
# debt dynamics equation.
ROUTES = [
    ("A. Guided", "5 to 6 hours", ["full"] * 7),
    ("B. Standard", "3 to 4 hours", ["full", "full", "part", "full", "full", "full", "full"]),
    ("C. Fast", "2 hours", ["full", "part", "part", "part", "full", "full", "full"]),
]


def figure_paths() -> str:
    height = 254
    label_w, chip_w, gap = 96, 62, 6
    left = 104
    top = 74
    row_h, row_gap = 38, 10
    body: list[str] = []

    body.append(banner(0, 48, "Your route"))
    for i, name in enumerate(MODULES):
        x = left + i * (chip_w + gap)
        body.append(caps(x + chip_w / 2, 66, name, 9.5, MUTED, anchor="middle"))
    body.append(caps(VIEW_W, 66, "Time", 9.5, MUTED, anchor="end"))

    for r, (name, hours, states) in enumerate(ROUTES):
        y = top + r * (row_h + row_gap)
        body.append(text(0, y + 24, name, 12, INK, weight="600"))
        for i, state in enumerate(states):
            x = left + i * (chip_w + gap)
            b = box(x, y, chip_w, row_h)
            if state == "full":
                body.append(rect(b, ACCENT, ACCENT_DARK, r=5))
                body.append(text(b["cx"], y + 23, "read", 10.5, WHITE, weight="600", anchor="middle"))
            elif state == "part":
                body.append(rect(b, TINT, ACCENT, r=5))
                body.append(text(b["cx"], y + 23, "in part", 10.5, ACCENT_DARK, weight="600", anchor="middle"))
            else:
                body.append(rect(b, WHITE, LINE, r=5, dash="4 3"))
                body.append(text(b["cx"], y + 23, "skip", 10.5, MUTED, anchor="middle"))
        body.append(text(VIEW_W, y + 24, hours, 11, MUTED, anchor="end"))

    # The one column that separates the paths.
    m2x = left + 2 * (chip_w + gap)
    body.insert(
        0,
        f'<rect x="{m2x - 5}" y="{top - 22}" width="{chip_w + 10}" '
        f'height="{3 * row_h + 2 * row_gap + 26}" rx="6" fill="{SOFT}"/>',
    )
    body.append(
        text(
            m2x + chip_w / 2,
            top + 3 * row_h + 2 * row_gap + 20,
            "the only module a path drops",
            9.5,
            MUTED,
            anchor="middle",
        )
    )
    return frame(
        height,
        "No path skips a module, and the faster ones read three in part",
        "Every path arrives at the same capstone. Only the guided path rebuilds the debt dynamics equation from scratch.",
        "Route yourself with the self-assessment above. Every module also carries its own fast path, for the day you have twenty minutes.",
        "".join(body),
    )


# --------------------------------------------------------------------------
# M1: zero to a projection
# --------------------------------------------------------------------------

TEN_MINUTE_STOPS = [
    ("Sidebar", ["1", "2"], 176, [
        "Pick a country. WEO and",
        "UN series load themselves.",
        "Check the debt ratio and",
        "population it reports.",
    ]),
    ("Baseline tab", ["3"], 118, [
        "The path with no",
        "climate damage.",
        "Note the 2099",
        "debt ratio.",
    ]),
    ("Climate tab", ["4"], 118, [
        "Six warming",
        "scenarios, and",
        "what each does",
        "to GDP.",
    ]),
    ("Analysis tab", ["5"], 118, [
        "Both on one chart.",
        "The vertical gap is",
        "what your paragraph",
        "will be about.",
    ]),
    ("Data tab", ["6"], 118, [
        "Download both",
        "CSVs. Keep them.",
        "This is capstone",
        "material.",
    ]),
]


def figure_ten_minutes() -> str:
    height = 268
    top, panel_h, gap = 62, 132, 8
    x = 0
    body: list[str] = []
    centres: list[float] = []
    for name, numbers, w, lines in TEN_MINUTE_STOPS:
        b = box(x, top, w, panel_h)
        body.append(rect(b, SOFT, PANEL_LINE, r=6))
        body.append(caps(x + 12, top + 20, name, 9.5, MUTED))
        for i, n in enumerate(numbers):
            body.append(circ(x + 23 + i * 30, top + 46, n, r=11))
        body.append(stacked(x + 12, top + 76, lines, 9.5, INK, 13))
        centres.append(x + w)
        x += w + gap
    # The spine, drawn between the panels.
    for cx in centres[:-1]:
        body.append(arrow(cx + 1, top + 46, cx + gap - 1, top + 46))

    strip = box(0, top + panel_h + 14, VIEW_W, 26)
    body.append(rect(strip, TINT, r=4))
    body.append(
        text(
            12,
            top + panel_h + 31,
            "About ten minutes, five clicks, and nothing explained yet. The explanation lands better on something you have already seen move.",
            10.5,
            INK,
        )
    )
    return frame(
        height,
        "Six moves, and the last one is already capstone material",
        "Run the tool before you read how it works. The two CSVs from step 6 are the first page of your export packet.",
        "Q-CRAFT Explorer, sidebar and four tabs. The parameters you leave alone in this run are the subject of Module 3.",
        "".join(body),
    )


# --------------------------------------------------------------------------
# M1: the parity pipeline and what the two claims cover
# --------------------------------------------------------------------------


def figure_parity() -> str:
    height = 306
    body: list[str] = []
    body.append(banner(0, 48, "How the check works"))

    lane_y = {"excel": 86, "python": 130}
    inputs = box(0, 96, 104, 54)
    body.append(rect(inputs, ACCENT, ACCENT_DARK, r=6))
    body.append(text(inputs["cx"], 118, "Same", 12, WHITE, weight="600", anchor="middle"))
    body.append(text(inputs["cx"], 133, "inputs", 12, WHITE, weight="600", anchor="middle"))

    engines = [
        ("excel", "IMF Excel workbook", "the original"),
        ("python", "Python engine", "the reimplementation"),
    ]
    for key, name, note in engines:
        b = box(148, lane_y[key], 190, 38)
        body.append(rect(b, WHITE, LINE, r=6))
        body.append(text(b["x"] + 12, lane_y[key] + 17, name, 11.5, INK, weight="600"))
        body.append(text(b["x"] + 12, lane_y[key] + 31, note, 10, MUTED))
        body.append(elbow([(104, 123), (126, 123), (126, lane_y[key] + 19), (144, lane_y[key] + 19)]))
        body.append(elbow([(338, lane_y[key] + 19), (368, lane_y[key] + 19), (368, 123), (382, 123)]))

    compare = box(386, 96, 104, 54)
    body.append(rect(compare, SOFT, PANEL_LINE, r=6))
    body.append(text(compare["cx"], 116, "Compare", 11.5, INK, weight="600", anchor="middle"))
    body.append(text(compare["cx"], 131, "every output cell,", 9.5, MUTED, anchor="middle"))
    body.append(text(compare["cx"], 143, "every year", 9.5, MUTED, anchor="middle"))
    body.append(arrow(490, 123, 528, 123))

    verdict = box(532, 96, 148, 54)
    body.append(rect(verdict, WHITE, LINE, r=6))
    body.append(text(verdict["cx"], 116, "One number differs,", 10, MUTED, anchor="middle"))
    body.append(text(verdict["cx"], 129, "the test fails", 10, MUTED, anchor="middle"))
    body.append(text(verdict["cx"], 143, "and we investigate", 10, MUTED, anchor="middle"))

    # What the two claims cover.
    body.append(banner(0, 172, "What the two claims cover"))
    bar_x, bar_w = 250, 300
    claims = [
        (
            208,
            "Baseline",
            "exact, 147 of 147 tested countries",
            1.0,
            ACCENT,
            "debt, revenue, primary balance and primary expenditure, all as shares of GDP",
        ),
        (
            254,
            "Climate scenarios",
            "confirmed for ratio metrics only",
            0.62,
            AMBER,
            "levels are not established: check a level figure against the workbook yourself",
        ),
    ]
    for y, name, note, share, colour, foot in claims:
        body.append(text(0, y + 4, name, 11.5, INK, weight="600"))
        body.append(text(0, y + 18, note, 9.5, MUTED))
        body.append(rect(box(bar_x, y - 8, bar_w, 15), SOFT, r=3))
        body.append(rect(box(bar_x, y - 8, bar_w * share, 15), colour, r=3))
        body.append(text(bar_x, y + 20, foot, 9.5, MUTED))
    return frame(
        height,
        "The baseline claim is wider than the climate claim",
        "Identical inputs go through both engines and every output cell is compared. What survives the comparison is what you may quote.",
        "Source: the golden-master test suite in this repository, run on every change. The bars show coverage of the claim, not a pass rate.",
        "".join(body),
    )


# --------------------------------------------------------------------------
# M2: the equation, term by term
# --------------------------------------------------------------------------


# --------------------------------------------------------------------------
# M2: the scoreboard, run for ten years
# --------------------------------------------------------------------------

SCOREBOARD = [
    (0.09, 0.06, ORANGE, "r 9%, g 6%", "interest wins"),
    (0.06, 0.06, MUTED, "r 6%, g 6%", "dead heat"),
    (0.06, 0.09, BLUE, "r 6%, g 9%", "growth wins"),
]


def figure_scoreboard() -> str:
    height = 282
    panel = Panel(40, 62, VIEW_W - 40 - 132, height - 118, (0, 10), (30, 70))
    body = [panel.grid([30, 40, 50, 60, 70], unit="%"), panel.x_axis([0, 2, 4, 6, 8, 10])]
    body.append(caps(panel.x + 6, panel.y + 14, "all three start at 50 percent of GDP", 9, MUTED))
    body.append(text(panel.x + 6, panel.y + 28, "with a primary balance of exactly zero in every one of the ten years", 9.5, MUTED))
    for r, g, colour, rule, verdict in SCOREBOARD:
        points, d = [(0, 50.0)], 50.0
        for t in range(1, 11):
            d = d * (1 + r) / (1 + g)
            points.append((t, d))
        body.append(panel.line(points, colour, 2.4))
        ex, ey = panel.px(10), panel.py(points[-1][1])
        body.append(f'<circle cx="{ex:.1f}" cy="{ey:.1f}" r="3.2" fill="{colour}" stroke="{WHITE}" stroke-width="2"/>')
        body.append(text(ex + 9, ey - 2, f"{points[-1][1]:.1f}", 13, colour, weight="600"))
        body.append(text(ex + 9, ey + 11, rule, 10, INK))
        body.append(text(ex + 9, ey + 23, verdict, 10, MUTED))
    return frame(
        height,
        "Three percentage points of differential, held for ten years",
        "The same zero primary balance ends at 66, at 50 or at 38, depending only on which of r and g is larger.",
        [
            "The debt dynamics equation iterated ten times with the primary balance held at zero, so only the",
            "scoreboard term is moving. No policy decision about spending appears anywhere in it.",
        ],
        "".join(body),
    )


# --------------------------------------------------------------------------
# M2: the chapter's own figures
#
# scripts/build_m2_series.py writes the engine's output into figures/series/.
# Nothing below asserts a projected number; every plotted point comes back out
# of one of those CSVs, so a reader can check any mark against a file.
# --------------------------------------------------------------------------

SERIES = FIG_DIR / "series"

# The chapter's semantic colours. One per number the equation needs, held
# across every figure, so a blue mark always means growth.
G_COLOUR, G_TINT = BLUE, BLUE_TINT
G_LIGHT = "#7FB0E8"
R_COLOUR, R_TINT = ORANGE, ORANGE_TINT
PB_COLOUR, PB_TINT, PB_DARK = AMBER, "#FAF0DC", "#8A6215"
DIM_INK = "#AAB6BE"

# The three Hot variants share one temperature path and differ only in how fast
# the historical norm catches up, so they read as one colour and three dashes.
HOT = RED
PARIS = GREEN

SPINE_ISO, SPINE_NAME = "KEN", "Kenya"
CONTRAST_ISO, CONTRAST_NAME = "THA", "Thailand"


def read_series(name: str) -> list[dict[str, str]]:
    with (SERIES / name).open(encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def debt_paths() -> tuple[list[tuple[int, float]], list[tuple[int, float]]]:
    rows = read_series("m2-debt-paths.csv")
    base = [(int(r["years"]), float(r["baseline"])) for r in rows]
    hot = [(int(r["years"]), float(r["hot"])) for r in rows]
    return base, hot


def trace_at(year: int) -> dict[str, float]:
    for r in read_series("m2-climate-trace.csv"):
        if int(r["years"]) == year:
            return {k: float(v) for k, v in r.items() if k != "years"}
    msg = f"no climate trace for {year}"
    raise KeyError(msg)


def growth_parts(iso: str, year: int) -> dict[str, float]:
    for r in read_series("m2-growth-parts.csv"):
        if r["iso3c"] == iso and int(r["years"]) == year:
            return {k: float(v) for k, v in r.items() if k not in ("iso3c", "years")}
    msg = f"no growth parts for {iso} in {year}"
    raise KeyError(msg)


def figure_cold_open() -> str:
    height = 316
    base, hot = debt_paths()
    panel = Panel(42, 72, VIEW_W - 42 - 118, height - 130, (2024, 2099), (0, 110))
    body = [panel.grid([0, 25, 50, 75, 100], unit="%"), panel.x_axis([2024, 2050, 2075, 2099])]

    # The gap is the subject of the chapter, so it is filled rather than left
    # for the eye to measure between two lines.
    spread = [(y, b, h) for (y, b), (_, h) in zip(base, hot) if y >= 2029]
    body.append(panel.band(spread, HOT, 0.14))

    start = panel.px(2030)
    body.append(
        f'<line x1="{start:.1f}" y1="{panel.y:.1f}" x2="{start:.1f}" '
        f'y2="{panel.y + panel.h:.1f}" stroke="{LINE}" stroke-width="1" '
        f'stroke-dasharray="3 3"/>'
    )
    body.append(text(start + 6, panel.y + 14, "warming starts to bite in 2030", 9.5, MUTED))

    body.append(panel.line(base, INK, 2.2, "5 3"))
    body.append(panel.line(hot, HOT, 2.4))

    for pts, colour, name in ((base, INK, "Baseline"), (hot, HOT, "Hot")):
        ex, ey = panel.px(pts[-1][0]), panel.py(pts[-1][1])
        body.append(
            f'<circle cx="{ex:.1f}" cy="{ey:.1f}" r="3.2" fill="{colour}" '
            f'stroke="{WHITE}" stroke-width="2"/>'
        )
        body.append(text(ex + 9, ey - 1, f"{pts[-1][1]:.0f}%", 13, colour, weight="600"))
        body.append(text(ex + 9, ey + 12, name, 10, colour))

    gap = hot[-1][1] - base[-1][1]
    gx = panel.px(2099) - 30
    y_lo, y_hi = panel.py(base[-1][1]), panel.py(hot[-1][1])
    body.append(
        f'<path d="M{gx - 6} {y_hi:.1f} H{gx:.1f} V{y_lo:.1f} H{gx - 6}" fill="none" '
        f'stroke="{INK}" stroke-width="1.2"/>'
    )
    # The label sits low in the band, clear of the hot line, which passes near
    # the vertical midpoint at this end of the chart.
    label_y = panel.py(base[-1][1] + (hot[-1][1] - base[-1][1]) * 0.26)
    body.append(
        text(gx - 10, label_y, f"{gap:.0f} points", 11.5, INK,
             weight="600", anchor="end", halo=True)
    )
    body.append(text(gx - 10, label_y + 14, "of GDP", 10, MUTED, anchor="end", halo=True))

    return frame(
        height,
        f"By 2099 the hot scenario puts {SPINE_NAME}'s debt {gap:.0f} points of GDP higher",
        "Same country, same starting debt, same equation. This chapter is where that number comes from.",
        [
            f"Source: this repository's engine, {SPINE_NAME} at the Explorer's shipped defaults, from",
            "figures/series/m2-debt-paths.csv. The two runs are identical until 2030.",
        ],
        "".join(body),
    )


# The equation, laid out once and shared by the two figures that annotate it.
EQ_SEGS = [
    ("dt", 40), ("=", 26), ("prev", 62), ("times", 26),
    ("frac", 98), ("minus", 26), ("pb", 56),
]


def equation_layout() -> dict[str, tuple[float, float]]:
    total = sum(w for _, w in EQ_SEGS)
    x = (VIEW_W - total) / 2
    pos: dict[str, tuple[float, float]] = {}
    for key, w in EQ_SEGS:
        pos[key] = (x, w)
        x += w
    return pos


def eq_cx(pos: dict[str, tuple[float, float]], key: str) -> float:
    px, pw = pos[key]
    return px + pw / 2


def equation_glyphs(
    pos: dict[str, tuple[float, float]],
    eq_y: float,
    ink: str = INK,
    r_ink: str | None = None,
    g_ink: str | None = None,
    pb_ink: str | None = None,
) -> str:
    """The symbols themselves. Each of r, g and pb takes its own colour, so a
    figure can light one number and leave the rest grey."""
    size, sub, ser = 30, 18, "qcx-serif"
    out = [
        f'<text class="{ser}" x="{eq_cx(pos, "dt"):.1f}" y="{eq_y}" font-size="{size}" '
        f'fill="{ink}" text-anchor="middle" font-style="italic">d'
        f'<tspan font-size="{sub}" dy="7">t</tspan></text>',
        text(eq_cx(pos, "="), eq_y, "=", size, ink, anchor="middle", cls=ser),
        f'<text class="{ser}" x="{eq_cx(pos, "prev"):.1f}" y="{eq_y}" font-size="{size}" '
        f'fill="{ink}" text-anchor="middle" font-style="italic">d'
        f'<tspan font-size="{sub}" dy="7">t&#8722;1</tspan></text>',
        text(eq_cx(pos, "times"), eq_y, "×", size, ink, anchor="middle", cls=ser),
    ]
    fx = eq_cx(pos, "frac")
    out.append(text(fx, eq_y - 12, "1 + r", 22, r_ink or ink, anchor="middle", cls=ser, italic=True))
    out.append(
        f'<line x1="{fx - 36:.1f}" y1="{eq_y - 5}" x2="{fx + 36:.1f}" y2="{eq_y - 5}" '
        f'stroke="{ink}" stroke-width="1.6"/>'
    )
    out.append(text(fx, eq_y + 18, "1 + g", 22, g_ink or ink, anchor="middle", cls=ser, italic=True))
    out.append(text(eq_cx(pos, "minus"), eq_y, "−", size, ink, anchor="middle", cls=ser))
    out.append(
        f'<text class="{ser}" x="{eq_cx(pos, "pb"):.1f}" y="{eq_y}" font-size="{size}" '
        f'fill="{pb_ink or ink}" text-anchor="middle" font-style="italic">pb'
        f'<tspan font-size="{sub}" dy="7">t</tspan></text>'
    )
    return "".join(out)


def figure_equation_annotated() -> str:
    height = 306
    pos = equation_layout()
    eq_y = 112
    body: list[str] = []

    # The tints land on the three numbers rather than on the three terms. The
    # chapter is organised around where g, r and pb come from, and the colours
    # have to carry that assignment through every later figure.
    fx = eq_cx(pos, "frac")
    body.append(rect(box(fx - 44, eq_y - 34, 88, 27), R_TINT, r=4))
    body.append(rect(box(fx - 44, eq_y - 1, 88, 27), G_TINT, r=4))
    px, pw = pos["pb"]
    body.append(rect(box(px + 2, eq_y - 26, pw - 4, 40), PB_TINT, r=5))

    # The stock you inherit gets a quiet label rather than a colour, because it
    # is not one of the three numbers the rest of the model exists to supply.
    prev_cx = eq_cx(pos, "prev")
    body.append(
        elbow([(prev_cx, eq_y + 26), (prev_cx, eq_y + 38),
               (prev_cx - 104, eq_y + 38), (prev_cx - 104, eq_y + 46)], LINE)
    )
    body.append(text(prev_cx - 104, eq_y + 62, "last year's ratio,", 10, MUTED, anchor="middle"))
    body.append(text(prev_cx - 104, eq_y + 75, "already on the books", 10, MUTED, anchor="middle"))

    body.append(equation_glyphs(pos, eq_y, r_ink=R_COLOUR, g_ink=G_COLOUR, pb_ink=PB_COLOUR))

    col_w, col_gap, top = 216, 16, 200
    columns = [
        (G_COLOUR, "g  growth", [
            "Nominal GDP growth. Step 2a",
            "builds it from employment,",
            "productivity and inflation.",
        ]),
        (R_COLOUR, "r  interest", [
            "The effective rate on the debt",
            "stock. Step 2c picks one of",
            "three rules for it.",
        ]),
        (PB_COLOUR, "pb  primary balance", [
            "Revenue less non-interest",
            "spending. Step 2b is where",
            "the wedge comes from.",
        ]),
    ]
    col_x = 0
    for colour, name, lines in columns:
        body.append(
            f'<line x1="{col_x}" y1="{top}" x2="{col_x + col_w}" y2="{top}" '
            f'stroke="{colour}" stroke-width="2.5"/>'
        )
        body.append(caps(col_x, top + 18, name, 9.5, colour))
        body.append(stacked(col_x, top + 36, lines, 10.5, INK, 14))
        col_x += col_w + col_gap

    return frame(
        height,
        "Give me these three numbers every year and I will give you the debt path",
        "The equation needs g, r and pb. The rest of the model exists to supply them.",
        [
            "Q-CRAFT adds no climate term here. Warming reaches the debt path by lowering g, and by weakening pb",
            "where spending cannot fall to match. Those two arrows are the whole of the climate channel.",
        ],
        "".join(body),
    )


def figure_equation_growth() -> str:
    """The same equation a second time, with only g at full contrast."""
    height = 274
    pos = equation_layout()
    eq_y = 100
    body: list[str] = []
    t = trace_at(2099)

    fx = eq_cx(pos, "frac")
    body.append(rect(box(fx - 44, eq_y - 1, 88, 27), G_TINT, r=4))
    body.append(equation_glyphs(pos, eq_y, ink=DIM_INK, g_ink=G_COLOUR))

    strip = box(200, eq_y + 44, VIEW_W - 400, 28)
    body.append(
        f'<line x1="{fx:.1f}" y1="{eq_y + 28}" x2="{fx:.1f}" y2="{eq_y + 44}" '
        f'stroke="{G_COLOUR}" stroke-width="1.6"/>'
    )
    body.append(rect(strip, G_TINT, r=6))
    body.append(
        text(VIEW_W / 2, strip["y"] + 19, "same equation, new g", 13, G_COLOUR,
             weight="600", anchor="middle")
    )

    cells = [
        ("g, nominal GDP growth in 2099", f"{t['g_baseline']:.2f}%", f"{t['g_hot']:.2f}%", G_COLOUR),
        ("debt ratio in 2099", f"{t['debt_baseline']:.0f}%", f"{t['debt_hot']:.0f}%", INK),
    ]
    cy = strip["y"] + 62
    body.append(caps(268, cy - 13, "baseline", 9, MUTED))
    body.append(caps(372, cy - 13, "hot", 9, HOT))
    for i, (name, a, b, colour) in enumerate(cells):
        yy = cy + i * 24
        body.append(text(0, yy, name, 11, MUTED))
        body.append(text(268, yy, a, 14, colour, weight="600"))
        body.append(text(372, yy, b, 14, HOT, weight="600"))

    drop = t["g_baseline"] - t["g_hot"]
    body.append(text(456, cy - 13, f"{drop:.2f} of a percentage point off", 10.5, INK))
    body.append(text(456, cy + 2, "growth in the final year, and a", 10.5, INK))
    body.append(text(456, cy + 17, "shortfall that has been", 10.5, INK))
    body.append(text(456, cy + 32, "compounding since 2030.", 10.5, INK))

    return frame(
        height,
        "Climate damage changes one symbol, and the symbol is g",
        "The hot run is the same equation with a smaller growth rate, every year from 2030 onward.",
        [
            f"Source: this repository's engine, {SPINE_NAME} at the shipped defaults, from",
            "figures/series/m2-climate-trace.csv.",
        ],
        "".join(body),
    )


def figure_growth_stack() -> str:
    """The growth accounting identity as a running product, for two countries
    whose working-age population is moving in opposite directions."""
    height = 362
    year = 2050
    body: list[str] = []
    pw = (VIEW_W - 30) / 2

    for idx, (iso, name) in enumerate(((SPINE_ISO, SPINE_NAME), (CONTRAST_ISO, CONTRAST_NAME))):
        parts = growth_parts(iso, year)
        left = idx * (pw + 30)
        body.append(banner(left, 52, name, pw))

        panel = Panel(left + 36, 96, pw - 40, 150, (0, 4), (-2, 8))
        body.append(panel.grid([-2, 0, 2, 4, 6, 8], unit=""))
        zero = panel.py(0)
        body.append(
            f'<line x1="{panel.x:.1f}" y1="{zero:.1f}" x2="{panel.x + panel.w:.1f}" '
            f'y2="{zero:.1f}" stroke="{AXIS}" stroke-width="1.2"/>'
        )

        steps = [
            ("Employment", parts["employment_growth"], G_COLOUR),
            ("Productivity", parts["productivity_growth"], G_LIGHT),
            ("Inflation", parts["inflation"], MUTED),
        ]
        running = 0.0
        bar_w = panel.w / 4 * 0.58
        for i, (step_name, value, colour) in enumerate(steps):
            cx = panel.px(i + 0.5)
            top, bottom = running + value, running
            y0, y1 = panel.py(max(top, bottom)), panel.py(min(top, bottom))
            body.append(rect(box(cx - bar_w / 2, y0, bar_w, max(y1 - y0, 1.5)), colour, r=2))
            label_y = y0 - 6 if value >= 0 else y1 + 13
            body.append(
                text(cx, label_y, f"{value:+.2f}", 10, colour, weight="600", anchor="middle", halo=True)
            )
            body.append(text(cx, panel.y + panel.h + 16, step_name, 9, MUTED, anchor="middle"))
            running = top

        total = parts["nominal_gdp_growth"]
        cx = panel.px(3.5)
        y0, y1 = panel.py(max(total, 0)), panel.py(min(total, 0))
        body.append(rect(box(cx - bar_w / 2, y0, bar_w, max(y1 - y0, 1.5)), INK, r=2))
        body.append(text(cx, y0 - 6, f"{total:.2f}", 11, INK, weight="600", anchor="middle", halo=True))
        body.append(text(cx, panel.y + panel.h + 16, "Nominal g", 9, INK, anchor="middle"))

        product = (
            f"({1 + parts['employment_growth'] / 100:.4f}) × "
            f"({1 + parts['productivity_growth'] / 100:.4f}) × "
            f"({1 + parts['inflation'] / 100:.4f})"
        )
        body.append(text(left, panel.y + panel.h + 42, product, 10, MUTED))
        body.append(
            text(left, panel.y + panel.h + 57, f"= {1 + total / 100:.4f},  so g = {total:.2f} percent", 10, INK)
        )

    return frame(
        height,
        "Growth is an accounting identity, and its first term is demography",
        f"Both countries in {year}, on identical productivity and inflation assumptions. Only the workforce differs.",
        [
            "The three parts multiply rather than add, so each bar starts where the one before it finished and the last",
            "bar is computed rather than summed. Source: this repository's engine at the Explorer's shipped defaults,",
            "from figures/series/m2-growth-parts.csv. Employment growth is the UN working-age projection.",
        ],
        "".join(body),
    )


def figure_weo_handoff() -> str:
    height = 262
    body: list[str] = []
    bar_y, bar_h = 104, 36

    def px(year: int) -> float:
        return (year - 2009) / (2099 - 2009) * VIEW_W

    # The bar is drawn to real time, which is the point: the stretch the model
    # drives is four times the stretch anyone has forecast. That leaves the WEO
    # projection band too narrow to label in place, so the names sit in a
    # legend underneath rather than inside the bands.
    zones = [
        (2009, 2024, "#EDF1F4", "Recorded", "what the WEO reports happened"),
        (2024, 2030, "#C3D8EE", "", "the Fund's own forecast, to 2029"),
        (2030, 2099, G_TINT, "The model drives", "your assumptions, compounded to 2099"),
    ]
    for a, b, fill, name, _note in zones:
        zb = box(px(a), bar_y, px(b) - px(a), bar_h)
        body.append(rect(zb, fill, r=4))
        if name:
            body.append(text(px(a) + 10, bar_y + 23, name, 12, INK, weight="600"))

    hand = px(2030)
    body.append(
        f'<line x1="{hand:.1f}" y1="{bar_y - 20:.1f}" x2="{hand:.1f}" '
        f'y2="{bar_y + bar_h:.1f}" stroke="{G_COLOUR}" stroke-width="2"/>'
    )
    body.append(f'<circle cx="{hand:.1f}" cy="{bar_y - 28:.1f}" r="8" fill="{G_COLOUR}"/>')
    body.append(text(hand + 15, bar_y - 24, "the wheel changes hands, once", 11, G_COLOUR, weight="600"))

    for year, anchor in ((2009, "start"), (2024, "middle"), (2030, "middle"),
                         (2050, "middle"), (2075, "middle"), (2099, "end")):
        body.append(text(px(year), bar_y + bar_h + 17, str(year), 9.5, MUTED, anchor=anchor))

    legend_y = bar_y + bar_h + 44
    col_w = (VIEW_W - 24) / 3
    names = ["Recorded", "WEO projection", "The model drives"]
    for i, ((_a, _b, fill, _n, note), name) in enumerate(zip(zones, names)):
        x = i * (col_w + 12)
        body.append(rect(box(x, legend_y - 9, 11, 11), fill, LINE, r=2, width=1))
        body.append(text(x + 18, legend_y, name, 11, INK, weight="600"))
        body.append(text(x + 18, legend_y + 15, note, 9.8, MUTED))

    return frame(
        height,
        "The World Economic Outlook hands the wheel to the model in 2030",
        "Before that year the projection is the Fund's. After it the projection is yours, and it runs for seventy years.",
        [
            "Every scenario is identical before 2030, so the fan in the cold open opens from a single line rather than",
            "from the first year of the chart. Source: Q-CRAFT User Guide (Tim and Rahman, 2024), p. 19. This",
            "repository's engine carries the same year in its PROJ_START constant.",
        ],
        "".join(body),
    )


def figure_primary_balance() -> str:
    height = 380
    rows = read_series("m2-primary-balance.csv")
    rev = [(int(r["years"]), float(r["revenue"])) for r in rows]
    pexp = [(int(r["years"]), float(r["primary_expenditure"])) for r in rows]
    body: list[str] = []

    # The axis is drawn to the data rather than to a round span, because the
    # wedge is only about a point of GDP wide and a loose axis hides it.
    panel = Panel(42, 74, VIEW_W - 42 - 252, 212, (2024, 2099), (16, 23))
    body += [panel.grid([16, 18, 20, 22], unit="%"), panel.x_axis([2024, 2050, 2075, 2099])]
    spread = [(y, min(a, b), max(a, b)) for (y, a), (_, b) in zip(rev, pexp)]
    body.append(panel.band(spread, PB_COLOUR, 0.22))
    body.append(panel.line(rev, GREEN, 2.2))
    body.append(panel.line(pexp, R_COLOUR, 2.2))
    body.append(text(panel.x + 8, panel.py(22.5), "Primary expenditure", 10, R_COLOUR, weight="600", halo=True))
    body.append(text(panel.x + 8, panel.py(16.6), "Revenue", 10, GREEN, weight="600", halo=True))
    body.append(
        text(panel.px(2070), panel.py(19.3), "the wedge is pb", 10.5, PB_DARK,
             weight="600", anchor="middle", halo=True)
    )

    right = VIEW_W - 228
    body.append(banner(right, 54, "Two dials on the wedge", 228))
    dials = [
        ("Fiscal rule", "on / off", [
            "On, the primary balance is pushed",
            "toward whatever holds debt at your",
            "target. Off, it stays where the data",
            "left it.",
        ], PB_COLOUR),
        ("Expenditure rigidity", "1.0 to 0.0", [
            "1.0 holds spending at its baseline",
            "level when GDP falls, so the ratio",
            "rises. 0.0 cuts to hold the ratio.",
            "It moves climate runs only.",
        ], R_COLOUR),
    ]
    dy = 94
    for name, scale, lines, colour in dials:
        b = box(right, dy, 228, 116)
        body.append(rect(b, WHITE, LINE, r=6))
        body.append(
            f'<line x1="{right:.1f}" y1="{dy:.1f}" x2="{right + 228:.1f}" y2="{dy:.1f}" '
            f'stroke="{colour}" stroke-width="2.5"/>'
        )
        body.append(text(right + 12, dy + 22, name, 12, INK, weight="600"))
        body.append(text(right + 12, dy + 37, scale, 10, colour, weight="600"))
        body.append(stacked(right + 12, dy + 55, lines, 9.6, MUTED, 13))
        dy += 128

    return frame(
        height,
        "Revenue rides nominal GDP, spending follows people and prices, and the gap is pb",
        "Neither line is a forecast of policy. Both are rules, and two dials decide how hard the rules bite.",
        [
            f"Source: this repository's engine, {SPINE_NAME} at the shipped defaults, from",
            "figures/series/m2-primary-balance.csv. Both series are percent of GDP.",
        ],
        "".join(body),
    )


RULE_LABELS = {
    "Nominal interest rate": "Nominal",
    "Interest-growth differential": "Differential",
    "Real interest rate": "Real",
}


def figure_interest_rules() -> str:
    height = 356
    rows = read_series("m2-interest-rules.csv")
    body: list[str] = []
    rules = [
        ("Nominal interest rate", R_COLOUR, ""),
        ("Interest-growth differential", "#C77F5C", "6 3"),
        ("Real interest rate", PB_DARK, "2 3"),
    ]
    panel = Panel(42, 78, VIEW_W - 42 - 250, 210, (2029, 2099), (0, 9.6))
    body += [panel.grid([0, 3, 6, 9], unit="%"), panel.x_axis([2029, 2050, 2075, 2099])]
    body.append(caps(panel.x, 68, "the effective rate on the debt stock", 8, MUTED))

    summary: list[tuple[str, str, float, float]] = []
    for rule, colour, dash in rules:
        pts = [
            (int(r["years"]), float(r["nominal_interest_rate"]))
            for r in rows
            if r["rule"] == rule and int(r["years"]) >= 2029
        ]
        body.append(panel.line(pts, colour, 2.2, dash))
        ex, ey = panel.px(2099), panel.py(pts[-1][1])
        body.append(f'<circle cx="{ex:.1f}" cy="{ey:.1f}" r="3" fill="{colour}"/>')
        body.append(text(ex + 7, ey + 3.5, f"{pts[-1][1]:.1f}%", 11, colour, weight="600"))
        final = [r for r in rows if r["rule"] == rule and int(r["years"]) == 2099][0]
        summary.append((rule, colour, float(final["debt_baseline"]), float(final["debt_hot"])))

    right = VIEW_W - 186
    body.append(banner(right, 60, "Debt in 2099", 186))
    body.append(caps(right + 74, 108, "baseline", 8, MUTED, anchor="end"))
    body.append(caps(right + 168, 108, "hot", 8, HOT, anchor="end"))
    for i, (rule, colour, base, hot) in enumerate(summary):
        yy = 132 + i * 50
        body.append(text(right, yy, RULE_LABELS[rule], 10.5, colour, weight="600"))
        body.append(text(right + 74, yy + 22, f"{base:.0f}%", 15, INK, weight="600", anchor="end"))
        body.append(text(right + 168, yy + 22, f"{hot:.0f}%", 15, HOT, weight="600", anchor="end"))

    return frame(
        height,
        "Three rules for r, and they disagree about the end of the century",
        f"{SPINE_NAME} on identical assumptions everywhere else. Only the rule that projects the interest rate changes.",
        [
            "Three defensible readings of the same debt stock, and a thirty-point spread in what the hot scenario costs.",
            f"Source: this repository's engine, {SPINE_NAME} at the shipped defaults with the rate rule varied, from",
            "figures/series/m2-interest-rules.csv. The three rules are the ones in User Guide Section IV.A.",
        ],
        "".join(body),
    )


# Kahn et al. (2021), Specification 2, HPJ-FE: the long-run effect on per
# capita growth of a persistent above-norm rise of 0.01 degrees a year, at each
# of the three window widths the paper tests.
KAHN_COEF = {20: 0.0504, 30: 0.0543, 40: 0.0486}
# Q-CRAFT's own window widths, from User Guide pp. 35-36.
QCRAFT_WINDOWS = {"Hot Adapted": 20, "Hot": 30, "Hot Unadapted": 50}


def figure_climate_panels() -> str:
    height = 362
    body: list[str] = []
    gap, inset = 22, 16
    pw = (VIEW_W - 2 * gap - inset) / 3

    # ---- Panel 1: temperature against two moving norms -------------------
    left = 0.0
    body.append(banner(left, 50, "1. what the model sees", pw))
    body.append(caps(left, 88, "degrees above today, by year", 8, MUTED))
    p1 = Panel(left + 32, 96, pw - 36, 144, (0, 60), (0, 2.0))
    body.append(p1.grid([0, 0.5, 1.0, 1.5, 2.0], unit="°"))
    body.append(p1.x_axis([0, 30, 60]))
    rate = 0.03  # degrees a year, a stylised path steeper than most trends

    def norm(window: int) -> list[tuple[float, float]]:
        return [
            (t, sum(rate * max(t - s, 0) for s in range(1, window + 1)) / window)
            for t in range(0, 61)
        ]

    temp = [(t, rate * t) for t in range(0, 61)]
    n30, n50 = norm(30), norm(50)
    body.append(p1.band([(t, n30[t][1], temp[t][1]) for t in range(0, 61)], R_COLOUR, 0.16))
    body.append(p1.line(temp, R_COLOUR, 2.2))
    body.append(p1.line(n30, MUTED, 1.8, "5 3"))
    body.append(p1.line(n50, MUTED, 1.8, "2 3"))
    body.append(text(p1.px(2), p1.py(1.78), "temperature", 9.5, R_COLOUR, weight="600"))
    body.append(text(p1.px(34), p1.py(0.62), "30-year norm", 9, MUTED, halo=True))
    body.append(text(p1.px(34), p1.py(0.20), "50-year norm", 9, MUTED, halo=True))
    # Dead centre of the band, computed rather than eyeballed: the band is
    # only about a third of a degree wide and the label fills most of it.
    mid_t = 48
    mid_v = (temp[mid_t][1] + n30[mid_t][1]) / 2
    body.append(
        text(p1.px(mid_t), p1.py(mid_v) + 3.5, "deviation", 9.5, "#8A2B1E",
             weight="600", anchor="middle", halo=True)
    )
    body.append(text(left, p1.y + p1.h + 36, "Heat itself is neutral. The gap", 9.8, INK))
    body.append(text(left, p1.y + p1.h + 49, "between this year and the norm", 9.8, INK))
    body.append(text(left, p1.y + p1.h + 62, "does the work. A slower norm", 9.8, INK))
    body.append(text(left, p1.y + p1.h + 75, "leaves a wider gap.", 9.8, INK))

    # ---- Panel 2: deviation to growth drag -------------------------------
    left = pw + gap
    body.append(banner(left, 50, "2. what a degree costs", pw))
    body.append(caps(left, 88, "points off growth, by deviation", 8, MUTED))
    p2 = Panel(left + 36, 96, pw - 40, 144, (0, 0.04), (0, 0.25))
    body.append(p2.grid([0, 0.05, 0.10, 0.15, 0.20], unit=""))
    axis_y = p2.y + p2.h
    body.append(
        f'<line x1="{p2.x:.1f}" y1="{axis_y:.1f}" x2="{p2.x + p2.w:.1f}" '
        f'y2="{axis_y:.1f}" stroke="{AXIS}" stroke-width="1"/>'
    )
    for v, lab in ((0.0, "0"), (0.01, "0.01"), (0.02, "0.02"), (0.03, "0.03"), (0.04, "0.04")):
        body.append(text(p2.px(v), axis_y + 15, lab, 8.5, MUTED, anchor="middle"))
    slope = KAHN_COEF[30] / 0.01
    body.append(p2.line([(0, 0), (0.04, 0.04 * slope)], G_COLOUR, 2.4))
    mx, my = p2.px(0.01), p2.py(KAHN_COEF[30])
    body.append(
        f'<line x1="{p2.x:.1f}" y1="{my:.1f}" x2="{mx:.1f}" y2="{my:.1f}" '
        f'stroke="{G_COLOUR}" stroke-width="1" stroke-dasharray="3 3"/>'
    )
    body.append(
        f'<line x1="{mx:.1f}" y1="{my:.1f}" x2="{mx:.1f}" y2="{axis_y:.1f}" '
        f'stroke="{G_COLOUR}" stroke-width="1" stroke-dasharray="3 3"/>'
    )
    body.append(f'<circle cx="{mx:.1f}" cy="{my:.1f}" r="3.6" fill="{G_COLOUR}" stroke="{WHITE}" stroke-width="2"/>')
    body.append(text(mx + 8, my - 5, "0.054 points off", 9.5, G_COLOUR, weight="600"))
    body.append(text(mx + 8, my + 8, "growth, every year", 9, MUTED))
    body.append(text(left, axis_y + 36, "Degrees a year above the norm run", 9.8, MUTED))
    body.append(text(left, axis_y + 49, "along the bottom. One response rate", 9.8, MUTED))
    body.append(text(left, axis_y + 62, "for the whole panel: your exposure", 9.8, INK))
    body.append(text(left, axis_y + 75, "varies, this slope does not.", 9.8, INK))

    # ---- Panel 3: scenarios to shortfall paths ---------------------------
    left = 2 * (pw + gap)
    body.append(banner(left, 50, "3. what q-craft consumes", pw))
    body.append(caps(left, 88, "percent of gdp, by year", 8, MUTED))
    rows = read_series("m2-climate-drag.csv")
    p3 = Panel(left + 36, 96, pw - 40, 144, (2029, 2099), (-7.5, 1.0))
    body.append(p3.grid([-6, -4, -2, 0], unit="%"))
    body.append(p3.x_axis([2029, 2060, 2099]))
    drag_styles = [
        ("Paris", PARIS, 1.8, "", "Paris"),
        ("Hot_Adapted", HOT, 1.6, "1 3", "adapted"),
        ("Hot", HOT, 2.4, "", "Hot"),
        ("Hot_Unadapted", HOT, 1.8, "6 3", "unadapted"),
    ]
    for scenario, colour, width, dash, name in drag_styles:
        pts = [(int(r["years"]), float(r["gdp_loss_percent"])) for r in rows if r["scenario"] == scenario]
        body.append(p3.line(pts, colour, width, dash))
        body.append(
            text(p3.px(2099) - 4, p3.py(pts[-1][1]) + 3.5, name, 9, colour,
                 weight="600", anchor="end", halo=True)
        )
    body.append(text(left, p3.y + p3.h + 36, "Cumulative shortfall in GDP against", 9.8, MUTED))
    body.append(text(left, p3.y + p3.h + 49, f"the baseline, {SPINE_NAME}. One line per", 9.8, MUTED))
    body.append(text(left, p3.y + p3.h + 62, "scenario, handed to the model as a", 9.8, INK))
    body.append(text(left, p3.y + p3.h + 75, "cut to productivity growth.", 9.8, INK))

    return frame(
        height,
        "A deviation, one response rate, and a shortfall path for every scenario",
        "The three moves that turn a global panel regression into a number your own projection can use.",
        [
            "Sources: Kahn, Mohaddes, Ng, Pesaran, Raissi and Yang (2021), Energy Economics 104, 105624, for panels 1",
            f"and 2. Panel 3 is the FADCP-derived climate table in this repository, {SPINE_NAME}, from m2-climate-drag.csv.",
        ],
        "".join(body),
    )


# --------------------------------------------------------------------------
# M3: which number each control moves
# --------------------------------------------------------------------------


def figure_controls() -> str:
    height = 410
    body: list[str] = []
    body.append(banner(0, 46, "What you set"))
    body.append(banner(460, 46, "What it moves"))
    body.append(text(0, 82, "One control loads the data. Four shape the projection.", 9.5, MUTED))

    chip_w, chip_h, chip_gap, chip_top = 244, 42, 10, 92
    chips = [
        ("1", "Country", "loads every series behind all three", True),
        ("2", "Demography variant", "working-age moves growth, total moves spending", False),
        ("3", "Debt target", "does nothing until the rule is on", False),
        ("4", "Fiscal rule", "on or off", False),
        ("5", "Expenditure rigidity", "changes the climate runs, never the baseline", False),
    ]
    chip_mid = {}
    for i, (n, name, note, loader) in enumerate(chips):
        y = chip_top + i * (chip_h + chip_gap)
        b = box(0, y, chip_w, chip_h)
        body.append(rect(b, TINT if loader else WHITE, ACCENT if loader else LINE, r=6))
        body.append(circ(21, y + chip_h / 2, n, r=11))
        body.append(text(40, y + 18, name, 11.5, INK, weight="600"))
        body.append(text(40, y + 32, note, 9, MUTED))
        chip_mid[n] = y + chip_h / 2

    tgt_x, tgt_w, tgt_h = 460, 220, 64
    targets = {
        "g": (92, "Growth", "g", True, "you can move this"),
        "r": (185, "Interest rate", "r", False, "nothing in V1 reaches it"),
        "pb": (278, "Primary balance", "pb", True, "you can move this"),
    }
    tgt_mid = {}
    for key, (y, name, sym, lit, note) in targets.items():
        b = box(tgt_x, y, tgt_w, tgt_h)
        body.append(rect(b, ACCENT if lit else WHITE, ACCENT_DARK if lit else LINE, r=6))
        body.append(
            f'<text class="qcx-sans" x="{b["cx"]:.1f}" y="{y + 27}" font-size="13.5" '
            f'font-weight="600" fill="{WHITE if lit else INK}" text-anchor="middle">'
            f'{esc(name)}<tspan class="qcx-serif" font-style="italic" font-weight="400" '
            f'dx="6">{esc(sym)}</tspan></text>'
        )
        body.append(text(b["cx"], y + 46, note, 10, "#DFF6F0" if lit else MUTED, anchor="middle"))
        tgt_mid[key] = y + tgt_h / 2

    # One trunk per destination. Demography goes up to growth, the three
    # spending controls merge and go into the primary balance.
    bus = 330
    body.append(elbow([(chip_w + 4, chip_mid["2"]), (bus, chip_mid["2"]), (bus, tgt_mid["g"]), (tgt_x - 6, tgt_mid["g"])], ACCENT_DARK))
    for n in ("3", "4", "5"):
        body.append(
            f'<path d="M{chip_w + 4} {chip_mid[n]:.1f} H{bus} V{tgt_mid["pb"]:.1f}" '
            f'fill="none" stroke="{ACCENT_DARK}" stroke-width="1.5"/>'
        )
    body.append(arrow(bus, tgt_mid["pb"], tgt_x - 6, tgt_mid["pb"], ACCENT_DARK))
    body.append(text(bus + 6, tgt_mid["g"] - 8, "employment growth", 9, MUTED))
    body.append(text(bus + 6, tgt_mid["pb"] - 8, "the spending side", 9, MUTED))

    # What V1 leaves at the workbook's defaults, stated rather than wired.
    strip = box(0, 344, VIEW_W, 26)
    body.append(rect(strip, SOFT, PANEL_LINE, r=4))
    body.append(caps(12, 361, "At the Excel tool\u2019s defaults", 9, MUTED))
    body.append(text(212, 361, "productivity and inflation, which feed growth, and the rate rule, which is all of the interest rate", 10, INK))

    return frame(
        height,
        "Four of the five controls land on growth or the primary balance",
        "Nothing you can set in V1 reaches the interest rate.",
        [
            "Q-CRAFT Explorer V1 sidebar. A result that turns on the interest rate assumption needs that stated in",
            "your write-up, because you did not choose it.",
        ],
        "".join(body),
    )


# --------------------------------------------------------------------------
# M4: the sanity check is a gate
# --------------------------------------------------------------------------


def figure_seven_steps() -> str:
    height = 282
    body: list[str] = []
    body.append(banner(0, 46, "Before the gate"))
    body.append(banner(478, 46, "After it"))

    before = [
        ("1", "Set the parameters", ["and write down why,", "before any output"]),
        ("2", "Read the Baseline tab", ["three charts, no", "climate damage yet"]),
    ]
    for i, (n, name, lines) in enumerate(before):
        y = 90 + i * 76
        b = box(0, y, 216, 64)
        body.append(rect(b, WHITE, LINE, r=6))
        body.append(circ(22, y + 22, n, r=11))
        body.append(text(40, y + 26, name, 11.5, INK, weight="600"))
        body.append(stacked(14, y + 44, lines, 9.5, MUTED, 12))
        body.append(arrow(220, y + 32, 244, y + 32))

    gate = box(250, 84, 210, 152)
    body.append(rect(gate, TINT, ACCENT, r=6, width=1.8))
    body.append(circ(272, 108, "3", r=12))
    body.append(text(292, 112, "Baseline Sanity Check", 11.5, INK, weight="600"))
    checks = [
        "Does the starting debt match?",
        "Is revenue-to-GDP plausible?",
        "Does the expenditure path make sense?",
        "If the rule is on, does debt converge?",
        "Do the balance paths fit the record?",
    ]
    for i, item in enumerate(checks):
        y = 138 + i * 17
        body.append(rect(box(264, y - 8, 9, 9), WHITE, ACCENT_DARK, r=2))
        body.append(text(280, y, item, 9.5, INK))
    body.append(text(gate["cx"], 228, "five questions someone will ask you", 9, MUTED, anchor="middle"))

    after = [
        ("4", "Read the Climate tab", "what warming does to GDP"),
        ("5", "Read the Analysis tab", "the gap, the threshold, the shape"),
        ("6", "Export the packet", "both CSVs, plus your rationale"),
        ("7", "Write the two paragraphs", "in your ministry's own register"),
    ]
    for i, (n, name, note) in enumerate(after):
        y = 80 + i * 42
        b = box(478, y, 202, 36)
        body.append(rect(b, WHITE, LINE, r=6))
        body.append(circ(496, y + 18, n, r=10))
        body.append(text(512, y + 15, name, 11, INK, weight="600"))
        body.append(text(512, y + 28, note, 9, MUTED))
        if i:
            body.append(arrow(579, y - 6, 579, y - 1))
    body.append(elbow([(464, 160), (471, 160), (471, 98), (474, 98)], ACCENT_DARK))

    return frame(
        height,
        "Step 3 is a gate, not a step",
        "A climate result computed on a baseline nobody checked is a number with no owner.",
        [
            "The four steps on the right are only worth doing once the five boxes are answered. The gate applies to",
            "your own country, and to every rerun after a parameter changes. Note any box you skipped, and why.",
        ],
        "".join(body),
    )


# --------------------------------------------------------------------------
# M4: three readings of the same fan chart, on the golden-master run
# --------------------------------------------------------------------------

FAN_SERIES = [
    ("fiscal/uganda.csv", "Baseline", INK, 2.2, "5 3"),
    ("climate/paris_uganda.csv", "Paris", BLUE, 1.8, ""),
    ("climate/hot_uganda.csv", "Hot", AMBER, 1.8, ""),
    ("climate/hot_unadapted_uganda.csv", "Hot Unadapted", RED, 2.2, ""),
]
BAND_FILES = [
    "fiscal/uganda.csv",
    "climate/paris_uganda.csv",
    "climate/moderate_uganda.csv",
    "climate/high_uganda.csv",
    "climate/hot_uganda.csv",
    "climate/hot_adapted_uganda.csv",
    "climate/hot_unadapted_uganda.csv",
]
CEILING = 50.0


def read_debt(rel: str) -> list[tuple[int, float]]:
    rows = list(csv.DictReader((GOLDEN / "intermediate" / rel).open(encoding="utf-8")))
    out = [
        (int(r["years"]), float(r["debt_to_gdp"]))
        for r in rows
        if int(r["years"]) >= 2023
    ]
    out.sort()
    return out


def figure_fan_readings() -> str:
    height = 314
    series = {name: read_debt(rel) for rel, name, _c, _w, _d in FAN_SERIES}
    everything = [read_debt(rel) for rel in BAND_FILES]
    years = [y for y, _ in everything[0]]
    spread = [
        (y, min(s[i][1] for s in everything), max(s[i][1] for s in everything))
        for i, y in enumerate(years)
    ]
    hot_un = series["Hot Unadapted"]
    # The series opens above the ceiling on WEO history and falls back under it
    # within a few years, so the crossing that matters is the upward one after
    # the climate damage starts.
    crossing = next(
        y
        for (prev_y, prev_v), (y, v) in zip(hot_un, hot_un[1:])
        if y > 2030 and prev_v <= CEILING < v
    )

    panel = Panel(40, 66, VIEW_W - 40 - 116, height - 122, (2023, 2099), (0, 140))
    body = [panel.grid([0, 25, 50, 75, 100, 125], unit="%"), panel.x_axis([2023, 2050, 2075, 2099])]
    body.append(panel.band(spread, ACCENT, 0.09))

    # Reading 2, the threshold, sits under the lines.
    cy = panel.py(CEILING)
    body.append(
        f'<line x1="{panel.x:.1f}" y1="{cy:.1f}" x2="{panel.x + panel.w:.1f}" '
        f'y2="{cy:.1f}" stroke="{RED}" stroke-width="1.2" stroke-dasharray="5 3"/>'
    )
    body.append(text(panel.x + 6, cy - 6, "a 50 percent of GDP fiscal rule ceiling", 9.5, RED, halo=True))

    for rel, name, colour, width, dash in FAN_SERIES:
        pts = series[name]
        body.append(panel.line(pts, colour, width, dash))
        ex, ey = panel.px(pts[-1][0]), panel.py(pts[-1][1])
        body.append(f'<circle cx="{ex:.1f}" cy="{ey:.1f}" r="2.8" fill="{colour}"/>')
        body.append(text(ex + 7, ey + 3.5, f"{name} {pts[-1][1]:.0f}", 10, colour, weight="600"))

    # Reading 1, the gap.
    base_end = series["Baseline"][-1][1]
    hot_end = series["Hot Unadapted"][-1][1]
    gx = panel.px(2099) - 26
    y_lo, y_hi = panel.py(base_end), panel.py(hot_end)
    body.append(
        f'<path d="M{gx - 5} {y_hi} H{gx} V{y_lo} H{gx - 5}" fill="none" '
        f'stroke="{INK}" stroke-width="1.2"/>'
    )
    body.append(text(gx - 9, (y_lo + y_hi) / 2 + 3.5, f"{hot_end - base_end:.0f} points", 10, INK, weight="600", anchor="end", halo=True))
    body.append(caps(gx - 9, (y_lo + y_hi) / 2 - 9, "1. the gap", 9, MUTED, anchor="end") if False else text(gx - 9, (y_lo + y_hi) / 2 - 9, "1. THE GAP", 9, MUTED, weight="600", anchor="end", tracking=1.4, halo=True))

    # Reading 2 label, at the crossing.
    cxp = panel.px(crossing)
    body.append(f'<circle cx="{cxp:.1f}" cy="{cy:.1f}" r="3.6" fill="{RED}" stroke="{WHITE}" stroke-width="2"/>')
    body.append(text(cxp - 8, cy + 17, f"2. CROSSED IN {crossing}", 9, RED, weight="600", anchor="end", tracking=1.4, halo=True))

    # Reading 3, the shape.
    sx = panel.px(2030)
    body.append(
        f'<line x1="{sx:.1f}" y1="{panel.y:.1f}" x2="{sx:.1f}" '
        f'y2="{panel.y + panel.h:.1f}" stroke="{LINE}" stroke-width="1" stroke-dasharray="3 3"/>'
    )
    body.append(caps(sx + 6, panel.y + 14, "3. the shape", 9, MUTED))
    body.append(text(sx + 6, panel.y + 27, "identical until 2030, then the fan opens", 9.5, MUTED))

    return frame(
        height,
        "Three readings, and the second one moves a conversation",
        "The gap is the headline. The threshold crossing is what converts a projection into a breach of a commitment that already exists.",
        [
            "Source: the golden-master Uganda run in this repository, on WEO October 2024 at the tool's defaults.",
            "The shaded band is the spread across all seven runs, not a probability range.",
        ],
        "".join(body),
    )


# --------------------------------------------------------------------------
# M5: one channel in, six out
# --------------------------------------------------------------------------

CHANNEL = ["Warming", "Productivity", "Growth", "Revenue", "Debt"]
EXCLUDED = [
    ("Natural disasters", "p. 5"),
    ("Sea-level rise", "p. 5"),
    ("Tipping points", "p. 5"),
    ("Non-market damages", "p. 5"),
    ("Spillover effects", "p. 5"),
    ("Adaptation spending", "p. 6"),
]


def figure_exclusions() -> str:
    height = 340
    body: list[str] = []

    body.append(banner(0, 48, "In the model"))
    step_w, step_h, gap = 116, 40, 14
    for i, name in enumerate(CHANNEL):
        x = i * (step_w + gap)
        b = box(x, 84, step_w, step_h)
        body.append(rect(b, ACCENT, ACCENT_DARK, r=6))
        body.append(text(b["cx"], 108, name, 11.5, WHITE, weight="600", anchor="middle"))
        if i:
            body.append(arrow(x - gap + 2, 104, x - 3, 104, ACCENT_DARK))
    body.append(text(0, 138, "One channel, estimated from cross-country data, then pushed through arithmetic a reviewer can check line by line.", 10, MUTED))

    body.append(banner(0, 154, "Outside the model"))
    ex_w, ex_h, ex_gap = 216, 34, 8
    for i, (name, page) in enumerate(EXCLUDED):
        col, row = i % 3, i // 3
        x = col * (ex_w + ex_gap)
        y = 190 + row * (ex_h + ex_gap)
        b = box(x, y, ex_w, ex_h)
        body.append(rect(b, WHITE, LINE, r=6, dash="4 3"))
        body.append(text(x + 12, y + 22, name, 11, INK))
        body.append(text(x + ex_w - 12, y + 22, f"User Guide, {page}", 9, MUTED, anchor="end"))

    strip_y = 190 + 2 * (ex_h + ex_gap) + 4
    body.append(rect(box(0, strip_y, VIEW_W, 24), SOFT, r=4))
    body.append(
        f'<path d="M12 {strip_y + 12} H{VIEW_W - 20}" stroke="{RED}" stroke-width="1.6" '
        f'marker-end="url(#qcx-head-red)"/>'
    )
    body.append(
        text(
            VIEW_W / 2,
            strip_y + 16,
            "every one of the six is a cost left out, so all six push the fiscal impact the same way",
            10,
            RED,
            weight="600",
            anchor="middle",
            halo=True,
        )
    )
    return frame(
        height,
        "One channel is modelled, six are not, and all six point the same way",
        "The direction is what makes the list usable: the modelled impact is a lower bound rather than a central estimate of the total.",
        [
            "Source: Q-CRAFT User Guide, pp. 5-6, which names all six. Say it yourself in the write-up, in the same",
            "paragraph as the headline number, before a reviewer says it for you.",
        ],
        "".join(body),
    )


# --------------------------------------------------------------------------
# M5: the debt floor asymmetry
# --------------------------------------------------------------------------


def figure_debt_floor() -> str:
    height = 306
    body: list[str] = []
    pw = (VIEW_W - 26) / 2

    def curve(slope: float) -> list[tuple[float, float]]:
        return [(t, 34 - slope * (t / 10) ** 1.5 * 40) for t in range(0, 11)]

    # The baseline is the one heading furthest below zero, because it takes no
    # climate damage. Clipping it at zero is what puts it above the climate
    # lines and inverts the picture.
    baseline = curve(1.3)
    climate = curve(1.05)
    floored = [(t, max(0.0, v)) for t, v in baseline]

    for side in (0, 1):
        px = 0 if side == 0 else pw + 26
        heading = "What the chart shows" if side == 0 else "What is happening"
        note = (
            "the climate line sits below the baseline, which cannot be right"
            if side == 0
            else "one line is clipped at zero and the other is not"
        )
        panel = Panel(px + 36, 92, pw - 46, 112, (0, 10), (-22, 40))
        body.append(caps(px, 66, f"{side + 1}. {heading}", 9.5, MUTED))
        body.append(panel.grid([-20, 0, 20, 40], unit="%"))
        zero = panel.py(0)
        body.append(
            f'<line x1="{panel.x:.1f}" y1="{zero:.1f}" x2="{panel.x + panel.w:.1f}" '
            f'y2="{zero:.1f}" stroke="{AXIS}" stroke-width="1.2"/>'
        )
        if side == 1:
            body.append(panel.line(baseline, INK, 1.5, "5 3"))
        body.append(panel.line(climate, RED, 2.2))
        body.append(panel.line(floored, INK, 2.4))
        body.append(text(panel.px(3.4), panel.py(6), "baseline, clipped", 9.5, INK, halo=True))
        body.append(text(panel.px(0.4), panel.py(-8), "climate scenario", 9.5, RED, halo=True))
        if side == 0:
            gx = panel.px(9.2)
            body.append(
                f'<path d="M{gx - 4} {zero:.1f} H{gx} V{panel.py(climate[9][1]):.1f} '
                f'H{gx - 4}" fill="none" stroke="{RED}" stroke-width="1.2"/>'
            )
            body.append(text(gx - 7, zero - 7, "reads backwards", 9, RED, weight="600", anchor="end", halo=True))
        else:
            body.append(text(panel.px(0.4), panel.py(-19), "the dashed line is where the baseline goes", 9.5, MUTED, halo=True))
        body.append(text(px, 232, note, 9.5, MUTED))

    rule = box(0, 246, VIEW_W, 26)
    body.append(rect(rule, TINT, r=4))
    body.append(
        text(
            12,
            263,
            "The reading rule: if any line in your fan touches zero, stop using the vertical gap as your headline number.",
            10.5,
            INK,
            weight="600",
        )
    )
    return frame(
        height,
        "A floored baseline makes the vertical gap read backwards",
        "Baseline debt is floored at zero. The climate scenarios are not, and may run negative into net asset positions.",
        [
            "Schematic, drawn to show the rule rather than a country. It bites only where a projection drives debt",
            "to zero, which takes a strongly favourable interest-growth differential held for seventy years.",
        ],
        "".join(body),
    )


# --------------------------------------------------------------------------
# M6: the packet, and how it is marked
# --------------------------------------------------------------------------

PACKET = [
    ("1", "The export packet", [
        "the parameter table, one rationale a line",
        "the data vintage, stated",
        "both CSVs, baseline and all scenarios",
        "at least two sensitivity runs",
    ]),
    ("2", "The two-paragraph draft", [
        "in your ministry's own register",
        "every number a comparison, never a forecast",
        "the caveat beside the headline number",
    ]),
    ("3", "Three challenge answers", [
        "“Is this a forecast?”",
        "“Why that rigidity value?”",
        "“So this is what climate will cost us?”",
    ]),
]
# Ordered so the two criteria that are marked before a number is read sit next
# to each other, which is what the sixty percent rule underneath refers to.
RUBRIC = [
    ("Assumptions defended", 40, ACCENT),
    ("Baseline checked", 20, AMBER),
    ("Interpretation", 25, BLUE),
    ("Written for the reader", 15, MUTED),
]


def figure_packet() -> str:
    height = 356
    body: list[str] = []
    body.append(banner(0, 46, "What you hand over"))
    x = 0
    col_w, gap = 216, 16
    for n, name, lines in PACKET:
        b = box(x, 84, col_w, 128)
        body.append(rect(b, SOFT, PANEL_LINE, r=6))
        body.append(circ(x + 22, 106, n, r=11))
        body.append(text(x + 40, 110, name, 11.5, INK, weight="600"))
        for i, item in enumerate(lines):
            yy = 134 + i * 20
            body.append(f'<circle cx="{x + 16}" cy="{yy - 3.5}" r="2.2" fill="{ACCENT}"/>')
            body.append(text(x + 26, yy, item, 9.5, INK))
        x += col_w + gap

    body.append(banner(0, 224, "How it is marked"))
    bar_y, bar_h = 272, 22
    px = 0.0
    for name, weight, colour in RUBRIC:
        w = VIEW_W * weight / 100
        body.append(rect(box(px, bar_y, w - 2, bar_h), colour, r=3))
        body.append(text(px + w / 2 - 1, bar_y + 15, f"{weight}%", 11, WHITE, weight="600", anchor="middle"))
        body.append(text(px, bar_y - 8, name, 9.5, INK, weight="600"))
        px += w
    sixty = VIEW_W * 0.6 - 2
    body.append(
        f'<line x1="0" y1="{bar_y + bar_h + 6}" x2="{sixty:.1f}" '
        f'y2="{bar_y + bar_h + 6}" stroke="{ACCENT_DARK}" stroke-width="2.5"/>'
    )
    body.append(text(0, bar_y + bar_h + 21, "sixty percent is marked before anyone reads a number you produced", 9.5, ACCENT_DARK, weight="600"))
    return frame(
        height,
        "Sixty percent of the mark is the assumptions and the baseline",
        "The capstone is marked on whether you can defend the analysis, never on whether your numbers match anyone else's.",
        [
            "Weights as proposed in the rubric above, which is a draft rather than a decision. The disqualifying",
            "error sits outside the weights: reporting the adaptation gap as the value of adaptation.",
        ],
        "".join(body),
    )


# --------------------------------------------------------------------------

CAPTIONS = {
    "m0-paths": (
        "What the faster paths abridge is always the same thing: material that "
        "rebuilds economics you may already have. Nothing about running the tool, "
        "reading its output or defending an assumption is dropped on any route."
    ),
    "m1-ten-minutes": (
        "Nothing here is explained, on purpose. Both prediction and explanation land "
        "better on a chart you have already watched move, which is why the reading "
        "starts after the clicking."
    ),
    "m1-parity": (
        "The bars are drawn to the reach of each claim rather than to a pass rate. Both "
        "claims passed. One of them was simply asked a narrower question."
    ),
    "m2-cold-open": (
        "Both runs load the same country data and start from the same debt stock. The "
        "gap is what a single assumption about warming does once it has seventy years "
        "to compound, and every step of this chapter is a piece of it."
    ),
    "m2-equation-annotated": (
        "The first term is not one of the three. Last year's ratio is a stock you "
        "inherit, so the only things a projection has to manufacture are the growth "
        "rate, the interest rate and the primary balance."
    ),
    "m2-equation-growth": (
        "Nothing structural changes between a baseline and a climate run. The model "
        "recomputes the same line with a smaller growth rate, which is why reading a "
        "climate result always means comparing two runs rather than reading one."
    ),
    "m2-growth-stack": (
        "The productivity and inflation assumptions are the tool's defaults and are "
        "identical across the two panels, so the whole of the difference in the final "
        "bar is the working-age population. Demography is not a detail here; it is the "
        "first term."
    ),
    "m2-weo-handoff": (
        "The handover is why a Q-CRAFT result is not a forecast. For the first twenty "
        "years you are reading the Fund's projection, and for the seventy after it you "
        "are reading your own assumptions compounded."
    ),
    "m2-primary-balance": (
        "Revenue is a fixed share of GDP by assumption, so it cannot rescue a projection "
        "on its own. Everything interesting in the wedge happens on the spending line, "
        "which is where both dials act."
    ),
    "m2-interest-rules": (
        "The rule is the assumption that moves the climate answer most, and it is the "
        "one the Explorer does not yet expose. If you need the other two, that is a "
        "reason to run the workbook alongside it."
    ),
    "m2-climate-panels": (
        "Panel two is the one to argue with. A single response rate for every country "
        "is what makes the estimate portable, and it is also what makes it a floor "
        "rather than a country-specific answer."
    ),
    "m2-scoreboard": (
        "The middle line is the only place on this chart where a zero primary balance "
        "holds the ratio still, and it needs r and g to be exactly equal. Every other "
        "position moves the ratio with nobody borrowing for a new programme."
    ),
    "m3-controls": (
        "Demography is the one control that arrives in two places, because working-age "
        "population drives growth while total population drives spending. Productivity, "
        "inflation and the whole of the interest rate sit at the workbook's defaults."
    ),
    "m4-seven-steps": (
        "Steps 1 and 2 produce a baseline. Steps 4 to 7 spend it. The five boxes in the "
        "middle are the only thing standing between the two, and each one is a question "
        "a reviewer will ask you anyway."
    ),
    "m4-fan-readings": (
        "These are the Explorer's own numbers, on its current bundled data at its default "
        "settings. They run well above the published 2023 workshop figures quoted in "
        "this module, and the whole of that difference is vintage and parameter choice."
    ),
    "m5-exclusions": (
        "Each exclusion carries the User Guide page that documents it, so the list is "
        "quotable in a footnote without further research. What runs across the top is "
        "everything that is left."
    ),
    "m5-debt-floor": (
        "The floor is a deliberate choice rather than a bug. Flooring the climate "
        "scenarios too would compress exactly the range the tool exists to show, so the "
        "asymmetry stays and the interpretive burden lands on you."
    ),
    "m6-packet": (
        "Nobody is marking whether your 2099 number matches a published one. The one "
        "thing that fails a capstone outright sits outside the weights entirely: "
        "reporting the adaptation gap as the value of adaptation."
    ),
}

FIGURES = {
    "m0-paths": figure_paths,
    "m1-ten-minutes": figure_ten_minutes,
    "m1-parity": figure_parity,
    "m2-cold-open": figure_cold_open,
    "m2-equation-annotated": figure_equation_annotated,
    "m2-scoreboard": figure_scoreboard,
    "m2-growth-stack": figure_growth_stack,
    "m2-weo-handoff": figure_weo_handoff,
    "m2-primary-balance": figure_primary_balance,
    "m2-interest-rules": figure_interest_rules,
    "m2-climate-panels": figure_climate_panels,
    "m2-equation-growth": figure_equation_growth,
    "m3-controls": figure_controls,
    "m4-seven-steps": figure_seven_steps,
    "m4-fan-readings": figure_fan_readings,
    "m5-exclusions": figure_exclusions,
    "m5-debt-floor": figure_debt_floor,
    "m6-packet": figure_packet,
}


def include_snippet(name: str, svg: str) -> str:
    """Inline SVG for the HTML book, the rasterised PNG everywhere else."""
    caption = CAPTIONS[name]
    return (
        "<!-- Generated by scripts/build_exhibits.py. Do not edit by hand. -->\n\n"
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


def main() -> None:
    FIG_DIR.mkdir(parents=True, exist_ok=True)
    for name, build in FIGURES.items():
        svg = build()
        (FIG_DIR / f"{name}.svg").write_text(svg + "\n")
        (FIG_DIR / f"_{name}.qmd").write_text(include_snippet(name, svg))
        print(f"wrote {name}.svg and its include")


if __name__ == "__main__":
    main()
