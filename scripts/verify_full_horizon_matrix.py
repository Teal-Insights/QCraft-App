"""Check every retained Current country against Python and TypeScript, offline."""

import hashlib
import json
import math
import subprocess
from pathlib import Path

import polars as pl
from qcraft_engine.data_loader import run_pipeline

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / ".work/engine"
NEW = ROOT / "data/vintages/weo-2026-04-full-horizon-v1"


def tree_hashes(path):
    return {
        str(p.relative_to(path)): hashlib.sha256(p.read_bytes()).hexdigest()
        for p in sorted(path.rglob("*"))
        if p.is_file()
    }


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    node = r"""
import { readFileSync, writeFileSync } from 'node:fs';
import { runPipeline, resolveHorizon } from './packages/qcraft-engine-ts/dist/index.js';
const root='data/vintages/weo-2026-04-full-horizon-v1/json/';
const index=JSON.parse(readFileSync(root+'index.json'));
const all={};
for (const {iso3c} of index.countries) {
  const input=JSON.parse(readFileSync(root+iso3c+'.json'));
  try {
    const result=runPipeline(input);
    all[iso3c]={ok:true,result,horizon:resolveHorizon(input)};
  }
  catch(error) {
    all[iso3c]={ok:false,error:error.message,horizon:resolveHorizon(input)};
  }
}
writeFileSync('.work/engine/current-typescript.json',JSON.stringify(all)+'\n');
"""
    subprocess.run(["node", "--input-type=module", "-e", node], cwd=ROOT, check=True)
    ts = json.loads((OUT / "current-typescript.json").read_text())
    index = json.loads((NEW / "json/index.json").read_text())
    evidence = []
    checked = 0
    worst = {"relativeDifference": 0.0}
    for entry in index["countries"]:
        iso = entry["iso3c"]
        payload = json.loads((NEW / "json" / f"{iso}.json").read_text())
        raw = {k: v for k, v in payload.items() if k != "horizonPolicy"}
        canonical = json.dumps(
            raw, sort_keys=True, separators=(",", ":"), allow_nan=False
        ).encode()
        assert (
            hashlib.sha256(canonical).hexdigest()
            == payload["horizonPolicy"]["inputSha256"]
        )
        old = json.loads(
            (ROOT / "data/vintages/weo-2026-04/json" / f"{iso}.json").read_text()
        )
        for key in ("demography", "productivity", "climate"):
            assert payload[key] == old[key], (iso, key, "retained input changed")
        try:
            data = {
                k: pl.DataFrame(payload[k])
                for k in ("macrofiscal", "demography", "productivity", "climate")
            }
            py = run_pipeline(data, iso, calculation_policy="current-full-weo-v1")
        except (ValueError, KeyError) as error:
            assert payload["horizonPolicy"]["coverageStatus"] == "unsupported", (
                iso,
                "unexpected Python failure",
                str(error),
            )
            assert not ts[iso]["ok"], (iso, "runtime disagreement")
            evidence.append(
                {"iso3c": iso, "status": "unsupported", "reason": str(error)}
            )
            continue
        assert payload["horizonPolicy"]["coverageStatus"] != "unsupported", (
            iso,
            "declared unsupported but calculated",
        )
        assert ts[iso]["ok"], (iso, ts[iso])
        for module, frame in py.items():
            other = ts[iso]["result"].get(
                module, ts[iso]["result"]["climate"].get(module)
            )
            rows = frame.to_dicts()
            assert len(rows) == len(other), (iso, module, "row count")
            for a, b in zip(rows, other):
                assert a["years"] == b["years"], (iso, module, "year order")
                for key, value in a.items():
                    got = b[key]
                    if value is None or isinstance(value, str):
                        assert value == got, (iso, module, key, value, got)
                    else:
                        assert math.isfinite(value) and math.isfinite(got), (
                            iso,
                            module,
                            key,
                            "nonfinite",
                        )
                        delta = abs(value - got) / max(1, abs(value), abs(got))
                        assert delta <= 2e-10, (
                            iso,
                            module,
                            a["years"],
                            key,
                            value,
                            got,
                        )
                        checked += 1
                        if delta > worst["relativeDifference"]:
                            worst = {
                                "relativeDifference": delta,
                                "iso3c": iso,
                                "module": module,
                                "year": a["years"],
                                "field": key,
                                "python": value,
                                "typescript": got,
                            }
        evidence.append(
            {"iso3c": iso, "status": "pass", "horizon": payload["horizonPolicy"]}
        )
    old_bytes = {
        v: tree_hashes(ROOT / "data/vintages" / v)
        for v in ("weo-2024-10", "weo-2026-04")
    }
    # Compare exact file bytes to the accepted source lane, not just decoded values.
    for vintage, hashes in old_bytes.items():
        accepted = ROOT.parent / "cc29-release/data/vintages" / vintage
        assert hashes == tree_hashes(accepted), (vintage, "old source bytes changed")
    receipt = {
        "status": "PASS",
        "retainedCountries": len(evidence),
        "computed": sum(e["status"] == "pass" for e in evidence),
        "unsupported": sum(e["status"] == "unsupported" for e in evidence),
        "numericCellsCompared": checked,
        "worst": worst,
        "oldVintageFileHashes": old_bytes,
        "countries": evidence,
    }
    (OUT / "all-country-agreement.json").write_text(
        json.dumps(receipt, indent=2) + "\n"
    )
    print(
        json.dumps(
            {
                k: v
                for k, v in receipt.items()
                if k not in ("countries", "oldVintageFileHashes")
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
