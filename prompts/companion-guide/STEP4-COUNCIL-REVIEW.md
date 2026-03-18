# Council of Experts: Companion Guide Validation

## Overview

After writing all three parts, run the Council of Experts review to fact-check the companion guide against source materials. Three models review in parallel, findings are synthesized, valid fixes are applied.

**What we're checking:** Factual accuracy, consistency with IMF User Guide, no hallucinations, no misrepresentation of how the model works, nothing that contradicts the SPEC.

**Output location:** `reviews/companion-guide/` (consistent with `reviews/spec/` and `reviews/workflow/`)

**Naming convention:**
- `reviews/companion-guide/REVIEW-CLAUDE-OPUS.md`
- `reviews/companion-guide/REVIEW-CHATGPT.md`
- `reviews/companion-guide/REVIEW-GEMINI.md`
- `reviews/companion-guide/SYNTHESIS.md`

---

## Source Materials (read these BEFORE reviewing)

Each reviewer must read the companion guide files and the relevant source materials. The exact paths are listed here so reviewers do not need to search the repo.

### Companion guide files (the documents under review):
- `docs/companion-guide/index.qmd` — Preface (~250 words)
- `docs/companion-guide/part1-policy.qmd` — Part 1: Policy Relevance and How Q-CRAFT Works (~2,000 words)
- `docs/companion-guide/part2-using.qmd` — Part 2: Using the Explorer (~3,000 words)
- `docs/companion-guide/part3-codesign.qmd` — Part 3: Co-Design and the SovTech Vision (~1,500 words)
- `docs/companion-guide/glossary.qmd` — Glossary (10 terms)
- `docs/companion-guide/references.qmd` — References (8 annotated entries)

### Primary source materials (for fact-checking against):
- `source-materials/2024_IMF-FAD_Q-CRAFT-User-Guide-v10.pdf` — The authoritative methodology reference (38 pages). Read the FULL document. Key sections: pp. 10-12 (demography), pp. 12-14 (productivity), p. 14 (inflation), pp. 14-15 (interest rates), pp. 15-18 (fiscal rule/baseline), pp. 18-20 (climate scenarios/expenditure rigidity), pp. 25-36 (detailed methodology).
- `planning/SPEC.md` — Technical specification for the Python reimplementation (827 lines). Key sections: §4 (module specs), §5 (UI spec), §6 (testing).

### Supporting context (read if needed for specific claims):
- `planning/COMPANION-GUIDE-BRAINSTORM.md` — Design decisions and rationale for the guide
- `CLAUDE.md` — Domain rules (especially the 7 critical rules)
- `apps/qcraft-app/app.py` — Actual UI parameter names and tab layout
- `packages/qcraft-engine/src/qcraft_engine/` — Engine source code for verifying technical claims

---

## Finding Format (all reviewers must use this)

Every finding must follow this format for machine-parseable synthesis:

```markdown
## Finding N: [SHORT TITLE]

**Location:** [file:section or file:approximate-line-range]
**Category:** VALID BUG | VALID ADDITION | VALID CLARITY | FALSE POSITIVE
**Severity:** HIGH | MED | LOW
**Issue:** [What is wrong, with evidence from source materials]
**Source:** [Which source document contradicts or supports the claim — cite page/section]
**Fix:** [Specific edit to make, or "No fix needed" for false positives]
```

At the top of each review file, include a summary table:

```markdown
# Companion Guide Review — [Model Name]

**Reviewer:** [Model]
**Date:** 2026-03-17

## Summary

| Category | Count |
|----------|-------|
| VALID BUG | N |
| VALID ADDITION | N |
| VALID CLARITY | N |
| FALSE POSITIVE | N |

## Top 3 Recommendations

1. [Most important fix]
2. [Second most important]
3. [Third most important]

## Findings
[numbered findings below]
```

---

## Claude Opus Review Prompt

Open a fresh Claude Code terminal in the repo root. Run:

```
Read ALL of the following files before writing your review:

Source materials (read first):
1. source-materials/2024_IMF-FAD_Q-CRAFT-User-Guide-v10.pdf (all 38 pages)
2. planning/SPEC.md

Companion guide files (the documents under review):
3. docs/companion-guide/index.qmd
4. docs/companion-guide/part1-policy.qmd
5. docs/companion-guide/part2-using.qmd
6. docs/companion-guide/part3-codesign.qmd
7. docs/companion-guide/glossary.qmd
8. docs/companion-guide/references.qmd

Also read for domain rules:
9. CLAUDE.md (the 7 domain rules)

Your job is FACT-CHECKING. For each chapter, verify:

1. **Technical accuracy:** Does every claim about how Q-CRAFT works match the User Guide and SPEC? Pay special attention to:
   - The debt dynamics equation (compare against User Guide p. 31 and SPEC §4.6)
   - Module descriptions (all 7 — compare each against User Guide Section II.B and IV.A-B)
   - Parameter definitions (especially expenditure rigidity scale — verify against User Guide pp. 20, 35-36)
   - Climate scenario descriptions (verify scenario names, SSP mappings, and warming levels against User Guide pp. 18-19 and Table 1 on p. 33)
   - Fiscal rule mechanics (verify additive-in-levels, t-1 dependency against User Guide pp. 15-18 and SPEC §4.6)
   - Revenue assumption (constant revenue-to-GDP ratio — verify against User Guide p. 28)
   - Expenditure growth formula (multiplicative, not additive — verify against CLAUDE.md rule #2)
   - Debt floor asymmetry (baseline uses max(0, debt), climate does NOT — verify against CLAUDE.md rule #3)

2. **No hallucinations:** Flag anything that sounds plausible but isn't in the source materials. This guide will be shown to the people who BUILT the IMF tool — Tjeerd Tim and Jyoti Rahman. Errors destroy credibility instantly.

3. **Consistent framing:** Does the guide maintain the "complement Excel, don't replace it" framing throughout? Flag anything that sounds dismissive of the IMF's work or the Excel tool.

4. **IMF User Guide page references:** Are the page number references correct? The guide cites specific page ranges (pp. 10-12, pp. 14-15, pp. 15-18, p. 20, pp. 35-36). Verify EACH citation by reading the actual page in the PDF.

5. **Missing caveats:** The User Guide is careful to note limitations (p. 5: "stylized results," "conservative," "does not account for natural disasters, sea-level rise, tipping points"). Does the companion guide adequately convey these caveats?

6. **Reference accuracy:** Do all entries in references.qmd cite real papers with correct authors, years, titles, and publication venues? Cross-check against the User Guide's own References section (p. 37).

Write your review to: reviews/companion-guide/REVIEW-CLAUDE-OPUS.md

Use the finding format specified in prompts/companion-guide/STEP4-COUNCIL-REVIEW.md (summary table, top 3 recommendations, numbered findings with Location/Category/Severity/Issue/Source/Fix fields).
```

---

## ChatGPT Review Prompt

Upload the following files to ChatGPT:
- All 6 `.qmd` files from `docs/companion-guide/`
- `source-materials/2024_IMF-FAD_Q-CRAFT-User-Guide-v10.pdf`

Then paste:

```
You are reviewing a companion guide for the IMF's Q-CRAFT fiscal projection tool. The guide will be shown to senior IMF and World Bank economists who built or oversee this tool — specifically Tjeerd Tim and Jyoti Rahman (Q-CRAFT authors), Plamen (IMF), and Kevin Carey (World Bank).

Your role: SKEPTICAL READER. Assume the reader knows fiscal policy deeply and will catch any errors.

Review each chapter for:

1. **Would Kevin Carey push back on this?** Kevin is a senior World Bank economist and a healthy skeptic. Flag anything he'd challenge — unsupported claims, overpromising, hand-waving over methodology, claims about capacity development costs without evidence.

2. **Is the "steel man" for Excel convincing?** The guide claims to respect Excel while arguing for something better. Does the framing feel genuine or patronizing? Would someone who has used the Excel workbook for years feel respected?

3. **Are the co-design asks realistic?** Part 3 asks for collaboration. Are the asks actually easy to say yes to? Or are there hidden commitments that would make an institutional actor hesitate?

4. **Parameter guidance accuracy:** For each parameter explanation in Part 2, does the guidance match what the IMF User Guide says? Specifically:
   - Are the "typical values by country type" (LIC 40-50%, EM 50-70%) defensible from User Guide or IMF/WB frameworks?
   - Is the expenditure rigidity explanation correct (1.0 = rigid/worst case, 0.0 = flexible)?
   - Is the fiscal rule description accurate (additive in levels, depends on prior-year state)?
   - Are the climate scenario descriptions consistent with the User Guide's scenario table?

5. **Tone check:** Does this read like a credible peer talking to peers? Or like a vendor pitching a product? Flag any promotional language, unsupported superlatives, or marketing-speak.

6. **Missing perspectives:** What would an economist at a low-income country ministry of finance want to know that isn't covered? What about an IMF mission chief using this in a C-PIMA assessment?

Write your findings using this format for each finding:

## Finding N: [SHORT TITLE]
**Location:** [which file and section]
**Category:** VALID BUG | VALID ADDITION | VALID CLARITY | FALSE POSITIVE
**Severity:** HIGH | MED | LOW
**Issue:** [what's wrong, with reasoning]
**Fix:** [what to do]

Start with a summary table (VALID BUG: N, VALID ADDITION: N, VALID CLARITY: N, FALSE POSITIVE: N) and Top 3 Recommendations.

Save as: REVIEW-CHATGPT.md (I will place it in reviews/companion-guide/)
```

---

## Gemini Review Prompt

Open a Gemini CLI session or Gemini with Deep Think in the repo. Provide these files:
- All 6 `.qmd` files from `docs/companion-guide/`
- `docs/companion-guide/_quarto.yml`
- `planning/SPEC.md`

Then paste:

```
You are reviewing a Quarto book (companion guide) for structural quality and internal consistency. The book has 6 content files plus a config file, all in docs/companion-guide/:

Content files:
- index.qmd (Preface)
- part1-policy.qmd (Policy Relevance, ~2000 words)
- part2-using.qmd (Using the Explorer, ~3000 words)
- part3-codesign.qmd (Co-Design and SovTech Vision, ~1500 words)
- glossary.qmd (10 terms)
- references.qmd (8 annotated entries)

Config:
- _quarto.yml (Quarto book configuration)

Review for:

1. **Cross-reference integrity:** Do all internal links ([Part 1](part1-policy.qmd), [Part 3](part3-codesign.qmd), etc.) point to the correct files? Does Part 2 reference concepts from Part 1 consistently? Does the index link to all parts?

2. **Quarto syntax correctness:** Are all callout boxes (::: {.callout-*}), collapsible sections (collapse="true"), Mermaid diagrams (```{mermaid}), LaTeX equations ($$...$$), and definition lists (: term) valid Quarto syntax? Will this render without errors in both HTML and PDF?

3. **Style consistency across all 6 files:**
   - Do all parts use the same "What you need to know" callout pattern at the top?
   - Are heading levels consistent (# for chapter titles, ## for sections, ### for subsections)?
   - Are callout types used consistently (.callout-tip for actionable items, .callout-note for informational)?
   - Is the definition format in the glossary valid Quarto syntax for definition lists?

4. **Completeness:** Are there any placeholder sections ("Content forthcoming"), TODO markers, or incomplete content? Any sections that feel thin compared to others?

5. **Annotated bibliography in references.qmd:** Are these real papers with correct authors, years, titles, and publication details? Cross-check at least:
   - Kahn et al. (2021) — should be Energy Economics, vol 104
   - di Castri et al. (2019) — should be BIS FSI Insights No. 19
   - Tim and Rahman (2024) — should be IMF FAD, October 2024
   - Bellon and Massetti (2022) — should be IMF Staff Climate Note

6. **Glossary coverage:** Read through all three parts and list any technical term that is used but NOT defined in the glossary. Common candidates: "WEO," "LIC-DSF," "DIGNAD," "SSP," "DSA," "C-PIMA" (check if C-PIMA is in the glossary).

7. **_quarto.yml consistency:** Does the chapter list in _quarto.yml match the actual files? Are the format settings (theme, CSS, fonts) consistent with what the CSS file provides?

Write your review to: reviews/companion-guide/REVIEW-GEMINI.md

Use this format for each finding:

## Finding N: [SHORT TITLE]
**Location:** [file:section or file:line]
**Category:** VALID BUG | VALID ADDITION | VALID CLARITY | FALSE POSITIVE
**Severity:** HIGH | MED | LOW
**Issue:** [what's wrong]
**Fix:** [what to do]

Start with a summary table and Top 3 Recommendations.
```

---

## Synthesis

After all three reviews are saved to `reviews/companion-guide/`, run the synthesis in a Claude Code session:

```
Read the three review files:
- reviews/companion-guide/REVIEW-CLAUDE-OPUS.md
- reviews/companion-guide/REVIEW-CHATGPT.md
- reviews/companion-guide/REVIEW-GEMINI.md

Synthesize into reviews/companion-guide/SYNTHESIS.md following the established format
(see planning/reviews/verification-SYNTHESIS.md or planning/oracles/reviews/SYNTHESIS.md
for examples of the expected structure).

Your synthesis must include:

1. **Summary Statistics table** — counts by category (VALID BUG / VALID ADDITION / VALID CLARITY / FALSE POSITIVE) broken out by reviewer.

2. **Convergence section** — findings flagged by 2+ reviewers, listed first. These are highest confidence.

3. **All Findings table** — every finding across all three reviews, deduplicated, with columns:
   | # | Finding | Reviewer(s) | Category | Severity | Action |

4. **For each valid finding:** Write the specific edit (file, section, old text → new text).

5. **Apply all valid fixes** to the docs/companion-guide/*.qmd files directly.

6. **Commit** with message: "fix: apply council review findings to companion guide"

Classification rules:
- VALID BUG: Factually wrong, contradicts User Guide or SPEC, or would embarrass us in front of the IMF team
- VALID ADDITION: Missing information that would strengthen the guide
- VALID CLARITY: Not wrong, but could be clearer or more precise
- FALSE POSITIVE: Reviewer concern is unfounded — explain why
```

---

## Execution Checklist

1. [ ] Create `reviews/companion-guide/` directory
2. [ ] Run Claude Opus review (Claude Code terminal)
3. [ ] Run ChatGPT review (ChatGPT web, upload files)
4. [ ] Run Gemini review (Gemini CLI or web)
5. [ ] Save all three reviews to `reviews/companion-guide/`
6. [ ] Run synthesis (Claude Code terminal)
7. [ ] Verify fixes applied correctly
8. [ ] Commit synthesis + fixes
