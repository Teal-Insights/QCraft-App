/**
 * The data mode switch, and the badge that says what the current mode claims.
 *
 * ── Where it sits and why ─────────────────────────────────────────────────────
 * Above the tab strip, so it is on screen on every tab, while a context panel is
 * open, and beside every chart. A mode indicator that only appears on one tab is
 * a mode indicator a user forgets, and forgetting it means citing the wrong
 * numbers.
 *
 * ── Why a segmented control ───────────────────────────────────────────────────
 * Two named states, both visible, one click apart. A checkbox or a dropdown
 * would hide the state the user is not in, and the whole point is that a reader
 * can see there are two answers and which one they are looking at.
 *
 * Every word rendered here comes from src/content/modes.ts.
 */

import { MODES, MODE_IDS, type ModeId } from '../content/modes';

interface Props {
  mode: ModeId;
  onChange: (mode: ModeId) => void;
  /** Opens the About the data panel. */
  onAbout: () => void;
  /** True while the country's inputs for a newly picked mode are loading. */
  busy?: boolean;
}

export function ModeSwitch({ mode, onChange, onAbout, busy = false }: Props) {
  const active = MODES[mode];

  return (
    <section className={`mode mode--${mode}`} aria-label="Data mode">
      <div className="mode__row">
        <div
          className="mode__switch"
          role="radiogroup"
          aria-label="Data mode"
        >
          {MODE_IDS.map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={mode === id}
              className={`mode__option${mode === id ? ' mode__option--active' : ''}`}
              onClick={() => onChange(id)}
              disabled={busy}
            >
              {MODES[id].label}
            </button>
          ))}
        </div>

        <p className="mode__summary">
          <span className="mode__vintage">{active.vintageLabel}</span>
          <span className="mode__sep"> | </span>
          {active.summary}
        </p>

        <button type="button" className="mode__about" onClick={onAbout}>
          About the data
        </button>
      </div>

      <p className="mode__statement">{active.statement}</p>
    </section>
  );
}

/**
 * The compact form, for places that show results without room for the switch:
 * the export report header, and any chart caption that travels on its own.
 */
export function modeStamp(mode: ModeId): string {
  const { label, vintageLabel } = MODES[mode];
  return `${label} mode, ${vintageLabel}`;
}
