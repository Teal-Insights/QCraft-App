"""Compare engine output on the frozen vintage against the refreshed one.

    uv run --package qcraft-pipeline python pipeline/sanity_check.py

Writes a markdown table to stdout. Everything in SANITY-REPORT.md comes from
this script, so any number in the report can be re-derived.
"""

import sys

import polars as pl
from qcraft_engine.data_loader import (
    get_country_list,
    load_parquet_data,
    run_pipeline,
)
from qcraft_pipeline import config

OLD = config.BASE_VINTAGE_ID
NEW = config.VINTAGE_ID

# Uganda first (the training audience), then a spread across regions, income
# levels and debt profiles.
COUNTRIES = [
    "UGA",  # Uganda — the Sept 1 training country
    "KEN",  # Kenya — East African peer, recent market stress
    "GHA",  # Ghana — post-restructuring
    "NGA",  # Nigeria — large oil exporter
    "ZAF",  # South Africa — upper-middle income, high debt
    "IND",  # India — large emerging Asia
    "BRA",  # Brazil — Latin America
    "DEU",  # Germany — advanced, low debt
    "JPN",  # Japan — highest debt ratio in the sample
    "USA",  # United States — advanced, rising debt
]


def _at(df: pl.DataFrame, year: int, col: str) -> float | None:
    row = df.filter(pl.col("years") == year)
    if row.is_empty() or row[col][0] is None:
        return None
    return float(row[col][0])


def _mean(df: pl.DataFrame, lo: int, hi: int, col: str) -> float | None:
    sub = df.filter(pl.col("years").is_between(lo, hi))[col].drop_nulls()
    return float(sub.mean()) if len(sub) else None  # type: ignore[arg-type]


def _diff(new: float | None, old: float | None) -> float | None:
    return None if new is None or old is None else new - old


def input_deltas(old_macro: pl.DataFrame, new_macro: pl.DataFrame, iso: str) -> dict:
    """How much the WEO *inputs* moved, before the engine touches them."""
    o = old_macro.filter(pl.col("iso3c") == iso)
    n = new_macro.filter(pl.col("iso3c") == iso)
    joined = o.join(n, on="years", suffix="_new")

    def pct(col: str, lo: int, hi: int) -> float | None:
        sub = joined.filter(pl.col("years").is_between(lo, hi)).filter(
            pl.col(col).is_not_null()
            & pl.col(f"{col}_new").is_not_null()
            & (pl.col(col).abs() > 1e-9)
        )
        if sub.is_empty():
            return None
        rel = (pl.col(f"{col}_new") - pl.col(col)) / pl.col(col).abs() * 100
        return float(sub.select(rel.alias("d"))["d"].median())  # type: ignore[arg-type]

    return {
        "ngdp_hist_pct": pct("nominal_gdp", 2001, 2023),
        "ngdp_proj_pct": pct("nominal_gdp", 2025, 2029),
        "debt_hist_pct": pct("debt", 2001, 2023),
        "d2g_2024_pp": _diff(_at(n, 2024, "debt_to_gdp"), _at(o, 2024, "debt_to_gdp")),
    }


def main() -> int:
    root = config.repo_root() / "data" / "vintages"
    data = {v: load_parquet_data(root / v) for v in (OLD, NEW)}
    listed = {v: {c["iso3c"] for c in get_country_list(data[v])} for v in (OLD, NEW)}

    rows: list[dict] = []
    for iso in COUNTRIES:
        record: dict = {"iso3c": iso}
        for label, vintage in (("old", OLD), ("new", NEW)):
            if iso not in listed[vintage]:
                record[f"{label}_error"] = "not selectable"
                continue
            try:
                result = run_pipeline(data[vintage], iso)
            except Exception as exc:  # noqa: BLE001 — reported, not swallowed
                record[f"{label}_error"] = f"{type(exc).__name__}: {exc}"
                continue
            fiscal, base = result["fiscal"], result["baseline_v1"]
            record[f"{label}_country"] = (
                fiscal["country"][0] if "country" in fiscal.columns else iso
            )
            record[f"{label}_d2g_2009"] = _at(fiscal, 2009, "debt_to_gdp")
            record[f"{label}_d2g_2024"] = _at(fiscal, 2024, "debt_to_gdp")
            record[f"{label}_d2g_2029"] = _at(fiscal, 2029, "debt_to_gdp")
            record[f"{label}_d2g_2050"] = _at(fiscal, 2050, "debt_to_gdp")
            record[f"{label}_d2g_2099"] = _at(fiscal, 2099, "debt_to_gdp")
            record[f"{label}_g_weo"] = _mean(
                base, 2010, 2029, "real_gdp_growth_percent"
            )
            record[f"{label}_g_proj"] = _mean(
                base, 2030, 2050, "real_gdp_growth_percent"
            )
            record[f"{label}_rev_2029"] = _at(fiscal, 2029, "revenue_percent_gdp")
            for scenario in ("Paris", "Hot_Unadapted"):
                record[f"{label}_{scenario}_2050"] = _at(
                    result[scenario], 2050, "debt_to_gdp"
                )
        record.update(
            input_deltas(data[OLD]["macrofiscal"], data[NEW]["macrofiscal"], iso)
        )
        rows.append(record)

    df = pl.DataFrame(rows, infer_schema_length=None)
    df.write_csv(sys.stdout)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
