# Q-CRAFT Agent Rules

## Core Philosophy

Agents are brilliant but state-blind. We enforce discipline mechanically, not through prompts.

**Rules:**
- Plans are first-class artifacts (written before code, reviewed in morning)
- Source of truth (SPEC.md, golden masters, AGENTS.md) is read-only on engine branches
- Fresh invocations per function prevent context rot
- Intermediate golden masters are the alignment check (not PDF search or human review)
- PR reviews are asynchronous and batch — agents do not wait for feedback

## The Seven Domain Rules

1. **Fiscal recursion uses explicit Python for-loops, never vectorized Polars operations.** Row-by-row iteration with t-1 lookups. This is non-negotiable.

2. **Expenditure growth is multiplicative: (1+a)*(1+b)*(1+c).** Never additive. Never try to "fix" the dimensional inconsistency in fiscal adjustment — the design is intentional.

3. **Debt floor asymmetry: Baseline applies max(0, debt). Climate scenarios do NOT.** This is a critical domain rule. Check it in tests.

4. **Expenditure rigidity 1.0 = sticky (worst case), 0.0 = flexible.** Do not confuse this scale with other indexes.

5. **Golden master tests are the source of truth for parity.** Never hard-code expected values. Always load from CSV.

6. **Intermediate golden masters catch compensating errors.** An agent can get the right final answer by making two opposite mistakes. Tests must verify intermediate columns too.

7. **Use Context7 before writing Polars, Shiny, Plotly, or Playwright code.** These libraries evolve fast. Context7 prevents stale API patterns.

## Source of Truth Hierarchy

When sources conflict, follow this order:

1. Excel workbook formulas (highest authority)
2. Parquet data extracted from Excel
3. User guide PDF
4. SPEC.md
5. Agent's own reasoning (lowest authority)

## Change Request Protocol

If you discover the spec is wrong, ambiguous, or conflicts with implementation reality:

1. Create `.change-requests/<MODULE>-<DATE>.md` with:
   - What you expected (per spec)
   - What you found (in implementation)
   - Your proposed fix (if any)
   - Whether you worked around it or are blocked

2. Continue with the best workaround you can find.

3. Commit: `git commit -m "change-request: <MODULE> — see .change-requests/<MODULE>-<DATE>.md"`

4. Do NOT edit SPEC.md, AGENTS.md, TASKS.md, golden masters, or workflow files.

## Allowed Tactical Changes

You CAN:
- Rename variables, reorganize functions, restructure loops
- Choose Polars expressions vs Python alternatives
- Adjust test tolerance levels
- Add helper functions

You CANNOT:
- Change what a function computes (inputs/outputs)
- Switch libraries (Polars to pandas, Shiny to Streamlit, etc.)
- Restructure the package layout
- Edit SPEC.md, TASKS.md, AGENTS.md, or golden masters
- Edit `.claude/settings.json` or `.github/workflows/`

## API Staleness Prevention

Before writing code that uses **Polars**, **Shiny for Python**, **Plotly**, or **Playwright**, invoke Context7:

```
use context7 to fetch current documentation for [library-name]
```

Why: These libraries evolve rapidly. Your training data may be outdated. Context7 injects live, version-specific API docs.

### When to Use Context7

- Any nontrivial Polars `group_by`, `agg`, `map_elements`, or `pivot`
- Any Shiny for Python UI component
- Any Plotly chart or export configuration
- Playwright page automation
- Deployment tooling (uv, shinyapps.io)

## Session Isolation

You are running in one of these sessions. Respect the isolation:

**Session A (2-3 hours):** Scaffold + data extraction + golden masters
**Session B (3-4 hours):** Engine implementation via bash orchestrator (fresh invocation per function)
**Session C (2-3 hours):** UI + Playwright visual QA
**Session D (1-2 hours):** Deployment + README

You will NOT be notified about other sessions' progress. Assume main is always current with merged PRs from earlier sessions.

## Fiscal Rule Gotcha

The fiscal rule feedback loop depends on t-1 (prior-year state). **Do NOT vectorize this with Polars `.shift()` or `.cum_sum()`.**

Implement as explicit Python for-loop:

```python
for t in range(1, len(df)):
    # Lookup prior-year baseline
    prior_baseline = baseline[t-1]

    # Apply fiscal rule (may depend on prior state)
    fiscal_adjustment = compute_fiscal_rule(prior_baseline, ...)

    # Add to current-year expenditure (ADDITIVE in LEVELS, not a rate)
    current_expenditure[t] += fiscal_adjustment
```

Note: The fiscal rule adjustment is additive in LEVELS, applied AFTER the multiplicative growth factors. It is NOT a rate. Do NOT try to make it dimensionally consistent.

## Blocker Protocol

If you are blocked after 5 good-faith repair attempts:

1. Create `.blocked/<MODULE>.md`:
   ```md
   # Blocked: <MODULE>

   ## Issue
   [What is failing]

   ## Root Cause
   [Your best guess]

   ## What I Tried
   [Three specific repair attempts]

   ## Files Modified
   [List]

   ## Next Step
   [What needs to happen]
   ```

2. Commit: `git commit -m "BLOCK: <MODULE> — see .blocked/<MODULE>.md"`
3. Push: `git push -u origin feat/<MODULE>`
4. Exit 0 immediately (do not spin, do not retry)

The morning review will unblock you.

## Tests Must Pass Locally

Before pushing:

```bash
uv run pytest tests/
uv run pyright packages/qcraft-engine/
uv run ruff check . --fix
```

All three must pass. Failing tests will block the PR.

## Review Guidelines

When reviewing code in this repository, flag violations of these rules as HIGH severity:

1. **GOLDEN MASTER TESTS:** All test expected values MUST come from CSV fixtures in `tests/golden_masters/`. Flag any hard-coded numerical assertions (e.g., `assert x == 4.5`). Flag any expected values computed using production code or shared test helpers.

2. **NO VECTORIZED RECURSION:** Fiscal debt dynamics, fiscal rule feedback, and climate scenario calculations MUST use explicit Python for-loops. Flag any use of Polars `cumsum`, `shift`, `map_elements`, or `cumulative_eval` for these recursive calculations.

3. **EXPENDITURE RIGIDITY:** `rigidity=1.0` means spending is STICKY (worst case). `rigidity=0.0` means fully flexible. Flag if semantics are reversed.

4. **DEBT FLOOR ASYMMETRY:** Baseline uses `max(0, debt)`. Climate scenarios do NOT apply this floor. Flag `max(0, ...)` in climate scenario code.

5. **MULTIPLICATIVE GROWTH:** Expenditure uses `(1+a)*(1+b)*(1+c)`, NOT `(1+a+b+c)`. Flag additive growth formulas for expenditure.

6. **SIMPLICITY:** The engine is 7 pure functions returning Polars DataFrames. Flag abstract base classes, factory patterns, configuration objects, or unnecessary abstraction layers.

Do not praise the code. Focus on catching bugs and rule violations.

## Trunk-Based Development Discipline

Every piece of work gets an issue, a branch, and a PR. No exceptions.

**Before writing any code or content:**
1. Create a GitHub issue describing the work (`gh issue create`)
2. Create a feature branch from `main` (`git checkout -b feat/<name>`)
3. Push and open a PR when ready (`gh pr create`)

**Branch naming:** `feat/<name>`, `fix/<name>`, or `docs/<name>`.

**Why this matters:** Agents lose context between sessions. Issues and PRs create a paper trail that any future agent (or human) can follow. Branches protect `main` from half-finished work. PRs enable bot reviews that catch bugs before merge.

**Do NOT** commit directly to `main`. Do NOT start work without an issue number. Do NOT accumulate changes across multiple logical units without a branch.

## Commit Frequency

- Commit after every logical unit of work (one function, one test file, one config change).
- Never accumulate more than ~100 lines of uncommitted changes.
- Each commit message should describe what changed and why.

## PR Review Handling

PRs are reviewed asynchronously by GitHub-side reviewers (Codex + Gemini Code Assist). Do NOT wait for reviewer comments overnight. Open the PR and move to the next function.

If reviewer feedback arrives and you are still active:

1. **VALID BUG:** Fix it, commit with message referencing the review.
2. **VALID STYLE:** Fix it.
3. **OVER-ENGINEERING:** Reject — cite this AGENTS.md.
4. **DOMAIN CONFLICT:** Reject — cite the specific domain rule.
5. **FALSE POSITIVE:** Reject with brief explanation.

If reviewers disagree with each other, follow AGENTS.md and SPEC.md. If neither addresses the disagreement, document it in the PR description and move on.
