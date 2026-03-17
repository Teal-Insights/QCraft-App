# Companion Guide SPEC

**Date:** 2026-03-17
**Status:** First draft spec → immediate execution
**Format:** Quarto book → HTML + PDF
**Deadline:** Wednesday March 18 (Kevin/Plamen meeting)

---

## Structure

```
companion-guide/
├── _quarto.yml
├── index.qmd          # Preface + Quick Start link
├── part1-policy.qmd   # Part 1: Policy Relevance & How Q-CRAFT Works
├── part2-using.qmd    # Part 2: Using the Explorer
├── part3-codesign.qmd # Part 3: Co-Design & SovTech Vision
├── glossary.qmd       # Key terms
├── references.qmd     # Annotated bibliography
└── _common.scss       # Teal Insights branding
```

## Part 1: Policy Relevance & How Q-CRAFT Works (~2,000 words)

**Opening hook:** Steel-man Excel, then user story (smart busy economist in LIC MoF),
then opportunity (same math, better experience, open ecosystem).

**Sections:**
1. Why this matters (the hidden costs of the status quo)
2. What Q-CRAFT computes (7-module Mermaid diagram + debt dynamics equation)
3. How the Explorer works (diagram-first, text explains diagrams)
4. Verification: "We tested parity across 30 countries" (with diagrams)

**Style:** Diagram-first. Debt dynamics equation as conceptual center. Everything
framed as "how does this inform policy decisions?"

## Part 2: Using the Explorer (~3,000 words)

**Quick Start** at the top: "Need to run this now? Here's the 5-step checklist."

**Parameter explanations** (one subsection each):
- Country selection
- Demography variant (Medium/High/Low)
- Debt target (% GDP)
- Fiscal rule (Yes/No)
- Expenditure rigidity (0.0–1.0)

**Template per parameter:**
1. What / Why / How (3-5 sentences)
2. Decision guidance by country type
3. IMF User Guide reference ("see page X")
4. Before/after chart showing sensitivity

**Interpreting results** (one subsection per tab):
- Baseline tab: annotated walkthrough + checklist
- Climate tab: what-to-look-for + narrative templates
- Analysis tab: comparison patterns across scenarios

## Part 3: Co-Design & SovTech Vision (~1,500 words)

1. What we built and what we learned
2. The co-design invitation (explicit asks, easy yes)
3. Q-CRAFT as proof of concept for LIC-DSF
4. The SovTech vision (modular, open source, AI with trust layer)
5. What we're asking for / what we're NOT asking for

**Tone:** Honest about being a first draft. "This is long, hard work. Starting
small is the best way forward."

## Style Rules

- 50% less text than instinct says (NNGroup)
- Task-oriented headings ("When Does Fiscal Feedback Amplify Debt?")
- One idea per paragraph, 2-4 lines
- Lead with action, bury background
- Active voice, action verbs
- Inline term definitions with parenthetical commas
- Progressive disclosure: collapsible sections for technical depth
- Named variables alongside Greek letters (growth rate (g), not just g)
- "What you need to know" framing for section openers
- MVP callout boxes: "This is an initial version — co-design the next with us"

## Branding

- Colors: Navy (#2C3E50), Teal (#1ABC9C), Light Gray (#ECF0F1)
- Font: Inter
- Match app styling for visual continuity
