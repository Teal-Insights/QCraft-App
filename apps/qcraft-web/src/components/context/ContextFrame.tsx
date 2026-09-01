/**
 * The frame every context panel wears.
 *
 * Same discipline as the teaching widgets' WidgetFrame, for the same reason:
 * one idea, one visual field, and a caption that changes as the user moves the
 * control. The difference is where the control lives. A widget owns its
 * sliders; a context panel's primary control is the sidebar parameter itself,
 * which stays on screen to the left. Anything in `controls` here is secondary
 * (a comparator, a measure) and never duplicates a sidebar control, because two
 * controls setting one value is how a user ends up not trusting either.
 *
 * Reading order is title, chart, controls, caption, source. The source line is
 * last and always present: a panel that shows a published series without saying
 * which publication is asking to be believed on nothing.
 */

import type { ReactNode } from 'react';

interface Props {
  /** Figure identifier shared with the course. Rendered, not just an attribute. */
  slug: string;
  /** The idea, as a takeaway rather than a variable name. */
  title: string;
  /** One line of orientation. May change with the controls. */
  standfirst: ReactNode;
  children: ReactNode;
  controls?: ReactNode;
  /** The dynamic sentence. Changes as the parameter or the controls move. */
  caption: ReactNode;
  /** Where the numbers come from, verbatim from SHARED/DATA-NOTES.md. */
  source: ReactNode;
  /** An extra standing caveat, where one is owed. */
  footnote?: ReactNode;
}

export function ContextFrame({
  slug,
  title,
  standfirst,
  children,
  controls,
  caption,
  source,
  footnote,
}: Props) {
  return (
    <section className="cpanel" data-figure={slug}>
      <header className="cpanel__head">
        <h2 className="cpanel__title">{title}</h2>
        <p className="cpanel__standfirst">{standfirst}</p>
      </header>

      <div className="cpanel__stage">{children}</div>

      {controls && <div className="cpanel__controls">{controls}</div>}

      <footer className="cpanel__foot">
        <p className="cpanel__caption" aria-live="polite">
          {caption}
        </p>
        {footnote && <p className="cpanel__footnote">{footnote}</p>}
        <p className="cpanel__source">
          <span className="cpanel__source-label">Source</span> {source}
          <span className="cpanel__slug"> Figure {slug}</span>
        </p>
      </footer>
    </section>
  );
}
