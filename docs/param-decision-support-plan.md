# Parameter decision support: the gap map and the closing specs

**Status:** v1.0 draft, CC-15 (2026-08-29), trail TEA-1400. Written against the live
Explorer (freeze-2026-08-29b) and the merged source in the cc13 worktree. Specs only.
Nothing here is built, and nothing here changes the app.

## 1. Why this file exists

The Explorer's promise to an analyst is guidance at the point of decision. For every
exposed parameter this file asks one four-part question: can the analyst PLAY with the
relevant data rather than only view it, SEE comparators, FORM a view, and RECORD the
reasoning in one motion? Where the answer is yes, that is recorded so nobody rebuilds
what exists. Where the answer is no, the smallest supplementary tool that closes the
gap is specified: bundled data only, one visual field, a dynamic caption, and a named
place where the recorded reasoning lands.

## 2. What already exists, and the shape it takes

The context system (run 5, CC-5, plus the 8/27 held-item resolutions) distinguishes two
kinds of parameter and serves each in its own register:

- **Data parameters** (demography variant, productivity, inflation, interest-rate
  approach) open a panel drawing the published record, the WEO-implied path, and the
  analyst's own assumption as a live line. Panels carry view toggles (this country /
  all countries; peer scopes), a dynamic caption that names the analyst's setting
  against the record, a source line with the shared figure slug, and a "FOR THE
  RATIONALE" sentence with an **Add to the rationale** button that appends the
  comparison into the parameter's note (`RationaleAction.tsx`, append-not-replace,
  clipped to the 200-character cap).
- **Judgment parameters with a record** (debt target, expenditure rigidity) open the
  same panel machinery but labelled as a record a judgment is made against: the
  debt-target strips (forecast 2029, outturn 2023, lowest since 2001, four peer
  scopes) and the rigidity range view (six readings, ranked nobody, engine default
  marked). Both carry the rationale action and a teaching-widget footer link.
- **Pure judgment parameters** (country, fiscal rule) open a one-line note. The
  fiscal-rule note links the debt dynamics sandbox.

The rationale channel is per-parameter (`notes[key]`), surfaces in the sidebar as
"Why this value?" once a value moves, travels into the report annex, the workbook,
the CSV manifest, and the run file, and restores on import. The peer-comparison
sentence is the one-motion bridge from evidence to record.

## 3. The verdict table

Play = manipulate and see a response. Compare = peers or alternatives
visible. Form = the panel supports going from ignorance to a defensible number or
choice. Record = one motion from the evidence to the note.

| Parameter | Play | Compare | Form | Record | Gap |
|---|---|---|---|---|---|
| Country | none | none | n/a | n/a | G1: coverage is invisible until after selection |
| Demography variant | partial | yes (variants + 2 comparator countries) | yes | yes | G2: evidence is one screen away from the choice |
| Productivity, start + long run | partial | yes (record, WEO-implied, all countries) | yes | yes | G2, G3 |
| Inflation, start + long run | partial | yes (same RatePanel machinery) | yes | yes | G2 |
| Interest-rate approach | partial | yes (all three rules drawn on this country) | yes | yes | G2 |
| Debt target | partial | yes (strips, four peer scopes) | yes | yes | G2 |
| Fiscal rule | none | none | no | note only | G4: the rule's consequence is nowhere visible |
| Expenditure rigidity | partial | yes (range view, All countries / Africa) | yes | yes | G5: the setting's consequence is not in the panel |

"Partial" play, everywhere it appears, means the same thing: the panel redraws live
when the analyst edits the sidebar value, so manipulation works, but it happens in a
control disconnected from the evidence. The analyst types in one place and watches
another.

## 4. The gaps, each with its smallest closing spec

### G1. The country picker is coverage-blind

Nine selectable countries refuse to project (typed refusal, both engines agree), and
eleven project with a climate dataset that is all zeros. The analyst discovers either
fact only after selecting, when the refusal notice or the zero-climate notice appears.
The option list itself carries no signifier, and the country context note describes
mechanics ("the country choice fixes the data vintage") rather than coverage.

This gap needs no D3. **Spec: coverage signifiers in the picker.** Suffix the option
label for the nine refusing countries ("Zambia (no debt projection)") or group them
under a labelled `<optgroup>`, and add one line to the country context note naming
where the full coverage table lives (About the data). Data source: the same
per-country coverage the notices already read. Reasoning lands nowhere because
choosing a country needs no rationale (see the audit's finding on the CHANGED badge
misfiring for country). Effort: copy plus an option-label map.

### G2. The evidence and the control live one motion apart

Every panel draws "your assumption" live, but changing it means leaving the evidence:
eyes on the panel, hands in the sidebar. The four-part test says play; this is
watching with a remote control in the other room.

**Spec: drag-to-set on the assumption mark, one interaction added to the existing
panels, no new tool.** In `RatePanel` (productivity, inflation) the orange assumption
path gets a drag handle on its long-run segment; dragging moves the long-run value in
0.1 steps, the sidebar input follows (single source of truth stays `params`), and the
dynamic caption re-renders as it moves. In `DebtTargetPanel` the dashed "Your target"
rule becomes draggable along the axis in 1-point steps. In `RigidityCharts` the "Your
setting" marker drags along the 0 to 1 axis in 0.1 steps. Demography variant and
interest-rate approach are categorical: their play affordance is click-to-choose, one
click on a drawn path (or its legend chip) selects that variant or rule, exactly what
the sidebar select would have done. Bundled data only (the panels already have it),
one visual field each (the chart the panel already draws), dynamic caption (already
present, already keyed to `params`), reasoning lands in the existing rationale action.
Escape hatch: the sidebar input remains, so precise entry and keyboard access lose
nothing.

### G3. The growth decomposition widget is missing where growth is chosen

"Where growth comes from" teaches exactly the decomposition behind
`productivity_start` and `productivity_end`, and it is linked from the intro rail but
not from the productivity panel footer. Debt target and rigidity got their footers in
the 8/27 held-item resolutions; productivity was left out because `PARAM_CONTEXT`
carries no `href` for it.

**Spec: one registry entry.** `productivity_start`/`productivity_end` gain
`href: './widgets/growth/'`, `linkText: 'Open where growth comes from'` in
`src/context/panels.ts`; `panelWidgetLink()` already renders the footer. No new tool.
Inflation and interest-rate approach have no matching widget and none is invented for
them; a widget that exists to fill a slot would be the opposite of the minimum-tool
rule.

### G4. The fiscal rule asks for a yes or no with no picture of the difference

The rule is the one binary in the app with real consequence (it is why paths bend
toward the target), the User Guide's own worked example runs with it off, and the
context note describes the mechanism in words only. The analyst cannot see what
"Yes" buys before deciding, and the Analysis tab shows only the current setting's
world.

**Spec: the rule on/off strip, the one new small tool in this plan.** One visual field:
two thin debt-to-GDP paths for the selected country at the current parameters, rule
on and rule off, drawn in the fiscal-rule context note area when it opens (a
`ctxnote` upgrade, not a new panel). Data: two engine runs on the payload already in
the browser; no new bundled data. The second run computes on open, not on load; if it
is not effectively instant on a mid-range laptop (measure before building), a one-line
computing state shows. Dynamic caption, from the run pair (illustrative numbers):
"With the rule on, debt reaches the target in 2046 and holds; with it off, debt
drifts to 74% by 2099." Reasoning lands in the `fiscal_rule` rationale note via the same
`RationaleAction`, sentence composed from the caption. The sandbox link stays; the
strip shows this country, the sandbox teaches the mechanism.

### G5. The rigidity panel needs a consequence strip beside its range view

The range view answers "what may I defensibly choose". It does not answer "what
happens if I choose it", and rigidity is the parameter whose effect is least
guessable (it gates how climate damage passes into spending). The widget footer
points at the climate-channel widget, which teaches the mechanism generically, on
its own page, away from this country.

**Spec: the rigidity consequence strip, appended to the existing rigidity panel.**
One visual field: worst-scenario debt-to-GDP in 2099 for this country at the
current parameters, computed at rigidity 0.0, the record's bounds (0.25, 0.49), and
1.0, drawn as four labelled points on one horizontal axis with the analyst's setting
marked. Four engine runs on open, same in-browser engine, same computing-state rule
as G4. Dynamic caption (illustrative numbers): "At your setting of 1.0, Hot +
Unadapted reaches 171% of GDP in 2099. At the record's lower bound it reaches 158%.
Rigidity moves the worst case by 13 points for Uganda." Reasoning lands in the `expenditure_rigidity` note via the
existing rationale action. This makes the panel's two halves match: the range view
says what the record supports, the strip says what the choice costs.

## 5. Specs held back on purpose

- No scenario-weighting control, no probability language anywhere: the six scenarios
  are a family, and the app's own legend copy says so.
- No per-country rigidity estimate under any interaction: parameter-data.md section 7
  records why per-country estimates do not survive, and the gate stands.
- No new widget for inflation or the interest rule: no matching single idea exists to
  teach, and the panels already carry the record.
- No autosaved parameter state as part of this plan: real, but it is an audit finding
  (persistence and reload), not parameter decision support.

## 6. Sequencing and cost, for triage

| Spec | Size | Risk | Depends on |
|---|---|---|---|
| G3 widget footer for productivity | one registry entry | none | nothing |
| G1 coverage signifiers in the picker | small | copy gate (notice-adjacent wording) | coverage table already shipped |
| G4 rule on/off strip | medium (two runs + one small chart + caption) | engine timing on old laptops | none |
| G5 rigidity consequence strip | medium (four runs + one strip + caption) | same as G4 | none |
| G2 drag-to-set and click-to-choose | medium per panel, five panels | interaction QA, touch, a11y | none |

G3 and G1 are candidates for the pre-Tuesday micro-fix gate only if Teal wants them;
everything else is v2.1 material. Each of G2, G4, G5 cuts cleanly into a lane-sized
CC prompt: the spec above names the file, the data, the field, the caption, and the
note key each one writes.
