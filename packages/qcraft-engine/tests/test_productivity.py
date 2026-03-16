"""Tests for the productivity module — golden master parity for Uganda."""

import math
from pathlib import Path

import polars as pl
import pytest
from polars.testing import assert_series_equal
from qcraft_engine.productivity import productivity_country

GOLDEN_DIR = Path(__file__).parent / "golden_masters" / "intermediate" / "productivity"

# OECD growth rate back-computed from golden master (the actual computed average
# from WDI 1991-2022 data; User Guide rounds to "1.1%").
OECD_GROWTH_RATE = 1.118596


@pytest.fixture
def uganda_golden() -> pl.DataFrame:
    return pl.read_csv(GOLDEN_DIR / "uganda.csv")


@pytest.fixture
def productivity_data(uganda_golden: pl.DataFrame) -> pl.DataFrame:
    """Build input data by reverse-engineering from golden master.

    The input needs:
    - Country (UGA) historical WDI productivity levels for 2008-2021
    - OECD historical productivity levels for 2008-2022

    We back-compute these from the golden master.
    """
    gm = uganda_golden

    # --- Country data: historical levels 2008-2021 ---
    # Back-compute 2008 level from 2009 growth rate
    level_2009 = gm.filter(pl.col("years") == 2009)["productivity_level"][0]
    growth_2009 = gm.filter(pl.col("years") == 2009)[
        "productivity_growth_rate_percent"
    ][0]
    level_2008 = level_2009 / (1 + growth_2009 / 100)

    country_rows: list[dict[str, object]] = [
        {"iso3c": "UGA", "years": 2008, "productivity_level": level_2008}
    ]
    for row in gm.filter(pl.col("years").is_between(2009, 2021)).iter_rows(named=True):
        country_rows.append(
            {
                "iso3c": "UGA",
                "years": row["years"],
                "productivity_level": row["productivity_level"],
            }
        )

    # --- OECD data: historical levels 2008-2022 ---
    # Back-compute OECD levels from golden master: oecd = level / (pct/100)
    oecd_rows: list[dict[str, object]] = []

    # OECD 2008: back-compute from 2009 OECD level
    oecd_2009 = gm.filter(pl.col("years") == 2009)["productivity_level"][0] / (
        gm.filter(pl.col("years") == 2009)["productivity_level_oecd_percent"][0] / 100
    )
    # Estimate 2008 OECD level using 2009 growth (approximate — historical data)
    # We'll use the country growth to approximate OECD 2008
    oecd_2008 = oecd_2009 / (1 + 2.6392 / 100)  # OECD 2009->2010 growth ≈ 2.64%
    # Actually, we need a better estimate. Use the OECD growth between 2009 and 2010
    # to back-compute 2008. But for this test, the exact 2008 value only affects
    # the 2009 OECD% which we can skip testing.
    oecd_rows.append({"iso3c": "OED", "years": 2008, "productivity_level": oecd_2008})

    # OECD historical levels 2009-2022
    for row in gm.filter(pl.col("years").is_between(2009, 2022)).iter_rows(named=True):
        oecd_level = row["productivity_level"] / (
            row["productivity_level_oecd_percent"] / 100
        )
        oecd_rows.append(
            {
                "iso3c": "OED",
                "years": row["years"],
                "productivity_level": oecd_level,
            }
        )

    all_rows = country_rows + oecd_rows
    return pl.DataFrame(all_rows)


def test_productivity_row_count(
    productivity_data: pl.DataFrame,
    uganda_golden: pl.DataFrame,
) -> None:
    """Output has 91 rows (2009-2099)."""
    result = productivity_country(
        productivity_data, iso3c="UGA", oecd_growth_rate=OECD_GROWTH_RATE
    )
    assert len(result) == len(uganda_golden) == 91


def test_productivity_year_range(
    productivity_data: pl.DataFrame,
) -> None:
    """Output spans 2009-2099."""
    result = productivity_country(
        productivity_data, iso3c="UGA", oecd_growth_rate=OECD_GROWTH_RATE
    )
    assert result["years"].min() == 2009
    assert result["years"].max() == 2099


def test_productivity_columns(
    productivity_data: pl.DataFrame,
) -> None:
    """Output has all required columns."""
    result = productivity_country(
        productivity_data, iso3c="UGA", oecd_growth_rate=OECD_GROWTH_RATE
    )
    expected_cols = {
        "years",
        "productivity_growth_rate_percent",
        "productivity_level",
        "productivity_level_oecd_percent",
    }
    assert set(result.columns) == expected_cols


def test_productivity_historical_growth_parity(
    productivity_data: pl.DataFrame,
    uganda_golden: pl.DataFrame,
) -> None:
    """Historical growth rates (2010-2021) match golden master."""
    result = productivity_country(
        productivity_data, iso3c="UGA", oecd_growth_rate=OECD_GROWTH_RATE
    )
    # Filter to historical years (2010-2021, skip 2009: depends on 2008)
    result_hist = result.filter(pl.col("years").is_between(2010, 2021))
    golden_hist = uganda_golden.filter(pl.col("years").is_between(2010, 2021))

    assert_series_equal(
        result_hist["productivity_growth_rate_percent"],
        golden_hist["productivity_growth_rate_percent"],
        check_exact=False,
        abs_tol=0.001,
    )


def test_productivity_logistic_growth_parity(
    productivity_data: pl.DataFrame,
    uganda_golden: pl.DataFrame,
) -> None:
    """Logistic convergence growth rates (2030-2099) match golden master."""
    result = productivity_country(
        productivity_data, iso3c="UGA", oecd_growth_rate=OECD_GROWTH_RATE
    )
    result_proj = result.filter(pl.col("years") >= 2030)
    golden_proj = uganda_golden.filter(pl.col("years") >= 2030)

    assert_series_equal(
        result_proj["productivity_growth_rate_percent"],
        golden_proj["productivity_growth_rate_percent"],
        check_exact=False,
        abs_tol=0.0001,
    )


def test_productivity_historical_level_parity(
    productivity_data: pl.DataFrame,
    uganda_golden: pl.DataFrame,
) -> None:
    """Historical levels (2009-2021) match golden master."""
    result = productivity_country(
        productivity_data, iso3c="UGA", oecd_growth_rate=OECD_GROWTH_RATE
    )
    result_hist = result.filter(pl.col("years").is_between(2009, 2021))
    golden_hist = uganda_golden.filter(pl.col("years").is_between(2009, 2021))

    assert_series_equal(
        result_hist["productivity_level"],
        golden_hist["productivity_level"],
        check_exact=False,
        abs_tol=0.01,
    )


def test_productivity_logistic_spot_check_2030(
    productivity_data: pl.DataFrame,
) -> None:
    """Spot-check logistic formula at year 2030 (counter=1)."""
    result = productivity_country(
        productivity_data, iso3c="UGA", oecd_growth_rate=OECD_GROWTH_RATE
    )
    row = result.filter(pl.col("years") == 2030)
    # logistic(counter=1, start=5.0, end=1.2, rate=0.5, tp=15)
    counter = 1
    sigmoid = 1 / (1 + math.exp(-0.5 * (counter - 15)))
    expected = 5.0 + (1.2 - 5.0) * (sigmoid**0.5)
    assert row["productivity_growth_rate_percent"][0] == pytest.approx(
        expected, abs=0.0001
    )


def test_productivity_logistic_spot_check_2043(
    productivity_data: pl.DataFrame,
) -> None:
    """Spot-check logistic at year 2043 (near inflection point, counter=14)."""
    result = productivity_country(
        productivity_data, iso3c="UGA", oecd_growth_rate=OECD_GROWTH_RATE
    )
    row = result.filter(pl.col("years") == 2043)
    assert row["productivity_growth_rate_percent"][0] == pytest.approx(2.665, abs=0.001)


def test_productivity_converges_to_end(
    productivity_data: pl.DataFrame,
) -> None:
    """By 2099, growth rate has converged to productivity_end (1.2%)."""
    result = productivity_country(
        productivity_data, iso3c="UGA", oecd_growth_rate=OECD_GROWTH_RATE
    )
    row = result.filter(pl.col("years") == 2099)
    assert row["productivity_growth_rate_percent"][0] == pytest.approx(1.2, abs=0.001)


def test_productivity_level_compounding(
    productivity_data: pl.DataFrame,
) -> None:
    """Verify level(t) = level(t-1) * (1 + growth(t)/100) for all years."""
    result = productivity_country(
        productivity_data, iso3c="UGA", oecd_growth_rate=OECD_GROWTH_RATE
    )
    levels = result["productivity_level"].to_list()
    growths = result["productivity_growth_rate_percent"].to_list()

    for i in range(1, len(levels)):
        expected_level = levels[i - 1] * (1 + growths[i] / 100)
        assert levels[i] == pytest.approx(expected_level, rel=1e-10), (
            f"Level mismatch at index {i} (year {2009 + i})"
        )


def test_productivity_weo_years_use_start_rate(
    productivity_data: pl.DataFrame,
) -> None:
    """WEO years (2022-2029) use productivity_start as placeholder growth rate."""
    result = productivity_country(
        productivity_data, iso3c="UGA", oecd_growth_rate=OECD_GROWTH_RATE
    )
    weo_rows = result.filter(pl.col("years").is_between(2022, 2029))
    for row in weo_rows.iter_rows(named=True):
        assert row["productivity_growth_rate_percent"] == pytest.approx(
            5.0, abs=0.001
        ), f"Year {row['years']} should use productivity_start=5.0"


def test_productivity_invalid_iso3c(
    productivity_data: pl.DataFrame,
) -> None:
    with pytest.raises(ValueError, match="No data found"):
        productivity_country(productivity_data, iso3c="ZZZ")
