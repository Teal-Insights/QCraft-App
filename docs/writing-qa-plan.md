# AI-era writing quality: the architecture (CC-19, phase 2)

**Status:** recommendation for Teal's review. Nothing here is implemented; this lane changes no shipped material. Evidence base: `writing-qa-research.md` (same PR). Audit applying the draft catalog: `writing-qa-audit-2026-08.md`.

**The decision asked.** Where do the slop catalog, the mechanical linter, and the verification workflow each live, so that canon does not fragment and the system iterates the way the HCD and learning standards do.

**The recommendation in one paragraph.** One canon, one mechanical mirror, one ship-time standard. The catalog extends `style-guide-writing-AI.md` with a dated, retirable model-watchlist section; the guide stays the single prose canon that every skill already loads. The linter lives in lte-workbench as `scripts/prose-lint/`, reads a machine-readable mirror of the catalog, and is invoked by the writing skill's self-check and by per-repo ship gates; it counts doses and flags shape candidates, and it never renders verdicts on judgment calls. The verification workflow graduates from the Clearing the Clogs project skill to lte-workbench canon as `docs/verification-standard.md`, and repo ship gates delegate to it the same way the learning standard's G10 delegates prose quality to the rubric. Each piece cites the others; none duplicates them.

**In this document.**

1. The architecture and why this shape
2. Piece 1: the slop catalog (model watchlist in the style guide)
3. Piece 2: the linter spec (`prose-lint`)
4. Piece 3: the verification workflow standard
5. Prototype evidence: what the metrics actually separate
6. Receipts for the future public piece
7. What lands where, in what order

---

## 1. The architecture and why this shape

```
canon (human-first prose)               mechanical mirror                    enforcement points
-------------------------               -----------------                    ------------------
style-guide-writing-AI.md   ------->    prose-lint rules + bands   ------->  writing skill self-check
  12 durable shape rules                (regenerated from canon,             repo ship gates (freeze-check
  + model watchlist (new)                never hand-forked)                    pattern, per repo)
                                                                             audit lanes (this one)
Cleary/Buchheit rubric      ------->    (gates G1-G8 stay human-graded)
verification-standard.md    ------->    ledger tooling (docpacks,   ------>  release gate for public and
  (new home of the ledger                verification workers)               educational material
   contract)
```

Three principles force this shape:

**Canon stays singular and human-first.** The learning standard already proved the pattern: "Where those documents state a rule, this file points at it and adds only the auditor test." Its writing gate G10 delegates prose quality to the rubric and the style guide rather than restating them. A slop catalog in its own new file would be a second prose canon; a catalog living inside linter config would make a YAML file the source of truth for a taste question. Both fragment canon. The style guide is already loaded by the bootstrap into every drafting session, so a section added there binds everywhere with zero new wiring.

**Mechanics mirror canon, never fork it.** The deck lane learned this the hard way: its word-list sweep passed a deck carrying rule 3's own textbook example four runs running, because shape rules need shape detectors. The linter encodes the guide's rules as named, tested detectors, and the catalog's dose thresholds as configured bands. When canon changes, the mirror regenerates; a mirror rule with no canon line behind it is a bug.

**Judgment gets convergence or a human, never a solo model verdict.** ADM-182's numbers bind: a single LLM judge re-run on byte-identical input produced three different rankings, with run-to-run noise 3.4x the differences it was asked to detect. The linter therefore has exactly two output lanes: mechanical counts (deterministic, testable) and flagged candidates for review (a human, or the lane4-proven two-of-three independent-verifier pattern when a sweep is large). Nothing in between.

Alternatives considered and set aside:

- **A standalone slop-catalog file** (rejected: second canon; the guide already contains model-era slop entries by construction, so the split would be arbitrary).
- **Vale (or proselint) as the linter engine** (deferred, not rejected: Vale is the right CI host if the rule set ever needs to run in heterogeneous repos we do not control. Today every target corpus is ours, the deck precedent is house Python, several detectors need custom context handling that Vale styles express poorly, and a stdlib script keeps the dependency surface at zero. The spec below is engine-agnostic enough to port later.)
- **Homing the linter in QCraft-App** (rejected: the corpus targets span the course, the guides, deck copy, site copy, vault notes, and future repos; the cockpit owns cross-repo tooling. Repos keep thin gates that call it, exactly as freeze-check.sh stays repo-local.)
- **Folding verification into the linter** (rejected: different failure modes, different cadence. Slop is per-draft; verification is per-release with a freeze. The two meet only at the ship gate.)

## 2. Piece 1: the slop catalog

**Home:** a new section in `lte-workbench/context/style-guide-writing-AI.md`, directly after "Other tics to avoid," titled **"Model watchlist (dated, retirable)."** The existing 12 numbered rules are untouched; they are the durable shape bans and stay the guide's spine.

**Why the guide needs the new section.** Today the guide cannot distinguish a permanent shape rule from a vocabulary fashion. "Delve" sits in "Other tics to avoid" forever, while the published record (research doc, section 3.1) shows word tells decay in about a year and the Economist has already retired "delve" in print. Meanwhile nothing captures the current generation's fresh mints (the Economist's polysyllable set: "significant", "increasingly", "consequences"; the FT's "deeper") because the two-strike capture loop only fires when Teal hand-fixes a tic twice, and vocabulary drift is better caught by corpus evidence than by two hand-edits.

**Entry format.** One table row per entry:

| Field | Content |
|---|---|
| Tell | The word or construction, with a one-line example |
| Class | vocabulary / construction / punctuation |
| First seen | Date and model generation ("2026-08, current frontier models") |
| Evidence | The review where Teal caught it, or the external source (Economist study, Wikipedia catalog era list, corpus paper) |
| Dose rule | The threshold that makes it a defect, stated for humans ("more than ~2 per 1,000 words in expository prose"; "never in a heading"; "zero, anywhere" only where Teal has ruled) |
| Status | active / retired (date + why) |

**The dose rule field is the doctrinal core.** Dose is the crime, never the device. The rule of three stays; the catalog states at what frequency, in which register, a device becomes a tell. Zero-tolerance stays reserved for the standing workspace rules (em-dashes) and literal-string tics ("it's worth noting"); everything else gets a band. Starter bands come from the prototype's house-corpus calibration (section 5), not from taste: the good exemplar runs rule-of-three at ~2 per 1,000 words, so the band is set above what Teal's own polished prose does, not at zero.

**Update protocol (the iterability engine, mirroring the learning standard's section 6):**

- **Add** on either trigger: (a) the existing two-strike rule (Teal fixes the same tell twice; the drafting session appends the row with dated attribution, unchanged from today), or (b) corpus evidence: a documented external catalog or study names a new-generation tell AND the linter measures it above band in a current house draft corpus. External evidence alone adds a row as "watch"; it takes a house measurement to mark it active.
- **Retire** on either trigger: (a) two consecutive quarterly audits measure the tell at or below the human-baseline band in raw model drafts (the tell has decayed at the source), or (b) the published record retires it (as the Economist did for "delve"). Retired rows keep their history; retirement means the linter stops counting it, not that the row disappears. A retired vocabulary tell that is also bad writing in its own right (say "leverage" as a verb) graduates to the permanent "Other tics" list instead of retiring; decay only retires tells whose sole offense was being machine-flavored.
- **Graduate** a watchlist construction into a numbered rule only on Teal's say-so, on the learning standard's two-recurrence pattern: recurring hand-fix evidence plus a stated mechanism, like rules 10 to 12 got in August.
- **Cadence:** the quarterly audit (or each new frontier-model adoption, whichever comes first) re-runs the linter over a fresh raw-draft corpus and proposes adds and retires as a decision packet. Model releases mint slop; the refresh is pegged to them, not to the calendar alone.

**Seed content for the first watchlist,** drawn from the research (all dose-banded, none banned outright): the current-generation polysyllable set ("significant", "increasingly", "consequences" at elevated rates); "deeper" (FT graphic); nominalisation density; long-word rate in non-technical registers; sparse-punctuation profile (few commas, near-zero parentheses); uniform sentence length (CV below ~0.65 sustained across a module); "Can X but can't Y"; present-participle analysis padding ("highlighting...", "showcasing..."); and the Wikipedia mid-2025 list (emphasizing, enhance, highlighting, showcasing). The existing "Other tics" vocabulary (delve, robust, seamless, elevate, unlock, leverage-as-verb) stays where it is: those earned permanent bans as bad writing regardless of provenance.

## 3. Piece 2: the linter spec

**Home:** `lte-workbench/scripts/prose-lint/` (Python, stdlib only, no network). **Callers:** the writing skill's self-check step 1 (which today says "reread the draft against the full list"; it gains "and run prose-lint" exactly as its improvement plan anticipated); audit lanes like this one; per-repo ship gates that choose to vendor a thin wrapper (the freeze-check pattern: gates run against the built artifact, not just source). The QCraft course, if Teal adopts the recommendation, adds a `prose-lint` call beside its render gate on the next touch.

**Inputs.** Any set of `.md` / `.qmd` / `.txt` files, or a JSON of role-tagged strings (the deck's `display-copy.json` pattern, so built artifacts can be linted by role). A `--register` flag selects the threshold band (expository / technical-reference / display-copy / linear-note); registers map to the house register files.

**Preprocessing (where most false positives die).** Strip YAML frontmatter, fenced code and mermaid, inline code, math, div fences, tables, link targets (keep link text), images, HTML tags and comments. Then span-classify what remains: quoted spans (text inside quotation marks and blockquotes) and citation spans (author-year patterns, proper-name coordinations) are EXCLUDED from vocabulary and construction counters and reported in a separate "quoted material" census. The prototype demonstrated every one of these false-positive classes on real house text: the IMF's own goal statement fired the watchlist counter, author lists fired the rule-of-three counter, and this lane's research doc, which names the tells as data, lights up any naive scan (section 5.4).

**Detector inventory.** Three tiers, mirroring canon:

*Tier A, hard gates (exit nonzero; zero tolerance is canon):*
- A1 em-dash anywhere (rule 2; the one logged vault exemplar exception is a caller-side skip).
- A2 literal-string tics: "it's worth noting", "needless to say", "let's dive in/explore/unpack", "in conclusion", throat-clearing openers (other-tics list).
- A3 heading shapes, when headings or role-tagged copy are available: the deck sweep's eight patterns for rules 3, 10, 11 in headings (negative parallelism in all five forms, participle tagline, appended-judgment tails). Rule 3 is banned outright in headings by canon, so this is mechanical, not judgment.
- A4 gated-wording integrity where the caller supplies pinned strings (the freeze-check pattern generalized: pinned strings must appear verbatim; superseded strings must not appear).

*Tier B, dose counters (reported against the register band; above-band is a warning, not a failure, except where the catalog row says otherwise):*
- B1 watchlist vocabulary rates per 1,000 words (from the catalog mirror; per-word and clustered).
- B2 rule-of-three rate (citation-triplet-exempt).
- B3 "not X but Y" family rate in prose (the load-bearing exception means prose occurrences are countable but not individually damnable).
- B4 semicolon rate (rule 9's "earn its place" as a band, with caller carve-outs for gated strings).
- B5 sentence-shape stats per file: mean, SD, CV, short-sentence share (≤8 words), long-sentence share (≥30), flagging sustained CV below band.
- B6 repeated-opener and repeated-bigram-opener concentration.
- B7 lexical variety (MATTR, window 400; MTLD when the port is worth it).
- B8 punctuation profile (commas, parentheses, colons per 1,000 words) against band.
- B9 nominalisation and long-word rates against the register band (technical registers legitimately run high; the band moves, the metric does not).
- B10 top repeated 4-grams above a count floor (formulaicity census, apparatus-aware: deliberate repeated frames like learning objectives are caller-declared exemptions).

*Tier C, judgment candidates (never counted as defects; emitted as a review queue):*
- C1 rule 12 candidates (", and " joins; the deck sweep's design comment is binding: "Rule 12 cannot be decided mechanically").
- C2 rule 3 prose candidates that survive B3 banding (is the contrast load-bearing?).
- C3 rule 7/8/10 tails in prose (self-certifying, echo-amplifier, appended-judgment: shapes with legitimate lookalikes).
- C4 anything above band in B-tier: the queue entry carries the sentence, the count, and the band, so the reviewer decides in seconds.

Tier C consumers: a human on small documents; on large sweeps, the lane4 pattern (independent verifiers, distinct lenses, two-of-three to survive) is the proven ADM-182-compliant harness. The linter itself never auto-fixes and never renders a keep-or-kill verdict on a C-tier item.

**Output.** Human-readable report (per-file table plus corpus dashboard plus the C-tier queue) and `--json` for tooling. Exit code: nonzero only on Tier A hits or `--strict` band violations, so a ship gate can choose its severity.

**The catalog mirror.** `prose-lint` reads `rules.json`, regenerated from the style guide's watchlist table plus a hand-maintained regex block per numbered rule (regexes cannot be derived from prose; they are code reviewed against the canon line they implement, each carrying the rule number it enforces). A mirror rule without a canon citation fails the linter's own self-test.

**Regression tests (formalizing what the deck lane left informal).** A fixtures file with two lists: known-bad exemplars (every Tic line from the style guide's own rules, the three lane4 known-bad headings, the FT and Economist construction examples) and known-good exemplars (every Fix line from the guide, the rule 3 load-bearing examples, the gated parity sentence, citation triplets, quoted-material cases). The test asserts every known-bad fires the named detector and every known-good fires nothing. The deck lane pinned its regexes by prose in a run report; here the exemplars are executable, so a regex edit that un-catches the guide's own textbook example goes red immediately. Add-a-rule discipline: a new watchlist row lands with its fixture pair in the same commit.

**Register bands, v0 (from the prototype calibration, section 5; all per 1,000 words unless noted):**

| Metric | Expository (clogs-calibrated) | Technical reference (guide-calibrated) | Notes |
|---|---|---|---|
| Rule of three | warn above ~3.0 | warn above ~2.0 | good exemplar runs 1.96 |
| Semicolons | warn above ~4 | warn above ~2 | clogs runs 3.55, all earned |
| Sentence CV (per file) | warn below 0.65 | warn below 0.55 | clogs 0.876; swept-but-flat course modules 0.66 to 0.71 |
| Short-sentence share | warn below 10% | warn below 8% | punch interruption floor |
| Long words (8+ letters) | warn above ~22% | warn above ~28% | guide register legitimately runs 25%+ |
| Nominalisations | warn above ~45 | warn above ~65 | clogs 31, guide 58 |

These are starter bands to be re-derived once the linter exists and can sweep more house corpora; the point of record is that bands come from measured house exemplars, not from taste or from published norms (which do not exist for edited nonfiction; research doc 3.4).

## 4. Piece 3: the verification workflow standard

**Home:** `lte-workbench/docs/verification-standard.md`, drafted from the Clearing the Clogs artifacts; the project-level `skills/verification-ledger` skill graduates to a workspace skill beside it (its own header already marks it "candidate to generalize"). QCraft and future repos get one line in their ship gates: released educational and public material passes the verification standard. This is the same delegation shape as the learning standard's G10.

**Scope trigger.** Binds released educational material and public artifacts (the course, guides, consultation responses, site copy with factual claims, decks that leave the building). Does not bind working notes, internal drafts, or Linear traffic. The standard is a release gate, not a drafting gate.

**The contract (all proven in the June/July run, none of it new):**

1. **Claim inventory before verification.** Every checkable claim (number, citation, document pin, formula or cell reference, behavior claim, data-source claim) gets a row and a tier: Tier 1 "wrong here and the argument or our credibility takes a direct hit," Tier 2 supports a beat, Tier 3 illustrative.
2. **Source pinning.** A pin names the source file or URL and, for paginated sources, BOTH the printed folio and the PDF index ("a pin missing either number is not done"), plus a character-exact verbatim quote ("verbatim or not quoted"). Spreadsheet claims pin the cell and the reproduction rig. Docpacks are the substrate: page-addressable packs make extraction workers grep instead of re-reading PDFs.
3. **Freeze before verify.** No verifying lines that can still change. Text freeze is a commit; verification runs against frozen bytes.
4. **Independent extraction.** Fresh-context workers, one source each, no prior verdicts visible, fixed verdict vocabulary (SUPPORTS / SUPPORTS-WITH-EDIT / DOES-NOT-SUPPORT / UNRESOLVED). Mismatches surface loudly and are never silently corrected.
5. **The human pass is confirmation, not discovery.** The walkthrough pack fronts the flags, groups one-open-per-document, carries the Ctrl-F string, and budgets about 90 minutes per citation plane. Only Teal sets TEAL-VERIFIED.
6. **The ledger ships with the artifact's record**, and every run appends its stats to the receipts file (section 6): claims by tier, confirmations, catches, minutes spent.

**What generalizing adds beyond the June run:** the standard names the scope trigger (so nothing "small" skips it silently); it sets the default staffing (extraction fan-out plus one fresh-context QA sampler, both proven); and it defines the degraded mode: when a deadline forces a partial pass, the artifact's record states which tiers were verified and which were not, because an unverified Tier 3 flourish is survivable and an unverified Tier 1 number is not.

## 5. Prototype evidence

Method: a ~330-line stdlib Python prototype (`prose_lint_proto.py`, committed at `docs/writing-qa-assets/`; the spec above is its cleaned-up generalization) ran the Tier A/B detectors over four house corpora on 2026-08-30. Corpora: the current course (lane4 at commit 283e9a3, 11 files, ~29.6k prose words), the shipped companion guide (main at 67d26b6, ~6.4k), the guide's first draft (commit 8cc6ea0, March 2026, before the em-dash sweep, ~6.3k), and the Clearing the Clogs final text (`_master.md` at ship commit 9a33d13, ~8.2k), which serves as the calibration exemplar: heavily AI-assisted, fully Teal-voiced, page-pin verified, publicly shipped.

### 5.1 What separates cleanly

| Metric | course-current | guide-current | guide-first-draft | clogs-final |
|---|---|---|---|---|
| Words (prose) | 29,612 | 6,406 | 6,347 | 8,161 |
| Sentence mean | 16.2 | 14.7 | 15.1 | 20.5 |
| Sentence SD | 11.5 | 10.7 | 11.2 | 18.0 |
| Sentence CV | 0.713 | 0.727 | 0.743 | **0.876** |
| Short sentences (≤8w) | 26.2% | 28.3% | 26.6% | 15.8% |
| Long sentences (≥30w) | 9.8% | 5.7% | 6.7% | 15.6% |
| MATTR-400 | 0.522 | 0.562 | 0.565 | **0.568** |
| Long words (8+) | 16.1% | 25.5% | 26.2% | 17.4% |
| Nominalisations /1k | 39.8 | 57.8 | 58.6 | **31.5** |
| Commas /1k | 52.8 | 53.7 | 52.3 | **69.1** |
| Parentheses /1k | 6.5 | 20.8 | 19.1 | 9.8 |
| Em-dashes (raw) | 0 | 0 | **95** | 0 |
| Rule of three /1k (citation-exempt) | 0.69 | 0.99 | 1.00 | **1.96** |

Readings:

1. **The em-dash sweep worked and is visible at a glance:** 95 occurrences (15/1k) in the first draft, zero after. The single most mechanical tell is already governed.
2. **Sweeps remove tells; they do not produce voice.** The swept course sits at nearly the same sentence CV as the unswept first draft (0.713 vs 0.743). The dimension where Teal's polished exemplar stands apart (CV 0.876, long-and-short mix, highest lexical variety, lowest nominalisation) is untouched by tic removal. Slop absence and voice presence are different axes, which is why the linter reports shape statistics instead of pretending a clean tic sweep means good prose.
3. **The dose doctrine, measured:** the good exemplar carries nearly three times the course's rule-of-three dose (1.96 vs 0.69 per 1,000 words) and the house's highest semicolon rate (3.55/1k), every one earned. Any single-use ban would flag Teal's best shipped prose as slop. Bans calibrated at zero are wrong; bands calibrated above the exemplar are right.
4. **Register moves the vocabulary metrics.** The reference guide legitimately runs 25% long words and 58/1k nominalisations against the narrative exemplar's 17% and 31. One universal threshold would either drown the guide in warnings or miss real drift in narrative prose. Bands must be per-register.
5. **Weak or inverted separators worth keeping only as dashboard context:** "and"-rate (the Economist's top tell) is highest in the good exemplar (34.9/1k); repeated-opener rate is highest there too (11.3 per 100 sentences), driven by deliberate anaphora. Both would misfire as defect signals against this house's voice.

### 5.2 Per-module resolution finds real targets

Sentence-shape stats per course module separate the flat from the alive: m2 (CV 0.662) and m3 (0.672) are the most uniform, m6-capstone (0.868) matches the human exemplar. The full table and the keep-or-fix slop table are in the audit document.

### 5.3 False-positive classes, demonstrated on real text

Every exclusion in the spec's preprocessing stage came from a real hit in this run: (a) quoted source text (the IMF review's own "leveraging communications" and "comprehensive, transparent, and easy to use" fired vocabulary and rule-of-three counters inside quotes); (b) citation author lists ("Powell, Baker and Lawson"; "Centorrino, Massetti, and Tagklis") firing rule-of-three; (c) literal usage ("unlock the grants that lower it"); (d) load-bearing contrast ("not real judgment but undocumented convention," exactly rule 3's documented exception); (e) factual participle clauses ("made with finance ministries") matching the tagline shape outside a title. Position (heading vs prose) and span class (quoted vs authorial) are therefore first-class inputs, not refinements.

### 5.4 The dogfood check

This lane's own research document, scanned naively, lights up 12 banned-vocabulary and 19 watchlist hits; every one is a tell being NAMED as data, plus quoted "not X but Y" constructions inside citations. A linter without quoted-span classification cannot audit any document about writing, including the style guide itself, whose Tic exemplar lines are deliberate specimens. The regression fixtures encode this permanently.

### 5.5 Limitations

The sentence splitter is regex-grade (abbreviation noise of a few percent); MATTR-400 is the only length-robust diversity stat run; corpora are small (6k to 30k words) so band edges are provisional; and the four corpora differ in genre as well as provenance, so cross-corpus deltas mix register with authorship. None of this affects the direction of the findings; all of it is why bands ship as warnings, not gates, until more house corpora are swept.

## 6. Receipts for the future public piece

Teal intends a future piece, in his own voice, on responsible AI-assisted writing. This lane's job is to collect what that piece can draw on, not to write any of it. On hand as of 2026-08-30:

**Verification receipts (the first pillar).**
- The Clearing the Clogs run: ~55 checkable claims inventoried and tiered; dual page pins plus character-exact quotes as the contract; 20 claims confirmed and 5 escalated in one overnight autonomous pass; two DOES-NOT-SUPPORT catches before ship; the supervised human pass budgeted at ~90 minutes because "Teal's pass is confirmation, not discovery"; page pins measured as the top failure mode (multiple first-pass pins wrong and re-extracted).
- The QCraft battery as the numeric sibling: 5,114,279 cells cross-verified between independent engines at 4.4e-16; refusals compared as refusals; the CC-6 finding that a silently wrong Serbia chart shipped and was caught by systematic verification, not by a reader.
- This lane's claim-pinning audit of the course (audit doc): per-module counts of claims that trace to a source on disk, a test, or nothing.

**Slop-discipline receipts (the second pillar).**
- The style guide itself: 12 rules, each with a dated provenance line naming the review where a human caught the machine, a two-strike evidence bar, and register-specific capture. A system that learns from every correction is the story.
- The before/after numbers above: 95 em-dashes to zero between guide drafts; the swept course's zero-tic state alongside its flat sentence CV (proof the discipline is real and proof it is not cosmetic-only).
- The dose exhibit: Teal's best shipped prose carries MORE rule-of-three than the AI-drafted course. Device vs dose, in one table.
- The lane4 heading sweep: 113 agents, three lenses, two-of-three to survive, and nine findings correctly killed as false positives.

**Double-standard receipts (the framing).**
- The FT's Nazir case end to end (accusation by screenshot, standard literary devices read as tells, vindication, publication pulled anyway) and the Williams quote: "If these were human errors, would the accusations be as loud?"
- The detector record: OpenAI's 9-percent-false-positive shutdown; 61 percent false-positive rate on non-native writers; the Constitution flagged as AI; universities declining to use detectors on students.
- The stigma dynamic the FT documents: firms hiding AI use because disclosure without receipts reads as lower quality; against it, the open practitioners (Mollick's "I verified x and y; z I could not check" formula, Willison's bright line, Harbath's published pipeline) whose disclosure leads with process.
- The self-driving-car frame Teal already uses has a published cousin in Mollick's "K-T boundary" line and Tian's "decision that isn't up to tech companies. It's social."

**Where receipts accumulate going forward (recommendation, no write this lane):** one file, `lte-workbench/docs/receipts-ai-writing.md`, appended by any lane that generates a stat, a before/after, or a case; the verification standard makes appending a standard output of every run (section 4, contract item 6). When Teal sits down to write, the raw material is one file, dated and sourced.

## 7. What lands where, in what order

| Step | What | Where | Gate |
|---|---|---|---|
| 1 | Model-watchlist section + update protocol | style-guide-writing-AI.md | Teal redlines the section text (taste call on wording; content is this doc's section 2) |
| 2 | prose-lint v0: Tier A + B counters, fixtures, bands v0 | lte-workbench/scripts/prose-lint/ | Regression fixtures green; dogfood run over this PR's three docs |
| 3 | Writing-skill self-check gains the lint call | skills/writing/SKILL.md | One-line change after step 2 exists |
| 4 | verification-standard.md drafted from the ledger skill + docpacks | lte-workbench/docs/ | Teal redlines; ledger skill graduates alongside |
| 5 | Receipts file seeded from section 6 | lte-workbench/docs/receipts-ai-writing.md | Mechanical copy, any lane |
| 6 | QCraft adopts: lint call beside the course render gate; verification line in the next course touch's gate list | QCraft-App | Rides the next course touch; nothing retroactive |

Steps 1, 2, 4 are the substance; each is a half-day lane. Nothing above requires touching shipped material until step 6, which rides work already planned.
