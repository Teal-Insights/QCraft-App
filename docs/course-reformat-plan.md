# Course reformat and platform plan

**Status:** proposal, awaiting Teal's review. Written by CC-17 (2026-08-30,
trail TEA-948). **Inputs:** `docs/learning-standard-draft.md` v0.1 (the
rubric), `docs/learning-audit-2026-08.md` (the evidence; findings cited as
F-n), recon of tealinsights-site and the lane4-course Quarto build, live
link verification, and determinism measurements. **Rule followed:** no
sunk-cost deference; the plan proposes what the standard implies, and flags
every place a prior Teal decision constrains it.

## 0. The short version

The course's teaching is strong and its platform is nearly right; what the
standard demands is mostly seams, not surgery. The reformat is seven
lane-sized waves, the largest being links-and-glossary and the
figure-typography pass. The platform recommendation is one public Quarto
source with two skins: the open skin on GitHub Pages under /course/, and
the brand skin laid down as pinned bytes inside tealinsights.com under
/sovtech/qcraft/course/, with MathJax self-hosted, the Quarto version
pinned, and the licenses split MIT (code) plus CC BY 4.0 (prose and
original figures). The course stays in QCraft-App until a second guide
exists. The chapeau evidence supports bolding, with one compensating rule.

## 1. The reformat the standard implies

Ordered by wave, each sized for one lane. Findings cited from the audit;
prior decisions named where they bind.

### Wave R1: the micro-fix batch (pre-Tuesday if Teal redlines anyway)

The audit's triage (a): three "only"s (F-2), five URL swaps to the frozen
Explorer (F-4), the date line (F-17), p. 19 (F-36), "spillovers" (F-35),
"deliberately" twice (F-28), "171 economies" (F-58), "five nodes" (F-60),
seven "Wrapper:" deletions (F-27), the appendix retitle (F-18, F-26), four
crossref glosses (F-49), three lines of equation-overflow CSS (F-14), and
the F-1 motive rewording if m5 is being redlined regardless (the
correction is already owed per REFERENCE-NOTES line 50). All are
sentence-scale; none needs a design decision.

### Wave R2: journeys and numbering

- Name the four journeys: a "Four ways to read this" block in the preface
  plus a 30-minute fast-lane callout (F-6, F-56). Prior decision respected:
  "Start at Module 0" stays; the lanes sit beside it.
- Unify the numbering (F-5). Recommendation: adopt the rendered numbering
  as canonical (chapters 1 to 7), rewrite the module table and every
  "Module N" prose mention, and stop branding chapters as modules 0 to 6.
  The alternative (unnumbered chapters carrying "Module N" titles) costs
  Quarto's section numbers and the crossref machinery that 77 references
  ride on. This discards some redesign-doc branding; flagged as Teal's
  call, with the recommendation grounded in what the reader's sidebar
  actually shows.
- m2's fast-path marker (F-19), the route-figure annotation (F-20), path
  rows demoting letter codes (F-23), per-module time lines with the A11
  multiplier convention decided once (F-50, open question 5), capstone
  named on the index (F-43).
- Prior decision honored: the m0 self-assessment and three-path routing
  stay as designed (Course Redesign v0.1). The audit's observation that no
  path is referenced downstream after m0 goes to the pilot: if pilot
  learners ignore paths, simplify then, on evidence.

### Wave R3: glossary and links

The G4/E4 repair as one coherent lane: per-term anchors, alphabetize,
taught-in back-links, roughly twenty first-use links (F-7, F-15, F-57),
the six missing entries plus anchor-year promotion (F-46), the in-context
definitions for SSP, FADCP, C-PIMA, golden master, parity, nominal/real,
concessional (F-8, F-45), pb* hoisted to the visible path (F-9), and the
coinage decision on "climate-fiscal risk premium" (F-47). Search improves
free of charge once term-titled anchors exist (F-48).

### Wave R4: official materials and the genre pack

The G6 repair: an "Official materials" section (preface or its own early
page) carrying the verified packs in section 4 below, the User Guide
hyperlinked at first mention, the Uganda FRS and C-PIMA summary linked
where m4 introduces them (F-11, F-12), the FADCP citation completed with
its posted-successor note (F-31), and the m6 evaluation claim sourced
(F-32). Includes the curation rule (section 4.3) so the pack stays
maintenance-realistic.

### Wave R5: figure typography

The D4=0 repair, entirely inside the build scripts (the audit's protect
rule: never touch the SVGs): course-map label sizes raised and the print
layout served below a width breakpoint (F-21), exhibit type scale raised,
screenshot capture width matched to render width, takeaway headlines added
to the three bare screenshots, the two direct-labeling fixes, and the
mermaid strips either emitted from the exhibit vocabulary or themed to it
(F-51, F-53). One re-render regenerates everything; the byte-identical
regeneration discipline (protect item 2) makes this wave safe to verify.

### Wave R6: mobile

The in-body "On this page" ToC below the lg breakpoint (F-13), the two
table fixes (F-55). Small lane; test with the audit's 375px sweep.

### Wave R7: prose and promise scope

The chapeau decision applied course-wide (section 5), the remaining s2
prose fixes (F-24, F-33, F-34, F-37, F-38, F-44), warm-up answers
collapsed (F-39), the completion-problem check (F-40), provenance
sentences for error content (F-41, F-42), and the three scope decisions
that need Teal first: the both-ways promise (F-3, open question 2), the
capstone rubric un-collapsed at approval (F-10), and the C-PIMA claim
scoped (F-16).

### The PDF self-test question (open question 3)

Collapse-dependent answers render expanded in print, so the PDF edition
spoils every self-check. Recommendation: Quarto conditional content
(`when-format`) moving answers to an end-of-module "Answers" block in the
PDF only, keeping the web's commit-before-opening pattern untouched. One
lane, after the pattern is approved on one module.

## 2. The platform assessment

Designed around the final form, per the charter: the canonical home is
tealinsights.com with the brand skin and licensed fonts; a clearly-licensed
open-source mirror builds completely with open fonts; and the guide's repo
home is decided on evidence.

### 2.1 What any platform must preserve (measured, not assumed)

From the build recon: 2,313 lines of qmd across 11 chapters; 77 `@sec-`
crossrefs against 25 anchors; 99 styled callouts, 33 collapsible; 39
generated include files that are inline-SVG-for-HTML plus PNG-for-PDF
pairs, regenerated byte-identically by five committed scripts; 8 mermaid
diagrams; 13 display equations (MathJax); full-text search (84-entry
index); floating ToC; the 116-page PDF; and the dual-skin font
architecture (open faces bundled with OFL texts; Klim names first in every
stack, files never in the repo, brand CSS swapped in by a Quarto profile).

### 2.2 The constraint map the site recon settled

- The site is Astro 7.0.5 with exactly two dependencies, no framework, no
  content pipeline, no search, no math, no course components. Everything a
  course needs, the site has zero infrastructure for; every current tool is
  hosted off-site and linked from cards.
- The site repo is PRIVATE because git-tracked Klim woff2 files live in
  public/fonts/ (LICENSE-FONTS.md: "If this repo ever needs to go public,
  the fonts move out first"). Any course content committed there is
  invisible to the open mirror by construction.
- Site QA gates bind anything it serves: zero em-dashes in dist HTML, no
  third-party requests except the plausible.io proxy, fonts self-hosted.
  Today's course build violates two (the appendix em-dash, F-18; MathJax
  from cdn.jsdelivr.net, which also quietly breaks the colophon's
  ministry-offline story).
- Determinism, measured on this machine: Astro double-builds
  byte-identical; Quarto 1.8.27's SCSS bundling is not (the CC-9 finding:
  three renders, three bootstrap hashes, same 508,700 bytes and rule
  multiset, ordered differently), and Quarto stamps its version into every
  page. Supersede-not-replace therefore wants pinned, laid-down bytes for
  anything Quarto-rendered, exactly the discipline CC-9 already built for
  the guide root.
- The TEA-894 Netlify 200-proxy idiom exists as a commented stub; nothing
  has ever been proxied. The deploy-preview hazard (Klim served from
  unlicensed netlify.app preview hosts) is documented in the site repo and
  unresolved; it predates this plan and binds whatever the site serves.

### 2.3 Three architectures

**Architecture A (recommended): one public Quarto source, two skins, two
hosts.**

The course source stays public in QCraft-App. Two renders from one source:
the open skin (Inter/IBM Plex, bundled) publishes to GitHub Pages under
`/QCraft-App/course/` (the hub's own TODO already points there); the brand
profile render (Klim CSS, fonts resolved from the site's own /fonts/ path)
is rendered once per release, checksummed, and laid down as static bytes
into tealinsights-site `public/sovtech/qcraft/course/`, the CC-9 lay-down
discipline generalized. The site's QA gates run against the laid-down
bytes before deploy.

Prerequisite fixes, one lane (P1): self-host MathJax in both editions
(kills the CDN call, honors the offline story and the site gate); pin the
Quarto version and record it beside the checksums; fix the appendix
em-dash separator; pin the PDF engine and script the round-trip copy that
today is manual.

Why it wins: every preserved feature in 2.1 works today from this source;
the open mirror is the SAME source that produces the canonical edition, so
mirror drift is impossible; zero new dependencies land on the site (it
serves static files, its discipline intact); the Klim files never meet the
public repo (the brand render happens at deploy time against the private
site's fonts); and the migration is measured in one prerequisite lane plus
one integration lane. Costs, named honestly: the course keeps its
Quarto/Bootstrap look inside a hand-built Astro site (unified only by
brand CSS, not by shared components); Quarto's version stamps and SCSS
non-determinism mean re-renders change bytes, which the lay-down
discipline absorbs but never removes; and the site inherits a second
laid-down artifact to manage.

**Architecture B: Astro-native course inside the site, public content
mirror.**

Rebuild the course as Astro content (collections or MDX) with custom
sidebar/ToC/callout components, pagefind search, build-time math, and
pre-rendered mermaid; content lives in a public repo the private site
consumes at build. Why not now: it adds the very dependency surface the
site's discipline exists to refuse (pagefind, math plugins, MDX);
build-time math on Astro 7's new Saetteri engine rests on a weeks-old
plugin ecosystem; MDX creates one-way lock-in; and the PDF still needs a
separate pipeline, so Quarto stays alive anyway and the house maintains
two renderers for one artifact. The 39 SVG-include figure pairs and 33
collapsible callouts all need bespoke porting. This is the right shape to
revisit when Quarto 2 (a ground-up rewrite, in development) forces a
migration decision anyway, or when guide #2 justifies building course
components once for a series.

**Architecture C: open edition only, site links out.**

The cheapest honest option: the course lives solely on GitHub Pages in the
open skin, and tealinsights.com links to it from the hub card like every
other tool. The Klim edition exists only as the desktop-typeset PDF. This
matches the site's current all-tools-link-out idiom but fails the decided
constraint that the training's canonical home is the site with the brand
skin, so it is listed as the fallback if the lay-down integration ever
proves too costly, not as a candidate.

**Recommendation: A**, with B's revisit trigger written down (Quarto 2
lands, or guide #2 starts) so this is a dated decision, not a default.

### 2.4 Own repo or QCraft-App?

Stays in QCraft-App. The deciding fact is G9: the course's figures
regenerate from the same Parquet inputs and engine the Explorer ships, and
the audit's cleanest result (byte-identical regeneration, the staleness
hazard closed by one commit) exists precisely because course and engine
share a repo and a CI. A separate repo re-opens the stale-numbers class of
defect through data vendoring. The series argument cuts the other way only
when a second guide exists; at that point the right move is a series
contract (pinned data artifacts per guide), designed once, on a real
second case. Revisit trigger written down accordingly. One naming fix
rides along: lane4-course's branch merges back into QCraft-App main as the
course's home path, and the m2 slug renames per F-30 before first publish.

### 2.5 The license split

Recommendation (from the licensing recon, Carpentries-precedent): root
`LICENSE` stays pure MIT (code, including qmd code chunks, CSS, build
scripts), which keeps GitHub's license detection clean; add
`LICENSE-docs.md` applying **CC BY 4.0** to the course prose, original
figures, and original screenshots of the Explorer, with a Third-Party
Content section that names what the CC grant does NOT cover: IMF-derived
methodology descriptions are original expression of unprotectable ideas
(fine), but User Guide quotations remain quotation, screenshots of the IMF
Excel workbook reproduce IMF expression and are excluded from the grant,
and the IMF's all-rights-reserved default is stated so downstream reusers
know to seek IMF permission for IMF material. CC BY beats CC BY-SA
(ShareAlike taxes exactly the ministry adaptations the course exists to
invite) and CC0 (attribution is the house's compensation). Fonts stay
OFL-bundled as already implemented. The colophon updates to "code MIT,
text and original figures CC BY 4.0." Small lane (P3), includes SPDX-style
headers on the doc directories if wanted (REUSE-lite).

### 2.6 Migration estimate, lane-sized

| Lane | Content | Size |
|---|---|---|
| P1 | MathJax self-host, Quarto+PDF-engine pins, em-dash separator, round-trip script | 1 lane |
| P2 | Brand render lay-down into the site under /sovtech/qcraft/course/, checksum workflow, site QA run, hub COURSE_URL repoint | 1 lane |
| P3 | LICENSE-docs.md, colophon, third-party notices | half lane |
| R1-R7 | The reformat waves, section 1 | 1 half-day batch + 6 lanes |

Dependencies: P1 before P2; R2 (numbering) before any URL-stable publish;
the chapeau call (section 5) before R7; everything else parallel.

## 3. Deliberately discarded options

Named so the no-sunk-cost rule is visible: the existing dual-skin work is
KEPT (it is the best part of the current platform); what this plan
discards is the current MathJax-from-CDN posture, the unpinned PDF engine,
the manual PDF round-trip, the m2 slug, the "Module 0..6" prose numbering
(recommendation, Teal's call), and the idea that the course could ship its
brand skin from GitHub Pages (the Klim license forbids the host; that path
was never viable once stated plainly).

## 4. The link packs, verified live

Every URL below was fetched during CC-17 (2026-08-30). Where a host blocks
generic fetchers, the verification method is named; that operational fact
also shapes the curation rule.

### 4.1 The fiscal-risk-statement genre pack (representative, four regions)

| Region | Document | Publisher | URL | Verified |
|---|---|---|---|---|
| Africa | Fiscal Risk Statement FY24/25 (landing page) | Uganda MoFPED | https://www.finance.go.ug/publications/fiscal-risk-statement-fy-2425 | HTTP 200; page links the 1.03MB PDF |
| Asia-Pacific | Fiscal Risks Statement archive, FY2013-FY2026 | Philippines DBCC | https://www.dbm.gov.ph/index.php/publications-dbcc/fiscal-risks-statement | HTTP 200; fourteen editions listed |
| Europe/Caucasus | Fiscal Risk Analysis page (FRS of Georgia, English editions) | Georgia MoF | https://www.mof.ge/en/fl/publikatsiebi__fiskaluri_riskebis_analizi | HTTP 200; JS-rendered list read in browser |
| Advanced economy | Budget Economic and Fiscal Update 2026, specific fiscal risks | New Zealand Treasury | https://www.treasury.govt.nz/publications/efu/budget-economic-and-fiscal-update-2026 | 403 to bots, loads in a real browser |
| IMF-produced | Fiscal Risks Toolkit landing | IMF FAD | https://www.imf.org/en/Topics/fiscal-policies/Fiscal-Risks/Fiscal-Risks-Toolkit | imf.org blocks bots; verified in browser |
| IMF-produced | Georgia Fiscal Transparency Evaluation 2024 (fiscal-risk pillar; pairs with the Georgia FRS row) | IMF | https://www.elibrary.imf.org/view/journals/019/2024/024/article-A001-en.xml | HTTP 200 with browser UA |

Considered and excluded with reasons: Kenya's 2026 Budget Policy Statement
(live but a fragile deep-file URL on a very slow host; substitute when the
Treasury posts a stable landing page).

### 4.2 The C-PIMA and official-materials pack (the course rider, settled)

| Item | URL | Verified |
|---|---|---|
| Q-CRAFT tool page (workbook + guide downloads) | https://www.imf.org/en/topics/fiscal-policies/fiscal-risks/fiscal-risks-toolkit/fiscal-risks-toolkit | Browser; page title carries the IMF's own "QUANTITATITIVE" typo |
| Q-CRAFT User Guide PDF v1.0 | https://www.imf.org/-/media/files/topics/fiscal/fiscal-risks/tool/qcraft-user-guidev10.pdf | GET 200 in browser network log |
| Q-CRAFT workbook v1.0 | https://www.imf.org/-/media/files/topics/fiscal/fiscal-risks/tool/qcraft-toolv10.xlsx | Anchor captured from live DOM |
| Kahn et al. (2021), journal of record | https://doi.org/10.1016/j.eneco.2021.105624 | DOI resolves (Energy Economics 104, art. 105624) |
| Kahn et al., open-access IMF WP 19/215 | https://www.imf.org/en/Publications/WP/Issues/2019/10/11/Long-Term-Macroeconomic-Effects-of-Climate-Change-A-Cross-Country-Analysis-48691 | Browser; Download PDF present |
| How-To Note 2025/009 (Centorrino, Massetti, Tagklis lineage; the posted successor of the internal climate-effects guide) | https://www.imf.org/en/publications/imf-how-to-notes/issues/2025/11/14/how-to-include-the-effects-of-rising-temperatures-in-long-term-gdp-projections | Browser; settles two rider items at once |
| IMF WP 2025/170 (Integrating Climate Change into Macroeconomic Analysis) | https://www.imf.org/en/publications/wp/issues/2025/08/26/integrating-climate-change-into-macroeconomic-analysis | Browser; note the posted author list is Mitra, Raissi, Versailles and 13 others INCLUDING Centorrino, Massetti and Tagklis; cite accordingly |
| UN World Population Prospects | https://population.un.org/wpp/ | HTTP 200 |
| IMF WEO database (canonical home since the 2025 portal migration) | https://data.imf.org/en/datasets/IMF.RES:WEO | Browser; April 2026 vintage current |
| C-PIMA framework page | https://infrastructuregovern.imf.org/content/PIMA/Home/PimaTool/C-PIMA.html | HTTP 200 (this IMF subdomain does not block bots) |
| Uganda PFM Climate Assessment, TA 2024/012 (the course's anchor C-PIMA) | https://www.elibrary.imf.org/view/journals/019/2024/012/article-A001-en.xml | HTTP 200 with browser UA |
| Guatemala PIMA + C-PIMA, TA 2024/021 (a second region's published C-PIMA) | https://www.elibrary.imf.org/view/journals/019/2024/021/article-A001-en.xml | HTTP 200 with browser UA |

One research result the course must absorb (F-31): the FADCP Climate
Dataset (Massetti and Tagklis, 2023) has **no public landing page or
posted standalone paper**; the approved attribution chain stays as Teal
gated it, and the References entry should point to the posted successors
(How-To Note 2025/009; WP 2025/170) with the dataset paper cited as the
About panel does.

### 4.3 The curation rule (maintenance-realistic)

Representative, never exhaustive: at most one national FRS per region plus
one archive (the Philippines row shows the genre's time depth), one
IMF-produced evaluation, and two published C-PIMAs (the worked case plus
one other region). Owner: whoever runs the course re-render. Review
trigger: every re-render, or twelve months, whichever comes first. Method
note for the checker: imf.org and elibrary.imf.org serve 403 to generic
fetchers, so link checks need a browser user agent; prefer ministry
landing pages over deep PDF paths (the Kenya exclusion is the cautionary
case).

## 5. The chapeau question: bolded or unbolded, with evidence

**The exhibit.** m5 was rendered both ways from a throwaway copy (nothing
touched the course; render in scratch, screenshots only):
`docs/reformat-plan-assets/chapeau/m5-{plain,bold}--prose.png` (the same
prose stretch, same scroll) and `--top.png` / `--full.jpg` companions. In
the bold variant, three consecutive paragraph openers read as a standing
summary ("Q-CRAFT Explorer produces stylized long-term projections." /
"The results are not forecasts." / "Q-CRAFT is designed to complement
existing fiscal analysis rather than replace it.") with the page still
calm; in the plain variant the same skim requires reading into each
paragraph.

**Evidence for bolding.** The house exemplar (Clearing the Clogs) bolds
every chapeau and its capture doc makes the skim test the auditor test;
the layer-cake scanning evidence says readers fixate on headings and
emphasized leads; the audit measured this course's chapeaus at 130 of 137
already carrying the point, so the content is bold-ready today.

**Evidence against, stated fairly.** Emphasis is zero-sum (bolding
improves recall of the bolded at the expense of the rest), Rogers and
Lasky-Fink's formatting principle warns against dense emphasis, and the
course already bolds objective verbs, defend-your-choice labels, and
key terms; B8 (formatting restraint) scores 2 today and is at risk if
bold chapeaus simply stack on top.

**Recommendation.** Adopt bolded chapeaus course-wide, with two
compensating rules from the exemplar and the evidence: (1) the sanctioned
exception stays: one-sentence figure-handoff paragraphs stay unbolded (the
throwaway render surfaced exactly this case); (2) in-paragraph bold
elsewhere is demoted in the same pass: key-term bolds inside body
paragraphs become plain (terms will be glossary-linked after wave R3,
which is a better affordance anyway), so total emphasis density stays
roughly constant and the chapeau layer owns the skim. The objectives
blocks and callout titles keep their bolds (different surface, different
function). If Teal prefers unbolded, the course passes B1 either way and
nothing else in this plan changes.

## 6. Log

- 2026-08-30: v0.1 by CC-17 (TEA-948). Inputs: the learning audit (74
  merged findings), site and Quarto build recon with determinism
  measurements, license research with precedent survey, two link packs
  verified live (browser-verified where hosts block bots), and the m5
  chapeau double render. Recommendation set: Architecture A; stays in
  QCraft-App; MIT + CC BY 4.0; bolded chapeaus with the compensation rule;
  revisit triggers written for Architecture B and the repo split.
