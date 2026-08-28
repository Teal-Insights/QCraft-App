#!/usr/bin/env python3
"""Run every selectable country through the real Python engine, both vintages.

The completeness sweep behind TEA-1403. For each country it runs the full
pipeline (baseline plus all six climate scenarios, since `run_pipeline` returns
one frame per scenario) and records either success or the exact failure, next to
the data conditions that explain it.

The data diagnostics are computed from the raw inputs rather than inferred from
the exception, so this script classifies a country the same way before and after
the engine learns to fail gracefully.

    uv run --package qcraft-engine python scripts/sweep/sweep_python.py \
      --out verification-logs/sweep

Writes one JSON per vintage plus a combined summary.
"""

from __future__ import annotations

import argparse
import json
import traceback
from pathlib import Path
from typing import Any

import polars as pl
from qcraft_engine.data_loader import (
    _build_macrofiscal_for_fiscal,
    get_country_list,
    load_parquet_data,
    run_pipeline,
)

VINTAGES = ["weo-2024-10", "weo-2026-04"]


def diagnose(data: dict[str, pl.DataFrame], iso3c: str) -> dict[str, Any]:
    """Read the data conditions that decide whether a country can be projected."""
    out: dict[str, Any] = {}

    # The engine does not see the raw rows. `_build_macrofiscal_for_fiscal` drops
    # every row with a null nominal_gdp or revenue first, so a country's effective
    # last WEO year, and therefore its debt anchor, can sit earlier than the last
    # row in the source. Ecuador is the case that proves it: raw data runs to 2029
    # with no debt after 2025, but the filter leaves 2025 as the anchor and the
    # projection starts from a real debt stock. Diagnosing off the raw frame calls
    # that a missing anchor when the engine never sees one.
    macro = _build_macrofiscal_for_fiscal(data["macrofiscal"], iso3c)
    if macro.is_empty():
        out["weo_max_year"] = None
        out["anchor_debt_to_gdp_null"] = True
        out["debt_null_years"] = []
        out["debt_all_null"] = True
    else:
        weo_max = int(macro["years"].max())
        anchor = macro.filter(pl.col("years") == weo_max)
        anchor_dtg = anchor["debt_to_gdp"][0] if anchor.height else None
        nulls = macro.filter(pl.col("debt_to_gdp").is_null())["years"].to_list()
        out["weo_max_year"] = weo_max
        out["anchor_debt_to_gdp_null"] = anchor_dtg is None
        out["debt_null_years"] = nulls
        out["debt_all_null"] = len(nulls) == macro.height

    # Demography: more than one series filed under one code is the Serbia defect.
    demo = data["demography"].filter(pl.col("iso3c") == iso3c)
    labels = sorted(set(demo["country"].unique().to_list())) if demo.height else []
    per_year = (
        demo.filter(pl.col("status") == "Medium")
        .group_by("years")
        .len()
        .sort("len", descending=True)
    )
    out["demography_labels"] = labels
    out["demography_max_rows_per_year"] = (
        int(per_year["len"][0]) if per_year.height else 0
    )

    clim = data["climate"].filter(pl.col("iso3c") == iso3c)
    nonzero = 0
    if clim.height:
        col = "gdp_loss_percent" if "gdp_loss_percent" in clim.columns else None
        if col:
            nonzero = clim.filter(
                pl.col(col).is_not_null() & (pl.col(col) != 0)
            ).height
    out["climate_rows"] = clim.height
    out["climate_nonzero_cells"] = nonzero
    out["climate_all_zero"] = clim.height > 0 and nonzero == 0

    prod = data["productivity"].filter(pl.col("iso3c") == iso3c)
    out["productivity_rows"] = prod.height
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--vintages", nargs="*", default=VINTAGES)
    args = ap.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    summary: dict[str, Any] = {}
    for vintage in args.vintages:
        data = load_parquet_data(Path("data/vintages") / vintage)
        countries = get_country_list(data)
        rows: list[dict[str, Any]] = []
        print(f"\n=== {vintage}: {len(countries)} selectable countries ===", flush=True)
        for entry in countries:
            iso3c, name = entry["iso3c"], entry["country"]
            rec: dict[str, Any] = {"iso3c": iso3c, "country": name}
            rec.update(diagnose(data, iso3c))
            try:
                run_pipeline(data, iso3c, None)
                rec["status"] = "ok"
                rec["error_type"] = None
                rec["error"] = None
            except Exception as exc:  # noqa: BLE001 (the sweep records every failure)
                rec["status"] = "fail"
                rec["error_type"] = type(exc).__name__
                rec["error"] = str(exc).split("\n")[0][:200]
                rec["traceback_tail"] = traceback.format_exc().strip().split("\n")[-3:]
            rows.append(rec)
            if rec["status"] == "fail":
                detail = f"{rec['error_type']}: {rec['error'][:70]}"
                print(f"  FAIL {iso3c} {name}: {detail}", flush=True)
        path = args.out / f"python-{vintage}.json"
        path.write_text(json.dumps(rows, indent=2))
        fails = [r for r in rows if r["status"] == "fail"]
        summary[vintage] = {
            "selectable": len(rows),
            "ok": len(rows) - len(fails),
            "fail": len(fails),
            "climate_all_zero": sorted(
                r["iso3c"] for r in rows if r["climate_all_zero"]
            ),
            "anchor_null": sorted(
                r["iso3c"] for r in rows if r["anchor_debt_to_gdp_null"]
            ),
        }
        counts = f"{summary[vintage]['ok']} ok, {len(fails)} fail"
        print(f"  -> {path}: {counts}", flush=True)

    (args.out / "python-summary.json").write_text(json.dumps(summary, indent=2))
    print("\n=== SUMMARY ===")
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
