# Teal Insights learning-materials design standard (draft v0.1)

**Status:** draft, awaiting Teal's review. Written by CC-17 (2026-08-30, trail
TEA-948) as the durable standard for every learning artifact Teal Insights
publishes: courses, companion guides, explainers, and training documents.
**Intended permanent home:** `lte-workbench/docs/learning-standard.md` after
Teal's review; this repo carries the draft because the first audit runs here.
**Relationship to existing canon:** this file is the learning-materials sibling
of `docs/hcd-standard-draft.md` (the tool standard): same rubric shape, same
capture loop, same intended promotion. It builds on and cites, and never
re-derives, the Pedagogy Toolkit v0.1, the Learning Science Evidence Guide
v0.1, the Explainer Toolkit v0.1 (Drive
`01-PROJECTS/_Professional/2026-07_IMF-CD-Pedagogy/`), the Cleary/Buchheit
persuasive-writing guide and rubric (Drive `03-RESOURCES/LLM-Context/`), the
house busy-readers explainer (`lte-workbench/docs/explainers/writing-for-busy-readers.md`),
the chart-craft canon (`lte-workbench/docs/deck-standard.md`,
`lte-workbench/brand/figure-typography.md`, the Storytelling-With-Data digest),
and the writing style guides. Where those documents state a rule, this file
points at it and adds only the auditor test. Where they disagree, section 7
names the conflict and the resolution. Once Teal approves it, this file wins
over scattered review comments for learning materials, exactly as the HCD
standard does for tools.

## 0. Why this file exists

Educational materials are human-centered design applied to training. A course
has users, journeys, first screens, affordances, and failure modes exactly as
a tool does; the reader's flow through the material, per reader type, should
be as positive, seamless, and enjoyable as the analyst's flow through a good
interface. The sibling HCD standard asks whether someone landing on a tool
knows where to look and can finish without reading directions. This file asks
the same of a course: every named reader gets a route that serves them, and no
route requires decoding the material's internal machinery.

The stakes are documented, and they are brutal. Doemeland and Trevino (2014)
found that roughly a third of World Bank policy reports were never downloaded
once and almost 87 percent were never cited: publication is not reach, and
expertise does not exempt a document from the attention market. (The Bank's
own follow-up cautions that download counts understate reach, since reports
also travel by direct client distribution; the stat is a floor on the
problem, not a ceiling.) The house
audience makes the bar higher still: ministry economists, policymakers, and
technical staff who are smart, busy, and low-patience, reading between
meetings, often on a phone, often in a week with a deadline in it. Rogers and
Lasky-Fink (2023) supply the response: effective writing for busy readers is
a discipline with principles and evidence, and this file turns that
discipline, plus the house pedagogy canon, into gates an audit can apply.

## 1. How to use this file

- **Specs cite it.** A spec for any learning artifact names which criteria it
  adopts and which it skips on purpose, with the reason. Silence is not a
  skip.
- **Audits score it.** An audit runs the method in section 5, checks every
  gate, scores every criterion 0 to 2, and ties each score to a screenshot,
  a quoted passage, or a walkthrough step. A score without evidence is not a
  score.
- **Gates cap the verdict.** One failed gate means "revise required" no matter
  how high the scores, because each gate names a way the material loses a
  reader or teaches something false. There is no composite number: a
  composite hides exactly what a gate is for.
- **Scoring scale:** 2 pass, 1 partial with the fixes named, 0 fail, N/A only
  with a stated reason. The grader quotes the offending or supporting
  evidence: passage, screenshot, or step reference.
- **Genre calibration.** A course promises a capability and demands practice;
  an explainer promises understanding in one sitting; a reference promises
  fast, exact lookup (Explainer Toolkit, "Relationship to the Pedagogy
  Toolkit"; Diataxis). The gates apply to every genre. Group A of the scored
  criteria applies in full to courses, and to other genres only where the
  spec adopts it.
- **Journeys are served by architecture, never by mode-blending.** Diataxis
  names mixing tutorial, how-to, reference, and explanation in one document
  as the classic failure. The four journeys of G1 are therefore served by
  distinct architectural surfaces (the module spine for J1 and J2, the
  glossary, search, and cross-references for J3, the preface and limitations
  material for J4), never by making every page try to be all four things.

## 2. The gates

Binary. Any fail blocks sign-off regardless of scores.

| # | Gate | Fail if | Source |
|---|---|---|---|
| G1 | **Reader journeys named and served** | The material does not name its reader journeys and serve each one deliberately. The minimum set: (J1) run it and understand what you need, in about 30 minutes, the primary journey, served by the main spine with no detours; (J2) the full course, in order, to capability; (J3) find one thing fast, from any entry page; (J4) the skeptical evaluation read, deciding whether to trust the material at all. Fail also if any journey requires decoding the material's internal labels: a reader routed by "you answered mostly A2/B2/C1" or sent to "C1, C2" is being asked to learn the filing system before the subject. | Teal's thesis; Diataxis on serving distinct reader needs (Procida); Pedagogy Toolkit Move 3 (routing); house anti-pattern captured from the Q-CRAFT course, 2026-08 |
| G2 | **Skim architecture** | Any page lacks a floating table of contents; or any chapter or section heading fails to explain itself in isolation; or any body paragraph cannot be understood from its chapeau sentence alone. The chapeau discipline is the Clearing-the-Clogs and IMF-report standard: the first sentence carries the paragraph's whole point, and a reader who reads only headings and chapeaus gets the entire argument. | Voice-DNA ("The header is the argument"); busy-readers explainer, house rules 1 and 2; layer-cake scanning (Pernice, NN/g 2019); Kieras (1978) on topic-first paragraphs |
| G3 | **The three personas pass** | Any of the three persona reads fails: the tool's creators would not read the material as meticulously correct and aligned with their intentions; its critics would not read it as meticulously fair on strengths and weaknesses; busy intelligent readers do not get the core intuitions fast. One overclaim, one miscredited method, or one buried limitation fails the gate. | House honest-broker stance (REFERENCE-NOTES, 2026-08-26); Cleary/Buchheit "be trustworthy"; deck-standard cold-reader test |
| G4 | **Jargon protocol** | Unnecessary jargon survives where plain language would do; or a necessary or will-be-encountered term reaches the reader without an in-context definition at first use; or first uses do not link to a glossary; or no glossary exists. Necessary jargon is precision jargon the profession will use to the reader; the door test separates it from prestige jargon (Explainer Toolkit). Definitions must not live only in a hover state: a tooltip-only definition is unreadable on touch screens and for keyboard and screen-reader users. | Explainer Toolkit ("redistributing access"); PLAIN Federal Plain Language Guidelines (2011); Bullock, Colon Amill, Shulman and Dixon (2019) on jargon's fluency cost; NN/g tooltip guidance (2019); WCAG 2.1 SC 3.1.3 |
| G5 | **Layered depth** | The main path is padded with material only some readers need; or derivations, alternative explanations, and extra worked detail are absent rather than carried in collapsible expansions; or anything the majority of readers needs is hidden inside a disclosure. The visible default carries the full message; the layers carry the depth. | REFERENCE-NOTES layered-depth standard (2026-08-26); Explainer Toolkit (layering; default state carries the message); Nielsen progressive disclosure (2006); GOV.UK details-component guidance |
| G6 | **Primary sources one click away** | The official materials behind the subject are not linked prominently and completely; or the material teaches toward a real-world genre without linking a representative sample of that genre; or the link set has no stated curation rule. The curation rule must be maintenance-realistic: representative, never exhaustive, with a named owner and a review trigger. For the Q-CRAFT course this means the official IMF materials and a curated handful of live fiscal risk statements across regions, national and IMF-produced, plus the C-PIMA context. | Course rider (REFERENCE-NOTES, 2026-08-28); house complementary-to-official stance; Explainer Toolkit (deference buys freedom) |
| G7 | **Global identity** | The material reads as one country's or one region's document. A worked example may and should be concrete and national; the frame, the hook, the idiom, and the exercises must read as a document for any country, with transfer framing wherever one country carries the teaching. | Teal's structural call (REFERENCE-NOTES, 2026-08-26): the course generalizes; Pedagogy Toolkit Move 10 (transfer is never automatic) |
| G8 | **Attribution and deference stay exact** | A method, dataset, principle, or quote is credited to the wrong author, edition, or institution; or material teaching someone else's tool fails to state prominently that it is unofficial and complementary and that the official documents remain authoritative; or externally gated wording appears in any form other than verbatim. | House rule (HCD standard G13); REFERENCE-NOTES not-an-IMF-product and parity-wording rules; Cleary/Buchheit provenance discipline |
| G9 | **Every number traces** | Any figure, worked result, or quantitative claim in the material cannot be traced to a committed script, a cited page of a named document, or a recorded run of the real tool; or a computed artifact is stale against the engine that now ships. A learning material about a quantitative tool that displays a number the tool no longer produces is teaching a falsehood with confidence. | Golden-master ethos (repo CLAUDE.md); the course-number-refresh incident (REFERENCE-NOTES, 2026-08-27); skimmable-note gate 1 (quantitative fidelity) |
| G10 | **The writing gates hold** | Sampled prose fails any layer-1 gate of the Cleary/Buchheit writing rubric, or any banned tic from `style-guide-writing-AI.md` appears, or an em-dash appears anywhere, headings included. This gate delegates: the writing rubric owns prose quality; this standard only refuses to ship learning material that fails it. | Cleary/Buchheit rubric layer 1; style-guide-writing-AI.md rules 1 through 12 |

## 3. Scored criteria

Grouped under the source canon. Each carries a one-line test an auditor can
apply to a page, a passage, or a walkthrough step. Score each observation
once, under the most specific line.

### A. Pedagogy (the toolkit moves, for courses)

The Pedagogy Toolkit's ten moves and the Learning Science Evidence Guide's
evidence cards are the source; the criteria below are their auditable faces.
A non-course genre adopts A-criteria only where its spec says so.

- **A1. Backward design from one authentic capstone.** The workplace
  deliverable is stated up front and every module visibly feeds it.
  *Test: name the capstone from page one alone; then, for each module, point
  to the sentence connecting it to the capstone. A module that cannot be
  connected is coverage, and coverage fails the test.* (Move 1; tension 3.)
- **A2. Objectives are observable performances.** Every module opens with
  objectives a colleague could watch the learner do.
  *Test: each objective uses an action verb and names a performance; no
  "understand," no "appreciate."* (Move 2.)
- **A3. Routing respects expertise, in plain words.** Prior-knowledge
  calibration exists, routes learners onto paths, and describes every path
  and route in words a reader can act on without re-reading their own
  answers as code.
  *Test: a reader who lost their self-assessment notes can still pick their
  path from the path descriptions alone.* (Move 3; expertise reversal,
  Learning Science card 4/6 boundary; G1 names the failure mode.)
- **A4. The expert's map is handed over.** One master concept map opens the
  material and returns in every module with the current location lit.
  *Test: find the map on every module page; the lit node matches the module.*
  (Move 4; the TEA-948 narrative spine: equation, then data and assumptions,
  then climate.)
- **A5. Every module hooks with the job.** Modules open with a concrete
  job-relevant problem and an early win, never with the apparatus.
  *Test: the first hundred words of each module name a task or decision the
  stated reader recognizes from work.* (Move 5; Learning Science rule 1.)
- **A6. Worked examples fade backward.** The teaching sequence runs full
  annotated example, then completion problem, then independent problem, and
  the fade is visible.
  *Test: locate all three stages for the core procedure; the annotated
  example precedes all practice.* (Move 6; Sweller and Cooper 1985; Fyfe et
  al. 2014 on concreteness fading.)
- **A7. Practice is retrieval, spaced, and wanted.** Self-checks require
  recall or prediction before revealing answers, recur across modules with
  gaps, and live inside artifacts the learner wants to produce.
  *Test: find a practice item that (a) asks before telling, (b) returns to
  an earlier module's mechanism, and (c) produces something the learner
  keeps.* (Move 7; Learning Science cards 1, 2; tension 2.)
- **A8. Load is managed in every artifact.** Nothing decorative stands;
  labels sit with what they label; segments are learner-paced.
  *Test: remove-test each standing element of a sampled module; each either
  serves the task or goes.* (Move 8; Learning Science card 6.)
- **A9. Transfer is taught, never assumed.** Principles appear across at
  least two contexts with an explicit structured comparison, and the
  material says where the method does and does not travel.
  *Test: for the central mechanism, find the second context and the explicit
  comparison.* (Move 10; Learning Science card 7.)
- **A10. Wrappers close every module.** Each module ends by naming what the
  learner should now have, common errors, and what to do differently.
  *Test: the last section of each module answers "what do I have now" in the
  learner's terms.* (Move 10 corollary; chapter template item 11.)
- **A11. Time is budgeted honestly.** Stated times reflect the 3-to-4-times
  rule for learner time against expert time, and the material says so.
  *Test: find the time guidance; check it cites or applies the multiplier
  rather than the author's own completion time.* (Curse-of-expertise step 4.)
- **A12. Error content comes from real learners.** Common-mistakes material
  and distractor options derive from piloted or observed errors, and say so;
  until a pilot exists, the material marks invented error content as
  provisional.
  *Test: for each common-mistakes box, find its provenance note.*
  (Curse-of-expertise step 3; QCRAFT redesign build sequence.)

### B. Prose for busy readers

The six principles (Rogers and Lasky-Fink 2023; house busy-readers explainer)
plus the Cleary/Buchheit craft rules, applied to instructional text. G2 gates
the architecture; these criteria grade the execution.

- **B1. Chapeaus carry the argument.** Beyond the gate's floor: the chapeau
  sentences, read alone in order, reconstruct the module's whole case.
  *Test: extract every chapeau of one module and read the sequence as a
  summary; it must stand as one.* (Voice-DNA; whether chapeaus are bolded is
  an open style question for Teal, settled with evidence in
  `docs/course-reformat-plan.md`.)
- **B2. Headings are front-loaded claims.** Each heading leads with its
  information-bearing words and states a claim or capability, never a topic
  label.
  *Test: read only the first two words of every heading in the table of
  contents; the reader can still navigate.* (Nielsen 2009, first-2-words;
  Cleary/Buchheit 3e.)
- **B3. One idea per paragraph.** No paragraph carries a second idea its
  chapeau did not announce.
  *Test: sample five paragraphs; each maps to exactly one point.* (Busy
  readers principle 3; Kieras 1978.)
- **B4. Sentences stay short and active.** Average sentence length sits near
  20 words; passives and nominalizations are hunted.
  *Test: run the 20 percent cut test on one sampled section; if a fifth of
  the words come out without changing meaning, score 0 or 1.*
  (Cleary/Buchheit 4a; busy readers principle 2.)
- **B5. Numbers beat adjectives, and big numbers get perspective.** Scale
  claims carry the figure in the claiming sentence, and each big number gets
  one perspective sentence in familiar units.
  *Test: find three scale claims; each names its number where it makes the
  claim.* (Voice-DNA pattern 1; Explainer Toolkit perspective rule.)
- **B6. Relevance is stated, never implied.** Each major section answers
  "why should this reader care" in its opening.
  *Test: for each H2, the answer to "so what, for the stated reader" appears
  within the first paragraph.* (Busy readers principle 5; Move 5.)
- **B7. Every module ends with an explicit ask.** The reader always knows the
  next concrete action: what, with what, by when.
  *Test: the end of each module names an action the reader can start today.*
  (Busy readers principle 6.)
- **B8. Formatting is spent like money.** Bold marks the skim path only;
  emphasis is zero-sum, and decorated text is noise.
  *Test: count bolded phrases per screen; each earns its place on the skim
  path or goes.* (Busy readers principle 4; style guide rule 4.)

### C. Explaining quantitative ideas

The Explainer Toolkit's protocol plus the science-communication evidence,
for every equation, model, and number the material teaches.

- **C1. Mechanism, not function.** The material shows the causal chain, never
  just what the thing does.
  *Test: for the central mechanism, the reader can answer "what makes the
  number move" from the text, not merely "what the number is."* (Explainer
  Toolkit.)
- **C2. Concrete before abstract, with an explicit fade.** New ideas open
  with a concrete instance and fade deliberately to the general form.
  *Test: sample three concepts; each first appearance is a case, a number,
  or a country, and the general statement follows it.* (Fyfe, McNeil, Son
  and Goldstone 2014; Explainer Toolkit ADEPT order.)
- **C3. Equations get the full treatment.** Every taught equation is derived
  from words first, annotated on the equation itself, instantiated with one
  numeric scenario, narrated in one plain sentence, and paired with a
  picture in the same visual field.
  *Test: for each equation, find all five elements within one screen of it.*
  (Explainer Toolkit equation protocol; Pedagogy Toolkit Move 4 dual-coding
  corollary.)
- **C4. Analogies are scaffolded and honest.** Every analogy names where it
  breaks; complex concepts get two analogies and an explicit comparison.
  *Test: for each analogy, point to the sentence naming its breaking point.*
  (Richland, Zur and Holyoak 2007; Spiro et al. 1989.)
- **C5. Prediction before payoff.** Big reveals are preceded by a question
  the reader commits to.
  *Test: each major result or demo has a predict-observe-explain moment
  before it.* (Explainer Toolkit; Learning Science card 3.)
- **C6. Risk and change numbers carry their reference class.** No bare
  relative change stands alone; absolute terms or natural frequencies
  accompany it.
  *Test: every "X percent worse/better" names the base it moves from.*
  (Gigerenzer et al. 2007; McDowell and Jacobs 2017.)
- **C7. The reveal move builds on the familiar skeleton.** Where a familiar
  structure exists, the material names it first and hangs the new parts on
  it, rather than introducing parts one by one.
  *Test: the course's central model is introduced as a known base plus a
  named addition, matching the material's own map.* (Explainer Toolkit
  reveal move; the M1 LEGO arc, REFERENCE-NOTES 2026-08-26.)

### D. Figures

The chart-craft canon applied to teaching figures. Where deck-standard
section 5 and figure-typography.md disagree on condensed faces,
figure-typography.md wins (it is newer and was captured from Teal's own
review catches); section 7 records the conflict.

- **D1. Titles are takeaways.** Every figure title asserts the figure's
  claim in sentence case.
  *Test: read only figure titles; each states what the reader should
  conclude, never what the axes are.* (Deck-standard section 4;
  Storytelling-With-Data section 6.)
- **D2. Data is labeled directly.** Series are labeled on the data; legend
  hunts and color-only encodings fail.
  *Test: cover the legend; every series is still identifiable.*
  (Storytelling-With-Data sections 2 and 4.)
- **D3. Hierarchy matches the message.** One highlight color sits where the
  message lives; support recedes to gray; the recommended reading is the
  most prominent ink.
  *Test: squint-test the figure; the most visible element is the point.*
  (Storytelling-With-Data section 4.)
- **D4. Type is sized for the rendered width.** Body text in figures lands at
  page-body size at display width; no condensed faces for in-figure labels.
  *Test: inspect the rendered figure at one-to-one; smallest label at or
  above body size.* (figure-typography.md, all four rules.)
- **D5. Figures are read out, never plonked.** Every figure is introduced
  before it appears and its conclusion is stated after it.
  *Test: for each figure, find the preview sentence and the read-out
  sentence.* (Cleary/Buchheit 3h.)
- **D6. Form follows the relationship.** Chart types match what is being
  compared; bar axes start at zero; lines carry at most four series.
  *Test: apply the Storytelling-With-Data decision tree to each chart; no
  mismatches.* (Storytelling-With-Data section 2.)
- **D7. The exhibit language is consistent.** Tinted panels, ink banners,
  numbered circles, and the house palette are used consistently, rendered in
  the edition's font stack.
  *Test: put any two figures side by side; they read as one system.*
  (Deck-standard section 5; REFERENCE-NOTES maximally-visual call.)
- **D8. Figures regenerate from the repo.** Every computed figure has a
  committed script and data path, and regeneration is documented.
  *Test: for each figure, name the script; run one and diff.* (Colophon
  discipline; G9 gates correctness, this criterion grades craft.)

### E. Navigation and findability

The J3 journey's home group: the reader who needs one thing fast.

- **E1. The floating ToC works everywhere.** Every page has it, it tracks
  scroll position, and it names sections in front-loaded words.
  *Test: on each page, scroll to mid-document; the ToC shows where you are.*
  (ONS design-system practice; Schade 2017 on anchors.)
- **E2. Search is present and finds terms of art.** Full-text search exists
  and returns the defining page for each glossary term.
  *Test: search five glossary terms; the defining page is a top result each
  time.*
- **E3. Cross-references explain themselves.** No bare "Chapter 5" or
  "Section 1.6": every cross-reference carries words a reader can act on
  without resolving a number first.
  *Test: sample ten cross-references; each names its destination's content,
  with or without its number.* (First-2-words logic, Nielsen 2009; the G1
  anti-pattern's cousin.)
- **E4. The glossary is a reference page that works.** Alphabetized, ToC'd
  or letter-indexed if long, definitions lead with the one-sentence version,
  and terms link back to the section that teaches them.
  *Test: time a lookup of one mid-alphabet term from a module page: one
  click to the glossary, one scan to the term, one click back to teaching.*
  (OpenStax convention; WHATWG dfn semantics.)
- **E5. One thing is findable fast.** J3 completes in under a minute for
  five representative queries.
  *Test: five lookups (a parameter meaning, a scenario name, a limitation, a
  citation, a how-do-I): each lands within a minute from the index page.*
- **E6. Effort is visible before commitment.** Each module states what it
  takes: time, prerequisites, and what the fast path skips. Stated times
  come from A11's learner-time multiplier, never from a words-per-minute
  read-time formula, which measures reading and not learning.
  *Test: each module's first screen answers "how long, what do I need, what
  can I skip."* (Fast-path markers; Medium read-time practice as the
  visibility pattern only.)
- **E7. Mobile reading is intact.** Tables, equations, and figures fit or
  scroll within the viewport; collapsibles work by tap; nothing depends on
  hover.
  *Test: walk one module on a phone-sized viewport; no horizontal page
  scroll, no hover-only content.* (Budiu 2015; NN/g tooltip guidance.)
- **E8. The whole-artifact forms survive.** The PDF (or equivalent
  single-artifact form) exists, is current, and carries the same content and
  attribution.
  *Test: open the PDF; spot-check three passages and the colophon against
  the web edition.*

### F. Tone and enjoyability

The friendly guide for intelligent people, made auditable.

- **F1. Respect without presumption.** The register assumes intelligence and
  never assumes prior knowledge; no "you already know," no "simply," no
  scolding.
  *Test: search the presumption formulations and the style guide's banned
  tics in the material; zero hits, and sampled passages explain without
  condescending.* (REFERENCE-NOTES honest-broker tone call; Trudeau 2012 and
  Oppenheimer 2006: experts prefer plain language, and needless complexity
  lowers judged intelligence.)
- **F2. Wit is rationed and true.** At most one dry aside per section, riding
  on a true specific fact, never longer than a sentence.
  *Test: count asides per section; each is factual, short, and funny to a
  busy reader rather than to the author.* (Voice-DNA pattern 8.)
- **F3. Credit comes before the cut.** Anything the material critiques is
  first credited specifically and sincerely; critique aims at tools and
  systems, never at people or institutions' motives.
  *Test: for each limitation or critique passage, find the preceding
  specific credit.* (House Style Playbook; the both-tools card's Excel
  respect rule.)
- **F4. The read has momentum.** Early wins arrive early; drudge passages are
  broken by variety (a figure, a question, a task); no section reads as
  filler.
  *Test: walk J2 and mark every point where attention flags; more than one
  per module is a finding.* (Move 5 early wins; enjoyability is Teal's
  stated design goal, and this is its walkable proxy.)
- **F5. Examples carry the global frame.** Multi-country examples do real
  teaching work: the mechanism picks the country, and the material says why.
  *Test: for each extended example, find the sentence naming why this
  country teaches this mechanism.* (REFERENCE-NOTES: demography reads
  clearest where the workforce shrinks; G7 gates identity, this grades the
  craft.)

### G. Process (evidence a release can show)

- **G1p. Personas and journeys are written down.** A statement of who this
  serves, on which journeys, exists and matches what was built.
  *Test: the statement names the personas and the four journeys; the index
  page serves them.* (ISO 9241-210:2019, referenced by name and number only,
  as in the HCD standard.)
- **G2p. Evaluation drove refinement.** The release shows at least one
  evaluation against realistic readers or learners, and what changed.
  *Test: release notes name findings and the changes they caused; for
  courses, pilot evidence per A12.*
- **G3p. Iteration is recorded.** Redirected design decisions land in this
  file's capture section, with before and after.
  *Test: section 6 grows when Teal redirects a decision; an empty section
  after a redirect is a miss.*
- **G4p. The whole journey is designed.** Arrival, orientation, the module
  flow, practice, the capstone, and the return visit as a reference are each
  deliberate.
  *Test: the audit's journey map covers all six and none is an accident of
  implementation.*

## 4. Severity scale for audit findings

Nielsen's 0 to 4 scale, applied per finding after the walkthroughs:

- **0**: not a problem.
- **1**: cosmetic; fix when spare time exists.
- **2**: minor; low priority.
- **3**: major; important to fix.
- **4**: catastrophe; imperative to fix before release. Reserved for findings
  that would make a reader learn or cite a wrong number, misattribute a
  method, or abandon a journey the material promised to serve.

## 5. Running an audit

- **Personas first.** At least the three gate personas (creator, critic, busy
  reader), written with stated expertise and goals, plus the course's own
  routed learner types where they exist. Two auditors given only the persona
  sheet should agree on what this persona would recognize cold.
- **Walk all four journeys end to end.** For every step, the walkthrough
  questions adapted for reading: will this reader know where to go next;
  will they understand what they meet there; will they know why it matters;
  and will they see they are making progress? (Wharton, Rieman, Lewis and
  Polson's frame, 1994, adapted from action to reading.)
- **Independent passes, then aggregate.** Three or more differently-lensed
  passes work independently before aggregation; aggregation preserves the
  count: found by n of m. (Nielsen and Molich 1990.)
- **Verify adversarially.** Every finding faces one pass whose job is to kill
  it: evidence checked against the page, severity re-anchored, fix checked
  for proportion.
- **Findings carry five things.** The rubric line violated, the evidence
  (passage or screenshot, with exact text where relevant), the severity, the
  smallest fix that resolves it, and what the finding must not break (gated
  wording, a prior Teal decision, a first-class path).
- **The first screen gets its own pass.** Audit where the eyes land on the
  index page and what the first click would be, against G1 and B-group.
- **Measurements are committed.** Scripted captures, probe outputs, and word
  counts land in the repo beside the audit, so every number in the audit is
  re-runnable. (Learned from the HCD audit, whose measurement files stayed
  in scratch.)
- **What works well is recorded, first.** The protect-list precedes the
  findings, so fixes cannot trample strengths.
- **Repo-specific bindings are checked separately.** Where the subject
  carries its own binding decisions (for Q-CRAFT: REFERENCE-NOTES wording
  gates, the narrative spine, the four-reasons card), the audit checks them
  in their own section and never re-litigates them.

## 6. Captured from real use

Seeded empty on purpose. The capture rule, the same loop the writing style
guides and the HCD standard use: when Teal redirects a design decision in
review, the pattern lands here with the before and the after, the artifact it
came from, and the generalized rule. When an entry recurs twice it graduates
into a gate or a scored criterion at the next version bump, by Teal's say-so.

*(No entries yet.)*

## 7. Sources

Two tiers. House canon is cited by document and section; external sources
were verified against the primary or an authoritative record during the CC-17
research pass (adversarial citation check; see the audit log). Editions
matter: names and claims above follow the editions cited here.

**House canon (binding, cited throughout):**

- Pedagogy Toolkit v0.1 (2026-07-07), Drive
  `01-PROJECTS/_Professional/2026-07_IMF-CD-Pedagogy/`: the ten moves, the
  chapter template, the curse-of-expertise process, the three tensions.
- Learning Science Evidence Guide v0.1 (updated 2026-08-24), same folder: the
  evidence cards, the design rules, the evidence-strength posture, the
  maintenance protocol. Its backbone text is Ambrose et al., *How Learning
  Works* (Jossey-Bass, 2010).
- Explainer Toolkit v0.1 (2026-07-08), same folder: jargon stance and budget,
  the equation-intuition protocol, the reveal move, the layering rule.
- Q-CRAFT Course Redesign v0.1 (2026-07-07), same folder: the prior decisions
  this standard must not contradict (Module 0 routing, three-layer
  architecture, backward-faded worked case, pilot-fed error content).
- Persuasive-writing guide and rubric, Cleary/Buchheit tradition (2026-06-24),
  Drive `03-RESOURCES/LLM-Context/`: the gate-plus-scored rubric shape, topic
  sentences, headings as arguments, the syllogism, audience calibration.
- `lte-workbench/docs/explainers/writing-for-busy-readers.md` (v1.0): the six
  principles as house rules; canonical, never re-derived.
- `lte-workbench/docs/skimmable-note-format.md`: the skim-test gates.
- Voice-DNA capture (2026-06-23), Drive LIC-DSF consultation folder: the
  chapeau discipline with receipts, anchor-line rule, wit ration.
- `lte-workbench/docs/deck-standard.md` (v1.0),
  `lte-workbench/brand/figure-typography.md`, and the Storytelling-With-Data
  digest (2026-01-23, after Knaflic 2015): the figure canon. **Known
  conflict:** deck-standard section 5 prescribes condensed all-caps diagram
  labels; figure-typography.md bans condensed faces for in-figure labels.
  This standard follows figure-typography.md, the newer document, captured
  from Teal twice catching unreadable type; the deck standard should be
  amended at its next touch. **Second known conflict, resolved by Teal's own
  call:** the writing canon wants headings that assert claims, while
  REFERENCE-NOTES (2026-08-26) rules that COURSE titles are descriptive
  single-clause capability names because the sidebar is a map; deck titles
  stay claim-style. B2 is phrased "claim or capability" to encode that
  resolution, and G2's self-explanatory test is the part that binds both
  genres.
- `docs/hcd-standard-draft.md` (CC-15, 2026-08-29): the sibling standard;
  shared shape, severity scale, and audit method.
- `style-guide-writing-AI.md` and `style-guide-writing-me.md`
  (`lte-workbench/context/`): binding on all prose, delegated through G10.
- SHARED/REFERENCE-NOTES.md (qcraft-sprint-2026-08-26): the Q-CRAFT binding
  decisions cited as house calls above.

**External sources:**

- Rogers, T. and Lasky-Fink, J. *Writing for Busy Readers: Communicate More
  Effectively in the Real World.* Dutton, 2023. Field results: the
  127-to-49-word email experiment (response 2.7 to 4.8 percent), reported in
  "When Writing for Busy Readers, Less Is More," *Behavioral Scientist*,
  2023.
- Lasky-Fink, J., Robinson, C. D., Chang, H. N.-L. and Rogers, T. "Using
  Behavioral Insights to Improve School Attendance." (Simplified truancy
  notices reduced absences.)
- Bhargava, S. and Manoli, D. "Psychological Frictions and the Incomplete
  Take-Up of Social Benefits." *American Economic Review*, 2015.
- Adams, G. S., Converse, B. A., Hales, A. H. and Klotz, L. E. "People
  systematically overlook subtractive changes." *Nature*, 2021.
- Doemeland, D. and Trevino, J. "Which World Bank Reports Are Widely Read?"
  World Bank Policy Research Working Paper 6851, May 2014. (Author-attributed
  working paper, never an institutional position.)
- Moretti, F. and Pestre, D. "Bankspeak: The Language of World Bank Reports,
  1946-2012." *New Left Review* 92, 2015.
- Nielsen, J. "How Users Read on the Web" (1997); "How Little Do Users Read?"
  (2008, with Weinreich et al.'s data); "First 2 Words: A Signal for the
  Scanning Eye" (2009); "Progressive Disclosure" (2006). Nielsen Norman
  Group.
- Morkes, J. and Nielsen, J. "Concise, SCANNABLE, and Objective: How to Write
  for the Web." 1997.
- Pernice, K. "F-Shaped Pattern of Reading on the Web: Misunderstood, But
  Still Relevant" (2017); "The Layer-Cake Pattern of Scanning Content on the
  Web" (2019). Nielsen Norman Group.
- Schade, A. "Inverted Pyramid: Writing for Comprehension" (2018); "Anchors
  OK? Re-Assessing In-Page Links" (2017). Nielsen Norman Group.
- Loranger, H. "Accordions Are Not Always the Answer for Complex Content on
  Desktops" (2014); "Plain Language Is for Everyone, Even Experts" (2017).
  Nielsen Norman Group. Budiu, R. "Accordions on Mobile" (2015). Kendrick, A.
  "Tooltip Guidelines" (2019). Fessenden, T. "Scrolling and Attention"
  (2018).
- Kieras, D. E. "Good and bad structure in simple paragraphs." *Journal of
  Verbal Learning and Verbal Behavior*, 1978.
- Hartley, J. and Trueman, M. "A research strategy for text designers: The
  role of headings." *Instructional Science* 14, 1985. Hyona, J. and Lorch,
  R. F. "Effects of topic headings on text processing." 2004.
- Baker, J. R. "The Impact of Paging vs. Scrolling on Reading Online Text
  Passages." *Usability News* 5(1), 2003.
- ISO 24495-1:2023, *Plain language, Part 1: Governing principles and
  guidelines.* Referenced by name and number only.
- Plain Language Action and Information Network. *Federal Plain Language
  Guidelines*, rev. 1, 2011. Plain Writing Act of 2010, Public Law 111-274.
- Government Digital Service: GOV.UK writing guidance ("Create a clear
  structure"; "Use clear language") and the GOV.UK Design System details
  component. Office for National Statistics design system, table-of-contents
  pattern.
- Google developer documentation style guide, "Jargon" (living document).
- Bullock, O. M., Colon Amill, D., Shulman, H. C. and Dixon, G. N. "Jargon as
  a barrier to effective science communication." *Public Understanding of
  Science*, 2019. Shulman, H. C. et al. "The Effects of Jargon on Processing
  Fluency, Self-Perceptions, and Scientific Engagement." 2020. Shulman,
  H. C. and Bullock, O. M. "Don't dumb it down." 2020.
- Oppenheimer, D. M. "Consequences of erudite vernacular utilized
  irrespective of necessity." *Applied Cognitive Psychology*, 2006.
- Trudeau, C. R. "The Public Speaks: An Empirical Study of Legal
  Communication." *Scribes Journal of Legal Writing*, 2012.
- Sweller, J. and Cooper, G. A. "The Use of Worked Examples as a Substitute
  for Problem Solving in Learning Algebra." *Cognition and Instruction*,
  1985.
- Fyfe, E. R., McNeil, N. M., Son, J. Y. and Goldstone, R. L. "Concreteness
  Fading in Mathematics and Science Instruction." *Educational Psychology
  Review*, 2014.
- Richland, L. E., Zur, O. and Holyoak, K. J. "Cognitive Supports for
  Analogies in the Mathematics Classroom." *Science*, 2007.
- Spiro, R. J., Feltovich, P. J., Coulson, R. L. and Anderson, D. K.
  "Multiple Analogies for Complex Concepts." In *Similarity and Analogical
  Reasoning*, 1989.
- Chi, M. T. H., De Leeuw, N., Chiu, M.-H. and Lavancher, C. "Eliciting
  Self-Explanations Improves Understanding." *Cognitive Science*, 1994.
- Gigerenzer, G., Gaissmaier, W., Kurz-Milcke, E., Schwartz, L. M. and
  Woloshin, S. "Helping Doctors and Patients Make Sense of Health
  Statistics." *Psychological Science in the Public Interest*, 2007.
  McDowell, M. and Jacobs, P. "Meta-Analysis of the Effect of Natural
  Frequencies on Bayesian Reasoning." *Psychological Bulletin*, 2017.
- Procida, D. *Diataxis.* diataxis.fr: the four documentation modes and the
  mode-bleed failure.
- Wikipedia Manual of Style, "Linking" (first-occurrence convention). WHATWG
  HTML Living Standard, the dfn element. W3C WCAG 2.1, SC 3.1.3 Unusual
  Words. Abraham, L. B. "Computer-mediated glosses in second language
  reading comprehension and vocabulary learning: a meta-analysis." 2008.
  OpenStax textbook conventions (bold key terms, defined in context, doubled
  in an end-of-chapter list).
- Wharton, C., Rieman, J., Lewis, C. and Polson, P. "The cognitive
  walkthrough method." In *Usability Inspection Methods*, 1994. Nielsen, J.
  and Molich, R. "Heuristic Evaluation of User Interfaces." *CHI '90*, 1990.
- ISO 9241-210:2019, *Human-centred design for interactive systems.*
  Referenced by name and number only.

## 8. Log

- 2026-08-30: v0.1 drafted by CC-17 (TEA-948). Research fan-out: nine house
  canon readers, a structured course map, and six external research lanes
  with adversarial citation verification. Gates follow the CC-17 charter;
  scored criteria synthesize the Pedagogy Toolkit's moves, the busy-readers
  and Cleary/Buchheit prose canon, the Explainer Toolkit's protocols, the
  chart-craft canon, and the navigation-usability evidence. First applied to
  the Q-CRAFT Explorer companion course (docs/learning-audit-2026-08.md in
  the QCraft-App repo).
