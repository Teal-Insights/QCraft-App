/**
 * Static SVG renderer for the exported report.
 *
 * ── What changed, and why ─────────────────────────────────────────────────────
 *
 * This file used to be a second, independent implementation of the on-screen
 * chart: its own scales, its own margins, its own WEO shading, its own
 * de-collided direct labels, kept in step with `LineChart.tsx` by hand. That
 * held while a chart was a line and an axis. The briefing register adds a
 * shaded envelope, a threshold rule with adaptive label placement, a measured
 * bracket, grayed-down series and callouts, and building each of those twice is
 * how the printed chart stops being the chart the reader was looking at.
 *
 * So the drawing moved to `charts/plan.ts` (spec to primitives, pure) and
 * `charts/svg.ts` (primitives to a string, pure). Both renderers now compile
 * the same spec. This module is the compatibility seam: the signature below is
 * unchanged, so every existing caller and test keeps working.
 *
 * NEW WORK SHOULD CALL `renderSpecSvg` FROM `charts/svg` DIRECTLY. It takes a
 * whole `ChartSpec`, so it carries the bands, thresholds, brackets and
 * annotations that make a briefing-register chart what it is, and its
 * `withChrome` option draws the takeaway title, the legend and the source line
 * into the SVG itself, which is what a standalone PNG or a chart-pack page
 * needs. `charts/specs.ts` builds those specs for every chart in the app, in
 * both registers, so an export can ask for a chart by id and register and get
 * exactly what the tab drew.
 */

import type { ChartSeries } from '../charts/types';
import { renderSpecSvg } from '../charts/svg';

export { escapeXml } from '../charts/svg';
export { renderSpecSvg, type RenderSvgOptions } from '../charts/svg';

export interface ChartSvgSpec {
  series: ChartSeries[];
  /** Rendered at this size, then scaled to the column by the report's CSS. */
  width?: number;
  height?: number;
  weoBoundaryYear?: number;
  /** First year of the shaded observed band. See LineChart's prop of the same name. */
  historyStart?: number;
  zeroLine?: boolean;
  format?: (value: number) => string;
  /** Accessible name. Charts in the report are `role="img"`, as in the app. */
  ariaLabel: string;
}

export function renderChartSvg({
  series,
  width = 700,
  height = 320,
  weoBoundaryYear,
  historyStart,
  zeroLine = false,
  format,
  ariaLabel,
}: ChartSvgSpec): string {
  return renderSpecSvg(
    {
      id: ariaLabel,
      title: ariaLabel,
      series,
      weoBoundaryYear,
      historyStart,
      zeroLine,
      format,
    },
    { width, height, ariaLabel },
  );
}
