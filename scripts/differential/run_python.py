#!/usr/bin/env python3
"""Run the Python engine over a country set for one vintage and dump JSON.

Half of the TypeScript-vs-Python differential. The TS half is `run_ts.ts`, and
`compare.py` diffs the two dumps. See INTEGRATION-REPORT.md for the commands.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
from typing import Any

import polars as pl
from qcraft_engine.data_loader import load_parquet_data, run_pipeline


def jsonable(value: Any) -> Any:
    """NaN and Inf are not JSON; the TS side emits null for both."""
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    return value


def frame_to_rows(df: pl.DataFrame) -> list[dict[str, Any]]:
    return [
        {k: jsonable(v) for k, v in row.items()}
        for row in df.iter_rows(named=True)
    ]


def default_countries() -> list[str]:
    """The permanent set, shared with the TypeScript runner."""
    spec = json.loads((Path(__file__).parent / "countries.json").read_text())
    return list(spec["countries"])


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("countries", nargs="*")
    ap.add_argument("--data-dir", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--params", type=Path, default=None)
    args = ap.parse_args()

    params = json.loads(args.params.read_text()) if args.params else None
    data = load_parquet_data(args.data_dir)
    args.out.mkdir(parents=True, exist_ok=True)
    countries = args.countries or default_countries()

    ok, failed = [], []
    for iso3c in countries:
        try:
            result = run_pipeline(data, iso3c, params)
        except Exception as exc:  # noqa: BLE001 (the differential records failures)
            # A refusal is a result. It used to be printed and dropped, so a
            # country that raised here and returned an answer in TypeScript
            # simply left the comparison, which is how Zambia and Libya went on
            # diverging while the harness reported PASS. Written to disk in the
            # shape compare.py reads, beside the successes.
            (args.out / f"{iso3c}.failure.json").write_text(
                json.dumps({"error": type(exc).__name__, "message": str(exc)})
            )
            failed.append((iso3c, f"{type(exc).__name__}: {exc}"))
            continue
        payload = {name: frame_to_rows(df) for name, df in result.items()}
        (args.out / f"{iso3c}.json").write_text(json.dumps(payload))
        ok.append(iso3c)

    print(f"python: {len(ok)} ok, {len(failed)} refused -> {args.out}")
    for iso3c, why in failed:
        print(f"python: refused {iso3c}: {why}")
    # Refusing is not an error here; compare.py decides whether the two engines
    # refused the same countries for the same reason.
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
