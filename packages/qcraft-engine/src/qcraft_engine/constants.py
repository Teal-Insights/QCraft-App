"""Q-CRAFT constants — scenario definitions, colors, defaults."""

YEAR_START = 2009
YEAR_END = 2099
PROJ_START = 2030  # First year after WEO horizon

CLIMATE_SCENARIOS = [
    "Paris",
    "Moderate",
    "Hot",
    "Hot_Adapted",
    "Hot_Unadapted",
    "High",
]

# The IMF User Guide's names (Tim and Rahman, 2024, section II.C). No
# temperature suffixes: the guide gives none except "below 2°C" for Paris, and
# Hot is the 90th percentile of the same SSP3-7.0 models whose median is High.
SCENARIO_LABELS = {
    "Paris": "Paris",
    "Moderate": "Moderate",
    "Hot": "Hot",
    "Hot_Adapted": "Hot adapted",
    "Hot_Unadapted": "Hot unadapted",
    "High": "High",
}

COLORS = {
    "baseline": "#2C3E50",
    "Paris": "#27AE60",
    "Moderate": "#3498DB",
    "Hot": "#E67E22",
    "Hot_Adapted": "#9B59B6",
    "Hot_Unadapted": "#E74C3C",
    "High": "#C0392B",
    "accent": "#1ABC9C",
    "muted": "#BDC3C7",
    "background": "#FAFBFC",
}

DEFAULTS = {
    "iso3c": "UGA",
    "demography_variant": "Medium",
    "productivity_start": 5.0,
    "productivity_end": 1.2,
    "inflation_start": 5.0,
    "inflation_end": 3.5,
    "interest_rate_mode": "Nominal interest rate",
    # Dashboard!C29: used only under "Real interest rate". The workbook ships 1.
    "long_run_interest_rate": 1.0,
    # Productivity!J21: timing parameter in years after the WEO boundary.
    # Higher values shift the transition later; adjustable per guide footnote 7.
    "productivity_turning_point": 15,
    "debt_target": 50.0,
    "fiscal_rule": "Yes",
    "expenditure_rigidity": 1.0,
}
