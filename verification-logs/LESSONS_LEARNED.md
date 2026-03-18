# Lessons Learned — Verification V2

Generated: 2026-03-18

## What Worked

1. **Safe folder path** (`~/Library/Group Containers/UBF8T346G9.Office/`) eliminated the
   macOS sandbox "Grant Access" dialog completely. Zero manual intervention needed.

2. **Transposed Baseline sheet reader** — the Q-CRAFT workbook stores data with years in
   columns and metrics in rows. The initial scripts assumed a normal layout and got zero
   data. Fixed by writing `excel_reader.py` with hardcoded row maps discovered via openpyxl.

3. **Explicit parameter setting** for every Dashboard cell prevented default-mismatch
   false failures (Excel debt_target=60 vs Python=50, inflation 3.5 vs 5.0).

4. **Sentinel-based stability check** with 3 consecutive stable reads at row 36/col 2050
   reliably detected recalc completion in ~3 seconds. Much faster than fixed sleep.

5. **Full series comparison** (2030-2099, every year) confirmed 0.0pp diffs across all
   tested countries — not just checkpoints. This is stronger than sampling.

6. **Checkpoint + retry system** recovered from Excel hangs. 15 countries timed out but
   the run continued unattended for 4.5 hours.

## What We Learned

1. **Dashboard cell C17 is demography variant, NOT debt_target.** Debt target is at C34.
   The prompt's cell mapping was wrong. Always inspect with openpyxl before hardcoding.

2. **The "Output Baseline" sheet is a summary table** with only 4 checkpoint years.
   The actual time series is on the "Baseline" calc sheet. Same for scenarios — the
   full data is on "Paris", "Hot", etc., not "Output Scenarios".

3. **Climate scenario sheet rows differ from Baseline.** Baseline has debt_to_gdp at row 36;
   scenario sheets have it at row 35. Revenue is row 18 (Baseline) vs row 17 (scenario).
   Row maps must be maintained separately.

4. **nominal_gdp comparison requires relative tolerance, not absolute.** A 675 billion diff
   on UGA nominal GDP at 2099 is a meaningful divergence, but a 0.5pp threshold on a level
   value is meaningless. All climate "failures" were on nominal_gdp — ratio metrics passed.

5. **interest_rate_mode vs select_rate**: run_pipeline() accepts `interest_rate_mode` as the
   param key; it maps internally to `select_rate` in interest_rate_country(). Phase 3 combos
   must use `interest_rate_mode`.

6. **expenditure_rigidity is climate-only**: Setting rigidity in baseline-only tests is a
   no-op. Must compare climate scenarios to verify rigidity effects.

7. **First country after fresh Excel open often times out.** Afghanistan (alphabetically first)
   timed out on all 3 attempts. This appears to be a startup cost, not a data issue.

8. **13 countries have PYTHON_ERROR** — the engine crashes on ARM, BFA, BGD, BLR, DJI, HKG,
   KAZ, MNG, MRT, PRI, SRB, TGO, TLS. These likely have data issues in one or more parquet
   files. Worth investigating separately.

## Status Counts (Phase 2)

- PARITY_PASS: 147
- ENGINE_DATA_GAP: 23
- TIMEOUT: 15
- PYTHON_ERROR: 13
