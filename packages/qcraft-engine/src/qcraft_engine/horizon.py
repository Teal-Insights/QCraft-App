"""Pure input coverage rules for the explicit rolling Current profile.

A usable horizon is the last contiguous complete macro/fiscal year from 2009.
Source rows beyond it remain in the payload. No financial value is fabricated.
"""

import math

from qcraft_engine.constants import CLIMATE_SCENARIOS, YEAR_END, YEAR_START

REQUIRED_MACRO = (
    "real_gdp", "nominal_gdp", "gdp_deflator", "revenue", "expenditure",
    "overall_balance", "primary_balance", "debt", "real_gdp_growth_percent",
    "nominal_gdp_growth_percent", "gdp_deflator_growth_percent", "primary_expenditure",
    "interest_expenditure", "total_expenditure", "revenue_percent_gdp",
    "primary_expenditure_percent_gdp", "primary_balance_percent_gdp",
    "overall_balance_percent_gdp", "interest_expenditure_percent_gdp", "debt_to_gdp",
)


def finite(value):
    return isinstance(value, (int, float)) and math.isfinite(value)


def resolve_horizon(payload):
    """Return timing and a precise reason for shorter or unsupported coverage."""
    iso = payload["iso3c"]
    macro = {r["years"]: r for r in payload["macrofiscal"] if r["iso3c"] == iso}
    source_end = max((y for y, r in macro.items()
                      if any(finite(r.get(k)) for k in REQUIRED_MACRO)), default=0)
    horizon = YEAR_START - 1
    reason = None
    for year in range(YEAR_START, source_end + 1):
        row = macro.get(year, {})
        missing = [k for k in REQUIRED_MACRO if not finite(row.get(k))]
        if not missing and not finite(row.get("interest_rate_percent")) and row["debt"] != 0:
            missing.append("interest_rate_percent")
        if missing:
            reason = f"Incomplete WEO inputs at {year}: {', '.join(missing)}."
            break
        if row["real_gdp"] <= 0 or row["nominal_gdp"] <= 0 or row["gdp_deflator"] <= 0:
            reason = f"Nonpositive GDP or deflator at {year}."
            break
        horizon = year
    unsupported = horizon < YEAR_START
    prod = {r["years"]: r["productivity_level"] for r in payload["productivity"]
            if r["iso3c"] == iso and finite(r.get("productivity_level")) and r["productivity_level"] > 0}
    wdi_end = min(max(prod, default=0), horizon)
    if not unsupported and any(y not in prod for y in range(YEAR_START - 1, wdi_end + 1)):
        reason = "The WDI history needed for consecutive productivity growth is incomplete."
        unsupported = True
    if not unsupported and wdi_end < YEAR_START - 1:
        reason = "No usable WDI history at the start of the calculation."
        unsupported = True
    if not unsupported:
        climate = {(r["climate_scenario"], r["years"]): r["gdp_loss_percent"]
                   for r in payload["climate"] if r["iso3c"] == iso}
        for scenario in CLIMATE_SCENARIOS:
            for year in range(horizon, YEAR_END + 1):
                loss = climate.get((scenario, year))
                if not finite(loss) or loss <= -100:
                    reason = f"No usable climate index for {scenario} at calendar year {year}."
                    unsupported = True
                    break
            if unsupported:
                break
    return {
        "sourceWeoMaxYear": source_end,
        "weoMaxYear": None if unsupported else horizon,
        "projectionStartYear": None if unsupported else horizon + 1,
        "climateStartYear": None if unsupported else horizon + 1,
        "climateAnchorYear": None if unsupported else horizon,
        "wdiLastYear": None if unsupported else wdi_end,
        "coverageStatus": "unsupported" if unsupported else ("shorter" if horizon < source_end else "full"),
        "coverageReason": reason,
    }
