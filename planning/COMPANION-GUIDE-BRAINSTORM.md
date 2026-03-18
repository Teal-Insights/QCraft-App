# Q-CRAFT Companion Guide — Brainstorm

**Date:** 2026-03-17
**Author:** Teal Emery + Cowork (Opus)
**Status:** Brainstorming — do NOT write spec until this is complete
**Deadline:** Wednesday March 18 (first meeting), Friday March 20 (TNC workshop)
**Format:** Quarto book → HTML (live companion site) + PDF (leave-behind)

---

## Section 1: What We're Building

An **educational companion guide** for Q-CRAFT Explorer — not a user manual (the IMF
already has one), but an actionable learning resource that helps smart, busy economists
understand what they need to know to run and interpret the model effectively.

### Reference models (Teal's own prior work)

- **Teal Insights Guide to WBIDS**: https://teal-insights.github.io/teal-insights-guide-to-wbids/
  Three-part structure (Foundations → Applied Analysis → Wrapping Up). Motivation-first
  opening that leads with "why should you care" before technique. Unfinished but shows
  the pattern: policy applications before data mechanics. Gap: no diagrams or callouts
  (we should fix that here).

- **Applied Data Analysis for Chinese Debt Data**: https://teal-insights.github.io/data_analysis_for_chinese_debt_data/
  Four-week bootcamp structure. KEY INSIGHT: reverses traditional sequence — shows cool
  results first (charts, reports), THEN teaches the mechanics. "Eat your vegetables"
  solved by earning motivation through early wins. Uses callout boxes, incremental
  code examples, "Go Deeper" resource sections, and LLM-assisted learning.

### Teal's Section 1 Notes (logged 2026-03-17)

**Start with something interesting.** People are busy. Tell them why this is interesting,
what it actually affects. The IMF user manuals, even well-done ones, are boring. You need
to lure people into the "eat your vegetables" part. Same pattern as the Chinese debt
data guide — show them something motivating first.

**MVP callout boxes.** In the preface AND in Part 3, we need explicit callout boxes saying:
"This is an initial version — a starting point, not a final product. We want to co-design
the next version with you." Make it very clear this is an MVP. Best word TBD — "initial
version" or "proof of concept" or "starting point" rather than "MVP" (economist audience).

**Don't shit on Excel.** Lots of people love Excel, have used it for decades, feel
comfortable with it. Frame the positives of the new approach instead:
- Modular: can build different front ends for different people
- Automatic data updates from APIs
- More ways to output data meaningfully → reduce analytical toil
- Reduce copy-paste errors and human error
- Allow people to focus on actual analysis and policy decisions — think at a higher plane
- Open source (MIT licensed) — anyone can use it for free
- Extensive unit testing + continuous integration (explain in economist-friendly terms)
- Version control = you can make sure it's doing what it says it's doing

**Integrate with the actual tool.** Every parameter in the app (demographic variant,
debt target, fiscal rule, etc.) should link to the companion guide section explaining
what it means, how to figure it out, what it actually does.

**"Here's where to go deeper" at the end.** Not trying to be comprehensive — point to
the official user manual, academic papers, and other resources. Same pattern as the
Chinese debt data guide's hierarchical resources (Essential → Inspiration → Advanced).

**C-PIMA country assessments as value-add.** Download C-PIMA reports for multiple
countries (Uganda already in repo, plus Papua New Guinea, Colombia, Barbados, Pakistan,
Togo, Mozambique, Burkina Faso, Jordan). These contain methodological annexes with
the model parameters used for each country. Cataloging these would be a huge value-add
— showing "here's what they used for Uganda, here's what they used for Mozambique..."

**Three parts, three audiences:**

| Part | Title (working) | Primary audience | Secondary |
|------|----------------|-----------------|-----------|
| 1 | Policy Relevance & How Q-CRAFT Works | Kevin/Plamen (Wednesday) | All |
| 2 | Using the Explorer | MoF economists (CD workshops) | All |
| 3 | Co-Design Invitation & SovTech Vision | Kevin/Plamen + TNC (Friday) | All |

**Core pedagogical principles** (from Teal's teaching experience):
- SMART learning objectives at the top of each section
- Tell people what you'll teach them, teach it, show they learned it
- Define technical terms in context — upskill readers into the language
- Visual mental maps and diagrams for conceptual understanding
- Clear navigation tree — well-organized so people can find what they need
- Linked from the app UI: every parameter → explanation of what it means
- Use clear language; when using technical language, always define in context
- Good use of diagrams to give people mental maps — visual understanding

**What this is NOT:**
- Not a redo of the IMF User Guide (that exists)
- Not a software manual (click here, then here) — though it should integrate
  seamlessly with the actual tool
- Not an academic paper — but a place to get started, with links to go further

### C-PIMA Documents Available

Already in repo (`source-materials/`):
- `2024_IMF-FAD_Uganda-C-PIMA-Full-Report.pdf` — includes Annex II (Setting Up Q-CRAFT)
  with methodological parameters
- `2024_IMF-FAD_Uganda-C-PIMA-Summary.pdf`

Available for download (IMF):
- Papua New Guinea, Colombia, Barbados, Pakistan, Togo, Mozambique, Burkina Faso, Jordan
- C-PIMA Handbook (2025): https://www.imf.org/en/-/media/files/publications/books/2025/english/cpimaea.pdf
- Assessment portal: https://infrastructuregovern.imf.org/content/PIMA/Home/PimaTool/C-PIMA.html

---

## Section 2: Existing Decisions + Teal's Extensions

### Decisions that carry forward:

| Decision | Answer | Source |
|----------|--------|--------|
| Writing style | Chapeau sentences, plain language, active voice, concrete before abstract, 3-5 sentence paragraphs, no em dashes | BRAINSTORM Q6.4 |
| Hero chart | Debt-to-GDP fan chart (baseline + climate scenarios) | BRAINSTORM Q3.1 |
| Narrative depth | 2-3 sentence summaries per chart, not full paragraphs | BRAINSTORM Q3.3 |
| Export priority | CSV first (economists want data), then charts | BRAINSTORM Q3.4 |
| Positioning | SovTech proof of concept — same math, better experience, platform for what's next | BRAINSTORM Q5.3 |
| Design philosophy | Three-layer V1: (1) Match Excel, (2) Link guidance at point of need, (3) Improve with feedback | SPEC §2 |

### Teal's Section 2 Notes (logged 2026-03-17)

**Writing style extensions beyond BRAINSTORM.md:**
- Learning objectives (or equivalent) at the top of each section — not necessarily
  called "learning objectives" but something that tells busy people: is this section
  for you? Is it worth your time?
- Good headings and subheadings — this is a design problem, not a writing problem
- Table of contents per page (easy in Quarto) so people can jump to what they need
- Respect busy people's time — many readers won't read cover to cover, they'll go
  straight to what they need. Design for that navigation pattern.

**The design problem framing.** If you open the IMF user manual and try to figure out
what the correct productivity input is and what it actually means — it's hard. It's not
written for that. It's not clear how to do it. The companion guide solves this by making
every parameter findable and understandable at point of need.

**Positioning/SovTech — expanded notes:**
- Underneath there's a Python package with strong testing that adheres completely to Excel
- The advantages: easier to update data automatically, better graphics, any sort of front
  end, different users can get different things based on their needs
- This idea of co-design: put out the first thing, get feedback, easily make changes
- Don't poop on Excel — say positive things: "here's a whole new interesting toolkit"
  that complements what people already know
- Building on SupTech and RegTech — central banks have been doing this for a long time
  (see SovTech paper below)
- One-size-doesn't-fit-all is a key message: different front ends for different users,
  same engine underneath

**Design philosophy — confirmed:**
- Match Excel first, then improve, then get feedback
- If there are different users with different needs, we can serve them all — this is
  one of the beauties of modular architecture

### SovTech Conference Paper (4th Public Debt Management Conference, Paris, Sept 2026)

**Authors:** L. Teal Emery (Teal Insights) + Arend Kulenkampff (NatureFinance)
**Theme:** Digitalization and Innovation in Public Debt Management

This paper IS the intellectual framework for Part 3 of the companion guide. Key frames:

**The hidden costs of the status quo:**
- LIC-DSF Excel template: 86 tabs. No one can fully verify all formulas.
- No unit testing, version control, or regression testing possible in Excel.
- Modifications are slow and error-prone.
- "The rigidity of the tool constrains the analytical imagination of the people using it."
- Scenario analysis limited by cost of manually configuring each run.
- Complexity creates dependency on external advisors rather than building domestic capacity.

**Three SovTech principles:**
1. **Modularity that respects how people actually work.** Components like building blocks.
   Same engine → different front ends (web for policymakers, direct for analysts who code).
   Human-centered design applied to sovereign debt.
2. **Open source as institutional infrastructure.** Transparency = anyone can examine how
   analysis is done. Community-maintained rather than vendor-locked. Potential housing
   in Debt Management Facility.
3. **AI as enabler, with a trust layer.** Cost of building analytical software has dropped
   dramatically. LLMs make it feasible to build tailored tools for resource-constrained
   offices. But sovereign debt analysis serves policy decisions worth billions —
   human-in-the-loop verification and quality governance matter.

**SupTech lineage:**
- Arend co-authored BIS's "The SupTech Generations" (di Castri, Kulenkampff, Hohl, Prenio 2019)
- Cambridge SupTech Lab: 197 financial authorities across 140 countries have deployed ≥1 solution
- "The question is no longer whether technology-driven tools belong in public financial
  institutions. The question is when sovereign debt management will catch up."

**Paper outline (9 sections):**
1. The case for SovTech
2. From SupTech to SovTech
3. The analytical problem (how DMOs work today)
4. SovTech principles
5. Architecture (execution layer / web interface distinction)
6. AI in debt management (trust problem, verification workflows)
7. Practitioner experience (design sprints with country officials)
8. Institutional sustainability (DMF housing, governance)
9. Toward an ecosystem

**KEY INSIGHT FOR COMPANION GUIDE:** Q-CRAFT Explorer is the concrete proof-of-concept
that makes the SovTech paper's argument tangible. The companion guide should position
the tool as "here's what SovTech looks like in practice" — earning credibility through
the working demo before pitching the bigger vision.

### Research from Teal's Existing Guides (subagent analysis)

**From the Chinese Debt Data guide — replicable patterns:**
- "Cool things first, then mechanics" — show a complete result, then explain how
- Callout boxes for tips, notes, gotchas, practice exercises
- Resource hierarchy: Essential → Inspiration → Advanced
- LLM integration: position Claude as a 24/7 tutor, not a replacement
- Scaffolded progression: toy data first, real complexity later
- CLEAR framework for data storytelling (Color, Limited types, Explanatory elements,
  Audience targeting, References)
- Honesty about limitations: "You won't become an expert, but you will be able to..."
- Conversational tone with familiar analogies

**From the WBIDS guide — replicable patterns:**
- Three-part structure (Foundations → Applied → Wrapping Up)
- Motivation-first opening with stakeholder relevance (5 audiences, 5 applications)
- Policy applications follow identical template: Brief Intro → Research Example → Policy
  Relevance Statement (consistency aids comprehension)
- Practical guidance section with actionable recommendations
- Gap to fix: no diagrams, no callouts, no visual elements (companion guide should add these)

### "How Learning Works" — Seven Principles Applied to the Companion Guide

Source: Ambrose et al. (2010), "How Learning Works: Seven Research-Based Principles
for Smart Teaching." Copied to `source-materials/Ambrose-et-al-2010-How-Learning-Works.pdf`.

**The seven principles** (ranked by relevance to a written guide for busy economists):

| # | Principle | Relevance | Application to Companion Guide |
|---|-----------|-----------|-------------------------------|
| 1 | **Prior knowledge helps or hinders** | CRITICAL | Economists know fiscal policy but may have misconceptions about THIS model (e.g., assuming fiscal adjustment is additive when it's multiplicative). Activate what they know; surface where THIS model differs. |
| 2 | **Knowledge organization matters** | CRITICAL | Show the big picture FIRST (conceptual diagram of 7 modules). Experts organize around deep principles; novices have isolated facts. Make the architecture explicit before details. |
| 3 | **Motivation = value × expectancy** | CRITICAL | The "eat your vegetables" problem. Three value types: attainment ("master this"), intrinsic ("elegant dynamics"), instrumental ("defend projections to legislators"). Front-load motivation. Minimize perceived cost. |
| 4 | **Mastery = components + integration + transfer** | HIGH | Break fiscal logic into component skills. Experts have "blind spots" — they skip steps unconsciously. Isolation → integration → transfer to reader's own country. |
| 5 | **Goal-directed practice + feedback** | HIGH | Worked examples at each step. Self-check questions (not quizzes). "Predict what happens, then check." |
| 7 | **Self-directed learning needs metacognitive support** | HIGH | Busy professionals reading alone need: checklists, self-assessment prompts, "if you can't explain X, reread Y." |
| 6 | **Climate/development matters** | LOWER | Less relevant for written guide, but: normalize struggle, don't assume readers are "bad at math" if confused. |

**Key actionable patterns for our guide:**

1. **Activate prior knowledge, then bridge.** "In your experience with fiscal policy,
   you've seen X. Our model formalizes this as Y." Explicitly flag where the model
   DIFFERS from common assumptions (multiplicative not additive, debt floor asymmetry).

2. **Big picture before details.** Show the 7-module flow diagram BEFORE any module
   explanation. Readers should never wonder "why am I learning this now?"

3. **Chunk aggressively.** 10-15 minute self-contained modules. Each has one goal
   and stands alone for reference use.

4. **Scaffold difficulty.** Simple baseline → add fiscal rule → add feedback loop →
   add climate scenarios. Build competence step by step.

5. **Worked examples are essential.** Don't just explain logic — show Uganda flowing
   through the model step by step. Then show a different country. Then: "try yours."

6. **Surface misconceptions explicitly.** "Common misconception: fiscal adjustment is
   additive. Actual: it's multiplicative. Here's why additive thinking fails..."
   Repeat key rules in multiple contexts (one correction isn't enough).

7. **Self-check questions.** Not factual recall ("What is the fiscal rule?") but
   application ("Your country's debt just rose 5%. What adjustment does the fiscal
   rule trigger? Try it before reading the answer.")

8. **Decision trees and checklists externalize cognitive load.** "Before you trust
   your projection: ☐ Baseline expenditure plausible? ☐ Fiscal rule applies?
   ☐ Debt floor appropriate for scenario?"

9. **Headings should reveal task goals, not just topics.** Weak: "Fiscal Feedback."
   Strong: "When Does Fiscal Feedback Amplify Debt Growth?"

10. **Address beliefs about learning.** "You don't need to be a mathematician. You
    do need to understand the logic, which takes practice. Even experts find parts
    non-intuitive at first."

---

## Section 3: Style Guide Brainstorm

Before writing content, we need a clear style guide. This ensures consistency whether
Teal, Claude, or another agent writes content. The "How Learning Works" principles
above provide the theoretical foundation; these questions resolve the practical choices.

### Q3.1: How do we handle the spectrum from accessible to technical?

The guide serves both MoF economists who need intuition and IMF staff who want
to see the math. How do we layer this?

Options:
- (a) **Progressive disclosure in-page**: Start accessible, use expandable/collapsible
  sections for technical detail (Quarto has `{.callout-note collapse="true"}`)
- (b) **Separate tracks**: Main text is always accessible; technical appendix has the math
- (c) **Margin notes**: Main text is accessible; technical asides appear in the margin
  (Quarto supports this with `{.column-margin}`)
- (d) **Learning levels**: Each section has Level 1 (intuition), Level 2 (mechanics),
  Level 3 (math). Reader picks their level.

### Q3.2: How do we define technical terms?

When we first use a term like "expenditure rigidity" or "debt-to-GDP ratio":

Options:
- (a) **Bold + inline definition**: "**Expenditure rigidity** (the degree to which
  government spending resists downward adjustment) is set on a 0-1 scale..."
- (b) **Tooltip-style glossary**: Term is linked; hovering/clicking shows definition
  (Quarto can do this with footnotes or custom shortcodes)
- (c) **Sidebar glossary**: Running glossary in the margin alongside the text
- (d) **Separate glossary chapter**: All terms defined in one place, cross-referenced

### Q3.3: What visual/diagram style?

The guide needs mental maps and conceptual diagrams. What style?

Options:
- (a) **Mermaid flowcharts**: Code-generated, easy to maintain, built into Quarto
- (b) **Hand-drawn style** (Excalidraw): Feels approachable, less formal
- (c) **Clean vector diagrams**: Professional, matches Teal Insights branding
- (d) **Annotated screenshots**: Show the actual app with callout annotations

### Q3.4: Learning objectives format?

Each section starts with learning objectives. What format?

Options:
- (a) **"After this section, you will be able to..."** — classic pedagogical framing
- (b) **"Key questions this section answers"** — question-driven, feels less academic
- (c) **"What you need to know"** — direct, busy-person-friendly
- (d) **Icons + one-liners**: 🎯 Understand X, 🔧 Configure Y, 📊 Interpret Z

---

## Section 4: Part 1 Brainstorm — Policy Relevance & How Q-CRAFT Works

This part earns the reader's attention. If Kevin Carey reads nothing else, this should
convince him the approach is sound.

### Q4.1: What's the opening hook?

The first paragraph needs to land. What framing?

Options:
- (a) **The problem**: "171 countries need long-term fiscal projections that account
  for climate risk. The current tool is an Excel workbook that can't be audited,
  extended, or integrated..."
- (b) **The opportunity**: "What if fiscal projection tools were as modern as the
  economics they implement? Q-CRAFT Explorer puts the IMF's proven methodology
  in an open, auditable, extensible platform..."
- (c) **The user story**: "A fiscal economist in Malawi's Ministry of Finance opens
  an Excel workbook with 19 sheets and 200,000+ formulas..."
- (d) **The verification claim**: "We reimplemented the IMF's Q-CRAFT tool in Python
  and verified parity across 30 countries. Here's what we learned..."

### Q4.2: How do we explain the model without being a textbook?

Q-CRAFT has 7 modules (demography, productivity, inflation, baseline GDP, interest
rate, fiscal, climate). How much of the economics do we cover?

Options:
- (a) **One conceptual diagram + 1 paragraph per module**: Show how they connect,
  explain what each does in plain language. "Demography projects population and
  labor force. Productivity projects how much each worker produces..."
- (b) **Focus on the debt dynamics equation only**: The single equation that ties
  everything together (debt = f(growth, interest, primary balance, climate shock)).
  Everything else is an input to that equation.
- (c) **Three-level treatment**: (1) One-page overview with diagram, (2) Module-by-module
  with the key intuition, (3) Technical appendix with full math
- (d) **Decision-focused**: Only explain what the user can CHANGE (parameters) and
  what they should WATCH (outputs). Skip the internal mechanics entirely.

### Q4.3: Academic references — how much?

Kevin Carey will want to see that this is grounded. How do we cite?

Options:
- (a) **Light touch**: "Based on the Buffie et al. (2012) framework, extended with
  climate risk channels per IMF (2024)" — one sentence, move on
- (b) **Literature review section**: 1-2 pages positioning Q-CRAFT in the macro-fiscal
  modeling literature (MAC DSA, MTDS, LIC-DSF, Debt Sustainability Framework)
- (c) **Annotated bibliography**: Brief guide to "further reading" with 5-10 key papers
  and what each contributes
- (d) **Footnotes only**: References in footnotes, never in the main text

---

## Section 5: Part 2 Brainstorm — Using the Explorer

This is the actionable heart. Linked from the app UI — every parameter gets an
explanation of what it means and how to think about setting it.

### Q5.1: Structure of the parameter explanations?

For each input (e.g., "Debt Target", "Expenditure Rigidity"), we need an explanation.
What's the template?

Options:
- (a) **What / Why / How**: What is this parameter? Why does it matter? How should
  you set it? (with examples by country type)
- (b) **Decision tree**: "If your country is [LIC/EM/AE], typical values are..."
  with a flowchart
- (c) **IMF guidance excerpt + interpretation**: Quote the IMF User Guide, then
  translate into plain language with a recommendation
- (d) **Before/after chart**: Show what happens when you change the parameter.
  "Here's Uganda at rigidity=1.0 vs 0.0" — let the chart teach.

### Q5.2: How do we handle "Interpreting Results"?

After running the model, the user sees charts. How do we teach them to read them?

Options:
- (a) **Annotated chart walkthrough**: Take the actual Plotly charts from the app,
  annotate key features ("This inflection point is where the fiscal rule binds")
- (b) **"What to look for" checklist**: For each tab (Baseline, Climate, Analysis),
  list the 3-5 things the user should check
- (c) **Narrative templates**: "If your debt-to-GDP is [rising/stable/falling] and
  the climate scenario shows [X], this suggests [Y policy implication]"
- (d) **Comparison patterns**: "Compare your country to [peer group]. If your debt
  trajectory is steeper, it may indicate..."

### Q5.3: Do we include a "Quick Start" section?

Zero to analysis in 5 minutes — is this worth having?

Options:
- (a) **Yes, first thing after the overview**: 1-page "Select your country, see the
  baseline, check the climate tab, export your data"
- (b) **Yes, but as a separate quick-reference card**: One-pager PDF they can print
  and put next to their screen
- (c) **No — the app should be self-explanatory**: If we need a quick start guide,
  the UI has failed
- (d) **Embedded in the app, not the guide**: A "Getting Started" overlay or tour
  in the app itself

---

## Section 6: Part 3 Brainstorm — Co-Design Invitation & SovTech Vision

This is the strategic pitch. Earn credibility with the working tool (Part 1 + 2),
then pivot to the bigger vision.

### Q6.1: How do we frame the co-design invitation?

Options:
- (a) **Explicit ask**: "We've built V1. Here are 8 specific questions where we need
  your expertise to make V2 right. Will you join the co-design process?"
- (b) **Workshop format**: "The Friday TNC workshop includes a 30-minute co-design
  session. Here's what we'll discuss and how your input shapes the roadmap."
- (c) **Roadmap with gaps**: Show the feature roadmap with explicit "[needs IMF input]"
  labels. Makes it clear what's decided vs. what's open.
- (d) **User research framing**: "We'd like to observe how you use the tool and learn
  from what works and what doesn't. Can we schedule a 45-min session?"

### Q6.2: How do we position SovTech without overreaching?

The SovTech vision is ambitious. Kevin is a skeptic. How do we pitch it?

Options:
- (a) **Bottom-up from Q-CRAFT**: "Here's what we learned reimplementing one tool.
  Now imagine applying these principles to LIC-DSF, MTDS, MAC DSA..."
- (b) **Problem statement**: "Sovereign debt tools are fragile, opaque, and hard to
  extend. Here's a different approach: modular, open-source, human-centered."
- (c) **Show, don't tell**: Only show the working Q-CRAFT Explorer. Let the quality
  of the tool make the case. Don't explicitly pitch SovTech yet.
- (d) **Comparison table**: Current approach vs. SovTech approach — side by side on
  auditability, extensibility, collaboration, cost, time-to-update.

### Q6.3: What co-design questions should we surface?

From BRAINSTORM.md, we already have questions about defaults, workflows, and priorities.
Which are the TOP 5 for Wednesday?

Options:
- (a) Keep the existing 8 from BRAINSTORM.md Q5.2
- (b) Narrow to the 3 most decision-forcing:
  1. "What are the right default productivity growth assumptions by country type?"
  2. "How should the fiscal rule interact with climate scenarios?"
  3. "What's the first thing you'd want to improve?"
- (c) Frame as "design sprints": 5 specific feature mockups, each with a binary
  "would this be useful?" question
- (d) Open-ended discovery: "Show us how you'd use this in your next CD workshop"
  and observe what they do

---

## Section 7: Supplementary Research Needs

### Q7.1: Teal mentioned a book about how people learn (from CIS teaching).
Please share the PDF or title so we can extract style principles.

### Q7.2: Are there examples of good "companion guides" in the fiscal/development space?
(e.g., World Bank's BOOST documentation, IMF's MTDS guidance notes, DSA user guides)
that we should reference for tone and structure?

### Q7.3: Verification narrative
The verification results (from the Mac Mini overnight run) should be woven into
Part 1 as evidence. Template: "We tested parity across X countries covering Y% of
global GDP. N countries matched within 0.1 percentage points..." — but we need the
actual numbers first.

---

## Answer Log

*Answers go below. Each answer becomes a design decision for the spec.*

### Q3.1 (Technical layering):
**Answer: (a) Progressive disclosure in-page, with upskilling.**
Use collapsible sections for technical depth. But the key philosophy is to
**upskill people into technical language** rather than hiding it. When using
technical terms or equations: use named variables alongside Greek letters
(e.g., "growth rate (g)" not just "g"), talk through the intuition of what
equations mean in practice, explain what each piece does. Have empathy for
busy people's situation — they don't have time to decode notation, but they
CAN learn it if we meet them halfway.

### Q3.2 (Term definitions):
**Answer: Primarily (a) inline + parenthetical commas, with (b) and (d) supplements.**
Primary approach: inline definitions using parenthetical commas — "expenditure
rigidity, the degree to which government spending resists downward adjustment,
is set on a 0-1 scale." For domain terms: explain PRACTICALLY what values mean
("what does zero mean? what does one mean? in practice?"). Don't over-define
basics economists already know (debt-to-GDP ratio). DO define domain-specific
terms that even economists may not share (expenditure rigidity). Also use
tooltip-style for some terms where inline would break flow. Separate glossary
chapter for key terms as a reference, cross-linked.

### Q3.3 (Visual style):
**Answer: (a) Mermaid flowcharts, code-generated.**
Mermaid diagrams built into Quarto — easy to maintain, version-controlled.
Note: Eleanor Berger has a skill for rendering Mermaid to JPEG/image format
(worth exploring). Challenge: Mermaid charts can have text cutoff and overlap
issues on different screen sizes — need Playwright to verify rendering.
Annotated screenshots (d) will also be needed for the "Using the Explorer"
sections, but conceptual diagrams should be Mermaid.

### Q3.4 (Learning objectives):
**Answer: Between (b) and (c) — practical, down to business.**
Something between "Key questions this section answers" and "What you need to
know" — the vibe is getting straight to business. Not the classic academic
"After this section, you will be able to..." framing. Not icons. Just clear,
practical orientation for busy people: here's what this section covers and
why it matters to you.
### Q4.1 (Opening hook):
**Answer: Blend — lead with opportunity, grounded in user story, steel-man Excel.**
Not a straw man against Excel. Steel-man it: Excel is ubiquitous, people know it,
it exists for a reason. THEN put yourself in the shoes of a smart, busy economist
in an under-resourced low-income country finance ministry (like Uganda). They open
a 19-sheet workbook — it's unclear what assumptions to use, the data is stale if
you just downloaded it, it's hard to update, there's no record of whether someone
used defaults or did real analysis. A year later, nobody can tell what was done.

The hidden costs of Excel: countries need technical assistance and capacity
development just to use these spreadsheets. The IMF flies economists business
class to small island states ($20k+ per trip) to help with Excel workbooks.
That money could be better spent if practitioners started from a higher base.

The opportunity: what if there was another way? Ministries spend more time on
analysis, less on data wrangling and copy-paste. IMF CD missions start from a
higher base and work on more useful things. A shared open-source ecosystem with
technically validated code that people can customize.

**Research task:** Have a subagent find IMF technical assistance and capacity
development budget figures from their annual reports — hard numbers make this
concrete.

### Q4.2 (Model explanation depth):
**Answer: Diagram-first with debt dynamics focus, connected to policy decisions.**
Lead with visual diagrams showing how the 7 modules connect. Text explains the
diagrams. But the conceptual center is the debt dynamics equation — everything
else is an input to that. And the framing is always: how does this inform policy
decisions? Not "here's the math" but "here's what drives your debt trajectory
and what you can do about it."

### Q4.3 (Academic references):
**Answer: (c) Annotated bibliography.**
"Further reading" section with 5-10 key papers and what each contributes.
Practical for busy readers who want to go deeper on specific topics. Position
Q-CRAFT in the landscape (Buffie et al. 2012, LIC-DSF, MAC DSA, MTDS, C-PIMA
framework) without a full literature review in the main text.
### Q5.1 (Parameter explanation template):
**Answer: All four, layered. Short What/Why/How + decision tree + IMF guidance + before/after.**
Each parameter gets:
1. Very short What/Why/How (a few sentences)
2. Decision tree for choosing values by country type
3. IMF User Guide reference — "see page X of the user manual" — explicitly linking
   to WHERE in the IMF docs this is discussed. Important: Friday's meeting includes
   people who probably wrote that user manual. Show we're pointing people toward their
   work, not replacing it.
4. Before/after intuition: "When it's zero, here's what the chart looks like. When
   it's one, here's what it looks like." How sensitive is it? How does it affect the
   debt dynamics equation? Let the visual comparison build intuition.

### Q5.2 (Interpreting results):
**Answer: All of the above, prioritized.**
Layer all four approaches:
1. Annotated chart walkthrough — what does the chart look like, what are key features
2. What-to-look-for checklist — checklists are amazing for busy people
3. Narrative templates — "if your debt-to-GDP is rising and climate shows X..."
4. Comparison patterns — peer group context
Prioritize order for the spec, but include all. Each serves a different reader mode
(visual learner, checklist person, narrative thinker, comparative analyst).

### Q5.3 (Quick start):
**Answer: Both — in the guide AND in the app.**
In the guide: early on, a "if you're reading this because you need to run this NOW,
go here and follow this checklist" link. Practical reality: people will have two
windows open — the app and the guide side by side on their screen.

In the app: a built-in quick-start checklist. "Want to run this quickly? Here's the
checklist. Want to understand in detail? Here's the companion guide." The app and
guide cross-reference each other.
### Q6.1 (Co-design framing):
**Answer: (a) Explicit ask + specific questions.**
Be direct: "We built V1. Here are specific questions where we need your expertise.
Will you join the co-design process?" Make it easy for them to say yes — concrete
asks, low commitment, clear value.

### Q6.2 (SovTech positioning):
**Answer: Bottom-up from Q-CRAFT, with strategic framing around the LIC-DSF.**

**The core pitch:** Q-CRAFT Explorer is a proof of concept in miniature for what
we want to do with the LIC-DSF. The LIC-DSF is substantially more complicated
(DIGNAD model, many more assumptions), substantially more important to the IMF
and World Bank, and they're creating a new template for 2027 as part of the
LIC-DSF review. We want to be their partners in building the software companion.

**What we're asking for (make the "yes" easy):**
- NOT official IMF endorsement (that requires board approval, political capital — impossible)
- NOT access to confidential pre-publication information (we work with the regular
  template until they publish the new one)
- NOT money (we're grant-funded, this is free, MIT licensed, anyone can use it)
- YES: continued communication so we build credibly
- YES: a few hours from a few people for design workshops
- YES: feedback on whether we're making something useful

**What we can offer:**
- Teal lives near DC — can come down any day for design workshops
- Can have something usable within a month if they want
- All work is MIT open source, free to use, no vendor lock-in
- Already done design sprints with ministries of finance (Uganda — but don't
  publish Uganda-specific details without MoF permission)

**The modularity argument (critical for Kevin):**
This isn't just a climate thing. The architecture is modular — right now we're
building connectors from climate macro models into the LIC-DSF, but the same
infrastructure supports different financing assumptions, other macro shocks,
different models. Do the LIC-DSF, then MAC SRDSF, then other assessments.
Start small, prove the collaboration model, scale from there.

**The scaling question (what IMF cares about):**
IMF works with every country in the world. They're dealing with the scaling
problem too. How do you not require specially trained people? Make it ergonomic
— Don Norman-style design that allows intelligent people to do it right quickly.
Q-CRAFT in miniature teaches us how to standardize that process and create
best practices that are actually usable by end users.

**The hidden costs of the status quo (for the opening hook):**
IMF CD budget is enormous — flying economists business class to small island
states ($20k+ per trip) to help with Excel. That money could be better spent
if practitioners started from a higher base. (RESEARCH TASK: find actual
IMF technical assistance budget figures from annual reports.)

**Tone:** We don't have this done. This is not completed. This is long, hard work.
But starting with small usable things is the best way forward. Be honest about
where we are — MVP, proof of concept, starting point.

**NOTE (git-ignore this section):** Specific details about IMF conversations
and their questions about scaling should NOT be in the published companion guide.
Frame generally: "Scaling analytical capacity is a shared challenge."

### Q6.3 (Top co-design questions):
**Answer: Frame Q-CRAFT as miniature version of the LIC-DSF problem.**
The explicit framing for Wednesday: "This is in miniature what we're dealing with
for DIGNAD and the LIC-DSF — there are just a lot more assumptions for DIGNAD that
are unclear how you reach them."

Priority questions should center on:
1. **Parameter guidance at point of need:** How do you provide actionable, ergonomic
   guidance while people are filling things out? Q-CRAFT has only ~3 parameters to
   set — that's the easy version. LIC-DSF/DIGNAD has many more. If we can solve
   the design problem here, we learn how to scale it.
2. **Default assumptions by country type:** What are the right productivity growth,
   expenditure rigidity, and other defaults? How should these vary?
3. **"What would you improve first?":** Open-ended discovery — where does the tool
   fall short of what you'd want for CD workshops?

The meta-point: doing this with Q-CRAFT teaches us how to do it at scale. It's
the miniature version of standardizing the process for creating inputs and making
best practices that are actually usable by end users.
### Q7.1 (Learning book):
**Answer: Done.** "How Learning Works" (Ambrose et al. 2010) extracted and applied.
See Section 2 above for the 10 actionable patterns.

**Writing for busy professionals — research findings:**

1. **50% less text.** Nielsen Norman Group: conciseness alone improves usability
   58%; combined with scannability and objectivity, 124%. Cut ruthlessly.
2. **Scannable headings as signposts.** Readers scan headings to decide what to
   read. Task-oriented headings ("When Does Fiscal Feedback Amplify Debt?") not
   topic headings ("Fiscal Feedback"). Critical for Quarto's sidebar TOC.
3. **One idea per paragraph, 2-4 lines.** Short sentences, simple word order.
   Applies even for specialist audiences. (Federal Plain Language Guidelines)
4. **Lead with action, bury background.** State purpose and bottom line first.
   Background at the end. Readers should know what to do before reading context.
5. **Lists and white space.** Break content into visual chunks. Large text blocks
   fail on screen and in PDF.
6. **Active voice, action verbs.** "The fiscal rule applies to baseline spending"
   not "Baseline spending is subject to the fiscal rule."
7. **Define terms inline or link to glossary.** Don't assume shared vocabulary,
   even among economists. (Aligns with Q3.2 answer above.)
8. **Objective over promotional.** Remove unsupported adjectives. Cite evidence.
   Builds credibility with policy audiences. (NNGroup)

Sources: Nielsen Norman Group, Federal Plain Language Guidelines (plainlanguage.gov),
GOV.UK Style Guide.

### Q7.2 (Reference companion guides):
**Answer: No strong references.** Teal hasn't seen any companion guides in the
fiscal/development space that are particularly good. Skip this — we're creating
the template, not copying one.

### Q7.3 (Verification narrative):
**Answer: Paint a picture, stay honest about progress.**
Show Python driving Excel, checking parameters across 30 countries. Diagrams
would be really good here — visual representation of the verification pipeline.
Frame as: "We complement Excel, not replace it. Our goal is to verify parity
and add extra functionality."

Key framing: we've made very good progress but we're not all the way done. Be
honest about where we are — this is a work in progress, showing strong results.

### Q7.4 (NEW: Validation approach for the guide itself):
**Answer: Council of Experts fact-checking, divided into chunks.**
The companion guide itself needs validation — we can't have hallucinations or
misquotes. Use the established Council of Experts approach (Claude, ChatGPT,
Gemini) to fact-check against the IMF User Guide and source materials.

Process:
1. Don't try to validate all at once — divide into key sections
2. Give each reviewer full context (relevant source docs) to check against
3. Make sure nothing contradicts the user guide or IMF materials
4. Flag anything uncertain for Teal to verify

### Meta-framing (applies to the whole guide):
**"This is a first draft showing the promise of SovTech in miniature."**
The point isn't to be complete and done. The point is to give Kevin, Plamen,
and the TNC audience a sense of what the shape of this kind of project could
be — and show the promise of SovTech in miniature. Frame it that way explicitly.
