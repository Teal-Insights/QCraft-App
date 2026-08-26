# Lane 2 — React + D3 Explorer UI (TEA-1400)

**Branch:** `feat/lane2-ui` · **Date:** 2026-08-26 · **UI freeze target:** Sat 2026-08-29 EOD

Unattended build of `apps/qcraft-web`: a Vite + React 18 + TypeScript + D3 static
app replicating and extending the Shiny Explorer at `apps/qcraft-app`.

**Run 1** built the tabs, charts and parameter sidebar.
**Run 2** added the layer that makes it policymaker-ready: assumption provenance
and the one-click export packet.
**Run 3** added three standalone teaching widgets at `/widgets/*`, for the Sept 1
mental-map segment and for course Modules 1 to 3.

Runs are written up newest first. Each earlier record is unchanged below.

---

# Run 3: three intuition widgets

Three single-idea teaching widgets, separate from the Explorer's tabs, built for
the Sept 1 mental-map segment and for Modules 1 to 3 of the course. Each is its
own route, its own bundle, and one idea.

## The routes

| Route | Widget | What it teaches | Where its numbers come from |
|---|---|---|---|
| `/widgets/debt-dynamics` | The debt equation sandbox | The snowball term | The engine's debt recursion, three rates held constant |
| `/widgets/growth` | Where growth comes from | The growth-accounting skeleton | The engine's post-2029 block, exactly |
| `/widgets/climate-channel` | How warming reaches the debt line | Climate has no term of its own | Real Uganda golden masters, all six scenarios |

They are **separate Vite entry points**, not routes inside the Explorer. A
widget has to open full-screen with nothing else on the page, and has to survive
being iframed into a Quarto page at a fixed height without dragging the whole
Explorer in behind it. Both rule out a client-side router. The cost is that each
widget carries its own React and D3; the benefit is that the Explorer bundle
does not grow by a byte and each widget loads only what it draws.

## How to run

```bash
cd apps/qcraft-web
npm install
npm run dev
```

Then open any of:

- <http://localhost:5173/widgets/debt-dynamics/>
- <http://localhost:5173/widgets/growth/>
- <http://localhost:5173/widgets/climate-channel/>

The Explorer at <http://localhost:5173/> now carries a "Teaching widgets" line
under its intro links, so a trainer can reach them without typing a URL.

Built bundle:

```bash
npm run build            # dist/index.html plus dist/widgets/<slug>/index.html
npm run preview -- --port 4173
npm run qa:widgets       # drives all three routes in Chromium
```

On any static host `/widgets/growth` resolves to `/widgets/growth/index.html`
with no rewrite rule, and `base: './'` keeps the asset paths relative, so the
built bundle also opens from a `file://` path or from a sub-path deploy.

## Pedagogy, two lines each

**1. The debt equation sandbox.** A debt ratio moves for two reasons and only
one of them is the budget; the other is the snowball, `d * (r - g) / (1 + g)`,
which runs whether or not anyone decides anything. The default state carries
that on its own: Uganda's nominal growth of 10% runs ahead of its 8% borrowing
cost, so the snowball works *for* the country and a standing primary deficit
still leaves the ratio drifting down, which is not the story most people expect
the debt equation to tell.

**2. Where growth comes from.** Nominal growth is not an assumption you set, it
is three assumptions multiplied together, and the debt equation next door takes
its `g` from exactly this. The default already shows growth falling from 13.2%
to 4.8% and shows why in the bands: productivity converges, the demographic
dividend thins, and what is left at the end is mostly the inflation target.

**3. How warming reaches the debt line.** Climate has no term of its own in the
debt equation; it arrives through `g` and through the primary balance, which is
why the cause chart sits directly above the effect chart rather than beside it.
The rigidity slider is the control that carries the second half: pull it to zero
and the primary balance channel shuts completely, the fan narrows from 88 points
of GDP to 5, and the fact that it does not *close* is the point.

## What the numbers are

The brief allowed widgets 1 and 2 a simplified model. Widget 2 did not need one.

**Widget 1** is the engine's own recursion from `climate.py` phase 5, with one
deliberate simplification: `r`, `g` and the primary balance are held constant
across the 30 years, which no real projection does. That is what makes the
snowball legible, and the widget says so in a footnote. Its presets are read off
the Uganda golden masters (`interest_rate`, `baseline_v1`, `fiscal`).

**Widget 2** is the engine's post-2029 block ported line for line, including the
asymmetric logistic from `productivity.py`. It reproduces
`golden_masters/intermediate/baseline_v1/uganda.csv` on every year from 2030 to
2099, worst absolute difference 4.3e-14 on nominal growth. The three demography
variants are real UN WPP data derived from `SHARED/sample-data/UGA.json` by
`scripts/derive-working-age.mjs`; its Medium column reproduces the demography
golden master exactly, which is how we know the sample and the masters share a
vintage.

**Widget 3** uses real scenario data throughout. The GDP paths are read straight
off the six climate golden masters. Only the rigidity response is recomputed,
using `climate.py` phases 3 to 5, and that is licensed by a property of the
engine rather than by assertion: expenditure rigidity does not enter the GDP
block, so the fixture's `nominal_gdp` column is correct at every rigidity, not
only at the 1.0 the fixtures were generated with. The check that this holds:
at rigidity 1.0 the recomputation reproduces all six masters, worst absolute
difference 1.4e-13 on debt to GDP across 70 years, and at 0.0 the primary
balance ratio equals the baseline's to 4.3e-15.

Domain rules observed and pinned by tests: explicit for-loops with t-1 lookups
(rule 1), no `max(0, debt)` anywhere in the climate paths (rule 3), rigidity 1.0
sticky and 0.0 flexible (rule 4), and the scenario display order from
`SHARED/engine-api.md` section 7 rather than an outcome ranking.

## Three findings the build surfaced

**1. `inflation_start` disagrees with the golden masters, and it is not a small
disagreement.** `constants.py` and `SHARED/engine-api.md` both publish 5.0. The
Uganda golden masters are flat at exactly 3.5 from 2030 to 2099, which is the
signature of `inflation_start == inflation_end == 3.5`. The verify scripts show
where 3.5 comes from: they read it off the Excel workbook
(`excel_defaults.get("inflation_start") or 3.5`), and under the source-of-truth
hierarchy in CLAUDE.md the workbook outranks `constants.py`.

This is live in the Explorer today: the sidebar prints DEFAULT beside
"Inflation, start: 5.0%" while the charts under it are a 3.5% run.

Written up under the change request protocol at
`.change-requests/INFLATION-DEFAULT-2026-08-26.md`. Nothing upstream edited. The
growth widget opens on 5.0, matching everything a user can read in the app; its
parity test pins the model at 3.5, which is the parameter set the fixtures
actually represent. Loosening a tolerance to cover both would have hidden this.

**2. Paris-Aligned GAINS real GDP against the baseline.** Five scenarios lose
GDP; Paris is +0.43% by 2099, because the baseline already carries current-policy
damage and a 1.5C world carries less. Any widget or report copy that calls the
climate channel a "shortfall" will contradict its own chart on that one
scenario. The widget's caption branches on the sign, the chart is labelled "real
GDP against the baseline path" rather than "the growth hit", and a test asserts
the sign rather than assuming it.

**3. The primary-balance channel dominates the growth channel, by a lot.** For
Hot + Unadapted at 2099, of the 79.9 points of GDP between the scenario and the
baseline, 4.9 arrive through slower growth and 75.0 through the primary balance.
A spending ratio that drifts up every year compounds into the stock faster than
a slower denominator does. This is worth a trainer knowing before they stand up:
the intuitive answer ("climate hurts growth, slower growth means more debt") is
the *small* half of what the model does.

## Decisions

**1. The layout is a fixed-height grid, never a document.** The brief is binding
that the control and the chart it moves share one visual field, so the widget is
four rows of a `100dvh` container with the chart taking the slack. Nothing below
the fold because there is no fold. Three viewport tiers step the *chrome* down
rather than the charts: full, `max-height: 820px` (laptop and 16:9 projector),
and `max-height: 700px` (the Quarto iframe).

**2. New chart components rather than the Explorer's `LineChart`.** That one
clears its SVG and redraws, which is the right trade on a page whose parameters
move rarely and the wrong one on a widget built to be dragged. The widget charts
keep a stable DOM, join on series key, and transition geometry, y-axis and end
labels on one shared duration and easing. The end labels count rather than cut:
a number ticking from 36 to 51 is read as a consequence, the same number
replaced in place is read as a different chart.

**3. The y-axis of widget 1 is anchored, not auto-fitted.** An auto-fitted axis
is the wrong default for a widget whose job is to show a change: rescale on
every drag and the line barely moves while the numbers beside it do. Zero floor,
steps of twenty, minimum top of 60.

**4. The scenario picker is a focus control, not a filter.** The default is all
six, because the fan *is* the message and a trainer who never clicks anything
should still get it. Clicking a scenario brings it forward and recedes the rest;
it never has to be assembled.

**5. Predict-first is a line, not a wall.** A quiet question sits beside the
caption from load; the first interaction turns it into the answer. No modal, no
submit, no score, nothing to dismiss before the widget will work. A user who
never guesses still reads the takeaway.

**6. The compounding band is named rather than hidden.** `(1+e)(1+p)(1+pi) - 1`
exceeds `e + p + pi` by about half a point on a 13 point total. Folding that
residual into one of the other bands would make the chart a lie about a rule the
engine is strict on, so it gets its own band and the error becomes the lesson.

## Defects found by looking at the rendered widgets

All four passed typecheck, lint and unit tests.

**1. A chart silently ate every click on the controls.** The SVG took its height
from a prop while its container took height from the layout, so a 320px chart in
a 290px row hung over the controls row and, with `overflow: visible`, intercepted
the pointer. Charts now measure both dimensions from their container.

**2. Selecting a chip made its label vanish under the cursor.**
`.wchoice__option:hover` is one specificity step above `.wchoice__option--on`,
so hovering the selected chip painted navy text onto a navy pill. Fixed with
`:not(.wchoice__option--on):hover`.

**3. The counting end labels were not counting.** The tween read its start value
from a ref that had already been overwritten by the time the transition began,
and separately the effect could re-run mid-flight when the legend appeared and
resized the plot. Both look identical on screen and no test catches either. The
label now reads its start value out of its own rendered text, which is also the
honest statement of intent: count from what the audience can see.

**4. The climate widget fitted a 620px iframe by destroying itself.** It passed
the no-scroll check by squeezing the debt fan, the thing the widget is named
after, down to twenty pixels. `npm run qa:widgets` now fails a primary chart
under 140px, and a `max-height: 700px` tier drops prose instead of chart.

## For lane 4, when the course embeds these

- Embed at **720px of height or taller**. Below 700px the widget drops its
  standfirst and its footnote to keep both charts usable. The climate widget's
  standing caveat lives in that footnote (the baseline runs the fiscal rule and
  the debt floor, the six climate scenarios run neither, which is the engine's
  own design), so at a shorter height that caveat has to travel in the
  surrounding course text.
- Width is comfortable from about 820px. Below that the controls stack and the
  predict-first prompt moves under the caption.
- The routes are plain static pages with no query parameters. If the course
  wants a widget to open on a particular scenario or preset, that needs a small
  addition; say the word and it is a half-hour change.
- Nothing is fetched at runtime. A widget opens in a room with no network.

## Verification (run 3)

```
npm run typecheck    tsc -b --force, clean
npm run lint         eslint, clean
npm test             9 files, 116 tests passed (28 of them new)
npm run build        4 entry points, dist/index.html + dist/widgets/<slug>/
npm run qa:widgets   3 routes x 3 viewports, clean
npm run qa:tabs      Explorer unaffected, no console errors
npm run qa:export    export loop still green, print-to-PDF 431 kB
```

New tests:

| File | Tests | What it pins |
|---|---|---|
| `tests/widgets.debtPath.test.ts` | 8 | Algebraic identities. No hard-coded expected values, because the sandbox has no golden master: the decomposition is exact, `r = g` zeroes the snowball for any inputs, the path converges on its own steady state, and no debt floor is applied. |
| `tests/widgets.growthPath.test.ts` | 6 | Exact reproduction of `baseline_v1/uganda.csv` for 2030 to 2099, loaded from CSV. Bands sum to the total. The three UN WPP variants separate only after the near term, and Low turns negative. |
| `tests/widgets.climateChannel.test.ts` | 14 | Exact reproduction of all six climate golden masters at rigidity 1.0. The primary balance collapses onto the baseline's at 0.0. Rigidity is monotone. No debt floor. The contract's scenario ordering, including `High` ending below `Hot`. |

Bundle, gzipped: the debt widget loads 69 kB and no data at all; the growth
widget adds its 2 kB derived demography fixture; the climate widget shares the
119 kB golden-master chunk with the Explorer, which is the price of using real
scenario data and is paid once. The Explorer's own payload is unchanged.

## Open questions for Teal (run 3)

1. **`inflation_start`: 5.0 or 3.5?** See the change request. If the workbook
   says 3.5 then `constants.py` and `engine-api.md` are both wrong and the fix is
   cheap; if 5.0 is intended then the Uganda golden masters and the 147-country
   parity baseline were generated at the wrong parameter set. This affects what
   the Explorer's sidebar tells a ministry user on Sept 1, so it wants an answer
   before the freeze.

2. **Should widget 1 offer an adverse preset?** The brief named three (`r = g`,
   favourable `g > r`, Uganda-like) and all three are built. But Uganda's own
   numbers are already `g > r`, so two of the three teach the favourable case and
   the alarming one (`r > g`) is reachable only by dragging. A fourth preset
   would make the ladder complete. Held back because the brief was specific.

3. **Widget 3's baseline comparison mixes two things.** Part of the gap between
   the baseline and any scenario is climate damage and part is that the baseline
   runs the fiscal rule and the debt floor while the scenarios do not. That is
   the engine's design, and the widget says so in its footnote, but it is the
   first question a MoF macro team will ask. Worth a line in the course notes.

4. **Nominal or real for widget 1?** It is built in nominal terms, matching the
   engine and letting widget 2's `g` feed straight into it. The textbook version
   of the snowball is usually taught in real terms. If the training deck uses
   real, the widget should follow it rather than the other way round.

## Not done / not attempted (run 3)

- No URL parameters on the widget routes, so a course page cannot deep-link to a
  particular preset or scenario. See the lane 4 note above.
- No touch-specific handling. The sliders are native range inputs and work on a
  tablet, but nothing has been tested on one.
- Widget 1 does not offer country presets other than Uganda. The other two are
  Uganda-only by construction, since the fixtures are.
- The widgets do not read the Explorer's parameter state and the Explorer does
  not read theirs. They are teaching devices, deliberately separate from the
  run that gets exported.

---

# Run 2 — assumption provenance and the export packet

## The loop, step by step

This is the definition of done, and it is what `npm run qa:export` executes in
Chromium on every check. To do it by hand:

1. **Open the app.** `npm run dev`, then <http://localhost:5173>. It opens on
   Uganda at the engine defaults. Every parameter in the sidebar carries a
   quiet **DEFAULT** tag.

2. **Set parameters.** Change *Debt target* to 45, *Fiscal rule* to No,
   *Inflation, long run* to 5. Each one flips to a **CHANGED** tag, grows a
   cyan rule down its left edge, and prints the engine default it moved off
   ("Engine default: 50% of GDP").

3. **Record why.** A changed parameter opens a one-line field beside its
   guidance text, headed **Why this value?**. Type the rationale, for example
   "Charter for Fiscal Responsibility ceiling, agreed with MoFPED." Leave one
   change unannotated on purpose and watch what happens to it in step 4. The
   sidebar foot keeps a running count: "3 of 10 parameters changed", and
   "1 changed parameter has no rationale note. The report annex will say so."

4. **Open the Export tab.** It shows the annex *before* the export button,
   because the moment to notice a missing rationale is before the file is sent.
   The unannotated change is named in a callout. The table lists all ten
   parameters, changed and unchanged, with value, engine default, state and
   rationale.

5. **Export the packet.** One click on **Export packet (3 files)** downloads:

   | File | What it is |
   |---|---|
   | `qcraft-UGA-<date>-<time>-report.html` | The print-ready report |
   | `qcraft-UGA-<date>-<time>-results.csv` | Every scenario, every year, with the run manifest appended below the data |
   | `qcraft-UGA-<date>-<time>-run.json` | The run manifest, which is also the reproduction payload |

   One filename stem, so the three sort together in a downloads folder. The
   browser may ask permission for a multi-file download; the tab says so.
   **Preview the report** opens the same HTML in a new tab without downloading.

6. **Read or print the report.** Open the HTML in any browser and use Print.
   The A4 print run is five pages: title block and summary, the two baseline
   charts, the two scenario charts, key numbers, then the annex on its own page.
   Figures and tables never split across a page break, and the WEO history
   shading and status banner survive printing.

7. **Import it back.** Press **Reset to engine defaults**, then
   **Choose a run file** and pick the JSON. Every parameter and every rationale
   note comes back exactly as recorded, and the tab reports what it loaded and
   how many parameters moved. Export again and the new run file is identical to
   the old one apart from its timestamp.

## What was built

**Parameter provenance.** Every parameter states DEFAULT or CHANGED. A changed
one shows the engine default it left and opens the rationale field. A note stays
visible once written even if the value goes back to its default, and the annex
prints the state beside it: silently discarding text a user typed is worse than
showing it in context. `Reset to engine defaults` resets values and keeps notes,
for the same reason.

**The run manifest** (`src/run/manifest.ts`) is both the provenance record and
the reproduction payload, so the exported run JSON *is* the manifest:

```jsonc
{
  "schema": "qcraft-run/1",
  "app": { "name": "Q-CRAFT Explorer", "version": "0.2.0" },
  "generatedAt": "2026-08-26T17:20:08.586Z",
  "country": { "iso3c": "UGA", "name": "Uganda" },
  "dataVintage": "weo-2024-10",
  "engine": { "kind": "fixture", "source": "...", "ignoredParams": [...] },
  "params":   { /* all ten, in registry order */ },
  "defaults": { /* what the defaults were at export time */ },
  "notes":    { "debt_target": "Charter for Fiscal Responsibility ceiling..." }
}
```

The annex table a reader sees is *derived* from this at render time rather than
stored, because two copies of one fact in a single file can disagree and the one
the reader trusts would be the wrong one. `defaults` **is** stored even though
the app knows its own: engine defaults can move between releases, and a report
saying a parameter was changed has to say what it was changed *from* at the time.

**Data vintage** is new to `Provenance` and required, not optional. Fixture runs
report `weo-2024-10`, the frozen verification vintage the golden masters were
computed against (SHARED/VINTAGE-TOGGLE.md, SHARED/DATA-NOTES.md §2) — *not* the
`weo-2026-04` vintage the Shiny Explorer is demonstrated on. Two runs with the
same parameters on different vintages are different runs.

**Import** (`src/run/runFile.ts`) is strict about the payload and forgiving about
its surroundings. Every parameter is validated against the registry and against
the engine's own enumerations; a file that cannot be *fully* restored is refused
with a message naming the parameter as the sidebar names it. A partially
restored run that still renders is the failure worth engineering against: it
looks like the report and is not. Differences in app version, data vintage or
engine defaults load with a warning instead, because those are facts the user
should see rather than reasons to reject a colleague's file.

## The report

Modelled on two documents, both read for this run.

**Register: the IMF FAD high-level summary for Uganda**
(`source-materials/2024_IMF-FAD_Uganda-C-PIMA-Summary.pdf`). Title block naming
the work and who prepared it, a disclaimer, then *Summary of findings* before any
detail. That report is where the September 2023 Q-CRAFT workshop results were
published, so it is literally the document this export will sit beside on a desk.

**Structure: the LIC-DSF scenario tool's briefing pack**
(`licdsf-scenario-tool/ui/export.py`, `demo/export_evidence.py`,
`output/evidence-macronia-canonical/`). Headline table, charts, provenance back
page. Its hard-won rule is carried over intact, in its own words: a pack "is the
artifact most likely to be forwarded to someone who never saw the app, so the
claim status has to travel inside it."

So the claim status travels inside all three files. A fixture-backed run says, at
the top of the report, in its status banner and again in its annex, that the
figures were **not** recomputed from the parameters below them, and lists every
parameter the figures do not reflect with requested and used values. The CSV
carries the same manifest below its data rectangle, because a spreadsheet is what
gets pasted into a deck without the report attached. The moment an adapter
reports `kind: 'engine'`, the caution removes itself and the banner reads
"Computed run" — no flag to remember.

The summary paragraph is assembled from values read off the run and stops there.
The tool projects; it does not advise. A sentence of interpretation written by
the exporter would be a claim nobody computed.

Binding wordings from SHARED/REFERENCE-NOTES.md are used verbatim and are pinned
by tests: baseline parity exact for 147 of 147 tested countries, climate-scenario
parity for ratio metrics only, and FADCP (Centorrino, Massetti and Tagklis, 2024)
as the climate damage source.

**Charts are re-rendered, not serialized.** `src/export/chartSvg.ts` is a pure
function from the same `ChartSeries` the screen takes to an SVG string, with no
DOM. The on-screen chart is imperative D3 written into a live DOM inside a
`useEffect` and sized by a ResizeObserver, so it only exists once mounted,
visible and measured. Serializing it would export an empty box for every tab the
user never opened. The geometry deliberately mirrors `LineChart.tsx` — same
margins, scales, monotone curve, WEO shading, de-collided direct labels — so a
reader recognises the printed chart as the one they were looking at. It also
means charts are testable.

**Print CSS treats the printed page as the deliverable**, since a ministry user's
route to a PDF is the browser's own print dialog: A4 with real margins, figures
and tables that do not split, headings that do not strand at the foot of a page,
and `print-color-adjust: exact` so the WEO history shading and the status banner
survive (browsers drop background fills otherwise). The report is fully
self-contained: inline CSS, inline SVG, no link, no script tag, no webfont, no
network reference at all — a test asserts each of those. It opens from a USB
stick in a room with no network and still looks like itself.

## Decisions

**1. Three files, not a zip.** A zip needs a new dependency and hides the
contents behind an extra step. Each of the three is independently useful, and
they share a filename stem so they stay together. The downloads are staggered
250 ms apart because browsers silently drop programmatic downloads that arrive
in the same tick.

**2. One parameter registry.** `src/content/params.ts` is now the single ordered
list of parameters, labels and value formatting. Before it there were two lists —
the Sidebar's JSX and the mock adapter's ignored-parameter disclosure — and they
had already drifted ("Inflation (long-run)" vs "Inflation — long-run (%)"). A run
manifest read next to the app cannot have the app calling a parameter one thing
and the export calling it another.

**3. Notes attach to parameters, not to changes.** See above. The alternative,
dropping a note when its value returns to default, deletes work the user did.

**4. The rationale field asks "Why this value?"** rather than "Notes". It is the
question a reviewer will ask of the annex, and the field exists to answer it.

**5. Run 1's em-dashes are fixed, and the rule is now mechanical.** The brief
bans em-dashes in UI copy; run 1 broke it in ten places while build, typecheck,
lint and tests were all green, because nothing was checking. `tests/copy.test.ts`
now scans every source file and every exported artifact. CLAUDE.md's stated
philosophy is that discipline is enforced mechanically rather than through
prompts; this is the mechanism.

**6. The climate damage attribution was wrong and is corrected.**
SHARED/REFERENCE-NOTES.md is binding: the source is the FADCP Climate Dataset
(Centorrino, Massetti and Tagklis, 2024) building on Kahn et al. (2021), and the
"NGFS Phase IV damage functions" line is a known error. The Methodology tab
carried that error verbatim from the Shiny app. It now cites FADCP, as does the
report, and a test asserts the report never says "NGFS". **This is a deliberate
divergence from the Shiny app's copy** — flagged here because run 1's sourcing
rule was to carry that copy across verbatim.

**7. The Data tab's CSV downloads now go through the packet's builder**, so a
spreadsheet forwarded from there carries the same run manifest. A forwarded CSV
should not be the one copy of the numbers with no provenance attached.

**8. The orchestrator's prompts and logs are now gitignored.** A `git add -A`
mid-run swept `PROMPT.md`, `PROMPT-RUN2.md`, `PROMPT-RUN3.md` and
`agent-run*.log` into the repository; `agent-run2.log` was being written while it
was staged, and `PROMPT-RUN3.md` describes work that has not started. Untracked
and ignored, files left on disk. Mentioning it because it is visible in the log
between commits `34b0ff9` and `bfeba3a`.

## Defects found by looking at the rendered artifacts

Run 1's lesson held. All four passed build, typecheck, lint and 82 tests while
being wrong on the page. Each is now pinned by a test.

1. **The annex printed the country as "UGA".** The manifest knows the name. The
   fix resolves the code to the name only where the manifest actually knows it,
   so a default belonging to another country is never relabelled with this
   country's name.
2. **"-0.0"** in the key-numbers table. Moderate's 2099 GDP gap rounds to -0.04:
   a sign on a number that does not have one.
3. **"Real GDP runs from 0.4% relative to the baseline path"** reads as 0.4% *of*
   the baseline. Now "0.4% above ... to 5.9% below the baseline path".
4. **Every rationale was clipped at the Export tab's table edge.**
   `.data-table td` sets `white-space: nowrap` for the numeric tables and
   outranks a bare `.cell--note` on specificity.

And in the PDF: forced page breaks before *Climate scenarios* and *Key numbers*
left two pages nearly empty, and the footer straddled a boundary onto a page of
its own. Only the annex now forces a break, and print cells are tighter. Seven
pages to five, no orphan.

## Open questions for Teal (run 2)

1. **Should the report carry a Fiscal Risk Statement draft?**
   SHARED/REFERENCE-NOTES.md names the capstone as "the EXPORT PACKET plus a
   two-paragraph Fiscal Risk Statement draft". The packet is built; the draft is
   not. I did not write one because it would be prose *about* the numbers rather
   than the numbers, and the line this report holds is that it reports what was
   computed and does not interpret. If you want the draft in the packet, the
   right shape is probably a fourth artifact: a Markdown skeleton with the
   figures substituted in and the judgement sentences left blank for the analyst.
   Say the word and it is an hour's work.

2. **Rationale notes are lost on a page refresh.** They live in React state
   only. `localStorage` would survive a reload, which matters in a training room
   where someone closes a tab. I did not add it because it is unasked-for
   persistence with its own failure modes (stale notes attached to a different
   run). The run JSON is the durable form. Worth a decision before the workshop.

3. **The report is Uganda-shaped in one place**: it opens on whatever country the
   result names, but the summary paragraphs assume a baseline and six scenarios
   exist. For the ~13 countries the engine throws on (§8 of the contract), the
   Export tab will need the same "unavailable" treatment as the country selector.

4. **Should the packet include the intermediate series?** Same question run 1
   asked of the Data tab. The CSV currently carries the six fiscal columns; the
   fixtures also hold GDP, productivity and interest-rate paths.

## Not done / not attempted (run 2)

- **No Fiscal Risk Statement draft.** See open question 1.
- **No persistence across a page reload.** See open question 2.
- **No zip.** See decision 1.
- **Still no engine-backed recomputation.** Unchanged from run 1 and disclosed
  everywhere, now including inside every exported file.
- **No `git push`, no remotes, no publishing.** All work is local commits on
  `feat/lane2-ui`.

## Verification (run 2)

Run from `apps/qcraft-web`. All green as of the final commit.

| Check | Command | Result |
|---|---|---|
| Build | `npm run build` | pass, static bundle in `dist/` |
| Typecheck | `tsc -b` (inside build) | pass |
| Lint | `npm run lint` | pass, 0 problems |
| Tests | `npm test` | pass, **88/88 across 6 files** |
| Rendered tabs | `npm run qa:tabs` | all 6 tabs render, no console errors |
| **Export loop** | `npm run qa:export` | **18/18 checks, no console errors** |
| Python lane unbroken | `uv run pytest packages/qcraft-engine/tests` (repo root) | pass, 198/198 |

`npm run qa:export` needs the preview server up:

```bash
npm run build
npm run preview -- --port 4173 &
npm run qa:export            # writes /tmp/qcraft-export, exits 1 on any failure
```

It drives the full loop in Chromium: sets three parameters, writes two rationale
notes, checks the app names the third change as undocumented, clicks once and
catches three downloads, asserts what each artifact says, resets, re-imports the
JSON, confirms every parameter and note came back, re-exports and confirms the
new run file matches, then renders the report from `file://` and prints it to
PDF. A wiring mistake between a control and the manifest would pass every unit
test in the suite; this is what would catch it.

New test files:

| File | Covers |
|---|---|
| `tests/manifest.test.ts` (25) | Manifest contents, annex derivation, the run-file round trip, every refusal and every warning |
| `tests/export.test.ts` (32) | The packet, the report's claims, chart SVG, CSV shape and quoting, escaping |
| `tests/copy.test.ts` (2) | No em-dashes in any source file or any exported artifact |

---

# Run 1 — tabs, charts and the parameter sidebar

Kept as written on the morning of 2026-08-26. Where run 2 changed something
recorded here, it is called out in the run 2 sections above.

## Status: what is mock-backed vs engine-backed

**Everything on screen is mock-backed, and the app says so on every tab.**

`SHARED/engine-api.md` **landed mid-session (12:44)** and this app is now coded
against it — but the engine package itself, `packages/qcraft-engine-ts`, is in
**lane 1's clone, not this one**, so `@qcraft/engine` cannot be imported here
yet. That is a lane-integration step (lane 1 merges to `main`, this clone
rebases), not something I can or should force from inside this clone.

| Layer | Backing |
|---|---|
| Chart and table **values** | Real Q-CRAFT output — the engine's own golden masters for Uganda |
| **Recomputation** from parameters | Not wired. Moving a control does not change the numbers |
| **Country** coverage | Uganda only (the only country with fixtures in this clone) |
| Tabs, charts, controls, export, guidance | Fully built, engine-independent |
| **Contract mapping** | Written and tested — `src/engine/pipelineResult.ts` |

The numbers are truthful, not invented. `src/engine/mockAdapter.ts` reads:

- `packages/qcraft-engine/tests/golden_masters/intermediate/fiscal/uganda.csv`
- `packages/qcraft-engine/tests/golden_masters/intermediate/baseline_v1/uganda.csv`
- `packages/qcraft-engine/tests/golden_masters/intermediate/climate/*_uganda.csv`

The UI surfaces this itself. `ProvenanceNotice` renders a standing banner
explaining the numbers came from fixtures, and lists **every parameter the user
changed that the backend could not honour**, with requested-vs-used values. A
ministry user never has to guess whether the line responds to the slider. That
banner is driven by `EngineResult.provenance`, not by a flag — it disappears on
its own the moment an adapter reports `kind: 'engine'`.

### Wiring in the real engine

The risky part is already done and tested. `src/engine/pipelineResult.ts` maps
the contract's `PipelineResult` to this app's `EngineResult`, and
`tests/pipelineResult.test.ts` exercises that mapping against golden-master rows
in the contract's own shape — so the only untested step left is the import
itself. Full procedure is in the header of `src/engine/adapter.ts`. In short:

1. `npm install` the workspace package once lane 1 is merged.
2. Write `qcraftAdapter.ts`: `runPipeline(input, toPipelineParams(params))` →
   `toEngineResult(result, meta)`.
3. Replace the local shape declarations in `pipelineResult.ts` with the
   package's exported types; the compiler confirms they agree.
4. Change one line in `adapter.ts`.

Two traps the contract flags, both carried into the code comments:

- **`runPipeline` throws** for roughly 13 of 198 countries (Bangladesh is the
  documented error-path fixture). It must be wrapped in try/catch and the
  country marked unavailable — §8.
- **Per-country JSON is ~0.25 MB.** 175 of them must be fetched on demand from
  `public/data/<ISO3>.json`, not bundled, or the initial payload is ~40 MB.

---

## Done

**Scaffold** — Vite + React 18 + TS + D3, following the
`debt-projection-tool-v2` conventions studied first: same `vite.config.ts`
base-path strategy, same strict tsconfig with project references, same
`tsc -b && vite build`, same imperative-D3-in-`useEffect` chart pattern, vitest.

**Engine seam** (`src/engine/`) — one interface, `EngineAdapter`, is everything
the UI knows about the engine. `EngineParams` mirrors the contract's
`PipelineParams` key-for-key.

**Fixture adapter, pinned to the golden masters** — it reads the *intermediate*
masters because `final/uganda.csv` is a five-year snapshot (2023/2030/2050/2075/
2099) and cannot draw a line, while the intermediates are the same source of
truth at full annual resolution (91 rows, 2009–2099). `final/uganda.csv` is then
used as the **parity pin**: `tests/adapter.test.ts` asserts the adapter
reproduces all 35 scenario-year rows to 9 decimal places. Expected values are
loaded from CSV, never hard-coded (AGENTS.md, "GOLDEN MASTER TESTS").

**Five tabs**, matching the Shiny Explorer:

- **Baseline** — three summary cards (debt / revenue / primary balance at 2050)
  plus debt-to-GDP, revenue-vs-expenditure, and the two balances.
- **Analysis** — all seven paths on one axis. The spread *is* the finding, so the
  headline cards, a callout, and the chart title all state it: for Uganda the gap
  between Paris-Aligned and Hot+Unadapted at 2099 is 87.7 points of GDP.
- **Climate** — GDP deviation from baseline (the damage, made visible), then the
  Shiny app's 2029 = 100 index. See "Decisions" for why that order.
- **Data** — full table (also the accessibility fallback for every chart) with
  per-scenario and all-scenario CSV export, built client-side.
- **Methodology** — the Shiny app's Methodology panel carried across so both apps
  say the same thing to the same audience.

**Sidebar** — the Shiny app's five controls plus the five this UI newly exposes:
productivity start/long-run, inflation start/end, and the interest-rate approach
(constant nominal / constant differential / constant real). Every control opens
on the engine default; the three interest-rate options are the engine's own
`select_rate` strings, and picking one shows what it holds fixed.

**Guidance tooltips** on every parameter — keyboard-reachable, `role="tooltip"`,
not `title`. Where the Shiny app has help text it is copied verbatim; where this
UI exposes something new the text is condensed from the engine docstrings, cited
per entry in `src/content/guidance.ts` so a reviewer can check the claim.

**Brand theme** (`src/theme.ts`) — token file was reachable. Values copied in
verbatim with provenance (tokens.json v1.0.0, TEA-1118, measured 2026-07-23).
Font family names only, with system fallbacks; **no font files, no webfont
fetch**, per the `fontLicense` note in the token file.

**Visual QA pass** — every tab rendered in Chromium and inspected. This caught
three defects that build, lint, and tests all passed; see below.

---

## Decisions

**1. Defaults come from the engine, and a test pins them.**
`ENGINE_DEFAULTS` copies `DEFAULTS` from
`packages/qcraft-engine/src/qcraft_engine/constants.py`, cited in a comment. The
five newly exposed parameters default to `productivity_start=5.0`,
`productivity_end=1.2`, `inflation_start=5.0`, `inflation_end=3.5`,
`interest_rate_mode="Nominal interest rate"` — the values previously hard-wired
inside the pipeline, so the app opens on exactly the projection the Shiny
Explorer shows. A test asserts the whole object, so engine drift breaks loudly
instead of silently changing the opening screen.

**2. Scenario colour: I got this wrong first, then the contract corrected it.**
I initially replaced the engine's `COLORS` dict with a single warm ramp ordered
by warming severity, because `COLORS` fails a real measurement — Hot+Unadapted
`#E74C3C` vs High `#C0392B` sit at normal-vision ΔE 9.0 against a floor of 15,
and on the Analysis tab those two lines are the whole point of the chart.

The measurement was right; my replacement was not. `SHARED/engine-api.md` §7 says
plainly:

> "Do not present the six as a single ordered severity scale, and don't apply a
> sequential colour ramp implying one. Group `Hot` / `Hot_Adapted` /
> `Hot_Unadapted` as a family and treat `Paris` / `Moderate` / `High` as separate
> pathways."

Lane 1 is right on the domain: `High` (4°C+) ends at 67.8 while `Hot` (3°C) ends
at 94.0, because they come from different NGFS damage pathways. A single ramp
asserts a ladder the data does not have. I had noticed the anomaly, documented
it, and encoded it anyway.

Now: three distinct hues for the three standalone pathways, and one hue in three
lightness steps for the 3°C family (adaptation *is* a real order within it).
Validated on the light surface — the family passes all four ordinal checks, and
the cross-family set passes the harder all-pairs test at CVD ΔE 8.4 and
normal-vision ΔE 15.1. A test pins the family/pathway split so the forbidden ramp
cannot creep back. Two caveats are recorded in `theme.ts` rather than papered
over: brand navy sits outside the categorical band **by design** as the neutral
reference line, and Paris at 2.69:1 relies on the relief rule, which the legend,
tooltip, and Data tab satisfy.

Side benefit: the regrouping fixed a readability problem the ramp had created —
High sitting below Hot now reads as a legible finding rather than a ramp drawn in
the wrong order.

**3. Parameters that cannot be honoured are disclosed, not faked.**
The obvious alternative was to apply a plausible-looking transform so sliders
appear to work. For a ministry-of-finance training tool that is the worst
available option: it teaches users to trust a number that is not a projection.

**4. `final/uganda.csv` became the test oracle rather than the data source.**
The brief named it as the fixture. It holds five years per scenario — enough to
pin correctness, not enough to draw a line. Using the intermediate masters for
the curves and `final/uganda.csv` for the parity assertion gets both truthful
charts and a real check, off the same source of truth.

**5. The Climate tab leads with a chart the Shiny app does not have.**
Both Shiny charts (GDP in levels; GDP indexed to 2029 = 100) are unreadable for
their stated purpose: Uganda's GDP grows roughly tenfold over the horizon, so a
6% climate shortfall is about a line width and all seven scenarios draw on top of
each other. Rebasing to 100 does not help — the index still runs to ~1,000 and is
dominated by growth. So the lead chart is now GDP **deviation from baseline**,
which removes growth and leaves only the damage (Paris +0.4% to Hot+Unadapted
−5.9%). The index chart follows for Shiny parity, retitled for what it actually
shows.

**6. Excluded `apps/qcraft-web` from the uv workspace.**
The root `pyproject.toml` globs `members = ["apps/*"]`, so the new npm directory
made every `uv run` in the repo fail with "missing a `pyproject.toml`". Added
`exclude = ["apps/qcraft-web"]`. Verified afterwards: `uv sync --all-packages`
then `uv run pytest packages/qcraft-engine/tests` → **198 passed**. This was a
regression I introduced and repaired, not a pre-existing issue.

**7. Toolchain versions had to move off the reference repo's.**
`@vitejs/plugin-react` v4 (what `debt-projection-tool-v2` pins) does not accept
Vite 8 as a peer; v6 does. ESLint 9 is out of support, so this app is on 10.

---

## Defects found by looking at the rendered app

All three passed build, typecheck, lint, and tests while being wrong on screen.
Recording them because they are the argument for keeping `scripts/screenshot.mjs`
in the freeze checklist.

1. **A chart title claimed a divergence the chart could not show** — the Climate
   tab's lead chart (decision 5 above). The stated number was correct and
   invisible.
2. **Label collision** — "Peak 51.4% in 2024" landed on top of "WEO → 2029" on
   the Baseline debt chart. The boundary label now sits at the foot of its rule;
   annotations are pinned to data and data crowds the top of these charts, the
   bottom strip never does.
3. **Truncated y-axis ticks** — real GDP reaches 10⁶ LCU billions and full digits
   overflowed the left margin, rendering as ",000,000". Now SI-abbreviated above
   10k, plain digits below (so a 0.4pp balance does not render "400m").

---

## Open questions for Teal

1. **Country selector with one country.** The dropdown lists Uganda alone, with a
   note. Once the engine lands it should list all 175 — but ~13 of them throw
   (§8 of the contract). Should the unavailable ones be hidden, or listed and
   disabled with the reason? Listing them is more honest about coverage;
   hiding them is cleaner in a demo.

2. **Interest-rate approach labels.** The sidebar uses the engine's own strings
   ("Nominal interest rate", "Interest-growth differential", "Real interest
   rate") so they match `select_rate` exactly, with a plain-language line under
   each. The brief called them "constant nominal / constant differential /
   constant real", which is clearer for a training audience. I kept the engine
   strings as the option labels and put the plain-language framing in the help
   text — say the word and I will flip which is primary.

3. **Scenario palette vs. existing training materials.** The colours now differ
   from the Shiny app's. §7 of the contract explicitly makes this a UI-lane call
   and the measurements support it, but if the companion guide or the Uganda
   slides already show the old colours, continuity is a judgement I cannot make
   from here. The change is isolated to `series` in `theme.ts`.

4. **Whether the Data tab should expose the intermediate series.** It currently
   shows the six fiscal columns the Shiny app shows. The fixtures also carry GDP,
   productivity, and interest-rate paths a ministry analyst might want.

---

## Not done / not attempted

- **No engine-backed recomputation.** Blocked on the engine package reaching this
  clone; disclosed in-app rather than faked. The mapping to the contract is
  written and tested, so this should be a short step once lane 1 merges.
- **No `git push`, no remotes, no publishing** — per the brief. All work is local
  commits on `feat/lane2-ui`.
- **No dark mode.** The Shiny app has none and the brand tokens document light
  surfaces only; inventing dark steps would mean inventing brand colours.
- **No font files committed**, by license.

---

## Verification

Run from `apps/qcraft-web` unless noted. All green as of the final commit.

| Check | Command | Result |
|---|---|---|
| Build | `npm run build` | pass — static bundle in `dist/` |
| Typecheck | `tsc -b` (inside build) | pass |
| Lint | `npm run lint` | pass, 0 problems |
| Tests | `npm test` | pass — 26/26 across 3 files |
| Engine parity | `tests/adapter.test.ts` | 35 scenario-year rows match `final/uganda.csv` to 9 dp |
| Contract mapping | `tests/pipelineResult.test.ts` | maps golden-master rows in `PipelineResult` shape |
| Rendered app | `node scripts/screenshot.mjs` | all 5 tabs render, no console errors |
| Python lane unbroken | `uv run pytest packages/qcraft-engine/tests` (repo root) | pass — 198/198 |
