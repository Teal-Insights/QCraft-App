import type { ParamKey } from '../content/params';
import type { EngineParams } from '../engine/types';

/** A stored choice can be supported by the engine but inactive in this run. */
export function parameterApplicability(key: ParamKey, params: EngineParams): {
  active: boolean;
  explanation?: string;
} {
  if (key === 'long_run_interest_rate' && params.interest_rate_mode !== 'Real interest rate') {
    return { active: false, explanation: 'Inactive: used only with the Real interest rate approach.' };
  }
  if (key === 'debt_target' && params.fiscal_rule === 'No') {
    return { active: false, explanation: 'Inactive: the fiscal rule is No.' };
  }
  return { active: true };
}
