# Writing-QA audit of the companion guide (CC-19, phase 3, 2026-08)

**What was audited.** The current companion guide in its course form (lane4-course at commit 283e9a3, the state Teal is redlining: 11 files, ~29,600 prose words), with the shipped guide (main at 67d26b6) and the March first draft (8cc6ea0) as comparison points. Method: the draft catalog and the prototype detectors from `writing-qa-plan.md`, plus a 10-module claim-pinning inventory. **This lane changes nothing**; every finding is a recommendation with a triage bucket.

**Bottom line.** The course is nearly slop-free by the current catalog (the sweeps worked: zero em-dashes, zero literal-string tics, one load-bearing not-but). Its residual writing issue is texture, not tells: three modules run flat sentence rhythm (CV 0.66 to 0.69 against the human exemplar's 0.876), one opener family ("It/That/This is") accounts for 70 sentence starts, and two construction habits repeat at noticeable dose. The verification audit is the bigger finding: of 401 checkable claims, 85 percent pin to a file on disk and 4 percent to a test, but the 9 percent tail contains one teaching number that fails recomputation (the m2 amplifier chapeau) and a stale-app cluster in which m1, m3, and m4 describe a five-control, four-tab, October-2024 Explorer while the deployed app the course links to ships ten controls, seven tabs, and an April 2026 default vintage, including an instruction to sanity-check a sidebar display that does not exist. Six of the fixes are sentence-scale.

**In this document.**

1. The slop table (construction, count, dose verdict, keep or fix)
2. Sentence-length variability per module
3. The repeated-construction report
4. The verification audit: claim inventory and pinning state
5. Ranked findings and triage

---

## 1. The slop table

Counts are over the course's prose only (code, math, tables, YAML, figure files stripped; citation author-triplets exempted). Dose verdicts apply the plan's v0 bands for technical-reference register (rule of three warn above 2.0/1k; semicolons above 2/1k; CV warn below 0.55 per file).

| Construction | Count | Rate /1k | Dose verdict | Keep or fix |
|---|---|---|---|---|
| Em-dashes | 0 | 0 | at target (band: zero) | Nothing to do; first draft had 95, receipts in plan §5 |
| Literal-string tics ("worth noting", "let's dive", "in conclusion", throat-clearers) | 0 | 0 | at target | Nothing to do |
| Banned vocabulary (delve, robust, leverage-as-verb, seamless...) | 0 | 0 | at target | Nothing to do |
| Watchlist vocabulary (comprehensive, crucial, journey...) | 1 | 0.03 | well under band | Keep: "comprehensive framework" describes the C-PIMA Handbook, a fair descriptor in a reference entry |
| Negative parallelism, prose ("not X but Y") | 1 | 0.03 | under band | Keep: "The target is not a chart but a write-up" is a load-bearing contrast defining the capstone deliverable (rule 3 exception) |
| Negative parallelism, headings | 0 | 0 | at target (banned outright) | Nothing to do; the lane4 113-agent sweep cleared 230 headings in run 9 |
| Rule of three | 20 | 0.69 | under both bands | Keep as a family: nearly every instance enumerates a real triad (the three growth inputs; population/productivity/prices; medium/high/low variants). The teaching frame is itself three-part, so triads here are content, not ornament. No instance reads as rhythm filler |
| Semicolons | 6 raw (0.2/1k) | 0.2 | under band | Keep: known deliberate cases (the M1 title semicolon is Teal's own wording, recorded in the lane4 run report) |
| "The X? A Y." question-answer | 0 | 0 | at target | Nothing to do |
| Appended-judgment / self-certifying / echo tails | 0 | 0 | at target | Nothing to do |
| Participle taglines | 0 | 0 | at target | Nothing to do |
| "which is why ..." | 11 | 0.37 | no band yet; noticeable | Watch: legitimate causal connective, but 11 uses is a habit. Vary a third of them at the next touch where a plain "so" or a new sentence serves |
| "..., and it is the ..." | 8 | 0.27 | no band yet; noticeable | Mixed: most add genuinely new information (not rule 12); two or three lean toward escalation cadence. Candidates listed in §3 for the next touch's judgment pass |
| "because it is the ..." | 8 | 0.27 | no band yet | Keep: each instance carries a real reason; the repetition is the tell, so vary the connective in two or three spots |
| "It is / That is / This is" sentence openers | 70 | 3.8 per 100 sentences | main texture finding | Fix gradually: this opener family plus flat rhythm is what separates the course from the exemplar corpus; see §2 and §3 |

Reading: the tic-level catalog is clean, which is exactly what the mechanical sweeps were built to achieve and proof they work. What remains is below the resolution of any ban list and above the resolution of a word grep: rhythm and construction dose. That is the linter's B-tier and the reason the plan separates dose dashboards from hard gates.

## 2. Sentence-length variability per module

Human exemplar calibration: Clearing the Clogs final runs CV 0.876 with 15.8% short (≤8w) and 15.6% long (≥30w) sentences: long flowing analysis punctuated by punches.

| Module | Words | Mean | SD | CV | Short % | Long % | Reading |
|---|---|---|---|---|---|---|---|
| index.qmd | 1,671 | 17.4 | 8.9 | **0.511** | 16.7 | 11.5 | Flattest prose file; preface cadence is uniform mid-length sentences |
| m0-start-here | 1,531 | 15.2 | 11.5 | 0.759 | 23.8 | 7.9 | Healthy |
| m1-how-qcraft-thinks | 3,925 | 15.5 | 10.7 | 0.688 | 22.9 | 4.3 | Slightly flat; almost no long sentences (4.3% vs exemplar 15.6%): explanation proceeds in same-size steps |
| m2-debt-equation | 6,691 | 14.6 | 9.6 | **0.662** | 28.8 | 6.5 | Flattest module; worst 10-sentence window runs CV 0.32 (§3) |
| m3-parameters | 4,278 | 17.2 | 11.6 | **0.672** | 26.9 | 12.4 | Flat |
| m4-worked-example | 4,570 | 18.6 | 13.7 | 0.737 | 22.8 | 15.0 | Healthy; closest to exemplar shape |
| m5-boundaries | 3,006 | 19.1 | 13.3 | 0.696 | 19.1 | 17.2 | Acceptable |
| m6-capstone | 1,569 | 17.2 | 15.0 | **0.868** | 33.0 | 13.2 | Matches the human exemplar; the course's best rhythm |
| appendix-codesign | 1,016 | 13.0 | 9.4 | 0.718 | 34.6 | 5.1 | Healthy |
| glossary | 843 | 22.8 | 10.8 | 0.473 | 8.1 | 24.3 | Definitional display copy; flat by design, not a finding |

Findings: the three teaching-core modules (m1, m2, m3) are the flat ones, and they are also where the most careful mechanical drafting happened. m6 proves the course CAN carry exemplar-grade rhythm. The shipped guide (parts form) shows the same signature (CV 0.727 overall), so this predates the restructure. The fix is not a sweep; it is targeted: where a module's window runs flat (m2 sentences 431 to 440 all sit between 12 and 36 words in lockstep), break one sentence short or let one run long. This is redline-grade work for the next course touch, module by module, m2 first.

## 3. The repeated-construction report

**Top repeated 4-grams (count ≥ 7, apparatus excluded from verdicts):** "the IMF User Guide" (13; citation apparatus, fine), "by the end of" + "end of this module" + "of this module you" (12/7/7; the learning-objective frame, deliberate and uniform by design), "at percent of GDP" (12; artifact of math stripping, actually "X percent of GDP", fine), "the debt dynamics equation" (8; the mandated name, fine), "a fiscal risk statement" (9; recurring deliverable name, fine). None of these is slop; they are the course's spine vocabulary.

**Construction habits with instances worth a judgment pass at the next touch:**

- "..., and it is the ..." (8): keep "and it is the only one of the three numbers a government sets directly" (new fact); keep "and it is the difference between a debt ratio that drifts down and one that compounds" (real contrast); review "and it is the sentence most credible fiscal risk write-ups open with" and "and it is the part the capstone rubric marks" (both add information, but back to back with the same cadence they read as a formula; vary one).
- "which is why ..." (11): all causally real; vary two or three ("so", "That is why", or sentence break) purely for texture.
- "It/That/This is" openers (70 across 1,741 sentences, 4.0%): concentrated in m1/m2/m3. The pattern is the anaphoric explainer voice ("That is rigidity 0." "That is the worst case..."). Individually fine, at dose it is the course's most machine-flavored surviving texture. Recommendation: no sweep; when redlining a section, recast a third of these openers to lead with the subject noun.

**Cross-module sentence reuse:** the two Verified-mode parity sentences appear verbatim in three files by governance (gated wording); the objectives frame repeats by design. No ungoverned sentence-level duplication found above the 4-gram floor.

## 4. The verification audit: claim inventory and pinning state

**Method.** Ten inventory agents, one per module, each reading its module in full and classifying every checkable claim (numbers, citations, document pins, workbook cell claims, app-behavior claims, data-source claims) into pinned-disk (a named file on disk supports it), pinned-test (a test asserts it), pinned-external (only an external source), or unverified, with an honest note on what was checked versus assumed. An eleventh agent extracted CC-17's factual-accuracy findings for reconciliation. Every headline finding below was then re-verified by hand in this lane: the tab array, sidebar controls, and download-button labels were read from the deployed tag `freeze-2026-08-29c` itself; the amplifier number was recomputed from the module's own worked example; PARITY_REPORT.md:369-370, the m2 fast-path absence, and the m6 uncited attribution were checked directly. Per ADM-182, the pin-state lookups are mechanical; unlisted rows carry the agents' classifications with their notes and were not independently re-derived.

**The totals.**

| Module | Claims | Pinned disk | Pinned test | Pinned external | Unverified |
|---|---|---|---|---|---|
| index.qmd | 28 | 22 | 2 | 2 | 2 |
| m0-start-here | 21 | 19 | 1 | 0 | 1 |
| m1-how-qcraft-thinks | 50 | 38 | 5 | 2 | 5 |
| m2-debt-equation | 76 | 67 | 3 | 3 | 3 |
| m3-parameters | 51 | 42 | 0 | 0 | 9 |
| m4-worked-example | 69 | 62 | 1 | 1 | 5 |
| m5-boundaries | 30 | 29 | 0 | 0 | 1 |
| m6-capstone | 25 | 19 | 2 | 0 | 4 |
| appendix-codesign | 20 | 15 | 1 | 1 | 3 |
| glossary | 31 | 26 | 2 | 1 | 2 |
| **Total** | **401** | **339 (85%)** | **17 (4%)** | **10 (2%)** | **35 (9%)** |

**The well-pinned core is strong.** The governed parity wording traces verbatim to PARITY_REPORT.md; workbook formula claims (the Baseline IF-floor, the bare scenario recursion) were re-read from the .xlsx with openpyxl; the Uganda FRS "Source: QCRAFT (2023)" lines and the C-PIMA mission dates were verified against the PDFs on disk; the User Guide byline, the 171-economies figure (printed p. 5), and the MIT license all check. This is a receipts-grade baseline most course materials never establish.

**The failure classes in the 9 percent tail, worst first:**

1. **One number fails recomputation.** m2:70, a bolded chapeau: "The amplifier contributes 1.1 points in year one and 2.2 by year three." From the module's own table (60 percent start, 1.08/1.06 factor): per-year amplifier contribution in year three is 1.21 points, cumulative over three years 3.52. The 2.2 is the TOTAL year-three rise (66.5 minus 64.3), which includes the 1.0 of borrowing. No natural reading makes the amplifier 2.2. The cumulative framing (3.5 from the amplifier against 3.0 from borrowing) is both correct and a better fit for the section's own title ("the amplifier adds more than the borrowing"). The surrounding numbers all check (the table itself, the growth sensitivity 64.7/1.8, the m2 self-check arithmetic). This slipped past CC-17's every-number-traces gate, which recorded only one residual (F-36, a page pin).
2. **The stale-app cluster: the course teaches an Explorer that no longer exists.** Verified against the deployed tag the course links to (freeze-2026-08-29c): the app has seven tabs (m3 says "four tabs hold everything"), ten sidebar controls including productivity, inflation, and an interest-rate approach control (m3 says five parameters, says those three "are not exposed in V1," and says "nothing you can set reaches the interest rate at all"), and defaults to the Current vintage, WEO April 2026 (m1:36 says "current bundled data, October 2024 as this is written"; m3 says selecting a country loads "currently the October 2024 vintage"). Worst for a trainee: m1:64 and m3:79 instruct the learner to sanity-check "the sidebar context: the latest WEO debt-to-GDP ratio and total population," and no such sidebar display exists in the shipped app. m4 names download buttons "Download Baseline CSV" and "Download All Scenarios CSV" where the app ships "Download this scenario (CSV)" and "Download all scenarios (CSV)", and describes CSV values "in billions of local currency units" where the shipped result columns carry only percent-of-GDP series. A related recorded discrepancy: m1 says productivity and inflation sit at the Excel tool's defaults, while PARITY_REPORT.md:369-370 records Excel inflation_start 3.5 against engine 5.0 and Excel debt_target 60 against engine 50 (current engine defaults need confirming before any wording lands).
3. **Unsourced external attributions.** m6:149 attributes a specific finding to "the IMF's own evaluation of capacity development" with no citation anywhere in the course (CC-17's F-32; still open, and the sentence may conflate the independent IEO with an IMF self-evaluation). The glossary characterizes the LIC-DSF (composite-indicator thresholds) and DIGNAD with no source on disk or in references. m4's "countries closer to the equator generally show larger GDP losses" and m2's "CMIP6 projections for your grid cells, population-weighted" are plausible but pinned to nothing the agents or this lane could find on disk.
4. **Forward commitments with no artifact.** m6 promises a Day 3 retrieval question and a Week 2 application check "as part of the course"; nothing on disk implements them. The appendix asserts the Q-CRAFT/DIGNAD/LIC-DSF integration chain as existing where its own A.4 calls it a goal (CC-17's F-33), and calls the project grant-funded with no funder named anywhere on disk.
5. **Internal inconsistency.** m0 claims "every module carries a fast-path marker near the top"; m2, the longest module, has none (grep confirms zero).
6. **Analyst guidance presented as bands.** m3's debt-target starting points (LICs 40-50, EMs 50-70, AEs 60-100+) and rigidity bands (rigid 0.7-1.0, flexible 0.3-0.6) are self-flagged as non-authoritative but pinned to nothing; the rigidity band also sits oddly beside parameter-data.md's pooled world record of roughly 0.25 to 0.50.

Correctly self-flagged and NOT counted as findings: the 18-plus DRAFT FOR TEAL blocks, m4's budget-comparator TODO, and m6's common-errors hypothesis note, all of which mark their own unverified status, which is exactly the behavior the verification standard wants.

**Reconciliation with CC-17.** No double-counting: CC-18 already shipped F-2 (the three "only"s), F-17 (the stale date), F-35, F-36, and F-60. Still open from CC-17 and confirmed here: F-32 (the m6 citation), F-33 (roadmap as existing), F-16, F-3 (the both-ways promise). New in this audit, absent from CC-17's factual findings: the amplifier number, the entire stale-app cluster, the m4 export contradictions, the m0 fast-path inconsistency, and the defaults-versus-parity-report discrepancy. The two audits used different instruments (CC-17 scored gates against rendered pages; this one inventoried claims against sources), and the deltas are what the second instrument exists to catch.

## 5. Ranked findings and triage

Ranked by severity times fix size; the (a) list is deliberately corrections-only, the same class as CC-18's batch.

**(a) Worth folding into the next course touch (each is sentence-scale):**

| # | Fix | Where | Size |
|---|---|---|---|
| A1 | Amplifier sentence: recast to the cumulative framing (3.5 points from the amplifier against 3.0 from borrowing over three years), which is correct and strengthens the section's claim | m2:70 | one sentence |
| A2 | Data-currency line: name both modes (Verified = WEO Oct 2024, Current = WEO Apr 2026, the default) instead of "October 2024 as this is written" | m1:36 | one sentence |
| A3 | Retire the sidebar-context instruction; point the sanity check at where the numbers actually live in the shipped app | m1:64, m3:79 | two sentences |
| A4 | CSV button names and the units sentence corrected to the shipped export | m4 (two spots) | two sentences |
| A5 | Fast-path consistency: add m2's marker or soften m0's "every module" | m0 or m2 | one line |
| A6 | m6 capacity-development attribution: verify the actual evaluation (IEO versus IMF self-evaluation), then cite it (closes CC-17 F-32) | m6:149 | one citation plus possibly one word |

**(b) The wave (module-scale, rides the reformat waves or a dedicated accuracy lane):**

- B1: The stale-V1 parameter story in m3 (and its echoes in m1) rewritten against the ten-control, seven-tab app, OR explicitly scoped to a named teaching subset (see open question C1). This is the largest single accuracy debt and touches teaching prose, so it needs Teal's read.
- B2: The unsourced-attribution batch (glossary LIC-DSF and DIGNAD, m4 equator claim, m2 grid-cells detail): one extraction-worker pass per the verification standard, then cite or soften each.
- B3: Defaults wording in m1 after confirming current engine defaults against the workbook's (PARITY_REPORT records two mismatches).
- B4: Rhythm work where the shape metrics point (m2 first, then m3, m1, index): break flat windows, recast a third of the "It/That/This is" openers, vary two or three of each repeated connective family. Redline-grade, not sweep-grade.
- B5: Forward-commitment hygiene: implement or cut the Day 3 / Week 2 checks; reword the appendix roadmap to aspiration (CC-17 F-33); name the funder or drop "grant-funded."

**(c) Open questions for Teal:**

- C1: Is the course's five-control story a deliberate teaching subset of the ten-control app? If yes, one sentence saying so fixes most of B1 cheaply; if no, B1 is a rewrite. This interacts with CC-17's open design questions on scope.
- C2: The m6 rubric weights sit in a DRAFT FOR TEAL block awaiting the actual call.
- C3: Should the course adopt the verification standard (plan doc, section 4) as its standing ship gate? The index already promises "every figure in the Module 4 walkthrough can be checked against published documents"; the standard is what makes that sentence permanently true rather than aspirational.
- C4: Whether the watchlist section and linter (plan doc, sections 2 and 3) get built now or after the Uganda sessions; the audit above is the evidence for what they would catch that sweeps do not.

**What this audit says about the system.** The tic-level discipline held (section 1: zero em-dashes, zero banned strings). The claim-level discipline mostly held (85 percent pinned to disk). What got through is exactly what the proposed architecture targets: one wrong number a mechanical recomputation catches, a stale-app cluster a claims-to-artifact inventory catches, and texture flatness a dose dashboard catches. None of the three is visible to a word sweep, and all three were invisible until the second instrument ran.

## 5. Ranked findings and triage

PLACEHOLDER-TRIAGE
