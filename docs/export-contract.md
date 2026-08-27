# The export contract

**CC-3, 2026-08-27.** What the export packet expects from the rest of the app,
and what it promises in return. Written for whoever merges the sprint lanes and
for anyone adding a chart, a parameter or a data mode after the freeze.

---

## 1. The packet

One click produces one `.zip`. Inside it:

| File | What it is |
| --- | --- |
| `READ-ME.txt` | Plain text. What the packet is, what it may be used to claim, which file to open first. |
| `*-report.html` | The scenario report. Self-contained; the browser's Print command is the route to a PDF. |
| `*.xlsx` | Six sheets. README, Assumptions, Key numbers, Debt by scenario, GDP vs baseline, Results. |
| `*-chart-pack.html` | Every chart with its caption, laid out to print. |
| `*-results.csv` | Every scenario and year, with the run manifest below the data. |
| `*-run.json` | The reproduction contract. |
| `charts/*.png` | One image per figure, twice screen resolution, provenance drawn in. |

Every piece is also downloadable on its own from the Export tab. The archive is
the default because at eight or more files browsers start dropping downloads,
not because the pieces are not useful separately.

### Reproducibility, stated exactly

The text artifacts are byte-identical for the same run: the archive's own
timestamps come from the manifest's `generatedAt`, in UTC, not from the clock or
the local timezone. **The workbook is not**, because exceljs does not serialize
deterministically and two engines produce two different files from one spec.
Nothing publishes a packet checksum, and nothing should until that changes.

---

## 2. What the packet reads from the rest of the app

### 2.1 The run manifest (`src/run/manifest.ts`)

Everything in every artifact comes from `RunManifest`. It carries the country,
the mode, the data vintage, the engine provenance, every parameter with the
defaults in force at export time, the per-parameter rationale, and the
run-level annotations.

`modeLine(manifest)` and `modeStatement(manifest)` are the only source for what
the run may be used to claim. Both resolve through `src/content/modes.ts`, which
is where every sentence about the IMF original is written and reviewed. **Do not
write a claim sentence into an export module.** If the wording changes there, it
changes in the report, the chart pack, the workbook, the CSV, the README and the
footer drawn into every PNG, at once.

### 2.2 Annotations

```ts
interface RunAnnotations {
  label?: string;   // names the run wherever it is listed
  note?: string;    // the analyst's remarks on the run as a whole
}
```

Both optional, both free text, both additive to `qcraft-run/1`: a run file that
predates them still restores completely. They are distinct from the
per-parameter rationale, which answers a different question.

Every text artifact carries both. `tests/export.test.ts` fails if any one of
them drops either, which is how the chart pack was caught shipping charts with
no assumptions attached.

### 2.3 Figures

```ts
interface PacketFigure {
  id: string;
  tab: 'Overview' | 'Baseline' | 'Analysis' | 'Climate';
  title: string;      // the takeaway, computed from this run
  subtitle: string;
  series: ChartSeries[];
  height: number;
  weoBoundaryYear?: number;
  zeroLine?: boolean;
  format?: (v: number) => string;
}
```

`tab` is the field name and the value set from CC-4's `ChartTab` in
`src/charts/specs.ts`, copied exactly so folding in their registry is a swap of
the producer and nothing below it.

Two things their seam doc gets wrong about its own code, both worth knowing
before the merge:

- The doc's tab table calls the cover tab **Cover**; `ChartTab` calls it
  **Overview**, and `exportFigures` returns `Overview`. This file matches the
  code.
- The doc says the prefix rule "would keep three of twelve" and drop nine. The
  registry holds **eleven** distinct charts, and any one export carries **ten**
  of them, because `climate-gdp-levels` is workbook-register only and `overview`
  is briefing-register only. The old rule kept 3 and dropped 8. The defect is
  exactly as they describe it; only the arithmetic was off.
  `tests/packet.test.ts` pins all of this against their real id list.

`packetFigures(result, extraFigures)` is the single list the report, the chart
pack, the PNGs and the workbook README all draw from. Add a figure by returning
one more `PacketFigure`; nothing else needs a change.

`groupFigures()` partitions on `tab` and guarantees every figure reaches exactly
one section. A tab this build does not recognise lands under "Other charts"
rather than disappearing. This is deliberate and load-bearing: the previous
partition matched the front of the id string and dropped the rest silently.

---

## 3. Open handovers

### 3.1 CC-4's chart registry

`docs/CC4-CHART-SEAM.md` describes `exportFigures(ctx, register, overrides)` and
`renderSpecSvg(spec, { withChrome: true })`, on branch `feat/takeaway-charts`.
That branch is cut from `2e8b436`, before CC-2's two-modes work, so merging the
two is an integration job rather than something either lane should do inside its
own branch.

The defect CC-4 named is fixed here already: the report partitions on
`PacketFigure.tab`, which is their field name carrying their values. What
remains at merge time, in order:

1. Replace the body of `packetFigures()` with a call to `exportFigures()`.
   `tab` already carries their field name and their values, so the mapping is
   `id`, `tab`, `title`, `subtitle` straight across, plus `spec` in place of
   `series` once step 2 lands. No consumer changes.
2. Point the PNG path and the chart pack at `renderSpecSvg(spec, { withChrome: true })`
   instead of `renderChartSvg` plus the `caption` option added here. Their
   version draws its own title, legend and source line, so `chartSvg.ts`'s
   caption band becomes dead code and should be deleted, not left as a second
   way to do the same thing.
3. Carry the chart `register` and the per-chart `overrides` into `RunManifest`.
   CC-4 is right that they belong there: two runs with identical parameters and
   different registers produce different documents, and a run file that does not
   record which one was on cannot reproduce the report it came with.
4. `tests/export.test.ts` pins the current figure ids; update it with the rewire.

### 3.2 Fonts

`src/assets/fonts/` holds three subset Inter faces and their licence, used only
to rasterize chart PNGs. They are there because an SVG loaded through an `Image`
is an isolated document that never fetches an external font, so without
embedding the chart text silently falls back to whatever the viewing machine
has. Klim faces are never embedded: the rasterizer replaces the SVG's
`font-family` outright. See the README beside the files.

The app's on-screen font stacks are untouched by this lane.

---

## 4. Running the checks

```bash
cd apps/qcraft-web
npm test                      # 179 unit tests, no browser
npm run build
npm run preview -- --port 4919 --strictPort &
QCRAFT_PREVIEW_URL=http://localhost:4919/ npm run qa:export -- /tmp/qcraft-export
```

`qa:export` is the loop that matters: two countries in both modes, plus the
no-climate-signal case. It drives the real app, downloads the real archive,
opens the workbook with openpyxl, reads the PNG headers, prints both documents
to PDF and asserts the page box, then re-imports the run file and checks the
restored state against the exported one.

It needs a Python with `openpyxl`. It looks for the repo's uv venv and falls
back to `python3`; `QCRAFT_PYTHON` overrides both.

**Pick a port nobody else is on.** Several lanes run a preview server during this
sprint, and a stale server on 4173 will serve another branch's build while every
assertion quietly fails against it.
