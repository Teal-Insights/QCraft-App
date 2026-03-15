"""Shared test fixtures for Q-CRAFT engine tests."""

from pathlib import Path

import pytest


@pytest.fixture
def golden_masters_dir() -> Path:
    return Path(__file__).parent / "golden_masters"


@pytest.fixture
def intermediate_dir(golden_masters_dir: Path) -> Path:
    return golden_masters_dir / "intermediate"


@pytest.fixture
def final_dir(golden_masters_dir: Path) -> Path:
    return golden_masters_dir / "final"
