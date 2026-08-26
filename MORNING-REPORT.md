# Lane 2 — React + D3 Explorer UI (TEA-1400)

**Branch:** `feat/lane2-ui` · **Date:** 2026-08-26 · **UI freeze target:** Sat 2026-08-29 EOD

Unattended build of `apps/qcraft-web`: a Vite + React 18 + TypeScript + D3 static
app replicating and extending the Shiny Explorer at `apps/qcraft-app`.

**Run 1** built the tabs, charts and parameter sidebar.
**Run 2** added the layer that makes it policymaker-ready: assumption provenance
and the one-click export packet. Run 2 is written up first, below; the run 1
record follows unchanged from "Status" onward.

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
