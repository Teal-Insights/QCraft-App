"""Build the preface's two figures: the elevator chain and the questions grid.

The preface opens with a two-minute account of the whole model, and the
elevator figure is that account drawn: a warming world slows growth and
squeezes the primary balance, and the debt dynamics equation turns those two
dents into debt paths to 2099. The questions figure shows the four questions
the tool answers and the one method behind every answer, a comparison of two
runs of the same model.

Both figures share the course map's palette, primitives and type (see
scripts/build_course_map.py, which this file borrows from), so the preface
and the modules read as one book. Two layouts per figure:

    wide  the horizontal composition, inlined in the HTML book
    tall  the same content folded onto rows, rasterised for the PDF column

Run from the repository root:

    python3 scripts/build_preface_figures.py

Writes docs/companion-guide/figures/preface-<name>.svg (wide),
preface-<name>-print.svg (tall), and the _preface-<name>.qmd include.
Rasterise the print PNGs with scripts/rasterise_figures.py.
"""

from __future__ import annotations

import html
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
FIG_DIR = REPO_ROOT / "docs" / "companion-guide" / "figures"

# The course palette, from docs/companion-guide/_custom.css.
INK = "#2C3E50"
ACCENT = "#1ABC9C"
ACCENT_DARK = "#16A085"
MUTED = "#63757F"
LINE = "#CBD5DB"
PANEL_BG = "#F5F7F9"
PANEL_LINE = "#E1E7EB"
WHITE = "#FFFFFF"
RED = "#C0392B"


# --------------------------------------------------------------------------
# Primitives, shared with build_course_map.py
# --------------------------------------------------------------------------


def esc(value: str) -> str:
    return html.escape(value, quote=False)


def box(x: float, y: float, w: float, h: float) -> dict:
    return {"x": x, "y": y, "w": w, "h": h, "cx": x + w / 2, "cy": y + h / 2}


def rect(b: dict, fill: str, stroke: str, r: float = 10, width: float = 1.6) -> str:
    return (
        f'<rect x="{b["x"]}" y="{b["y"]}" width="{b["w"]}" height="{b["h"]}" '
        f'rx="{r}" ry="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{width}"/>'
    )


def label(
    x: float,
    y: float,
    content: str,
    size: float,
    fill: str,
    weight: str = "400",
    cls: str = "qcm-sans",
    anchor: str = "middle",
    italic: bool = False,
) -> str:
    style = ' font-style="italic"' if italic else ""
    return (
        f'<text class="{cls}" x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" '
        f'fill="{fill}" text-anchor="{anchor}"{style}>{esc(content)}</text>'
    )


def titled(b: dict, title: str, symbol: str, y: float, size: float, colour: str) -> str:
    """A node title with an optional italic serif symbol hung after it."""
    sym = (
        f'<tspan class="qcm-serif" font-style="italic" font-weight="400" dx="7">'
        f"{esc(symbol)}</tspan>"
        if symbol
        else ""
    )
    return (
        f'<text class="qcm-sans" x="{b["cx"]}" y="{y}" font-size="{size}" '
        f'font-weight="600" fill="{colour}" text-anchor="middle">{esc(title)}{sym}</text>'
    )


def h_arrow(x1: float, x2: float, y: float, verb: str, size: float = 11) -> str:
    out = (
        f'<line x1="{x1}" y1="{y}" x2="{x2 - 8}" y2="{y}" stroke="{LINE}" '
        f'stroke-width="1.8" marker-end="url(#qcp-head)"/>'
    )
    if verb:
        out += label((x1 + x2) / 2, y - 11, verb, size, MUTED, weight="500", italic=True)
    return out


def v_arrow(x: float, y1: float, y2: float, verb: str, size: float = 11) -> str:
    out = (
        f'<line x1="{x}" y1="{y1}" x2="{x}" y2="{y2 - 8}" stroke="{LINE}" '
        f'stroke-width="1.8" marker-end="url(#qcp-head)"/>'
    )
    if verb:
        out += label(
            x + 14, (y1 + y2) / 2 + 4, verb, size, MUTED, weight="500",
            anchor="start", italic=True,
        )
    return out


def equation_text(cx: float, y: float, size: float) -> str:
    """The debt identity, set as a line of italic serif with real subscripts."""
    sub = round(size * 0.62, 1)
    drop = round(size * 0.28, 1)
    return (
        f'<text class="qcm-serif" x="{cx}" y="{y}" font-size="{size}" fill="{INK}" '
        f'text-anchor="middle" font-style="italic">'
        f'd<tspan font-size="{sub}" dy="{drop}">t</tspan>'
        f'<tspan dy="-{drop}"> = d</tspan><tspan font-size="{sub}" dy="{drop}">t−1</tspan>'
        f'<tspan dy="-{drop}" font-style="normal"> × </tspan>'
        f"<tspan>(1+r) / (1+g)</tspan>"
        f'<tspan font-style="normal"> − </tspan>'
        f'<tspan>pb</tspan><tspan font-size="{sub}" dy="{drop}">t</tspan></text>'
    )


def fan(b: dict, top: float, bottom: float) -> str:
    """The small fan of debt paths on the lit destination node."""
    x0 = b["x"] + 16
    span = b["w"] - 32
    height = bottom - top
    lines = [
        (WHITE, 0.16, 1.0),
        (WHITE, 0.46, 0.85),
        (WHITE, 0.72, 0.7),
        (WHITE, 1.0, 0.55),
    ]
    parts = [
        f'<line x1="{x0 - 5}" y1="{bottom + 5}" x2="{x0 + span + 5}" y2="{bottom + 5}" '
        f'stroke="{WHITE}" stroke-width="1.2" stroke-opacity="0.5"/>'
    ]
    for colour, share, opacity in lines:
        points = []
        for step in range(21):
            t = step / 20
            points.append(f"{x0 + t * span:.1f},{bottom - height * share * (t ** 1.7):.1f}")
        parts.append(
            f'<polyline points="{" ".join(points)}" fill="none" stroke="{colour}" '
            f'stroke-width="2" stroke-opacity="{opacity}" stroke-linecap="round"/>'
        )
    return "".join(parts)


def frame(view_w: float, view_h: float, alt: str, body: str) -> str:
    defs = (
        "<defs>"
        f'<marker id="qcp-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" '
        f'markerHeight="6.5" orient="auto-start-reverse">'
        f'<path d="M 0 1 L 9 5 L 0 9 z" fill="{LINE}"/></marker>'
        f'<marker id="qcp-head-teal" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" '
        f'markerHeight="6" orient="auto-start-reverse">'
        f'<path d="M 0 1 L 9 5 L 0 9 z" fill="{ACCENT}"/></marker>'
        "</defs>"
    )
    style = (
        "<style>"
        '.qcm-sans{font-family:"Söhne","Inter",system-ui,-apple-system,sans-serif;}'
        '.qcm-serif{font-family:"Tiempos Headline","IBM Plex Serif",Georgia,serif;}'
        "</style>"
    )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {view_w} {view_h}" '
        f'role="img" aria-label="{html.escape(alt, quote=True)}" '
        f'preserveAspectRatio="xMidYMid meet">'
        f"<title>{esc(alt)}</title>{defs}{style}{body}</svg>"
    )


def climate_arrow(points: str, width: float = 2.2) -> str:
    return (
        f'<path d="{points}" fill="none" stroke="{ACCENT}" stroke-width="{width}" '
        f'stroke-dasharray="6 4" marker-end="url(#qcp-head-teal)"/>'
    )


# --------------------------------------------------------------------------
# The elevator figure
# --------------------------------------------------------------------------

ELEVATOR_CAPTION = (
    "The whole model in one picture. Warming slows growth and squeezes the "
    "primary balance, and the debt dynamics equation turns those two dents "
    "into debt paths to 2099."
)
ELEVATOR_ALT = (
    "The elevator chain: a warming world slows growth and squeezes the "
    "primary balance, both feed the debt dynamics equation, and the equation "
    "produces debt paths to 2099."
)

# Node copy, shared by both layouts.
WARM_TITLE = "A warming world"
WARM_SUBS = ("six scenarios,", "Paris-aligned to hot")
G_TITLE, G_SYM = "Growth slows", "g"
G_SUBS = ("hotter years drag on", "productivity")
PB_TITLE, PB_SYM = "The primary balance weakens", "pb"
PB_SUBS = ("spending stays rigid while", "the tax base slows")
EQ_TITLE = "The debt dynamics equation"
EQ_SUBS = ("the interest rate joins here,", "untouched by warming")
PATHS_TITLE = "Debt paths"
PATHS_SUBS = ("a baseline and six", "warming paths to 2099")
BOTTOM_NOTE = (
    "Warming never enters the equation directly. It reaches the debt line "
    "only through growth and the primary balance."
)


def node(b: dict, title: str, symbol: str, subs: tuple, lit: bool = False) -> str:
    fill = ACCENT if lit else WHITE
    stroke = ACCENT_DARK if lit else LINE
    title_c = WHITE if lit else INK
    sub_c = "#DFF6F0" if lit else MUTED
    parts = [rect(b, fill, stroke, r=8)]
    parts.append(titled(b, title, symbol, b["y"] + 24, 13.5, title_c))
    for i, line in enumerate(subs):
        parts.append(label(b["cx"], b["y"] + 43 + i * 14, line, 10.5, sub_c))
    return "".join(parts)


def elevator_wide() -> str:
    view = (952, 268)
    warm = box(8, 89, 170, 90)
    g = box(242, 26, 240, 76)
    pb = box(242, 166, 240, 76)
    eq = box(544, 73, 240, 122)
    paths = box(820, 71, 124, 126)

    parts = [node(warm, WARM_TITLE, "", WARM_SUBS, lit=True)]

    # The two climate channels, teal and dashed like every warming arrow in
    # the course map.
    parts.append(climate_arrow(f"M {warm['x'] + warm['w']} {warm['cy']} H 206 V {g['cy']} H {g['x'] - 4}"))
    parts.append(climate_arrow(f"M 206 {warm['cy']} V {pb['cy']} H {pb['x'] - 4}"))

    parts.append(node(g, G_TITLE, G_SYM, G_SUBS))
    parts.append(node(pb, PB_TITLE, PB_SYM, PB_SUBS))

    # Both channels feed the equation.
    parts.append(
        f'<path d="M {g["x"] + g["w"]} {g["cy"]} H 508 V {eq["cy"]}" fill="none" '
        f'stroke="{LINE}" stroke-width="1.8"/>'
    )
    parts.append(
        f'<path d="M {pb["x"] + pb["w"]} {pb["cy"]} H 508 V {eq["cy"]}" fill="none" '
        f'stroke="{LINE}" stroke-width="1.8"/>'
    )
    parts.append(h_arrow(508, eq["x"], eq["cy"], "feed"))

    parts.append(rect(eq, WHITE, LINE))
    parts.append(titled(eq, EQ_TITLE, "", eq["y"] + 26, 14, INK))
    parts.append(equation_text(eq["cx"], eq["y"] + 60, 15))
    for i, line in enumerate(EQ_SUBS):
        parts.append(label(eq["cx"], eq["y"] + 86 + i * 14, line, 10.5, MUTED))

    parts.append(h_arrow(eq["x"] + eq["w"], paths["x"], paths["cy"], "makes"))

    parts.append(rect(paths, ACCENT, ACCENT_DARK, r=8))
    parts.append(titled(paths, PATHS_TITLE, "", paths["y"] + 24, 13.5, WHITE))
    for i, line in enumerate(PATHS_SUBS):
        parts.append(label(paths["cx"], paths["y"] + 42 + i * 13, line, 10, "#DFF6F0"))
    parts.append(fan(paths, paths["y"] + 62, paths["y"] + 110))

    parts.append(label(view[0] / 2, 252, BOTTOM_NOTE, 11.5, MUTED))
    return frame(view[0], view[1], ELEVATOR_ALT, "".join(parts))


def elevator_tall() -> str:
    view = (680, 574)
    warm = box(244, 16, 192, 88)
    g = box(56, 176, 268, 84)
    pb = box(356, 176, 268, 84)
    eq = box(190, 332, 300, 122)
    paths = box(268, 512, 144, 46)  # placeholder, replaced below

    parts = [node(warm, WARM_TITLE, "", WARM_SUBS, lit=True)]

    parts.append(climate_arrow(f"M {warm['cx']} {warm['y'] + warm['h']} V 132 H {g['cx']} V {g['y'] - 4}"))
    parts.append(climate_arrow(f"M {warm['cx']} 132 H {pb['cx']} V {pb['y'] - 4}"))

    parts.append(node(g, G_TITLE, G_SYM, G_SUBS))
    parts.append(node(pb, PB_TITLE, PB_SYM, PB_SUBS))

    parts.append(
        f'<path d="M {g["cx"]} {g["y"] + g["h"]} V 288 H {pb["cx"]} V {pb["y"] + pb["h"]}" '
        f'fill="none" stroke="{LINE}" stroke-width="1.8"/>'
    )
    parts.append(v_arrow(eq["cx"], 288, eq["y"], "feed"))

    parts.append(rect(eq, WHITE, LINE))
    parts.append(titled(eq, EQ_TITLE, "", eq["y"] + 26, 14.5, INK))
    parts.append(equation_text(eq["cx"], eq["y"] + 60, 15.5))
    for i, line in enumerate(EQ_SUBS):
        parts.append(label(eq["cx"], eq["y"] + 86 + i * 14, line, 11, MUTED))

    paths = box(240, 496, 200, 132)
    view = (680, 700)
    parts.append(v_arrow(eq["cx"], eq["y"] + eq["h"], paths["y"], "makes"))

    parts.append(rect(paths, ACCENT, ACCENT_DARK, r=8))
    parts.append(titled(paths, PATHS_TITLE, "", paths["y"] + 26, 14.5, WHITE))
    for i, line in enumerate(PATHS_SUBS):
        parts.append(label(paths["cx"], paths["y"] + 46 + i * 14, line, 11, "#DFF6F0"))
    parts.append(fan(paths, paths["y"] + 66, paths["y"] + 114))

    parts.append(label(view[0] / 2, 668, "Warming never enters the equation directly.", 11.5, MUTED))
    parts.append(label(view[0] / 2, 684, "It reaches the debt line only through growth and the primary balance.", 11.5, MUTED))
    return frame(view[0], view[1], ELEVATOR_ALT, "".join(parts))


# --------------------------------------------------------------------------
# The questions figure
# --------------------------------------------------------------------------

QUESTIONS_CAPTION = (
    "The tool answers four questions, and it answers each one the same way: "
    "two runs of the same model, and the gap between them."
)
QUESTIONS_ALT = (
    "The four questions the tool answers, beside a small chart of two runs "
    "of the same model with the gap between them marked as the answer."
)

QUESTIONS = (
    ("Where is our debt ratio in 2050, and in 2099?",
     "read the path at the year you care about"),
    ("How much of the path is climate damage?",
     "the gap between scenario and baseline"),
    ("When does damage breach the fiscal rule?",
     "the year the gap carries you over your ceiling"),
    ("Which assumption moves the answer most?",
     "change one control, run again, compare"),
)


def mini_chart(x0: float, y0: float, w: float, h: float) -> str:
    """Two runs of the same model: a baseline and a scenario, gap marked."""
    parts = []
    left, right = x0, x0 + w
    base, top = y0 + h, y0
    # Axis.
    parts.append(
        f'<line x1="{left}" y1="{base}" x2="{right}" y2="{base}" '
        f'stroke="{PANEL_LINE}" stroke-width="1.4"/>'
    )
    # The baseline, gently rising; the scenario, curving away.
    span = right - left - 14
    height = base - top - 8
    for colour, share, dash in ((INK, 0.30, ""), (RED, 0.94, "")):
        points = []
        for step in range(25):
            t = step / 24
            points.append(
                f"{left + t * span:.1f},{base - 6 - height * share * (t ** 1.9):.1f}"
            )
        d = f' stroke-dasharray="{dash}"' if dash else ""
        parts.append(
            f'<polyline points="{" ".join(points)}" fill="none" stroke="{colour}" '
            f'stroke-width="2.4" stroke-linecap="round"{d}/>'
        )
    # The gap bracket at the far end.
    gx = left + span
    y_base_end = base - 6 - height * 0.30
    y_scen_end = base - 6 - height * 0.94
    parts.append(
        f'<line x1="{gx + 8}" y1="{y_scen_end}" x2="{gx + 8}" y2="{y_base_end}" '
        f'stroke="{ACCENT_DARK}" stroke-width="2" stroke-dasharray="3 3"/>'
    )
    for gy in (y_scen_end, y_base_end):
        parts.append(
            f'<line x1="{gx + 4}" y1="{gy}" x2="{gx + 12}" y2="{gy}" '
            f'stroke="{ACCENT_DARK}" stroke-width="2"/>'
        )
    parts.append(
        label(gx - 2, (y_scen_end + y_base_end) / 2 + 4, "the answer", 11,
              ACCENT_DARK, weight="600", anchor="end", italic=True)
    )
    # Direct labels, no legend hunt.
    parts.append(label(left + span * 0.6, base - 9, "baseline", 10.5, INK, anchor="middle"))
    parts.append(label(left + span * 0.52, base - 6 - height * 0.62, "warming scenario", 10.5, RED, anchor="middle"))
    parts.append(label(left, base + 16, "today", 10, MUTED, anchor="start"))
    parts.append(label(right, base + 16, "2099", 10, MUTED, anchor="end"))
    return "".join(parts)


def q_card(b: dict, number: int, question: str, sub: str, wrap: int) -> str:
    parts = [rect(b, WHITE, LINE, r=8)]
    cx_num = b["x"] + 24
    cy_num = b["y"] + 26
    parts.append(
        f'<circle cx="{cx_num}" cy="{cy_num}" r="11" fill="{ACCENT}"/>'
    )
    parts.append(
        f'<text class="qcm-sans" x="{cx_num}" y="{cy_num + 4}" font-size="12" '
        f'font-weight="700" fill="{WHITE}" text-anchor="middle">{number}</text>'
    )
    # Wrap the question onto at most two lines.
    words = question.split()
    lines, cur = [], ""
    for word in words:
        trial = f"{cur} {word}".strip()
        if len(trial) > wrap and cur:
            lines.append(cur)
            cur = word
        else:
            cur = trial
    lines.append(cur)
    tx = b["x"] + 44
    for i, line in enumerate(lines[:2]):
        parts.append(
            label(tx, b["y"] + 24 + i * 17, line, 13, INK, weight="600", anchor="start")
        )
    parts.append(label(tx, b["y"] + 24 + len(lines[:2]) * 17 + 2, sub, 10.5, MUTED, anchor="start"))
    return "".join(parts)


def questions_wide() -> str:
    view = (952, 268)
    panel = box(8, 14, 296, 240)
    parts = [rect(panel, PANEL_BG, PANEL_LINE, r=14)]
    parts.append(label(panel["cx"], panel["y"] + 26, "Two runs of the same model", 13, MUTED, "600"))
    parts.append(mini_chart(panel["x"] + 28, panel["y"] + 44, panel["w"] - 56, 150))
    parts.append(label(panel["cx"], panel["y"] + 228, "same country, same controls, one scenario switched on", 10.5, MUTED))

    xs = (328, 648)
    ys = (26, 140)
    w, h = 296, 92
    order = ((0, 0, 0), (1, 1, 0), (2, 0, 1), (3, 1, 1))
    for idx, col, row in order:
        q, sub = QUESTIONS[idx]
        parts.append(q_card(box(xs[col], ys[row], w, h), idx + 1, q, sub, wrap=30))
    return frame(view[0], view[1], QUESTIONS_ALT, "".join(parts))


def questions_tall() -> str:
    view = (680, 542)
    panel = box(90, 14, 500, 250)
    parts = [rect(panel, PANEL_BG, PANEL_LINE, r=14)]
    parts.append(label(panel["cx"], panel["y"] + 28, "Two runs of the same model", 14, MUTED, "600"))
    parts.append(mini_chart(panel["x"] + 48, panel["y"] + 48, panel["w"] - 96, 150))
    parts.append(label(panel["cx"], panel["y"] + 238, "same country, same controls, one scenario switched on", 11, MUTED))

    xs = (18, 348)
    ys = (288, 412)
    w, h = 314, 108
    order = ((0, 0, 0), (1, 1, 0), (2, 0, 1), (3, 1, 1))
    for idx, col, row in order:
        q, sub = QUESTIONS[idx]
        parts.append(q_card(box(xs[col], ys[row], w, h), idx + 1, q, sub, wrap=32))
    return frame(view[0], view[1], QUESTIONS_ALT, "".join(parts))


# --------------------------------------------------------------------------


def include_snippet(name: str, caption: str, svg: str) -> str:
    """The Quarto snippet the preface includes: inline SVG for HTML, PNG elsewhere."""
    return (
        "<!-- Generated by scripts/build_preface_figures.py. Do not edit by hand. -->\n\n"
        "```{=html}\n"
        '<figure class="qc-map">\n'
        f"{svg}\n"
        f"<figcaption>{esc(caption)}</figcaption>\n"
        "</figure>\n"
        "```\n\n"
        '::: {.content-hidden when-format="html"}\n'
        f"![{caption}](figures/preface-{name}-print.png)\n"
        ":::\n"
    )


def main() -> None:
    FIG_DIR.mkdir(parents=True, exist_ok=True)
    for name, caption, wide, tall in (
        ("elevator", ELEVATOR_CAPTION, elevator_wide, elevator_tall),
        ("questions", QUESTIONS_CAPTION, questions_wide, questions_tall),
    ):
        wide_svg = wide()
        (FIG_DIR / f"preface-{name}.svg").write_text(wide_svg + "\n")
        (FIG_DIR / f"preface-{name}-print.svg").write_text(tall() + "\n")
        (FIG_DIR / f"_preface-{name}.qmd").write_text(include_snippet(name, caption, wide_svg))
        print(f"wrote preface-{name} (screen and print) and its include")


if __name__ == "__main__":
    main()
