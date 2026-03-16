"""Tests for the climate module — golden master parity for Uganda.

Tests all 6 climate scenarios against intermediate golden masters,
and verifies final golden master parity at key years.
"""

from pathlib import Path

import polars as pl
import pytest
from polars.testing import assert_series_equal
from qcraft_engine.climate import calc_climate_scenario

GOLDEN_DIR = Path(__file__).parent / "golden_masters" / "intermediate"
FINAL_DIR = Path(__file__).parent / "golden_masters" / "final"

SCENARIOS = [
    ("Paris", "paris"),
    ("Moderate", "moderate"),
    ("High", "high"),
    ("Hot", "hot"),
    ("Hot Adapted", "hot_adapted"),
    ("Hot Unadapted", "hot_unadapted"),
]

WEO_MAX_YEAR = 2029


# --- Shared fixtures ---


@pytest.fixture
def baseline_v1_golden() -> pl.DataFrame:
    raw = pl.read_csv(GOLDEN_DIR / "baseline_v1" / "uganda.csv")
    return raw.with_columns(
        pl.lit("UGA").alias("iso3c"),
        pl.lit("Uganda").alias("country"),
    )


@pytest.fixture
def fiscal_golden() -> pl.DataFrame:
    return pl.read_csv(GOLDEN_DIR / "fiscal" / "uganda.csv")


@pytest.fixture
def interest_rate_golden() -> pl.DataFrame:
    raw = pl.read_csv(GOLDEN_DIR / "interest_rate" / "uganda.csv")
    return raw.with_columns(
        pl.lit("UGA").alias("iso3c"),
        pl.lit("Uganda").alias("country"),
    )


def _build_climate_variation(
    scenario_golden: pl.DataFrame,
    baseline_v1_golden: pl.DataFrame,
) -> pl.DataFrame:
    """Derive climate_variation from golden master productivity differences.

    climate_variation(t) = climate_prod(t) - baseline_prod(t)
    For years <= WEO_MAX_YEAR, variation is 0.
    """
    bv1 = baseline_v1_golden.sort("years")
    scn = scenario_golden.sort("years")

    years = bv1["years"].to_list()
    bv1_prod = bv1["labour_productivity_growth"].to_list()
    scn_prod = scn["labour_productivity_growth"].to_list()

    variation = []
    for i, y in enumerate(years):
        if y <= WEO_MAX_YEAR:
            variation.append(0.0)
        else:
            variation.append(scn_prod[i] - bv1_prod[i])

    return pl.DataFrame({"years": years, "climate_variation": variation})


def _run_scenario(
    scenario_file: str,
    baseline_v1_golden: pl.DataFrame,
    fiscal_golden: pl.DataFrame,
    interest_rate_golden: pl.DataFrame,
) -> tuple[pl.DataFrame, pl.DataFrame]:
    """Run calc_climate_scenario for a given scenario and return (result, expected)."""
    expected = pl.read_csv(GOLDEN_DIR / "climate" / scenario_file)
    climate_var = _build_climate_variation(expected, baseline_v1_golden)

    result = calc_climate_scenario(
        data_baseline=fiscal_golden,
        data_baseline_v1=baseline_v1_golden,
        data_interest=interest_rate_golden,
        climate_variation=climate_var,
        expenditure_rigidity=1.0,
        data_risk=None,
    )
    return result, expected


# --- Parametrized intermediate parity tests ---


@pytest.fixture(params=SCENARIOS, ids=[s[0] for s in SCENARIOS])
def scenario_result(
    request: pytest.FixtureRequest,
    baseline_v1_golden: pl.DataFrame,
    fiscal_golden: pl.DataFrame,
    interest_rate_golden: pl.DataFrame,
) -> tuple[str, pl.DataFrame, pl.DataFrame]:
    """Run each scenario and return (name, result, expected)."""
    name, file_prefix = request.param
    result, expected = _run_scenario(
        f"{file_prefix}_uganda.csv",
        baseline_v1_golden,
        fiscal_golden,
        interest_rate_golden,
    )
    return name, result, expected


# GDP-related columns
def test_labour_productivity_growth(
    scenario_result: tuple[str, pl.DataFrame, pl.DataFrame],
) -> None:
    _, result, expected = scenario_result
    assert_series_equal(
        result["labour_productivity_growth"],
        expected["labour_productivity_growth"],
        check_exact=False,
        abs_tol=1e-6,
    )


def test_real_gdp_growth(
    scenario_result: tuple[str, pl.DataFrame, pl.DataFrame],
) -> None:
    _, result, expected = scenario_result
    assert_series_equal(
        result["real_gdp_growth_percent"],
        expected["real_gdp_growth_percent"],
        check_exact=False,
        abs_tol=1e-4,
    )


def test_nominal_gdp(
    scenario_result: tuple[str, pl.DataFrame, pl.DataFrame],
) -> None:
    _, result, expected = scenario_result
    assert_series_equal(
        result["nominal_gdp"],
        expected["nominal_gdp"],
        check_exact=False,
        rel_tol=1e-6,
    )


def test_real_gdp(
    scenario_result: tuple[str, pl.DataFrame, pl.DataFrame],
) -> None:
    _, result, expected = scenario_result
    assert_series_equal(
        result["real_gdp"],
        expected["real_gdp"],
        check_exact=False,
        rel_tol=1e-6,
    )


# Fiscal columns
def test_revenue(
    scenario_result: tuple[str, pl.DataFrame, pl.DataFrame],
) -> None:
    _, result, expected = scenario_result
    assert_series_equal(
        result["revenue"],
        expected["revenue"],
        check_exact=False,
        rel_tol=1e-4,
    )


def test_revenue_percent_gdp(
    scenario_result: tuple[str, pl.DataFrame, pl.DataFrame],
) -> None:
    _, result, expected = scenario_result
    assert_series_equal(
        result["revenue_percent_gdp"],
        expected["revenue_percent_gdp"],
        check_exact=False,
        abs_tol=0.001,
    )


def test_primary_expenditure(
    scenario_result: tuple[str, pl.DataFrame, pl.DataFrame],
) -> None:
    _, result, expected = scenario_result
    assert_series_equal(
        result["primary_expenditure"],
        expected["primary_expenditure"],
        check_exact=False,
        rel_tol=1e-4,
    )


def test_primary_expenditure_percent_gdp(
    scenario_result: tuple[str, pl.DataFrame, pl.DataFrame],
) -> None:
    _, result, expected = scenario_result
    assert_series_equal(
        result["primary_expenditure_percent_gdp"],
        expected["primary_expenditure_percent_gdp"],
        check_exact=False,
        abs_tol=0.001,
    )


def test_debt_to_gdp(
    scenario_result: tuple[str, pl.DataFrame, pl.DataFrame],
) -> None:
    _, result, expected = scenario_result
    assert_series_equal(
        result["debt_to_gdp"],
        expected["debt_to_gdp"],
        check_exact=False,
        abs_tol=0.001,
    )


def test_debt(
    scenario_result: tuple[str, pl.DataFrame, pl.DataFrame],
) -> None:
    _, result, expected = scenario_result
    assert_series_equal(
        result["debt"],
        expected["debt"],
        check_exact=False,
        rel_tol=1e-4,
    )


def test_interest_expenditure(
    scenario_result: tuple[str, pl.DataFrame, pl.DataFrame],
) -> None:
    _, result, expected = scenario_result
    assert_series_equal(
        result["interest_expenditure"],
        expected["interest_expenditure"],
        check_exact=False,
        rel_tol=1e-4,
    )


def test_overall_balance_percent_gdp(
    scenario_result: tuple[str, pl.DataFrame, pl.DataFrame],
) -> None:
    _, result, expected = scenario_result
    assert_series_equal(
        result["overall_balance_percent_gdp"],
        expected["overall_balance_percent_gdp"],
        check_exact=False,
        abs_tol=0.001,
    )


def test_dspb(
    scenario_result: tuple[str, pl.DataFrame, pl.DataFrame],
) -> None:
    _, result, expected = scenario_result
    # Skip year 2009 which is null
    r = result.filter(pl.col("years") >= 2010)
    g = expected.filter(pl.col("years") >= 2010)
    assert_series_equal(
        r["debt_stabilizing_primary_balance"],
        g["debt_stabilizing_primary_balance"],
        check_exact=False,
        abs_tol=0.001,
    )


def test_employment_growth_unchanged(
    scenario_result: tuple[str, pl.DataFrame, pl.DataFrame],
) -> None:
    """Employment growth must be identical to baseline (Domain Rule: unchanged)."""
    _, result, expected = scenario_result
    assert_series_equal(
        result["employment_growth"],
        expected["employment_growth"],
        check_exact=False,
        abs_tol=1e-10,
    )


# --- Domain rule tests ---


def test_no_debt_floor_climate(
    baseline_v1_golden: pl.DataFrame,
    fiscal_golden: pl.DataFrame,
    interest_rate_golden: pl.DataFrame,
) -> None:
    """Climate scenarios do NOT apply max(0, debt_to_gdp).

    We can't guarantee negative debt in all scenarios, but we verify the
    function does not clamp. Check that Paris matches golden master exactly
    (golden master was produced without clamping).
    """
    expected = pl.read_csv(GOLDEN_DIR / "climate" / "paris_uganda.csv")
    climate_var = _build_climate_variation(expected, baseline_v1_golden)

    result = calc_climate_scenario(
        data_baseline=fiscal_golden,
        data_baseline_v1=baseline_v1_golden,
        data_interest=interest_rate_golden,
        climate_variation=climate_var,
        expenditure_rigidity=1.0,
        data_risk=None,
    )
    # Verify debt_to_gdp matches golden master (which has no floor)
    assert_series_equal(
        result["debt_to_gdp"],
        expected["debt_to_gdp"],
        check_exact=False,
        abs_tol=0.001,
    )


def test_rigidity_1_expenditure_equals_baseline(
    baseline_v1_golden: pl.DataFrame,
    fiscal_golden: pl.DataFrame,
    interest_rate_golden: pl.DataFrame,
) -> None:
    """With rigidity=1.0, primary expenditure levels match baseline exactly."""
    expected = pl.read_csv(GOLDEN_DIR / "climate" / "paris_uganda.csv")
    climate_var = _build_climate_variation(expected, baseline_v1_golden)

    result = calc_climate_scenario(
        data_baseline=fiscal_golden,
        data_baseline_v1=baseline_v1_golden,
        data_interest=interest_rate_golden,
        climate_variation=climate_var,
        expenditure_rigidity=1.0,
        data_risk=None,
    )
    # Primary expenditure at rigidity=1.0 should equal baseline
    assert_series_equal(
        result["primary_expenditure"],
        fiscal_golden["primary_expenditure"],
        check_exact=False,
        rel_tol=1e-6,
    )


# --- Final golden master parity ---


def test_final_golden_master_parity(
    baseline_v1_golden: pl.DataFrame,
    fiscal_golden: pl.DataFrame,
    interest_rate_golden: pl.DataFrame,
) -> None:
    """All 6 climate scenarios match the final golden master at key years."""
    final_gm = pl.read_csv(FINAL_DIR / "uganda.csv")
    key_columns = [
        "revenue_percent_gdp",
        "primary_expenditure_percent_gdp",
        "primary_balance_percent_gdp",
        "interest_expenditure_percent_gdp",
        "overall_balance_percent_gdp",
        "debt_to_gdp",
    ]

    for scenario_name, file_prefix in SCENARIOS:
        expected_scenario = final_gm.filter(pl.col("scenario") == scenario_name)
        climate_golden = pl.read_csv(
            GOLDEN_DIR / "climate" / f"{file_prefix}_uganda.csv"
        )
        climate_var = _build_climate_variation(climate_golden, baseline_v1_golden)

        result = calc_climate_scenario(
            data_baseline=fiscal_golden,
            data_baseline_v1=baseline_v1_golden,
            data_interest=interest_rate_golden,
            climate_variation=climate_var,
            expenditure_rigidity=1.0,
            data_risk=None,
        )

        for row in expected_scenario.iter_rows(named=True):
            year = int(row["year"])
            result_row = result.filter(pl.col("years") == year)
            for col in key_columns:
                expected_val = float(row[col])
                actual_val = float(result_row[col][0])
                assert actual_val == pytest.approx(expected_val, abs=0.01), (
                    f"{scenario_name} {year} {col}: {actual_val} != {expected_val}"
                )


# --- Structure tests ---


def test_row_count(
    baseline_v1_golden: pl.DataFrame,
    fiscal_golden: pl.DataFrame,
    interest_rate_golden: pl.DataFrame,
) -> None:
    expected = pl.read_csv(GOLDEN_DIR / "climate" / "paris_uganda.csv")
    climate_var = _build_climate_variation(expected, baseline_v1_golden)
    result = calc_climate_scenario(
        data_baseline=fiscal_golden,
        data_baseline_v1=baseline_v1_golden,
        data_interest=interest_rate_golden,
        climate_variation=climate_var,
        expenditure_rigidity=1.0,
    )
    assert len(result) == 91


def test_year_range(
    baseline_v1_golden: pl.DataFrame,
    fiscal_golden: pl.DataFrame,
    interest_rate_golden: pl.DataFrame,
) -> None:
    expected = pl.read_csv(GOLDEN_DIR / "climate" / "paris_uganda.csv")
    climate_var = _build_climate_variation(expected, baseline_v1_golden)
    result = calc_climate_scenario(
        data_baseline=fiscal_golden,
        data_baseline_v1=baseline_v1_golden,
        data_interest=interest_rate_golden,
        climate_variation=climate_var,
        expenditure_rigidity=1.0,
    )
    assert result["years"].min() == 2009
    assert result["years"].max() == 2099


def test_revenue_percent_gdp_consistency_with_risk(
    baseline_v1_golden: pl.DataFrame,
    fiscal_golden: pl.DataFrame,
    interest_rate_golden: pl.DataFrame,
) -> None:
    """revenue_percent_gdp equals revenue / nominal_gdp * 100 with risk."""
    expected = pl.read_csv(GOLDEN_DIR / "climate" / "paris_uganda.csv")
    climate_var = _build_climate_variation(expected, baseline_v1_golden)

    # Create a synthetic risk DataFrame with nonzero revenue_risk
    years = list(range(2009, 2100))
    risk_df = pl.DataFrame(
        {
            "years": years,
            "revenue_risk": [0.0] * 21 + [-0.5] * 70,  # -0.5% GDP from 2030+
            "expenditure_risk": [0.0] * 91,
        }
    )

    result = calc_climate_scenario(
        data_baseline=fiscal_golden,
        data_baseline_v1=baseline_v1_golden,
        data_interest=interest_rate_golden,
        climate_variation=climate_var,
        expenditure_rigidity=1.0,
        data_risk=risk_df,
    )

    # revenue_percent_gdp must be consistent with revenue / nominal_gdp * 100
    proj = result.filter(pl.col("years") >= 2030)
    computed_pct = (proj["revenue"] / proj["nominal_gdp"] * 100).alias(
        "revenue_percent_gdp"
    )
    assert_series_equal(
        proj["revenue_percent_gdp"],
        computed_pct,
        check_exact=False,
        abs_tol=1e-10,
    )


def test_columns_match_golden(
    baseline_v1_golden: pl.DataFrame,
    fiscal_golden: pl.DataFrame,
    interest_rate_golden: pl.DataFrame,
) -> None:
    expected = pl.read_csv(GOLDEN_DIR / "climate" / "paris_uganda.csv")
    climate_var = _build_climate_variation(expected, baseline_v1_golden)
    result = calc_climate_scenario(
        data_baseline=fiscal_golden,
        data_baseline_v1=baseline_v1_golden,
        data_interest=interest_rate_golden,
        climate_variation=climate_var,
        expenditure_rigidity=1.0,
    )
    assert set(result.columns) == set(expected.columns)
