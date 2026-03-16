#!/usr/bin/env bash
# Install pre-commit hook for QCraft-App
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_DIR="$(git rev-parse --git-path hooks)"
HOOK_PATH="$HOOKS_DIR/pre-commit"

cat > "$HOOK_PATH" << 'HOOK'
#!/usr/bin/env bash
set -euo pipefail

# Check if any staged Python files exist (without null delimiters — just for the test)
if ! git diff --cached --name-only --diff-filter=ACMR | grep -q '\.py$'; then
    exit 0
fi

echo "==> Running ruff check --fix on staged Python files..."
git diff --cached --name-only -z --diff-filter=ACMR | grep -z '\.py$' | xargs -0 uv run ruff check --fix
git diff --cached --name-only -z --diff-filter=ACMR | grep -z '\.py$' | xargs -0 git add

echo "==> Running ruff format on staged Python files..."
git diff --cached --name-only -z --diff-filter=ACMR | grep -z '\.py$' | xargs -0 uv run ruff format
git diff --cached --name-only -z --diff-filter=ACMR | grep -z '\.py$' | xargs -0 git add

echo "==> Running pyright..."
uv run pyright
echo "==> All pre-commit checks passed."
HOOK

chmod +x "$HOOK_PATH"
echo "Pre-commit hook installed at $HOOK_PATH"
