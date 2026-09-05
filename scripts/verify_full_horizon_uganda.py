"""Independent raw-CSV arithmetic for the Uganda 2031/2032 transition.

Expected values use raw WEO cells, retained UN/climate inputs and explicit equations;
no production helper calculates an expected value. Outputs are review receipts.
"""

import argparse
import csv
import hashlib
import json
import math
from pathlib import Path

import polars as pl
from qcraft_engine.constants import DEFAULTS
from qcraft_engine.data_loader import run_pipeline

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / ".work/engine"
INPUT = OUT / "uga-input/json/UGA.json"
RAW = ROOT / "pipeline/.cache/raw/weo_apr2026_raw.csv"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--debt-target", type=float)
    args = parser.parse_args()
    p = {
        **DEFAULTS,
        **({"debt_target": args.debt_target} if args.debt_target is not None else {}),
    }
    prefix = (
        "uganda" if args.debt_target is None else f"uganda-target{args.debt_target:g}"
    )
    payload = json.loads(INPUT.read_text())
    data = {
        k: pl.DataFrame(payload[k])
        for k in ("macrofiscal", "demography", "productivity", "climate")
    }
    result = run_pipeline(data, "UGA", p, calculation_policy="current-full-weo-v1")
    actual = {
        k: {r["years"]: r for r in frame.to_dicts()} for k, frame in result.items()
    }
    raw = {}
    with RAW.open(newline="") as f:
        for row in csv.DictReader(f):
            if row["COUNTRY"] == "UGA" and row["OBS_VALUE"].strip():
                raw.setdefault(int(row["TIME_PERIOD"]), {})[row["INDICATOR"]] = float(
                    row["OBS_VALUE"]
                )
    checks = []

    def check(label, expected, got):
        if not math.isclose(expected, got, rel_tol=2e-12, abs_tol=1e-8):
            raise AssertionError(f"{label}: expected {expected}, got {got}")
        checks.append({"check": label, "expected": expected, "actual": got})

    macro = {}
    for y in range(2009, 2032):
        r = raw[y]
        gdp, real, revenue, expenditure, pb, debt = [
            r[k] / 1e9 for k in ("NGDP", "NGDP_R", "GGR", "GGX", "GGXONLB", "GGXWDG")
        ]
        pexp = revenue - pb
        interest = expenditure - pexp
        m = {
            "nominal_gdp": gdp,
            "real_gdp": real,
            "revenue": revenue,
            "primary_expenditure": pexp,
            "primary_balance": pb,
            "debt": debt,
            "debt_to_gdp": debt / gdp * 100,
            "interest_expenditure": interest,
            "total_expenditure": expenditure,
            "overall_balance": r["GGXCNL"] / 1e9,
            "real_gdp_growth_percent": (r["NGDP_R"] / raw[y - 1]["NGDP_R"] - 1) * 100,
            "nominal_gdp_growth_percent": (r["NGDP"] / raw[y - 1]["NGDP"] - 1) * 100,
            "gdp_deflator_growth_percent": (r["NGDP_D"] / raw[y - 1]["NGDP_D"] - 1)
            * 100,
            "nominal_interest_rate": interest / debt * 100,
        }
        macro[y] = m
        for field, expected in m.items():
            module = (
                "baseline_v1"
                if field in actual["baseline_v1"][y]
                else "interest_rate"
                if field == "nominal_interest_rate"
                else "fiscal"
            )
            check(f"raw {y} {field}", expected, actual[module][y][field])

    pop = {
        (r["years"], r["age_group"]): r["values"]
        for r in payload["demography"]
        if r["status"] == "Medium"
    }
    for y in range(2023, 2032):
        employment = (pop[y, "15-64"] / pop[y - 1, "15-64"] - 1) * 100
        residual = (
            (1 + macro[y]["real_gdp_growth_percent"] / 100) / (1 + employment / 100) - 1
        ) * 100
        check(
            f"residual {y}",
            residual,
            actual["baseline_v1"][y]["labour_productivity_growth"],
        )

    def logistic(start, end, tp):
        return start + (end - start) * (1 / (1 + math.exp(-0.5 * (1 - tp)))) ** 0.5

    prod = logistic(
        p["productivity_start"], p["productivity_end"], p["productivity_turning_point"]
    )
    inflation = logistic(p["inflation_start"], p["inflation_end"], 5)
    emp = (pop[2032, "15-64"] / pop[2031, "15-64"] - 1) * 100
    total = (pop[2032, "Total"] / pop[2031, "Total"] - 1) * 100
    real_factor = (1 + emp / 100) * (1 + prod / 100)
    nom_factor = real_factor * (1 + inflation / 100)
    old = macro[2031]
    rate = old["nominal_interest_rate"]
    prior_debt_ratio = macro[2030]["debt_to_gdp"]
    dspb = (
        prior_debt_ratio
        * (rate - old["nominal_gdp_growth_percent"])
        / 100
        / (1 + old["nominal_gdp_growth_percent"] / 100)
    )
    gap = old["primary_balance"] - dspb / 100 * old["nominal_gdp"]
    rising = old["debt_to_gdp"] > prior_debt_ratio
    falling = old["debt_to_gdp"] < prior_debt_ratio
    adjustment = (
        gap
        if p["fiscal_rule"] == "Yes"
        and p["debt_target"] != 0
        and (
            (rising and old["debt_to_gdp"] > p["debt_target"])
            or (falling and old["debt_to_gdp"] < p["debt_target"])
        )
        else 0
    )
    ngdp = old["nominal_gdp"] * nom_factor
    rev = old["revenue"] * nom_factor
    pexp = (
        old["primary_expenditure"]
        * (1 + prod / 100)
        * (1 + inflation / 100)
        * (1 + total / 100)
        + adjustment
    )
    debt_ratio = max(
        0,
        old["debt_to_gdp"] * (1 + rate / 100) / nom_factor - (rev - pexp) / ngdp * 100,
    )
    first_baseline = {
        "labour_productivity_growth": prod,
        "employment_growth": emp,
        "gdp_deflator_growth_percent": inflation,
        "real_gdp": old["real_gdp"] * real_factor,
        "nominal_gdp": ngdp,
        "revenue": rev,
        "primary_expenditure": pexp,
        "primary_balance": rev - pexp,
        "debt_to_gdp": debt_ratio,
        "debt": debt_ratio / 100 * ngdp,
        "interest_expenditure": old["debt"] * rate / 100,
    }
    for field, expected in first_baseline.items():
        module = "baseline_v1" if field in actual["baseline_v1"][2032] else "fiscal"
        check(f"first baseline 2032 {field}", expected, actual[module][2032][field])
    loss = {
        (r["climate_scenario"], r["years"]): r["gdp_loss_percent"]
        for r in payload["climate"]
    }
    first_scenarios = {}
    for scenario in result.keys() - {
        "demography",
        "productivity",
        "inflation",
        "baseline_v1",
        "interest_rate",
        "fiscal",
    }:
        variation = (
            (100 + loss[scenario, 2032]) / (100 + loss[scenario, 2031]) - 1
        ) * 100
        rg = (1 + emp / 100) * (1 + (prod + variation) / 100)
        ng = rg * (1 + inflation / 100)
        sgdp = old["nominal_gdp"] * ng
        sr = rev / ngdp * sgdp
        se = pexp - (1 - p["expenditure_rigidity"]) * (pexp - pexp / ngdp * sgdp)
        sd = old["debt_to_gdp"] * (1 + rate / 100) / ng - (sr - se) / sgdp * 100
        expected = {
            "real_gdp": old["real_gdp"] * rg,
            "nominal_gdp": sgdp,
            "revenue": sr,
            "primary_expenditure": se,
            "primary_balance": sr - se,
            "debt_to_gdp": sd,
            "debt": sd / 100 * sgdp,
            "labour_productivity_growth": prod + variation,
            "interest_expenditure": old["debt"] * rate / 100,
        }
        first_scenarios[scenario] = {"calendarShock2032": variation, **expected}
        for field, value in expected.items():
            check(
                f"{scenario} first 2032 {field}", value, actual[scenario][2032][field]
            )
        for y in (2029, 2030, 2031):
            for field in (
                "nominal_gdp",
                "real_gdp",
                "revenue",
                "primary_expenditure",
                "debt",
                "debt_to_gdp",
            ):
                check(
                    f"{scenario} retains WEO {y} {field}",
                    macro[y][field],
                    actual[scenario][y][field],
                )
    OUT.mkdir(parents=True, exist_ok=True)
    with (OUT / f"{prefix}-2028-2033.csv").open("w", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "year",
                "period",
                "source_nominal_gdp",
                "engine_nominal_gdp",
                "source_debt",
                "engine_debt",
                "productivity_growth",
                "climate_start_year",
            ],
        )
        writer.writeheader()
        for y in range(2028, 2034):
            writer.writerow(
                {
                    "year": y,
                    "period": "WEO input" if y <= 2031 else "long-run projection",
                    "source_nominal_gdp": macro.get(y, {}).get("nominal_gdp"),
                    "engine_nominal_gdp": actual["baseline_v1"][y]["nominal_gdp"],
                    "source_debt": macro.get(y, {}).get("debt"),
                    "engine_debt": actual["fiscal"][y]["debt"],
                    "productivity_growth": actual["baseline_v1"][y][
                        "labour_productivity_growth"
                    ],
                    "climate_start_year": 2032,
                }
            )
    (OUT / f"{prefix}-raw-proof.json").write_text(
        json.dumps(
            {
                "status": "PASS",
                "params": p,
                "rawSha256": hashlib.sha256(RAW.read_bytes()).hexdigest(),
                "inputPolicy": payload["horizonPolicy"],
                "assertions": len(checks),
                "firstBaseline2032": first_baseline,
                "fiscalRuleAdjustment2031": adjustment,
                "firstClimate2032": first_scenarios,
                "checks": checks,
            },
            indent=2,
        )
        + "\n"
    )
    (OUT / f"{prefix}-python.json").write_text(
        json.dumps({k: v.to_dicts() for k, v in result.items()}, allow_nan=False) + "\n"
    )
    print(
        json.dumps(
            {
                "status": "PASS",
                "assertions": len(checks),
                "weoEnd": 2031,
                "firstProjection": 2032,
                "firstBaseline2032": first_baseline,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
