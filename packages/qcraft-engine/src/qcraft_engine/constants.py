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

SCENARIO_LABELS = {
    "Paris": "Paris-Aligned (1.5°C)",
    "Moderate": "Moderate (2°C)",
    "Hot": "Hot (3°C)",
    "Hot_Adapted": "Hot + Adapted",
    "Hot_Unadapted": "Hot + Unadapted",
    "High": "High (4°C+)",
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
    "debt_target": 50.0,
    "fiscal_rule": "Yes",
    "expenditure_rigidity": 1.0,
}
