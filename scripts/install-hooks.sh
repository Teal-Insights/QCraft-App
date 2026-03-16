#!/usr/bin/env bash
# Install pre-commit hook for QCraft-App
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_DIR="$(git rev-parse --git-path hooks)"
HOOK_PATH="$HOOKS_DIR/pre-commit"

cat > "$HOOK_PATH" << 'HOOK'
#!/usr/bin/env bash
set -euo pipefail

# Get staged Python files (null-delimited for safety with special chars)
STAGED_PY=$(git diff --cached --name-only -z --diff-filter=ACMR | grep -z '\.py$' || true)

if [ -z "$STAGED_PY" ]; then
    exit 0
fi

echo "==> Running ruff check --fix on staged Python files..."
echo "$STAGED_PY" | xargs -0 uv run ruff check --fix
echo "$STAGED_PY" | xargs -0 git add

echo "==> Running ruff format on staged Python files..."
echo "$STAGED_PY" | xargs -0 uv run ruff format
echo "$STAGED_PY" | xargs -0 git add

echo "==> Running pyright..."
uv run pyright
echo "==> All pre-commit checks passed."
HOOK

chmod +x "$HOOK_PATH"
echo "Pre-commit hook installed at $HOOK_PATH"
