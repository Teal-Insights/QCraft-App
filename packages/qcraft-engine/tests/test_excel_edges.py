"""Excel golden masters for the parameter paths the 2026-09-02 audit found untested.

Each CSV in golden_masters/excel_edges/ was read out of Microsoft Excel running
the IMF Q-CRAFT workbook v1.0 (11-15-2024) with the Dashboard cells named in
the README beside it (scripts/verify/excel_edges.py wrote them). The engine is
run on the same country's frozen weo-2024-10 payload with the matching
parameters, and every metric the workbook exposes is compared year by year,
2030 to 2099, for the baseline and the six scenarios.

Expected values come only from the CSVs (AGENTS.md review rule 1). Tolerances
are the ones the 147-country breadth run met: ratios to 1e-6 of a percentage
point, levels to 1e-9 relative. CC-26, audit A findings F1, F3, F5, F7.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import polars as pl
import pytest
from qcraft_engine.data_loader import run_pipeline

HERE = Path(__file__).parent
EDGES = HERE / "golden_masters" / "excel_edges"
FIXTURES = HERE.parents[2] / "tests" / "fixtures" / "countries" / "weo-2024-10"

EXCEL_DEFAULTS = {
    "demography_variant": "Medium",
    "productivity_start": 5.0,
    "productivity_end": 1.2,
    "inflation_start": 3.5,
    "inflation_end": 3.5,
    "interest_rate_mode": "Nominal interest rate",
    "long_run_interest_rate": 1.0,
    "productivity_turning_point": 15,
    "debt_target": 60.0,
    "fiscal_rule": "Yes",
    "expenditure_rigidity": 1.0,
}

# label -> (iso3c, engine parameters). Mirrors CASES in scripts/verify/excel_edges.py.
CASES: dict[str, tuple[str, dict]] = {
    "real_rate_2p5": (
        "UGA",
        {"interest_rate_mode": "Real interest rate", "long_run_interest_rate": 2.5},
    ),
    "turning_point_10": ("UGA", {"productivity_turning_point": 10}),
    "target_0_rule_yes": ("UGA", {"debt_target": 0.0, "fiscal_rule": "Yes"}),
    "floor_bound_rule_yes": ("MOZ", {"debt_target": 5.0, "fiscal_rule": "Yes"}),
    "floor_bound_rule_no": ("ARE", {"fiscal_rule": "No", "debt_target": 0.0}),
    "igd_mode": ("UGA", {"interest_rate_mode": "Interest-growth differential"}),
    "rigidity_0": ("UGA", {"expenditure_rigidity": 0.0}),
}

RATIO_METRICS = {
    "debt_to_gdp": "debt_to_gdp",
    "revenue_percent_gdp": "revenue_percent_gdp",
    "primary_expenditure_percent_gdp": "primary_expenditure_percent_gdp",
    "primary_balance_percent_gdp": "primary_balance_percent_gdp",
    "overall_balance_percent_gdp": "overall_balance_percent_gdp",
    "interest_expenditure_percent_gdp": "interest_expenditure_percent_gdp",
}
LEVEL_METRICS = {"nominal_gdp": "nominal_gdp", "real_gdp": "real_gdp"}
RATE_METRICS = {
    "nominal_interest_rate": ("interest_rate", "nominal_interest_rate"),
    "real_gdp_growth_percent": ("baseline_v1", "real_gdp_growth_percent"),
    "nominal_gdp_growth_percent": ("baseline_v1", "nominal_gdp_growth_percent"),
    "productivity_growth_percent": ("baseline_v1", "labour_productivity_growth"),
}
SCENARIOS = ["Paris", "Moderate", "Hot", "Hot_Adapted", "Hot_Unadapted", "High"]
ABS_PP = 1e-6
REL_LEVEL = 1e-9

_NUMERIC = (
    "productivity_level",
    "real_gdp",
    "nominal_gdp",
    "gdp_deflator",
    "real_gdp_growth_percent",
    "nominal_gdp_growth_percent",
    "gdp_deflator_growth_percent",
    "revenue",
    "revenue_percent_gdp",
    "primary_expenditure",
    "primary_expenditure_percent_gdp",
    "primary_balance",
    "primary_balance_percent_gdp",
    "interest_expenditure",
    "interest_expenditure_percent_gdp",
    "total_expenditure",
    "overall_balance",
    "overall_balance_percent_gdp",
    "debt_to_gdp",
    "debt",
    "interest_rate_percent",
    "gdp_loss_percent",
    "population",
)


def load_country(iso3c: str) -> dict[str, pl.DataFrame]:
    raw = json.loads((FIXTURES / f"{iso3c}.json").read_text())
    data: dict[str, pl.DataFrame] = {}
    for name in ("demography", "productivity", "macrofiscal", "climate"):
        frame = pl.DataFrame(raw[name])
        casts = [
            pl.col(c).cast(pl.Float64)
            for c in _NUMERIC
            if c in frame.columns and frame.schema[c] == pl.Null
        ]
        data[name] = frame.with_columns(casts) if casts else frame
    return data


def golden(label: str) -> pl.DataFrame:
    path = EDGES / f"{label}.csv"
    if not path.exists():
        pytest.skip(f"{path.name} not written yet; run scripts/verify/excel_edges.py")
    return pl.read_csv(path, infer_schema_length=10000)


def _close(a: float, b: float, abs_tol: float, rel_tol: float) -> bool:
    return math.isclose(a, b, abs_tol=abs_tol, rel_tol=rel_tol)


def _compare(
    gold: pl.DataFrame,
    engine: pl.DataFrame,
    columns: dict[str, str],
    abs_tol: float,
    rel_tol: float,
    where: str,
) -> None:
    eng = engine.filter((pl.col("years") >= 2030) & (pl.col("years") <= 2099)).sort(
        "years"
    )
    assert eng["years"].to_list() == gold["year"].to_list(), where
    bad = []
    for excel_col, eng_col in columns.items():
        if excel_col not in gold.columns or gold[excel_col].null_count() == len(gold):
            continue
        for year, g, e in zip(gold["year"], gold[excel_col], eng[eng_col]):
            if g is None:
                continue
            if not _close(float(g), float(e), abs_tol, rel_tol):
                bad.append(f"{where} {excel_col} {year}: excel={g} engine={e}")
    assert not bad, "\n".join(bad[:10]) + (
        f"\n... {len(bad)} mismatches" if len(bad) > 10 else ""
    )


@pytest.mark.parametrize("label", list(CASES))
def test_baseline_matches_excel(label: str) -> None:
    iso3c, overrides = CASES[label]
    gold = golden(label).filter(pl.col("scenario") == "Baseline")
    result = run_pipeline(load_country(iso3c), iso3c, {**EXCEL_DEFAULTS, **overrides})
    _compare(gold, result["fiscal"], RATIO_METRICS, ABS_PP, 0.0, f"{label} baseline")
    _compare(
        gold, result["baseline_v1"], LEVEL_METRICS, 0.0, REL_LEVEL, f"{label} baseline"
    )
    for excel_col, (module, col) in RATE_METRICS.items():
        _compare(
            gold, result[module], {excel_col: col}, ABS_PP, 0.0, f"{label} baseline"
        )


@pytest.mark.parametrize("scenario", SCENARIOS)
@pytest.mark.parametrize("label", list(CASES))
def test_scenario_matches_excel(label: str, scenario: str) -> None:
    iso3c, overrides = CASES[label]
    gold = golden(label).filter(pl.col("scenario") == scenario)
    result = run_pipeline(load_country(iso3c), iso3c, {**EXCEL_DEFAULTS, **overrides})
    frame = result[scenario]
    _compare(gold, frame, RATIO_METRICS, ABS_PP, 0.0, f"{label} {scenario}")
    _compare(gold, frame, LEVEL_METRICS, 0.0, REL_LEVEL, f"{label} {scenario}")
    _compare(
        gold,
        frame,
        {
            "real_gdp_growth_percent": "real_gdp_growth_percent",
            "nominal_gdp_growth_percent": "nominal_gdp_growth_percent",
        },
        ABS_PP,
        0.0,
        f"{label} {scenario}",
    )
