#!/usr/bin/env bash
# Install pre-commit hook for QCraft-App
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOK_PATH="$REPO_ROOT/.git/hooks/pre-commit"

cat > "$HOOK_PATH" << 'HOOK'
#!/usr/bin/env bash
set -euo pipefail

# Get staged Python files
STAGED_PY=$(git diff --cached --name-only --diff-filter=ACM | grep '\.py$' || true)

if [ -z "$STAGED_PY" ]; then
    exit 0
fi

echo "==> Running ruff check --fix on staged Python files..."
echo "$STAGED_PY" | xargs uv run ruff check --fix
echo "$STAGED_PY" | xargs git add

echo "==> Running ruff format on staged Python files..."
echo "$STAGED_PY" | xargs uv run ruff format
echo "$STAGED_PY" | xargs git add

echo "==> Running pyright on qcraft-engine..."
uv run pyright packages/qcraft-engine/
echo "==> All pre-commit checks passed."
HOOK

chmod +x "$HOOK_PATH"
echo "Pre-commit hook installed at $HOOK_PATH"
