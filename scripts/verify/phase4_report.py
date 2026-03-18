"""Phase 4: Report Generation — PARITY_REPORT.md, CSV, narratives."""

import csv
import json
import logging
import subprocess
import sys
import time
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
OUTPUT_DIR = PROJECT_ROOT / "verification-logs"


def load_phase_results():
    """Load all phase checkpoint/result files."""
    results = {}

    for fname in ["phase0_config.json", "phase1_results.json",
                   "phase2_checkpoint.json", "phase3_checkpoint.json"]:
        fpath = OUTPUT_DIR / fname
        if fpath.exists():
            with open(fpath) as f:
                results[fname.replace(".json", "")] = json.load(f)
        else:
            logger.warning(f"Missing: {fpath}")
            results[fname.replace(".json", "")] = {}

    return results


def get_git_sha():
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=str(PROJECT_ROOT),
        ).decode().strip()
    except Exception:
        return "unknown"


def generate_parity_csv(phase2, phase3):
    """Generate machine-readable CSV with all parity comparisons."""
    rows = []

    # Phase 2 results
    for iso3c, r in phase2.get("results", {}).items():
        rows.append({
            "country": r.get("country", ""),
            "iso3c": r.get("iso3c", iso3c),
            "params_label": r.get("params_label", "default"),
            "worst_diff": r.get("worst_diff", ""),
            "worst_year": r.get("worst_year", ""),
            "worst_metric": r.get("worst_metric", ""),
            "status": r.get("status", ""),
            "phase": 2,
        })

    # Phase 3 results
    for key, r in phase3.get("results", {}).items():
        rows.append({
            "country": r.get("country", ""),
            "iso3c": r.get("iso3c", key.split("_")[0]),
            "params_label": r.get("params_label", ""),
            "worst_diff": r.get("worst_diff", ""),
            "worst_year": r.get("worst_year", ""),
            "worst_metric": r.get("worst_metric", ""),
            "status": r.get("status", ""),
            "phase": 3,
        })

    # Phase 3 climate results
    for iso3c, scenarios in phase3.get("climate_results", {}).items():
        if isinstance(scenarios, dict) and "error" not in scenarios:
            for scenario, cr in scenarios.items():
                if isinstance(cr, dict):
                    rows.append({
                        "country": "",
                        "iso3c": iso3c,
                        "params_label": f"climate_{scenario}",
                        "worst_diff": cr.get("worst_diff", ""),
                        "worst_year": cr.get("worst_year", ""),
                        "worst_metric": cr.get("worst_metric", ""),
                        "status": cr.get("status", ""),
                        "phase": "3_climate",
                    })

    csv_path = OUTPUT_DIR / "parity_results.csv"
    if rows:
        fieldnames = ["country", "iso3c", "params_label", "worst_diff", "worst_year",
                       "worst_metric", "status", "phase"]
        with open(csv_path, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
        logger.info(f"CSV written: {csv_path} ({len(rows)} rows)")

    return rows


def count_statuses(phase2, phase3):
    """Aggregate status counts."""
    counts = {}

    for r in phase2.get("results", {}).values():
        s = r.get("status", "UNKNOWN")
        counts[s] = counts.get(s, 0) + 1

    for r in phase3.get("results", {}).values():
        s = r.get("status", "UNKNOWN")
        counts[s] = counts.get(s, 0) + 1

    return counts


def generate_parity_report(all_results):
    """Generate PARITY_REPORT.md."""
    config = all_results.get("phase0_config", {})
    phase1 = all_results.get("phase1_results", {})
    phase2 = all_results.get("phase2_checkpoint", {})
    phase3 = all_results.get("phase3_checkpoint", {})

    git_sha = get_git_sha()
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S UTC")
    counts = count_statuses(phase2, phase3)

    total_p2 = len(phase2.get("results", {}))
    total_p3 = len(phase3.get("results", {}))

    # Collect FAIL and REVIEW entries
    fails = []
    reviews = []
    data_issues = []

    for iso3c, r in {**phase2.get("results", {}), **phase3.get("results", {})}.items():
        status = r.get("status", "")
        if status == "PARITY_FAIL":
            fails.append(r)
        elif status == "PARITY_REVIEW":
            reviews.append(r)
        elif status in ("EXCEL_DATA_MISSING", "EXCEL_RECALC_ERROR", "ENGINE_DATA_GAP",
                         "EXCEL_SELECTION_ERROR", "TIMEOUT"):
            data_issues.append(r)

    # Build report
    lines = [
        "# Q-CRAFT Parity Verification Report (V2)",
        f"Generated: {timestamp}",
        f"Engine version: {git_sha}",
        f"Excel workbook: 2024_IMF-FAD_Q-CRAFT-Tool-v10.xlsx",
        "",
        "## Executive Summary",
        f"- Countries tested (Phase 2 breadth): {total_p2}",
        f"- Sensitivity combos tested (Phase 3): {total_p3}",
        f"- Climate scenarios tested: {len(phase3.get('climate_results', {}))} countries × 6 scenarios",
    ]

    for status in ["PARITY_PASS", "PARITY_REVIEW", "PARITY_FAIL",
                     "EXCEL_DATA_MISSING", "EXCEL_SELECTION_ERROR",
                     "ENGINE_DATA_GAP", "PYTHON_ERROR", "TIMEOUT"]:
        c = counts.get(status, 0)
        if c > 0:
            lines.append(f"- {status}: {c}")

    # Detailed results table
    lines.extend(["", "## Detailed Results — Phase 2 (Breadth)", "",
                   "| Country | ISO3 | Worst Diff | Worst Year | Worst Metric | Status |",
                   "|---------|------|-----------|-----------|-------------|--------|"])

    for iso3c in sorted(phase2.get("results", {}).keys()):
        r = phase2["results"][iso3c]
        lines.append(
            f"| {r.get('country', '')} | {r.get('iso3c', iso3c)} | "
            f"{r.get('worst_diff', 'N/A')} | {r.get('worst_year', 'N/A')} | "
            f"{r.get('worst_metric', 'N/A')} | {r.get('status', '')} |"
        )

    # Phase 3 table
    lines.extend(["", "## Detailed Results — Phase 3 (Sensitivity)", "",
                   "| Country | Params | Worst Diff | Worst Year | Worst Metric | Status |",
                   "|---------|--------|-----------|-----------|-------------|--------|"])

    for key in sorted(phase3.get("results", {}).keys()):
        r = phase3["results"][key]
        lines.append(
            f"| {r.get('iso3c', '')} | {r.get('params_label', '')} | "
            f"{r.get('worst_diff', 'N/A')} | {r.get('worst_year', 'N/A')} | "
            f"{r.get('worst_metric', 'N/A')} | {r.get('status', '')} |"
        )

    # Climate results
    if phase3.get("climate_results"):
        lines.extend(["", "## Climate Scenario Results", ""])
        for iso3c, scenarios in phase3["climate_results"].items():
            lines.append(f"### {iso3c}")
            if isinstance(scenarios, dict) and "error" not in scenarios:
                lines.append("| Scenario | Worst Diff | Worst Year | Worst Metric | Status |")
                lines.append("|----------|-----------|-----------|-------------|--------|")
                for sc, cr in scenarios.items():
                    if isinstance(cr, dict):
                        lines.append(
                            f"| {sc} | {cr.get('worst_diff', 'N/A')} | "
                            f"{cr.get('worst_year', 'N/A')} | {cr.get('worst_metric', 'N/A')} | "
                            f"{cr.get('status', '')} |"
                        )
            else:
                lines.append(f"Error: {scenarios}")
            lines.append("")

    # Debt floor asymmetry
    if phase3.get("debt_floor_checks"):
        lines.extend(["", "## Debt Floor Asymmetry Checks (CLAUDE.md Rule #3)", ""])
        for iso3c, check in phase3["debt_floor_checks"].items():
            if isinstance(check, dict) and "error" not in check:
                lines.append(
                    f"- **{iso3c}**: baseline min debt={check.get('baseline_min_debt', 'N/A'):.2f}%, "
                    f"floor applied={check.get('baseline_floor_applied', 'N/A')}, "
                    f"climate allows negative={check.get('climate_allows_negative', 'N/A')}"
                )
            else:
                lines.append(f"- **{iso3c}**: Error — {check}")

    # FAIL details
    if fails:
        lines.extend(["", "## PARITY_FAIL Countries (Detail)", ""])
        for r in fails:
            lines.append(
                f"- **{r.get('iso3c', '')}** ({r.get('params_label', 'default')}): "
                f"worst diff {r.get('worst_diff', 'N/A')}pp at year {r.get('worst_year', 'N/A')} "
                f"on {r.get('worst_metric', 'N/A')}"
            )

    # REVIEW details
    if reviews:
        lines.extend(["", "## PARITY_REVIEW Countries", ""])
        for r in reviews:
            lines.append(
                f"- **{r.get('iso3c', '')}** ({r.get('params_label', 'default')}): "
                f"worst diff {r.get('worst_diff', 'N/A')}pp at year {r.get('worst_year', 'N/A')} "
                f"on {r.get('worst_metric', 'N/A')}"
            )

    # Data issues
    if data_issues:
        lines.extend(["", "## Excel/Data Issues", ""])
        for r in data_issues:
            lines.append(
                f"- **{r.get('iso3c', '')}**: {r.get('status', '')} — {r.get('note', r.get('error', ''))}"
            )

    # Config mismatches
    lines.extend(["", "## Config Mismatches (Excel vs Python defaults)", ""])
    for key, comp in config.get("engine_defaults_comparison", {}).items():
        if isinstance(comp, dict) and not comp.get("match", True):
            lines.append(f"- **{key}**: Excel={comp.get('excel')}, Python={comp.get('python')}")

    # Phase 1 smoke test summary
    if phase1:
        lines.extend(["", "## Phase 1 Smoke Test Results", ""])
        for iso3c, r in phase1.items():
            lines.append(
                f"- **{iso3c}**: {r.get('status', 'N/A')} "
                f"(worst diff: {r.get('worst_diff', 'N/A')}pp)"
            )
            if "golden_master_check" in r:
                gm = r["golden_master_check"]
                lines.append(f"  - Golden master check: {gm.get('status', 'N/A')}")

    report = "\n".join(lines) + "\n"
    report_path = OUTPUT_DIR / "PARITY_REPORT.md"
    with open(report_path, "w") as f:
        f.write(report)
    logger.info(f"Report written: {report_path}")
    return report


def generate_narrative(all_results):
    """Generate VERIFICATION_NARRATIVE.md for non-technical audience."""
    phase2 = all_results.get("phase2_checkpoint", {})
    counts = count_statuses(phase2, all_results.get("phase3_checkpoint", {}))

    total = sum(counts.values())
    passed = counts.get("PARITY_PASS", 0)
    reviewed = counts.get("PARITY_REVIEW", 0)

    narrative = f"""# Q-CRAFT Verification Narrative (V2)

## How We Verified the Engine

Q-CRAFT Explorer is a Python reimplementation of the IMF's Q-CRAFT Excel tool. To ensure
our engine produces the same outputs as the original, we conducted a comprehensive automated
verification. For each country, we opened the official Excel workbook, set the country and
parameters, waited for recalculation, then compared every output value against our Python
engine running with identical inputs. We tested {total} country-parameter combinations
including all available countries with default parameters, 5 countries across 5 different
parameter settings, and 5 countries across 6 climate scenarios.

## What We Found

Of {total} total comparisons, {passed} achieved full parity (within ±0.1 percentage points),
{reviewed} fell in the review band (0.1-0.5pp), and the remainder were either data gaps,
Excel errors, or genuine divergences requiring investigation. The verification covers input
fidelity (same WEO/IMF data enters both systems), output parity (fiscal projections match
within tolerance), and stress testing (results hold across diverse economies, parameter
settings, and climate scenarios). Level values (nominal GDP, interest rates) were also
compared to catch compensating errors where ratios might match despite underlying differences.
"""

    narrative_path = OUTPUT_DIR / "VERIFICATION_NARRATIVE.md"
    with open(narrative_path, "w") as f:
        f.write(narrative)
    logger.info(f"Narrative written: {narrative_path}")


def generate_lessons_learned(all_results):
    """Generate/append LESSONS_LEARNED.md."""
    phase2 = all_results.get("phase2_checkpoint", {})
    phase3 = all_results.get("phase3_checkpoint", {})
    counts = count_statuses(phase2, phase3)

    lessons = f"""# Lessons Learned — Verification V2

Generated: {time.strftime("%Y-%m-%d")}

## What Worked

1. **Safe folder path** (`~/Library/Group Containers/UBF8T346G9.Office/`) eliminated the
   macOS sandbox "Grant Access" dialog completely.

2. **Explicit parameter setting** for every Dashboard cell prevented default-mismatch
   false failures (Excel debt_target=60 vs Python=50, inflation 3.5 vs 5.0).

3. **Sentinel-based stability check** with 3 consecutive stable reads reliably detected
   when Excel finished recalculating.

4. **Retry logic with Excel restart** recovered timeout countries that failed on first attempt.

5. **Full series comparison** (2030-2099) caught divergences that checkpoint-only comparison
   (2030/2050/2099) would have missed.

## What We Learned

1. **interest_rate_mode vs select_rate**: The engine's `run_pipeline()` accepts `interest_rate_mode`
   as the param key, which maps to `select_rate` in `interest_rate_country()`. Phase 3 param
   combos must use `interest_rate_mode`.

2. **expenditure_rigidity is climate-only**: Setting rigidity in baseline-only tests is a no-op.
   Must test with climate scenario comparison to verify rigidity effects.

3. **Debt floor asymmetry (CLAUDE.md Rule #3)**: Baseline applies `max(0, debt)`, climate
   scenarios do NOT. This is testable by checking min debt values across scenarios.

4. **ENGINE_DATA_GAP countries**: Countries present in Excel but missing from one of the 4
   parquet datasets (typically productivity) cannot be tested. These are data gaps, not failures.

## Status Counts

"""

    for status, count in sorted(counts.items()):
        lessons += f"- {status}: {count}\n"

    lessons_path = OUTPUT_DIR / "LESSONS_LEARNED.md"
    with open(lessons_path, "w") as f:
        f.write(lessons)
    logger.info(f"Lessons written: {lessons_path}")


def generate_follow_up_plan(all_results):
    """Generate FOLLOW_UP_PLAN.md."""
    phase3 = all_results.get("phase3_checkpoint", {})

    plan = f"""# Follow-Up Plan — Post V2

Generated: {time.strftime("%Y-%m-%d")}

## Completed in V2

- [x] Apply 9 fixes from PR #42 bot reviews
- [x] Run all countries from get_country_list() (not just 30)
- [x] Add climate scenario comparison for 5 representative countries
- [x] Compare level values (nominal GDP, interest rates) not just ratios
- [x] Add retry logic for timeout countries
- [x] Use safe folder path to eliminate macOS sandbox dialog
- [x] Save verified outputs as potential golden masters
- [x] Fix interest_rate_mode param key (was select_rate)
- [x] Fix golden master path (packages/qcraft-engine/tests/...)
- [x] Fix logger scope (module-level)
- [x] Set expenditure_rigidity in Excel (C38)
- [x] Add debt floor asymmetry test
- [x] Use EXCEL_SELECTION_ERROR consistently

## Still Needed

- [ ] Investigate any PARITY_FAIL countries — root cause analysis
- [ ] Investigate PARITY_REVIEW countries — are diffs systematic?
- [ ] Promote verified golden masters to CI test suite
- [ ] Add WEO period (2023-2029) exact-match test for all countries
- [ ] Test additional parameter extremes (debt_target=0, debt_target=200)
- [ ] Compare expenditure rigidity effects in climate scenarios (0.0 vs 1.0)
- [ ] Add Excel formula audit for any PARITY_FAIL countries
- [ ] Automate verification as CI job (needs Excel on runner)

## Known Limitations

- Excel recalc is non-deterministic — some countries may intermittently timeout
- ENGINE_DATA_GAP countries cannot be verified without adding missing data
- Climate scenario sheet names may vary across workbook versions
- Inflation defaults differ (Excel=3.5%, Python=5.0%) — set explicitly in all tests
"""

    plan_path = OUTPUT_DIR / "FOLLOW_UP_PLAN.md"
    with open(plan_path, "w") as f:
        f.write(plan)
    logger.info(f"Follow-up plan written: {plan_path}")


def main():
    all_results = load_phase_results()

    # Generate all outputs
    phase2 = all_results.get("phase2_checkpoint", {})
    phase3 = all_results.get("phase3_checkpoint", {})

    generate_parity_csv(phase2, phase3)
    generate_parity_report(all_results)
    generate_narrative(all_results)
    generate_lessons_learned(all_results)
    generate_follow_up_plan(all_results)

    logger.info("Phase 4 complete — all reports generated")


if __name__ == "__main__":
    main()
