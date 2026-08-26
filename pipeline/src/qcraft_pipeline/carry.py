"""Carry productivity and climate forward from the base vintage.

Neither has a public April-2026 upstream: productivity is World Bank WDI data
embedded in the IMF workbook, climate is the workbook's own GDP-loss database.
Copying them is also correct rather than merely expedient — the engine only reads
historical productivity levels before weo_max_year - 6, and back-calculates
productivity from WEO growth after that. See DATA-NOTES.md section 6.
"""

from pathlib import Path

import polars as pl

from qcraft_pipeline import config

# Key columns per dataset, used to detect and repair the Kosovo/Serbia collision.
DATASET_KEYS: dict[str, list[str]] = {
    "macrofiscal": ["iso3c", "years"],
    "demography": ["iso3c", "years", "age_group", "status"],
    "productivity": ["iso3c", "years"],
    "climate": ["iso3c", "climate_scenario", "years"],
}


def load_base_dataset(base_dir: Path, name: str) -> pl.DataFrame:
    path = base_dir / f"{name}.parquet"
    if not path.exists():
        msg = (
            f"Base vintage file missing: {path}\n"
            f"Run `qcraft-pipeline init-base` first to materialise "
            f"{config.BASE_VINTAGE_ID} from data/processed/."
        )
        raise FileNotFoundError(msg)
    return pl.read_parquet(path)


def dedupe_carried(df: pl.DataFrame, name: str) -> pl.DataFrame:
    """Drop duplicate keys from a carried-forward table, keeping the last row.

    The base vintage's extractor fuzzy-matched "Kosovo" to SRB, so Serbia carries
    two series in demography.parquet and climate.parquet. Keeping the last row is
    not arbitrary: the workbook lists countries alphabetically, so Kosovo precedes
    Serbia, and the surviving row is the real Serbian series. In climate the Kosovo
    rows are all-zero, which makes the choice checkable rather than a guess.

    It also matches what the engine already does by accident —
    _build_climate_variation loads rows into a dict keyed by year, so the last row
    wins — so this repairs the label without moving any number the engine used.
    """
    key = DATASET_KEYS[name]
    dupes = df.group_by(key).len().filter(pl.col("len") > 1)
    if dupes.is_empty():
        return df
    codes = sorted(dupes["iso3c"].unique().to_list())
    print(
        f"  {name:12s} dropping {dupes.height} duplicate keys "
        f"(codes: {', '.join(codes)}), keeping last"
    )
    return df.unique(subset=key, keep="last", maintain_order=True)


def base_country_names(base_dir: Path) -> dict[str, str]:
    """iso3c -> country name as the frozen vintage labels it."""
    macro = load_base_dataset(base_dir, "macrofiscal")
    pairs = (
        macro.select("iso3c", "country")
        .drop_nulls()
        .unique(subset=["iso3c"], keep="first")
        .sort("iso3c")
    )
    return dict(zip(pairs["iso3c"].to_list(), pairs["country"].to_list(), strict=True))
