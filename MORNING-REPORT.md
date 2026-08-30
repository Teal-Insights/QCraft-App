# Lane 4 morning report (TEA-948)

Branch: `feat/lane4-course`. Nothing pushed. One remote added, `app`, pointing at the local `~/GitHub/QCraft-App` for a fetch, with its push URL disarmed. Run dates 2026-08-26 to 2026-08-30.

Most recent run first.

## Run 13 (CC-23): the editorial ladder, and Teal's preface redlines

### Status

Done. Work order: Teal's five preface redlines applied first with their
ripples, CC-20b's job folded in (it had not run), then the three-pass
editorial ladder over the whole course: structural/cohesion, skimmability,
and the Strunk and White line edit, with every judgment pass run as two
independent agents reconciled by a third per ADM-182. Both profiles render
clean, brand first and default last; the PDF is 119 pages and md5-identical
across source and `_book`; the 8899 server runs on the new `_book` inode
(215880197 both sides) and all eleven pages serve HTTP 200 with the new
text. DRAFT FOR TEAL count 23 in source and 23 in the render, unchanged.
Four commits.

### 1. The redline dispositions

**Redline 1, de-index Uganda: done, and it was almost all preface.** The
preface's second paragraph now leads with what finance ministries anywhere
do ("finance ministries carry the results into the fiscal-risk documents
they already publish"), carries Uganda as the for-example ("Uganda's Fiscal
Risk Statement for FY 2024/25 has a chapter... tracing back to a five-day
workshop"), and names the other teaching countries in the same breath
(Kenya, Thailand, Ethiopia; the capstone runs on the reader's own country).
The sweep found no other Uganda-first framing: m0 was already generalized
per the earlier gate (its no-country-named hook is a recorded decision and
stays), and m4's Uganda depth is the sanctioned worked-example role with
the transfer framing already in place ("The genre is not Ugandan"). Both
structural readers confirmed nothing else reads as a Uganda document.

**Redline 2, clickable citations: done, 61 in-text citation links, every
reference URL verified by fetching it.** Every parenthetical citation and
every "see the User Guide, pp. X" pointer is now a link into an anchored
entry on the references page, and every entry's title links to a verified
source URL. What verification turned up, worth knowing at launch:

- The Q-CRAFT landing page, the User Guide PDF and the workbook .xlsx all
  verified at imf.org; the references entry for the User Guide now carries
  all three, which also supplies the workbook download link the both-ways
  TODO in m1 was missing.
- The WEO database moved to the IMF Data portal: the April 2026 release
  lives at data.imf.org and the old weo-database URL pattern 404s. The
  entry links both vintages at their real homes.
- Two sources have no public URL anywhere: the Centorrino, Massetti and
  Tagklis (2024) reference guide and the Massetti and Tagklis (2023)
  FADCP dataset documentation are internal Fund documents (the IMF's own
  climate data portal returns zero results for FADCP). Their entries say
  so honestly and point at IMF How-To Note 2025/009 (November 2025), the
  public documentation of the method line, which is a new references
  entry. The m2 citation that named the dataset without a year is now a
  dated, linked citation.
- imf.org and ieo.imf.org return HTTP 403 to non-browser clients, so an
  automated link checker will falsely flag every IMF link. They load in
  real browsers; verified in one.
- The references page is re-sorted alphabetically, the two orphaned
  entries are now cited (di Castri from the appendix's SupTech paragraph,
  Bellon and Massetti from m5's adaptation answer), and an "Official
  materials" section landed in the preface, which discharges the course
  rider from the reference notes (line 46): User Guide, workbook, the
  climate methodology chain, both Uganda documents, both data sources,
  and the C-PIMA Handbook, each one click away.
- One render hazard found and fixed: anchor ids beginning `ref-` collide
  with citeproc's reserved bibliography namespace and abort the PDF's
  LaTeX pass with a `Lonely \item` error. The anchors are `src-*`.

**Redline 3, the Python framing: done in the preface, and the appendix is
substantively current.** The preface now introduces the Explorer as "an
open-source web tool that runs the same model" and carries the engine's
facts in one compact sentence where they earn their place: its own
open-source package, checked against the workbook cell by cell, separate
enough that a ministry can run the whole tool on its own machines. The m1
learning objective about why a reimplementation needs a parity test stays,
because parity is that section's subject. The co-design appendix now
describes the deployed app: two data modes, context panels beside six of
the ten controls, the CHANGED badge and rationale field, three widgets,
the twelve-file packet with its run file, and the one-command local serve
from a static bundle. Its invitation questions were updated so they no
longer ask for guidance features the app now has, and its V1/V2 numbering
became "the current version" and "the next version" throughout.

**Redline 4, "data currency": gone.** Both instances (preface and m1)
read "Up-to-date data". The literal uses of "currency" survive where they
mean money: m2's identity derivation now says "a debt stock in currency
units" (hardened during the line edit for the same collision reason), and
m5's LIC-DSF table row means currency composition.

**Redline 5, the why-Explorer passage: leads with the analyst's time.**
Preface: "The Explorer runs that same economics on the web, built so your
time goes on the analysis rather than on moving numbers by hand," then
the four specifics as user benefits, with "it exists for four reasons"
dead. m1's longer version harmonized the same way.

**SovTech explainer, the recommendation asked for:** keep the appendix as
the single in-course home. It now opens with the deployed reality and
closes on the vision, the preface links it, and a second in-course page
would duplicate it. Where a short "What is SovTech?" page would earn its
place is the tealinsights.com hub, next to the training-hub page, where a
visitor arrives without the course context; that is site copy, outside
this lane.

### 2. CC-20b folded in

The four DRAFT FOR TEAL blocks Run 12 section 8 flagged as stale now
describe the deployed app, markers kept: m1's self-check answer 4 teaches
the interest-rate approach control ("run all three and report the spread")
instead of "in V1 it sits at the Excel default"; the kitchen analogy's
seasoning names the full sidebar (demography variant, growth assumptions,
interest-rate approach, debt target, fiscal rule, rigidity); m2's answer 2
names the demography variant as the one handle on employment growth; m4's
sanity check names both vintages ("Current mode runs WEO April 2026,
Verified mode runs the workbook's own October 2024"). The re-read set
(m0:115/124, m4:252, m6:73/76/132) was re-read by both structural readers
and the m4/m6 fixers: no stale app claim found; the workshop-era published
numbers stay because they are real published figures. The one number that
drifted across chapters was standardized: the Uganda headline gap is
"about 18.5 percentage points" in course voice everywhere (66 minus 47.5),
with the Statement's own "over 18" kept where the Statement is quoted.

### 3. Pass 1, structural: two whole-book readers, 41 findings, reconciled

Two independent readers each read all eleven files start to finish (18 and
23 findings, heavily convergent). Applied, the highlights:

- **Scenario names now match the app's dropdown, verified live this run:**
  "Paris-Aligned (1.5°C)", "Moderate (2°C)", "High (4°C+)", "Hot (3°C)",
  "Hot + Adapted", "Hot + Unadapted". Prose forms without the plus sign
  and lowercase forms are normalized everywhere outside quotes; the
  Statement's "Vulnerable" stays in quotes and is now glossed at its one
  main-text use in m3. Both readers' top finding, the severity inversion
  in m1's scenario table (High (4°C+) carries +2.5°C while Hot (3°C)
  carries +3.5°C), is the workbook's own labeling: the table now says so
  and points the reader at the Warming column.
- **The three country counts are reconciled in one sentence** (m1): the
  workbook covers 197 economies, the climate dataset 171, the dropdown
  the 175 present in every input dataset.
- **m3 and m5 no longer say "production function"** after m2's own
  wording note ruled it out; both say growth identity.
- **m2's Kenya contradiction settled** ("converges on 50 and stays" vs
  three baselines ending at 51): Step 2b now says converges toward the
  target "and holds near it, ending at 51".
- **m4's mechanism restatement corrected** to m2's actual model: spending
  follows total population, revenue the working-age population, with
  productivity and inflation common to both sides.
- **m3's fiscal-rule answer aligned with the decided rule-on headline**
  (the Run 9 gate): rule-off is now "the honest sensitivity to show
  alongside the rule-on headline run", with the floor caveat crossref.
- **The chart toggle is called by its on-screen name**: the deployed app
  labels it "Chart view" with Workbook and Briefing options, so m4 says
  "the Briefing view" and the register-word collision with writing
  register is gone.
- Also: m5's duplicated positioning quote merged; the m1/m2 duplicate
  worked-year acknowledged with a one-clause callback; C-PIMA glossary-
  linked at first main-text use; FADCP attributed to the Fiscal Affairs
  Department at first use; "the app" normalized to "the Explorer" in
  prose; m6's workshop-materials tense and rubric-weight hedges landed;
  the export packet's Excel file is no longer called "the workbook".

Deliberately not applied, recorded: the both-ways promise stays orphaned
(preface objective 1 and m1's TODO callout both point at the workbook
material that does not exist; that is the C2 scope decision on Teal's
desk, and this run did not resolve it); m0 keeps its no-country-named
hook per the recorded gate; the preface keeps Teal's six-item limitations
frame while m5's opener now lists the User Guide's named six, because the
preface wording is Teal's own strengths-and-limitations pairing and the
two lists serve different jobs (overruling that is a gate question, not
an editor's call).

### 4. Pass 2, skimmability: 107 edits, two judges per file

Eighteen judges (two per file, blind to each other) and nine reconcilers.
The applied set is the audit's deferred B4 wave plus what the fresh eyes
caught: every label chapeau now carries its paragraph's point ("The
strengths." became "The strengths are coverage, speed and open
arithmetic."; "Where that stands." died and the gated parity sentence,
unchanged to the letter, took the bold; "The toy numbers.", "What to look
for.", "The scenario.", "What it is." all became carriers), deferring
chapeaus carry the summary they used to announce, and the two
question-shape section titles became claims ("Why start here" is now
"Q-CRAFT delivers value now and proves the approach"). The skim test on
the rendered book now passes on all nine content pages. The heading sweep
flagged only gated callout titles and quiz apparatus, which stand.

### 5. Pass 3, the line edit: 170 edits, two editors per module, receipts

Twenty-two editors (two per file, each calibrated on the Clearing the
Clogs final text and the full style guide before reading a word of the
course) proposed; eleven reconcilers applied what converged or what an
objective rule settled, resolving disagreements toward the concrete and
the shorter. 170 sentence edits landed. Semicolons are now zero in every
module (the four survivors are three sanctioned table cells and the
preface sentence that mirrors rule 13's own exemplar fix). The ten worst
sentences, before and after:

| # | Before | After | What was wrong |
|---|---|---|---|
| 1 | The structure buys three things and costs three, and the honest way to hold them is as a pair rather than as a caveat bolted onto a result. | The structure buys three things and costs three. Read the two lists together: the costs are part of knowing the tool, not a caveat to bolt onto a result. | Rule 13's canonical tic, in a chapeau |
| 2 | Transfer is the thing this course is actually for: recognising which situation you are in when the labels come off. | This course is training you to recognise which situation you are in when the labels come off. | Pedagogy jargon as abstract subject, plus filler "actually" |
| 3 | because they read the output and have to decide what it licenses them to say | because they read the output and have to decide what it lets them claim | "Licenses" beside three mentions of the MIT license: domain collision |
| 4 | Unfloored, they keep their full range, and the interpretive burden lands on you. This module is where that burden gets paid. | Unfloored, they keep their full range, and the interpretive burden lands on you. | "Paid burdens" read as debt service in a debt guide; the tail asserted nothing |
| 5 | The strengths and the limitations come out of that one design choice, and knowing it is part of knowing the model. | The strengths and the limitations follow from that one design choice. | "Knowing it is part of knowing the model": abstractions relating abstractions, "it" pointing nowhere |
| 6 | No movement on A and B with C3 achieved means you can drive the tool while the economics underneath it did not land, and that is worth a conversation rather than a shrug. | If C3 is true but A and B did not move, you can drive the tool while the economics underneath it did not land. That is worth a conversation rather than a shrug. | A five-noun subject that dies read aloud |
| 7 | ...the sentence for your write-up is that the run keeps the engine's global default and your country's record sits somewhere else, with the direction named. | ...write one sentence: the run keeps the engine's global default, and your country's record sits above it or below it. Name which. | An instruction buried inside reported speech |
| 8 | That ratio is the standard finding on expert time estimates for other people's learning. | That is the standard multiple by which experts underestimate other people's learning time. | Four stacked nouns, no actor, no direction |
| 9 | Revenue-to-GDP stays constant by assumption, because it grows with nominal GDP. | Revenue-to-GDP stays constant by assumption, because revenue grows with nominal GDP. | The pronoun made the sentence contradict itself |
| 10 | ...and both files carry the run manifest below the data, the same settings record the packet's run file restores. | ...and both files carry the run manifest below the data: the same settings record that the packet's run file restores. | A true garden path: every first read parses "record" as the verb |

**The rhythm held, with one honest miss.** The dose bands were measured
before and after with the writing-qa lane's prototype. index.qmd, the
flattest file in the book at the start (sentence-length CV 0.506), came
UP to 0.544; m1 rose 0.678 to 0.686; m0, m4, m5, m6 and references moved
less than 0.03 and stayed above band. m2 dipped below the 0.65 band when
long sentences were split and a targeted repair (ten splits of "and"
seams into short punches, nothing re-merged) brought it back to 0.655.
m3 went 0.653 to 0.603 in the edit and recovered only to 0.637 after
fifteen repairs: the honest finding is that m3's remaining mid-length
mass is parameter definitions and instruction steps that would lose
content if punched, so the number stands at 0.637 and is recorded here
rather than chased.

### 6. Verification

- `quarto render docs/companion-guide --profile brand` exits 0, then the
  default profile exits 0, in that order, zero warnings; no page in
  `_book` links `_brand-fonts.css`.
- The PDF is 119 pages, restored to the source mirror after the render
  deleted it (the known hazard), md5 `985f2fdd` identical both sides.
- Anchors: 48 unique internal reference and glossary links in the
  rendered book, zero dangling; all 13 `src-*` reference anchors present.
- Tics: zero em-dashes in every authored file; the two in the rendered
  HTML are Quarto's own appendix separators, unchanged. Zero banned
  strings. "ratio metrics only" four times, the parity claim verbatim
  everywhere it appears, both not-an-IMF-product callouts intact.
- Chapeau convention: 100 percent of main-flow paragraphs open bold in
  the preface and appendix, 72 to 96 percent in the modules, and every
  plain-open paragraph is a recognized exception (display math, figure
  lead-ins, quiz frames, one table source line). No run of three or more
  unbolded main-flow paragraphs anywhere.
- Skim test per module on the rendered book: PASS on all nine content
  pages. Recorded for a future wave, not defects: m4's Steps 3 and 7 and
  m6's closing sections are heading-only on the skim path because their
  content lives in checklists and callouts by design.
- The 8899 server was killed and recreated after the final render; cwd
  inode 215880197 equals the on-disk `_book` inode; all eleven pages
  HTTP 200 with this run's text confirmed served.

### 7. DRAFT FOR TEAL markers

23 in source, 23 in the render, same as Run 11 and Run 12. All 23 remain
Teal's to resolve; this run edited prose inside them to the same standard
as everything else and touched no marker.

### 8. Commits

Four: the redlines with the citation layer and pass 1 (`7cc6aca`), pass 2
(`f34602a`), pass 3 with the rhythm repair (`a934786`), and the anchor-
prefix fix with the render, the PDF mirror and this report.

---

## Run 12 (CC-20): the pre-publish batch, and the course now describes the deployed app

### Status

Done. Work order: the CC-19 writing audit's six sentence fixes (A1 to A6), the
approved C1 rewrite of the app-description layer against the DEPLOYED app, the
amplifier recomputation, and the unverified-claims tail. Every UI claim
written this run was checked against the live app at
https://teal-insights.github.io/QCraft-App/explorer/ (freeze-2026-08-29c) with
my own eyes before it went in, and nine evidence screenshots sit in
`review-screenshots/cc20-*.png`. Both profiles render clean, brand first and
default last, so the committed `_book` is the default profile's output. The
PDF is re-mirrored at 119 pages and md5-identical across source and `_book`.
The 8899 server was killed and restarted onto the new `_book` and its cwd
inode verified against the directory on disk (215734351 both sides); all
eleven pages serve HTTP 200 with the new text. DRAFT FOR TEAL blocks were
left untouched throughout, per the operating contract; section 6 lists the
ones that now carry stale app wording for the launch redline.

### 1. The deployed app, verified before writing

What the app actually ships, read from the live deployment and not from
memory or the audits: TEN sidebar controls in eight rows (country; demography
variant; a Growth assumptions group holding productivity start and long run,
inflation start and long run, and the interest-rate approach; a Fiscal policy
group holding debt target, fiscal rule, expenditure rigidity), all at engine
defaults (Uganda, Medium, 5.0/1.2, 5.0/3.5, constant nominal, 50, Yes, 1.0)
with a "Reset to engine defaults" footer. SEVEN tabs: Baseline, Analysis,
Climate, Data, Export, Methodology, About the data. TWO data modes with
Current the default (WEO April 2026 + UN WPP 2024) and Verified the workbook's
own data (WEO October 2024 + UN WPP 2022), switchable above the tabs. A
CHANGED badge, the printed engine default, and a one-line "Why this value?"
rationale field on any moved control, with the export annex recording what you
wrote or that you wrote nothing. CONTEXT panels (mode-stamped source records
with an "Add to the rationale" affordance) on six parameters, short notes on
the two judgment-only ones. Three teaching widgets linked in the header. A
Data tab with "Download this scenario (CSV)" and "Download all scenarios
(CSV)" over a grid that is entirely percent-of-GDP shares and rates. An
Export tab producing the twelve-file packet. A Workbook/Briefing chart
register toggle. No sidebar debt-or-population display of any kind.

The evidence, all captured from the deployed site at 1440x900:

| Screenshot | What it proves |
|---|---|
| `cc20-first-screen.png` | Current mode default, its WEO April 2026 + UN WPP 2024 banner, seven tabs, widget links |
| `cc20-sidebar-ten-controls.png` | The sidebar's top half: country through interest-rate approach, at engine defaults |
| `cc20-rationale-why-this-value.png` | The bottom half: fiscal-policy group, CHANGED badge, "Engine default: 1.0", the "Why this value?" field, "1 of 10 parameters changed" |
| `cc20-seven-tabs.png` | The tab bar, all seven names |
| `cc20-data-tab-downloads.png` | The two download buttons by exact label; the all-percent grid columns |
| `cc20-export-packet.png` | The packet: assumptions annex with rationale column, the twelve-file zip |
| `cc20-context-productivity.png` | A mode-stamped context panel: record, WEO-implied band, your assumption |
| `cc20-context-debt-target.png` | The debt-target record panel and its "Add to the rationale" sentence |
| `cc20-verified-mode.png` | Verified mode's banner: WEO October 2024 + UN WPP 2022, the workbook's data |

Two conditional behaviours were verified live rather than screenshotted:
selecting Syria in Verified mode raises the anchor-year notice above the
results, word for word as m2 describes it ("This projection starts from an
earlier year... anchored on 2010, the last year actually reported"), and the
Export tab carries the "Choose a run file" import that restores a
configuration. Both survive in the course unchanged because they are true.

### 2. The C1 rewrite, staged as approved

m3's app-description layer now teaches the deployed app in the approved
staging: the five core judgment calls first, the assisted layer second.

- "Four tabs hold everything" became "Seven tabs, and what each one is for",
  in the app's own tab order, with Export, Methodology and About the data
  described for the first time.
- "Q-CRAFT Explorer has five user-facing parameters" became "ten user-facing
  controls", grouped as the sidebar groups them, with the five core calls
  named as this module's five sections and the growth assumptions plus the
  interest-rate approach introduced as the assisted layer.
- "Productivity, inflation and interest rate assumptions are not exposed in
  V1" and "nothing you can set reaches the interest rate at all" are gone; a
  new section, "The assisted layer: growth assumptions and the interest-rate
  approach", carries the productivity and inflation record figures (moved
  from the overview), the interest-rate approach with m2's Kenya spread as
  the reason to care, and the rule that a moved default earns an annex line.
- "The Explorer is gaining interactive context panels" became the present
  tense, scoped correctly: source-record panels where a source has a view, a
  short note on the two judgment-only controls, three widgets in the header.
- The country section is mode-aware (Current = WEO April 2026 + UN WPP 2024,
  Verified = October 2024 + 2022), and its vintage-defence exercise now names
  Verified mode so the prompt and its draft answer agree.
- The rationale story is now literal: the module opens on the app's own
  record-making ("CHANGED badge... Why this value?... the annex prints all
  ten either way"), and Document-it entries point at stamps the packet
  actually carries.
- The m3 map lights six nodes (interest rate included, since the approach
  control reaches it) and its caption says "the three numbers they move";
  the m3-controls figure was rebuilt in `build_exhibits.py` to the ten-control
  sidebar, five numbered judgment-call chips and three assisted rows wired to
  all three numbers, replacing a figure whose own aria-label said "Nothing
  you can set in V1 reaches the interest rate."

m1's echoes were corrected in the same pass: the three-numbers table's last
column now names what each number's controls actually are, "V1 exposes five
controls" became ten with every control landing on one of the three numbers,
the base-machine summary excludes only rigidity, and the ten-minute run's
step 2 (the retired sidebar-context read) became "leave every control at its
engine default, and read the data banner", with the debt sanity check moved
to the Baseline tab's shaded WEO band where the number actually lives. The
ten-minutes figure's Sidebar panel and footer were regenerated to match. m2's
echoes too: "the Explorer's V1 does not put it in the sidebar" became the
interest-rate approach control with "run all three approaches and report the
spread", and the five-controls counts became nine-of-ten with rigidity
explicitly held for Step 3.

### 3. The amplifier fix (A1), recomputed

From the module's own worked example (start 60 percent of GDP, factor
1.08/1.06, borrowing 1 point a year), recomputed mechanically this run:
year-1 amplifier 1.1321, year-2 1.1723, year-3 1.2133, cumulative 3.5177
against borrowing's 3.0, total rise 6.5177 (table: 62.1, 64.3, 66.5, all
check).

- Before (m2): "Borrowing contributes exactly 1 point a year, every year. The
  amplifier contributes 1.1 points in year one and 2.2 by year three."
  The 2.2 was the TOTAL year-three rise including borrowing; no reading of
  "the amplifier" makes it 2.2.
- After: "Borrowing contributes exactly 1 point a year, every year. The
  amplifier contributes 1.1 points in year one, 1.2 in year three, and 3.5
  points across the three years against borrowing's 3.0."
  Per-year and cumulative, each said exactly, and the cumulative framing now
  proves the section's own title.

### 4. The six sentence fixes (A1 to A6)

| # | Where | Before | After |
|---|---|---|---|
| A1 | m2 amplifier chapeau | "1.1 points in year one and 2.2 by year three" | section 3 above |
| A2 | m1 reason 1 | "The Explorer carries current bundled data, October 2024 as this is written" | "two data modes: Current, the default... WEO April 2026 as this is written, and Verified... the workbook's own WEO October 2024" |
| A3 | m1 run step 2; m3 country "How to set it" | "Read the sidebar context. It shows the latest WEO debt-to-GDP ratio and total population" (no such display exists) | step 2 reads the defaults and the mode banner; the debt sanity check reads the Baseline tab's shaded WEO band and the Data tab's grid, which is where the number lives |
| A4 | m4 step 6 | "Download Baseline CSV" / "Download All Scenarios CSV"; "All values are in billions of local currency units, except ratios" | the shipped labels "Download this scenario (CSV)" / "Download all scenarios (CSV)"; "Every column is a share of GDP or a rate, in percent", with the run manifest noted |
| A5 | m2 | m0 promised a fast-path marker in every module; m2, the longest, had none | m2 now carries a Fast path callout after its objectives ("No route skips this module..."), which also closes the learning audit's F-19; m0's sentence is now simply true |
| A6 | m6:149 | "the IMF's own evaluation of capacity development found..." (uncited, conflating the independent IEO with a self-evaluation) | "the IMF's independent evaluators found that training with hands-on follow-up sticks while the standalone workshop decays (IEO, 2022)", with a full references entry for IEO (2022), *The IMF and Capacity Development*. Pinned via the Drive pedagogy project (2026-07_IMF-CD-Pedagogy), whose research log and toolkit cite that evaluation for exactly this finding. Closes CC-17's F-32. |

### 5. The unverified-claims tail

Pinned where a source exists on disk, softened where none does:

- **m4 equator claim** ("Countries closer to the equator generally show larger
  GDP losses"): softened. Nothing on disk supports the geographic
  generalization (the User Guide's text was searched; the Kahn NBER working
  paper on disk says effects "vary significantly across countries" and its
  own conclusion cuts the other way). Replaced with the pinned mechanism
  (pooled response rate, country-specific warming path and norm, Step 3b of
  m2) plus the on-disk Uganda comparative (C-PIMA summary: milder than other
  sub-Saharan African countries).
- **m2 grid-cells detail** ("CMIP6 projections for your grid cells,
  population-weighted"): softened to "Country-level CMIP6 projections for
  your emissions pathway", which is what the module's own FADCP description
  two paragraphs up says and what the sources on disk support.
- **Glossary LIC-DSF**: the composite-indicator mechanism (no source on disk)
  dropped; the entry keeps the framework and the thresholds at the level the
  course can stand behind.
- **Glossary DIGNAD**: "substantially more parameters" (unverifiable) dropped;
  complexity now stated as what the model class itself implies against
  Q-CRAFT's single recursion.
- **C-PIMA universal-annex overclaim** (glossary and references, CC-17's
  F-16): scoped to the evidence: "C-PIMA engagements can include... Uganda's
  2024 assessment reports one such analysis."
- **Kahn references annotation** ("7-13%" with no reference case, F-70):
  re-anchored to the abstract on disk: "a persistent temperature rise of
  0.04°C per year, absent mitigation policies... more than 7 percent by 2100."
- **Appendix roadmap as existing** (CC-17's F-33): the LIC-DSF chain reworded
  to the aspiration the appendix's own diagram already labels a goal; "five
  user-facing parameters" became ten.
- **"Grant-funded"**: dropped (no funder named anywhere on disk); the
  sentence keeps "MIT-licensed open source".
- **m6 Day 3 / Week 2 forward commitments**: softened to "designed into the
  course" and added to the existing workshop-materials TODO, so the promise
  and the artifact list agree.
- **Mode-aware data entries**: the glossary WEO entry, the references WEO and
  UN WPP entries, and m6's capstone brief ("the WEO vintage it ships with")
  all went mode-aware, since the app's default vintage is April 2026 and the
  old sentences taught October 2024 as the only data.

NOT touched, with reasons: m3's debt-target starting points and rigidity
bands (self-flagged as non-authoritative analyst guidance; the audit filed
them under (b)/(c), not the (a) list, and rewording them is claim wording
beyond the specified fixes, so they wait for Teal); the m5 floor-asymmetry
material (already corrected by run 11 per F-1); the both-ways promise (C2
scope decision).

### 6. Beyond the audit list: what the eyes-on pass and the adversarial sweep caught

The audits' stale-app cluster understated the depth of the five-control
story. Found this run and fixed, each verified against the live app first:

- The course-map "controls" node said "five, in the sidebar" and listed the
  old five, in every one of the eleven map placements. Fixed in
  `build_course_map.py`; all variants regenerated.
- The m2-interest-rules figure caption said the rule "is the one the Explorer
  does not yet expose."
- The param-productivity and param-inflation figures titled their defaults
  "V1" in subtitle and caption; the country-context figure's subtitle sent
  the sanity check to "the sidebar figure". All fixed in
  `build_parameter_context.py` and regenerated.
- m2 taught that employment growth "arrives with the country. Nobody sets
  it", while the demography variant is a settable control; that its Data-tab
  self-check could compare employment growth across exported runs (the export
  carries no employment column); and its desk action asked readers to "read
  off" nominal growth and the effective interest rate, which no per-country
  surface displays. All three rewritten to what the app actually shows.
- m4's target-format table sourced the productivity channel to the Climate
  tab and balance-by-scenario to the Analysis tab; neither lives there. The
  cells now route to the deviation chart, m2's mechanism, and the exported
  results.
- m4's Baseline-tab walkthrough placed charts "top / bottom left / bottom
  right" (they are stacked first/second/third) and called the shaded band
  "the historical period" (it is the WEO record AND forecast).
- m4's Climate-tab description turned out to be register-dependent: the
  Briefing register (default) shows one deviation chart, and the Workbook
  register shows exactly the two charts the old sentence described. The
  rewrite now names both registers, verified in the live app.
- m6's capstone brief assumed a single shipped vintage.
- The m4-fan-readings caption said "on its current bundled data", which now
  reads as Current mode; it names WEO October 2024, which is what the
  golden-master run behind the figure actually uses.

The adversarial sweep (92 agents: per-file claim sweeps against the verified
fact sheet, skim tests, a style pass over the diff, then a refute-first
verification of all 74 raw findings) confirmed 18, of which 14 were real and
fixed (the m2/m4/m6 items above, the figure subtitle, and four semicolon
splices in this run's own new sentences, all reworded to periods per rule 9).
The other four confirmed findings were checked by hand and stand as written:
the anchor-year notice and the run-file import exist (verified live, Syria in
Verified mode and the Export tab), the scenario names match the app's own
dropdown, and the appendix parity wording is the gated wording. 56 findings
were refuted by the verification pass, which is what it is for.

### 7. What the skim test flagged and this run did not fix

The five-module skim test passes on m6 and carries the argument on the rest,
but it confirmed the writing audit's texture finding in situ: label chapeaus
("The toy numbers.", "What to look for.", "Reading the chart.") and deferred
chapeaus concentrated in m2 and m4, plus m1's "Where that stands." These are
the audit's B4 redline work, explicitly assigned to the reformat wave rather
than this batch, and none of them is a factual defect. Left for the wave,
with the skim results recorded here so the wave starts from evidence.

### 8. DRAFT FOR TEAL blocks now carrying stale app wording

Left untouched per the operating contract; these want attention when the
launch message resolves the blocks:

- m1:335 (self-check answers): "In V1 it sits at the Excel default" — the
  interest-rate approach is now a sidebar control.
- m1 kitchen analogy: names four seasonings where the sidebar has ten
  controls.
- m2:424 (step self-check answers): working-age population "not something
  anyone in the room chose" — the variant is a choice.
- m4:178 (sanity check applied): "the Explorer ships October 2024" — true of
  Verified mode only.
- m0:115/124, m4:252, m6:73/76/132: workshop-era numbers (66 percent, Hot)
  and 2099 framings that are fine in themselves but should be re-read when
  the rubric and answer blocks are resolved.

### 9. Verification

- `quarto render docs/companion-guide --profile brand` exits 0, then the
  default profile exits 0, in that order; no unresolved cross-references; no
  page in `_book/` links `_brand-fonts.css`.
- The committed PDF is 119 pages, md5-identical across source and `_book`,
  and every rewritten sentence spot-checked is in the PDF text layer.
- Tics sweep: zero em-dashes in every authored `.qmd` and generator; the two
  in the built HTML are Quarto's own appendix separator, unchanged from run
  11's record. Zero banned strings. The four semicolon splices this run
  introduced were caught by its own style pass and removed.
- Chapeau bolding intact: new paragraphs open bold, callout bodies and
  figure read-outs stay plain, and no mid-paragraph emphasis bolds were
  added, so the compensation rule holds.
- Figure regeneration is deterministic: unchanged figures rewrote
  byte-identical (git shows only the intended files modified).
- The 8899 server: killed and restarted after the final render, cwd inode
  215734351 verified equal to the on-disk `_book` inode, eleven pages HTTP
  200 with the new text served.

### 10. Commits

Three commits: the course prose and reference fixes, the figure scripts with
their regenerated artifacts, and the render with the PDF mirror, the cc20
evidence screenshots and this report.

## Run 11 (CC-18): the audit micro-fix batch, and the chapeau call applied

### Status

Done. Two commits: `c989343` (the triage (a) corrections) and `7840c1f` (the
chapeau bolding), plus the PDF mirror and this report. Work order: the CC-17
learning audit's triage section (a), exactly, with three items the launch
message pulled in by name (the F-1 correction unconditionally, the glossary
anchors-and-links core of F-7, and the F-23 sentence-order fix), plus the
confirmed chapeau bolding with its compensation rule. Nothing from the
reformat waves. The 18-item protect list held: no figure SVG or build script
touched, the answer-collapse discipline untouched, the parity figure's
wording untouched, both not-an-IMF-product callouts untouched.

**Battery.** `quarto render docs/companion-guide --profile brand` exits 0,
then the default profile exits 0, in that order, so the committed artefacts
are the open edition. Banned-tics sweep zero: no em-dash in any authored
file, the machine-detectable tic battery all zero, the semicolon count
unchanged at 7. DRAFT FOR TEAL count 23 in source and 23 in the render,
unchanged; Teal's voice pass remains a separate lane. The PDF is 116 pages,
md5 `e0c96521` identical across source and `_book`. The rendered site
carries zero old shinyapps URLs, five frozen-Explorer URLs, "ratio metrics
only" four times (three prose spots plus the parity figure that already
had it), a 2026-08-30 date on every page, and 14 glossary anchors with 12
live first-use links. The 8899 server was refreshed onto the new `_book`
inode; details in section 4.

### 1. The corrections, before and after

**F-1 (severity 4, the FAD-intent correction).** Four spots, motive replaced
with formula facts; the SHARED notes line 50 recorded this correction as owed.

1. m5, "The rule" callout. Before: "The asymmetry is intentional, because it
   avoids masking the full range of climate-scenario outcomes." After: "The
   asymmetry is the workbook's own construction: on its `Baseline` sheet the
   debt recursion is wrapped in a floor, `=IF((...)<0,0,(...))`, while the
   six scenario sheets carry the bare recursion, and the workbook records no
   reason for the difference."
2. m5, the collapsed draft callout. Before: "Why the asymmetry is a design
   choice rather than a bug. Flooring the climate scenarios too would
   compress exactly the range the tool exists to show. The choice preserves
   the spread and pushes the interpretive burden onto you." After: "What the
   asymmetry does to the chart. Flooring the climate scenarios too would
   compress the spread between them. Unfloored, they keep their full range,
   and the interpretive burden lands on you."
3. m4, the rule-off depth layer. Before: "@sec-m5-floor sets out the
   asymmetry and why it is deliberate". After: "@sec-m5-floor sets out the
   asymmetry and the reading rule for charts that touch zero". The formula
   quotes at m4 lines 130 to 135 are untouched, per the audit's must-not-break.
4. m2, the fiscal-rule depth layer. Before: "That floor asymmetry is a real
   feature of the tool and it is covered in @sec-m5." After: "That floor
   asymmetry comes from the workbook's own formulas, and @sec-m5 covers it."

Two judgment calls recorded. m2's "That asymmetry is deliberate" two
paragraphs earlier describes the fiscal rule applying only to the baseline,
a different asymmetry and a documented design, so it stays. And the reading
rule itself still lives inside m5's collapsed draft callout (F-74); hoisting
it is the audit's G5 lane and would touch a callout Teal has not reviewed,
so m4 now routes to it and the hoist waits for the wave.

**F-2.** "only" inserted after "ratio metrics" at index 48, m1 354 and
appendix 31, restoring the gated wording verbatim. The explanatory clause
after m1's sentence kept; the parity figure already carried the word.

**F-4.** Five URL swaps, `tealinsights.shinyapps.io/q-craft_explorer1/` to
`teal-insights.github.io/QCraft-App/explorer/` (the freeze deploy per
DEPLOY-REPORT): index Try-the-App, m1 ten-minute run, m2 predict-observe,
m4 Step 1, appendix.

**F-17.** `_quarto.yml` date "2026-03-17" becomes `date: last-modified`;
every page and the PDF now stamp 2026-08-30 and will track future edits.

**F-36.** m5's 25-economies cite moves from p. 20 to p. 19, where footnote
12 sits.

**F-35.** m4: "trade disruptions (User Guide, p. 5)" becomes "spillover
effects such as trade disruptions", no page cite. "Spillover effects" is
the Guide's own term, already used in m5's exclusions table; the familiar
phrase stays as the gloss.

**F-28.** "Deliberately conservative" dropped twice: the index heading is
now "The tool is broadly applicable and conservative by construction", and
m3's rigidity bullet reads "conservative by construction".

**F-58.** "(171 economies)" added at both headline uses of "runs for most
of the world" (index 48, m5 47). The number is the course's own m2 figure
for the FADCP dataset's coverage. Index 78's "covers most of the world"
left numberless on purpose: a third repetition of the same figure in the
preface would read as a drumbeat.

**F-60.** m3's map prose said three nodes; the build script lights five.
Now: "Five nodes are lit: the two data sources the country selection loads,
the controls you set on top of them, and the two numbers they move, growth
and the primary balance."

**F-27.** All seven "Wrapper:" heading prefixes deleted; the remainders
self-explain ("What you can now do", "The three steps in one breath", "The
whole course in six lines", "What you should have now").

**F-18, title half, with F-26.** The appendix qmd is retitled "Co-design
and the SovTech vision", which kills the doubled word and matches the index
link text that already said co-design. The machine-composed "Appendix A"
separator em-dash remains in that one page's title line; the
appendix-delimiter option is the half the audit itself deferred to the
reformat wave, and it is the only em-dash in the rendered book.

**F-49.** Six naked crossrefs at routing moments got m1-style parenthetical
glosses (the audit said at least four): m5's fast path ("read
@sec-m5-conservatism (the exclusions, and why the estimate is a floor)"),
m4's fast path (both refs glossed), and the three warm-up source lines in
m3, m4 and m5.

**F-14.** Five lines of CSS: `mjx-container[display="true"]` gets
`overflow-x: auto`, mirroring the `.math-block` treatment. Verified live
at a real 375px viewport on the rendered m2: body horizontal overflow fell
from 344px to zero, and the two worded display equations (470px and 694px
wide, the audit's exact cases) now scroll inside their own boxes.

**F-7, the anchors-and-links core.** All 14 glossary terms carry ids
(`#gloss-weo` and kin), and 12 first uses link to them per the jargon
table's link verdicts: debt-to-GDP ratio, the six warming scenarios, WEO,
fiscal rule and golden master in the preface; the debt dynamics equation,
primary balance, expenditure rigidity and C-PIMA in m0; the six scenario
names in m1; the interest-growth differential at its first exact use in
m2; DIGNAD in the appendix. The define, gloss and replace verdicts are
content additions and stay with the glossary-and-links wave. One deviation
recorded: the jargon table pins interest-growth differential's first use to
an m0 draft-callout title, which should not carry a link, so the link sits
at the first body-prose use of the exact term.

**F-23.** The three path rows now lead with the plain description and end
with the codes as a trailing parenthetical, for example "Common if you know
debt dynamics already and the tool is the new part (mostly A2/B2/C1 or C2)."

### 2. The chapeau call, applied

Bolded chapeaus course-wide per the reformat plan's recommendation, which
the launch message confirmed. 182 first sentences of main-flow paragraphs
are now bold; 101 paragraphs already opened with a bold label (the m2
Step 3 pattern the audit protects) and stand unchanged; one-sentence
figure handoffs and read-outs stay unbolded per the sanctioned exception.
The compensation rule demoted four mid-paragraph emphasis bolds (the
product name inside a preface sentence, "62.1 percent" and an inline
"fiscal rule" in m2, "SovTech" in the appendix) so total emphasis density
stays roughly constant; objectives verbs, callout titles, UI names and
structural labels keep theirs. Warm-up apparatus (the "From @sec-mN" source
lines and the answers parentheticals) is uniformly plain: three files had
it bolded by the first pass and one did not, and half-bolded parentheticals
read broken, so plain won. Glossary and references have no main-flow
paragraphs and were left alone.

**Verification was mechanical, not visual.** Stripping every asterisk pair
from the nine bolded files reproduces commit `c989343` byte for byte, so
the pass changed emphasis and nothing else. A depth-tracking scan confirms
zero changes inside any callout block, which is also why the draft-marker
count could not move. A per-module skim test (headings plus bold layer
only) passes on all nine pages; every weak spot it flagged is one of the
audit's pre-existing two carry-none and five deferring chapeaus (F-24,
wave b). One spot to glance at during the voice pass: m5's one-breath
paragraph now opens bold and also keeps its two label bolds, which is the
heaviest bolding in the book.

### 3. What was deliberately not done

Everything in triage (b) and (c): the journeys block, module numbering,
the glossary define-and-gloss additions, official-materials links, figure
typography, the mobile ToC, the promise-scope items, the F-74 hoist, the
appendix delimiter, and the F-24 chapeau rewrites. The C-PIMA
universal-annex sentence in the glossary (F-16) was left even though the
anchors pass edited that file, because it is a wording-scope call in the
promise-scope lane.

### 4. The serving hazard fired, as recorded

Quarto's render deleted and recreated `_book`, and the 8899 server kept
the dead directory: its cwd inode read 214816837 against the new
directory's 215584535, exactly the stale-cwd hazard in the reference
notes. The `qcraft-serve` tmux session was recreated (respawn-pane killed
the pane without restarting it on this tmux, so a fresh `new-session` was
used); the server now runs from the new inode and a content probe confirms
it serves this run's edition. Second hazard for the next run: the render
also deletes the tracked source-side PDF, because the committed copy
shadows the output name; it was restored from `_book` and the md5 matches.

---

## Run 10 (CC-12): the section-title pass

### Status

Done. No decision came back to me: every call in this pass was resolvable from
rule 3's amended heading clause, rules 10 to 12, and the sidebar-is-a-map
standard in the reference notes. Four judgment calls I resolved rather than
escalated are recorded in section 6, because each one is a place a reader might
have expected a change and did not get one.

**The count.** 308 heading-surface strings inspected across eleven `.qmd`
chapters and the three exhibit generators. 34 flagged, 9 refuted on
verification, **25 headings and figure titles rewritten**. A further 25 body
prose spans were fixed in the light-touch sweep, plus 3 docstring index lines
kept in step with the titles they describe. 53 edits in total.

**Battery.** `uv run pytest` passes, 215 tests, the same count as run 9.
`quarto render docs/companion-guide --profile brand` exits 0, then `quarto
render docs/companion-guide` exits 0, in that order, so the committed artefacts
are the default profile's output. The two profiles were diffed page by page and
differ by exactly one line, the `_brand-fonts.css` link, and no page in `_book/`
links it. The course source carries zero em-dashes. The PDF is 116 pages, one
fewer than run 8, which is the prose sweep removing clauses rather than
anything dropping out.

**Method.** The sweep was run as two workflows, 113 agents. Every finding was
checked by three independent verifiers on separate lenses (does the original
really carry a banned shape; does the rewrite still describe what is in the
section; is the rewrite itself clean), and a finding needed two of three votes
to survive. That is what killed the nine: they were headings that merely joined
two different facts with "and", or stated a real comparative, which is not the
tic.

---

### 1. What the ban actually catches

Rule 3's heading clause is now absolute and the load-bearing exception is void
in a title. That is a narrower instrument than it first looks, and getting the
boundary right was most of the work. Three shapes are banned in a heading:

1. **Negative parallelism.** "X is not A, it is B", "X, not Y", "X does, Y does
   not". Requires an explicit negation.
2. **Rhetorical reveal.** Setup then payoff: "X, and the X is Y", "X, and only
   Y", teaser titles that name a thing without saying what it is, and question
   titles.
3. **Rules 10 to 12.** Appended-judgment tails, participle taglines, and
   compound assertion-amplification where the second clause is the first one
   escalated.

What is **not** banned, and what I therefore left alone in 230 headings: a plain
negative claim with no second half ("This is not an IMF product"), a real
measured comparative ("The baseline claim is wider than the climate claim"), and
an "and" joining two genuinely different facts ("Four tabs, and what each one is
for"). Rule 12's own wording is explicit that legitimate "and" joins two
different facts, so a heading is not guilty by shape alone.

---

### 2. The headings, before and after

Seventeen in the chapter sources.

| File | Before | After |
|---|---|---|
| `index.qmd` | Two surfaces, one model | The workbook and the Explorer run the same model |
| `m0-start-here.qmd` | Self-assessment: which of these describes your Monday? | Self-assessment: your starting point in three areas |
| `m1-how-qcraft-thinks.qmd` | Prefer it in numbers? One year of the debt dynamics equation | In numbers: one year of the debt dynamics equation |
| `m1-how-qcraft-thinks.qmd` | Prefer it in numbers? The growth decomposition | In numbers: the growth decomposition |
| `m1-how-qcraft-thinks.qmd` | Prefer it in numbers? Why the expenditure formula multiplies | In numbers: why the expenditure formula multiplies |
| `m1-how-qcraft-thinks.qmd` | DRAFT FOR TEAL: prefer it as a kitchen? The same chain, in an analogy | DRAFT FOR TEAL: the same chain as a kitchen analogy |
| `m2-debt-equation.qmd` | One year forward, and only half the movement is borrowing | One year forward: the amplifier adds more than the borrowing |
| `m2-debt-equation.qmd` | Going deeper: why the rule matters more than it looks | Going deeper: what the fiscal rule adjusts, and where it applies |
| `m2-debt-equation.qmd` | Three questions, and each one is a step | Three questions, one per step |
| `m3-parameters.qmd` | The assumption nobody wrote down | Why parameter choices need a written record |
| `m3-parameters.qmd` | Five controls, and four of them shape the projection | What the five controls do |
| `m5-boundaries.qmd` | The question that comes after the presentation | A senior official asks whether the fan chart shows the cost of climate change |
| `m5-boundaries.qmd` | The baseline floors debt at zero and the climate scenarios do not | Only the baseline floors debt at zero |
| `m5-boundaries.qmd` | Two countries, same chart, different problem | Diagnosing two countries with similar debt paths |
| `m5-boundaries.qmd` | DRAFT FOR TEAL: why this exercise and not a worked comparison | DRAFT FOR TEAL: why the search is the exercise |
| `appendix-codesign.qmd` | The real barrier: ergonomics, not economics | Ergonomics is the biggest barrier to using fiscal projection tools |
| `appendix-codesign.qmd` | A modular engine, multiple interfaces | One engine powers three interfaces |

Eight figure takeaway titles, which stay claim-style and are regenerated from
`scripts/build_exhibits.py`.

| Figure | Before | After |
|---|---|---|
| `m0-paths` | No path skips a module, and the faster ones read three in part | Every path reads every module, the fast path three of them in part |
| `m1-ten-minutes` | Six moves, and the last one is already capstone material | Six moves produce a projection and two capstone CSVs |
| `m2-equation-growth` | Climate damage changes one symbol, and the symbol is g | Climate damage enters the equation as a smaller g |
| `m2-growth-stack` | Growth is an accounting identity, and its first term is demography | Demography is the first term in the growth identity |
| `m2-interest-rules` | Three rules for r, and they disagree about the end of the century | The three rules for r disagree about the end of the century |
| `m4-seven-steps` | Step 3 is a gate, not a step | Step 3 gates every step after it |
| `m4-fan-readings` | Three readings, and the second one moves a conversation | The threshold crossing is the reading that moves a conversation |
| `m5-exclusions` | One channel is modelled, six are not, and all six point the same way | One channel is modelled, and the six left out all point the same way |

Every new title sits inside the length envelope the shipped titles already
established: the longest is 68 characters, against a previous longest of 67, so
nothing risks the 680px banner at font-size 15.

**One accuracy fix rode along.** `m0-paths` said "the faster ones read three in
part". The figure's own route table has the Standard path reading one module in
part and the Fast path reading three, so the plural claim was wrong. The
replacement names the fast path.

---

### 3. The one that had to move together

`m2-growth-stack`'s title and its standfirst were making the same point twice,
and the figcaption closed on "Demography is not a detail here; it is the first
term", which is the banned frame, a semicolon splice, and an echo of the
sentence before it, in nine words. With the title now stating "Demography is the
first term in the growth identity", that sentence had no work left, so it is
deleted rather than reworded. The caption keeps the half that carries new
information: the whole of the difference in the final bar is the working-age
population.

The `_course-map-m2-base` caption moved for the same reason: "The warming block
is not missing from this drawing, it has not been built yet" is the exact
"not A, it is B" comma-spliced frame, and the correction survives intact as "The
warming block is absent from this drawing because it has not been built yet."

---

### 4. The skim test

Run per touched module, on headings plus topic sentences alone, after the
rewrites. All six pass. Two weak points are worth knowing, both of which the
test found and neither of which is a regression:

**`m3` line 48.** "What the five controls do" is a better map entry than "Five
controls, and four of them shape the projection", but the old heading carried a
fact the new one hands to the body, and the topic sentence under it ("Q-CRAFT
Explorer has five user-facing parameters") does not pick it up. The one-loads,
four-shape split now reaches a skimmer only in sentences two and three. Fixable
by promoting that split into the topic sentence; I did not, because it is a
prose rewrite the brief did not ask for.

**`m5` line 104.** "Only the baseline floors debt at zero" rests the whole
asymmetry on the word "Only", and the callout rule beneath it states the
baseline half first. The climate half is in that callout's second sentence,
which a strict heading-plus-topic-sentence skim never reaches. The section is
still correct and the figure carries it; it is a half-beat later than it was.

---

### 5. The prose sweep

Twenty-five spans, light touch, conservative. The rule here is unchanged: in
prose the load-bearing contrast keeps its frame. This course leans hard on
"rather than" (floor rather than central estimate, comparison rather than
forecast) and every one of those was left alone. What went was the filler:
appended-judgment tails (", and that is itself a finding worth reporting"),
assertion-amplification (", and it is usually the largest single lever"), a
self-certifying tail (", and it holds here"), a rule 6 question-answer
("**How much of the 49 points is the rigidity assumption?** A lot"), and two
throat-clearing frames.

Two are worth naming because they changed a claim rather than a cadence:

- `m2` line 216 dropped ", and the number is bigger than most readers expect".
  That withheld the number while telling the reader how to feel about it, and it
  presumed what the reader expects, which the course tone rules out.
- `m2` line 417's "is the whole story, and it is a third of a point of GDP a
  year" had a referent slip: the third of a point is the gap, not the running.
  The single clause now says so.

The appendix paragraph under the rewritten heading was the one place a heading
change forced a prose change. It had stated the same contrast three times in
three sentences, twice in the banned frame. It now reads: "The economics is not
what stops people. Smart people struggle because the tools do not guide them
through the decisions they need to make."

---

### 6. Four things I did not change, and why

**"This is not an IMF product"**, in both the preface and the appendix. A plain
negative disclaimer with no "it is B" half, so it is not the banned parallelism,
and the reference notes record your instruction that it be prominent in exactly
those two places. Same for "This appendix is not part of the course".

**The three "What X has actually done" parameter-context figure titles**
(productivity, inflation, spending against GDP). A verifier flagged these as
teaser titles and proposed claim-style replacements grounded in the plotted
series, for example "Most of the record sits above the 1.2 percent default". I
rejected all three. `m3-parameters.qmd` line 66 says, deliberately: "Neither
figure tells you the default is wrong. Both tell you what it is averaging over."
A banner asserting the record runs above the default is the course telling you
the default is wrong, which is the honest-broker stance inverted. The family is
a descriptive label on a source-record exhibit and the takeaway is left to the
reader on purpose. This one is yours to overrule if you disagree.

**"Comparison exercise: same path, different drivers"** (`m5` line 136).
Unanimously kept, 0 of 3 for changing it, even though its parent heading two
lines up did move. It is a callout title, not a section heading: it takes no
anchor and never enters the sidebar, so the map standard governs line 131, which
is fixed. It contains no negation and withholds nothing, and "drivers" is the
body's own term.

**"The interest rate never hears about the weather"** (a course-map caption) and
**"No new equation, no new term, two arrows"** (an in-figure note). Both flagged
at low confidence for register rather than shape, with flattened replacements
proposed. Neither is a banned shape, and the flattening cost more voice than the
cadence cost. Left as written.

---

### 7. Two things to know

**The built appendix HTML carries two em-dashes, and they are Quarto's.** The
course source is clean, 0 across every `.qmd` and every generator. The two in
`_book/appendix-codesign.html` are inside Quarto's own appendix-numbering
separator, which joins "Appendix A" to the chapter title with an em-dash in
both the `<title>` and the `<h1>`. The chapter title itself is untouched by this
pass. If a zero-in-the-build gate is ever wanted for the course the way
`freeze-check.sh` does it for the app bundle, this is a `crossref:
appendix-title-format` setting rather than a copy fix.

**The PDF's tracked copy needs replacing after every render.** Quarto writes the
book PDF to `_book/` and consumes the tracked copy at
`docs/companion-guide/Q-CRAFT-Explorer-Companion-Guide.pdf` in the process, so
it shows as deleted until it is copied back up. Copied back and verified: 116
pages, and pypdf confirms every rewritten heading is in the PDF text, not only
in the HTML. The eight figure titles are not text-searchable in the PDF because
they ship as rasterised PNG there; they were verified in the HTML instead, where
they are inline SVG.

---

### 8. The server

`localhost:8899` refreshed and reachable, all nine pages HTTP 200 with the new
text. This needed an actual restart rather than a re-render. Quarto recreates
`_book/` rather than writing through it, so the running `http.server` was
holding a cwd handle on the deleted inode (214683937) while serving the new
content by path string. That is the stale-server hazard the reference notes flag
twice, and `lsof -a -p <pid> -d cwd` is what showed it. The `qcraft-serve` tmux
session was recreated with the server's cwd now matching the live `_book` inode
(214816837).

---

## Run 9 (CC-10): the course on the frozen engine

### Status

Done. One decision came back to me during the run and is settled from the
workbook rather than from preference: section 7.

The frozen engine is merged. Every computed number in the course has been
regenerated against it, the five SCREENSHOT-TODO placeholders now carry real
annotated captures of the frozen build, the gate-resolution riders are in, and
both profiles render clean.

**Battery, after the merge.** `uv run pytest` passes, 215 tests, which is the
count CC-8's freeze report gives for the same suite. `quarto render
docs/companion-guide --profile brand` exits 0, then `quarto render
docs/companion-guide` exits 0, in that order, so the committed artefacts are the
default profile's output and no page in `_book/` links `_brand-fonts.css`. The
two profiles were diffed page by page and differ by exactly one line, the
`_brand-fonts.css` link, which is what the brand profile's own header claims and
is now checked rather than assumed. The PDF is 117 pages, four more than run 8, and pypdf confirms the new text in it rather than only in the HTML.

Three commits. The course source carries zero em-dashes and zero uses of "toil".

**One number to know.** The pre-fix understatement was real but smaller than the
orchestrator's estimate for this course's country. Kenya's headline gap moves
48.00 to 48.81 points of GDP, not roughly 2 points. The estimate was a general
one; Kenya's actual is 0.8. Nothing in the course depended on the larger figure.

---

### 1. The merge

`freeze-2026-08-29` merged into `feat/lane4-course` as `758c163`. The tag is
annotated, signed by you, and points at `7ec2002`. `~/GitHub/QCraft-App` was
added as a remote named `app` for the fetch and its push URL was then set to
`no-push-configured`, so the clone still has nowhere to push.

The merge base is `0fb5eb1`, the run-2 README rewrite. Two files conflicted and
both were resolved by hand.

`.gitignore` is a union. The two sides added distinct blocks that do not overlap.

`README.md` is resolved onto the freeze version, which carries the copy gates
CC-7 and CC-8 applied, with three restorations:

1. **The FADCP citation.** The freeze side had split scenario provenance (IPCC
   SSP pathways) from damage provenance (FADCP). That split is the more precise
   attribution and is kept. But it dropped the "building on Kahn et al. (2021)"
   tail, which is half of gate 2's short form. The tail is restored onto the
   split, so the README now contains the gated string verbatim.
2. **The two-modes material**, which the README carried nowhere. Worth flagging
   because the brief expected to find it there: the freeze README does not
   describe the mode switch at all, so this is new text rather than a rescue. A
   Key features bullet and a "Two data modes" section, with the parity sentence
   in its gated wording and the Current divergence note as written. Both are
   verbatim per gates 1 and 3.
3. **The course side's "Typography and reproducibility" section**, the dual-skin
   font strategy, which exists only on this branch.

The freeze side's de-em-dashed Architecture and Documentation bullets win over
the course side's em-dashed ones. `apps/qcraft-web` joins the Architecture list,
because the offline note and the new modes section both point at it and it was
not listed, and the component count follows.

---

### 2. What the fix actually was, and what moved

The fix is not in `climate.py`. It is in `data_loader.py`, in
`_build_climate_variation`: the labour-productivity shock is the year-over-year
PERCENT CHANGE of the climate GDP index, where it used to be the arithmetic first
difference of the index. Differencing index levels mixes dimensions, and the
error compounds over seventy projection years.

That has a consequence the number sweep nearly missed. M2's "Going deeper" block
described the engine as taking "the year-on-year first difference" of the index.
That sentence was an accurate description of the defect. It is now a wrong
description of the engine, and it is fixed.

**Only climate numbers move.** Every baseline number is unchanged, in every
series, which is what the fix predicts and is the strongest available check that
the regeneration did what it should.

Kenya, the chapter's spine, at the Explorer's shipped defaults:

| Year | Baseline | Hot, before | Hot, after | Gap, before | Gap, after |
|---|---|---|---|---|---|
| 2030 | 61.83 | 61.86 | 61.86 | 0.03 | 0.03 |
| 2050 | 50.40 | 53.05 | 53.08 | 2.65 | 2.67 |
| 2075 | 50.46 | 65.74 | 65.93 | 15.28 | 15.47 |
| 2090 | 50.88 | 82.91 | 83.40 | 32.03 | 32.52 |
| 2099 | 51.37 | 99.37 | 100.17 | 48.00 | 48.81 |

Rounded, that is the whole of the visible change: **48 points becomes 49**, and
the hot endpoint label **99% becomes 100%**.

**Artefacts regenerated.** Four of the seven series CSVs changed
(`m2-debt-paths`, `m2-climate-trace`, `m2-interest-rules`, `m2-rigidity-dial`);
`m2-climate-drag`, `m2-growth-parts` and `m2-primary-balance` came back
byte-identical. Three figures changed and updated their own titles and endpoint
labels from the CSVs: `m2-cold-open` (48 to 49 points, 99% to 100%),
`m2-equation-growth` (99% to 100%) and `m2-interest-rules` (99% to 100%, and one
rule's label 76% to 77%). Their PNGs were re-rasterised, without which the PDF
would have shipped the old numbers behind correct HTML.

**Prose numbers, all in M2, each checked against the CSV it is drawn from:**

| Where | Before | After |
|---|---|---|
| Cold-open sentence | Forty-eight points of GDP | Forty-nine points of GDP |
| Three interest rules, 2099 | end at 99, 69 and 76 | end at 100, 69 and 77 |
| Spread between rules | Thirty points of disagreement | Thirty-one points |
| Primary balance 2099, hot | 0.72 | 0.71 |
| Debt-stabilizing balance 2099, hot | needs 2.83, runs 0.72 | needs 2.86, runs 0.71 |
| Rigidity table, 1.0 | 99, 48 points | 100, 49 points |
| Rigidity table, 0.5 | 77, 26 points | 78, 26 points |
| Rigidity table, 0.0 | 55, 4 points | 56, 4 points |
| Rigidity attribution | Forty-four of the forty-eight | Forty-five of the forty-nine |
| Productivity growth 2099, hot | 1.144, difference 0.056 | 1.142, difference 0.058 |
| Debt gap at 2050 | 2.6 points | 2.7 points |
| Rigidity heading, and three more | 48 points | 49 points |

**A stale-data trap, found and closed.** `data/processed/` held a copy of the
frozen vintage from before CC-6 repaired Serbia's Parquet: SRB carried 1,020
climate rows, Kosovo's all-zero series concatenated with Serbia's, and it was the
only country in the file with a wrong row count. The course's figure scripts read
`data/processed/`, but the pipeline writes to `data/vintages/`, so a pipeline run
does not refresh it. It is now refreshed from `data/vintages/weo-2024-10`. Kenya,
Thailand and Uganda were byte-identical across the two copies, so no figure
moved, and the series were rebuilt on the fixed data and compared to prove it.

---

### 3. Screenshots

`scripts/build_app_screenshots.py` drives the frozen build at 2x and composes
each capture with an annotation layer in the exhibit palette from
`build_exhibits.py`, flattened into one PNG so the HTML book and the PDF carry
the same picture. Nothing in the underlying capture is retouched.

Every number in a callout or caption comes from `app-facts.json`, which
`scripts/build_app_facts.py` writes from the engine, and each is then looked up
in the app's own rendered label before it is drawn. A disagreement stops the
build. That check passes at every point, which means the run also verified the
frozen bundle against the Python engine at about twenty places, including
`47.0%`, `126.8%`, `39.1%`, `51.8%`, `46.6%` and the GDP index endpoint `972`.

The first pass of this script was wrong in three ways that only looking at the
output caught: the composition clipped because a 2x capture renders at twice its
CSS width; a callout labelled the Paris-Aligned line "baseline"; and the gap
bracket drew nothing, because an SVG `path` takes no percentage units. All three
are fixed, and the label-lookup check exists because of the second one.

**The course set**, in `docs/companion-guide/figures/screenshots/`:

| File | Placeholder it discharges | What is marked |
|---|---|---|
| `m1-analysis-gap.png` | M1, the early win | Baseline 47.0% and Hot Unadapted 126.8% named, and an 80-point bracket between them |
| `m2-baseline-reconciliation.png` | M2, Step 2 seam | Kenya's debt ratio beside its fiscal balances, with the deficit window and the ratio's movement in the caption |
| `m3-rigidity-compare.png` | M3, rigidity | Rigidity 1.0 against 0.0, each with a bracket giving its fan width, 88 points against 5 |
| `m4-baseline.png` | M4, Step 2 | The WEO period ending, the 2099 ratio, and the primary-to-overall gap |
| `m4-climate-index.png` | M4, Step 4 | The 2030 divergence, and a bracket giving the 5.9 percent level loss |

Four of them also exist as `-ruleoff` variants, for the reason in section 7.

**Two specification points I could not meet as written, and what I did instead.**
M3 asked for the same axis limits on both panels. The Explorer scales each chart
to its own data and I did not change the app, so the two axes differ and the eye
reads the two fans as more alike than they are. The bracket on each panel gives
the fan width as a number, and the note says the axes differ and to read the
brackets rather than the line heights. M4 asked for the six scenario lines
labelled on the data rather than in a legend. The Explorer draws that chart with
a legend and labels only the baseline endpoint. The annotation layer names the
spread instead.

**The deck set**, 26 clean unannotated captures in
`SHARED/screenshots-frozen/`, for lane 5: every tab in Verified mode at viewport
and full height (`tab-*.png`, `tab-*-full.png`, seven tabs including the export
flow); both modes on the Baseline tab and both mode banners (`mode-*.png`); both
chart registers (`register-workbook.png`, `register-briefing.png`); two coverage
notices, Zambia refusing and the Maldives with no climate estimates, each on the
Baseline and Analysis tabs; the anchor-year notice on Ecuador in both modes; and
the export flow at both heights.

The Ecuador pair is a correction to my own first cut, and the reason is worth a
line because it is the same class of mistake the course was carrying. Ecuador is
anchor-shifted on the CURRENT vintage only: its April 2026 series stops reporting
after 2025 while the release runs to 2029. On the frozen vintage it is an
ordinary country and no notice appears. The first pass captured it in Verified
mode, so the file named for the anchor notice did not contain one. Both modes are
now taken and the mode is in the file name.

---

### 4. The content riders

**The zero-climate citation, gate resolution 4.** M5's comparison exercise now
carries the User Guide citation the course version was always going to add: 25
economies named at footnote 12 on page 20, of which 14 never reach the dropdown
for want of productivity data, leaving the 11 the app notices. The wording keeps
the honest-broker register and the app's own distinction, that the gap is missing
data rather than an absence of risk.

**The anchor year.** The course described the WEO handover as a universal 2029 in
five places. It is each country's own last reported year: Syria hands over at
2010 and Ecuador at 2025 on the current vintage, both confirmed by driving the
app. Corrected in M1, M2, M3, M6 and the glossary. One proposed correction was
rejected during verification and is worth recording, because it would have been
wrong in a way that is hard to see: a country whose WEO series simply ends early
is not "anchor-shifted" and gets no on-screen notice, so a sentence promising the
reader a label would have sent them looking for something that is not there.

**The naming sweep.** "the debt equation" appears nowhere in the course. 33 uses
of "the debt dynamics equation" and zero of the banned form. The file is still
named `m2-debt-equation.qmd` and the section anchor is still `#sec-m2`, which is
correct: filenames and anchor ids are not prose, and renaming them breaks links.

**Two more, found while sweeping.** M3 said the Explorer covers 197 countries; it
offers 175 on each vintage, of which eight or nine refuse depending on the
vintage. And M4's comparison exercise sent readers to Zambia, which has refused
on both vintages by design since CC-6.

---

### 5. What the audit rejected

39 candidate findings were checked, each by an adversarial verifier told to
refute it. 29 survived and 10 did not. The rejections are the useful part: five
were anchor-year corrections that overreached, three were rule-12 false
positives, where a second clause adds real information rather than restating the
first one bigger, and two would have put the zero-climate citation somewhere it
does not belong. Five more survived only in corrected form, after a verifier
falsified the proposed replacement against the data. That is the check working.

The confirmed 29 break down as 14 stale engine numbers, 7 anchor-year, 4
rule-12, 1 zero-climate citation and 3 factual corrections that did not fit a
category, of which the "first difference" sentence in section 2 is one.

---

### 6. Three findings for other lanes

**The sub-zero note does not fire, and it should.** With Uganda's fiscal rule
off, the Analysis tab draws endpoint labels of `-473.6%` and `-523.4%` of GDP
with no sub-zero note attached. Gate 7's approved sentence is in the bundle,
`scripts/freeze-check.sh` confirms it, but it does not appear at these values.
This is app-lane work and the app is frozen, so it is reported rather than
touched.

**`data/processed/` is not refreshed by the pipeline.** Section 2. Anything that
reads it, rather than `data/vintages/`, can silently run on pre-CC-6 data. The
course was the only consumer I know of, and it is fixed here, but the shape of
the trap is general.

**Two Explorer defaults differ from the workbook's shipped ones.** From the
table in section 7: inflation start is 3.5 in the workbook and 5.0 in the engine
defaults, and the debt target is 60 in the workbook and 50 in the engine. Neither
breaks parity, which is verified at matched parameters rather than at each side's
defaults, but a user opening both at their defaults and comparing will see
different numbers for a reason that is not on screen. M4's own table sets the
target to 50 deliberately, for Uganda's Charter of Fiscal Responsibility ceiling,
and says so. The inflation start looks unintended. For the app or data lane.

**The README's Verification section still reads without "only".** Gate 1 added
"only" to the Verified badge. The README's prose paragraph says climate scenario
parity "is confirmed for ratio metrics ... across all tested countries and
scenarios". That paragraph came through the freeze unchanged and passed CC-7 and
CC-8's copy gates, so I left it alone: it is claim wording and it is yours, not
mine. Flagging it because the two now read differently.

---

### 7. The M4 headline run: asked, answered from the workbook

**Raised as a gate, and settled by the source rather than by preference.** Teal's
question was the right one: which setting is most consistent with the original
Excel version. It is answerable, and the answer is the rule ON.

**What the workbook ships.** `2024_IMF-FAD_Q-CRAFT-Tool-v10.xlsx`, Dashboard cell
`C33`, is `Yes`. The full shipped state, against the Explorer's engine defaults:

| Control | Workbook v10 | Engine default | |
|---|---|---|---|
| Demography | Medium | Medium | match |
| Productivity, start and end | 5, 1.2 | 5.0, 1.2 | match |
| Inflation, start | 3.5 | 5.0 | **differs** |
| Inflation, end | 3.5 | 3.5 | match |
| Interest rate | Nominal interest rate | Nominal interest rate | match |
| **Fiscal rule** | **Yes** | **Yes** | match |
| Debt target | 60 | 50.0 | **differs** |
| Expenditure rigidity | 1 | 1.0 | match |

**And the degenerate output is the workbook's own behaviour, not our defect.** On
the `Baseline` sheet the debt recursion at row 36 is
`=IF((AM36*(1+AN33/100)/(1+AN15/100)-AN22)<0,0,(...))`, a floor written into the
formula. On `Hot Unadapted` the same recursion at row 35 is
`=AM35*(1+AN32/100)/(1+AN11/100)-AN21`, with no floor. The floor applies whatever
the rule is set to, because the rule enters separately at row 42. So Excel with
the rule off would show the same floored baseline, the same scenarios running to
several hundred percent below zero, and the same inverted order. The Explorer is
reproducing it faithfully.

That makes the fidelity answer and the teaching answer the same one, which is the
comfortable case.

**Applied.** M4's table now reads "On for the headline run", with the rationale
that it is the setting the published workbook ships, so the headline run is one a
reader can reproduce in Excel, and the rule-off run named as the sensitivity. The
sanity-check box that told readers to skip the convergence question now asks it,
and notes that Uganda converges from below, so the rule is not binding on this
path. @sec-m5 needs no change: its sentence is true of the rule-on run, which is
now the run.

The DRAFT FOR TEAL is gone and its content is kept, converted into a collapsible
"Going deeper" note that shows what rule-off does and cites the two workbook
formulas. A reader who wonders whether rule-off is the more neutral choice now
gets the answer in place. The `-ruleoff` screenshots stay in
`figures/screenshots/` as the built evidence.

---

### 8. Marker counts

Counted as `^## DRAFT FOR TEAL` headings across the eleven chapter files, which
is reproducible with a grep.

| | Run 8 | Run 9 |
|---|---|---|
| DRAFT FOR TEAL | 23 | **23** |
| SCREENSHOT-TODO | 5 | **0** |
| WIDGET-TODO | 3 | 3 |
| Other `## TODO` | 6 | 6 |
| Collapsible callouts | 28 | 33 |

One was added and the same one was closed inside the run, so the count returns
to where run 8 left it. No pre-existing marker was closed, because closing them
is your call rather than mine, and none of them was about a number the engine fix
moved.

The three WIDGET-TODO markers are still waiting on the lane 2 widget integration
pass, which the reference notes put after lane 4 and run 3 both complete.

---

### 9. Reading it

The book is served on port 8899 from a tmux session named `qcraft-serve`, running
from `docs/companion-guide/_book`, which is the default profile's output:

    http://localhost:8899/

The frozen Explorer is on 8080 from `apps/qcraft-web/dist` in this worktree, if
you want to check a screenshot against the live thing:

    http://localhost:8080/

Both were checked with `lsof -a -p <pid> -d cwd` before anything was asserted
against them, which is the hazard the reference notes record twice.

Rebuilding the screenshots needs the Explorer server up first, then:

    uv run --package qcraft-engine python scripts/build_app_facts.py
    uv run --no-project --with playwright python3 scripts/build_app_screenshots.py

---

## Run 8: "The model, in three steps"

### Status

Done. Both profiles render clean: `quarto render docs/companion-guide --profile brand` exits 0, then `quarto render docs/companion-guide` exits 0, neither with a warning or an unresolved cross-reference. The brand render is taken first and the default render last, so the committed artefacts are the default profile's output and no page in `_book/` links `_brand-fonts.css` or bundles a Klim file. `uv run pytest packages/qcraft-engine/tests` passes, 198 tests. The committed PDF is 113 pages, fifteen more than run 7.

Six commits. Banned-tics sweep across all eleven `.qmd` files reports zero em-dashes, zero filler intensifiers and one semicolon, which is the compact table cell in M1 that rule 9 allows and that run 7 already cleared.

**The headline, because it was the gate.** The two sources check out, with four corrections to the framing in the run brief and one correction to the tool's own scenario labelling. Detail in section 1. Nothing in Step 3 was written before that section was finished.

---

### 1. The verification gate

#### What I could read, and what I could not

| Source | Status |
|---|---|
| Kahn, Mohaddes, Ng, Pesaran, Raissi and Yang, "Long-term macroeconomic effects of climate change", *Energy Economics* 104 (2021), 105624 | **Paywalled.** Unpaywall reports `oa_status: closed`, no repository copy, no embargoed copy. Published abstract read verbatim from RePEc. |
| The same paper, 2019 working-paper draft | **Read in full.** Downloaded two independent copies, both verified `%PDF`: Dallas Fed Globalization Institute WP 365 and NBER w26167. Filed in `source-materials/`. |
| Centorrino, Massetti and Tagklis (2024), "Climate Effects on GDP Growth: Updated Estimates of Kahn et al. (2021)" | **Not obtainable.** It is an internal FAD *Reference Guide*, not a working paper. No DOI, no eLibrary entry, no public URL. `imf.org` and `elibrary.imf.org` both return 403 to a scripted request with browser headers. |
| Massetti and Tagklis (2023, 2024), the FADCP Climate Dataset itself | **Not obtainable**, same reason. |
| Q-CRAFT User Guide v10 (Tim and Rahman, 2024) | **Read in full**, from `qcraft-v2-planning/reference/qcraft/`. Section IV and Box 4 are the authoritative account of what Q-CRAFT does with the estimates. |
| `packages/qcraft-engine/src/qcraft_engine/climate.py` and `fiscal.py` | **Read in full.** |

Neither paper was in Drive `03-RESOURCES/Interesting-Papers/` or in `qcraft-v2-planning/reference/`. The Kahn downloads are host-side GETs with browser headers, `%PDF` verified, and they are in `source-materials/` which `.gitignore` excludes, matching how the repo already treats source material.

So Step 3's claims rest on three legs: the 2019 working paper for mechanism and coefficients, the published 2021 abstract for the headline numbers, and the User Guide for everything about what the IMF did with them. Every claim in the chapter is attributed to whichever of those actually carries it. Where the working paper and the published article disagree, the chapter says so out loud, in a collapsible block, and tells the reader to cite the article.

#### Verified, and now in the chapter

- **174 countries, 1960 to 2014.** Working paper abstract and User Guide Box 4 agree.
- **The regressor is deviation from a trailing norm, not temperature.** Confirmed in the working paper, eq. (17): the regressors are the positive and negative parts of `T_it − T̄_i,t−1`, where `T̄` is an `m`-year moving average. The paper's stated reason is that temperature is trended in almost every country (statistically significant positive trends in 161 of 169), so a level term forces a trend into growth that the data does not show.
- **m = 30 is the default; 20 and 40 are the robustness checks.** Working paper section 3.3.
- **The response coefficient is pooled.** The panel ARDL has a country fixed effect `a_i` in the intercept and a single long-run coefficient on the climate variables. The User Guide states it plainly for the estimates Q-CRAFT actually uses (Box 4, p. 34): "The authors do not estimate country-specific impact of temperature on GDP. Rather, temperature projections vary between countries, leading to different GDP impacts." **Your framing was right and the chapter states it plainly.**
- **The coefficient.** 0.0543 percentage points off per-capita growth per year, for a persistent above-norm rise of 0.01°C a year, at m = 30 (Specification 2, HPJ-FE). 0.0504 at m = 20 and 0.0486 at m = 40. Precipitation deviations are not statistically significant in any specification and drop out.
- **Adaptation is the window width, and the paper does the algebra.** Equation (34) of the working paper gives the mean deviation under a linear warming trend `b` as `((m+1)/2) × b`. That is exactly the "how fast the norm catches up" mechanism, and it is the paper's own arithmetic rather than mine. A 30-year window leaves about 15 years' warming in the gap; a 50-year window about 25.
- **Impacts start in 2030.** User Guide p. 19, and `PROJ_START = 2030` in the engine.
- **Revenue-to-GDP unchanged, primary expenditure rigid in levels.** User Guide pp. 34-35 and `climate.py` phases 3 and 4. Verified in output: Kenya's revenue ratio is 19.809 in the baseline and in every scenario, to three decimals.
- **The drag enters as a cut to labour productivity growth and nothing else.** `climate.py` phase 1. Employment growth, inflation and the interest rate are copied from the baseline.

#### Five corrections

**1. There are two 2024 FAD reference guides, not one.** The brief calls the source "the IMF FAD Climate Dataset paper (Centorrino, Massetti and Tagklis, 2024)". The User Guide's reference list has two separate items:

- Massetti and Tagklis (2024), "FADCP Climate Dataset: Temperature and Precipitation", the temperature and precipitation data.
- Centorrino, Massetti and Tagklis (2024), "Climate Effects on GDP Growth: Updated Estimates of Kahn et al. (2021)", the GDP-impact estimates built on top of it.

The GDP numbers Q-CRAFT consumes are the second. The chapter names both and says which does what. The SHARED note's binding wording ("FADCP Climate Dataset, Centorrino, Massetti and Tagklis 2024, building on Kahn et al. 2021") is close enough to leave alone, but if you want it exact it should credit Massetti and Tagklis for the dataset.

**2. The published paper is not the working paper, and the difference is load-bearing in one place.** The 2019 drafts conclude that the findings "apply equally to poor or rich, and hot or cold countries". The published 2021 abstract says the opposite: "We also show that the marginal effects of temperature shocks vary across climates and income groups." The headline losses also change from point estimates (7.22 and 1.07 percent) to rounded language ("more than 7 percent", "about 1 percent"). The chapter quotes the published abstract for headline numbers, flags the disagreement in a collapsible block, and tells the reader to cite the article.

This matters for the pooled-coefficient claim, so I want to be precise about what I can and cannot support. What the User Guide says about the estimates *Q-CRAFT uses* is unambiguous and is what the chapter asserts. What the published article's own preferred specification does about income and climate groups I could not read. The chapter's wording is scoped to the tool rather than to the article: one pooled response rate in the estimates Q-CRAFT consumes, exposure country-specific, and the User Guide quoted for it.

**3. "Hot" is more severe than "High", and the app's labels say the reverse.** Hot uses the same SSP3-7.0 emissions as High and takes the 90th percentile of the climate models instead of the median (User Guide p. 18). Confirmed in the bundled data: Kenya's 2099 shortfall is 1.94 percent under High and 4.20 percent under Hot. But `apps/qcraft-app/constants.py` labels them "Hot (3°C)" and "High (4°C+)", which reads as Hot being the milder of the two. **That is a live defect in the shipped app**, it is another lane's file so I did not touch it, and it should be fixed before Sept 1. The chapter states the ordering explicitly and lists "reading Hot as milder than High" under common errors.

**4. Q-CRAFT is not a production function, and the User Guide says it is.** The brief says "explicitly NOT a production function; no capital stock or factor shares", and the code agrees: `baseline_v1.py` computes real GDP growth as `(1 + employment growth) × (1 + productivity growth) − 1`, which is the identity `output = workers × output per worker`. But the User Guide p. 5 describes the baseline as "grounded in a simple production function and standard debt dynamic equation", and p. 10 says demographic changes affect growth "through the production function used in the model". Both descriptions point at the same lines of code.

The chapter teaches it as an accounting identity, which is the more precise description, and carries a short "wording note" in a collapsible block saying what the User Guide calls it and why this guide says something else. That keeps the "where the two differ, the User Guide is right" promise in the preface honest, because this is a naming difference rather than a substantive one.

**5. Q-CRAFT's Hot Unadapted uses m = 50, which is outside the range the paper tested.** The User Guide (pp. 35-36) sets the adaptation parameter to 20 for Hot Adapted and 50 for Hot Unadapted. Kahn et al. tested 20, 30 and 40. Extrapolating the window to 50 is a defensible choice and the paper's own equation (34) makes the direction unambiguous, but it is an extrapolation.

It also checks out numerically, which is worth knowing. The `(m+1)/2` identity predicts the 50-year window leaves a gap 1.65 times the 30-year one. Kenya's bundled shortfalls at 2099 are 6.99 against 4.20, a ratio of 1.66. The adapted case is less tidy: predicted 0.68, observed 0.55. The chapter reports both ratios and says which one lands where the arithmetic puts it, rather than inventing a mechanism for the gap.

#### One thing the brief got exactly right and I want to underline

"Yes in exposure, no in the response coefficient" is the correct answer to the country-specific question, and it is the single most useful sentence in Step 3. The chapter puts it in a three-row table and repeats it in the limitations pairing.

---

### 2. The chapter map, with figure paths

`docs/companion-guide/m2-debt-equation.qmd`, title "The model, in three steps", anchor `{#sec-m2}` unchanged so every existing cross-reference still resolves. 421 lines, ordered as below. Every figure is generated, none is hand-edited, and every projected number on one comes out of a CSV in `docs/companion-guide/figures/series/`.

| Beat | Anchor | Figure | Path |
|---|---|---|---|
| Cold open | | Kenya baseline against Hot, 2024-2099 | `figures/m2-cold-open.svg` |
| Step 1 signpost | `sec-m2-step1` | Course map, equation node lit | `figures/course-map-m2.svg` |
| Step 1, the equation | | Annotated equation, recoloured to the three numbers | `figures/m2-equation-annotated.svg` |
| Step 1, the amplifier | | Three interest-growth pairs, ten years | `figures/m2-scoreboard.svg` |
| Step 2 signpost | `sec-m2-step2` | | |
| Step 2a, where g comes from | | Growth accounting waterfall, Kenya against Thailand | `figures/m2-growth-stack.svg` |
| Step 2a, the handover | | WEO to model timeline | `figures/m2-weo-handoff.svg` |
| Step 2b, where pb comes from | | Revenue and spending, the wedge, two dials | `figures/m2-primary-balance.svg` |
| Step 2c, where r comes from | | Three rate rules and what they cost | `figures/m2-interest-rules.svg` |
| Step 2 landing | | Course map, base chain lit, climate block absent | `figures/course-map-m2-base.svg` |
| Step 3 signpost | `sec-m2-step3` | | |
| Step 3a, the econometrics | | Three panels: deviation, response rate, scenario paths | `figures/m2-climate-panels.svg` |
| Step 3c, how the drag enters | | The equation again, only g lit | `figures/m2-equation-growth.svg` |
| Step 3e, the docking move | | Course map, base chain grey, climate block lit | `figures/course-map-m2-dock.svg` |
| Wrapper | | Course map, every node lit | `figures/course-map-m2-full.svg` |

Nine new figures and three new map variants. Each has a `.svg`, a `-print.png` at scale 3, and a `_name.qmd` include that inlines the SVG for HTML and places the PNG for LaTeX. Vision QA shots for all twelve are in `review-screenshots/`, two per figure (cropped, and in page).

**The kit, per step.** Step 1: the annotated equation, the 60-percent three-year table, a collapsible derivation carrying the old Path-A material, the landing line "give me r, g and pb and I will give you the debt path", a you-are-here signpost. Step 2: three figures, Kenya and Thailand at 2050, three collapsible depth layers, the landing map with the climate block absent, a signpost. Step 3: the three-panel explainer, the adapted-unadapted contrast and the 2050 trace, two collapsible layers, the docking map, a signpost.

**Where the old material went.** The r-minus-g remedial content, the debt-stabilizing primary balance derivation and the three-claims self-check are all inside Step 1's collapsible "Going deeper" block, which is what the brief asked for. The old fill-in-the-blanks mermaid map is gone, replaced by the four map variants. The old predict-observe-explain app exercise is restored at the Step 2 seam, with its SCREENSHOT-TODO.

---

### 3. The countries

**Kenya is the spine, and Bangladesh is out on a data defect.** The brief said to pick whichever has cleaner data. Both have complete climate tables and complete UN demography. Bangladesh has null `debt` and `debt_to_gdp` for 2001 and 2002 in `data/processed/macrofiscal.parquet`, and `fiscal.baseline_country` reads the full macro-fiscal frame rather than its 2009-onward window, so `run_pipeline(data, "BGD")` raises `TypeError: float() argument must be a string or a real number, not 'NoneType'`.

**That is a bug worth someone's attention**, and it is not mine to fix on this branch. Any country with a gap anywhere in 2001-2008 fails the same way, on data the engine does not use. Two candidate fixes, either of which is a one-line change in another lane: filter to `YEAR_START` before building the lookup, or tolerate nulls outside the projection window. Zambia has six null rows on the same columns and will fail identically.

**Thailand is the Step 2a contrast.** Working-age population falls 1.11 percent a year in 2050 against Kenya's rise of 1.45, on identical productivity and inflation defaults, which puts 2.7 points of nominal growth between them with nothing but demography responsible. Japan and Korea are more dramatic and less useful: Thailand is a middle-income, climate-exposed economy, so the comparison reads as a live policy question rather than as a special case.

**Uganda is out of M2 entirely**, per the brief. It survives in Step 1's collapsible block as the source of one factual example about a falling debt ratio, which is a published document rather than the running country.

---

### 4. The cold open number, and how honest it is

The caption says Kenya's debt is 48 points of GDP higher in 2099 under Hot. That is this repository's engine at the Explorer's shipped defaults: baseline 51.4 percent, Hot 99.4. Reproducible by opening the Explorer, selecting Kenya and touching nothing.

**But 44 of those 48 points are the expenditure rigidity assumption**, and the chapter says so in a table rather than burying it:

| Rigidity | Hot debt 2099 | Gap over baseline |
|---|---|---|
| 1.0 (default) | 99 | 48 points |
| 0.5 | 77 | 26 points |
| 0.0 | 55 | 4 points |

This is the run's most consequential editorial call, so here is the reasoning. A cold open whose number collapses under one dial is a bad cold open unless the chapter dismantles it, and dismantling it is exactly what the chapter promises to do. Step 3c makes the decomposition the punchline rather than the footnote, and the wrapper lists "quoting a scenario gap without saying which rigidity setting produced it" as a common error. If you would rather the cold open used a smaller, more robust number, the alternative is Kenya at rigidity 0.5, which gives 26 points. I think 48 with the decomposition teaches more than 26 without it, but it is your call.

The other structural driver is that the fiscal rule builds the baseline and is not applied inside the climate scenarios, so part of any gap is the rule holding the baseline at target while the scenario runs free. That is in Step 2b's collapsible block and again in Step 3c.

---

### 5. Skim discipline

Read the chapter as headings and bold leads only and it makes the argument on its own. Every section heading is a claim rather than a label after four rewrites in this run: "The identity is a stock and two flows", "One year forward, and only half the movement is borrowing", "Step 2a. Growth is built from three published series", "Step 3a. The econometrics measures deviation from a country's own norm".

Two defects the skim test caught late:

**The three steps were level-one headings**, which Quarto's book format numbered as chapters 4, 5 and 6 inside a chapter the sidebar numbers 3. The in-page table of contents read as four chapters where there is one. Fixed by demoting the body hierarchy one level, leaving 3.2, 3.3 and 3.4 for the steps with the self-check and wrapper back at chapter level. Headings inside callouts stayed put, since those are callout titles and never enter the table of contents.

**The base-chain map left a blank band** where the warming block usually sits, which reads as a rendering fault rather than as a deliberate absence. The wide variant now crops to the chain it draws, and its last node says "The baseline: one path, and no scenario to compare it with" with a single line in the chart instead of a fan, because at that point in the chapter there is nothing to compare against.

---

### 6. Marker inventory

| | Run 7 | Run 8 |
|---|---|---|
| DRAFT FOR TEAL | 26 | 23 |
| SCREENSHOT-TODO | 5 | 5 |
| WIDGET-TODO | 3 | 3 |
| TODO headings | 6 | 6 |
| Collapsible callouts | 28 | 32 |

M2 goes from four DRAFT FOR TEAL blocks to one, which needs explaining, because PROMPT.md names "M2 fresh explanations" as a category that should carry the marker.

The whole chapter is new load-bearing prose. Wrapping all of it in DRAFT callouts would mark nothing, because a marker that covers everything tells you nothing about where to look. So I kept the marker for the category where it does work, the self-check answers, and I am listing the specific passages you should read as mine rather than as settled below, in section 8. If you would rather have the blocks, the four candidates are Step 2a's production-function wording note, Step 3a's adaptation explanation, Step 3c's rigidity decomposition and Step 3d's strengths-and-limitations pairing.

WIDGET-TODO in M2 is now the **debt sandbox** rather than the interest-growth differential widget, per the brief. If lane 2 shipped both, the anchor should probably carry both.

---

### 7. Files touched

```
docs/companion-guide/m2-debt-equation.qmd          rewritten
docs/companion-guide/index.qmd                     module table row, organisation paragraph
docs/companion-guide/m0-start-here.qmd             path section, routing prose
docs/companion-guide/m1-how-qcraft-thinks.qmd      handoff sentence
docs/companion-guide/m3-parameters.qmd             one cross-reference
docs/companion-guide/m4-worked-example.qmd         one cross-reference
docs/companion-guide/m6-capstone.qmd               two cross-references
docs/companion-guide/figures/series/*.csv          new, 7 files, engine output
docs/companion-guide/figures/m2-*.svg,png,qmd      9 new figures
docs/companion-guide/figures/course-map-m2-*.svg   3 new map variants
scripts/build_m2_series.py                         new
scripts/build_exhibits.py                          9 figure builders, routing table
scripts/build_course_map.py                        omit mechanism, 3 variants, single-path fan
scripts/screenshot_guide.py                        12 new targets
source-materials/2019_Kahn-et-al_*.pdf             2 files, gitignored
```

The deleted `*_files/figure-latex/mermaid-figure-*.png` are Quarto's own LaTeX intermediates. A clean render no longer leaves them in the source tree, and they were committed by an earlier run rather than on purpose. The PDF still builds with every mermaid diagram in it.

---

### 8. Things for you to decide

1. **The cold open number.** 48 points with the decomposition, or 26 points at rigidity 0.5 without needing one. Section 4 has the argument.
2. **The four passages that are mine rather than settled**, in the order I would read them: Step 3d's strengths-and-limitations pairing, which is the honest-broker stance applied to this specific structure; Step 3c's rigidity decomposition, which reframes the chapter's own headline; Step 2a's wording note departing from the User Guide on "production function"; and Step 3a's adaptation explanation, which is the hardest idea in the chapter and the one I am least sure lands.
3. **The scenario labels in the shipped app** say Hot is 3°C and High is 4°C+, which inverts their actual severity. Another lane's file, live before Sept 1.
4. **Bangladesh crashes the pipeline** on nulls the engine does not use. Section 3 has the two candidate fixes.
5. **The semantic colours changed.** Your brief describes the annotated-equation SVG as blue g, orange r, gold pb. It was blue `d_{t-1}`, orange for the whole `(1+r)/(1+g)` fraction, green pb: it coloured the three *terms*. The chapter is organised around the three *numbers*, so I recoloured it to match your description and threaded blue-g, orange-r, gold-pb through every figure. That changes an existing figure, so it is worth a look.
6. **Run 1's open items 1 to 5 and run 2's still stand.** The 197 versus 175 country-count disagreement is now a three-way one: the User Guide says Q-CRAFT covers 171 economies and the FADCP table covers 171, the app sidebar says 175, and M1 and M3 say 197. M2 uses 171 and cites the User Guide for it. Somebody should reconcile the other two.

### Not done, and why

- **Ruff.** `uv run ruff check .` reported 152 errors before this run and 214 after, all but three of them `E501` line-too-long in `scripts/`, where the existing figure code violates the 88-character limit throughout. My new `scripts/build_m2_series.py` is clean. I matched the surrounding style in `build_exhibits.py` rather than reflowing 200 lines of another run's code, and I am flagging it rather than quietly leaving it.
- **The published Kahn article.** Closed access, no legitimate route. Section 1 lists exactly what rests on the working paper instead.
- **M5's forward link.** Step 3d points at @sec-m5 for the exclusions, which M5 already carries. I did not add anything to M5, so if the pairing there should now mention the pooled coefficient explicitly, that is a small follow-up.

### Commits

```
3c60d89 feat(m2): dump the engine series the chapter's figures are drawn from
8746c2a feat(m2): eight figures for the three-step chapter
cdff51f feat(m2): three course-map variants for the chapter's seams
54f2abd feat(m2): rebuild M2 as 'The model, in three steps'
a5405b3 fix(m2): step headings are sections, not chapters
260d415 docs(m2): restore the predict-observe-explain baseline run at the Step 2 seam
```

---

## Run 7: the FRS verified, the Lego arc, layered callouts

### Status

Done. Both profiles render clean: `quarto render docs/companion-guide --profile brand` exits 0, then `quarto render docs/companion-guide` exits 0, neither with a warning or an unresolved cross-reference. The brand render was taken first and the default render last, so the committed artefacts are the default profile's output and no HTML page in `_book/` references the Klim stylesheet. The committed PDF is rebuilt at 98 pages, four more than run 6, the extra pages being M1's two-stage restructure and the new collapsible blocks.

Five commits. The banned-tics sweep reports zero em-dashes, zero occurrences of "toil", and one semicolon, which sits in a compact table cell and is the case rule 9 allows. Marker counts are unchanged from run 6 in every cell: DRAFT FOR TEAL 26, SCREENSHOT-TODO 5, WIDGET-TODO 3, TODO headings 6. Collapsible callouts go from 18 to 28.

**The headline, because it is the gate.** Every claim about the Uganda Fiscal Risk Statement FY 2024/25 checks out against the PDF in `source-materials/`. The page range, the scenario count, the 50 percent ceiling finding and the QCRAFT (2023) source line are all confirmed, with two small corrections to how they were being described. Detail in section 1.

---

### 1. The FRS verification gate

The document is on disk at `source-materials/2024_MoFPED_Uganda-Fiscal-Risk-Statement-FY2024-25.pdf`, 31 pages, produced in Microsoft Word and dated 8 May 2024 in its own metadata. Its title page reads "FISCAL RISK STATEMENT / MINISTRY OF FINANCE, PLANNING, AND ECONOMIC DEVELOPMENT / MACROECONOMIC POLICY DEPARTMENT / FY 2024/25", with a foreword signed by Matia Kasaija (M.P), Minister of Finance, Planning and Economic Development. Printed page numbers and PDF page numbers agree throughout, so a page citation means the same thing either way.

I extracted the text with `pdftotext -layout` and checked each claim against the page it is supposed to come from.

| Claim as it was stated | Verdict | What the file shows |
|---|---|---|
| Pages 13 to 17 carry the climate section | **Confirmed** | Section III opens on printed page 13 and Section IV opens on page 18. The Q-CRAFT material specifically runs pages 14 to 17. |
| The chapter is called "Climate Change Fiscal Risks" | **Corrected** | That is the table-of-contents title. The body heading on page 13 reads "III. CLIMATE CHANGE AND NATURAL DISASTER FISCAL RISKS". Both are now given. |
| It reports five climate scenarios | **Confirmed** | Page 14: the tool quantifies effects "under five different climate scenarios, against a baseline". The five are named and defined on pages 14 and 15: Paris, Moderate, High, Hot, Vulnerable. |
| Headline finding: debt passes the 50 percent of GDP fiscal rule ceiling | **Confirmed, verbatim** | Page 17: "In the High, Hot, and Vulnerable scenarios, public debt surpasses the 50 percent of GDP fiscal rule ceiling, taking on an unsustainable upward trajectory." |
| The source line reads "QCRAFT (2023)" | **Confirmed, with a count** | Three source lines, not one. Page 15: "Source (Fig 8 & Tab 5: QCRAFT (2023)" (the opening parenthesis is unclosed in the original). Page 16 and page 17: "Source: QCRAFT (2023)". |
| Q-CRAFT is named in the document | **Confirmed** | Page 4, in the framing section: the analysis "expanded its scope on fiscal risks associated with climate change by using the Quantitative Climate Risk Assessment Fiscal Tool (Q-CRAFT) for long term fiscal sustainability analysis." Page 14 says "Using the Q-craft tool". |

The other Uganda numbers already in the course were checked at the same time, since the file was open.

| Claim | Where in the course | Verdict |
|---|---|---|
| Table 5 baseline path: 47.1 / 36.2 / 35.8 / 47.5 debt-to-GDP at 2023 / 2050 / 2075 / 2099 | @sec-m4 target format | **Confirmed**, every cell, page 15 |
| Primary expenditure 19.9 to 19.4, dipping to 18.8 around 2075 | @sec-m4 sanity check | **Confirmed**, Table 5 |
| Primary deficit 6.3 to 1.4, overall deficit 3.8 at 2099 | @sec-m4 sanity check | **Confirmed**, Table 5 |
| "the primary deficit in the Hot scenario ... 0.7 percentage points worse than baseline, thereby raising public debt by over 18 percent of GDP" | @sec-m4 fan chart reading | **Confirmed.** The document says "0.7 percent worse than the baseline"; the quoted clause is verbatim, page 17 |
| Debt at 46.9 percent of GDP June 2023, projected 49.2 percent June 2024 | @sec-m2 self-check, @sec-m3 vintage | **Confirmed**, page 18 |
| Debt ratio fell from 48.4, attributed partly to nominal GDP rising on high inflation | @sec-m2 self-check | **Confirmed**, page 18 |
| Floods and epidemics about 75 percent of recorded events 1985 to 2021 | @sec-m5 exclusions table | **Confirmed**, page 13, footnoted to the World Bank Climate Risk Country Profile 2021 |
| "Vulnerable" is the Hot Unadapted scenario under another label | @sec-m1 scenario table | **Confirmed in substance**, page 15: "Vulnerable: using the same emission as the hot ... scenario, but with slower adaptation and therefore more damaging macroeconomic impacts" |
| GDP loss around 4 percent by end of century under Hot | @sec-m4 climate tab | **Confirmed twice.** The FRS says "a 4 percent reduction in nominal GDP by the end of the century under the Hot scenario" (page 16). The C-PIMA summary says GDP loss "could surpass 4 percentage points" |
| Debt to 66 percent of GDP against 47.5 percent baseline | @sec-m1, @sec-m0, @sec-m4 | **Confirmed** against the C-PIMA high-level summary on disk, page 3 of that file |

**Two typographical oddities in the source, noted so nobody re-derives them.** The FRS prints the Paris scenario as "SSP31-2.6" on page 14 where SSP1-2.6 is meant, and prints the Vulnerable scenario's emissions as "SSP4-7.0 90th percentile" on page 15 where the Hot scenario two paragraphs earlier is SSP3-7.0 and the text says Vulnerable uses "the same emission as the hot". The course does not repeat either string. It uses the User Guide's scenario table instead, which is the right authority for scenario definitions.

**One claim I could not verify from disk, flagged rather than fixed.** The course says in three places that the September 2023 activity was a *five-day* workshop. The high-level summary on disk says only that "a new CD activity covering both areas was delivered in September 2023" and refers to "a training workshop delivered by the team for the staff of the MoFPED". It gives no duration. The five-day figure comes from `SHARED/REFERENCE-NOTES.md`, which is a binding source for this lane, so I left the wording alone. If it came from the full TA report rather than the summary, the summary is not where it can be checked. The same goes for the TA report number 2024/012 in the shared notes: the file on disk is the **High-Level Summary Technical Assistance Report HLS/24/07, February 2024**, and that is the number now in `references.qmd`.

---

### 2. The tic sweep: rule 12, compound assertion-amplification

Rule 12 in `style-guide-writing-AI.md` bans the shape where a clause after ", and" restates the previous clause bigger for drama. The test I applied: does the second clause carry a fact the first does not? If not, it is the tic.

Seventeen instances replaced. The course holds 318 other occurrences of ", and". Each of those joins two different facts, so each was left alone. Headings were checked first, since the rule says the shape is worst there.

| # | File | Before | After |
|---|---|---|---|
| 1 | `m0-start-here.qmd` heading | The deliverable already exists, and a ministry has already published it | A ministry has already published this deliverable |
| 2 | `m1-how-qcraft-thinks.qmd` heading | The equation needs three numbers, and the tool exists to build them | The base machine, before any climate |
| 3 | `index.qmd` | The Fiscal Affairs Department built it for its own climate technical assistance, and that is where it is used. | The Fiscal Affairs Department built it for its own climate technical assistance. |
| 4 | `index.qmd` | The third part belongs with the first two, and the honest way to hold it is as a pairing. | The honest way to hold the third part is as a pairing with the first two. |
| 5 | `m1-how-qcraft-thinks.qmd` | Climate scenarios lower growth, and that is the only way climate enters the equation. | Lowering growth is the only way climate enters the equation. |
| 6 | `m1-how-qcraft-thinks.qmd` | The second claim is narrower than the first, and the difference matters. | The second claim is narrower than the first. |
| 7 | `m1-how-qcraft-thinks.qmd` | That machine is what this section teaches, and it is worth learning on its own, because ... | That machine is what this section teaches. It is worth learning on its own, because ... |
| 8 | `m2-debt-equation.qmd` table cell | A zero primary balance stabilizes debt, and only here. | A zero primary balance stabilizes debt only here. |
| 9 | `m3-parameters.qmd` | Nothing, in this case, and that is worth being clear about. | Nothing, in this case. |
| 10 | `m4-worked-example.qmd` | The seven steps are the method, and the method is what transfers. | What transfers to your own country is the method, which is the seven steps below. |
| 11 | `m4-worked-example.qmd` | Eighteen and a half percentage points is the headline, and it is the number that goes in the first sentence. | Eighteen and a half percentage points is the number that goes in the first sentence. |
| 12 | `m4-worked-example.qmd` | The seven steps are a method, and the method is the part that transfers. | The seven steps are the part that transfers. |
| 13 | `m5-boundaries.qmd` | The whole module is one pairing, and it is worth having in a single breath before the detail arrives. | Here is the whole module in one breath, before the detail arrives. |
| 14 | `m5-boundaries.qmd` | The asymmetry matters for a narrow set of countries, and for those countries it matters a lot. | For a narrow set of countries the asymmetry matters a lot. |
| 15 | `m5-boundaries.qmd` | **Both, in sequence, and this is the interesting one.** | **Both, in sequence.** This is the interesting one. |
| 16 | `m6-capstone.qmd` | **One error disqualifies on its own**, and it is worth naming separately because it recurs | **One error disqualifies on its own**, and it recurs often enough to name separately |
| 17 | `m6-capstone.qmd` | Two things arrive after the workshop, and they are part of the course rather than an afterthought. | Two things arrive after the workshop, as part of the course rather than as an afterthought. |

Rows 1 and 2 are heading rewrites folded into the larger structural changes in sections 5 and 7. The other fifteen are replacements of the shape and nothing else.

**Nine headings I left alone, with the reason**, so the judgment is auditable rather than silent:

- "Q-CRAFT runs in a published Excel workbook, and in this Explorer" (M1). Two surfaces, two facts.
- "Warming lowers growth, and weakens the primary balance when spending is rigid" (M1). Growth always, the primary balance conditionally. Two facts.
- "Four tabs, and what each one is for" (M3). A count and a purpose.
- "Five controls, and four of them shape the projection" (M3). The second clause narrows rather than amplifies.
- "Step 1: set the parameters, and write down why" (M4). Two actions.
- "What the tool is good at, and why it was built that way" (M5). A property and its cause.
- "What the numbers mean, and what they do not" (M5). A contrast pair, not an escalation.
- "the answers, and what a wrong one means now" (M6). Two different things the panel contains.
- "Two things move the ratio: the interest-growth gap and the primary balance" (M6 wrapper). A serial list.

---

### 3. Layered depth: collapsible callouts as the standard

Eighteen collapsible callouts before this run, 28 after. The rule I applied: the visible default carries the full message, and the collapsible carries an optional route to the same message or a numeric demonstration of it. Nothing load-bearing went behind a click.

**Ten new collapsibles.** Four are the worked-number blocks in section 4. Three are conversions of existing depth in M5. One is the kitchen analogy converted in M1, one is a new M1 block holding two asides that used to interrupt the prose, and one is the page-by-page FRS anatomy in M4.

**Converted from always-visible to collapsible:**

| Block | File | Why it can collapse |
|---|---|---|
| DRAFT FOR TEAL: what conservatism does not buy you | `m5-boundaries.qmd` | The section above already states the conservatism finding with its sources. This is the second-order hazard, which is a real point and not the point. |
| DRAFT FOR TEAL: how the asymmetry changes what you are looking at | `m5-boundaries.qmd` | "The rule" callout, the two-panel figure and the sentence under it carry the asymmetry. This block is the detail on when it bites. |
| DRAFT FOR TEAL: why this exercise and not a worked comparison | `m5-boundaries.qmd` | Instructor-facing rationale for a pedagogical choice. A learner does not need it to do the exercise. |
| DRAFT FOR TEAL: the kitchen version | `m1-how-qcraft-thinks.qmd` | An alternative route to a chain the prose has already walked. It now reads "prefer it as a kitchen?" and sits at the end of the base-machine section rather than in the middle of it. |
| Two properties of the base machine worth knowing | `m1-how-qcraft-thinks.qmd` | New. Holds the partial-equilibrium limit and the seven-functions architecture aside, which were two interruptions in the old running prose. |

**What did not collapse, deliberately.** M2's three DRAFT FOR TEAL blocks (building the equation from words, what the differential does, the debt-stabilizing primary balance) are the module. M4's interpretation blocks and its model two-paragraph write-up are the module's target artefact. M0's concept-inventory questions stay open with only their answers collapsed, which is the existing predict-then-check pattern.

---

### 4. Worked numbers, one per named equation

Five equations are named in the course. Four now carry a collapsible worked example with round numbers, one pass through the arithmetic, and one sensitivity line. The fifth, the debt-stabilizing primary balance, already had its arithmetic worked in the open, so it gained the sensitivity line it was missing rather than a new block. Every figure below was computed rather than estimated.

| Equation | Where | The pass | The sensitivity line |
|---|---|---|---|
| Debt dynamics, one year | @sec-m1 | d 60, r 8, g 6, pb -1. 60 × 1.08 / 1.06 = 61.1, then 61.1 − (−1.0) = 62.1 | Growth to 7 percent gives 61.6 instead of 62.1. Ten years of the same two settings gives 83.2 against 76.3 |
| Debt dynamics, three years | @sec-m2 | The same setup walked to 62.1, 64.3, 66.5, with the borrowing contribution held at 1.0 a year and the amplifier growing from 1.1 to 2.2 | Growth at 7 percent lands at 64.7 rather than 66.5, so one point of growth is worth 1.8 points of ratio over three years |
| Growth decomposition | @sec-m1 | Employment 2, productivity 3, inflation 5. 1.02 × 1.03 = 1.0506, then × 1.05 = 1.1031, so 10.31 percent against 10.00 additive | Productivity down one point gives 9.24 percent, a loss slightly larger than the point removed |
| Expenditure growth | @sec-m1 | Productivity 3, inflation 5, population 2. 100 × 1.03 × 1.05 × 1.02 = 110.3 against 110.0 additive | Over seventy years the multiplicative path ends about 22 percent above the additive one |
| Debt-stabilizing primary balance | @sec-m2 | Existing: 0.50 × (0.09 − 0.06) / 1.06 = 0.0142, so a surplus of about 1.4 percent of GDP | New: growth down one point raises the required surplus from 1.4 to 1.9 percent of GDP |

The debt dynamics example uses the 60 percent of GDP start you specified. The 22 percent figure in the expenditure row is (1.10313 / 1.10)^70, which is where the additive shortcut stops being a rounding difference and becomes a different projection.

---

### 5. The Lego arc in M1

M1 was one continuous explanation in which climate appeared partway through as another supplier. It is now a two-stage reveal, and the section numbering in the sidebar shows it:

- **2.5 The base machine, before any climate.** Opens by saying what it is: a long-term fiscal projection model, the same one underneath every debt sustainability analysis the reader has met, with no warming in it. Then 2.5.1 the equation, 2.5.2 where the three numbers come from with growth, the interest rate and the primary balance as H4 subsections, and a short close, "That is the base machine", which states the complete inventory: two published sources, five controls, three manufactured numbers, one equation, one debt path.
- **2.6 The warming block snaps on.** Opens on "Everything above runs without climate. Now add one block", then the docking map, then the mechanism. A new three-row table says what each of the three numbers does under warming, including the row that says the interest rate is untouched, which is the fact that makes the block a block.

The second arrow got a paragraph it did not have. The old text said climate worsens the primary balance "when expenditure is rigid" and moved on. It now says why: revenue tracks nominal GDP, a smaller economy collects less, spending does not automatically shrink to match, and how much of it does is the rigidity control in @sec-m3.

Three framing pieces were updated to match: the "In this module" callout now describes the two stages, the objectives gain "**Distinguish** what the base projection model does from what the warming block adds to it", and the fast path points at the docking map rather than at a section that no longer exists under that name.

**One factual correction on the way through.** The old three-number table said the reader controls "the climate scenario" under warming. The Explorer has no scenario selector: all six scenarios run and the reader chooses which to read against the baseline. The new table says that, and the sidebar count is now stated as five controls counting the country selection, which is what the app actually holds (`apps/qcraft-app/app.py`, five `ui.input_*` calls).

---

### 6. Map v3

`scripts/build_course_map.py` gained two things.

**Named ingredients.** The three source boxes were "Macro series / IMF World Economic Outlook", "Population / UN World Population Prospects" and "The controls you set / five of them, in the sidebar". A reader could not check any of that against anything. Each box now lists its contents:

- **Macro series.** real GDP, nominal GDP, deflator, revenue, expenditure, debt, primary and overall balance. That is the eight sections `scripts/extract_excel_data.py` reads out of the workbook's Macrofiscal sheet, which is the authoritative list rather than a plausible one.
- **Population.** by age group, working age 15-64, medium, high and low variants.
- **The controls you set.** country, demography variant, debt target, fiscal rule, expenditure rigidity. The five `ui.input_*` calls in the app sidebar, in sidebar order.

Both layouts grew to hold the extra lines: the wide boxes go from 168 × 52 to 200 × 84 units with the chain shifted right to keep the arrow gaps, and the tall boxes go from 204 × 62 to 214 × 104 with everything below them offset. Detail lines set at 10.5 units, which is about 8 point in the book column, one step down from the source line rather than two.

**The docking variant.** A new `m1-dock` variant introduces a third contrast tier. Where the resting palette is white boxes with ink titles and the lit palette is teal with white titles, dimmed boxes keep the white fill and drop to `#EAEEF1` strokes, `#A7B4BC` titles and `#C3CCD2` subtitles. Every connector, arrowhead, verb label, the panel background and the debt-path fan honour the tier, so the base chain recedes as one object. The warming block stays lit, its two dashed arrows thicken from 1.6 to 2.8 units, and the note beside it changes to "The block docks onto two nodes of a machine that already works. No new equation, no new term, two arrows."

**Vision QA.** Three rounds. Round 1 built the boxes at 9.5-unit detail lines and I rejected them: at the three-quarter scale the book sets the figure, that is about 7 point, which is smaller than any other text in the diagram. Round 2 widened the boxes to 200 units, moved the panel, equation, paths and climate bus right by 22 units, and raised the detail lines to 10.5. Round 3 confirmed the dimmed tier renders as intended and that the lit ingredient boxes in the M3 variant still read (white on teal, all three detail lines legible).

Screenshots in `review-screenshots/`:

| File | What to look at |
|---|---|
| `course-map-m1-dock.png` | The docking variant on its own. The base chain grey, the warming block teal, two thick dashed arrows into growth and the primary balance |
| `course-map-m1-dock-in-page.png` | The same figure in the M1 page, under section 2.6, with the sidebar and the section numbering visible |
| `course-map-m1.png`, `course-map-m1-in-page.png` | The standard variant with the named ingredient boxes |
| `course-map-m0.png`, `course-map-m4.png`, `course-map-m5.png` | The other variants, confirming the geometry change did not break them |
| `m1-worked-debt-equation.png` | The worked-numbers callout expanded, with the LaTeX arithmetic |
| `m1-worked-growth.png` | The growth decomposition callout expanded |
| `m2-worked-three-years.png` | The annotated-equation SVG with the three-year callout under it |
| `m4-frs-anatomy.png` | The page-by-page FRS anatomy expanded |
| `m0-hook.png` | The recast opening section, with no country in it |

---

### 7. De-Uganda the hook

`m0-start-here.qmd` now contains the string "Uganda" zero times. The section that led with one country's fiscal risk statement now leads with the genre: most finance ministries publish a fiscal risk statement, a budget framework paper or a medium-term debt report every year, the climate section is the part that has been arriving recently, and at least one published statement already carries a section built with this tool with the figures sourced to it by name. It then hands the concrete document to @sec-m4.

Two other Uganda references in M0 went with it. The concept-inventory answer that ended "The 47.5 and 66 percent figures come from the September 2023 IMF workshop with Uganda's ministry staff" now says the figures are real, come from a five-day workshop with the staff of one finance ministry, and are worked in @sec-m4. The desk exercise that said "open Uganda's Fiscal Risk Statement FY 2024/25 at page 13" now points at the published section @sec-m4 works through.

M1's scenario-naming note lost its country too. It said "Uganda's Fiscal Risk Statement FY 2024/25 reports five of these and calls the last one Vulnerable". It now says the worked case in @sec-m4 carries five scenarios under its own labels, which is the transferable fact.

M4 gained the specifics as a collapsible page-by-page anatomy, quoted from the file, plus the document's publisher, its length and the count of source lines. `references.qmd` gained both published documents as full entries.

---

### 8. Things for you to decide

1. **The five-day workshop claim.** Still asserted in `index.qmd` and `m1-how-qcraft-thinks.qmd`, sourced to the shared notes rather than to a document on disk. If the duration matters for the Sept 1 session, it is worth confirming against the full TA report. If it does not, "a workshop with ministry staff in September 2023" is verifiable from the summary and loses nothing.
2. **The Excel half of the both-ways promise.** Unchanged from run 6 and still the largest open scope item. The preface promises both surfaces and only the Explorer exists.
3. **The dimmed tier's contrast.** The greyed base chain in the docking map is readable rather than ghosted, which was deliberate: a reader who cannot make out the base chain cannot see what the block is docking onto. If you want it fainter, `DIM_TITLE` and `DIM_SUB` in `scripts/build_course_map.py` are the two constants.
4. **Where the worked-number callouts sit.** They are placed directly under each equation. An alternative is to gather all five into an appendix and link them, which would shorten M1 and M2 at the cost of putting the arithmetic a click and a page away.

---

## Run 6: the both-tools promise, and the four reasons for the Explorer

### Status

Done. Both profiles render clean: `quarto render docs/companion-guide` exits 0 and `quarto render docs/companion-guide --profile brand` exits 0, neither with a warning or an unresolved cross-reference. The brand render was taken first and the default render last, so the committed artefacts are the default profile's output, as the colophon claims. No HTML page in `_book/` references the Klim stylesheet. The committed PDF is rebuilt at 94 pages, one more than run 5, the extra page being the new preface section.

The banned-tics sweep over the eleven module `.qmd` files reports zero em-dashes, zero semicolons and zero occurrences of "toil". The sweep also reports semicolons inside `figures/*.qmd`, and those are CSS declarations in the SVG markup rather than prose. The word "toil" does not appear anywhere in the guide or in any figure, alt text included.

Five commits. Marker counts are unchanged from run 5 in every cell, because this run reworded M1's Excel-half TODO rather than adding one: DRAFT FOR TEAL 26, SCREENSHOT-TODO 5, WIDGET-TODO 3, TODO headings 6.

**Where the promise now outruns the content.** The preface says the course teaches Q-CRAFT both ways, and only the Explorer half exists. That gap was already flagged in M1 in run 5, and the callout there is now worded against the preface rather than against an intent. It is the one thing in this pass that needs your decision rather than your review, and it is item 1 under **Things for you to decide** below.

---

### 1. The diff, file by file

Five prose files changed, plus the rebuilt PDF. Nothing else in the repository was touched.

| File | Lines | What changed |
|---|---|---|
| `index.qmd` | +15 / -2 | The promise, the compact four-reason card, objective 1 |
| `m1-how-qcraft-thinks.qmd` | +6 / -9 | The four reasons recast as a numbered card, reason 3 renamed, the TODO reworded |
| `m3-parameters.qmd` | +3 / -3 | The source-figure callout becomes reason 2 by name |
| `m4-worked-example.qmd` | +2 / -0 | Step 6 connects the packet to reason 4 |
| `m6-capstone.qmd` | +3 / -1 | The hand-in connects to reason 4, and one line of Excel-adjacent disparagement goes |

**`index.qmd`, the preface.** Three changes.

The promise replaces the single-surface sentence. Was: "This course teaches the tool through **Q-CRAFT Explorer**, an open-source Python reimplementation of the IMF's Excel workbook." Now: "This course teaches you to run Q-CRAFT both ways: in the official IMF Excel workbook, which the Fund publishes on its website, and in **Q-CRAFT Explorer**, an open-source Python reimplementation of that workbook." The three sentences after it are unchanged except that "The economics is the IMF's" becomes "The economics is the IMF's on either surface".

A new section, **Two surfaces, one model**, sits between the not-an-IMF-product callout and "The questions it answers". It opens on the workbook and why it is built the way it is: every ministry has Excel, staff know it, a Fund tool has to run in nearly two hundred countries without assuming data or infrastructure that may not be there, and Q-CRAFT is designed simple so that it runs pretty much anywhere. Then the four reasons as a numbered card, one sentence or two each: data currency, guidance where you need it, faster to the analysis, the export packet. It closes by handing the long version to M1 and saying that after that the course shows the four rather than arguing them, which is the show-not-tell rule stated once where it can do some work.

Objective 1 was "**Run the tool.** Select a country, set the parameters, read the charts, export the results." It is now "**Run the tool, on both surfaces.** Select a country, set the parameters, read the charts and export the results, in the IMF workbook and in the Explorer." Objectives 2 and 3 are untouched.

The strengths-and-limitations pairing and the not-an-IMF-product callout are both exactly as run 5 left them. Neither was edited.

**`m1-how-qcraft-thinks.qmd`.** The Excel-respect paragraph is unchanged, and it already led the section. The four reasons that follow it become a numbered list, so the card is countable on the page rather than a run of four bold paragraphs. Reason 3 was "**Fewer steps to the analysis.** Less of the hour goes on mechanics". It is now "**Faster to the analysis.** Fewer manual steps sit between the question and the chart", which names the same thing without a word that could be read as a comment on the workbook. Reason 4 picks up the copy-paste point and now points forward to all three places the packet appears (M3 builds it, M4 exports it, M6 hands it over). No fifth reason, and nothing added to the four.

The TODO callout was worded as a statement of intent. It now reads against the preface: the promise is made, the workbook half of the material does not exist, everything the course currently teaches is on the Explorer.

**`m3-parameters.qmd`.** The callout under the productivity and inflation figures was headed "What the source shows, and where to find more of it". It is now headed **Guidance where you need it** and names itself as the second of the four reasons, in the form the reader meets it. The body adds that each figure sits beside the parameter it informs rather than in an annex at the back. One clause was added to the module opener, so the same idea is visible from the first callout: the treatment arrives beside the control rather than ahead of it.

**`m4-worked-example.qmd`.** One paragraph after Step 6, where the packet is first assembled. It names reason 4 arriving as files, and it puts the time saved where the reference note puts it: the half hour that would have gone on copying numbers into a document goes on the Step 7 paragraph instead, which is the part anyone will read.

**`m6-capstone.qmd`.** One paragraph after the three-part hand-in, connecting the packet to reason 4 in its finished form: assumptions, remarks, presentation-ready output as one handover, so the week goes on the policy question. Separately, one line in "What to use on your desk this week" said the Document it habit is "the difference between analysis and a spreadsheet nobody can defend a year later". A spreadsheet used as the pejorative is Excel disparagement by implication, so it now reads "the difference between an analysis and a set of numbers nobody can defend a year later".

---

### 2. The course-wide sweeps

**Excel disparagement: none.** Every mention of Excel, the workbook or a spreadsheet across the eleven `.qmd` files was read in context. The one that failed was the M6 line above, and it is fixed. The rest are factual: the parity claims in M1, the V1-defaults statements in M1 and M3, the glossary's golden-master definition, the appendix's "It complements, not replaces, the Excel workbook", and M0's self-assessment item "I have never opened Q-CRAFT, in Excel or on the web", which now reads as the both-surfaces framing it should.

Two phrases were checked and kept, because both describe the Explorer's flow rather than characterising the workbook: "Nothing to download, nothing to paste" in the M1 ten-minute run, and "There is no manual data entry" in M3's country selection.

**"Toil": zero.** Not in the prose, not in a figure caption, not in SVG alt text. The word is also absent from the two SVGs that mention Excel at all, which say "IMF Excel workbook" and "AT THE EXCEL TOOL'S DEFAULTS".

**Show-not-tell.** The four reasons are argued twice, compactly in the preface and at length in M1, and after that they are demonstrated: reason 1 in the M1 ten-minute run where the data loads itself, reason 2 in M3's figures beside the controls, reason 3 in the M4 seven-step sequence, reason 4 in M4 Step 6 and the M6 hand-in. The M3, M4 and M6 additions each name their reason in one sentence and then get out of the way, rather than restating the argument.

**Skim discipline.** Headings and first sentences still carry each touched argument on their own. The preface skims as: what Q-CRAFT is, this course teaches it both ways, two surfaces one model, the workbook is built in Excel deliberately, the Explorer exists for four reasons. M3's callout skims as "Guidance where you need it, this is the second of the four reasons". M4 and M6 each open their new paragraph on the reason and its number.

---

### 3. Screenshots

Five pages taken through headless_shell from the default build and looked at: `review-screenshots/preface-both-tools.png`, `m1-argument-card.png`, `m3-guidance.png`, `m4-packet.png`, `m6-packet-reason.png`. The numbered card renders as a card in both the preface and M1. The M6 paragraph closes the nested hand-in list cleanly rather than being absorbed into it, which was the one layout risk in the pass.

---

### 4. Things for you to decide

1. **The promise now outruns the content, and this is the live question.** The preface says both ways and objective 1 says both surfaces. The course has no workbook material: where to download it, how its sheets map onto the three numbers, how to run the M4 case there. M1 carries the TODO. Three options as I see them. Write the Excel half, which is a session of its own and probably its own module rather than a section. Or soften the preface to "this course teaches the Explorer, and points you at the workbook", which keeps the respect and drops the promise. Or ship the promise as written for Sept 1 and treat the workbook half as the next lane, since the session is live and you can demonstrate the workbook without the course containing it. I wrote it as instructed and flagged it rather than choosing.
2. **Reason 3 has the least evidence behind it.** "Fewer manual steps sit between the question and the chart" is the one reason the course never demonstrates with a count. The other three are shown: the data loads itself, the figures sit beside the controls, the packet comes out as files. If you want reason 3 to carry the same weight, the M4 seven-step sequence is where a comparable count would come from.
3. **Everything from run 5 that this run was told to preserve is untouched.** The strengths-and-limitations pairing, the not-an-IMF-product callout, the course map, the eleven exhibits and the kitchen analogy were not edited, and the earlier items under **Things for you to decide** in the run 5 and run 1 sections still stand unanswered.

---

### 5. Commits

```
34a37a8 docs(guide): the preface promises both surfaces, and names the four reasons for the Explorer
9454b99 docs(guide): M1 carries the argument card, Excel respect first and the four reasons in order
a6c44ba docs(guide): the guidance and the packet land where the reader meets them, not as claims
c00850a docs(guide): tighten reason two, the moment the help gets read
39438c8 docs(guide): rebuild the committed PDF from the default render
```

(An earlier PDF rebuild, `f37e40c`, was superseded by `39438c8` after the final wording change.)

---

## Run 5: the map v2, the strengths-and-limitations pairing, and eleven new figures

### Status

Done. Both profiles render clean: `quarto render docs/companion-guide` exits 0 and `quarto render docs/companion-guide --profile brand` exits 0, neither with warnings or unresolved cross-references, and the default build references no Klim stylesheet. The committed PDF is rebuilt from the default render, 93 pages, up from 84 because of the figures. The banned-tics sweep across the eleven `.qmd` files reports zero em-dashes and zero semicolons, and the same sweep run over the text nodes and alt text inside all thirty SVGs reports zero. The skim skeleton still teaches each module's argument from headings and first sentences alone.

Five commits, one per unit of work.

**Marker counts.** DRAFT FOR TEAL is 26, up one, the new one being the kitchen analogy. TODO markers are 14, up three: the Excel half of the both-tools promise in M1, the two coexisting sets of Uganda numbers in M4, and nothing else new.

| | DRAFT FOR TEAL | SCREENSHOT-TODO | WIDGET-TODO | TODO |
|---|---|---|---|---|
| M0 | 3 | 0 | 0 | 0 |
| M1 | 2 | 1 | 1 | 1 |
| M2 | 4 | 1 | 1 | 0 |
| M3 | 5 | 1 | 1 | 0 |
| M4 | 6 | 2 | 0 | 2 |
| M5 | 4 | 0 | 0 | 1 |
| M6 | 2 | 0 | 0 | 2 |

---

### 1. New figures, by module, with screenshot paths

Eleven exhibits, built by `scripts/build_exhibits.py`, in the deck's design language on the course palette: tinted panels, ink banner headers, numbered circles, condensed caps labels. The open set has no condensed face, so the caps are Inter SemiBold with the tracking opened to 1.4, which is the same device in type the repository can actually ship.

Every one was rendered through headless_shell on its own, looked at, and then rendered again inside the built page at reading width. Two screenshots per figure: the figure cropped to the element, and the section around it.

| Module | Figure | What it carries that prose did not | Screenshots |
|---|---|---|---|
| **M0** | The three paths | Three routes over the same seven modules. Path B drops one, Path C drops one and abridges two, and every path ends at the same capstone. | `review-screenshots/m0-paths.png`, `m0-paths-in-page.png` |
| **M1** | Zero to a projection | The ten-minute run as five places you look, two moves in the sidebar and one in each tab, with the file you keep at the end. | `m1-ten-minutes.png`, `m1-ten-minutes-in-page.png` |
| **M1** | The parity check | The pipeline, and underneath it the two claims drawn to their own reach, so the baseline bar is full and the climate bar is not. Replaces the Mermaid diagram. | `m1-parity.png`, `m1-parity-in-page.png` |
| **M2** | The equation, term by term | The Riffle pattern from the Explainer Toolkit: each term tinted, one plain English phrase per term, and only the last one a decision. | `m2-equation-annotated.png`, `m2-equation-annotated-in-page.png` |
| **M2** | The scoreboard, ten years | The equation iterated ten times at three r-g pairs with the primary balance nailed to zero. 66.1, 50.0, 37.8, from arithmetic alone. | `m2-scoreboard.png`, `m2-scoreboard-in-page.png` |
| **M3** | Five controls, three destinations | Every control wired to the number it moves, and the one destination nothing reaches. | `m3-controls.png`, `m3-controls-in-page.png` |
| **M4** | The gate | The seven steps with the sanity check drawn across the middle rather than beside them, its five boxes visible. | `m4-seven-steps.png`, `m4-seven-steps-in-page.png` |
| **M4** | Three readings of a fan chart | A real fan with the gap bracketed, the ceiling crossing marked at the year the series actually crosses, and the flat stretch to 2030 called out. | `m4-fan-readings.png`, `m4-fan-readings-in-page.png` |
| **M5** | One channel in, six out | The modelled chain across the top, the six exclusions below with their User Guide pages, and the shared direction along the bottom. | `m5-exclusions.png`, `m5-exclusions-in-page.png` |
| **M5** | The debt floor | Two panels, the chart as it reads and the chart as it is, so the inversion is visible instead of described. | `m5-debt-floor.png`, `m5-debt-floor-in-page.png` |
| **M6** | The packet and the rubric | Three parts to hand in, beside a weight bar where the first sixty percent is settled before anyone reads a number. | `m6-packet.png`, `m6-packet-in-page.png` |

**Two are drawn from data in the repository rather than asserted.** `m2-scoreboard` iterates the debt dynamics equation itself. `m4-fan-readings` reads the golden-master Uganda run under `packages/qcraft-engine/tests/golden_masters/intermediate/` and finds the ceiling crossing in the series.

**What the vision QA caught, and what it changed.** Three figures were wrong on the first render and were rebuilt, not nudged.

**The debt floor pair had the inversion drawn backwards.** I had the climate line diving further below zero than the baseline, which makes the two panels identical and kills the point. The baseline is the line that goes furthest negative, because it takes no climate damage. Clipping it at zero is what lifts it above the climate scenarios and inverts the picture. Redrawn.

**The fan chart reported the ceiling crossing as 2023.** The series opens at 51.0 percent of GDP on WEO history, above the 50 percent ceiling, and falls back under it within a few years. A naive first-year-above-fifty scan returns the opening year. The crossing that means anything is the upward one after the damage starts, which is 2068.

**The controls diagram was a wiring tangle.** Six routes crossing three buses, a dashed line for the second demography channel, and a grey line wandering across the figure from a defaults panel. Cut to one trunk per destination, the second demography channel stated in the chip's own subtitle rather than drawn, and the defaults stated in a strip rather than wired.

Smaller fixes: eight figures had a source line longer than the 680 unit column, so `frame()` now takes one or two footer lines. Six had collisions between the last element and the footer. The M6 rubric bar was reordered so the two criteria the sixty percent rule refers to sit next to each other.

**Every figure has a sneak-preview sentence before it and a read-out sentence after it.** The first drafts of the captions repeated the read-out almost verbatim, which the in-page shots made obvious, so all eleven captions were rewritten to add something the read-out does not. The seven course maps gained the preview sentence they were missing, and two of the M3 source figures gained a read-out.

**One figure I did not build.** A which-tool-when decision diagram for M5. The existing Q-CRAFT against LIC-DSF table already carries a comparison across six dimensions and a diagram would have restated it with less room. Per your rule, no figure that carries no message.

---

### 2. The preface diff

Three changes. The full diff against the run 4 state is below.

**The honest-broker paragraph is now a pairing.** The practitioners-disagree framing is gone from the preface entirely, and the section heading changed from the label "Where this course stands" to the claim "The tool is broadly applicable and deliberately conservative." Strengths are broad applicability, no bespoke country data, and verification against the original with the parity wording exactly as the shared notes bind it. Limitations are the single modelled channel against the six exclusions, with nonlinearities and country-specific channels named as you specified, citing the User Guide at pp. 5-6 as before. The closing sentence ties them: a tool that runs anywhere on published data cannot carry the channel only your country has.

**The independence statement is a callout under the first section**, where the reader first meets the Explorer, in the repo README's own words. Echoed in the appendix with one sentence added, that nothing in the co-design pitch should be read as criticism of a tool the Fiscal Affairs Department built and made available to everyone.

**"What this course defers to" now names the training materials as well as the User Guide** and says plainly which one wins when they differ.

**M5 leads with the same pairing** in a single breath before its fuller treatment, and its "some practitioners judge" paragraph was recast to lead with the substance instead: the estimates are fitted to the temperature range the world has already lived through, so nonlinearities beyond that range sit outside the estimate rather than being judged small.

```diff
diff --git a/docs/companion-guide/index.qmd b/docs/companion-guide/index.qmd
index 76f4888..a1e6d9e 100644
--- a/docs/companion-guide/index.qmd
+++ b/docs/companion-guide/index.qmd
@@ -8,6 +8,11 @@ The Fiscal Affairs Department built it for its own climate technical assistance,
 
 This course teaches the tool through **Q-CRAFT Explorer**, an open-source Python reimplementation of the IMF's Excel workbook. Teal Insights and NatureFinance develop it and the code is MIT licensed. The economics is the IMF's. The web interface, the automatic data loading and the record of what you assumed are ours.
 
+::: {.callout-note}
+## This is not an IMF product
+Q-CRAFT Explorer and this course are an independent project by [Teal Insights](https://tealinsights.com) and [NatureFinance](https://naturefinance.net). Neither is an official IMF product and neither carries IMF endorsement. Both are meant to be complementary to the IMF's own training materials and to the Q-CRAFT User Guide (Tim and Rahman, 2024), which remain the authoritative references. Where this guide explains a concept it cites the User Guide section behind it, so you can always check the teaching against the source.
+:::
+
 ## The questions it answers
 
 Q-CRAFT answers a narrow set of questions, and it answers each one by comparing two runs of the same model. Four of them, in the register they usually arrive in:
@@ -23,13 +28,15 @@ None of those is a forecast. Each one is a difference between two projections bu
 
 This course is for anyone who has to run, interact with, or otherwise understand this class of fiscal projection tool. Ministry of finance economists come first, because they run the tool and then defend the numbers to the officials who sign them off. IFI and technical assistance staff come second, because they build capacity around tools like this one and a teaching sequence is easier to hand over than a workshop. Researchers and analysts come third, because they read the output and have to decide what it licenses them to say.
 
-## Where this course stands
+## The tool is broadly applicable and deliberately conservative
+
+This guide teaches what the tool does, why it exists, and what it leaves out. The third part belongs with the first two, and the honest way to hold it is as a pairing.
 
-This guide teaches what the tool does, why it exists, and what it leaves out. The third part belongs with the first two.
+**The strengths.** Q-CRAFT runs for most of the world, on data that is already published. It needs no bespoke country dataset, no new survey and no waiting for a mission, so a team can have a first pass by the end of the week. And the arithmetic is open to inspection. This reimplementation is verified against the IMF's original workbook, with baseline parity exact for 147 of 147 tested countries and climate-scenario parity confirmed for ratio metrics. @sec-m1 sets out what that claim covers and what it does not.
 
-Practitioners disagree about Q-CRAFT, and some judge its damage estimates conservative. The tool's own documentation gives them their grounds. The scenarios model the slow effect of temperature on productivity, and they exclude natural disasters, sea-level rise, tipping points and the public spending that adaptation takes (User Guide, pp. 5-6). Under those channels the projected fiscal impact reads as a lower bound rather than as a central estimate of total impact. @sec-m5 sets this out with the sources.
+**The limitations.** The scenarios capture one channel, the slow effect of temperature on productivity. They exclude tipping points, nonlinearities, natural disasters, sea-level rise, the public spending that adaptation takes, and whatever channel is specific to your own country (User Guide, pp. 5-6). Every one of those exclusions is a cost left out, so the results read conservative: a lower bound on fiscal impact rather than a central estimate of the total. @sec-m5 sets this out with the sources.
 
-Knowing a model's limits is part of knowing the model. This is the first in a series of guides to the models behind sovereign climate-fiscal analysis, and each one takes the same three questions: what the model is for, what it computes, and where it stops.
+The two halves are one design choice seen from two sides. A tool that runs anywhere on published data is a tool that cannot carry the channel only your country has. Knowing that is part of knowing the model. This is the first in a series of guides to the models behind sovereign climate-fiscal analysis, and each one takes the same three questions: what the model is for, what it computes, and where it stops.
 
 ## What you will be able to do
 
@@ -49,7 +56,7 @@ Seven modules, each built around something you can do at the end of it.
 |---|---|
 | **[0. How to use this course](m0-start-here.qmd)** | The capstone stated up front, a self-assessment, and the path that fits your background |
 | **[1. What Q-CRAFT does and why it exists](m1-how-qcraft-thinks.qmd)** | A full projection in ten minutes, and the map: three numbers, one equation |
-| **[2. The debt equation](m2-debt-equation.qmd)** | The debt identity rebuilt from words. Skippable if you use it already. |
+| **[2. The debt dynamics equation](m2-debt-equation.qmd)** | The identity rebuilt from ordinary words. Skippable if you use it already. |
 | **[3. Choosing the parameters](m3-parameters.qmd)** | Every parameter set and defended, with the rationale written down |
 | **[4. A worked example, end to end](m4-worked-example.qmd)** | One country from assumptions to a fiscal risk paragraph, then two more with less help |
 | **[5. What the tool can and cannot tell you](m5-boundaries.qmd)** | The strengths, the documented exclusions, and which questions belong to a different tool |
@@ -65,7 +72,7 @@ There is also an [appendix on co-design and the SovTech vision](appendix-codesig
 
 ## What this course defers to
 
-This is an educational companion to the IMF's User Guide (Tim and Rahman, 2024), which remains the authoritative methodology reference. Where this guide explains a concept, it cites the relevant User Guide section so you can go deeper.
+This is an educational companion to the IMF's User Guide (Tim and Rahman, 2024), which remains the authoritative methodology reference, and to the IMF's own training materials, which remain the authoritative teaching materials. Where this guide explains a concept, it cites the relevant User Guide section so you can go deeper. Where the two ever differ, the User Guide is right.
 
 ::: {.callout-note}
 ## This is an initial version
```

---

### 3. Course map v2

**The first node decomposed.** Three compact boxes, each naming its source: macro series from the IMF World Economic Outlook, population from the UN World Population Prospects, and the controls you set. They converge on one bus and feed the three-numbers group with the verb "build". In the tall print layout they run across the top row and converge on a spine.

**Every box a notch smaller.** The pills drop from 194x66 to 186x58, the equation node from 256x128 to 246x122, the paths node from 122x140 to 126x126, and the type with them. The chain has air in it now.

**The equation node is "The debt dynamics equation"**, and the name is adopted course-wide.

**M3's lit set changed with the decomposition.** It now lights all three ingredient boxes plus growth and the primary balance, because the country selection loads two of the ingredients and the sidebar is the third.

The tall layout needed one fix after the first render: the "manufactured into" verb sat under the warming-scenarios box, so `v_arrow` gained a side argument and the verb moved left of the spine.

---

### 4. The equation, renamed course-wide

Twelve places, all of them namings rather than back-references:

| File | Was | Now |
|---|---|---|
| `index.qmd` | "2. The debt equation", "The debt identity rebuilt from words" | "2. The debt dynamics equation", "The identity rebuilt from ordinary words" |
| `m0-start-here.qmd` | "from the debt identity" | "from the debt dynamics equation" |
| `m1-how-qcraft-thinks.qmd` | "the three numbers the debt equation needs" | "the debt dynamics equation needs" |
| `m2-debt-equation.qmd` | chapter title, three body namings, one callout title | all "the debt dynamics equation" |
| `m4-worked-example.qmd` | "the debt equation", "the debt accumulation equation" | both renamed |
| `m5-boundaries.qmd` | "a standard debt equation", "the same debt equation" | both renamed |

Plus the diagram node label, all seven diagram captions and all seven alt texts, which the build script generates.

**Two deliberate non-changes.** Bare anaphoric "the equation", where the thing has already been named in the same passage, is left alone: it is a reference, not a name. And the filename `m2-debt-equation.qmd` is unchanged, because the slug is not reader-facing the way M4's Uganda slug was, and renaming it would churn every link for no gain. Say if you want it moved.

---

### 5. The both-tools note, which arrived mid-run

The shared reference notes gained a binding note during this run: the argument card for teaching Q-CRAFT in both the IMF's Excel workbook and the Explorer, with zero disparagement of Excel anywhere and exactly four reasons for the Explorer. It is not in your five directives, so flag if you would rather I had left it.

**What it broke, and what I did.** M1's section was titled "The Excel workbook calculates well and forgets everything" and the prose under it said the trouble starts after the file is saved, that the next analyst cannot tell a decision from a default, and that the cost lands in capacity development budgets. That is Excel framed as the problem, in the heading, on the page a reader meets second. Rebuilt as "Q-CRAFT runs in a published Excel workbook, and in this Explorer": the workbook is a deliberate and sound decision, every ministry has Excel, staff know it, and a Fund tool has to run in nearly two hundred countries without assuming infrastructure. Then the four reasons, named and no others: data currency, guidance where you need it, fewer steps to the analysis, the export packet. The word "toil" appears nowhere in the course.

**One thing I could not do honestly.** The card's promise is that we teach running Q-CRAFT both ways. This course teaches the Explorer only, and there is no Excel walkthrough to point at. Writing the promise into the prose would have been a claim the artifact does not keep, so the section states what is true and a TODO names exactly what is missing: where to download the workbook, how its sheets map onto the three numbers, and how to run the M4 worked case there. **Scope call for you:** that is a substantial addition to a course already at 93 pages, and it is the sort of thing that wants its own module rather than a paragraph.

The vignette about the analyst who cannot tell a decision from a default moved out of M1, since it was the disparagement, and M3 keeps its own version of it, where it argues for the record rather than against a file format. M3's back-reference to "the vignette from @sec-m1" was retired with it.

---

### 6. The kitchen analogy, DRAFT FOR TEAL

In M1, after "everything else the tool does is manufacturing g, r and pb", marked optional and skippable. The pantry holds ingredients somebody else bought, the WEO and UN series. The seasoning is yours, the sidebar controls. Three components are prepared before anything else, g, r and pb. There is one recipe, the debt dynamics equation, and it never changes.

**The break-point is stated, per the Explainer Toolkit rule**, and it is two things. A cook tastes and adjusts, and this model does not, which is the partial-equilibrium limit stated two paragraphs above it. And a recipe is a claim about what will come out of the oven, where a projection to 2099 is a comparison between two dishes made from deliberately different seasoning.

Cut it if it reads twee. Nothing depends on it.

---

### 7. Two things worth your eye

**The M4 numbers now disagree with themselves, on purpose.** The new fan chart is the Explorer's own golden-master run on WEO October 2024 at tool defaults: baseline 47, Hot Unadapted 127, a gap of 80 points, ceiling crossed in 2068. The prose in the same module quotes the published 2023 workshop: baseline 47.5, Hot 66, a gap of 18.5. Both are right for what they are, and the whole of the difference is vintage and parameter choice, which is the point M1 already makes about why the export packet exists. I have marked it with a TODO rather than resolving it, because which set leads is an editorial call. The figure's caption states the discrepancy and its cause, so a reader who only looks at the picture is not misled.

**The M6 rubric weights are now in a figure.** They come from a DRAFT FOR TEAL callout, so the figure's source line says they are a proposal rather than a decision, and the bar was reordered so assumptions and baseline sit adjacent and the sixty percent underline is honest. If the weights change, the figure changes with them: it is generated, not drawn.

---

### 8. Commits

```
b3fae01 docs(guide): course map v2, sourced ingredients, and the debt dynamics equation named course-wide
39d87c7 docs(guide): strengths and limitations as a pairing, and this is not an IMF product
3e4ea91 docs(guide): eleven module exhibits, in the deck's design language on the open faces
ad7e62f docs(guide): the visual pass lands in the prose, plus the both-tools recast and the analogy
```

Nothing pushed, no remotes added.

---


## Run 4: the titles, the course map, the preface, the honest broker, and M3's source figures

### Status

Done. Both renders pass: `quarto render docs/companion-guide` exits 0 and `quarto render docs/companion-guide --profile brand` exits 0, both with no warnings and no unresolved cross-references. The brand render is the only one that references `_brand-fonts.css`. The committed PDF is rebuilt from the default render, 84 pages. The banned-tics sweep across the eleven `.qmd` files reports zero em-dashes, zero semicolons and zero hits on the tic list. DRAFT FOR TEAL is back to 25, the two run 3 title callouts having been retired by the new title set.

Seven commits, one per unit of work.

---

### 1. The title set, DRAFT FOR TEAL

All seven built as you specified. The sidebar now reads as a map of what you learn rather than as a list of claims.

| | Title as built | Was |
|---|---|---|
| **M0** | How to use this course | Start here: the analysis you will defend |
| **M1** | What Q-CRAFT does and why it exists | One equation decides the debt path; the rest of the tool builds its three inputs |
| **M2** | The debt equation | You already know the debt equation |
| **M3** | Choosing the parameters | Every parameter is a judgment call you can defend |
| **M4** | A worked example, end to end | Uganda end to end: from assumptions to the Fiscal Risk Statement paragraph |
| **M5** | What the tool can and cannot tell you | Know what the tool cannot tell you |
| **M6** | The capstone | The capstone: your analysis, defended |

**Three consequences worth your eye.**

**M2's old title was the presumption formulation you banned**, in the sidebar, on every page of the book. That one fixes itself.

**M5's title now promises both halves**, which is why the module needed the strengths section in item 4 below. A title that says "can and cannot" and then delivers only "cannot" is a worse position than the old title was.

**M4's file is renamed** from `m4-uganda-end-to-end.qmd` to `m4-worked-example.qmd`. I flagged in run 3 that the table of contents was the last place a reader in Addis met Uganda before the framing that explains why it is the worked case. The URL was the other place. Every reference in `_quarto.yml` and the preface moved with it. The other six filenames are unchanged, because they were already neutral and renaming them would break links for no gain.

**Cross-references did not need touching.** Every internal reference in the course goes through `@sec-m0` to `@sec-m6`, which Quarto renders as "Chapter N". No title text was hard-coded anywhere in prose. The preface's organisation table is the one place titles appear as text, and it carries the new set.

---

### 2. The course map, redesigned, with the screenshots

The Mermaid version is gone. `scripts/build_course_map.py` hand-authors the SVG, on the course palette and the bundled open faces, and emits a variant per module plus the Quarto include that places it.

**The chain, left to right:** country data and your assumptions **build** the three numbers the equation needs (growth *g*, the interest rate *r*, the primary balance *pb*, each with its suppliers named underneath) which **feed** the debt equation, shown with the identity itself, which **makes** the debt paths, drawn as a small fan so the last node reads as a chart at a glance. Warming scenarios sit below the chain on a dashed teal bus that enters growth and the primary balance and never touches the equation, with the sentence "Warming lowers growth, and weakens the primary balance when spending is rigid. It never enters the equation directly." printed beside it.

**What each module lights**

| Module | Lit | Caption |
|---|---|---|
| M0 | debt paths | the destination, so the course has a visible end |
| M1 | *g*, *r*, *pb*, the equation | the middle of the chain |
| M2 | the equation | one node, and the module never leaves it |
| M3 | inputs, *g*, *pb* | the start of the chain and the two numbers the controls move |
| M4 | debt paths | the output end |
| M5 | warming scenarios, debt paths | the two ends of the climate channel |
| M6 | everything | the capstone runs the chain end to end |

**Screenshots, in `review-screenshots/`.** Rendered with `headless_shell` (the Chromium shell Playwright ships, not a Chrome install) over the built book, at 1500 by 1000 at 2x. Each figure appears twice: cropped to the figure, and again in its page so you can judge it at reading size.

| Figure | In page |
|---|---|
| `course-map-m0.png` | `course-map-m0-in-page.png` |
| `course-map-m1.png` | `course-map-m1-in-page.png` |
| `course-map-m2.png` | `course-map-m2-in-page.png` |
| `course-map-m3.png` | `course-map-m3-in-page.png` |
| `course-map-m4.png` | `course-map-m4-in-page.png` |
| `course-map-m5.png` | `course-map-m5-in-page.png` |
| `course-map-m6.png` | `course-map-m6-in-page.png` |

**What the iteration changed.** Three passes, each one driven by looking at a render rather than at the source.

1. The first version was drawn at 1240 units wide and placed in Quarto's `.column-page`. In a book with a sidebar and a table of contents, that class overlaps both: the figure ran under the navigation on the left and the contents on the right. Dropped the class and resized the drawing to 952 units, which sets at about three quarters size in the body column.
2. At 952 units the first attempt put the pill supplier lines on one line each and the labels came out too small to read. Pills grew to two lines, type went up a step, and the panel gutter widened to 20 units so the warming bus stopped looking as though it ran through the interest-rate pill.
3. The verb on the last arrow was "makes" at a gap of 44 units, which touched the Debt paths box. Gaps went to 52 and the equation box gave up 14 units to pay for it.

**One thing the brief did not anticipate: the PDF.** A three-to-one horizontal figure placed across a 6.5 inch text column is two inches tall, and five tiers of text in two inches sets at about five point. The generator therefore emits a second layout from the same node content: the same chain folded onto four rows, 680 units wide, which sets its labels at ten point in print. The HTML gets the horizontal chain you asked for; the PDF gets the folded one. Page 16 of the committed PDF is the M1 instance if you want to check it.

---

### 3. The preface, rebuilt

Five sections replace the four-paragraph opener. The skim skeleton, headings plus first sentences, is at the end of this section.

| Section | What it now does | What was there before |
|---|---|---|
| **What Q-CRAFT is** | The IMF Fiscal Affairs Department's tool, what it takes in and puts out, built for FAD's climate technical assistance, the September 2023 Uganda mission as the example, and Uganda's FY 2024/25 Fiscal Risk Statement as where the results end up. Then the Explorer, and the line that the economics is the IMF's while the interface, the data loading and the record are ours. | One sentence: "an open-source Python reimplementation of the IMF's Quantitative Climate Risk Assessment Fiscal Tool." A reader who did not already know what Q-CRAFT was learned nothing. |
| **The questions it answers** | Four questions in the register they arrive in, from "where is our debt ratio in 2050" to "which assumption moves the answer most", followed by the line that none of them is a forecast and each is a difference between two projections. | Absent. |
| **Who this is for** | The same three audiences, tightened to one paragraph with a reason attached to each. | Two sentences, four groups, no reasons. |
| **Where this course stands** | The honest-broker stance: what the tool does, why it exists, what it leaves out; that practitioners disagree and some judge the damages conservative; the User Guide's own exclusion list with a page citation; that outputs read as a lower bound under those channels; and that this is the first in a series. | Absent. |
| **What you will be able to do** | Three numbered objectives: run it, understand what you are doing, interpret the output with its strengths and limits. | Two objectives in a sentence. |

**What survived unchanged:** the colophon on typography and reproducibility, the User Guide deference note, the initial-version callout, the Try the App callout, the glossary and references pointers, the appendix pointer, and the multi-country exemplification paragraph from run 3. The organisation table carries the new titles and a new row description for M4 and M5.

**One addition to the colophon**, three sentences long: the figures are built from the repository by two named scripts. It belongs there because the reproducibility claim now covers the figures as well as the type.

**The preface skim skeleton**

```
# Preface
## What Q-CRAFT is
    Q-CRAFT is the IMF Fiscal Affairs Department's tool for projecting public finances under climate warming.
    The Fiscal Affairs Department built it for its own climate technical assistance, and that is where it is used.
    This course teaches the tool through Q-CRAFT Explorer, an open-source Python reimplementation of the IMF's Excel workbook.
## The questions it answers
    Q-CRAFT answers a narrow set of questions, and it answers each one by comparing two runs of the same model.
    None of those is a forecast.
## Who this is for
    This course is for anyone who has to run, interact with, or otherwise understand this class of fiscal projection tool.
## Where this course stands
    This guide teaches what the tool does, why it exists, and what it leaves out.
    Practitioners disagree about Q-CRAFT, and some judge its damage estimates conservative.
    Knowing a model's limits is part of knowing the model.
## What you will be able to do
    Three objectives, weighted equally.
    The first objective takes an afternoon.
## How the course is organised
    Seven modules, each built around something you can do at the end of it.
    The tool covers most of the world, so the examples move country by country and the mechanism picks the country.
    Start at Module 0.
## What this course defers to
    This is an educational companion to the IMF's User Guide (Tim and Rahman, 2024).
## Colophon
    This course is open source under the MIT license, and it builds completely from what is in its repository.
    Teal Insights also publishes a house edition of the same content.
    The figures are built from the repository too.
```

---

### 4. M5, carrying the honest-broker load

**Strengths first, in a new section.** Four of them, each traced to the brief the tool was built against: it isolates one channel and models it from data; it runs on data every country already has; it is comparable across countries; and it produces the shape a fiscal risk chapter needs. The closing paragraph says the limitations in the rest of the module follow from the same brief, which is what stops them reading as oversights.

**I read the User Guide rather than citing from memory.** `2024_IMF-FAD_Q-CRAFT-User-Guide-v10.pdf` in the Dropbox source-materials folder, pages 5 and 6. Three quotations are now in the module, verbatim and cited:

- the set-up is "essentially a partial-equilibrium" one (p. 5)
- the results "do not account for the potential impacts of climate change induced natural disasters, sea-level rise risks and other environmental risks, rendering the outcomes conservative" (p. 5)
- Q-CRAFT "is not a forecasting model nor a general equilibrium model of the economy" (p. 6)

The second one is the useful find. The conservatism claim is not an inference the course is making about the IMF's tool. It is the tool's own documentation, in its own voice, and that is a much stronger position to write from.

**The exclusion table gains a citation column**, one page number per row, all six of them from pages 5 and 6.

**Two new paragraphs after the table.** That some practitioners judge the damages conservative beyond the exclusion list, with the reason stated as an empirical one: the estimates are fitted to historical variation in temperature and carry no information about ranges the world has not seen. And that partial equilibrium is a limit of a different kind, because its sign is not obvious. It flatters a consolidation scenario and it also leaves out whatever growth an adaptation programme would buy. Keeping it out of the exclusion table preserves the table's one useful property, which is that every row runs the same direction.

---

### 5. M3's source-data figures

Five figures, built by `scripts/build_parameter_context.py` from `data/processed/*.parquet`, the same inputs the Explorer runs on. The script is committed; the Parquet is not, because the repository already ignores it, and the script says so and fails with a clear message if the directory is absent.

| Figure | Parameter | What it shows |
|---|---|---|
| `param-country-context` | Country selection | Debt-to-GDP for Ethiopia, Thailand and Uganda, 2001 to 2029, forecast years shaded |
| `param-demography-variants` | Demography variant | Working-age population under Low, Medium and High, indexed to 2024, log scale, one panel per country |
| `param-rigidity-record` | Expenditure rigidity | Revenue and primary expenditure as shares of GDP, so the reader can see whether spending tracked the economy |
| `param-productivity` | (not exposed in V1) | Growth in output per worker, five-year trailing average, against the 1.2 percent long-run default |
| `param-inflation` | (not exposed in V1) | GDP deflator growth, history and WEO forecast, against the 3.5 percent long-run default |

**Screenshots** in `review-screenshots/`: `param-country-context.png`, `param-demography-variants.png`, `param-rigidity-record.png`, `param-productivity.png`, `param-inflation.png`, each with an `-in-page` sibling.

**One consistent trio of countries**, Ethiopia, Thailand and Uganda, so the reader learns one cast rather than five. Ethiopia's working-age population is still climbing, Thailand's has turned down, and Uganda is the worked case.

**The debt target gets no figure, and the text says so.** It is a policy choice rather than a published series. Inventing a figure for it would have been the wrong kind of completeness, so the section points at the country figure and at whatever anchor the reader's own fiscal framework already sets. The fiscal rule is the same case and gets the same treatment.

**Colour.** Country series use the first three slots of the validated categorical palette, which clear every all-pairs gate on a white surface (worst CVD deltaE 9.2, worst normal-vision deltaE 24.0). The three UN variants are ordered rather than categorical, so they use a single-hue blue ordinal ramp, monotone in lightness with the light end at 2.11:1 against the surface. Aqua sits below 3:1 on white, which obliges visible labels rather than a legend, so every series carries a direct label at its line end with collision handling.

**The note you asked for** sits in a callout in the module: every figure comes from the same Parquet the Explorer runs on, and the Explorer is gaining interactive context panels that do the same job at the point of decision.

**Two figures needed a second pass after looking at them.** The demography panels were on a linear axis, which clipped Ethiopia's High variant at 374 and Thailand's Low at 24; a log scale with ticks at 25, 50, 100, 200 and 400 fits both and makes "doubling" and "halving" read symmetrically. The inflation panel had Ethiopia's series escaping the plot area entirely, so every panel now clips to its own area and the reference-line labels sit on a white relief.

---

### 6. The tone sweep

Five presumption formulations, all fixed. The whole-course sweep found no "obviously", no "simply", no "of course", and no "just".

| Where | Was | Now |
|---|---|---|
| M0, In this module | "You will calibrate what you already know" | "You will calibrate your own starting point" |
| M0, question 1 answer | "you are carrying the most expensive misconception in this material" | "that is the most expensive misconception in this material" |
| M1, Excel section | "Every Ministry of Finance has it and every economist knows how to use it" | "Every finance ministry has it, and putting it in front of someone costs no training budget" |
| M1, fast-path marker | "If the last two sentences were already obvious, skip it" | "Skip it if that arithmetic is part of your working week" |
| M2, opener | "one line of arithmetic that has been in every debt sustainability analysis you have ever read" | "one line of arithmetic that sits under every debt sustainability analysis" |

**The rule I applied to the fast-path markers**, because they were where most of the risk sat: a fast-path marker states a condition the reader answers about themselves ("skip it if that is part of your working week"), never a fact the author asserts about the reader ("you already know this"). M2's and M3's markers already worked that way and did not need touching.

**Condescension in the other direction** turned up nothing to fix. There is no flattery, no "as a busy expert", and no assumed seniority.

---

### 7. Things to check before Sept 1

**The country-coverage number, and I did not change it.** Three figures are in circulation and at most one of them can be right.

- M1 says the Excel workbook "covers 197 economies". The User Guide, page 5, says Q-CRAFT projects "for 171 economies".
- M3 says "Q-CRAFT Explorer currently covers 197 countries". The bundled Parquet has 197 countries in macrofiscal, demography and climate, but only 176 in productivity, so 175 countries appear in all four and only those 175 can be selected.

Both look like errors and both are one-line fixes. I left them alone because your brief froze substance and verified claims, and because the source-of-truth hierarchy in AGENTS.md puts the User Guide above my own reasoning without telling me which of the two numbers you intend the sentence to describe. The fixes, if you want them: M1's "covers 197 economies" becomes "covers 171 economies"; M3's "currently covers 197 countries" becomes "currently offers 175 countries, those with complete coverage across all four input datasets".

**The M1 opening section still argues against Excel at some length.** It survived every pass because nothing in any brief has touched it, but under the new title ("What Q-CRAFT does and why it exists") it reads as the second thing the module says, and the preface now covers what Q-CRAFT is and why it exists rather better. Worth deciding whether that section shrinks.

**Zambia is still `TIMEOUT` in `verification-logs/parity_results.csv`** and it is still the country the M4 independent problem sends people to. Flagged in run 3, unchanged since, and it needs one person to load it in the Explorer once before a room tries it.

---

### Marker inventory after run 4

| Module | DRAFT FOR TEAL | SCREENSHOT-TODO | WIDGET-TODO | Other TODO |
|---|---|---|---|---|
| M0 | 3 | 0 | 0 | 0 |
| M1 | 1 | 1 | 1 | 0 |
| M2 | 4 | 1 | 1 | 0 |
| M3 | 5 | 1 | 1 | 0 |
| M4 | 6 | 2 | 0 | 1 |
| M5 | 4 | 0 | 0 | 1 |
| M6 | 2 | 0 | 0 | 2 |
| **Total** | **25** | **5** | **3** | **4** |

DRAFT FOR TEAL was 27 at the end of run 3. The two title-amendment callouts in M0 and M1 are gone, retired by the new title set, and the set is staged here instead. No new ones were added.

---


## Run 3: generalize the address, and the dual-skin typography

### Status

Done. Both renders pass: `quarto render docs/companion-guide` exits 0, and `quarto render docs/companion-guide --profile brand` exits 0. HTML and PDF both build, no warnings, no unresolved cross-references, and the committed PDF is rebuilt from the default render. The banned-tics sweep is at one deliberate hit, the M1 title's semicolon, which is your wording. DRAFT FOR TEAL moves from 25 to 27, the two new ones being the title-amendment callouts you asked for.

Fourteen commits, one per unit of work.

---

### 1. The M0 title amendment, and the M1 title amendment

Both are amendments to titles you approved. Both are built with the line your amendment specified, both carry a DRAFT FOR TEAL callout under the title in the rendered book, and both callouts point here.

**M0. Built with: "Start here: the analysis you will defend"**

Was "Start here: what you will walk into your minister's office with", and before run 2 it was the Permanent Secretary's office. The office had to go, because the course now addresses ministries that do not share an org chart, and because your amendment says the deliverable is defended to the senior officials who sign it off rather than delivered to a named desk.

| | Candidate | What it buys |
|---|---|---|
| **A (built)** | Start here: the analysis you will defend | Names the performance. "Defend" is the verb the whole course is built on and it recurs in M3, M4 and M6. |
| **B** | Start here: what you will have to defend, and to whom | Keeps the audience in the title without naming an office. Longer, and the "to whom" is answered in the first paragraph anyway. |
| **C** | Start here: the document you will be asked to stand behind | Concrete about the artefact rather than the act. Reads slightly more anxious, which may be right for a risk document. |

**M1. Built with: "One equation decides the debt path; the rest of the tool builds its three inputs"**

Was "One equation decides the debt path, and seven modules feed it".

| | Candidate | What it buys |
|---|---|---|
| **A (built)** | One equation decides the debt path; the rest of the tool builds its three inputs | Your wording, verbatim. One caveat: the semicolon is the only hit in the banned-tics sweep, because `style-guide-writing-AI.md` rule 9 treats a semicolon as the em-dash tic wearing a different hat. It arguably earns its place here as a true antithesis. |
| **B** | One equation decides the debt path. The rest of the tool builds its three inputs. | Same words, two sentences, no semicolon. Clears the sweep and loses nothing. This is the one I would pick. |
| **C** | Three numbers decide the debt path, and one equation combines them | Leads with the three, which is the thing the module is now organised around. Slightly weakens "one equation decides", which is the line M2 and M6 call back to. |

**M4's title is not amended, and it may need to be.** It still reads "Uganda end to end: from assumptions to the Fiscal Risk Statement paragraph", which is the approved line, and your amendments named only M0 and M1 for title work. I did not extend the amendment on my own. The module now opens by saying Uganda is the worked case because its numbers are checkable, the faded problems run on Ethiopia and Zambia, and a "Now do your own country" callout sits between them. The one place a reader in Addis still meets Uganda before any of that framing is the table of contents. If that fails your test, the candidate is "A worked case end to end: from assumptions to a fiscal risk paragraph", and it is a one-line change.

---

### 2. The terminology sweep

Counts are over the eleven `.qmd` files, measured against `5da84ef`, the run 2 tip.

| Term | Before | After | Where the survivors are |
|---|---|---|---|
| "minister", "minister's office" | 7 | 1 | The M0 title callout, quoting the old title back to you |
| "Permanent Secretary", "PS" | 0 | 1 | Same callout, same reason |
| "shilling", "shillings" | 8 | 1 | The M4 model write-up, which is the Uganda worked case and should say shillings |
| "MoFPED" | 4 | 1 | M4, with a one-line gloss, per your rule for the worked case |
| "Climate Finance Unit", "macro team" | 3 | 0 | Gone. M0's path table now routes by what the reader knows, not by which unit they sit in. |
| "seven modules" | 21 | 3 | The M1 title callout, the widget TODO, and the one-line architecture aside |
| The word "Uganda" | 80 | 56 | 35 of the 56 are in M4, which is the worked case |

**What replaced the named office.** The capstone is now defended to "the senior officials who sign the document off" (M0, M6). The question in M2 arrives "from senior officials". The thirty-second answer in M5 is given to "the senior official who will have to defend it". The M3 challenges dropped the office entirely, because the challenge works without one.

**What replaced the reader's assumed document.** The capstone deliverable is "a two-paragraph draft in the register of your ministry's fiscal-risk documentation. In the worked example that document is Uganda's Fiscal Risks Statement."

**Where Uganda deliberately stays.** Data, verification claims, the worked case, and every published figure. The FY 2024/25 Fiscal Risk Statement is still the model document in M0 and M4, the C-PIMA workshop is still the provenance of the 47.5 and 66 percent figures, and Uganda is still named as the golden-master verification country. Nothing was scrubbed.

---

### 3. Multi-country exemplification

The mechanism picks the country, not the other way round. Current spread:

| Country | Where | What it is there to teach |
|---|---|---|
| **Ethiopia** (11) | M1 demography, M3 demography exercise, M4 completion problem | A working-age population still climbing through the century. Paired against Thailand so the variant control has a visible effect in both directions. |
| **Thailand** (4) | M1 demography, M3 demography exercise | A working-age population that has already turned down. The contrast case. |
| **Vietnam** (1) | M1 productivity | Convergence. The logistic curve is abstract until you put a catch-up economy on it. |
| **Zambia** (4) | M1 interest rates, M2 second run, M4 independent problem | An interest-growth differential that runs the wrong way, and the concessional-to-commercial transition that produced it. |
| **Bangladesh** (2) | M1 climate, M5 exclusions | High exposure on the modelled temperature channel, and the clearest case of what the channel leaves out, since sea-level rise is not in the model. |
| **Uganda** (56) | M4 worked case, plus published figures elsewhere | The verification country. Every number quoted from it is in a published document. |

The early win in M1 now runs on the reader's own country, with Uganda offered as the run they can check against a published result. The M2 predict-observe-explain runs on their country, then on a commercial borrower so the sign of $r$ minus $g$ flips in front of them. The M6 capstone defaults to their country and steers away from Ethiopia and Zambia, which the faded problems already used.

One thing to check before Sept 1: in `verification-logs/parity_results.csv`, Ethiopia, Thailand and Vietnam are `PARITY_PASS`, and **Zambia is `TIMEOUT`** and Bangladesh is `PYTHON_ERROR`. Those are verification-harness results rather than proof the app fails, and neither country is used for an exercise that depends on a checked number. Zambia is the independent problem, though, so someone should load it in the Explorer once and confirm it runs before a room full of people tries it. Bangladesh is prose only.

---

### 4. The intuition map

The "Seven modules" node is gone. It named a count where every other node named a function, so the map taught the repository's architecture rather than the economics.

The chain in all seven modules is now: country data plus your assumptions, manufactured into growth $g$, the interest rate $r$, and the primary balance $pb$; climate scenarios move $g$, and $pb$ through rigidity; the equation turns the three into debt paths; the paths become your write-up. Each module lights its own nodes and carries its own caption.

**M1 was rebuilt on that chain**, which was the larger job. The seven-module diagram and the seven-row module table are gone. Growth, the interest rate and the primary balance are now the three sections, and every mini-diagram and paragraph of substance survives underneath the number it feeds. The self-check answers name numbers instead of modules. "Seven modules" survives as a one-line architecture aside linking to the engine package.

**Cross-lane consequence.** The lane 2 widget was specified as `seven-modules-to-one-equation`. The WIDGET-TODO anchor in M1 is now `three-numbers-to-one-equation` and says the widget has to be rebuilt on the three-inputs chain before it is embedded. Same binding correction, and lane 2 should see it.

---

### 5. Typography: two skins, and the reproducibility claim verified

**Bundled, with licences.** `docs/companion-guide/fonts/open/` carries Inter (Regular, Italic, SemiBold, Bold), IBM Plex Serif (Regular, SemiBold, Bold) and IBM Plex Mono (Regular, Italic, Bold) as woff2, 852 KB in total, each family with its SIL Open Font License text beside it. `fonts/open/README.md` records the release each file came from and its SHA-256, so the bundle can be re-verified rather than trusted.

**Self-hosted.** The Google Fonts `@import` is out of `_custom.css`, replaced by ten `@font-face` declarations pointing at the bundled files. `fonts/` is registered as a Quarto project resource so it is copied into `_book/`.

**One thing the brief did not anticipate.** Removing that `@import` was not enough. Flatly is a Bootswatch theme, and Bootswatch compiles its own `@import` of Lato from `fonts.googleapis.com` into the top of the bundled Bootstrap stylesheet. Every page was still calling a font CDN. `_theme.scss` sets `$web-font-path: false`, which suppresses it, and points Bootstrap's own component stacks at the same two-tier stacks the prose uses.

**The stacks**, as CSS variables in `_custom.css`:

```css
--qc-font-sans:    "Söhne", "Inter", system-ui, sans-serif;
--qc-font-display: "Tiempos Headline", "IBM Plex Serif", Georgia, serif;
--qc-font-mono:    "Söhne Mono", "IBM Plex Mono", monospace;
```

Display serif on `h1`, `h2` and the book title; sans on body and `h3` down; mono on code. The hierarchy reads the same in both skins.

**The brand profile.** `_quarto-brand.yml` does one thing: it adds `_brand-fonts.css`, which declares Söhne, Söhne Mono and Tiempos Headline at `/fonts/klim/`. No Klim file is in the repository. The default render never references the brand stylesheet, and where the Klim files are absent every declaration fails to load and each stack falls through to the bundled open face.

One deployment detail: Quarto rewrites the leading slash. The source says `/fonts/klim/soehne-web-buch.woff2`, and the copy in `_book/` says `fonts/klim/soehne-web-buch.woff2`, resolved against the book root. That is Quarto normalising site-root paths so a book works under a subdirectory, and it means a licensed deploy must place the Klim files at the book root rather than at the domain root. The file names follow the Klim web kit convention and a deploy should check them against the kit it was issued.

**The claim, and what verifies it.**

| Claim, as written in the README and the colophon | How it was checked | Result |
|---|---|---|
| Default render passes | `quarto render docs/companion-guide` | exit 0, HTML and PDF |
| Brand render passes | `quarto render docs/companion-guide --profile brand` | exit 0, and the page links both `_custom.css` and `_brand-fonts.css` |
| The default render never references the Klim skin | `grep -c brand-fonts _book/index.html` | 0 |
| No Klim font file is in the repository | `git grep -il "soehne\|söhne\|tiempos" -- '*.woff2' '*.otf' '*.ttf'` | no matches |
| No Google Fonts reference in the course | `git grep -in "fonts.googleapis\|fonts.gstatic" -- docs/` | no matches |
| No font CDN call in the built site | grep over every built `.html` and `.css` for `fonts.googleapis`, `fonts.gstatic`, `use.typekit`, `fonts.bunny.net` | zero hits |
| Every open `@font-face` resolves to a file that exists | parsed every `url()` in the built CSS and stat'd the target | 10 of 10 present |
| Klim declarations degrade rather than break | same parse under the brand profile | 9 of 9 absent, each stack falls through |

**Prose.** A "Typography and reproducibility" section is in the repo README, and a "Colophon" section closes the preface. Both say the same three things: the course is MIT and builds completely with the bundled open fonts, the Teal Insights house edition uses licensed Klim faces where the licence permits, and anyone can reproduce everything with the open stack.

---

### Cross-lane findings

1. **`apps/qcraft-app/www/styles.css` line 3 still imports Inter from Google Fonts.** Same defect as the course had, in the artefact ministries will actually open, and it will fail in a network that blocks the CDN. I did not touch it, on the same reasoning run 1 gave for `app.py`: it is another lane's file and editing it risks a conflict. The fix is to delete the `@import` and point the app at self-hosted copies of the same files now sitting in `docs/companion-guide/fonts/open/inter/`.
2. **`apps/qcraft-app/app.py` still says NGFS in six places.** Unchanged from run 1's report and still worth fixing before Sept 1.
3. **The lane 2 widget spec changed under it.** See section 4.

### Things for you to decide

Run 1's open items 1, 2, 4 and 5 and run 2's item 1 all still stand. New or changed:

1. **The two title amendments and the M4 title question**, all in section 1.
2. **MathJax is still a CDN call.** The built pages load MathJax and a polyfill from `cdn.jsdelivr.net` and `cdnjs.cloudflare.com`, which is Quarto's default math engine. Fonts are now fully local; equations are not. I narrowed the colophon wording to claim exactly what is true (the same three faces offline, and no font fetched when a reader opens a page) rather than claim a fully offline page. Self-hosting MathJax is a separate decision with a real repository-size cost, and it was outside this brief.
3. **The M2 perspective anchor changed.** It was "for Uganda, 1.4 percent of GDP is on the order of the annual budget for a mid-sized ministry", which run 2 flagged as unverified. It is now the same 1.4 percent set against a stated revenue ratio, so it is arithmetic rather than a claim, and it works for any country. That is a substance-adjacent edit in a run whose brief froze substance, and it is the only one. Say the word and it reverts.
4. **Ethiopia's debt target in the M4 completion problem is left open on purpose.** The task says to use Ethiopia's own fiscal anchor if the learner can establish one and 50 percent of GDP if not. I could not verify a legislated Ethiopian debt anchor and would not assert one. Leaving it open is defensible pedagogy, since finding out whether your country has an anchor is part of the job, but it is a choice you should see.

### Not done, and why

- **The M4 title.** Argued above. Your amendments named M0 and M1, and titles are approved artefacts, so I staged the option rather than taking it.
- **The app and the widgets.** Cross-lane, reported rather than edited.
- **Screenshots.** The five SCREENSHOT-TODO markers are unchanged and no screenshot was fabricated. The M1, M2, M3 and M4 markers still name Uganda, which is correct: they illustrate the worked case.
- **The 197 versus 175 country-count disagreement.** Still untouched, still needs a number changed, still yours.

### Commits

```
b6263c1 docs(guide): bundle the open faces and self-host them, no CDN
349b045 docs(README): typography and reproducibility, the two skins and what each needs
681baad docs(guide): rebuild the intuition map on the three numbers the equation needs
55c0d36 docs(guide): name the reader in the preface, spread the examples, add the colophon
5501e9f docs(guide): M0 addresses any ministry, and its title names the performance
87fd33b docs(guide): M1 teaches the three numbers, not the seven modules
c43fe87 docs(guide): M2 loses the named office, the shillings and the unverified anchor
ca090f0 docs(guide): M3 sets parameters for the reader's country, not for Uganda
9b01f6c docs(guide): M4 is a worked case, and the faded problems leave Uganda
992ea65 docs(guide): M5 and M6 drop the named office and default country
4cb60c8 docs(guide): break the preface list into sentences, no semicolons
2d3f8ba docs(guide): rebuild the committed PDF after run 3
1064d81 docs(guide): stop the Bootswatch theme fetching Lato from Google Fonts
70806aa docs(guide): rebuild the committed PDF from the default render
```

---

## Run 2: the skim pass

### Status

Done. `quarto render docs/companion-guide` passes clean (exit 0, no warnings, no unresolved cross-references), HTML and PDF both build, and the committed PDF artifact is rebuilt. The banned-tics sweep reports zero hits across all eleven `.qmd` files, down from 60. The DRAFT FOR TEAL count is unchanged at 25, and every one of them has been rewritten in place as finished prose with its marker kept.

One commit per module, so each diff reads as one editorial decision.

### The skim test, per module

The test: extract only the headings and the first sentence of every paragraph, and check that the skeleton alone teaches the module's argument. Tables, lists, code blocks and block quotes are excluded, which is the strict version. Transcribed below, generated mechanically from the committed files.

### m0-start-here.qmd

```
# Start here: what you will walk into your minister's office with
    **In this module**
    You will see the deliverable the whole course builds toward, so you can judge every later module against it.
## Fast path
    Short on time?
## The deliverable already exists, and Uganda published it
    Uganda has already published the document this course teaches you to write.
    That section came out of a five-day workshop.
    You will produce two things by the end of the course:
    That packet is the capstone.
## This course defers to the User Guide
    The IMF's User Guide (Tim and Rahman, 2024) remains the authoritative methodology reference.
## By the end of this module you can
## Where you are in the course
    Only the destination is lit, because that is the only part you need to hold right now.
## Self-assessment: which of these describes your Monday?
    Three rows, one answer each: long-term fiscal projection, climate-fiscal analysis, and the tool itself.
    **On long-term fiscal projection:**
    **On climate-fiscal analysis:**
    **On the tool itself:**
    Write your three answers down.
## Three questions before you start
    Three questions follow, and they check which intuitions you are carrying in rather than what you have memorised.
## DRAFT FOR TEAL: concept-inventory question 1 (interest-growth differential)
    **Question.** A country's government runs a primary balance of exactly zero: revenue equals non-interest spending, to the shilling.
## Answer
    **(c) Rise.** Debt grows at the interest rate.
    If you picked (b), you are carrying the most expensive misconception in this material: that a zero primary balance stabilizes debt.
    If you picked (a), you may be thinking of the deficit rather than the ratio.
## DRAFT FOR TEAL: concept-inventory question 2 (expenditure rigidity)
    **Question.** In Q-CRAFT Explorer you set expenditure rigidity to 1.0 and run a climate scenario.
## Answer
    **(b).** Rigidity 1.0 means spending is sticky.
    If you picked (a), you have the scale inverted.
    If you picked (c), you have merged two separate controls.
## DRAFT FOR TEAL: concept-inventory question 3 (what the output is)
    **Question.** Your Q-CRAFT run shows debt-to-GDP at 66 percent in 2099 under the Hot scenario against 47.5 percent in the baseline.
## Answer
    **(b).** The number that survives scrutiny is the *difference between two runs of the same model*, stated with its assumptions attached.
    Answer (a) treats a 2099 projection as a prediction.
    Answer (c) converts a debt-ratio gap into a cost figure, which it is not.
    The 47.5 and 66 percent figures come from the September 2023 IMF workshop with MoFPED staff, reported in the C-PIMA high-level summary (IMF, 2024).
## Pick your path
    The three paths cover the same tool.
    @sec-m2 exists for Path A.
    Every module carries a fast-path marker near the top, telling you the shortest useful route through it.
## A note on time
    Budget three to four times whatever you think this will take.
## Wrapper: what you should have now
    **On your desk this week:** open Uganda's Fiscal Risk Statement FY 2024/25 to page 13 and read Section III.
```

### m1-how-qcraft-thinks.qmd

```
# One equation decides the debt path, and seven modules feed it
    **In this module**
    You will run a full Uganda projection in ten minutes, before anything is explained.
## Fast path
    Short on time?
## By the end of this module you can
## Where you are in the course
    Two nodes are lit: the seven modules and the equation they feed.
## The Excel workbook calculates well and forgets everything
    Building Q-CRAFT in Excel was the right call.
    The trouble starts after the file is saved.
    A year later, the next analyst cannot tell a decision from a default.
    None of this is a failure of Excel.
    The cost lands in capacity development budgets.
    Q-CRAFT Explorer puts the same economics on a platform that keeps the record.
## Run Uganda in ten minutes
    Run the tool before you read how it works.
## Zero to a Uganda projection
    **[Open Q-CRAFT Explorer](https://tealinsights.shinyapps.io/q-craft_explorer1/)** and follow these steps:
    You have now done, with five clicks, the analysis that MoFPED staff produced in a five-day workshop with a visiting IMF team in September 2023.
    Your numbers will not match theirs exactly.
## SCREENSHOT-TODO
    Annotated screenshot of the Analysis tab for Uganda, with the baseline-to-Hot-Unadapted gap called out on the chart.
## Q-CRAFT connects seven modules to one debt equation
    Q-CRAFT projects long-term fiscal outcomes under different climate scenarios, and it does so by feeding seven analytical modules into a single debt equation.
### The equation, in one sentence and then in symbols
    Next year's debt ratio is this year's, grown by the interest rate, shrunk by economic growth, less whatever the government paid down.
    That sentence is the whole model.
    The sign of $r$ minus $g$ decides whether the ratio climbs on its own.
    Climate change reaches the equation through two indirect channels.
    Every module in Q-CRAFT exists to produce an input to this equation.
## How each module feeds the equation
    Seven modules feed the equation, and each one moves exactly one part of it.
    Read the last column carefully.
## WIDGET-TODO: seven-modules-to-one-equation
    Embed the seven-modules-to-one-equation intuition widget here (lane 2, run 3: `apps/qcraft-web/widgets/*`).
### Demography
    Demography sets how fast the workforce grows, and the workforce sets how fast the economy can grow.
### Productivity
    Productivity sets output per worker, and Q-CRAFT moves it gradually rather than in a step.
### Inflation
    Inflation turns real growth into the nominal growth the debt ratio actually responds to.
### Baseline GDP
    Baseline GDP combines the three modules above into the $g$ of the equation.
### Interest rates
    The interest rate module sets what carrying the debt stock costs, which is the $r$ of the equation.
### Fiscal projections
    Fiscal projections produce the $pb$ of the equation, by growing revenue and spending on different rules.
### Climate scenarios
    Climate scenarios lower growth, and that is the only way climate enters the equation.
## The six climate scenarios
    Warming values are IPCC best estimates for 2081-2100 relative to present (User Guide Table 1).
    One naming difference is worth knowing before a meeting.
    These scenarios are conservative in ways that matter for how you write up the results.
## Self-check: where does it live?
    A colleague sends you five questions in one email.
## DRAFT FOR TEAL: self-check answers
    Four of the five sit in two modules, which is the point of the exercise: most questions that arrive as five separate problems are two.
    If you missed 3, reread the climate module above.
## The Python engine is checked against the Excel workbook, cell by cell
    A reimplementation is worth nothing if it quietly disagrees with the original.
    Identical inputs go through both the original Excel workbook and the Python engine, and every output cell for every projection year is compared.
    **Where that stands.** Baseline parity is exact for 147 of 147 tested countries: zero percentage-point deviation on debt-to-GDP, revenue, primary balance and primary expenditure as shares of GDP.
    The second claim is narrower than the first, and the difference matters.
    The test suite is public and runs on every change.
## Wrapper: what you can now do
    **Common error at this stage:** treating the seven modules as seven things to learn.
    **On your desk this week:** when someone hands you a fiscal projection, ask which of $r$, $g$ and $pb$ their headline number moves.
```

### m2-debt-equation.qmd

```
# You already know the debt equation
    **In this module**
    You will rebuild the debt identity from ordinary words, then check that the notation says the same thing.
## Fast path
    This is the Path A module.
## Warm-up
    Two questions from @sec-m1, from memory:
    (Answers: $g$, through employment growth.
## The question your minister actually asks
    The question that arrives from above is rarely "what is the debt ratio in 2099." It is some version of: *if growth disappoints, how much trouble are we in, and how fast?*
    That question has an exact answer, and it comes from one line of arithmetic that has been in every debt sustainability analysis you have ever read.
## By the end of this module you can
## Where you are in the course
    One node is lit, and this module never leaves it.
## Predict first
    Three predictions before any arithmetic.
## DRAFT FOR TEAL: building the identity from words
    **Start with the stock, not the ratio.** Government debt is a stock of shillings.
    That last bracket is the primary deficit.
    **Now divide by GDP, because that is how debt is judged.** The numerator grows at the interest rate.
    Read the middle term as a scoreboard.
    **That is the equation.** In shorthand:
    The shape has a name, and you will recognise it elsewhere: a stock carried forward, amplified by a ratio of two competing forces, minus a flow.
    **The one sentence to keep.** Next year's debt ratio is this year's, grown by interest, shrunk by growth, less what you paid down.
## The interest-growth gap moves the ratio with nobody borrowing
## DRAFT FOR TEAL: what the interest-growth differential does
    The amplifier $\frac{1+r}{1+g}$ is usually reported as a single number, the interest-growth differential $(r - g)/(1 + g)$.
    **Sign trace.** Take a debt ratio of 50 percent of GDP and a primary balance of exactly zero, so the second term drops out and only the scoreboard is left.
    Three percentage points of differential, held for a decade, is the difference between 66.1 and 37.8 percent of GDP.
## WIDGET-TODO: interest-growth differential
    Embed the interest-growth differential intuition widget here (lane 2, run 3: `apps/qcraft-web/widgets/*`).
    **Why this is the climate channel.** Q-CRAFT does not add a climate term to the equation.
    **Sensitivity, ranked.** If you have time to interrogate one assumption in a Q-CRAFT run, interrogate the interest rate rule, because it sets $r$ and V1 does not expose it.
## The primary balance is the part the government controls
## DRAFT FOR TEAL: the debt-stabilizing primary balance
    The second term is revenue minus non-interest spending, as a share of GDP.
    **The question the term answers.** Given where the scoreboard sits, what primary balance holds the ratio still?
    That is the debt-stabilizing primary balance, a standard DSA quantity.
    **Run it for the country in the table.** Debt at 50 percent of GDP, $r$ at 9 percent, $g$ at 6 percent:
    The arithmetic asks for a primary surplus of about 1.4 percent of GDP, every year, to keep the ratio at 50.
    **Perspective.** For Uganda, 1.4 percent of GDP is on the order of the annual budget for a mid-sized ministry.
    **Now connect it to rigidity.** Climate damage lowers $g$, which raises $pb^*$, so you need a bigger surplus.
## Complete the map
    The debt equation appears below as a diagram with three nodes left blank.
## The completed map
    Three inputs, one output.
## Predict, then run it
    Now use the app, and predict before each click.
## Predict, observe, explain
    **Setup.** Open [Q-CRAFT Explorer](https://tealinsights.shinyapps.io/q-craft_explorer1/), select Uganda, fiscal rule **off**.
    **Predict.** Write down: over 2030 to 2099, is Uganda's baseline debt ratio rising, flat, or falling?
    **Observe.** Open the Baseline tab.
    **Explain.** Reconcile the two.
## SCREENSHOT-TODO
    Baseline tab for Uganda with the debt trajectory and the Fiscal Balances panel side by side, so the "deficit but stable ratio" reconciliation is visible in one image.
## Self-check: three judgment calls
## A colleague makes three claims
    Your counterpart in another department sends these.
## DRAFT FOR TEAL: self-check answers
    All three are the same mistake in different clothes: reading one number without the arithmetic that gives it meaning.
## Check your predictions
    Back to the three predictions from the start of the module.
    If you got all three, you did not need this module and @sec-m0 routed you wrong.
## Wrapper: what you can now do
    **Common errors on this material:** reading a falling ratio as fiscal improvement, assuming a balanced primary account stabilizes debt, and drawing climate as a separate term.
    **One thing this module deliberately skipped:** the baseline applies a floor of zero to the debt ratio and the climate scenarios do not.
    **On your desk this week:** compute the debt-stabilizing primary balance for Uganda from the current WEO numbers, and compare it to the actual.
```

### m3-parameters.qmd

```
# Every parameter is a judgment call you can defend
    **In this module**
    You will set all five of the Explorer's controls for a country and write down why you set each one where you did.
## Fast path
    Already run the tool?
## Warm-up
    From @sec-m1, without looking:
    (Answers: fiscal projections.
## The assumption nobody wrote down
    Reopen the vignette from @sec-m1.
    Q-CRAFT Explorer cannot stop you leaving a default in place.
## By the end of this module you can
## Where you are in the course
    Two nodes are lit: the data that comes in, and the parameters you set on top of it.
## Four tabs, and what each one is for
    Four tabs hold everything the tool shows you, and you will be moving between them and the sidebar constantly.
## Five controls, and four of them shape the projection
    Q-CRAFT Explorer has five user-facing parameters.
    Productivity, inflation and interest rate assumptions are not exposed in V1, because they sit at defaults matched to the original Excel tool.
### Country selection
    **What it is.** The country dropdown lists every country for which Q-CRAFT Explorer has complete data coverage across all required input datasets.
    **Why it matters.** The country you select determines all historical data and every WEO forecast-period projection.
    **How to set it.** Choose the country you are analyzing.
## Country coverage
    Q-CRAFT Explorer currently covers 197 countries, and coverage is expanding as verification progresses.
## Predict, observe, explain
    **Predict.** Before you select Uganda, write down the debt-to-GDP ratio you expect the sidebar to report, from your own knowledge of the FY2023/24 position.
    **Observe.** Select Uganda and read the sidebar figure.
    **Explain.** If your number and the tool's differ by more than a point or two, work out which one is on a different basis before you go any further.
## Defend your choice: country and vintage
    A reviewer asks: "Is this the current debt number?" You are using WEO October 2024.
## DRAFT FOR TEAL: a defensible answer on vintage
    Name the vintage, name the basis, and state which direction the difference runs.
## Document it
    In your export packet, record: **data vintage** (WEO October 2024, UN WPP 2022), **starting debt ratio as loaded**, and **any known difference from your ministry's own figure, with the reason**.
### Demography variant
    **What it is.** The UN publishes population projections in three variants, Medium, High and Low, reflecting different fertility assumptions.
    **Why it matters.** Working-age population growth, ages 15 to 64, drives employment growth in Q-CRAFT's production function after the WEO forecast horizon.
    **How to set it.** Three variants, and one of them is the default choice:
    For detailed methodology, see the IMF User Guide, pp. 10-12 and Section IV.A on demography and employment.
## Predict, observe, explain
    **Predict.** Uganda has one of the youngest populations in the world.
    **Observe.** Switch between Medium and High and watch the Baseline tab's debt trajectory.
    **Explain.** In countries with young, growing populations the variants barely separate over the projection, because the working-age share is already rising in every one of them.
## Defend your choice: demography
    A colleague from the Climate Finance Unit argues you should use the Low variant, because Uganda's fertility rate has been falling faster than the UN projected.
## DRAFT FOR TEAL: a defensible answer on the demography variant
    Probably not for the headline run, and certainly worth a sensitivity run.
## Document it
    Record: **variant chosen**, **why** (one line), and **the 2099 debt ratio under at least one alternative variant** as a sensitivity.
### Debt target (% of GDP)
    **What it is.** The debt target is the debt-to-GDP ratio the fiscal rule steers toward over time.
    **Why it matters.** The target does nothing until the fiscal rule is enabled, and then it determines how hard spending has to adjust.
    **How to set it.** Start from the country's actual fiscal framework.
    Three rough starting points, none of them authoritative IMF guidance:
    For detailed methodology, see the IMF User Guide, pp. 15-18 on fiscal rule assumptions and the baseline scenario.
## Predict, observe, explain
    **Predict.** With the fiscal rule enabled, you are about to move the debt target from 40 percent to 80 percent.
    **Observe.** Set the target to 40, read the primary expenditure path and the debt path in the Baseline tab.
    **Explain.** A lower target forces faster consolidation, so expenditure is cut harder to bring debt down.
## Defend your choice: the target
    Your minister's office asks you to run the projection against a 40 percent target rather than the 50 percent ceiling the Fiscal Risk Statement uses, "to be prudent." What do you do, and what do you say?
## DRAFT FOR TEAL: a defensible answer on the debt target
    Run both, and be explicit about what the target is doing in the model.
## Document it
    Record: **target used**, **its source** (legislated rule, Charter for Fiscal Responsibility, DSF threshold, analyst judgment), and **the alternative target you tested**.
### Fiscal rule (Yes / No)
    **What it is.** The fiscal rule, when enabled, adjusts primary expenditure to steer debt toward the target ratio.
    **Why it matters.** Without a fiscal rule, debt dynamics are purely mechanical: they follow the interest-growth differential and whatever primary balance falls out of revenue and expenditure trends.
    **How to set it.** Run it both ways, in this order:
    The adjustment lands on the level of primary expenditure rather than on its growth rate.
## Predict, observe, explain
    **Predict.** Run Uganda with the rule off first.
    **Observe.** Run the same country with the fiscal rule on and off.
    **Explain.** With the rule off and unfavourable debt dynamics, meaning the interest rate exceeds growth, debt-to-GDP can rise without bound.
## Defend your choice: rule on or off
    Which run belongs in a Fiscal Risk Statement: rule on or rule off?
## DRAFT FOR TEAL: a defensible answer on rule on or off
    Both belong, because they answer different questions.
## Document it
    Record: **rule on or off for the headline run**, **the paired run**, and **one sentence on which question each answers**.
### Expenditure rigidity (0.0 - 1.0)
    **What it is.** Expenditure rigidity measures how far government spending resists downward adjustment when climate shocks reduce GDP.
    **Why it matters.** This is the parameter that decides how much of the climate cost becomes debt.
    **How to set it.** Start from the composition of the budget:
    For detailed methodology, see the IMF User Guide, pp. 20 and 35-36 on the expenditure rigidity parameter and fiscal effects of climate change.
## WIDGET-TODO: expenditure rigidity
    Embed the expenditure rigidity intuition widget here (lane 2, run 3: `apps/qcraft-web/widgets/*`).
## Predict, observe, explain
    **Predict.** On the Analysis tab you are about to compare the climate fan at rigidity 1.0 against rigidity 0.0.
    **Observe.** Set rigidity to 1.0 and read the 2099 gap between the baseline and Hot Unadapted.
    **Explain.** At 1.0 the fan spreads wide, because the whole climate revenue loss accumulates as debt, so the distance between Paris-aligned and Hot Unadapted is large.
## SCREENSHOT-TODO
    Side-by-side Analysis tab for Uganda at rigidity 1.0 and rigidity 0.0, with the same axis limits on both, so the compression is visible rather than described.
## Defend your choice: rigidity
    This is the judgment call you will actually be challenged on.
## DRAFT FOR TEAL: defending a rigidity choice
    Both colleagues are making empirical claims, and the parameter is where you settle them with evidence rather than adjectives.
    **The evidence to reach for** is the composition of the budget, not a view about political will.
    **The defensible position** is to run 1.0 as the headline and a lower value as the sensitivity, and to say why in one line: the default is conservative by design, and a fiscal risk statement is the document where conservatism belongs.
    **What not to do** is pick a middle value because it feels balanced.
    **The sentence for the packet:** "Rigidity set at 1.0, the tool default, because roughly N percent of Uganda's primary expenditure is wages, pensions and statutory commitments.
## Document it
    Record: **rigidity used**, **the budget-composition evidence behind it**, and **the sensitivity run and its effect on the headline gap**.
## Wrapper: what you can now do
    **Common errors on this material:** inverting the rigidity scale (see @sec-m0, question 2), moving the debt target while the fiscal rule is off and wondering why nothing happened, and choosing a middle value to avoid an argument.
    **On your desk this week:** find one number in a projection your department published and ask who chose it and why.
```

### m4-uganda-end-to-end.qmd

```
# Uganda end to end: from assumptions to the Fiscal Risk Statement paragraph
    **In this module**
    You will run one country the whole way through, from parameter choices to publishable prose.
## Fast path
    There is no fast path through this module, because it is the module the capstone is built from.
## Warm-up
    From @sec-m3 and @sec-m1:
    (Answers: expenditure rigidity, and the climate scenario itself.
## Two documents already show what the output looks like
    You are not inventing a format.
    **The IMF's C-PIMA write-up.** *Uganda: PFM Climate Assessment: Public Investment and Fiscal Risks Management* (IMF, 2024) reports the September 2023 workshop with MoFPED staff in a single paragraph.
    **Uganda's Fiscal Risk Statement FY 2024/25.** Section III, pages 13 to 17, is a fuller treatment: scenario definitions, a baseline fiscal path table, GDP deviation charts, fiscal balance and debt charts, and a closing policy sentence.
    Your capstone is the shorter of the two.
## By the end of this module you can
## Where you are in the course
    The last two nodes are lit: the output, and the paragraph you write from it.
## The target format
    Section III of Uganda's Fiscal Risk Statement FY 2024/25 is organised in three moves.
    The published baseline table is worth copying too.
    Source: Uganda Fiscal Risk Statement FY 2024/25, Table 5, sourced to QCRAFT (2023).
    Four columns is a deliberate editorial choice, because a seventy-row table is not a policy document.
## The worked case: Uganda, start to finish
    Seven steps follow, and you should follow along in the app.
### Step 1: set the parameters, and write down why
    Open [Q-CRAFT Explorer](https://tealinsights.shinyapps.io/q-craft_explorer1/) and select Uganda.
    That table is the first page of your export packet.
### Step 2: read the Baseline tab
    The Baseline tab shows the no-climate-change scenario: the country's fiscal trajectory under current trends and the assumptions you have set.
    **Debt-to-GDP trajectory** (top) is the headline chart.
    **Revenue and Expenditure (% of GDP)** (bottom left) shows two ratios that can drift apart.
    **Fiscal Balances** (bottom right) carries two lines: the primary balance, meaning revenue minus non-interest expenditure, and the overall balance, which includes interest payments.
## SCREENSHOT-TODO
    Baseline tab for Uganda, all three charts, with callouts on: (a) the end of the shaded WEO period at 2029, (b) the 2099 debt ratio, (c) the primary-to-overall balance gap.
### Step 3: run the sanity check before you interpret anything
## Baseline Sanity Check
    Before interpreting climate results, verify the baseline makes sense:
## DRAFT FOR TEAL: the sanity check applied to Uganda
    Run the five boxes against what is on your screen and against the published figures.
    **Initial debt level.** The published baseline puts 2023 at 47.1 percent of GDP, and Uganda's Fiscal Risk Statement reports 46.9 percent at June 2023 on the ministry's own basis.
    **Revenue-to-GDP.** Revenue is held at a constant share of GDP by construction, so the check is not whether it moves.
    **Expenditure path.** The published table shows primary expenditure drifting from 19.9 to 19.4 percent of GDP over seventy-six years, dipping to 18.8 around 2075.
    **Fiscal rule convergence.** With the rule off, skip this box, and say in your packet that you skipped it and why.
    **Balance paths.** The published baseline has the primary deficit narrowing from 6.3 percent of GDP in 2023 to 1.4 percent by 2099, with the overall deficit at 3.8.
    **The rule this step encodes:** a climate result computed on a baseline you have not checked is a number with no owner.
### Step 4: read the Climate tab
    The Climate tab shows how climate change affects real GDP under six warming scenarios, using empirical estimates from the FADCP Climate Dataset (Centorrino, Massetti, and Tagklis, 2024), building on Kahn et al. (2021).
    **What to look for.** Two charts show absolute GDP levels and a GDP index set to 100 in 2029.
    Countries closer to the equator generally show larger GDP losses.
    A country showing a large gap between Paris and Hot Unadapted faces high climate-fiscal vulnerability.
## DRAFT FOR TEAL: what the Uganda GDP chart licenses you to say
    The published result is a level GDP loss of around 4 percent by end of century under the Hot scenario, and the C-PIMA summary describes Uganda's impact as milder than other sub-Saharan African countries.
    Four percent needs a perspective sentence, because on its own it reads as small.
    The deflating one: 4 percent of GDP spread over seventy-five years is a few hundredths of a percentage point off annual growth, well inside the noise of any single year's outturn.
    The alarming one: it is a permanent level loss that compounds into the debt ratio every year thereafter, and 4 percent of GDP is a recurring annual amount comparable to a large sector budget.
## TODO: verify the perspective figure
    The second framing needs a checked comparator before it ships: 4 percent of Uganda's GDP expressed against a named line of the approved budget (health, or the road sector), sourced to the Approved Estimates for the relevant year.
    Both framings are true.
    **What the chart does not license:** any statement about what Uganda's GDP will be.
## SCREENSHOT-TODO
    Climate tab for Uganda, GDP index chart, with the six scenario lines labelled on the data rather than in a legend, and the 2030 divergence point marked.
### Step 5: read the Analysis tab
    The Analysis tab is the comparison view, overlaying baseline and all climate scenario debt trajectories on a single chart.
    **The climate-fiscal risk premium.** The spread between the baseline debt trajectory and the climate scenario trajectories is the country's climate-fiscal risk premium: the additional debt burden attributable to climate change.
    **Reading the chart.** A baseline showing stable or declining debt alongside a Hot Unadapted scenario that rises rapidly means climate change could destabilize an otherwise sustainable fiscal position.
## DRAFT FOR TEAL: reading the Uganda fan chart
    Three readings, in the order a reviewer will want them.
    **The gap.** Baseline at 47.5 percent of GDP in 2099, Hot at 66.
    **The threshold.** The gap only becomes a policy fact when it crosses something.
    **The shape.** Look at when the lines separate, as well as where they end.
    **What to do when the baseline itself is rising.** If your run has debt rising in the baseline, the climate gap is no longer the interesting number, because both paths are unsustainable.
### Step 6: export the packet
    The Data tab holds an interactive data grid and two CSV downloads.
    All values are in billions of local currency units, except ratios, which are percentages of GDP.
    Download both.
### Step 7: write the two paragraphs
## DRAFT FOR TEAL: model two-paragraph write-up
    Built from the published Uganda figures so every number in it is checkable.
    **Six things make this a Fiscal Risk Statement paragraph rather than a report of a model run:**
    **One editorial query for Teal:** the closing sentence of the second paragraph does policy advocacy inside a risk document.
## Completion problem: the High scenario variant
    Same country, same parameters, one change: report against the **High** scenario rather than Hot.
    **Done for you:**
    **Your turn, five tasks:**
## DRAFT FOR TEAL: checking yourself on step 4
    The distinction is the temperature distribution rather than the emissions.
## Independent problem: the adaptation-speed variant
    No scaffolding this time, and a checklist only.
    **The task.** Compare **Hot + Adapted** against **Hot + Unadapted** for Uganda.
    **Deliver five things:**
## DRAFT FOR TEAL: the trap, if you want to check before you write
    Faster adaptation in Q-CRAFT is a faster economic adjustment to a given temperature path.
## Wrapper: what you can now do
    **Common errors on this material:** interpreting climate results before checking the baseline, quoting a 2099 level as a forecast, and reporting the adaptation gap as the value of adaptation.
    **On your desk this week:** take the two paragraphs you drafted to whoever owns your ministry's fiscal risk chapter and ask what they would cut.
```

### m5-boundaries.qmd

```
# Know what the tool cannot tell you
    **In this module**
    You will learn what Q-CRAFT leaves out and which direction that bias runs, so you can state the caveat before a reviewer does.
## Fast path
    No fast path.
## Warm-up
    From @sec-m4:
    (Answers: the benefit of faster adjustment, with the cost of achieving it not modelled.
## The question that comes after the presentation
    You have presented the fan chart.
    Your whole credibility rests on the next thirty seconds.
## By the end of this module you can
## Where you are in the course
    Two nodes are lit, and they are the two ends of the chain: what the scenarios assume, and what you are allowed to write.
## What the numbers mean, and what they do not
    Q-CRAFT Explorer produces stylized long-term projections.
    The results are not forecasts.
    Q-CRAFT is designed to complement existing fiscal analysis rather than replace it.
## Every exclusion is a cost left out, so the estimate is a floor
    The scenarios capture one channel: the slow effect of temperature change on productivity, and through it on growth.
    The direction is what makes this list usable.
    Say it yourself, in the write-up, before a reviewer says it for you.
## DRAFT FOR TEAL: what conservatism does not buy you
    Conservatism protects the credibility of a number.
    A conservative estimate that gets picked up as *the* estimate becomes a ceiling in someone else's argument.
## The baseline floors debt at zero and the climate scenarios do not
## The rule
    The baseline scenario applies a floor of zero to the debt-to-GDP ratio: if the equation produces a negative value, debt is set to zero.
## DRAFT FOR TEAL: how the asymmetry changes what you are looking at
    The asymmetry matters for a narrow set of countries, and for those countries it matters a lot.
    **When it bites.** Only when a projection drives debt to zero.
    **What it does to the picture.** In such a country the baseline flattens along zero while the climate scenarios continue downward into negative territory.
    **The reading rule.** If any line in your fan chart touches zero, stop using the vertical gap as your headline number.
    **Why the asymmetry is a design choice rather than a bug.** Flooring the climate scenarios too would compress exactly the range the tool exists to show.
## Two countries, same chart, different problem
    Transfer is the thing this course is actually for: recognising which situation you are in when the labels come off.
## Comparison exercise: same path, different drivers
    **Find the pair.** In the Explorer, work through countries in the dropdown until you find two whose baseline 2099 debt ratios are within about 5 percentage points of each other, but whose baseline-to-Hot-Unadapted gaps differ by 10 percentage points or more.
    **Then diagnose.** For each country, decide which of the three drivers from @sec-m4 explains the difference:
    **Write one sentence** per country saying which driver dominates, and one sentence saying what policy conclusion follows for each.
    **Then reverse it.** Find two countries with similar climate exposure on the Climate tab whose debt outcomes diverge.
## TODO: seed the comparison with verified pairs
    This exercise currently sends learners hunting.
## DRAFT FOR TEAL: why this exercise and not a worked comparison
    The instinct is to hand over the pair and the answer.
    The general principle is the one to carry out of this module: a debt path is an outcome, not a diagnosis.
## Q-CRAFT and the LIC-DSF answer different questions
    Q-CRAFT and the IMF-World Bank Low-Income Country Debt Sustainability Framework both produce debt projections for low-income countries.
## Self-check: five questions, which tool?
    For each, name Q-CRAFT, LIC-DSF, both, or neither, and say why in one line.
## DRAFT FOR TEAL: self-check answers
    The test in every case is which question the tool was built to answer, never which tool you happen to have open.
    **The reverse direction is the part usually skipped.** A question that arrives framed for the DSF may be a Q-CRAFT question.
## Wrapper: what you can now do
    **Common errors on this material:** quoting a conservative estimate as a total, reading a floored baseline as a favourable climate result, and answering a sustainability-rating question from a Q-CRAFT chart.
    **The thirty-second answer to your minister,** for reference: "No. It is what climate change does to the debt ratio through one channel, growth, under stated assumptions about how spending responds.
    **On your desk this week:** find a projection in circulation in your ministry and write down one question it cannot answer.
```

### m6-capstone.qmd

```
# The capstone: your analysis, defended
    **In this module**
    You will produce the capstone: an export packet plus a two-paragraph Fiscal Risk Statement draft, for a country you choose.
## Fast path
    Short on time?
## Warm-up
    From across the course, without looking:
    (Answers: $g$ and $pb$.
## By the end of this module you can
## Where you are in the course
    One node is lit, and it is the one you hand over.
## The capstone brief
    **The scenario.** Your minister has asked for a climate-fiscal risk section for the next Fiscal Risk Statement.
    **What to hand in, in three parts.**
    **Country choice.** Pick Uganda if you want to compare against the published Section III.
    **What is not required.** Matching the published Uganda figures.
## The rubric
## DRAFT FOR TEAL: capstone rubric
    Four criteria, and the weights are a proposal rather than a decision.
    **One error disqualifies on its own**, and it is worth naming separately because it recurs: reporting the Adapted-to-Unadapted gap as the value of adaptation.
    **Note for the live workshop.** The rubric doubles as the peer-review instrument, run in three passes.
## Common errors to watch for
## TODO: replace with pilot-observed errors
    The list below is built from the misconceptions this course was designed against, not from watching people make them.
## Where you started, where you are
    Go back to your three answers from @sec-m0.
    **On long-term fiscal projection:** A1 (not worked with a DSA) / A2 (can follow one) / A3 (could build one this week)
    **On climate-fiscal analysis:** B1 (climate side only) / B2 (can describe the use) / B3 (have run or interpreted one)
    **On the tool itself:** C1 (never opened it) / C2 (clicked around) / C3 (ran it and explained the output)
    The A and B rows are the ones worth looking at.
## Retake the three questions from Module 0
    Same three items, unchanged.
## DRAFT FOR TEAL: the answers, and what a wrong one means now
    A wrong answer here costs more than it did in @sec-m0, because now it is attached to a document you are about to circulate.
## What to use on your desk this week
## Spaced follow-up
    Two things arrive after the workshop, and they are part of the course rather than an afterthought.
    Spacing beats massing, and the IMF's own evaluation of capacity development found that training with hands-on follow-up sticks while the standalone workshop decays.
## TODO: workshop materials
    The live sessions need artefacts this guide does not yet contain: breakout task cards, the anonymous poll items, and the peer-review sheet derived from the rubric above.
## Wrapper: the whole course in six lines
```

### Banned-tics sweep: zero

Swept against every rule in `style-guide-writing-AI.md`, over all eleven `.qmd` files including the preface, glossary, references and the appendix.

| Rule | Hits before | Hits after |
|---|---|---|
| Filler intensifiers ("genuinely", "really", "just", "of course") | 6 | 0 |
| Em-dashes and en-dashes | 0 | 0 |
| Negative parallelism ("not only") | 0 | 0 |
| False ranges ("range from X to Y") | 1 | 0 |
| Rhetorical question-answer ("The X? A Y.") | 2 | 0 |
| Echo amplifiers ("the figures are real") | 1 | 0 |
| Semicolon splices | 50 | 0 |
| Appended-judgment tails, participle taglines, self-certifying tails | 0 | 0 |
| "It is worth noting", "let's dive in", "delve", "leverage", "robust" | 0 | 0 |
| **Total** | **60** | **0** |

Scope note: the sweep covers the course files. Running the same sweeper over this report flags the rows above, because the table quotes the banned tics by name, and flags the Run 1 section below, which is left as it was written.

The semicolons were the bulk of it. The style guide allows a semicolon that earns its place, including in a compact table cell, so a handful of the 50 were arguably defensible. I removed all of them anyway, so the sweep result is unambiguous rather than a judgment call you would have to re-audit.

### DRAFT FOR TEAL: 25, unchanged, all rewritten

| Module | Blocks | What is in them now |
|---|---|---|
| M0 | 3 | The three concept-inventory questions and their answers, with the distractor diagnoses tightened |
| M1 | 1 | The where-does-it-live self-check answers, now opening with the point the exercise makes |
| M2 | 4 | The identity built from words, the interest-growth differential, the debt-stabilizing primary balance, the self-check answers |
| M3 | 5 | Four defensible answers plus the rigidity argument. The three that were all titled "a defensible answer" now name their subject, so you can find them in the rendered book |
| M4 | 6 | The sanity check applied to Uganda, what the GDP chart licenses, the fan chart reading, the model two-paragraph write-up, the completion-problem check, the adaptation trap |
| M5 | 4 | What conservatism does not buy you, the floor asymmetry reading rule, why the comparison is a search, the which-tool answers |
| M6 | 2 | The capstone rubric, the retake answers |
| **Total** | **25** | |

Marker counts elsewhere are also unchanged: 5 SCREENSHOT-TODO, 3 WIDGET-TODO, 4 other TODO. No screenshots were fabricated.

### Substance check

Rule 6 said sentence surgery on a fixed skeleton, so I verified it mechanically rather than by eye. Every numeric token in all eleven `.qmd` files was extracted at the pre-run-2 commit and at HEAD, then the two multisets were compared. They match, with three accounted-for exceptions:

- Two fewer "10" tokens in M0, because "the 10-minute Uganda run is genuinely 10 minutes" became "the ten-minute Uganda run does take ten minutes". Same duration, spelled out, and the filler intensifier gone.
- Two extra "0" tokens from the new M0 anchors `sec-m0-inventory` and `sec-m0-paths`, which the fast-path marker links to.
- One extra "0" token from a new `@sec-m0` cross-reference in M6's retake block.

The check caught one real defect, now fixed. M1's new road map replaced a bullet that carried "baseline parity is exact for 147 of 147 tested countries" with the looser phrase "the Python tool agrees with the IMF's Excel workbook". Unqualified, that is broader than the binding wording allows. The road map now carries the exact claim and the 2099 horizon that the old bullet also carried.

Parity wording is otherwise untouched and appears in the binding form in M1 and the appendix. The FADCP and Kahn citation is unchanged in all three places it appears. No occurrence of NGFS anywhere in the guide.

### What the skim test caught, by module

The test earned its place. It found the same defect three times in different clothing: a paragraph that opens with a noun phrase instead of a claim.

**M0.** Section headings labelled the topic ("The deliverable, stated up front") rather than stating it. The opening paragraph led with a fact about page numbers rather than with the point, which is that Uganda has already published the document the course teaches you to write. M0 also promised that "every module carries a fast-path marker near the top" while M0 and M6 did not have one. Both now do.

**M1.** The seven per-module subsections each opened with a fragment: "GDP per employed person, from World Bank data." Read as a skeleton, they taught nothing. Each now opens with a sentence naming what that module does to the equation ("Productivity sets output per worker, and Q-CRAFT moves it gradually rather than in a step"). Two section headings became claims. "Partial-equilibrium tool" was named before it was explained, which the Explainer Toolkit's replace-then-name rule forbids, so the mechanism now comes first and the label arrives after.

**M2.** Most of the argument lives inside the DRAFT callouts, so the two headings above them were carrying the skim load and both were labels. "The scoreboard term: r minus g" is now "The interest-growth gap moves the ratio with nobody borrowing".

**M3.** Every parameter block opened "**What it is.** A dropdown menu listing countries...", a reference-card stub rather than a sentence. All fifteen What/Why/How leads are now declarative.

**M4.** The three Baseline-tab chart paragraphs opened with a bare bold label and a full stop, so the skeleton listed chart names and no claims. The label now leads the sentence.

**M5.** Three headings were labels. The conservatism section is now titled with its argument: "Every exclusion is a cost left out, so the estimate is a floor".

**M6.** No fast-path marker, and the "where you started" paragraph buried its point (the A and B rows are the ones that matter) in the third clause of a long sentence.

Across all seven, the "The hook:" prefix on four headings was design scaffolding aimed at the author rather than the reader, so it is gone. The headings still hook.

### One scope call you should know about

`SHARED/REFERENCE-NOTES.md` gained a new binding line partway through this run: your 8/26 late-pm structural calls, including "COURSE GENERALIZES" and "Uganda-specific institutional terms (PS etc.) leave the general path". `PROMPT-RUN3.md` appeared shortly after and makes that a full run of its own.

What I did: the wording-level part, because it is sentence surgery and it was cheap. "Permanent Secretary" is now "your minister" in M0, M5 and M6, matching the register M2 already used, and M0's capstone item now hands the draft to "whoever owns your ministry's fiscal risk chapter" rather than to the Macroeconomic Policy Department. Uganda stays everywhere it is data, verification, or the worked case.

What I did not do: the structural half. Naming the generalized reader in the preface and M0, the explicit transfer framing, and the prominent "now do your own country" handoff in M4 are skeleton changes, and run 2's brief freezes the skeleton.

**One thing for run 3 to reconcile.** Run 3 specifies M0's title as "Start here: what you will walk into your director's office with", marked DRAFT FOR TEAL. This run set it to "your minister's office" before that prompt existed. Run 3 should overwrite it, and if it does, the DRAFT FOR TEAL count moves from 25 to 26 unless the title marker is counted separately.

### Things for you to decide

Run 1's open items 1, 2, 4 and 5 still stand, and this run did not touch them. Three are new or changed.

1. **The M4 advocacy flag survived, in shorter form.** The model write-up's closing sentence still does policy advocacy inside a risk document. Run 1 flagged it as "what Teal should rewrite". I kept the flag, because dropping it would lose the question, but scoped it to one line so the block reads as finished prose rather than as a stub. It is the last line of the Step 7 DRAFT block.

2. **"Your minister" may be the wrong generic.** In a ministry the Permanent Secretary is the senior civil servant and the Minister is political, and walking into one office is not the same errand as walking into the other. I picked "minister" because M2 already used it and it reads naturally to any finance-ministry audience. Run 3's prompt proposes "your director", which is a different call. Pick one and it should be consistent across M0, M2, M5 and M6.

3. **Section-heading register.** I converted eleven label headings into claim headings, per the Explainer Toolkit's rule that headings are full-sentence claims. Two of them have a dry edge: "The Excel workbook calculates well and forgets everything" (M1) and "The interest-growth gap moves the ratio with nobody borrowing" (M2). If that reads as too much personality for a ministry-facing course, they are one-line reverts.

### Not done, and why

- **The appendix and the preface got the tics sweep only.** Both are clean, but neither got the topic-sentence treatment. The appendix sits outside the learning path on purpose and carries the SovTech pitch, which is a different register. The preface is already short and leads with its point.
- **The 197 versus 175 country-count disagreement is untouched.** Run 1 flagged it and I left it, since resolving it means changing a number.
- **The M2 perspective anchor is untouched.** "For Uganda, 1.4 percent of GDP is on the order of the annual budget for a mid-sized ministry" is hedged but unverified, and it is the same class of claim as the M4 comparator that already carries a TODO. Verifying it means a new source, which is out of scope for a sentence-surgery run.

### Commits

```
ec6e637 docs(guide): M0 skim pass, topic sentences, road map, fast path
a683f4c docs(guide): M1 skim pass, claim headings and topic sentences
76a085c docs(guide): M2 skim pass, claim headings over label headings
f6dc673 docs(guide): M3 skim pass, declarative What/Why/How openers
4c50a13 docs(guide): M4 skim pass, chart labels become claims
bfcdd0d docs(guide): M5 skim pass, claim headings and generic institutional register
f71889a docs(guide): M6 skim pass, fast path added and register generalised
0f92bd9 docs(guide): generic institutional register in M0, tics out of the glossary
0b7b56e docs(guide): rebuild the committed PDF artifact after the skim pass
```

---

## Run 1: course restructure, Modules 0-6

Kept for the record. Run 2 did not touch the structure this run put in place.

### Status

Done. `quarto render docs/companion-guide` passes clean (exit 0, no warnings, no unresolved cross-references), HTML and PDF both build, and the committed PDF artifact is regenerated.

### What changed

The companion guide is now a seven-module course instead of three parts.

| File | Provenance |
|---|---|
| `index.qmd` | Rewritten preface: module table, "start at M0", corrected description of the co-design material |
| `m0-start-here.qmd` | New |
| `m1-how-qcraft-thinks.qmd` | `git mv` from `part1-policy.qmd`, then rebuilt |
| `m2-debt-equation.qmd` | New (Path A) |
| `m3-parameters.qmd` | `git mv` from `part2-using.qmd`, then rebuilt |
| `m4-uganda-end-to-end.qmd` | New, absorbing the results-interpretation prose from old Part 2 |
| `m5-boundaries.qmd` | New, absorbing the caveat material scattered across old Parts 1 and 2 |
| `m6-capstone.qmd` | New |
| `appendix-codesign.qmd` | `git mv` from `part3-codesign.qmd`, reframed as out-of-path, parity wording corrected |

Renames were committed as pure renames first, so the reflow shows up as edits rather than as delete-plus-add.

**Where the old prose went.** Roughly 70 percent of the existing text is relocated rather than rewritten, as the redesign plan intended.

- Old 1.1 (MoF-economist vignette) → M1, verbatim
- Old 1.2 (what Q-CRAFT computes, equation, symbol table) → M1
- Old 1.2.2 (the seven-paragraph prose wall) → M1, rebuilt as a table plus seven mini-diagrams plus a self-check
- Old 1.2 debt-floor asymmetry callout → M5
- Old 1.2 scenario table → M1 (collapsed); its conservatism paragraph → M5
- Old 1.3 (how the Explorer works) → split: early win to M1, tab orientation to M3
- Old 1.4 (verification) → M1, once, with corrected wording
- Old 2.1 (Quick Start) → M1 as the 10-minute Uganda early win
- Old 2.2 (five parameters, What/Why/How-to-set) → M3, kept intact, with new layers on top
- Old 2.3 (four tabs, Baseline Sanity Check) → M4, inside the worked case
- Old 2.4 (what the numbers mean) → M5
- Old Part 3 → appendix, out of the learning path

### Definition-of-done check

- [x] All module files exist and render
- [x] Existing prose relocated per the blueprint
- [x] Behavioral objectives (Bloom verbs, 3-5, workplace performances) on all seven modules
- [x] Concept-map scaffolds: the master map appears in all seven modules with the current node lit; M1 adds seven per-module mini-diagrams; M2 adds a partial map to complete
- [x] Self-check scaffolds: M1 where-does-it-live, M2 three-claims, M3 one defend-your-choice per parameter (5), M4 completion and independent problems, M5 which-tool five-item, M6 retake of the M0 inventory
- [x] Marker inventory below

### Marker inventory

| Module | Lines | Objectives | Mermaid | DRAFT FOR TEAL | SCREENSHOT-TODO | WIDGET-TODO | Other TODO |
|---|---|---|---|---|---|---|---|
| M0 start here | 180 | 4 | 1 | 3 | 0 | 0 | 0 |
| M1 equation + modules | 314 | 4 | 10 | 1 | 1 | 1 | 0 |
| M2 debt equation | 245 | 4 | 3 | 4 | 1 | 1 | 0 |
| M3 parameters | 298 | 4 | 1 | 5 | 1 | 1 | 0 |
| M4 Uganda end to end | 301 | 5 | 1 | 6 | 2 | 0 | 1 |
| M5 boundaries | 197 | 4 | 1 | 4 | 0 | 0 | 1 |
| M6 capstone | 162 | 4 | 1 | 2 | 0 | 0 | 2 |
| **Total** | **1,697** | **29** | **18** | **25** | **5** | **3** | **4** |

`appendix-codesign.qmd` (91), `index.qmd` (41), `glossary.qmd` (43) and `references.qmd` (17) carry no markers.

**DRAFT FOR TEAL blocks, by kind.** M0's three concept-inventory questions with their answers; M1's self-check answers; M2's four new explanations (identity from words, the r-minus-g sign trace, the debt-stabilizing primary balance, self-check answers); M3's five defend-your-choice answers including the rigidity argument; M4's six interpretation blocks including the model two-paragraph write-up; M5's four (conservatism hazard, floor asymmetry reading rule, why the comparison is a search, which-tool answers); M6's rubric and the retake answers. Every one is best-effort text in your voice's general direction, not an attempt at your finished voice on a new argument.

**SCREENSHOT-TODO (5).** M1 Analysis tab with the baseline-to-Hot gap called out; M2 Baseline tab showing deficit alongside a stable ratio; M3 rigidity 1.0 versus 0.0 on matched axes; M4 Baseline tab three-chart annotated, and M4 Climate tab GDP index with labels on the data. No screenshots were fabricated.

**Other TODO (4).** M4: verify the "4 percent of GDP" perspective comparator against a named budget line before shipping. M5: seed the country-comparison exercise with two or three verified pairs. M6: replace the common-errors list with pilot-observed errors; produce the workshop artefacts (task cards, poll items, peer-review sheet).

**WIDGET-TODO (3).** Anchors in M1, M2 and M3 for the lane 2 intuition widgets, per the 8/26 pm note in SHARED/REFERENCE-NOTES.md. Not embedded, since the integration pass runs after this lane and run 3 both land. The surrounding prose carries the full idea on its own, so the modules work without the widgets.

### Uganda Fiscal Risks Statement: found

Downloaded to `source-materials/2024_MoFPED_Uganda-Fiscal-Risk-Statement-FY2024-25.pdf` (31 pages, 1.1 MB, verified `%PDF`).

- Source: `https://www.finance.go.ug/sites/default/files/2024-05/Fiscal%20Risk%20Statement%20FY%2024-25.pdf`, reached via `https://www.finance.go.ug/search/node?keys=fiscal+risk`. Read-only GET.
- The FY 24/25 edition is the latest published on the site. The other two hits are FY 2020/21 and November 2018.
- Note: `.gitignore` excludes `source-materials/` and `*.pdf`, so the file is on disk in this clone but not committed. That matches how the repo already treats source materials.

**It is better than expected.** Section III (pp. 13-17) is a Q-CRAFT write-up, sourced to "QCRAFT (2023)". M4 now uses its real structure as the target format and reproduces its Table 5 baseline fiscal path. Every Uganda number quoted in the course comes from either that statement or the C-PIMA high-level summary:

- Baseline fiscal path 2023/2050/2075/2099, including debt at 47.1 → 36.2 → 35.8 → 47.5 percent of GDP (FRS Table 5)
- Hot scenario: about 4 percent GDP loss by end of century; primary deficit 0.7 points worse than baseline; debt over 18 points higher (FRS Section III)
- Debt passes the 50 percent of GDP fiscal rule ceiling in the High, Hot and Vulnerable scenarios (FRS Section III)
- Debt at 66 percent versus 47.5 percent baseline; impact milder than other SSA countries (C-PIMA high-level summary, IMF 2024)
- Public debt 46.9 percent at June 2023 from 48.4 percent at June 2022, the fall partly a nominal-GDP effect (FRS Section IV)

One naming difference worth knowing before the session: the Statement reports five scenarios and calls the last one "Vulnerable" where the Explorer says "Hot Unadapted". M1 flags this.

### Binding content rules

- **Parity.** Stated once, in M1, as "baseline parity is exact for 147 of 147 tested countries" plus "climate-scenario parity is confirmed for ratio metrics". M1 adds an explicit sentence on what the second claim does not cover. The appendix's old "well over 140 countries, 0.0 across the board" line is replaced with the same wording. No broader claim anywhere.
- **Climate source.** README's two "NGFS Phase IV" errors fixed (commit `5632250`). The guide prose was already correct on FADCP; swept and confirmed.
- **Show-don't-tell.** Auto data loading is demonstrated in the M1 ten-minute run rather than asserted; guidance at point of need appears as the What/Why/How-to-set blocks in M3; documented rationale is the Document it blocks feeding the export packet; fast polished output is the Data tab export in M4 Step 6. No marketing language in the modules; the SovTech pitch is confined to the appendix.
- **No em-dashes.** Swept, zero in the guide.

### Things for you to decide

1. **`apps/qcraft-app/app.py` still says NGFS in six places** (lines 354, 389, 461, 515, 544, 546), including a citation block that credits "NGFS (2023), NGFS Climate Scenarios". I did not touch it: it is another lane's file and editing it risks a conflict. It is the same factual error as the README, and it is visible in the shipped app's Methodology tab, so it should be fixed before Sept 1.
2. **Country count disagreement.** README says 175 countries, the guide says 197 (in M1 about the IMF workbook, and in M3 about the Explorer's own coverage). Both cannot be right about the Explorer. I left the guide's numbers as they were rather than guess.
3. **The M4 model write-up's closing sentence** does policy advocacy ("meeting Uganda's Paris commitments and building expenditure flexibility both reduce this exposure"). In a risk document that may be a step too far. Flagged inside the DRAFT block.
4. **Rubric weights** in M6 (40/20/25/15) are a proposal, not a decision.
5. **M2's fate.** It is written as skippable Path A material. If the Sept 1 session has more Climate Finance Unit staff than macro staff, it may deserve to be non-optional.

### Not done, and why

- **Videos.** The Pedagogy Toolkit's 6-minute video slots are not scaffolded. Out of scope for a mechanical restructure and there is no video pipeline in this repo.
- **Workshop artefacts.** Task cards, polls and the peer-review sheet are tracked as a TODO in M6 rather than built. The redesign plan puts them in a later week.
- **Pilot.** The common-errors list in M6 is derived from the misconceptions the course was designed against, not from watching anyone. Marked as a hypothesis in the file.

### Commits

```
5632250 fix(README): climate damage source is the FADCP Climate Dataset, not NGFS Phase IV
b31b7c2 docs(guide): rename part files to their module destinations
2e40eeb docs(guide): add M0 (start here) and rebuild M1 (equation + seven modules)
10a20ea docs(guide): add M2 (debt equation, Path A) and rebuild M3 (parameters as judgment calls)
02209db docs(guide): add M4, the Uganda worked case end to end
ee2c171 docs(guide): add M5 (boundaries) and M6 (capstone and wrapper)
8fdad75 docs(guide): wire the module skeleton into the book and rebuild the PDF
836baae docs(guide): mark every judgment answer as DRAFT FOR TEAL and collapse it
```
