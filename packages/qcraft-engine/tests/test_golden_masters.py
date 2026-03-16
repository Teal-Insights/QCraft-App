"""Tests to validate Uganda golden master CSV fixtures.

Spot-checks values against the IMF Q-CRAFT Excel tool v10:
  - Real GDP 2009 = 74,760 UGX bn
  - Debt-to-GDP 2009 = 14.79%
  - Debt-to-GDP worsens under hotter climate scenarios
    (Hot Unadapted > Hot > Baseline at end of projection period)
"""

from pathlib import Path

import polars as pl
import pytest


INTERMEDIATE_MODULES = [
    "baseline_v1",
    "demography",
    "fiscal",
    "inflation",
    "interest_rate",
    "productivity",
]

CLIMATE_SCENARIOS = [
    "high",
    "hot",
    "hot_adapted",
    "hot_unadapted",
    "moderate",
    "paris",
]


@pytest.fixture
def intermediate_dir() -> Path:
    return Path(__file__).parent / "golden_masters" / "intermediate"


@pytest.fixture
def final_dir() -> Path:
    return Path(__file__).parent / "golden_masters" / "final"


@pytest.mark.parametrize("module", INTERMEDIATE_MODULES)
def test_intermediate_module_loads(intermediate_dir: Path, module: str) -> None:
    """Each intermediate module CSV for Uganda loads without errors."""
    csv_path = intermediate_dir / module / "uganda.csv"
    assert csv_path.exists(), f"Missing: {csv_path}"
    df = pl.read_csv(csv_path)
    assert len(df) > 0, f"{csv_path} is empty"


@pytest.mark.parametrize("scenario", CLIMATE_SCENARIOS)
def test_climate_scenario_loads(intermediate_dir: Path, scenario: str) -> None:
    """Each climate scenario CSV for Uganda loads without errors."""
    csv_path = intermediate_dir / "climate" / f"{scenario}_uganda.csv"
    assert csv_path.exists(), f"Missing: {csv_path}"
    df = pl.read_csv(csv_path, null_values=["#REF!"])
    assert len(df) > 0, f"{csv_path} is empty"


def test_final_summary_loads(final_dir: Path) -> None:
    """Final summary CSV for Uganda loads without errors."""
    csv_path = final_dir / "uganda.csv"
    assert csv_path.exists(), f"Missing: {csv_path}"
    df = pl.read_csv(csv_path)
    assert len(df) > 0, f"{csv_path} is empty"


def test_baseline_real_gdp_2009(intermediate_dir: Path) -> None:
    """Real GDP for Uganda in 2009 matches the Excel source: 74,760 UGX bn."""
    df = pl.read_csv(intermediate_dir / "baseline_v1" / "uganda.csv")
    row = df.filter(pl.col("years") == 2009)
    assert len(row) == 1, "Expected exactly one row for year 2009"
    assert row["real_gdp"][0] == pytest.approx(74760, rel=1e-4)


def test_fiscal_debt_to_gdp_2009(intermediate_dir: Path) -> None:
    """Debt-to-GDP for Uganda in 2009 matches the Excel source: ~14.79%."""
    df = pl.read_csv(intermediate_dir / "fiscal" / "uganda.csv")
    row = df.filter(pl.col("years") == 2009)
    assert len(row) == 1, "Expected exactly one row for year 2009"
    assert row["debt_to_gdp"][0] == pytest.approx(14.79, rel=1e-3)


def test_climate_debt_ordering_end_of_period(intermediate_dir: Path) -> None:
    """Hot Unadapted scenario has higher debt-to-GDP than Hot, which exceeds Baseline."""
    def last_debt(scenario: str) -> float:
        path = intermediate_dir / "climate" / f"{scenario}_uganda.csv"
        df = pl.read_csv(path, null_values=["#REF!"])
        return df["debt_to_gdp"][-1]

    # Baseline debt comes from the fiscal intermediate module
    baseline_debt = pl.read_csv(
        intermediate_dir / "fiscal" / "uganda.csv"
    )["debt_to_gdp"][-1]

    hot_debt = last_debt("hot")
    hot_unadapted_debt = last_debt("hot_unadapted")

    assert hot_unadapted_debt > hot_debt, (
        f"Expected Hot Unadapted ({hot_unadapted_debt:.2f}) > Hot ({hot_debt:.2f})"
    )
    assert hot_debt > baseline_debt, (
        f"Expected Hot ({hot_debt:.2f}) > Baseline ({baseline_debt:.2f})"
    )


def test_all_intermediate_files_same_year_range(intermediate_dir: Path) -> None:
    """All intermediate CSV fixtures cover the same year range (2009–2099)."""
    paths: list[Path] = []
    for module in INTERMEDIATE_MODULES:
        paths.append(intermediate_dir / module / "uganda.csv")
    for scenario in CLIMATE_SCENARIOS:
        paths.append(intermediate_dir / "climate" / f"{scenario}_uganda.csv")

    year_ranges: dict[str, tuple[int, int]] = {}
    for path in paths:
        df = pl.read_csv(path, null_values=["#REF!"])
        year_col = "years" if "years" in df.columns else "year"
        key = str(path.relative_to(intermediate_dir))
        year_ranges[key] = (df[year_col].min(), df[year_col].max())

    first_name, first_range = next(iter(year_ranges.items()))
    for name, yr in year_ranges.items():
        assert yr == first_range, (
            f"Year range mismatch: {name} has {yr}, but {first_name} has {first_range}"
        )
