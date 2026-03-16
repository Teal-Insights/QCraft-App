"""Tests for the fiscal module — golden master parity for Uganda."""

from pathlib import Path

import polars as pl
import pytest
from polars.testing import assert_series_equal
from qcraft_engine.fiscal import baseline_country

GOLDEN_DIR = Path(__file__).parent / "golden_masters" / "intermediate"


# --- Fixtures ---


@pytest.fixture
def fiscal_golden() -> pl.DataFrame:
    return pl.read_csv(GOLDEN_DIR / "fiscal" / "uganda.csv")


@pytest.fixture
def baseline_v1_golden() -> pl.DataFrame:
    raw = pl.read_csv(GOLDEN_DIR / "baseline_v1" / "uganda.csv")
    return raw.with_columns(
        pl.lit("UGA").alias("iso3c"),
        pl.lit("Uganda").alias("country"),
    )


@pytest.fixture
def interest_rate_golden() -> pl.DataFrame:
    raw = pl.read_csv(GOLDEN_DIR / "interest_rate" / "uganda.csv")
    return raw.with_columns(
        pl.lit("UGA").alias("iso3c"),
        pl.lit("Uganda").alias("country"),
    )


@pytest.fixture
def macrofiscal(
    fiscal_golden: pl.DataFrame, baseline_v1_golden: pl.DataFrame
) -> pl.DataFrame:
    """Build macrofiscal input from golden master WEO-period data.

    Fiscal WEO-period values come directly from macrofiscal, so using them
    as input is not circular. We also need nominal_gdp from baseline_v1.
    """
    weo = fiscal_golden.filter(pl.col("years") <= 2029)
    bv1_weo = baseline_v1_golden.filter(pl.col("years") <= 2029)
    return pl.DataFrame(
        {
            "iso3c": ["UGA"] * len(weo),
            "country": ["Uganda"] * len(weo),
            "years": weo["years"],
            "revenue": weo["revenue"],
            "revenue_percent_gdp": weo["revenue_percent_gdp"],
            "primary_expenditure": weo["primary_expenditure"],
            "primary_expenditure_percent_gdp": weo["primary_expenditure_percent_gdp"],
            "primary_balance": weo["primary_balance"],
            "primary_balance_percent_gdp": weo["primary_balance_percent_gdp"],
            "interest_expenditure": weo["interest_expenditure"],
            "interest_expenditure_percent_gdp": weo["interest_expenditure_percent_gdp"],
            "total_expenditure": weo["total_expenditure"],
            "overall_balance": weo["overall_balance"],
            "overall_balance_percent_gdp": weo["overall_balance_percent_gdp"],
            "debt_to_gdp": weo["debt_to_gdp"],
            "debt": weo["debt"],
            "nominal_gdp": bv1_weo["nominal_gdp"],
            "interest_rate_percent": pl.read_csv(
                GOLDEN_DIR / "interest_rate" / "uganda.csv"
            ).filter(pl.col("years") <= 2029)["nominal_interest_rate"],
        }
    )


@pytest.fixture
def result(
    baseline_v1_golden: pl.DataFrame,
    interest_rate_golden: pl.DataFrame,
    macrofiscal: pl.DataFrame,
) -> pl.DataFrame:
    """Run baseline_country once and share across tests."""
    return baseline_country(
        data_baseline=baseline_v1_golden,
        data_interest=interest_rate_golden,
        data_macrofiscal=macrofiscal,
        debt_target=60.0,
        fiscal_rule="Yes",
        iso3c="UGA",
    )


# --- Structure tests ---


def test_row_count(result: pl.DataFrame, fiscal_golden: pl.DataFrame) -> None:
    assert len(result) == len(fiscal_golden) == 91


def test_year_range(result: pl.DataFrame) -> None:
    assert result["years"].min() == 2009
    assert result["years"].max() == 2099


def test_columns(result: pl.DataFrame, fiscal_golden: pl.DataFrame) -> None:
    """Output has exactly the golden master columns."""
    assert set(result.columns) == set(fiscal_golden.columns)


# --- WEO period parity (years <= 2029) ---


def test_revenue_weo(result: pl.DataFrame, fiscal_golden: pl.DataFrame) -> None:
    r = result.filter(pl.col("years") <= 2029)
    g = fiscal_golden.filter(pl.col("years") <= 2029)
    assert_series_equal(r["revenue"], g["revenue"], check_exact=False, rel_tol=1e-6)


def test_debt_to_gdp_weo(result: pl.DataFrame, fiscal_golden: pl.DataFrame) -> None:
    r = result.filter(pl.col("years") <= 2029)
    g = fiscal_golden.filter(pl.col("years") <= 2029)
    assert_series_equal(
        r["debt_to_gdp"], g["debt_to_gdp"], check_exact=False, abs_tol=0.001
    )


# --- Full parity: all 16 columns ---


def test_revenue_parity(result: pl.DataFrame, fiscal_golden: pl.DataFrame) -> None:
    assert_series_equal(
        result["revenue"], fiscal_golden["revenue"], check_exact=False, rel_tol=1e-4
    )


def test_revenue_percent_gdp_parity(
    result: pl.DataFrame, fiscal_golden: pl.DataFrame
) -> None:
    assert_series_equal(
        result["revenue_percent_gdp"],
        fiscal_golden["revenue_percent_gdp"],
        check_exact=False,
        abs_tol=0.001,
    )


def test_primary_expenditure_parity(
    result: pl.DataFrame, fiscal_golden: pl.DataFrame
) -> None:
    assert_series_equal(
        result["primary_expenditure"],
        fiscal_golden["primary_expenditure"],
        check_exact=False,
        rel_tol=1e-4,
    )


def test_primary_expenditure_percent_gdp_parity(
    result: pl.DataFrame, fiscal_golden: pl.DataFrame
) -> None:
    assert_series_equal(
        result["primary_expenditure_percent_gdp"],
        fiscal_golden["primary_expenditure_percent_gdp"],
        check_exact=False,
        abs_tol=0.001,
    )


def test_primary_balance_parity(
    result: pl.DataFrame, fiscal_golden: pl.DataFrame
) -> None:
    assert_series_equal(
        result["primary_balance"],
        fiscal_golden["primary_balance"],
        check_exact=False,
        rel_tol=1e-4,
    )


def test_primary_balance_percent_gdp_parity(
    result: pl.DataFrame, fiscal_golden: pl.DataFrame
) -> None:
    assert_series_equal(
        result["primary_balance_percent_gdp"],
        fiscal_golden["primary_balance_percent_gdp"],
        check_exact=False,
        abs_tol=0.001,
    )


def test_interest_expenditure_parity(
    result: pl.DataFrame, fiscal_golden: pl.DataFrame
) -> None:
    assert_series_equal(
        result["interest_expenditure"],
        fiscal_golden["interest_expenditure"],
        check_exact=False,
        rel_tol=1e-4,
    )


def test_interest_expenditure_percent_gdp_parity(
    result: pl.DataFrame, fiscal_golden: pl.DataFrame
) -> None:
    assert_series_equal(
        result["interest_expenditure_percent_gdp"],
        fiscal_golden["interest_expenditure_percent_gdp"],
        check_exact=False,
        abs_tol=0.001,
    )


def test_total_expenditure_parity(
    result: pl.DataFrame, fiscal_golden: pl.DataFrame
) -> None:
    assert_series_equal(
        result["total_expenditure"],
        fiscal_golden["total_expenditure"],
        check_exact=False,
        rel_tol=1e-4,
    )


def test_overall_balance_parity(
    result: pl.DataFrame, fiscal_golden: pl.DataFrame
) -> None:
    assert_series_equal(
        result["overall_balance"],
        fiscal_golden["overall_balance"],
        check_exact=False,
        rel_tol=1e-4,
    )


def test_overall_balance_percent_gdp_parity(
    result: pl.DataFrame, fiscal_golden: pl.DataFrame
) -> None:
    assert_series_equal(
        result["overall_balance_percent_gdp"],
        fiscal_golden["overall_balance_percent_gdp"],
        check_exact=False,
        abs_tol=0.001,
    )


def test_debt_to_gdp_parity(result: pl.DataFrame, fiscal_golden: pl.DataFrame) -> None:
    assert_series_equal(
        result["debt_to_gdp"],
        fiscal_golden["debt_to_gdp"],
        check_exact=False,
        abs_tol=0.001,
    )


def test_debt_parity(result: pl.DataFrame, fiscal_golden: pl.DataFrame) -> None:
    assert_series_equal(
        result["debt"], fiscal_golden["debt"], check_exact=False, rel_tol=1e-4
    )


def test_dspb_parity(result: pl.DataFrame, fiscal_golden: pl.DataFrame) -> None:
    """DSPB matches golden master (null for 2009, populated from 2010)."""
    # Skip year 2009 which is null
    r = result.filter(pl.col("years") >= 2010)
    g = fiscal_golden.filter(pl.col("years") >= 2010)
    assert_series_equal(
        r["debt_stabilizing_primary_balance"],
        g["debt_stabilizing_primary_balance"],
        check_exact=False,
        abs_tol=0.001,
    )


def test_fiscal_gap_parity(result: pl.DataFrame, fiscal_golden: pl.DataFrame) -> None:
    """Fiscal gap matches golden master including null placement."""
    # Null years must match exactly
    r_null = result.filter(pl.col("fiscal_gap").is_null())
    g_null = fiscal_golden.filter(pl.col("fiscal_gap").is_null())
    result_nulls = r_null["years"].to_list()
    golden_nulls = g_null["years"].to_list()
    assert result_nulls == golden_nulls, (
        f"Null year mismatch: result={result_nulls}, golden={golden_nulls}"
    )

    # Non-null values must match
    gm_non_null = fiscal_golden.filter(pl.col("fiscal_gap").is_not_null())
    r_non_null = result.filter(pl.col("fiscal_gap").is_not_null())
    assert_series_equal(
        r_non_null["fiscal_gap"],
        gm_non_null["fiscal_gap"],
        check_exact=False,
        rel_tol=1e-4,
    )


def test_dspb_null_2009(result: pl.DataFrame) -> None:
    """DSPB is null for 2009 (no t-1 data)."""
    row = result.filter(pl.col("years") == 2009)
    assert row["debt_stabilizing_primary_balance"][0] is None


# --- Spot checks ---


def test_spot_check_2050(result: pl.DataFrame) -> None:
    row = result.filter(pl.col("years") == 2050)
    assert row["debt_to_gdp"][0] == pytest.approx(34.637, abs=0.01)
    assert row["revenue_percent_gdp"][0] == pytest.approx(18.585, abs=0.01)


def test_spot_check_2099(result: pl.DataFrame) -> None:
    row = result.filter(pl.col("years") == 2099)
    assert row["debt_to_gdp"][0] == pytest.approx(46.989, abs=0.01)
    assert row["revenue_percent_gdp"][0] == pytest.approx(18.585, abs=0.01)


def test_debt_floor_applied(result: pl.DataFrame) -> None:
    """Baseline applies max(0, debt_to_gdp) — no negative values."""
    assert (result["debt_to_gdp"] >= 0).all()


def test_fiscal_invalid_iso3c(
    baseline_v1_golden: pl.DataFrame,
    interest_rate_golden: pl.DataFrame,
    macrofiscal: pl.DataFrame,
) -> None:
    with pytest.raises(ValueError, match="No data found"):
        baseline_country(
            data_baseline=baseline_v1_golden,
            data_interest=interest_rate_golden,
            data_macrofiscal=macrofiscal,
            debt_target=60.0,
            fiscal_rule="Yes",
            iso3c="ZZZ",
        )
