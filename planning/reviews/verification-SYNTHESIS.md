# Verification Strategy — Council Review Synthesis
**Date:** 2026-03-17
**Reviewers:** Claude Opus, ChatGPT/Codex, Gemini Deep Think

## Summary Statistics
| Category | Claude | Codex | Gemini | Total |
|----------|--------|-------|--------|-------|
| VALID BUG | 2 | 8 | 4 | 14 |
| VALID ADDITION | 4 | 3 | 1 | 8 |
| VALID CLARITY | 3 | 0 | 3 | 6 |
| FALSE POSITIVE | 1 | 0 | 0 | 1 |

## Convergence (flagged by 2+ reviewers)

1. **Country selector uses full names, not ISO3** — Codex #1, Gemini #5. The workbook dropdown at `Dashboard!C12` contains country names from `Macrofiscal!$A$67:$A$264`. Writing ISO3 codes will silently fail. Both reviewers independently verified this against the actual workbook.

2. **Excel and Python defaults diverge** — Codex #3, Gemini #7. Excel caches `debt_target=60`, engine defaults to `50`. Phase 1 compares with "default params" but doesn't set inputs explicitly, guaranteeing false diffs.

3. **expenditure_rigidity only affects climate scenarios** — Codex #8, Claude #4. The `flexible` param combo in Phase 3 compares baseline outputs, but rigidity is only used in `calc_climate_scenario()`. Without comparing climate outputs, the rigidity test is a no-op.

4. **Tolerance mismatch: prompt uses ±0.5pp, spec says ±0.1pp** — Codex #6, Claude #3. The golden master tests use `abs=0.01` (0.01pp). The prompt's ±0.5pp is 50x looser and could hide real bugs.

5. **Interest rate mode never tested** — Codex #9, Claude (investigation thread #3). Phase 3 only varies debt_target, fiscal_rule, rigidity. The IGD mode uses prior-year GDP growth — a bug there is invisible with default nominal mode.

6. **Recalc handshake can false-complete on errors** — Codex #5, Claude #6. A stable `#VALUE!` or stale cached number satisfies the "3 stable reads" check. Excel errors aren't detected.

7. **No intermediate output verification** — Claude #1, Codex (alternative failure modes). Comparing only 4 ratio metrics allows compensating errors (wrong GDP + wrong revenue = correct ratio).

## All Findings (ranked by severity)

| # | Finding | Reviewer(s) | Category | Severity | Action |
|---|---------|-------------|----------|----------|--------|
| 1 | Country selector uses names not ISO3 | Codex, Gemini | VALID BUG | HIGH | Fix: build iso3→name map, drive Excel with names |
| 2 | Phase 0 example cell refs are wrong | Codex | VALID BUG | HIGH | Fix: replace guessed cells with actual (`Dashboard!C12`, `C17`, `C20:C21`, etc.) |
| 3 | Defaults diverge — must set all inputs explicitly | Codex, Gemini | VALID BUG | HIGH | Fix: set every input in Excel AND pass same to `run_pipeline()` |
| 4 | Code snippets missing `import time`, `logger` undefined | Gemini | VALID BUG | HIGH | Fix: add missing imports to snippets |
| 5 | Environment mismatch (system Python vs uv venv) | Gemini | VALID BUG | HIGH | Fix: install xlwings in uv venv, run everything with `uv run` |
| 6 | Recalc handshake false-completes on errors/stale values | Codex | VALID BUG | HIGH | Fix: gate on numeric + non-error, not just stable |
| 7 | openpyxl cached values untrustworthy as evidence | Codex | VALID BUG | HIGH | Fix: classify cache reads as diagnostics only |
| 8 | Rigidity param only affects climate, not baseline | Codex, Claude | VALID BUG | HIGH | Fix: add climate scenario comparison for rigidity combos |
| 9 | No intermediate output verification | Claude | VALID BUG | HIGH | Add: check GDP, interest rate, inflation for Phase 1 countries |
| 10 | WEO vintage mismatch has no detection step | Claude | VALID BUG | HIGH | Add: compare WEO-period (2023-2029) values in Phase 1 |
| 11 | Report taxonomy too coarse | Codex | VALID ADDITION | HIGH | Fix: add granular statuses (PARITY_PASS/REVIEW/FAIL, EXCEL_ERROR, etc.) |
| 12 | Phase 1 Uganda gate tolerance inconsistency | Claude | VALID ADDITION | HIGH | Fix: Uganda uses ±0.1pp vs golden masters; others use ±0.5pp |
| 13 | ±0.5pp is 50x looser than spec's ±0.1pp | Codex | VALID BUG | MED | Fix: use two-band reporting (PASS ≤0.1pp, REVIEW 0.1-0.5pp, FAIL >0.5pp) |
| 14 | SSD and GRD missing from engine data | Codex | VALID BUG | MED | Fix: preflight country availability check |
| 15 | Phase 1 doesn't define output file | Gemini | VALID BUG | MED | Fix: define `phase1_results.json` |
| 16 | No check for Excel error values (#REF!, #VALUE!) | Claude | VALID ADDITION | MED | Add: detect and log `EXCEL_ERROR` for non-numeric cells |
| 17 | Compare full 2030-2099 series, not just 5 checkpoints | Codex | VALID ADDITION | MED | Add: compare full series, report worst diff and its year |
| 18 | No climate scenario verification at all | Claude | VALID ADDITION | MED | Add: at least Uganda+MDV for one climate scenario |
| 19 | Interest rate mode never tested | Codex, Claude | VALID ADDITION | MED | Add: one IGD combo in Phase 3 |
| 20 | Checkpoint should write IN_PROGRESS before starting | Claude | VALID CLARITY | MED | Fix: write status before starting, update after |
| 21 | Consecutive timeouts should trigger escalation | Claude | VALID ADDITION | MED | Add: restart Excel after 3 timeouts, longer timeout after 5 |
| 22 | `killall 'Microsoft Excel'` too aggressive | Gemini | VALID CLARITY | MED | Fix: use `app.kill()` first, `killall` as last resort |
| 23 | Country selector: set value directly, not dropdown | Claude | VALID CLARITY | LOW | Add: note about direct cell assignment |
| 24 | `run_pipeline` param names don't match prompt | Claude | VALID CLARITY | LOW | Fix: show exact `params` dict |
| 25 | timeout=30 may be too short for Mac Mini | Gemini | VALID CLARITY | LOW | Fix: increase to 60s default |
| 26 | Phase 0→Phase 2/3 config loading not explicit | Gemini | VALID CLARITY | LOW | Fix: tell agent to load phase0_config.json |

## Rejected Findings
| # | Finding | Reviewer | Reason |
|---|---------|----------|--------|
| 1 | 30-country sample not well-stratified | Claude (FALSE POSITIVE) | Claude itself flagged this as false positive — sample is well-chosen |
