# CC-27: the course guide tells the IMF's method exactly, and it replaces the March guide at the site root

**Issues:** TEA-948 (course), TEA-1400 (deployment surface) ·
**Date:** 2026-09-02 · **Course branch:** `feat/course-accuracy` off
`feat/lane4-course`, draft PR [#79](https://github.com/Teal-Insights/QCraft-App/pull/79) ·
**Deploy branch:** `ci/course-guide-root` off `main`, draft PR
[#80](https://github.com/Teal-Insights/QCraft-App/pull/80) ·
**Spec:** the 2026-09-02 audit, sections 1.2 to 1.5 (decisions binding), and
`audit-detail/C2-course-guide.md` (32 findings) with `C-live-root-guide.md`.

Every one of the 32 audited sentences is fixed in the source, the book renders
clean through the publication gate, and everything the root deploy needs is
built, checksummed and verified the way the workflow will verify it. Two things
wait on Teal, both because they need `main` or a credential this machine does
not hold: the merge-and-dispatch that changes the site root, and the
shinyapps.io redeploy of the banner. Section 5 has the exact steps.

---

## 1. Bottom line

| | |
| --- | --- |
| Findings closed in the source | 32 of 32 (section 2); 31 by edit, one by running the gate |
| Scenario names | the User Guide's six, everywhere in the book, the figures and the generator scripts (decision 1.5.1) |
| "Engine default" | "Explorer default" throughout, with the sentence that the workbook ships no considered default (decision 1.5.2) |
| Render | exit 0, 124 pages, gate PASS, committed PDF md5 `fdd37425e732e00c51d9cb5386336afa` = `_book` copy |
| New root | 63 files, aggregate `5b4cfda266e8a3bf42c49045f36b07a494e6f7007674a06884cea3aa93d618c6` |
| Old root | 30 files, aggregate `119222a9d31320fc568569a730cd3e48f5b0bbcc56625ca9798f4cf297b3c64e` |
| Inputs release | `site-2026-09-02`, archive sha256 `88f8bdfc93f4b946ef2551b0d6b103ea5cfacfccd7c771a146e6c3fd336b04e0`, downloaded back and matched |
| Explorer | untouched: `app_ref` `freeze-2026-08-29c`, `EXPLORER_DIST_SHA256` `d44c5c1a...94bea` |
| shinyapps URLs | none in the book; the README's Live App link now points at the Explorer; the Shiny app carries the prototype banner |
| Gates open | merge #80 and dispatch (section 5.1); redeploy the Shiny banner (section 5.2) |

---

## 2. The 32 findings, one line each

Numbers are audit C2 section 5. Line references are to the book before this
lane; "fixed" means the sentence the audit quotes no longer exists in that form
and the replacement was checked against the User Guide line the audit cites.

| # | Sev | Where | Status | What the book now says |
| --- | --- | --- | --- | --- |
| 1 | Blocker | `m1:281-288`, glossary | fixed | Table uses the guide's six names with the guide's descriptions (p. 18); the "workbook's own labels" sentence is gone; no temperature suffix survives anywhere in the book, the figures or the generator scripts. "Hot + Adapted" and "Hot + Unadapted" became "Hot adapted" and "Hot unadapted" throughout (decision 1.5.1) |
| 2 | Major | `m1:207`, `m3:134-188`, `m4:114,132,145`, glossary:22 | fixed | The rule cuts primary expenditure by the fiscal gap when debt is above the target and rising, loosens when below and falling, and otherwise does nothing; the target is a ceiling that is approached, not hit (pp. 29-30). "Steers toward", "converges toward", "cut harder", "staying inside it requires Y" are gone. `m2:199` is now the fuller statement and `m2:192` says "held near" |
| 3 | Major | `index:44`, `m4:160`, `m5:19,52`, `m6:17`, `appendix-workbook:67` | fixed | Natural disasters are excluded from the econometric estimates; the workbook's Discrete Risks sheet adds them per scenario as a percent of GDP (pp. 20-21); the Explorer does not yet. Also at `m2:364` |
| 4 | Major | `m1:228`, `m4:139`, `m2:207` | fixed | Each qualified "in the Explorer"; `m4:139` adds the IMF's recommendation to paste MTFF or DSA figures into the blue cells (pp. 9-10); `m5:25` now names the workbook's own-data route beside Module 3's parameter route |
| 5 | Major | `m1:20,321,329`, glossary:28, `appendix-codesign:29`, `index:67` | fixed | "The Explorer runs a TypeScript port of the Python reference engine; the Python engine is verified against the workbook and the port against the Python engine" |
| 6 | Major | `m4:203,209` | fixed | Fan chart named as Verified mode at the Explorer's default 50 percent target, the same settings as Step 1, so a Step 1 run lands on it; the two workbook cells to set for Excel are named |
| 7 | Major | `m4:62,83-93,143` | fixed | "Data mode: Verified" is the first row of the Step 1 table and the opening instruction; the demography hint is now "check the data mode first: on WEO April 2026 the dip does not appear"; the published table's dip is tied to its vintage |
| 8 | Major | `appendix-workbook:74` | fixed | The two-sided sentence, with the pages for both halves |
| 9 | Minor | `m4:156` | fixed | Workbook view is the default; Briefing view described second |
| 10 | Minor | `m2:218,222` | fixed | "The Explorer holds that rate at 1.0 percent; the workbook's Dashboard cell C29 lets you set it"; Kenya's 4.5 is stated as 1.0 real plus 3.5 inflation |
| 11 | Minor | `m1:142`, `m2:169` | fixed | Turning point 15 years in, the mid-2040s on a 2030 start; adjustable in the workbook (p. 12, footnote 7), fixed in the Explorer; "falls quickly through mid-century" is gone |
| 12 | Minor | `m1:142` | fixed | OECD check "shown on the workbook's Productivity sheet and not yet in the Explorer" |
| 13 | Minor | `m2:128,167` | fixed | Y = A × L with A absorbing capital, skills, technology and institutions (p. 25); the wording note now agrees with the guide instead of correcting it |
| 14 | Minor | `m2:113` | fixed | Cancels out under the constant real rate rule; under the default constant nominal rate higher inflation erodes the ratio |
| 15 | Minor | `m4:90,104` | fixed | Dashboard C24 to 5.0 (ships 3.5) and C34 to 50 (ships 60) named at both places |
| 16 | Minor | `m3:54`, `m1:11` | fixed | "present in the WEO and UN data" |
| 17 | Minor | `m4:280,295` | fixed | Median |
| 18 | Minor | `m2:267` | fixed | Attributed to the paper's abstract, which states the null precipitation result directly |
| 19 | Minor | `m1:264`, `m4:154`, `m5:23`, glossary:4 | fixed | "(Massetti and Tagklis, 2023; Centorrino, Massetti and Tagklis, 2024)", each half linked to its reference entry |
| 20 | Minor | `m4:100` | fixed | "Every scenario sits below the floored baseline, so the chart appears to say any warming beats no warming" |
| 21 | Minor | `m1:329` | fixed | The four fiscal ratios, the interest rate, real growth and nominal GDP, every projection year, baseline; the port checked against the Python engine |
| 22 | Minor | `appendix-codesign:33` | fixed | "eight of the ten controls"; file count dropped |
| 23 | Minor | `m4:47,187` | fixed | The Workbook view of the Analysis tab draws the balances and interest by scenario |
| 24 | Note | `m1:281-288` | fixed | Warming column marked as read from the guide's Table 1 (p. 33), sourced to Arias and others (2021, Cross-Section Box TS.1); the values 0.7, 1.6, 2.5, 3.5 were checked against the PDF page |
| 25 | Note | `m3:211` | fixed | "debt service" replaced by "statutory transfers" |
| 26 | Note | `m3:134` | fixed | "In the workbook, entering 0 switches the rule off" (p. 17), stated of the workbook only, since the deployed Explorer at freeze c treats 0 as a target until CC-26 item 12 lands |
| 27 | Note | `index:53-55` | fixed | The p. 3 sentence quoted verbatim once, in the not-an-IMF-product callout |
| 28 | Note | `m2:11`, `m3:80` | fixed | Kenya cold open names Verified mode (the Module 2 series come from the engine on the workbook's own vintage); `m3:80` says the mode was switched from the default |
| 29 | Note | section 3 item 4 | fixed | `appendix-workbook:74` rebalanced; `m2:128,167` no longer correct the guide; `m1:181` credits the guide's "approximately the sum"; `m5:83` says the guide does not discuss the asymmetry; `appendix-codesign:17,23` made general and explicitly not about the workbook; `index:69` tightened |
| 30 | Note | `m5:19,56` | fixed | Spillovers listed under non-market damages |
| 31 | Note | `m3:142` | fixed | DSF thresholds are in present-value terms and by debt-carrying capacity, so they do not map one to one |
| 32 | Note | authoring callouts | run | `check_publication_safety.py` runs as a post-render step on every render; see section 3 |

### Beyond the 32

Two things the audit's tables note without numbering, done because they fall
under the same rule:

- `m1:11` "present in all its input datasets" carried the same error as
  finding 16 and is fixed the same way.
- `m1:45` and `m4:206` pair the baseline with different scenarios (Hot
  unadapted in the ten-minute run, Hot in the worked case). Left as they are:
  each is right for its own exercise, and the audit marks it internal rather
  than IMF-facing.

One decision made here rather than in the audit: "Hot + Adapted" and "Hot +
Unadapted" became "Hot adapted" and "Hot unadapted", the strings CC-26 is
putting into the app. The audit's fix names only the table and the suffixes,
but a book that keeps the Explorer's old connective while the app drops it
would contradict the running Explorer on the day CC-26 deploys.

### What CC-26 changes under this book

Three sentences describe the deployed Explorer at `freeze-2026-08-29c` and
will be stale the day CC-26 Block 3 ships (real rate and turning point
settable): `m1:142` and `m2:169` ("the Explorer holds it at 15"), and
`m2:218` ("the Explorer holds that rate at 1.0 percent"). CC-26 had not landed
when this render was cut, so they stand as written. The flip is three
sentences to "settable in the Explorer" and one line here.

Likewise, the deployed Explorer still shows the temperature suffixes and
"Engine default" until CC-26 deploys; the book follows the decisions rather
than the freeze, per the kickoff.

---

## 3. The render check

Rendered with `quarto render docs/companion-guide` at Quarto 1.8.27, with
`QUARTO_CHROMIUM` pointed at Playwright's Chrome for Testing. Without that,
the render hung at file 3 of 12 with headless Chrome at zero CPU, the blocker
run 15 wrote down: Teal's own Chrome was open. `docs/course-build.md` now
carries the line above the render commands.

| Check | Result |
| --- | --- |
| Render | exit 0, no warnings, no unresolved cross-references, HTML and PDF |
| Page count | 124 (was 121; the additions run to about three pages) |
| md5 mirror | `docs/companion-guide/Q-CRAFT-Explorer-Companion-Guide.pdf` and `_book/Q-CRAFT-Explorer-Companion-Guide.pdf` both `fdd37425e732e00c51d9cb5386336afa` |
| Publication gate | PASS: no authoring-only content in the public build; DRAFT FOR TEAL 23 in source, 46 rendered (each callout counts twice in HTML) |
| Search index | cleaned by `clean_search_index.py` |
| Em-dashes | zero in the eleven `.qmd` files |
| Scenario suffixes | zero occurrences of `Paris-Aligned`, `°C)` or `Hot + ` in the rendered HTML |
| shinyapps | zero occurrences in the rendered HTML |
| Figures | the three fragments carrying "engine default" (`_m1-ten-minutes`, `_param-inflation`, `_param-productivity`) regenerated as SVG and PNG; the generator scripts changed to match, so a rebuild reproduces them |

Skim test, on the rendered HTML: each of ten new sentences was located on the
page it belongs to (the TypeScript port on the preface and Module 1, the
ceiling wording on Module 1, Module 3 and the glossary, the Discrete Risks
sheet on five pages, the non-endorsement quotation on the preface, Dashboard
C29 on Module 2, the Verified-mode switch and the Workbook-view default on
Module 4, "eight of the ten controls" on Appendix B, Arias and others on
Module 1, "median" on Module 4). The Module 3 debt-target section was read in
full as rendered text.

The three forwarding stubs (`part1-policy.html`, `part2-using.html`,
`part3-codesign.html`) are in `_book`, each with a `meta refresh` to its
default page and a script mapping the twelve old anchors the deployed
Explorer's `guidance.ts` and the Shiny prototype's `constants.py` use.

---

## 4. The deploy, built and verified up to the gate

### 4.1 What the workflow now protects

`.github/workflows/companion-guide.yml` on `ci/course-guide-root`:

- `INPUTS_RELEASE` default and `inputs_release` default move to
  `site-2026-09-02`; `INPUTS_SHA256` moves to the new archive.
- `GUIDE_ROOT_SHA256` pins the root to this render (aggregate sha256 of the
  sorted per-file manifest of `guide/`), checked by a new always-on step. That
  is the "protect the NEW root's hashes" change: the March root's protection
  was the live-site byte comparison, which by construction cannot let the root
  change; the pin protects the new root whatever the live site holds.
- `verify_guide_against_live` keeps its default `true` and its meaning for
  Explorer redeploys. It is `false` for this one dispatch.
- On a pull request the live comparison reports and warns rather than
  failing; the root pin is the merge gate. On a dispatch it refuses as before.
- `app_ref` defaults to `freeze-2026-08-29c`, the tag the bundle pin names.
- `GUIDE_FILE_COUNT` (63) replaces the literal 30 in both places.
- The whole-site check adds the eleven course pages, the three stubs (present
  and carrying `http-equiv="refresh"`), `search.json`, and a refusal if any
  root HTML file contains `shinyapps.io`.

Unchanged: `app_ref` default `freeze-2026-08-29`, `EXPLORER_DIST_SHA256`,
the Explorer build and its bundle check, the sub-path base, the Explorer
whole-site checks.

### 4.2 The archive, verified the way the runner will

Built by a script from `_book` plus the payloads of the `freeze-2026-08-29`
archive (verified against that archive's `SHA256SUMS` before reuse). Then
extracted to a clean directory and checked: `SHA256SUMS` passes for all 413
files; `guide/` holds 63 files; copying `guide/.` into `_site/` and running
the workflow's aggregate pipeline reproduces `5b4cfda2...d618c6`; the
whole-site file tests pass; no AppleDouble entries in the tarball; zero
`shinyapps.io` matches. Uploaded as release `site-2026-09-02` (prerelease,
tagged at the course commit `94d1f49`), downloaded back, sha256 matched.

### 4.3 Root hashes before and after

Per-file manifests: `cc27-root-manifests/old-root-march-2026.sha256` and
`cc27-root-manifests/new-root-2026-09-02.sha256` beside this report; the
aggregates in section 1 are the sha256 of each file's text. The 30 old files
were the March render (`bootstrap-c58f986b...`); the 63 new files are the
course render, its `site_libs`, `figures`, `fonts`, the PDF and the three
stubs.

### 4.4 The PR run

Run [33689116186](https://github.com/Teal-Insights/QCraft-App/actions/runs/33689116186)
on #80, the pull_request event, which builds and verifies and uploads
nothing: success, 17 of 17 steps. The lines that matter, from its log:

```
guide files:   63
payload files: 350
expected d44c5c1a5e2d6531a918c86cb936490c89e37d9b3cc6cdfb02ea2a454c994bea   (Explorer bundle)
actual   d44c5c1a5e2d6531a918c86cb936490c89e37d9b3cc6cdfb02ea2a454c994bea
expected 5b4cfda266e8a3bf42c49045f36b07a494e6f7007674a06884cea3aa93d618c6   (guide root)
actual   5b4cfda266e8a3bf42c49045f36b07a494e6f7007674a06884cea3aa93d618c6
guide root: 19 identical, 44 not                                             (live comparison, informational on a PR)
assembled tree is complete
```

Two runs before it failed for reasons that were in the workflow, not the
inputs, and each produced a one-line fix that is now on the branch:

- The first built the default `app_ref`, `freeze-2026-08-29`, against the
  bundle pinned to `freeze-2026-08-29c` and failed the bundle check, as the
  pin-freeze-b and pin-freeze-c PR runs had before it. The default now names
  the pinned tag.
- The second passed the bundle and root pins and failed the live-site
  comparison, which a pull request cannot pass when the PR exists to change
  the root. That comparison now warns on a pull request and refuses on a
  dispatch.

### 4.5 Deploy evidence

Pending the dispatch (section 5.1). The checks to run after it, in order:

1. Run id and Pages deployment id from `gh run view`.
2. Root manifest against the pin: the section 8 loop from `DEPLOY-REPORT.md`
   against `guide/` of the new archive, expecting zero `DIFF`.
3. The thirteen URLs of `DEPLOY-REPORT.md` section 7.1, with
   `/part2-using.html` still expected to answer 200 (it is a stub now) and the
   eleven course pages added: every one 200, `/explorer` without the slash
   still 301.
4. `/explorer/` byte-identical to before: the live asset names match the
   pinned bundle and Uganda runs in both modes.

---

## 5. Gates

### 5.1 Merge #80 and dispatch (dependency: `main`)

The dispatch reads the workflow from `main`, and the `github-pages`
environment refuses a deploy from any other ref, so the root cannot change
until #80 merges. The pull_request run on #80 builds and verifies the whole
tree and uploads nothing; a green run there is the evidence to merge on.

```bash
gh pr merge 80 --repo Teal-Insights/QCraft-App --squash
gh workflow run "Site" --repo Teal-Insights/QCraft-App --ref main \
  -f app_ref=freeze-2026-08-29c \
  -f inputs_release=site-2026-09-02 \
  -f verify_guide_against_live=false
gh run list --repo Teal-Insights/QCraft-App --workflow=companion-guide.yml --limit 1
```

Cost of deferral: FAD and World Bank readers who open the site root see the
March guide, with its shinyapps links, five parameters and no non-endorsement
line, for as long as it stands.

### 5.2 Redeploy the Shiny prototype (dependency: shinyapps credentials)

`scripts/deploy.sh` expects `~/Library/Python/3.13/bin/rsconnect`, which does
not exist on this machine, and `rsconnect list` (via `uvx --from
rsconnect-python`) reports no saved server. So the banner is committed and not
live. On a machine with the shinyapps account:

```bash
uvx --from rsconnect-python rsconnect add --account tealinsights --name shinyapps --token <token> --secret <secret>
git checkout ci/course-guide-root   # or main once #80 merges
sed -i '' 's|^RSCONNECT=.*|RSCONNECT="uvx --from rsconnect-python rsconnect"|' scripts/deploy.sh
bash scripts/deploy.sh
```

Then open https://tealinsights.shinyapps.io/q-craft_explorer1/ and confirm
the banner reads "This is the March 2026 prototype" above the tabs. The token
and secret come from the shinyapps.io account page (Account, Tokens); they
never enter the repository. Retirement is after Bangkok, per decision 1.5.3.

### 5.3 Not a gate, for the record

The deployed Explorer's `guidance.ts` links into the March page names; the
stubs keep those links working, so `apps/qcraft-web` was not touched. The
repoint to the course pages belongs to the next Explorer freeze.

---

## 6. The freeze-tag pin line

The Explorer bundle did not move, so the line in
`.github/workflows/companion-guide.yml` stays:

```
EXPLORER_DIST_SHA256: d44c5c1a5e2d6531a918c86cb936490c89e37d9b3cc6cdfb02ea2a454c994bea   # freeze-2026-08-29c
```

When CC-26's tag is cut, the pin moves the way `DEPLOY-REPORT.md` section 0.2
describes, and the guide root is untouched by that redeploy because the live
check and the root pin both hold.

---

## 7. Pointers

- Audit: `SHARED/audit-2026-09-02/2026-09-02_QCraft-Explorer-Audit-and-Own-Assumptions-Plan.md`, `audit-detail/C2-course-guide.md`, `audit-detail/C-live-root-guide.md`.
- Kickoff: `cc-prompts/CC-27-course-and-root.md`.
- Course source: `docs/companion-guide/*.qmd` on `feat/course-accuracy`, commit `94d1f49`.
- Deploy branch: `ci/course-guide-root` in `~/GitHub/QCraft-App-cc27`; `DEPLOY-REPORT.md` top section.
- Release: https://github.com/Teal-Insights/QCraft-App/releases/tag/site-2026-09-02
- Linear: TEA-948 and TEA-1400, claim and trail comments marked `_packet: cc27-*_`.
