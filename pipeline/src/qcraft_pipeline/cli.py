"""Command line entry point.

uv run qcraft-pipeline init-base   # freeze data/processed as weo-2024-10
uv run qcraft-pipeline run         # fetch + build + validate + emit
uv run qcraft-pipeline select weo-2026-04   # point the app at a vintage
"""

import argparse
import json
import shutil
import sys
from pathlib import Path

import polars as pl

from qcraft_pipeline import carry, config, emit, fetch, validate, weo, wpp


def _processed_dir() -> Path:
    return config.repo_root() / "data" / "processed"


def cmd_init_base(_: argparse.Namespace) -> int:
    """Copy the currently bundled data/processed into data/vintages/weo-2024-10.

    Read-only with respect to data/processed: it copies out, never in.
    """
    src = _processed_dir()
    dest = config.vintage_dir(config.BASE_VINTAGE_ID)
    missing = [n for n in config.DATASETS if not (src / f"{n}.parquet").exists()]
    if missing:
        print(
            f"error: {src} is missing {missing}.\n"
            "The bundled Parquet files are gitignored; copy them in from the "
            "QCraft-App working tree first (see DATA-NOTES.md section 1).",
            file=sys.stderr,
        )
        return 1

    dest.mkdir(parents=True, exist_ok=True)
    for name in config.DATASETS:
        # The refreshed vintage gets `dedupe_carried` on the way through, so
        # without this the base vintage was the only one still carrying the
        # extractor's Kosovo/Serbia collision: 1,359 duplicate demography keys
        # and a duplicate climate slice under SRB. The JSON emitter repaired it
        # for the browser and the Parquet did not, which is why the TypeScript
        # engine answered for Serbia while Python raised ComputeError on the same
        # country and vintage. Both producers now agree.
        #
        # SRB is the only code affected, and it has no golden master: it is one
        # of the 13 PYTHON_ERROR rows in verification-logs/parity_results.csv and
        # is absent from the 147 tested countries, so no parity claim moves.
        frame = pl.read_parquet(src / f"{name}.parquet")
        repaired = carry.dedupe_carried(frame, name)
        # The same collision left the wrong name on the surviving rows. The JSON
        # emitter has always corrected it (emit.COUNTRY_NAME_OVERRIDES) and the
        # Parquet did not, so the two producers disagreed on what SRB is called:
        # the browser said Serbia and every Python-side artifact said Kosovo.
        # One override list, applied by both.
        repaired = emit.apply_country_name_overrides(repaired)
        if repaired.equals(frame):
            shutil.copy2(src / f"{name}.parquet", dest / f"{name}.parquet")
        else:
            repaired.write_parquet(dest / f"{name}.parquet")
    (dest / "manifest.json").write_text(
        json.dumps(
            {
                "vintage": config.BASE_VINTAGE_ID,
                "label": config.BASE_VINTAGE_LABEL,
                "source": (
                    "Extracted from 2024_IMF-FAD_Q-CRAFT-Tool-v10.xlsx by "
                    "scripts/extract_excel_data.py"
                ),
                "role": "verification vintage — golden masters are built from this",
                "frozen": True,
            },
            indent=2,
        )
        + "\n"
    )
    print(f"Base vintage materialised at {dest}")
    return 0


def cmd_run(args: argparse.Namespace) -> int:
    base_dir = config.vintage_dir(config.BASE_VINTAGE_ID)
    if not (base_dir / "macrofiscal.parquet").exists():
        print(
            f"error: base vintage not found at {base_dir}. "
            "Run `qcraft-pipeline init-base` first.",
            file=sys.stderr,
        )
        return 1

    paths = fetch.fetch_all(force=args.force_download)
    checksums = json.loads((config.cache_dir() / "checksums.json").read_text())

    base_names = carry.base_country_names(base_dir)
    base_tables = {
        name: carry.load_base_dataset(base_dir, name) for name in config.DATASETS
    }

    print("\nBuilding tables")
    tables: dict[str, pl.DataFrame] = {
        "macrofiscal": weo.build_macrofiscal(
            paths["weo"], paths["weo_countries"], base_names
        ),
        "demography": wpp.build_demography(
            paths["wpp_medium"], paths["wpp_variants"], base_names
        ),
    }
    for name in config.CARRIED_FORWARD:
        print(f"  {name:12s} carried forward from {config.BASE_VINTAGE_ID}")
        tables[name] = carry.dedupe_carried(base_tables[name], name)

    print("\nValidating")
    failures = validate.run_all(tables, base_tables)
    if failures:
        for failure in failures:
            print(f"  FAIL {failure}", file=sys.stderr)
        if not args.allow_invalid:
            print(
                f"\n{len(failures)} validation failure(s); nothing written. "
                "Re-run with --allow-invalid to write anyway.",
                file=sys.stderr,
            )
            return 1
        print(f"  {len(failures)} failure(s) ignored (--allow-invalid)")
    else:
        print("  all checks passed")

    out_dir = Path(args.out) if args.out else config.vintage_dir(config.VINTAGE_ID)
    print(f"\nWriting {config.VINTAGE_ID} to {out_dir}")
    datasets = emit.write_parquet(tables, out_dir)
    countries = emit.selectable_countries(tables)
    json_summary = emit.write_country_json(tables, out_dir, countries)
    emit.write_manifest(
        out_dir,
        datasets=datasets,
        json_summary=json_summary,
        countries=countries,
        checksums=checksums,
        weo_url=fetch.weo_data_url(),
    )
    print(
        f"\nDone. {len(countries)} countries selectable (present in all four datasets)."
    )
    return 0


def cmd_repair(args: argparse.Namespace) -> int:
    """Apply the dedupe and the name overrides to a vintage already on disk.

    `init-base` does this for the base vintage and `run` does it for a refreshed
    one, but a vintage built before either learned to is still on disk in every
    working tree, and rebuilding the April 2026 vintage means refetching the WEO.
    This applies the same two repairs in place, reads back what it wrote, and is
    idempotent: run it twice and the second run reports nothing to do.
    """
    src = config.vintage_dir(args.vintage)
    missing = [n for n in config.DATASETS if not (src / f"{n}.parquet").exists()]
    if missing:
        print(f"error: {src} is missing {missing}", file=sys.stderr)
        return 1

    changed = 0
    for name in config.DATASETS:
        path = src / f"{name}.parquet"
        frame = pl.read_parquet(path)
        repaired = emit.apply_country_name_overrides(carry.dedupe_carried(frame, name))
        if repaired.equals(frame):
            continue
        repaired.write_parquet(path)
        changed += 1
        print(f"  {name:12s} repaired ({frame.height:,} -> {repaired.height:,} rows)")
    if changed == 0:
        print(f"{args.vintage} needed no repair")
    else:
        print(f"{args.vintage}: {changed} table(s) rewritten")
    return 0


def cmd_select(args: argparse.Namespace) -> int:
    """Point data/processed at a vintage, so the app and engine load it."""
    src = config.vintage_dir(args.vintage)
    missing = [n for n in config.DATASETS if not (src / f"{n}.parquet").exists()]
    if missing:
        print(f"error: {src} is missing {missing}", file=sys.stderr)
        return 1

    dest = _processed_dir()
    dest.mkdir(parents=True, exist_ok=True)
    for name in config.DATASETS:
        shutil.copy2(src / f"{name}.parquet", dest / f"{name}.parquet")
    (dest / "ACTIVE_VINTAGE").write_text(args.vintage + "\n")
    print(f"data/processed now holds {args.vintage}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="qcraft-pipeline",
        description="Refresh Q-CRAFT Explorer input data to a new WEO/WPP vintage.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    p_base = sub.add_parser(
        "init-base", help="freeze data/processed as the weo-2024-10 vintage"
    )
    p_base.set_defaults(func=cmd_init_base)

    p_run = sub.add_parser("run", help="fetch, build, validate and emit the vintage")
    p_run.add_argument("--out", help="output directory (default data/vintages/<id>)")
    p_run.add_argument(
        "--force-download", action="store_true", help="re-download cached raw inputs"
    )
    p_run.add_argument(
        "--allow-invalid",
        action="store_true",
        help="write output even if validation fails",
    )
    p_run.set_defaults(func=cmd_run)

    p_repair = sub.add_parser(
        "repair",
        help="apply the dedupe and country-name overrides to a vintage on disk",
    )
    p_repair.add_argument("vintage")
    p_repair.set_defaults(func=cmd_repair)

    p_select = sub.add_parser("select", help="copy a vintage into data/processed")
    p_select.add_argument("vintage", help="vintage id, e.g. weo-2026-04")
    p_select.set_defaults(func=cmd_select)

    args = parser.parse_args(argv)
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
