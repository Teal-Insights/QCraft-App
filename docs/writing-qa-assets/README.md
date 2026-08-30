# Writing-QA prototype assets (CC-19)

Evidence artifacts behind `../writing-qa-plan.md` section 5 and `../writing-qa-audit-2026-08.md`.

- `prose_lint_proto.py`: the rough detector (stdlib only). Usage: `python3 prose_lint_proto.py <dir-or-file> [...]`. This is the prototype, not the spec; the plan's section 3 is the cleaned-up design, and the known false-positive classes (quoted spans, citation triplets) are deliberately unhandled here because finding them was the point.
- `audit_tables.py`: per-module tables, refined rule-of-three (citation-exempt), repeated-construction census.
- `results-all.json`: the four-corpus run of 2026-08-30 (course at lane4 283e9a3, guide at main 67d26b6, guide first draft at 8cc6ea0, Clearing the Clogs final at its ship commit). Corpus texts are not vendored; the commits and paths above reproduce them.
