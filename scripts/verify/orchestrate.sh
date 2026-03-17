#!/usr/bin/env bash
# Orchestrate all verification phases sequentially.
# Usage: bash scripts/verify/orchestrate.sh

set -euo pipefail

export PATH="$HOME/.local/bin:$PATH"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Q-CRAFT Parity Verification ==="
echo "Start: $(date)"
echo ""

echo "--- Phase 0: Workbook Discovery ---"
uv run python "$SCRIPT_DIR/phase0_discovery.py"
echo ""

echo "--- Phase 1: xlwings Smoke Test (3 countries) ---"
uv run python "$SCRIPT_DIR/phase1_smoke.py"
echo ""

echo "--- Phase 2: Breadth Test (30 countries) ---"
uv run python "$SCRIPT_DIR/phase2_breadth.py"
echo ""

echo "--- Phase 3: Input Sensitivity (5×5 combos) ---"
uv run python "$SCRIPT_DIR/phase3_sensitivity.py"
echo ""

echo "--- Phase 4: Report Generation ---"
uv run python "$SCRIPT_DIR/phase4_report.py"
echo ""

echo "=== Verification Complete ==="
echo "End: $(date)"
echo "Reports in verification-logs/"
