#!/usr/bin/env bash
# Orchestrator for Q-CRAFT Verification V2
# Runs all 5 phases sequentially. Overnight run (~3-4 hours).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
UV="${HOME}/.local/bin/uv"

echo "=== Q-CRAFT Verification V2 ==="
echo "Start: $(date)"
echo "Project: $PROJECT_ROOT"
echo ""

cd "$PROJECT_ROOT"

# Kill any lingering Excel
killall 'Microsoft Excel' 2>/dev/null || true
sleep 2

echo "=== Phase 0: Discovery ==="
$UV run python scripts/verify/phase0_discovery.py
echo "Phase 0 complete: $(date)"
echo ""

echo "=== Phase 1: Smoke Test (3 countries) ==="
$UV run python scripts/verify/phase1_smoke.py
echo "Phase 1 complete: $(date)"
echo ""

echo "=== Phase 2: Breadth Test (ALL countries) ==="
$UV run python scripts/verify/phase2_breadth.py
echo "Phase 2 complete: $(date)"
echo ""

echo "=== Phase 3: Sensitivity (5 × 5 + climate) ==="
$UV run python scripts/verify/phase3_sensitivity.py
echo "Phase 3 complete: $(date)"
echo ""

echo "=== Phase 4: Report Generation ==="
$UV run python scripts/verify/phase4_report.py
echo "Phase 4 complete: $(date)"
echo ""

# Kill Excel when done
killall 'Microsoft Excel' 2>/dev/null || true

echo "=== All phases complete ==="
echo "End: $(date)"
echo "Results in: $PROJECT_ROOT/verification-logs/"
echo ""
echo "Files generated:"
ls -la "$PROJECT_ROOT/verification-logs/"*.md "$PROJECT_ROOT/verification-logs/"*.csv "$PROJECT_ROOT/verification-logs/"*.json 2>/dev/null || true
