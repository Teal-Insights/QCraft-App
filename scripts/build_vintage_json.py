#!/usr/bin/env python3
"""Emit per-country engine JSON for a vintage that already has its Parquet.

The refresh pipeline writes `json/` as part of `qcraft-pipeline run`, so
`data/vintages/weo-2026-04/json/` exists. The frozen verification vintage
`weo-2024-10` predates that step: it carries the four Parquet files and a
manifest, and nothing else. The Explorer's Verified mode runs the engine on that
vintage, so it needs the same payloads.

This script closes that gap without re-running the pipeline (which cannot
regenerate a frozen vintage anyway, and must never write to it). It reads the
vintage's own Parquet, and calls the pipeline's own emitter, so a Verified
payload and a Current payload are the same shape by construction rather than by
inspection.

    uv run --package qcraft-pipeline python scripts/build_vintage_json.py weo-2024-10

Output is gitignored, like every other Parquet-derived artifact. `index.json` is
committed, because the country list is what makes a vintage reviewable.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import polars as pl
from qcraft_pipeline import config, emit


def repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def load_vintage(vintage_dir: Path) -> dict[str, pl.DataFrame]:
    missing = [
        n for n in config.DATASETS if not (vintage_dir / f"{n}.parquet").exists()
    ]
    if missing:
        raise SystemExit(f"error: {vintage_dir} is missing {missing}")
    return {
        name: pl.read_parquet(vintage_dir / f"{name}.parquet")
        for name in config.DATASETS
    }


def vintage_label(vintage_dir: Path, vintage_id: str) -> str:
    """Prefer the label the vintage states about itself."""
    manifest_path = vintage_dir / "manifest.json"
    if manifest_path.exists():
        label = json.loads(manifest_path.read_text()).get("label")
        if label:
            return str(label)
    if vintage_id == config.BASE_VINTAGE_ID:
        return config.BASE_VINTAGE_LABEL
    if vintage_id == config.VINTAGE_ID:
        return config.VINTAGE_LABEL
    return vintage_id


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("vintage", help="vintage id, e.g. weo-2024-10")
    parser.add_argument(
        "--data-root",
        type=Path,
        default=None,
        help="directory holding vintages/ (default: <repo>/data)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="overwrite an existing json/ directory",
    )
    args = parser.parse_args(argv)

    data_root = args.data_root or (repo_root() / "data")
    vintage_dir = data_root / "vintages" / args.vintage
    json_dir = vintage_dir / "json"

    if json_dir.exists() and not args.force:
        print(f"{json_dir} already exists; pass --force to rebuild.", file=sys.stderr)
        return 1

    tables = load_vintage(vintage_dir)
    countries = emit.selectable_countries(tables)
    label = vintage_label(vintage_dir, args.vintage)

    print(f"Writing {args.vintage} ({label}) to {json_dir}")
    emit.write_country_json(
        tables,
        vintage_dir,
        countries,
        vintage_id=args.vintage,
        vintage_label=label,
    )
    print(f"\nDone. {len(countries)} countries selectable.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
