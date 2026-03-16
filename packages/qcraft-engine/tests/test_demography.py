"""Tests for the demography module — golden master parity for Uganda."""

from pathlib import Path

import polars as pl
import pytest
from polars.testing import assert_series_equal
from qcraft_engine.demography import demography_country

GOLDEN_DIR = Path(__file__).parent / "golden_masters" / "intermediate" / "demography"


@pytest.fixture
def uganda_golden() -> pl.DataFrame:
    return pl.read_csv(GOLDEN_DIR / "uganda.csv")


@pytest.fixture
def demography_data() -> pl.DataFrame:
    """Build synthetic long-format input that matches what the parquet would contain.

    We reverse-engineer from the golden master: the golden master has
    working_age_population and total_population columns. We need to supply
    raw data in long format with age_group rows for "15-64" and "Total".
    We also need year 2008 so that the 2009 row exists after filtering >= 2009
    (growth rate for 2009 is null because there's no 2008 in the output, but
    the filter is years >= 2009 on the raw data, and growth is computed before
    filtering... actually per the oracle, growth for 2009 is null because
    there's no prior year in the output range).

    The simplest approach: read the golden master and reconstruct the long-format
    input from it.
    """
    gm = pl.read_csv(GOLDEN_DIR / "uganda.csv")
    rows: list[dict[str, object]] = []
    for row in gm.iter_rows(named=True):
        year = row["years"]
        rows.append(
            {
                "iso3c": "UGA",
                "country": "Uganda",
                "years": year,
                "age_group": "15-64",
                "status": "Medium",
                "values": row["working_age_population"],
            }
        )
        rows.append(
            {
                "iso3c": "UGA",
                "country": "Uganda",
                "years": year,
                "age_group": "Total",
                "status": "Medium",
                "values": row["total_population"],
            }
        )
    return pl.DataFrame(rows)


def test_demography_row_count(
    demography_data: pl.DataFrame, uganda_golden: pl.DataFrame
) -> None:
    """Output has 91 rows (2009-2099)."""
    result = demography_country(demography_data, iso3c="UGA", level="Medium")
    assert len(result) == len(uganda_golden) == 91


def test_demography_year_range(
    demography_data: pl.DataFrame, uganda_golden: pl.DataFrame
) -> None:
    """Output spans 2009-2099."""
    result = demography_country(demography_data, iso3c="UGA", level="Medium")
    assert result["years"].min() == 2009
    assert result["years"].max() == 2099


def test_demography_first_year_growth_is_null(
    demography_data: pl.DataFrame,
) -> None:
    """Growth rates for year 2009 (first year) must be null, not 0."""
    result = demography_country(demography_data, iso3c="UGA", level="Medium")
    row_2009 = result.filter(pl.col("years") == 2009)
    assert row_2009["demography_growth_working_age"][0] is None
    assert row_2009["demography_growth_total"][0] is None


def test_demography_population_columns(
    demography_data: pl.DataFrame, uganda_golden: pl.DataFrame
) -> None:
    """Working-age and total population match golden master."""
    result = demography_country(demography_data, iso3c="UGA", level="Medium")
    assert_series_equal(
        result["working_age_population"],
        uganda_golden["working_age_population"],
        check_exact=False,
        abs_tol=0.5,
    )
    assert_series_equal(
        result["total_population"],
        uganda_golden["total_population"],
        check_exact=False,
        abs_tol=0.5,
    )


def test_demography_growth_rates_parity(
    demography_data: pl.DataFrame, uganda_golden: pl.DataFrame
) -> None:
    """Growth rate columns match golden master within tolerance."""
    result = demography_country(demography_data, iso3c="UGA", level="Medium")

    # Skip first row (null growth rates) for comparison
    result_tail = result.slice(1)
    golden_tail = uganda_golden.slice(1)

    assert_series_equal(
        result_tail["demography_growth_working_age"],
        golden_tail["demography_growth_working_age"],
        check_exact=False,
        abs_tol=0.001,
    )
    assert_series_equal(
        result_tail["demography_growth_total"],
        golden_tail["demography_growth_total"],
        check_exact=False,
        abs_tol=0.001,
    )


def test_demography_spot_check_2010(demography_data: pl.DataFrame) -> None:
    """Spot-check 2010 growth rates from oracle packet."""
    result = demography_country(demography_data, iso3c="UGA", level="Medium")
    row = result.filter(pl.col("years") == 2010)
    assert row["demography_growth_working_age"][0] == pytest.approx(3.4478, abs=0.001)
    assert row["demography_growth_total"][0] == pytest.approx(2.9574, abs=0.001)


def test_demography_spot_check_2099(demography_data: pl.DataFrame) -> None:
    """Spot-check 2099 — aging Uganda with diverging growth rates."""
    result = demography_country(demography_data, iso3c="UGA", level="Medium")
    row = result.filter(pl.col("years") == 2099)
    assert row["demography_growth_working_age"][0] == pytest.approx(0.0976, abs=0.001)
    assert row["demography_growth_total"][0] == pytest.approx(0.2349, abs=0.001)


def test_demography_includes_metadata(demography_data: pl.DataFrame) -> None:
    """Result includes iso3c and country columns for downstream consumers."""
    result = demography_country(demography_data, iso3c="UGA", level="Medium")
    assert "iso3c" in result.columns
    assert "country" in result.columns
    assert result["iso3c"][0] == "UGA"
    assert result["country"][0] == "Uganda"


def test_demography_invalid_iso3c(demography_data: pl.DataFrame) -> None:
    with pytest.raises(ValueError, match="No data found"):
        demography_country(demography_data, iso3c="ZZZ", level="Medium")
