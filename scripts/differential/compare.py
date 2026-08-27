#!/usr/bin/env python3
"""Diff the Python and TypeScript engine dumps, column by column, year by year.

Reports the worst absolute and relative deviation per module and overall. The
two engines are ports of one another, so the bar is floating-point agreement,
not the golden-master tolerances: anything above ~1e-12 relative is a real
divergence, not accumulated arithmetic noise.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

DEFAULT_TOL = 1e-12


def worst(
    py: list[dict[str, Any]], ts: list[dict[str, Any]]
) -> tuple[float, float, str | None, int | None, int]:
    """Return (max abs diff, max rel diff, column, year, cells compared)."""
    max_abs = max_rel = 0.0
    col_at: str | None = None
    year_at: int | None = None
    cells = 0
    for a, b in zip(py, ts, strict=True):
        for key, pv in a.items():
            tv = b.get(key)
            if isinstance(pv, str) or isinstance(tv, str):
                if pv != tv:
                    raise SystemExit(f"non-numeric mismatch in {key}: {pv!r} vs {tv!r}")
                continue
            if pv is None or tv is None:
                if (pv is None) != (tv is None):
                    raise SystemExit(f"null mismatch in {key}: {pv!r} vs {tv!r}")
                continue
            cells += 1
            diff = abs(float(pv) - float(tv))
            scale = max(abs(float(pv)), abs(float(tv)))
            rel = diff / scale if scale > 0 else 0.0
            if rel > max_rel:
                max_rel, col_at, year_at = rel, key, a.get("years")
            max_abs = max(max_abs, diff)
    return max_abs, max_rel, col_at, year_at, cells


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--python-dir", type=Path, required=True)
    ap.add_argument("--ts-dir", type=Path, required=True)
    ap.add_argument("--tol", type=float, default=DEFAULT_TOL)
    ap.add_argument("--label", default="")
    args = ap.parse_args()

    files = sorted(p.name for p in args.python_dir.glob("*.json"))
    if not files:
        raise SystemExit(f"no dumps in {args.python_dir}")

    overall_abs = overall_rel = 0.0
    total_cells = 0
    failures: list[str] = []

    print(f"\n=== differential {args.label} ===")
    header = f"{'country':<9} {'modules':>8} {'cells':>10}"
    print(f"{header} {'max abs':>12} {'max rel':>12}  worst")
    for name in files:
        py_doc = json.loads((args.python_dir / name).read_text())
        ts_path = args.ts_dir / name
        if not ts_path.exists():
            failures.append(f"{name}: no TypeScript dump")
            continue
        ts_doc = json.loads(ts_path.read_text())

        if set(py_doc) != set(ts_doc):
            failures.append(
                f"{name}: module keys differ "
                f"(python-only {sorted(set(py_doc) - set(ts_doc))}, "
                f"ts-only {sorted(set(ts_doc) - set(py_doc))})"
            )
            continue

        c_abs = c_rel = 0.0
        c_cells = 0
        c_worst = ""
        for module in sorted(py_doc):
            p_rows, t_rows = py_doc[module], ts_doc[module]
            if len(p_rows) != len(t_rows):
                failures.append(
                    f"{name}/{module}: row count {len(p_rows)} vs {len(t_rows)}"
                )
                continue
            m_abs, m_rel, col, year, cells = worst(p_rows, t_rows)
            c_cells += cells
            c_abs = max(c_abs, m_abs)
            if m_rel > c_rel:
                c_rel, c_worst = m_rel, f"{module}.{col}@{year}"
        overall_abs = max(overall_abs, c_abs)
        overall_rel = max(overall_rel, c_rel)
        total_cells += c_cells
        flag = "" if c_rel <= args.tol else "   <-- OVER TOLERANCE"
        iso = name.removesuffix(".json")
        print(
            f"{iso:<9} {len(py_doc):>8} {c_cells:>10,} {c_abs:>12.3e} "
            f"{c_rel:>12.3e}  {c_worst}{flag}"
        )
        if c_rel > args.tol:
            failures.append(
                f"{iso}: max rel {c_rel:.3e} > tol {args.tol:.0e} at {c_worst}"
            )

    print(f"{'-' * 78}")
    print(
        f"{'TOTAL':<9} {'':>8} {total_cells:>10,} {overall_abs:>12.3e} "
        f"{overall_rel:>12.3e}  tol {args.tol:.0e}"
    )
    for f in failures:
        print(f"FAIL {f}")
    print("RESULT:", "FAIL" if failures else "PASS")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
