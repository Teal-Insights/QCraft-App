# Lane 4: Course restructure, Modules 0-6 (TEA-948)

You are one of four parallel agent lanes building toward the Sept 1 (Tue, 2pm EAT) Uganda Ministry of Finance QCraft training (Linear TEA-952). Audience: the Uganda MoF macro team AND the Climate Finance Unit. Dual objective: participants can RUN the tool and UNDERSTAND what they are doing. This lane does the mechanical restructure: reflow the existing Quarto companion guide (docs/companion-guide/) into the approved module skeleton. Mostly moving, not rewriting. You run unattended; Teal reviews via your report and git log.

## Hard rules
- Work ONLY inside this clone. No git push, no adding remotes. Commit locally to feat/lane4-course, small and frequent.
- Read AGENTS.md and CLAUDE.md at the repo root FIRST, then the design spec: ALL docs in /Users/teal_mac_mini_25/Library/CloudStorage/GoogleDrive-lte@tealinsights.com/My Drive/01-PROJECTS/_Professional/2026-07_IMF-CD-Pedagogy/ (read-only). The Course Redesign doc is your blueprint; the Pedagogy Toolkit chapter template is your module structure; the Explainer Toolkit governs any explanatory prose you touch.
- Style guides bind any prose you write (read-only): /Users/teal_mac_mini_25/Dropbox/lte-workbench/context/style-guide-writing-AI.md and style-guide-writing-me.md. No em-dashes anywhere.
- Read /Users/teal_mac_mini_25/candidates/qcraft-sprint-2026-08-26/SHARED/REFERENCE-NOTES.md for binding facts (parity wording, climate-source correction, capstone definition).
- Maintain MORNING-REPORT.md at the clone root. If blocked >30 min, write BLOCKED-<topic>.md and move on.

## Approved skeleton (Teal, 2026-08-26); one .qmd per module
- M0 "Start here: what you will walk into the PS's office with": behavioral self-assessment (anchored options), 3 concept-inventory questions, Path A/B/C routing, capstone stated up front (the export packet + a two-paragraph Fiscal Risk Statement draft).
- M1 "One equation decides the debt path, and seven modules feed it": keep the MoF-economist vignette; add course concept map (mermaid, revisited each module with current node lit); the run-Uganda-in-10-minutes early win; rebuild current section 1.2.2 as a table plus one mini-diagram per module plus a self-check. Parity story appears here ONCE as a trust-builder.
- M2 "You already know the debt equation": Path A module; r-minus-g and the primary balance by completion (partial concept maps, predict before touching the app).
- M3 "Every parameter is a judgment call you can defend": keep What/Why/How-to-set; upgrade every "See the effect" to predict-observe-explain; one judgment-call self-check per parameter; add document-your-rationale moves pointing at the export packet.
- M4 "Uganda end to end: from assumptions to the Fiscal Risk Statement paragraph": worked case with backward fading; insert SCREENSHOT-TODO placeholders (never fabricate screenshots); target output format = the IMF C-PIMA presentation of Q-CRAFT results (local summary PDF path in SHARED notes) and Uganda's FRS.
- M5 "Know what the tool cannot tell you": conservatism caveats, debt-floor asymmetry, structured country comparisons, which-tool-when (Q-CRAFT vs LIC-DSF, both directions).
- M6 "The capstone: your analysis, defended": capstone brief + rubric; wrapper mirroring M0 so progress is visible.
- Part 3 (co-design / SovTech vision) relocates to appendix-codesign.qmd, out of the learning path; fix the Preface description accordingly.

## Binding content rules
- Parity claims exactly per SHARED notes; never broader. Fix the README "NGFS Phase IV" error in this clone (correct: FADCP Climate Dataset, Centorrino, Massetti and Tagklis 2024, building on Kahn et al. 2021) and sweep guide prose for the same error.
- Behavioral objectives (Bloom action verbs, 3-5, workplace performances) on every module.
- Show-don't-tell: where the tool removes toil (auto data loading, guidance at point of need, documented rationale, fast polished output), demonstrate factually in the flow. No marketing language in modules; the SovTech pitch lives only in the appendix.
- JUDGMENT SECTIONS: for genuinely new load-bearing prose (M0 questions, M2 fresh explanations, M4 interpretation, self-check answers) write best-effort text inside clearly marked "DRAFT FOR TEAL:" callout blocks. Do not imitate finished Teal voice on new arguments; he rewrites those.
- Try to download the latest Uganda Fiscal Risks Statement (finance.go.ug or budget.finance.go.ug, read-only GET) into source-materials/; if found, cite its real structure in M4; if not, BLOCKED note with URLs tried.
- `quarto render docs/companion-guide` must pass before you finish (quarto is at /usr/local/bin/quarto).

## Definition of done
All module files exist and render; existing prose relocated per the blueprint; objectives, concept-map scaffolds, and self-check scaffolds in place; TODO and DRAFT-FOR-TEAL markers inventoried in MORNING-REPORT.md with counts per module.
