"""Phase 1: xlwings Smoke Test — 3 countries with full intermediate checks.

Uses the Baseline calc sheet (transposed layout: years in columns, metrics in rows).
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

# Add scripts/verify to path for excel_reader
sys.path.insert(0, str(Path(__file__).resolve().parent))
from excel_reader import (
    BASELINE_ROWS,
    DASHBOARD_CELLS,
    classify_parity,
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

PHASE1_COUNTRIES = [
    ("UGA", "Uganda"),
    ("USA", "United States"),
    ("MDV", "Maldives"),
]

UGANDA_GOLDEN_MASTER = (
    PROJECT_ROOT / "packages" / "qcraft-engine" / "tests"
    / "golden_masters" / "final" / "uganda.csv"
)

# Primary metrics to compare (% GDP ratios)
PRIMARY_METRICS = [
    "debt_to_gdp",
    "revenue_percent_gdp",
    "primary_expenditure_percent_gdp",
    "primary_balance_percent_gdp",
]

# Intermediate metrics (catch compensating errors)
INTERMEDIATE_METRICS = [
    "nominal_gdp",
    "real_gdp_growth_percent",
    "nominal_interest_rate",
]

ALL_METRICS = PRIMARY_METRICS + INTERMEDIATE_METRICS

# Map metric names to Python engine table + column
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
        time.sleep(2)
    except Exception:
        pass


def load_config():
    with open(OUTPUT_DIR / "phase0_config.json") as f:
        return json.load(f)


def wait_for_recalc(ws_baseline, timeout=90):
    """Wait for Excel recalc by monitoring sentinel cells on the Baseline sheet.

    Checks year 2050 (col = year_to_col(2050)) for several metrics.
    """
    sentinel_row_col_pairs = [
        (BASELINE_ROWS["debt_to_gdp"], year_to_col(2050)),
        (BASELINE_ROWS["nominal_gdp"], year_to_col(2050)),
        (BASELINE_ROWS["revenue_percent_gdp"], year_to_col(2050)),
    ]

    last_vals = [None] * len(sentinel_row_col_pairs)
    stable_count = 0
    start = time.time()

    while time.time() - start < timeout:
        current_vals = []
        for row, col in sentinel_row_col_pairs:
            val = ws_baseline.range((row, col)).value
            current_vals.append(val)

        all_valid = all(is_valid_numeric(v) for v in current_vals)

        if all_valid and current_vals == last_vals:
            stable_count += 1
            if stable_count >= 3:
                elapsed = time.time() - start
                logger.info(f"Recalc stable in {elapsed:.1f}s")
                return True
        else:
            stable_count = 0
        last_vals = current_vals
        time.sleep(0.5)

    logger.warning(f"Recalc timeout after {timeout}s")
    return False


def set_country(wb, country_name, params, timeout=90):
    """Set country and all params in Excel, wait for recalc."""
    ws_dashboard = wb.sheets["Dashboard"]
    ws_baseline = wb.sheets["Baseline"]

    # Step 1: Set country
    ws_dashboard[DASHBOARD_CELLS["country_selector"]].value = country_name
    wb.app.calculate()
    time.sleep(3)

    # Step 2: Set all params explicitly
    set_all_dashboard_params(ws_dashboard, params)
    wb.app.calculate()

    # Step 3: Wait for recalc
    return wait_for_recalc(ws_baseline, timeout=timeout)


def run_python_engine(iso3c, params):
    """Run the Python engine with explicit params."""
    from qcraft_engine.data_loader import load_parquet_data, run_pipeline

    data = load_parquet_data()
    results = run_pipeline(data, iso3c, params=params)
    return results


def verify_country(wb, iso3c, country_name, params):
    """Verify one country. Returns result dict."""
    logger.info(f"=== Verifying {iso3c} ({country_name}) ===")

    result = {
        "iso3c": iso3c,
        "country": country_name,
        "status": None,
        "worst_diff": 0.0,
        "worst_year": None,
        "worst_metric": None,
        "year_details": {},
    }

    # Set country and params in Excel
    stable = set_country(wb, country_name, params, timeout=90)
    if not stable:
        # Try once more with longer timeout
        logger.info("Retrying with longer timeout...")
        wb.app.calculate()
        stable = wait_for_recalc(wb.sheets["Baseline"], timeout=120)

    # Read Excel data from Baseline calc sheet
    ws_baseline = wb.sheets["Baseline"]
    excel_data = read_baseline_series(ws_baseline, metrics=ALL_METRICS)

    # Check if we got valid data
    sample_year = 2050
    sample_vals = excel_data.get(sample_year, {})
    valid_count = sum(1 for v in sample_vals.values() if is_valid_numeric(v))
    if valid_count == 0:
        result["status"] = "EXCEL_DATA_MISSING"
        logger.warning(
            f"No valid numeric data at year {sample_year}"
            f" for {country_name}"
        )
        return result

    # Run Python engine
    try:
        py_results = run_python_engine(iso3c, params)
    except Exception as e:
        result["status"] = "PYTHON_ERROR"
        result["error"] = str(e)
        logger.error(f"Python engine error for {iso3c}: {e}")
        return result

    # Compare all years for all metrics
    worst_diff = 0.0
    worst_year = None
    worst_metric = None
    any_fail = False
    any_review = False
    year_details = {}

    for year in range(2030, 2100):
        if year not in excel_data:
            continue

        excel_row = excel_data[year]
        year_details[year] = {}

        for metric in ALL_METRICS:
            excel_val = excel_row.get(metric)
            if not is_valid_numeric(excel_val):
                continue

            # Get Python value
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

            # For level values (nominal_gdp), compare absolute difference
            # For ratios (% GDP), compare percentage point difference
            diff = abs(float(excel_val) - float(py_val))

            year_details[year][metric] = {
                "excel": float(excel_val),
                "python": float(py_val),
                "diff": round(diff, 6),
                "status": classify_parity(diff),
            }

            # Only track worst diff for ratio metrics (pp comparison)
            if metric in PRIMARY_METRICS:
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
    result["year_details"] = year_details

    if any_fail:
        result["status"] = "PARITY_FAIL"
    elif any_review:
        result["status"] = "PARITY_REVIEW"
    else:
        result["status"] = "PARITY_PASS"

    # Save golden master
    save_golden_master(iso3c, excel_data)

    logger.info(
        f"{iso3c}: {result['status']} "
        f"(worst diff: {worst_diff:.4f}pp at {worst_year} on {worst_metric})"
    )
    return result


def save_golden_master(iso3c, excel_data):
    """Save verified Excel output as potential golden master CSV."""
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

    logger.info(f"Saved golden master: {out_path}")


def check_uganda_golden_master(result):
    """Compare Phase 1 Uganda Excel values against existing golden master."""
    if not UGANDA_GOLDEN_MASTER.exists():
        logger.warning(f"Golden master not found: {UGANDA_GOLDEN_MASTER}")
        return {"status": "MISSING"}

    import polars as pl

    gm = pl.read_csv(str(UGANDA_GOLDEN_MASTER))
    baseline_gm = gm.filter(gm["scenario"] == "Baseline")

    checks = []
    year_details = result.get("year_details", {})

    for year_str, metrics in year_details.items():
        year = int(year_str)
        gm_row = baseline_gm.filter(baseline_gm["year"] == year)
        if len(gm_row) == 0:
            continue

        for metric, vals in metrics.items():
            if metric in gm_row.columns:
                gm_val = gm_row[metric][0]
                excel_val = vals.get("excel")
                if isinstance(excel_val, (int, float)) and isinstance(
                    gm_val, (int, float)
                ):
                    diff = abs(float(excel_val) - float(gm_val))
                    checks.append({
                        "year": year, "metric": metric,
                        "excel": excel_val, "golden_master": float(gm_val),
                        "diff": round(diff, 6), "pass": diff <= 0.1,
                    })

    all_pass = all(c["pass"] for c in checks) if checks else False
    worst = max(checks, key=lambda c: c["diff"]) if checks else None

    return {
        "status": "PASS" if all_pass else "FAIL",
        "checks_count": len(checks),
        "all_pass": all_pass,
        "worst_check": worst,
    }


def main():
    config = load_config()
    wb_path = copy_workbook_to_safe_location()
    kill_excel()
    time.sleep(3)

    # Use Excel defaults — set ALL params explicitly
    excel_defaults = config.get("excel_defaults", {})
    params = {
        "debt_target": excel_defaults.get("debt_target") or 60.0,
        "fiscal_rule": excel_defaults.get("fiscal_rule") or "Yes",
        "expenditure_rigidity": (
            excel_defaults.get("expenditure_rigidity") or 1.0
        ),
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
    results = {}

    try:
        app = xw.App(visible=True)
        app.display_alerts = False
        wb = app.books.open(str(wb_path), update_links=False)

        for iso3c, country_name in PHASE1_COUNTRIES:
            try:
                result = verify_country(wb, iso3c, country_name, params)
                results[iso3c] = result

                if iso3c == "UGA":
                    gm_check = check_uganda_golden_master(result)
                    result["golden_master_check"] = gm_check
                    if gm_check.get("status") == "FAIL":
                        logger.critical(
                            f"Uganda FAILS golden master check! "
                            f"Worst: {gm_check.get('worst_check')}"
                        )
            except Exception as e:
                logger.error(f"Error verifying {iso3c}: {e}", exc_info=True)
                results[iso3c] = {
                    "iso3c": iso3c, "country": country_name,
                    "status": "PYTHON_ERROR", "error": str(e),
                }
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

    # Save results
    out_path = OUTPUT_DIR / "phase1_results.json"

    def make_serializable(obj):
        if isinstance(obj, (int, float, str, bool, type(None))):
            return obj
        if isinstance(obj, dict):
            return {str(k): make_serializable(v) for k, v in obj.items()}
        if isinstance(obj, (list, tuple)):
            return [make_serializable(i) for i in obj]
        return str(obj)

    with open(out_path, "w") as f:
        json.dump(make_serializable(results), f, indent=2)

    logger.info(f"Phase 1 results saved to {out_path}")
    for iso3c, r in results.items():
        logger.info(
            f"  {iso3c}: {r.get('status')}"
            f" (worst diff: {r.get('worst_diff', 'N/A')})"
        )

    return results


if __name__ == "__main__":
    main()
