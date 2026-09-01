"""What the engine does when the WEO does not carry the data it needs.

Zambia and Libya are the two live cases and Serbia is the third; all three are
pinned here on both vintages. The rule these tests hold the engine to comes from
the IMF workbook itself, not from a preference of ours: `Macrofiscal` row 19 is
`=D10/D4*100` and `Baseline` row 36 anchors the whole 2030-2099 projection on
its last WEO column, with no IFERROR anywhere in the chain. Feed that chain a
missing debt figure and every dependent cell reads `#VALUE!`. The workbook ships
that way, with Afghanistan selected and its debt path blank end to end.

So the engine must refuse, and it must refuse in a way a caller can act on. A
bare `TypeError` from `float(None)` says nothing a user interface can turn into
a sentence, and the TypeScript port used to carry the same null forward into a
debt path anchored at zero, which is worse than refusing.

See docs/country-coverage.md for the sweep these cases came out of.
"""

from __future__ import annotations

import json
from pathlib import Path

import polars as pl
import pytest
from qcraft_engine.data_loader import run_pipeline
from qcraft_engine.errors import MissingDebtAnchorError, MissingMacrofiscalInputError

FIXTURES = Path(__file__).parents[3] / "tests" / "fixtures" / "countries"
VINTAGES = ["weo-2024-10", "weo-2026-04"]

# Columns that are entirely null for at least one pinned country. Polars infers
# `Null` for an all-null column read from JSON, and the engine expects a numeric
# column carrying nulls, which is what the Parquet path actually hands it.
_NUMERIC = ["debt", "debt_to_gdp", "interest_rate_percent"]


def load_country(vintage: str, iso3c: str) -> dict[str, pl.DataFrame]:
    """Build the engine's `data` dict from a pinned single-country fixture."""
    raw = json.loads((FIXTURES / vintage / f"{iso3c}.json").read_text())
    data: dict[str, pl.DataFrame] = {}
    for name in ("demography", "productivity", "macrofiscal", "climate"):
        frame = pl.DataFrame(raw[name])
        casts = [
            pl.col(c).cast(pl.Float64)
            for c in _NUMERIC
            if c in frame.columns and frame.schema[c] == pl.Null
        ]
        data[name] = frame.with_columns(casts) if casts else frame
    return data


# --- The debt anchor ---------------------------------------------------------


@pytest.mark.parametrize("vintage", VINTAGES)
@pytest.mark.parametrize("iso3c", ["ZMB", "LBY"])
def test_missing_debt_anchor_raises_a_typed_error(vintage: str, iso3c: str) -> None:
    """Zambia and Libya refuse on both vintages, and say why."""
    data = load_country(vintage, iso3c)
    with pytest.raises(MissingDebtAnchorError) as excinfo:
        run_pipeline(data, iso3c, None)

    err = excinfo.value
    assert err.iso3c == iso3c
    assert err.field == "debt_to_gdp"
    assert isinstance(err.year, int)
    # The message is part of the contract: the TypeScript port emits the same
    # string, and scripts/differential/compare.py compares the two.
    assert str(err) == (
        f"No debt anchor for {iso3c}: {err.field} is missing for {err.year}, "
        "the last WEO year, which is the year the projection starts from"
    )


@pytest.mark.parametrize("vintage", VINTAGES)
@pytest.mark.parametrize("iso3c", ["ZMB", "LBY"])
def test_missing_debt_anchor_is_not_a_bare_typeerror(vintage: str, iso3c: str) -> None:
    """The old failure was `float() argument must be ... not 'NoneType'`."""
    data = load_country(vintage, iso3c)
    with pytest.raises(MissingDebtAnchorError) as excinfo:
        run_pipeline(data, iso3c, None)
    assert "float()" not in str(excinfo.value)


def test_the_anchor_is_the_year_the_projection_starts_from() -> None:
    """Zambia's anchor year moves between vintages, and the error follows it.

    The frozen vintage stops publishing Zambia's debt after 2023 and the current
    one after 2025, but both run their WEO horizon out to 2029. The engine
    anchors on the last WEO year either way, so that is the year named.
    """
    with pytest.raises(MissingDebtAnchorError) as frozen:
        run_pipeline(load_country("weo-2024-10", "ZMB"), "ZMB", None)
    with pytest.raises(MissingDebtAnchorError) as current:
        run_pipeline(load_country("weo-2026-04", "ZMB"), "ZMB", None)
    assert frozen.value.year == 2029
    assert current.value.year == 2029


def test_libya_has_no_debt_series_at_all() -> None:
    """Libya is the harder case: the WEO carries no debt figure in any year."""
    data = load_country("weo-2024-10", "LBY")
    macro = data["macrofiscal"]
    assert macro["debt"].null_count() == macro.height
    with pytest.raises(MissingDebtAnchorError):
        run_pipeline(data, "LBY", None)


# --- Serbia ------------------------------------------------------------------


@pytest.mark.parametrize("vintage", VINTAGES)
def test_serbia_projects_on_both_vintages(vintage: str) -> None:
    """Serbia's failure was Kosovo's population filed under Serbia's code.

    The exported country JSON already carried one population series, which is
    why the TypeScript engine always answered for Serbia while Python raised on
    the Parquet. With the frozen vintage's demography deduplicated, both sides
    read one series and Serbia projects.
    """
    result = run_pipeline(load_country(vintage, "SRB"), "SRB", None)
    fiscal = result["fiscal"]
    assert fiscal.height == 91
    anchor = fiscal.filter(pl.col("years") == 2029)["debt_to_gdp"][0]
    assert 20.0 < anchor < 120.0, "Serbia's debt ratio should be a real level"


@pytest.mark.parametrize("vintage", VINTAGES)
def test_serbia_population_is_serbias(vintage: str) -> None:
    """Kosovo is about a fifth of Serbia's size; a mix-up would show here."""
    data = load_country(vintage, "SRB")
    total = data["demography"].filter(
        (pl.col("years") == 2020)
        & (pl.col("status") == "Medium")
        & (pl.col("age_group") == "Total")
    )
    assert total.height == 1, "one population series per code, not two"
    assert 6_000 < total["values"][0] < 8_000, "Serbia is about 6.9 million"


# --- Countries the fix rescues ----------------------------------------------


def test_uganda_still_projects() -> None:
    """The control: the verification country is untouched by any of this."""
    result = run_pipeline(load_country("weo-2024-10", "UGA"), "UGA", None)
    assert result["fiscal"].height == 91


def test_a_pre_2009_gap_does_not_block_a_country() -> None:
    """The engine reads 2009 onward; nulls before that are none of its business.

    Eleven selectable countries per vintage were failing on rows the projection
    never touches. The workbook's own `Baseline` sheet starts its year axis at
    2009, so reading only from there is what the workbook does.
    """
    data = load_country("weo-2024-10", "UGA")
    macro = data["macrofiscal"]
    holed = macro.with_columns(
        pl.when(pl.col("years") < 2009)
        .then(None)
        .otherwise(pl.col("debt_to_gdp"))
        .alias("debt_to_gdp")
    )
    data["macrofiscal"] = holed
    result = run_pipeline(data, "UGA", None)
    assert result["fiscal"].height == 91


def test_a_null_inside_the_window_is_named_not_crashed() -> None:
    """A gap the engine does read gets a typed error naming field and year."""
    data = load_country("weo-2024-10", "UGA")
    macro = data["macrofiscal"]
    data["macrofiscal"] = macro.with_columns(
        pl.when(pl.col("years") == 2015)
        .then(None)
        .otherwise(pl.col("primary_expenditure"))
        .alias("primary_expenditure")
    )
    with pytest.raises(MissingMacrofiscalInputError) as excinfo:
        run_pipeline(data, "UGA", None)
    assert excinfo.value.field == "primary_expenditure"
    assert excinfo.value.year == 2015
    assert "float()" not in str(excinfo.value)
