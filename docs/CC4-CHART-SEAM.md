# The chart seam: what CC-4 changed, and what CC-3 gets

**CC-4, branch `feat/takeaway-charts`, 2026-08-27.** Written for CC-3 (export
packet) and CC-5 (parameter discovery), who share files with this branch.

Territory rule for this sprint: CC-4 owns chart components, CC-3 owns export
plumbing. This note records every place that boundary was crossed, why, and what
each lane gains.

---

## 1. The one structural change

The app drew every chart twice, in two independent implementations of the same
picture: `components/LineChart.tsx` with D3 into a live DOM, and
`export/chartSvg.ts` as string concatenation. Its own header said the geometry
"deliberately mirrors LineChart.tsx", and the mirror had already cracked in
three places: the WEO boundary label read `WEO → 2029` on screen and
`WEO to 2029` in the export, the `annotation` prop had no export equivalent so
the Baseline tab's callout never reached the report, and the two disagreed on
how an empty series set is handled.

That is affordable for a line and an axis. The briefing register adds a shaded
envelope, a threshold rule with adaptive label placement, a measured bracket,
grayed-down series, callouts and label halos. Building each of those twice is
how the printed chart stops being the chart the reader was looking at.

So the drawing was factored out:

| Module | What it is |
| --- | --- |
| `src/charts/plan.ts` | `buildChartPlan(spec, size)`: a `ChartSpec` to a flat list of drawing primitives. Pure. No DOM, no React. All layout arithmetic lives here. |
| `src/charts/svg.ts` | `renderSpecSvg(spec, options)`: primitives to an SVG string. Pure. A switch over `ChartPrim` and nothing else. |
| `src/components/LineChart.tsx` | Paints the same primitives into a live SVG and adds the crosshair and tooltip on top. |

One geometry, one decoration set, two thin renderers. A new decoration is added
in `plan.ts` and appears in both.

---

## 2. Files touched outside CC-4 territory

### `src/export/chartSvg.ts` (CC-3)

Reduced to a compatibility shim. **`ChartSvgSpec` and `renderChartSvg` have the
exact same signature and behaviour as before**, so every existing caller and
every test keeps working. The body now calls `renderSpecSvg`. `escapeXml` is
re-exported from its new home, so `import { escapeXml } from '../export/chartSvg'`
still resolves.

**New work should call `renderSpecSvg` from `charts/svg` directly.** It takes a
whole `ChartSpec`, so it carries the bands, thresholds, brackets and annotations
that make a briefing chart what it is, and its `withChrome: true` option draws
the takeaway title, the legend and the source line into the SVG itself. That is
what a standalone PNG or a chart-pack page needs: a PNG of a briefing chart with
its message cropped off is a chart with no message left.

### `tests/export.test.ts` (CC-3), one line

`expect(svg).toContain('WEO to 2029')` became `'WEO → 2029'`. The two renderers
now emit one string from one place; the arrow is what the screen has always
shown, so the export moved to match the screen rather than the other way round.
The comment above the assertion says so.

### SHARED files, all additive

- `src/charts/types.ts`: `ChartSeries` gains `muted?`. New types `ChartBand`,
  `ChartThreshold`, `ChartBracket`, `ChartAnnotation`, `ChartSpec`. Nothing
  removed, nothing renamed.
- `src/theme.ts`: `chart` gains `mutedStroke`, `lineWidthMuted`, `bandFill`,
  `bandOpacity`. Documented in place as what they are, which is not series
  colours.
- `src/selectors.ts`: the three series builders now take a `SeriesOptions`
  object with `mutedKeys` and `emphasisKeys` alongside the existing
  `directLabelKeys`. The old call shape is a subset, so existing calls compile
  unchanged.

Nothing in `src/export/packet.ts`, `reportHtml.ts`, `reportStyles.ts`,
`resultsCsv.ts`, `run/*`, or `ExportTab.tsx` was touched.

---

## 3. What CC-3 gets

### One call for every figure

```ts
import { exportFigures, overviewChart } from '../charts/specs';
import { renderSpecSvg } from '../charts/svg';

const figures = exportFigures({ result, params, defaults }, register, overrides);
for (const fig of figures) {
  const svg = renderSpecSvg(fig.spec, { width: 700, withChrome: true });
  // fig.id, fig.tab, fig.register, fig.title, fig.subtitle, fig.source
}
```

`register` is the run's global chart register (`'workbook' | 'briefing'`);
`overrides` is the per-chart map, both available from
`useChartRegister().describe()` in `App.tsx`. Passing them means an export
reproduces what the analyst was actually looking at instead of a uniform view
they never saw. Both belong in the run manifest: two runs with identical
parameters and different registers produce different documents.

### The packet cover

`overviewChart(ctx)?.briefing` is one chart carrying the whole run: baseline,
the range every climate scenario opens up, the debt target the fiscal rule works
toward, and the horizon spread bracketed and measured. Its title is computed
from the run, for example `Climate risk widens Uganda's 2099 debt from a 47%
baseline to as much as 127% of GDP`. It is briefing register only, because a
cover figure is a takeaway by definition.

### The chart pack

Every spec renders standalone with `withChrome: true`. The SVG paints its own
background, wraps its title and subtitle, wraps its legend across rows, and puts
the source line under the plot, so a print-CSS document of them needs no
per-figure HTML chrome.

---

## 4. One thing CC-3 has to change

`reportHtml.ts` partitions figures by id prefix (`baseline-` / `scenario-`) and
**silently drops any figure matching neither**. The chart ids are now:

| Tab | Ids |
| --- | --- |
| Baseline | `baseline-debt`, `baseline-revexp`, `baseline-balances` |
| Analysis | `analysis-debt`, `analysis-prim-exp`, `analysis-prim-balance`, `analysis-overall-balance`, `analysis-interest-exp` |
| Climate | `climate-drag`, `climate-gdp-levels` |
| Cover | `overview` |

Under the current prefix rule the report would keep three of twelve.
**Partition on `fig.tab`, which `exportFigures` returns**, rather than on the
start of the id string. An id names a chart; a report that groups by matching
the front of a string drops any chart whose name does not begin with a blessed
word, and drops it without saying so.

`tests/export.test.ts:208` pins the four old figure ids. That assertion is CC-3's
to update when the report rewires.

---

## 5. Note for CC-5

`src/components/context/*` was not touched. `LineChart`'s `annotation` prop (the
singular form the demography panel uses) is kept and merged into the new
`annotations` array, so the context panels compile and render unchanged.

If a distribution strip wants the same decorations, `ChartBand` and
`ChartThreshold` are on `ChartSpec` now, and `charts/plan.ts` draws them for
free.
