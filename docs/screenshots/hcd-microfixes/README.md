# CC-16 HCD micro-fixes: before and after

Four pre-Tuesday fixes from the 2026-08 HCD audit (docs/hcd-audit-2026-08.md,
section 8a), the subset Teal picked at the triage gate: A1, A2, A4, A5. Every
pair is the exact moment the audit screenshotted, reproduced by
`apps/qcraft-web/scripts/microfix-qa.mjs` at 1440x900 on the real app.

| Pair | Finding | Before | After |
|---|---|---|---|
| a1-pill-hover | F-4: the active mode pill rendered navy text on the navy capsule under the pointer at the moment of switching (measured contrast 1.00) | Blank dark capsule where "Verified" should read | White on navy, contrast 11.25 |
| a2-button-after-download | F-13: after a completed download the packet button showed its white label on the generic hover's pale background (contrast 1.07) | Illegible label, pointer on the button | Resting navy, label legible, contrast 11.25 |
| a4-emptied | F-3: clearing a numeric field fed `Number('') === 0` to the engine; headline recomputed 50.3% to 49.1% and "0" rerendered under the cursor | Recomputed at zero, box reads "0" | Headline holds 50.3%, box stays empty, flag beside the field |
| a5-999-blur | F-2 (partial): 999 in a max-15 field recomputed silently (50.3% to 6.0%) with no flag anywhere | No flag, badged like a choice | Range flag beside the field on blur; value preserved; recompute unchanged by design (stale-state hold is v2.1) |

The regression loop (`npm run qa:microfixes`) asserts all four at the same
moments, plus the boundaries deliberately not moved: the engine still computes
an out-of-range value (A5 is additive), and a deliberate zero is still a value.
