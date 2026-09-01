#!/usr/bin/env bash
# Full cross-engine completeness sweep: every selectable country, both vintages,
# baseline plus all six climate scenarios, through the real engine path on both
# sides, with the outcomes compared.
#
#   bash scripts/sweep/sweep_all.sh [outdir]
#
# `run_pipeline` returns one frame per climate scenario, so a single call per
# country covers the baseline and all six scenarios.
set -euo pipefail
OUT="${1:-verification-logs/sweep}"
mkdir -p "$OUT"
for V in weo-2024-10 weo-2026-04; do
  echo "=== $V ==="
  ALL=$(uv run --package qcraft-engine python -c "
from pathlib import Path
from qcraft_engine.data_loader import get_country_list, load_parquet_data
d = load_parquet_data(Path('data/vintages/$V'))
print(' '.join(c['iso3c'] for c in get_country_list(d)))")
  rm -rf "$OUT/py-$V" "$OUT/ts-$V"
  # shellcheck disable=SC2086
  uv run --package qcraft-engine python scripts/differential/run_python.py $ALL \
    --data-dir "data/vintages/$V" --out "$OUT/py-$V" | tail -3
  npx vite-node scripts/differential/run_ts.ts -- --all \
    --in "data/vintages/$V/json" --out "$OUT/ts-$V" | tail -3
  uv run python scripts/differential/compare.py \
    --python-dir "$OUT/py-$V" --ts-dir "$OUT/ts-$V" --label "$V, all selectable" \
    > "$OUT/compare-$V.txt" || true
  tail -6 "$OUT/compare-$V.txt"
done
echo
echo "Full reports: $OUT/compare-*.txt"
