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

# The docking variant greys the base chain so the warming block reads as the
# piece being added. Everything dimmed drops to these, one tier paler than the
# resting palette.
DIM_LINE = "#EAEEF1"
DIM_TITLE = "#A7B4BC"
DIM_SUB = "#C3CCD2"
DIM_PANEL_BG = "#FBFCFD"

# The first node, decomposed by source. Two of the three arrive with the
# country; the third is the reader's. Each box names what it actually carries,
# because "macro series" on its own tells a reader nothing they can check. The
# WEO list is the eight sections scripts/extract_excel_data.py reads out of the
# workbook; the control list summarises the ten inputs in the Explorer's sidebar.
INGREDIENTS = (
    (
        "weo",
        "Macro series",
        "IMF World Economic Outlook",
        ("real GDP, nominal GDP, deflator,", "revenue, expenditure, debt,", "primary and overall balance"),
    ),
    (
        "wpp",
        "Population",
        "UN World Population Prospects",
        ("by age group, working age 15-64,", "medium, high and low variants"),
    ),
    (
        "controls",
        "The controls you set",
        "twelve, in the sidebar",
        ("country and demography variant,", "the growth assumptions,", "target, rule and rigidity"),
    ),
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

# On the docking variant the base chain is grey and this block is the subject,
# so the note beside it says what the two teal arrows are doing.
DOCK_NOTE = (
    "The block docks onto two nodes of a machine that already",
    "works. No new equation, no new term, two arrows.",
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
    # The second half of the M1 reveal. The base chain goes grey so the warming
    # block is the only thing at full contrast, with its two arrows thickened,
    # and the reader sees the piece arriving rather than a chain they have
    # already read four times.
    "m1-dock": {
        "lit": {"climate"},
        "dim": {"weo", "wpp", "controls", "g", "r", "pb", "equation", "paths"},
        "dock": True,
        "caption": (
            "The same map, with the base chain greyed out and the warming block "
            "highlighted. The block docks onto growth and the primary balance. "
            "Nothing else in the chain changes."
        ),
        "alt": (
            "The course map with the base chain greyed and the warming scenarios "
            "block highlighted, its two arrows docking onto growth and the "
            "primary balance."
        ),
    },
    # Step 1 of @sec-m2: the equation on its own, before anything supplies it.
    "m2": {
        "lit": {"equation"},
        "caption": (
            "Step 1 is the equation node on its own. It needs three numbers a "
            "year, and nothing on this map has supplied them yet."
        ),
        "alt": "The course map, with the debt dynamics equation highlighted.",
    },
    # The end of Step 2. The base machine is complete and running, and the
    # warming block is not drawn at all, because at this point in the chapter it
    # does not exist yet.
    "m2-base": {
        "lit": {"weo", "wpp", "controls", "g", "r", "pb", "equation", "paths"},
        "omit": {"climate"},
        "caption": (
            "The end of Step 2: a complete long-term fiscal projection model. "
            "The warming block is absent from this drawing because it has not "
            "been built yet. Run this chain and you get the baseline."
        ),
        "alt": (
            "The course map with every node in the base chain highlighted and "
            "the warming scenarios block absent."
        ),
    },
    # Step 3, the docking move, with its own caption for this chapter.
    "m2-dock": {
        "lit": {"climate"},
        "dim": {"weo", "wpp", "controls", "g", "r", "pb", "equation", "paths"},
        "dock": True,
        "caption": (
            "Step 3 adds one block and two arrows. The equation is untouched, "
            "the sources are untouched, and the interest rate never hears about "
            "the weather."
        ),
        "alt": (
            "The course map with the base chain greyed and the warming scenarios "
            "block highlighted, its two arrows docking onto growth and the "
            "primary balance."
        ),
    },
    # The chapter wrapper: everything lit at once.
    "m2-full": {
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
            "The three steps in one picture: an equation, a growth engine that "
            "feeds it, and a climate overlay that docks onto two of the three "
            "numbers."
        ),
        "alt": "The course map, with every node in the chain highlighted.",
    },
    "m3": {
        "lit": {"weo", "wpp", "controls", "g", "r", "pb"},
        "caption": (
            "This module is the start of the chain: the two sources the country "
            "selection loads, the controls you set on top of them, and the three "
            "numbers they move."
        ),
        "alt": (
            "The course map, with the two data sources, the controls you set, "
            "growth, the interest rate and the primary balance highlighted."
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


def colours(lit: bool, dim: bool = False) -> tuple[str, str, str, str]:
    """Fill, stroke, title colour, subtitle colour."""
    if lit:
        return ACCENT, ACCENT_DARK, WHITE, "#DFF6F0"
    if dim:
        return WHITE, DIM_LINE, DIM_TITLE, DIM_SUB
    return WHITE, LINE, INK, MUTED


def h_arrow(
    x1: float, x2: float, y: float, verb: str, size: float, dim: bool = False
) -> str:
    stroke = DIM_LINE if dim else LINE
    head = "qcm-head-dim" if dim else "qcm-head"
    out = (
        f'<line x1="{x1}" y1="{y}" x2="{x2 - 8}" y2="{y}" stroke="{stroke}" '
        f'stroke-width="1.8" marker-end="url(#{head})"/>'
    )
    if verb:
        out += label(
            (x1 + x2) / 2,
            y - 11,
            verb,
            size,
            DIM_SUB if dim else MUTED,
            weight="500",
            italic=True,
        )
    return out


def v_arrow(
    x: float,
    y1: float,
    y2: float,
    verb: str,
    size: float,
    verb_y: float | None = None,
    side: str = "right",
    dim: bool = False,
) -> str:
    stroke = DIM_LINE if dim else LINE
    head = "qcm-head-dim" if dim else "qcm-head"
    out = (
        f'<line x1="{x}" y1="{y1}" x2="{x}" y2="{y2 - 8}" stroke="{stroke}" '
        f'stroke-width="1.8" marker-end="url(#{head})"/>'
    )
    if verb:
        out += label(
            x + 14 if side == "right" else x - 14,
            verb_y if verb_y is not None else (y1 + y2) / 2 + 5,
            verb,
            size,
            DIM_SUB if dim else MUTED,
            weight="500",
            anchor="start" if side == "right" else "end",
            italic=True,
        )
    return out


def equation_text(cx: float, y: float, size: float, lit: bool, dim: bool = False) -> str:
    """The debt identity, set as a line of italic serif with real subscripts."""
    sub = round(size * 0.62, 1)
    drop = round(size * 0.28, 1)
    colour = WHITE if lit else (DIM_TITLE if dim else INK)
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


def fan(b: dict, top: float, bottom: float, lit: bool, dim: bool = False,
        single: bool = False) -> str:
    """A small fan of debt paths, so the last node reads as a chart at a glance.

    With single set, one line is drawn instead of four: on the variant that
    omits the warming block there is only a baseline to draw."""
    x0 = b["x"] + 16
    span = b["w"] - 32
    height = bottom - top
    if single:
        lines = [(WHITE if lit else INK, 0.16, 1.0)]
    elif lit:
        lines = [(WHITE, 0.16, 1.0), (WHITE, 0.46, 0.85), (WHITE, 0.72, 0.7), (WHITE, 1.0, 0.55)]
    elif dim:
        lines = [(DIM_SUB, 0.16, 1.0), (DIM_SUB, 0.46, 1.0), (DIM_SUB, 0.72, 1.0), (DIM_SUB, 1.0, 1.0)]
    else:
        lines = [(INK, 0.16, 1.0), ("#27AE60", 0.46, 1.0), ("#E67E22", 0.72, 1.0), ("#E74C3C", 1.0, 1.0)]
    parts = [
        f'<line x1="{x0 - 5}" y1="{bottom + 5}" x2="{x0 + span + 5}" y2="{bottom + 5}" '
        f'stroke="{WHITE if lit else (DIM_LINE if dim else PANEL_LINE)}" stroke-width="1.2" '
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
        f'<marker id="qcm-head-dim" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" '
        f'markerHeight="6.5" orient="auto-start-reverse">'
        f'<path d="M 0 1 L 9 5 L 0 9 z" fill="{DIM_LINE}"/></marker>'
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

# The ingredient boxes carry three lines each now (name, source, contents), so
# they stack the full height of the three-numbers panel beside them.
W_ING_X, W_ING_W, W_ING_H = 8, 200, 84
W_ING_Y = {"weo": 16, "wpp": 116, "controls": 216}
W_ING_BUS = 222

W_PANEL = box(254, 14, 222, 292)
W_PILL_X, W_PILL_W, W_PILL_H = 272, 186, 58
W_PILL_Y = {"g": 60, "r": 136, "pb": 212}

W_EQUATION = box(516, 104, 246, 122)
W_PATHS = box(808, 102, 126, 126)
W_CLIMATE = box(254, 326, 224, 54)
W_CLIMATE_BUS = 263


def wide_svg(key: str) -> str:
    lit: set[str] = VARIANTS[key]["lit"]
    dimmed: set[str] = VARIANTS[key].get("dim", set())
    omitted: set[str] = VARIANTS[key].get("omit", set())
    dock: bool = VARIANTS[key].get("dock", False)
    base_line = DIM_LINE if dock else LINE
    parts: list[str] = []

    # The three ingredients, each with its source and its actual contents named
    # under it, converging on a single bus that carries them into the
    # three-numbers panel.
    for ikey, name, source, contents in INGREDIENTS:
        d = ikey in dimmed
        fill, stroke, title_c, sub_c = colours(ikey in lit, d)
        b = box(W_ING_X, W_ING_Y[ikey], W_ING_W, W_ING_H)
        parts += [
            rect(b, fill, stroke, r=8),
            label(b["cx"], b["y"] + 20, name, 13, title_c, "600"),
            label(b["cx"], b["y"] + 35, source, 10.5, sub_c),
        ]
        for i, line in enumerate(contents):
            parts.append(label(b["cx"], b["y"] + 52 + i * 13, line, 10.5, sub_c))
        parts.append(
            f'<path d="M {b["x"] + b["w"]} {b["cy"]} H {W_ING_BUS}" fill="none" '
            f'stroke="{base_line}" stroke-width="1.6"/>'
        )
    parts.append(
        f'<path d="M {W_ING_BUS} {W_ING_Y["weo"] + W_ING_H / 2} V '
        f'{W_ING_Y["controls"] + W_ING_H / 2}" fill="none" stroke="{base_line}" '
        f'stroke-width="1.6"/>'
    )
    parts.append(h_arrow(W_ING_BUS, W_PANEL["x"], W_ROW_Y, "build", 11, dim=dock))

    panel_dim = dock
    parts += [
        rect(W_PANEL, DIM_PANEL_BG if panel_dim else PANEL_BG, DIM_LINE if panel_dim else PANEL_LINE, r=14),
        label(W_PANEL["cx"], W_PANEL["y"] + 20, "The three numbers", 12.5, DIM_SUB if panel_dim else MUTED, "600"),
        label(W_PANEL["cx"], W_PANEL["y"] + 36, "the equation needs", 12.5, DIM_SUB if panel_dim else MUTED, "600"),
    ]
    for pkey, name, symbol, supplier in PILLS:
        d = pkey in dimmed
        fill, stroke, title_c, sub_c = colours(pkey in lit, d)
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

    d = "equation" in dimmed
    fill, stroke, title_c, sub_c = colours("equation" in lit, d)
    parts += [
        rect(W_EQUATION, fill, stroke),
        label(W_EQUATION["cx"], W_EQUATION["y"] + 26, EQUATION_NAME, 14.5, title_c, "600"),
        equation_text(W_EQUATION["cx"], W_EQUATION["y"] + 66, 14.5, "equation" in lit, d),
        label(W_EQUATION["cx"], W_EQUATION["y"] + 92, "last year's ratio, grown by r,", 11, sub_c),
        label(W_EQUATION["cx"], W_EQUATION["y"] + 105, "shrunk by g", 11, sub_c),
    ]

    d = "paths" in dimmed
    fill, stroke, title_c, sub_c = colours("paths" in lit, d)
    paths_sub = (
        ("one path, and no", "scenario to compare")
        if "climate" in omitted
        else ("baseline and six", "warming scenarios")
    )
    parts += [
        rect(W_PATHS, fill, stroke),
        label(W_PATHS["cx"], W_PATHS["y"] + 26,
              "The baseline" if "climate" in omitted else "Debt paths", 14, title_c, "600"),
        label(W_PATHS["cx"], W_PATHS["y"] + 43, paths_sub[0], 10.5, sub_c),
        label(W_PATHS["cx"], W_PATHS["y"] + 56, paths_sub[1], 10.5, sub_c),
        fan(W_PATHS, W_PATHS["y"] + 70, W_PATHS["y"] + 112, "paths" in lit, d,
            single="climate" in omitted),
    ]

    if "climate" in omitted:
        parts += [
            h_arrow(W_PANEL["x"] + W_PANEL["w"] + 6, W_EQUATION["x"], W_ROW_Y, "feed", 11, dim=dock),
            h_arrow(W_EQUATION["x"] + W_EQUATION["w"] + 6, W_PATHS["x"], W_ROW_Y, "makes", 11, dim=dock),
        ]
        # Crop to the base chain. Keeping the full height would leave the band
        # the warming block usually occupies as blank space, which reads as a
        # rendering fault rather than as a deliberate absence.
        bottom = W_PANEL["y"] + W_PANEL["h"] + 12
        return frame(W_VIEW[0], bottom, VARIANTS[key]["alt"], "".join(parts))

    fill, stroke, title_c, sub_c = colours("climate" in lit, "climate" in dimmed)
    bus = W_CLIMATE_BUS
    dock_w = 2.8 if dock else 1.6
    g_mid = W_PILL_Y["g"] + W_PILL_H / 2
    pb_mid = W_PILL_Y["pb"] + W_PILL_H / 2
    parts += [
        f'<path d="M {W_CLIMATE["cx"]} {W_CLIMATE["y"]} V 316 H {bus + 8} '
        f'Q {bus} 316 {bus} 308 V {g_mid}" fill="none" stroke="{ACCENT}" '
        f'stroke-width="{dock_w}" stroke-dasharray="6 4"/>',
        f'<line x1="{bus}" y1="{pb_mid}" x2="{W_PILL_X - 2}" y2="{pb_mid}" '
        f'stroke="{ACCENT}" stroke-width="{dock_w}" marker-end="url(#qcm-head-teal)"/>',
        f'<line x1="{bus}" y1="{g_mid}" x2="{W_PILL_X - 2}" y2="{g_mid}" '
        f'stroke="{ACCENT}" stroke-width="{dock_w}" marker-end="url(#qcm-head-teal)"/>',
        rect(W_CLIMATE, fill, stroke, r=8),
        label(W_CLIMATE["cx"], W_CLIMATE["y"] + 23, "Warming scenarios", 14, title_c, "600"),
        label(W_CLIMATE["cx"], W_CLIMATE["y"] + 41, "six, from Paris to Hot unadapted", 11, sub_c),
    ]
    note = DOCK_NOTE if dock else CLIMATE_NOTE
    note_c = ACCENT_DARK if dock else MUTED
    parts += [
        label(W_CLIMATE["x"] + W_CLIMATE["w"] + 22, W_CLIMATE["y"] + 22, note[0], 11, note_c, anchor="start"),
        label(W_CLIMATE["x"] + W_CLIMATE["w"] + 22, W_CLIMATE["y"] + 39, note[1], 11, note_c, anchor="start"),
    ]

    parts += [
        h_arrow(W_PANEL["x"] + W_PANEL["w"] + 6, W_EQUATION["x"], W_ROW_Y, "feed", 11, dim=dock),
        h_arrow(W_EQUATION["x"] + W_EQUATION["w"] + 6, W_PATHS["x"], W_ROW_Y, "makes", 11, dim=dock),
    ]
    return frame(W_VIEW[0], W_VIEW[1], VARIANTS[key]["alt"], "".join(parts))


# --------------------------------------------------------------------------
# The tall layout: the same chain folded onto rows, for the PDF
# --------------------------------------------------------------------------

T_VIEW = (680, 748)
T_ING_Y, T_ING_H, T_ING_W = 12, 104, 214
T_ING_X = {"weo": 8, "wpp": 233, "controls": 458}
T_CLIMATE = box(400, 148, 268, 56)
T_PANEL = box(12, 238, 656, 150)
T_PILL_W, T_PILL_H = 198, 78
T_PILL_X = {"g": 26, "r": 241, "pb": 456}
T_PILL_Y = 294
T_EQUATION = box(148, 458, 384, 104)
T_PATHS = box(148, 608, 384, 126)
T_CONVERGE_Y = 130
T_DOCK_Y = 224


def tall_svg(key: str) -> str:
    lit: set[str] = VARIANTS[key]["lit"]
    dimmed: set[str] = VARIANTS[key].get("dim", set())
    omitted: set[str] = VARIANTS[key].get("omit", set())
    dock: bool = VARIANTS[key].get("dock", False)
    base_line = DIM_LINE if dock else LINE
    parts: list[str] = []

    for ikey, name, source, contents in INGREDIENTS:
        d = ikey in dimmed
        fill, stroke, title_c, sub_c = colours(ikey in lit, d)
        b = box(T_ING_X[ikey], T_ING_Y, T_ING_W, T_ING_H)
        parts += [
            rect(b, fill, stroke, r=8),
            label(b["cx"], b["y"] + 24, name, 14.5, title_c, "600"),
            label(b["cx"], b["y"] + 42, source, 11.5, sub_c),
        ]
        for i, line in enumerate(contents):
            parts.append(label(b["cx"], b["y"] + 63 + i * 14, line, 10.5, sub_c))
    # The three converge on the spine that carries them into the panel.
    spine = T_PANEL["cx"]
    parts.append(
        f'<path d="M {T_ING_X["weo"] + T_ING_W / 2} {T_ING_Y + T_ING_H} V {T_CONVERGE_Y} H '
        f'{T_ING_X["controls"] + T_ING_W / 2} V {T_ING_Y + T_ING_H}" fill="none" '
        f'stroke="{base_line}" stroke-width="1.6"/>'
    )
    parts.append(
        f'<path d="M {spine} {T_ING_Y + T_ING_H} V {T_CONVERGE_Y}" fill="none" '
        f'stroke="{base_line}" stroke-width="1.6"/>'
    )
    parts.append(
        v_arrow(
            spine,
            T_CONVERGE_Y,
            T_PANEL["y"],
            "manufactured into",
            12,
            verb_y=T_CONVERGE_Y + 36,
            side="left",
            dim=dock,
        )
    )

    if "climate" not in omitted:
        fill, stroke, title_c, sub_c = colours("climate" in lit, "climate" in dimmed)
        parts += [
            rect(T_CLIMATE, fill, stroke, r=8),
            label(T_CLIMATE["cx"], T_CLIMATE["y"] + 24, "Warming scenarios", 15, title_c, "600"),
            label(T_CLIMATE["cx"], T_CLIMATE["y"] + 43, "six, from Paris to Hot unadapted", 11.5, sub_c),
        ]

    panel_dim = dock
    parts += [
        rect(T_PANEL, DIM_PANEL_BG if panel_dim else PANEL_BG, DIM_LINE if panel_dim else PANEL_LINE, r=14),
        label(T_PANEL["cx"], T_PANEL["y"] + 26, "The three numbers the equation needs", 13.5, DIM_SUB if panel_dim else MUTED, "600"),
    ]
    for pkey, name, symbol, supplier in PILLS:
        d = pkey in dimmed
        fill, stroke, title_c, sub_c = colours(pkey in lit, d)
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

    d = "equation" in dimmed
    fill, stroke, title_c, sub_c = colours("equation" in lit, d)
    parts += [
        rect(T_EQUATION, fill, stroke),
        label(T_EQUATION["cx"], T_EQUATION["y"] + 28, EQUATION_NAME, 16, title_c, "600"),
        equation_text(T_EQUATION["cx"], T_EQUATION["y"] + 64, 18, "equation" in lit, d),
        label(T_EQUATION["cx"], T_EQUATION["y"] + 88, "last year's ratio, grown by r, shrunk by g", 11.5, sub_c),
    ]

    d = "paths" in dimmed
    fill, stroke, title_c, sub_c = colours("paths" in lit, d)
    parts += [
        rect(T_PATHS, fill, stroke),
        label(T_PATHS["cx"], T_PATHS["y"] + 28,
              "The baseline" if "climate" in omitted else "Debt paths", 16, title_c, "600"),
        label(T_PATHS["cx"], T_PATHS["y"] + 47,
              "one path, and no scenario to compare it with" if "climate" in omitted
              else "baseline and the six warming scenarios", 11.5, sub_c),
        fan(T_PATHS, T_PATHS["y"] + 62, T_PATHS["y"] + 110, "paths" in lit, d,
            single="climate" in omitted),
    ]

    # Warming reaches growth and the primary balance, never the equation.
    if "climate" not in omitted:
        dock_w = 2.8 if dock else 1.6
        for pkey in ("g", "pb"):
            pill_cx = T_PILL_X[pkey] + T_PILL_W / 2
            parts.append(
                f'<path d="M {T_CLIMATE["cx"]} {T_CLIMATE["y"] + T_CLIMATE["h"]} V {T_DOCK_Y} '
                f'H {pill_cx} V {T_PILL_Y - 4}" fill="none" stroke="{ACCENT}" '
                f'stroke-width="{dock_w}" stroke-dasharray="6 4" marker-end="url(#qcm-head-teal)"/>'
            )

    note = DOCK_NOTE if dock else CLIMATE_NOTE
    parts += [
        v_arrow(T_PANEL["cx"], T_PANEL["y"] + T_PANEL["h"] + 22, T_EQUATION["y"], "feed", 12, dim=dock),
        v_arrow(T_EQUATION["cx"], T_EQUATION["y"] + T_EQUATION["h"], T_PATHS["y"], "produces", 12, dim=dock),
    ]
    if "climate" not in omitted:
        parts.append(
            label(T_PANEL["cx"], T_PANEL["y"] + T_PANEL["h"] + 18, note[0] + " " + note[1], 11.5, ACCENT_DARK if dock else MUTED)
        )
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
