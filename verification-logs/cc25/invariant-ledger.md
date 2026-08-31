# Semantic invariant ledger, CC-25

Every editing pass in this round kept this ledger, per the WRITING-METHOD ADOPTIONS entry in
SHARED/REFERENCE-NOTES.md: convergence on diagnosis before rewrite, and a minority warning about a
lost invariant escalates regardless of votes. An invariant is a claim, a caveat, a quantifier, an
instruction, an example, or a source pin.

The round ran diagnosis-first. Twelve read-only reviewers produced the diagnosis (five censuses,
five failure-pattern sweeps, a route-feasibility audit and an anchor audit), one editor integrated,
and a fresh verification round inspected the semantic delta. Reviewers were told to quote the
passage and name the functional failure, never to hand over finished prose.

## A. Invariants deliberately carried across a change

| # | Invariant | Where it was at risk | Where it landed |
|---|---|---|---|
| A1 | "not a guarantee that every year of every series is present" | inside a bold span in m3's country-dropdown lead, and an editor unbolding by deleting the span would have deleted it | unbolding stripped the `**` delimiters only, never the enclosed text. Present, m3 country selection |
| A2 | "none of them authoritative IMF guidance" | inside a bold span in m3's debt-target lead | same mechanism. Present |
| A3 | Rigidity scale endpoints, 1.0 fully rigid and 0.0 fully flexible | the bolding rule classes them as list-item labels and would have unbolded them. Inverting this scale is the course's own named worst error, cited at five sites | **exempted from the rebalance and kept bold**, on the bold census's escalation. Recorded as the round's one standing bold exception besides opener labels and answer tokens |
| A4 | The three distinct limitations in m5's exclusions section: the six documented exclusions, the inside-the-estimate limit, and partial equilibrium | a flat one-bold-per-subsection rule would have stripped two independent caveats from the chapter whose whole job is limitations | the section was **split into three subsections**, so each limitation keeps its own heading and its own lead. Structure changed rather than an exception granted |
| A5 | "Eight or nine, depending on the vintage, are refused outright" | the country-coverage callout, when the repository path was removed from it | every quantifier kept, the User Guide Section II.B pin kept, and the same quantifier propagated to m6 where it had read "a handful" |
| A6 | The no-network claim and "No word, number or figure in the course depends on which edition you are reading" | the colophon split | both kept in the colophon. Only the mechanism moved |
| A7 | "The screenshots are real captures" | the colophon paragraph naming five scripts was moved out whole | restated in the colophon without the filenames |
| A8 | The 30-minute route's deep links | plain markdown fragments, which Quarto does not validate and which fail silently | six route anchors added, and **a link-fragment check added to the publication gate** so a renamed heading fails the build instead of breaking the route in silence |
| A9 | The m0 to m6 self-assessment loop, four legs | m6's front objectives were cut, and one of them was the return leg | a new m6 end check was written carrying the comparison leg explicitly. The retake stayed word-identical to m0's three questions so it still measures pre-post change |
| A10 | The parity numbers, 147 of 147, 25 sensitivity combinations, ratio metrics only for climate | they appear in three files and all three lost their bold | all three checked and unchanged in value |
| A11 | "Everything else moves both. 2030." | m4's warm-up, a universal quantifier stated nowhere else | the warm-up moved to the point of use rather than being cut, questions and answers verbatim |
| A12 | The five sanity-check boxes and the ordering rule "before interpreting any climate result" | the m4 front objectives were cut and the end check did not carry the ordering | the ordering was folded into the end check explicitly, and the count of five restored in the Ethiopia task where it read "the box" |

## B. Escalations, and how each was resolved

| # | Escalation | Raised by | Resolution |
|---|---|---|---|
| B1 | Four of the eight authoring-only blocks carry a caveat about adjacent **visible** text. Hiding them silently upgrades unverified prose to apparently-verified. | callout census, and independently by the implementation sweep | Two were split: the reader-facing half was restated in visible prose before the block was hidden. m4's two-Uganda-numbers block became a visible reconciliation callout; m6's error list gained a visible line saying the errors are designed-against rather than observed. m4's unverified budget comparator had the unsourced clause removed from visible text. m5's block excluded cleanly, since the exercise is defended in a visible DRAFT block. **Correction, from the verification round: m6's *workshop materials* block got no restated hedge, so the split applies to two of the four, not to both m6 blocks. That block is pure production bookkeeping ("Tracked separately from the book") and excluding it whole is right, but the parity is not there and should not be recorded as if it were.** |
| B2 | The single defaults standard is not executable in the Explorer as the course describes it: the "Why this value?" field opens only on a **changed** control, so a retained default has nowhere on screen to carry its confirmation. | defaults sweep, correctness section | The standard was adopted as a **documentation** standard and the course now says plainly where the line goes, in the run label and analyst's note or the offline parameter table. No claim was made about an affordance that does not exist, and no app change was assumed. |
| B3 | The bolding rebalance would leave the defaults contradiction bolded at both ends and more visible than before. | bold census, F-19 | the contradiction was resolved as a content fix first, in the same pass, before the bolding was applied to that chapter. |
| B4 | The route's sensitivity step would leave the sensitivity value loaded at export, so the reader exports a mislabelled headline run. Created by the route, not inherited. | route feasibility audit | a restore instruction was added to the route step **and** to m3's rigidity exercise, which is where it belongs. |
| B5 | The route's step 3 pointed at a 397-word overview that teaches none of the four assumptions it names. | route feasibility audit | three anchors added, and step 3 now links the four assumption sections individually. |
| B6 | The route promised teaching at a reading load of 17 to 24 minutes against a 30-minute budget that also has to hold every click and decision. | route feasibility audit | the route's framing was corrected: the links are for when a step does not behave, the reading load is stated, and the route says to work the steps and open a link only when stuck. |
| B7 | Deleting the map prose depends on the figcaption reaching the PDF, which had not been verified. | scaffolding census, H-10 | verified directly in the shipped PDF: the caption renders as "Figure 5.1: This module is the output end...". The cuts proceeded. |
| B8 | The five build scripts and `docs/country-coverage.md` named in reader prose do not exist on the public repository's `main`. | implementation sweep | verified independently against the GitHub API: `scripts/` on `main` holds none of the five, `docs/` holds no `country-coverage.md`, and `docs/companion-guide` on `main` is still the older three-part structure. `packages/qcraft-engine` does exist. Both pointers were removed from reader prose and recorded in the maintainer note with the branch state. |

## C. Claims changed on purpose, with the evidence

These are the changes that alter what the course asserts. Each is listed so Teal can reverse any of them.

| # | Before | After | Evidence |
|---|---|---|---|
| C1 | "An untouched default needs nothing beyond its name." | a retained default earns a short reviewed-and-kept line | the review's ordered fix, and the chapter's own opening claim that an undocumented default makes the analysis indefensible |
| C2 | "The inversion flips the sign of your headline risk number." | "The inversion collapses the headline risk number rather than reversing it", with the Kenya figures | **a correctness fix.** The course's own verified table in m2 gives the 2099 gap as 49 points at rigidity 1.0, 26 at 0.5 and 4 at 0.0. The gap narrows, it does not change sign |
| C3 | "A handful of countries do not project" | "Eight or nine countries, depending on the vintage" | m3's country-coverage callout and `docs/country-coverage.md`, which name them |
| C4 | "If your A or B answer moved up, the course worked." | "your own read of your capability moved" | the claim as written asserts course efficacy from a self-rating, and the course's own pilot is still pending |
| C5 | "the baseline reads 47.0 percent of GDP at 2099, the figure the worked example builds on" | 47.0 stated, then reconciled against the 47.5 the worked example quotes | m4 uses 47.5 from the published 2023 workshop at a 50 percent target, the appendix describes the shipped 60 percent target. They are different runs and the appositive was false |
| C6 | "This is the shortest module" | "the chapter that keeps you out of trouble, and it is short enough" | false by word count: m6 and m0 are both shorter |
| C7 | "the half hour that would have gone on copying numbers" | "the time that would have gone on copying numbers" | nothing on disk measures a manual-assembly baseline |
| C8 | "the fourth reason in Module 1" and "the second of the four reasons" | "the fourth of the four differences Module 1 sets out" | m1 introduces the list as "Four things are different", never as reasons |
| C9 | "That is the size of the thing you are learning to write", after describing a five-page section | "Your two paragraphs are the Q-CRAFT core of a section that size" | the capstone is two paragraphs, and the rubric fails "over length" |
| C10 | "A result that turns on any of them needs the choice stated in your write-up" (baked into the m3 controls figure) | "Every one of them needs its choice stated in your write-up, the ones you keep at their default included" | the figure carried the old conditional standard. The generator was edited and the SVG and PNG regenerated, so the picture no longer contradicts the prose beside it |

## D. Claims left alone on purpose, and flagged for Teal

Everything a reviewer marked ARGUMENT-CHANGE that could not be settled from a source on disk was
left as written and is listed in the run report's "on Teal's desk" section rather than repaired
silently. The largest are the unquantified magnitude claims (which assumption is the biggest lever,
what a 4 percent GDP loss compares to, the co-design appendix's cost and effort claims), the IEO
2022 effect size, and the "looking under the streetlight" metaphor in the preface, which is Teal's
own commissioned wording from the round-2 redlines and so is not the editor's to cut.


## E. What the verification round caught in the editor's own work

Eleven fresh verifiers read the diff against the pre-edit files. Fourteen defects
introduced by this round were found and fixed. They are listed here because a
ledger that only records what survived is not a ledger.

| # | Defect introduced | How it was caught | Fix |
|---|---|---|---|
| E1 | The Module 4 reconciliation callout set 127 (Hot + Unadapted) against the published 66 (Hot), a scenario switch presented as a vintage difference, and closed with the rule it had just broken | the m4 verifier read the figure's own four end labels | rewritten to compare like with like, baseline 47 against 47.5 and Hot 94 against Hot 66, with 127 named as the Statement's Vulnerable scenario |
| E2 | "The other 14" became "A further 14" when the coverage caveat moved, turning a set partition into an addition and asserting 39 economies without climate estimates against a ceiling of 26 | the m5 verifier checked the arithmetic against the 197/171 counts | "The other 14" restored |
| E3 | A new Module 3 sentence gave a false mechanism: it warned that re-running the baseline on a different vintage leaves the two paths with different starting points, when the vintage is a run-level toggle that reloads both | the m3 verifier checked the claim against four descriptions of the data modes | replaced with the true condition |
| E4 | "to run on data every country has already published" in the preface | the index verifier, against three coverage counts on the same page | "data that is already published" |
| E5 | The colophon gained a repository link pointing at a `main` branch that currently refutes the sentence | the index verifier, against the maintainer note's own branch record | link removed |
| E6 | The route's reading estimate said six sections and twenty minutes; the ten links reach nine sections at 4,912 words, about twenty-five minutes | the index verifier counted them | corrected to nine sections and twenty-five minutes |
| E7 | The colophon generalised figure provenance from Module 3's five source-data figures to the course map and the exhibits, which the maintainer note disproves | the index verifier | scoped back |
| E8 | "The Explorer shots come from the live deployment" covered five module captures whose source is a local serve | the index verifier | scoped to the preface pair and the workbook appendix |
| E9 | The reason the house-edition fonts are absent was dropped, so the colophon asserted reproducibility while losing the one exception's justification | the index verifier | restored |
| E10 | The route's country-refusal line lost "depending on the vintage" and one of the two causes | the index verifier, against the Module 3 source | both restored |
| E11 | Renaming "the amplifier" in Module 1 orphaned eleven uses in Module 2, including an undefined term in a heading, and the replacement collided with the glossary's interest-growth *differential*, a different quantity | the m1 verifier grepped the term | the term restored and defined at first use instead |
| E12 | The Module 6 warm-up landed under "The capstone brief", so the table of contents entry for the brief lands the reader on a quiz | the m6 verifier | the questions got their own heading back |
| E13 | Thirteen run-in subheads inside collapsed depth layers were unbolded, leaving the longest prose in the book with no internal navigation | the m2 verifier | re-bolded. Collapsed content is invisible to a skimmer, so this costs the skim hierarchy nothing, and it is recorded as a standing exception class |
| E14 | "for the test at the end of this list" pointed at a test the same edit had deleted | the m4 verifier | pointer removed |

Three further defects were pre-existing rather than introduced and were fixed on
evidence: the sign-flip claim in Module 0, the vague country count in Module 6,
and the false appositive in Appendix A. All three are in section C.
