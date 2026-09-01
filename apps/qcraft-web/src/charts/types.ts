/**
 * Chart data shapes, shared by the interactive chart and the export renderer.
 *
 * These lived in LineChart.tsx until the export packet needed them: the report
 * renders the same series to a static SVG string with no DOM, and a pure module
 * should not have to import a React component to name its input. LineChart
 * re-exports both types, so existing imports still work.
 *
 * ── The two registers ─────────────────────────────────────────────────────────
 *
 * Every chart in the app exists in two versions of itself:
 *
 *   WORKBOOK. What the IMF Excel workbook and the Shiny Explorer produce. The
 *   title names the variable, every series is drawn at equal weight, the legend
 *   carries identity. A workshop participant can hold this beside the workbook
 *   they already know and see the same picture.
 *
 *   BRIEFING. One message, stated in the title and computed from the run, with
 *   everything that is not the message grayed down and the message annotated on
 *   the data. This is the version that goes into a fiscal risk statement.
 *
 * The decorations below (`bands`, `thresholds`, `brackets`, `annotations`, and
 * `muted` on a series) are what separates the two. They are all optional, so a
 * workbook-register spec is the same object with them left off.
 */

export interface ChartPoint {
  year: number;
  value: number;
}

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  points: ChartPoint[];
  /** Thicker stroke: the reference path. */
  emphasis?: boolean;
  /** Render this series' final value at the right edge. Use sparingly. */
  directLabel?: boolean;
  /**
   * Dashed stroke. Reserved for a reference line that is not one of the series
   * being compared, so the dash reads as "this is context" without spending a
   * colour slot. Also the secondary encoding that keeps such a line legible
   * when its colour is deliberately neutral.
   */
  dashed?: boolean;
  /**
   * Grayed down. The briefing register keeps every path on the chart, because
   * dropping the middle scenarios would change what the chart claims, and draws
   * the ones that are not the message thin and neutral so the eye goes to the
   * ones that are. `color` is still carried for the tooltip swatch, which is
   * how a reader recovers the identity of a muted line.
   */
  muted?: boolean;
}

/**
 * A shaded envelope between two boundary paths.
 *
 * The briefing register uses one band per chart: the range the climate
 * scenarios open up. Drawing the range as an area says "this is the span of
 * outcomes" in a way that seven separate lines do not, and it leaves the two
 * bounding scenarios free to carry colour and labels.
 *
 * `lower` and `upper` must be the same years in the same order.
 */
export interface ChartBand {
  key: string;
  label: string;
  lower: ChartPoint[];
  upper: ChartPoint[];
  color: string;
  /** Default 0.13. Low enough that gridlines and the baseline read through it. */
  opacity?: number;
}

/**
 * A horizontal reference rule at a constant value.
 *
 * The only one this app draws is the debt target, which is a real parameter of
 * the model (`debt_target`, default 50% of GDP) and the switch the fiscal rule
 * tests every year in `packages/qcraft-engine-ts/src/fiscal.ts`. It is not a
 * threshold invented for the chart.
 */
export interface ChartThreshold {
  value: number;
  label: string;
  color?: string;
}

/**
 * A vertical bracket annotating the gap between two values in one year.
 *
 * This is how the Analysis chart states the risk: the spread between the best
 * and worst climate outcome at the horizon, measured on the chart rather than
 * asserted in the caption.
 */
export interface ChartBracket {
  year: number;
  from: number;
  to: number;
  label: string;
  color?: string;
}

/** A callout pinned to one data point. */
export interface ChartAnnotation {
  year: number;
  value: number;
  text: string;
  color?: string;
  /** Which side of the point the text sits on. Default 'above'. */
  place?: 'above' | 'below';
}

/**
 * Everything needed to draw one chart, in either register.
 *
 * This is the single object the screen and the export packet both consume. A
 * chart that exists only as JSX cannot be exported; a chart that exists only as
 * an export helper cannot be looked at. So the specs are built once, in
 * `charts/specs.ts`, and rendered twice.
 */
export interface ChartSpec {
  /** Stable id: the per-chart register override is keyed on it. */
  id: string;
  title: string;
  subtitle?: string;
  series: ChartSeries[];
  bands?: ChartBand[];
  thresholds?: ChartThreshold[];
  brackets?: ChartBracket[];
  annotations?: ChartAnnotation[];
  /** Draws the WEO history/forecast shading and boundary rule at this year. */
  weoBoundaryYear?: number;
  /**
   * First year of the shaded observed band. Defaults to the fixtures' own first
   * year, which is right for a chart whose whole record is WEO. A chart whose
   * record comes from somewhere else must say so: shading a World Bank series
   * as WEO data is a false claim about provenance, and these panels are read by
   * people deciding what to believe.
   */
  historyStart?: number;
  /** Draws a rule at y = 0 (for balances and deviations, which cross zero). */
  zeroLine?: boolean;
  /** Formats values in the tooltip, direct labels, and brackets. */
  format?: (value: number) => string;
  /** Figure source line, printed under the plot. */
  source?: string;
  height?: number;
  /**
   * Force the legend on or off. The default renders one whenever two or more
   * series are drawn, so identity is never carried by colour alone.
   */
  legend?: boolean;
}
