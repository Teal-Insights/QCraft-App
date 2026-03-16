# Q-CRAFT Workflow Log

Purpose: Running log of workflow decisions, pain points, lessons learned, and improvement ideas. Raw material for future workflow optimization.

---

## Entry 1: First PR Cycle — Golden Master Extraction (PR #8)
**Date:** 2026-03-15 to 2026-03-16
**PR:** #8 — Extract Uganda golden master CSV fixtures
**Tools used:** Claude Code, Cowork, GitHub Mobile + Copilot, Gemini Code Assist, Codex

### What Happened
- Claude Code extracted golden masters from Excel using AppleScript to switch country to Uganda and recalculate
- Created PR with 13 CSV files (7 intermediate modules + 6 climate scenarios)
- Codex and Gemini both auto-reviewed within minutes
- Both caught `#REF!` errors in climate scenario CSVs (debt_stabilizing_primary_balance column) — valid bug
- Gemini also caught year range inconsistency (some files 2099, others 2100) — valid issue
- Fixed #REF! and year range issues
- CI initially stuck ("Waiting for status to be reported" for 25+ min) — GitHub Actions wasn't enabled
- After enabling Actions, CI failed on ruff lint errors in test file added by Copilot
- Teal experimented with fixing via GitHub Mobile + Copilot while putting son to sleep — worked well for small fixes
- Claude Code then cleaned up remaining lint (import sorting, line length) and pyright type errors
- CI passed after 3 rounds of fixes
- Accidentally closed PR instead of merging (Close vs Merge buttons are adjacent)
- Reopened, then hit "Review required" block — can't approve your own PR as repo owner
- Removed approval requirement from branch protection (solo project, CI + automated reviewers are the quality gate)
- Successfully merged

### What Worked Well
1. **Adversarial review caught real bugs.** Both Codex and Gemini independently flagged #REF! errors — this would have broken every climate scenario test downstream
2. **Diversity of reviewers adds value.** Gemini caught the year range inconsistency that Codex missed
3. **GitHub Mobile + Copilot** for quick fixes while AFK is surprisingly useful
4. **Claude Code's structured approach** — fetched origin, checked CI logs, identified exact errors, fixed them systematically

### Pain Points & Friction
1. **GitHub Actions not auto-enabled** — wasted 25 min waiting for checks that never started. Need to verify Actions is enabled as part of repo setup checklist
2. **Can't approve own PRs** — GitHub design choice. For solo projects, remove approval requirement and rely on CI
3. **Close vs Merge confusion** — the buttons are right next to each other. Recoverable (reopen), but scary in the moment
4. **CI failures from linting** — Copilot's contributed code didn't pass ruff. Need pre-commit hooks to catch this locally before push
5. **Pyright + Polars type friction** — Polars `min()`/`max()` returns `PythonLiteral` which is a broad union type. Required workaround (`object` tuple type)
6. **Cowork VM doesn't sync to Dropbox** — had to use Desktop Commander to write files to Mac, or write a setup script. This is a recurring friction point for any file that needs to exist on the actual machine
7. **uv.lock in .gitignore** — tried to commit it, got blocked. Minor but shows the .gitignore needs to be understood early

### Workflow Decisions Made
1. **Removed PR approval requirement** — for solo project, CI + automated reviewers (Codex, Gemini, Claude Code Action) are the quality gate. Re-enable when adding human collaborators
2. **Added Claude Code as GitHub Action reviewer** (PR #10) — third automated reviewer alongside Codex and Gemini
3. **Pre-commit hooks should be added** — run ruff and pyright locally before push to avoid CI round-trips

### Ideas for Future Improvement
1. **Skill or checklist for "new repo setup"** — enable Actions, verify CI runs, test branch protection, confirm bot reviewers are connected. Would have saved the 25-min wait
2. **Pre-commit hook skill** — auto-generate appropriate hooks based on the project's linting/type-checking stack
3. **GitHub terminology guide** — personalized reference for PR workflow (branch → PR → review → CI → merge → delete branch), tailored to solo-project workflow. Teal uses Git regularly but PR mechanics aren't intuitive yet
4. **Educational material from these logs** — after the project, mine Cowork conversations + Specstory logs to identify: repeated questions, common confusions, places where guidance was needed. Build personalized reference docs
5. **Investigate uv.lock policy** — should it be committed (reproducible builds) or gitignored (generated artifact)? Current choice is gitignore but worth revisiting

### Git Concepts Clarified
- **Close** = cancel PR without merging (code stays on branch, doesn't go to main)
- **Merge** = incorporate branch code into main (what you usually want after review)
- **Squash merge** = collapse all branch commits into one clean commit on main
- **Delete branch** = cleanup after merge; safe because code is already in main
- **Approve** = formal review action (different from a comment); can't approve your own PR
- **Status checks** = CI jobs that must pass before merge is allowed

---

## Entry 2: Scaffold & Setup (Session A)
**Date:** 2026-03-15 to 2026-03-16

### What Happened
- Full repo scaffold created via Cowork session — 1,037-line setup-scaffold.sh
- Three-model cross-review of autonomous workflow (Opus, ChatGPT, Gemini) synthesized into blueprint
- Dual-CLI orchestrator designed (Claude Code primary, Codex fallback)
- Branch protection, Codex reviewer, Gemini reviewer, Context7 MCP, Playwright all configured
- 7 GitHub issues created for engine functions

### Pain Points
1. **Cowork VM → Dropbox sync failure** — files created in VM didn't appear on Mac. Required pivot to Desktop Commander (writing files directly to Mac) or a setup script approach. This was the biggest time sink of the session
2. **Desktop Commander 25-30 line chunk limit** — writing large files (AGENTS.md at ~150 lines, orchestrator at ~180 lines) requires many sequential writes. Tedious but works
3. **pyproject.toml missing `tool.uv.sources`** — `uv sync` failed until we added workspace source declaration. The scaffold script should have included this from the start

### What Worked Well
1. **Three-model review** — unanimous on key decisions (fresh invocations, kill Stop hook, Context7 mandatory), disagreed constructively on others. Valuable for high-stakes architectural decisions
2. **Setup-scaffold.sh approach** — once we pivoted to writing a bash script via Desktop Commander, it was reliable and repeatable
3. **Cowork for planning, Claude Code for execution** — good division of labor. Cowork for thinking through architecture and writing prompts, Claude Code for running commands and creating PRs

---

*Future entries should follow this format: What Happened, What Worked, Pain Points, Decisions Made, Ideas for Improvement*

## Entry 3: Oracle Packets & Council of Experts Review
**Date:** 2026-03-16
**PR:** #12 — Oracle packets, pre-commit hooks, WEO investigation, SPEC tracking
**Tools used:** Cowork (Opus), Claude Code (Opus), Codex deep think, Gemini CLI

### What Happened
- Created oracle packets for all 7 engine modules using Claude Code (reading SPEC, User Guide PDF, Excel analysis docs)
- Ran first council of experts review: Claude, Codex, and Gemini each reviewed all 7 oracle packets in parallel, writing to separate review files
- Synthesized 112 findings: 23 bugs, 36 additions, 45 clarity improvements, 6 false positives, 2 domain expert flags
- Incorporated all findings into oracle packets across 3 rounds (Claude → Codex+Gemini → Gemini additional)
- Launched WEO boundary investigation after noticing off-by-one discrepancies — found 3 wrong SPEC constants
- Expanded investigation with User Guide corroboration (inflation fallback, climate start year, cross-module consistency)
- Ran second council review on the investigation itself — surfaced 12 findings including a critical counter variable bug
- Resolved counter=1 vs counter=2 discrepancy by tracing actual Excel sigmoid formulas (both modules use counter=1 at 2030)
- Applied all remaining fixes from council review (8 text edits + Session B backlog)
- Resolved both "NEEDS DOMAIN EXPERT" flags without needing domain expert — evidence was in the User Guide and Excel all along

### What Worked Well

1. **Cowork + Claude Code division of labor is the killer combo.** Cowork is the thinking partner — conversational, holds project context, good at framing prompts, does web research, provides the "expert friend" experience. Claude Code is the execution engine — runs commands, edits files, commits, pushes. Neither is sufficient alone; together they cover the full workflow
2. **Council of experts has real additive value — not overkill.** Each model catches different things. Gemini found the demography contradiction and edge cases for incomplete data. Codex challenged the "derive don't hardcode" recommendation and questioned whether climate start is structural vs coincidental. Opus caught the counter variable ambiguity and missing Excel formula traces. With max plans for all three, it's "stupid not to" run them all
3. **The council workflow pattern is now repeatable:** (a) Claude Code creates first version, (b) three models review in parallel to separate files, (c) Cowork synthesizes and ranks findings, (d) Claude Code applies fixes. Total cycle time ~30-40 min for substantive documents
4. **Cross-referencing User Guide + Excel is extremely powerful.** The User Guide explains *intent*; the Excel formulas show *implementation*. Neither is sufficient alone. The inflation fallback question was answered by combining "a user could consider" (advisory language) with "no lookup table exists in the workbook" (implementation fact). This pattern applies to any economic Excel model
5. **Cowork digests prompts better than raw terminal.** The prompts Cowork frames for Claude Code are more effective because they include context, structure, and explicit success criteria. This is especially valuable for investigation-type work where the question needs to be precise
6. **Domain expertise was amplified, not replaced.** Teal's key insights were: (a) WEO updates often introduce off-by-one issues, (b) the WEO has 5-year forecast horizons, (c) Excel recalculation after country change can produce stale values. The council then did the forensic work to trace these intuitions to specific Excel cells. The human provides the "what to look for"; the models do the exhaustive checking

### Pain Points & Friction

1. **Gemini CLI needed approval for each file write.** Unlike Claude Code, Gemini required manual approval to write review files. This breaks the "parallel execution" model — had to babysit one terminal while the other two ran autonomously. Need to check Gemini CLI permissions settings
2. **planning/ directory gitignore confusion.** The blanket `planning/` ignore in .gitignore blocked oracle packets and SPEC from being tracked. Had to switch to specific file ignores. Then `planning/oracles/reviews/` was caught by a `reviews/` pattern — required `git add -f`. Gitignore management for mixed tracked/untracked planning dirs is fiddly
3. **Counter variable bug was invisible with Uganda defaults.** start=end=3.5% means any counter value produces 3.5% — the golden master can't distinguish counter=1 from counter=2. This is the exact kind of compensating error the oracle packets warn about. Only caught because the council forced systematic cross-checking between documents
4. **Context window limits in Cowork.** This session hit compaction, losing some earlier context. The workflow log and investigation documents served as external memory. Lesson: important decisions should be committed to files, not just discussed in conversation

### Decisions Made
1. **Oracle packets are tracked in git** — they're first-class planning artifacts, not throwaway notes
2. **NEEDS DOMAIN EXPERT items should be investigated before flagging** — both "domain expert" flags turned out to be answerable from existing source materials (User Guide + Excel). The council review process is better at extracting these answers than waiting for a human domain expert
3. **Investigation documents get council review before action** — the WEO investigation improved substantially after the council review. Findings 1 (counter), 2 (demography contradiction), and 3 (vintage attribution) would have caused downstream bugs
4. **Session B backlog created** — risks that aren't blockers get documented rather than ignored or fixed in an ad-hoc way

### Emerging Workflow Pattern: "Plan Slow, Act Fast"
The total time on oracle packets + investigation + council reviews is ~4-5 hours. This front-loads the hard thinking:
- 7 oracle packets × 3 reviewers = 21 review documents → 112 findings
- 1 investigation × 3 reviewers = 3 review documents → 12 findings  
- 2 "domain expert" flags resolved without domain expert
- 1 critical counter bug caught and fixed
- 8 IMF meeting questions battle-tested

This investment pays off in Session B: each autonomous agent invocation gets a thoroughly vetted oracle packet instead of raw SPEC text. Bugs caught in planning cost minutes to fix; bugs caught in implementation cost hours.

### Generalizable Lessons for Economic Excel Model Reimplementation
1. **The User Guide explains intent; Excel formulas show implementation.** Cross-reference both. When they conflict, Excel wins (it's the running code)
2. **Off-by-one errors cluster around data vintage boundaries.** WEO updates shift horizon years. Any SPEC written against one vintage will have systematic off-by-one errors when the workbook is updated to a newer vintage. Check the max year of every data series
3. **"Default parameters hide bugs" is a first-order testing concern.** Uganda's start=end values for inflation make the logistic function invisible. Always test with parameters that exercise all code paths
4. **IMF Excel models use indirect lookup architectures.** Both Inflation and Productivity sheets have a separate sigmoid lookup table (columns B-CV) that is NOT aligned with year columns. The output row references into this table. This indirection is natural in Excel but non-obvious when reading formulas
5. **The PYTHON_REIMPLEMENTATION_GUIDE (or equivalent) is the least reliable source.** It was wrong in 7/7 modules. Always verify against the actual Excel formulas, not a summary document someone wrote about the Excel
6. **Council of experts review catches different error types by model.** Gemini excels at structural/technical consistency (formula verification, edge cases, internal contradictions). Codex excels at challenging assumptions and identifying alternative explanations. Opus excels at tracing evidence chains and spotting missing investigation threads. Using all three is complementary, not redundant

### Ideas for Future Improvement
1. **Formalize the council workflow as a Cowork skill** — input: document path + review focus areas → output: three review prompts + synthesis template
2. **Create a "WEO vintage detector" utility** — given a macrofiscal parquet, automatically determine which WEO vintage it comes from based on max year and data availability patterns
3. **Parametric golden master tests** — test each module with parameters that exercise all code paths (start ≠ end for inflation/productivity, fiscal rule enabled, different interest rate modes)
4. **Mine this workflow log after the project** — extract repeatable patterns for "how to reimpliment an economic Excel model using multi-agent AI workflows"

---

## Entry 4: PR Review Convergence & Session B Strategy
**Date:** 2026-03-16
**PR:** #12 — Final review rounds and merge
**Tools used:** Cowork (Opus), Claude Code Review (GitHub Action), Codex (chatgpt-codex-connector), Gemini Code Assist

### What Happened
- Ran two rounds of GitHub council reviews on PR #12 after applying oracle packet fixes
- Round 1 (Claude Code Review): Found 8 issues across oracle packets and pre-commit hook. HIGH: 3 oracle packets still had stale WEO_MAX_YEAR=2028; pre-commit hook had xargs whitespace splitting, missed renamed files, hardcoded .git/hooks path. All 7 CLAUDE.md domain rules confirmed correctly documented
- Applied fixes (2 commits: oracle packets updated to 2029, hook hardened with null delimiters + ACMR + worktree support + workspace-wide pyright)
- Round 2 (all three reviewers): Claude found 2 remaining issues (pre-commit NUL-in-variable bug, interest_rate parenthetical 2029→2030). Codex confirmed NUL issue. Gemini re-flagged SPEC.md (correctly rejected per CLAUDE.md rules). All investigation conclusions validated by all three reviewers
- Applied final fixes and merged PR #12

### Review Cycle Convergence Framework

Key insight: **when is the review cycle done?** After running two full council review rounds, we developed this framework:

1. **Are remaining findings novel or re-discoveries?** Round 2's Gemini comments about SPEC.md were re-discoveries of a known constraint. That's convergence, not new signal
2. **Do remaining fixes prevent silent or loud failures?** The NUL byte bug was worth fixing (silent skip of linting). A wrong parenthetical would produce a test failure (loud). Fix silent failures; tolerate loud ones when safety nets exist
3. **Are reviewers disagreeing with each other or with project rules?** Gemini wanting to edit SPEC.md isn't a finding — it's a reviewer that doesn't understand constraints. That's noise, not signal
4. **Signal-to-noise ratio trajectory:** Round 1 was ~80% signal (real bugs). Round 2 was ~20% signal (one shell bug, one typo). Round 3 would be ~0% signal. Stop when the marginal review would be mostly noise

**General rule:** For planning documents with automated test safety nets downstream, two review rounds is the sweet spot. The first round catches systematic errors; the second round catches errors introduced by the first round's fixes. A third round finds stylistic preferences.

### Session B Strategy Decision

**Hybrid approach chosen:** Run Session B orchestrator autonomously (Teal at dinner), but disable auto-merge so GitHub bot reviewers run in parallel. Rationale:

- Oracle packets are prose (council review catches errors humans miss) → council was high-value for Session A
- Engine code has golden master tests (automated verification catches implementation errors) → council is lower marginal value for Session B
- GitHub bot reviews run for free, in parallel, while Teal is away → zero opportunity cost
- Teal scans 7 PRs after dinner, batch-merges clean ones, triages blockers for morning

**Key modification to orchestrator:** Comment out `gh pr merge --auto --squash` (line 117 of run-session-b.sh). Auto-merge fires before bot reviewers finish. PRs should stay open for review, then be manually merged after scan.

### Decisions Made
1. **PR #12 review cycle: done after 2 rounds.** Convergence framework applied — remaining findings were noise or constraint violations
2. **No plan changes needed for Session B.** Oracle packets now have correct WEO_MAX_YEAR=2029, correct employment growth logic, correct counter=1 at 2030. The front-loaded investment paid off
3. **Session B runs autonomously with no auto-merge.** Council reviews happen passively via GitHub bots, not actively via Cowork-mediated cycles
4. **Post-Session-B review is a scan, not a deep council.** If golden master tests pass and bot reviews are clean, merge. Only escalate to full council for blocked modules

### Ideas for Future Improvement
1. **Formalize "convergence framework" as a skill** — input: round N findings → output: recommendation to continue or stop, with signal-to-noise assessment
2. **Add `--no-auto-merge` flag to orchestrator** — rather than editing the script ad hoc, make it a CLI option for the review-then-merge workflow
3. **Orchestrator should request bot reviews explicitly** — add a `gh pr comment` after PR creation to trigger all three reviewers immediately

---

*Future entries should follow this format: What Happened, What Worked, Pain Points, Decisions Made, Ideas for Improvement*
