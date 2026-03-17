# Council of Experts Process

**Purpose:** Multi-model AI review workflow for major design decisions.
**Created:** 2026-03-16 | **Last updated:** 2026-03-17

---

## What It Is

A structured review process where three AI models review a proposal in parallel,
each writing findings to a separate file. A synthesis phase consolidates and ranks
findings, then the original artifact is updated.

## Why It Works

Each model catches different things (from WORKFLOW-LOG Entry 3):
- **Claude Opus 4.6:** Tracing evidence chains, spotting missing investigation threads
- **ChatGPT 5.4 Pro (Codex):** Challenging assumptions, identifying alternative explanations
- **Gemini 3 Pro Deep Think:** Structural/technical consistency, formula verification, edge cases

Using all three is complementary, not redundant. First council review on oracle packets
yielded 112 findings: 23 bugs, 36 additions, 45 clarity improvements, 6 false positives.

## When to Use It

- Major design decisions (verification strategy, workflow architecture)
- Specification documents (oracle packets, SPEC sections)
- Investigation conclusions (WEO boundary, counter variables)
- Any artifact where "right for wrong reason" is a risk

Do NOT use for routine code changes covered by golden master tests and PR bot reviews.

## The 5-Step Workflow

### Step 1: Draft the Artifact
Cowork (or Claude Code) creates the first version of the document being reviewed.
Example: VERIFICATION-PROMPT.md, oracle packets, workflow plan.

### Step 2: Generate Review Prompts
Cowork creates three review prompts — one per model. Each prompt includes:
- The artifact to review
- Relevant context files (SPEC.md, CLAUDE.md, domain docs)
- Specific review questions tailored to each model's strengths
- Output format instructions (findings table + recommendations)

Prompts are saved to `prompts/council-reviews/` for the current review cycle.

### Step 3: Run Reviews in Parallel
Teal pastes each prompt into a separate terminal window:
- **Terminal 1:** Claude Code (Opus 4.6) with `--dangerously-skip-permissions`
- **Terminal 2:** ChatGPT Codex CLI or web interface
- **Terminal 3:** Gemini CLI or web interface

Each model writes its review to a designated file (e.g., `planning/reviews/<topic>-claude.md`).
Reviews run in parallel — typical wall-clock time: 5-15 minutes.

### Step 4: Synthesize Findings
Teal brings the three review files back to Cowork. Cowork:
1. Reads all three reviews
2. Categorizes findings: VALID BUG | VALID ADDITION | VALID CLARITY | FALSE POSITIVE
3. Identifies convergence (findings flagged by 2+ models) vs unique catches
4. Ranks by severity and actionability
5. Writes synthesis to `planning/reviews/<topic>-SYNTHESIS.md`

### Step 5: Apply and Iterate
Claude Code applies the synthesized fixes to the original artifact.
If the first round had >80% signal, consider a second round.
Stop after 2 rounds (signal drops to ~20% in round 2, ~0% in round 3).

## Convergence Framework (from Entry 4)

When is the review cycle done? After each round, ask:

1. **Are remaining findings novel or re-discoveries?** Re-discoveries = convergence.
2. **Do remaining fixes prevent silent or loud failures?** Fix silent; tolerate loud when tests exist.
3. **Are reviewers disagreeing with each other or with project rules?** That's noise, not signal.
4. **Signal-to-noise ratio:** Round 1 ~80%, Round 2 ~20%, Round 3 ~0%. Stop at 2 rounds.

## History of Council Reviews in This Project

| Date | Topic | Findings | Key Catches |
|------|-------|----------|-------------|
| 2026-03-15 | Autonomous workflow (7 questions) | ~40 | Walk-away watchdog, fresh invocations per function |
| 2026-03-16 | Oracle packets (7 modules × 3 reviewers) | 112 | Counter=1 bug, WEO boundary, stale REIMPL guide |
| 2026-03-16 | WEO investigation | 12 | Counter variable, demography contradiction |
| 2026-03-16 | PR #12 (2 rounds) | ~10 | NUL byte in pre-commit, stale WEO_MAX_YEAR |
| 2026-03-17 | Verification strategy | TBD | (this review cycle) |

## File Locations

- Review prompts: `prompts/council-reviews/<topic>-<model>.md`
- Review outputs: `planning/reviews/<topic>-<model>-review.md`
- Synthesis: `planning/reviews/<topic>-SYNTHESIS.md`
- This process doc: `planning/COUNCIL-OF-EXPERTS-PROCESS.md`
- Workflow log entries: `planning/WORKFLOW-LOG.md`
