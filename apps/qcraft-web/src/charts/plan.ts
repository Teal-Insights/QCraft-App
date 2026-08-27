/**
 * The chart compiler: one `ChartSpec` in, a flat list of drawing primitives out.
 *
 * ── Why this exists ───────────────────────────────────────────────────────────
 *
 * This app draws every chart twice. Once on screen, imperatively with D3 into a
 * live DOM that resizes itself. Once into an SVG string with no DOM at all, so
 * the export packet can carry a chart the reader never opened on screen.
 *
 * Before this module those were two independent implementations of the same
 * picture, kept in step by hand and by a comment asking the next editor to keep
 * them in step. That is affordable for one line and an axis. It is not
 * affordable for the briefing register, which adds a shaded envelope, a
 * threshold rule with adaptive label placement, a measured bracket, grayed-down
 * series, and callouts. Building each of those twice is how the printed chart
 * stops being the chart the reader was looking at.
 *
 * So the geometry and the decoration live here, once, as pure functions of the
 * spec and a size. `LineChart.tsx` renders the primitives into a live SVG and
 * adds the crosshair and tooltip on top. `charts/svg.ts` serialises the same
 * primitives to a string. Neither of them owns any layout arithmetic.
 *
 * Nothing in this file touches the DOM, React, or the window, so it runs under
 * vitest and can be asserted on directly.
 */

import * as d3 from 'd3';

import type { ChartPoint, ChartSeries, ChartSpec } from './types';
import { xTickFormat, yTickFormat } from './ticks';
import { chart as chartTheme, theme } from '../theme';

/** First year in the fixtures; the Shiny app shades from here. */
export const HISTORY_START = 2009;

export const defaultFormat = (v: number) => `${v.toFixed(1)}%`;

/* ── Primitives ─────────────────────────────────────────────────────────────
 *
 * The smallest set that draws every chart in the app. Both renderers switch on
 * `kind` and nothing else, so adding a decoration means adding it here and in
 * two short switch arms rather than in two layout implementations.
 *
 * All coordinates are relative to the plot origin, which both renderers place
 * with the same `translate(margin.left, margin.top)`.
 */

export interface RectPrim {
  kind: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  opacity?: number;
}

export interface LinePrim {
  kind: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  width: number;
  dash?: string;
}

export interface PathPrim {
  kind: 'path';
  d: string;
  stroke?: string;
  fill?: string;
  width?: number;
  dash?: string;
  opacity?: number;
}

export interface TextPrim {
  kind: 'text';
  x: number;
  y: number;
  text: string;
  fill: string;
  size: number;
  weight?: number;
  anchor?: 'start' | 'middle' | 'end';
  /** Vertical nudge in em, as SVG's dy. */
  dy?: string;
  letterSpacing?: string;
  /**
   * Surface-coloured outline painted UNDER the glyphs.
   *
   * Annotation text has to land on the data it is about, which means it lands
   * on lines. A halo keeps it readable there without a filled box, which would
   * hide the very line the callout is pointing at. Used on the decorations that
   * sit inside the plot: threshold labels, bracket measurements, callouts.
   */
  halo?: string;
}

export interface CirclePrim {
  kind: 'circle';
  cx: number;
  cy: number;
  r: number;
  fill: string;
  stroke?: string;
  width?: number;
}

export type ChartPrim = RectPrim | LinePrim | PathPrim | TextPrim | CirclePrim;

export interface ChartPlan {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  innerW: number;
  innerH: number;
  x: d3.ScaleLinear<number, number>;
  y: d3.ScaleLinear<number, number>;
  years: [number, number];
  /** Back to front. Renderers append in order and do nothing else. */
  prims: ChartPrim[];
  /** True when there is nothing to draw, so a renderer can say so instead. */
  empty: boolean;
}

/** Trim float noise; 2dp of a pixel is below both screen and print resolution. */
export const round = (n: number) => Math.round(n * 100) / 100;

/**
 * The value domain.
 *
 * Padded by 8% so lines and their end labels never graze the frame, and never
 * truncated: a chart of a ratio that starts its axis above zero overstates
 * every movement on it, and these charts are read by people sizing a risk. The
 * one adjustment is `zeroLine`, which pulls the domain to include zero when the
 * series is a deviation or a balance, because zero is the reference there.
 *
 * Thresholds and brackets are included in the extent. A debt target rule that
 * falls outside the drawn range would otherwise be silently clipped, and a
 * clipped reference line is worse than no reference line.
 */
function valueDomain(spec: ChartSpec): [number, number] | undefined {
  const values: number[] = [];
  for (const s of spec.series) for (const p of s.points) values.push(p.value);
  for (const b of spec.bands ?? []) {
    for (const p of b.lower) values.push(p.value);
    for (const p of b.upper) values.push(p.value);
  }
  for (const t of spec.thresholds ?? []) values.push(t.value);
  for (const br of spec.brackets ?? []) values.push(br.from, br.to);
  for (const a of spec.annotations ?? []) values.push(a.value);

  if (!values.length) return undefined;
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  const pad = Math.max((hi - lo) * 0.08, 0.5);
  lo -= pad;
  hi += pad;
  if (spec.zeroLine) lo = Math.min(lo, 0);
  return [lo, hi];
}

function yearDomain(spec: ChartSpec): [number, number] | undefined {
  const years: number[] = [];
  for (const s of spec.series) for (const p of s.points) years.push(p.year);
  for (const b of spec.bands ?? []) for (const p of b.upper) years.push(p.year);
  if (!years.length) return undefined;
  return [Math.min(...years), Math.max(...years)];
}

/**
 * Push labels apart to a minimum spacing rather than dropping the ones that
 * collide. A series the caller asked to label, rendered unlabelled, is the
 * worse bug: the reader has no way to know a label is missing.
 */
export function decollide<T extends { y: number }>(items: T[], minGap = 13): T[] {
  const sorted = [...items].sort((a, b) => a.y - b.y);
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i]!.y - sorted[i - 1]!.y < minGap) {
      sorted[i]!.y = sorted[i - 1]!.y + minGap;
    }
  }
  return sorted;
}

/**
 * Compile a spec at a given size.
 *
 * The layer order below is the chart's visual hierarchy, and it is the whole
 * reason the briefing register reads as one message: the WEO shading and the
 * envelope sit behind the grid, the grayed-down paths sit behind the ones that
 * carry the message, and the annotations sit on top of everything.
 */
export function buildChartPlan(
  spec: ChartSpec,
  size: { width: number; height: number },
): ChartPlan {
  const { margin } = chartTheme;
  const width = size.width;
  const height = size.height;
  const innerW = Math.max(width - margin.left - margin.right, 10);
  const innerH = Math.max(height - margin.top - margin.bottom, 10);

  const years = yearDomain(spec);
  const values = valueDomain(spec);
  const drawable = spec.series.filter((s) => s.points.length);

  if (!years || !values || (!drawable.length && !(spec.bands ?? []).length)) {
    return {
      width,
      height,
      margin,
      innerW,
      innerH,
      x: d3.scaleLinear().range([0, innerW]),
      y: d3.scaleLinear().range([innerH, 0]),
      years: [0, 0],
      prims: [],
      empty: true,
    };
  }

  const x = d3.scaleLinear().domain(years).range([0, innerW]);
  const y = d3.scaleLinear().domain(values).nice().range([innerH, 0]);

  const format = spec.format ?? defaultFormat;
  const historyStart = spec.historyStart ?? HISTORY_START;
  const showBoundary = spec.weoBoundaryYear != null && years[0] <= spec.weoBoundaryYear;

  const prims: ChartPrim[] = [];

  // ── 1. WEO history shading ────────────────────────────────────────────────
  // "This part is data, the rest is projection", without a second legend entry.
  if (showBoundary) {
    const from = x(Math.max(historyStart, years[0]));
    const to = x(spec.weoBoundaryYear!);
    prims.push({
      kind: 'rect',
      x: round(from),
      y: 0,
      width: round(Math.max(to - from, 0)),
      height: innerH,
      fill: theme.surfaceSunken,
    });
  }

  // ── 2. Bands ──────────────────────────────────────────────────────────────
  // The envelope goes behind the grid so the gridlines stay readable through
  // it. An area that hides the axis it is measured against is decoration.
  const area = d3
    .area<{ year: number; lo: number; hi: number }>()
    .x((d) => x(d.year))
    .y0((d) => y(d.lo))
    .y1((d) => y(d.hi))
    .curve(d3.curveMonotoneX);

  for (const band of spec.bands ?? []) {
    const byYear = new Map(band.lower.map((p) => [p.year, p.value]));
    const rows = band.upper
      .filter((p) => byYear.has(p.year))
      .map((p) => ({ year: p.year, lo: byYear.get(p.year)!, hi: p.value }));
    const d = area(rows);
    if (d) {
      prims.push({
        kind: 'path',
        d,
        fill: band.color,
        opacity: band.opacity ?? 0.08,
      });
    }
  }

  // ── 3. Gridlines, recessive ───────────────────────────────────────────────
  for (const tick of y.ticks(6)) {
    prims.push({
      kind: 'line',
      x1: 0,
      x2: innerW,
      y1: round(y(tick)),
      y2: round(y(tick)),
      stroke: chartTheme.gridStroke,
      width: 1,
    });
  }

  if (spec.zeroLine) {
    prims.push({
      kind: 'line',
      x1: 0,
      x2: innerW,
      y1: round(y(0)),
      y2: round(y(0)),
      stroke: theme.textMuted,
      width: 1,
    });
  }

  // ── 4. Threshold rules ────────────────────────────────────────────────────
  // Drawn under the data: the debt target is what the paths are read against,
  // so a path must never appear to pass behind it.
  for (const t of spec.thresholds ?? []) {
    const ty = round(y(t.value));
    const color = t.color ?? theme.textSecondary;
    prims.push({
      kind: 'line',
      x1: 0,
      x2: innerW,
      y1: ty,
      y2: ty,
      stroke: color,
      width: 1.5,
      dash: '7,4',
    });
    // Label on whichever END REGION sits further from the rule, so it lands in
    // empty space instead of on a line.
    //
    // Sampling only the first and last point is not enough, and the Uganda
    // baseline is the counterexample: it ends 3 points under a 50% target and
    // starts 35 points under it, so an endpoint test sends the label left,
    // straight onto the 51.4% peak the path makes in 2024. Comparing the
    // closest approach anywhere in the leftmost and rightmost third of the span
    // gets it right.
    const span = years[1] - years[0];
    const cut = span * 0.33;
    const nearest = (inRegion: (year: number) => boolean) => {
      let best = Infinity;
      for (const s of drawable) {
        for (const p of s.points) {
          if (inRegion(p.year)) best = Math.min(best, Math.abs(p.value - t.value));
        }
      }
      return best;
    };
    const onRight =
      nearest((yr) => yr >= years[1] - cut) >= nearest((yr) => yr <= years[0] + cut);
    prims.push({
      kind: 'text',
      x: onRight ? innerW - 4 : 4,
      y: ty - 6,
      text: t.label,
      fill: color,
      size: 10,
      weight: 600,
      anchor: onRight ? 'end' : 'start',
      halo: theme.surfaceRaised,
    });
  }

  // ── 5. Axes ───────────────────────────────────────────────────────────────
  prims.push({
    kind: 'line',
    x1: 0,
    x2: innerW,
    y1: innerH,
    y2: innerH,
    stroke: chartTheme.axisStroke,
    width: 1,
  });
  for (const tick of x.ticks(7)) {
    const px = round(x(tick));
    prims.push({
      kind: 'line',
      x1: px,
      x2: px,
      y1: innerH,
      y2: innerH + 5,
      stroke: chartTheme.axisStroke,
      width: 1,
    });
    prims.push({
      kind: 'text',
      x: px,
      y: innerH + 17,
      text: xTickFormat(tick),
      fill: chartTheme.axisText,
      size: 11,
      anchor: 'middle',
    });
  }
  prims.push({
    kind: 'line',
    x1: 0,
    x2: 0,
    y1: 0,
    y2: innerH,
    stroke: chartTheme.axisStroke,
    width: 1,
  });
  for (const tick of y.ticks(6)) {
    const py = round(y(tick));
    prims.push({
      kind: 'line',
      x1: -5,
      x2: 0,
      y1: py,
      y2: py,
      stroke: chartTheme.axisStroke,
      width: 1,
    });
    prims.push({
      kind: 'text',
      x: -9,
      y: py,
      text: yTickFormat(tick),
      fill: chartTheme.axisText,
      size: 11,
      anchor: 'end',
      dy: '0.32em',
    });
  }

  // ── 6. WEO boundary rule ──────────────────────────────────────────────────
  // Labelled at the FOOT of the rule, not the head: annotations pin to data and
  // data crowds the top of these charts, so a top-anchored boundary label
  // collides with them. The bottom strip is always empty.
  if (showBoundary) {
    const bx = round(x(spec.weoBoundaryYear!));
    prims.push({
      kind: 'line',
      x1: bx,
      x2: bx,
      y1: 0,
      y2: innerH,
      stroke: theme.textMuted,
      width: 1,
      dash: '3,3',
    });
    prims.push({
      kind: 'text',
      x: bx + 5,
      y: innerH - 6,
      text: `WEO → ${spec.weoBoundaryYear}`,
      fill: theme.textMuted,
      size: 9,
      weight: 700,
      letterSpacing: '0.06em',
    });
  }

  // ── 7. Series, muted first ────────────────────────────────────────────────
  // Painting order is the hierarchy. Grayed-down paths go down before the ones
  // carrying the message, so a crossing never hides the line the title is about.
  const line = d3
    .line<ChartPoint>()
    .x((d) => x(d.year))
    .y((d) => y(d.value))
    .curve(d3.curveMonotoneX);

  const order = (s: ChartSeries) => (s.muted ? 0 : s.emphasis ? 2 : 1);
  const painted = [...drawable].sort((a, b) => order(a) - order(b));

  for (const s of painted) {
    const d = line(s.points);
    if (!d) continue;
    prims.push({
      kind: 'path',
      d,
      stroke: s.muted ? chartTheme.mutedStroke : s.color,
      width: s.muted
        ? chartTheme.lineWidthMuted
        : s.emphasis
          ? chartTheme.lineWidthEmphasis
          : chartTheme.lineWidth,
      dash: s.dashed ? '6,4' : undefined,
    });
  }

  // ── 8. Brackets ───────────────────────────────────────────────────────────
  // The measured gap: a vertical span with end caps and its size stated beside
  // it. The label goes to the LEFT of the bracket because brackets sit at the
  // horizon year, where the right margin already belongs to the direct labels.
  for (const br of spec.brackets ?? []) {
    const bx = round(x(br.year));
    const y1 = round(y(br.from));
    const y2 = round(y(br.to));
    const color = br.color ?? theme.textSecondary;
    prims.push({ kind: 'line', x1: bx, x2: bx, y1, y2, stroke: color, width: 1.5 });
    for (const cap of [y1, y2]) {
      prims.push({
        kind: 'line',
        x1: bx - 5,
        x2: bx + 5,
        y1: cap,
        y2: cap,
        stroke: color,
        width: 1.5,
      });
    }
    prims.push({
      kind: 'text',
      x: bx - 10,
      y: round((y1 + y2) / 2),
      text: br.label,
      fill: color,
      size: 11,
      weight: 600,
      anchor: 'end',
      dy: '0.32em',
      halo: theme.surfaceRaised,
    });
  }

  // ── 9. Direct labels ──────────────────────────────────────────────────────
  const labels = decollide(
    drawable
      .filter((s) => s.directLabel)
      .map((s) => {
        const last = s.points[s.points.length - 1]!;
        return {
          color: s.muted ? chartTheme.mutedStroke : s.color,
          text: format(last.value),
          y: y(last.value),
        };
      }),
  );
  for (const label of labels) {
    prims.push({
      kind: 'text',
      x: innerW + 6,
      y: round(Math.min(Math.max(label.y, 8), innerH)),
      text: label.text,
      fill: label.color,
      size: 11,
      weight: 600,
      dy: '0.32em',
    });
  }

  // ── 10. Annotations ───────────────────────────────────────────────────────
  for (const a of spec.annotations ?? []) {
    const ax = round(x(a.year));
    const ay = round(y(a.value));
    const color = a.color ?? theme.textSecondary;
    // Flip the callout to the left half when the anchor sits past midway, so it
    // never runs off the right edge.
    const flip = ax > innerW * 0.55;
    const below = a.place === 'below';
    prims.push({
      kind: 'circle',
      cx: ax,
      cy: ay,
      r: 4,
      fill: theme.surfaceRaised,
      stroke: color,
      width: 2,
    });
    prims.push({
      kind: 'text',
      x: flip ? ax - 10 : ax + 10,
      y: below ? ay + 16 : ay - 10,
      text: a.text,
      fill: theme.textSecondary,
      size: 11,
      anchor: flip ? 'end' : 'start',
      halo: theme.surfaceRaised,
    });
  }

  return { width, height, margin, innerW, innerH, x, y, years, prims, empty: false };
}
