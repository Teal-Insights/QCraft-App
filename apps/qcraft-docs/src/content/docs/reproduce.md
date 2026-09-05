---
title: "Reproduce the code and the country data together"
description: "A complete source setup and the base-path arrangement for offline use."
---

**An Explorer build needs the country payloads as well as the source code.** npm installs JavaScript dependencies. It does not supply the 350 country files that the browser fetches. Keep the source revision, package lockfile and pinned input archive together.

## Build the Explorer from an exact source revision

**Use Node 25.9.0, npm 11.12.1 and Python 3.14.6 for the tested setup.** The extraction recipe requires Python 3.12 or newer for the `tarfile` data filter. The source below identifies the copy-corrected release candidate. Public retrieval of this new commit remains pending publication approval. Local reproduction uses the same exact commit in an isolated checkout.

```sh
git clone https://github.com/Teal-Insights/QCraft-App.git qcraft-explorer
cd qcraft-explorer
git checkout --detach 83cab39790a9186c6f468b85bf8221ad52b72731
mkdir -p setup-inputs
curl --fail --location \
  https://github.com/Teal-Insights/QCraft-App/releases/download/freeze-2026-08-29/site-inputs-freeze-2026-08-29.tar.gz \
  --output setup-inputs/site-inputs-freeze-2026-08-29.tar.gz
```

**Verify the archive before extracting or building.** Expected SHA-256: `5a6f97372de83f02c1230a673b47b459af45e7a726e16a45cc4a46cd4f513028`. The archive includes a historical guide too. Only its `payloads/` tree is used by this Explorer setup.

```sh
python3 - <<'CHECK'
from pathlib import Path
import hashlib, tarfile
archive = Path('setup-inputs/site-inputs-freeze-2026-08-29.tar.gz')
expected = '5a6f97372de83f02c1230a673b47b459af45e7a726e16a45cc4a46cd4f513028'
assert hashlib.sha256(archive.read_bytes()).hexdigest() == expected
with tarfile.open(archive) as bundle:
    bundle.extractall('setup-inputs/unpacked', filter='data')
CHECK
```

**Copy payloads into the two vintage directories before building.** The committed indexes supply the country lists. The prebuild staging script requires the ignored country JSON files next to them.

```sh
python3 - <<'STAGE'
from pathlib import Path
import hashlib, shutil
root = Path('setup-inputs/unpacked')
for line in (root / 'SHA256SUMS').read_text().splitlines():
    digest, rel = line.split(maxsplit=1)
    assert hashlib.sha256((root / rel.strip()).read_bytes()).hexdigest() == digest
for vintage in ('weo-2024-10', 'weo-2026-04'):
    files = sorted((root / 'payloads' / vintage).glob('*.json'))
    assert len(files) == 175
    dest = Path('data/vintages') / vintage / 'json'
    assert (dest / 'index.json').is_file()
    for file in files:
        shutil.copy2(file, dest / file.name)
STAGE
npm ci --prefix apps/qcraft-web
VITE_BASE_PATH=/QCraft-App/explorer/ npm --prefix apps/qcraft-web run build
```

**Build output belongs to the declared base path.** The assets and data requests point to `/QCraft-App/explorer/`, so serving `dist/` at localhost root is not the tested arrangement for this build.

## Serve a prepared distribution without a network

**Prepare the distribution while online, then serve its local files.** A prepared release must include the Explorer bundle, both complete vintage payload sets, file checksums and a short startup note. It must be extracted and checked before entering the training room. The author has assembled and tested a local candidate archive. Public download and independent review remain pending.

```sh
mkdir -p offline-root/QCraft-App/explorer
cp -R apps/qcraft-web/dist/. offline-root/QCraft-App/explorer/
python3 -m http.server 8080 --bind 127.0.0.1 --directory offline-root
```

Open `http://127.0.0.1:8080/QCraft-App/explorer/`. The local HTTP server needs no Internet connection. Browser `file://` loading is unsupported because module scripts and fetch requests require HTTP behavior.

**Test both modes before relying on offline access.** With external requests disabled, select Uganda in Current, then Verified, and confirm that results differ. Save a run, change a setting, import it and confirm country, mode, parameters and results restore. Also select a country that has not previously been opened, to confirm that every country payload is present. A warm browser cache is not proof of a complete offline bundle.

## Preserve the inputs with a result

**Save the run file beside the input archive and release manifest.** Include the exact engine commit and the payload SHA-256, plus any report and workbook export. Run files identify a vintage but do not embed its data. Read any restore warnings before comparing the result to an earlier report.

**The clean-source recipe was executed on 4 September 2026 at engine `0f03e7767251953bed1dfc14b6886967f2b275ce`.** A fresh local source clone used the publicly downloaded input archive, verified its checksums and built successfully. The reviewed source above, `83cab39790a9186c6f468b85bf8221ad52b72731`, changes a productivity-panel caption and its copy regression test. Its computational source and defaults are unchanged. CC29 rebuilt that exact revision twice and obtained identical non-data file manifests, SHA-256 `57a287ece74a6668483e38092a2672575e8775d4fa70d5dd3c99c2d7de092d90`. The earlier clean-source run is retained evidence, not a new clean install at the amended revision.

**The amended offline distribution was checked separately at the reviewed source revision.** Every Explorer file and all 350 country payloads match CC29's exact corrected distribution. The newly extracted archive was tested in fresh browser contexts that could reach only localhost: Uganda ran in both modes, changed parameters survived a run-file export and restore, and a new country plus a reload worked without external requests or page errors. These are scoped reproduction checks, not a new Excel parity result. Final documentation review, public source retrieval and publication remain pending.
