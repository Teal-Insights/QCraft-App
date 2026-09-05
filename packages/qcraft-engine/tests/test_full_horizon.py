"""New Current arithmetic fixtures, separate from unchanged official golden masters."""

import csv
import json
from pathlib import Path

import polars as pl
import pytest
from qcraft_engine.data_loader import run_pipeline
from qcraft_engine.horizon import resolve_horizon

FIXTURES = Path(__file__).resolve().parents[2] / "qcraft-engine-ts/tests/fixtures"


def load():
    payload = json.loads((FIXTURES / "UGA-full-horizon.json").read_text())
    return payload, {
        k: pl.DataFrame(payload[k])
        for k in ("macrofiscal", "demography", "productivity", "climate")
    }


@pytest.mark.parametrize(
    "target,filename",
    [(None, "UGA-full-horizon-first-year.csv"), (60, "UGA-full-horizon-target60.csv")],
)
def test_independent_first_year(target, filename):
    payload, data = load()
    result = run_pipeline(
        data,
        "UGA",
        {"debt_target": target} if target is not None else None,
        calculation_policy="current-full-weo-v1",
    )
    year = payload["horizonPolicy"]["projectionStartYear"]
    actual = {k: {r["years"]: r for r in v.to_dicts()} for k, v in result.items()}
    with (FIXTURES / filename).open(newline="") as f:
        for row in csv.DictReader(f):
            field = row["field"]
            if field == "calendarShock2032":
                continue
            scenario = row.get("scenario", "Baseline")
            if scenario == "Baseline":
                merged = {**actual["baseline_v1"][year], **actual["fiscal"][year]}
            else:
                merged = actual[scenario][year]
            assert merged[field] == pytest.approx(
                float(row["value"]), rel=2e-12, abs=1e-8
            )


def test_explicit_all_zero_boundary_preserves_weo_debt():
    payload, data = load()
    rows = [{**r, "gdp_loss_percent": 0.0} for r in payload["climate"]]
    data["climate"] = pl.DataFrame(rows)
    out = run_pipeline(data, "UGA", calculation_policy="current-full-weo-v1")
    baseline = {r["years"]: r for r in out["fiscal"].to_dicts()}
    for row in out["Paris"].to_dicts():
        if row["years"] <= payload["horizonPolicy"]["weoMaxYear"]:
            assert row["debt"] == baseline[row["years"]]["debt"]


def test_incomplete_source_window_is_explicit():
    payload, _ = load()
    last = max(r["years"] for r in payload["macrofiscal"])
    next(r for r in payload["macrofiscal"] if r["years"] == last)["debt"] = None
    h = resolve_horizon(payload)
    assert h["coverageStatus"] == "shorter"
    assert h["weoMaxYear"] == last - 1
    assert "debt" in h["coverageReason"]
    assert max(r["years"] for r in payload["macrofiscal"]) == last
