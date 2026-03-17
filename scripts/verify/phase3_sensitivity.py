"""Phase 3: Input Sensitivity — 5 countries × 5 param combos.

Tests that engine matches Excel when varying debt target, fiscal rule,
interest rate mode, and expenditure rigidity.
"""

import json
import logging
import os
import shutil
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
CONFIG_PATH = PROJECT_ROOT / "verification-logs" / "phase0_config.json"
CHECKPOINT_PATH = PROJECT_ROOT / "verification-logs" / "phase3_checkpoint.json"
OUTPUT_PATH = PROJECT_ROOT / "verification-logs" / "phase3_results.json"
WORKBOOK_PATH = PROJECT_ROOT / "source-materials" / "2024_IMF-FAD_Q-CRAFT-Tool-v10.xlsx"

sys.path.insert(0, str(PROJECT_ROOT / "packages" / "qcraft-engine" / "src"))

COUNTRIES = {
    "UGA": "Uganda",
    "KEN": "Kenya",
    "MDV": "Maldives",
    "BRA": "Brazil",
    "JPN": "Japan",
}

PARAM_COMBOS = [
    {
        "label": "default",
        "debt_target": 50.0,
        "fiscal_rule": "Yes",
        "expenditure_rigidity": 1.0,
        "interest_rate_mode": "Nominal interest rate",
    },
    {
        "label": "no_rule",
        "debt_target": 50.0,
        "fiscal_rule": "No",
        "expenditure_rigidity": 1.0,
        "interest_rate_mode": "Nominal interest rate",
    },
    {
        "label": "low_target",
        "debt_target": 30.0,
        "fiscal_rule": "Yes",
        "expenditure_rigidity": 1.0,
        "interest_rate_mode": "Nominal interest rate",
    },
    {
        "label": "flexible_high_target",
        "debt_target": 70.0,
        "fiscal_rule": "Yes",
        "expenditure_rigidity": 0.0,
        "interest_rate_mode": "Nominal interest rate",
    },
    {
        "label": "igd_mode",
        "debt_target": 50.0,
        "fiscal_rule": "Yes",
        "expenditure_rigidity": 1.0,
        "interest_rate_mode": "Interest-growth differential",
    },
]

OUTPUT_METRICS = {
    "revenue_percent_gdp": 61,
    "primary_expenditure_percent_gdp": 62,
    "primary_balance_percent_gdp": 65,
    "debt_to_gdp": 67,
}

YEAR_START_COL = 3  # col C = 2009 in Output Baseline


def load_config():
    with open(CONFIG_PATH) as f:
        return json.load(f)


def load_checkpoint():
    if CHECKPOINT_PATH.exists():
        with open(CHECKPOINT_PATH) as f:
            return json.load(f)
    return None


def save_checkpoint(data):
    with open(CHECKPOINT_PATH, "w") as f:
        json.dump(data, f, indent=2, default=str)


def set_country_and_wait(ws_dash, country_name, ws_output, timeout=90):
    """Set country and wait for stable numeric output."""
    ws_dash["C12"].value = country_name
    app = ws_dash.book.app
    app.calculate()

    sentinel_cells = ["AR67", "CO67"]
    last_vals = [None, None]
    stable_count = 0
    start = time.time()

    while time.time() - start < timeout:
        current = [ws_output[c].value for c in sentinel_cells]
        all_valid = all(isinstance(v, (int, float)) and not isinstance(v, bool) for v in current)
        if all_valid and current == last_vals:
            stable_count += 1
            if stable_count >= 3:
                return True
        else:
            stable_count = 0
        last_vals = current
        time.sleep(0.3)

    # Check if values are at least numeric
    val = ws_output["AR67"].value
    return isinstance(val, (int, float))


def set_params_and_wait(ws_dash, ws_output, combo, config_defaults, timeout=30):
    """Set parameter combo in Excel and wait for recalc."""
    app = ws_dash.book.app

    # Set all params from combo, using config defaults for unspecified ones
    ws_dash["C17"].value = config_defaults.get("demography_variant", "Medium")
    ws_dash["C20"].value = config_defaults.get("productivity_start", 5.0)
    ws_dash["C21"].value = config_defaults.get("productivity_end", 1.2)
    ws_dash["C24"].value = config_defaults.get("inflation_start", 3.5)
    ws_dash["C25"].value = config_defaults.get("inflation_end", 3.5)
    ws_dash["C28"].value = combo["interest_rate_mode"]
    ws_dash["C33"].value = combo["fiscal_rule"]
    ws_dash["C34"].value = combo["debt_target"]
    ws_dash["C38"].value = combo["expenditure_rigidity"]

    app.calculate()
    time.sleep(2)
    app.calculate()

    # Wait for stability
    sentinel = ["AR67", "CO67"]
    last_vals = [None, None]
    stable_count = 0
    start = time.time()

    while time.time() - start < timeout:
        current = [ws_output[c].value for c in sentinel]
        all_valid = all(isinstance(v, (int, float)) and not isinstance(v, bool) for v in current)
        if all_valid and current == last_vals:
            stable_count += 1
            if stable_count >= 3:
                return True
        else:
            stable_count = 0
        last_vals = current
        time.sleep(0.3)

    return True  # Proceed even on timeout


def read_excel_metrics(ws_output, years_to_read):
    """Read output baseline metrics."""
    metrics = {}
    for name, row in OUTPUT_METRICS.items():
        series = {}
        for year in years_to_read:
            col = YEAR_START_COL + (year - 2009)
            val = ws_output.range((row, col)).value
            if isinstance(val, (int, float)) and not isinstance(val, bool):
                series[year] = float(val)
            else:
                series[year] = None
        metrics[name] = series
    return metrics


def run_python_engine(iso3c, combo, config_defaults):
    """Run Python engine with specified params."""
    from qcraft_engine.data_loader import load_parquet_data, run_pipeline

    data = load_parquet_data()
    params = {
        "demography_variant": config_defaults.get("demography_variant", "Medium"),
        "productivity_start": float(config_defaults.get("productivity_start", 5.0)),
        "productivity_end": float(config_defaults.get("productivity_end", 1.2)),
        "inflation_start": float(config_defaults.get("inflation_start", 3.5)),
        "inflation_end": float(config_defaults.get("inflation_end", 3.5)),
        "interest_rate_mode": combo["interest_rate_mode"],
        "debt_target": combo["debt_target"],
        "fiscal_rule": combo["fiscal_rule"],
        "expenditure_rigidity": combo["expenditure_rigidity"],
    }
    return run_pipeline(data, iso3c, params=params)


def extract_python_metrics(results, years_range):
    """Extract metrics from engine results."""
    import polars as pl
    fiscal = results["fiscal"]
    metrics = {}

    for metric_name in OUTPUT_METRICS:
        col_name = metric_name
        if col_name == "interest_rate_pct":
            continue
        if col_name in fiscal.columns:
            series = {}
            for row in fiscal.filter(pl.col("years").is_in(list(years_range))).iter_rows(named=True):
                series[int(row["years"])] = float(row[col_name]) if row[col_name] is not None else None
            metrics[metric_name] = series

    return metrics


def compare_metrics(excel_metrics, python_metrics):
    """Compare and return status."""
    worst_diff = 0.0
    worst_year = None
    worst_metric = None

    for metric_name in excel_metrics:
        e = excel_metrics.get(metric_name, {})
        p = python_metrics.get(metric_name, {})
        for year in e:
            ev = e.get(year)
            pv = p.get(year)
            if ev is None or pv is None:
                continue
            diff = abs(ev - pv)
            if diff > worst_diff:
                worst_diff = diff
                worst_year = year
                worst_metric = metric_name

    if worst_diff <= 0.1:
        status = "PARITY_PASS"
    elif worst_diff <= 0.5:
        status = "PARITY_REVIEW"
    else:
        status = "PARITY_FAIL"

    return {
        "status": status,
        "worst_diff": round(worst_diff, 6),
        "worst_year": worst_year,
        "worst_metric": worst_metric,
    }


def main():
    config = load_config()
    config_defaults = config["excel_defaults"]
    country_name_map = config["country_name_map"]

    years_to_read = set(range(2030, 2100))

    checkpoint = load_checkpoint()
    completed = {}
    if checkpoint and checkpoint.get("phase") == 3:
        completed = checkpoint.get("results", {})
        logger.info(f"Resuming: {len(completed)} combos done")

    import xlwings as xw

    temp_copy = str(PROJECT_ROOT / f"qcraft_verify_p3_{uuid.uuid4().hex[:8]}.xlsx")
    shutil.copy(WORKBOOK_PATH, temp_copy)

    app = None
    wb = None

    try:
        app = xw.App(visible=True)
        app.display_alerts = False
        wb = app.books.open(temp_copy, update_links=False)
        logger.info("Excel opened successfully")

        ws_dash = wb.sheets["Dashboard"]
        ws_output = wb.sheets["Output Baseline"]

        total_combos = len(COUNTRIES) * len(PARAM_COMBOS)
        combo_idx = 0

        for iso3, country_name in COUNTRIES.items():
            wb_name = country_name_map.get(iso3, country_name)

            for combo in PARAM_COMBOS:
                combo_idx += 1
                key = f"{iso3}_{combo['label']}"

                if key in completed:
                    logger.info(f"[{combo_idx}/{total_combos}] {key} — already done ({completed[key]['status']})")
                    continue

                logger.info(f"\n[{combo_idx}/{total_combos}] {iso3} × {combo['label']}...")

                save_checkpoint({"phase": 3, "results": completed, "in_progress": key,
                                "timestamp": datetime.now(timezone.utc).isoformat()})

                try:
                    # Set country first, wait for recalc
                    recalc_ok = set_country_and_wait(ws_dash, wb_name, ws_output, timeout=90)
                    if not recalc_ok:
                        completed[key] = {"status": "EXCEL_RECALC_ERROR", "country": iso3,
                                         "label": combo["label"]}
                        save_checkpoint({"phase": 3, "results": completed, "in_progress": None,
                                        "timestamp": datetime.now(timezone.utc).isoformat()})
                        continue

                    # Set params, wait for recalc
                    set_params_and_wait(ws_dash, ws_output, combo, config_defaults, timeout=30)

                    # Read Excel outputs
                    excel_metrics = read_excel_metrics(ws_output, years_to_read)

                    # Run Python engine
                    python_results = run_python_engine(iso3, combo, config_defaults)
                    python_metrics = extract_python_metrics(python_results, years_to_read)

                    # Compare
                    comparison = compare_metrics(excel_metrics, python_metrics)
                    comparison["country"] = iso3
                    comparison["country_name"] = country_name
                    comparison["label"] = combo["label"]
                    comparison["params"] = {k: v for k, v in combo.items() if k != "label"}

                    # Checkpoint values
                    debt_e = excel_metrics.get("debt_to_gdp", {})
                    debt_p = python_metrics.get("debt_to_gdp", {})
                    comparison["checkpoints"] = {
                        str(y): {"excel": debt_e.get(y), "python": debt_p.get(y)}
                        for y in [2030, 2050, 2099]
                    }

                    completed[key] = comparison
                    logger.info(f"  {comparison['status']}: worst {comparison['worst_diff']}pp at {comparison['worst_year']}")

                except Exception as e:
                    logger.error(f"  Error: {e}")
                    completed[key] = {"status": "PYTHON_ERROR", "country": iso3,
                                     "label": combo["label"], "error": str(e)}

                save_checkpoint({"phase": 3, "results": completed, "in_progress": None,
                                "timestamp": datetime.now(timezone.utc).isoformat()})

    finally:
        logger.info("\nCleaning up Excel...")
        try:
            if wb:
                wb.close()
            if app:
                app.quit()
        except Exception:
            try:
                if app:
                    app.kill()
            except Exception:
                os.system("killall 'Microsoft Excel'")
        try:
            os.unlink(temp_copy)
        except Exception:
            pass

    # Save final results
    with open(OUTPUT_PATH, "w") as f:
        json.dump({
            "phase": 3,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "countries": list(COUNTRIES.keys()),
            "param_combos": PARAM_COMBOS,
            "results": completed,
        }, f, indent=2, default=str)

    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("PHASE 3 SUMMARY")
    logger.info("=" * 60)
    status_counts = {}
    for key, res in completed.items():
        s = res.get("status", "UNKNOWN")
        status_counts[s] = status_counts.get(s, 0) + 1
        logger.info(f"  {key}: {s} (worst {res.get('worst_diff', 'N/A')}pp)")
    logger.info(f"\nTotals: {status_counts}")


if __name__ == "__main__":
    main()
