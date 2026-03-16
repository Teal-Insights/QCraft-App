"""Tests for the interest_rate module — golden master parity for Uganda."""

from pathlib import Path

import polars as pl
import pytest
from polars.testing import assert_series_equal
from qcraft_engine.interest_rate import interest_rate_country

GOLDEN_DIR = Path(__file__).parent / "golden_masters" / "intermediate"


@pl.Config(set_fmt_float="full")
def _debug_series(name: str, result: pl.Series, expected: pl.Series, n: int = 5) -> str:
    """Helper for debugging mismatches (not used in assertions)."""
    diff = (result - expected).abs()
    return f"{name}: max_diff={diff.max()}, first {n} diffs: {diff.head(n).to_list()}"


# --- Fixtures ---


def _load_golden() -> pl.DataFrame:
    return pl.read_csv(GOLDEN_DIR / "interest_rate" / "uganda.csv")


def _load_baseline_v1() -> pl.DataFrame:
    raw = pl.read_csv(GOLDEN_DIR / "baseline_v1" / "uganda.csv")
    return raw.with_columns(
        pl.lit("UGA").alias("iso3c"),
        pl.lit("Uganda").alias("country"),
    )


def _build_macrofiscal(golden: pl.DataFrame) -> pl.DataFrame:
    """Build macrofiscal input from golden master historical data.

    The historical nominal_interest_rate values (2009-2029) in the golden master
    come directly from macrofiscal data, so using them as input is not circular.
    """
    hist = golden.filter(pl.col("years") <= 2029)
    return pl.DataFrame(
        {
            "iso3c": ["UGA"] * len(hist),
            "country": ["Uganda"] * len(hist),
            "years": hist["years"],
            "interest_rate_percent": hist["nominal_interest_rate"],
        }
    )


def _run_interest_rate() -> tuple[pl.DataFrame, pl.DataFrame]:
    """Run the function once, return (result, golden)."""
    golden = _load_golden()
    df_baseline_v1 = _load_baseline_v1()
    macrofiscal = _build_macrofiscal(golden)
    result = interest_rate_country(
        df_baseline_v1=df_baseline_v1,
        macrofiscal=macrofiscal,
        iso3c="UGA",
        select_rate="Nominal interest rate",
        long_run_interest_rate=1.0,
    )
    return result, golden


# Cache the result across tests in this module
_CACHED: tuple[pl.DataFrame, pl.DataFrame] | None = None


def _get_result_and_golden() -> tuple[pl.DataFrame, pl.DataFrame]:
    global _CACHED  # noqa: PLW0603
    if _CACHED is None:
        _CACHED = _run_interest_rate()
    return _CACHED


# --- Structure tests ---


def test_row_count() -> None:
    result, golden = _get_result_and_golden()
    assert len(result) == len(golden) == 91


def test_year_range() -> None:
    result, _ = _get_result_and_golden()
    assert result["years"].min() == 2009
    assert result["years"].max() == 2099


def test_columns() -> None:
    """Output has all golden master columns plus iso3c and country."""
    result, golden = _get_result_and_golden()
    gm_cols = set(golden.columns)
    result_data_cols = set(result.columns) - {"iso3c", "country"}
    assert gm_cols == result_data_cols


def test_metadata() -> None:
    result, _ = _get_result_and_golden()
    assert result["iso3c"][0] == "UGA"
    assert result["country"][0] == "Uganda"


# --- Nominal interest rate ---


def test_nominal_interest_rate_historical() -> None:
    """Historical values (2009-2029) match golden master."""
    result, golden = _get_result_and_golden()
    r = result.filter(pl.col("years") <= 2029)
    g = golden.filter(pl.col("years") <= 2029)
    assert_series_equal(
        r["nominal_interest_rate"],
        g["nominal_interest_rate"],
        check_exact=False,
        abs_tol=0.0001,
    )


def test_nominal_interest_rate_projection_constant() -> None:
    """In 'Nominal interest rate' mode, rate is constant from 2029 onward."""
    result, golden = _get_result_and_golden()
    r = result.filter(pl.col("years") >= 2029)
    g = golden.filter(pl.col("years") >= 2029)
    assert_series_equal(
        r["nominal_interest_rate"],
        g["nominal_interest_rate"],
        check_exact=False,
        abs_tol=0.0001,
    )


# --- Inflation passthrough ---


def test_inflation_parity() -> None:
    result, golden = _get_result_and_golden()
    assert_series_equal(
        result["inflation"],
        golden["inflation"],
        check_exact=False,
        abs_tol=0.0001,
    )


# --- Nominal GDP growth passthrough ---


def test_nominal_gdp_growth_parity() -> None:
    result, golden = _get_result_and_golden()
    assert_series_equal(
        result["nominal_gdp_growth_percent"],
        golden["nominal_gdp_growth_percent"],
        check_exact=False,
        abs_tol=0.001,
    )


# --- Derived: Real interest rate ---


def test_real_interest_rate_parity() -> None:
    result, golden = _get_result_and_golden()
    assert_series_equal(
        result["real_interest_rate"],
        golden["real_interest_rate"],
        check_exact=False,
        abs_tol=0.001,
    )


# --- Derived: Interest-growth differential ---


def test_interest_growth_differential_parity() -> None:
    result, golden = _get_result_and_golden()
    assert_series_equal(
        result["interest_growth_differential"],
        golden["interest_growth_differential"],
        check_exact=False,
        abs_tol=0.001,
    )


# --- Spot checks ---


def test_spot_check_2009() -> None:
    """Year 2009: high inflation → negative real rate."""
    result, _ = _get_result_and_golden()
    row = result.filter(pl.col("years") == 2009)
    assert abs(row["nominal_interest_rate"][0] - 5.218) < 0.01
    assert abs(row["real_interest_rate"][0] - (-10.399)) < 0.01


def test_spot_check_2029_boundary() -> None:
    """Anchor year: nominal rate = 8.039 (last macrofiscal value)."""
    result, _ = _get_result_and_golden()
    row = result.filter(pl.col("years") == 2029)
    assert abs(row["nominal_interest_rate"][0] - 8.039) < 0.001


def test_spot_check_2050() -> None:
    result, _ = _get_result_and_golden()
    row = result.filter(pl.col("years") == 2050)
    assert abs(row["nominal_interest_rate"][0] - 8.039) < 0.001
    assert abs(row["real_interest_rate"][0] - 4.386) < 0.001
    assert abs(row["interest_growth_differential"][0] - 0.929) < 0.001


def test_spot_check_2099() -> None:
    result, _ = _get_result_and_golden()
    row = result.filter(pl.col("years") == 2099)
    assert abs(row["nominal_interest_rate"][0] - 8.039) < 0.001
    assert abs(row["interest_growth_differential"][0] - 3.047) < 0.001


def test_interest_rate_invalid_iso3c() -> None:
    golden = _load_golden()
    df_baseline_v1 = _load_baseline_v1()
    macrofiscal = _build_macrofiscal(golden)
    with pytest.raises(ValueError, match="No data found"):
        interest_rate_country(
            df_baseline_v1=df_baseline_v1,
            macrofiscal=macrofiscal,
            iso3c="ZZZ",
        )
