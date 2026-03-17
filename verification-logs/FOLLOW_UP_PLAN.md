# Verification Follow-Up Plan

## Priority 1: Close Known Gaps

### 1a. Climate Scenario Verification
**What:** Compare Python climate scenario outputs against Excel scenario sheets.
**Why:** We only verified baseline. The climate module has independent logic (expenditure rigidity, GDP loss application) that could diverge.
**How:** Map rows 20 (primary expenditure) and 35 (debt-to-GDP) on scenario sheets (Paris, Moderate, High, Hot, Hot Adapted, Hot Unadapted). Compare for Uganda and Maldives at minimum.
**Effort:** ~30 min to add to Phase 3 script, ~30 min to run.

### 1b. Investigate Timeout Countries
**What:** Somalia, Zambia, Sri Lanka failed with Excel recalc errors.
**Why:** Need to know if these are workbook data issues or automation issues.
**How:**
1. Open Excel manually, select each country, see if it calculates
2. If it does, increase timeout to 180s and retry
3. If it doesn't, document as known Excel workbook issue
**Effort:** ~15 min manual + ~10 min script retry.

### 1c. Level Value Comparison
**What:** Compare nominal GDP, real GDP, and debt levels (not just ratios).
**Why:** Ratios can mask compensating errors in numerator/denominator.
**How:** Add Baseline calc sheet rows 7 (real GDP), 8 (nominal GDP), 35 (debt) to comparison. Run for Phase 1 countries (UGA, USA, MDV) at minimum.
**Effort:** ~20 min to modify Phase 1, ~10 min to run.

## Priority 2: Expand Coverage

### 2a. Full 175-Country Run
**What:** Run Phase 2 for all countries the engine supports.
**Why:** 28/175 is a good sample but not exhaustive. Edge cases hide in specific country data.
**How:** Replace hardcoded COUNTRIES dict with `get_country_list()` output. Budget ~3 hours.
**Effort:** ~10 min code change, ~3 hours runtime.

### 2b. Historical Period Comparison (2009-2029)
**What:** Verify WEO-period values match for all countries, not just Uganda.
**Why:** If parquet extraction diverges from Excel for any country, all projections for that country are built on wrong foundations.
**How:** Compare Output Baseline rows 61-67 for years 2009-2029 (columns C through W). These should match exactly since they're WEO input data.
**Effort:** ~15 min to modify, ~1 hour runtime (piggyback on full-country run).

### 2c. Debt Floor Asymmetry Test
**What:** Find countries where baseline debt approaches zero, verify max(0, debt) is applied in baseline but NOT in climate scenarios.
**Why:** CLAUDE.md Rule #3 — critical domain rule.
**How:** Filter results for countries with debt_to_gdp < 5% at any projection year. Compare baseline (should floor at 0) vs climate scenario (should allow negative).
**Effort:** ~30 min.

## Priority 3: Automation Improvements

### 3a. Eliminate "Grant Access" Dialog
**Options to investigate:**
1. Use `~/Documents/` or `~/Desktop/` for temp files (Excel may have blanket access)
2. Add Excel to Full Disk Access in System Settings
3. Use `open -a "Microsoft Excel" file.xlsx` to pre-open
4. Create a LaunchAgent that pre-authorizes the path

### 3b. Setup Script for Two-Computer Workflow
```bash
#!/bin/bash
# scripts/setup-verification-data.sh
# Run once on Mac Mini before verification

CANDIDATES=(
  "../QCraft-App"
  "../../QCraft-App"
  "$HOME/Projects/QCraft-App"
  "$HOME/Library/CloudStorage/Dropbox/Mac/Documents/QCraft-App"
)

for dir in "${CANDIDATES[@]}"; do
  if [ -f "$dir/source-materials/2024_IMF-FAD_Q-CRAFT-Tool-v10.xlsx" ]; then
    echo "Found data in $dir"
    mkdir -p source-materials data/processed
    cp "$dir/source-materials/"*.xlsx source-materials/
    cp "$dir/data/processed/"*.parquet data/processed/
    echo "Data copied successfully"
    exit 0
  fi
done

echo "ERROR: Could not find QCraft-App with data files"
exit 1
```

### 3c. Golden Master Expansion
**What:** Save verified Excel outputs as new golden master CSVs.
**Why:** CI can catch regressions without needing Excel. Currently only Uganda has a golden master.
**How:** After full-country verification, save Excel outputs for all PARITY_PASS countries to `tests/golden_masters/verified/`. Update test suite to load these.
**Effort:** ~1 hour to implement, significant long-term value.

### 3d. Checkpoint-Based Resume
Already implemented but could be improved:
- Save partial metric results (not just pass/fail) so timeout retries can compare against partial data
- Add a `--resume` flag to skip completed countries
- Add a `--country=USA` flag for single-country debugging

## Decision Matrix

| Task | Impact | Effort | Priority |
|------|--------|--------|----------|
| Climate scenario verification | High | Medium | P1 — before demo |
| Investigate timeout countries | Medium | Low | P1 — before demo |
| Level value comparison | Medium | Low | P1 — before demo |
| Full 175-country run | Medium | Low (3hr runtime) | P2 — overnight |
| Historical period comparison | Medium | Low | P2 — overnight |
| Debt floor asymmetry test | High | Medium | P2 — this week |
| Eliminate Grant Access dialog | Low | Medium | P3 — nice to have |
| Setup script | Low | Low | P3 — before next verification |
| Golden master expansion | High | Medium | P2 — after full run |
