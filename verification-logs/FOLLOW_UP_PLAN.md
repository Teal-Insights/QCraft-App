# Follow-Up Plan — Post V2

Generated: 2026-03-18

## Completed in V2

- [x] Apply 9 fixes from PR #42 bot reviews
- [x] Run all 175 countries from get_country_list() (147 passed, 15 timeout, 13 engine error)
- [x] Add climate scenario comparison for 5 representative countries × 6 scenarios
- [x] Compare level values (nominal GDP, interest rates) not just ratios
- [x] Add retry logic for timeout countries (2 retries with Excel restart)
- [x] Use safe folder path to eliminate macOS sandbox dialog
- [x] Save verified outputs as potential golden masters (147 CSVs in golden-masters/)
- [x] Fix interest_rate_mode param key (was select_rate)
- [x] Fix golden master path (packages/qcraft-engine/tests/...)
- [x] Fix logger scope (module-level)
- [x] Fix Dashboard cell mapping (C17=demography, C34=debt_target)
- [x] Set expenditure_rigidity in Excel (C38)
- [x] Add debt floor asymmetry test
- [x] Use EXCEL_SELECTION_ERROR consistently
- [x] Discover transposed sheet layout (years in columns, metrics in rows)

## V2 Results Summary

- **Baseline parity: 147/147 PASS at 0.0pp** — perfect
- **Sensitivity (5×5): 25/25 PASS at 0.0pp** — all param combos match
- **Climate ratio metrics: PASS** — debt_to_gdp, revenue%, expenditure% all match
- **Climate nominal_gdp: large absolute diffs** — needs relative tolerance, not pp threshold
- 15 TIMEOUT, 13 PYTHON_ERROR, 23 ENGINE_DATA_GAP

## Still Needed

- [ ] Investigate 13 PYTHON_ERROR countries (ARM, BFA, BGD, BLR, DJI, HKG, KAZ, MNG, MRT, PRI, SRB, TGO, TLS)
- [ ] Retry 15 TIMEOUT countries with longer timeout or different approach
- [ ] Fix climate scenario comparison: use relative tolerance for nominal_gdp (e.g., ±0.1%)
- [ ] Investigate climate nominal_gdp divergence — may be real calculation diff in calc_climate_scenario()
- [ ] Promote verified golden masters (147 CSVs) to CI test suite
- [ ] Compare expenditure rigidity effects: 0.0 vs 1.0 in climate scenarios
- [ ] Add WEO period (2023-2029) exact-match test for all countries
- [ ] Automate verification as CI job (needs Excel on runner or pre-extracted reference data)

## Known Limitations

- Excel recalc is non-deterministic — first country after startup often times out
- ENGINE_DATA_GAP countries (23) cannot be verified without adding missing parquet data
- Climate scenario comparison uses absolute diff for nominal_gdp — should use relative
- Inflation defaults differ (Excel=3.5%, Python=5.0%) — set explicitly in all tests
- Dashboard cell C17 is demography variant, not debt_target (C34) — prompt mapping was wrong
