"""Rebuild Current from exact cached WEO bytes and retained input slices, offline.

Run from the repo: PYTHONPATH=packages/qcraft-engine/src:pipeline/src .venv/bin/python
-m qcraft_pipeline.full_horizon. Existing vintage directories are read-only inputs.
"""

import argparse
import csv
import hashlib
import json
from pathlib import Path

from qcraft_engine.horizon import resolve_horizon
from qcraft_pipeline import config, emit, weo

REVISION = "weo-2026-04-full-horizon-v1"
POLICY = "current-full-weo-v1"


def canonical(payload):
    """Sorted object keys, ordered arrays, compact Python JSON, ASCII, finite numbers."""
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=config.vintage_dir(REVISION))
    parser.add_argument("--countries", nargs="*")
    args = parser.parse_args(argv)
    root = config.repo_root()
    base = config.vintage_dir(config.VINTAGE_ID)
    out = args.out.resolve()
    if out == base.resolve() or out == config.vintage_dir(config.BASE_VINTAGE_ID).resolve():
        raise ValueError("Existing Current and Verified vintages are immutable inputs.")
    if not out.is_relative_to(root):
        raise ValueError("Output must remain inside this isolated repository.")
    manifest = json.loads((base / "manifest.json").read_text())
    paths = {}
    for key in ("weo", "weo_countries"):
        receipt = manifest["raw_inputs"][key]
        path = config.cache_dir() / receipt["file"]
        if path.stat().st_size != receipt["bytes"] or sha(path) != receipt["sha256"]:
            raise ValueError(f"Raw input identity mismatch: {key}")
        paths[key] = path
    with paths["weo"].open(newline="") as stream:
        release_end = max(int(r["TIME_PERIOD"]) for r in csv.DictReader(stream) if r["OBS_VALUE"].strip())
    index = json.loads((base / "json/index.json").read_text())
    names = {r["iso3c"]: r["country"] for r in index["countries"]}
    macro = emit.normalise_non_finite(weo.build_macrofiscal(paths["weo"], paths["weo_countries"], names, year_max=release_end))
    by_country = {}
    for row in macro.to_dicts():
        by_country.setdefault(row["iso3c"], []).append(row)
    selected = [r for r in index["countries"] if not args.countries or r["iso3c"] in args.countries]
    json_dir = out / "json"
    json_dir.mkdir(parents=True, exist_ok=True)
    coverage = []
    for entry in selected:
        iso = entry["iso3c"]
        source = base / "json" / f"{iso}.json"
        payload = json.loads(source.read_text())
        payload["macrofiscal"] = by_country[iso]
        for row in payload["macrofiscal"]:
            row["country"] = payload["country"]
        identity = hashlib.sha256(canonical(payload)).hexdigest()
        h = resolve_horizon(payload)
        if h["coverageStatus"] == "full" and h["weoMaxYear"] < release_end:
            h["coverageStatus"] = "shorter"
            h["coverageReason"] = f"Country WEO inputs end at {h['weoMaxYear']}; this release extends to {release_end} for other countries."
        h = {"id": POLICY, "dataRevision": REVISION, "sourceVintage": config.VINTAGE_ID,
             **h, "inputSha256": identity}
        payload["horizonPolicy"] = h
        (json_dir / f"{iso}.json").write_bytes(canonical(payload) + b"\n")
        coverage.append({"iso3c": iso, "country": payload["country"], **h,
                         "retainedInputPayloadSha256": sha(source)})
    index.update({"dataRevision": REVISION, "calculationPolicy": POLICY,
                  "releaseWeoMaxYear": release_end, "count": len(selected), "countries": selected})
    (json_dir / "index.json").write_bytes(canonical(index) + b"\n")
    manifest.update({"dataRevision": REVISION, "calculationPolicy": POLICY,
                     "generated_utc": None, "rebuild": "python -m qcraft_pipeline.full_horizon (offline)",
                     "macrofiscal_year_max": release_end,
                     "macrofiscal_year_max_note": "Complete cached WEO release; country usable horizon checked explicitly. Baseline assumptions and incremental climate comparisons begin H+1; climate calendar unchanged, anchored at H; no catch-up.",
                     "retainedInputs": "Demography, productivity and climate arrays copied without numeric changes from each old Current JSON payload; old folders unchanged.",
                     "inputHashDefinition": "SHA-256 of UTF-8 Python 3.12 json.dumps(raw payload excluding horizonPolicy, sort_keys=True, separators=(',', ':'), allow_nan=False, ensure_ascii=True), no newline. Raw payload includes country identity and four ordered input arrays.",
                     "coverage": coverage})
    # Old Parquet dimensions are historical, not a description of the new JSON revision.
    manifest.pop("datasets", None)
    manifest["country_json"] = {"files": len(selected), "bytes": sum(p.stat().st_size for p in json_dir.glob("*.json"))}
    manifest["selectable_countries"] = len(selected)
    manifest["coveragePolicy"] = "Use the contiguous complete 2009..H macro/fiscal window. Preserve later incomplete source rows. Missing history, WDI bridge or calendar climate index blocks the calculation; a shorter usable horizon is disclosed. Undefined effective rates on zero debt retain the legacy carry/zero treatment."
    (out / "manifest.json").write_bytes(canonical(manifest) + b"\n")
    print(json.dumps({"revision": REVISION, "releaseWeoMaxYear": release_end, "countries": len(selected),
                      "coverage": {s: sum(r['coverageStatus'] == s for r in coverage) for s in ('full','shorter','unsupported')}}, indent=2))


if __name__ == "__main__":
    main()
