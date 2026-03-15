# Skill: UI Visual QA

**Context:** App package only
**When:** After UI implementation, before PR

## Process

1. Start the Shiny app: `uv run shiny run apps/qcraft-app/src/qcraft_app/app.py --port 8000 &`
2. Wait 5 seconds for startup
3. Take screenshots at 3 viewports using Playwright:

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    for width, name in [(1920, "desktop"), (1024, "tablet"), (375, "mobile")]:
        page = browser.new_page(viewport={"width": width, "height": 1080})
        page.goto("http://localhost:8000")
        page.wait_for_load_state("networkidle")
        page.screenshot(path=f"artifacts/ui/{name}.png", full_page=True)
    browser.close()
```

4. Smoke test checklist:
   - [ ] App loads without errors
   - [ ] Country selector works
   - [ ] Charts render with data
   - [ ] Numbers look reasonable for Uganda
   - [ ] No broken layout at any viewport

5. Write `artifacts/ui/ui-review.md` with findings
6. Kill the app: `kill %1`
