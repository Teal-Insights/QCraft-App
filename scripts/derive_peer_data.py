#!/usr/bin/env python3
"""Derive the cross-country reference tables the parameter context panels use.

The context panels built in run 4 answer "what does the source publish for my
country". This script produces the data behind the second question, "where does
my country sit", for every country the Explorer can select.

Everything here comes out of the bundled vintage directories and the bundled UN
WPP raw download. Nothing is fetched, and nothing is hand-entered. The research
note that establishes what each statistic may and may not be used to claim is
`docs/parameter-data.md`; read it before changing a definition here.

Outputs, written to `apps/qcraft-web/src/context/data/`:

    peers.csv            one row per selectable country: name, region, subregion,
                         output per worker
    peer-stats.csv       one row per country per vintage: the statistic behind
                         each parameter's distribution strip
    rigidity-points.csv  the country-year growth pairs the rigidity scatter draws
    rigidity-readings.csv the pooled expenditure elasticity under each reading of
                         the record, world and by region

Run:

    uv run --with polars --with pyarrow python scripts/derive_peer_data.py

Add `--check` to recompute and diff against what is committed without writing.
"""

from __future__ import annotations

import argparse
import csv
import gzip
import itertools
import json
import math
import sys
from collections import Counter
from pathlib import Path

import polars as pl

# ── Boundaries, all of them load-bearing ──────────────────────────────────────

#: Last WEO outturn year common to both bundled vintages. Established empirically
#: rather than assumed: the two vintages agree to the fourth decimal through 2018
#: and diverge steadily from 2019 as national accounts are revised, then jump at
#: 2024, which is the first year the October 2024 vintage was forecasting. Every
#: historical statistic here stops at 2023 so the same window is history in both
#: vintages and switching data mode does not change what the record says.
HISTORY_END = 2023

#: Last year of the macrofiscal table in both vintages. The April 2026 release
#: projects to 2031; the pipeline truncates to preserve the engine's 2030
#: projection boundary (pipeline/src/qcraft_pipeline/config.py).
WEO_MAX_YEAR = 2029

#: First year the engine back-calculates productivity as a residual rather than
#: reading the user's `productivity_start`. baseline_v1 sets this at
#: WEO_MAX_YEAR - 6, so the residual window is 2023 to 2029.
RESIDUAL_START = WEO_MAX_YEAR - 6

#: The year the demography strip reads a mid-horizon comparison off. Far enough
#: out that the three UN variants have parted company, close enough that a
#: serving official expects to see the consequences.
DEMOGRAPHY_YEAR = 2050

#: Last year of the WDI productivity record (DATA-NOTES.md section 3).
WDI_MAX_YEAR = 2022

#: Windows for the two productivity history statistics.
WDI_LONG_START = 1992
WDI_DECADE_START = 2013

#: Windows for the two inflation history statistics.
INFLATION_LONG_START = 2001
INFLATION_RECENT_START = 2014

#: Year-on-year growth rates beyond this are redenominations and hyperinflations,
#: not fiscal behaviour. Trimming matters for the elasticity: see
#: docs/parameter-data.md section 7, which reports the estimate at four trims.
GROWTH_TRIM_PERCENT = 200.0

#: A subregion smaller than this is not a peer set, and the panel offers the
#: region instead. Australia/New Zealand and Polynesia have two selectable
#: countries each.
MIN_SUBREGION = 8

#: How many countries the "similar output per worker" band holds, including the
#: user's own. A band rather than terciles, because tercile cut points would be
#: an invented classification and a nearest-neighbour band is just a distance.
SIMILARITY_BAND = 40

VINTAGES = ("weo-2024-10", "weo-2026-04")

#: The WPP location id of the World, whose immediate children are the continents
#: the region axis uses. The download references it as a parent but carries no
#: row for it, which is why the walk tests the parent id rather than looking it up.
WPP_WORLD_ID = "1840"

#: Parent ids the download references but has no row for, and what to read them
#: as. Only one of them reaches a selectable country: Canada and the United
#: States are parented to M49 code 918, Northern America the subregion, and the
#: file publishes that area only as Geographic region 905 of the same name.
#: Without the bridge their region walk dead-ends and they lose their peer group.
WPP_MISSING_PARENTS = {"918": "905"}


def repo_root() -> Path:
    here = Path(__file__).resolve().parent
    for _ in range(6):
        if (here / "pyproject.toml").exists() and (here / "packages").exists():
            return here
        here = here.parent
    msg = "Cannot find repo root"
    raise FileNotFoundError(msg)


ROOT = repo_root()
OUT_DIR = ROOT / "apps/qcraft-web/src/context/data"
WPP_RAW = ROOT / "pipeline/.cache/raw/WPP2024_PopulationByAge5GroupSex_Medium.csv.gz"


# ── Peer groups, read out of the bundled WPP hierarchy ────────────────────────


def wpp_locations() -> dict[str, tuple[str, str, str, str]]:
    """Every WPP location: id -> (type, name, parent id, iso3).

    The download is 30 MB gzipped and one pass over it is a few seconds. The
    alternative would be a hand-kept country-to-region table, which is exactly
    the kind of file that goes stale without anyone noticing.
    """
    if not WPP_RAW.exists():
        msg = (
            f"{WPP_RAW} is missing. It is the pipeline's raw download cache: "
            "run `uv run qcraft-pipeline fetch` to restore it."
        )
        raise FileNotFoundError(msg)

    locations: dict[str, tuple[str, str, str, str]] = {}
    with gzip.open(WPP_RAW, "rt") as handle:
        header = handle.readline().strip()
        reader = csv.DictReader(itertools.chain([header], handle))
        for row in reader:
            loc_id = row["LocID"]
            if loc_id not in locations:
                locations[loc_id] = (
                    row["LocTypeName"],
                    row["Location"],
                    row["ParentID"],
                    row["ISO3_code"],
                )
    return locations


def peer_groups() -> dict[str, tuple[str, str]]:
    """iso3 -> (region, subregion), walking the WPP parent chain.

    Two levels, chosen so that every country lands somewhere and the levels mean
    the same thing everywhere:

      subregion  the country's immediate parent. A Subregion for 235 of 237
                 countries; Canada and the United States sit directly under
                 Northern America, which WPP types as a Geographic region.
      region     the ancestor whose own parent is the World. That resolves to
                 five continents. It matters that this is the ancestor rather
                 than the grandparent: Latin America and the Caribbean is itself
                 a Geographic region under Americas, so a fixed two-step would
                 put Peru in a different kind of group from Canada.
    """
    locations = wpp_locations()
    resolve = lambda loc_id: WPP_MISSING_PARENTS.get(loc_id, loc_id)  # noqa: E731
    groups: dict[str, tuple[str, str]] = {}

    for _loc_id, (kind, _name, parent_id, iso3) in locations.items():
        if kind != "Country/Area" or not iso3:
            continue
        parent = locations.get(resolve(parent_id))
        if parent is None:
            continue
        subregion = parent[1]

        # Walk to the child of the World.
        cursor_id, region = resolve(parent_id), None
        for _ in range(6):
            cursor = locations.get(cursor_id)
            if cursor is None:
                break
            if cursor[2] == WPP_WORLD_ID:
                region = cursor[1]
                break
            cursor_id = resolve(cursor[2])
        if region is None:
            continue
        groups[iso3] = (region, subregion)

    return groups


# ── Statistics, one per parameter ─────────────────────────────────────────────


def growth(
    frame: pl.DataFrame, value: str, over: list[str], alias: str
) -> pl.DataFrame:
    """Year-on-year percent growth of `value`, within each `over` group."""
    return frame.with_columns(
        ((pl.col(value) / pl.col(value).shift(1).over(over)) * 100 - 100).alias(alias)
    )


def usable_demography(demography: pl.DataFrame) -> tuple[pl.DataFrame, list[str]]:
    """Drop countries whose population series is not one series.

    The frozen `weo-2024-10` vintage files Kosovo's population under iso3c SRB
    beside Serbia's, so SRB carries two values for every variant, age group and
    year. Growth rates computed over that are meaningless and a pivot on it
    raises. Nothing here repairs it: the country is left out of the reference
    set for that vintage and named on the way past, because a silent repair in a
    context panel would hide a defect that also stops the engine
    (`demography_country("SRB")` raises on this vintage; the April 2026 pipeline
    routes Kosovo to XKX and the problem does not arise there).
    """
    counts = demography.group_by(["iso3c", "status", "age_group", "years"]).len()
    duplicated = (
        counts.filter(pl.col("len") > 1)["iso3c"].unique().sort().to_list()
    )
    if not duplicated:
        return demography, []
    return demography.filter(~pl.col("iso3c").is_in(duplicated)), duplicated


def demography_stats(demography: pl.DataFrame) -> pl.DataFrame:
    """Working-age growth at the comparison year, Medium variant, and the spread.

    Working-age rather than total population because working-age growth is what
    becomes employment growth in the projection, which is the channel the
    variant choice actually moves.
    """
    working = growth(
        demography.filter(pl.col("age_group") == "15-64").sort(
            ["iso3c", "status", "years"]
        ),
        "values",
        ["iso3c", "status"],
        "g",
    ).filter(pl.col("years") == DEMOGRAPHY_YEAR)

    wide = working.pivot(on="status", index="iso3c", values="g")
    for variant in ("Low", "Medium", "High"):
        if variant not in wide.columns:
            wide = wide.with_columns(pl.lit(None, dtype=pl.Float64).alias(variant))

    return wide.select(
        "iso3c",
        pl.col("Medium").alias("demography_wa_growth"),
        # The country's own Low and High are carried so the strip can show the
        # variant choice as three marks on the same axis the peers are on. The
        # spread is what the cross-country distribution is drawn over, because
        # "how much does this choice move" is the comparable quantity.
        pl.col("Low").alias("demography_wa_growth_low"),
        pl.col("High").alias("demography_wa_growth_high"),
        (pl.col("High") - pl.col("Low")).alias("demography_variant_spread"),
    )


def productivity_stats(
    productivity: pl.DataFrame, macrofiscal: pl.DataFrame, demography: pl.DataFrame
) -> pl.DataFrame:
    """Three readings of productivity growth, because they disagree.

    `productivity_hist_long` and `productivity_hist_decade` are the realised WDI
    record. `productivity_weo_residual` is what the engine itself reads out of
    the WEO forecast over 2023 to 2029: real GDP growth net of working-age
    population growth, the same residual `baseline_v1` back-calculates. It is
    the closest thing in the bundle to the quantity `productivity_start` sets,
    and it is systematically higher than the realised record, which is a fact
    the panel has to state rather than smooth over.
    """
    record = growth(
        productivity.sort(["iso3c", "years"]), "productivity_level", ["iso3c"], "g"
    )
    long_run = (
        record.filter(pl.col("years") >= WDI_LONG_START)
        .group_by("iso3c")
        .agg(pl.col("g").mean().alias("productivity_hist_long"))
    )
    decade = (
        record.filter(pl.col("years") >= WDI_DECADE_START)
        .group_by("iso3c")
        .agg(pl.col("g").mean().alias("productivity_hist_decade"))
    )
    level = productivity.filter(pl.col("years") == WDI_MAX_YEAR).select(
        "iso3c", pl.col("productivity_level").alias("output_per_worker")
    )

    employment = growth(
        demography.filter(
            (pl.col("age_group") == "15-64") & (pl.col("status") == "Medium")
        ).sort(["iso3c", "years"]),
        "values",
        ["iso3c"],
        "employment_growth",
    ).select("iso3c", "years", "employment_growth")

    residual = (
        macrofiscal.select("iso3c", "years", "real_gdp_growth_percent")
        .join(employment, on=["iso3c", "years"], how="inner")
        .filter(pl.col("years").is_between(RESIDUAL_START, WEO_MAX_YEAR))
        .with_columns(
            (
                (
                    (
                        pl.col("real_gdp_growth_percent") / 100
                        - pl.col("employment_growth") / 100
                    )
                    / (1 + pl.col("employment_growth") / 100)
                )
                * 100
            ).alias("residual")
        )
        .group_by("iso3c")
        .agg(
            pl.col("residual").mean().alias("productivity_weo_residual"),
            pl.col("residual").count().alias("n"),
        )
        # A partial window would average a different number of years for
        # different countries and read as if it were the same statistic.
        .filter(pl.col("n") == WEO_MAX_YEAR - RESIDUAL_START + 1)
        .drop("n")
    )

    return (
        long_run.join(decade, on="iso3c", how="full", coalesce=True)
        .join(level, on="iso3c", how="full", coalesce=True)
        .join(residual, on="iso3c", how="full", coalesce=True)
    )


def macrofiscal_stats(macrofiscal: pl.DataFrame) -> pl.DataFrame:
    """Inflation, the effective interest rate, and where debt actually is."""
    last = macrofiscal.filter(pl.col("years") == WEO_MAX_YEAR).select(
        "iso3c",
        pl.col("gdp_deflator_growth_percent").alias("inflation_weo_last"),
        pl.col("interest_rate_percent").alias("interest_rate_weo_last"),
        pl.col("nominal_gdp_growth_percent").alias("nominal_gdp_growth_weo_last"),
        pl.col("debt_to_gdp").alias("debt_weo_last"),
    )
    # An effective rate needs a debt stock in the denominator; where WEO carries
    # none the quotient is an infinity, which is not a rate.
    last = last.with_columns(
        pl.when(pl.col("interest_rate_weo_last").is_finite())
        .then(pl.col("interest_rate_weo_last"))
        .otherwise(None)
        .alias("interest_rate_weo_last")
    ).with_columns(
        (
            (
                (
                    pl.col("interest_rate_weo_last") / 100
                    - pl.col("nominal_gdp_growth_weo_last") / 100
                )
                / (1 + pl.col("nominal_gdp_growth_weo_last") / 100)
            )
            * 100
        ).alias("interest_growth_differential_weo_last")
    )

    history = macrofiscal.filter(
        pl.col("years").is_between(INFLATION_LONG_START, HISTORY_END)
    )
    inflation_long = history.group_by("iso3c").agg(
        pl.col("gdp_deflator_growth_percent").median().alias("inflation_hist_median")
    )
    inflation_recent = (
        macrofiscal.filter(
            pl.col("years").is_between(INFLATION_RECENT_START, HISTORY_END)
        )
        .group_by("iso3c")
        .agg(
            pl.col("gdp_deflator_growth_percent")
            .median()
            .alias("inflation_recent_median")
        )
    )
    debt_now = macrofiscal.filter(pl.col("years") == HISTORY_END).select(
        "iso3c", pl.col("debt_to_gdp").alias("debt_hist_last")
    )
    debt_low = history.group_by("iso3c").agg(
        pl.col("debt_to_gdp").min().alias("debt_hist_min")
    )

    return (
        last.join(inflation_long, on="iso3c", how="full", coalesce=True)
        .join(inflation_recent, on="iso3c", how="full", coalesce=True)
        .join(debt_now, on="iso3c", how="full", coalesce=True)
        .join(debt_low, on="iso3c", how="full", coalesce=True)
        .drop("nominal_gdp_growth_weo_last")
    )


# ── Expenditure rigidity: the pairs, and the pooled readings ──────────────────


def rigidity_pairs(macrofiscal: pl.DataFrame) -> pl.DataFrame:
    """The country-year growth pairs behind the rigidity scatter.

    `expenditure_rigidity` is not a published series and cannot be one. What the
    engine means by it is exact, though: climate.py holds primary expenditure at

        PE = PE_base * (1 + (1 - rigidity) * g)

    for a proportional GDP shock g, so rigidity is one minus the elasticity of
    primary expenditure to GDP. These pairs are the only thing in the bundle
    that speaks to that elasticity: how a country's primary spending moved in
    the years its economy moved.
    """
    frame = (
        macrofiscal.filter(
            pl.col("years").is_between(INFLATION_LONG_START, HISTORY_END)
        )
        .sort(["iso3c", "years"])
        .pipe(growth, "primary_expenditure", ["iso3c"], "expenditure_growth")
        .with_columns(
            (
                (
                    (1 + pl.col("expenditure_growth") / 100)
                    / (1 + pl.col("gdp_deflator_growth_percent") / 100)
                )
                * 100
                - 100
            ).alias("real_expenditure_growth")
        )
        .select(
            "iso3c",
            "years",
            "expenditure_growth",
            "real_expenditure_growth",
            pl.col("nominal_gdp_growth_percent").alias("gdp_growth"),
            pl.col("real_gdp_growth_percent").alias("real_gdp_growth"),
        )
        .drop_nulls()
        .drop_nans()
    )
    return frame.filter(
        (pl.col("expenditure_growth").abs() < GROWTH_TRIM_PERCENT)
        & (pl.col("gdp_growth").abs() < GROWTH_TRIM_PERCENT)
    )


def pooled_elasticity(
    pairs: pl.DataFrame,
    x_column: str = "gdp_growth",
    y_column: str = "expenditure_growth",
) -> dict[str, float] | None:
    """Country-demeaned OLS slope with standard errors clustered by country.

    Demeaning within country is what makes this a statement about deviations
    rather than about trends: two series that both trend upward have an
    elasticity near one for reasons that have nothing to do with how a budget
    responds to a shock, which is the question.
    """
    frame = pairs.with_columns(
        (pl.col(x_column) - pl.col(x_column).mean().over("iso3c")).alias("x"),
        (pl.col(y_column) - pl.col(y_column).mean().over("iso3c")).alias("y"),
    )
    xs = frame["x"].to_list()
    ys = frame["y"].to_list()
    groups = frame["iso3c"].to_list()
    n, k = len(xs), len(set(groups))
    if n < 30 or k < 2:
        return None

    sxx = sum(x * x for x in xs)
    if sxx <= 1e-12:
        return None
    beta = sum(x * y for x, y in zip(xs, ys, strict=True)) / sxx
    residuals = [y - beta * x for x, y in zip(xs, ys, strict=True)]

    scores: dict[str, float] = {}
    for group, x, residual in zip(groups, xs, residuals, strict=True):
        scores[group] = scores.get(group, 0.0) + x * residual
    variance = (
        sum(v * v for v in scores.values())
        / (sxx**2)
        * (k / (k - 1))
        * ((n - 1) / (n - 2))
    )
    total = sum(y * y for y in ys)
    return {
        "beta": beta,
        "se": math.sqrt(variance),
        "r2": (
            1 - sum(r * r for r in residuals) / total
            if total > 1e-12
            else float("nan")
        ),
        "n": n,
        "k": k,
    }


def rigidity_readings(
    pairs: pl.DataFrame, groups: dict[str, tuple[str, str]]
) -> pl.DataFrame:
    """The same question asked several defensible ways.

    Reported as a set rather than as one number because the set does not agree:
    dropping the two pandemic years moves the world estimate by roughly nine
    points of rigidity, and trimming outliers moves it by more. A single figure
    would be a precision the record does not have. See docs/parameter-data.md
    section 7.
    """
    with_region = pairs.with_columns(
        pl.col("iso3c")
        .replace_strict({k: v[0] for k, v in groups.items()}, default=None)
        .alias("region")
    )

    readings: list[dict[str, object]] = []

    def add(
        scope: str,
        label: str,
        frame: pl.DataFrame,
        order: int,
        columns: tuple[str, str] = ("gdp_growth", "expenditure_growth"),
    ) -> None:
        fit = pooled_elasticity(frame, *columns)
        if fit is None:
            return
        readings.append(
            {
                "scope": scope,
                "reading": label,
                "sort_order": order,
                "beta": round(fit["beta"], 4),
                "se": round(fit["se"], 4),
                "r2": round(fit["r2"], 4),
                "n": fit["n"],
                "countries": fit["k"],
            }
        )

    covid = pl.col("years").is_in([2020, 2021])
    median_growth = pl.col("real_gdp_growth").median().over("iso3c")
    downturn = pl.col("real_gdp_growth") < median_growth

    nominal = ("gdp_growth", "expenditure_growth")
    real = ("real_gdp_growth", "real_expenditure_growth")

    # Nominal is the primary pairing because the model's recalibration is in
    # nominal levels with the deflator path held fixed. Real is carried anyway,
    # and disagrees, which is the point: the spread across these six is the
    # honest width of what the record supports.
    specs: list[tuple[str, pl.DataFrame, int, tuple[str, str]]] = [
        ("Every year since 2001", with_region, 1, nominal),
        ("Pandemic years left out", with_region.filter(~covid), 2, nominal),
        ("Weak growth years only", with_region.filter(downturn), 3, nominal),
        (
            "Weak growth years without the pandemic",
            with_region.filter(downturn & ~covid),
            4,
            nominal,
        ),
        ("In real terms", with_region, 5, real),
        (
            "In real terms without the pandemic",
            with_region.filter(~covid),
            6,
            real,
        ),
    ]

    for label, frame, order, columns in specs:
        add("World", label, frame, order, columns)

    for region in sorted({v[0] for v in groups.values()}):
        for label, frame, order, columns in specs:
            add(region, label, frame.filter(pl.col("region") == region), order, columns)

    return pl.DataFrame(readings)


# ── Assembly ──────────────────────────────────────────────────────────────────


def selectable_countries() -> list[dict[str, str]]:
    """The countries the Explorer offers, from the vintage's own index."""
    index = ROOT / "data/vintages/weo-2026-04/json/index.json"
    return json.loads(index.read_text())["countries"]


def build() -> dict[str, pl.DataFrame]:
    countries = selectable_countries()
    iso_codes = [c["iso3c"] for c in countries]
    groups = peer_groups()

    missing = [iso for iso in iso_codes if iso not in groups]
    if missing:
        msg = f"No WPP peer group for selectable countries: {missing}"
        raise ValueError(msg)

    subregion_counts = Counter(groups[iso][1] for iso in iso_codes)

    stats_frames: list[pl.DataFrame] = []
    pairs_frames: list[pl.DataFrame] = []
    readings_frames: list[pl.DataFrame] = []

    for vintage in VINTAGES:
        vintage_dir = ROOT / "data/vintages" / vintage
        macrofiscal = pl.read_parquet(vintage_dir / "macrofiscal.parquet")
        productivity = pl.read_parquet(vintage_dir / "productivity.parquet")
        demography, doubled = usable_demography(
            pl.read_parquet(vintage_dir / "demography.parquet")
        )
        for iso in doubled:
            if iso in iso_codes:
                print(
                    f"  {vintage}: {iso} carries two population series and is left "
                    "out of the demography and productivity reference set",
                    file=sys.stderr,
                )

        stats = (
            demography_stats(demography)
            .join(
                productivity_stats(productivity, macrofiscal, demography),
                on="iso3c",
                how="full",
                coalesce=True,
            )
            .join(macrofiscal_stats(macrofiscal), on="iso3c", how="full", coalesce=True)
            .filter(pl.col("iso3c").is_in(iso_codes))
            .with_columns(pl.lit(vintage).alias("vintage"))
        )
        stats_frames.append(stats)

        pairs = rigidity_pairs(macrofiscal).with_columns(
            pl.lit(vintage).alias("vintage")
        )
        pairs_frames.append(pairs.filter(pl.col("iso3c").is_in(iso_codes)))

        readings = rigidity_readings(
            rigidity_pairs(macrofiscal), groups
        ).with_columns(pl.lit(vintage).alias("vintage"))
        readings_frames.append(readings)

    stats = pl.concat(stats_frames, how="vertical_relaxed")

    # Output per worker is carried forward unchanged between the two vintages,
    # so the similarity band is the same in both and is read off either.
    levels = (
        stats.filter(pl.col("vintage") == VINTAGES[-1])
        .select("iso3c", "output_per_worker")
        .drop_nulls()
    )

    peers = pl.DataFrame(
        [
            {
                "iso3c": c["iso3c"],
                "name": c["country"],
                "region": groups[c["iso3c"]][0],
                # A group of two is not a peer set. Where the subregion is too
                # small the panel offers the region and says so, rather than
                # drawing a distribution over three countries.
                "subregion": (
                    groups[c["iso3c"]][1]
                    if subregion_counts[groups[c["iso3c"]][1]] >= MIN_SUBREGION
                    # None, not "". Polars writes an empty string as a quoted
                    # pair and a null as nothing at all, and the browser-side
                    # reader is a deliberate split on commas with no quote
                    # handling, so a quoted empty cell would arrive as the
                    # two-character string and read as a real group name.
                    else None
                ),
            }
            for c in countries
        ]
    ).join(levels, on="iso3c", how="left")

    stat_columns = [
        "vintage",
        "iso3c",
        "demography_wa_growth",
        "demography_wa_growth_low",
        "demography_wa_growth_high",
        "demography_variant_spread",
        "productivity_hist_long",
        "productivity_hist_decade",
        "productivity_weo_residual",
        "inflation_weo_last",
        "inflation_hist_median",
        "inflation_recent_median",
        "interest_rate_weo_last",
        "interest_growth_differential_weo_last",
        "debt_weo_last",
        "debt_hist_last",
        "debt_hist_min",
    ]

    return {
        "peers.csv": peers.sort("iso3c").select(
            "iso3c", "name", "region", "subregion", "output_per_worker"
        ),
        "peer-stats.csv": stats.sort(["vintage", "iso3c"]).select(stat_columns),
        # Two decimals and a flag rather than three floats: this is the largest
        # bundled file and the app has to open from a memory stick with no
        # network, so a hundredth of a percentage point on a growth rate is
        # precision nobody reads and everybody downloads.
        "rigidity-points.csv": pl.concat(pairs_frames, how="vertical_relaxed")
        .with_columns(
            (
                pl.col("real_gdp_growth")
                < pl.col("real_gdp_growth").median().over(["vintage", "iso3c"])
            )
            .cast(pl.Int8)
            .alias("weak_year")
        )
        .sort(["vintage", "iso3c", "years"])
        .select(
            "vintage",
            "iso3c",
            "years",
            pl.col("gdp_growth").round(2),
            pl.col("expenditure_growth").round(2),
            "weak_year",
        ),
        "rigidity-readings.csv": pl.concat(
            readings_frames, how="vertical_relaxed"
        ).sort(
            ["vintage", "scope", "sort_order"]
        ),
    }


def render(frame: pl.DataFrame) -> str:
    """CSV text, with floats at a fixed precision so reruns are byte-stable.

    Refuses to write a text cell containing a comma, a quote or a newline. The
    browser reads these files with a deliberate `split(',')` and no quote
    handling (`src/engine/csv.ts` explains why), so a quoted field would not
    fail loudly there: it would shift every column after it by one and render
    as a plausible wrong number. Failing here is the only place it is visible.
    """
    for name, dtype in zip(frame.columns, frame.dtypes, strict=True):
        if dtype != pl.String:
            continue
        offenders = frame.filter(
            pl.col(name).str.contains(r'[,"\n]', literal=False)
        )[name].to_list()
        if offenders:
            msg = (
                f"Column {name!r} holds values the browser CSV reader cannot "
                f"parse: {offenders[:3]}. Rewrite the label without commas or "
                "quotes."
            )
            raise ValueError(msg)

    rounded = frame.with_columns(
        [
            pl.col(name).round(4)
            for name, dtype in zip(frame.columns, frame.dtypes, strict=True)
            if dtype in (pl.Float64, pl.Float32)
        ]
    )
    return rounded.write_csv()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="recompute and report differences without writing",
    )
    args = parser.parse_args()

    outputs = build()
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    drifted = False
    for name, frame in outputs.items():
        text = render(frame)
        path = OUT_DIR / name
        if args.check:
            current = path.read_text() if path.exists() else ""
            state = "same" if current == text else "DIFFERS"
            if state == "DIFFERS":
                drifted = True
            print(f"{name:24s} {frame.height:6d} rows  {len(text):8d} bytes  {state}")
        else:
            path.write_text(text)
            print(f"{name:24s} {frame.height:6d} rows  {len(text):8d} bytes  written")

    return 1 if (args.check and drifted) else 0


if __name__ == "__main__":
    sys.exit(main())
