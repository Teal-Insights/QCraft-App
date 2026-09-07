# The Explorer against the HCD standard: audit, August 2026

**Status:** v1.0, CC-15 (2026-08-29), trail TEA-1400. Target: the LIVE Explorer at
https://teal-insights.github.io/QCraft-App/explorer/ (freeze-2026-08-29b). Rubric:
[docs/hcd-standard-draft.md](hcd-standard-draft.md), applied here for the first
time. Audit only: this lane changed no code and no copy.

## 1. Why this file exists

The Explorer ships Tuesday into a training room and then into strangers' inboxes.
The bar it is judged against: someone landing on it knows where to look, and the
whole journey (land, orient, pick country, read the baseline, run scenarios,
choose parameters informed, record reasoning, export, share and reload) is obvious
without reading directions. This file records how the live tool measures against
the standard: what passes, what blocks, what to fix first, with a screenshot for
every claim.

## 2. Method

- **Evidence base:** 46 screenshots of the live site captured by scripted
  walkthrough at 1440x900 (plus 1280x800), in `docs/hcd-audit-shots/`; two
  measurement files (geometry, validation behavior, reload state); the full
  export packet downloaded and unzipped; live DOM and computed-style probes for
  claims a screenshot cannot settle (hover states, validation messages).
- **Independent passes:** eight lenses run separately with no shared notes: three
  personas (the Excel-fluent ministry analyst, the economist new to Q-CRAFT, the
  skeptical expert who received the packet cold) walking the journey on Spencer's
  streamlined cognitive-walkthrough questions, plus five focused lenses
  (first-screen hierarchy and notice load, control consistency, error and empty
  states, mode-switch comprehension, rationale and export). 60 raw findings.
- **Adversarial verification:** every finding was re-checked against the pixels by
  a separate pass with authority to reject or re-rate. 53 survived (46 confirmed,
  7 re-rated), and the only rejections were duplicate framings of one root cause;
  no finding died on evidence. The survivors consolidate to the 24 below.
  Findings I could probe live (the mode-pill contrast, the help-tip click, the
  emptied field) carry measured root causes beyond what screenshots can show.
- **Severity:** Nielsen's 0 to 4 scale (1 cosmetic, 2 minor, 3 major, 4
  catastrophe; 4 reserved for wrong-number or lost-work damage).

## 3. What works, and is worth protecting

The findings below are repairs to a tool whose bones are good. The audit's
consensus on what already meets the standard:

- **The cold landing computes.** A complete Uganda baseline with labeled headline
  tiles is on screen before the tool asks anything. The primary action (Country,
  top-left) passes the Norman-door test; there is no empty state and no wizard.
- **Honest-broker notices are exemplary.** Zambia refuses rather than fabricates
  ("The tool stops rather than drawing a line nobody should cite"), quotes the
  engine's reason, and names a next step. Maldives pre-empts the dangerous
  misreading ("That is missing data, not an absence of risk"). Ecuador's
  anchor-year card explains projected versus observed calmly.
- **The dual-path stance is real.** Workbook is the cold-default chart register,
  described respectfully; the packet ships a working .xlsx ("Keep working in
  it."); Verified mode exists exactly so the Explorer can be held to the
  original. Nothing anywhere talks down to Excel.
- **Reasoning capture sits at the moment of decision.** Move a value and the
  CHANGED badge, "Engine default: 5.0%", and the one-line "Why this value?" input
  appear in place; the note travels into the report annex, the workbook, the CSV
  manifest, and the run file, and restores on import. The context panels'
  "Add to the rationale" closes evidence-to-record in one click.
- **The context panels are a genuine ignorance-to-informed-choice bridge.** The
  country's record, the WEO-implied path, and "Your assumption" share one chart;
  captions are computed from the analyst's own setting; sources are named down to
  the file; the rigidity panel shows a range and ranks nobody.
- **Provenance travels.** Mode, vintage, engine version, and "Not an official IMF
  product" reach every chart footer, every export artifact, and the packet
  README's "What these numbers may be used to claim" section. Where the bounded
  parity claim appears, the ratio-metrics qualifier is never dropped.
- **Briefing titles are computed claims** ("Baseline debt passes the 50% target
  in 2046") that update with the run, so a chart headline can never go stale
  against its own numbers.
- **The run-file round trip closes the loop** with a confirmation that teaches the
  model: "Loaded qcraft-...-run.json. The run it describes is the one already on
  screen."

## 4. Gate results

Fourteen gates from the standard. Four fail; each failure is small to repair.

| Gate | Verdict | Evidence |
|---|---|---|
| G1 First screen orients | **Pass, with a scored deduction** | Tiles and the Country control orient in seconds (01-land). But the first chart pixel sits 63% down at 1440x900 and the time axis is below the fold; see F-11. |
| G2 No control changes meaning by context | **Fail** | One CONTEXT label opens a rich data panel on eight parameters and a one-line note on two (06-context-00 vs 06-context-02); the Workbook/Briefing toggle appears at two scopes with no scope cue and an invisible precedence rule (08b); see F-6, F-7. |
| G3 Consequences preview | **Fail** | A browser reload silently destroys changed parameters and typed rationale notes; no warning, no recovery (11-after-reload; measured: value back to default, note gone). See F-1. |
| G4 The interface never scolds | **Pass** | Every notice is factual and blame-free; the Zambia, Maldives, Ecuador, and sub-zero notes name causes and remedies (13-*, 14-subzero-climate). |
| G5 Both paths visible at every decision point | **Pass** | Register toggle at both scopes, workbook cold default, .xlsx in the packet, Verified mode as the audit path (01-land, 07-tab-export). |
| G6 No silent wrong numbers | **Fail** | 999 typed into a max-15 field: no visible flag, engine recomputes headline to 6.0% and badges it CHANGED like a legitimate choice (12d-999-recompute). An emptied field is read as zero and recomputed (12b-emptied). See F-2, F-3. |
| G7 Every action answers | **Pass, with a scored deduction** | Changes recompute immediately and visibly. The deduction: mode switch changes every number with no statement of what changed (see F-9). |
| G8 Signifiers are honest | **Fail** | The active mode pill's label renders ink-on-ink while hovered, which is exactly where the pointer sits at the moment of clicking (measured live: color rgb(20,62,90) on rgb(20,62,90); the register toggles already use the correct `:not(--on):hover` idiom, the mode toggle missed it). After download, the packet button label washes out (15b). See F-4, F-13. |
| G9 Nothing load-bearing hides | **Pass, with one asymmetry** | Notices are undisclosed and visible. The asymmetry: Ecuador's anchor shift gets a notice card, Syria's 19-year shift gets only a subtitle mention (13-ecuador vs 13-syria); see F-5. |
| G10 Entry points carry their units and bounds | **Fail** | Numeric fields carry % in their labels but show no valid range anywhere (bounds live only in HTML attributes; 999 proves them decorative); the rigidity slider is the only way to set rigidity, with no paired numeric entry (04-sidebar-lower). See F-2, F-12. |
| G11 Interruptions are warranted | **Pass** | No modals, nothing moves or blinks, every standing indicator opens to its cause in one action. The permanent provenance sentence is scored under C2/C3 instead (F-10). |
| G12 Refusal over fabrication | **Pass** | Zambia and the eight other refusals stop with a typed, sourced reason (13-zambia-blocked). |
| G13 Attribution stays exact | **Pass** | FADCP chain in About the data per the 8/27 gate resolutions; parity wording exact where it appears. Two adjacent copy items are flagged to Teal's gate, not failed here: see F-8. |
| G14 The core journey needs no manual | **Pass, narrowly** | All three personas completed the journey from the screens alone. The stalls that cost them minutes are F-6, F-9, and F-14. |

## 5. Scored rubric

Scores are 0 to 2 (2 pass, 1 partial with fixes named, 0 fail), N/A with reason.
Evidence for every non-2 score is a finding reference; findings carry screenshots.

| Criterion | Score | Anchor |
|---|---|---|
| A1 Signifiers at the point of need | 1 | "?" tip closes on the natural click gesture (F-14); CONTEXT's two behaviors (F-6) |
| A2 Natural mapping | 2 | Sidebar-to-workspace live coupling; panels beside their parameters |
| A3 Informative feedback | 1 | Recompute is instant and visible, but a mode switch names nothing (F-9) |
| A4 The system image teaches the model | 2 | Intro plus tiles plus computed titles; personas sketched the model correctly |
| A5 Knowledge in the world | 2 | Current state, defaults, and changed-ness always visible |
| A6 Slips and mistakes get different guards | 0 | The two worst slips (out-of-range, emptied field) have no guard at all (F-2, F-3) |
| B1 Suitability for the user's tasks | 2 | Zero technology-imposed steps on the core journey |
| B2 Self-descriptiveness | 1 | Tabs Analysis/Climate draw a boundary personas guessed wrong (F-15); mode names bare until opened |
| B3 Conformity with user expectations | 2 | Workbook terms, signs, and orderings preserved in the workbook register |
| B4 Learnability | 1 | Exploration is safe except that reload destroys it (F-1); no undo of a single edit besides Reset-all |
| B5 Controllability | 2 | Nothing auto-advances; register and mode choices stick |
| B6 Use-error robustness | 0 | Silent acceptance of invalid input is the definition of a miss (F-2, F-3) |
| B7 User engagement | 2 | Provenance discipline; bounded claims; calibrated confidence throughout |
| C1 The periphery does the standing work | 1 | Chart footers and tabs are model periphery; the mode-bar caveat and CHART VIEW explainer stand in the shout position permanently (F-10) |
| C2 Attention demands are proportionate | 1 | Same two standing bands answer questions nobody has asked yet (F-10) |
| C3 The first screen spends attention like money | 1 | 8 text bands and about 164 words precede the first chart pixel; teaching-widget links occupy band two (F-11) |
| C4 The minimum technology that solves it | 2 | Every feature maps to a journey step; no ornament found |
| C5 It works even when it fails | 2 | Refusals state their cause and stop; baseline usable on zero-climate countries |
| D1 Overview first, details on demand | 2 | Tiles, then charts, then Data tab, then packet |
| D2 Disclosure sorts by frequency and importance | 2 | Core loop is zero-disclosure; depth is one labeled action away |
| D3 Two levels, no more | 2 | No nested disclosure found anywhere |
| D4 Extraneous load is pruned | 1 | The two permanent explainer bands fail the remove-test (F-10) |
| D5 Accelerators for the practiced hand | 1 | Register memory yes; no keyboard path, no one-step rerun of a loaded run |
| E1 Labels persist | 2 | Every field labeled; placeholders never label |
| E2 Units, scale, and plausible range at entry | 0 | No field shows its range; the range that exists is decorative (F-2, F-12) |
| E3 Validation lands at the field edge | 0 | No validation lands anywhere (F-2, F-3) |
| E4 Defaults are decisions | 2 | Engine defaults named in place, annexed in exports, documented in repo |
| E5 Evidence at the point of decision | 2 | The context-panel system is the model the standard should cite |
| E6 Reasoning is captured in one motion | 2 | "Why this value?" plus "Add to the rationale"; travels and restores |
| F1 Parity of finish | 2 | Both registers polished; workbook register faithfully reproduces its original |
| F2 The current path is always visible, and switching is cheap | 1 | Path visible; the per-chart override leaves no trace at the global control (F-7) |
| F3 Respect in every sentence | 2 | Zero disparagement found by any lens |
| G1p Explicit users and tasks | 2 | The training audience and journey are written down (course, deck, this audit) |
| G2p Evaluation drove refinement | 2 | CC-8 visual pass and this audit; both with recorded changes or triage |
| G3p Iteration is recorded | 2 | The standard's capture section exists and this audit feeds the triage |
| G4p The whole experience is designed | 1 | Arrival through export designed; return (reload) is where the design stops (F-1) |

## 6. Findings, ranked

Each finding: severity (verified), the rubric line, evidence, and the smallest
fix. Screenshots live in `docs/hcd-audit-shots/`.

### F-1. A browser reload silently destroys the analyst's work. Severity 4.
Gate G3; B4; G4p. Change a parameter, type a rationale, reload: the value is back
at default and the note is gone, with no warning and no recovery. Measured:
`prodStart` back to "5", rationale input absent (11-after-reload). The register
choice survives (localStorage), which teaches the analyst that the tool
remembers, and then it forgets the two things that carry their judgment. The
packet proves the loss is real: a run exported after my reload carried all
defaults while my typed note still claimed a change (see F-16). *Smallest fix:*
persist params and notes to localStorage exactly as the register already is, and
restore on load with the existing run-restore code path; a `beforeunload` warning
is the fallback if persistence is deferred.

### F-2. Out-of-range input is accepted, recomputed, and badged like a choice. Severity 4.
Gate G6, G10; A6, B6, E2, E3. Type 999 into productivity (declared max 15): no
message appears anywhere, the CHANGED badge and "Why this value?" treat it as a
legitimate setting, and every headline recomputes (50.3% becomes 6.0%;
12d-999-recompute). The HTML min/max exist but nothing reads them. An analyst
with a typo now has citable wrong numbers dressed as a documented assumption.
*Smallest fix:* on field exit, flag values outside the declared bounds beside the
field (input preserved, no scolding), and hold the projection at the last valid
value with the stale-state stated until the value is valid.

### F-3. An emptied field silently becomes an assumption of zero. Severity 3.
Gate G6; A6, B6, E3. Clear the productivity field to retype: `Number('') === 0`,
so the engine recomputes at zero productivity and the box rerenders "0" under the
analyst's cursor mid-edit (12b-emptied: headline 49.1%, title recomputed to
"passes the 50% target in 2066"). *Smallest fix:* treat empty as
not-yet-a-value: keep the last valid value live, flag the field, never write "0"
back into the input.

### F-4. The active mode pill's label vanishes under the pointer. Severity 3.
Gate G8; B2. Clicking Verified turns the pill ink with ink text while the pointer
rests on it, which is exactly where the pointer is at the moment of switching.
Measured live: `color: rgb(20,62,90)` on `background: rgb(20,62,90)`, class
`mode__option--active`, `:hover` present; hover-free the same button measures
white on ink. Cause: `.mode__option:hover:not(:disabled) { color: var(--navy) }`
outranks `.mode__option--active` on specificity. The register toggles already
solve this with `:not(.register__option--on):hover`; the mode toggle missed the
idiom (styles/app.css:1314 vs :1558). On a projector on Tuesday, the trainer's
switch to Verified shows a blank dark capsule. *Smallest fix:* one selector
change, `.mode__option:not(.mode__option--active):hover:not(:disabled)`.

### F-5. The anchor-year notice fires for a 4-year shift and misses a 19-year one. Severity 3.
Gate G9; B2. Ecuador (anchored 2025 against a release running to 2029) gets a
full notice card explaining projected versus observed. Syria in Current mode
shows "through 2010" only in a chart subtitle: no card, for the most extreme
anchor in the dataset (13-ecuador-anchor vs 13-syria-anchor). A skimming reader
cites 90 projected years as though observed. *Smallest fix:* key the notice on
anchor-year-earlier-than-release-boundary (the condition the copy already
describes), not on whatever narrower predicate currently gates it; confirm
against the frozen vintage, where CC-8 recorded Syria anchored on 2010.

### F-6. One CONTEXT signifier, two different behaviors. Severity 2.
Gate G2; A1. All ten parameters carry an identical CONTEXT button; eight open a
full-screen data panel, two (Country, Fiscal rule) reveal a one-line note under
the field (06-context-00 vs 06-context-02). The code knows the difference (a
`kind` prop); the pixels do not. *Smallest fix:* differentiate the two kinds at
the button (distinct label or affordance for note-kind), or promote the two
notes into small panels.

### F-7. The per-chart register override is invisible at the global control. Severity 2.
Gate G2; F2. Flip one chart to Workbook while the page is on Briefing: the global
CHART VIEW toggle still shows Briefing selected with no trace of the exception,
and flipping the global silently clears overrides (by design, with good reasons
in the code, but the screen never teaches the rule; 08b-perchart-override).
*Smallest fix:* the override count the code already computes
(`overrideCount`) surfaces beside the global toggle ("1 chart differs"), with
the existing clear-overrides action as its click.

### F-8. Two mode-copy items sit outside the bounded parity claim. Severity 2, gated copy.
G13-adjacent; B7. The Verified bar leads with "Matches the official IMF Excel
workbook." before the exactly-worded parity sentence, and the intro More text
says the Explorer "aims for full parity with the original Excel tool"
(09-mode-verified, 03-intro-more-open). Both are IMF-facing wording, so this
audit flags rather than proposes: the decision belongs at Teal's copy gate with
CC-13's other held items. *Recorded, no fix proposed here.*

### F-9. Switching modes recomputes everything and says nothing. Severity 2.
A3; B2. Current to Verified moves the headline from 50.3% to 34.6% with no
statement of what changed or why (01-land vs 09-mode-verified). The vintage line
updates, but the connection between "different data" and "different numbers" is
left for the analyst to infer mid-surprise. *Smallest fix:* a one-line, dismissable
delta sentence after a mode switch ("Verified data moves the 2050 baseline from
50.3% to 34.6%"), in the notice style the app already owns.

### F-10. Two permanent explainer bands stand where working attention lives. Severity 2.
C1, C2, D4. The mode-bar caveat ("Same engine, newer inputs...") and the CHART
VIEW explainer sentence are read-me-first prose that never leaves the screen,
costing roughly two bands of the eight that precede the chart (01-land-full).
Both inform once and then shout forever. *Smallest fix:* first-visit display,
then collapse each into its control's tooltip or the About the data panel, with
the mode caveat resurfacing for one render after each mode switch (pairs with
F-9's delta line).

### F-11. The projection evidence starts 63% down the first screen. Severity 2.
G1-adjacent; C3. At 1440x900 the first chart pixel lands at y=565 and the time
axis is below the fold; at 1280x800 about 200px of line shows with no axis
(01-land, 02-land-1280x800; measured geometry). The tiles carry the headline, but
the evidence a chart-literate audience trusts is cropped. CC-8 reclaimed 150px
already; the remaining budget is the two F-10 bands plus the teaching-widgets
line. *Smallest fix:* the F-10 collapses plus folding the widget links into the
More expander reclaim roughly 120px, which lifts the full axis above the fold at
1440x900.

### F-12. The rigidity slider is the only entry, and ranges are invisible everywhere. Severity 2.
Gate G10; E2. Expenditure rigidity is set only by slider (0 to 1 in 0.1 steps, no
paired numeric field), and no numeric field in the sidebar states its valid
range on screen (04-sidebar-lower). *Smallest fix:* pair the slider with a small
numeric input (the standard's G10 floor), and add the range to each numeric
field's help line ("0 to 15").

### F-13. After download, the packet button goes illegible. Severity 1.
G8. Post-click, the primary button's label washes to near-invisible with no
completion confirmation (15b-export-after-download); likely the busy/disabled
style outliving the download. *Smallest fix:* restore the resting style on
completion and say "Downloaded" for one render.

### F-14. Clicking the "?" closes the help it promises. Severity 2.
A1. The InfoTip opens on hover and on focus, and click toggles: a mouse user
hovers (tip opens), clicks to "get help" (toggle closes it) and concludes the
control is broken (05-infotip-productivity captured the post-click nothing;
InfoTip.tsx: hover opens, `onClick` toggles). Keyboard users are fine.
*Smallest fix:* make click a no-op when the tip is already open from hover, or
drop the toggle and let click pin it open.

### F-15. The climate-versus-debt answer lives under Analysis, and Climate holds GDP. Severity 2.
B2. The tab named Climate carries the GDP damage channel (two charts); the
debt-under-scenarios fan chart that answers "what does climate do to debt" lives
under Analysis (07-tab-climate vs 07-tab-analysis). Two personas clicked Climate
first with the debt question in hand. The Climate tab's own caption even points
to Analysis for the consequence. *Smallest fix:* one orienting line at the top of
Climate naming where the debt answer lives, or swap the two tabs' names; the
information architecture question belongs to the v2.1 wave.

### F-16. The free-text analyst note can contradict the run it ships with. Severity 3.
B7-adjacent. The note field travels verbatim into every artifact; mine read
"Productivity moved to 4 on IMF staff projection" while the run carried all
defaults (run.json annotations vs params, this audit's own packet), and nothing
flags the drift because nothing can read prose. The structured rationale system
is immune; the risk is confined to the free-text field. *Smallest fix:* none
mechanical worth building; add one line to the note field's caption ("The
parameters table, not this note, is the record of what was set"), and rely on
the assumptions table sitting directly above it.

### F-17. Choosing a country is framed as deviating from Uganda. Severity 2.
A4 (conceptual model); G2-adjacent. Select Zambia and the Country field badges
CHANGED, cites "Engine default: UGA", and asks "Why this value?" for the report
annex (13-zambia-blocked, and every non-Uganda selection). The country picker is
scope, and the machinery for assumptions treats it as a deviating assumption: a
Zambian analyst is asked to justify analyzing Zambia, and the sidebar's changed
count and the annex carry country as an undocumented deviation. *Smallest fix:*
exclude `iso3c` (and arguably demography's country coupling) from the
changed-parameter machinery: no badge, no default citation, no rationale prompt,
no annex row state; the run file already records the country as identity, not
deviation.

### F-18. Results CSV appends its manifest below the data. Severity 2.
B3 (Excel-analyst lens). The CSV is data rows first with the run manifest and
parameters table appended underneath, so a one-pass `read_csv` chokes or
silently truncates (packet results.csv). *Smallest fix:* ship the manifest as
comment-prefixed header lines or as a sibling file named in the README; either
keeps one-pass parsing while preserving the travel-together property.

### F-19. Export intro says three files; the packet holds sixteen. Severity 1.
B2. "Three files that document this run" sits above a button reading "Download
the packet (16 files, one zip)", and the description omits the workbook
(07-tab-export). Copy drifted as the packet grew. *Smallest fix:* one sentence
update, and it is app copy rather than gated IMF-facing wording.

### F-20. Opening a context panel removes the tab bar's selection and the mode bar. Severity 2.
G2-adjacent; B2. Inside any CONTEXT panel the workspace swaps to panel chrome:
no tab appears selected and the mode bar leaves the screen; the mode stamp moves
into the panel's own header (06-context-02 and siblings). Personas reported a
brief where-am-I. The panel's Back button recovers. *Smallest fix:* keep the tab
bar rendered with the origin tab still selected under the panel, or add the tab
name to the panel kicker ("Context for ... , from Baseline").

### F-21. The inactive mode name is a bare word until pulled. Severity 1.
B2. "Verified" sits unexplained beside Current until clicked or About the data
is opened; the Excel analyst guessed right, the newcomer did not (01-land).
*Smallest fix:* title-attribute or one-word suffix in the pill ("Verified · Oct
2024") is enough; anything larger belongs to F-10's band budget.

### F-22. Internal names leak into analyst-facing lines. Severity 1.
B3. "the Shiny Explorer" (CHART VIEW explainer), golden-master file paths in a
SOURCE line (06-context-02), and "engine defaults" as a phrase all assume the
reader knows the project's insides. *Smallest fix:* sweep the four or five
surfaces for audience-facing nouns at the next copy pass; gated where IMF-facing.

### F-23. Keeping a default on purpose has no sidebar way to say so. Severity 1.
E6-adjacent. The "Why this value?" input appears only once a value moves, so the
analyst who deliberately keeps rigidity at 1.0 cannot note why from the sidebar.
The panels' "Add to the rationale" already writes a note at any value, so the
capability exists; only the sidebar surface hides it (Sidebar.tsx:
`showRationale = changed || rationale.length > 0`). *Smallest fix:* none urgent;
if wanted, a quiet per-field note affordance, or leave it to the panels and say
so in the field help.

### F-24. The intro defines the tool against an artifact only insiders know. Severity 1, gated copy.
A4 (newcomer conceptual model). The first sentence a cold reader must parse
defines the Explorer as a "reimplementation of the IMF's Quantitative Climate
Risk Assessment Fiscal Tool (Q-CRAFT)": exact and right for the Excel-fluent
audience, contentless for the economist who has never seen the original
(01-land). The More expander's second sentence ("It projects long-term fiscal
outcomes under different climate scenarios for 175 countries") is the sentence
the newcomer needed first. *Recorded for the copy gate; wording is IMF-facing.*

## 7. Journey verdicts by step

| Step | Verdict |
|---|---|
| Land | Oriented in seconds by tiles and sidebar; evidence cropped (F-11) |
| Orient | Honest and complete; two bands overshout (F-10); mode words bare (F-21) |
| Pick country | Works; wrongly framed as deviation (F-17); coverage invisible until selected (plan G1) |
| Read baseline | Strong; anchor asymmetry for Syria-class countries (F-5) |
| Run scenarios | Strong charts; tab boundary misleads first click (F-15) |
| Choose parameters informed | The panel system is the model; entry validation is the hole (F-2, F-3, F-12) |
| Record reasoning | Best-in-class one-motion capture; country pollution (F-17) |
| Export | Excellent packet; button state (F-13), CSV shape (F-18), stale copy (F-19) |
| Share and reload | Run file round trip exemplary; browser reload destroys work (F-1) |

## 8. Triage: the split for Teal

### (a) Pre-Tuesday micro-fix candidates. GATE: Teal picks any subset.

Each is one file, minutes of work, demo-risk-free, and none touches gated
IMF-facing wording:

| Option | Finding | The change | Risk |
|---|---|---|---|
| A1 | F-4 | One CSS selector: mode toggle adopts the register toggles' hover idiom | None measurable; register toggles already ship it |
| A2 | F-13 | Restore the packet button's resting style after download completes | None; cosmetic state fix |
| A3 | F-14 | InfoTip click stops closing a hover-opened tip | None; interaction-local |
| A4 | F-3 | Empty field stops becoming zero (keep last valid value, flag the field) | Low; one guard in the input handler |
| A5 | F-2 partial | Out-of-range flag beside the field on blur (full stale-state handling deferred to v2.1) | Low; additive, no engine change |
| A6 | F-19 | The export intro sentence counts the packet accurately | None; app copy, one sentence |

Recommendation if Teal wants a minimal set: A1 and A2 (both are visible on a
projector Tuesday), plus A4 (the likeliest live-typing accident in a training
room). A5 in the same sitting if the sitting exists; the rest wait.

### (b) The v2.1 wave: lane-sized specs, ready to become CC prompts

1. **Input integrity lane** (F-2, F-3, F-12 complete): declared bounds rendered
   at every field, blur-time validation, stale-projection state, slider paired
   with numeric entry. One component family (`Sidebar` fields), test-backed.
2. **Session persistence lane** (F-1): params and notes persist like the
   register, restore on load through the run-restore path, with a discard
   affordance. Includes the `beforeunload` guard as belt-and-braces.
3. **Country-is-scope lane** (F-17): remove `iso3c` from the changed-parameter
   machinery end to end (badge, count, annex, nag), plus the coverage
   signifiers in the picker from the parameter plan's G1.
4. **Mode comprehension lane** (F-9, F-10, F-21, F-8 pending Teal's copy gate):
   the delta sentence on switch, the two standing bands collapsed to
   first-visit-then-periphery, the pill suffix. Copy through Teal's gate where
   IMF-facing.
5. **Override visibility lane** (F-7): surface `overrideCount` beside the global
   register toggle with clear-overrides as its action.
6. **Anchor-notice predicate lane** (F-5): one predicate fix plus a regression
   test pinned on Syria in both vintages.
7. **Fold budget lane** (F-11 with F-10): the roughly 120px reclaim; measured
   before/after at both viewports, following CC-8's screenshot discipline.
8. **Packet polish lane** (F-16, F-18, F-22): CSV manifest shape, note-field
   caption, internal-name sweep. F-24's intro sentence rides with wave 4's copy
   gate; F-23 rides with lane 9's rationale work if Teal wants it at all.
9. **Decision-support lane**: the parameter plan's G2 to G5 specs
   ([param-decision-support-plan.md](param-decision-support-plan.md)).

### (c) Deeper redesign questions, for a slower table

- **Information architecture of the seven tabs** (F-15): whether Analysis,
  Climate, and Data are the right nouns and boundaries for the second hundred
  users, or whether the scenario question deserves the tab called Climate.
  Renaming is cheap; re-homing charts is not; both deserve evidence from the
  Sept 1 room.
- **A real undo model** (B4): Reset-all exists and reload now loses everything;
  whether the tool wants per-field undo, a session timeline, or named local
  drafts once persistence (wave 2) lands.
- **The first screen's contract** (F-11's endgame): whether the landing should
  ever show two explainer bands and eight text bands to a returning analyst, or
  whether returning users deserve a denser, chart-first layout with orientation
  progressive for first-timers only.
- **The rationale system's ceiling** (F-16): whether free-text notes should be
  validated against the run (they cannot be, mechanically, without constraining
  what analysts may say), or whether the assumptions table remains the sole
  record and the note is explicitly framed as commentary. The current design
  leans the right way; the question is whether to close the door formally.

## 9. Log

- 2026-08-29: v1.0. First application of hcd-standard-draft.md. Eight independent
  lenses, 60 raw findings, adversarial verification (53 survived; rejections were
  duplicates only), 24 consolidated findings (F-1 to F-24), four gate failures,
  triage split for Teal. No code or copy changed by this lane.
