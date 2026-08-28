"""Vintage configuration: sources, URLs, indicator and country mappings.

Everything version-specific about a refresh lives here. Pointing the pipeline at
a later WEO release should mean editing this file and nothing else.
"""

from pathlib import Path

VINTAGE_ID = "weo-2026-04"
VINTAGE_LABEL = "WEO April 2026 + UN WPP 2024"

# The vintage the app currently ships and the golden masters were built from.
# Frozen: the pipeline reads it (for country names and carry-forward inputs) and
# never writes to it.
BASE_VINTAGE_ID = "weo-2024-10"
BASE_VINTAGE_LABEL = "WEO October 2024 + UN WPP 2022"

# ── IMF WEO ───────────────────────────────────────────────────────────────────

# www.imf.org is 403 host-wide from Teal's machine (see BLOCKED-imf-bulk-download.md).
# api.imf.org serves the same release over SDMX 2.1 and is not blocked.
IMF_SDMX_BASE = "https://api.imf.org/external/sdmx/2.1"
WEO_DATAFLOW = "IMF.RES,WEO,9.0.0"
WEO_COUNTRY_CODELIST = f"{IMF_SDMX_BASE}/codelist/IMF/CL_COUNTRY?references=none"

# WEO indicator -> macrofiscal column. Order fixes the output column order.
WEO_INDICATORS: dict[str, str] = {
    "NGDP_R": "real_gdp",
    "NGDP": "nominal_gdp",
    "NGDP_D": "gdp_deflator",
    "GGR": "revenue",
    "GGX": "expenditure",
    "GGXCNL": "overall_balance",
    "GGXONLB": "primary_balance",
    "GGXWDG": "debt",
}

# SDMX returns national-currency series in units; the workbook (and therefore the
# engine and the golden masters) expects billions. The deflator is an index and is
# passed through untouched. validate.py checks this empirically against the base
# vintage rather than trusting it.
WEO_UNIT_DIVISOR = 1e9
WEO_INDEX_INDICATORS = frozenset({"NGDP_D"})

# WEO reports some non-ISO codes and a handful of aggregates.
WEO_CODE_TO_ISO3 = {
    "WBG": "PSE",  # West Bank and Gaza
    "KOS": "XKX",  # Kosovo
}
WEO_DROP_CODES = frozenset({"G110", "G119", "G163", "GX123"})

# ── UN WPP ────────────────────────────────────────────────────────────────────

WPP_BASE = (
    "https://population.un.org/wpp/assets/Excel%20Files"
    "/1_Indicator%20(Standard)/CSV_FILES"
)
# 1 July population, NOT 1 January. See DATA-NOTES.md section 3 for the test that
# established which one the frozen vintage used.
WPP_MEDIUM_FILE = "WPP2024_PopulationByAge5GroupSex_Medium.csv.gz"
WPP_VARIANTS_FILE = "WPP2024_PopulationByAge5GroupSex_OtherVariants.csv.gz"
WPP_VARIANTS = ("Medium", "High", "Low")
WPP_LOCATION_TYPE = "Country/Area"

# ── Shape of the output ───────────────────────────────────────────────────────

MACROFISCAL_YEAR_MIN = 2001

# The engine's WEO/projection boundary. WEO April 2026 projects through 2031, but
# qcraft_engine.constants.PROJ_START is 2030 and productivity_country() defaults
# weo_max_year=2029, so handing the engine a longer WEO horizon silently
# desynchronises the productivity convergence path and the climate shock start.
# Truncating keeps the engine contract intact and makes old-vs-new a pure data
# comparison. See .change-requests/PIPELINE-2026-08-26.md.
MACROFISCAL_YEAR_MAX = 2029

DEMOGRAPHY_YEAR_MIN = 1950
DEMOGRAPHY_YEAR_MAX = 2100

DATASETS = ("macrofiscal", "demography", "productivity", "climate")

# Sources with no April-2026 upstream; copied from the base vintage unchanged.
CARRIED_FORWARD = ("productivity", "climate")


def repo_root() -> Path:
    """Repo root, found by walking up for pyproject.toml + packages/."""
    current = Path(__file__).resolve().parent
    for _ in range(10):
        if (current / "pyproject.toml").exists() and (current / "packages").exists():
            return current
        current = current.parent
    msg = "Cannot find repo root"
    raise FileNotFoundError(msg)


def cache_dir() -> Path:
    return repo_root() / "pipeline" / ".cache" / "raw"


def vintage_dir(vintage_id: str) -> Path:
    return repo_root() / "data" / "vintages" / vintage_id
