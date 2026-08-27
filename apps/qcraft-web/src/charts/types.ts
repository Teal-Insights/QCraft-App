/**
 * Chart data shapes, shared by the interactive chart and the export renderer.
 *
 * These lived in LineChart.tsx until the export packet needed them: the report
 * renders the same series to a static SVG string with no DOM, and a pure module
 * should not have to import a React component to name its input. LineChart
 * re-exports both types, so existing imports still work.
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
}
