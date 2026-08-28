"""Compute the numbers the app screenshots are annotated with.

scripts/build_app_screenshots.py runs under a bare interpreter with Playwright
and nothing else, so it cannot import the engine. It reads this file's output
instead, and it looks every number up in the app's OWN rendered label before it
draws a callout. If a number here and the number on screen ever disagree, the
screenshot build stops rather than shipping a mislabelled figure.

The labels are formatted the way the Explorer formats them, because they are
matched against the app's text nodes verbatim.

Run from the repository root, with the engine on the path:

    uv run --package qcraft-engine python scripts/build_app_facts.py
"""

from __future__ import annotations

import csv
import json
from pathlib import Path

from qcraft_engine.data_loader import load_parquet_data, run_pipeline

REPO_ROOT = Path(__file__).resolve().parent.parent
SERIES = REPO_ROOT / "docs" / "companion-guide" / "figures" / "series"
OUT = SERIES / "app-facts.json"

UGA_PARAMS = dict(demography_variant="Medium", debt_target=50.0,
                  expenditure_rigidity=1.0)


def col(df, name: str) -> dict[int, float]:
    return {int(r[0]): (None if r[1] is None else float(r[1]))
            for r in df.select("years", name).iter_rows()}


def pct(v: float) -> str:
    """The Explorer's debt-chart endpoint label."""
    return f"{v:.1f}%"


def main() -> None:
    data = load_parquet_data()
    facts: dict = {"engine": {}}

    for rule in ("Yes", "No"):
        res = run_pipeline(data, "UGA", {**UGA_PARAMS, "fiscal_rule": rule})
        base = col(res["fiscal"], "debt_to_gdp")
        hotu = col(res["Hot_Unadapted"], "debt_to_gdp")
        entry = {
            "debt_2099_label": pct(base[2099]),
            "baseline_label": pct(base[2099]),
            "hot_unadapted_label": pct(hotu[2099]),
            "gap_points": f"{hotu[2099] - base[2099]:.0f}",
            "rigidity": {},
        }
        for rig in (1.0, 0.0):
            r2 = run_pipeline(
                data, "UGA",
                {**UGA_PARAMS, "fiscal_rule": rule, "expenditure_rigidity": rig},
            )
            hu = col(r2["Hot_Unadapted"], "debt_to_gdp")[2099]
            pa = col(r2["Paris"], "debt_to_gdp")[2099]
            entry["rigidity"][f"{rig:.1f}"] = {
                "hot_unadapted_label": pct(hu),
                "paris_label": pct(pa),
                "fan_points": f"{hu - pa:.0f}",
            }
        facts["engine"][rule] = entry

    # The Climate tab's GDP index, which the Explorer rebases to 100 at the last
    # year the country's WEO series reports and labels only for the baseline.
    res = run_pipeline(data, "UGA", {**UGA_PARAMS, "fiscal_rule": "Yes"})
    gdp = col(res["baseline_v1"], "real_gdp")
    b29, b99 = gdp[2029], gdp[2099]
    idx = lambda v: f"{v / b29 * 100:.0f}"  # noqa: E731
    hu99 = col(res["Hot_Unadapted"], "real_gdp")[2099]
    facts["index"] = {
        "baseline_label": idx(b99),
        "paris": idx(col(res["Paris"], "real_gdp")[2099]),
        "hot": idx(col(res["Hot"], "real_gdp")[2099]),
        "hot_unadapted": idx(hu99),
        "spread_pct": f"{abs(hu99 / b99 - 1) * 100:.1f}",
    }

    # Kenya, for M2's reconciliation caption. Read from the committed series so
    # the caption and the chapter's figures cannot drift apart.
    pb = {int(r["years"]): float(r["primary_balance"])
          for r in csv.DictReader(open(SERIES / "m2-primary-balance.csv"))}
    debt = {int(r["years"]): float(r["baseline"])
            for r in csv.DictReader(open(SERIES / "m2-debt-paths.csv"))}
    deficit = sorted(y for y in pb if pb[y] < 0)
    first, last = deficit[0], deficit[-1]
    move = debt[last] - debt[first]
    facts["kenya"] = {
        "first": str(first),
        "last": str(last),
        "debt_first": f"{debt[first]:.1f}",
        "debt_last": f"{debt[last]:.1f}",
        "debt_window": f"{move:+.1f}",
        "years": str(last - first + 1),
    }

    OUT.write_text(json.dumps(facts, indent=2) + "\n")
    print(f"wrote {OUT.relative_to(REPO_ROOT)}")
    print(json.dumps(facts, indent=2))


if __name__ == "__main__":
    main()
