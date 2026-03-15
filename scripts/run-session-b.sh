#!/bin/bash
set -euo pipefail

# Q-CRAFT Session B Orchestrator
# Usage: ./scripts/run-session-b.sh [--cli codex]

CLI="claude"
CLI_FLAGS="--dangerously-skip-permissions"
CODEX_PREAMBLE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --cli)
            CLI="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

if [[ "$CLI" == "codex" ]]; then
    CLI_FLAGS="--full-auto"
    CODEX_PREAMBLE="IMPORTANT ENFORCEMENT RULES (no hooks available in Codex):
1. NEVER commit directly to main. Always use feat/ branches.
2. ALWAYS create .plans/<MODULE>.md BEFORE writing any Python code.
3. NEVER modify SPEC.md, AGENTS.md, TASKS.md, golden masters, or CI files.
4. Use explicit Python for-loops for fiscal recursion — NEVER Polars vectorization.
5. Read AGENTS.md before starting implementation.
---
"
fi

echo "=== Q-CRAFT Session B ==="
echo "CLI: $CLI"
echo "Started: $(date)"

# Lock source of truth
chmod 444 AGENTS.md CLAUDE.md 2>/dev/null || true
if [[ -f planning/SPEC.md ]]; then chmod 444 planning/SPEC.md; fi

# Tag pre-session state
git tag -f pre-session-b

MODULES=("demography" "productivity" "inflation" "baseline_v1" "interest_rate" "fiscal" "climate")
ISSUES=(1 2 3 4 5 6 7)
RESULTS=()
PROMPT_TEMPLATE=$(cat scripts/prompts/engine-function-prompt.md)

for i in "${!MODULES[@]}"; do
    MODULE="${MODULES[$i]}"
    ISSUE="${ISSUES[$i]}"
    BRANCH="feat/${MODULE}"

    echo ""
    echo "━━━ [$((i+1))/7] $MODULE (issue #$ISSUE) ━━━"
    echo "Started: $(date)"

    # Fresh checkout from main
    git checkout main
    git pull origin main 2>/dev/null || true
    git checkout -b "$BRANCH" 2>/dev/null || git checkout "$BRANCH"

    # Build prompt with module substitution
    PROMPT=$(echo "$PROMPT_TEMPLATE" | sed "s/<MODULE_NAME>/${MODULE}/g; s/<ISSUE_NUMBER>/${ISSUE}/g")
    PROMPT="${CODEX_PREAMBLE}${PROMPT}"

    # Run agent with 45-min timeout
    RESULT="success"
    if ! timeout 2700 $CLI $CLI_FLAGS -p "$PROMPT"; then
        RESULT="timeout_or_error"
    fi

    # Post-invocation guardrail: revert any source-of-truth modifications
    for PROTECTED in AGENTS.md CLAUDE.md planning/SPEC.md; do
        if [[ -f "$PROTECTED" ]] && ! git diff --quiet "$PROTECTED" 2>/dev/null; then
            echo "GUARDRAIL: Reverting unauthorized change to $PROTECTED"
            git checkout -- "$PROTECTED"
        fi
    done
    for GM in $(git diff --name-only -- tests/golden_masters/ 2>/dev/null); do
        echo "GUARDRAIL: Reverting unauthorized change to $GM"
        git checkout -- "$GM"
    done

    # Check test results
    if uv run pytest packages/qcraft-engine/tests/ -x -q 2>/dev/null; then
        TEST_STATUS="pass"
    else
        TEST_STATUS="fail"
    fi

    # Push and create PR
    git push -u origin "$BRANCH" 2>/dev/null || true

    if [[ "$TEST_STATUS" == "pass" && "$RESULT" == "success" ]]; then
        PR_TYPE=""
        RESULTS+=("$MODULE: ✅ PASS")
    else
        PR_TYPE="--draft"
        RESULTS+=("$MODULE: ⚠️ $RESULT (tests: $TEST_STATUS)")
    fi

    gh pr create --title "feat: implement $MODULE (issue #$ISSUE)" \
        --body "Automated Session B implementation of $MODULE.

Test status: $TEST_STATUS
Agent result: $RESULT" \
        $PR_TYPE 2>/dev/null || true

    # Auto-merge if clean
    if [[ "$TEST_STATUS" == "pass" && "$RESULT" == "success" ]]; then
        echo "Waiting for CI..."
        sleep 60
        gh pr merge --auto --squash 2>/dev/null || true
    fi

    echo "Finished $MODULE: $RESULT (tests: $TEST_STATUS)"
done

# Unlock source of truth
chmod 644 AGENTS.md CLAUDE.md 2>/dev/null || true
if [[ -f planning/SPEC.md ]]; then chmod 644 planning/SPEC.md; fi

# Generate morning report
echo "Generating morning report..."
mkdir -p overnight
cat > overnight/MORNING-REPORT.md << REPORT
# Morning Report — Session B
Generated: $(date)

## Results

$(for r in "${RESULTS[@]}"; do echo "- $r"; done)

## PR Status
$(gh pr list --json number,title,state,isDraft --template '{{range .}}#{{.number}} {{.title}} ({{if .isDraft}}draft{{else}}{{.state}}{{end}})
{{end}}')

## Next Steps
- Review any draft PRs (these had issues)
- Check .blocked/ for blocker reports
- Check .change-requests/ for spec disagreements
- Run: uv run pytest packages/qcraft-engine/tests/ -v
REPORT

echo ""
echo "=== Session B Complete ==="
echo "See overnight/MORNING-REPORT.md"
