"""Download raw WEO and WPP files into a local cache.

Cached by filename; re-running is a no-op unless --force. Every download is
recorded with its sha256 and byte size so a build is reproducible and auditable.
"""

import hashlib
import json
import urllib.error
import urllib.request
from pathlib import Path

from qcraft_pipeline import config

_UA = "qcraft-pipeline/0.1 (+https://github.com/Teal-Insights/QCraft-App)"
_TIMEOUT = 900
_RETRIES = 3


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def download(
    url: str, dest: Path, *, accept: str | None = None, force: bool = False
) -> Path:
    """GET url into dest, unless dest already exists and force is False."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and not force:
        print(f"  cached  {dest.name} ({dest.stat().st_size:,} bytes)")
        return dest

    headers = {"User-Agent": _UA}
    if accept:
        headers["Accept"] = accept
    request = urllib.request.Request(url, headers=headers)  # noqa: S310

    last: Exception | None = None
    for attempt in range(1, _RETRIES + 1):
        try:
            tmp = dest.with_suffix(dest.suffix + ".part")
            with urllib.request.urlopen(request, timeout=_TIMEOUT) as response:  # noqa: S310
                with tmp.open("wb") as fh:
                    while chunk := response.read(1 << 20):
                        fh.write(chunk)
            tmp.replace(dest)
            print(f"  fetched {dest.name} ({dest.stat().st_size:,} bytes)")
            return dest
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            last = exc
            print(f"  attempt {attempt}/{_RETRIES} failed for {url}: {exc}")
    msg = f"Could not download {url} after {_RETRIES} attempts: {last}"
    raise RuntimeError(msg)


def weo_data_url() -> str:
    """SDMX data query for every country and every indicator we map."""
    indicators = "+".join(config.WEO_INDICATORS)
    return (
        f"{config.IMF_SDMX_BASE}/data/{config.WEO_DATAFLOW}"
        f"/.{indicators}.A?detail=dataonly"
    )


def fetch_all(*, force: bool = False) -> dict[str, Path]:
    """Download every raw input. Returns a name -> path map."""
    cache = config.cache_dir()
    print("Fetching raw inputs")

    paths = {
        "weo": download(
            weo_data_url(),
            cache / "weo_apr2026_raw.csv",
            accept="application/vnd.sdmx.data+csv",
            force=force,
        ),
        "weo_countries": download(
            config.WEO_COUNTRY_CODELIST,
            cache / "cl_country.json",
            accept="application/json",
            force=force,
        ),
        "wpp_medium": download(
            f"{config.WPP_BASE}/{config.WPP_MEDIUM_FILE}",
            cache / config.WPP_MEDIUM_FILE,
            force=force,
        ),
        "wpp_variants": download(
            f"{config.WPP_BASE}/{config.WPP_VARIANTS_FILE}",
            cache / config.WPP_VARIANTS_FILE,
            force=force,
        ),
    }

    checksums = {
        name: {"file": p.name, "bytes": p.stat().st_size, "sha256": _sha256(p)}
        for name, p in paths.items()
    }
    (cache / "checksums.json").write_text(json.dumps(checksums, indent=2) + "\n")
    return paths
