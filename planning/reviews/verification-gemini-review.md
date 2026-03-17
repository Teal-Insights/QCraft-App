# Verification Strategy Review — Gemini

## Summary
The 5-phase architecture is logically sound, but the implementation details in the code snippets contain "paper cut" bugs (missing imports, undefined variables) that will crash an autonomous agent. The most significant risk is the environment mismatch between "system Python" (for xlwings) and "uv venv" (for the engine), which could lead to dependency failures if not handled explicitly in `orchestrate.sh`.

## Findings

| # | Category | Severity | Finding | Recommendation |
|---|----------|----------|---------|----------------|
| 1 | VALID BUG | HIGH | `set_country_and_wait` snippet is missing `import time` and `logger` is undefined. | Add `import time` and `import logging; logger = logging.getLogger(__name__)` to the snippet. |
| 2 | VALID BUG | HIGH | Environment mismatch: Prompt says xlwings is in "system Python" but engine uses "uv venv". | Instruct Claude to install `xlwings` into the `uv` venv (`uv add xlwings`) so all phases run in a unified environment. |
| 3 | VALID CLARITY | MED | `killall 'Microsoft Excel'` is aggressive and will kill other workbooks the user might have open. | Use `app.kill()` or `app.quit()` more gracefully, or warn that the machine must be dedicated to this task. |
| 4 | VALID BUG | MED | Phase 1 doesn't specify an output file, breaking the "each script reads a checkpoint" chain. | Define `phase1_results.json` to store the 3-country smoke test results for Phase 4. |
| 5 | VALID ADDITION | MED | The country selector in Excel often uses full names or a specific mapping, not just ISO3C. | Phase 0 must extract the "Validation List" from the selector cell to map ISO3C to Excel's internal names. |
| 6 | VALID CLARITY | LOW | `timeout=30` may be too short for a 200k-formula workbook on a Mac Mini if memory is tight. | Increase default timeout to 60s and add a "first-run" longer wait. |
| 7 | VALID CLARITY | LOW | `run_pipeline` in the engine defaults to `debt_target=50.0`, but Excel default might be `60.0`. | Phase 0 should read the *actual* default values from the workbook to avoid false parity failures. |

## Structural Issues (Data Flow Gaps)

1. **Phase 1 Output:** Phase 1 performs a critical smoke test but the prompt doesn't define where its results go. Phase 4 (Report) needs these to include the "Anchor Country" (Uganda) verification in the final report.
2. **Phase 0 to Phase 2/3:** Phase 0 finds cell references, but Phases 2 and 3 need to "import" these from `phase0_config.json`. The prompt should explicitly tell the agent to load `phase0_config.json` in every subsequent phase.
3. **Country List:** The prompt hardcodes a 30-country list in Phase 2. If any of these are missing from the workbook (e.g., SSD, SOM), the script should gracefully skip them.

## Most Likely Crash Scenarios (ranked)

1. **DependencyError:** Running Phase 1 in system Python will fail to find `polars` and `qcraft_engine`.
2. **Excel Popup:** "This workbook contains links to other data sources" or "Enable Macros" dialogs will hang xlwings indefinitely.
3. **NameError:** `time` or `logger` being undefined in the copy-pasted `set_country_and_wait` function.
4. **KeyError:** Phase 4 trying to read a metric (e.g., `primary_expenditure`) that was renamed or missing in a crashed country's result dict.

## Edge Cases to Add to the Prompt

1. **Excel Calculation Mode:** Explicitly set `app.calculation = 'manual'` before setting cells and `app.calculate()` after, to prevent Excel from freezing during multi-cell updates (though `set_country_and_wait` handles one cell, Phase 3 sets four).
2. **Fragile States Data:** Countries like Somalia (SOM) often have `#VALUE!` or `N/A` in the Excel source. The script should detect these and log `EXCEL_DATA_MISSING` instead of `PARITY_FAILURE`.
3. **Display Context:** Remind the agent that `visible=False` still requires a Window Server on macOS. It cannot run over a raw SSH session without a logged-in GUI user.
