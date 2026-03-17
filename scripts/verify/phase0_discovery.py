"""Phase 0: Workbook Discovery — map Excel cell references and structure.

Opens the Q-CRAFT Excel workbook with openpyxl (NOT data_only) to inspect
formulas and structure, then reads cached values with data_only=True.
Outputs phase0_config.json for all subsequent phases.
"""

import json
import logging
import sys
from pathlib import Path

import openpyxl

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
WORKBOOK_PATH = PROJECT_ROOT / "source-materials" / "2024_IMF-FAD_Q-CRAFT-Tool-v10.xlsx"
OUTPUT_DIR = PROJECT_ROOT / "verification-logs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Import the extraction script's name mapping
sys.path.insert(0, str(PROJECT_ROOT / "scripts"))
from extract_excel_data import _get_iso3c, _MANUAL_ISO3C


def discover_workbook():
    """Map the workbook structure and save config."""
    logger.info(f"Opening workbook: {WORKBOOK_PATH}")

    # ── Open with formulas (NOT data_only) ──
    wb_formula = openpyxl.load_workbook(WORKBOOK_PATH, data_only=False, read_only=True)
    logger.info(f"Sheet names: {wb_formula.sheetnames}")

    config = {
        "workbook_path": str(WORKBOOK_PATH),
        "sheet_names": wb_formula.sheetnames,
    }

    # ── Check for VBA macros ──
    config["has_vba_macros"] = wb_formula.vba_archive is not None
    logger.info(f"VBA macros: {config['has_vba_macros']}")

    # ── Check for external links ──
    # openpyxl exposes external links as wb.defined_names or _external_links
    has_external = hasattr(wb_formula, '_external_links') and len(wb_formula._external_links) > 0
    config["has_external_links"] = has_external
    logger.info(f"External links: {has_external}")

    # ── Country selector ──
    config["country_selector_cell"] = "Dashboard!C12"

    # ── Input cells ──
    config["input_cells"] = {
        "debt_target": "Dashboard!C17",
        "fiscal_rule_1": "Dashboard!C33",
        "fiscal_rule_2": "Dashboard!C34",
        "expenditure_rigidity": "Dashboard!C38",
        "interest_rate_mode": "Dashboard!C28",
        "interest_rate_setting_2": "Dashboard!C29",
        "param_c20": "Dashboard!C20",
        "param_c21": "Dashboard!C21",
        "param_c24": "Dashboard!C24",
        "param_c25": "Dashboard!C25",
    }

    # ── Read country name list from validation source range ──
    # Macrofiscal!$A$67:$A$264
    ws_macro_formula = wb_formula["Macrofiscal"]
    country_names_excel = []
    for row in ws_macro_formula.iter_rows(min_row=67, max_row=264, min_col=1, max_col=1, values_only=True):
        name = row[0]
        if name and isinstance(name, str) and name.strip():
            country_names_excel.append(name.strip())
    logger.info(f"Excel country names found: {len(country_names_excel)}")

    # Build ISO3 <-> workbook name mapping
    country_name_map = {}  # ISO3 -> workbook name
    unmapped_names = []
    for name in country_names_excel:
        iso3 = _get_iso3c(name)
        if iso3:
            country_name_map[iso3] = name
        else:
            unmapped_names.append(name)

    if unmapped_names:
        logger.warning(f"Unmapped country names ({len(unmapped_names)}): {unmapped_names[:10]}")

    config["country_name_map"] = country_name_map
    config["unmapped_country_names"] = unmapped_names
    logger.info(f"Mapped {len(country_name_map)} countries to ISO3 codes")

    wb_formula.close()

    # ── Open with cached values (data_only=True) ──
    logger.info("Opening workbook with data_only=True for cached values...")
    wb_data = openpyxl.load_workbook(WORKBOOK_PATH, data_only=True, read_only=True)

    # ── Read Excel defaults ──
    ws_dash = wb_data["Dashboard"]
    excel_defaults = {}

    # Read specific cells
    cell_reads = {
        "country_selector": "C12",
        "debt_target": "C17",
        "param_c20": "C20",
        "param_c21": "C21",
        "param_c24": "C24",
        "param_c25": "C25",
        "interest_rate_mode": "C28",
        "interest_rate_setting_2": "C29",
        "fiscal_rule_1": "C33",
        "fiscal_rule_2": "C34",
        "expenditure_rigidity": "C38",
    }

    for key, cell_ref in cell_reads.items():
        val = ws_dash[cell_ref].value
        excel_defaults[key] = val
        logger.info(f"  Dashboard!{cell_ref} ({key}): {val!r}")

    config["excel_defaults_raw"] = {k: _serialize(v) for k, v in excel_defaults.items()}
    config["cached_country"] = excel_defaults.get("country_selector")

    # ── Compare Excel vs Python defaults ──
    python_defaults = {
        "debt_target": 50.0,
        "fiscal_rule": "Yes",
        "expenditure_rigidity": 1.0,
        "interest_rate_mode": "Nominal interest rate",
    }

    # C17 = "Medium" = demography variant, C34 = 60 = debt target number
    # C33 = "Yes" = fiscal rule, C38 = 1 = expenditure rigidity
    # C20 = productivity_start, C21 = productivity_end
    # C24 = inflation_start(?), C25 = inflation_end(?)
    excel_interpreted = {
        "debt_target": excel_defaults.get("fiscal_rule_2"),  # C34 = 60
        "fiscal_rule": excel_defaults.get("fiscal_rule_1"),  # C33 = "Yes"
        "expenditure_rigidity": excel_defaults.get("expenditure_rigidity"),  # C38
        "interest_rate_mode": excel_defaults.get("interest_rate_mode"),  # C28
    }

    config["engine_defaults_comparison"] = {}
    for key in python_defaults:
        excel_val = excel_interpreted.get(key)
        python_val = python_defaults[key]
        match = _values_match(excel_val, python_val)
        config["engine_defaults_comparison"][key] = {
            "excel": _serialize(excel_val),
            "python": _serialize(python_val),
            "match": match,
        }
        if not match:
            logger.warning(f"  DEFAULT MISMATCH: {key}: Excel={excel_val!r}, Python={python_val!r}")

    # ── Discover output cells ──
    # Check what sheets exist for outputs
    output_sheets_info = {}
    for sheet_name in ["Output Baseline", "Output Scenarios", "Baseline", "Paris",
                       "Moderate", "Hot", "Hot_Adapted", "Hot_Unadapted", "High"]:
        if sheet_name in wb_data.sheetnames:
            ws = wb_data[sheet_name]
            # Read first few rows to understand structure
            rows = []
            row_count = 0
            for row in ws.iter_rows(min_row=1, max_row=20, values_only=True):
                rows.append(row)
                row_count += 1
            output_sheets_info[sheet_name] = {
                "exists": True,
                "sample_rows": row_count,
            }
        else:
            output_sheets_info[sheet_name] = {"exists": False}

    config["output_sheets"] = output_sheets_info

    # ── Map Output Baseline structure ──
    output_baseline_map = _map_output_sheet(wb_data, "Output Baseline")
    config["output_baseline_map"] = output_baseline_map

    # ── Map Output Scenarios structure ──
    output_scenarios_map = _map_output_sheet(wb_data, "Output Scenarios")
    config["output_scenarios_map"] = output_scenarios_map

    # ── Map Baseline sheet structure (raw calc) ──
    baseline_map = _map_calc_sheet(wb_data, "Baseline")
    config["baseline_calc_map"] = baseline_map

    # ── WEO max year check ──
    # Find the last year with non-formula historical data in Macrofiscal
    config["weo_max_year"] = 2029  # Known from SPEC
    config["check_years"] = [2030, 2040, 2050, 2070, 2099]

    wb_data.close()

    # ── Save config ──
    output_path = OUTPUT_DIR / "phase0_config.json"
    with open(output_path, "w") as f:
        json.dump(config, f, indent=2, default=str)
    logger.info(f"Saved config to {output_path}")

    return config


def _map_output_sheet(wb, sheet_name):
    """Map the structure of an output sheet, finding row labels and year columns."""
    if sheet_name not in wb.sheetnames:
        return {"exists": False}

    ws = wb[sheet_name]
    result = {"exists": True, "row_labels": {}, "year_columns": {}}

    # Use values_only to avoid EmptyCell issues in read_only mode
    for row_idx, row in enumerate(ws.iter_rows(min_row=1, max_row=100, min_col=1, max_col=50, values_only=True), start=1):
        label_a = row[0] if row else None
        label_b = row[1] if len(row) > 1 else None

        if label_a and isinstance(label_a, str):
            result["row_labels"][str(row_idx)] = {"col_a": label_a, "col_b": str(label_b) if label_b else None}
        elif label_b and isinstance(label_b, str):
            result["row_labels"][str(row_idx)] = {"col_a": None, "col_b": label_b}

        # Look for year headers (numbers like 2020-2100)
        for col_idx, val in enumerate(row):
            if isinstance(val, (int, float)) and 2020 <= val <= 2100:
                col_letter = openpyxl.utils.get_column_letter(col_idx + 1)
                result["year_columns"][str(int(val))] = col_letter

    return result


def _map_calc_sheet(wb, sheet_name):
    """Map the structure of a calculation sheet (Baseline, Paris, etc.)."""
    if sheet_name not in wb.sheetnames:
        return {"exists": False}

    ws = wb[sheet_name]
    result = {"exists": True, "row_labels": {}}

    for row_idx, row in enumerate(ws.iter_rows(min_row=1, max_row=100, min_col=1, max_col=3, values_only=True), start=1):
        label_a = row[0] if row else None
        label_b = row[1] if len(row) > 1 else None

        if label_a and isinstance(label_a, str):
            result["row_labels"][str(row_idx)] = {"col_a": label_a, "col_b": str(label_b) if label_b else None}
        elif label_b and isinstance(label_b, str):
            result["row_labels"][str(row_idx)] = {"col_a": None, "col_b": label_b}


def _serialize(val):
    """Make a value JSON-serializable."""
    if val is None:
        return None
    if isinstance(val, (int, float, str, bool)):
        return val
    return str(val)


def _values_match(a, b):
    """Check if two values match (tolerant of type differences)."""
    if a is None or b is None:
        return a is None and b is None
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return abs(float(a) - float(b)) < 0.001
    return str(a).strip().lower() == str(b).strip().lower()


if __name__ == "__main__":
    config = discover_workbook()
    logger.info("Phase 0 complete.")
