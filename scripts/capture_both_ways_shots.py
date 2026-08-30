"""Capture the preface and workbook-appendix screenshots, both surfaces.

The preface pairs the official workbook's Dashboard with the Explorer, and
the workbook appendix walks the workbook's own sheets. Every image is a real
capture from the real artifact:

    Explorer   Playwright against the live deployment, Verified mode, Uganda,
               every control left at its default (which matches the workbook's
               shipped settings: rule on, target 60).
    Workbook   Microsoft Excel driven over Apple Events on a scratch COPY of
               the posted v10 file. Uganda is selected in Dashboard!C12 (the
               appendix's own first step) and nothing else is touched. Each
               range or chart is copied with Excel's `copy picture` at screen
               appearance, and the vector PDF flavour on the clipboard is
               rasterised with sips, so nothing is retouched and the type
               stays sharp at any scale.

Sanity check built in: after selecting Uganda the script reads Output
Scenarios!F14 and requires the 2099 baseline debt ratio to read 47.0, the
course's golden-master figure, before any capture is written.

Run on macOS with Excel installed, from the repository root:

    QCRAFT_WORKBOOK=/path/to/2024_IMF-FAD_Q-CRAFT-Tool-v10.xlsx \
        uv run --no-project --with playwright python3 scripts/capture_both_ways_shots.py

Writes into docs/companion-guide/figures/screenshots/.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT = REPO_ROOT / "docs" / "companion-guide" / "figures" / "screenshots"
URL = os.environ.get(
    "QCRAFT_APP_URL", "https://teal-insights.github.io/QCraft-App/explorer/"
)
WORKBOOK = os.environ.get("QCRAFT_WORKBOOK", "")

# Sheet, range or chart index, output stem, max raster edge in px.
WORKBOOK_SHOTS = [
    ("Dashboard", "range:A1:F42", "workbook-dashboard", 1728),
    ("Output Baseline", "chart:6", "workbook-baseline-debt", 1600),
    ("Output Scenarios", "chart:5", "workbook-scenarios-debt", 1600),
    ("Output Scenarios", "range:A1:G21", "workbook-summary-tables", 1500),
]


def osascript(script: str) -> str:
    result = subprocess.run(
        ["osascript", "-"], input=script, capture_output=True, text=True, check=False
    )
    if result.returncode != 0:
        raise RuntimeError(f"osascript failed: {result.stderr.strip()}")
    return result.stdout.strip()


def excel_tell(body: str) -> str:
    return osascript(
        "with timeout of 180 seconds\n"
        'tell application "Microsoft Excel"\n'
        f"{body}\n"
        "end tell\n"
        "end timeout\n"
    )


def clipboard_pdf_to(path: Path) -> None:
    osascript(
        "set d to the clipboard as «class PDF »\n"
        f'set f to open for access (POSIX file "{path}") with write permission\n'
        "set eof f to 0\n"
        "write d to f\n"
        "close access f\n"
    )


def shoot_workbook() -> None:
    if not WORKBOOK or not Path(WORKBOOK).exists():
        sys.exit("Set QCRAFT_WORKBOOK to the posted v10 .xlsx (see the docstring).")
    with tempfile.TemporaryDirectory() as tmp:
        scratch = Path(tmp) / "qcraft-v10-scratch.xlsx"
        shutil.copy(WORKBOOK, scratch)
        excel_tell(f'open POSIX file "{scratch}"\ndelay 5')
        excel_tell(
            'set value of range "C12" of worksheet "Dashboard" of workbook '
            f'"{scratch.name}" to "Uganda"\ncalculate\ndelay 3'
        )
        check = excel_tell(
            'return value of range "F14" of worksheet "Output Scenarios" of '
            f'workbook "{scratch.name}"'
        )
        if abs(float(check) - 47.0) > 0.05:
            raise RuntimeError(
                f"Uganda 2099 baseline read {check}, not the golden-master 47.0; "
                "refusing to capture from an unexpected workbook state."
            )
        for sheet, target, stem, edge in WORKBOOK_SHOTS:
            kind, _, ref = target.partition(":")
            obj = (
                f'range "{ref}" of worksheet "{sheet}"'
                if kind == "range"
                else f'chart object {ref} of worksheet "{sheet}"'
            )
            excel_tell(
                f'activate object worksheet "{sheet}" of workbook "{scratch.name}"\n'
                f'copy picture ({obj} of workbook "{scratch.name}") '
                "appearance screen format picture\ndelay 1"
            )
            pdf = Path(tmp) / f"{stem}.pdf"
            clipboard_pdf_to(pdf)
            OUT.mkdir(parents=True, exist_ok=True)
            subprocess.run(
                ["sips", "-s", "format", "png", "--resampleHeightWidthMax", str(edge),
                 str(pdf), "--out", str(OUT / f"{stem}.png")],
                check=True, capture_output=True,
            )
            print(f"  wrote screenshots/{stem}.png")
        excel_tell(f'close workbook "{scratch.name}" saving no')


def shoot_explorer() -> None:
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(
            viewport={"width": 1440, "height": 900}, device_scale_factor=2
        )
        page.goto(URL)
        page.wait_for_timeout(4000)
        verified = page.locator(".mode__switch").get_by_role(
            "radio", name="Verified", exact=True
        )
        if verified.get_attribute("aria-checked") != "true":
            verified.click()
            page.wait_for_timeout(1200)
        page.select_option("#country", "UGA")
        page.wait_for_timeout(2000)
        page.get_by_role("tab", name="Analysis", exact=True).click()
        page.wait_for_timeout(1500)
        OUT.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(OUT / "explorer-analysis.png"))
        print("  wrote screenshots/explorer-analysis.png")
        browser.close()


def main() -> None:
    which = sys.argv[1] if len(sys.argv) > 1 else "all"
    if which in ("all", "explorer"):
        shoot_explorer()
    if which in ("all", "workbook"):
        shoot_workbook()


if __name__ == "__main__":
    main()
