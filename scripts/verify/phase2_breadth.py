"""Phase 2: Breadth Test — ALL countries, default params.

V2: runs all ~171 testable countries with retry logic and golden master saving.
Uses Baseline calc sheet (transposed: years in columns, metrics in rows).
"""

import csv
import json
import logging
import os
import shutil
import sys
import time
from pathlib import Path

import xlwings as xw

sys.path.insert(0, str(Path(__file__).resolve().parent))
from excel_reader import (
    BASELINE_ROWS,
    DASHBOARD_CELLS,
    is_valid_numeric,
    read_baseline_series,
    set_all_dashboard_params,
    year_to_col,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
OUTPUT_DIR = PROJECT_ROOT / "verification-logs"
GOLDEN_MASTER_DIR = OUTPUT_DIR / "golden-masters"
GOLDEN_MASTER_DIR.mkdir(parents=True, exist_ok=True)

ORIGINAL_WORKBOOK = (
    PROJECT_ROOT / "source-materials" / "2024_IMF-FAD_Q-CRAFT-Tool-v10.xlsx"
)
SAFE_DIR = Path.home() / "Library" / "Group Containers" / "UBF8T346G9.Office"
SAFE_WORKBOOK = SAFE_DIR / "Q-CRAFT-verify.xlsx"

MAX_RETRIES = 2
BASE_TIMEOUT = 90
RETRY_TIMEOUT = 180

# Metrics to compare
PRIMARY_METRICS = [
    "debt_to_gdp", "revenue_percent_gdp",
    "primary_expenditure_percent_gdp", "primary_balance_percent_gdp",
]
LEVEL_METRICS = ["nominal_gdp", "real_gdp_growth_percent", "nominal_interest_rate"]
ALL_METRICS = PRIMARY_METRICS + LEVEL_METRICS

METRIC_TO_ENGINE = {
    "debt_to_gdp": ("fiscal", "debt_to_gdp"),
    "revenue_percent_gdp": ("fiscal", "revenue_percent_gdp"),
    "primary_expenditure_percent_gdp": ("fiscal", "primary_expenditure_percent_gdp"),
    "primary_balance_percent_gdp": ("fiscal", "primary_balance_percent_gdp"),
    "overall_balance_percent_gdp": ("fiscal", "overall_balance_percent_gdp"),
    "interest_expenditure_percent_gdp": ("fiscal", "interest_expenditure_percent_gdp"),
    "nominal_gdp": ("baseline_v1", "nominal_gdp"),
    "real_gdp_growth_percent": ("baseline_v1", "real_gdp_growth_percent"),
    "nominal_interest_rate": ("interest_rate", "nominal_interest_rate"),
}


def copy_workbook_to_safe_location():
    SAFE_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copy2(str(ORIGINAL_WORKBOOK), str(SAFE_WORKBOOK))
    logger.info(f"Copied workbook to {SAFE_WORKBOOK}")
    return SAFE_WORKBOOK


def kill_excel():
    try:
        os.system("killall 'Microsoft Excel' 2>/dev/null")
        time.sleep(3)
    except Exception:
        pass


def load_config():
    with open(OUTPUT_DIR / "phase0_config.json") as f:
        return json.load(f)


def load_checkpoint():
    cp_path = OUTPUT_DIR / "phase2_checkpoint.json"
    if cp_path.exists():
        with open(cp_path) as f:
            return json.load(f)
    return {
        "phase": 2, "completed": [], "in_progress": None,
        "results": {}, "timestamp": None,
    }


def save_checkpoint(checkpoint):
    checkpoint["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%S")
    with open(OUTPUT_DIR / "phase2_checkpoint.json", "w") as f:
        json.dump(checkpoint, f, indent=2, default=str)


def wait_for_recalc(ws_baseline, timeout=90):
    """Wait for stable numeric values at sentinel cells."""
    sentinel_pairs = [
        (BASELINE_ROWS["debt_to_gdp"], year_to_col(2050)),
        (BASELINE_ROWS["nominal_gdp"], year_to_col(2050)),
        (BASELINE_ROWS["revenue_percent_gdp"], year_to_col(2050)),
    ]
    last_vals = [None] * len(sentinel_pairs)
    stable_count = 0
    start = time.time()

    while time.time() - start < timeout:
        current_vals = [ws_baseline.range((r, c)).value for r, c in sentinel_pairs]
        all_valid = all(is_valid_numeric(v) for v in current_vals)
        if all_valid and current_vals == last_vals:
            stable_count += 1
            if stable_count >= 3:
                return True
        else:
            stable_count = 0
        last_vals = current_vals
        time.sleep(0.5)

    return False


def open_excel_and_workbook():
    wb_path = copy_workbook_to_safe_location()
    kill_excel()
    time.sleep(3)
    app = xw.App(visible=True)
    app.display_alerts = False
    wb = app.books.open(str(wb_path), update_links=False)
    return app, wb


def save_golden_master_csv(iso3c, excel_data):
    """Save verified Excel output as potential golden master."""
    rows = []
    metrics = list(BASELINE_ROWS.keys())
    for year in sorted(excel_data.keys()):
        row = {"scenario": "Baseline", "year": year}
        for metric in metrics:
            val = excel_data[year].get(metric)
            if is_valid_numeric(val):
                row[metric] = val
        rows.append(row)

    if not rows:
        return

    out_path = GOLDEN_MASTER_DIR / f"{iso3c}.csv"
    fieldnames = ["scenario", "year"] + metrics
    with open(out_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def verify_single_country(wb, iso3c, country_name, params, timeout=90):
    """Verify one country against the Python engine."""
    result = {
        "iso3c": iso3c,
        "country": country_name,
        "status": None,
        "worst_diff": 0.0,
        "worst_year": None,
        "worst_metric": None,
        "params_label": "default",
    }

    ws_dashboard = wb.sheets["Dashboard"]
    ws_baseline = wb.sheets["Baseline"]

    # Set country
    ws_dashboard[DASHBOARD_CELLS["country_selector"]].value = country_name
    wb.app.calculate()
    time.sleep(2)

    # Set all params
    set_all_dashboard_params(ws_dashboard, params)
    wb.app.calculate()

    # Wait for recalc
    stable = wait_for_recalc(ws_baseline, timeout=timeout)
    if not stable:
        result["status"] = "TIMEOUT"
        return result

    # Read Excel data
    excel_data = read_baseline_series(ws_baseline, metrics=ALL_METRICS)

    # Validate we got real data
    sample = excel_data.get(2050, {})
    valid_count = sum(1 for v in sample.values() if is_valid_numeric(v))
    if valid_count == 0:
        result["status"] = "EXCEL_DATA_MISSING"
        return result

    # Check for error values
    for year, row in excel_data.items():
        for val in row.values():
            if isinstance(val, str) and val.startswith("#"):
                result["status"] = "EXCEL_DATA_MISSING"
                return result

    # Run Python engine
    from qcraft_engine.data_loader import load_parquet_data, run_pipeline

    try:
        data = load_parquet_data()
        py_results = run_pipeline(data, iso3c, params=params)
    except Exception as e:
        result["status"] = "PYTHON_ERROR"
        result["error"] = str(e)
        return result

    # Compare all years — ratio metrics (pp threshold)
    # and level metrics (relative threshold)
    worst_diff = 0.0
    worst_year = None
    worst_metric = None
    any_fail = False
    any_review = False
    level_warnings = []

    for year in range(2030, 2100):
        if year not in excel_data:
            continue

        excel_row = excel_data[year]
        for metric in ALL_METRICS:
            excel_val = excel_row.get(metric)
            if not is_valid_numeric(excel_val):
                continue

            engine_table, engine_col = METRIC_TO_ENGINE[metric]
            py_df = py_results.get(engine_table)
            if py_df is None:
                continue
            py_row = py_df.filter(py_df["years"] == year)
            if len(py_row) == 0:
                continue
            py_val = py_row[engine_col][0]
            if not is_valid_numeric(py_val):
                continue

            diff = abs(float(excel_val) - float(py_val))

            if metric in LEVEL_METRICS:
                # Relative tolerance for level values
                denom = max(
                    abs(float(excel_val)), abs(float(py_val)), 1e-9
                )
                rel_diff = diff / denom
                if rel_diff > 0.001:  # >0.1% relative
                    level_warnings.append({
                        "year": year,
                        "metric": metric,
                        "rel_diff_pct": round(rel_diff * 100, 4),
                    })
            else:
                # pp threshold for ratio metrics
                if diff > worst_diff:
                    worst_diff = diff
                    worst_year = year
                    worst_metric = metric
                if diff > 0.5:
                    any_fail = True
                elif diff > 0.1:
                    any_review = True

    result["worst_diff"] = round(worst_diff, 6)
    result["worst_year"] = worst_year
    result["worst_metric"] = worst_metric
    result["level_warnings"] = len(level_warnings)

    if level_warnings:
        logger.warning(
            f"{iso3c}: {len(level_warnings)} level metric"
            f" divergences (>0.1% relative)"
        )

    if any_fail:
        result["status"] = "PARITY_FAIL"
    elif any_review:
        result["status"] = "PARITY_REVIEW"
    elif level_warnings:
        result["status"] = "PARITY_REVIEW"
        result["worst_metric"] = level_warnings[0]["metric"]
    else:
        result["status"] = "PARITY_PASS"

    # Only save golden master if all metrics pass
    if result["status"] == "PARITY_PASS":
        save_golden_master_csv(iso3c, excel_data)

    return result


def main():
    config = load_config()
    checkpoint = load_checkpoint()

    # Build full country list
    from qcraft_engine.data_loader import get_country_list, load_parquet_data

    data = load_parquet_data()
    engine_countries = get_country_list(data)
    engine_iso3_set = {c["iso3c"] for c in engine_countries}
    engine_name_map = {c["iso3c"]: c["country"] for c in engine_countries}

    excel_name_map = config.get("country_name_map", {})
    all_testable = sorted(set(excel_name_map.keys()) & engine_iso3_set)
    logger.info(f"Total testable countries: {len(all_testable)}")

    # Classify ENGINE_DATA_GAP countries
    excel_only = set(excel_name_map.keys()) - engine_iso3_set
    for iso3c in sorted(excel_only):
        if iso3c not in checkpoint["results"]:
            checkpoint["results"][iso3c] = {
                "iso3c": iso3c,
                "country": excel_name_map.get(iso3c, "Unknown"),
                "status": "ENGINE_DATA_GAP",
                "note": (
                    "Country in Excel but missing from engine"
                    " (not in all 4 parquet datasets)"
                ),
            }

    # Skip completed
    completed = set(checkpoint.get("completed", []))
    remaining = [c for c in all_testable if c not in completed]
    logger.info(f"Already completed: {len(completed)}, Remaining: {len(remaining)}")

    # Params — use Excel defaults
    excel_defaults = config.get("excel_defaults", {})
    params = {
        "debt_target": excel_defaults.get("debt_target") or 60.0,
        "fiscal_rule": excel_defaults.get("fiscal_rule") or "Yes",
        "expenditure_rigidity": excel_defaults.get("expenditure_rigidity") or 1.0,
        "interest_rate_mode": (
            excel_defaults.get("interest_rate_mode")
            or "Nominal interest rate"
        ),
        "inflation_start": excel_defaults.get("inflation_start") or 3.5,
        "inflation_end": excel_defaults.get("inflation_end") or 3.5,
        "productivity_start": excel_defaults.get("productivity_start") or 5.0,
        "productivity_end": excel_defaults.get("productivity_end") or 1.2,
        "demography_variant": excel_defaults.get("demography_variant") or "Medium",
    }

    logger.info(f"Using params: {params}")

    app = None
    wb = None
    consecutive_timeouts = 0

    try:
        app, wb = open_excel_and_workbook()

        for i, iso3c in enumerate(remaining):
            country_name = excel_name_map.get(iso3c) or engine_name_map.get(iso3c)
            if not country_name:
                checkpoint["results"][iso3c] = {
                    "iso3c": iso3c, "status": "EXCEL_SELECTION_ERROR",
                    "note": "No Excel country name found",
                }
                checkpoint["completed"].append(iso3c)
                save_checkpoint(checkpoint)
                continue

            checkpoint["in_progress"] = iso3c
            save_checkpoint(checkpoint)

            timeout = RETRY_TIMEOUT if consecutive_timeouts >= 5 else BASE_TIMEOUT
            result = None

            for attempt in range(MAX_RETRIES + 1):
                try:
                    result = verify_single_country(
                        wb, iso3c, country_name, params, timeout=timeout
                    )
                    if result["status"] == "TIMEOUT" and attempt < MAX_RETRIES:
                        logger.warning(f"Retry {attempt+1}/{MAX_RETRIES} for {iso3c}")
                        try:
                            wb.close()
                        except Exception:
                            pass
                        try:
                            app.quit()
                        except Exception:
                            kill_excel()
                        time.sleep(5)
                        app, wb = open_excel_and_workbook()
                        continue
                    break
                except Exception as e:
                    logger.error(
                        f"Exception verifying {iso3c}"
                        f" (attempt {attempt+1}): {e}"
                    )
                    if attempt < MAX_RETRIES:
                        try:
                            wb.close()
                        except Exception:
                            pass
                        try:
                            app.quit()
                        except Exception:
                            kill_excel()
                        time.sleep(5)
                        app, wb = open_excel_and_workbook()
                    else:
                        result = {
                            "iso3c": iso3c, "country": country_name,
                            "status": "PYTHON_ERROR", "error": str(e),
                        }

            if result is None:
                result = {"iso3c": iso3c, "country": country_name, "status": "TIMEOUT"}

            # Track consecutive timeouts
            if result["status"] == "TIMEOUT":
                consecutive_timeouts += 1
            else:
                consecutive_timeouts = 0

            checkpoint["results"][iso3c] = result
            checkpoint["completed"].append(iso3c)
            checkpoint["in_progress"] = None
            save_checkpoint(checkpoint)

            logger.info(
                f"[{len(checkpoint['completed'])}/{len(all_testable)}] "
                f"{iso3c}: {result.get('status')} "
                f"(worst: {result.get('worst_diff', 'N/A')})"
            )

            # Mid-phase sanity gate every 10 countries
            done_count = len(checkpoint["completed"])
            if done_count > 0 and done_count % 10 == 0:
                tested = sum(
                    1 for r in checkpoint["results"].values()
                    if r.get("status") in (
                        "PARITY_PASS", "PARITY_REVIEW", "PARITY_FAIL"
                    )
                )
                passed = sum(1 for r in checkpoint["results"].values()
                             if r.get("status") == "PARITY_PASS")
                rate = passed / tested if tested > 0 else 0
                logger.info(f"Progress: {done_count}/{len(all_testable)}, "
                            f"tested: {tested}, pass rate: {rate:.0%}")
                if rate < 0.5 and tested >= 10:
                    logger.critical(f"Pass rate {rate:.0%} < 50%! Check cell mapping.")

            # Restart Excel after consecutive timeouts
            if consecutive_timeouts >= 3:
                logger.warning("3+ consecutive timeouts, restarting Excel...")
                try:
                    wb.close()
                except Exception:
                    pass
                try:
                    app.quit()
                except Exception:
                    kill_excel()
                time.sleep(5)
                app, wb = open_excel_and_workbook()
                consecutive_timeouts = 0

    finally:
        if wb:
            try:
                wb.close()
            except Exception:
                pass
        if app:
            try:
                app.quit()
            except Exception:
                try:
                    app.kill()
                except Exception:
                    kill_excel()

    # Summary
    statuses = {}
    for r in checkpoint["results"].values():
        s = r.get("status", "UNKNOWN")
        statuses[s] = statuses.get(s, 0) + 1

    logger.info(f"Phase 2 complete. Status summary: {statuses}")
    save_checkpoint(checkpoint)

    return checkpoint


if __name__ == "__main__":
    main()
