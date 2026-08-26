"""Structural and sanity checks on a freshly built vintage.

These are guards against pipeline bugs, not against data revisions: everything
checked here is something that should hold for *any* WEO/WPP vintage.
"""

import polars as pl

from qcraft_pipeline import config


class ValidationError(Exception):
    """A built vintage failed a structural check."""


def _check(failures: list[str], ok: bool, message: str) -> None:
    if not ok:
        failures.append(message)


def check_schema(
    tables: dict[str, pl.DataFrame], base: dict[str, pl.DataFrame]
) -> list[str]:
    """New tables must have exactly the base vintage's columns and dtypes."""
    failures: list[str] = []
    for name in config.DATASETS:
        new_schema = dict(tables[name].schema)
        old_schema = dict(base[name].schema)
        if list(new_schema) != list(old_schema):
            failures.append(
                f"{name}: column names/order differ from base vintage\n"
                f"    base: {list(old_schema)}\n"
                f"    new : {list(new_schema)}"
            )
            continue
        for col, dtype in old_schema.items():
            _check(
                failures,
                new_schema[col] == dtype,
                f"{name}.{col}: dtype {new_schema[col]} != base {dtype}",
            )
    return failures


def check_keys(tables: dict[str, pl.DataFrame]) -> list[str]:
    """No duplicate keys — the defect that merged Kosovo into Serbia."""
    failures: list[str] = []
    keys = {
        "macrofiscal": ["iso3c", "years"],
        "demography": ["iso3c", "years", "age_group", "status"],
        "productivity": ["iso3c", "years"],
        "climate": ["iso3c", "climate_scenario", "years"],
    }
    for name, key in keys.items():
        dupes = tables[name].group_by(key).len().filter(pl.col("len") > 1)
        _check(
            failures,
            dupes.is_empty(),
            f"{name}: {dupes.height} duplicate {key} keys "
            f"(e.g. {dupes.head(3).to_dicts()})",
        )
    return failures


def check_units(new: pl.DataFrame, base: pl.DataFrame) -> list[str]:
    """Catch a scale error (units vs billions) by comparing shared history.

    Vintage revisions move levels by a few percent. A missing or doubled 1e9
    divisor moves them by nine orders of magnitude, so a loose band separates the
    two cleanly without flagging genuine revisions.
    """
    failures: list[str] = []
    cols = ["real_gdp", "nominal_gdp", "revenue", "expenditure", "debt"]
    joined = (
        new.select("iso3c", "years", *cols)
        .join(
            base.select("iso3c", "years", *cols), on=["iso3c", "years"], suffix="_base"
        )
        .filter(pl.col("years") <= 2019)  # settled history, pre-COVID
    )
    for col in cols:
        median = (
            joined.filter(
                pl.col(f"{col}_base").is_not_null()
                & (pl.col(f"{col}_base").abs() > 1e-9)
                & pl.col(col).is_not_null()
            )
            .select((pl.col(col) / pl.col(f"{col}_base")).alias("r"))["r"]
            .median()
        )
        if median is None:
            failures.append(f"units: no overlapping history for {col}")
            continue
        ratio = float(median)  # type: ignore[arg-type]
        _check(
            failures,
            0.5 < ratio < 2.0,
            f"units: median new/base ratio for {col} is {ratio:.4g}, "
            f"expected ~1 — likely a scale error",
        )
    return failures


def check_ranges(tables: dict[str, pl.DataFrame]) -> list[str]:
    """Values that would indicate a mangled transform rather than a revision."""
    failures: list[str] = []

    macro = tables["macrofiscal"]
    _check(
        failures,
        int(macro["years"].max()) == config.MACROFISCAL_YEAR_MAX,  # type: ignore[arg-type]
        f"macrofiscal: max year {macro['years'].max()} != "
        f"{config.MACROFISCAL_YEAR_MAX}",
    )
    _check(
        failures,
        int(macro["years"].min()) == config.MACROFISCAL_YEAR_MIN,  # type: ignore[arg-type]
        f"macrofiscal: min year {macro['years'].min()} != "
        f"{config.MACROFISCAL_YEAR_MIN}",
    )
    wild = macro.filter(pl.col("debt_to_gdp").abs() > 1000)
    _check(
        failures,
        wild.is_empty(),
        f"macrofiscal: {wild.height} rows with |debt_to_gdp| > 1000%",
    )
    neg = macro.filter(pl.col("nominal_gdp") <= 0)
    _check(failures, neg.is_empty(), f"macrofiscal: {neg.height} rows nominal_gdp <= 0")

    demo = tables["demography"]
    _check(
        failures,
        set(demo["status"].unique().to_list()) == set(config.WPP_VARIANTS),
        f"demography: variants {sorted(demo['status'].unique().to_list())} "
        f"!= {sorted(config.WPP_VARIANTS)}",
    )
    _check(
        failures,
        set(demo["age_group"].unique().to_list()) == {"15-64", "65+", "Total"},
        f"demography: age groups {sorted(demo['age_group'].unique().to_list())}",
    )
    _check(
        failures,
        demo.filter(pl.col("values") < 0).is_empty(),
        "demography: negative population values",
    )

    # Every (country, variant, age group) needs the full year grid: the engine
    # indexes demography by year and KeyErrors on a hole. The WPP High/Low files
    # only cover the projection period, so this catches a missing backfill.
    expected_years = config.DEMOGRAPHY_YEAR_MAX - config.DEMOGRAPHY_YEAR_MIN + 1
    coverage = demo.group_by("iso3c", "status", "age_group").agg(
        pl.col("years").n_unique().alias("n")
    )
    short = coverage.filter(pl.col("n") != expected_years)
    _check(
        failures,
        short.is_empty(),
        f"demography: {short.height} (country, variant, age group) groups do not "
        f"cover all {expected_years} years "
        f"(e.g. {short.head(3).to_dicts()})",
    )

    # Total must be at least 15-64 + 65+ for every country-year-variant.
    wide = demo.pivot(
        index=["iso3c", "years", "status"], on="age_group", values="values"
    )
    bad = wide.filter(pl.col("Total") < (pl.col("15-64") + pl.col("65+")) - 1e-6)
    _check(
        failures,
        bad.is_empty(),
        f"demography: {bad.height} rows where Total < (15-64) + (65+)",
    )
    return failures


def run_all(
    tables: dict[str, pl.DataFrame], base: dict[str, pl.DataFrame]
) -> list[str]:
    return [
        *check_schema(tables, base),
        *check_keys(tables),
        *check_units(tables["macrofiscal"], base["macrofiscal"]),
        *check_ranges(tables),
    ]
