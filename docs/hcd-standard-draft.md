# Teal Insights human-centered design standard (draft v0.1)

**Status:** draft, awaiting Teal's review. Written by CC-15 (2026-08-29, trail
TEA-1400) as the durable standard for every SovTech tool with a human interface.
**Intended permanent home:** `lte-workbench/docs/hcd-standard.md` after Teal's
review; this repo carries the draft because the first audit ran here.
**Relationship to existing canon:** this file deepens
`lte-workbench/docs/explainers/interface-design-for-small-data-tools.md` (v1.0, the
pocket version) into gates and scored criteria an auditor can apply. The explainer
remains the one-page orientation; where they disagree, this file wins once Teal
approves it. Model for the shape: `docs/deck-standard.md` and the Cleary/Buchheit
writing rubric (gates that block, scored criteria that grade).

## 0. Why this file exists

Two reasons. First, the design bar for these tools was living in heads and in
scattered review comments, so every new tool re-derived it and every audit invented
its own rubric. This file is the single written answer: what blocks shipping, what
gets scored, and how an audit runs. Second, the audience justifies a high bar:
ministry analysts, economists, and policymakers are busy, expert, and low-patience.
A tool for them must be calm, self-evident, and fast to judgment. The working test
throughout: someone landing on the tool knows where to look, and the whole journey
completes without reading directions. A door that needs a taped-on sign has failed;
so has a screen.

Many SovTech tools reimplement a canonical official artifact (a published
spreadsheet template, an official model). Wherever that is true, two paths are
first-class forever: match the canonical artifact exactly, or take the assisted way
with guidance embedded. Both appear throughout this standard; neither is ever the
lesser one.

## 1. How to use this file

- **Specs cite it.** A spec for any tool with a human interface names which criteria
  it adopts and which it skips on purpose, with the reason (the ADM-152 rule
  generalized). Silence is not a skip.
- **Audits score it.** An audit runs the method in section 5, checks every gate,
  scores every criterion 0 to 2, and ties each score to a screenshot or a
  walkthrough step. A score without evidence is not a score.
- **Gates cap the verdict.** One failed gate means "revise required" no matter how
  high the scores, because each gate names a way the tool loses an analyst's trust
  or work. There is no composite number across groups: a composite hides exactly
  what a gate is for.
- **Scoring scale:** 2 pass, 1 partial with the fixes named, 0 fail, N/A only with a
  stated reason. The grader quotes the offending or supporting pixel: screenshot,
  step reference, or exact on-screen text.

## 2. The gates

Binary. Any fail blocks sign-off regardless of scores.

| # | Gate | Fail if | Source |
|---|---|---|---|
| G1 | **First screen orients** | A first-time member of the stated audience cannot say, within a few seconds and without scrolling, what this is and where to look first; or the primary action is not unmistakable. | Norman door test (DOET 2013 ch. 1); first-click research (Bailey and Wolfson) |
| G2 | **No control changes meaning by context** | The same signifier does different things in different places, or two different things share one name on one screen. | Nielsen 4; ISO 9241-110:2020 conformity with user expectations |
| G3 | **Consequences preview** | Any action, including leaving or reloading the page, can destroy work or change displayed results without saying so before it happens. | Norman error design (DOET ch. 5); Shneiderman rule 6 (easy reversal) |
| G4 | **The interface never scolds** | Any message blames the user, shames a choice, or discards what they typed. | Norman: user error is bad design; NN/g error-message guidelines |
| G5 | **Both paths visible at every decision point** | The analyst cannot see both the canonical-artifact option and the assisted option wherever the two diverge; or either path is buried, dead-ends, or is labeled or styled as the lesser one. | House dual-path rule; ISO 9241-110:2020 controllability |
| G6 | **No silent wrong numbers** | The tool computes and displays a result from an input it also considers invalid or out of range, without a visible flag at the input and at the result. | Nielsen 5 (error prevention); ISO 9241-110:2020 use-error robustness |
| G7 | **Every action answers** | Any user action produces no perceptible response; or an operation slower than about a second shows no progress state. | Norman feedback (DOET ch. 1); Nielsen 1 |
| G8 | **Signifiers are honest** | Something operable looks static, or something static looks operable. | Norman signifiers (2013 revision); Nielsen 4 |
| G9 | **Nothing load-bearing hides** | A warning, a data-vintage or provenance flag, or an active non-default assumption that changes conclusions is visible only inside a disclosure, a tooltip, or a secondary screen. | Progressive-disclosure limit (Nielsen 2006); calm-tech recenterability |
| G10 | **Entry points carry their units and bounds** | A numeric field hides its unit or its valid range; or a slider is the only way to set a value precisely. | Wroblewski 2008; NN/g slider guidance |
| G11 | **Interruptions are warranted** | The tool interrupts (modal, focus steal, motion, sound) without a stake that justifies it; or anything in the periphery moves, blinks, or counts on its own; or a standing indicator cannot open to its full cause in one action. | Weiser and Brown 1996; Case 2015 |
| G12 | **Refusal over fabrication** | Where the data cannot support an answer, the tool draws or computes something a careful reader should not cite, instead of declining visibly and saying why. | House honest-broker stance; ISO 9241-110:2020 user engagement (trustworthiness) |
| G13 | **Attribution stays exact** | The tool or its documents claim or imply certification or compliance with ISO standards (they are referenced by name and number only); or a principle, source, or dataset is credited to the wrong author or edition. | House rule |
| G14 | **The core journey needs no manual** | Any step of the primary journey requires documentation, a tooltip hunt, or a colleague to complete. | ISO 9241-110:2020 self-descriptiveness; Norman door test |

## 3. Scored criteria

Grouped under the source principles. Each carries a one-line test an auditor can
apply to a screenshot or a walkthrough step. Where a criterion has a well-known
Nielsen twin, the heuristic number is named so findings can cite either without
double-scoring: score each observation once, under the most specific line.

### A. Norman, The Design of Everyday Things (1988; revised 2013)

- **A1. Signifiers at the point of need.** Every available action is communicated
  where it happens; the auditor audits signifiers, never "affordances" (the 2013
  correction: affordances are possibilities, signifiers communicate them).
  *Test: pick the five core actions; each is discoverable from its control alone,
  with no tooltip, doc, or demonstration.*
- **A2. Natural mapping.** Controls sit with what they affect, and layout mirrors
  the model behind the numbers.
  *Test: for each control, the display it moves is adjacent or visibly connected;
  nothing acts at a distance unannounced.*
- **A3. Informative feedback.** The response to an action says what changed, and
  where, and not merely that something happened. (Nielsen 1.)
  *Test: change one input; name the outputs that moved within a second of looking.*
- **A4. The system image teaches the model.** The screen alone builds a workable
  picture of how inputs become outputs; the manual is not the patch for the screen.
  *Test: after ten minutes of use, the stated persona can sketch data to assumptions
  to results and be roughly right.*
- **A5. Knowledge in the world.** Current state, options, and defaults are visible;
  nothing must be memorized between screens. (Nielsen 6, recognition rather than
  recall: Nielsen's heuristic, often misattributed to Norman.)
  *Test: every "what is set right now" question is answerable by looking.*
- **A6. Slips and mistakes get different guards.** Constraints and confirmations
  catch the autopilot slip; visible state and consequence previews catch the
  wrong-model mistake.
  *Test: the three most damaging plausible errors each have a named guard of the
  right kind.*

### B. ISO 9241-110:2020, the seven interaction principles

Referenced by name and number; the one-line glosses are ours.

- **B1. Suitability for the user's tasks.** The tool serves the task, and adds no
  steps of its own.
  *Test: walk the core journey; count steps imposed by the technology rather than
  the task; two points at zero.*
- **B2. Self-descriptiveness.** What the tool can do here, and what state it is in,
  read off the screen.
  *Test: at each step, "what can I do here" and "what mode am I in" are answerable
  without prior study.*
- **B3. Conformity with user expectations.** Names, signs, units, orderings, and
  behaviors match the profession's conventions, and the canonical artifact's where
  one exists.
  *Test: a domain expert finds no term or convention that is the tool's own
  invention where a standard one exists.*
- **B4. Learnability.** Exploration is safe, cheap, and teaches the model.
  *Test: a newcomer can try, see, and back out of anything without damage and
  without documentation.*
- **B5. Controllability.** The user sets pace, sequence, and view; choices stick.
  *Test: nothing auto-advances, auto-plays, or reverts a choice the user made.*
- **B6. Use-error robustness.** Errors are prevented, tolerated, or cheap to
  recover; none is silently accepted.
  *Test: commit five plausible errors; each is caught before a wrong conclusion and
  undone in one step.*
- **B7. User engagement.** The presentation invites continued work and earns trust:
  provenance visible, confidence calibrated, no overclaim anywhere.
  *Test: every headline number carries its basis; nothing claims more than its
  source supports.*

### C. Calm technology (Weiser and Brown 1996; Case 2015)

- **C1. The periphery does the standing work.** Status lives at the edge, glanceable
  and ignorable; "technologies encalm as they empower our periphery."
  *Test: list every standing indicator; ignoring each one costs the task nothing.*
- **C2. Attention demands are proportionate.** The tool asks for the center of
  attention only when the stakes warrant it, at the moment of the decision it
  serves.
  *Test: for each interruption or must-read band, name the decision it serves and
  why it cannot wait; a miss on either is a miss.*
- **C3. The first screen spends attention like money.** The words and bands a
  newcomer meets first are the ones the task needs first.
  *Test: word-count and band-count the first screen; each band earns its place in
  the persona's first five minutes or waits its turn.*
- **C4. The minimum technology that solves it.** Features exist because a recurring
  task needs them.
  *Test: for each feature, name the task and the user; a feature that exists to
  impress goes.*
- **C5. It works even when it fails.** With the enrichment layer degraded or
  offline, the core computation and export still complete, with the degraded
  state stated on screen.
  *Test: disable the nice-to-haves; the canonical job still finishes.*

### D. Progressive disclosure and cognitive load (Nielsen 2006; Sweller 1988; Shneiderman 1996)

- **D1. Overview first, details on demand.** The first screen answers the headline
  question; the evidence behind any headline is close ("overview first, zoom and
  filter, then details-on-demand," Shneiderman 1996).
  *Test: from any headline number, the series or record behind it is at most two
  actions away.*
- **D2. Disclosure sorts by frequency and importance.** What experts need often is
  never buried; depth for the rare case is one labeled action away.
  *Test: the five most frequent expert actions need zero disclosure.*
- **D3. Two levels, no more.** Primary display plus one secondary layer.
  *Test: no content requires opening a disclosure inside a disclosure inside a
  third.*
- **D4. Extraneous load is pruned.** Everything standing on screen either informs
  the task or leaves.
  *Test: remove-test each standing element; if the task does not suffer, it goes or
  collapses.*
- **D5. Accelerators for the practiced hand.** The repeated expert loop has a fast
  path that novices never see. (Nielsen 7.)
  *Test: the second-hundredth run of the core loop is measurably shorter than the
  first, through remembered state, keyboard, or one-step repeat.*

### E. Forms and data entry (Wroblewski 2008; Jarrett; NN/g)

- **E1. Labels persist.** Every field keeps its visible label; placeholders label
  nothing.
  *Test: screenshot the form with every field full; every label still reads.*
- **E2. Units, scale, and plausible range at the point of entry.** Beyond the G10
  floor: the field itself teaches what a sensible value looks like.
  *Test: a domain expert seeing only the field knows the unit and roughly where
  defensible values lie.*
- **E3. Validation lands at the field edge.** The verdict appears when the analyst
  leaves the field, beside the field, with their input preserved for editing.
  *Test: type an invalid value and move on; the flag is adjacent, constructive, and
  the value still sits in the box.*
- **E4. Defaults are decisions.** Every default has a written reason; where a
  canonical artifact exists, the default equals its value or the divergence is
  documented and visible.
  *Test: pick any default; its rationale is findable in the repo, and its canonical
  status is visible in the tool.*
- **E5. Evidence at the point of decision.** Each judgment field offers its
  supporting record (the published series, the peer distribution, the alternatives
  drawn) without leaving the screen.
  *Test: from the field, one action shows the record; zero actions show that the
  record exists.*
- **E6. Reasoning is captured in one motion.** Departing from a default offers a
  way to record why, in the same flow, and the note travels into every export.
  *Test: change a value, write the why without leaving the flow, find it verbatim
  in the exported artifact.*

### F. The dual-path criteria (house)

- **F1. Parity of finish.** Both paths get first-class craft, end to end.
  *Test: walk both paths; neither meets a placeholder, a missing feature, or a
  rougher edge than the other.*
- **F2. The current path is always visible, and switching is cheap.** The analyst
  knows which world they are in and can change worlds without losing work.
  *Test: the path indicator is on screen at every step; switching costs one action
  and zero data.*
- **F3. Respect in every sentence.** Copy never frames the canonical path as legacy
  or the assisted path as training wheels.
  *Test: read every sentence that mentions either path; each would read fine to a
  devoted user of the other.*

### G. Process (ISO 9241-210:2019, evidence a release can show)

- **G1p. Explicit users and tasks.** A written statement of who this serves, doing
  what, in what context, exists and matches what was built.
  *Test: the statement names the personas and the journey; the tool's first screen
  serves them.*
- **G2p. Evaluation drove refinement.** The release shows at least one evaluation
  against realistic tasks, and what changed because of it.
  *Test: the release notes name findings and the changes they caused.*
- **G3p. Iteration is recorded.** Redirected design decisions land in this file's
  capture section, with before and after.
  *Test: section 6 grows when Teal redirects a decision; an empty section after a
  redirect is a miss.*
- **G4p. The whole experience is designed.** Arrival, orientation, work, export,
  sharing, and return are each deliberate, and evaluated as a journey.
  *Test: the audit's journey map covers all six and none is an accident of
  implementation.*

## 4. Severity scale for audit findings

Nielsen's 0 to 4 scale, applied per finding after the walkthroughs, combining
frequency, impact, and persistence:

- **0**: not a usability problem.
- **1**: cosmetic; fix when spare time exists.
- **2**: minor; low priority.
- **3**: major; important to fix.
- **4**: catastrophe; imperative to fix before release. Reserved for findings that
  would make an analyst cite a wrong number or lose real work.

## 5. Running an audit

- **Personas first.** At least two written personas with stated domain expertise,
  canonical-artifact fluency, and goals: the canonical-artifact expert meeting the
  tool, and the domain newcomer. Add the skeptical forwarded-to reader when the
  tool exports artifacts that travel. Two auditors given only the persona sheet
  should agree on what this persona would recognize cold.
- **Walk the journey, ask the four questions.** For every step of the core journey,
  in Wharton, Rieman, Lewis, and Polson's frame (1994): will this persona try to
  achieve the right effect; will they notice the correct action is available; will
  they connect that action to their goal; and after acting, will they see progress
  was made? Spencer's streamlined pair (2000) is acceptable for speed: will they
  know what to do, and will they see they were right.
- **Independent passes, then aggregate.** Three or more evaluators (or
  differently-lensed agent passes) work independently before any aggregation; a
  single evaluator finds a minority of real problems (Nielsen and Molich 1990).
  Aggregation preserves the count: found by n of m.
- **Verify adversarially.** Every finding faces one pass whose job is to kill it:
  evidence checked against the pixels, severity re-anchored, fix checked for
  proportion.
- **Findings carry five things.** The rubric line violated, the evidence
  (screenshot or step, with exact on-screen text where relevant), the severity, the
  smallest fix that resolves it, and, where relevant, what the finding must not
  break (a gated wording, a first-class path).
- **First screen gets its own pass.** First impressions and the first click decide
  more than most steps; audit where the eyes land and what the first click would
  be, against G1.
- **What works well is recorded.** An audit that lists only faults misreads the
  tool and teaches the next one nothing.

## 6. Captured from real use

Seeded empty on purpose. The capture rule, the same loop the writing style guides
use: when Teal redirects a design decision in review, the pattern lands here with
the before and the after, the artifact it came from, and the generalized rule.
When an entry recurs twice it graduates into a gate or a scored criterion at the
next version bump, by Teal's say-so.

*(No entries yet.)*

## 7. Sources

Verified against primary or authoritative sources, 2026-08-29. Editions matter:
quotes and principle names above follow the editions cited here.

- Norman, D. A. *The Design of Everyday Things: Revised and Expanded Edition.*
  Basic Books, 2013 (first published 1988). Signifier correction also in Norman,
  "Signifiers, Not Affordances," *ACM Interactions* 15(6), 2008.
- Gibson, J. J. *The Ecological Approach to Visual Perception.* Houghton Mifflin,
  1979, ch. 8 (the affordance concept; the term predates Norman's design usage).
- Hutchins, E., Hollan, J., Norman, D. "Direct Manipulation Interfaces."
  *Human-Computer Interaction* 1(4), 1985 (the two gulfs).
- ISO 9241-110:2020, *Ergonomics of human-system interaction, Part 110:
  Interaction principles* (second edition; supersedes the 2006 "Dialogue
  principles"). Referenced by name and number only.
- ISO 9241-210:2019, *Ergonomics of human-system interaction, Part 210:
  Human-centred design for interactive systems* (second edition). Referenced by
  name and number only.
- Nielsen, J. "10 Usability Heuristics for User Interface Design." Nielsen Norman
  Group, 1994; definitions revised 2020. nngroup.com/articles/ten-usability-heuristics/
- Nielsen, J. "Severity Ratings for Usability Problems." Nielsen Norman Group,
  1994. Nielsen, J. and Molich, R. "Heuristic Evaluation of User Interfaces."
  *CHI '90*, 1990.
- Weiser, M. and Brown, J. S. "Designing Calm Technology" (Xerox PARC, 1995;
  *PowerGrid Journal*, 1996) and "The Coming Age of Calm Technology" (1996; ch. 6
  of Denning and Metcalfe, *Beyond Calculation*, 1997).
- Case, A. *Calm Technology: Principles and Patterns for Non-Intrusive Design.*
  O'Reilly Media, 2015.
- Nielsen, J. "Progressive Disclosure." Nielsen Norman Group, 2006.
- Sweller, J. "Cognitive Load During Problem Solving." *Cognitive Science* 12(2),
  1988.
- Shneiderman, B. "The Eyes Have It: A Task by Data Type Taxonomy for Information
  Visualizations." *IEEE VL '96*, 1996 (the mantra, verbatim: "overview first,
  zoom and filter, then details-on-demand").
- Shneiderman, B. *Designing the User Interface*, 6th ed., Pearson, 2016, section
  3.3.4 (the Eight Golden Rules; rule 6, permit easy reversal of actions).
- Wroblewski, L. *Web Form Design: Filling in the Blanks.* Rosenfeld Media, 2008.
  Wroblewski, "Inline Validation in Web Forms," *A List Apart*, 2009.
- Jarrett, C. and Gaffney, G. *Forms that Work.* Morgan Kaufmann, 2008.
- Neusesser, T. and Sunwall, E. "Error-Message Guidelines." Nielsen Norman Group,
  2023. Krause, R. "10 Design Guidelines for Reporting Errors in Forms." NN/g, 2019.
- Nielsen, J. "The Power of Defaults." NN/g, 2005. Spool, J. "Do users change
  their settings?" UIE, 2011 (fewer than 5% changed Word's defaults).
- Harley, A. "Slider Design: Rules of Thumb." NN/g, 2015.
- Wharton, C., Rieman, J., Lewis, C., Polson, P. "The cognitive walkthrough
  method: a practitioner's guide." In Nielsen and Mack (eds.), *Usability
  Inspection Methods*, Wiley, 1994. Spencer, R. "The streamlined cognitive
  walkthrough method." *CHI 2000* (the question wordings above paraphrase; Spencer
  quotes Wharton et al.'s four in his Table 1).
- Bailey, R. W., Wolfson, C. A., Nall, J., Koyani, S. "Performance-Based Usability
  Testing." In *Human Centered Design*, HCII 2009 (first-click success predicts
  task success).
- Amershi, S. et al. "Guidelines for Human-AI Interaction." *CHI 2019* (carried
  over from the v1.0 explainer for tools with AI features; not yet expanded into
  criteria here).

## 8. Log

- 2026-08-29: v0.1 drafted by CC-15 (TEA-1400). Research fan-out across seven
  source clusters with adversarial citation verification; nine attribution errors
  caught and corrected before writing (editions, bylines, withdrawn ISO editions,
  institute short forms). First applied to the Q-CRAFT Explorer audit
  (docs/hcd-audit-2026-08.md in the QCraft-App repo).
