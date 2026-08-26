"""Build the course map diagram, one figure per module.

The map is the teaching chain the whole course hangs on: three sourced
ingredients (macro series from the IMF WEO, population from the UN WPP, and the
controls the reader sets) are manufactured into the three numbers the debt
dynamics equation needs, the equation turns those three into debt paths, and the
warming scenarios reach the paths only by moving growth and the primary balance.

Each module gets a variant with its own nodes lit, so the same picture opens
every chapter and the reader can see where they are.

The output is hand-authored SVG rather than a Mermaid render, because the
diagram has to sit on the course's own palette and type. Two layouts come out
of the same node content:

    wide  the horizontal chain, for the HTML book, where the figure runs the
          full page column and the type sets at close to its drawn size
    tall  the same chain folded onto rows, for the PDF, where a 3:1 figure in a
          6.5 inch column would set its labels at about 5 point

Run from the repository root:

    python3 scripts/build_course_map.py

Writes docs/companion-guide/figures/course-map-<module>.svg (wide),
course-map-<module>-print.svg (tall), and the _course-map-<module>.qmd include
that puts each one in front of the right reader. Rasterise the print PNGs with
scripts/rasterise_figures.py.
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

# The first node, decomposed by source. Two of the three arrive with the
# country; the third is the reader's.
INGREDIENTS = (
    ("weo", "Macro series", "IMF World Economic Outlook"),
    ("wpp", "Population", "UN World Population Prospects"),
    ("controls", "The controls you set", "five of them, in the sidebar"),
)

# The three numbers, in the order the equation needs them.
PILLS = (
    ("g", "Growth", "g", ("demography, productivity,", "inflation")),
    ("r", "Interest rate", "r", ("the rate rule applied", "to the debt stock")),
    ("pb", "Primary balance", "pb", ("revenue, spending,", "the fiscal rule")),
)

EQUATION_NAME = "The debt dynamics equation"

CLIMATE_NOTE = (
    "Warming lowers growth, and weakens the primary balance when",
    "spending is rigid. It never enters the equation directly.",
)

VARIANTS = {
    "m0": {
        "lit": {"paths"},
        "caption": (
            "The course map. Two published data sources and the controls you set "
            "are manufactured into the three numbers the debt dynamics equation "
            "needs. This module fixes the destination on the right."
        ),
        "alt": (
            "The course map, with the debt paths at the end of the chain "
            "highlighted."
        ),
    },
    "m1": {
        "lit": {"g", "r", "pb", "equation"},
        "caption": (
            "This module covers the middle of the chain: the three numbers, and "
            "the debt dynamics equation they feed."
        ),
        "alt": (
            "The course map, with growth, the interest rate, the primary balance "
            "and the debt dynamics equation highlighted."
        ),
    },
    "m2": {
        "lit": {"equation"},
        "caption": "This module is the equation node, on its own.",
        "alt": "The course map, with the debt dynamics equation highlighted.",
    },
    "m3": {
        "lit": {"weo", "wpp", "controls", "g", "pb"},
        "caption": (
            "This module is the start of the chain: the two sources the country "
            "selection loads, the controls you set on top of them, and the two "
            "numbers they move."
        ),
        "alt": (
            "The course map, with the two data sources, the controls you set, "
            "growth and the primary balance highlighted."
        ),
    },
    "m4": {
        "lit": {"paths"},
        "caption": (
            "This module is the output end: the debt paths, and the write-up "
            "that comes out of them."
        ),
        "alt": "The course map, with the debt paths highlighted.",
    },
    "m5": {
        "lit": {"climate", "paths"},
        "caption": (
            "This module is about what the warming scenarios contain, and what "
            "the debt paths therefore license you to write."
        ),
        "alt": (
            "The course map, with the warming scenarios and the debt paths "
            "highlighted."
        ),
    },
    "m6": {
        "lit": {
            "weo",
            "wpp",
            "controls",
            "g",
            "r",
            "pb",
            "equation",
            "paths",
            "climate",
        },
        "caption": (
            "The capstone runs the whole chain, from the sources the tool loads "
            "to the paths you hand over."
        ),
        "alt": "The course map, with every node in the chain highlighted.",
    },
}


# --------------------------------------------------------------------------
# Primitives
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


def colours(lit: bool) -> tuple[str, str, str, str]:
    """Fill, stroke, title colour, subtitle colour."""
    if lit:
        return ACCENT, ACCENT_DARK, WHITE, "#DFF6F0"
    return WHITE, LINE, INK, MUTED


def h_arrow(x1: float, x2: float, y: float, verb: str, size: float) -> str:
    out = (
        f'<line x1="{x1}" y1="{y}" x2="{x2 - 8}" y2="{y}" stroke="{LINE}" '
        f'stroke-width="1.8" marker-end="url(#qcm-head)"/>'
    )
    if verb:
        out += label((x1 + x2) / 2, y - 11, verb, size, MUTED, weight="500", italic=True)
    return out


def v_arrow(
    x: float,
    y1: float,
    y2: float,
    verb: str,
    size: float,
    verb_y: float | None = None,
    side: str = "right",
) -> str:
    out = (
        f'<line x1="{x}" y1="{y1}" x2="{x}" y2="{y2 - 8}" stroke="{LINE}" '
        f'stroke-width="1.8" marker-end="url(#qcm-head)"/>'
    )
    if verb:
        out += label(
            x + 14 if side == "right" else x - 14,
            verb_y if verb_y is not None else (y1 + y2) / 2 + 5,
            verb,
            size,
            MUTED,
            weight="500",
            anchor="start" if side == "right" else "end",
            italic=True,
        )
    return out


def equation_text(cx: float, y: float, size: float, lit: bool) -> str:
    """The debt identity, set as a line of italic serif with real subscripts."""
    sub = round(size * 0.62, 1)
    drop = round(size * 0.28, 1)
    colour = WHITE if lit else INK
    return (
        f'<text class="qcm-serif" x="{cx}" y="{y}" font-size="{size}" fill="{colour}" '
        f'text-anchor="middle" font-style="italic">'
        f'd<tspan font-size="{sub}" dy="{drop}">t</tspan>'
        f'<tspan dy="-{drop}"> = d</tspan><tspan font-size="{sub}" dy="{drop}">t−1</tspan>'
        f'<tspan dy="-{drop}" font-style="normal"> × </tspan>'
        f"<tspan>(1+r) / (1+g)</tspan>"
        f'<tspan font-style="normal"> − </tspan>'
        f'<tspan>pb</tspan><tspan font-size="{sub}" dy="{drop}">t</tspan></text>'
    )


def fan(b: dict, top: float, bottom: float, lit: bool) -> str:
    """A small fan of debt paths, so the last node reads as a chart at a glance."""
    x0 = b["x"] + 16
    span = b["w"] - 32
    height = bottom - top
    if lit:
        lines = [(WHITE, 0.16, 1.0), (WHITE, 0.46, 0.85), (WHITE, 0.72, 0.7), (WHITE, 1.0, 0.55)]
    else:
        lines = [(INK, 0.16, 1.0), ("#27AE60", 0.46, 1.0), ("#E67E22", 0.72, 1.0), ("#E74C3C", 1.0, 1.0)]
    parts = [
        f'<line x1="{x0 - 5}" y1="{bottom + 5}" x2="{x0 + span + 5}" y2="{bottom + 5}" '
        f'stroke="{WHITE if lit else PANEL_LINE}" stroke-width="1.2" '
        f'stroke-opacity="{0.5 if lit else 1}"/>'
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
        f'<marker id="qcm-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" '
        f'markerHeight="6.5" orient="auto-start-reverse">'
        f'<path d="M 0 1 L 9 5 L 0 9 z" fill="{LINE}"/></marker>'
        f'<marker id="qcm-head-teal" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" '
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


# --------------------------------------------------------------------------
# The wide layout: one horizontal chain, for the HTML book
#
# Drawn at 952 units so it sets at about three quarters size in the book's body
# column. Quarto's .column-page would give it more room, but in a book with a
# sidebar and a table of contents that class overlaps both.
#
# Every box is a notch smaller than the first version of this diagram, so the
# chain has air in it and the three ingredient boxes fit without crowding.
# --------------------------------------------------------------------------

W_VIEW = (952, 392)
W_ROW_Y = 165

W_ING_X, W_ING_W, W_ING_H = 8, 168, 52
W_ING_Y = {"weo": 75, "wpp": 139, "controls": 203}
W_ING_BUS = 192

W_PANEL = box(232, 14, 222, 292)
W_PILL_X, W_PILL_W, W_PILL_H = 250, 186, 58
W_PILL_Y = {"g": 60, "r": 136, "pb": 212}

W_EQUATION = box(494, 104, 246, 122)
W_PATHS = box(786, 102, 126, 126)
W_CLIMATE = box(232, 326, 224, 54)


def wide_svg(key: str) -> str:
    lit: set[str] = VARIANTS[key]["lit"]
    parts: list[str] = []

    # The three ingredients, each with its source named under it, converging on
    # a single bus that carries them into the three-numbers panel.
    for ikey, name, source in INGREDIENTS:
        fill, stroke, title_c, sub_c = colours(ikey in lit)
        b = box(W_ING_X, W_ING_Y[ikey], W_ING_W, W_ING_H)
        parts += [
            rect(b, fill, stroke, r=8),
            label(b["cx"], b["y"] + 22, name, 13, title_c, "600"),
            label(b["cx"], b["y"] + 39, source, 10.5, sub_c),
            f'<path d="M {b["x"] + b["w"]} {b["cy"]} H {W_ING_BUS}" fill="none" '
            f'stroke="{LINE}" stroke-width="1.6"/>',
        ]
    parts.append(
        f'<path d="M {W_ING_BUS} {W_ING_Y["weo"] + W_ING_H / 2} V '
        f'{W_ING_Y["controls"] + W_ING_H / 2}" fill="none" stroke="{LINE}" '
        f'stroke-width="1.6"/>'
    )
    parts.append(h_arrow(W_ING_BUS, W_PANEL["x"], W_ROW_Y, "build", 11))

    parts += [
        rect(W_PANEL, PANEL_BG, PANEL_LINE, r=14),
        label(W_PANEL["cx"], W_PANEL["y"] + 20, "The three numbers", 12.5, MUTED, "600"),
        label(W_PANEL["cx"], W_PANEL["y"] + 36, "the equation needs", 12.5, MUTED, "600"),
    ]
    for pkey, name, symbol, supplier in PILLS:
        fill, stroke, title_c, sub_c = colours(pkey in lit)
        y = W_PILL_Y[pkey]
        pill = box(W_PILL_X, y, W_PILL_W, W_PILL_H)
        parts.append(rect(pill, fill, stroke, r=8))
        parts.append(
            f'<text class="qcm-sans" x="{pill["cx"]}" y="{y + 23}" font-size="14" '
            f'font-weight="600" fill="{title_c}" text-anchor="middle">{esc(name)}'
            f'<tspan class="qcm-serif" font-style="italic" font-weight="400" dx="6">'
            f"{esc(symbol)}</tspan></text>"
        )
        parts.append(label(pill["cx"], y + 39, supplier[0], 11, sub_c))
        parts.append(label(pill["cx"], y + 52, supplier[1], 11, sub_c))

    fill, stroke, title_c, sub_c = colours("equation" in lit)
    parts += [
        rect(W_EQUATION, fill, stroke),
        label(W_EQUATION["cx"], W_EQUATION["y"] + 26, EQUATION_NAME, 14.5, title_c, "600"),
        equation_text(W_EQUATION["cx"], W_EQUATION["y"] + 66, 14.5, "equation" in lit),
        label(W_EQUATION["cx"], W_EQUATION["y"] + 92, "last year's ratio, grown by r,", 11, sub_c),
        label(W_EQUATION["cx"], W_EQUATION["y"] + 105, "shrunk by g", 11, sub_c),
    ]

    fill, stroke, title_c, sub_c = colours("paths" in lit)
    parts += [
        rect(W_PATHS, fill, stroke),
        label(W_PATHS["cx"], W_PATHS["y"] + 26, "Debt paths", 14, title_c, "600"),
        label(W_PATHS["cx"], W_PATHS["y"] + 43, "baseline and six", 10.5, sub_c),
        label(W_PATHS["cx"], W_PATHS["y"] + 56, "warming scenarios", 10.5, sub_c),
        fan(W_PATHS, W_PATHS["y"] + 70, W_PATHS["y"] + 112, "paths" in lit),
    ]

    fill, stroke, title_c, sub_c = colours("climate" in lit)
    bus = 241
    g_mid = W_PILL_Y["g"] + W_PILL_H / 2
    pb_mid = W_PILL_Y["pb"] + W_PILL_H / 2
    parts += [
        f'<path d="M {W_CLIMATE["cx"]} {W_CLIMATE["y"]} V 316 H {bus + 8} '
        f'Q {bus} 316 {bus} 308 V {g_mid}" fill="none" stroke="{ACCENT}" '
        f'stroke-width="1.6" stroke-dasharray="6 4"/>',
        f'<line x1="{bus}" y1="{pb_mid}" x2="{W_PILL_X - 2}" y2="{pb_mid}" '
        f'stroke="{ACCENT}" stroke-width="1.6" marker-end="url(#qcm-head-teal)"/>',
        f'<line x1="{bus}" y1="{g_mid}" x2="{W_PILL_X - 2}" y2="{g_mid}" '
        f'stroke="{ACCENT}" stroke-width="1.6" marker-end="url(#qcm-head-teal)"/>',
        rect(W_CLIMATE, fill, stroke, r=8),
        label(W_CLIMATE["cx"], W_CLIMATE["y"] + 23, "Warming scenarios", 14, title_c, "600"),
        label(W_CLIMATE["cx"], W_CLIMATE["y"] + 41, "six, from Paris-aligned to hot", 11, sub_c),
        label(W_CLIMATE["x"] + W_CLIMATE["w"] + 22, W_CLIMATE["y"] + 22, CLIMATE_NOTE[0], 11, MUTED, anchor="start"),
        label(W_CLIMATE["x"] + W_CLIMATE["w"] + 22, W_CLIMATE["y"] + 39, CLIMATE_NOTE[1], 11, MUTED, anchor="start"),
    ]

    parts += [
        h_arrow(W_PANEL["x"] + W_PANEL["w"] + 6, W_EQUATION["x"], W_ROW_Y, "feed", 11),
        h_arrow(W_EQUATION["x"] + W_EQUATION["w"] + 6, W_PATHS["x"], W_ROW_Y, "makes", 11),
    ]
    return frame(W_VIEW[0], W_VIEW[1], VARIANTS[key]["alt"], "".join(parts))


# --------------------------------------------------------------------------
# The tall layout: the same chain folded onto rows, for the PDF
# --------------------------------------------------------------------------

T_VIEW = (680, 706)
T_ING_Y, T_ING_H, T_ING_W = 12, 62, 204
T_ING_X = {"weo": 12, "wpp": 238, "controls": 464}
T_CLIMATE = box(400, 106, 268, 56)
T_PANEL = box(12, 196, 656, 150)
T_PILL_W, T_PILL_H = 198, 78
T_PILL_X = {"g": 26, "r": 241, "pb": 456}
T_PILL_Y = 252
T_EQUATION = box(148, 416, 384, 104)
T_PATHS = box(148, 566, 384, 126)


def tall_svg(key: str) -> str:
    lit: set[str] = VARIANTS[key]["lit"]
    parts: list[str] = []

    for ikey, name, source in INGREDIENTS:
        fill, stroke, title_c, sub_c = colours(ikey in lit)
        b = box(T_ING_X[ikey], T_ING_Y, T_ING_W, T_ING_H)
        parts += [
            rect(b, fill, stroke, r=8),
            label(b["cx"], b["y"] + 26, name, 14.5, title_c, "600"),
            label(b["cx"], b["y"] + 45, source, 11.5, sub_c),
        ]
    # The three converge on the spine that carries them into the panel.
    spine = T_PANEL["cx"]
    parts.append(
        f'<path d="M {T_ING_X["weo"] + T_ING_W / 2} {T_ING_Y + T_ING_H} V 88 H '
        f'{T_ING_X["controls"] + T_ING_W / 2} V {T_ING_Y + T_ING_H}" fill="none" '
        f'stroke="{LINE}" stroke-width="1.6"/>'
    )
    parts.append(
        f'<path d="M {spine} {T_ING_Y + T_ING_H} V 88" fill="none" stroke="{LINE}" '
        f'stroke-width="1.6"/>'
    )
    parts.append(
        v_arrow(spine, 88, T_PANEL["y"], "manufactured into", 12, verb_y=124, side="left")
    )

    fill, stroke, title_c, sub_c = colours("climate" in lit)
    parts += [
        rect(T_CLIMATE, fill, stroke, r=8),
        label(T_CLIMATE["cx"], T_CLIMATE["y"] + 24, "Warming scenarios", 15, title_c, "600"),
        label(T_CLIMATE["cx"], T_CLIMATE["y"] + 43, "six, from Paris-aligned to hot", 11.5, sub_c),
    ]

    parts += [
        rect(T_PANEL, PANEL_BG, PANEL_LINE, r=14),
        label(T_PANEL["cx"], T_PANEL["y"] + 26, "The three numbers the equation needs", 13.5, MUTED, "600"),
    ]
    for pkey, name, symbol, supplier in PILLS:
        fill, stroke, title_c, sub_c = colours(pkey in lit)
        pill = box(T_PILL_X[pkey], T_PILL_Y, T_PILL_W, T_PILL_H)
        parts.append(rect(pill, fill, stroke, r=8))
        parts.append(
            f'<text class="qcm-sans" x="{pill["cx"]}" y="{T_PILL_Y + 28}" font-size="15" '
            f'font-weight="600" fill="{title_c}" text-anchor="middle">{esc(name)}'
            f'<tspan class="qcm-serif" font-style="italic" font-weight="400" dx="7">'
            f"{esc(symbol)}</tspan></text>"
        )
        parts.append(label(pill["cx"], T_PILL_Y + 48, supplier[0], 11.5, sub_c))
        parts.append(label(pill["cx"], T_PILL_Y + 64, supplier[1], 11.5, sub_c))

    fill, stroke, title_c, sub_c = colours("equation" in lit)
    parts += [
        rect(T_EQUATION, fill, stroke),
        label(T_EQUATION["cx"], T_EQUATION["y"] + 28, EQUATION_NAME, 16, title_c, "600"),
        equation_text(T_EQUATION["cx"], T_EQUATION["y"] + 64, 18, "equation" in lit),
        label(T_EQUATION["cx"], T_EQUATION["y"] + 88, "last year's ratio, grown by r, shrunk by g", 11.5, sub_c),
    ]

    fill, stroke, title_c, sub_c = colours("paths" in lit)
    parts += [
        rect(T_PATHS, fill, stroke),
        label(T_PATHS["cx"], T_PATHS["y"] + 28, "Debt paths", 16, title_c, "600"),
        label(T_PATHS["cx"], T_PATHS["y"] + 47, "baseline and the six warming scenarios", 11.5, sub_c),
        fan(T_PATHS, T_PATHS["y"] + 62, T_PATHS["y"] + 110, "paths" in lit),
    ]

    # Warming reaches growth and the primary balance, never the equation.
    for pkey in ("g", "pb"):
        pill_cx = T_PILL_X[pkey] + T_PILL_W / 2
        parts.append(
            f'<path d="M {T_CLIMATE["cx"]} {T_CLIMATE["y"] + T_CLIMATE["h"]} V 182 '
            f'H {pill_cx} V {T_PILL_Y - 4}" fill="none" stroke="{ACCENT}" '
            f'stroke-width="1.6" stroke-dasharray="6 4" marker-end="url(#qcm-head-teal)"/>'
        )

    parts += [
        v_arrow(T_PANEL["cx"], T_PANEL["y"] + T_PANEL["h"] + 22, T_EQUATION["y"], "feed", 12),
        v_arrow(T_EQUATION["cx"], T_EQUATION["y"] + T_EQUATION["h"], T_PATHS["y"], "produces", 12),
        label(T_PANEL["cx"], T_PANEL["y"] + T_PANEL["h"] + 18, CLIMATE_NOTE[0] + " " + CLIMATE_NOTE[1], 11.5, MUTED),
    ]
    return frame(T_VIEW[0], T_VIEW[1], VARIANTS[key]["alt"], "".join(parts))


# --------------------------------------------------------------------------


def include_snippet(key: str, svg: str) -> str:
    """The Quarto snippet each module includes: inline SVG for HTML, PNG elsewhere."""
    caption = VARIANTS[key]["caption"]
    return (
        "<!-- Generated by scripts/build_course_map.py. Do not edit by hand. -->\n\n"
        "```{=html}\n"
        '<figure class="qc-map">\n'
        f"{svg}\n"
        f"<figcaption>{esc(caption)}</figcaption>\n"
        "</figure>\n"
        "```\n\n"
        '::: {.content-hidden when-format="html"}\n'
        f"![{caption}](figures/course-map-{key}-print.png)\n"
        ":::\n"
    )


def main() -> None:
    FIG_DIR.mkdir(parents=True, exist_ok=True)
    for key in VARIANTS:
        wide = wide_svg(key)
        (FIG_DIR / f"course-map-{key}.svg").write_text(wide + "\n")
        (FIG_DIR / f"course-map-{key}-print.svg").write_text(tall_svg(key) + "\n")
        (FIG_DIR / f"_course-map-{key}.qmd").write_text(include_snippet(key, wide))
        print(f"wrote course-map-{key} (screen and print) and its include")


if __name__ == "__main__":
    main()
