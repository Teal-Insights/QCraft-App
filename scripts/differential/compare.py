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
from dataclasses import dataclass
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


@dataclass
class Refusals:
    """How the two engines' refusals lined up."""

    checked: int
    summary: str
    lines: list[str]
    failures: list[str]


def compare_refusals(python_dir: Path, ts_dir: Path) -> Refusals:
    """Check that both engines refused the same countries for the same reason.

    Numeric agreement on the countries that work says nothing about the ones
    that do not, and the interesting divergences live there. Zambia and Libya
    raised in Python and returned a debt path anchored at zero in TypeScript for
    the whole sprint while this harness reported PASS, because a country missing
    from one dump was simply skipped.

    Three ways to disagree, all failures: one engine answers where the other
    refuses, they refuse with different error types, or they refuse with
    different messages. The message is compared in full because the two error
    modules are written to produce the same string character for character.
    """
    def read(d: Path) -> dict[str, dict[str, str]]:
        return {
            p.name.removesuffix(".failure.json"): json.loads(p.read_text())
            for p in sorted(d.glob("*.failure.json"))
        }

    py_fail, ts_fail = read(python_dir), read(ts_dir)
    def answered(d: Path) -> set[str]:
        return {
            p.stem
            for p in d.glob("*.json")
            if not p.name.endswith(".failure.json")
        }

    py_ok, ts_ok = answered(python_dir), answered(ts_dir)

    lines: list[str] = []
    failures: list[str] = []
    for iso in sorted(set(py_fail) | set(ts_fail)):
        p, t = py_fail.get(iso), ts_fail.get(iso)
        if p is not None and t is None:
            where = "answered" if iso in ts_ok else "produced no dump"
            failures.append(
                f"{iso}: python refused ({p['error']}) and typescript {where}"
            )
            lines.append(f"{iso:<5} DIVERGES  python {p['error']}, typescript {where}")
        elif t is not None and p is None:
            where = "answered" if iso in py_ok else "produced no dump"
            failures.append(
                f"{iso}: typescript refused ({t['error']}) and python {where}"
            )
            lines.append(f"{iso:<5} DIVERGES  typescript {t['error']}, python {where}")
        elif p is not None and t is not None:
            if p["error"] != t["error"]:
                failures.append(
                    f"{iso}: refused with different types "
                    f"(python {p['error']}, typescript {t['error']})"
                )
                lines.append(
                    f"{iso:<5} DIVERGES  {p['error']} vs {t['error']}"
                )
            elif p["message"] != t["message"]:
                failures.append(
                    f"{iso}: refused with different messages "
                    f"(python {p['message']!r}, typescript {t['message']!r})"
                )
                lines.append(f"{iso:<5} DIVERGES  same type, different message")
            else:
                lines.append(f"{iso:<5} agree     {p['error']}: {p['message']}")

    checked = len(set(py_fail) | set(ts_fail))
    agreed = checked - len([f for f in failures])
    summary = (
        f"{agreed} of {checked} refusals match on both engines"
        if checked
        else "no refusals on either engine"
    )
    return Refusals(checked=checked, summary=summary, lines=lines, failures=failures)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--python-dir", type=Path, required=True)
    ap.add_argument("--ts-dir", type=Path, required=True)
    ap.add_argument("--tol", type=float, default=DEFAULT_TOL)
    ap.add_argument("--label", default="")
    args = ap.parse_args()

    files = sorted(
        p.name
        for p in args.python_dir.glob("*.json")
        if not p.name.endswith(".failure.json")
    )
    refusals = compare_refusals(args.python_dir, args.ts_dir)
    if not files and not refusals.checked:
        raise SystemExit(f"no dumps in {args.python_dir}")

    overall_abs = overall_rel = 0.0
    total_cells = 0
    failures: list[str] = list(refusals.failures)

    print(f"\n=== differential {args.label} ===")
    if refusals.checked:
        print(f"\nfailure semantics: {refusals.summary}")
        for line in refusals.lines:
            print(f"  {line}")
        print()
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
