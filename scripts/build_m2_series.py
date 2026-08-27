"""Dump the engine series that @sec-m2's figures are drawn from.

The chapter's rule is that every number on a figure comes from a run of this
repository's engine rather than from a sentence someone wrote. That means the
figure builder needs engine output, and the figure builder is deliberately
dependency-free: it reads CSV, the way scripts/build_exhibits.py already reads
the golden masters.

So this script sits between them. It runs the pipeline for the chapter's two
countries and writes the columns the figures use into
docs/companion-guide/figures/series/. The CSVs are committed, so a reader can
check any plotted point against a file in the repository without installing
Polars, and scripts/build_exhibits.py stays runnable on a bare interpreter.

Kenya is the chapter's spine: climate-exposed, and the only one of the two
candidates whose macro-fiscal series in data/processed/ is complete enough for
the pipeline to run (Bangladesh is missing debt for 2001 and 2002, which raises
a TypeError in the fiscal module). Thailand is the contrast in Step 2a, where
the working-age population is falling while Kenya's is still rising.

Parameters are the Explorer's shipped defaults, so the charts match what a
reader gets on selecting the country and touching nothing.

Run from the repository root, with the engine on the path:

    uv run --package qcraft-engine python scripts/build_m2_series.py
"""

from __future__ import annotations

import csv
from pathlib import Path

import polars as pl
from qcraft_engine.data_loader import load_parquet_data, run_pipeline

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = REPO_ROOT / "docs" / "companion-guide" / "figures" / "series"

SPINE = "KEN"
CONTRAST = "THA"

# The three Hot variants share a temperature path and differ only in how fast
# the historical norm catches up, so they are the adaptation contrast in Step 3.
DRAG_SCENARIOS = ["Paris", "Hot_Adapted", "Hot", "Hot_Unadapted"]


def write(name: str, header: list[str], rows: list[list]) -> None:
    path = OUT_DIR / name
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(header)
        for row in rows:
            writer.writerow(
                [f"{v:.6f}" if isinstance(v, float) else v for v in row]
            )
    print(f"wrote {path.relative_to(REPO_ROOT)} ({len(rows)} rows)")


def series(df: pl.DataFrame, column: str) -> dict[int, float]:
    out: dict[int, float] = {}
    for row in df.select("years", column).iter_rows():
        if row[1] is not None:
            out[int(row[0])] = float(row[1])
    return out


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    data = load_parquet_data()

    spine = run_pipeline(data, SPINE)
    contrast = run_pipeline(data, CONTRAST)

    # 1. The cold open, and the docking example: debt under the baseline and
    #    under Hot, on the same axis.
    base = series(spine["fiscal"], "debt_to_gdp")
    hot = series(spine["Hot"], "debt_to_gdp")
    write(
        "m2-debt-paths.csv",
        ["years", "baseline", "hot"],
        [[y, base[y], hot[y]] for y in sorted(base) if y >= 2024],
    )

    # 2. Step 2a: the three parts of nominal GDP growth, for both countries.
    rows = []
    for iso, result in ((SPINE, spine), (CONTRAST, contrast)):
        bv1 = result["baseline_v1"]
        emp = series(bv1, "employment_growth")
        prod = series(bv1, "labour_productivity_growth")
        infl = series(bv1, "gdp_deflator_growth_percent")
        real = series(bv1, "real_gdp_growth_percent")
        nominal = series(bv1, "nominal_gdp_growth_percent")
        for y in sorted(emp):
            if y >= 2024:
                rows.append(
                    [iso, y, emp[y], prod[y], infl[y], real[y], nominal[y]]
                )
    write(
        "m2-growth-parts.csv",
        [
            "iso3c",
            "years",
            "employment_growth",
            "productivity_growth",
            "inflation",
            "real_gdp_growth",
            "nominal_gdp_growth",
        ],
        rows,
    )

    # 3. Step 2b: the two flows whose difference is the primary balance, and
    #    the debt-stabilizing balance the equation asks for.
    fiscal = spine["fiscal"]
    rev = series(fiscal, "revenue_percent_gdp")
    pexp = series(fiscal, "primary_expenditure_percent_gdp")
    pbal = series(fiscal, "primary_balance_percent_gdp")
    dspb = series(fiscal, "debt_stabilizing_primary_balance")
    write(
        "m2-primary-balance.csv",
        ["years", "revenue", "primary_expenditure", "primary_balance", "dspb"],
        [
            [y, rev[y], pexp[y], pbal[y], dspb.get(y, float("nan"))]
            for y in sorted(rev)
            if y >= 2024
        ],
    )

    # 4. Step 2c: what each of the three interest rate rules does to r.
    rows = []
    for mode in (
        "Nominal interest rate",
        "Interest-growth differential",
        "Real interest rate",
    ):
        result = run_pipeline(data, SPINE, {"interest_rate_mode": mode})
        rate = series(result["interest_rate"], "nominal_interest_rate")
        debt = series(result["fiscal"], "debt_to_gdp")
        hot_debt = series(result["Hot"], "debt_to_gdp")
        for y in sorted(rate):
            if y >= 2024:
                rows.append([mode, y, rate[y], debt[y], hot_debt[y]])
    write(
        "m2-interest-rules.csv",
        ["rule", "years", "nominal_interest_rate", "debt_baseline", "debt_hot"],
        rows,
    )

    # 5. Step 3: the cumulative GDP shortfall each warming scenario carries,
    #    which is what Q-CRAFT consumes from the FADCP dataset.
    climate = data["climate"].filter(pl.col("iso3c") == SPINE)
    rows = []
    for scenario in DRAG_SCENARIOS:
        scn = climate.filter(pl.col("climate_scenario") == scenario).sort("years")
        for year, loss in scn.select("years", "gdp_loss_percent").iter_rows():
            if int(year) >= 2029:
                rows.append([scenario, int(year), float(loss)])
    write("m2-climate-drag.csv", ["scenario", "years", "gdp_loss_percent"], rows)

    # 6. Step 3: the same run traced through the three numbers, so the chapter
    #    can show that only g moves and watch what that does to pb and to debt.
    bv1, hot_run = spine["baseline_v1"], spine["Hot"]
    trace = {
        "g_baseline": series(bv1, "nominal_gdp_growth_percent"),
        "g_hot": series(hot_run, "nominal_gdp_growth_percent"),
        "productivity_baseline": series(bv1, "labour_productivity_growth"),
        "productivity_hot": series(hot_run, "labour_productivity_growth"),
        "pb_baseline": series(fiscal, "primary_balance_percent_gdp"),
        "pb_hot": series(hot_run, "primary_balance_percent_gdp"),
        "dspb_baseline": dspb,
        "dspb_hot": series(hot_run, "debt_stabilizing_primary_balance"),
        "debt_baseline": series(fiscal, "debt_to_gdp"),
        "debt_hot": series(hot_run, "debt_to_gdp"),
    }
    columns = list(trace)
    write(
        "m2-climate-trace.csv",
        ["years", *columns],
        [
            [y, *[trace[c].get(y, float("nan")) for c in columns]]
            for y in sorted(trace["g_baseline"])
            if y >= 2029
        ],
    )

    # 7. Step 3c: the rigidity dial, read at the end of the horizon.
    rows = []
    for rigidity in (1.0, 0.75, 0.5, 0.25, 0.0):
        result = run_pipeline(data, SPINE, {"expenditure_rigidity": rigidity})
        hot = series(result["Hot"], "debt_to_gdp")
        pb = series(result["Hot"], "primary_balance_percent_gdp")
        rows.append([rigidity, hot[2099], pb[2099]])
    write(
        "m2-rigidity-dial.csv",
        ["expenditure_rigidity", "hot_debt_2099", "hot_primary_balance_2099"],
        rows,
    )


if __name__ == "__main__":
    main()
