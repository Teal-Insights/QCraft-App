---
name: Engine Function
about: Implement one of the 7 engine functions
labels: engine, session-b
---

## Spec Reference
SPEC.md section: 

## Oracle Packet
`planning/oracles/<MODULE>.md`

## Golden Masters
- Intermediate: `tests/golden_masters/intermediate/<MODULE>/uganda.csv`
- Final: `tests/golden_masters/final/uganda.csv`

## Exit Criteria
- [ ] Intermediate parity for Uganda
- [ ] pytest, pyright, ruff pass
- [ ] No hard-coded expected values

## Domain Gotchas
[List relevant rules from AGENTS.md]

## Allowed Files
- CREATE: `src/qcraft_engine/<MODULE>.py`, `tests/test_<MODULE>.py`
- READ: SPEC.md, oracles, golden masters, AGENTS.md
- DO NOT TOUCH: SPEC.md, AGENTS.md, golden masters, CI, hooks
