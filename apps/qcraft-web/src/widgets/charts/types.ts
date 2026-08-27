/** Shapes shared by the two widget charts. */

export interface WidgetPoint {
  year: number;
  value: number;
}

export interface WidgetSeries {
  key: string;
  label: string;
  color: string;
  points: WidgetPoint[];
  /** Thicker stroke. The reference path, or the one in focus. */
  emphasis?: boolean;
  /** Pushed back: drawn thin and pale, still readable, no longer the subject. */
  muted?: boolean;
  /** Dashed. Used for the frozen "where you started" ghost. */
  dashed?: boolean;
  /** Print this series' final value at the right edge. */
  directLabel?: boolean;
}
