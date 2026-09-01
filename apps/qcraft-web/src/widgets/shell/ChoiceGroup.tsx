/**
 * A row of buttons acting as one choice.
 *
 * A native radio group would be the orthodox control, but these are meant to be
 * hit from two metres away on a projector by someone standing at a laptop, so
 * they are large targets with the current one filled. `role="radiogroup"` and
 * `aria-checked` keep the semantics a radio group would have given.
 */

export interface Choice<T extends string> {
  value: T;
  label: string;
  /** Optional swatch, for the scenario picker. */
  color?: string;
  /** Native title text. One line on what this choice is for. */
  hint?: string;
}

interface Props<T extends string> {
  legend: string;
  choices: Choice<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Renders the group as chips with colour swatches rather than plain buttons. */
  swatches?: boolean;
}

export function ChoiceGroup<T extends string>({
  legend,
  choices,
  value,
  onChange,
  swatches = false,
}: Props<T>) {
  return (
    <div className="wchoice" role="radiogroup" aria-label={legend}>
      <span className="wchoice__legend">{legend}</span>
      <div className="wchoice__options">
        {choices.map((choice) => (
          <button
            key={choice.value}
            type="button"
            role="radio"
            aria-checked={choice.value === value}
            title={choice.hint}
            className={`wchoice__option${
              choice.value === value ? ' wchoice__option--on' : ''
            }`}
            onClick={() => onChange(choice.value)}
          >
            {swatches && choice.color && (
              <span
                className="wchoice__swatch"
                style={{ background: choice.color }}
                aria-hidden="true"
              />
            )}
            {choice.label}
          </button>
        ))}
      </div>
    </div>
  );
}
