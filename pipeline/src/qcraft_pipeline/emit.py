"""Write a vintage: four Parquet files, per-country JSON, and a manifest."""

import json
import math
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import polars as pl

from qcraft_pipeline import config

# The OECD aggregate productivity series, needed by productivity_country() to
# compute each country's level relative to the frontier.
OECD_CODE = "OED"


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
    entries = (
        tables["macrofiscal"]
        .filter(pl.col("iso3c").is_in(list(valid)))
        .select("iso3c", "country")
        .unique()
        .drop_nulls()
        .to_dicts()
    )
    for entry in entries:
        entry["country"] = _resolve_country_name(entry["iso3c"], entry["country"])
    return sorted(entries, key=lambda e: e["country"])


# Country-name corrections applied when a payload is written.
#
# SRB. Every dataset carries Serbia's data under `SRB` and labels it "Kosovo".
# The label is wrong, not the data:
#   - macrofiscal 2020 nominal GDP is 5,504.4 bn RSD, which is Serbia's; Kosovo
#     reports in euro and is two orders of magnitude smaller
#   - the WEO reporter code SRB is Serbia by definition, and the April 2026
#     vintage carries Kosovo separately as XKX
#   - demography under SRB is 6.9 million people, which is Serbia without Kosovo
# The name comes from the workbook extractor's `pycountry.search_fuzzy("Kosovo")`
# resolving to SRB (DATA-NOTES.md section 5a), and the pipeline carries country
# names forward from the base vintage, so it survived the refresh.
#
# Left unfixed, a trainee who picks "Kosovo" is shown Serbia's fiscal path.
#
# XKX, the real Kosovo, is present in the April 2026 macrofiscal and demography
# but in neither productivity nor climate, so it is not selectable. That matches
# the IMF workbook, whose User Guide footnote 12 lists Kosovo among the
# economies with no climate estimates.
COUNTRY_NAME_OVERRIDES = {"SRB": "Serbia"}

# Keys that must be unique within one country's demography slice.
_DEMOGRAPHY_KEY = ("years", "age_group", "status")


def _resolve_country_name(iso3c: str, country: str) -> str:
    return COUNTRY_NAME_OVERRIDES.get(iso3c, country)


def _dedupe_demography(demo: pl.DataFrame, iso3c: str, country: str) -> pl.DataFrame:
    """Drop demography rows belonging to a different entity under the same code.

    The frozen vintage carries 1,359 duplicate (year, age group, variant) keys
    under SRB: Serbia's series and Kosovo's, side by side. `demography_country`
    filters on the code alone, so which one wins is arbitrary, and the Python
    engine fails outright on the duplicate shape (SRB is one of the 13
    PYTHON_ERROR countries in verification-logs/parity_results.csv, so no parity
    claim rests on it).

    When duplicates exist and one set of rows carries the country's own name,
    that set is the country's. When they exist and none does, the payload is not
    safe to write, so this raises rather than picking.
    """
    keys = list(_DEMOGRAPHY_KEY)
    if demo.height == demo.select(keys).unique().height:
        return demo

    own = demo.filter(pl.col("country") == country)
    if own.height and own.height == own.select(keys).unique().height:
        dropped = sorted(
            set(demo["country"].unique().to_list()) - {country}
        )
        print(
            f"  note  {iso3c}: dropped demography rows labelled {dropped} that "
            f"share {country}'s country code"
        )
        return own

    raise ValueError(
        f"{iso3c}: demography has duplicate {keys} keys that cannot be resolved "
        f"by country name (names present: {demo['country'].unique().to_list()})"
    )


def _json_safe(value: Any) -> Any:
    """Map Polars NaN and infinity onto JSON null.

    Polars carries NaN and infinity as ordinary float cells, and `json.dumps`
    happily writes them as the bare tokens `NaN` and `Infinity`. Neither is
    valid JSON, so `JSON.parse` rejects the whole file: three countries (Brunei,
    Macao SAR, Timor-Leste) shipped as unparseable payloads before this existed.
    A missing cell is what the engine already handles, so null is the honest
    encoding. `scripts/export_country_json.py` has always done this; the two
    producers now agree.
    """
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    return value


def _clean_rows(df: pl.DataFrame) -> list[dict[str, Any]]:
    return [
        {k: _json_safe(v) for k, v in row.items()} for row in df.iter_rows(named=True)
    ]


def _country_payload(
    iso3c: str,
    country: str,
    tables: dict[str, pl.DataFrame],
) -> dict:
    """One country's four input tables, as long-format rows.

    This is Lane 1's `CountryInput` contract (SHARED/engine-api.md), which the
    TypeScript engine consumes directly: same key names as the Parquet columns,
    one object per row. Note productivity carries the OECD frontier series
    (iso3c "OED") alongside the country's own, because productivity_country()
    needs it for productivity_level_oecd_percent.
    """
    country = _resolve_country_name(iso3c, country)
    macro = tables["macrofiscal"].filter(pl.col("iso3c") == iso3c).sort("years")
    demo = _dedupe_demography(
        tables["demography"]
        .filter(pl.col("iso3c") == iso3c)
        .sort("years", "age_group", "status"),
        iso3c,
        country,
    )
    prod = (
        tables["productivity"]
        .filter(pl.col("iso3c").is_in([iso3c, OECD_CODE]))
        .sort("iso3c", "years")
    )
    climate = (
        tables["climate"]
        .filter(pl.col("iso3c") == iso3c)
        .sort("climate_scenario", "years")
    )

    def relabel(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        for row in rows:
            if "country" in row:
                row["country"] = country
        return rows

    return {
        "iso3c": iso3c,
        "country": country,
        "demography": relabel(_clean_rows(demo)),
        "productivity": _clean_rows(prod),
        "macrofiscal": relabel(_clean_rows(macro)),
        "climate": _clean_rows(climate),
    }


def write_country_json(
    tables: dict[str, pl.DataFrame],
    out_dir: Path,
    countries: list[dict[str, str]],
    *,
    vintage_id: str = config.VINTAGE_ID,
    vintage_label: str = config.VINTAGE_LABEL,
) -> dict:
    """One JSON file per selectable country, plus an index.

    `vintage_id` and `vintage_label` default to the vintage this pipeline builds.
    They are parameters because the frozen base vintage needs the same payloads
    emitted from its own Parquet, and the Explorer's Verified mode reads them:
    see scripts/build_vintage_json.py.
    """
    json_dir = out_dir / "json"
    json_dir.mkdir(parents=True, exist_ok=True)

    total_bytes = 0
    for entry in countries:
        payload = _country_payload(entry["iso3c"], entry["country"], tables)
        path = json_dir / f"{entry['iso3c']}.json"
        # allow_nan=False turns any surviving NaN into a loud TypeError here
        # rather than a silent parse failure in the browser.
        path.write_text(json.dumps(payload, allow_nan=False) + "\n")
        total_bytes += path.stat().st_size

    index = {
        "vintage": vintage_id,
        "label": vintage_label,
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
