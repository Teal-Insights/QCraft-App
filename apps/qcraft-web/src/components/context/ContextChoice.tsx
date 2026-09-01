/**
 * A row of chips acting as one choice, or as a set of toggles.
 *
 * The widgets' ChoiceGroup is the same idea sized for a projector; these sit
 * inside the Explorer chrome next to a sidebar, so they are smaller and take
 * the app's control styling. The two are not shared because merging them would
 * mean one component with a size prop serving two different layouts, which is
 * the kind of abstraction CLAUDE.md's simplicity rule exists to prevent.
 *
 * `multiple` switches the semantics from radio to checkbox, and the ARIA roles
 * follow: a comparator set is genuinely a multi-select, and announcing it as a
 * radio group would tell a screen-reader user the wrong thing.
 */

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
}

interface SingleProps<T extends string> {
  legend: string;
  choices: ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  multiple?: false;
}

interface MultiProps<T extends string> {
  legend: string;
  choices: ChoiceOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  multiple: true;
}

export function ContextChoice<T extends string>(props: SingleProps<T> | MultiProps<T>) {
  const { legend, choices } = props;

  if (!choices.length) return null;

  const isOn = (value: T) =>
    props.multiple ? props.value.includes(value) : props.value === value;

  const toggle = (value: T) => {
    if (!props.multiple) {
      props.onChange(value);
      return;
    }
    props.onChange(
      props.value.includes(value)
        ? props.value.filter((v) => v !== value)
        : [...props.value, value],
    );
  };

  return (
    <div
      className="cchoice"
      role={props.multiple ? 'group' : 'radiogroup'}
      aria-label={legend}
    >
      <span className="cchoice__legend">{legend}</span>
      <div className="cchoice__options">
        {choices.map((choice) => {
          const on = isOn(choice.value);
          return (
            <button
              key={choice.value}
              type="button"
              role={props.multiple ? 'checkbox' : 'radio'}
              aria-checked={on}
              className={`cchoice__option${on ? ' cchoice__option--on' : ''}`}
              onClick={() => toggle(choice.value)}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
