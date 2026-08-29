/**
 * A numeric parameter input that never turns a slip into a silent assumption.
 *
 * Two defects from the 2026-08 HCD audit live here (F-3 and F-2):
 *
 *  - Clearing the field to retype fed `Number('')`, which is 0, straight into
 *    the engine: every headline recomputed at zero productivity and the box
 *    rerendered "0" under the analyst's cursor. An emptied or unparseable
 *    draft is not a value. Nothing commits, the projection keeps the last
 *    valid value, and a flag beside the field says so.
 *
 *  - 999 typed into a max-15 field recomputed silently and was badged like a
 *    legitimate choice. On leaving the field, a flag names the declared range
 *    beside it. The projection still computes with the value: holding the
 *    charts at the last valid value (the stale-state design) is deliberately
 *    deferred to the v2.1 input-integrity lane, and the flag says what is
 *    actually happening rather than what a future version will do.
 *
 * The flag never appears while the analyst is mid-edit inside the range check
 * (typing "9" on the way to "9.5" should not be shouted at); the empty flag
 * appears only mid-edit, because on blur the last valid value returns to the
 * box and there is nothing left to explain.
 */

import { useState } from 'react';

/** Parse what the user typed. An empty or unparseable draft is not a value. */
export function parseDraft(raw: string): number | null {
  if (raw.trim() === '') return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

/** True when a committed value sits outside the field's declared bounds. */
export function outOfRange(value: number, min: number, max: number): boolean {
  return value < min || value > max;
}

/** The flag for an out-of-range value: the bounds, and what the charts do. */
export function rangeFlagText(value: number, min: number, max: number): string {
  return `Outside the range this field accepts (${min} to ${max}). The projection is still computed with ${value}.`;
}

/** The flag for an emptied field: the projection holds the last valid value. */
export function emptyFlagText(lastValid: string): string {
  return `No value yet. The projection keeps the last value, ${lastValid}.`;
}

interface Props {
  id: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onCommit: (value: number) => void;
}

export function NumberField({ id, value, min, max, step, onCommit }: Props) {
  // What the analyst is typing right now, or null when the input simply shows
  // the committed value. The draft is what keeps "0" from being written back
  // into the box mid-edit.
  const [draft, setDraft] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const editingBlank = draft !== null && parseDraft(draft) === null;
  const flag = focused
    ? editingBlank
      ? emptyFlagText(String(value))
      : null
    : outOfRange(value, min, max)
      ? rangeFlagText(value, min, max)
      : null;
  const flagId = `${id}-flag`;

  return (
    <>
      <input
        id={id}
        className="control"
        type="number"
        step={step}
        min={min}
        max={max}
        value={draft ?? String(value)}
        aria-invalid={flag !== null || undefined}
        aria-describedby={flag !== null ? flagId : undefined}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          setDraft(null);
        }}
        onChange={(e) => {
          setDraft(e.target.value);
          const parsed = parseDraft(e.target.value);
          if (parsed !== null) onCommit(parsed);
        }}
      />
      {flag !== null && (
        <p className="field__flag" id={flagId} role="status">
          {flag}
        </p>
      )}
    </>
  );
}
