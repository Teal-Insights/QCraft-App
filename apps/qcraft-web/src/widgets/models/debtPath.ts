/**
 * Widget 1 model: the debt equation, one line of arithmetic.
 *
 * ── Faithfulness ──────────────────────────────────────────────────────────────
 * The recursion below is NOT a stylised teaching formula. It is character for
 * character the engine's own debt dynamics, from
 * packages/qcraft-engine/src/qcraft_engine/climate.py (Phase 5):
 *
 *     debt_to_gdp[i] = (
 *         debt_to_gdp[i - 1]
 *         * (1 + nom_rate / 100)
 *         / (1 + nominal_gdp_growth[i] / 100)
 *         - primary_bal_pct[i]
 *     )
 *
 * The ONE simplification, and the reason this file exists rather than a call to
 * the engine: the sandbox holds the interest rate, the nominal growth rate and
 * the primary balance CONSTANT across the horizon, because that is what makes
 * the snowball legible. In a real projection all three move year by year, which
 * is exactly the thing that hides the mechanism from a first-time reader. Set
 * the three sliders to Uganda's fixture averages and the path tracks the
 * engine's baseline closely (36.3% in 2029 to roughly 32% in 2050 here, against
 * the engine's 34.6%); the residual is the year-to-year variation this model
 * deliberately drops.
 *
 * No debt floor. Domain rule 3 (CLAUDE.md): the engine's BASELINE applies
 * max(0, debt); climate scenarios do NOT. This sandbox follows the climate form
 * because a floor would silently truncate the arithmetic the widget exists to
 * show. A user who drives the ratio below zero has found a real property of the
 * equation, not a bug, and the caption says so.
 *
 * Rates are percentages throughout (8.0 = 8%), matching every engine column.
 */

/** First projected year. 2029 is the last WEO year, so year one is 2030. */
export const START_YEAR = 2029;

/** Thirty years is long enough for compounding to show and short enough to read. */
export const HORIZON = 30;

export interface DebtInputs {
  /** Effective NOMINAL interest rate on the debt stock, percent. */
  interestRate: number;
  /** NOMINAL GDP growth, percent. Nominal on both sides or the ratio is wrong. */
  growthRate: number;
  /** Primary balance, percent of GDP. Positive is a surplus. */
  primaryBalance: number;
  /** Debt to GDP in START_YEAR, percent. */
  initialDebt: number;
}

export interface DebtYear {
  year: number;
  debtToGdp: number;
  /**
   * The snowball: what the ratio does on its own, before the budget.
   * d[t-1] * (i - g) / (1 + g). Positive means the ratio climbs even with the
   * budget exactly balanced.
   */
  snowball: number;
  /** The budget's contribution, which is minus the primary balance. */
  primaryBalanceEffect: number;
}

/**
 * Run the recursion. Explicit for-loop with a t-1 lookup, per domain rule 1 in
 * CLAUDE.md: this is a recursion, not a vectorisable expression.
 */
export function debtPath(inputs: DebtInputs, horizon = HORIZON): DebtYear[] {
  const { interestRate: i, growthRate: g, primaryBalance: pb, initialDebt } = inputs;

  const out: DebtYear[] = [
    { year: START_YEAR, debtToGdp: initialDebt, snowball: 0, primaryBalanceEffect: 0 },
  ];

  for (let t = 1; t <= horizon; t += 1) {
    const prior = out[t - 1].debtToGdp;
    const next = (prior * (1 + i / 100)) / (1 + g / 100) - pb;
    out.push({
      year: START_YEAR + t,
      debtToGdp: next,
      snowball: (prior * ((i - g) / 100)) / (1 + g / 100),
      primaryBalanceEffect: -pb,
    });
  }

  return out;
}

/**
 * Where the ratio settles if the three rates never move.
 *
 * Setting d[t] = d[t-1] = d* in the recursion gives d* = d* * f - pb, so
 *
 *   d* = -pb / (1 - f),  where f = (1 + i) / (1 + g)
 *
 * defined only while g exceeds i, which is what makes f less than one. The
 * minus sign is the whole point: a permanent primary DEFICIT (pb negative)
 * settles at a positive debt ratio, which is why a favourable differential
 * makes a standing deficit survivable and an adverse one makes no deficit
 * survivable at all.
 */
export function steadyState(inputs: DebtInputs): number | undefined {
  const factor = (1 + inputs.interestRate / 100) / (1 + inputs.growthRate / 100);
  if (factor >= 1) return undefined;
  return -inputs.primaryBalance / (1 - factor);
}

/**
 * Uganda at the engine's own numbers, and the widget's opening state.
 *
 * Read from the Uganda golden masters on 2026-08-26
 * (packages/qcraft-engine/tests/golden_masters/intermediate/):
 *   interestRate    interest_rate/uganda.csv, nominal_interest_rate. Flat 8.04
 *                   across the whole projection under the default
 *                   "Nominal interest rate" approach, so 8.0 is not an average,
 *                   it is the value.
 *   growthRate      baseline_v1/uganda.csv, nominal_gdp_growth_percent, mean of
 *                   2030-2050 = 9.95. Falls from 12.1 in 2030 to 7.0 by 2050 as
 *                   the productivity logistic converges.
 *   primaryBalance  fiscal/uganda.csv, primary_balance_percent_gdp, mean of
 *                   2030-2050 = -0.52.
 *   initialDebt     fiscal/uganda.csv, debt_to_gdp at 2029 = 36.33.
 */
export const UGANDA_LIKE: DebtInputs = {
  interestRate: 8.0,
  growthRate: 10.0,
  primaryBalance: -0.5,
  initialDebt: 36.3,
};

export interface DebtPreset {
  id: string;
  label: string;
  /** One line on what this preset is for, shown as the button's title. */
  hint: string;
  inputs: DebtInputs;
}

/**
 * The three presets walk the interest-growth differential from favourable to
 * neutral. Adverse is one drag away and the caption fires when it arrives, so
 * the room discovers it rather than being shown it.
 */
export const DEBT_PRESETS: DebtPreset[] = [
  {
    id: 'uganda',
    label: 'Uganda-like',
    hint: 'Uganda at the Explorer defaults: growth of 10% against an 8% interest rate, with a small primary deficit.',
    inputs: UGANDA_LIKE,
  },
  {
    id: 'r-equals-g',
    label: 'r equals g',
    hint: 'Interest and growth match, so the snowball is exactly zero and only the budget moves the ratio.',
    inputs: { ...UGANDA_LIKE, growthRate: 8.0 },
  },
  {
    id: 'favourable',
    label: 'Growth above interest',
    hint: 'Nominal growth of 13% against 8% borrowing: the ratio falls fast even while the budget stays in deficit.',
    inputs: { ...UGANDA_LIKE, growthRate: 13.0 },
  },
];
