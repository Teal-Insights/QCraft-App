# CC-16: the pre-Tuesday HCD micro-fixes

**Status:** done, tag `freeze-2026-08-29c`, trail TEA-1400. Branch
`feat/hcd-microfixes` off `freeze-2026-08-29b`, worktree `~/GitHub/QCraft-App-cc16`.
Freeze exception: the four fixes Teal picked at the CC-15 triage gate (A1, A2,
A4, A5 from [hcd-audit-2026-08.md](../hcd-audit-2026-08.md) section 8a) and
nothing else. No gated IMF-facing wording touched; the two new flag lines are
app copy in the sidebar's existing register.

## What shipped

**A1 (F-4), one CSS selector.** The active mode pill rendered navy text on the
navy capsule under the pointer, which is exactly where the pointer sits at the
moment of switching; the audit measured contrast 1.00 and this lane reproduced
it to the pixel before fixing. `.mode__option:hover` now excludes the active
pill, the idiom the register toggles already shipped. Measured at the same
moment after: white on navy, contrast 11.25, both switch directions.

**A2 (F-13), one CSS guard, and the root cause was not the audit's guess.** The
audit hypothesized the busy/disabled style outliving the download. Measured
live, the button was illegible on ANY hover while enabled: the generic
`.button:hover` pale background (specificity 0-3-0) outranked
`.button--primary`'s styles (0-1-0 and 0-2-0), painting the white label onto
`#f2f8fa` at contrast 1.07. The after-download screenshot caught it because the
pointer rests on the button after the click. Same specificity family as F-4,
one tier up. The pale hover now excludes primary buttons; a hovered primary
keeps its resting navy. The cyan `.button--primary:hover` rule is removed
rather than resurrected; the adversarial review established it was HALF dead
(its background never rendered, its cyan border-color did), so the removal
also retires a hover border no state needs, and the only look every QA pass
has seen, the resting navy, is now the whole story.

**A4 (F-3), the emptied field.** `Number('') === 0` fed zero productivity to
the engine mid-retype; the audit watched the headline recompute 50.3% to 49.1%
and "0" rerender under the cursor, and the regression loop reproduced both
numbers exactly. All FIVE numeric sidebar inputs (productivity start and long
run, inflation start and long run, debt target) now go through a `NumberField`
component ([numberField.tsx](../../apps/qcraft-web/src/components/numberField.tsx)):
an empty or unparseable draft commits nothing, the projection keeps the last
valid value, a flag beside the field says so while editing, and the last valid
value returns to the box on blur. A deliberate zero is still a value. The
count matters: the triage card said "one guard in the input handler" and an
early record here said four fields; the defect lived in every numeric input,
debt target included, where an emptied box silently became a debt target of
zero. The review caught the undercount and the loop now drains all five.

**A5 (F-2 partial), the out-of-range flag.** 999 in the max-15 productivity
field recomputed silently to a 6.0% headline and was badged like a legitimate
choice. On leaving the field a flag now names the declared range beside it,
with the typed value preserved. The engine still computes with the value, on
purpose: the stale-state hold (projection pinned at last valid until the value
is valid) is the v2.1 input-integrity lane's, and the flag states what is
actually happening rather than what a future version will do. The regression
loop pins that boundary explicitly so v2.1 flips a failing test rather than
guessing.

## How it is held

- `tests/numberField.test.ts` pins the guard logic: `parseDraft('')` is null
  (the defect), whitespace is null, zero is a value, both bounds are
  legitimate, the flag strings are exact and carry no em-dash.
- `npm run qa:microfixes` ([microfix-qa.mjs](../../apps/qcraft-web/scripts/microfix-qa.mjs))
  drives the four audit moments on the real app at 1440x900 with a 4.5:1
  contrast floor on the two hover states. Against the unfixed tag it fails 10
  of 17 checks; those failing-run screenshots are the `before/` pairs in
  [docs/screenshots/hcd-microfixes/](../screenshots/hcd-microfixes/).
- The adversarial review workflow over the diff (three lenses,
  refute-by-default verification, 10 raw findings, 7 confirmed) earned its run.
  Three findings changed the code or the tests: (1) gating the flag on focus
  stripped `aria-invalid` and the description from the accessibility tree at
  the moment a screen reader user tabs into the flagged field, so the flag now
  quiets only while a draft is actively in progress; (2) the A1 legibility
  check could sample inside the mode-switch disabled window, where no hover
  rule applies under either the fixed or the broken CSS, so the wait now
  requires the pill enabled; (3) only one of the five rewired fields was
  browser-exercised, so the loop now drains and flags all five by their own
  flag ids. Two more corrected the record (the half-dead hover rule above, and
  the field count); a missing `pageerror` hook was added. Rejected claims and
  reasons are in the session record.

## Battery at the tag

pytest 215, ruff clean, pyright 0 errors on the engine package; engine-ts 83;
web 304 (up 12); typecheck, lint, fresh build clean; `freeze-check.sh` PASS
against dist (all gated strings verbatim, zero em-dashes); differential harness
PASS over 5,114,279 cells (2,549,457 frozen + 2,564,822 current) at max
4.441e-16 against 1e-12, refusals matching as refusals; pipeline sanity rc 0;
peer-data `--check` same. All eight browser loops clean on a fresh build served
from this worktree on port 4616 (serving process cwd verified):
qa:export, qa:context, qa:tabs, qa:widgets, qa:registers, qa:context-shots,
qa:sweep, qa:microfixes.

## The pin

The deploy workflow's `EXPLORER_DIST_SHA256` moves to
`d44c5c1a5e2d6531a918c86cb936490c89e37d9b3cc6cdfb02ea2a454c994bea`. Checked the
way CC-13 checked it: the same command reproduces the outgoing pin exactly at
`freeze-2026-08-29b` (`8a3fd7db...b14500`), and the new build is byte-stable
across two consecutive runs at the sub-path base. Still 32 files.
`INPUTS_SHA256` does not move: this lane touched no data and no guide file.
(An interim hash computed before the review-driven accessibility fix was
superseded; the pin is the one at the tag.)

## For the next IMF-facing copy pass (recorded, not acted on)

The A5 flag deliberately says "The projection is still computed with 999."
When v2.1's stale-state hold lands, that sentence must change in the same
commit that changes the behavior, or it becomes the kind of true-yesterday
copy F-19 was.
