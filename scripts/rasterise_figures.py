"""Rasterise the guide's SVG figures to PNG for the PDF build.

The HTML book uses the SVGs inline, so they inherit the bundled open faces from
_custom.css. LaTeX cannot place an SVG without rsvg-convert, which is not a
dependency of this repository, so each figure is also rendered to PNG here.

Rendering goes through headless_shell (the Chromium shell Playwright ships,
not a full Chrome install). Each SVG is wrapped in a page that declares the
same bundled woff2 files the book uses, so the PNG sets in the same faces as
the HTML.

Run from the repository root, after scripts/build_course_map.py and
scripts/build_parameter_context.py:

    python3 scripts/rasterise_figures.py

Override the browser with HEADLESS_SHELL=/path/to/headless_shell.
"""

from __future__ import annotations

import math
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
GUIDE_DIR = REPO_ROOT / "docs" / "companion-guide"
FIG_DIR = GUIDE_DIR / "figures"
FONT_DIR = GUIDE_DIR / "fonts" / "open"

# Each figure renders at its own drawn width, then the device scale factor
# multiplies it up. A 680-unit figure comes out at 2040px, which is about 310
# dpi across a 6.5 inch text column.
SCALE = 3

FONT_FACES = [
    ("Inter", "400", "normal", "inter/Inter-Regular.woff2"),
    ("Inter", "600", "normal", "inter/Inter-SemiBold.woff2"),
    ("Inter", "700", "normal", "inter/Inter-Bold.woff2"),
    ("Inter", "400", "italic", "inter/Inter-Italic.woff2"),
    ("IBM Plex Serif", "400", "normal", "ibm-plex-serif/IBMPlexSerif-Regular.woff2"),
    ("IBM Plex Serif", "600", "normal", "ibm-plex-serif/IBMPlexSerif-SemiBold.woff2"),
]

PAGE = """<!doctype html>
<html><head><meta charset="utf-8"><style>
{faces}
html, body {{ margin: 0; padding: 0; background: #FFFFFF; }}
svg {{ display: block; width: {width}px; height: auto; }}
</style></head><body>{svg}</body></html>
"""


def find_headless_shell() -> str:
    override = os.environ.get("HEADLESS_SHELL")
    if override:
        return override
    cache = Path.home() / "Library" / "Caches" / "ms-playwright"
    if not cache.exists():
        cache = Path.home() / ".cache" / "ms-playwright"
    candidates = sorted(cache.glob("chromium_headless_shell-*/*/chrome-headless-shell"))
    candidates += sorted(cache.glob("chromium_headless_shell-*/*/headless_shell"))
    if not candidates:
        msg = (
            "headless_shell not found. Install it with `playwright install "
            "chromium-headless-shell`, or set HEADLESS_SHELL."
        )
        raise FileNotFoundError(msg)
    return str(candidates[-1])


def font_faces() -> str:
    blocks = []
    for family, weight, style, rel in FONT_FACES:
        path = FONT_DIR / rel
        if not path.exists():
            continue
        blocks.append(
            f"@font-face {{ font-family: '{family}'; src: url('{path.as_uri()}') "
            f"format('woff2'); font-weight: {weight}; font-style: {style}; }}"
        )
    return "\n".join(blocks)


def svg_size(svg: str) -> tuple[int, int]:
    match = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svg)
    if not match:
        msg = "SVG has no viewBox, so its render size is unknown"
        raise ValueError(msg)
    return math.ceil(float(match.group(1))), math.ceil(float(match.group(2)))


def rasterise(shell: str, svg_path: Path, faces: str) -> Path:
    svg = svg_path.read_text()
    width, height = svg_size(svg)
    png_path = svg_path.with_suffix(".png")
    with tempfile.TemporaryDirectory() as tmp:
        page = Path(tmp) / "figure.html"
        page.write_text(PAGE.format(faces=faces, width=width, svg=svg))
        result = subprocess.run(
            [
                shell,
                "--headless",
                "--disable-gpu",
                "--hide-scrollbars",
                "--no-sandbox",
                f"--force-device-scale-factor={SCALE}",
                f"--window-size={width},{height}",
                "--virtual-time-budget=4000",
                f"--screenshot={png_path}",
                page.as_uri(),
            ],
            capture_output=True,
            text=True,
            check=False,
        )
        if not png_path.exists():
            sys.stderr.write(result.stderr)
            msg = f"headless_shell produced no PNG for {svg_path.name}"
            raise RuntimeError(msg)
    return png_path


def main() -> None:
    shell = find_headless_shell()
    faces = font_faces()
    # A figure that ships a separate -print.svg is screen-only; the print
    # sibling is the one LaTeX places.
    svgs = [
        path
        for path in sorted(FIG_DIR.glob("*.svg"))
        if not path.with_name(f"{path.stem}-print.svg").exists()
    ]
    if not svgs:
        print("no SVGs in docs/companion-guide/figures/")
        return
    for svg_path in svgs:
        png = rasterise(shell, svg_path, faces)
        print(f"{svg_path.name} -> {png.name} ({png.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
