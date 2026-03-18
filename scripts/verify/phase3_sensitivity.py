"""Phase 3: Input Sensitivity — 5 countries × 5 param combos + climate scenarios.

V2 fixes applied:
- Fix #2: Uses interest_rate_mode (correct key for run_pipeline)
- Fix #6: low_target renamed to low_target_debt_only (clarifies no rigidity effect)
- Fix #7: Debt floor asymmetry test
- Fix #8: expenditure_rigidity set in Excel cell C38
- Climate scenario comparison for 5 representative countries
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
    SCENARIO_ROWS,
    SCENARIO_SHEET_NAMES,
    classify_parity,
    is_valid_numeric,
    read_baseline_series,
    read_scenario_series,
    set_all_dashboard_params,
    year_to_col,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
OUTPUT_DIR = PROJECT_ROOT / "verification-logs"
GOLDEN_MASTER_DIR = OUTPUT_DIR / "golden-masters"

ORIGINAL_WORKBOOK = PROJECT_ROOT / "source-materials" / "2024_IMF-FAD_Q-CRAFT-Tool-v10.xlsx"
SAFE_DIR = Path.home() / "Library" / "Group Containers" / "UBF8T346G9.Office"
SAFE_WORKBOOK = SAFE_DIR / "Q-CRAFT-verify.xlsx"

PHASE3_COUNTRIES = [
    ("UGA", "Uganda"),
    ("KEN", "Kenya"),
    ("MDV", "Maldives"),
    ("BRA", "Brazil"),
    ("JPN", "Japan"),
]

# Fix #2: Uses interest_rate_mode (correct key), not select_rate
# All params use Excel defaults for non-varied params
PARAM_COMBOS = [
    {
        "label": "default",
        "debt_target": 60.0,
        "fiscal_rule": "Yes",
        "expenditure_rigidity": 1.0,
        "interest_rate_mode": "Nominal interest rate",
        "inflation_start": 3.5, "inflation_end": 3.5,
        "productivity_start": 5.0, "productivity_end": 1.2,
        "demography_variant": "Medium",
    },
    {
        "label": "no_rule",
        "debt_target": 60.0,
        "fiscal_rule": "No",
        "expenditure_rigidity": 1.0,
        "interest_rate_mode": "Nominal interest rate",
        "inflation_start": 3.5, "inflation_end": 3.5,
        "productivity_start": 5.0, "productivity_end": 1.2,
        "demography_variant": "Medium",
    },
    {
        # Fix #6: Renamed — rigidity only affects climate scenarios
        "label": "low_target_debt_only",
        "debt_target": 30.0,
        "fiscal_rule": "Yes",
        "expenditure_rigidity": 1.0,
        "interest_rate_mode": "Nominal interest rate",
        "inflation_start": 3.5, "inflation_end": 3.5,
        "productivity_start": 5.0, "productivity_end": 1.2,
        "demography_variant": "Medium",
    },
    {
        "label": "flexible_high_target",
        "debt_target": 70.0,
        "fiscal_rule": "Yes",
        "expenditure_rigidity": 0.0,
        "interest_rate_mode": "Nominal interest rate",
        "inflation_start": 3.5, "inflation_end": 3.5,
        "productivity_start": 5.0, "productivity_end": 1.2,
        "demography_variant": "Medium",
    },
    {
        # Fix #2: interest_rate_mode correctly set
        "label": "igd_mode",
        "debt_target": 60.0,
        "fiscal_rule": "Yes",
        "expenditure_rigidity": 1.0,
        "interest_rate_mode": "Interest-growth differential",
        "inflation_start": 3.5, "inflation_end": 3.5,
        "productivity_start": 5.0, "productivity_end": 1.2,
        "demography_variant": "Medium",
    },
]

CLIMATE_SCENARIOS = ["Paris", "Moderate", "Hot", "Hot_Adapted", "Hot_Unadapted", "High"]
CLIMATE_COUNTRIES = ["UGA", "BRA", "JPN", "KEN", "MDV"]

PRIMARY_METRICS = [
    "debt_to_gdp", "revenue_percent_gdp",
    "primary_expenditure_percent_gdp", "primary_balance_percent_gdp",
]

METRIC_TO_ENGINE = {
    "debt_to_gdp": ("fiscal", "debt_to_gdp"),
    "revenue_percent_gdp": ("fiscal", "revenue_percent_gdp"),
    "primary_expenditure_percent_gdp": ("fiscal", "primary_expenditure_percent_gdp"),
    "primary_balance_percent_gdp": ("fiscal", "primary_balance_percent_gdp"),
    "nominal_gdp": ("baseline_v1", "nominal_gdp"),
}

SCENARIO_METRICS = ["debt_to_gdp", "primary_expenditure_percent_gdp", "revenue_percent_gdp", "nominal_gdp"]


def copy_workbook_to_safe_location():
    SAFE_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copy2(str(ORIGINAL_WORKBOOK), str(SAFE_WORKBOOK))
    return SAFE_WORKBOOK


def kill_excel():
    try:
        os.system("killall 'Microsoft Excel' 2>/dev/null")
        time.sleep(3)
    except Exception:
        pass


def load_checkpoint():
    cp_path = OUTPUT_DIR / "phase3_checkpoint.json"
    if cp_path.exists():
        with open(cp_path) as f:
            return json.load(f)
    return {"phase": 3, "completed": [], "in_progress": None, "results": {},
            "climate_results": {}, "debt_floor_checks": {}, "timestamp": None}


def save_checkpoint(checkpoint):
    checkpoint["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%S")
    with open(OUTPUT_DIR / "phase3_checkpoint.json", "w") as f:
        json.dump(checkpoint, f, indent=2, default=str)


def wait_for_recalc(ws_baseline, timeout=90):
    sentinel_pairs = [
        (BASELINE_ROWS["debt_to_gdp"], year_to_col(2050)),
        (BASELINE_ROWS["nominal_gdp"], year_to_col(2050)),
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


def compare_baseline(wb, iso3c, country_name, combo):
    """Compare baseline for one country × param combo."""
    result = {
        "iso3c": iso3c, "country": country_name,
        "params_label": combo["label"],
        "status": None, "worst_diff": 0.0,
        "worst_year": None, "worst_metric": None,
    }

    ws_dashboard = wb.sheets["Dashboard"]
    ws_baseline = wb.sheets["Baseline"]

    # Step 1: Set country
    ws_dashboard[DASHBOARD_CELLS["country_selector"]].value = country_name
    wb.app.calculate()
    time.sleep(3)

    # Step 2: Set all params (Fix #8: includes expenditure_rigidity via C38)
    set_all_dashboard_params(ws_dashboard, combo)
    wb.app.calculate()

    # Step 3: Wait for recalc
    if not wait_for_recalc(ws_baseline, timeout=90):
        result["status"] = "TIMEOUT"
        return result

    # Read Excel
    excel_data = read_baseline_series(ws_baseline, metrics=PRIMARY_METRICS)

    sample = excel_data.get(2050, {})
    if not any(is_valid_numeric(v) for v in sample.values()):
        result["status"] = "EXCEL_DATA_MISSING"
        return result

    # Run Python engine
    from qcraft_engine.data_loader import load_parquet_data, run_pipeline

    try:
        data = load_parquet_data()
        py_results = run_pipeline(data, iso3c, params=combo)
    except Exception as e:
        result["status"] = "PYTHON_ERROR"
        result["error"] = str(e)
        return result

    # Compare
    worst_diff = 0.0
    worst_year = None
    worst_metric = None
    any_fail = False
    any_review = False

    for year in range(2030, 2100):
        excel_row = excel_data.get(year, {})
        for metric in PRIMARY_METRICS:
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
    result["status"] = "PARITY_FAIL" if any_fail else ("PARITY_REVIEW" if any_review else "PARITY_PASS")

    return result


def compare_climate_scenarios(wb, iso3c, country_name, params):
    """Compare all 6 climate scenarios for one country."""
    climate_results = {}

    from qcraft_engine.data_loader import load_parquet_data, run_pipeline

    data = load_parquet_data()
    py_results = run_pipeline(data, iso3c, params=params)

    for scenario in CLIMATE_SCENARIOS:
        sheet_name = SCENARIO_SHEET_NAMES.get(scenario)
        if sheet_name is None:
            continue

        try:
            ws_scenario = wb.sheets[sheet_name]
        except Exception:
            climate_results[scenario] = {"status": "EXCEL_DATA_MISSING", "note": "Sheet not found"}
            continue

        excel_data = read_scenario_series(ws_scenario, metrics=SCENARIO_METRICS)

        sample = excel_data.get(2050, {})
        if not any(is_valid_numeric(v) for v in sample.values()):
            climate_results[scenario] = {"status": "EXCEL_DATA_MISSING"}
            continue

        py_scenario_df = py_results.get(scenario)
        if py_scenario_df is None:
            climate_results[scenario] = {"status": "PYTHON_ERROR", "note": f"No {scenario} in engine"}
            continue

        worst_diff = 0.0
        worst_year = None
        worst_metric = None
        any_fail = False

        for year in range(2030, 2100):
            excel_row = excel_data.get(year, {})
            for metric in SCENARIO_METRICS:
                excel_val = excel_row.get(metric)
                if not is_valid_numeric(excel_val):
                    continue
                if metric not in py_scenario_df.columns:
                    continue
                py_row = py_scenario_df.filter(py_scenario_df["years"] == year)
                if len(py_row) == 0:
                    continue
                py_val = py_row[metric][0]
                if not is_valid_numeric(py_val):
                    continue

                diff = abs(float(excel_val) - float(py_val))
                if diff > worst_diff:
                    worst_diff = diff
                    worst_year = year
                    worst_metric = metric
                if diff > 0.5:
                    any_fail = True

        climate_results[scenario] = {
            "status": "PARITY_FAIL" if any_fail else "PARITY_PASS",
            "worst_diff": round(worst_diff, 6),
            "worst_year": worst_year,
            "worst_metric": worst_metric,
        }

    return climate_results


def check_debt_floor_asymmetry(iso3c, params):
    """Fix #7: Verify debt floor asymmetry — baseline max(0,debt) vs climate no floor."""
    from qcraft_engine.data_loader import load_parquet_data, run_pipeline

    data = load_parquet_data()
    py_results = run_pipeline(data, iso3c, params=params)

    fiscal = py_results.get("fiscal")
    if fiscal is None:
        return {"status": "SKIP", "note": "No fiscal data"}

    min_baseline_debt = fiscal.select("debt_to_gdp").min().item()

    climate_min_debts = {}
    for scenario in CLIMATE_SCENARIOS:
        sc_df = py_results.get(scenario)
        if sc_df is not None and "debt_to_gdp" in sc_df.columns:
            climate_min_debts[scenario] = sc_df.select("debt_to_gdp").min().item()

    baseline_has_floor = min_baseline_debt >= 0.0
    climate_allows_negative = any(v < 0.0 for v in climate_min_debts.values())

    return {
        "iso3c": iso3c,
        "baseline_min_debt": round(float(min_baseline_debt), 4),
        "baseline_floor_applied": baseline_has_floor,
        "climate_min_debts": {k: round(float(v), 4) for k, v in climate_min_debts.items()},
        "climate_allows_negative": climate_allows_negative,
        "rule_satisfied": baseline_has_floor,
        "note": (
            f"Baseline min debt={min_baseline_debt:.2f}%. "
            + ("Climate allows negative." if climate_allows_negative else "No negative climate debt.")
        ),
    }


def main():
    checkpoint = load_checkpoint()
    completed = set(checkpoint.get("completed", []))

    app = None
    wb = None

    try:
        app, wb = open_excel_and_workbook()

        # Phase 3a: Param sensitivity
        for iso3c, country_name in PHASE3_COUNTRIES:
            for combo in PARAM_COMBOS:
                key = f"{iso3c}_{combo['label']}"
                if key in completed:
                    logger.info(f"Skipping {key} (done)")
                    continue

                checkpoint["in_progress"] = key
                save_checkpoint(checkpoint)

                logger.info(f"=== {iso3c} × {combo['label']} ===")
                try:
                    result = compare_baseline(wb, iso3c, country_name, combo)
                    checkpoint["results"][key] = result
                    logger.info(f"  {key}: {result['status']} (worst: {result['worst_diff']})")
                except Exception as e:
                    logger.error(f"Error on {key}: {e}", exc_info=True)
                    checkpoint["results"][key] = {
                        "iso3c": iso3c, "country": country_name,
                        "params_label": combo["label"],
                        "status": "PYTHON_ERROR", "error": str(e),
                    }

                checkpoint["completed"].append(key)
                checkpoint["in_progress"] = None
                save_checkpoint(checkpoint)

        # Phase 3b: Climate scenario comparison
        logger.info("=== Climate scenario comparison ===")
        default_combo = PARAM_COMBOS[0]

        for iso3c, country_name in PHASE3_COUNTRIES:
            if iso3c not in CLIMATE_COUNTRIES:
                continue

            climate_key = f"{iso3c}_climate"
            if climate_key in completed:
                continue

            # Set country and params in Excel
            ws_dashboard = wb.sheets["Dashboard"]
            ws_baseline = wb.sheets["Baseline"]
            ws_dashboard[DASHBOARD_CELLS["country_selector"]].value = country_name
            wb.app.calculate()
            time.sleep(3)
            set_all_dashboard_params(ws_dashboard, default_combo)
            wb.app.calculate()
            wait_for_recalc(ws_baseline, timeout=90)

            try:
                cr = compare_climate_scenarios(wb, iso3c, country_name, default_combo)
                checkpoint["climate_results"][iso3c] = cr
                for sc, res in cr.items():
                    logger.info(f"  {iso3c} {sc}: {res.get('status')} (worst: {res.get('worst_diff', 'N/A')})")
            except Exception as e:
                logger.error(f"Climate error for {iso3c}: {e}", exc_info=True)
                checkpoint["climate_results"][iso3c] = {"error": str(e)}

            checkpoint["completed"].append(climate_key)
            save_checkpoint(checkpoint)

        # Phase 3c: Debt floor asymmetry check (Fix #7)
        logger.info("=== Debt floor asymmetry checks ===")
        for iso3c, country_name in PHASE3_COUNTRIES:
            try:
                check = check_debt_floor_asymmetry(iso3c, default_combo)
                checkpoint["debt_floor_checks"][iso3c] = check
                logger.info(f"  {iso3c}: floor={check['baseline_floor_applied']}, "
                            f"min_debt={check['baseline_min_debt']}")
            except Exception as e:
                logger.error(f"Debt floor error for {iso3c}: {e}")
                checkpoint["debt_floor_checks"][iso3c] = {"error": str(e)}

        save_checkpoint(checkpoint)

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

    logger.info("=== Phase 3 Summary ===")
    for key, r in checkpoint["results"].items():
        logger.info(f"  {key}: {r.get('status')} (worst: {r.get('worst_diff', 'N/A')})")

    return checkpoint


if __name__ == "__main__":
    main()
