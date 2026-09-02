# Deploy report: the site on GitHub Pages

**CC-9, 2026-08-28.** Ships `freeze-2026-08-29` to
`https://teal-insights.github.io/QCraft-App/explorer/` without touching the
companion guide already served at the root of the same site.

Issue: TEA-1400. Worktree: `~/GitHub/QCraft-App-cc9`. Branch:
`ci/pages-single-artifact`, cut from `main` at `0fb5eb1`.

Dry run Monday. Uganda training Tuesday 2pm EAT.

**Updated 2026-08-29 by CC-13:** `freeze-2026-08-29b` is now live, one fix on
top of the tag this report was written for. Section 0 is that redeploy.
Everything from section 1 down is CC-9's account of the first deployment and is
left as it stood, because it is the record of how the site got its shape.

**Updated 2026-08-29 late by CC-16:** `freeze-2026-08-29c` is now live, the
four HCD micro-fixes on top of b. The unnumbered section directly below is
that redeploy; section 0 and everything after remain CC-13's and CC-9's
accounts, untouched.

**Updated 2026-09-02 by CC-27:** the course guide replaces the March guide at
the site root. The section directly below is that change. Everything after it
is the record of the three Explorer redeploys and the first deployment, left as
it stood.

---

## The root changes: the course guide replaces the March guide (CC-27)

**CC-27, 2026-09-02.** TEA-1400 (deployment surface) and TEA-948 (course).
Worktree `~/GitHub/QCraft-App-cc27`, branch `ci/course-guide-root`, cut from
`main` at `67d26b6`. Course source on `feat/course-accuracy` in
`~/candidates/qcraft-sprint-2026-08-26/lane4-course`.

### What changes and why

The site root has served the March 2026 companion guide since the first
deployment, protected byte for byte through three Explorer redeploys. The
2026-09-02 audit (audit C, `C-live-root-guide.md`) found that guide describing
the retired Shiny V1: it links to shinyapps.io, names five parameters where the
Explorer has ten, one data vintage where the Explorer has two, four tabs where
the Explorer has seven, and carries no IMF non-endorsement line. Teal's decision
1.5.3: the course guide (Module 0 to Module 6 plus appendices, 121 pages in
print) goes to the root before the FAD viewing.

`/explorer/` does not change. `app_ref` stays `freeze-2026-08-29c` and
`EXPLORER_DIST_SHA256` stays `d44c5c1a...94bea`.

### The root protection moves from the March hashes to the new root's hashes

The workflow used to refuse any deploy in which a root byte differed from the
live site, and that check is what has to be crossed to publish a changed guide.
Two things change in `.github/workflows/companion-guide.yml`:

- `GUIDE_ROOT_SHA256` pins the root to one render: the aggregate sha256 of the
  sorted per-file sha256 manifest of the archive's `guide/` tree. A new step,
  "The guide root must be the pinned root", refuses any other root, whatever
  the live site holds. `GUIDE_FILE_COUNT` replaces the literal 30.
- `verify_guide_against_live` keeps its default of `true` and its meaning: on a
  routine Explorer redeploy it still fetches every root file from the live site
  and refuses if a byte would change. It is set to `false` for this one
  dispatch, because the root is meant to change. After the deploy the live
  root and the pinned root are the same bytes, so the next Explorer redeploy is
  protected by both checks again.

The whole-site check also grew: the eleven course pages must exist, the three
March page names must exist as forwarding stubs, `search.json` must exist, and
no `shinyapps.io` string may appear in any root HTML file.

```
old root (March guide, 30 files), aggregate   119222a9d31320fc568569a730cd3e48f5b0bbcc56625ca9798f4cf297b3c64e
new root (course guide, 63 files), aggregate   5b4cfda266e8a3bf42c49045f36b07a494e6f7007674a06884cea3aa93d618c6
```

Per-file manifests for both roots are in the lane report
(`docs/lane-reports/cc27-course-and-root.md` on `feat/course-accuracy`).

### The March page names forward to the course pages

The deployed Explorer's guide links (`apps/qcraft-web/src/content/guidance.ts`
at `freeze-2026-08-29c`) point into `part1-policy.html`, `part2-using.html` and
`part3-codesign.html` with anchors, and the Shiny prototype's `constants.py`
did the same. Those pages are gone from the render. The course source ships
three stubs under the old names, listed as Quarto resources, each forwarding
its old anchors to the section that now carries the content (a `meta refresh`
to the page, plus a script that maps the hash). So no link from the deployed
Explorer breaks, and `apps/qcraft-web` is untouched, as the lane split
requires. Repointing `guidance.ts` at the course pages is CC-26's, or a
follow-up on the next freeze.

### The build inputs

Release `site-2026-09-02` carries `site-inputs-site-2026-09-02.tar.gz`:

- `guide/`, 63 files: the course guide rendered at Quarto 1.8.27
  from `feat/course-accuracy` at `94d1f49`, HTML and PDF, the same
  bytes the render check in the lane report describes.
- `payloads/<vintage>/<ISO3>.json`, 175 per vintage, byte-identical to the
  `freeze-2026-08-29` archive (checked against its `SHA256SUMS`).
- `SHA256SUMS` over all files, and `MANIFEST.md`.

```
site-inputs-site-2026-09-02.tar.gz
88f8bdfc93f4b946ef2551b0d6b103ea5cfacfccd7c771a146e6c3fd336b04e0
```

### The deploy

The dispatch reads the workflow from `main`, and the `github-pages` environment
refuses any other ref, so the sequence is: merge the draft PR, then dispatch.

```bash
gh workflow run "Site" --repo Teal-Insights/QCraft-App --ref main \
  -f app_ref=freeze-2026-08-29c \
  -f inputs_release=site-2026-09-02 \
  -f verify_guide_against_live=false
```

| Field | Value |
| --- | --- |
| Run | pending: dispatched after the PR merges |
| Pages deployment | pending |
| `app_ref` | `freeze-2026-08-29c`, unchanged |
| `inputs_release` | `site-2026-09-02` |
| `verify_guide_against_live` | `false`, this dispatch only |
| When | pending |

### After the deploy

Pending the dispatch. The lane report carries the check list: the thirteen URLs of section 7.1 with `part2-using.html` replaced by the eleven course pages and the three stubs, the post-deploy root manifest against the pinned one, and `/explorer/` unchanged.

### The Shiny prototype

`apps/qcraft-app/app.py` gains a banner above the tabs: "This is the March 2026
prototype. The current Q-CRAFT Explorer is at
https://teal-insights.github.io/QCraft-App/explorer/", and its guide links move
to the course pages. It is not redeployed from this machine: no rsconnect
server is configured here (`rsconnect list` reports none, and the
`~/Library/Python/3.13/bin/rsconnect` that `scripts/deploy.sh` expects does
not exist). The redeploy steps are in the lane report's gate. Retirement is
after Bangkok, per decision 1.5.3.

---

## The redeploy: freeze-2026-08-29c (CC-16)

**CC-16, 2026-08-29 late.** TEA-1400. Worktree `~/GitHub/QCraft-App-cc16`,
branch `feat/hcd-microfixes`, cut from `freeze-2026-08-29b`.

### What changed and why

The four pre-Tuesday micro-fixes Teal picked at the CC-15 triage gate, from the
HCD audit's section 8a (`docs/hcd-audit-2026-08.md` on `feat/hcd-audit`), under
the freeze exception: these four changes and nothing else, no gated IMF-facing
wording touched.

- **A1 (F-4).** The active mode pill rendered navy text on the navy capsule
  under the pointer, exactly where the pointer sits at the moment of
  switching; on a projector the switch to Verified showed a blank dark
  capsule. One selector: the hover rule now excludes the active pill, the
  register toggles' own idiom. Contrast at that moment: 1.00 before, 11.25
  after.
- **A2 (F-13).** The packet button showed its white label on near-white
  whenever hovered, which is where the pointer rests after the click that
  downloads the packet. The root cause was not the audit's busy-style
  hypothesis but the same specificity pattern as F-4 one tier up: the generic
  `.button:hover` pale background outranking the primary button's own styles.
  The pale hover now excludes primary buttons; a hovered primary keeps its
  resting navy. Contrast 1.07 before, 11.25 after.
- **A4 (F-3).** Clearing a numeric field fed `Number('') === 0` to the engine:
  headlines recomputed at a zero assumption and "0" rerendered under the
  analyst's cursor. All five numeric fields now commit nothing on an empty
  draft; the projection keeps the last valid value, a flag beside the field
  says so, and the value returns to the box on blur.
- **A5 (F-2 partial).** 999 in a max-15 field recomputed silently and was
  badged like a legitimate choice. On blur a flag beside the field names the
  declared range, with the typed value preserved. The engine still computes
  with the value by design; the stale-state hold is the v2.1 input-integrity
  lane's.

Full account: `docs/lane-reports/cc16-hcd-microfixes.md` on
`feat/hcd-microfixes`, with before/after pairs in
`docs/screenshots/hcd-microfixes/` and a dedicated browser regression loop
(`qa:microfixes`, 45 checks) that fails 32 of 45 against the outgoing tag.

### The pin moved, one line again

PR [#74](https://github.com/Teal-Insights/QCraft-App/pull/74) changed
`EXPLORER_DIST_SHA256` and nothing else, merged as `a99a3fdd` on Teal's
instruction.

```
8a3fd7dbad5cdd4d14c7af50a2d962baa526369ee20560a0047459e734b14500   freeze-2026-08-29b
d44c5c1a5e2d6531a918c86cb936490c89e37d9b3cc6cdfb02ea2a454c994bea   freeze-2026-08-29c
```

Checked the way section 0.2 describes before the PR was opened: the same
command reproduces the outgoing pin exactly at `freeze-2026-08-29b`, and the
new build is byte-stable across two consecutive runs at the sub-path base,
recomputed at the tag commit. Still 32 files. `INPUTS_SHA256` did not move:
this lane touched no data and no guide file. The runner then agreed: expected
`d44c5c1a...94bea`, actual `d44c5c1a...94bea`.

### The deploy

Dispatched from `main` at `a99a3fdd` with `app_ref=freeze-2026-08-29c`. Run
[33283784473](https://github.com/Teal-Insights/QCraft-App/actions/runs/33283784473),
Pages deployment `6161708714`, 2026-08-30 00:38 UTC, the fifth deployment in
the site's history. The guide root survived a third full-site replacement: 30
of 30 files identical inside the build before anything uploaded.

### The fixes, checked on the deployed site

The whole browser battery ran against
`https://teal-insights.github.io/QCraft-App/explorer/` rather than a local
server, all eight loops clean: `qa:export` at 271 checks and 0 failures,
`qa:context`, `qa:tabs`, `qa:widgets`, `qa:registers`, `qa:context-shots`, the
96-screenshot `qa:sweep` with zero console errors, and `qa:microfixes` at 45
of 45, driving the four fixes at the exact moments the audit screenshotted, on
the live site: the mode pill and the packet button measured at 11.25 contrast
under the pointer, the emptied field holding its headline with the flag beside
it, and the 999 case flagged on blur with the value preserved. `/explorer`
without the slash still redirects. The live asset names match the pinned local
build.

**CC-13, 2026-08-29.** TEA-1400. Worktree `~/GitHub/QCraft-App-cc13`, branch
`feat/subzero-note-fix`, cut from `freeze-2026-08-29`.

### 0.1 What changed and why

One defect. The approved gate-7 sub-zero note was in the shipped bundle,
verbatim, passing the freeze copy gate, and wired to a code path a trainee never
reaches.

With the fiscal rule set to No, Uganda's climate scenarios repay the whole debt
stock and keep going, to **-473.6 per cent of GDP in 2099** on the frozen
vintage at the app's own defaults. The screen said nothing about it. Tuesday's
exercise block has trainees toggle that control, and the IMF User Guide's own
instructions start with the rule off.

The predicate was never at fault. Three things downstream of it were: the note
was attached in the export layer, which the screen never walks; the trigger
asked about the whole run rather than about each chart, so it also fired on the
Baseline debt chart, which draws only the zero-floored baseline; and neither
`READ-ME.txt` nor the workbook's README sheet ever carried it.

Full account: `docs/lane-reports/cc13-subzero-note.md` on
`feat/subzero-note-fix`. No wording changed.

### 0.2 The pin moved, which is the only thing main needed

The workflow refuses to publish a bundle that is not the pinned one, so a new
tag cannot deploy until `EXPLORER_DIST_SHA256` names its bundle. PR
[#69](https://github.com/Teal-Insights/QCraft-App/pull/69) changed that one
line and nothing else, merged as `785ef8c` on Teal's instruction.

```
49e8de70f2f8417a5271b4bbe930f2bde2c517c85bf073f36f2d2bf5db74cc2a   freeze-2026-08-29
8a3fd7dbad5cdd4d14c7af50a2d962baa526369ee20560a0047459e734b14500   freeze-2026-08-29b
```

The hash was computed the way section 3.1 describes, and checked two ways
before the PR was opened: the same command reproduces the OUTGOING pin exactly
at `freeze-2026-08-29`, and the new build is byte-stable across two consecutive
runs. The runner then agreed:

```
expected 8a3fd7dbad5cdd4d14c7af50a2d962baa526369ee20560a0047459e734b14500
actual   8a3fd7dbad5cdd4d14c7af50a2d962baa526369ee20560a0047459e734b14500
```

`INPUTS_SHA256` did not move. The site inputs are the same archive: this lane
touched no data and no guide file, so the 30 guide files and 350 payloads are
the ones section 6 describes.

### 0.3 The deployment

| Field | Value |
| --- | --- |
| Run | [33272171046](https://github.com/Teal-Insights/QCraft-App/actions/runs/33272171046) |
| Pages deployment | 6159508225 |
| Workflow ref | `main` at `785ef8c` |
| `app_ref` | `freeze-2026-08-29b`, commit `a775290` |
| `inputs_release` | `freeze-2026-08-29`, unchanged |
| `verify_guide_against_live` | `true` |
| When | 2026-08-29 19:57 UTC |

The fourth deployment in the site's history.

```bash
gh workflow run "Site" --repo Teal-Insights/QCraft-App --ref main \
  -f app_ref=freeze-2026-08-29b \
  -f inputs_release=freeze-2026-08-29 \
  -f verify_guide_against_live=true
```

### 0.4 The guide root is still untouched

Every refusal in section 5 ran and passed, including the one that matters most
here: the workflow fetched all 30 live files before uploading anything and
compared them against the tree it was about to publish. Checked again by hand
after the deploy, against the same release capture section 8 uses:

```
post-deploy guide root: 30 checked, 0 differ
```

Two deployments have now replaced the whole site and the root has not moved a
byte through either.

### 0.5 The live smoke

Run against `https://teal-insights.github.io/QCraft-App/explorer/`, not a local
copy.

All thirteen URLs in section 7.1 return 200, and `/explorer` without the
trailing slash still returns 301 to `/explorer/`.

**The defect, checked on the deployed site.** Uganda, Verified mode, fiscal rule
set to No, Analysis tab:

- the note renders verbatim under the debt chart in the **Workbook** register,
  which is the default
- and in the **Briefing** register
- the worst-outcome card reads
  `Worst climate outcome (2099)  -473.6%  Hot + Unadapted. Below zero is a net asset position.`
- the Baseline and Climate tabs stay silent, correctly: neither draws a
  sub-zero debt path, and the balances and the growth drag are below zero in
  ordinary runs for reasons that have nothing to do with a net asset position

With the rule back on, nothing carries the note anywhere.

**The freeze battery's whole browser half**, re-run against the deployed site:

| Loop | Result |
| --- | --- |
| `qa:export` | pass. 271 checks, 0 failures. Uganda and Kenya, both modes, one pass in the briefing register, plus the Maldives no-signal case. Packet downloaded, workbook opened in a spreadsheet reader, six PNGs checked at 2x, report and chart pack printed to real PDFs, run file re-imported and the restored state compared field by field. |
| `qa:tabs` | pass, no console errors |
| `qa:context` | pass. All panels open, respond to their parameter, and fit the fold |
| `qa:widgets` | pass. All three widgets clean at projector, laptop and iframe sizes |
| `qa:registers` | pass, no console errors |
| `qa:sweep` | pass. 96 screenshots, no console errors |

`qa:export` is stricter than it was on 2026-08-28. It now reads each run's own
results CSV, and where that CSV holds a negative debt value it requires the
report, the chart pack, `READ-ME.txt` and the workbook README sheet to all
explain it, reading the real downloaded `.xlsx` with openpyxl. Sixteen of the
271 checks are that comparison. It is the check whose absence let the defect
ship, and it failed on the chart pack the first time it ran, on a wrapping
problem in the SVG renderer, which is the check doing its job.

### 0.6 What did not change

The shinyapps Explorer, every existing guide URL, the site inputs archive, and
the 30 files at the site root. Supersede, not replace, still holds.

---

## 1. Bottom line

The Explorer is live at
`https://teal-insights.github.io/QCraft-App/explorer/` and the companion guide
at the root of the same site is byte for byte what it was before, all 30 files,
checked three times.

Pages deployment `6148392861`, from `main` at `0d99fac`, run
[33210167795](https://github.com/Teal-Insights/QCraft-App/actions/runs/33210167795),
2026-08-28 20:54 UTC. It is the third deployment in the site's history and the
first since March.

The live site passes the freeze battery's whole browser half. All six loops run
against `https://teal-insights.github.io/QCraft-App/explorer/` rather than a
local server: `qa:export` with 255 checks and zero failures, `qa:tabs`,
`qa:context`, `qa:widgets`, `qa:registers`, and a 96-screenshot `qa:sweep`. Zero
console errors in any of them.

One thing changed shape against the brief, and it is section 3.2: the guide root
could not be reproduced by re-rendering, because Quarto's SCSS bundling is not
deterministic. It is laid down from a pinned capture of the served bytes
instead, and the workflow refuses to deploy if that capture and the live site
ever disagree.

Nothing is held. The shinyapps Explorer and every existing guide URL are
untouched.

---

## 2. What is live

| URL | What is there |
| --- | --- |
| `https://teal-insights.github.io/QCraft-App/` | the companion guide, unchanged |
| `https://teal-insights.github.io/QCraft-App/explorer/` | the Q-CRAFT Explorer at `freeze-2026-08-29` |
| `https://teal-insights.github.io/QCraft-App/explorer/widgets/debt-dynamics/` | the debt dynamics equation sandbox |
| `https://teal-insights.github.io/QCraft-App/explorer/widgets/growth/` | where growth comes from |
| `https://teal-insights.github.io/QCraft-App/explorer/widgets/climate-channel/` | how warming reaches the debt line |

Supersede, not replace. The old Shiny Explorer on shinyapps.io is untouched and
was not part of this lane. Every URL that worked before this deploy works after
it, byte for byte.

---

## 3. The design, and the measurement that forced it

The mission was one workflow assembling the full site tree. It is
`.github/workflows/companion-guide.yml`, edited in place rather than joined by a
second file, because the old workflow uploaded only
`docs/companion-guide/_book` as the whole Pages artifact. A Pages deployment
replaces the site, so leaving it in place beside a new Explorer workflow meant
the next guide edit would publish a site with no Explorer in it. After this
change the repository has exactly one workflow that can publish Pages.

Two measurements decided how each half of the tree is produced.

### 3.1 The Explorer is reproducible, so the workflow builds it

An ubuntu-24.04 runner with Node 25.9.0 and `npm ci` from the committed
lockfile, building the tag at `VITE_BASE_PATH=/QCraft-App/explorer/`, produced
all 32 files of `apps/qcraft-web/dist` byte-identical to a local macOS build of
the same tag with the same base. The workflow pins the aggregate hash of that
manifest and fails if the bundle it just built is not the frozen one.

```
sha256 of the sorted per-file sha256 manifest, data/ excluded, 32 files
49e8de70f2f8417a5271b4bbe930f2bde2c517c85bf073f36f2d2bf5db74cc2a
```

The base path is set at build time from the environment. `vite.config.ts` reads
`VITE_BASE_PATH` and falls back to `'./'`, so nothing in the frozen source was
edited to deploy it. `src/engine/countryData.ts` builds its fetch URLs off
`import.meta.env.BASE_URL`, so the country payloads resolve under the sub-path
without a code change, and the widget links are already relative.

### 3.2 The guide is not reproducible, so the workflow lays it down

Quarto's SCSS bundling is not deterministic. Three renders of the same source at
Quarto 1.8.27:

| Render | `bootstrap-<hash>.min.css` |
| --- | --- |
| the March CI run that produced the live site | `c58f986be3ff872790ab570c6d9e49f2` |
| a local macOS render, 2026-08-28 | `22e83d4e5eff2a99ccc45532742ac980` |
| an ubuntu-24.04 runner, 2026-08-28 | `96cee69366b7685f4c548ea14d57ac92` |

Same 508,700 bytes and the same multiset of 4,745 rule blocks in every case,
ordered differently. A different content hash means a different filename, which
means six HTML files pointing at a different stylesheet. Rendering the guide in
the deploy workflow would therefore change seven of the thirty files at the site
root on every run, which the supersede-not-replace policy does not allow.

So the workflow lays down the exact bytes that are already served, from a
pinned, checksummed archive, and then proves it against the live site before it
deploys anything.

### 3.3 The sub-path build was proved before it was deployed

The whole tree was assembled locally, guide at the root and Explorer under it,
and served on `http://localhost:8911/QCraft-App/`. All six browser loops ran
against `http://localhost:8911/QCraft-App/explorer/`, which is the same shape of
URL the live site has:

| Loop | Result |
| --- | --- |
| `qa:export` | pass. Uganda and Kenya, both modes, one pass in the briefing register. Packet downloaded, workbook opened in a spreadsheet reader, six PNGs checked at 2x, report and chart pack printed to real PDFs, run file re-imported and the restored state compared field by field. The Maldives no-signal checks on the report copy passed too. |
| `qa:tabs` | pass, no console errors |
| `qa:context` | pass. All panels open, respond to their parameter, and fit the fold |
| `qa:widgets` | pass. All three widgets clean at projector, laptop, and iframe sizes |
| `qa:registers` | pass, no console errors |
| `qa:sweep` | pass. 96 screenshots, no console errors, including the Maldives no-coverage notice and the Syria anchor-year notice in Verified |

That is the freeze battery's browser half, re-run against the sub-path. The
sub-path is the only variable this lane changed, and it changed nothing.

---

## 4. The untouched-root evidence

### 4.1 The source state is the same

`docs/companion-guide` is identical on `main` and on `freeze-2026-08-29`. Both
resolve to tree `a999b13afef83bc08ef29264c3dd8b9fca689ad3`, and
`git diff main freeze-2026-08-29 -- docs/companion-guide/` is empty.

The site has had exactly two Pages deployments in its history, and the second is
what is live:

| Deployment | When | Ref | Commit |
| --- | --- | --- | --- |
| 4101160304 | 2026-03-18T05:01:28Z | `main` | `8e97936c23` |
| 4103652055 | 2026-03-18T10:53:56Z | `main` | `feb043ade7` |

`feb043a` is PR #51, the last commit to touch `docs/companion-guide`. Three
commits have landed on `main` since, none of them in that directory, and the
workflow's path filter meant none of them redeployed. So the bytes being served
are a render of the same tree the tag carries.

### 4.2 The served bytes are the render of that source

A fresh local render of the frozen source, compared file by file against the
live site:

| Result | Count |
| --- | --- |
| byte-identical | 23 |
| differ only in the Bootstrap filename they link to | 6 |
| the Bootstrap CSS itself, reordered | 1 |

The six HTML files differ on **zero lines** once the Bootstrap filename is
normalised, checked per file. The CSS is the same byte count and the same rule
multiset, checked by sorting the `}`-delimited blocks of both files and
comparing their SHA-256: `63f6d41d5377b2c6153e34d86128f1aa20ad2329564e8215a95e1f28e8c2b3c6`
on both sides, with zero blocks present in one and not the other.

### 4.3 The deploy did not change them

Three checks, two of them inside the deploy and one after it.

**Immediately before dispatching**, all 30 live files were compared against the
capture in the release archive: `pre-dispatch guide root: 30 identical, 0 not`.
`/QCraft-App/explorer/` returned 404 at that moment, which is the "before"
this deploy is measured against.

**Inside the build**, before anything was uploaded, the workflow fetched all 30
live files and compared them against the tree it was about to publish:
`guide root: 30 identical, 0 not`. Had one byte differed the run would have
stopped there and published nothing.

**After the deploy**, the same comparison again, against the same capture:
`post-deploy guide root: 30 identical, 0 not`.

So the bytes served at the site root before and after this deploy are the same
bytes, and they are the same bytes the March 2026 render produced. The guide
also renders: `https://teal-insights.github.io/QCraft-App/` loads the Preface
with its table of contents and sidebar, no console errors.

---

## 5. What the workflow refuses to do

Nothing is uploaded and nothing is deployed unless every one of these passes.
Any failure leaves the live site exactly as it was.

| Check | What it catches |
| --- | --- |
| the inputs archive matches its pinned SHA-256 | a swapped or corrupted asset |
| all 381 files inside match `SHA256SUMS` | a partial or tampered unpack |
| 30 guide files, 175 payloads per vintage | a malformed archive |
| the built Explorer matches the pinned bundle hash | a toolchain drift that would ship a different bundle |
| all 30 guide files match what is live right now | any change to the site root |
| both index pages, the PDF, three widgets, 175 payloads per vintage present | an incomplete tree |

The archive-count check earned its place during this lane: the first archive was
written by macOS `tar`, which emitted pax extended headers that GNU `tar` on the
runner materialised as real files. The unpack looked fine to `SHA256SUMS`, which
only checks the files it lists, and the count check caught it at 69 guide files
and 700 payloads instead of 30 and 350. The archive was rebuilt with Python's
`tarfile` in GNU format with normalised metadata and a fixed mtime.

---

## 6. The build inputs

Release
[`freeze-2026-08-29`](https://github.com/Teal-Insights/QCraft-App/releases/tag/freeze-2026-08-29)
carries `site-inputs-freeze-2026-08-29.tar.gz`, 9.6 MB:

- `guide/`, 30 files: the companion guide exactly as served, captured
  2026-08-28.
- `payloads/<vintage>/<ISO3>.json`, 175 per vintage:
  `data/vintages/*/json/*.json` is a gitignored build artifact, so a CI checkout
  does not have it. `index.json` is not in the archive because it is committed
  at the tag and imported at build time rather than fetched.
- `SHA256SUMS` over all 381 files, and `MANIFEST.md` recording how the guide
  capture was checked.

```
site-inputs-freeze-2026-08-29.tar.gz
5a6f97372de83f02c1230a673b47b459af45e7a726e16a45cc4a46cd4f513028
```

Teal chose the release over an orphan branch on 2026-08-28: a release asset does
not enter git objects, so no clone grows by 10 MB. The payloads are bytes the
site serves anyway, so nothing became public that the deploy would not publish.

The Explorer bundle is not in the archive, because section 3.1 says it does not
need to be.

---

## 7. The smoke

Run against the deployed site, not a local copy. Artifacts, logs and 96
screenshots are in the lane's scratch directory; the assertions are reproduced
by the commands in section 8.

### 7.1 The URLs

Every one returns 200:

```
/                                        /explorer/
/index.html                              /explorer/index.html
/part2-using.html                        /explorer/widgets/debt-dynamics/
/Q-CRAFT-Explorer-Companion-Guide.pdf    /explorer/widgets/growth/
                                         /explorer/widgets/climate-channel/
/explorer/data/weo-2024-10/UGA.json      /explorer/data/weo-2026-04/UGA.json
/explorer/data/weo-2024-10/MDV.json      /explorer/data/weo-2024-10/SYR.json
```

`/explorer` without the trailing slash returns 301 to `/explorer/`, so a URL
read off a slide without the slash still works.

### 7.2 The guide root is unchanged

Section 4.3. Thirty files identical before the dispatch, inside the build, and
after the deploy. The guide also renders: the Preface loads with its sidebar and
table of contents, no console errors.

### 7.3 Uganda runs in both modes

| Mode | Debt-to-GDP 2050 | Revenue 2050 | Primary balance 2050 |
| --- | --- | --- | --- |
| Current, WEO April 2026 + UN WPP 2024 | 50.3% | 16.9% | 1.2% |
| Verified, WEO October 2024 + UN WPP 2022 | 34.6% | 18.6% | 0.4% |

The mode switch changes real numbers rather than a label, which is what CC-2's
engine-backing work made true and what this confirms over HTTPS from a static
host. The Verified badge carries Teal's gated wording verbatim: "Matches the
official IMF Excel workbook. Baseline parity verified for 147 of 147 tested
countries; climate-scenario parity confirmed for ratio metrics only."

### 7.4 Maldives shows the coverage notice

On the live site, Maldives in Current mode carries the notice above the tabs:
"No climate estimates for this economy. The climate dataset has no coverage for
this economy, so every scenario lands on the baseline. That is missing data, not
an absence of risk. Sea-level rise and disaster damage are outside this model
everywhere, and for small island and city economies those are usually the
channels that matter most." The baseline projection is still drawn and still
usable, which the second paragraph says.

`qa:export` also asserted the packet's own copy for Maldives: the report says
the dataset has no coverage, does not report a spread the data does not carry,
and does not call a zero spread the climate-fiscal risk.

### 7.5 A packet downloads and re-imports

`qa:export` ran the full loop four times on the live site, Uganda and Kenya in
both modes with one pass in the briefing register, plus the Maldives case. For
each run it set parameters, wrote rationale notes and an analyst note,
downloaded the packet, unpacked it, and checked every artifact:

- the workbook opens in a real spreadsheet reader and has its six sheets
- every chart PNG is a PNG at twice the requested size
- the results CSV parses and the run JSON round-trips
- the report and the chart pack print to real PDFs at the A4 and Letter page box

Then it reset the app, re-imported the run file, and confirmed the restored
state was the exported state: parameters, rationale notes, run label, analyst
note, chart register and data mode. 255 checks, zero failures.

### 7.6 The anchor-year notice shows for Syria on Verified

Syria in Verified mode carries the notice: "This projection starts from an
earlier year. The source data stops reporting the figures this projection needs
after 2010, although the release itself runs to 2029. So the projection for
Syria is anchored on 2010, the last year actually reported, and every year after
it is projected rather than observed."

The chart subtitle beneath it reads "Shaded region shows WEO historical/forecast
data (through 2010)", which is CC-8's fix for the subtitle that used to claim
2029 on every country. The notice and the band agree.

### 7.7 Zero console errors

Every loop fails its run on a console error, and none did. That covers the seven
tabs, both chart registers, all six context panels in both modes, the three
widgets at projector, laptop and iframe sizes, four notice states on the
countries that trigger them, and both printed documents.

---

## 8. Redeploying

The workflow file lives on `main`, which is where a dispatch reads it from. What
gets built is `app_ref`, which defaults to the frozen tag.

**`--ref` is not the thing being deployed.** A dispatch runs the workflow
*definition* at the ref it is given, so `--ref main` is required. Dispatching
`--ref freeze-2026-08-29` runs the workflow file as it exists at that tag, which
is the old Companion Guide workflow, and that one gates both its upload and its
deploy on `github.ref == 'refs/heads/main'`. It would therefore build the guide
and publish nothing: a green run that changed the site not at all. The tag is
named in `app_ref` instead, which is what gets checked out and built.

The repository backs this up independently of any workflow file. The
`github-pages` environment carries a deployment branch policy naming exactly one
branch, `main`, so a deploy job reached from any other ref is refused by the
environment before it runs. The environment has no required reviewers, so a
dispatch from `main` proceeds without a second approval; the merge of the
workflow onto `main` is the approval.

```bash
gh workflow run "Site" --repo Teal-Insights/QCraft-App --ref main \
  -f app_ref=freeze-2026-08-29 \
  -f inputs_release=freeze-2026-08-29 \
  -f verify_guide_against_live=true
```

Watch it:

```bash
gh run list --repo Teal-Insights/QCraft-App --workflow=companion-guide.yml --limit 3
gh run watch <run-id> --repo Teal-Insights/QCraft-App --exit-status
```

Check the root by hand at any time, against the pre-deploy capture in the
release archive:

```bash
gh release download freeze-2026-08-29 --repo Teal-Insights/QCraft-App \
  --pattern 'site-inputs-*.tar.gz' --dir /tmp/qcraft-inputs
tar -xzf /tmp/qcraft-inputs/site-inputs-*.tar.gz -C /tmp/qcraft-inputs
cd /tmp/qcraft-inputs/guide
find . -type f | sed 's|^\./||' | while read -r f; do
  curl -sS -o /tmp/live.bin "https://teal-insights.github.io/QCraft-App/$f"
  a=$(shasum -a 256 "$f" | cut -d' ' -f1)
  b=$(shasum -a 256 /tmp/live.bin | cut -d' ' -f1)
  [ "$a" = "$b" ] || echo "DIFF $f"
done
```

Rebuild the Explorer locally the way the workflow does:

```bash
VITE_BASE_PATH=/QCraft-App/explorer/ npm --prefix apps/qcraft-web run build
```

Serve the whole tree locally, guide at the root and Explorer under it, which is
the offline contingency for the training room:

```bash
python3 -m http.server 8911 --directory <dir-holding-QCraft-App>
```

### Publishing a changed guide later

The byte-identity check is the thing standing in the way, and deliberately so.
Rebuild the archive from the new render, update `INPUTS_SHA256` in the workflow,
and dispatch with `verify_guide_against_live=false`. That is a reviewed change
to `main`, which is the right gate for changing what the site root shows.

---

## 9. Known limitations

### 9.1 The guide does not link to the Explorer

Adding a link would change bytes at the site root, which this deploy is built to
refuse. It is a separate decision for Teal, and it would ship as a guide edit
through the route in section 8.

### 9.2 The site is 94.6 MB across 412 files

| Part | Size | Files |
| --- | --- | --- |
| the guide root | 4.5 MB | 30 |
| the Explorer bundle | 5.9 MB | 32 |
| the country payloads | 84.2 MB | 350 |

The payloads are fetched one country at a time and never all at once: the median
payload is 239 kB and the largest is 278 kB, so a user who opens the Explorer and
looks at three countries has fetched under 1 MB of data. GitHub Pages allows a
1 GB site, so there is room to spare.

### 9.3 Everything the freeze already knew

The Explorer deployed here is `freeze-2026-08-29` unchanged. Its limitations are
the ones in `FREEZE-REPORT.md` section 9: eleven countries with no climate
estimates, nine countries on the frozen vintage and eight on the current one
that refuse to project, six countries projecting from an older anchor than the
release supports, and the parity claim deliberately not strengthened.

### 9.4 Quarto reproducibility is not fixed, only routed around

Section 3.2 records the measurement. Whether Quarto can be made to bundle
deterministically was not investigated; it belongs on
`docs/post-training-list.md` rather than in a deploy the week of a training.

---

## 10. Pointers

- The workflow: `.github/workflows/companion-guide.yml`
- The gate PR: https://github.com/Teal-Insights/QCraft-App/pull/67
- The build inputs: https://github.com/Teal-Insights/QCraft-App/releases/tag/freeze-2026-08-29
- The state of the code at the tag: `FREEZE-REPORT.md`
- What was deferred before this lane: `docs/post-training-list.md`
- The trail: TEA-1400
