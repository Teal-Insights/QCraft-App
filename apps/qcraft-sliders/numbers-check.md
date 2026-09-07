# numbers-check: Uganda, Current mode, shared teaching settings

Engine: @qcraft/engine (packages/qcraft-engine-ts at app source a6313ad7), run under Node v22.22.2.
Input: payloads/weo-2026-04-full-horizon-v1/UGA.json, inputSha256 4bc907945f72646fe71dadc4a420cf5e1ac24e2a810a7d2421b336f6fce961fc.
Policy: current-full-weo-v1; revision weo-2026-04-full-horizon-v1; WEO through 2031; projection and climate from 2032; coverage full.

Settings: demography_variant=Medium, productivity_start=5, productivity_end=1.2, productivity_turning_point=15, inflation_start=5, inflation_end=3.5, interest_rate_mode=Nominal interest rate, long_run_interest_rate=1, debt_target=50, fiscal_rule=Yes, expenditure_rigidity=1

Debt-to-GDP, percent of GDP:

| Run | 2031 | 2050 | 2099 |
|---|---:|---:|---:|
| Baseline (no climate shock) | 53.29 | 50.73 | 52.72 |
| Hot, rigidity 1.0 (shared) | 53.29 | 52.91 | 127.77 |
| Hot, rigidity 0.0 | 53.29 | 51.23 | 62.16 |

Hot minus Baseline: 2.18 points at 2050, 75.05 points at 2099.
Hot rigidity 1.0 minus rigidity 0.0: 1.68 points at 2050, 65.61 points at 2099.

All six scenarios at 2099, shared settings:

- Paris: 39.79
- Moderate: 53.00
- High: 85.89
- Hot_Adapted: 92.47
- Hot: 127.77
- Hot_Unadapted: 180.53

Generated 2026-09-06T23:46:38.692Z.
