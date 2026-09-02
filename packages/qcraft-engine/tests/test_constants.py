"""Scenario labels are the IMF User Guide's names (Tim and Rahman, 2024, II.C).

No temperature suffixes: the guide gives none except "below 2°C" for Paris, and
Hot is the 90th percentile of the same SSP3-7.0 models whose median is High, so
a degree ladder inverts the guide's ordering. CC-26, audit B finding 1.
"""

from qcraft_engine.constants import CLIMATE_SCENARIOS, SCENARIO_LABELS


def test_scenario_labels_are_the_guides_six() -> None:
    assert SCENARIO_LABELS == {
        "Paris": "Paris",
        "Moderate": "Moderate",
        "High": "High",
        "Hot": "Hot",
        "Hot_Adapted": "Hot adapted",
        "Hot_Unadapted": "Hot unadapted",
    }


def test_every_scenario_key_is_labelled() -> None:
    assert set(SCENARIO_LABELS) == set(CLIMATE_SCENARIOS)
