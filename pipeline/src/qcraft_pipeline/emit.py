"""Write a vintage: four Parquet files, per-country JSON, and a manifest."""

import json
from datetime import UTC, datetime
from pathlib import Path

import polars as pl

from qcraft_pipeline import config


def write_parquet(tables: dict[str, pl.DataFrame], out_dir: Path) -> dict[str, dict]:
    """Write the four Parquet files, mirroring the current data/processed format."""
    out_dir.mkdir(parents=True, exist_ok=True)
    summary: dict[str, dict] = {}
    for name in config.DATASETS:
        df = tables[name]
        path = out_dir / f"{name}.parquet"
        df.write_parquet(path)
        summary[name] = {
            "rows": df.height,
            "columns": df.width,
            "countries": df["iso3c"].n_unique(),
            "year_min": int(df["years"].min()),  # type: ignore[arg-type]
            "year_max": int(df["years"].max()),  # type: ignore[arg-type]
            "bytes": path.stat().st_size,
        }
        print(
            f"  {name:12s} {df.height:>7,} rows  {df['iso3c'].n_unique():>3} countries"
            f"  -> {path.name}"
        )
    return summary


def selectable_countries(tables: dict[str, pl.DataFrame]) -> list[dict[str, str]]:
    """Countries present in all four sources — what get_country_list() would pick."""
    sets = [set(tables[n]["iso3c"].unique().to_list()) for n in config.DATASETS]
    valid = set.intersection(*sets)
    return (
        tables["macrofiscal"]
        .filter(pl.col("iso3c").is_in(list(valid)))
        .select("iso3c", "country")
        .unique()
        .drop_nulls()
        .sort("country")
        .to_dicts()
    )


def _series(df: pl.DataFrame, year_col: str = "years") -> dict[str, list]:
    """Column-oriented dump of a sorted per-country frame."""
    df = df.sort(year_col)
    return {c: df[c].to_list() for c in df.columns}


def _country_payload(
    iso3c: str,
    country: str,
    tables: dict[str, pl.DataFrame],
) -> dict:
    macro = (
        tables["macrofiscal"].filter(pl.col("iso3c") == iso3c).drop("iso3c", "country")
    )
    prod = tables["productivity"].filter(pl.col("iso3c") == iso3c).drop("iso3c")

    demo = tables["demography"].filter(pl.col("iso3c") == iso3c)
    demo_years = sorted(demo["years"].unique().to_list())
    demography: dict[str, dict[str, list]] = {}
    for status in config.WPP_VARIANTS:
        by_group: dict[str, list] = {}
        for group in ("15-64", "65+", "Total"):
            sub = demo.filter(
                (pl.col("status") == status) & (pl.col("age_group") == group)
            ).sort("years")
            by_group[group] = sub["values"].to_list()
        demography[status] = by_group

    climate = tables["climate"].filter(pl.col("iso3c") == iso3c)
    climate_years = sorted(climate["years"].unique().to_list())
    scenarios = {
        scenario: climate.filter(pl.col("climate_scenario") == scenario)
        .sort("years")["gdp_loss_percent"]
        .to_list()
        for scenario in sorted(climate["climate_scenario"].unique().to_list())
    }

    return {
        "iso3c": iso3c,
        "country": country,
        "vintage": config.VINTAGE_ID,
        "macrofiscal": _series(macro),
        "demography": {"years": demo_years, "variants": demography},
        "productivity": _series(prod),
        "climate": {"years": climate_years, "scenarios": scenarios},
    }


def write_country_json(
    tables: dict[str, pl.DataFrame],
    out_dir: Path,
    countries: list[dict[str, str]],
) -> dict:
    """One JSON file per selectable country, plus an index."""
    json_dir = out_dir / "json"
    json_dir.mkdir(parents=True, exist_ok=True)

    total_bytes = 0
    for entry in countries:
        payload = _country_payload(entry["iso3c"], entry["country"], tables)
        path = json_dir / f"{entry['iso3c']}.json"
        path.write_text(json.dumps(payload, separators=(",", ":")) + "\n")
        total_bytes += path.stat().st_size

    index = {
        "vintage": config.VINTAGE_ID,
        "label": config.VINTAGE_LABEL,
        "count": len(countries),
        "countries": countries,
    }
    (json_dir / "index.json").write_text(json.dumps(index, indent=1) + "\n")

    print(
        f"  json         {len(countries):>7,} countries"
        f"  {total_bytes / 1e6:.1f} MB -> {json_dir.relative_to(out_dir.parent.parent)}"
    )
    return {"files": len(countries), "bytes": total_bytes}


def write_manifest(
    out_dir: Path,
    *,
    datasets: dict[str, dict],
    json_summary: dict,
    countries: list[dict[str, str]],
    checksums: dict,
    weo_url: str,
) -> None:
    manifest = {
        "vintage": config.VINTAGE_ID,
        "label": config.VINTAGE_LABEL,
        "generated_utc": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "base_vintage": config.BASE_VINTAGE_ID,
        "sources": {
            "macrofiscal": {
                "provider": "IMF World Economic Outlook",
                "vintage": "April 2026",
                "endpoint": weo_url,
                "indicators": config.WEO_INDICATORS,
                "note": (
                    "Fetched over SDMX 2.1 from api.imf.org; www.imf.org bulk "
                    "download is 403 from this host (BLOCKED-imf-bulk-download.md)."
                ),
            },
            "demography": {
                "provider": "UN World Population Prospects",
                "vintage": "2024 revision",
                "files": [config.WPP_MEDIUM_FILE, config.WPP_VARIANTS_FILE],
                "note": "1 July population by 5-year age group, thousands.",
            },
            "productivity": {
                "provider": "carried forward",
                "vintage": config.BASE_VINTAGE_ID,
                "note": "World Bank WDI data embedded in IMF Q-CRAFT workbook v10.",
            },
            "climate": {
                "provider": "carried forward",
                "vintage": config.BASE_VINTAGE_ID,
                "note": "Climate GDP-loss database bundled with IMF Q-CRAFT v10.",
            },
        },
        "raw_inputs": checksums,
        "datasets": datasets,
        "country_json": json_summary,
        "selectable_countries": len(countries),
        "macrofiscal_year_max": config.MACROFISCAL_YEAR_MAX,
        "macrofiscal_year_max_note": (
            "WEO April 2026 projects through 2031; truncated to 2029 to preserve "
            "the engine's PROJ_START=2030 boundary. See "
            ".change-requests/PIPELINE-2026-08-26.md."
        ),
    }
    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"  manifest     -> {out_dir / 'manifest.json'}")
