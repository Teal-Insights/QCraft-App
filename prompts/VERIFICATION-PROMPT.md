# Multi-Country Parity Verification (Mac Mini Overnight Run)

## Context
Q-CRAFT Explorer is a Python reimplementation of the IMF's Q-CRAFT Excel tool.
We need to verify that our engine produces the same outputs as the Excel workbook
across many countries and parameter combinations. Demo is Wednesday for IMF/WB.

Excel workbook: `source-materials/2024_IMF-FAD_Q-CRAFT-Tool-v10.xlsx`
Existing extraction script: `scripts/extract_excel_data.py`
Existing golden master tests: `packages/qcraft-engine/tests/` (198 tests, Uganda)

## IMPORTANT: This runs on a Mac Mini with Excel installed
- Install xlwings into the uv venv so all phases run in a unified environment:
  ```bash
  cd ~/Projects
  git clone https://github.com/Teal-Insights/QCraft-App.git qcraft-verification
  cd qcraft-verification
  ~/.local/bin/uv sync
  ~/.local/bin/uv add xlwings
  ```
- Excel (Microsoft 365) is installed
- Excel must be CLOSED before xlwings opens it
- `visible=False` still requires a Window Server on macOS — run from a local
  terminal or a logged-in GUI session, NOT over raw SSH
- All scripts run with `uv run python` (unified environment)

## Architecture: 5 Sequential Scripts + Orchestrator

DO NOT write one giant script. Split into 5 scripts that Claude Code runs sequentially.
Each script reads a checkpoint file from the previous phase and writes its own.

```
scripts/verify/
  orchestrate.sh          # Runs all phases in sequence
  phase0_discovery.py     # Map Excel cell references
  phase1_smoke.py         # 3 countries, xlwings smoke test
  phase2_breadth.py       # 30 countries, default params
  phase3_sensitivity.py   # 5 countries × 5 param combos
  phase4_report.py        # Generate PARITY_REPORT.md
```

All results go to `verification-logs/`.

IMPORTANT: Every phase must load `verification-logs/phase0_config.json` to get
the cell references discovered in Phase 0. Do not hardcode cell locations.

## Country Name Mapping

The Excel workbook's country selector uses **full country names** (e.g., "Uganda",
"Maldives"), NOT ISO3 codes. The dropdown at `Dashboard!C12` is sourced from
`Macrofiscal!$A$67:$A$264`.

Build an explicit ISO3 ↔ workbook name mapping in Phase 0:
- Read the validation list source range to extract all valid country names
- Map each to our ISO3 codes using `scripts/extract_excel_data.py`'s name map
- Store the mapping in `phase0_config.json`
- Drive Excel with workbook country names; log both identifiers in the report

Note: Some names need special handling (e.g., "Côte d'Ivoire", "Türkiye",
"South Sudan, Republic of"). The extraction script already has these mappings.

## Status Taxonomy

Use these statuses throughout all phases (not just PASS/FAIL):

| Status | Meaning |
|--------|---------|
| `PARITY_PASS` | All metrics ≤ 0.1pp |
| `PARITY_REVIEW` | At least one metric 0.1–0.5pp |
| `PARITY_FAIL` | At least one metric > 0.5pp |
| `EXCEL_SELECTION_ERROR` | Country name not accepted by workbook |
| `EXCEL_RECALC_ERROR` | Recalculation produced errors or timed out |
| `EXCEL_DATA_MISSING` | Output cells contain `#REF!`, `#VALUE!`, `#N/A`, or `None` |
| `ENGINE_DATA_GAP` | Country missing from one of the 4 parquet sources |
| `CACHE_INVALID` | openpyxl cached values used (diagnostics only) |
| `CONFIG_MISMATCH` | Excel/Python defaults diverge (logged, not a parity failure) |
| `PYTHON_ERROR` | Engine threw an exception |
| `TIMEOUT` | Excel recalc did not stabilize in time |

## Tolerance Bands

The SPEC says ±0.1pp for ratios. Use two bands:
- **PASS**: ≤ 0.1pp — clean parity
- **REVIEW**: 0.1–0.5pp — worth investigating but not blocking
- **FAIL**: > 0.5pp — real divergence

Always report exact diffs. Never label ≤0.5pp as "clean parity."

Exception: Uganda in Phase 1 compares against `tests/golden_masters/final/uganda.csv`
at ±0.1pp (tight tolerance, since we have ground truth).

## Phase 0: Workbook Discovery (15 min)

Open the Excel workbook with openpyxl (NOT data_only — we want formulas)
and map the structure:

1. List all sheet names
2. Find the country selector cell — known to be `Dashboard!C12` (a data
   validation dropdown sourced from `Macrofiscal!$A$67:$A$264`)
3. Find input cells on the Dashboard:
   - `C17` — debt target
   - `C20:C21` — fiscal rule related
   - `C24:C25` — additional params
   - `C28:C29` — interest rate settings
   - `C33:C34` — fiscal rule Yes/No (sourced from `Baseline!C50:C51`)
   - `C38` — expenditure rigidity (feeds scenario sheets, NOT baseline)
4. Find output tables on `Output Baseline` and `Output Scenarios` sheets
   (there is NO `Results` sheet). Also check raw calc sheets: `Baseline`,
   `Paris`, etc.
5. Read Excel's actual default values for all inputs (debt_target, fiscal_rule,
   etc.) — do NOT assume they match Python engine defaults
6. Determine which country was last cached (check with data_only=True)
7. Extract the full country name list from the validation source range and
   build the ISO3 ↔ name mapping
8. Check for WEO max year: find the last year with non-formula historical
   data and compare to engine's `PROJ_START = 2030` (implies WEO max = 2029)

Save to `verification-logs/phase0_config.json`:
```json
{
  "country_selector_cell": "Dashboard!C12",
  "country_name_map": {"UGA": "Uganda", "USA": "United States", ...},
  "input_cells": {
    "debt_target": "Dashboard!C17",
    "fiscal_rule": "Dashboard!C33",
    "expenditure_rigidity": "Dashboard!C38",
    "interest_rate_mode": "Dashboard!C28"
  },
  "excel_defaults": {
    "debt_target": 60.0,
    "fiscal_rule": "Yes",
    "expenditure_rigidity": 1.0,
    "interest_rate_mode": "Nominal interest rate"
  },
  "engine_defaults_comparison": {
    "debt_target": {"excel": 60.0, "python": 50.0, "match": false},
    "...": "..."
  },
  "output_cells": {
    "debt_to_gdp": {"sheet": "Output Baseline", "...": "..."},
    "revenue_percent_gdp": {"sheet": "Output Baseline", "...": "..."}
  },
  "cached_country": "Afghanistan",
  "weo_max_year": 2029,
  "has_vba_macros": false,
  "has_external_links": true,
  "check_years": [2030, 2040, 2050, 2070, 2099]
}
```

IMPORTANT: The Q-CRAFT workbook is complex. Spend time here. Get the cell
references right. This is the foundation for everything else.

Also inspect: Does the workbook have VBA macros? External links?
These affect how xlwings opens it. Note: `update_links=False` suppresses
link-update prompts but may leave stale external-link values in place.

IMPORTANT: Cached openpyxl values (data_only=True) are **diagnostics only**.
Do not use them for pass/fail parity claims. Many cells may already show
`#VALUE!` or stale values. Classify these as `CACHE_INVALID`.

Commit after Phase 0: `git commit -m "verify: Phase 0 — workbook discovery"`

## Phase 1: xlwings Smoke Test — 3 Countries (30 min)

Test that xlwings can actually drive the workbook. This is the critical gate.

### xlwings Setup Pattern
```python
import shutil
import time
import uuid
import logging
import xlwings as xw

logger = logging.getLogger(__name__)

# NEVER modify the original workbook
original = "source-materials/2024_IMF-FAD_Q-CRAFT-Tool-v10.xlsx"
temp_copy = f"/tmp/qcraft_verify_{uuid.uuid4().hex[:8]}.xlsx"
shutil.copy(original, temp_copy)

app = xw.App(visible=False)
app.display_alerts = False
wb = app.books.open(temp_copy, update_links=False)
```

### Recalculation Handshake
After setting the country selector, you MUST wait for Excel to finish.

The country selector is a data validation dropdown. Set it by assigning the
**full country name** directly to the cell value (e.g., `ws[cell].value = 'Uganda'`),
NOT by simulating dropdown interaction, and NOT with ISO3 codes.

```python
def set_country_and_wait(ws, cell_ref, country_name, sentinel_cells, timeout=60):
    """Set country and wait for recalculation to complete.

    Args:
        ws: xlwings sheet
        cell_ref: country selector cell (e.g., 'C12')
        country_name: full country name as it appears in workbook (e.g., 'Uganda')
        sentinel_cells: list of output cells to check for stability
        timeout: seconds to wait (60s default for Mac Mini)
    """
    import time

    ws[cell_ref].value = country_name
    app = ws.book.app
    app.calculate()

    # Poll for stable AND valid output across sentinel cells
    last_vals = [None] * len(sentinel_cells)
    stable_count = 0
    start = time.time()

    while time.time() - start < timeout:
        current_vals = []
        for cell in sentinel_cells:
            val = ws[cell].value
            current_vals.append(val)

        # Check all values are numeric and non-error
        all_valid = all(
            isinstance(v, (int, float)) and not isinstance(v, bool)
            for v in current_vals
        )

        if all_valid and current_vals == last_vals:
            stable_count += 1
            if stable_count >= 3:  # Stable for 3 reads = done
                return True
        else:
            stable_count = 0
        last_vals = current_vals
        time.sleep(0.3)

    logger.warning(f"Recalc timeout for {country_name} after {timeout}s")
    return False
```

IMPORTANT: A stable value does NOT mean a correct value. Check that output
cells are numeric (not `None`, not error strings like `#REF!`, `#VALUE!`,
`#N/A`). If any output is non-numeric, classify as `EXCEL_DATA_MISSING`.

### Cleanup Pattern
```python
try:
    # ... do work ...
finally:
    try:
        wb.close()
        app.quit()
    except Exception:
        try:
            app.kill()
        except Exception:
            import os
            os.system("killall 'Microsoft Excel'")
```

### Countries for Phase 1
- Uganda (UGA / "Uganda") — baseline, already verified with golden masters
- United States (USA / "United States") — large economy, easy to spot errors
- Maldives (MDV / "Maldives") — SIDS, climate vulnerable, small economy

### What to Compare

**CRITICAL: Set ALL inputs explicitly.** Do not rely on Excel defaults or engine
defaults — they diverge (e.g., Excel debt_target=60, Python debt_target=50).
For Phase 1, read the actual Excel defaults from Phase 0 config and pass the
SAME values to `run_pipeline()`.

For each country, compare the **full 2030-2099 series** (not just checkpoints).
Report the worst absolute diff and its year. Also report values at checkpoints
2030, 2040, 2050, 2070, 2099 for the summary table.

**Primary metrics (fiscal outputs):**
- debt_to_gdp
- revenue_percent_gdp
- primary_balance_percent_gdp
- primary_expenditure_percent_gdp

**Intermediate metrics (catch compensating errors):**
- nominal_gdp (from baseline_v1 results)
- real_gdp_growth_percent (from baseline_v1)
- nominal_interest_rate (from interest_rate results)

For the Excel side, identify the GDP output row during Phase 0 discovery.
Even comparing GDP at 2050 and 2099 for the 3 Phase 1 countries catches the
most dangerous compensating errors (e.g., wrong GDP + wrong revenue = correct
revenue-to-GDP ratio).

Then run the Python engine with explicit params matching Excel:
```python
from qcraft_engine.data_loader import load_parquet_data, run_pipeline

data = load_parquet_data()
# Use the SAME params as Excel — read from phase0_config.json excel_defaults
params = {
    "debt_target": 60.0,       # from Excel, NOT engine default of 50
    "fiscal_rule": "Yes",
    "expenditure_rigidity": 1.0,
    "select_rate": "Nominal interest rate",
}
results = run_pipeline(data, "UGA", params=params)
fiscal = results["fiscal"]
baseline = results["baseline_v1"]
interest = results["interest_rate"]
```

### WEO Vintage Sanity Check (Phase 1 only)
For Uganda, compare **WEO-period values (2023-2029)** between Excel and Python.
These should match to machine precision since they come from the same source data.
If they diverge, the parquet extraction is stale and all subsequent comparisons
are compromised. Log as `CONFIG_MISMATCH` and flag prominently.

### Gate: If Phase 1 fails
- If xlwings can't open the workbook → document why, fall back to openpyxl
  cached-country check only (classify as `CACHE_INVALID`), then proceed
- If xlwings works but numbers don't match → log detailed diffs, continue
  to Phase 2 anyway (the diffs are valuable data)
- If Uganda xlwings values differ from `tests/golden_masters/final/uganda.csv`
  at ±0.1pp → STOP. The cell mapping is wrong. Fix Phase 0 first.
  (Use golden master CSVs as ground truth, NOT the Python engine output)
- For USA and MDV, use ±0.5pp (no golden masters available)

Save results to `verification-logs/phase1_results.json`.

Commit: `git commit -m "verify: Phase 1 — xlwings smoke test (3 countries)"`

## Phase 2: Breadth Test — 30 Countries, Default Params (2-3 hours)

### Preflight: Country Availability Check
Before starting, verify which countries are available in BOTH systems:
```python
from qcraft_engine.data_loader import load_parquet_data, get_country_list
data = load_parquet_data()
engine_countries = get_country_list(data)
```
Cross-reference with Phase 0's Excel country name map. Classify countries
missing from the engine as `ENGINE_DATA_GAP` (don't attempt parity comparison).
Classify countries in engine but not in Excel as `NOT_IN_EXCEL`.

Also compare Excel's full country list (from Phase 0) against `get_country_list()`
output — flag any countries available in Excel but not in Python.

### Stratified Country Sample (LIC-DSF weighted)
```python
COUNTRIES = {
    # LIC Fragile (5)
    "SSD": "South Sudan",
    "SOM": "Somalia",
    "MOZ": "Mozambique",
    "CAF": "Central African Republic",
    "TCD": "Chad",

    # LIC Stable (8)
    "UGA": "Uganda",
    "RWA": "Rwanda",
    "SEN": "Senegal",
    "BEN": "Benin",
    "GHA": "Ghana",
    "KEN": "Kenya",
    "TZA": "Tanzania",
    "ETH": "Ethiopia",

    # Blend/Emerging (7)
    "EGY": "Egypt",
    "NGA": "Nigeria",
    "ZMB": "Zambia",
    "LKA": "Sri Lanka",
    "PAK": "Pakistan",
    "BRA": "Brazil",
    "IND": "India",

    # Advanced (5) — people will try these
    "USA": "United States",
    "JPN": "Japan",
    "DEU": "Germany",
    "GBR": "United Kingdom",
    "AUS": "Australia",

    # Small Islands (5)
    "MDV": "Maldives",
    "MUS": "Mauritius",
    "FJI": "Fiji",
    "SLB": "Solomon Islands",
    "GRD": "Grenada",
}
```

NOTE: SSD and GRD may be missing from the engine's all-datasets intersection
(absent from productivity data). The preflight check will catch this —
classify as `ENGINE_DATA_GAP`, not `PARITY_FAIL`.

### IMPORTANT: Set ALL inputs explicitly for every country
Read Excel defaults from `phase0_config.json` and set every dashboard input
before reading outputs. Pass identical params to `run_pipeline()`.

### Checkpoint Pattern
Write `IN_PROGRESS` BEFORE starting each country, then update after:
```python
checkpoint = {
    "phase": 2,
    "completed": ["UGA", "RWA", ...],
    "in_progress": None,  # or current country ISO3
    "results": {"UGA": {"status": "PARITY_PASS", "worst_diff": 0.03, "worst_year": 2067, ...}, ...},
    "timestamp": "2026-03-17T..."
}
# Save to verification-logs/phase2_checkpoint.json
```

If the script restarts, treat `in_progress` entries as `TIMEOUT` and retry them.

### Compare Full Series
For each country, compare the **full 2030-2099 annual series** for all metrics.
Report the worst absolute diff and its year. The Excel recalc cost is already
paid — comparing all years is cheap and prevents false passes from
divergences that peak between checkpoint years.

### Mid-Phase Sanity Gate
Every 10 countries, check pass rate:
```python
if (i + 1) % 10 == 0:
    total = i + 1
    passed = sum(1 for r in results.values() if r["status"] == "PARITY_PASS")
    rate = passed / total
    logger.info(f"Progress: {total}/{len(countries)}, pass rate: {rate:.0%}")
    if rate < 0.5:
        logger.critical(f"Pass rate {rate:.0%} < 50%. Check cell mapping.")
        # Don't abort — but flag prominently in report
```

Note: We use 50% not 85% as the gate because many LIC countries may have
data issues in the Excel that cause mismatches. We want to LEARN, not abort.

### Timeout Escalation
- If xlwings hangs: timeout after 60s, kill Excel, restart, log as `TIMEOUT`
- If 3+ consecutive timeouts: restart Excel completely (kill + reopen workbook)
- If 5+ consecutive timeouts after restart: increase timeout to 120s
- If still failing after 5+ more: skip remaining countries and note in report
- If Python engine crashes: log the traceback, mark as `PYTHON_ERROR`, continue
- If country not in Excel: mark as `EXCEL_SELECTION_ERROR`, continue

Commit: `git commit -m "verify: Phase 2 — breadth test (30 countries)"`

## Phase 3: Input Sensitivity — 5 Countries × 5 Param Combos (2-3 hours)

This catches "right answer for wrong reason" — where our engine matches
Excel's defaults but diverges when you change inputs.

### Countries
Uganda (LIC), Kenya (LIC-blend), Maldives (SIDS), Brazil (EM), Japan (AE)

### Parameter Combinations
```python
PARAM_COMBOS = [
    {
        "label": "default",
        "debt_target": 50.0,
        "fiscal_rule": "Yes",
        "expenditure_rigidity": 1.0,
        "select_rate": "Nominal interest rate",
    },
    {
        "label": "no_rule",
        "debt_target": 50.0,
        "fiscal_rule": "No",
        "expenditure_rigidity": 1.0,
        "select_rate": "Nominal interest rate",
    },
    {
        "label": "low_target",
        "debt_target": 30.0,
        "fiscal_rule": "Yes",
        "expenditure_rigidity": 0.5,
        "select_rate": "Nominal interest rate",
    },
    {
        "label": "flexible_high_target",
        "debt_target": 70.0,
        "fiscal_rule": "Yes",
        "expenditure_rigidity": 0.0,
        "select_rate": "Nominal interest rate",
    },
    {
        "label": "igd_mode",
        "debt_target": 50.0,
        "fiscal_rule": "Yes",
        "expenditure_rigidity": 1.0,
        "select_rate": "Interest-growth differential",
    },
]
```

### IMPORTANT: Set inputs sequentially in Excel
When changing multiple inputs, set country FIRST, wait for recalc, THEN set
params, wait again. Do not set all at once — recalculation may be
order-dependent if VBA macros or circular references are involved.

For each country × param combo:
1. Set country name in Excel (using full name from name map)
2. Wait for recalculation (60s timeout)
3. Set params in Excel (debt_target, fiscal_rule, interest_rate_mode)
4. Wait for recalculation again
5. Read outputs — full 2030-2099 series
6. Run Python engine with same params:
   ```python
   results = run_pipeline(data, "UGA", params={
       "debt_target": 50.0,
       "fiscal_rule": "No",
       "select_rate": "Nominal interest rate",
       "expenditure_rigidity": 1.0,
   })
   ```
7. Compare

### Climate Scenario Comparison (for rigidity combos)
`expenditure_rigidity` only affects `calc_climate_scenario()`, NOT the baseline.
The `flexible_high_target` combo (rigidity=0.0) is a no-op for baseline comparison.

For at least Uganda and Maldives, also compare ONE climate scenario output:
- Set the climate scenario in Excel (if a scenario selector is discoverable in Phase 0)
- Compare `Hot Unadapted` scenario debt-to-GDP and primary expenditure at 2050, 2099
- Run `calc_climate_scenario()` with matching params
- If Excel doesn't have an accessible scenario selector, document as a known gap

### What This Tests
- Fiscal rule ON vs OFF: does our engine's fiscal adjustment match?
- High vs low debt target: does convergence behavior match?
- Rigid vs flexible spending: does expenditure growth respond correctly in CLIMATE scenarios?
- Interest-growth differential mode: does prior-year GDP growth usage match?

Same checkpoint pattern as Phase 2.

Commit: `git commit -m "verify: Phase 3 — input sensitivity (5 × 5 combos)"`

## Phase 4: Report Generation

### Parity Report
Generate `verification-logs/PARITY_REPORT.md` with:

```markdown
# Q-CRAFT Parity Verification Report
Generated: [timestamp]
Engine version: [git SHA]
Excel workbook: 2024_IMF-FAD_Q-CRAFT-Tool-v10.xlsx
WEO vintage check: [PASS/FAIL — from Phase 1]

## Executive Summary
- Countries tested: X (Phase 2) + Y sensitivity combos (Phase 3)
- PARITY_PASS (≤ 0.1pp): N
- PARITY_REVIEW (0.1–0.5pp): R
- PARITY_FAIL (> 0.5pp): M
- EXCEL_RECALC_ERROR: E
- EXCEL_DATA_MISSING: D
- ENGINE_DATA_GAP: G
- PYTHON_ERROR: K
- TIMEOUT: T

## Detailed Results Table
| Country | ISO3 | Params | Worst Diff | Worst Year | Worst Metric | Status |
|---------|------|--------|-----------|-----------|-------------|--------|

## PARITY_FAIL Countries (Detail)
[For each: which years, which metrics, exact deviations, full series worst diff]

## PARITY_REVIEW Countries
[Worth investigating but not blocking for demo]

## Excel/Data Issues
[EXCEL_RECALC_ERROR, EXCEL_DATA_MISSING, ENGINE_DATA_GAP — separate from parity]

## Intermediate Metric Checks (Phase 1 only)
[GDP, interest rate, inflation comparisons for UGA, USA, MDV]

## WEO Vintage Check
[2023-2029 comparison for Uganda — should match exactly]

## Config Mismatches
[Excel vs Python defaults — logged for awareness]

## Patterns Observed
[Any systematic issues — e.g., "all SIDS have higher debt divergence after 2070"]

## Recommendations
[What to fix before the demo]
```

### Also generate a CSV
`verification-logs/parity_results.csv` — machine-readable, all comparisons.
Include: country, iso3, params_label, year, metric, excel_value, python_value,
abs_diff, status.

### Narrative Summary (for the companion guide)
Generate `verification-logs/VERIFICATION_NARRATIVE.md` — a 2-paragraph summary
suitable for non-technical economists explaining how verification was done and
what the results mean. Use the framing:
- "Input fidelity": same data goes in
- "Output parity": same numbers come out
- "Stress testing": works across diverse countries and parameters

Commit: `git commit -m "verify: Phase 4 — parity report"`
Push and create PR: `feat/multi-country-verification`
Add review comment: `gh pr comment --body "@claude please review"`

## Environment Notes
- `uv` is at `~/.local/bin/uv`
- Install xlwings into uv venv: `uv add xlwings`
- All scripts run with `uv run python` (unified environment)
- Excel must be CLOSED before xlwings opens it
- If running on Mac Mini via ssh/screen, Excel needs a display context
  (xlwings uses AppleScript). Run from a local terminal, not ssh.

## Domain Rules (from CLAUDE.md)
- Do NOT change engine computation logic
- Do NOT edit golden masters in tests/golden_masters/ (existing ones)
- New verification files in verification-logs/ and scripts/verify/ are fine
- Use Context7 before writing Polars code
