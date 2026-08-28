# Freeze report: the Q-CRAFT Explorer at `freeze-2026-08-29`

**CC-8, 2026-08-28.** The last feature-touching lane before the freeze. Merges
CC-6's [#65](https://github.com/Teal-Insights/QCraft-App/pull/65) onto the
integration branch, closes the three held items and the fiscal-anchor decision,
regenerates the stale vintage manifest, runs the visual pass, and reports the
freeze battery.

Issue: TEA-1400. Worktree: `~/GitHub/QCraft-App-cc8`. Branch:
`feat/freeze-polish`, cut from `feat/explorer-v2-integration` at `2f0e90e`.

Dry run Monday. Uganda training Tuesday 2pm EAT.

---

## 1. Bottom line

The battery is green. 583 automated tests pass across three suites. Both engines
agree over 5.1 million numeric cells at 4.441e-16 against a 1e-12 tolerance, on
every selectable country and both vintages, and every refusal matches on type
and message. All six browser loops run clean on a fresh build. Zero em-dashes
reach any shipped file, and all eleven of Teal's gated strings are in the bundle
verbatim.

166 of 175 countries project on the frozen vintage and 167 of 175 on the
current one. The other nine and eight refuse with a notice that says why. None
crashes and none fabricates.

One gate reached this lane already answered: the fiscal-anchor decision was
approved on 8/28 and is implemented. Nothing is held for Teal that blocks the
freeze. Section 9 lists what is deferred, with its reasoning.

---

## 2. The merge

CC-6's `feat/zambia-completeness` merged onto `feat/explorer-v2-integration` as
`d947b81`, then `feat/freeze-polish` continued from there.

**No semantic resolutions were needed, and that is a fact about the topology
rather than luck.** The merge base was `2f0e90e`, the integration head itself:
CC-6 cut its branch after CC-7's merge went green and nothing landed on the
integration branch in between. Git did a fast-forward-shaped three-way merge
with no conflicting hunks in 37 files.

What was checked by hand rather than assumed, because a clean text merge is not
a clean semantic merge:

| Question | Answer |
| --- | --- |
| Does CC-6's `readCoverage` rewrite still agree with the app's own blocking? | Yes. It imports `buildMacroForFiscal` from the engine, so the app and the engine answer the anchor question with one function. This lane then built the anchor notice on the same field. |
| Do the typed errors reach the UI, or stop at the adapter? | They reach it. `qcraftAdapter.run` catches `QCraftDataError` and turns it into the two-shape notice, and the Zambia screenshot in `docs/screenshots/freeze/blocked-country-after.png` is that path end to end. |
| Did the Serbia Parquet repair change anything downstream that was not regenerated? | Yes, and it had not been. See section 5. |
| Do the counts CC-6 published reproduce on the merged state? | Exactly. 2,549,457 and 2,564,822 cells, 9 of 9 and 8 of 8 refusals agreeing. Section 8. |

PR #65 is merged. The battery in section 8 was run after the merge, not before.

---

## 3. The three held items

Teal's resolutions of 2026-08-27 night, approved as recommended.

### 3.1 The teaching-widget link, back at the point of decision

When `debt_target` and `expenditure_rigidity` became data panels in CC-5, the
judgment note they replaced took its link to the teaching widget with it. All
three widgets stayed reachable from the intro block, so nothing was unreachable;
what was lost was the link beside the control you are actually setting.

`DataContext` gains an optional `href` and `linkText`, so the link is read off
the same registry that decides what sits behind every context button rather than
written a second time, and `panelWidgetLink()` resolves it. `ContextFrame`
renders it last in the footer.

Last is not cosmetic. Anything added above the source line moves it, and the
source line is inside a fold check. Below it, the source line does not move.

`scripts/context-qa.mjs` now holds the link to the same 900px fold as the
caption and the source line, and checks its text and that it points at a bundled
widget. Measured: the debt-target link sits at 788px and the rigidity link at
742px, against a 901px threshold. A point-of-decision link a user has to scroll
to is not at the point of decision.

### 3.2 The fold slack, documented as a decision

The one pixel of slack in `context-qa.mjs` is now recorded as Teal's call for
the Tuesday build, with the reason (it was measuring float noise, not layout)
and the work it defers. Sidebar-height reclaim opens
`docs/post-training-list.md`, which is new and carries six deferred items with
who deferred each and where the reasoning lives.

### 3.3 The panel record, scoped by vintage

The context panels drew one frozen extract whatever mode the app was in, so a
user in Current mode read April 2026 numbers off every chart and then opened a
panel showing them the October 2024 record under a Current-mode stamp.

The difference is not cosmetic: WPP 2022 puts Uganda's 2050 working-age
population at 57,115 thousand and WPP 2024 at 55,240, and that is the exact
number the demography panel asks a user to form a view against.

`scripts/derive-context-data.mjs` now reads the vintage payloads themselves
rather than the frozen `SHARED/sample-data` slice. The two are byte-identical
for `weo-2024-10`, so every frozen row is unchanged and the golden-master checks
in `tests/context.model.test.ts` still pin them. `demography.csv` and
`macrofiscal.csv` gain a `vintage` column, every lookup in `sources.ts` takes a
vintage, and the panel source line names the release from the mode registry, so
no vintage id and no release name is written anywhere under `src/context/`.
CC-2's `engineWiring` guardrail still passes.

**Productivity is deliberately not scoped.** The pipeline carries the WDI table
forward unchanged and every vintage manifest records that, so two copies would
assert a difference the data does not have. The generator fails loudly if the
vintages ever stop agreeing, which turns an assumption into a check.

**Two panels stay on the frozen record on purpose, and now say so.** The
interest-rate record view projects its three approaches on the golden master's
growth and deflator path, so anchoring the April 2026 effective rate onto it
would produce three curves belonging to neither vintage. `GOLDEN_MASTER_VINTAGE`
names that, the source line prints the release, and the peer view beside it,
which covers all 175 countries, is mode-correct. The rate panel's golden-master
line also lost a label it had outgrown: "Path this projection used" stopped
being true the moment the app ran two vintages and let a user move the sliders.

The mode stamp stays. It is now a label on the right record rather than a caveat
on the wrong one.

---

## 4. The fiscal anchor, approved 8/28

CC-6 raised `.change-requests/FISCAL-ANCHOR-2026-08-27.md`: the engine anchors
its projection on the last year still carrying nominal GDP and revenue, which is
not always the last year the source publishes a row for. The workbook anchors on
its last WEO column with no `IFERROR`, so it returns an error rather than a
projection for exactly these countries. Six of them reach an answer here, and
nothing on screen said their projection rested on an older anchor.

Teal approved option B on 8/28: keep computing, name the anchor year on screen
wherever their results show, and add a line to About the data.

**Derived, never listed.** `Coverage` gains `sourceMaxYear`, `anchorShiftOf()`
compares it against the engine's own anchor, and the result carries `anchorShift`
as a nullable pair rather than two bare years, so a consumer that forgets to
compare them draws nothing instead of drawing a claim. Which countries are
affected is a property of the vintage and is worked out from the data every run.

Three surfaces, because a packet outlives a screen:

- the notice above every results tab, beside the climate-coverage notice
- the exported report's summary and the packet `READ-ME.txt`
- `ABOUT.anchorNote`, where the comparison with the workbook belongs at length

The on-screen wording states what happened and stops. Excel respect governs the
About line: the workbook refusing to anchor on an absent figure is described as
the conservative choice it is.

Syria is the case that makes it worth shipping. Its frozen-vintage projection is
anchored on 2010 against a release that runs to 2029.
`docs/country-coverage.md` section 8.1 records the resolution and lists every
affected country in both vintages.

---

## 5. What the freeze surfaced

Three things, none of which could be found by reading the diff.

**5.1 Serbia's reference row was still blank.** Rerunning CC-5's peer derivation
changed exactly one row: `weo-2024-10` SRB, whose four demography statistics and
productivity residual were empty. They were empty because the frozen Parquet
filed Kosovo's population under SRB and `demography_country("SRB")` raised, which
CC-5 documented and handed to CC-6. CC-6 repaired the Parquet. Nobody
regenerated the table, so a Serbian user in Verified mode found their own country
missing from the demography strip. The test that pinned the broken state is
inverted and `docs/parameter-data.md` section 10 records both halves.

**5.2 The chart caption contradicted the chart.** Every debt chart's subtitle
read "through 2029" while the shaded band is drawn at the country's own boundary
year. For six countries those are different, and for Syria they are nineteen
years apart. The anchor notice this lane added points at that band by name, so
the two were about to disagree in front of a reader. Fixed, with a test.

**5.3 One regression, mine, caught by a browser loop.** Saying the productivity
record is carried forward unchanged is worth saying, and the sentence I first
wrote for it added a line to the panel's source paragraph and pushed the source
line to 907px against a 901px threshold. Shortened to the fact itself, which
lands at 890px. That is the fold check earning its keep rather than a check to
work around.

---

## 6. The visual pass

96 screenshots of every tab, panel, notice, widget and state, in both data modes,
both chart registers and both training-room viewport sizes, plus the report and
chart pack as rendered PDFs, reviewed with a visual model.
`apps/qcraft-web/scripts/visual-sweep.mjs` is the script that took them, kept in
the repo because the states worth looking at are the ones nobody visits on the
happy path: the loading state, the three coverage notices each on a country that
really triggers it, and every context panel in both modes.

Six fixes, chosen for how much they change the way the product lands rather than
for how many boxes they tick. Before and after pairs are in
`docs/screenshots/freeze/`.

### 6.1 The first chart was never visible

`fold-1440-before.png` / `fold-1440-after.png`,
`fold-1280-before.png` / `fold-1280-after.png`

470px of chrome sat above the tab body on every visit, and 590px with a notice
showing. Measured in the DOM, not eyeballed: on a 1440x900 laptop 53 per cent of
the first chart's plot was on screen, and at 1280x800 under a third of it. A
tool whose output is a chart opened on a paragraph about itself.

The intro paragraph became one line with the rest behind a disclosure, keeping
the two facts that must never be a click away (what this is, and that it is not
an IMF product) in the visible line. The same four links stopped appearing in
both the intro and the footer. The mode bar, tab strip, register bar and stat
cards each gave back a few pixels.

150px in total. The plot now shows 84 per cent at 1440x900 and 57 per cent at
1280x800.

### 6.2 A caption that contradicted its picture

Section 5.2. The subtitle takes the boundary year the chart actually draws.

### 6.3 A label the data ran through

`threshold-label-before.png` / `threshold-label-after.png`

In the briefing register the debt line crossed the words "Your debt target, 50%
of GDP" at the right-hand end of the plot, which is where a reader looks
hardest. Two causes. The rule label was pushed with its rule, under the series,
so its halo knocked out the gridlines and the data was then painted over it. And
the placement heuristic chose which END the label went to but never which SIDE
of the rule, so on Uganda's shape it went above, into the only crowded space on
the chart.

Now it is drawn after the series, and placed on whichever side of the rule the
data leaves empty. The halo is insurance rather than the mechanism, and the debt
line stays unbroken.

### 6.4 A legend nobody could use

`legend-before.png` / `legend-after.png`

The briefing climate charts draw four scenarios in one gray so the eye goes to
the two edges, and the legend listed all four: four identical gray swatches
against four different names, wrapping onto a second line. That invites a reader
to match a swatch to a line and then gives them no way to do it.

One band on the chart is one entry in the legend, named "The 4 scenarios in
between", which is what the subtitle already called them. Four entries on one
line.

### 6.5 A dead end

`blocked-country-before.png` / `blocked-country-after.png`

A country the tool refuses ended in a notice with 330px of blank ivory under it.
The context panels answer the question that notice raises, and are open to a
blocked country by design, so the screen now says so instead of stopping.

### 6.6 Nine badges saying nothing

`sidebar-before.png` / `sidebar-after.png`

"DEFAULT" appeared on all ten sidebar rows in letterspaced caps, squeezing the
label column hard enough that three labels wrapped with an orphaned word. The
label is the most important text in the row and was getting the least space. The
badge now appears only when a value has moved. The resting state is still stated
in the sidebar summary line and in full in the export annex, which lists every
parameter with its state either way.

### Considered and deliberately not changed

**The half-empty pages in the exported report and chart pack.** Several pages
run 50 per cent white. The cause is `break-inside: avoid` on a tall figure: when
a chart will not fit in the space left, it moves to the next page. The
alternative is splitting a chart across a page break, which is worse in a
document a ministry prints. Left as it is.

**The workbook register's legends.** The workbook register reproduces how the
IMF Excel workbook and the Shiny Explorer draw these charts, legends included.
Direct labelling there would be a better chart and a worse reproduction, and
reproduction is what that register is for. The briefing register is where the
chart-craft standard applies, and it direct-labels.

Three of the six have a test in `tests/chartSpecs.test.ts` that would have caught
them. The other three are layout, and the sweep is what catches those.

---

## 7. The stale manifest

`data/vintages/weo-2026-04/manifest.json` recorded `country_json.bytes` as
42387728; rebuilding on the merged code produces 42387676, the 52 bytes
MERGE-REPORT.md section 8.3 held. It was generated on 8/26, before CC-2's
Serbia/Kosovo and NaN/Infinity repairs, and those repairs change the emitted
payloads. Two parquet sizes move with them.

Regenerated, and **regeneration verified byte-stable**: running
`qcraft-pipeline run` twice in succession produces identical bytes for all four
parquet files, all 175 country JSON payloads, `index.json`, and a manifest that
differs only in `generated_utc`.

---

## 8. The freeze battery

Everything below was run on the tagged commit, against a fresh build, with the
preview server confirmed to be serving this worktree (`lsof -a -p <pid> -d cwd`,
plus an asset-hash diff against `dist/index.html`).

### Test suites

| Suite | Result |
| --- | --- |
| `uv run pytest` | 215 passed |
| `npm --prefix packages/qcraft-engine-ts test` | 83 passed |
| `npm --prefix apps/qcraft-web test` | 285 passed |
| **Total** | **583 passed, 0 failed** |

`ruff`, `pyright`, both eslint configs and `tsc -b --force` all clean.

### Differential harness

The permanent 14-country set, both vintages: 184,296 cells each, max absolute
difference 4.441e-16 against a 1e-12 tolerance. PASS.

The full cross-engine sweep, every selectable country, baseline plus all six
climate scenarios, both vintages:

| Vintage | Countries compared | Cells | Max difference | Refusals agreeing | Result |
| --- | --- | --- | --- | --- | --- |
| `weo-2024-10` | 166 | 2,549,457 | 4.441e-16 | 9 of 9 | PASS |
| `weo-2026-04` | 167 | 2,564,822 | 4.441e-16 | 8 of 8 | PASS |

Every refusal matches on both engines by type and by message, which is the
comparison CC-6 added and the reason the Zambia divergence survived the whole
sprint at PASS before it existed.

### Pipeline sanity and derived tables

`pipeline/sanity_check.py` clean. `derive_peer_data.py --check` reports all four
reference tables identical to what is committed, after the one-row Serbia repair
in section 5.1.

### Browser loops

All six clean on a fresh build, on a port nobody else was on.

| Loop | Result |
| --- | --- |
| `qa:export` | 0 failures across four runs, including the briefing register and the Maldives no-signal case |
| `qa:context` | all six panels open, respond to their parameter, and fit the fold |
| `qa:tabs` | no console errors |
| `qa:widgets` | all three widgets clean at projector, laptop and iframe sizes |
| `qa:registers` | no console errors |
| `qa:context-shots` | all figures written |

The visual sweep also reports no console error across 96 screenshots in both
viewports.

### Copy gates

`bash scripts/freeze-check.sh` runs both against the built bundle, which is the
artifact that ships and the only thing a source grep cannot stand in for.

- **Em-dashes: zero** in every shipped `.js`, `.css` and `.html` file, and every
  em-dash under `src/` is inside a code comment. 46 remain inside `.js.map`
  sourcemaps, which embed those same comments and render nothing; the script
  reports that count rather than hiding the exclusion.
- **Gate strings: 11 of 11.** Eight present verbatim (the Verified badge with
  "only", the FADCP short form, the precise chain, the Current divergence note,
  the zero-climate heading and body, the sub-zero note, CC-6's corrected
  unavailable copy) and three superseded ones absent (the false "every other
  country" sentence, the pre-gate badge without "only", the "as much as" cover
  title).

---

## 9. Known limitations

What ships with this build that a user or a trainer should know about. None of
it is a defect in the code; all of it is a limit in the data or a deliberate
deferral.

### 9.1 Eleven countries have no climate estimates

Maldives, Singapore, Malta, Barbados, Tonga and six others carry an all-zero
FADCP slice, so all six scenarios land exactly on the baseline. The app says so
on screen and the exported artifacts carry the same statement. That is missing
data, not an absence of risk, and sea-level rise and disaster damage are outside
this model everywhere.

CC-6 reconciled the number against the source: User Guide footnote 12 names 25
economies, 14 of them are not selectable for want of productivity data, Kosovo is
absent from every source, leaving exactly the 11 the app notices.

### 9.2 Nine countries on the frozen vintage and eight on the current one cannot be projected

They refuse with a notice naming the reason, and the two failure shapes get
different sentences because "we cannot compute this" and "we could draw
something you should not cite" are different statements to a ministry. Zambia and
Libya are the cases the training is most likely to meet. `docs/country-coverage.md`
has the full table and the workbook citation that settles why refusing is the
faithful behaviour.

### 9.3 Six countries project from an older anchor than the release supports

Named on screen as of this build. Section 4.

### 9.4 The parity claim is deliberately not strengthened

Baseline parity is verified for 147 of 147 tested countries; climate-scenario
parity is confirmed for ratio metrics only. That wording is held in place until
an independent fresh Excel recalculation confirms the post-fix climate parity.
The climate-derivation fix moved severe scenarios upward, so the current wording
is the safe side of the claim. Item 3 of the post-training list.

### 9.5 Serbia's climate scenarios were wrong before PR #65

A disclosure, not a decision. Anyone who ran a Serbia scenario in the shipping
app before that merge saw numbers wrong by about 7 points of debt-to-GDP by 2082.
Fixed, pinned in the differential set, and now correct in both the payload and
the reference tables.

### 9.6 The deferred list

`docs/post-training-list.md` carries six items with who deferred each and where
the reasoning lives: the sidebar-height reclaim, the stronger range-of-validity
caution on sub-zero paths, the Excel recalculation harness, whether to offer the
newer FADCP estimates, the mechanical expiry of the 2030 convention at the April
2031 WEO, and the course's version of the zero-climate notice.

### 9.7 The bundle does not open from a file:// URL

The built bundle is blank under that scheme: a `type="module"` script and a
cross-origin stylesheet are both blocked. The offline story is a one-command
local server, in section 10 and in the README. Any Tuesday contingency uses that
command, never a double-clicked `index.html`.

---

## 10. Building and serving it

### Setup, once, in a fresh worktree

```bash
uv sync --all-packages
npm ci --prefix apps/qcraft-web
npm ci --prefix packages/qcraft-engine-ts
```

The per-country JSON payloads and the vintage parquet are gitignored build
artifacts, so a fresh worktree has neither. Rebuild both from the pipeline's raw
cache:

```bash
cp -R ../QCraft-App/pipeline/.cache/raw pipeline/.cache/
cp -R ../QCraft-App/data/processed data/
uv run qcraft-pipeline init-base
uv run qcraft-pipeline run
uv run --package qcraft-pipeline python scripts/build_vintage_json.py weo-2024-10 --force
```

Without them `npm run build` fails in its `prebuild` hook and
`tests/verifiedMode.test.ts` and `tests/anchorShift.test.ts` skip loudly.

### Build

```bash
npm --prefix apps/qcraft-web run build
```

Output is `apps/qcraft-web/dist`: 5.6 MB of application assets plus 88 MB of
staged country payloads, which are fetched one country at a time and never all
at once.

### Serve

```bash
python3 -m http.server 8080 --directory apps/qcraft-web/dist
```

Then open `http://localhost:8080/`. This is the offline contingency for the
training room. The teaching widgets are at `/widgets/debt-dynamics/`,
`/widgets/growth/` and `/widgets/climate-channel/`.

For development, `npx vite preview --port <port> --strictPort` from
`apps/qcraft-web` after a build. Before trusting any browser assertion, check the
server is serving this worktree:

```bash
lsof -a -p "$(lsof -nP -iTCP:<port> -sTCP:LISTEN -t | head -1)" -d cwd
```

### Rerunning the battery

```bash
uv run pytest
uv run ruff check .
npm --prefix packages/qcraft-engine-ts test
npm --prefix apps/qcraft-web test
npm --prefix apps/qcraft-web run typecheck
npm --prefix apps/qcraft-web run lint
npm --prefix apps/qcraft-web run build
bash scripts/freeze-check.sh
bash scripts/sweep/sweep_all.sh
uv run --package qcraft-pipeline python pipeline/sanity_check.py
uv run --with polars --with pyarrow python scripts/derive_peer_data.py --check
```

Then, with a preview server running on a port nobody else is on:

```bash
export QCRAFT_PREVIEW_URL=http://localhost:<port>/
export QCRAFT_PYTHON=$PWD/../../.venv/bin/python3
npm run qa:export -- /tmp/qa-export
npm run qa:context -- /tmp/qa-context
npm run qa:tabs -- /tmp/qa-tabs
npm run qa:widgets -- /tmp/qa-widgets
npm run qa:registers -- /tmp/qa-registers
npm run qa:context-shots -- /tmp/qa-shots
npm run qa:sweep -- /tmp/qa-sweep
```

### Regenerating the derived data

```bash
node apps/qcraft-web/scripts/derive-context-data.mjs
uv run --with polars --with pyarrow python scripts/derive_peer_data.py
```

Both are idempotent and both have a `--check`-style path: the peer script takes
`--check`, and the context script fails loudly rather than writing if the
vintages disagree about a table it writes once.
