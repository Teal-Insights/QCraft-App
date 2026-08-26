/**
 * The context affordance that sits beside a parameter label.
 *
 * Same slot as the "?" tip and deliberately a different thing. The tip answers
 * "what is this parameter"; this answers "what should I set it to, and on what
 * evidence". A user who has read the tip and still does not know what number to
 * type is the user this button is for.
 *
 * Two behaviours behind one affordance, decided by the registry in
 * src/context/panels.ts: parameters a published source has a view on open a
 * panel, and parameters that are a policy judgment reveal one line and a link
 * to the widget that builds the intuition. The label changes with the
 * behaviour, so nothing surprises: "Context" opens a panel, and the same button
 * on a judgment parameter is a disclosure that expands in place.
 */

interface Props {
  /** What this is context for, for the accessible name. */
  label: string;
  /** True when the panel or the note is currently showing. */
  open: boolean;
  /** 'panel' opens the workspace panel; 'note' expands in the sidebar. */
  kind: 'panel' | 'note';
  onClick: () => void;
}

export function ContextButton({ label, open, kind, onClick }: Props) {
  return (
    <button
      type="button"
      className={`ctxbutton${open ? ' ctxbutton--on' : ''}`}
      aria-expanded={open}
      aria-label={
        kind === 'panel'
          ? `Show the source data behind ${label}`
          : `Show context for ${label}`
      }
      onClick={(event) => {
        // The sidebar scrolls independently of the workspace, so a parameter
        // low in the list can be off screen by the time its panel renders.
        // 'nearest' moves the least that puts the field back in view, which
        // keeps the promise the panel is built on: the control and its context
        // are visible together.
        event.currentTarget.closest('.field')?.scrollIntoView({ block: 'nearest' });
        onClick();
      }}
    >
      <span className="ctxbutton__glyph" aria-hidden="true" />
      Context
    </button>
  );
}
