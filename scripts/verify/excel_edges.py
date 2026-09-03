"""Excel golden masters for the parameter paths the 2026-09-02 audit found untested.

Drives Microsoft Excel through xlwings on a COPY of the IMF Q-CRAFT workbook
v1.0 (11-15-2024), sets the Dashboard cells (and Productivity!J21 for the
Turning Point case), recalculates, and writes the Baseline and six scenario
rows for 2030 to 2099 as one CSV per case, in the same shape as
`verification-logs/golden-masters/<ISO3>.csv`.

Output: packages/qcraft-engine/tests/golden_masters/excel_edges/<label>.csv,
read by `tests/test_excel_edges.py` (Python) and `tests/excel-edges.test.ts`
(TypeScript). The README beside them names the cells set for each case.

Run (Excel must be installed; the script launches it):

    uv run --with xlwings python scripts/verify/excel_edges.py [label ...]

Cases already written are skipped unless --force is given. CC-26, audit A
findings F1, F3, F5 and F7.
"""

from __future__ import annotations

import argparse
import csv
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path

import xlwings as xw

sys.path.insert(0, str(Path(__file__).resolve().parent))
from excel_reader import (  # noqa: E402
    BASELINE_ROWS,
    DASHBOARD_CELLS,
    SCENARIO_ROWS,
    year_to_col,
)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = (
    PROJECT_ROOT
    / "packages"
    / "qcraft-engine"
    / "tests"
    / "golden_masters"
    / "excel_edges"
)
NAME_MAP = json.loads(
    (PROJECT_ROOT / "verification-logs" / "phase0_config.json").read_text()
)["country_name_map"]

ORIGINAL_WORKBOOK = Path.home() / "tmp" / "qcraft-audit" / "qcraft-toolv10.xlsx"
# A copy outside the Office sandbox container. The earlier verify scripts copied
# into ~/Library/Group Containers/UBF8T346G9.Office, which on this machine now
# raises a macOS data-access prompt that blocks every process touching it. Opening
# the copy through LaunchServices (`open -a`) grants Excel access to the file
# without a dialog, and xlwings then attaches to the open workbook by name.
WORK_DIR = Path.home() / "tmp" / "qcraft-audit" / "edges"
WORKBOOK = WORK_DIR / "Q-CRAFT-cc26-edges.xlsx"

# Baseline!row 12 is labour productivity growth; the Turning Point case needs it.
BASELINE_READ = {**BASELINE_ROWS, "productivity_growth_percent": 12}
SCENARIO_READ = dict(SCENARIO_ROWS)
SHEETS = {
    "Paris": "Paris",
    "Moderate": "Moderate",
    "Hot": "Hot",
    "Hot_Adapted": "Hot Adapted",
    "Hot_Unadapted": "Hot Unadapted",
    "High": "High",
}
YEARS = list(range(2030, 2100))

# The Dashboard dropdown carries the guide's footnote marker on one option
# (Interest Rate!A19 = "Real interest rate (a)"); the engine's enum does not.
# Writing the bare string matches nothing and leaves the whole rate row blank.
DASHBOARD_TEXT = {"Real interest rate": "Real interest rate (a)"}

EXCEL_DEFAULTS = {
    "demography_variant": "Medium",
    "productivity_start": 5.0,
    "productivity_end": 1.2,
    "inflation_start": 3.5,
    "inflation_end": 3.5,
    "interest_rate_mode": "Nominal interest rate",
    "real_interest_rate": 1.0,
    "fiscal_rule": "Yes",
    "debt_target": 60.0,
    "expenditure_rigidity": 1.0,
}

# Every case starts from EXCEL_DEFAULTS and changes only what it lists.
CASES: dict[str, dict] = {
    "real_rate_2p5": {
        "iso3c": "UGA",
        "params": {
            "interest_rate_mode": "Real interest rate",
            "real_interest_rate": 2.5,
        },
        "turning_point": 15,
        "why": "Dashboard!C28 = Real interest rate, C29 = 2.5 (audit A, F1)",
    },
    "turning_point_10": {
        "iso3c": "UGA",
        "params": {},
        "turning_point": 10,
        "why": "Productivity!J21 = 10 (audit A, F5)",
    },
    "target_0_rule_yes": {
        "iso3c": "UGA",
        "params": {"debt_target": 0.0, "fiscal_rule": "Yes"},
        "turning_point": 15,
        "why": "Dashboard!C34 = 0 with C33 = Yes: Baseline!CL47/CL48 disable the rule "
        "(audit A, F3a)",
    },
    "floor_bound_rule_yes": {
        "iso3c": "MOZ",
        "params": {"debt_target": 5.0, "fiscal_rule": "Yes"},
        "turning_point": 15,
        "why": "Mozambique, C33 = Yes, C34 = 5: baseline debt sits on the zero floor "
        "from 2038, so Baseline!CL46 reads flat (0) and the rule gives 0 "
        "(audit A, F3b)",
    },
    "floor_bound_rule_no": {
        "iso3c": "ARE",
        "params": {"fiscal_rule": "No", "debt_target": 0.0},
        "turning_point": 15,
        "why": "United Arab Emirates, C33 = No, C34 = 0 (the guide's starting "
        "posture): baseline debt floors at zero from 2035",
    },
    "igd_mode": {
        "iso3c": "UGA",
        "params": {"interest_rate_mode": "Interest-growth differential"},
        "turning_point": 15,
        "why": "Dashboard!C28 = Interest-growth differential (audit A, untested list "
        "item 1)",
    },
    "rigidity_0": {
        "iso3c": "UGA",
        "params": {"expenditure_rigidity": 0.0},
        "turning_point": 15,
        "why": "Dashboard!C38 = 0 (audit A, untested list item 6)",
    },
}


def wait_for_recalc(ws_baseline, timeout=120) -> bool:
    sentinels = [
        (BASELINE_ROWS["debt_to_gdp"], year_to_col(2050)),
        (BASELINE_ROWS["nominal_gdp"], year_to_col(2099)),
    ]
    last = None
    stable = 0
    start = time.time()
    while time.time() - start < timeout:
        vals = [ws_baseline.range((r, c)).value for r, c in sentinels]
        ok = all(isinstance(v, (int, float)) and not isinstance(v, bool) for v in vals)
        if ok and vals == last:
            stable += 1
            if stable >= 3:
                return True
        else:
            stable = 0
        last = vals
        time.sleep(0.5)
    return False


def read_rows(ws, rows: dict[str, int]) -> dict[str, list]:
    c0, c1 = year_to_col(YEARS[0]), year_to_col(YEARS[-1])
    out = {}
    for metric, row in rows.items():
        vals = ws.range((row, c0), (row, c1)).value
        out[metric] = [
            v if isinstance(v, (int, float)) and not isinstance(v, bool) else ""
            for v in vals
        ]
    return out


def run_case(wb, label: str, case: dict) -> Path:
    dash = wb.sheets["Dashboard"]
    prod = wb.sheets["Productivity"]
    base = wb.sheets["Baseline"]

    params = {**EXCEL_DEFAULTS, **case["params"]}
    dash[DASHBOARD_CELLS["country_selector"]].value = NAME_MAP[case["iso3c"]]
    for key, cell in DASHBOARD_CELLS.items():
        if key == "country_selector":
            continue
        dash[cell].value = DASHBOARD_TEXT.get(params[key], params[key])
    prod["J21"].value = case["turning_point"]
    wb.app.calculate()
    time.sleep(2)
    wb.app.calculate()
    if not wait_for_recalc(base):
        raise RuntimeError(f"{label}: Excel did not settle")

    columns = ["scenario", "year", *BASELINE_READ.keys()]
    rows = []
    b = read_rows(base, BASELINE_READ)
    for i, year in enumerate(YEARS):
        rows.append(["Baseline", year, *[b[m][i] for m in BASELINE_READ]])
    for key, sheet in SHEETS.items():
        s = read_rows(wb.sheets[sheet], SCENARIO_READ)
        for i, year in enumerate(YEARS):
            rows.append(
                [key, year, *[s.get(m, [""] * len(YEARS))[i] for m in BASELINE_READ]]
            )

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / f"{label}.csv"
    with path.open("w", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(columns)
        for r in rows:
            w.writerow([f"{v:.15g}" if isinstance(v, float) else v for v in r])
    # Leave the workbook as the next case expects it.
    prod["J21"].value = 15
    return path


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("labels", nargs="*")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()
    labels = args.labels or list(CASES)
    todo = [lb for lb in labels if args.force or not (OUT_DIR / f"{lb}.csv").exists()]
    if not todo:
        print("nothing to do")
        return 0

    wb = attach_workbook()
    wb.app.display_alerts = False
    for label in todo:
        t0 = time.time()
        path = run_case(wb, label, CASES[label])
        print(
            f"{label}: wrote {path.relative_to(PROJECT_ROOT)} "
            f"in {time.time() - t0:.0f}s",
            flush=True,
        )
    wb.close()
    return 0


def attach_workbook():
    """Attach to the working copy, opening it through LaunchServices if needed."""
    if not WORKBOOK.exists():
        WORK_DIR.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ORIGINAL_WORKBOOK, WORKBOOK)
        subprocess.run(["xattr", "-c", str(WORKBOOK)], check=False)
    for _ in range(60):
        try:
            return xw.books[WORKBOOK.name]
        except Exception:
            pass
        subprocess.run(["open", "-a", "Microsoft Excel", str(WORKBOOK)], check=False)
        time.sleep(3)
    raise RuntimeError(f"Excel did not open {WORKBOOK}")


if __name__ == "__main__":
    sys.exit(main())
