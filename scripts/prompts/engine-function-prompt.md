# Session B: Implement <MODULE_NAME> (Issue #<ISSUE_NUMBER>)

You are implementing the `<MODULE_NAME>` function for the Q-CRAFT engine in autonomous mode. No human is available.

## Your Mission

Implement `packages/qcraft-engine/src/qcraft_engine/<MODULE_NAME>.py` such that:
1. It passes all golden master parity tests for Uganda
2. All code passes pyright, ruff, and pytest
3. The implementation is minimal, clear, and domain-correct

## Non-Negotiable Rules

1. **SPEC.md is read-only.** If you find a bug, create `.change-requests/<MODULE_NAME>.md`, but do NOT edit SPEC.md.
2. **Golden masters are read-only.** Do NOT modify CSV fixtures in tests/golden_masters/.
3. **Do not import pandas.** Use Polars only.
4. **Fiscal recursion uses for-loops.** Do NOT vectorize with Polars cumsum/shift/map_elements if this module has t-1 dependencies.
5. **Do not rewrite architecture.** Document disagreements in `.change-requests/`, continue with existing approach.
6. **Expenditure growth is multiplicative:** `(1+a)*(1+b)*(1+c)`, NEVER additive.
7. **Debt floor asymmetry:** `max(0, debt)` in Baseline ONLY, NOT in climate scenarios.

## Process

### Step 1: Write Your Plan (5 min max)

If `.plans/<MODULE_NAME>.md` does not exist, create it now:

```md
---
issue: <ISSUE_NUMBER>
module: <MODULE_NAME>
---

## Goal
[One sentence]

## Tests to Write First
[List 3-4 key tests]

## Implementation Steps
[High-level steps]

## Out of Scope
[What this doesn't do]
```

Commit: `git add .plans/<MODULE_NAME>.md && git commit -m "plan: issue <ISSUE_NUMBER> <MODULE_NAME>"`

### Step 2: Read Domain Context

1. Read `AGENTS.md` (your rules)
2. Read `planning/SPEC.md` — find the section for this module
3. Read `planning/oracles/<MODULE_NAME>.md` if it exists (domain notes, Excel formulas)
4. Read `packages/qcraft-engine/tests/golden_masters/intermediate/<MODULE_NAME>/uganda.csv` if it exists
5. Read `packages/qcraft-engine/tests/golden_masters/final/uganda.csv` if it exists

### Step 3: Verify API Patterns

**If Context7 is available (Claude Code):** Before writing Polars, Shiny, or Plotly code:
```
use context7 to fetch current Polars API documentation
```

**If Context7 is NOT available (Codex):** Be cautious:
- Polars uses `group_by()` not `groupby()`, `map_elements()` not `apply()`
- When in doubt, write a minimal test first and run it

### Step 4: Write Tests First

Create `packages/qcraft-engine/tests/test_<MODULE_NAME>.py`:

1. Load golden master CSV fixtures (never hard-code expected values)
2. Test each key intermediate output
3. Test boundary conditions from the spec
4. Use `polars.testing.assert_series_equal` with tolerance

Example:
```python
import polars as pl
from pathlib import Path
from qcraft_engine.<MODULE_NAME> import compute_<MODULE_NAME>

GOLDEN_DIR = Path(__file__).parent / "golden_masters"

def test_<MODULE_NAME>_intermediate_parity():
    expected = pl.read_csv(GOLDEN_DIR / "intermediate" / "<MODULE_NAME>" / "uganda.csv")
    result = compute_<MODULE_NAME>(input_df)
    for col in expected.columns:
        pl.testing.assert_series_equal(
            result[col], expected[col],
            check_exact=False, atol=0.001,
        )
```

### Step 5: Implement

Write `packages/qcraft-engine/src/qcraft_engine/<MODULE_NAME>.py`:
- Use Polars for data operations, Python for-loops for recursion
- Prefer explicit variable names
- Add a docstring at the top
- No over-engineering — if a simple loop works, use it

### Step 6: Validate

```bash
uv run pytest packages/qcraft-engine/tests/test_<MODULE_NAME>.py -v
uv run pyright packages/qcraft-engine/src/qcraft_engine/<MODULE_NAME>.py
uv run ruff check packages/qcraft-engine/ --fix
```

All must pass. If tests fail after 3 repair attempts, follow the blocker protocol below.

### Step 7: Commit and Exit

```bash
git add -A
git commit -m "feat: implement <MODULE_NAME> (issue #<ISSUE_NUMBER>)"
```

Exit 0. The orchestrator handles push, PR creation, and merge.

## Blocker Protocol

If stuck after 5 attempts:

1. Create `.blocked/<MODULE_NAME>.md` with: issue, root cause, what you tried, files modified, next step
2. Commit: `git add -A && git commit -m "BLOCK: <MODULE_NAME>"`
3. Exit 0 immediately

## Dependencies

- demography: No dependencies
- productivity: depends on demography
- inflation: depends on demography, productivity
- baseline_v1: depends on demography, productivity, inflation
- interest_rate: depends on baseline_v1
- fiscal: depends on baseline_v1, interest_rate
- climate: depends on fiscal

**Import and call earlier functions.** Do not read their outputs from files. The orchestrator ensures main has all earlier merges.
