"""Tests for the baseline_v1 module — golden master parity for Uganda."""

from pathlib import Path

import polars as pl
import pytest
from polars.testing import assert_series_equal
from qcraft_engine.baseline_v1 import baseline_v1

GOLDEN_DIR = Path(__file__).parent / "golden_masters" / "intermediate"


@pytest.fixture
def uganda_golden() -> pl.DataFrame:
    return pl.read_csv(GOLDEN_DIR / "baseline_v1" / "uganda.csv")


@pytest.fixture
def demography_golden() -> pl.DataFrame:
    return pl.read_csv(GOLDEN_DIR / "demography" / "uganda.csv")


@pytest.fixture
def inflation_golden() -> pl.DataFrame:
    return pl.read_csv(GOLDEN_DIR / "inflation" / "uganda.csv")


@pytest.fixture
def productivity_golden() -> pl.DataFrame:
    return pl.read_csv(GOLDEN_DIR / "productivity" / "uganda.csv")


@pytest.fixture
def data_demography(demography_golden: pl.DataFrame) -> pl.DataFrame:
    """Build demography input matching demography_country() output."""
    return demography_golden.with_columns(
        pl.lit("UGA").alias("iso3c"),
        pl.lit("Uganda").alias("country"),
    )


@pytest.fixture
def data_inflation(inflation_golden: pl.DataFrame) -> pl.DataFrame:
    """Build inflation input matching inflation_country() output."""
    return inflation_golden.with_columns(
        pl.lit("UGA").alias("iso3c"),
        pl.lit("Uganda").alias("country"),
    )


@pytest.fixture
def data_productivity(productivity_golden: pl.DataFrame) -> pl.DataFrame:
    """Productivity module output (pre-computed)."""
    return productivity_golden


@pytest.fixture
def macrofiscal(uganda_golden: pl.DataFrame) -> pl.DataFrame:
    """Build macrofiscal input from the golden master WEO-period data.

    The golden master's WEO-period values (years <= 2029) come directly from
    macrofiscal data, so we can use them as-is for the input fixture.
    """
    weo = uganda_golden.filter(pl.col("years") <= 2029)
    return pl.DataFrame(
        {
            "iso3c": ["UGA"] * len(weo),
            "country": ["Uganda"] * len(weo),
            "years": weo["years"],
            "real_gdp": weo["real_gdp"],
            "nominal_gdp": weo["nominal_gdp"],
            "real_gdp_growth_percent": weo["real_gdp_growth_percent"],
            "nominal_gdp_growth_percent": weo["nominal_gdp_growth_percent"],
            "gdp_deflator_growth_percent": weo["gdp_deflator_growth_percent"],
        }
    )


@pytest.fixture
def result(
    data_demography: pl.DataFrame,
    data_inflation: pl.DataFrame,
    data_productivity: pl.DataFrame,
    macrofiscal: pl.DataFrame,
) -> pl.DataFrame:
    """Run baseline_v1 once and share across tests."""
    return baseline_v1(
        data_demography=data_demography,
        data_inflation=data_inflation,
        data_productivity=data_productivity,
        macrofiscal=macrofiscal,
        iso3c="UGA",
    )


# --- Structure tests ---


def test_row_count(result: pl.DataFrame, uganda_golden: pl.DataFrame) -> None:
    assert len(result) == len(uganda_golden) == 91


def test_year_range(result: pl.DataFrame) -> None:
    assert result["years"].min() == 2009
    assert result["years"].max() == 2099


def test_columns(result: pl.DataFrame, uganda_golden: pl.DataFrame) -> None:
    """Output has all golden master columns plus iso3c and country."""
    gm_cols = set(uganda_golden.columns)
    result_data_cols = set(result.columns) - {"iso3c", "country"}
    assert gm_cols == result_data_cols


def test_metadata(result: pl.DataFrame) -> None:
    assert result["iso3c"][0] == "UGA"
    assert result["country"][0] == "Uganda"


# --- Employment growth (ALL years, WAP-derived) ---


def test_employment_growth_parity(
    result: pl.DataFrame, uganda_golden: pl.DataFrame
) -> None:
    """Employment growth matches golden master for all years."""
    assert_series_equal(
        result["employment_growth"],
        uganda_golden["employment_growth"],
        check_exact=False,
        abs_tol=0.0001,
    )


# --- Productivity back-calculation (WEO overlap) ---


def test_productivity_weo_overlap_parity(
    result: pl.DataFrame, uganda_golden: pl.DataFrame
) -> None:
    """Back-calculated productivity during WEO overlap [2023-2029] matches."""
    r = result.filter(pl.col("years").is_between(2023, 2029))
    g = uganda_golden.filter(pl.col("years").is_between(2023, 2029))
    assert_series_equal(
        r["labour_productivity_growth"],
        g["labour_productivity_growth"],
        check_exact=False,
        abs_tol=0.001,
    )


def test_productivity_projection_parity(
    result: pl.DataFrame, uganda_golden: pl.DataFrame
) -> None:
    """Logistic convergence productivity (2030+) matches golden master."""
    r = result.filter(pl.col("years") >= 2030)
    g = uganda_golden.filter(pl.col("years") >= 2030)
    assert_series_equal(
        r["labour_productivity_growth"],
        g["labour_productivity_growth"],
        check_exact=False,
        abs_tol=0.0001,
    )


# --- GDP deflator growth ---


def test_deflator_growth_parity(
    result: pl.DataFrame, uganda_golden: pl.DataFrame
) -> None:
    """GDP deflator growth matches golden master for all years."""
    assert_series_equal(
        result["gdp_deflator_growth_percent"],
        uganda_golden["gdp_deflator_growth_percent"],
        check_exact=False,
        abs_tol=0.0001,
    )


# --- Real GDP ---


def test_real_gdp_parity(result: pl.DataFrame, uganda_golden: pl.DataFrame) -> None:
    """Real GDP levels match golden master."""
    assert_series_equal(
        result["real_gdp"],
        uganda_golden["real_gdp"],
        check_exact=False,
        rel_tol=1e-6,
    )


def test_real_gdp_growth_parity(
    result: pl.DataFrame, uganda_golden: pl.DataFrame
) -> None:
    """Real GDP growth rates match golden master."""
    assert_series_equal(
        result["real_gdp_growth_percent"],
        uganda_golden["real_gdp_growth_percent"],
        check_exact=False,
        abs_tol=0.001,
    )


# --- Nominal GDP ---


def test_nominal_gdp_parity(result: pl.DataFrame, uganda_golden: pl.DataFrame) -> None:
    """Nominal GDP levels match golden master."""
    assert_series_equal(
        result["nominal_gdp"],
        uganda_golden["nominal_gdp"],
        check_exact=False,
        rel_tol=1e-6,
    )


def test_nominal_gdp_growth_parity(
    result: pl.DataFrame, uganda_golden: pl.DataFrame
) -> None:
    """Nominal GDP growth rates match golden master."""
    assert_series_equal(
        result["nominal_gdp_growth_percent"],
        uganda_golden["nominal_gdp_growth_percent"],
        check_exact=False,
        abs_tol=0.001,
    )


# --- Population growth ---


def test_population_growth_parity(
    result: pl.DataFrame, uganda_golden: pl.DataFrame
) -> None:
    """Population growth (from total pop, not WAP) matches golden master."""
    # Skip first row (2009) which may be null in demography
    r = result.filter(pl.col("years") >= 2010)
    g = uganda_golden.filter(pl.col("years") >= 2010)
    assert_series_equal(
        r["population_growth"],
        g["population_growth"],
        check_exact=False,
        abs_tol=0.0001,
    )


# --- Working age population pass-through ---


def test_working_age_population_parity(
    result: pl.DataFrame, uganda_golden: pl.DataFrame
) -> None:
    assert_series_equal(
        result["working_age_population"],
        uganda_golden["working_age_population"].cast(pl.Float64),
        check_exact=False,
        abs_tol=0.01,
    )


# --- Spot checks from oracle verification table ---


def test_spot_check_2009(result: pl.DataFrame, uganda_golden: pl.DataFrame) -> None:
    row = result.filter(pl.col("years") == 2009)
    gm_row = uganda_golden.filter(pl.col("years") == 2009)
    assert row["real_gdp"][0] == pytest.approx(gm_row["real_gdp"][0], rel=1e-4)
    assert row["nominal_gdp"][0] == pytest.approx(gm_row["nominal_gdp"][0], rel=1e-4)
    assert row["employment_growth"][0] == pytest.approx(
        gm_row["employment_growth"][0], abs=0.01
    )


def test_spot_check_2029_weo_boundary(
    result: pl.DataFrame, uganda_golden: pl.DataFrame
) -> None:
    """Last WEO year: deflator should be macrofiscal-derived, NOT 3.5."""
    row = result.filter(pl.col("years") == 2029)
    gm_row = uganda_golden.filter(pl.col("years") == 2029)
    assert row["real_gdp"][0] == pytest.approx(gm_row["real_gdp"][0], rel=1e-4)
    assert row["gdp_deflator_growth_percent"][0] == pytest.approx(
        gm_row["gdp_deflator_growth_percent"][0], abs=0.01
    )


def test_spot_check_2050(result: pl.DataFrame, uganda_golden: pl.DataFrame) -> None:
    row = result.filter(pl.col("years") == 2050)
    gm_row = uganda_golden.filter(pl.col("years") == 2050)
    assert row["real_gdp"][0] == pytest.approx(gm_row["real_gdp"][0], rel=1e-4)
    assert row["nominal_gdp"][0] == pytest.approx(gm_row["nominal_gdp"][0], rel=1e-3)


def test_spot_check_2099(result: pl.DataFrame, uganda_golden: pl.DataFrame) -> None:
    row = result.filter(pl.col("years") == 2099)
    gm_row = uganda_golden.filter(pl.col("years") == 2099)
    assert row["real_gdp"][0] == pytest.approx(gm_row["real_gdp"][0], rel=1e-4)
    assert row["labour_productivity_growth"][0] == pytest.approx(
        gm_row["labour_productivity_growth"][0], abs=0.001
    )
    assert row["gdp_deflator_growth_percent"][0] == pytest.approx(
        gm_row["gdp_deflator_growth_percent"][0], abs=0.001
    )


def test_baseline_v1_invalid_iso3c(
    data_demography: pl.DataFrame,
    data_inflation: pl.DataFrame,
    data_productivity: pl.DataFrame,
    macrofiscal: pl.DataFrame,
) -> None:
    with pytest.raises(ValueError, match="No data found"):
        baseline_v1(
            data_demography=data_demography,
            data_inflation=data_inflation,
            data_productivity=data_productivity,
            macrofiscal=macrofiscal,
            iso3c="ZZZ",
        )
