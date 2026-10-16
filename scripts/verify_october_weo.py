"""Compare October Current inputs across both unchanged engines, offline.

The independent Uganda raw-cell arithmetic remains in the previously reviewed
verify_full_horizon_uganda.py. This runner changes its inputs, not its equations.
"""

import argparse
import hashlib
import importlib.util
import json
import math
import subprocess
import sys
from pathlib import Path

import polars as pl
from qcraft_engine.data_loader import run_pipeline

ROOT = Path(__file__).resolve().parents[1]
REVISION = "weo-2026-10-full-horizon-v1"
RETAINED = "weo-2026-04-full-horizon-v1"

NODE = r"""
import { readFileSync, appendFileSync, writeFileSync } from 'node:fs';
import { runPipeline, resolveHorizon } from './packages/qcraft-engine-ts/dist/index.js';
const [root,out]=process.argv.slice(1);
const index=JSON.parse(readFileSync(root+'/index.json','utf8'));
writeFileSync(out,'');
const finite=(value)=>{
  if(typeof value==='number'&&!Number.isFinite(value)){
    throw new Error('Nonfinite engine output');
  }
  if(value&&typeof value==='object'){
    for(const child of Object.values(value))finite(child);
  }
};
for(const {iso3c} of index.countries){
  const input=JSON.parse(readFileSync(root+'/'+iso3c+'.json','utf8'));
  let item;
  try{
    const result=runPipeline(input);
    finite(result);
    item={iso3c,ok:true,result,horizon:resolveHorizon(input)};
  }catch(error){
    item={iso3c,ok:false,error:error.message,horizon:resolveHorizon(input)};
  }
  appendFileSync(out,JSON.stringify(item)+'\n');
}
"""


def canonical(value):
    return json.dumps(
        value, sort_keys=True, separators=(",", ":"), allow_nan=False
    ).encode()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--out", type=Path, default=ROOT / "artifacts/october-validation"
    )
    parser.add_argument("--raw-csv", type=Path, required=True)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    data_dir = ROOT / "data/vintages" / REVISION / "json"
    ts_path = args.out / "typescript.ndjson"
    subprocess.run(
        ["node", "--input-type=module", "-e", NODE, str(data_dir), str(ts_path)],
        cwd=ROOT,
        check=True,
    )
    index = json.loads((data_dir / "index.json").read_text())
    expected_order = [entry["iso3c"] for entry in index["countries"]]
    evidence = []
    checked = 0
    worst = {"relativeDifference": 0.0}
    identity_keys = {
        "iso3c",
        "country",
        "macrofiscal",
        "demography",
        "productivity",
        "climate",
    }
    with ts_path.open() as stream:
        for line in stream:
            ts = json.loads(line)
            iso = ts["iso3c"]
            assert iso == expected_order[len(evidence)], (
                iso,
                "country inventory/order",
            )
            payload = json.loads((data_dir / f"{iso}.json").read_text())
            assert set(payload) == identity_keys | {"horizonPolicy"}
            body = {key: payload[key] for key in identity_keys}
            assert (
                hashlib.sha256(canonical(body)).hexdigest()
                == payload["horizonPolicy"]["inputSha256"]
            ), (iso, "input hash")
            old = json.loads(
                (ROOT / "data/vintages" / RETAINED / "json" / f"{iso}.json").read_text()
            )
            for key in ("demography", "productivity", "climate"):
                assert canonical(payload[key]) == canonical(old[key]), (iso, key)
            assert [row["years"] for row in payload["macrofiscal"]] == list(
                range(2001, 2032)
            ), (iso, "dense year grid")
            policy = payload["horizonPolicy"]
            assert policy["id"] == "current-full-weo-v1"
            assert policy["dataRevision"] == REVISION
            assert policy["sourceVintage"] == "weo-2026-10"
            js_horizon = dict(ts["horizon"])
            if (
                js_horizon["coverageStatus"] == "full"
                and js_horizon["weoMaxYear"] < 2031
            ):
                js_horizon["coverageStatus"] = "shorter"
                js_horizon["coverageReason"] = (
                    f"Country WEO inputs end at {js_horizon['weoMaxYear']}; "
                    "this release extends to 2031 for other countries."
                )
            for key in ("coverageStatus", "coverageReason"):
                assert policy[key] == js_horizon[key], (iso, key)
            for key in (
                "sourceWeoMaxYear",
                "weoMaxYear",
                "projectionStartYear",
                "climateStartYear",
                "climateAnchorYear",
                "wdiLastYear",
            ):
                assert payload["horizonPolicy"][key] == ts["horizon"][key], (iso, key)
            try:
                frames = {
                    key: pl.DataFrame(payload[key])
                    for key in ("macrofiscal", "demography", "productivity", "climate")
                }
                py = run_pipeline(frames, iso, calculation_policy="current-full-weo-v1")
            except (ValueError, KeyError) as error:
                assert payload["horizonPolicy"]["coverageStatus"] == "unsupported"
                assert not ts["ok"], (iso, "engine support disagreement")
                evidence.append(
                    {"iso3c": iso, "status": "unsupported", "reason": str(error)}
                )
                continue
            assert payload["horizonPolicy"]["coverageStatus"] != "unsupported"
            assert ts["ok"], (iso, ts.get("error"))
            for module, frame in py.items():
                other = ts["result"].get(module, ts["result"]["climate"].get(module))
                rows = frame.to_dicts()
                assert len(rows) == len(other), (iso, module, "rows")
                for py_row, ts_row in zip(rows, other):
                    assert py_row["years"] == ts_row["years"], (iso, module, "year")
                    assert set(py_row) == set(ts_row), (iso, module, "columns")
                    for field, value in py_row.items():
                        got = ts_row[field]
                        if value is None or isinstance(value, str):
                            assert value == got, (iso, module, field, value, got)
                            continue
                        assert math.isfinite(value) and isinstance(got, (int, float))
                        assert math.isfinite(got), (iso, module, field, "nonfinite")
                        delta = abs(value - got) / max(1, abs(value), abs(got))
                        assert delta <= 2e-10, (
                            iso,
                            module,
                            py_row["years"],
                            field,
                            value,
                            got,
                        )
                        checked += 1
                        if delta > worst["relativeDifference"]:
                            worst = {
                                "relativeDifference": delta,
                                "iso3c": iso,
                                "module": module,
                                "year": py_row["years"],
                                "field": field,
                                "python": value,
                                "typescript": got,
                            }
            evidence.append({"iso3c": iso, "status": "pass"})
    assert len(evidence) == len(expected_order), "Missing country results"
    receipt = {
        "status": "PASS",
        "revision": REVISION,
        "countries": len(evidence),
        "computed": sum(row["status"] == "pass" for row in evidence),
        "unsupported": sum(row["status"] == "unsupported" for row in evidence),
        "numericCellsCompared": checked,
        "worst": worst,
        "details": evidence,
    }
    (args.out / "all-country-agreement.json").write_text(
        json.dumps(receipt, indent=2) + "\n"
    )
    spec = importlib.util.spec_from_file_location(
        "reviewed_uganda_arithmetic", ROOT / "scripts/verify_full_horizon_uganda.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.INPUT = data_dir / "UGA.json"
    module.RAW = args.raw_csv
    module.OUT = args.out
    previous_argv = sys.argv
    try:
        for extra in ([], ["--debt-target", "60"]):
            sys.argv = ["verify_full_horizon_uganda.py", *extra]
            module.main()
    finally:
        sys.argv = previous_argv
    print(
        json.dumps({key: value for key, value in receipt.items() if key != "details"})
    )


if __name__ == "__main__":
    main()
