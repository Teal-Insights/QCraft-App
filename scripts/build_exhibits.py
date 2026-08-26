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
ROUTES = [
    ("A. Guided", "5 to 6 hours", ["full"] * 7),
    ("B. Standard", "3 to 4 hours", ["full", "full", "skip", "full", "full", "full", "full"]),
    ("C. Fast", "2 hours", ["full", "part", "skip", "part", "full", "full", "full"]),
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
        "The three paths differ by one module and two abridgements",
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


def figure_equation_annotated() -> str:
    height = 276
    body: list[str] = []
    eq_y = 108
    size = 30
    sub = 18

    # Segment widths, laid out by hand so the highlights land on the terms.
    segs = [
        ("dt", 40),
        ("=", 26),
        ("prev", 62),
        ("times", 26),
        ("frac", 98),
        ("minus", 26),
        ("pb", 56),
    ]
    total = sum(w for _, w in segs)
    x = (VIEW_W - total) / 2
    pos = {}
    for key, w in segs:
        pos[key] = (x, w)
        x += w

    def cx(key: str) -> float:
        px, pw = pos[key]
        return px + pw / 2

    # Highlights behind the three terms that carry meaning.
    for key, tint, stroke in (
        ("prev", BLUE_TINT, BLUE),
        ("frac", ORANGE_TINT, ORANGE),
        ("pb", GREEN_TINT, GREEN),
    ):
        px, pw = pos[key]
        top = eq_y - 34 if key == "frac" else eq_y - 26
        h = 62 if key == "frac" else 40
        body.append(rect(box(px + 2, top, pw - 4, h), tint, r=5))
        body.append(
            f'<line x1="{px + 2:.1f}" y1="{top + h:.1f}" x2="{px + pw - 2:.1f}" '
            f'y2="{top + h:.1f}" stroke="{stroke}" stroke-width="2.5"/>'
        )

    ser = "qcx-serif"
    body.append(
        f'<text class="{ser}" x="{cx("dt"):.1f}" y="{eq_y}" font-size="{size}" '
        f'fill="{INK}" text-anchor="middle" font-style="italic">d'
        f'<tspan font-size="{sub}" dy="7">t</tspan></text>'
    )
    body.append(text(cx("="), eq_y, "=", size, INK, anchor="middle", cls=ser))
    body.append(
        f'<text class="{ser}" x="{cx("prev"):.1f}" y="{eq_y}" font-size="{size}" '
        f'fill="{INK}" text-anchor="middle" font-style="italic">d'
        f'<tspan font-size="{sub}" dy="7">t&#8722;1</tspan></text>'
    )
    body.append(text(cx("times"), eq_y, "×", size, INK, anchor="middle", cls=ser))
    fx = cx("frac")
    body.append(text(fx, eq_y - 12, "1 + r", 22, INK, anchor="middle", cls=ser, italic=True))
    body.append(
        f'<line x1="{fx - 36:.1f}" y1="{eq_y - 5}" x2="{fx + 36:.1f}" y2="{eq_y - 5}" '
        f'stroke="{INK}" stroke-width="1.6"/>'
    )
    body.append(text(fx, eq_y + 18, "1 + g", 22, INK, anchor="middle", cls=ser, italic=True))
    body.append(text(cx("minus"), eq_y, "−", size, INK, anchor="middle", cls=ser))
    body.append(
        f'<text class="{ser}" x="{cx("pb"):.1f}" y="{eq_y}" font-size="{size}" '
        f'fill="{INK}" text-anchor="middle" font-style="italic">pb'
        f'<tspan font-size="{sub}" dy="7">t</tspan></text>'
    )

    # Three columns underneath, in the same three colours.
    col_w, col_gap = 216, 16
    col_x = 0
    columns = [
        ("prev", BLUE, "Where you start", [
            "Last year's ratio. A stock you",
            "inherit, not a choice you make",
            "this year.",
        ]),
        ("frac", ORANGE, "The scoreboard", [
            "Interest racing growth. Above",
            "one, the ratio climbs with",
            "nobody borrowing.",
        ]),
        ("pb", GREEN, "What you paid down", [
            "The primary balance. The one",
            "term a government sets",
            "directly, this year.",
        ]),
    ]
    for key, colour, name, lines in columns:
        top = 168
        body.append(elbow([(cx(key), eq_y + 32), (cx(key), top - 22), (col_x + col_w / 2, top - 22), (col_x + col_w / 2, top - 6)], colour))
        body.append(
            f'<line x1="{col_x}" y1="{top}" x2="{col_x + col_w}" y2="{top}" '
            f'stroke="{colour}" stroke-width="2.5"/>'
        )
        body.append(caps(col_x, top + 18, name, 9.5, colour))
        body.append(stacked(col_x, top + 36, lines, 10.5, INK, 14))
        col_x += col_w + col_gap

    return frame(
        height,
        "Three terms, and only the last one is a decision",
        "Next year's ratio is this year's, grown by the interest rate, shrunk by growth, less what you paid down.",
        [
            "Q-CRAFT adds no climate term to this equation. Warming lowers g, which enlarges the middle term,",
            "and the effect compounds every year after.",
        ],
        "".join(body),
    )


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
        "The three paths are the same course at three depths. Module 2 is the only "
        "one a path drops outright, which is why the routing question is really a "
        "question about whether you already own the debt dynamics equation."
    ),
    "m1-ten-minutes": (
        "The sequence is five clicks and it explains nothing, on purpose. The two "
        "CSVs at the end are the first page of the packet you hand in at the end "
        "of the course."
    ),
    "m1-parity": (
        "Both engines see identical inputs and every output cell is compared. The "
        "baseline bar is full because the claim is exact across the tested "
        "countries. The climate bar is short because the claim covers ratio "
        "metrics and stops there."
    ),
    "m2-equation-annotated": (
        "Each term tinted, and one plain English phrase per term. Only the last "
        "one is a decision a government makes this year. The middle term is where "
        "climate damage does its work, by lowering the g in the denominator."
    ),
    "m2-scoreboard": (
        "The debt dynamics equation run forward ten times with the primary balance "
        "held at exactly zero, so nothing but the scoreboard is moving. Three "
        "percentage points of differential separate 66 percent of GDP from 38."
    ),
    "m3-controls": (
        "Five controls, three destinations, and one destination nothing reaches. "
        "Demography arrives twice because working-age population drives growth "
        "while total population drives spending."
    ),
    "m4-seven-steps": (
        "The five sanity-check boxes sit across the middle of the method rather "
        "than beside it. Everything to the right of the gate is only as good as "
        "the baseline underneath it."
    ),
    "m4-fan-readings": (
        "The same chart, read three ways. The 80 point gap is the headline, the "
        "ceiling crossing is the policy fact, and the flat stretch to 2030 is the "
        "reminder that the scenarios are identical until the damage starts."
    ),
    "m5-exclusions": (
        "The modelled channel runs across the top. The six exclusions sit below "
        "it, each with the User Guide page that documents it, and the bar at the "
        "bottom is the thing to carry: they all run one way."
    ),
    "m5-debt-floor": (
        "Read the left panel naively and the climate scenario looks better than "
        "the baseline, which is nonsense. The right panel shows why: one line is "
        "clipped at zero and the other is not."
    ),
    "m6-packet": (
        "Three parts to hand in, and a rubric that puts most of the weight on the "
        "reasoning rather than on the output. Nobody is marking whether your 2099 "
        "number matches a published one."
    ),
}

FIGURES = {
    "m0-paths": figure_paths,
    "m1-ten-minutes": figure_ten_minutes,
    "m1-parity": figure_parity,
    "m2-equation-annotated": figure_equation_annotated,
    "m2-scoreboard": figure_scoreboard,
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
