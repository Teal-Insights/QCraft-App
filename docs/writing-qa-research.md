# AI-era writing quality: the research (CC-19, phase 1)

**Lane contract.** Research and recommendation only. Nothing in this lane changes the course, the style guides, or any shipped material. Trail: TEA-948. Deliverables: this document, `writing-qa-plan.md` (architecture + linter spec + verification workflow + prototype evidence), and `writing-qa-audit-2026-08.md`.

**The thesis this work serves.** Teal uses AI heavily for writing and is open about it. That openness is earned by two pillars: systematic verification, so nothing incorrect or hallucinated ever ships, and prose free of AI slop, because readers are turned off by clear AI constructions. The double standard is real: human errors are forgiven, one AI tell is a headline. The central nuance, which the evidence below supports repeatedly: many tells are good techniques over-indexed. Dose is the crime, never the device, so detection must be frequency-based, not single-use bans. Each model generation mints new slop, so the catalog must be a living instrument with an update protocol, not a one-time list.

**In this document.**

1. The two press pieces, mined tell by tell, with attribution
2. The house inventory: what already exists and how each piece works
3. Fresh research with citations: catalogs, detection economics, open workflows, mechanical metrics
4. Synthesis: what the combined evidence supports

---

## 1. The two press pieces

### 1.1 The Economist, "How to spot AI writing" (Culture, Paper trails, July 30 2026)

Method: The Economist prompted four top LLMs (ChatGPT-5.6 Terra, Claude Sonnet 5, Gemini 3.5 Flash, Grok 4.5) to write versions of its own articles, then compared 55,940 sentences and 1.2m words against its own prose, journalism from CNN, the New York Times and the Washington Post (2018-2022), and excerpts from bestseller-list novels (1950-2022).

Tells the piece names, with its own caveats:

| # | Tell | What the study found | Status |
|---|------|---------------------|--------|
| E1 | Long words (8+ letters) | All four models sit well above The Economist, other news, and fiction | Live |
| E2 | Polysyllable filler: "significant", "increasingly", "consequences" | Named as the replacement for the stale word tells | Live |
| E3 | Rare words: "interdependence", "reindustrialisation" | More frequent than in human baselines | Live |
| E4 | Scientific lingo: "parameter", "methodology" | Above human baselines; worst in Gemini and Claude | Live |
| E5 | Nominalisations ("expansion" from "expand") | Above human baselines; Orwell's "pretentious diction"; more Latinate suffixes than human text | Live |
| E6 | Em-dashes | **Stale as a universal tell.** After recent updates only Claude uses more em-dashes than human writers; ChatGPT uses markedly fewer than any writer in the study, after peaking around 2025 | Model-specific |
| E7 | Sparse other punctuation | Fewer commas and semicolons than humans, hardly any parentheses | Live, direction-reversed from folk belief |
| E8 | Long sentences, few short punchy interruptions | Bots' sentences tend to be long; paragraphs rarely interrupted | Live |
| E9 | "and" as most overused word | Named as the single most overused word | Live but weak (see prototype: Teal's own polished prose is "and"-heavy) |
| E10 | No expert quotes | AI versions do not quote experts | Live for journalism registers |
| E11 | "not X but Y" | All four models above every human baseline | Live |
| E12 | "not only... but also" | Named among favourite rhetorical devices | Live |
| E13 | Rule of three | ChatGPT highest, all models above The Economist; ChatGPT and Claude use the most such devices per 1,000 sentences | Live |
| E14 | "delve", "tapestries" | **Explicitly retired**: "they no longer 'delve' and there are not as many 'tapestries'" | Stale |

Meta-findings that matter more than any single tell:

- **Tells age with releases.** The study's own charts show "use of typical AI language" falling from 2024 to 2026 while sentence-length variation rises toward human levels. "Its writing style has changed with software updates."
- **Single-word evidence is weak.** "Claiming that a text is by an LLM because it uses the word 'delve' is like claiming one is by Jane Austen because it uses 'imprudence'."
- **There is no single AI style.** Karolina Rudnicka (University of Gdansk): models differ from each other; humans have the same idiosyncrasies (Emily Dickinson loved em-dashes).
- **Convergence is the trajectory.** "With every update, our study shows, AI writing is becoming more similar to human prose." Tommie Juzek (Florida State University): models learn from human feedback, "picking up things people find impressive and dropping things they do not."
- **Detectors are black boxes.** Pangram claims 99.98% accuracy; detectors "can give false positives. They do not give reasons."

### 1.2 Financial Times, Elaine Moore, "Did AI write this? It's getting harder to tell" (August 29 2026)

The FT piece is about detection sociology and false-positive economics more than tells, which makes it the richer source for the verification and openness pillars.

Tells it names or quotes others naming:

| # | Tell | Source in piece |
|---|------|-----------------|
| F1 | Rule of three (X, Y and Z) | FT graphic "Features of text written by AI"; also the Nazir case ("the quiet chores, the patient hands, the unlit lamp") |
| F2 | Em-dashes followed by a list | FT graphic |
| F3 | "Can X but can't Y" formulation | FT graphic |
| F4 | The word "deeper" | FT graphic |
| F5 | "not x but y" | Commentators on the Nazir story ("Not the bees' neat industry . . . but a belly sound") |
| F6 | Nonsensical metaphor | Nazir case ("she had the kind of walking that made benches become men"); the accused author defends it as mysticism |
| F7 | Lexical fingerprints in fiction: "hum" | Tuhin Chakrabarty (Stony Brook): six instances of "hum", "something he says ChatGPT is known to use in fiction" |
| F8 | Smoothly pleasant tone, hallucinations, em dashes | Named as "the classic signifiers" that experts have moved past |
| F9 | Information density as the deeper signal | Max Spero (Pangram): "When a person writes, every word has intention behind it. When AI generates text, it does not." |

Detection landscape facts:

- Named detectors: Pangram, GPTZero, Winston AI, Copyleaks; subscriptions to $74.99/month; scores without reasons; training sets undisclosed.
- Pangram's method: millions of pre-ChatGPT human texts paired with "synthetic mirror" AI texts; retrained as new models appear; a year of work specifically on AI-assisted versus fully AI text. Ranked top in a Vrije Universiteit Brussel reliability study.
- DNA-GPT (UC Santa Barbara): chop a text in half, have AI continue it, compare endings ("Divergent N-Gram Analysis").
- GPTZero (Edward Tian): classifier over token-level numerical representations, "not only in word choice but word placement, frequency, sentences and paragraphs"; used to find AI hallucinations in EY and PwC reports.

False-positive economics:

- OpenAI removed its own detector in 2023 after a 9 per cent false-positive rate.
- A 2024 user claim: a detector scored the Declaration of Independence 98 per cent AI.
- A widely reported Stanford study: non-native English writers are more likely to be wrongly flagged, plausibly because of "more limited linguistic variability and word choices."
- Brian Jabarian (Carnegie Mellon): fed ~2,000 human samples plus AI equivalents into Pangram, OriginalityAI and GPTZero at varying evidence thresholds; lowering the threshold catches more AI at the cost of more false accusations. "That's a decision that isn't up to tech companies. It's social."
- Pangram claims a 0.0041 per cent false-positive rate, roughly 1 in 24,000 documents. At publishing-platform scale that is still a steady stream of false accusations.
- Oxford, Cambridge and Harvard support student use of generative AI and do not endorse commercial detectors on student work.

The double standard, documented:

- The Nazir case end to end: an anonymous X screenshot of a 100 per cent Pangram score, a pile-on ("I could tell it was GPT in about 5 seconds"), commentators reading standard literary devices as AI giveaways, the Commonwealth Foundation investigating and standing behind the author, and Granta declining to publish the winning stories anyway because "there is really no way of determining whether a piece is authentic or not" (Sigrid Rausing).
- The Shy Girl scandal: a novel removed from bookstores over AI claims the author denies.
- Ashley Williams (Mishcon de Reya), on AI errors at KPMG, EY, PwC and Deloitte: "If these were human errors, would the accusations be as loud?"
- An unnamed consultant: clients treat AI-generated reports as intrinsically lower quality; "there is a stigma that AI-generated text carries less weight," so firms hide their use instead of describing their review process.

Openness and watermark landscape:

- Granta's Rausing: "If a writer creates an experimental text with AI material and is transparent about it, I would be happy to read it and publish it, if it's good."
- The FT's own editorial code: generative AI tools "must not be used to write an article or article text for publication."
- The EU plans AI-text watermarks at the end of 2026; Anthropic says new Claude models will carry imperceptible marks; editing, paraphrasing and copying can erase them, and absence of a watermark proves nothing.
- Ethan Mollick: no detector or watermark is foolproof; authenticity is now negotiated, "we're still in the middle of negotiating what parts of writing we want to keep human."
- Edward Tian: "Writing is more than just output. It reflects our critical thinking."

### 1.3 What the two pieces establish jointly

1. **The frequency doctrine is now the published consensus.** Both pieces reject single-token accusation and describe detection as pattern-and-dose analysis. This is Teal's existing position, independently confirmed by the two most mainstream treatments to date.
2. **The catalog decays.** The Economist retired "delve" and "tapestry" in print and flipped the em-dash tell to model-specific. Any house catalog must carry dates, evidence, and a retirement path.
3. **Construction tells outlive word tells.** The word list churned between 2024 and 2026; the construction list (rule of three, not-X-but-Y, uniform long sentences) survived and is what both pieces still trust.
4. **False positives are the catastrophic failure mode**, socially and reputationally. The design bar for any house linter: near-zero false accusations against Teal's own polished prose, with anything judgment-shaped escalated to a human rather than auto-flagged as slop.
5. **The openness position needs receipts, not assertions.** The institutions that come off well in the FT piece are the ones with a documented process. That is the verification-ledger pillar.

---

## 2. The house inventory

Seven assets already exist. Together they cover most of what a writing-QA system needs; what is missing is one reusable mechanical layer and one homed verification standard. Canonical paths are given per asset.

### 2.1 The AI style guide (the catalog's natural home)

`lte-workbench/context/style-guide-writing-AI.md`. Twelve numbered banned tics, each with a Tic/Fix pair and, for every rule added after the initial set, a dated provenance line naming the review where Teal caught it ("Teal, 2026-08-26, QCraft course review"). An unnumbered "Other tics to avoid" list carries the word-level bans (delve, leverage as a verb, robust, seamless, elevate, unlock, the throat-clearers). A separate "Note design" section carries the me-centered document rules (names, acronyms, skim path, diagrams, YAML hygiene).

Three facts matter for the architecture decision:

- **The capture loop is already defined and evidenced.** "This list grows from real friction: when Teal fixes the same tic twice, add it here." Two-strike evidence bar, dated attribution, Tic/Fix pair. The register split routes audience-specific patterns to `context/registers/*.md` and only cross-cutting tics to the guide.
- **The guide already contains model-generation slop.** Rules 6, 10, 11, and 12 are current-model favorites caught in July and August 2026 reviews. Rule 3 shows in-place amendment: a load-bearing exception added in June, a headings-outright tightening added in August.
- **There is no retirement protocol.** Rules only grow or gain exception clauses. Nothing distinguishes a durable shape ban from a vocabulary fashion that will decay with the next model generation. That is the gap the model watchlist fills.

### 2.2 The voice guide and registers

`context/style-guide-writing-me.md` is the additive twin: what makes a draft sound like Teal, grown from dated before/after captures of specific rewrites. `context/registers/` holds one file per audience; the writing skill loads exactly one register per draft. Division of labor: the AI guide subtracts machine tells, the voice guide adds Teal, the register calibrates to the reader.

### 2.3 The Cleary/Buchheit guide and rubric

Drive `03-RESOURCES/LLM-Context/2026-06-24_Guide_Persuasive-Writing-Cleary-Buchheit.md` and the companion rubric. The guide's Part 4 house-override layer already states the dose doctrine in canon: em-dashes and negative parallelism are "AI failure modes at dosage, not bad craft," and the em-dash zero rule is "an anti-AI-failure-mode guard, not a craft disagreement." The rubric is two-layer: eight binary gates (G1 factual accuracy through G8 AI tics absent) where any single gate failure caps the verdict at revise required, then 24 scored criteria in six weighted categories totalling /70, with the grading discipline "point to the line." The 2026-06-24 Writing System Index maps the three pillars (Write, Show, Verify) onto one shared foundation and names the claim-burden wire: "Concision and verifiability are the same discipline seen from two sides."

### 2.4 The writing and writing-advisor skills

`~/.claude/skills/writing/SKILL.md` runs the register routing and a four-item pre-presentation self-check (banned tics, register checklist, voice, context ladder). Its improvement plan already anticipates this lane's deliverable: the self-check "may someday earn a scripted linter (`scripts/` engine) instead of a reread." `~/.claude/skills/writing-advisor/SKILL.md` owns the upstream questions (job, stakeholders, one ask per piece, syllogism) and grades drafts against the rubric, gate failures first.

### 2.5 The deck lane's shape detector (the mechanical seed)

`~/candidates/qcraft-sprint-2026-08-26/lane5-deck/qa_sweep.py` plus `build_deck.py`. The origin story is the design argument: a banned-substring sweep passed a deck carrying rule 3's own textbook example four runs running, because "Rules 3, 9, 10, 11 and 12 are all SHAPE rules. A word list cannot see them." The precedent's five load-bearing ideas:

1. **Role-tagged copy via a build-time side channel.** The builder records eyebrows, titles, takeaways, and subtitles into `build/display-copy.json` at the point each is placed, because the built artifact does not say which text frame is a heading. The sweep hard-fails if the JSON is missing, so it cannot run against stale copy.
2. **Shape rules as named regexes, scoped by role.** Eight hard-fail heading patterns encode rules 3, 10, and 11 (five negative-parallelism forms including the reveal shape, the participle tagline, two appended-judgment tails). Heading scoping matters because rule 3 is banned outright in headings but conditionally allowed in prose.
3. **A review lane where mechanics cannot decide.** Rule 12 gets one broad pattern that surfaces candidates "for a human read rather than failing them," with the code comment: "Rule 12 cannot be decided mechanically: a legitimate 'and' joins two different facts."
4. **Named carve-outs.** The semicolon report exempts three literal frozen strings (gated wording), so governed copy never generates noise.
5. **Regression pinning, informal.** The three known-bad headings, the guide's own exemplar included, were fed through the detectors and the catch recorded per detector in the run report. The exemplars live in the report, not in an executable test suite; that is the piece to formalize.

A sibling precedent in lane4 (course run 9) ran the heading sweep at scale: 113 agents, every finding checked by three independent verifiers on separate lenses, two-of-three votes to survive. Nine findings died exactly at the false-positive boundary the style guide draws: headings that "merely joined two different facts with 'and', or stated a real comparative, which is not the tic."

### 2.6 The learning standard (the standard-shape template)

`QCraft-App-cc17/docs/learning-standard-draft.md` (PR #76, awaiting Teal). Already the second instantiation of a reusable template (the HCD standard is the first). The shape: binding-canon citations plus auditor tests only ("Where those documents state a rule, this file points at it and adds only the auditor test"), ten binary gates that cap the verdict, scored criteria with one-line auditor tests, a seeded-empty "captured from real use" section with a two-recurrence graduation rule, adversarially verified external sources with pinned editions, and a promotion path to lte-workbench after review. Its G10 delegates prose quality entirely: "the writing rubric owns prose quality; this standard only refuses to ship learning material that fails it." A writing-QA standard should reuse this shape and this delegation discipline.

### 2.7 The Clearing the Clogs verification discipline (the workflow to generalize)

Drive `01-PROJECTS/_Professional/2026-06_LIC-DSF-Consultation-Response/`. The founding rule from the project CLAUDE.md: "The response must cite the institutions' own reports, with every key claim page-pinned and personally verifiable." The proven pattern:

- **The ledger.** `05-Source-Library/Verification-Ledger.md`, 88 entries. Non-negotiable contract: source file or URL, BOTH printed page and PDF index ("A pin missing either number is not done"), and a verbatim quote copied character for character so the reader can Ctrl-F it ("The verbatim column is sacred"). Status ladder SOURCE TO DOWNLOAD, SOURCE IN LIBRARY, AI-VERIFIED vs source, TEAL-VERIFIED (only Teal sets it), with side states MISMATCH, ILLUSTRATIVE, NEEDS PRIMARY SOURCE, RETIRED, RESERVE. Meaning-match verdicts use a fixed vocabulary (SUPPORTS / SUPPORTS-WITH-EDIT / DOES-NOT-SUPPORT / UNRESOLVED).
- **The claims-to-ledger map.** One row per citable claim: section, footnote label, ledger ID, status, confidence, and a value tier (Tier 1: "wrong here and the argument or our credibility takes a direct hit"; Tier 2 supports a beat; Tier 3 illustrative).
- **The workflow.** Eleven stages from sourcing plan to ship, with the load-bearing sequencing rule: text freeze before verification ("no verifying lines that can still change"), then an autonomous AI wave (20 fresh-context workers, one source each, independence enforced: "workers saw only the paper's sentences + their one file, no prior verdicts or page pins"), then the supervised TEAL-VERIFY walkthrough, budgeted at about 90 minutes for the whole citation plane because "Teal's pass is confirmation, not discovery."
- **The stats (receipts for the future piece).** About 55 discrete checkable claims mapped and tiered; 20 confirmed and 5 escalated in one overnight pass; two DOES-NOT-SUPPORT verdicts caught before ship; page pins were empirically the number one failure mode.
- **The generalization intent is on record.** The project-level skill (`skills/verification-ledger/SKILL.md`, v0.1.0) marks itself "candidate to generalize to a workspace skill," and `lte-workbench/docs/docpacks.md` already generalized the substrate: page-addressable packs, dual-pin citation format, "Verbatim or not quoted," and ledger extraction workers grepping `pages/` instead of opening PDFs (proven 4/5 pins in 0.03s).

### 2.8 The ADM-182 lesson (the judge discipline)

`lte-workbench/docs/specs/2026-08-11-adm-182-model-bakeoff.md` plus the run record in `~/Dropbox/bakeoff-runs-2026-08/`. What happened: a blind LLM judge, re-run twice on a byte-identical packet, returned three different rankings; one memo occupied first, second, and third place across the three samples. Quantified: "Run-to-run noise exceeds the between-memo differences by 3.4x on (e) voice and 1.7x on (f) restraint." The mechanical legs of the same harness (tool-trail diffs, footer diffs) stayed sound, and Teal's blind read proved "the round's most reproducible instrument." The judge also scored a harness defect as a model defect (raw JSON wrapping docked as bad voice); Teal blind-discounted the same artifact at source. Operational rules this lane inherits: mechanical cores wherever possible; any LLM judgment that gates anything needs convergence across independent samples; binary gates over composite scores; and a judge with a seat in the game cannot be trusted ("Self-preference and correct judgment are indistinguishable on this evidence").

---

## 3. Fresh research with citations

Four research sweeps, run 2026-08-30. Full agent reports with complete findings lists are archived in the session workflow transcript; the load-bearing results follow, with sources inline.

### 3.1 Published tell catalogs, and how they age

**The Wikipedia catalog is the reference standard.** [Wikipedia:Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing), maintained by [WikiProject AI Cleanup](https://en.wikipedia.org/wiki/Wikipedia:WikiProject_AI_Cleanup) (founded 2023), groups tells into content signs (inflated significance: "stands as a testament", "pivotal role", "evolving landscape"; superficial present-participle analysis: "highlighting...", "showcasing..."; promotional language: "boasts a", "vibrant", "nestled"; weasel attributions; formulaic "Despite these challenges" conclusions), language signs (era-versioned vocabulary lists, avoidance of plain "is" and "has" in favor of "serves as" and "stands as", negative parallelisms, the rule of three), style signs (em dashes, boldface overuse, emoji headers), and markup or citation signs (vendor artifacts like ChatGPT's "oaicite", fabricated DOIs, dead links). [TechCrunch called it the best available guide](https://techcrunch.com/2025/11/20/the-best-guide-to-spotting-ai-writing-comes-from-wikipedia/) (Nov 2025) precisely because it retreated from word lists.

**The catalog is explicitly era-versioned, which is the design feature to copy.** Wikipedia's word lists are dated by generation: 2023 to mid-2024 (delve, tapestry, testament, boasts, intricate, meticulous, underscore, vibrant, garner, pivotal), mid-2024 to mid-2025 (align with, fostering, showcasing, highlighting, crucial, enhance), and mid-2025 onward (a much smaller list: emphasizing, enhance, highlighting, showcasing). A "historical signs" section holds retired tells. The essay warns that single tells are coincidental, clusters are indicative, and models differ from one another.

**The corpus studies quantify the tells and their decay.** [Liang et al. (ICML 2024)](https://arxiv.org/abs/2403.07183): "commendable" up 9.8x, "meticulous" up 34.7x, "intricate" up 11.2x in ICLR 2024 peer reviews, with 6.5 to 16.9 percent of review text estimated LLM-modified. [Kobak et al. (Science Advances 2025)](https://www.science.org/doi/10.1126/sciadv.adt3813): excess-vocabulary analysis over 15 million PubMed abstracts found 319 excess style words in 2024 ("delves" up about 28x, "underscores" 10.9x), estimating at least 13.5 percent of 2024 biomedical abstracts were LLM-processed. On decay: [Geng and Trotta](https://arxiv.org/abs/2502.09606) measured "delve" dropping in arXiv abstracts from early 2024 while less notorious LLM-favored words like "significant" kept climbing, concluding that human-LLM "coevolution" makes word-frequency detection progressively harder. On mechanism: [Juzek and Ward (COLING 2025)](https://aclanthology.org/2025.coling-main.426/) tie lexical overrepresentation to preference alignment (RLHF), matching the Economist's account.

**Publicity is itself a decay mechanism.** Paul Graham's viral 2024 "delve" complaint made the marker common knowledge; writers and vendors both adapted. The em-dash arc completed the cycle: [Rolling Stone documented](https://www.rollingstone.com/culture/culture-features/chatgpt-hypen-em-dash-ai-writing-1235314945/) writers being accused of being bots for using em-dashes and abandoning the mark defensively, and OpenAI [patched ChatGPT's em-dash behavior in November 2025](https://www.pcworld.com/article/2977726/openai-has-fixed-chatgpts-infamous-em-dash-obsession.html). A tell catalog is a dated snapshot with a decay curve.

**Newsroom heuristics confirm the shape-over-word shift.** [Press Gazette's roundup](https://pressgazette.co.uk/publishers/digital-journalism/how-to-spot-ai-written-copy/) (Sept 2025) collects working editors' tells: "flipped the script", "They're not just... they're", three or more consecutive paragraphs of identical length, abstract nouns over concrete ones, equivocal hedging. [Poynter counsels](https://www.poynter.org/commentary/2026/ai-writing-scandals-hard-to-prove-stephen-colbert-last-show/) that tell-based accusations are proliferating faster than they can be proven.

### 3.2 Detection approaches and false-positive economics

**The three technical families share one failure direction.** Classifier detectors (GPTZero, Turnitin, Originality.ai, Copyleaks), perplexity and curvature methods ([DetectGPT, ICML 2023](https://arxiv.org/abs/2301.11305)), and watermarking ([Kirchenbauer et al., ICML 2023](https://arxiv.org/abs/2301.10226); [Google SynthID-Text, Nature 2024](https://www.nature.com/articles/s41586-024-08025-4)) all fail toward false positives at deployment scale against a mostly innocent population.

**The measured record versus the marketing.** OpenAI's own classifier caught [26 percent of AI text while flagging 9 percent of human text](https://openai.com/index/new-ai-classifier-for-indicating-ai-written-text/) and was shut down in July 2023. The largest peer-reviewed evaluation ([Weber-Wulff et al. 2023](https://edintegrity.biomedcentral.com/articles/10.1007/s40979-023-00146-z), 14 tools) concluded detectors are "neither accurate nor reliable," every tool under 80 percent accuracy, with light paraphrasing degrading detection further. Turnitin claims under 1 percent document-level false positives but [concedes about 4 percent at sentence level](https://www.turnitin.com/blog/understanding-the-false-positive-rate-for-sentences-of-our-ai-writing-detection-capability) and acknowledges more false positives in the wild than in the lab. [GPTZero's own FAQ](https://gptzero.me/faq) says results "should not be used to punish students." [Sadasivan et al.](https://arxiv.org/abs/2303.11156) showed recursive paraphrasing collapses watermark detection (true-positive rate at 1 percent FPR fell from 99.8 to 9.7 percent) and proved that as model output distributions approach human text, the best possible detector converges toward a coin flip.

**Who the false positives land on.** [Liang et al. 2023 (Patterns)](https://www.sciencedirect.com/science/article/pii/S2666389923001307): seven detectors misclassified TOEFL essays by non-native English speakers as AI at an average 61 percent rate, 97.8 percent flagged by at least one detector, while near-perfect on native-speaker essays. The mechanism is the perplexity logic itself: low-variance prose looks machine-made, so non-native writers, neurodivergent students, and formal stylists get flagged. Documented harms: the [Texas A&M-Commerce grade-withholding incident](https://www.washingtonpost.com/technology/2023/05/18/texas-professor-threatened-fail-class-chatgpt-cheating/), the [UC Davis student cleared only by Google Docs revision history](https://www.yahoo.com/news/professors-using-chatgpt-detector-tools-093105927.html), and the Washington Post now publishing [advice on proving your innocence](https://www.washingtonpost.com/technology/2023/08/14/prove-false-positive-ai-detection-turnitin-gptzero/), which is itself evidence the burden of proof has inverted. Formulaic human genres trip detectors too: [the US Constitution scores as AI-written](https://arstechnica.com/information-technology/2023/07/why-ai-detectors-think-the-us-constitution-was-written-by-ai/).

**The base-rate arithmetic.** Even a truthful 1 percent false-positive rate produces a steady stream of false accusations at scale; Pangram's claimed 0.0041 percent still accuses roughly one innocent document in 24,000 (FT, section 1.2). Jabarian's threshold research makes the tradeoff explicit and concludes the acceptable-risk decision "isn't up to tech companies. It's social."

**What this buys the house system:** the linter must never be an authorship detector. It is a dose dashboard over our own drafts, where the base-rate problem does not exist because the question is never "did AI write this" (we know it did) but "does this read well and check out."

### 3.3 How serious writers and editors run AI-assisted work openly

**Institutions converged on one formula.** [Nature (Jan 2023)](https://www.nature.com/articles/d41586-023-00191-1): no LLM authorship because authorship carries accountability a tool cannot bear; use documented in methods or acknowledgements. [Science moved](https://www.science.org/content/blog-post/change-policy-use-generative-ai-and-large-language-models) from "plagiarized from ChatGPT" (Thorp) to a disclosure model by November 2023. [ICMJE](https://www.icmje.org/recommendations/browse/artificial-intelligence/ai-use-by-authors.html): disclose, and humans remain responsible for all content, including anything AI produced. [AP's guidance](https://www.poynter.org/ethics-trust/2023/new-ap-stylebook-guidelines-artificial-intelligence-chatgpt/) coined the most useful operational phrase: AI output is "treated as unvetted source material," subject to the same standards as a tip from a stranger. [Wired](https://www.niemanlab.org/2023/03/wired-tells-readers-what-it-will-use-generative-ai-for-and-whats-off-limits/) and [the Guardian](https://pressgazette.co.uk/publishers/nationals/guardian-ai/) published outlet-level policies with human oversight and senior sign-off.

**The practitioners who are open lead with process, not percentages.** [Ethan Mollick's "On Working with Wizards"](https://www.oneusefulthing.org/p/on-working-with-wizards) lands on the honest posture as models outgrow full verification: a transparency statement of the form "the AI did x, y, z; I verified x and y; z I could not check directly but the reasoning held." [Simon Willison's policy](https://simonwillison.net/2026/Mar/1/ai-writing/) draws the cleanest personal line: anything with opinions or an "I" in it is his own; LLMs proofread and draft documentation he then edits; prompts shared openly. [Katie Harbath publishes her whole pipeline](https://anchorchange.substack.com/p/how-i-use-ai-newsletter-workflow) (models fed specific sources rather than allowed to fill gaps, every number checked against originals) and argues for workflow-based "How I make this" statements over percentage labels. [James Bosworth](https://boz.substack.com/p/on-using-ai-to-write-newsletters) discloses four drafting modes and owns every sentence; AI detectors score his heavily AI-assisted work as fully human. [Tyler Cowen](https://marginalrevolution.com/marginalrevolution/2023/10/goat-who-is-the-greatest-economist-of-all-time-and-why-does-it-matter.html) inverted the arrangement entirely, publishing books inside the models for readers to interrogate.

**The pattern for Teal's future piece:** every credible open practitioner pairs the disclosure with a verification story. Disclosure without receipts reads as confession; disclosure with receipts reads as method. The FT piece's consultant quote shows the failure mode of hiding instead: stigma fills the vacuum.

### 3.4 Mechanically computable metrics: the evidence, metric by metric

**Sentence-length variability (burstiness).** Corpus-level evidence is peer-reviewed and consistent: human news text shows more scattered sentence-length distributions than LLM output, which clusters in the 10-to-30-token range ([Munoz-Ortiz et al.](https://arxiv.org/abs/2308.09067)); a 20-feature detector using sentence-length variation hit over 99 percent in-domain accuracy ([Desaire et al., Cell Reports Physical Science 2023](https://www.sciencedirect.com/science/article/pii/S2666386423005015)); instruction-tuned LLMs fail to match human stylistic variation across genres ([Reinhart et al., PNAS 2025](https://www.pnas.org/doi/10.1073/pnas.2422455122)). Failure modes: formulaic human genres and non-native writers score AI-like. Verdict: legitimate as a corpus-level descriptive statistic and drafting heuristic; indefensible as a single-document authorship test.

**Lexical diversity.** Raw type-token ratio is invalid across different text lengths; MTLD is the length-stable index and the recommendation is triangulation (MTLD plus HD-D plus Maas) rather than any single index ([McCarthy and Jarvis 2010](https://link.springer.com/article/10.3758/BRM.42.2.381)). Real but moderate links to perceived quality: MTLD among the three most predictive indices of human essay ratings ([McNamara, Crossley, McCarthy 2010](https://journals.sagepub.com/doi/abs/10.1177/0741088309351547)). No published norms for edited nonfiction: thresholds must come from a self-built reference corpus.

**Repeated constructions.** The strongest recent basis: [Shaib et al. (EMNLP 2024)](https://aclanthology.org/2024.emnlp-main.368/) define syntactic templates (repeated part-of-speech sequences) and show LLMs produce templated text at higher rates than human references, persisting after fine-tuning, with a follow-up extending this to [measurable dimensions of AI slop](https://arxiv.org/abs/2509.19163) (preprint). Caveat from lexical-bundle research: expert academic prose is legitimately formulaic ([Biber and Barbieri 2007](https://www.sciencedirect.com/science/article/abs/pii/S0889490606000366)), so formulaicity is not a defect score without genre norms. Repeated-opener rates: standard editorial advice, no peer-reviewed thresholds.

**Stylometry.** Burrows' Delta is widely replicated for closed-set authorship attribution but needs roughly 5,000 words per sample ([Eder 2015](https://academic.oup.com/dsh/article-abstract/30/2/167/390738)) and says nothing about quality.

**Readability formulas.** Measure only word and sentence length; six formulas disagree by up to six grade levels on the same text; no significant correlation with readers' own judgments in a 2025 comprehension study. Serviceable only as coarse audience-matching heuristics. Usable published anchors: average sentence length 15 to 20 words as the modern editorial norm; Flesch bands (about 65 Reader's Digest, 52 Time, low 30s Harvard Law Review).

**Tooling.** [textstat](https://github.com/textstat/textstat) for formulas; [TextDescriptives](https://github.com/HLasse/TextDescriptives) (peer-reviewed spaCy component) for sentence-length SD, POS proportions, and syntactic complexity; [proselint](https://github.com/amperser/proselint) for usage-guide rules with a low-false-positive design goal; [Vale](https://github.com/vale-cli/vale) as the configurable markup-aware CI linter that can host custom house styles.

**The conceptual guardrail.** Teachers rated ChatGPT essays higher in quality than human essays despite measurable style differences ([Herbold et al., Scientific Reports 2023](https://www.nature.com/articles/s41598-023-45644-9)). AI-likeness and quality are different constructs and the house system must keep them separate: the defensible design is "a dashboard of corpus-normed descriptive statistics used to prompt human judgment, never a threshold alarm."

---

## 4. Synthesis: what the combined evidence supports

1. **Teal's dose doctrine is the published consensus, arrived at independently three times.** The house style guide encodes it (rule 3's load-bearing exception; the Cleary/Buchheit Part 4 "failure modes at dosage, not bad craft"), the Economist's study operationalizes it (constructions per 1,000 sentences against human baselines), and Wikipedia's catalog states it (single tells coincidental, clusters indicative). No credible source supports single-use bans on rhetorical devices.

2. **Word tells decay in about a year; shape tells persist.** Era-versioned word lists with a retirement path are the correct catalog structure (Wikipedia's design, confirmed by the Geng and Trotta decay measurements and the em-dash arc). Construction tells (negative parallelism, rule of three, uniform sentence length, participle padding) survive across generations and are where the house guide's numbered rules already live. The catalog extension should therefore separate durable shape rules (the existing 12) from a dated, evidence-cited, retirable model watchlist (the new part).

3. **The RLHF mechanism explains both the mint and the decay.** Preference alignment overproduces what raters reward (Juzek and Ward; the Economist's Juzek quote), and publicity plus vendor patches then remove the most notorious markers. Each model generation will mint new slop. A watchlist without an update protocol is stale within one release cycle, which matches the brief's premise exactly.

4. **False positives are the failure mode that kills these systems.** 61 percent false-positive rates on non-native writers, the Constitution flagged as AI, OpenAI's own retreat, and the FT's account of detection sociology all point the same way. The house linter escapes the trap only because it answers a different question: not "did AI write this" but "is the dose right and does it check out." Even so, the lane4 sweep precedent (nine findings killed at the two-of-three verification stage for being legitimate constructions) shows in-house false positives are real, and the quoted-text, citation-list, literal-usage, and load-bearing-contrast carve-outs are mandatory (prototype evidence in writing-qa-plan.md).

5. **Mechanical metrics are legitimate as corpus-level dashboards, never as verdicts.** Sentence-length variability, MTLD, and syntactic-template rates have peer-reviewed support as descriptive separators; none supports a single-document alarm, and no published thresholds exist for edited nonfiction, so house thresholds must be derived from house reference corpora (which the prototype builds: the Clearing the Clogs final text is the calibration exemplar).

6. **ADM-182 binds the whole design.** Where a construction needs judgment (load-bearing or filler, escalation or two facts), a single LLM opinion is noise; the lane4 sweep's two-of-three independent-verifier pattern is the proven convergence mechanism, and everything that can be a mechanical count should be one.

7. **The openness position is earned by receipts.** The credible open practitioners publish process plus verification, and the Clearing the Clogs run already generated the receipts (55 claims tiered, dual page pins, verbatim quotes, a 90-minute human confirmation pass, two DOES-NOT-SUPPORT catches). Generalizing that workflow into a named standard is what turns one project's discipline into the standing answer to "how do you know nothing wrong shipped."
