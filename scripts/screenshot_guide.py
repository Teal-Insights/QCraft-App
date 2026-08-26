"""Screenshot rendered pages of the companion guide for visual review.

Vision QA on the course map needs the diagram as a reader meets it: inside the
page, at page width, in the book's own type. This drives headless_shell (the
Chromium shell Playwright ships, not a full Chrome install) over the built book
in docs/companion-guide/_book/ and writes PNGs to review-screenshots/.

Two shots per target: the figure on its own, cropped to the element, and the
section around it for context.

Render the book first, then run from the repository root:

    uv run --no-project --with playwright python3 scripts/screenshot_guide.py
    uv run --no-project --with playwright python3 scripts/screenshot_guide.py m3

Override the browser with HEADLESS_SHELL=/path/to/headless_shell.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

REPO_ROOT = Path(__file__).resolve().parent.parent
BOOK_DIR = REPO_ROOT / "docs" / "companion-guide" / "_book"
OUT_DIR = REPO_ROOT / "review-screenshots"

VIEWPORT = {"width": 1500, "height": 1000}
SCALE = 2

PAGES = {
    "index": "index.html",
    "m0": "m0-start-here.html",
    "m1": "m1-how-qcraft-thinks.html",
    "m2": "m2-debt-equation.html",
    "m3": "m3-parameters.html",
    "m4": "m4-worked-example.html",
    "m5": "m5-boundaries.html",
    "m6": "m6-capstone.html",
}

# Page, CSS selector for the figure, output stem.
DEFAULT_TARGETS = [
    ("m0", "figure.qc-map", "course-map-m0"),
    ("m1", "figure.qc-map", "course-map-m1"),
    ("m2", "figure.qc-map", "course-map-m2"),
    ("m3", "figure.qc-map", "course-map-m3"),
    ("m4", "figure.qc-map", "course-map-m4"),
    ("m5", "figure.qc-map", "course-map-m5"),
    ("m6", "figure.qc-map", "course-map-m6"),
]


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


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    requested = sys.argv[1:]
    targets = (
        [t for t in DEFAULT_TARGETS if t[0] in requested] if requested else DEFAULT_TARGETS
    )
    if requested and not targets:
        targets = [(page, "figure.qc-map", f"course-map-{page}") for page in requested]

    with sync_playwright() as play:
        browser = play.chromium.launch(executable_path=find_headless_shell())
        page = browser.new_page(viewport=VIEWPORT, device_scale_factor=SCALE)
        for name, selector, stem in targets:
            html = BOOK_DIR / PAGES[name]
            if not html.exists():
                msg = f"{html} is missing. Render the book first."
                raise FileNotFoundError(msg)
            page.goto(html.as_uri())
            page.wait_for_load_state("networkidle")
            page.evaluate("document.fonts.ready")
            figure = page.locator(selector).first
            figure.scroll_into_view_if_needed()
            page.wait_for_timeout(250)
            figure.screenshot(path=OUT_DIR / f"{stem}.png")
            page.screenshot(path=OUT_DIR / f"{stem}-in-page.png")
            print(f"{name} -> {stem}.png and {stem}-in-page.png")
        browser.close()


if __name__ == "__main__":
    main()
