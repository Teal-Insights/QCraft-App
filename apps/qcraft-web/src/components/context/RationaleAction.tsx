/**
 * "Put this in the rationale": the peer comparison a user is looking at,
 * written into the note that travels with the run.
 *
 * ── Why this is not a new field ───────────────────────────────────────────────
 * The annotation schema belongs to the export lane. A run carries one free-text
 * rationale per parameter (`RationaleNotes` in src/run/manifest.ts), the report
 * annex prints it beside the value and its default state, and the run JSON
 * restores it on import. A peer-group choice is not a new kind of annotation; it
 * is the reason a value was chosen, which is exactly what that field is for. So
 * this writes a sentence into the existing string rather than adding a field
 * nobody downstream reads.
 *
 * The sentence lands in the sidebar input, editable, because it is the user's
 * rationale and not the app's. Nothing is written without a click.
 *
 * ── The length rule ───────────────────────────────────────────────────────────
 * The sidebar input is capped at 200 characters, and a note longer than the
 * field that holds it would be silently truncated on the next keystroke. The
 * composer clips to the cap here, where it is visible, and the cap is asserted
 * in tests so a longer template cannot slip in unnoticed.
 */

import { RATIONALE_MAX_LENGTH } from '../../content/params';

interface Props {
  /** The sentence to write. Composed by the panel from what it is showing. */
  sentence: string;
  /** What the note currently holds, so an existing note is never overwritten. */
  current: string;
  onWrite: (note: string) => void;
}

/**
 * Appended rather than replaced when the user has already written something,
 * because a control that deletes typed text is a control people stop using.
 * Trimmed to the field's own cap.
 */
export function composeNote(current: string, sentence: string): string {
  const existing = current.trim();
  if (!existing) return sentence.slice(0, RATIONALE_MAX_LENGTH);
  if (existing.includes(sentence)) return existing;
  return `${existing} ${sentence}`.slice(0, RATIONALE_MAX_LENGTH);
}

export function RationaleAction({ sentence, current, onWrite }: Props) {
  const next = composeNote(current, sentence);
  const already = current.trim() === next;

  return (
    <div className="rationale-action">
      <p className="rationale-action__preview">
        <span className="rationale-action__kicker">For the rationale</span>
        {sentence}
      </p>
      <button
        type="button"
        className="button button--small"
        disabled={already}
        onClick={() => onWrite(next)}
      >
        {already ? 'Added to the rationale' : 'Add to the rationale'}
      </button>
    </div>
  );
}
