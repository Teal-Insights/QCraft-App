/**
 * The frame every teaching widget wears.
 *
 * ── The layout rule this file exists to enforce ───────────────────────────────
 * The brief is binding on two points and they are the same point: one idea per
 * widget, and the control and the chart it moves share ONE visual field with no
 * scrolling between cause and effect. So the frame is a fixed-height grid, not
 * a document. Title, chart, controls and caption are four rows of a
 * `100dvh`-tall container; the chart row takes the slack. Nothing below the
 * fold, because there is no fold.
 *
 * That also makes it iframe-safe. Quarto will embed these at a chosen height
 * and the layout has to survive at 560px as well as full screen, which a
 * document layout does not.
 *
 * ── The caption is the second teacher ─────────────────────────────────────────
 * `caption` is passed in fresh on every render and is expected to change as the
 * user drags. It is the widget's narration, and it is placed under the controls
 * rather than above the chart so the reading order is: what I see, what I moved,
 * what it means.
 */

import type { ReactNode } from 'react';

interface Props {
  /** The idea, stated as a takeaway rather than a variable name. */
  title: string;
  /** One line of orientation, static. */
  standfirst: string;
  /** The chart. Takes all the vertical slack the frame has. */
  children: ReactNode;
  /**
   * Extra class on the stage row. The climate widget uses it to switch the
   * stage from one flexible chart to a fixed cause-above-effect grid.
   */
  stageClassName?: string;
  /** Sliders, presets, pickers. */
  controls: ReactNode;
  /** The dynamic sentence. Changes on every drag. */
  caption: ReactNode;
  /** Optional predict-first line, rendered beside the caption. */
  aside?: ReactNode;
  /** Optional one-line note under the caption, for a standing caveat. */
  footnote?: ReactNode;
}

export function WidgetFrame({
  title,
  standfirst,
  children,
  stageClassName,
  controls,
  caption,
  aside,
  footnote,
}: Props) {
  return (
    <div className="widget">
      <header className="widget__head">
        <h1 className="widget__title">{title}</h1>
        <p className="widget__standfirst">{standfirst}</p>
        <p className="widget__footnote">Standalone illustration with fixed reference data,
          2029/2030 timing and its own assumptions. Separate from your selected Explorer run.{' '}
          <a href="../../../guide/model.html">Method and official sources</a>{' · '}
          <a href="../../?view=baseline">Open the Explorer</a></p>
      </header>

      <div className={`widget__stage${stageClassName ? ` ${stageClassName}` : ''}`}>
        {children}
      </div>

      <div className="widget__controls">{controls}</div>

      <footer className="widget__foot">
        <p className="widget__caption" aria-live="polite">
          {caption}
        </p>
        {aside}
        {footnote && <p className="widget__footnote">{footnote}</p>}
      </footer>
    </div>
  );
}
