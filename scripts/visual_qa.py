"""Visual QA — take screenshots of the Q-CRAFT Explorer app with Playwright."""

import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

APP_PORT = 8765
APP_URL = f"http://localhost:{APP_PORT}"
PROJECT_ROOT = Path(__file__).resolve().parent.parent
SCREENSHOT_DIR = PROJECT_ROOT / "docs" / "screenshots"
APP_ENTRY = PROJECT_ROOT / "apps" / "qcraft-app" / "app.py"


def start_app() -> subprocess.Popen:
    """Start the Shiny app as a subprocess."""
    proc = subprocess.Popen(
        [sys.executable, "-m", "shiny", "run", str(APP_ENTRY), "--port", str(APP_PORT)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    # Wait for the app to be ready
    for _ in range(30):
        time.sleep(1)
        try:
            import urllib.request

            urllib.request.urlopen(APP_URL, timeout=2)
            print("App is ready.")
            return proc
        except Exception:
            pass
    proc.kill()
    msg = "App did not start within 30 seconds"
    raise TimeoutError(msg)


def take_screenshots() -> None:
    """Take screenshots of each tab."""
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})

        # Navigate and wait for initial load
        page.goto(APP_URL, wait_until="networkidle")
        # Wait for Plotly charts to render
        page.wait_for_timeout(5000)

        # 1. Baseline tab (default) — hero screenshot for README
        page.screenshot(path=str(SCREENSHOT_DIR / "baseline.png"), full_page=False)
        print(f"Saved: {SCREENSHOT_DIR / 'baseline.png'}")

        # 2. Analysis tab
        page.click("text=Analysis")
        page.wait_for_timeout(3000)
        page.screenshot(path=str(SCREENSHOT_DIR / "analysis.png"), full_page=False)
        print(f"Saved: {SCREENSHOT_DIR / 'analysis.png'}")

        # 3. Climate tab
        page.click("text=Climate")
        page.wait_for_timeout(3000)
        page.screenshot(path=str(SCREENSHOT_DIR / "climate.png"), full_page=False)
        print(f"Saved: {SCREENSHOT_DIR / 'climate.png'}")

        # 4. Go back to Baseline for hero shot (Uganda is already default)
        page.click("text=Baseline")
        page.wait_for_timeout(3000)
        page.screenshot(path=str(SCREENSHOT_DIR / "hero.png"), full_page=False)
        print(f"Saved: {SCREENSHOT_DIR / 'hero.png'}")

        browser.close()


if __name__ == "__main__":
    proc = start_app()
    try:
        take_screenshots()
        print("\nVisual QA complete. Screenshots saved to docs/screenshots/")
    finally:
        proc.terminate()
        proc.wait(timeout=5)
