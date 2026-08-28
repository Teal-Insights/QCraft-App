/**
 * The "?" affordance next to a parameter label.
 *
 * Hover OR keyboard focus opens it, so the guidance is reachable without a
 * mouse — this app is used in training rooms on whatever hardware is in the
 * room. The tip is a <span role="tooltip"> associated by aria-describedby
 * rather than a `title` attribute, because `title` is slow, untouchable, and
 * invisible to most screen readers.
 */

import { useId, useState } from 'react';

interface Props {
  text: string;
  /** Optional deep link into the companion guide. */
  href?: string;
  /** What the tip describes, for the accessible name of the trigger. */
  label: string;
}

export function InfoTip({ text, href, label }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <span
      className="infotip"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="infotip__trigger"
        aria-describedby={open ? id : undefined}
        aria-label={`About ${label}`}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
      >
        ?
      </button>
      {open && (
        <span role="tooltip" id={id} className="infotip__bubble">
          {text}
          {href && (
            <>
              {' '}
              <a href={href} target="_blank" rel="noreferrer">
                Companion guide →
              </a>
            </>
          )}
        </span>
      )}
    </span>
  );
}
