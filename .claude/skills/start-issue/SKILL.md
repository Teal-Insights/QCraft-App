# Skill: Start Issue

**Trigger:** Beginning work on any GitHub issue (feat/ branch)

## Required Steps

1. Create `.plans/<MODULE>.md` with this template:

```md
---
issue: <NUMBER>
module: <MODULE>
spec_sections: [list relevant SPEC.md sections]
allowed_files: [list files you may create/modify]
golden_masters: [list CSV fixture paths]
stop_conditions: [what makes you stop and write a blocker]
---

## Goal
[One sentence]

## Domain Gotchas
[Key rules from AGENTS.md that apply]

## Tests to Write First
[List 3-4 key tests]

## Implementation Steps
[High-level steps]

## Out of Scope
[What this doesn't do]

## Files Not Touched
[Explicitly list protected files]
```

2. Commit the plan: `git add .plans/<MODULE>.md && git commit -m "plan: issue <NUMBER> <MODULE>"`
3. Only THEN proceed to implementation.

The PreToolUse hook will block Write/Edit on feat/ branches if no plan exists.
