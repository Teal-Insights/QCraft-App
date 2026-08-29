#!/usr/bin/env bash
#
# The two copy gates, checked against the BUILT BUNDLE rather than the source.
#
# Both exist because a source grep is not the test. The sprint's site QA gate is
# explicit about it: "zero em-dashes anywhere, INCLUDING client-rendered React
# strings (a dist/ grep does not catch them)". So this runs both halves, on the
# artifact that actually ships:
#
#   1. No em-dash reaches a shipped JS, CSS or HTML file, and none reaches a
#      source string literal either.
#   2. Every string Teal gated on 2026-08-27 is in the bundle verbatim, and the
#      three superseded ones are not.
#
#   npm --prefix apps/qcraft-web run build
#   bash scripts/freeze-check.sh
#
# Exits non-zero on any failure.

set -u
cd "$(dirname "$0")/.."
DIST=apps/qcraft-web/dist
fail=0

if [ ! -d "$DIST" ]; then
  echo "FAIL  no build at $DIST. Run: npm --prefix apps/qcraft-web run build"
  exit 1
fi

echo "== em-dashes =="

# Shipped files only. Sourcemaps embed the original source, comments and all,
# and a comment is not copy: they are excluded deliberately and the count is
# reported so the exclusion is visible rather than silent.
shipped=0
while IFS= read -r f; do
  n=$(grep -o '—' "$f" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$n" != "0" ]; then
    echo "FAIL  $f carries $n em-dash(es)"
    shipped=$((shipped + n))
    fail=1
  fi
done < <(find "$DIST" -type f \( -name '*.js' -o -name '*.css' -o -name '*.html' \) ! -name '*.map')
[ "$shipped" = "0" ] && echo "ok    no em-dash in any shipped js, css or html"

maps=$(find "$DIST" -name '*.map' -exec grep -o '—' {} + 2>/dev/null | wc -l | tr -d ' ')
echo "note  $maps in .js.map sourcemaps, all inside source comments; not rendered"

# Source string literals: every em-dash under src/ must be on a comment line.
literals=$(grep -rn '—' apps/qcraft-web/src --include='*.ts' --include='*.tsx' 2>/dev/null \
  | grep -vE '^[^:]+:[0-9]+:[[:space:]]*(\*|//|/\*)' || true)
if [ -n "$literals" ]; then
  echo "FAIL  em-dash outside a comment in src:"
  echo "$literals"
  fail=1
else
  echo "ok    every em-dash under src/ is inside a code comment"
fi

echo
echo "== the gated strings, verbatim in the bundle =="

BUNDLE=$(find "$DIST" -name '*.js' ! -name '*.map' -exec cat {} +)

check() {
  if printf '%s' "$BUNDLE" | grep -qF -- "$2"; then
    echo "ok    $1"
  else
    echo "FAIL  $1"
    fail=1
  fi
}
absent() {
  if printf '%s' "$BUNDLE" | grep -qF -- "$2"; then
    echo "FAIL  $1 is present and must not be"
    fail=1
  else
    echo "ok    $1 is absent, as the gate requires"
  fi
}

check "gate 1, the Verified badge with 'only'" \
  "Baseline parity verified for 147 of 147 tested countries; climate-scenario parity confirmed for ratio metrics only."
check "gate 2, the FADCP short form" \
  "FADCP Climate Dataset (Centorrino, Massetti and Tagklis, 2024), building on Kahn et al. (2021)"
check "gate 2, the precise chain for About the data" \
  "The dataset is Massetti and Tagklis (2023). The temperature-to-GDP damage layer this tool reads is Centorrino, Massetti and Tagklis (2024), building on Kahn and others (2021)."
check "gate 3, the Current divergence note" \
  "Same engine, newer inputs: results will not match the published workbook cell for cell, because the workbook ships the October 2024 data vintage."
check "gate 4, the zero-climate heading" \
  "No climate estimates for this economy"
check "gate 4, the zero-climate body" \
  "The climate dataset has no coverage for this economy, so every scenario lands on the baseline. That is missing data, not an absence of risk."
# All three sentences, not just the first. The gate used to pin the opening
# sentence alone, so the two that carry the asymmetry (the baseline is held at
# zero, the climate scenarios are not) could have been reworded without the
# gate noticing. They are the half that explains the picture.
check "gate 7, the sub-zero note" \
  "Values below zero mean the projection has repaid the whole debt stock and continues into a net asset position. The baseline path is held at zero; the climate scenarios are not, which is why only they go below it."
check "CC-6's correction to the unavailable notice" \
  "A small number of countries are affected; most of the list projects normally."

absent "the false sentence CC-6 removed" \
  "Every other country in the list is unaffected"
absent "the pre-gate badge, without 'only'" \
  "climate-scenario parity confirmed for ratio metrics."
absent "the 'as much as' cover title CC-7 replaced" \
  "as much as"

echo
if [ "$fail" = "0" ]; then
  echo "FREEZE CHECK: PASS"
else
  echo "FREEZE CHECK: FAIL"
fi
exit $fail
