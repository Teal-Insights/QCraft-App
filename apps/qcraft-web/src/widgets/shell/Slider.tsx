/**
 * A labelled range input with its value printed beside the label.
 *
 * The readout sits in the label row rather than under the track because a
 * finger or a cursor covers the thumb while dragging, and the number a trainee
 * is trying to read is the one they cannot see.
 *
 * `onInput` rather than `onChange` semantics: React's onChange on a range fires
 * continuously, which is what the animation needs. There is no debounce
 * anywhere in these widgets. All three models run in well under a millisecond,
 * and a debounce would put a gap between the hand and the line, which is the
 * one thing that would break the teaching.
 */

interface Props {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** Rendered readout. Defaults to one decimal and a percent sign. */
  format?: (value: number) => string;
  /** Short guidance under the track. Keep it to one line. */
  hint?: string;
  onChange: (value: number) => void;
}

const DEFAULT_FORMAT = (v: number) => `${v.toFixed(1)}%`;

export function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  format = DEFAULT_FORMAT,
  hint,
  onChange,
}: Props) {
  return (
    <div className="wfield">
      <div className="wfield__row">
        <label className="wfield__label" htmlFor={id}>
          {label}
        </label>
        <output className="wfield__value" htmlFor={id}>
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        className="wfield__range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {hint && <p className="wfield__hint">{hint}</p>}
    </div>
  );
}
