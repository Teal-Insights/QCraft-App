#!/usr/bin/env python3
"""Export per-country JSON input files for the TypeScript engine.

Slices the four processed Parquet files the Shiny app loads
(`data/processed/{macrofiscal,demography,productivity,climate}.parquet`) into one JSON
file per country. The output is deliberately RAW: it carries the four slices unshaped and
lets `@qcraft/engine` apply the filtering/forward-fill rules itself, so that logic lives
in one place instead of being duplicated here.

Usage:
    # three sample countries
    uv run --with polars --with pyarrow python scripts/export_country_json.py \\
        UGA KEN BGD --out-dir ../SHARED/sample-data

    # every country the pipeline can run
    uv run --with polars --with pyarrow python scripts/export_country_json.py \\
        --all --out-dir out/

The processed Parquet directory is not in this repo (`*.parquet` is gitignored). Pass
`--data-dir`, or let the script search the known locations listed in `CANDIDATE_DATA_DIRS`.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path
from typing import Any

import polars as pl

# Searched in order when --data-dir is not given. The Shiny app resolves
# <project-root>/data/processed; these are the copies that exist on the build machine.
CANDIDATE_DATA_DIRS = [
    Path.home() / "Library/CloudStorage/Dropbox/Mac/Documents/QCraft-App/data/processed",
    Path.home() / "Library/CloudStorage/Dropbox/Mac/Documents/QCraft-Verification/data/processed",
    Path(__file__).resolve().parents[1] / "data" / "processed",
]

TABLES = ("macrofiscal", "demography", "productivity", "climate")

# The OECD aggregate is needed by every country's productivity module.
OECD_ISO3C = "OED"


def resolve_data_dir(explicit: Path | None) -> Path:
    """Find the processed-Parquet directory, or fail with the paths that were tried."""
    if explicit is not None:
        if not explicit.is_dir():
            raise SystemExit(f"--data-dir does not exist: {explicit}")
        return explicit

    for candidate in CANDIDATE_DATA_DIRS:
        if all((candidate / f"{name}.parquet").exists() for name in TABLES):
            return candidate

    tried = "\n  ".join(str(c) for c in CANDIDATE_DATA_DIRS)
    raise SystemExit(
        "Could not find data/processed with all four Parquet files. Tried:\n  " + tried
    )


def load_tables(data_dir: Path) -> dict[str, pl.DataFrame]:
    return {name: pl.read_parquet(data_dir / f"{name}.parquet") for name in TABLES}


def clean(value: Any) -> Any:
    """Polars nulls and NaNs both become JSON null (JSON has no NaN literal)."""
    if value is None:
        return None
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    return value


def rows(df: pl.DataFrame) -> list[dict[str, Any]]:
    return [{k: clean(v) for k, v in row.items()} for row in df.iter_rows(named=True)]


def country_payload(data: dict[str, pl.DataFrame], iso3c: str) -> dict[str, Any]:
    """Build one country's raw input slices."""
    macro = data["macrofiscal"].filter(pl.col("iso3c") == iso3c).sort("years")
    if macro.is_empty():
        raise ValueError(f"{iso3c}: no macrofiscal rows")

    name_col = macro["country"].drop_nulls()
    country_name = name_col[0] if len(name_col) else iso3c

    demography = (
        data["demography"]
        .filter(pl.col("iso3c") == iso3c)
        .sort("years", "age_group", "status")
    )
    # The country's own WDI levels plus the OECD aggregate the relative-level column needs.
    productivity = (
        data["productivity"]
        .filter(pl.col("iso3c").is_in([iso3c, OECD_ISO3C]))
        .sort("iso3c", "years")
    )
    climate = (
        data["climate"]
        .filter(pl.col("iso3c") == iso3c)
        .sort("climate_scenario", "years")
    )

    return {
        "iso3c": iso3c,
        "country": country_name,
        "demography": rows(demography),
        "productivity": rows(productivity),
        "macrofiscal": rows(macro),
        "climate": rows(climate),
    }


def eligible_countries(data: dict[str, pl.DataFrame]) -> list[str]:
    """Countries present in all four sources — mirrors data_loader.get_country_list."""
    sets = [set(data[name]["iso3c"].unique().to_list()) for name in TABLES]
    return sorted(set.intersection(*sets))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("iso3c", nargs="*", help="ISO3 codes to export, e.g. UGA KEN BGD")
    parser.add_argument("--all", action="store_true", help="export every eligible country")
    parser.add_argument("--out-dir", type=Path, required=True)
    parser.add_argument("--data-dir", type=Path, default=None)
    parser.add_argument(
        "--indent",
        type=int,
        default=None,
        help="pretty-print with this indent (default: compact)",
    )
    args = parser.parse_args(argv)

    if not args.all and not args.iso3c:
        parser.error("give at least one ISO3 code, or --all")

    data = load_tables(resolve_data_dir(args.data_dir))
    targets = eligible_countries(data) if args.all else [c.upper() for c in args.iso3c]

    args.out_dir.mkdir(parents=True, exist_ok=True)

    written, failed = 0, 0
    for iso3c in targets:
        try:
            payload = country_payload(data, iso3c)
        except ValueError as exc:
            print(f"  SKIP {iso3c}: {exc}", file=sys.stderr)
            failed += 1
            continue

        out_path = args.out_dir / f"{iso3c}.json"
        out_path.write_text(
            json.dumps(payload, indent=args.indent, allow_nan=False) + "\n",
            encoding="utf-8",
        )
        written += 1
        size_kb = out_path.stat().st_size / 1024
        print(f"  {iso3c}  {payload['country']:<34} {size_kb:>8.0f} KB")

    print(f"\nWrote {written} file(s) to {args.out_dir}" + (f", {failed} skipped" if failed else ""))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
