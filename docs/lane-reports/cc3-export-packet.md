# CC-3: the full export packet

**Branch `feat/export-packet`, cut from `feat/explorer-v2-integration`. 2026-08-27.**
Issue TEA-1400.

This is CC-3's morning report. It is filed here rather than at `MORNING-REPORT.md`
because CC-1 hit an add/add conflict on that exact path from three lanes at once
and resolved it by moving every lane report to `docs/lane-reports/`
(INTEGRATION-REPORT.md section 3.2). Four CC lanes were each told to write
`MORNING-REPORT.md`; following that literally would recreate the conflict CC-1
already paid to fix.

---

## 1. Bottom line

The packet went from three files to six documents plus one image per chart,
downloaded as a single archive. 179 unit tests pass. The end-to-end loop passes
on two countries in both data modes with zero failures, plus a third country
carrying no climate data at all.

Four defects were found and fixed on the way, three of them in what the exported
artifacts told a reader. They are section 4, and they are the part of this report
worth reading.

One decision needs Teal and is raised as a gate in section 6.

---

## 2. What shipped

### Excel

A real `.xlsx`, six sheets, in this order:

| Sheet | Why it is there |
| --- | --- |
| README | Mode, vintage, claim status, the run label, the analyst's note, and what every other sheet holds. First, before any number. |
| Assumptions | Every parameter, its default, its state, and the analyst's rationale. Frozen header, filter. |
| Key numbers | The report's headline table, so the two cannot disagree. |
| Debt by scenario | Years down, scenarios across. Select the block, insert a chart. |
| GDP vs baseline | The same shape for the damage measure. |
| Results (all series) | Every scenario, year and series. 641 rows, filterable. |

The two wide sheets exist because "keep working in Excel" means being able to
select a rectangle and press the chart button, not pivot a long table first.

`workbookSpec.ts` is a plain object, asserted on in vitest with no library.
`workbookXlsx.ts` is a thin exceljs adapter behind a dynamic import: the 256 kB
gzipped chunk never reaches a user who does not export a workbook.

**SheetJS was measured and rejected.** Its npm build is pinned at 0.18.5, which
carries a CVSS 7.8 prototype-pollution advisory with no upgrade path from the
registry, and the community build silently drops bold header rows, cell fills and
frozen panes because those are paid-tier. Three of the things this workbook needs,
gone with no error. A hand-rolled OOXML writer also worked and was 84 times
smaller; it was rejected on schedule risk, because openpyxl accepting a file is
not evidence that Excel will, and nothing available here could test that.

### Chart images

One PNG per figure, at twice screen resolution, with the takeaway title and a
provenance line drawn into the image. A PNG is the most detachable thing in the
packet: it lands in a slide with no report and no manifest around it, so the
country, the mode, the vintage and the standing disclaimer have to be part of the
picture.

Three subset Inter faces ship in `src/assets/fonts/` with their licence, lazily
loaded with the rasterizer. They are not decoration. An SVG loaded through an
`Image` is an isolated document: it does not inherit page styles and never
fetches an external font. Measured, in two engines: without embedding, the
rasterized chart is **bit-identical** to one asking for a font family that exists
nowhere. Klim faces are never embedded; the rasterizer replaces the SVG's
`font-family` outright, so no licensed name reaches the PNG path.

### Chart pack

One print document, all figures, captions, and the run's identity in a running
header and footer. Verified by printing it, not by reading the CSS.

### Annotations

A run label and an analyst's note on the Export tab, beside the existing
per-parameter rationale. They travel into the report (above the findings, where a
reader who stops after page one still sees the only part a human wrote), the
chart pack, the README, the CSV trailer and the workbook README. Additive to
`qcraft-run/1`, so every run file exported before today still restores whole.

---

## 3. Verification

`npm run qa:export` was rewritten as the two-country, two-mode loop. For each of
Uganda and Kenya, in Current and Verified mode, it drives the real app in a real
browser: sets parameters, writes rationale, a label and a note, downloads the
archive, unpacks it with the system `unzip`, opens the workbook with `openpyxl`,
reads the PNG headers, prints both documents to PDF and asserts the page box,
then resets the app, re-imports the run file and compares the restored state
against the exported one.

**0 failures across 4 runs and 172 checks**, plus the Maldives case.

| Run | Archive | Workbook | PNGs | Report | Chart pack | Round trip |
| --- | --- | --- | --- | --- | --- | --- |
| Uganda, Current | 10 entries | 6 sheets, 641 rows | 4 at 1400px | 441 kB PDF | 3 pages | exact |
| Uganda, Verified | 10 entries | 6 sheets, 641 rows | 4 at 1400px | PDF | 3 pages | exact |
| Kenya, Current | 10 entries | 6 sheets, 641 rows | 4 at 1400px | 440 kB PDF | 3 pages | exact |
| Kenya, Verified | 10 entries | 6 sheets, 641 rows | 4 at 1400px | PDF | 3 pages | exact |

"Round trip: exact" means every parameter, every rationale note, the run label,
the analyst's note, the country and the data mode came back identical after a
reset and a re-import.

Artifacts, screenshots and PDFs are in the QA output directory named by the
rerun command in `docs/export-contract.md` section 4.

---

## 4. Defects found and fixed

### 4.1 The report told a reader a nil spread was the climate risk

Eleven selectable countries carry an all-zero climate slice
(INTEGRATION-REPORT.md section 7.2). For those, the report said their six
pathways spread 2099 debt across **0.0 points of GDP** and then, in the next
clause, that *that spread is the climate-fiscal risk*. Both sentences are
arithmetically true and together they read as a finding about the country when
they are a fact about the dataset.

`noClimateSignal()` now catches it and the artifacts say the dataset has no
coverage for this economy, that missing data is not an absence of risk, and that
sea-level rise and disaster losses are outside the model everywhere. The wording
follows the 2026-08-27 gate resolution; CC-2 owns the app's own notice and its
exact text.

### 4.2 The chart pack shipped charts with no assumptions attached

Caught by a test asserting that every text artifact carries the analyst's
rationale. The chart pack is the piece most likely to become an annex, detached
from the report that carried the annex, so it now carries a compact table of the
changed and annotated parameters, and states how many sat at the default and
where the full list is.

### 4.3 Importing a run for a different country lost its warnings

The Export tab held the import result in local state. Importing a run for another
country makes the app refetch, and the tab panel renders a loading line while it
does, which unmounted the component and destroyed that state. The confirmation
vanished, and so did every warning `parseRun` raises about a version or vintage
the file does not match. Those warnings are the whole reason the parser is
forgiving rather than strict, and they were being discarded in exactly the case
that produces them. The state moved up to `App`.

Found by the loop, not by a test: it only reproduces when the imported run
changes the country, which is why the second country in the matrix earns its
place.

### 4.4 The report repaginated between A4 and US Letter

`reportStyles.ts` declared `@page { size: A4 }`. On US Letter the content box is
18mm shorter, so the same report is three pages on one and four on the other.
Both print documents now use 210mm by 279mm, A4's width and Letter's height,
which lays out identically on both. The harness asserts the page size of the
produced PDF rather than trusting the stylesheet, which is how the report's
version of this was caught after the chart pack's was already right.

### 4.5 Also fixed, from CC-4's handover

`reportHtml.ts` partitioned figures by whether the id started with `baseline-`
or `scenario-` and dropped the rest silently. Figures now carry a `tab` and
`groupFigures()` guarantees every figure lands in exactly one section, with an
unrecognised tab under "Other charts" rather than nowhere.

The field is `tab`, carrying CC-4's `ChartTab` values verbatim, so the merge is a
swap of the producer with nothing below it changing. An earlier draft of this
report claimed that was already true when the field was still called `group`; it
was not, and it is now. Two corrections to their seam doc came out of reading
their source rather than their prose: the cover tab is `Overview` in the code and
"Cover" in the doc, and the registry holds eleven charts rather than twelve, of
which ten reach any one export (`climate-gdp-levels` is workbook-register only,
`overview` is briefing-register only). The old rule kept 3 and dropped 8. The
defect is exactly as CC-4 described it; only the arithmetic was off.
`tests/packet.test.ts` pins the whole id list and both counts.

---

## 5. Decisions taken, with reasons

- **One archive, not staggered downloads.** Run 2's comment argued against a zip
  on two grounds: it needs a dependency, and it hides the contents. The first
  stopped being true, because `CompressionStream` is the platform's own DEFLATE
  and the archive format is a hundred lines. The second is answered by keeping
  every piece individually downloadable underneath it. At eight files the
  stagger stops working: Chrome raises a prompt and the tail goes missing.
- **`qcraft-run/1` kept, annotations optional.** Following the precedent CC-2 set
  for the mode field. Bumping the schema would have stranded every run file
  exported before today for no gain.
- **My own mode module was deleted.** It was written before CC-2's landed on the
  base branch. `src/content/modes.ts` owns every claim about the IMF original and
  a second opinion on the same sentence is what that file exists to prevent.
- **No packet checksum.** exceljs is not byte-deterministic across engines. The
  text artifacts are reproducible and the workbook is not, so nothing publishes a
  hash that would sometimes be wrong.
- **The .xlsx serializer is not unit-tested.** Under Node, exceljs resolves to a
  different serializer from the browser build that ships. A passing Node test
  would be testing code no user runs. The browser loop opens the real file with
  openpyxl instead.

---

## 6. For Teal: one gate

**Sub-zero debt paths in an exported chart.**

Switching **Fiscal rule** to No, which the sidebar exposes to any trainee, lets a
primary surplus repay the entire stock and keep going. The engine floors the
baseline at zero and deliberately does not floor the climate scenarios, a domain
rule recorded in CLAUDE.md. Uganda at a plausible training parameter set
(`debt_target 45`, `fiscal_rule No`, `inflation_end 5`) reaches **minus 131% of
GDP by 2099** under Hot Unadapted, and minus 199% under Paris. At engine defaults
Uganda is entirely normal: 52.2% baseline, 170.6% Hot Unadapted.

So a trainee can produce, in two clicks, a branded chart titled "Climate
scenarios spread 2099 debt across 68 points of GDP" over six lines that are all
below zero.

What CC-3 did, which claims nothing: the debt figures and the worst-outcome tile
now state that below zero means the projection has repaid the stock and continues
into a net asset position, and that only the climate scenarios go below zero
because only the baseline is floored. Pure arithmetic, no judgment.

What needs your call, because it is a methodology-communication question rather
than an engineering one:

- **A. Leave it as is.** The note is factual, the model is doing what it is
  documented to do, and the training can address it verbally.
- **B. Add a stronger caution** to the exported artifacts when any path goes
  below zero, saying the projection has left the range the debt ratio usefully
  describes. This is a claim about the model's range of validity, which is why it
  is not mine to write.
- **C. Ask CC-6 or the engine lane** whether the floor asymmetry should hold at
  the reporting layer even though it does not at the engine layer.

**Recommendation: A for Tuesday, B in the next touch.** The factual note removes
the "something is broken" reading, which was the acute risk. B needs wording that
belongs with the rest of the IMF-facing copy going through your gate, and there is
no time to get that right before the freeze.

**Cost of deferral:** low, and bounded. If a trainee hits it on Tuesday the chart
now explains itself. The risk of shipping B unreviewed is higher than the risk of
shipping A.

---

## 7. Two things the sprint should know

**A shared working tree cost real time.** This session started in
`~/GitHub/QCraft-App` as instructed, and mid-edit another lane checked its own
branch out in the same directory, so this lane's files were sitting uncommitted
on someone else's branch. They were recovered intact and the tree was returned to
what the other lanes had. The orchestrator has since made per-lane worktrees the
standard; this report is a second data point for it.

**Preview servers collide too.** Ports 4173 and 4183 were both already held by
other lanes' preview servers. A stale server serves another branch's build while
every assertion fails against it, and the failure looks like a bug in your own
code. `docs/export-contract.md` section 4 says to pick a port nobody else is on.

---

## 8. Where things stand

- Branch `feat/export-packet` pushed. Draft PR only. Nothing merged to `main`.
- `npm test` 179 passing, `typecheck` clean, `lint` clean, `build` clean.
- `npm run qa:export` 0 failures across four runs plus the no-signal case.
- `docs/export-contract.md` states what the packet expects and the exact
  remaining steps to fold in CC-4's chart registry at merge time.
