"""Companion guide URLs and app constants.

The companion guide at the site root is the course book (Module 0 to Module 6
plus appendices) since September 2026. The current Explorer lives under
/explorer/ on the same site; this Shiny app is the March 2026 prototype.
"""

GUIDE_BASE = "https://teal-insights.github.io/QCraft-App"
EXPLORER_URL = f"{GUIDE_BASE}/explorer/"

GUIDE_URLS = {
    "home": f"{GUIDE_BASE}/",
    "policy": f"{GUIDE_BASE}/m1-how-qcraft-thinks.html",
    "using": f"{GUIDE_BASE}/m3-parameters.html",
    "codesign": f"{GUIDE_BASE}/appendix-codesign.html",
    "methodology": f"{GUIDE_BASE}/m2-debt-equation.html",
    # Parameters (Module 3)
    "param_country": f"{GUIDE_BASE}/m3-parameters.html#sec-m3-country",
    "param_demography": f"{GUIDE_BASE}/m3-parameters.html#sec-m3-demography",
    "param_debt_target": f"{GUIDE_BASE}/m3-parameters.html#sec-m3-target",
    "param_fiscal_rule": f"{GUIDE_BASE}/m3-parameters.html#sec-m3-rule",
    "param_rigidity": f"{GUIDE_BASE}/m3-parameters.html#sec-m3-rigidity",
    # Tab interpretation (Module 4)
    "tab_baseline": f"{GUIDE_BASE}/m4-worked-example.html#sec-m4-baseline",
    "tab_climate": f"{GUIDE_BASE}/m4-worked-example.html#sec-m4-climate",
    "tab_analysis": f"{GUIDE_BASE}/m4-worked-example.html#sec-m4-analysis",
    "tab_data": f"{GUIDE_BASE}/m4-worked-example.html#sec-m4-export",
    "interpreting": f"{GUIDE_BASE}/m4-worked-example.html",
}

GITHUB_URL = "https://github.com/Teal-Insights/QCraft-App"
FEEDBACK_EMAIL = "mailto:lte@tealinsights.com?subject=Q-CRAFT%20Explorer%20Feedback"
