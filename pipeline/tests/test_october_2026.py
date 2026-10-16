"""Source-ledger tests for the isolated October data revision, not engine goldens."""

import csv
import json
import math
from pathlib import Path

import pytest
from qcraft_pipeline import october_2026 as october

FIXTURES = Path(__file__).parent / "fixtures"
ROOT = october.config.repo_root()
SOURCE = october.RAW_CSV_PATH.parent


def rows(name):
    with (FIXTURES / name).open(newline="") as stream:
        return list(csv.DictReader(stream))


@pytest.fixture(scope="module")
def built(tmp_path_factory):
    parent = tmp_path_factory.mktemp("october-build")
    first, second = parent / "first", parent / "second"
    october.build(SOURCE, first)
    october.build(SOURCE, second)
    return first, second


def test_numeric_tokens_follow_explicit_source_grammar():
    for case in rows("october_numeric_tokens.csv"):
        if case["status"] == "error":
            with pytest.raises(ValueError):
                october.source_number(case["token"])
        elif case["status"] == "missing":
            assert october.source_number(case["token"]) is None
        else:
            assert october.source_number(case["token"]) == float(case["expected"])


def test_input_identity_excludes_only_inherited_horizon_metadata():
    old = ROOT / "data/vintages" / october.RETAINED_FROM / "json/UGA.json"
    inherited = json.loads(old.read_text())
    body = october.input_body(inherited)
    identity = october.input_hash(body)
    inherited["horizonPolicy"] = {"different": "metadata only"}
    assert october.input_hash(october.input_body(inherited)) == identity
    inherited["unexpected"] = "must not leak into identity"
    with pytest.raises(ValueError, match="Unexpected inherited"):
        october.input_body(inherited)
    body["horizonPolicy"] = {}
    with pytest.raises(ValueError, match="exactly six keys"):
        october.input_hash(body)


def test_clean_builds_are_byte_identical_and_old_vintages_are_unchanged(built):
    first, second = built

    def inventory(root):
        return {
            p.relative_to(root).as_posix(): p.read_bytes()
            for p in root.rglob("*")
            if p.is_file()
        }

    assert inventory(first) == inventory(second)
    for vintage, expected in october.OLD_TREES.items():
        assert october.tree_hash(ROOT / "data/vintages" / vintage) == expected
    manifest = json.loads((first / "manifest.json").read_text())
    assert manifest["generator"]["sha256"] == october.sha(Path(october.__file__))
    for relative, expected in manifest["generated_files_sha256"].items():
        assert october.sha(first / relative) == expected


def test_output_roster_sidecars_and_coverage_follow_reviewed_source_ledger(built):
    first, _ = built
    index = json.loads((first / "json/index.json").read_text())
    expected = {row["iso3c"]: row for row in rows("october_coverage.csv")}
    assert {p.stem for p in (first / "json").glob("*.json")} == set(expected) | {
        "index"
    }
    assert {row["iso3c"] for row in index["countries"]} == set(expected)
    manifest = json.loads((first / "manifest.json").read_text())
    for row in manifest["coverage"]:
        source = expected[row["iso3c"]]
        assert row["coverageStatus"] == source["coverageStatus"]
        for key in (
            "weoMaxYear",
            "projectionStartYear",
            "climateStartYear",
            "climateAnchorYear",
        ):
            assert row[key] == (int(source[key]) if source[key] else None)
    for row in rows("october_source_counts.csv"):
        ledger = json.loads((first / row["file"]).read_text())
        value = ledger
        for key in row["path"].split("."):
            value = value[key]
        assert str(value) == row["expected"]
    assert not (first / "json/source_metadata.json").exists()
    assert (first / "source_metadata.json").exists()


def test_retained_slices_verified_identities_and_six_key_hashes_are_preserved(built):
    first, _ = built
    index = json.loads((first / "json/index.json").read_text())
    previous = ROOT / "data/vintages" / october.RETAINED_FROM / "json"
    old_index = json.loads((previous / "index.json").read_text())
    assert index["verifiedInputHashes"] == old_index["verifiedInputHashes"]
    for entry in index["countries"]:
        iso = entry["iso3c"]
        old = json.loads((previous / f"{iso}.json").read_text())
        new = json.loads((first / "json" / f"{iso}.json").read_text())
        for key in ("demography", "productivity", "climate"):
            assert new[key] == old[key]
        assert set(new) == set(october.INPUT_KEYS) | {"horizonPolicy"}
        assert new["horizonPolicy"]["inputSha256"] == october.input_hash(
            october.input_body(new)
        )


def test_source_rows_and_independent_arithmetic_match_csv_evidence(built):
    first, _ = built
    for case in rows("october_macro_oracle.csv"):
        payload = json.loads((first / "json" / f"{case['iso3c']}.json").read_text())
        actual = next(
            r for r in payload["macrofiscal"] if str(r["years"]) == case["year"]
        )
        expected = None if case["expected"] == "" else float(case["expected"])
        if expected is None:
            assert actual[case["field"]] is None
        else:
            assert math.isclose(
                actual[case["field"]], expected, rel_tol=1e-12, abs_tol=1e-9
            )
    metadata = json.loads((first / "source_metadata.json").read_text())
    lookup = {(row["iso3c"], row["indicator"]): row for row in metadata["records"]}
    for case in rows("october_metadata.csv"):
        assert lookup[case["iso3c"], case["indicator"]][case["field"]] == json.loads(
            case["expected_json"]
        )


def test_existing_outputs_and_previous_destinations_are_rejected(tmp_path):
    output = tmp_path / "already-present"
    output.mkdir()
    sentinel = output / "sentinel"
    sentinel.write_text("preserve")
    with pytest.raises(ValueError, match="already exists"):
        october.build(SOURCE, output)
    assert sentinel.read_text() == "preserve"
    for vintage in october.OLD_TREES:
        with pytest.raises(ValueError, match="immutable"):
            october.build(SOURCE, ROOT / "data/vintages" / vintage / "nested")


def test_corrupt_source_fails_before_release_output(tmp_path):
    source = tmp_path / "source"
    source.mkdir()
    (source / "weo_oct2026_raw.csv").write_text("not the frozen source")
    output = tmp_path / "release"
    with pytest.raises(ValueError, match="source identity mismatch"):
        october.build(source, output)
    assert not output.exists()


def test_generation_failure_leaves_no_partial_release(tmp_path, monkeypatch):
    def stop(_):
        raise RuntimeError("injected generation failure")

    monkeypatch.setattr(october, "resolve_release_horizon", stop)
    output = tmp_path / "release"
    with pytest.raises(RuntimeError, match="injected generation failure"):
        october.build(SOURCE, output)
    assert not output.exists()
    assert not list(tmp_path.glob(".october-2026-*"))
