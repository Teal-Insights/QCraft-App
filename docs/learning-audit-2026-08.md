# Learning audit: the Q-CRAFT Explorer companion course (2026-08)

**Status:** complete, awaiting Teal's review. Run by CC-17 (2026-08-30, trail
TEA-948). **Target:** the companion course as rendered at `localhost:8899`
(lane4-course worktree, branch `feat/lane4-course` at `3f100ab`, built
2026-08-28 against `freeze-2026-08-29`), plus its source at
`lane4-course/docs/companion-guide/` (2,313 lines of qmd across 11 files),
its committed PDF, and the deployed app it teaches.
**Rubric:** `docs/learning-standard-draft.md` v0.1 (this branch).
**Scope:** the audit changes nothing. Every fix named here is a proposal;
gated wording stays Teal's. The course is pre-review by design: 23 DRAFT FOR
TEAL and 9 TODO callouts ship in the render on purpose, and none of them is a
finding in itself.

## 1. Why this file exists

The standard's bar, in one sentence: a ministry economist who lands on this
course can run the tool and understand what they need in thirty minutes, a
learner can reach capability, a returner can find one thing fast, and a
skeptic can decide to trust it, with no journey requiring the reader to
decode the material's own machinery. This audit walks all four journeys,
runs the three personas, inventories every figure and term of art, and ties
every claim to a screenshot, a quoted line, or a committed measurement.

## 2. Method

- **Evidence base.** 60 scripted captures in `docs/learning-audit-shots/`
  (11 pages, desktop 1440x900 and mobile 390x844, first screens, full pages,
  18 figure crops), `capture-manifest.json` (per-page ToC, heading, callout,
  and label probes), `measurements.json` (bare-crossref counts, parity
  occurrences, rendered em-dashes, draft-marker counts), live probes of the
  rendered site (search ranking, ToC scroll tracking, 375px overflow sweep),
  the deployed app, the committed PDF (md5-checked against source), and the
  primary documents on disk (the IMF User Guide v1.0, the Uganda FRS
  FY2024/25, both C-PIMA reports).
- **Independent passes.** Twelve differently-lensed passes ran with no
  shared notes: four journey walks (J1 to J4), three persona reads (creator,
  busy reader, and the skeptic inside J4), figures, jargon, skim
  architecture, pedagogy, and repo-specific bindings, plus a first-screen
  pass.
- **Adversarial verification.** Every pass's findings faced a separate
  kill-pass with authority to reject and re-rate. Survival: 123 raw
  findings, 121 confirmed, 1 killed (a license claim that verified as
  accurate), 2 re-rated, plus 10 score disputes applied to the rubric below.
- **Severity.** The standard's section 4 scale (Nielsen 0 to 4); 4 is
  reserved for a reader learning or citing a wrong number or misattributing
  a method.
- **Findings are merged across passes.** Where three passes found the same
  defect it appears once below, with the pass count noted. Each issue is
  scored in exactly one home.

## 3. What works, and is worth protecting

Recorded first, so no fix tramples a strength.

1. **The ten-minute run is real.** M1's run was walked against the deployed
   app: the link serves, Uganda auto-loads, the tabs and download buttons
   match the prose step by step, and the course pre-empts the number-mismatch
   panic with the vintage caveat right where panic would start.
2. **Figure regeneration is byte-identical.** `build_exhibits.py` and
   `build_course_map.py` were re-run in a clean worktree; `git diff` came
   back empty across 18 exhibit SVGs and 11 course-map variants. Commit
   `753b55a` (2026-08-28) regenerated every computed artifact against the
   fixed engine, closing the staleness hazard REFERENCE-NOTES flagged.
3. **The chapeau discipline is near exemplary.** Extracting the first
   sentence of every main-flow paragraph in m1, m2, and m5 (137 paragraphs):
   roughly 130 carry their paragraph's whole point.
4. **Answer-collapse discipline is consistent.** Every prompt renders open;
   every answer renders collapsed. The commit-before-opening pattern is the
   course's practice engine and it works.
5. **The worked-example fade is textbook.** Uganda annotated, Ethiopia
   completion with one open cell, then an independent problem with a
   checklist only.
6. **The parity FIGURE is a model of claim honesty.** It carries the gated
   "ratio metrics only" verbatim, draws the two claims at honestly different
   widths, and captions them: "Both claims passed. One of them was simply
   asked a narrower question."
7. **The narrative spine binding is delivered exactly.** The course map
   decomposes inputs by source into the three numbers, the debt dynamics
   equation, and the scenario paths; the warming block docks visibly; m1
   executes the LEGO reveal as specified.
8. **Excel respect holds the whole way.** The four reasons are exactly four,
   "toil" appears nowhere, and the workbook is credited in near-card-verbatim
   terms.
9. **Global identity is earned.** The hook names no country, Kenya and
   Thailand carry the teaching, Uganda enters as the verification country
   with the reason stated, and the capstone names "the senior officials who
   sign the document off."
10. **In-context definition prose is exemplary where it exists.** "Revenue
    equals non-interest spending, to the last unit of local currency";
    "fixed effect... so each country gets its own average growth rate."
    The jargon protocol's failures below are about linking and coverage,
    never about the writing.
11. **F1 register is clean.** Zero presumption formulations in 11 files;
    wrong-answer feedback names the belief, never the reader.
12. **Wrappers, objectives, and retrieval are consistently built.** Bloom
    verbs throughout, warm-ups labeled as retrieval from named earlier
    modules, m6 closes the loop on the m0 self-assessment.
13. **Every hand-built SVG is accessible.** role=img, aria-label, a title
    element, a visible figcaption, and a print PNG twin.
14. **The m5 stakes frame.** "Your whole credibility rests on the next
    thirty seconds," answered at the wrapper with the literal thirty-second
    answer.
15. **Vintage honesty is pervasive.** The Explorer-run versus
    published-workshop split in m4 is stated, the discrepancy surfaced, and
    the golden-master rationale explained.
16. **Zero em-dashes in all authored source**, confirmed by grep; the one
    rendered occurrence is machine-composed (F-18).
17. **The zero-climate notice rider is delivered** in m5 in the approved
    register with the User Guide footnote citation.
18. **The PDF is current and identical** (md5) across source, `_book`, and
    the served copy, built minutes after the last qmd edit.

## 4. Gate results

Binary verdicts. One fail caps the audit at revise required.

| Gate | Verdict | Evidence and findings |
|---|---|---|
| G1 Reader journeys named and served | **FAIL** | J1 is never named or signposted; the entrance's first actionable click routes to the superseded app; the course's own module numbers disagree with its rendered chapter numbers. F-4, F-5, F-6. The captured letter-code anti-pattern is substantially remediated: every path row carries a plain-language gloss (protect item; residual s2 in F-23). |
| G2 Skim architecture | **FAIL** | Floating ToC absent on glossary and references, and `display:none` at phone width on every page, so a phone reader of the 7,084-word spine has no within-page navigation. Chapeau floor: 130 of 137 hold; 2 fail outright, 5 defer the point. F-13, F-24, F-25. |
| G3 The three personas pass | **FAIL** | Creator: the floor-asymmetry motive claim (F-1) and the untold Guide default (F-22). Critic: the both-ways promise (F-3), the C-PIMA universal-annex overclaim (F-16), the stale date (F-17). Busy reader: passes, 25 minutes to the three intuitions. |
| G4 Jargon protocol | **FAIL** | No first use of any term anywhere links to the glossary; glossary terms carry no anchors, so term-level links are structurally impossible today. SSP is never expanded yet learners are told to publish it. F-7, F-8, F-9. In-context definition prose, where present, is exemplary (protect item 10). |
| G5 Layered depth | **FAIL** | The machinery is excellent (45 collapsibles; depth layers carry true depth; prompts open, answers collapsed) but the capstone rubric's operative content and the floor-asymmetry reading rule sit collapsed, majority-needed. F-10, F-11a. |
| G6 Primary sources one click away | **FAIL** | Zero links to any IMF, UN, or World Bank material anywhere in the course; four distinct external destinations total; the two Uganda documents m4 reads page by page are never linked; no Official materials section; no genre sample. F-11, F-12. |
| G7 Global identity | **PASS** | Earned, not asserted: the anonymous hook, mechanism-picks-country examples, transfer framing, office-free capstone. Residual: five small Uganda leaks outside the declared worked case (s1, findings table). |
| G8 Attribution and deference stay exact | **FAIL** | The gated parity sentence ships three times without "only" (the parity figure carries it); motive attributed to FAD in four spots; FADCP layer undated with no references entry; one uncited "the IMF's own evaluation" claim. F-1, F-2, plus s2 rows. Not-an-IMF-product and deference wording: prominent and exact (protect item). |
| G9 Every number traces | **PASS** | Regeneration verified byte-identical against the fixed engine (commit 753b55a); figure sources name their committed CSVs; the rule-off extremes match the CC-13 pinned run; FRS and User Guide quotes verify word for word. Residual: one page-off footnote cite (s2). |
| G10 The writing gates hold | **FAIL** (narrowly) | Authored prose is em-dash-free and tic-free across all 11 files. One machine-composed em-dash ships in the rendered appendix title, and rendered output is what the gate binds. F-18. |

**Verdict: revise required** (8 of 10 gates fail). The honest gloss: the
failures are concentrated and mostly small-fix (the entire G8 repair is
about a dozen sentence edits; G4's core is anchors plus twenty links), and
the protect list above is long. The bones of this course are strong; the
gates catch exactly the trust and routing seams a pre-review draft would be
expected to still have open.

## 5. Scored rubric

0 to 2 per the standard; disputes from the kill-passes applied. Anchors
compressed; full anchors live in the per-pass records (see Method).

| Criterion | Score | Anchor |
|---|---|---|
| A1 backward design | 2 | m0 states the capstone in its first hundred words; m3's Document-it blocks feed it; residual: the index never names the deliverable (s2), m2's tie rides a collapsible (s2) |
| A2 observable objectives | 2 | All seven module blocks use action verbs; one banned "Understand" in the index course-level list (s1) |
| A3 routing respects expertise | 1 | Plain-language glosses rescue every case, but codes lead each row, the route figure contradicts itself, and m2 has no marker (F-19, F-20, F-23) |
| A4 the expert's map | 2 | The map opens every module, right nodes lit; m3 prose says three nodes where five are lit (s1) |
| A5 hook with the job | 1 | m2 and m5 hooks are exemplary; m1 buries the ten-minute run under a four-reasons recap; m3's hook is the template itself |
| A6 worked examples fade | 1 | The fade structure is textbook; the completion problem has no check before the independent problem (s2) |
| A7 practice is retrieval, spaced, wanted | 1 | Real spacing, real commitment devices; warm-up answers in m3-m6 print beside the questions, contaminating the attempt (s2) |
| A8 load managed | 2 | Standing figures survive the remove test; symbol tables sit with equations |
| A9 transfer taught | 2 | Kenya vs Thailand structured comparison; the fade to an unscaffolded third country |
| A10 wrappers close | 2 | Consistent, honest, with same-week desk actions; m0's wrapper lacks the common-errors element (s1) |
| A11 time budgeted honestly | 1 | The 3-to-4x multiplier is named, rare and protectable; but route times never say whether it is applied, and the "standard finding" claim is uncited (s2 x2) |
| A12 error content from real learners | 1 | m6 marks its list as pre-pilot hypothesis, exactly right; m0-m5 error content carries no provenance marking (s2) |
| B1 chapeaus carry the argument | 2 | 130 of 137 measured; m2 Step 3's bold-label chapeaus read as a self-standing summary |
| B2 headings as front-loaded claims | 1 | Claim headings dominate, but "Wrapper:" occupies seven front-load slots, several headings are deictic, and the appendix title is broken (s2 x3) |
| B3 one idea per paragraph | 1 | 2 of 5 sampled paragraphs carry an unannounced second idea, burying a V1 limitation (s2) |
| B4 sentence discipline | N/A | Not sampled by any pass this run; run the 20 percent cut test at redline |
| B5 numbers beat adjectives | 1 | Strong overall; "runs for most of the world" recurs numberless at headline spots (s1) |
| B6 relevance stated | 2 | The why-you-care discipline holds; one soft spot at m1's opening (s1) |
| B7 explicit asks | 2 | Every module ends with "On your desk this week" naming a startable action |
| B8 formatting restraint | 2 | Sampled screens bold only the skim path |
| C1 mechanism not function | 2 | The amplifier decomposition; the rigidity decomposition table |
| C2 concrete before abstract | 2 | Cases open every concept sampled; the fade to the general form is explicit |
| C3 equations get the full treatment | 1 | The central equation gets all five elements in one screen; pb*, a taught equation, lacks picture and on-equation annotation (dispute applied) |
| C4 analogies scaffolded | 1 | The kitchen analogy names its break; the auditor analogy does not; the second frame for the central model lives in a DRAFT collapsible (s1 x2) |
| C5 prediction before payoff | 2 | Predict-observe-explain on all five m3 parameters; one miss at the m2 cold open (s1) |
| C6 reference class carried | 1 | Taught explicitly in m0 and m2; the lower-bound claim sheds its "under those channels" qualifier at headline spots (dispute applied) |
| C7 the reveal move | 2 | The LEGO arc delivered as specified |
| D1 titles are takeaways | 1 | All 23 drawn exhibits carry takeaway titles; three of five screenshots and the five param figures do not (dispute applied) |
| D2 direct labeling | 1 | End labels and on-data labels are the norm; param-rigidity-record is legend-only, m2-interest-rules names rules only in the side panel |
| D3 hierarchy matches message | 2 | Grey-then-highlight throughout; the equation-growth figure is the exemplar |
| D4 type at rendered size | 0 | Every drawn exhibit sets in-figure text below page-body size; the course map lands at 7.1 to 8.7px effective; app screenshots render near 6 to 8px (F-21) |
| D5 figures read out | 2 | Preview and read-out sentences near-universal; one miss (m1 analysis-gap, s1) |
| D6 form follows relationship | 2 | Waterfall for the multiplicative identity; timeline for the WEO handoff; the missing m5 comparison figure is filed (s2) |
| D7 exhibit language consistent | 1 | The drawn system reads as one system; seven default-styled mermaid strips beside it do not (s2) |
| D8 figures regenerate | 2 | Byte-identical re-run verified; colophon understates the discipline (s1) |
| E1 floating ToC works | 1 | Present and scroll-tracking on 9 of 11; absent on the two purest lookup pages |
| E2 search present and finds terms | 1 | Search is real (84 entries, all pages); defining page tops the results in 1 of 5 term queries |
| E3 crossrefs explain themselves | 1 | 83 bare numbered link texts; most rescued by their sentences, at least four naked at routing moments |
| E4 glossary works as a reference | 1 | Definitions excellent; unalphabetized, no anchors, no back-links, no ToC |
| E5 one thing findable fast | 1 | 4 of 5 canonical lookups complete under a minute; the scenario-name lookup dead-ends |
| E6 effort visible | 1 | Course-level times exist and lean honest; no module states its own cost, and the spine is 4x the median module unannounced |
| E7 mobile intact | 1 | 9 of 11 pages clean at 375px; m2's display equations clip mid-phrase (F-14); m4 wobbles 10px |
| E8 whole-artifact survives | 2 | PDF current and identical; the stale March date stamps both editions (charged once, F-17); collapse-dependent answers render expanded in print (open question Q3) |
| F1 respect without presumption | 2 | Clean sweep, all files |
| F2 wit rationed and true | 2 | One aside per section, riding true facts |
| F3 credit before the cut | 1 | Holds everywhere except the appendix's uncredited jab at the User Guide (s2) |
| F4 momentum | 1 | m3's figure-free two-parameter stretch and m5's repeated strengths passage flag (s2 x2) |
| F5 examples carry the global frame | 1 | The rule is followed everywhere except its largest case: Kenya, carried through all of m2, never gets its why-Kenya sentence (s2) |
| G1p personas and journeys written | 1 | Who-this-is-for exists and is good; no journeys are written down (F-6 fix covers) |
| G2p evaluation drove refinement | 1 | The course self-documents as unpiloted and designs the pilot into m6; no evaluation has yet run |
| G3p iteration recorded | N/A | No Teal redirect has yet occurred against the new standard |
| G4p whole journey designed | 1 | Five of six stages deliberate; return-as-reference is an accident of the book template |

## 6. Findings

Ranked by verified severity. Each carries the rubric line, evidence, the
smallest fix, and what the fix must not break. Merged across passes; "3
passes" means three independent passes found it.

### Severity 4

- **F-1 (G3, G8; 3 passes). A ministry reader will repeat as fact that FAD
  intentionally floors only the baseline.** m5: "intentional," "a deliberate
  choice rather than a bug"; m4 routes readers to "why it is deliberate."
  Nothing on disk sources FAD intent, and REFERENCE-NOTES line 50 records
  this exact correction as owed. A misattributed motive in a course that
  ministries will quote is the severity the standard reserves its top grade
  for. *Smallest fix:* in all four spots, replace motive with formula facts
  (the Baseline sheet wraps its recursion in IF((...)<0,0,(...)); the six
  scenario sheets carry the bare recursion; the workbook records no reason)
  plus the reading rule for charts that touch zero. *Must not break:* m4
  lines 130-135 already quote the formulas correctly; the fix is deletion
  and rewording, not new claims.

### Severity 3

- **F-2 (G8; 2 passes). Three of four prose occurrences of the parity claim
  omit the gated word "only."** index.qmd:48, m1:354, appendix:31; the
  parity figure carries the approved form. A reader quoting the preface
  carries away a wider climate-parity claim than the binding wording
  permits. *Fix:* insert "only" after "ratio metrics" in the three
  sentences. *Must not break:* the figure's wording and the explanatory
  clause after m1's sentence.
- **F-3 (G3 critic; 2 passes). The preface's both-ways promise is
  undelivered.** Every taught procedure and the capstone run only on the
  Explorer; m1 carries the author's own TODO admitting the workbook half
  does not exist. *Fix:* Teal's scope call: build the workbook thread, or
  re-scope the promise ("teach the model both tools run, hands on in the
  Explorer, workbook companion to follow") in preface and m0. *Must not
  break:* the four-reasons card's Excel respect.
- **F-4 (G1; 2 passes). The primary journey's first click routes to the
  superseded app.** Five occurrences of the old shinyapps URL, including
  the index Try-the-App callout and the m1 run, against the
  supersede-not-replace rule that new artifacts point at new URLs. *Fix:*
  replace with the frozen Explorer URL and re-render. *Must not break:*
  old URLs elsewhere that are deliberately historical (none found in the
  course).
- **F-5 (G1, G3 busy; 3 passes). The course's module numbers and the
  rendered chapter numbers disagree by one, everywhere.** The index sells
  "Module 0..6" while the sidebar renders 1..7; "Module 2 is the spine"
  points the sidebar reader at the wrong chapter; every prose-to-sidebar
  lookup is off by one. *Fix:* pick one numbering and make it total: either
  render chapters unnumbered and carry "Module N" in each title, or drop
  the 0-to-6 numbering from prose; then grep-sweep "Module ". *Must not
  break:* the m-file slugs (see F-30 for the one slug worth renaming).
- **F-6 (G1, G1p; 3 passes). J1 and J3 are never named; no 30-minute route
  exists.** The shortest named route is 2 hours; nothing tells the
  returning reader the lookup route. *Fix:* one "Four ways to read this"
  block in the preface naming the four journeys and pointing each at its
  serving structure, plus a fast-lane callout mirroring the module boxes
  ("Must run it today? ...about 30 minutes"). *Must not break:* Start at
  Module 0 stays; the block adds lanes beside it.
- **F-7 (G4; 2 passes). No first use of any term links to the glossary, and
  no term has an anchor.** The gate fails as written; term-level links are
  structurally impossible until ids exist. *Fix:* per-term ids in
  glossary.qmd plus roughly twenty first-use links across the modules.
  *Must not break:* the in-context definitions that already do the teaching.
- **F-8 (G4). SSP is never expanded, yet m4 has learners put "emissions
  follow SSP3-7.0" into a paragraph they must defend.** *Fix:* one sentence
  under m1's six-scenario table naming Shared Socioeconomic Pathways and
  what the two numbers index; mirror in the glossary entry.
- **F-9 (G4, G5). The debt-stabilizing primary balance is defined and
  derived only inside a collapsed layer, while the capstone requires
  computing it.** *Fix:* hoist two sentences plus the pb* formula into the
  visible end of m2 Step 1; leave the derivation collapsed.
- **F-10 (G5). The capstone rubric's operative content is hidden in a
  collapsed callout** while the module objective says to assess your own
  draft against it. Majority-needed content inside a disclosure is the
  gate's named failure. *Fix:* when the rubric is approved, set
  collapse="false" on that one callout (or lift the table out, DRAFT banner
  above). *Must not break:* the answer-collapse discipline everywhere else.
- **F-11 (G6; 2 passes). The course links zero official sources.** No IMF,
  UN, or World Bank link exists anywhere; the Official materials rider is
  undelivered; even the User Guide the course defers to on every page is
  never linked. *Fix:* an Official materials section in the preface (or its
  own early page) with one link per rider item and a one-line curation
  rule; hyperlink the User Guide at first mention. A verified-live link
  pack is drafted in `docs/course-reformat-plan.md`. *Must not break:* the
  complementary-to-official framing.
- **F-12 (G6). The genre the course teaches toward is never linked**, not
  even the Uganda FRS that m4 reads page by page. *Fix:* link the FRS and
  the C-PIMA summary where m4 introduces them; add three to five live
  national FRS links across regions to the Official materials section (the
  pack in the reformat plan is verified live and regionally spread).
- **F-13 (G2, E7). A phone reader has no within-page navigation anywhere.**
  The floating ToC is display:none at phone width on all pages; the drawer
  holds only chapter links; the 7,084-word spine is a single undifferentiated
  scroll on mobile. *Fix:* enable Quarto's in-body ToC below the lg
  breakpoint as a collapsed "On this page" disclosure.
- **F-14 (E7). m2's two worded display equations clip mid-phrase on
  phones** (470px and 694px wide at a 375px viewport) and force horizontal
  wobble. *Fix:* three lines of CSS (`mjx-container[display="true"] {
  overflow-x: auto; ... }`); the stylesheet already applies exactly this
  treatment to `.math-block`.
- **F-15 (E4, E5; 2 passes). The glossary round trip cannot be completed,
  and the scenario-name lookup dead-ends.** No anchors, no back-links to
  teaching sections, not alphabetized; "what is the Hot scenario" has no
  findable defining target and invites conflating Hot with Hot Unadapted.
  *Fix:* alphabetize; add ids; add one taught-in link per entry; extend the
  Climate scenarios entry to enumerate all six names, linked to m1's
  scenario table. *Must not break:* the entry prose, which is excellent.
- **F-16 (G3 critic). The glossary and references assert that C-PIMA
  assessments in general include a Q-CRAFT annex**, a universal claim the
  sources on disk support for exactly one assessment. *Fix:* scope to the
  evidence ("The Uganda assessment includes..." or "C-PIMA engagements can
  include...") unless the 2025 Handbook is obtained and verifies the
  general claim.
- **F-17 (G3; 3 passes). Every page stamps "Published March 17, 2026," five
  months before the course was built**, beside a data-currency pitch.
  *Fix:* `date: last-modified` (or the true release date) in _quarto.yml;
  one line fixes web and PDF.
- **F-18 (G10). The rendered appendix title carries an em-dash and a
  doubled word**: "Appendix A [em-dash] Appendix: from Q-CRAFT to the
  LIC-DSF." *Fix:* retitle the qmd ("Co-design and the SovTech vision," per
  F-26) which kills the doubled word; replace Quarto's composed separator
  via the appendix-delimiter option. *Must not break:* Quarto's appendix
  lettering.
- **F-19 (E6, A3, G3 busy; 3 passes). m2, the self-declared unskippable
  spine and the longest module, is the only module without its promised
  fast-path marker.** *Fix:* one Fast path callout after m2's objectives
  ("Already own the debt dynamics equation? Skim Step 1 as revision; read
  Steps 2 and 3 in full"). *Must not break:* nobody-skips-m2.
- **F-20 (A3, G1; 2 passes). The route figure's annotation contradicts its
  own title and the body text**: "the only module a path drops" renders
  under the M2 column while title and prose say no route drops a module.
  *Fix:* reword the annotation in the generating script; update the
  aria-label with it.
- **F-21 (D4; figure pass). The course map, the most repeated figure in the
  book, is illegible where it is most needed.** Labels land at 7.1 to 8.7px
  effective on desktop and dissolve on phones; the tall print variant built
  for exactly this reason never serves the screen. *Fix:* serve the print
  layout below a width breakpoint; raise the wide variant's label sizes in
  `build_course_map.py`. This is the head of the D4=0 family: every drawn
  exhibit sets figure text below page-body size, and the five app
  screenshots render near 6 to 8px (fixes per script, filed s2).
- **F-22 (G3 creator). The course argues against the fiscal-rule-off
  setting without ever saying it is the User Guide's own documented
  default** (Guide pp. 18 and 29 start with the rule off; the workbook
  ships it on). A trainee who opens the Guide meets an unexplained
  contradiction. *Fix:* one sentence where m4 sets the rule, naming the
  Guide's default and why this course's headline run differs. *Must not
  break:* the m4 rule-on decision itself (documented, workbook-following).

### Severity 2 (compressed; rubric ref, defect, smallest fix)

| # | Ref | Defect | Smallest fix |
|---|---|---|---|
| F-23 | A3 | Path rows lead with letter codes; code sets not exhaustive (A3/B1/C1 matches no row) | Plain description first, codes demoted to trailing parenthetical |
| F-24 | G2 | Two chapeaus carry none of their paragraph's point; five more defer it to sentence two | Rewrite the two, fold payload into the five |
| F-25 | G2, E1 | Glossary and references lack the floating ToC entirely | Group entries under H2s; Quarto emits the ToC free |
| F-26 | B2, E3 | Appendix identity broken two ways: title names a LIC-DSF journey, index sells co-design | Retitle "Co-design and the SovTech vision"; align index link text |
| F-27 | B2, G4 | "Wrapper:" leaks internal pedagogy machinery into seven reader-facing headings | Delete the prefix; the remainders self-explain |
| F-28 | G8 | "Deliberately conservative" twice attributes motive the Guide does not state | Drop "deliberately"; "conservative by construction" |
| F-29 | C6 | The lower-bound claim sheds its "under those channels" qualifier at headline spots | Add the qualifier at the three headline uses and the m4 model paragraph |
| F-30 | G8 | m2's file slug reads m2-debt-equation.html against the naming call | Rename the file before first publish; update chapter list |
| F-31 | G8 | FADCP layer undated in m2; the 2023 dataset paper missing from References | Add "(2023)" and the references entry; note: CC-17 link research found no public landing page for the dataset paper; the posted successor is How-To Note 2025/009 (see reformat plan) |
| F-32 | G8 | m6 attributes a finding to "the IMF's own evaluation of capacity development," uncited, possibly conflating the independent IEO | Name the document and year, add the references entry, or reword to a sourceable claim |
| F-33 | G3 | The appendix asserts the Q-CRAFT/DIGNAD/LIC-DSF chain as existing where its own A.4 calls it a goal | Reword A.3 to the aspiration |
| F-34 | G3 | "You have done with five clicks the analysis that ministry staff produced in a five-day workshop" overstates | "Reproduced the projection"; credit where the five days went |
| F-35 | G3 creator | m4 cites "trade disruptions (User Guide, p. 5)"; the Guide's term is "spillovers" | Replace the word; keep the gloss without the page cite |
| F-36 | G9 | The 25-economies footnote cite points at p. 20; footnote 12 sits on p. 19 | Change the page number |
| F-37 | F3 | The appendix cuts at the User Guide with an unsourced jab, uncredited | Cut the parenthetical; restate in the approved register |
| F-38 | F5 | Kenya, the largest extended example, never gets its why-Kenya sentence | One sentence in the m2 cold open |
| F-39 | A7 | Warm-up answers in m3-m6 print beside the questions | Wrap answers in the collapsed callout the inventory already uses |
| F-40 | A6 | The completion problem has no check before the independent problem | One vintage-proof verification line |
| F-41 | A11 | Route times silent on whether the 3-4x multiplier is applied; "the standard finding" uncited | One clause in the time note; soften to "a standard rule of thumb" |
| F-42 | A12 | Error content outside m6 carries no provenance marking | One course-wide sentence at the m0 inventory |
| F-43 | A1 | The index never states what the capstone is; m2's capstone tie rides a collapsible | One sentence in "How the course is organised"; one in m2's wrapper |
| F-44 | A5, F4 | m1 buries the ten-minute run under a four-reasons recap; m3's mid-stretch and m5's repeated passage flag momentum | Move the run up or cut the recap; one rule-on/rule-off figure in m3; fold m5's repeat |
| F-45 | G4 | FADCP, C-PIMA, golden-master, parity/ratio-metrics, nominal/real, concessional cluster: undefined at first use | One-clause appositives at each first use; two glossary entries |
| F-46 | G4 | Six leaned-on terms missing from the glossary (parity, vintage, anchor year, export packet, nominal/real, and kin) | Six short entries; promote anchor year to its own headword |
| F-47 | G4 | "Climate-fiscal risk premium" coinage collides with the finance term the course also uses | Rename to "the climate debt gap," or add one distinguishing sentence |
| F-48 | E2 | Search surfaces the defining page first in only 1 of 5 term queries | The F-7/F-15 anchors fix most of it via section-title weighting |
| F-49 | E3 | At least four cross-references are naked at routing moments ("read Section 6.7" with no content words) | m1-style parenthetical glosses at each |
| F-50 | E6 | No module states its own cost; the spine is 4x the median module, unannounced | One time line in each "In this module" callout |
| F-51 | D2, D1 | param-rigidity-record legend-only; m2-interest-rules panel-only; three screenshots and five param figures lack takeaway titles | Per-script label and headline fixes |
| F-52 | D6 | m5's two-countries diagnosis carries the course's heaviest mental simulation with no figure | Two-panel exhibit when the verified-pairs TODO lands |
| F-53 | D7 | Seven default-styled mermaid strips sit beside the exhibit system as a second visual language | Emit from build_exhibits.py or theme mermaid to the course palette |
| F-54 | E5, B2 | Try the App absent from ToC and sidebar; three index headings open on function words | Promote to H2; front-load the three |
| F-55 | E7 | m4's target-format table overflows 375px by 10px; m0's tables waste 45 percent of phone width on the label column | overflow-x wrapper; tbl-colwidths |
| F-56 | G1p | No journeys written down anywhere (fix merges into F-6) | The "Four ways to read this" block |
| F-57 | G4p | Return-as-reference is an accident of the template (fix merges into F-15) | The taught-in back-links |

### Severity 1 (compressed)

| # | Ref | Defect |
|---|---|---|
| F-58 | B5 | "Runs for most of the world" numberless at headline spots; "(171 economies)" fixes it |
| F-59 | A2 | Index course-objective 2 leads with "Understand"; reword to observable verb |
| F-60 | A4 | m3 prose says three nodes lit; the map lights five |
| F-61 | C4 | The auditor analogy names no breaking point; the kitchen second-frame lives in a DRAFT collapsible |
| F-62 | C5 | The m2 cold open reveals 49 points with no commit question |
| F-63 | C3 | pb* gets words, numbers, and plain sentence but no picture or on-equation annotation |
| F-64 | A10 | m0's wrapper omits the common-errors element every other wrapper carries |
| F-65 | G7 | Five small Uganda leaks outside the declared worked case (preface p2, m0 Q3 answer, m3 vintage exercise, m5 self-check, m2 collapse) |
| F-66 | G8 | The Maldives zero-climate teaching example promised for m5 is present only inside an exercise aside, unnamed |
| F-67 | D5 | m1 analysis-gap screenshot dropped in with neither preview nor read-out |
| F-68 | D1 | The appendix mermaid's caption asserts nothing |
| F-69 | D8 | The colophon names two of five figure scripts; a docstring lists eleven of eighteen figures |
| F-70 | C6 | The Kahn et al. references annotation states 7-13 percent GDP loss with no reference case |
| F-71 | B6 | m1's first section opens on the IMF's Excel choice before the reader's stake |
| F-72 | E3 | The index calls the appendix "co-design" while its title says LIC-DSF (merges with F-26) |
| F-73 | G4 | Small unexpanded cluster: WEO and IFI at index first use; deflator, CRU, CMIP, IDA credits, LIC-DSF-before-expansion |
| F-74 | G5 | The floor-asymmetry reading rule lives only inside a collapsed DRAFT callout in m5 (fix rides F-1) |

## 7. Journey verdicts by step

**J1, run and understand in 30 minutes (gate half: FAIL for want of naming;
the route itself, once assembled, works).**

| Step | Verdict |
|---|---|
| Arrival: index first screen | Orients on what-this-is in one sentence; no route or time signal above the fold (F-6) |
| Find the run | Via the module table's "A full projection in ten minutes" or m0's fast path; assembled, not offered |
| The ten-minute run | Works against the deployed app, step for step; but the link is the superseded app (F-4) |
| Understand what you ran | The three-number table and the warming map deliver; m1's wrapper hands a same-day desk action |
| The boundary read | m5 6.7's exclusions table answers in one screen; reachable by search |

**J2, the full course (gate half: holds with findings).** Index orients;
m0 routes (with F-5's double numbering); m1 runs then explains (hook
buried, F-44); m2 is the spine and the best teaching in the course, at
7,084 words with no fast path (F-19); m3 practices all five parameters
(momentum dip, F-44); m4 fades textbook-style (no completion check, F-40);
m5 is the model module; m6 closes the loop on m0's self-assessment,
retake included. Capability at the end is credible if the reader survives
m2's length on the device they actually use (F-13, F-14).

**J3, find one thing fast (gate half: FAIL on the glossary loop).** Five
canonical lookups: rigidity meaning 25s (glossary scan); sea-level rise
25s (search to m5 6.7); Kahn citation 20s (search to references); export
packet 30s (search to m6 brief); scenario name: dead end (F-15). Search is
real and everywhere; the glossary is the weak leg.

**J4, the skeptical evaluation read (gate half: FAIL on wording and
links).** The trust surface is met immediately (not-an-IMF-product on the
first screen, deference section, honest strengths-and-limits pairing, the
golden-master candor). What breaks trust: the stale date beside a
data-currency pitch (F-17), the parity sentence without "only" (F-2), the
motive attributions (F-1, F-28), the un-linked official sources (F-11),
and the C-PIMA overclaim (F-16). Every Uganda number checked verifies
against the primary documents on disk.

## 8. The jargon table

Method: all 11 qmds read in reader order; roughly 90 candidate terms
located by first use; glossary linking verified in source and rendered
HTML. Headline: **no first use anywhere links to the glossary** (that
column is "no" for all 74 rows and omitted); the glossary's 14 entries are
never linked from any module.

Verdict key: fine (defined in context or audience-owned), link (fine, add
first-use link), define (add in-context definition), gloss (add glossary
entry), replace (use plain language).

| Term | First use | In-context def at first use | In glossary | Verdict |
|---|---|---|---|---|
| debt-to-GDP ratio | index:5 | partial, audience-owned | yes | link |
| climate scenarios | index:5 | built over course | yes | link |
| WEO | index:22 | no, bare acronym | yes | define + link |
| vintage | index:22 | partial | no | gloss |
| export packet | index:25 | yes, exemplary | no | gloss |
| fiscal rule | index:35 | later (m2/m3) | yes | link |
| IFI | index:42 | never expanded | no | define |
| parity | index:48 | no; m1 defines by demonstration | no | define + gloss |
| ratio metrics | index:48 | defined only at m1:354 | no | define at index |
| convergence | index:78 | yes | no | fine |
| golden master | index:78 | no | yes | define + link |
| SovTech | index:84 | deferred to appendix | yes | fine |
| debt dynamics equation | m0:35 | yes, taught | yes | link |
| DSA | m0:55 | yes, phrase precedes acronym | yes | fine |
| interest-growth differential | m0:82 | yes by teaching | yes | link |
| primary balance | m0:84 | yes, the exemplar | yes | link |
| nominal / real | m0:84 | no formal def anywhere | no | define + gloss |
| debt-stabilizing (pb*) | m0:87 | formula only in collapsed layer | partial | hoist (F-9) + gloss |
| expenditure rigidity | m0:102 | yes (Q2 answer) | yes | link |
| C-PIMA | m0:139 | never expanded in modules | yes | define + link |
| effective interest rate | m1:94 | defined at m2:225 | no | gloss at symbol table |
| working-age population | m1:126 | yes | no | fine |
| UN WPP | m1:146 | yes in prose | no | fine |
| logistic curve / frontier | m1:157 | yes, exemplary | no | fine |
| concessional, risk premia, maturity structure | m1:214 | no | no | define |
| partial equilibrium | m1:257 | main-path def only at m5:94 | no | gloss |
| FADCP | m1:285 | never expanded anywhere | used in an entry | define |
| scenario names (six) | m1:285 | yes (table, in a collapsed callout) | yes | link; open the table (F-15) |
| SSP | m1:302 | never expanded in modules | inside an entry | define (F-8) |
| IDA credits | m1:324 | never expanded | no | define |
| the amplifier (coinage) | m1:107 | yes by demonstration | no | fine, exemplar |
| stock / flow | m2:38 | yes | no | fine |
| GDP deflator | m2:153 | no | no | define, one clause |
| fiscal gap | m2:205 | yes | inside Fiscal rule | fine |
| panel, fixed effect, pooled, regressor | m2:281+ | yes, exemplary apposition | no | fine |
| CRU, CMIP6/5, RCP | m2:321 | category context only | no | define, one clause |
| anchor year | m3:84 | yes via m2 mechanism | buried in WEO entry | gloss, own headword |
| MoFPED | m4:27 | yes, exemplar | no | fine |
| overall balance | m4:75 | defined after first-use table | no | reorder |
| demographic dividend | m4:153 | yes | no | fine |
| climate-fiscal risk premium | m4:228 | defined at coinage, collides | no | replace (F-47) |
| LIC-DSF | m5:35 | expansion arrives 130 lines late | yes | expand at first use |
| DIGNAD | appendix:37 | glossary only | yes | expand + link |
| Wrapper (headings) | all modules | internal machinery | no | replace (F-27) |

(Thirty further audience-owned or contextually-fine terms verified and
recorded in the pass log; none changes a verdict above.)

## 9. The figure inventory

Correction first: the course has **47 figure placements, not 18**. The
scripted crop capture (and the manifest's counts) caught only `img` and
mermaid elements; the 24 inline-SVG exhibits and 11 course-map placements
were verified from the committed SVG artifacts and full-page captures. m5
and m6 are NOT figure-free.

Verdicts: **very good 28, adequate 8, rework 11** (the 11 course-map
placements counted as one rework family).

| Figure | Page(s) | Verdict | Reason (D refs) |
|---|---|---|---|
| course-map family (11 placements) | every module | **rework** | Conceptually the best figure in the course (D3 dimming, per-module claims); D4 fails hard: 7.1-8.7px labels, dissolves on phones; the built print variant should serve narrow viewports (F-21) |
| m0-paths | m0 | very good | Takeaway title, chips, time column; shares the D4 floor; annotation contradiction (F-20) |
| m1-ten-minutes | m1 | very good | Numbered circles, read-out band |
| m1-analysis-gap (screenshot) | m1 | adequate | No takeaway headline, no preview/read-out, app micro-text (F-51, F-67) |
| seven mermaid strips | m1 | adequate | Legible, dual-code their headings; second visual language (F-53) |
| m1-parity | m1 | very good | The honest-broker point drawn; carries the gated "only" |
| m2-cold-open | m2 | very good | Deliberate reveal, end labels, committed CSV |
| m2-equation-annotated | m2 | very good | The equation protocol's picture half |
| m2-scoreboard | m2 | very good | End labels with verdict words |
| m2-growth-stack | m2 | very good | Right form for a multiplicative identity |
| m2-weo-handoff | m2 | very good | Timeline band, Guide p. 19 cross-check |
| m2-primary-balance | m2 | very good | On-data labels |
| m2-interest-rules | m2 | very good | One D2 fix named (F-51) |
| m2-baseline-reconciliation (screenshot) | m2 | very good | The model screenshot; per-panel headlines |
| m2-climate-panels | m2 | very good | Numbered mechanism panels; smallest type in the set |
| m2-equation-growth | m2 | very good | The D3 exemplar |
| m3-controls | m3 | very good | Defaults band names what is NOT settable |
| param-productivity / -inflation / -country-context / -demography-variants | m3 | very good | Dashed defaults labeled on-chart; small-multiples direct labels |
| param-rigidity-record | m3 | adequate | Legend-only identification (F-51) |
| m3-rigidity-compare (screenshot) | m3 | adequate | Correct teaching move; worst D4 case in the book |
| m4-seven-steps | m4 | very good | Checklist drawn inside the gate |
| m4-baseline / m4-climate-index (screenshots) | m4 | adequate | Provenance excellent; no takeaway headlines |
| m4-fan-readings | m4 | very good | Three named readings, vintage caveat |
| m5-exclusions | m5 | very good | Page-pinned exclusions, direction arrow as the message |
| m5-debt-floor | m5 | very good | Declared schematic, reading-rule banner |
| m6-packet | m6 | very good | In-bar labels, draft-not-decision footer |
| appendix mermaid | appendix | adequate | Topic-label caption, default styling (F-68) |

Missing-figure judgments: m5's two-countries diagnosis is the one passage that
wants a figure (F-52); m5 6.10's comparison is a table and should stay one; m6
needs nothing beyond what it has; the index is the one chapterless page
with zero figures while the course sells a maximally-visual identity, and
the already-built course map is one include away.

Protect: fixes to any figure go through the build scripts, never the SVGs,
and must not disturb the caption numbers the creator pass verified.

## 10. Triage: the split for Teal

**(a) Pre-Tuesday micro-fixes, worth folding into any re-render Teal
already redlines.** All are one-line to few-line edits with no design
decisions: F-2 (three "only"s), F-4 (five URL swaps), F-17 (the date line),
F-36 (p. 19), F-35 (spillovers), F-28 (drop "deliberately" twice), F-58
("171 economies"), F-60 (five nodes), F-27 ("Wrapper:" deletion x7), F-18's
title half (retitle the appendix qmd), F-49 (four crossref glosses), F-14
(three lines of CSS). F-1's rewording is small but touches teaching prose
in four places; include it if Teal redlines m5 anyway, since the correction
is already owed and recorded.

**(b) The post-Tuesday reformat wave**, grouped into lane-sized specs in
`docs/course-reformat-plan.md`: the journeys-and-numbering lane (F-5, F-6,
F-19, F-20, F-23, F-43, F-50, F-56), the glossary-and-links lane (F-7,
F-8, F-9, F-15, F-45, F-46, F-48, F-57), the official-materials lane
(F-11, F-12, F-31, with the verified link pack), the figure-typography
lane (F-21 and the D4 family, F-51, F-53), the mobile lane (F-13, F-55),
and the promise-scope lane (F-3, F-10, F-16, F-22, plus the s2 prose
fixes).

**(c) Open design questions for the slower table.**
1. The chapeau style call: bolded versus unbolded chapeaus (evidence and
   side-by-side in the reformat plan; B1 scored 2 either way).
2. The both-ways promise: build the workbook thread or re-scope (F-3);
   this is a scope decision, not a copy edit.
3. The PDF self-test problem: collapse-dependent answers render expanded
   in print, so every self-check is spoiled in the PDF edition. Options
   (answers-at-the-back appendix; PDF-only answer gating; accept and note)
   need a design decision, not a patch.
4. Whether the index should carry the course map (the one chapterless page
   with zero figures in a maximally-visual course).
5. Module time labels (F-50) interact with the honesty rule (A11): decide
   the display convention once (expert-time x multiplier, or measured
   pilot times after the pilot).

## 11. Log

- 2026-08-30: audited by CC-17 (TEA-948) against learning-standard-draft.md
  v0.1. Twelve independent passes plus twelve adversarial kill-passes;
  123 raw findings, 121 confirmed, 1 killed, 2 re-rated, 10 score disputes
  applied. Verdict: revise required (8 of 10 gates), with a long protect
  list and most gate repairs sized at sentence-to-section scale. Evidence:
  docs/learning-audit-shots/ (60 captures, manifest, measurements.json),
  live probes, primary documents on disk. The figure-count correction (47
  placements, not 18) is recorded in section 9 and the capture manifest's
  limitation noted inline.
