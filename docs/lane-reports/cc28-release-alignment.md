# CC-28: release alignment. The book describes the CC-26 Explorer, and one coherent release is staged

**Issues:** TEA-948 (course), TEA-1400 (Explorer) · **Date:** 2026-09-03 ·
**Course branch:** `feat/course-accuracy`, draft PR
[#79](https://github.com/Teal-Insights/QCraft-App/pull/79), commit `559ee53` ·
**Deploy branch:** `ci/course-guide-root`, draft PR
[#80](https://github.com/Teal-Insights/QCraft-App/pull/80), commit `3c4507b` ·
**Explorer branch:** `feat/accuracy-pass`, draft PR
[#81](https://github.com/Teal-Insights/QCraft-App/pull/81), tip `fdcdbfe` (see section 9) ·
**Spec:** `cc-prompts/CC-28-release-alignment.md`; audit section 1.6; the CC-26 and
CC-27 lane reports.

Follows CC-26 (PR #81) and CC-27 (PRs #79, #80). The render in release
`site-2026-09-02` said the Explorer holds the Turning Point at 15 and the real rate
at 1.0, and its six Explorer screenshots still carried the old legend and the old
badge. All of that is now false on `feat/accuracy-pass`, so the book was brought up
to the Explorer as built, re-rendered, and cut as `site-2026-09-03`; the root pin
moved; the Explorer got its one permitted edit and its freeze pin. Nothing was
tagged, merged or dispatched. Section 6 is the sequence for Teal, one check per
step.

---

## 1. Bottom line

| | |
| --- | --- |
| Sentences changed in the book | 27 edits in eight `.qmd` files: 4 flips, 21 control-count and grouping corrections, the workbook-only list, the screenshot provenance line (section 2) |
| Explorer screenshots | all six re-shot against `feat/accuracy-pass` at `32e0b0e`; captions regenerated; the controls exhibit redrawn; the last `Hot Unadapted` and `Paris-aligned` figure labels gone (section 3) |
| Render | exit 0, 124 pages, publication gate PASS, PDF md5 `08105f35c18b7ae023e670edb225e5ff` = `_book` copy (section 4) |
| Inputs release | `site-2026-09-03` at course commit `559ee53`; archive sha256 `dfc0687a37bef72e348d78bc6fc372615233dc0c5fa356d0b8087ee5dbd4cafe`, downloaded back and matched |
| Root pin | `GUIDE_ROOT_SHA256` `d75ca2699465699a3f5aac228322f1a75dbe5cbd877a4daef804cdc7447e253f`, 63 files (was `5b4cfda2...d618c6`) |
| PR #80 run | [33699244095](https://github.com/Teal-Insights/QCraft-App/actions/runs/33699244095): success, archive verified, bundle pin matched, root pin matched, whole-site check passed |
| Explorer edit | the Methodology tab lists the six in the guide's order; commit `32e0b0e`, pinned by `tests/methodologyOrder.test.ts`; legends unchanged |
| Battery on the tip | pytest 266, ruff, pyright 0, TS engine 134, web 338, typecheck, lint, build clean, seven tabs with zero console errors (section 5); re-run at `381c04b`: web 341, freeze-check PASS (section 9) |
| Bundle pin for `freeze-2026-09-03` | `1e79547cb1972e47c83e6ec452447d20d445391a4cadf4f9c0b1819416a51b6d` at `381c04b`, byte-stable across two builds, confirmed at the final tip `fdcdbfe`; supersedes `6ef4632097e15e5c5ad1561bee6b43ba1e93fc0ad8056b0f94908008a7df6c57` (section 9) |
| Gates for Teal | merge #79 and #80; tag and pin PR; dispatch; post-deploy checks (section 6) |

---

## 2. The sentence-by-sentence flips

Line numbers are the book before this lane (the CC-27 render). "Named the control"
means the sentence now says where the value lives in the Explorer, as the kickoff
asked: the real rate under the interest-rate approach when Real is chosen, the
Turning Point as a field under productivity that names the halfway year.

### 2.1 The two values CC-26 made settable

| Where | Was | Now |
| --- | --- | --- |
| `m1:142` | "the workbook lets you move it ... and the Explorer holds it at 15" | "sits 15 years into the projection by default; the workbook lets you move it ..., and so does the Explorer, in the productivity turning point field beneath the two productivity rates, which names the halfway year as you set it" |
| `m2:169` | "the workbook lets you move it ... and the Explorer holds it at 15" | "by default ...; the workbook lets you move it ..., and the Explorer's productivity turning point field does the same and names the halfway year beneath it" |
| `m2:218` | "The Explorer holds that rate at 1.0 percent; the workbook's Dashboard cell C29 lets you set it." | "The workbook's Dashboard cell C29 sets that rate. In the Explorer, choosing the Real interest rate approach reveals a long-run real interest rate field beneath it, 1.0 percent by default." |
| `m2:222` | "the Explorer's fixed 1.0 percent real rate" | "the Explorer's default 1.0 percent real rate" |

The grep the kickoff asked for (`holds it at`, `fixes it`, `fixed at`, `1.0 percent`,
`Turning Point`, `real rate`) found nothing else that claimed a fixed value. The
sentences left alone, because they are still true of `feat/accuracy-pass`: the OECD
realism check "shown on the workbook's Productivity sheet and not yet in the
Explorer" (`m1:142`), the Discrete Risks sentences (`index:44`, `m4:161`, `m5:19,52`,
`appendix-workbook:67`), and the own-data sentences (`m1:228`, `m2:207`, `m4:140`).

### 2.2 The control count follows the Explorer's registry

CC-26 registered two parameters, so `content/params.ts` now holds twelve keys, the
sidebar shows twelve labelled fields (eleven at the defaults, since the real rate
appears only under the Real approach) and the export annex prints twelve rows. The
book counted ten in 21 places. Every one now counts twelve, with the visibility
qualifier stated once where the count is first made:

| Where | Change |
| --- | --- |
| `m1:111` | "twelve sidebar controls, country selection included"; new sentence: "Eleven are on screen at the defaults; the twelfth, the long-run real interest rate, appears when the interest-rate approach is set to Real." |
| `m2:122`, `m2:238` (twice), `m2:411`, `m2:423` | "eleven of the twelve controls", "The twelfth control, expenditure rigidity", "eleven controls you set", "the sidebar's twelve controls" |
| `m3:4`, `m3:15`, `m3:27` (heading, anchor unchanged), `m3:46` (twice), `m3:48` | "twelve controls"; "Five of the twelve"; "The other seven"; "all twelve parameters" |
| `m3:40` | the structural sentence now lists the productivity path as start, long run and the turning point between them; the interest-rate approach "and, when that approach is set to Real, the long-run real interest rate it holds"; Fiscal policy holds the target and the rule; "Under **Climate scenarios** sits expenditure rigidity", which is where CC-26 moved it |
| `m3:265` | "The seven remaining controls"; productivity "also takes the turning point between them, 15 years by default"; "choose the real rate rule and the long-run real interest rate it holds appears beneath it, 1.0 percent by default"; "All seven" |
| `m4:94`, `m4:239` | "Every control under Growth assumptions stays at its Explorer default" (count dropped, since six or seven are visible depending on the approach); "all twelve parameters" |
| `m6:30`, `m6:128` | "all twelve settings" |
| `index:22` | "Seven of the twelve controls, the growth assumptions and the interest-rate approach, are still at their Explorer defaults" |
| `appendix-codesign:33` | "context panels sit beside ten of the twelve controls" (`PANEL_PARAMS` covers ten; country and the fiscal rule open a note); "records all twelve settings" |

One thing checked and left: the book's "CHANGED badge" (`m3:48`,
`appendix-codesign:33`). The tag's text is "Changed" and the stylesheet renders it
uppercase, so the reader sees CHANGED.

### 2.3 The workbook-only list

`appendix-workbook:74` is the book's one list of what the workbook offers that the
Explorer does not. It never named the two settable items, so nothing was dropped;
it named two of the three true ones and now names all three: own data in the blue
cells, the Discrete Risks sheet, and the Productivity sheet's level relative to the
OECD (User Guide section II.B). One sentence added: "Two inputs the Explorer once
held fixed, the long-run real rate (Dashboard C29) and the productivity turning
point (Productivity sheet), are now fields in both." The Explorer's own list on
About the data (`ABOUT.workbookOnly`) carries the same three, by construction.

### 2.4 Where the book quotes the app

`index:156` said the preface's pair of screenshots "comes from the live deployment";
it now says "from the Explorer build this edition describes", because the live
deployment still shows the old legend until the dispatch. The badge is not quoted in
the book (the parity claim at `m1:333` and `index:67` is the gated wording, not the
badge). "Explorer default" was already throughout. The data banner sentence at
`m1:42` was checked against `MODES.current` ("WEO April 2026 + UN WPP 2024 | Latest
data. WEO April 2026 and UN population projections 2024.") and stands.

---

## 3. Screenshots and figures

### 3.1 The six Explorer captures

All six were captured on 28 and 30 August from `freeze-2026-08-29` and the live
site, and every one showed the old legend ("Paris-Aligned (1.5°C)", "Moderate (2°C)",
"High (4°C+)", "Hot + Adapted", "Hot (3°C)", "Hot + Unadapted"), the old chart lede
("separate damage pathways ... three 3°C scenarios") and, in the preface pair, the
old Verified badge ("Matches the official IMF Excel workbook"). Two captions and
three composed-image notes said "Hot Unadapted".

Re-shot against a local `vite preview` of `feat/accuracy-pass` at `32e0b0e`
(`QCRAFT_APP_URL=http://localhost:4626/`), with the script's number-to-label check
intact: every callout number is still looked up in the app's own rendered text, and
Uganda's 47.0% baseline, 126.8% Hot unadapted, 80-point gap, 972 and 915 index
readings and Kenya's 2035 to 2045 deficit window all matched, so `app-facts.json`
did not move (the Explorer defaults are unchanged and the rule fix touches only the
target-0 and floor edges).

| File | Now shows |
| --- | --- |
| `m1-analysis-gap.png` (and `-ruleoff`) | legend Baseline, Paris, Moderate, High, Hot adapted, Hot, Hot unadapted; lede "one family, ordered by adaptation speed"; callout "Hot unadapted, 126.8%" |
| `m2-baseline-reconciliation.png` | Kenya, unchanged numbers |
| `m3-rigidity-compare.png` (and `-ruleoff`) | the two fans at rigidity 1.0 and 0.0, new legend |
| `m4-baseline.png` (and `-ruleoff`) | the Baseline tab; note names the build |
| `m4-climate-index.png` (and `-ruleoff`) | "Hot unadapted 915" |
| `explorer-analysis.png` (preface pair) | the sidebar with "Productivity turning point (years) 15, Convergence is halfway in 2044"; the badge "Teal Insights verified baseline parity for 147 of 147 tested countries; climate-scenario parity confirmed for ratio metrics only. Reproduces the IMF Excel workbook."; headline card "Hot unadapted" |

The composed-image note now names its source through `QCRAFT_BUILD_LABEL`
("Captured from the Explorer at feat/accuracy-pass 32e0b0e, the freeze-2026-09-03
candidate"). `scripts/build_app_screenshots.py` and
`scripts/capture_both_ways_shots.py` carry the label changes, so a rebuild
reproduces the captions.

### 3.2 The figures the generators draw

| Fragment | Change |
| --- | --- |
| `_m3-controls` | "One control loads the data. Eleven shape the projection."; the productivity chip reads "start, long-run and turning point fields, 5.0 to 1.2"; the interest chip "three rate rules; Real adds its long-run real rate"; a Climate scenarios group caption above expenditure rigidity, mirroring the sidebar; the source line "twelve controls in eight rows ..." over three lines. The committed fragment also still carried a stale "ENGINE DEFAULTS" caption that the script had already changed; regenerating cleared it |
| `_m4-fan-readings` | the endpoint label "Hot Unadapted 127" is "Hot unadapted 127" |
| the eleven `_course-map-*` | "The controls you set: twelve, in the sidebar"; "Warming scenarios: six, from Paris to Hot unadapted" (was "Paris-aligned to hot") |
| `_preface-elevator` | "Paris to Hot unadapted" |

Regeneration check: `build_course_map.py`, `build_preface_figures.py`,
`build_exhibits.py` and `rasterise_figures.py` were run in full. 40 text files
changed (fragments, SVGs, print SVGs); applying the four string substitutions above
to the committed versions reproduces 38 of them byte for byte, and the other two are
`_m3-controls.qmd` and `m3-controls.svg`, whose layout changed. Only PNGs whose SVG
changed were rewritten, so the rasteriser is deterministic on this machine.

---

## 4. The render check

Rendered with `quarto render docs/companion-guide` at Quarto 1.8.27, `QUARTO_CHROMIUM`
pointed at Playwright's Chrome for Testing (the documented workaround for the mermaid
hang). Two minutes, no hang.

| Check | Result |
| --- | --- |
| Render | exit 0, HTML and PDF, no warnings |
| Page count | 124, unchanged from CC-27 |
| md5 mirror | `docs/companion-guide/Q-CRAFT-Explorer-Companion-Guide.pdf` and `_book/...pdf` both `08105f35c18b7ae023e670edb225e5ff` |
| Publication gate | PASS: no authoring-only content in the public build; DRAFT FOR TEAL 23 in source, 46 rendered |
| Search index | cleaned by `clean_search_index.py` |
| Em-dashes | zero in the twelve `.qmd` files and the figure fragments. Four in the rendered HTML, two each in `appendix-workbook.html` and `appendix-codesign.html`: Quarto's own appendix title separator ("Appendix A [dash] Appendix A. Running the official workbook") in the page title and breadcrumb, identical in the `site-2026-09-02` render, not from the source |
| `°C)`, `Paris-Aligned`, `Paris-aligned`, `Hot + `, `Hot Unadapted`, `Hot Adapted` | zero in the rendered HTML |
| `Engine default`, `shinyapps` | zero |
| `holds it at`, `holds that rate`, `ten controls`, `ten parameters`, `ten settings` | zero |
| Skim test | "productivity turning point field" on Module 1 and Module 2; "long-run real interest rate field" on Module 2 and Module 3; "twelve controls" on Module 3 and Appendix B; "ten of the twelve" on Appendix B; "Hot unadapted" on nine pages; the six names read in the new legends on every screenshot page |

---

## 5. The Explorer side

### 5.1 The one permitted edit: Methodology order

Commit `32e0b0e` on `feat/accuracy-pass`. `content/scenarios.ts` gains
`SCENARIO_GUIDE_ORDER` (Paris, Moderate, High, Hot, Hot adapted, Hot unadapted, the
order sections II.C and IV.B present them) and `MethodologyTab.tsx` maps over it for
the definitions list, with the lede "in the order the guide gives them".
`SCENARIO_DISPLAY_ORDER` (the Hot family by adaptation speed) is untouched, so every
legend, chart and the Climate lede keep the adaptation ordering.
`tests/methodologyOrder.test.ts` pins both orders and renders the tab to check the
list. Written first, failing; then the change; then green.

### 5.2 The battery on the tip

Run on `32e0b0e` (and the docs commits after it change nothing the tests see):

| Check | Result |
| --- | --- |
| `uv run pytest packages/qcraft-engine/tests` | 266 passed |
| `uv run ruff check .` | clean |
| `uv run pyright packages/qcraft-engine/` | 0 errors, 0 warnings |
| TS engine `vitest`, typecheck, lint | 134 passed, clean, clean |
| Web `vitest` | 338 passed (335 + the 3 order tests) |
| Web typecheck, lint, build | clean |
| Seven tabs (`scripts/screenshot.mjs`) | zero console errors; the PNGs refreshed into `docs/screenshots/cc26/` (Methodology now shows the guide order) |
| `scripts/freeze-check.sh` | at `32e0b0e` the copy half failed on gate 1 (the Verified badge) and gate 4 (the zero-climate body), which still pinned the 2026-08-27 wording CC-26 replaced under decisions 1.5. Teal re-pinned both in `f625e0b`; PASS at `381c04b` (section 9) |

### 5.3 The bundle pin

The workflow's own method: sha256 of the sorted per-file sha256 manifest of
`apps/qcraft-web/dist` with `data/` excluded, built with
`VITE_BASE_PATH=/QCraft-App/explorer/` on Node 25.9.0.

```
EXPLORER_DIST_SHA256: 1e79547cb1972e47c83e6ec452447d20d445391a4cadf4f9c0b1819416a51b6d   # freeze-2026-09-03
```

This is the second value of the day. The first, `6ef4632097e15e5c5ad1561bee6b43ba1e93fc0ad8056b0f94908008a7df6c57`,
was computed at `32e0b0e` and superseded when `b34668c` changed two chart-pack strings
(section 9). The two side by side:

| Pin | At | Status |
| --- | --- | --- |
| `6ef4632097e15e5c5ad1561bee6b43ba1e93fc0ad8056b0f94908008a7df6c57` | `32e0b0e` | superseded |
| `1e79547cb1972e47c83e6ec452447d20d445391a4cadf4f9c0b1819416a51b6d` | `381c04b`, confirmed at `fdcdbfe` | current |

- 32 files, the same count as every freeze since `freeze-2026-08-29`.
- Byte-stable: two consecutive builds at `381c04b` produced identical manifests, and
  a third build at the final tip `fdcdbfe` (one documentation commit later) produced
  the same hash.
- Method checked the way #69 and #74 did: a fresh worktree at `freeze-2026-08-29c`,
  `npm ci`, the same payloads, the same base path and Node, reproduced the outgoing
  pin `d44c5c1a5e2d6531a918c86cb936490c89e37d9b3cc6cdfb02ea2a454c994bea` exactly.

The one-line instruction is in `docs/lane-reports/cc26-accuracy-lane.md` on
`feat/accuracy-pass` under "Pin instruction for the next freeze".

### 5.4 The release and PR #80

`site-2026-09-03` was built the way `site-2026-09-02` was: `guide/` from the fresh
`_book` (63 files, `.DS_Store` removed), `payloads/` copied from the
`freeze-2026-08-29` archive after re-verifying them against that archive's
`SHA256SUMS`, then `SHA256SUMS` and `MANIFEST.md` written and the tarball made with
`COPYFILE_DISABLE=1 tar --no-xattrs`. Verified the way the runner verifies: extracted
to a clean directory, `SHA256SUMS` passes for 413 files, 175 + 175 payloads, no
AppleDouble entries, zero `shinyapps.io` in `guide/`. Uploaded as a prerelease
tagged at the course commit `559ee53`, downloaded back, sha256 matched.

Against the `site-2026-09-02` root: the same 63 file names, 45 identical, 18 differ
(the PDF, `search.json`, the six screenshots, and ten pages: the preface, Modules 0
to 6 and both appendices; Module 0 changed only through its course-map figure and
the date). Per-file manifest: `cc28-root-manifests/new-root-2026-09-03.sha256`
beside this report; its sha256 is the pin.

PR #80, commit `3c4507b`, moves `inputs_release` (both defaults), `INPUTS_SHA256`
and `GUIDE_ROOT_SHA256`; `GUIDE_FILE_COUNT` stays 63; `app_ref` keeps
`freeze-2026-08-29c` until the pin PR moves it, which is why the PR run is green on
its own. `DEPLOY-REPORT.md` records the paired dispatch and the superseded values.
The pull-request run, from its log:

```
app ref:        freeze-2026-08-29c
inputs release: site-2026-09-03
guide files:   63
payload files: 350
expected d44c5c1a5e2d6531a918c86cb936490c89e37d9b3cc6cdfb02ea2a454c994bea   (Explorer bundle)
actual   d44c5c1a5e2d6531a918c86cb936490c89e37d9b3cc6cdfb02ea2a454c994bea
expected d75ca2699465699a3f5aac228322f1a75dbe5cbd877a4daef804cdc7447e253f   (guide root)
actual   d75ca2699465699a3f5aac228322f1a75dbe5cbd877a4daef804cdc7447e253f
guide root: 19 identical, 44 not                                             (live comparison, informational on a PR)
assembled tree is complete
```

---

## 6. The command sequence for Teal

Every step has a check. Run them in order; nothing after step 2 works before it.

### Step 1. Merge #79 (the course branch)

```bash
gh pr ready 79 --repo Teal-Insights/QCraft-App
gh pr merge 79 --repo Teal-Insights/QCraft-App --merge
```

Any merge method is fine: the release tag `site-2026-09-03` points at `559ee53` on
the branch and keeps it reachable. Check:

```bash
gh pr view 79 --repo Teal-Insights/QCraft-App --json state,mergedAt
```

### Step 2. Merge #80 (the root pin, into `main`)

```bash
gh pr ready 80 --repo Teal-Insights/QCraft-App
gh pr merge 80 --repo Teal-Insights/QCraft-App --squash
```

Check that `main` now carries the new pins:

```bash
git -C ~/GitHub/QCraft-App fetch -q origin main
git -C ~/GitHub/QCraft-App show origin/main:.github/workflows/companion-guide.yml \
  | grep -E "site-2026-09-0|INPUTS_SHA256:|GUIDE_ROOT_SHA256:|EXPLORER_DIST_SHA256:"
```

Expected: `site-2026-09-03` twice, `INPUTS_SHA256: dfc0687a...`,
`GUIDE_ROOT_SHA256: d75ca269...`, and `EXPLORER_DIST_SHA256: d44c5c1a...` still
(the pin PR moves it next).

### Step 3. Tag the Explorer

```bash
git -C ~/GitHub/QCraft-App-cc26 tag freeze-2026-09-03 fdcdbfe2164ced3baab8e2a5910857dd85750477
git -C ~/GitHub/QCraft-App-cc26 push origin freeze-2026-09-03
```

Check that the tag on GitHub names that commit:

```bash
gh api repos/Teal-Insights/QCraft-App/git/ref/tags/freeze-2026-09-03 --jq .object.sha
```

Merging #81 into `feat/hcd-microfixes` is bookkeeping, not a dependency: the deploy
reads the tag.

### Step 4. The pin PR

```bash
cd ~/GitHub/QCraft-App && git fetch -q origin
git worktree add ~/GitHub/QCraft-App-pin -b ci/pin-freeze-2026-09-03 origin/main
cd ~/GitHub/QCraft-App-pin
python3 - <<'PY'
from pathlib import Path
p = Path('.github/workflows/companion-guide.yml'); s = p.read_text()
for old, new in [
    ("default: 'freeze-2026-08-29c'", "default: 'freeze-2026-09-03'"),
    ("inputs.app_ref || 'freeze-2026-08-29c'", "inputs.app_ref || 'freeze-2026-09-03'"),
    ("EXPLORER_DIST_SHA256: d44c5c1a5e2d6531a918c86cb936490c89e37d9b3cc6cdfb02ea2a454c994bea",
     "EXPLORER_DIST_SHA256: 1e79547cb1972e47c83e6ec452447d20d445391a4cadf4f9c0b1819416a51b6d"),
]:
    assert s.count(old) == 1, old
    s = s.replace(old, new)
p.write_text(s)
PY
git diff --stat
git commit -am "ci: pin the Explorer bundle to freeze-2026-09-03"
git push -u origin ci/pin-freeze-2026-09-03
gh pr create --repo Teal-Insights/QCraft-App --base main \
  --title "ci: pin the Explorer bundle to freeze-2026-09-03" \
  --body "app_ref default and EXPLORER_DIST_SHA256 move together to freeze-2026-09-03 (1e79547c...1b6d), the CC-26 accuracy pass with the CC-28 Methodology order. Pin computed byte-stable across two builds; method reproduces the outgoing d44c5c1a...94bea at freeze-2026-08-29c. Battery and evidence: docs/lane-reports/cc26-accuracy-lane.md on feat/accuracy-pass and docs/lane-reports/cc28-release-alignment.md on feat/course-accuracy."
```

`git diff --stat` must show one file, three lines. Check the pull-request run: it
builds `freeze-2026-09-03` against the new pin and the `site-2026-09-03` root.

```bash
gh pr checks --repo Teal-Insights/QCraft-App --watch
gh run list --repo Teal-Insights/QCraft-App --workflow=companion-guide.yml --branch ci/pin-freeze-2026-09-03 --limit 1 --json databaseId,conclusion
gh run view <run-id> --repo Teal-Insights/QCraft-App --log 2>/dev/null | grep -E "Z (expected|actual|assembled tree)"
```

Expected: `expected 1e79547c...` and `actual 1e79547c...` (the bundle), `expected
d75ca269...` and `actual d75ca269...` (the root), `assembled tree is complete`. Then:

```bash
gh pr merge --repo Teal-Insights/QCraft-App --squash
```

### Step 5. Dispatch

```bash
gh workflow run "Site" --repo Teal-Insights/QCraft-App --ref main \
  -f app_ref=freeze-2026-09-03 \
  -f inputs_release=site-2026-09-03 \
  -f verify_guide_against_live=false
gh run list --repo Teal-Insights/QCraft-App --workflow=companion-guide.yml --limit 1 --json databaseId,event,status
gh run watch <run-id> --repo Teal-Insights/QCraft-App --exit-status
```

Check: the run ends `success` with both jobs, `build` and `deploy`. The Pages
deployment id is in the deploy job's log:

```bash
gh run view <run-id> --repo Teal-Insights/QCraft-App --log 2>/dev/null | grep -i "deployment" | head -3
```

### Step 6. Post-deploy

The thirteen URLs of `DEPLOY-REPORT.md` section 7.1 plus the eleven course pages,
every one 200, and `/explorer` without the slash 301:

```bash
BASE=https://teal-insights.github.io/QCraft-App
for p in / /index.html /part2-using.html /Q-CRAFT-Explorer-Companion-Guide.pdf \
         /explorer/ /explorer/index.html /explorer/widgets/debt-dynamics/ \
         /explorer/widgets/growth/ /explorer/widgets/climate-channel/ \
         /explorer/data/weo-2024-10/UGA.json /explorer/data/weo-2026-04/UGA.json \
         /explorer/data/weo-2024-10/MDV.json /explorer/data/weo-2024-10/SYR.json \
         /m0-start-here.html /m1-how-qcraft-thinks.html /m2-debt-equation.html \
         /m3-parameters.html /m4-worked-example.html /m5-boundaries.html \
         /m6-capstone.html /appendix-workbook.html /appendix-codesign.html \
         /glossary.html /references.html; do
  printf '%s  %s\n' "$(curl -sS -o /dev/null -w '%{http_code}' "$BASE$p")" "$p"
done
curl -sS -o /dev/null -w '%{http_code}  /explorer (no slash)\n' "$BASE/explorer"
```

Expected: 24 lines of `200`, then `301`. Pages can take a minute or two to serve the
new tree; rerun if the root pages still answer with the March guide.

The root manifest against the pin, expecting no `DIFF` line and the aggregate
`d75ca269...`:

```bash
rm -rf /tmp/qcraft-0903 && mkdir -p /tmp/qcraft-0903
gh release download site-2026-09-03 --repo Teal-Insights/QCraft-App --pattern 'site-inputs-*.tar.gz' --dir /tmp/qcraft-0903
tar -xzf /tmp/qcraft-0903/site-inputs-*.tar.gz -C /tmp/qcraft-0903
cd /tmp/qcraft-0903/guide
find . -type f | sed 's|^\./||' | LC_ALL=C sort | while read -r f; do
  curl -sS -o /tmp/live.bin "https://teal-insights.github.io/QCraft-App/$f"
  [ "$(shasum -a 256 "$f" | cut -d' ' -f1)" = "$(shasum -a 256 /tmp/live.bin | cut -d' ' -f1)" ] || echo "DIFF $f"
done; echo "root manifest checked"
find . -type f | sed 's|^\./||' | LC_ALL=C sort | xargs -I{} shasum -a 256 {} | shasum -a 256 | cut -d' ' -f1
```

`/explorer/` shows the six names and the two new controls (the strings are literals
in the bundle):

```bash
JS=$(curl -sS "$BASE/explorer/" | grep -o '/QCraft-App/explorer/assets/explorer-[^"]*\.js' | head -1)
curl -sS "https://teal-insights.github.io$JS" \
  | grep -o 'Hot unadapted\|Hot adapted\|Productivity turning point\|Long-run real interest rate\|Teal Insights verified baseline parity' | sort | uniq -c
curl -sS "https://teal-insights.github.io$JS" | grep -c 'Paris-Aligned\|Hot + \|Engine default'
```

Expected: all five strings present, and `0` on the second line. The seven-tab
screenshot sweep against the live URL, expecting `no console errors` and exit 0,
then a look at `Methodology.png` (guide order) and `Analysis.png` (the legend):

```bash
cd ~/GitHub/QCraft-App-cc26/apps/qcraft-web
QCRAFT_PREVIEW_URL=https://teal-insights.github.io/QCraft-App/explorer/ node scripts/screenshot.mjs /tmp/qcraft-live-shots
```

Then `DEPLOY-REPORT.md`: fill the pending row of the CC-27 section's table (run id,
Pages deployment id, when) on a `docs/` branch off `main`, the way #75 did for
`freeze-2026-08-29c`.

---

## 7. Outside this lane's remit, for Teal

- **Resolved the same day (section 9).** `scripts/freeze-check.sh` was re-pinned by
  Teal in `f625e0b` and passes; the chart pack's "lists all ten" became the registry
  count in `b34668c`, and `381c04b` pins it there in the test.
- **Quarto's appendix title separator** is the only em-dash source in the rendered
  book (four occurrences, pre-dating this lane). Fixable in `_quarto.yml` with a
  `crossref`/language override if the rule is meant to reach page titles.
- **Unchanged from CC-27:** the shinyapps redeploy of the banner needs the rsconnect
  token (CC-27 report, section 5.2); the deployed Explorer's `guidance.ts` links
  keep resolving through the three stubs (section 5.3).

---

## 8. Linear and pointers

- TEA-948: claim and done comments marked `_packet: cc28-claim-tea-948_` and
  `_packet: cc28-done-tea-948_`; In Review proposed in the done comment, since the
  packet writer does not move state.
- TEA-1400: claim and gate comments marked `_packet: cc28-claim-tea-1400_` and
  `_packet: cc28-gate-tea-1400_`; already In Review.
- Kickoff: `cc-prompts/CC-28-release-alignment.md`. Audit section 1.6.
- Course: PR #79, `feat/course-accuracy` at `559ee53` (this report follows it).
- Deploy: PR #80, `ci/course-guide-root` at `3c4507b`; run 33699244095.
- Explorer: PR #81, `feat/accuracy-pass` at `fdcdbfe`; the pin instruction in
  `docs/lane-reports/cc26-accuracy-lane.md`.
- Release: https://github.com/Teal-Insights/QCraft-App/releases/tag/site-2026-09-03

---

## 9. Addendum, 2026-09-03 afternoon: the chart-pack count, and the pin that moved with it

Teal's follow-up: the exported chart pack still said the report "lists all ten", two
strings in an IMF-facing export, with twelve parameters registered. A Block 2 accuracy
fix, one Explorer edit permitted.

### 9.1 What was already on the branch

Two commits under Teal's identity landed on `feat/accuracy-pass` before this follow-up
started:

- `b34668c` (09:58): both strings read `lists all ${rows.length}`, where the rows come
  from `manifestRows`, which maps `PARAM_FIELDS`, so a thirteenth registered parameter
  keeps the sentence true. The comment above the function says "lists every parameter".
  The test it added pinned a literal 12.
- `f625e0b` (12:10): `scripts/freeze-check.sh` gates 1 and 4 re-pinned to the decided
  badge and zero-climate wording.

### 9.2 This lane's commit, `381c04b`

- `tests/packet.test.ts`: the registry test now reads `PARAM_FIELDS.length` instead of
  12, covers both branches of the lede (a changed run: "1 of N parameters ... lists all
  N either way"; an all-defaults run: "The exported report lists all N."), rejects
  `lists all ten` or `lists all 10`, and checks the manifest prints one row per
  registered parameter. Proof it bites: with the pre-fix `chartPack.ts` from `4beabb2`
  swapped in, both count assertions fail on "lists all ten"; restored, all three pass.
- Three comments that still counted ten, none user-facing: `src/export/reportStyles.ts`
  (the print stylesheet, "the annex table is ten rows"), `src/styles/app.css` (the
  sidebar tag rationale, "ten loud tags", which also said "engine default"), and the
  `Sidebar.tsx` header ("adds the five that were previously fixed"). Each now defers to
  the registry or names twelve as of 0.3.0.

### 9.3 The grep, every hit and its disposition

`apps/qcraft-web/src` and `apps/qcraft-web/widgets`, number words and digits beside
parameter, control, setting, field or row, comments included:

| Hit | Text | Disposition |
| --- | --- | --- |
| `src/export/chartPack.ts:247,249` | "lists all ten" (two strings) | fixed in `b34668c` (`${rows.length}`, registry-derived); pinned by the extended test in `381c04b` |
| `src/components/tabs/ExportTab.tsx:277-279` | "N of `rows.length` parameters ... lists all `rows.length`" | already dynamic; correct |
| `src/components/Sidebar.tsx:499` | "N of `Object.keys(defaults).length` parameters changed" | dynamic; correct |
| `src/export/reportHtml.ts:357-391` | the annex rows from `manifestRows`, no count word | correct |
| `src/export/reportStyles.ts:188` | comment "The annex table is ten rows" | stale; fixed in `381c04b` |
| `src/styles/app.css:756` | comment "ten loud tags down a sidebar" | stale; fixed in `381c04b` (count-free, "Explorer default") |
| `src/components/Sidebar.tsx:4-7` | comment "five controls ... adds the five" | stale; fixed in `381c04b` ("adds the seven", registry named as the count) |
| `src/components/context/InterestRatePanel.tsx:35` | "nine countries in ten" | a statistic about the rate-growth differential, not a parameter count; stands |
| `src/widgets/shell/WidgetFrame.tsx:8` | "four rows of a document" | widget layout; stands |
| `src/widgets/models/debtPath.ts:149` | "growth of 10% against an 8% interest rate" | values, not counts; stands |
| `widgets/*/index.html` | no hits | |

### 9.4 Battery at `381c04b`

| Check | Result |
| --- | --- |
| Web `vitest` | 341 passed (338 + the three registry tests, replacing the one literal test) |
| Web typecheck, lint, build | clean |
| Seven tabs (`scripts/screenshot.mjs`) | zero console errors; refreshed into `docs/screenshots/cc26/` |
| `scripts/freeze-check.sh` | PASS, on the sub-path build |
| Engines | unchanged since section 5.2 (no engine file touched by `b34668c`, `f625e0b` or `381c04b`) |

### 9.5 The pin moved, and the tip

`b34668c` changed two strings in the bundle, so the morning's pin no longer names the
bundle the tag will build. Recomputed the same way (sub-path base, Node 25.9.0, 32 files,
two consecutive builds identical), then confirmed at the final tip after the CC-26
report commit:

| | Old | New |
| --- | --- | --- |
| Tip to tag | `4beabb2b8e06db56c6e6f1fd53b61fc3013c7f61` | `fdcdbfe2164ced3baab8e2a5910857dd85750477` |
| Bundle pin | `6ef4632097e15e5c5ad1561bee6b43ba1e93fc0ad8056b0f94908008a7df6c57` | `1e79547cb1972e47c83e6ec452447d20d445391a4cadf4f9c0b1819416a51b6d` |
| Computed at | `32e0b0e` | `381c04b`, identical at `fdcdbfe` |

Section 6 (steps 3 and 4) and the CC-26 report's pin line carry the new values. The
`site-2026-09-03` root and PR #80 are untouched by this addendum.
