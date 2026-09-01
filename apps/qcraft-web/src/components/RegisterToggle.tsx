/**
 * The global chart-view control.
 *
 * It sits above the tab content rather than in the sidebar because it changes
 * what the charts SAY, not what the model computes. Everything in the sidebar
 * is a modelling assumption that moves the numbers; this moves nothing. Putting
 * it beside the debt target would tell a ministry reader that the two are the
 * same kind of switch, and one of them is a parameter of a fiscal projection.
 */

import {
  CHART_REGISTERS,
  REGISTER_HELP,
  REGISTER_LABEL,
  type ChartRegister,
} from '../charts/register';

interface Props {
  value: ChartRegister;
  onChange: (register: ChartRegister) => void;
  /** Number of charts on this tab currently set on their own. */
  overrideCount?: number;
  onClearOverrides?: () => void;
}

export function RegisterToggle({ value, onChange, overrideCount = 0, onClearOverrides }: Props) {
  return (
    <div className="register">
      <div className="register__control" role="radiogroup" aria-label="Chart view">
        <span className="register__legend">Chart view</span>
        <div className="register__options">
          {CHART_REGISTERS.map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={value === r}
              className={`register__option${value === r ? ' register__option--on' : ''}`}
              onClick={() => onChange(r)}
            >
              {REGISTER_LABEL[r]}
            </button>
          ))}
        </div>
      </div>
      <p className="register__help">
        {REGISTER_HELP[value]}
        {overrideCount > 0 && onClearOverrides && (
          <>
            {' '}
            <span className="register__override">
              {overrideCount === 1
                ? '1 chart on this tab is set on its own.'
                : `${overrideCount} charts on this tab are set on their own.`}{' '}
              <button type="button" className="linkish" onClick={onClearOverrides}>
                Reset them
              </button>
            </span>
          </>
        )}
      </p>
    </div>
  );
}
