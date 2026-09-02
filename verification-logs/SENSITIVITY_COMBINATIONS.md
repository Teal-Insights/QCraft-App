# The 25 parameter sensitivity combinations, and the 30 climate-scenario runs

README.md and verification-logs/PARITY_REPORT.md cite "25 parameter sensitivity
combinations" without listing them. They are defined in
`scripts/verify/phase3_sensitivity.py` (5 countries x 5 parameter sets) and their
results are in `phase3_checkpoint.json`, run 2026-03-18T02:58:48 against the IMF
Q-CRAFT workbook v1.0 (11-15-2024) through xlwings. This file publishes both so the
claim can be checked without reading the script. Published by CC-26 (audit A, F7).

Every combination not listed here (any Dashboard value other than these) had no
Excel comparison until the `excel_edges/` golden masters were added in the same lane:
see `packages/qcraft-engine/tests/golden_masters/excel_edges/README.md`.

## Countries

| ISO3 | Country |
|---|---|
| UGA | Uganda |
| KEN | Kenya |
| MDV | Maldives |
| BRA | Brazil |
| JPN | Japan |

## Parameter sets (baseline comparison, 2030 to 2099)

All five sets hold demography Medium, productivity 5.0 to 1.2, inflation 3.5 to 3.5
(the workbook's shipped Dashboard values). Metrics: debt-to-GDP, revenue, primary
expenditure and primary balance (all percent of GDP), nominal GDP, real GDP growth and
the nominal interest rate. PARITY_PASS means the worst absolute ratio difference over
the 70 years is at most 0.1 percentage points; every one below is 0.0.

| Label | Debt target | Fiscal rule | Rigidity | Interest-rate mode |
|---|---|---|---|---|
| default | 60 | Yes | 1.0 | Nominal interest rate |
| no_rule | 60 | No | 1.0 | Nominal interest rate |
| low_target_debt_only | 30 | Yes | 1.0 | Nominal interest rate |
| flexible_high_target | 70 | Yes | 0.0 | Nominal interest rate |
| igd_mode | 60 | Yes | 1.0 | Interest-growth differential |

## Results, 25 baseline runs

| Country | Parameter set | Status | Worst diff (pp) | Worst metric | Year |
|---|---|---|---|---|---|
| Uganda | default | PARITY_PASS | 0.0 | debt_to_gdp | 2099 |
| Uganda | no_rule | PARITY_PASS | 0.0 | debt_to_gdp | 2040 |
| Uganda | low_target_debt_only | PARITY_PASS | 0.0 | debt_to_gdp | 2079 |
| Uganda | flexible_high_target | PARITY_PASS | 0.0 | debt_to_gdp | 2099 |
| Uganda | igd_mode | PARITY_PASS | 0.0 | debt_to_gdp | 2086 |
| Kenya | default | PARITY_PASS | 0.0 | debt_to_gdp | 2086 |
| Kenya | no_rule | PARITY_PASS | 0.0 | debt_to_gdp | 2041 |
| Kenya | low_target_debt_only | PARITY_PASS | 0.0 | debt_to_gdp | 2095 |
| Kenya | flexible_high_target | PARITY_PASS | 0.0 | debt_to_gdp | 2095 |
| Kenya | igd_mode | PARITY_PASS | 0.0 | debt_to_gdp | 2084 |
| Maldives | default | PARITY_PASS | 0.0 | debt_to_gdp | 2099 |
| Maldives | no_rule | PARITY_PASS | 0.0 | debt_to_gdp | 2098 |
| Maldives | low_target_debt_only | PARITY_PASS | 0.0 | debt_to_gdp | 2093 |
| Maldives | flexible_high_target | PARITY_PASS | 0.0 | debt_to_gdp | 2086 |
| Maldives | igd_mode | PARITY_PASS | 0.0 | debt_to_gdp | 2087 |
| Brazil | default | PARITY_PASS | 0.0 | debt_to_gdp | 2099 |
| Brazil | no_rule | PARITY_PASS | 0.0 | debt_to_gdp | 2098 |
| Brazil | low_target_debt_only | PARITY_PASS | 0.0 | debt_to_gdp | 2099 |
| Brazil | flexible_high_target | PARITY_PASS | 0.0 | debt_to_gdp | 2099 |
| Brazil | igd_mode | PARITY_PASS | 0.0 | debt_to_gdp | 2070 |
| Japan | default | PARITY_PASS | 0.0 | debt_to_gdp | 2099 |
| Japan | no_rule | PARITY_PASS | 0.0 | debt_to_gdp | 2095 |
| Japan | low_target_debt_only | PARITY_PASS | 0.0 | debt_to_gdp | 2099 |
| Japan | flexible_high_target | PARITY_PASS | 0.0 | debt_to_gdp | 2099 |
| Japan | igd_mode | PARITY_PASS | 0.0 | debt_to_gdp | 2099 |

## Results, 30 climate-scenario runs (Excel defaults)

The phase 3 script compared nominal GDP with an absolute threshold, which a level in
local currency billions cannot meet, so every scenario reads PARITY_FAIL on that
metric alone. The ratio metrics for the same runs passed, which is the basis of the
Verified badge's "climate-scenario parity confirmed for ratio metrics only". The
`excel_edges/` golden masters compare levels at 1e-9 relative instead.

| Country | Scenario | Status | Worst diff | Worst metric | Year |
|---|---|---|---|---|---|
| Uganda | Paris | PARITY_FAIL | 675.038008 | nominal_gdp | 2099 |
| Uganda | Moderate | PARITY_FAIL | 0.5217 | nominal_gdp | 2099 |
| Uganda | Hot | PARITY_FAIL | 34614.034454 | nominal_gdp | 2099 |
| Uganda | Hot_Adapted | PARITY_FAIL | 10867.645738 | nominal_gdp | 2099 |
| Uganda | Hot_Unadapted | PARITY_FAIL | 93160.804195 | nominal_gdp | 2099 |
| Uganda | High | PARITY_FAIL | 7453.603168 | nominal_gdp | 2099 |
| Kenya | Paris | PARITY_FAIL | 19.729329 | nominal_gdp | 2099 |
| Kenya | Moderate | PARITY_PASS | 0.33772 | nominal_gdp | 2099 |
| Kenya | Hot | PARITY_FAIL | 1706.329006 | nominal_gdp | 2099 |
| Kenya | Hot_Adapted | PARITY_FAIL | 526.699153 | nominal_gdp | 2099 |
| Kenya | Hot_Unadapted | PARITY_FAIL | 4679.592522 | nominal_gdp | 2099 |
| Kenya | High | PARITY_FAIL | 363.735433 | nominal_gdp | 2099 |
| Maldives | Paris | PARITY_PASS | 0.0 | debt_to_gdp | 2084 |
| Maldives | Moderate | PARITY_PASS | 0.0 | debt_to_gdp | 2084 |
| Maldives | Hot | PARITY_PASS | 0.0 | debt_to_gdp | 2084 |
| Maldives | Hot_Adapted | PARITY_PASS | 0.0 | debt_to_gdp | 2084 |
| Maldives | Hot_Unadapted | PARITY_PASS | 0.0 | debt_to_gdp | 2084 |
| Maldives | High | PARITY_PASS | 0.0 | debt_to_gdp | 2084 |
| Brazil | Paris | PARITY_FAIL | 3.016346 | nominal_gdp | 2099 |
| Brazil | Moderate | PARITY_FAIL | 25.04443 | nominal_gdp | 2099 |
| Brazil | Hot | PARITY_FAIL | 761.202793 | nominal_gdp | 2099 |
| Brazil | Hot_Adapted | PARITY_FAIL | 269.530702 | nominal_gdp | 2099 |
| Brazil | Hot_Unadapted | PARITY_FAIL | 1930.232511 | nominal_gdp | 2099 |
| Brazil | High | PARITY_FAIL | 258.957892 | nominal_gdp | 2099 |
| Japan | Paris | PARITY_FAIL | 2.857263 | nominal_gdp | 2099 |
| Japan | Moderate | PARITY_FAIL | 929.726807 | nominal_gdp | 2099 |
| Japan | Hot | PARITY_FAIL | 23657.001517 | nominal_gdp | 2099 |
| Japan | Hot_Adapted | PARITY_FAIL | 7057.926836 | nominal_gdp | 2099 |
| Japan | Hot_Unadapted | PARITY_FAIL | 68358.020795 | nominal_gdp | 2099 |
| Japan | High | PARITY_FAIL | 6917.254582 | nominal_gdp | 2099 |
