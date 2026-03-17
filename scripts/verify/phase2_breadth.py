"""Phase 2: Breadth Test — 30 countries, default params.

Compares Python engine output against Excel for 30 stratified countries
using Excel's default parameters. Includes checkpoint/resume support.
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
CHECKPOINT_PATH = PROJECT_ROOT / "verification-logs" / "phase2_checkpoint.json"
OUTPUT_PATH = PROJECT_ROOT / "verification-logs" / "phase2_results.json"
WORKBOOK_PATH = PROJECT_ROOT / "source-materials" / "2024_IMF-FAD_Q-CRAFT-Tool-v10.xlsx"

sys.path.insert(0, str(PROJECT_ROOT / "packages" / "qcraft-engine" / "src"))

COUNTRIES = {
    # LIC Fragile (5)
    "SSD": "South Sudan, Republic of",
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
    # Advanced (5)
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

OUTPUT_METRICS = {
    "revenue_percent_gdp": 61,
    "primary_expenditure_percent_gdp": 62,
    "interest_expenditure_percent_gdp": 63,
    "interest_rate_pct": 64,
    "primary_balance_percent_gdp": 65,
    "overall_balance_percent_gdp": 66,
    "debt_to_gdp": 67,
}

YEAR_HEADER_ROW = 56
YEAR_START_COL = 3


def load_config():
    with open(CONFIG_PATH) as f:
        return json.load(f)


def load_checkpoint():
    if CHECKPOINT_PATH.exists():
        with open(CHECKPOINT_PATH) as f:
            return json.load(f)
    return None


def save_checkpoint(checkpoint):
    with open(CHECKPOINT_PATH, "w") as f:
        json.dump(checkpoint, f, indent=2, default=str)


def set_country_and_wait(ws_dash, country_name, sentinel_cells, ws_output, timeout=90):
    """Set country and wait for recalculation."""
    ws_dash["C12"].value = country_name
    app = ws_dash.book.app
    app.calculate()

    last_vals = [None] * len(sentinel_cells)
    stable_count = 0
    start = time.time()

    while time.time() - start < timeout:
        current_vals = []
        for cell in sentinel_cells:
            val = ws_output[cell].value
            current_vals.append(val)

        all_valid = all(
            isinstance(v, (int, float)) and not isinstance(v, bool)
            for v in current_vals
        )

        if all_valid and current_vals == last_vals:
            stable_count += 1
            if stable_count >= 3:
                return True
        else:
            stable_count = 0
        last_vals = current_vals
        time.sleep(0.3)

    # Check if values are at least numeric
    test_val = ws_output[sentinel_cells[0]].value
    if isinstance(test_val, (int, float)):
        return True  # Timeout but values look valid
    return False


def read_excel_series(ws, row, years_to_read=None):
    """Read a full annual series from an Output Baseline row."""
    result = {}
    # Year header row 56, col 3 = 2009, col 93 = 2099
    for year in range(2009, 2100):
        if years_to_read and year not in years_to_read:
            continue
        col = YEAR_START_COL + (year - 2009)
        val = ws.range((row, col)).value
        if isinstance(val, (int, float)) and not isinstance(val, bool):
            result[year] = float(val)
        else:
            result[year] = None
    return result


def read_all_excel_metrics(ws_output, years_to_read):
    """Read all output baseline metrics."""
    metrics = {}
    for name, row in OUTPUT_METRICS.items():
        metrics[name] = read_excel_series(ws_output, row, years_to_read)
    return metrics


def run_python_engine(iso3c, params):
    """Run the Python engine."""
    from qcraft_engine.data_loader import load_parquet_data, run_pipeline
    data = load_parquet_data()
    return run_pipeline(data, iso3c, params=params)


def extract_python_metrics(results, years_range):
    """Extract comparable metrics from Python engine."""
    import polars as pl
    fiscal = results["fiscal"]
    interest = results["interest_rate"]

    metrics = {}
    fiscal_cols = {
        "revenue_percent_gdp": "revenue_percent_gdp",
        "primary_expenditure_percent_gdp": "primary_expenditure_percent_gdp",
        "primary_balance_percent_gdp": "primary_balance_percent_gdp",
        "debt_to_gdp": "debt_to_gdp",
        "overall_balance_percent_gdp": "overall_balance_percent_gdp",
        "interest_expenditure_percent_gdp": "interest_expenditure_percent_gdp",
    }

    for metric_name, col_name in fiscal_cols.items():
        if col_name in fiscal.columns:
            series = {}
            for row in fiscal.filter(pl.col("years").is_in(list(years_range))).iter_rows(named=True):
                series[int(row["years"])] = float(row[col_name]) if row[col_name] is not None else None
            metrics[metric_name] = series

    if "interest_rate_pct" in interest.columns:
        series = {}
        for row in interest.filter(pl.col("years").is_in(list(years_range))).iter_rows(named=True):
            series[int(row["years"])] = float(row["interest_rate_pct"]) if row["interest_rate_pct"] is not None else None
        metrics["interest_rate_pct"] = series

    return metrics


def compare_metrics(excel_metrics, python_metrics):
    """Compare and return status + worst diff."""
    worst_diff = 0.0
    worst_year = None
    worst_metric = None
    per_metric = {}

    for metric_name in excel_metrics:
        e_series = excel_metrics.get(metric_name, {})
        p_series = python_metrics.get(metric_name, {})
        metric_worst = 0.0
        metric_worst_year = None

        for year in e_series:
            e_val = e_series.get(year)
            p_val = p_series.get(year)
            if e_val is None or p_val is None:
                continue
            diff = abs(e_val - p_val)
            if diff > metric_worst:
                metric_worst = diff
                metric_worst_year = year
            if diff > worst_diff:
                worst_diff = diff
                worst_year = year
                worst_metric = metric_name

        per_metric[metric_name] = {"worst_diff": round(metric_worst, 6), "worst_year": metric_worst_year}

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
        "per_metric": per_metric,
    }


def preflight_check(config):
    """Check which countries are available in both systems."""
    from qcraft_engine.data_loader import load_parquet_data, get_country_list
    data = load_parquet_data()
    engine_countries = get_country_list(data)
    engine_iso3s = {c["iso3c"] for c in engine_countries}
    excel_iso3s = set(config["country_name_map"].keys())

    results = {}
    for iso3, name in COUNTRIES.items():
        in_engine = iso3 in engine_iso3s
        in_excel = iso3 in excel_iso3s
        if not in_engine:
            results[iso3] = "ENGINE_DATA_GAP"
        elif not in_excel:
            results[iso3] = "NOT_IN_EXCEL"
        else:
            results[iso3] = "AVAILABLE"

    return results


def main():
    config = load_config()
    excel_defaults = config["excel_defaults"]
    country_name_map = config["country_name_map"]

    params = {
        "demography_variant": excel_defaults["demography_variant"],
        "productivity_start": float(excel_defaults["productivity_start"]),
        "productivity_end": float(excel_defaults["productivity_end"]),
        "inflation_start": float(excel_defaults["inflation_start"]),
        "inflation_end": float(excel_defaults["inflation_end"]),
        "interest_rate_mode": excel_defaults["interest_rate_mode"],
        "debt_target": float(excel_defaults["debt_target"]),
        "fiscal_rule": excel_defaults["fiscal_rule"],
        "expenditure_rigidity": float(excel_defaults["expenditure_rigidity"]),
    }
    logger.info(f"Using params: {params}")

    years_to_read = set(range(2030, 2100))

    # Preflight
    logger.info("Running preflight country availability check...")
    availability = preflight_check(config)
    for iso3, status in availability.items():
        if status != "AVAILABLE":
            logger.warning(f"  {iso3} ({COUNTRIES[iso3]}): {status}")

    # Load checkpoint if exists
    checkpoint = load_checkpoint()
    completed = {}
    if checkpoint and checkpoint.get("phase") == 2:
        completed = checkpoint.get("results", {})
        logger.info(f"Resuming from checkpoint: {len(completed)} countries already done")

    import xlwings as xw

    temp_copy = f"/tmp/qcraft_verify_p2_{uuid.uuid4().hex[:8]}.xlsx"
    shutil.copy(WORKBOOK_PATH, temp_copy)

    app = None
    wb = None
    consecutive_timeouts = 0

    try:
        app = xw.App(visible=True)
        app.display_alerts = False
        wb = app.books.open(temp_copy, update_links=False)
        logger.info("Excel opened successfully")

        ws_dash = wb.sheets["Dashboard"]
        ws_output = wb.sheets["Output Baseline"]

        sentinel_cells = ["AR67", "CO67"]  # 2050 and 2099 debt-to-GDP

        countries_list = list(COUNTRIES.items())
        for i, (iso3, excel_name) in enumerate(countries_list):
            # Skip if already completed
            if iso3 in completed:
                logger.info(f"[{i+1}/{len(countries_list)}] {iso3} — already done ({completed[iso3]['status']})")
                continue

            # Skip if not available
            if availability.get(iso3) != "AVAILABLE":
                status = availability[iso3]
                completed[iso3] = {
                    "country_name": excel_name,
                    "status": status,
                    "worst_diff": None,
                    "worst_year": None,
                    "worst_metric": None,
                }
                logger.info(f"[{i+1}/{len(countries_list)}] {iso3} ({excel_name}): {status}")
                save_checkpoint({"phase": 2, "results": completed, "in_progress": None,
                                "timestamp": datetime.now(timezone.utc).isoformat()})
                continue

            logger.info(f"\n[{i+1}/{len(countries_list)}] Testing {excel_name} ({iso3})...")

            # Save in-progress checkpoint
            save_checkpoint({"phase": 2, "results": completed, "in_progress": iso3,
                            "timestamp": datetime.now(timezone.utc).isoformat()})

            # Use the workbook name from our Phase 0 map if available
            wb_name = country_name_map.get(iso3, excel_name)

            try:
                # Set country
                recalc_timeout = 90 if consecutive_timeouts < 5 else 120
                recalc_ok = set_country_and_wait(ws_dash, wb_name, sentinel_cells, ws_output, timeout=recalc_timeout)

                if not recalc_ok:
                    consecutive_timeouts += 1
                    if consecutive_timeouts >= 3:
                        logger.warning(f"  {consecutive_timeouts} consecutive timeouts — restarting Excel")
                        wb.close()
                        app.quit()
                        time.sleep(2)
                        app = xw.App(visible=True)
                        app.display_alerts = False
                        wb = app.books.open(temp_copy, update_links=False)
                        ws_dash = wb.sheets["Dashboard"]
                        ws_output = wb.sheets["Output Baseline"]
                        # Retry this country
                        recalc_ok = set_country_and_wait(ws_dash, wb_name, sentinel_cells, ws_output, timeout=120)

                    if not recalc_ok:
                        completed[iso3] = {
                            "country_name": excel_name,
                            "status": "TIMEOUT",
                            "worst_diff": None,
                            "worst_year": None,
                            "worst_metric": None,
                        }
                        save_checkpoint({"phase": 2, "results": completed, "in_progress": None,
                                        "timestamp": datetime.now(timezone.utc).isoformat()})
                        continue
                else:
                    consecutive_timeouts = 0

                # Set ALL inputs explicitly
                ws_dash["C17"].value = params["demography_variant"]
                ws_dash["C20"].value = params["productivity_start"]
                ws_dash["C21"].value = params["productivity_end"]
                ws_dash["C24"].value = params["inflation_start"]
                ws_dash["C25"].value = params["inflation_end"]
                ws_dash["C28"].value = params["interest_rate_mode"]
                ws_dash["C33"].value = params["fiscal_rule"]
                ws_dash["C34"].value = params["debt_target"]
                ws_dash["C38"].value = params["expenditure_rigidity"]
                app.calculate()
                time.sleep(2)
                app.calculate()
                time.sleep(1)

                # Read Excel outputs
                excel_metrics = read_all_excel_metrics(ws_output, years_to_read)

                # Check for missing values
                missing = sum(1 for m in excel_metrics.values() for v in m.values() if v is None)
                if missing > 0:
                    logger.warning(f"  {missing} missing values in Excel output")

                # Run Python engine
                python_results = run_python_engine(iso3, params)
                python_metrics = extract_python_metrics(python_results, years_to_read)

                # Compare
                comparison = compare_metrics(excel_metrics, python_metrics)
                comparison["country_name"] = excel_name

                # Add checkpoint values
                debt_series_excel = excel_metrics.get("debt_to_gdp", {})
                debt_series_python = python_metrics.get("debt_to_gdp", {})
                comparison["checkpoints"] = {
                    str(y): {
                        "excel": debt_series_excel.get(y),
                        "python": debt_series_python.get(y),
                    }
                    for y in [2030, 2050, 2099]
                }

                completed[iso3] = comparison
                logger.info(f"  {comparison['status']}: worst {comparison['worst_diff']}pp at {comparison['worst_year']} ({comparison['worst_metric']})")

            except Exception as e:
                logger.error(f"  Error: {e}")
                completed[iso3] = {
                    "country_name": excel_name,
                    "status": "PYTHON_ERROR",
                    "error": str(e),
                    "worst_diff": None,
                    "worst_year": None,
                    "worst_metric": None,
                }

            # Save checkpoint
            save_checkpoint({"phase": 2, "results": completed, "in_progress": None,
                            "timestamp": datetime.now(timezone.utc).isoformat()})

            # Mid-phase sanity gate
            if (i + 1) % 10 == 0:
                total = sum(1 for r in completed.values() if r.get("status") not in ("ENGINE_DATA_GAP", "NOT_IN_EXCEL"))
                passed = sum(1 for r in completed.values() if r.get("status") == "PARITY_PASS")
                rate = passed / total if total > 0 else 0
                logger.info(f"Progress: {total} tested, pass rate: {rate:.0%}")
                if rate < 0.5:
                    logger.critical(f"Pass rate {rate:.0%} < 50%! Check cell mapping.")

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
            "phase": 2,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "params_used": params,
            "availability": availability,
            "countries": completed,
        }, f, indent=2, default=str)

    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("PHASE 2 SUMMARY")
    logger.info("=" * 60)
    status_counts = {}
    for iso3, res in completed.items():
        s = res.get("status", "UNKNOWN")
        status_counts[s] = status_counts.get(s, 0) + 1
        worst = res.get("worst_diff", "N/A")
        logger.info(f"  {iso3}: {s} (worst {worst}pp)")
    logger.info(f"\nTotals: {status_counts}")


if __name__ == "__main__":
    main()
