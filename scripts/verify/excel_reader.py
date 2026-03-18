"""Shared Excel reading utilities for verification scripts.

The Q-CRAFT workbook uses a TRANSPOSED layout:
- Years are in COLUMNS (D=2009, E=2010, ..., col 94=2099)
- Metrics are in ROWS
- Row 2 contains the year values

Baseline sheet row map:
  Row 7:  Real GDP (Level)
  Row 8:  Nominal GDP (Level)
  Row 13: Real GDP growth (%)
  Row 15: Nominal GDP growth (%)
  Row 18: Revenue (% NGDP)
  Row 20: Interest expenditure (% NGDP)
  Row 21: Primary expenditure (% NGDP)
  Row 22: Primary balance (% NGDP)
  Row 23: Overall balance (% NGDP)
  Row 33: Weighted interest rate (%)
  Row 36: Debt-to-GDP (%)

Climate scenario sheet row map (Paris, Moderate, Hot, Hot Adapted, Hot Unadapted, High):
  Row 9:  Real GDP growth (%)
  Row 11: Nominal GDP growth (%)
  Row 13: Nominal GDP (Level)
  Row 14: Real GDP (Level)
  Row 17: Revenue (% NGDP)
  Row 19: Interest expenditure (% NGDP)
  Row 20: Primary expenditure (% NGDP)
  Row 21: Primary balance (% NGDP)
  Row 22: Overall balance (% NGDP)
  Row 32: Weighted interest rate (%)
  Row 35: Debt-to-GDP (%)

Dashboard input cells:
  C12: Country selector (full name)
  C17: Demography variant ("Medium"/"High"/"Low")
  C20: Productivity start (5.0)
  C21: Productivity end (1.2)
  C24: Inflation start (3.5)
  C25: Inflation end (3.5)
  C28: Interest rate mode ("Nominal interest rate"/
       "Interest-growth differential"/"Real interest rate")
  C29: Real interest rate if chosen (1.0)
  C33: Fiscal rule ("Yes"/"No")
  C34: Debt target (60.0)
  C38: Expenditure rigidity (0.0-1.0)
"""

import logging

logger = logging.getLogger(__name__)

# Column D = column 4 = year 2009, so year Y is at column (Y - 2009 + 4)
YEAR_START_COL = 4  # Column D
BASE_YEAR = 2009


def year_to_col(year):
    """Convert a year to its Excel column index."""
    return year - BASE_YEAR + YEAR_START_COL


def col_to_year(col):
    """Convert an Excel column index to its year."""
    return col - YEAR_START_COL + BASE_YEAR


# Baseline sheet row definitions
BASELINE_ROWS = {
    "real_gdp": 7,
    "nominal_gdp": 8,
    "real_gdp_growth_percent": 13,
    "nominal_gdp_growth_percent": 15,
    "revenue_percent_gdp": 18,
    "interest_expenditure_percent_gdp": 20,
    "primary_expenditure_percent_gdp": 21,
    "primary_balance_percent_gdp": 22,
    "overall_balance_percent_gdp": 23,
    "nominal_interest_rate": 33,
    "debt_to_gdp": 36,
}

# Climate scenario sheet row definitions
SCENARIO_ROWS = {
    "real_gdp_growth_percent": 9,
    "nominal_gdp_growth_percent": 11,
    "nominal_gdp": 13,
    "real_gdp": 14,
    "revenue_percent_gdp": 17,
    "interest_expenditure_percent_gdp": 19,
    "primary_expenditure_percent_gdp": 20,
    "primary_balance_percent_gdp": 21,
    "overall_balance_percent_gdp": 22,
    "nominal_interest_rate": 32,
    "debt_to_gdp": 35,
}

# Dashboard cell references
DASHBOARD_CELLS = {
    "country_selector": "C12",
    "demography_variant": "C17",
    "productivity_start": "C20",
    "productivity_end": "C21",
    "inflation_start": "C24",
    "inflation_end": "C25",
    "interest_rate_mode": "C28",
    "real_interest_rate": "C29",
    "fiscal_rule": "C33",
    "debt_target": "C34",
    "expenditure_rigidity": "C38",
}

# Climate scenario sheet names in Excel
SCENARIO_SHEET_NAMES = {
    "Paris": "Paris",
    "Moderate": "Moderate",
    "Hot": "Hot",
    "Hot_Adapted": "Hot Adapted",
    "Hot_Unadapted": "Hot Unadapted",
    "High": "High",
}


def read_baseline_series(ws, metrics=None, year_start=2030, year_end=2099):
    """Read time series from the Baseline sheet.

    Args:
        ws: xlwings sheet object for the Baseline sheet
        metrics: list of metric names to read (default: all)
        year_start: first year to read
        year_end: last year to read

    Returns:
        dict of {year: {metric: value}}
    """
    if metrics is None:
        metrics = list(BASELINE_ROWS.keys())

    data = {}
    for year in range(year_start, year_end + 1):
        col = year_to_col(year)
        row_data = {}
        for metric in metrics:
            row = BASELINE_ROWS.get(metric)
            if row is None:
                continue
            val = ws.range((row, col)).value
            row_data[metric] = val
        data[year] = row_data

    return data


def read_scenario_series(ws, metrics=None, year_start=2030, year_end=2099):
    """Read time series from a climate scenario sheet.

    Same interface as read_baseline_series but uses SCENARIO_ROWS.
    """
    if metrics is None:
        metrics = list(SCENARIO_ROWS.keys())

    data = {}
    for year in range(year_start, year_end + 1):
        col = year_to_col(year)
        row_data = {}
        for metric in metrics:
            row = SCENARIO_ROWS.get(metric)
            if row is None:
                continue
            val = ws.range((row, col)).value
            row_data[metric] = val
        data[year] = row_data

    return data


def set_all_dashboard_params(ws_dashboard, params):
    """Set all dashboard input cells from a params dict.

    params keys should match DASHBOARD_CELLS keys (or engine param names).
    """
    # Map engine param names to dashboard cell names
    param_to_cell = {
        "debt_target": "debt_target",
        "fiscal_rule": "fiscal_rule",
        "expenditure_rigidity": "expenditure_rigidity",
        "interest_rate_mode": "interest_rate_mode",
        "inflation_start": "inflation_start",
        "inflation_end": "inflation_end",
        "productivity_start": "productivity_start",
        "productivity_end": "productivity_end",
        "demography_variant": "demography_variant",
    }

    for param_key, cell_key in param_to_cell.items():
        if param_key in params and cell_key in DASHBOARD_CELLS:
            cell_ref = DASHBOARD_CELLS[cell_key]
            val = params[param_key]
            ws_dashboard[cell_ref].value = val
            logger.debug(f"Set {cell_ref} ({param_key}) = {val}")


def is_valid_numeric(val):
    """Check if a value is a valid number (not None, not bool, not error string)."""
    if val is None:
        return False
    if isinstance(val, bool):
        return False
    if isinstance(val, str):
        return False  # Catches #VALUE!, #REF!, #N/A etc.
    return isinstance(val, (int, float))


def classify_parity(diff):
    """Classify a parity difference into PASS/REVIEW/FAIL."""
    if diff <= 0.1:
        return "PARITY_PASS"
    elif diff <= 0.5:
        return "PARITY_REVIEW"
    else:
        return "PARITY_FAIL"
