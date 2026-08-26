# Lane 2 — React + D3 Explorer UI (TEA-1400)

**Branch:** `feat/lane2-ui` · **Date:** 2026-08-26 · **UI freeze target:** Sat 2026-08-29 EOD

Unattended build of `apps/qcraft-web`: a Vite + React 18 + TypeScript + D3 static
app replicating and extending the Shiny Explorer at `apps/qcraft-app`.

---

## How to run it

```bash
cd apps/qcraft-web
npm install          # see the NODE_ENV note below
npm run dev          # dev server at http://localhost:5173
npm run build        # static bundle into apps/qcraft-web/dist/
npm run preview      # serve the built bundle
```

Checks:

```bash
cd apps/qcraft-web
npm run build        # tsc -b && vite build  (typecheck is part of build)
npm run typecheck    # tsc -b --force, if you want it standalone
npm run lint         # eslint
npm test             # vitest run
```

Visual QA (needs the preview server running):

```bash
npm run build && npm run preview -- --port 4173 &
node scripts/screenshot.mjs        # writes /tmp/qcraft-shots, exits 1 on console errors
```

**`NODE_ENV` gotcha.** This machine exports `NODE_ENV=production`, which makes
`npm install` skip `devDependencies` — and every build tool here (vite,
typescript, eslint, vitest) is one. `apps/qcraft-web/.npmrc` sets `include=dev`
so a plain `npm install` works anyway. If you ever see "vite: command not found"
after a clean install, that file is the first thing to check. (Lane 1 hit the
same trap — SHARED/engine-api.md §10 documents it for the engine package.)

The built bundle is fully static with no runtime network dependency: it opens
from `file://`, a sub-path, or a web root without reconfiguration (Vite `base`
defaults to `'./'`; set `VITE_BASE_PATH` at build time to target a fixed path).

---

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
