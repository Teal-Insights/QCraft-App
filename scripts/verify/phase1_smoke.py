"""Phase 1: xlwings Smoke Test — 3 countries (Uganda, USA, Maldives).

Opens the Excel workbook with xlwings, sets each country, reads outputs,
and compares against the Python engine with matching params.
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
OUTPUT_PATH = PROJECT_ROOT / "verification-logs" / "phase1_results.json"
WORKBOOK_PATH = PROJECT_ROOT / "source-materials" / "2024_IMF-FAD_Q-CRAFT-Tool-v10.xlsx"
GOLDEN_MASTER_PATH = PROJECT_ROOT / "packages" / "qcraft-engine" / "tests" / "golden_masters" / "final" / "uganda.csv"

# Add engine to path
sys.path.insert(0, str(PROJECT_ROOT / "packages" / "qcraft-engine" / "src"))

PHASE1_COUNTRIES = {
    "UGA": "Uganda",
    "USA": "United States",
    "MDV": "Maldives",
}

# Output Baseline chart data rows (from phase0 discovery)
OUTPUT_METRICS = {
    "revenue_percent_gdp": 61,
    "primary_expenditure_percent_gdp": 62,
    "interest_expenditure_percent_gdp": 63,
    "interest_rate_pct": 64,
    "primary_balance_percent_gdp": 65,
    "overall_balance_percent_gdp": 66,
    "debt_to_gdp": 67,
}

# Baseline calc sheet intermediate metrics
BASELINE_CALC_METRICS = {
    "nominal_gdp_level": 8,
    "real_gdp_growth_pct": 13,
    "ngdp_growth_pct": 15,
}

# Interest rate from Baseline calc
INTEREST_RATE_ROW = 33

YEAR_HEADER_ROW = 56  # Output Baseline
YEAR_START_COL = 3  # col C = 2009
BASELINE_YEAR_HEADER_ROW = 2
BASELINE_YEAR_START_COL = 4  # col D = 2009


def load_config():
    with open(CONFIG_PATH) as f:
        return json.load(f)


def set_country_and_wait(ws, cell_ref, country_name, sentinel_cells, timeout=60):
    """Set country and wait for recalculation."""
    ws[cell_ref].value = country_name
    app = ws.book.app
    app.calculate()

    last_vals = [None] * len(sentinel_cells)
    stable_count = 0
    start = time.time()

    while time.time() - start < timeout:
        current_vals = []
        for cell in sentinel_cells:
            val = ws[cell].value
            current_vals.append(val)

        all_valid = all(
            isinstance(v, (int, float)) and not isinstance(v, bool)
            for v in current_vals
        )

        if all_valid and current_vals == last_vals:
            stable_count += 1
            if stable_count >= 3:
                elapsed = time.time() - start
                logger.info(f"  Recalc stable after {elapsed:.1f}s")
                return True
        else:
            stable_count = 0
        last_vals = current_vals
        time.sleep(0.3)

    logger.warning(f"  Recalc timeout for {country_name} after {timeout}s")
    return False


def set_input_and_wait(ws, cell_ref, value, sentinel_cells, timeout=30):
    """Set an input cell value and wait for recalc."""
    ws[cell_ref].value = value
    app = ws.book.app
    app.calculate()

    last_vals = [None] * len(sentinel_cells)
    stable_count = 0
    start = time.time()

    while time.time() - start < timeout:
        current_vals = [ws[c].value for c in sentinel_cells]
        all_valid = all(isinstance(v, (int, float)) and not isinstance(v, bool) for v in current_vals)
        if all_valid and current_vals == last_vals:
            stable_count += 1
            if stable_count >= 3:
                return True
        else:
            stable_count = 0
        last_vals = current_vals
        time.sleep(0.3)
    return False


def read_excel_series(ws, row, year_header_row, year_start_col, year_range=None):
    """Read a full annual series from an Excel row.

    Returns dict of {year: value}.
    """
    import xlwings as xw

    # Read year header
    years_row = ws.range((year_header_row, year_start_col), (year_header_row, year_start_col + 100)).value

    result = {}
    for i, year_val in enumerate(years_row):
        if year_val is None:
            break
        year = int(year_val)
        if year_range and year not in year_range:
            continue
        col = year_start_col + i
        val = ws.range((row, col)).value
        if isinstance(val, (int, float)) and not isinstance(val, bool):
            result[year] = float(val)
        else:
            result[year] = None  # #VALUE!, #REF!, None
    return result


def read_output_baseline_metrics(ws_output, years_to_read=None):
    """Read all output baseline metrics for the full series."""
    all_metrics = {}
    for metric_name, row in OUTPUT_METRICS.items():
        series = read_excel_series(ws_output, row, YEAR_HEADER_ROW, YEAR_START_COL, years_to_read)
        all_metrics[metric_name] = series
    return all_metrics


def read_baseline_calc_metrics(ws_baseline, years_to_read=None):
    """Read intermediate metrics from Baseline calc sheet."""
    all_metrics = {}
    for metric_name, row in BASELINE_CALC_METRICS.items():
        series = read_excel_series(ws_baseline, row, BASELINE_YEAR_HEADER_ROW, BASELINE_YEAR_START_COL, years_to_read)
        all_metrics[metric_name] = series

    # Interest rate
    series = read_excel_series(ws_baseline, INTEREST_RATE_ROW, BASELINE_YEAR_HEADER_ROW, BASELINE_YEAR_START_COL, years_to_read)
    all_metrics["interest_rate_pct"] = series

    return all_metrics


def run_python_engine(iso3c, params):
    """Run the Python engine and return results."""
    from qcraft_engine.data_loader import load_parquet_data, run_pipeline

    data = load_parquet_data()
    results = run_pipeline(data, iso3c, params=params)
    return results


def extract_python_metrics(results, years_range):
    """Extract comparable metrics from Python engine results."""
    import polars as pl

    fiscal = results["fiscal"]
    baseline = results["baseline_v1"]
    interest = results["interest_rate"]

    metrics = {}

    # Primary metrics from fiscal
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

    # Interest rate from interest_rate results
    if "interest_rate_pct" in interest.columns:
        series = {}
        for row in interest.filter(pl.col("years").is_in(list(years_range))).iter_rows(named=True):
            series[int(row["years"])] = float(row["interest_rate_pct"]) if row["interest_rate_pct"] is not None else None
        metrics["interest_rate_pct"] = series

    # Intermediate: nominal GDP from baseline_v1
    if "nominal_gdp" in baseline.columns:
        series = {}
        for row in baseline.filter(pl.col("years").is_in(list(years_range))).iter_rows(named=True):
            series[int(row["years"])] = float(row["nominal_gdp"]) if row["nominal_gdp"] is not None else None
        metrics["nominal_gdp_level"] = series

    # Real GDP growth from baseline_v1
    if "real_gdp_growth_percent" in baseline.columns:
        series = {}
        for row in baseline.filter(pl.col("years").is_in(list(years_range))).iter_rows(named=True):
            series[int(row["years"])] = float(row["real_gdp_growth_percent"]) if row["real_gdp_growth_percent"] is not None else None
        metrics["real_gdp_growth_pct"] = series

    # NGDP growth from baseline_v1
    if "nominal_gdp_growth_percent" in baseline.columns:
        series = {}
        for row in baseline.filter(pl.col("years").is_in(list(years_range))).iter_rows(named=True):
            series[int(row["years"])] = float(row["nominal_gdp_growth_percent"]) if row["nominal_gdp_growth_percent"] is not None else None
        metrics["ngdp_growth_pct"] = series

    return metrics


def compare_metrics(excel_metrics, python_metrics, tolerance_pass=0.1, tolerance_review=0.5):
    """Compare Excel vs Python metrics, return comparison results."""
    results = {}
    worst_diff = 0.0
    worst_year = None
    worst_metric = None

    for metric_name in set(list(excel_metrics.keys()) + list(python_metrics.keys())):
        excel_series = excel_metrics.get(metric_name, {})
        python_series = python_metrics.get(metric_name, {})

        metric_result = {"diffs": {}, "worst_diff": 0.0, "worst_year": None, "missing_excel": [], "missing_python": []}

        all_years = sorted(set(list(excel_series.keys()) + list(python_series.keys())))
        for year in all_years:
            e_val = excel_series.get(year)
            p_val = python_series.get(year)

            if e_val is None:
                metric_result["missing_excel"].append(year)
                continue
            if p_val is None:
                metric_result["missing_python"].append(year)
                continue

            diff = abs(e_val - p_val)
            metric_result["diffs"][str(year)] = {
                "excel": round(e_val, 6),
                "python": round(p_val, 6),
                "abs_diff": round(diff, 6),
            }
            if diff > metric_result["worst_diff"]:
                metric_result["worst_diff"] = diff
                metric_result["worst_year"] = year
            if diff > worst_diff:
                worst_diff = diff
                worst_year = year
                worst_metric = metric_name

        results[metric_name] = metric_result

    # Determine status
    if worst_diff <= tolerance_pass:
        status = "PARITY_PASS"
    elif worst_diff <= tolerance_review:
        status = "PARITY_REVIEW"
    else:
        status = "PARITY_FAIL"

    return {
        "metrics": results,
        "worst_diff": round(worst_diff, 6),
        "worst_year": worst_year,
        "worst_metric": worst_metric,
        "status": status,
    }


def check_uganda_golden_master(python_results):
    """Compare Python engine output against golden master CSV for Uganda."""
    import polars as pl

    gm = pl.read_csv(str(GOLDEN_MASTER_PATH))
    # Golden master has columns: scenario, year, metric1, metric2, ...
    # Filter to Baseline scenario only
    gm_baseline = gm.filter(pl.col("scenario") == "Baseline")
    fiscal = python_results["fiscal"]

    diffs = {}
    for col in gm_baseline.columns:
        if col in ("year", "scenario"):
            continue
        if col not in fiscal.columns:
            continue
        gm_series = {int(r["year"]): float(r[col]) for r in gm_baseline.iter_rows(named=True) if r[col] is not None}
        py_series = {int(r["years"]): float(r[col]) for r in fiscal.iter_rows(named=True) if r[col] is not None}
        worst = 0.0
        for year in gm_series:
            if year in py_series:
                d = abs(gm_series[year] - py_series[year])
                worst = max(worst, d)
        diffs[col] = worst

    return diffs


def main():
    config = load_config()
    excel_defaults = config["excel_defaults"]
    country_map = config["country_name_map"]

    # Parameters: use Excel defaults for parity comparison
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

    # Years to compare
    all_years = set(range(2030, 2100))  # 2030-2099 projection period
    weo_years = set(range(2023, 2030))  # WEO period for Uganda sanity check
    checkpoint_years = {2030, 2040, 2050, 2070, 2099}

    results = {
        "phase": 1,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "params_used": params,
        "countries": {},
    }

    # --- Open Excel with xlwings ---
    import xlwings as xw

    temp_copy = f"/tmp/qcraft_verify_{uuid.uuid4().hex[:8]}.xlsx"
    shutil.copy(WORKBOOK_PATH, temp_copy)
    logger.info(f"Working copy: {temp_copy}")

    app = None
    wb = None
    try:
        app = xw.App(visible=True)  # macOS requires visible=True for xlwings AppleScript
        app.display_alerts = False
        wb = app.books.open(temp_copy, update_links=False)
        logger.info("Excel workbook opened successfully via xlwings")

        ws_dash = wb.sheets["Dashboard"]
        ws_output = wb.sheets["Output Baseline"]
        ws_baseline = wb.sheets["Baseline"]

        # Sentinel cells for recalc stability (Output Baseline debt-to-GDP row 67, years 2050 and 2099)
        # Col 44 = 2050, Col 93 = 2099 (based on year_start_col=3, so 2050=3+(2050-2009)=44)
        sentinel_cells_output = ["AR67", "CO67"]  # 2050 and 2099 debt-to-GDP

        for iso3, country_name in PHASE1_COUNTRIES.items():
            logger.info(f"\n{'='*60}")
            logger.info(f"Testing {country_name} ({iso3})")
            logger.info(f"{'='*60}")

            country_result = {"country_name": country_name, "iso3": iso3}

            try:
                # Set country
                logger.info(f"  Setting country to '{country_name}'...")
                recalc_ok = set_country_and_wait(ws_dash, "C12", country_name, sentinel_cells_output, timeout=90)

                if not recalc_ok:
                    # Check if values are at least numeric
                    test_val = ws_output.range("AR67").value  # 2050 debt-to-GDP
                    if isinstance(test_val, (int, float)):
                        logger.warning("  Recalc timeout but values look numeric, proceeding")
                    else:
                        country_result["status"] = "EXCEL_RECALC_ERROR"
                        country_result["error"] = f"Recalc timeout, sentinel value: {test_val!r}"
                        results["countries"][iso3] = country_result
                        continue

                # Set ALL inputs explicitly
                logger.info("  Setting inputs explicitly...")
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

                # Wait for recalc to settle
                set_input_and_wait(ws_dash, "C34", params["debt_target"], sentinel_cells_output, timeout=30)

                # Read Excel outputs — full series
                logger.info("  Reading Output Baseline metrics...")
                excel_metrics = read_output_baseline_metrics(ws_output, all_years)

                # Check for missing/error values
                missing_count = 0
                for m, series in excel_metrics.items():
                    for y, v in series.items():
                        if v is None:
                            missing_count += 1

                if missing_count > 0:
                    logger.warning(f"  {missing_count} missing/error values in Excel output")

                # Read intermediate metrics from Baseline calc
                logger.info("  Reading Baseline calc metrics...")
                excel_intermediate = read_baseline_calc_metrics(ws_baseline, all_years | weo_years)

                # Run Python engine
                logger.info("  Running Python engine...")
                python_results = run_python_engine(iso3, params)
                python_metrics = extract_python_metrics(python_results, all_years)
                python_intermediate = extract_python_metrics(python_results, all_years | weo_years)

                # Compare primary metrics
                logger.info("  Comparing primary metrics...")
                tolerance_pass = 0.1 if iso3 == "UGA" else 0.5
                tolerance_review = 0.5
                comparison = compare_metrics(excel_metrics, python_metrics, tolerance_pass, tolerance_review)
                country_result.update(comparison)

                # Compare intermediate metrics
                logger.info("  Comparing intermediate metrics...")
                intermediate_comparison = compare_metrics(excel_intermediate, python_intermediate, tolerance_pass, tolerance_review)
                country_result["intermediate"] = intermediate_comparison

                # WEO vintage check for Uganda
                if iso3 == "UGA":
                    logger.info("  WEO vintage sanity check (2023-2029)...")
                    excel_weo = read_output_baseline_metrics(ws_output, weo_years)
                    python_weo = extract_python_metrics(python_results, weo_years)
                    weo_comparison = compare_metrics(excel_weo, python_weo, 0.01, 0.1)
                    country_result["weo_check"] = weo_comparison
                    if weo_comparison["worst_diff"] > 0.01:
                        logger.warning(f"  WEO MISMATCH: worst diff = {weo_comparison['worst_diff']}pp")
                    else:
                        logger.info(f"  WEO check OK: worst diff = {weo_comparison['worst_diff']}pp")

                    # Golden master check
                    logger.info("  Checking against golden master CSV...")
                    gm_diffs = check_uganda_golden_master(python_results)
                    country_result["golden_master_check"] = {k: round(v, 8) for k, v in gm_diffs.items()}
                    gm_worst = max(gm_diffs.values()) if gm_diffs else 0
                    logger.info(f"  Golden master worst diff: {gm_worst}")

                # Log checkpoint values
                logger.info(f"  Status: {country_result.get('status', 'unknown')}")
                logger.info(f"  Worst diff: {country_result.get('worst_diff', 'N/A')}pp at year {country_result.get('worst_year', 'N/A')} ({country_result.get('worst_metric', 'N/A')})")

                # Log checkpoint values for summary
                checkpoints = {}
                for metric_name in ["debt_to_gdp", "revenue_percent_gdp", "primary_balance_percent_gdp"]:
                    if metric_name in comparison.get("metrics", {}):
                        for year in [2030, 2050, 2099]:
                            key = f"{metric_name}_{year}"
                            diffs = comparison["metrics"][metric_name]["diffs"]
                            if str(year) in diffs:
                                checkpoints[key] = diffs[str(year)]
                country_result["checkpoints"] = checkpoints

            except Exception as e:
                logger.error(f"  Error: {e}", exc_info=True)
                country_result["status"] = "PYTHON_ERROR"
                country_result["error"] = str(e)

            results["countries"][iso3] = country_result

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

        # Clean up temp file
        try:
            os.unlink(temp_copy)
        except Exception:
            pass

    # Save results
    with open(OUTPUT_PATH, "w") as f:
        json.dump(results, f, indent=2, default=str)
    logger.info(f"\nPhase 1 results saved to {OUTPUT_PATH}")

    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("PHASE 1 SUMMARY")
    logger.info("=" * 60)
    for iso3, res in results["countries"].items():
        status = res.get("status", "UNKNOWN")
        worst = res.get("worst_diff", "N/A")
        worst_yr = res.get("worst_year", "")
        worst_m = res.get("worst_metric", "")
        logger.info(f"  {iso3} ({res.get('country_name', '')}): {status} — worst {worst}pp at {worst_yr} ({worst_m})")

    return results


if __name__ == "__main__":
    main()
