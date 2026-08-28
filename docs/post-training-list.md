# Post-training list

Work deliberately deferred past the 2026-08-29 freeze, so the Tuesday training
build is the thing that was tested rather than the thing that was still moving.

Nothing here is a defect that ships silently. Each item is either a known
limitation already stated on screen or in a document, or a piece of work whose
cost is real and whose benefit does not land before the training. Each entry
says who deferred it and where the reasoning lives, so picking one up does not
start from nothing.

The freeze state this list hangs off is `FREEZE-REPORT.md`.

## 1. Reclaim sidebar height, so the fold check can go back to being exact

**Deferred by:** Teal, 2026-08-27 night held-item resolutions.
**Where it lives:** `apps/qcraft-web/scripts/context-qa.mjs`, `FOLD_SLACK_PX`;
MERGE-REPORT.md sections 6.3 and 8.2.

The context panels promise that a sidebar control and the context explaining it
sit in one visual field on a 1440x900 laptop, and `context-qa.mjs` is what makes
that a claim rather than marketing. After CC-2's mode bar and CC-5's panels
landed on one branch, the inflation control's bottom edge measured 900.36px
against a 900px viewport, where CC-5's own build had cleared it by one
sixty-fourth of a pixel. The check now allows one pixel.

That slack is measuring sub-pixel text reflow, not layout: a caption genuinely
pushed out of the field overshoots by tens of pixels and still fails. The
resolution is to reclaim height in the sidebar so the threshold can be exact
again. That is a layout change to a control every user touches, which is not
freeze-week work.

## 2. The range-of-validity caution on sub-zero debt paths

**Deferred by:** Teal, 2026-08-27 evening gate, resolution 7.
**Where it lives:** `BELOW_ZERO_NOTE` in `apps/qcraft-web/src/export/figures.ts`;
docs/lane-reports/cc3-export-packet.md section on the below-zero note.

The projection can drive debt below zero, and the note that ships states that
factually. The stronger caution, that the model's behaviour below zero is
outside the range the method was built for, joins the next IMF-facing copy pass
rather than being written during a freeze.

## 3. Confirm post-fix climate parity against a fresh Excel recalculation

**Deferred by:** Teal, 2026-08-27 gate resolution 1.
**Where it lives:** `VERIFIED_BADGE` in `apps/qcraft-web/src/content/modes.ts`.

The parity wording is held exactly as it is ("baseline parity verified for 147
of 147 tested countries; climate-scenario parity confirmed for ratio metrics
only") until an independent fresh Excel recalculation, through an xlwings
harness, confirms the post-fix climate parity. The climate-derivation fix moved
severe scenarios upward, so the current wording is the safe side of the claim.
Do not strengthen it before that harness runs.

## 4. Whether to ship newer FADCP estimates as a "Current+" option

**Deferred by:** CC-2's FADCP memo; Teal's call, recorded as later.
**Where it lives:** docs/data-vintages.md.

IMF How-To Note 2025/009 (November 2025) carries a 171-country appendix of newer
climate damage estimates. The posted IMF workbook still ships v10, so this build
ships what the workbook ships. Whether the Explorer should offer the newer
estimates as a third option is a product decision, not a data one.

## 5. The 2030 climate-start convention expires mechanically

**Deferred by:** the convention itself.
**Where it lives:** docs/data-vintages.md; `ABOUT.impactCaveat` in
`apps/qcraft-web/src/content/modes.ts`.

Climate effects start in 2030 because the IMF method holds the projection to
observed and forecast data through 2029. The convention was set when 2030 was
six years out. The April 2031 WEO is the release at which it stops making sense
mechanically, and the app already says so in the About panel.

## 6. The course's zero-climate notice gains the User Guide citation

**Deferred by:** Teal, 2026-08-27 evening gate, resolution 4.
**Where it lives:** the course repository, not this one.

The app's zero-climate notice ships as written. The course version adds the User
Guide footnote 12 citation, which names 25 economies; CC-6 reconciled that
against the 11 the app notices (14 are not selectable for want of productivity
data, and Kosovo is absent from every source). That reconciliation is in
docs/country-coverage.md and is what the course text should cite.
