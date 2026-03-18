#!/usr/bin/env bash
# Build a flat deployment bundle and deploy to shinyapps.io.
# Usage: bash scripts/deploy.sh
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUNDLE="$PROJECT_ROOT/deploy-bundle"
RSCONNECT="$HOME/Library/Python/3.13/bin/rsconnect"

echo "=== Building deployment bundle ==="
# Preserve rsconnect metadata across rebuilds
RSCONNECT_META=""
if [ -d "$BUNDLE/rsconnect-python" ]; then
    RSCONNECT_META="$(mktemp -d)"
    cp -r "$BUNDLE/rsconnect-python" "$RSCONNECT_META/"
fi
rm -rf "$BUNDLE"
mkdir -p "$BUNDLE"
if [ -n "$RSCONNECT_META" ] && [ -d "$RSCONNECT_META/rsconnect-python" ]; then
    cp -r "$RSCONNECT_META/rsconnect-python" "$BUNDLE/"
    rm -rf "$RSCONNECT_META"
fi

# Copy app entry point and constants
cp "$PROJECT_ROOT/apps/qcraft-app/app.py" "$BUNDLE/"
cp "$PROJECT_ROOT/apps/qcraft-app/constants.py" "$BUNDLE/"

# Copy static assets
cp -r "$PROJECT_ROOT/apps/qcraft-app/www" "$BUNDLE/"

# Copy qcraft_app package
cp -r "$PROJECT_ROOT/apps/qcraft-app/src/qcraft_app" "$BUNDLE/"

# Copy qcraft_engine package
cp -r "$PROJECT_ROOT/packages/qcraft-engine/src/qcraft_engine" "$BUNDLE/"

# Copy data (flat name — no nested data/processed)
cp -r "$PROJECT_ROOT/data/processed" "$BUNDLE/data_processed"

# Patch data_loader.py: use relative path instead of _find_project_root()
sed -i '' 's|_DATA_DIR = _find_project_root() / "data" / "processed"|_DATA_DIR = Path(__file__).resolve().parent.parent / "data_processed"|' \
    "$BUNDLE/qcraft_engine/data_loader.py"

# Create requirements.txt
cat > "$BUNDLE/requirements.txt" << 'REQS'
shiny>=1.0
plotly>=5.0
htmltools>=0.5
shinywidgets>=0.7.1
polars>=1.0
pyarrow>=14.0
REQS

echo "=== Bundle contents ==="
ls -la "$BUNDLE"

echo ""
echo "=== Deploying to shinyapps.io ==="
cd "$BUNDLE"
"$RSCONNECT" deploy shiny . --name shinyapps --title "Q-CRAFT Explorer"

echo ""
echo "=== Deployment complete ==="
