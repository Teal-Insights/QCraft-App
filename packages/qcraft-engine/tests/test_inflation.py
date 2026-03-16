"""Tests for the inflation module — golden master parity for Uganda."""

import math
from pathlib import Path

import polars as pl
import pytest
from polars.testing import assert_series_equal
from qcraft_engine.inflation import inflation_country

GOLDEN_DIR = Path(__file__).parent / "golden_masters" / "intermediate" / "inflation"


@pytest.fixture
def uganda_golden() -> pl.DataFrame:
    return pl.read_csv(GOLDEN_DIR / "uganda.csv")


@pytest.fixture
def deflator_data(uganda_golden: pl.DataFrame) -> pl.DataFrame:
    """Build GDP deflator index from golden master inflation rates.

    inflation(t) = (deflator(t) / deflator(t-1)) * 100 - 100
    So: deflator(t) = deflator(t-1) * (1 + inflation(t) / 100)

    We only need historical years (through 2029). Start with an arbitrary
    base deflator for 2008 (= 100) and compound forward.
    """
    hist = uganda_golden.filter(pl.col("years") <= 2029)
    base_deflator = 100.0  # arbitrary base for 2008

    years_list: list[int] = [2008]
    deflator_list: list[float] = [base_deflator]

    for row in hist.iter_rows(named=True):
        year = int(row["years"])
        infl = float(row["inflation"])
        prev = deflator_list[-1]
        deflator_list.append(prev * (1 + infl / 100))
        years_list.append(year)

    return pl.DataFrame(
        {
            "iso3c": ["UGA"] * len(years_list),
            "country": ["Uganda"] * len(years_list),
            "years": years_list,
            "gdp_deflator": deflator_list,
        }
    )


def test_inflation_row_count(
    deflator_data: pl.DataFrame,
    uganda_golden: pl.DataFrame,
) -> None:
    """Output has 91 rows (2009-2099)."""
    result = inflation_country(deflator_data, iso3c="UGA")
    assert len(result) == len(uganda_golden) == 91


def test_inflation_year_range(deflator_data: pl.DataFrame) -> None:
    """Output spans 2009-2099."""
    result = inflation_country(deflator_data, iso3c="UGA")
    assert result["years"].min() == 2009
    assert result["years"].max() == 2099


def test_inflation_columns(deflator_data: pl.DataFrame) -> None:
    """Output has all required columns per SPEC 4.3."""
    result = inflation_country(deflator_data, iso3c="UGA")
    expected_cols = {"iso3c", "country", "years", "inflation"}
    assert set(result.columns) == expected_cols


def test_inflation_historical_parity(
    deflator_data: pl.DataFrame,
    uganda_golden: pl.DataFrame,
) -> None:
    """Historical inflation (2009-2029) matches golden master."""
    result = inflation_country(deflator_data, iso3c="UGA")
    result_hist = result.filter(pl.col("years").is_between(2009, 2029))
    golden_hist = uganda_golden.filter(pl.col("years").is_between(2009, 2029))

    assert_series_equal(
        result_hist["inflation"],
        golden_hist["inflation"],
        check_exact=False,
        abs_tol=0.0001,
    )


def test_inflation_projection_parity(
    deflator_data: pl.DataFrame,
    uganda_golden: pl.DataFrame,
) -> None:
    """Logistic convergence (2030-2099) matches golden master."""
    result = inflation_country(deflator_data, iso3c="UGA")
    result_proj = result.filter(pl.col("years") >= 2030)
    golden_proj = uganda_golden.filter(pl.col("years") >= 2030)

    assert_series_equal(
        result_proj["inflation"],
        golden_proj["inflation"],
        check_exact=False,
        abs_tol=0.0001,
    )


def test_inflation_logistic_spot_check_start_ne_end(
    deflator_data: pl.DataFrame,
) -> None:
    """Verify logistic formula with start != end (catches bugs hidden by 3.5/3.5)."""
    result = inflation_country(
        deflator_data, iso3c="UGA", inflation_start=8.0, inflation_end=2.0
    )
    # Year 2030: counter=1, turning_point=5, rate=0.5
    row_2030 = result.filter(pl.col("years") == 2030)
    counter = 1
    sigmoid = 1.0 / (1.0 + math.exp(-0.5 * (counter - 5)))
    expected = 8.0 + (2.0 - 8.0) * (sigmoid**0.5)
    assert row_2030["inflation"][0] == pytest.approx(expected, abs=0.0001)

    # Year 2035: counter=6 (just past turning point)
    row_2035 = result.filter(pl.col("years") == 2035)
    counter = 6
    sigmoid = 1.0 / (1.0 + math.exp(-0.5 * (counter - 5)))
    expected = 8.0 + (2.0 - 8.0) * (sigmoid**0.5)
    assert row_2035["inflation"][0] == pytest.approx(expected, abs=0.0001)


def test_inflation_converges_to_end(deflator_data: pl.DataFrame) -> None:
    """By 2099, inflation has converged to inflation_end."""
    result = inflation_country(
        deflator_data, iso3c="UGA", inflation_start=8.0, inflation_end=2.0
    )
    row_2099 = result.filter(pl.col("years") == 2099)
    assert row_2099["inflation"][0] == pytest.approx(2.0, abs=0.01)


def test_inflation_monotonic_convergence(deflator_data: pl.DataFrame) -> None:
    """When start > end, projected inflation decreases monotonically."""
    result = inflation_country(
        deflator_data, iso3c="UGA", inflation_start=8.0, inflation_end=2.0
    )
    proj = result.filter(pl.col("years") >= 2030)["inflation"].to_list()
    for i in range(1, len(proj)):
        assert proj[i] <= proj[i - 1] + 1e-10, (
            f"Non-monotonic at year {2030 + i}: {proj[i]} > {proj[i - 1]}"
        )


def test_inflation_metadata_columns(deflator_data: pl.DataFrame) -> None:
    """iso3c and country columns contain correct values."""
    result = inflation_country(deflator_data, iso3c="UGA")
    assert result["iso3c"][0] == "UGA"
    assert result["country"][0] == "Uganda"
    assert result["iso3c"].n_unique() == 1
    assert result["country"].n_unique() == 1


def test_inflation_invalid_iso3c(deflator_data: pl.DataFrame) -> None:
    with pytest.raises(ValueError, match="No data found"):
        inflation_country(deflator_data, iso3c="ZZZ")
