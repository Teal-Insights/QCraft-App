/**
 * Widget 2 model: where nominal growth comes from.
 *
 * ── Faithfulness ──────────────────────────────────────────────────────────────
 * For projection years (2030 onward) this is not a mini-model. It is the
 * engine's own post-WEO arithmetic, ported line for line:
 *
 *   employment growth   working-age population growth, from UN WPP.
 *                       packages/qcraft-engine/src/qcraft_engine/demography.py
 *                       and baseline_v1.py, post-WEO branch.
 *   productivity growth logistic convergence, rate 0.5, turning point 15,
 *                       counter = year - 2029.
 *                       productivity.py, _logistic_growth.
 *   inflation           the same logistic at turning point 5.
 *                       inflation.py.
 *   real growth         (1 + e) * (1 + p) - 1        baseline_v1.py
 *   nominal growth      (1 + real) * (1 + inflation) - 1
 *
 * Verified 2026-08-26 against
 * packages/qcraft-engine/tests/golden_masters/intermediate/baseline_v1/uganda.csv
 * for every year 2030-2099: worst absolute difference 4.3e-14 on nominal growth.
 * tests/widgets.growthPath.test.ts pins it.
 *
 * The widget starts in 2030 rather than 2009 because before 2030 the engine
 * reads growth off WEO data and back-calculates productivity as a residual,
 * which teaches nothing about the growth skeleton. The projection period is
 * where the assumptions actually do the work.
 *
 * ── One thing this widget is careful about ────────────────────────────────────
 * Growth compounds, it does not add. (1+e)(1+p)(1+pi) - 1 is larger than
 * e + p + pi by the cross terms, which for Uganda in 2030 is about half a
 * point on a 13 point total. A stacked chart whose bands did not sum to the
 * total line would be a lie, so the cross terms get their own band. That band
 * IS domain rule 5 in CLAUDE.md made visible.
 */

import { num, parseCsv } from '../../engine/csv';
import {
  INFLATION_TURNING_POINT,
  LOGISTIC_RATE,
  logisticGrowth,
} from '../../engine/logistic';
import workingAgeCsv from '../data/ugandaWorkingAge.csv?raw';

export { logisticGrowth } from '../../engine/logistic';

/** Last WEO year. Projection, and this widget, start the year after. */
export const WEO_MAX_YEAR = 2029;
export const YEAR_END = 2099;

export const DEMOGRAPHY_VARIANTS = ['Medium', 'High', 'Low'] as const;
export type DemographyVariant = (typeof DEMOGRAPHY_VARIANTS)[number];

/**
 * Uganda working-age population, thousands, by UN WPP variant.
 * Derived from SHARED/sample-data/UGA.json by scripts/derive-working-age.mjs.
 * The Medium column reproduces the demography golden master exactly.
 */
const WORKING_AGE: Map<DemographyVariant, Map<number, number>> = (() => {
  const byVariant = new Map(
    DEMOGRAPHY_VARIANTS.map((v) => [v, new Map<number, number>()]),
  );
  for (const row of parseCsv(workingAgeCsv)) {
    const year = num(row, 'years');
    for (const variant of DEMOGRAPHY_VARIANTS) {
      byVariant.get(variant)!.set(year, num(row, variant));
    }
  }
  return byVariant;
})();

export interface GrowthInputs {
  demographyVariant: DemographyVariant;
  productivityStart: number;
  productivityEnd: number;
  inflationStart: number;
  inflationEnd: number;
}

export interface GrowthYear {
  year: number;
  /** Working-age population growth, percent. The engine's employment growth. */
  employment: number;
  /** Labour productivity growth, percent. */
  productivity: number;
  /** GDP deflator growth, percent. */
  inflation: number;
  /** (1 + e)(1 + p) - 1, percent. */
  realGrowth: number;
  /** (1 + real)(1 + inflation) - 1, percent. */
  nominalGrowth: number;
  /**
   * What compounding adds on top of the three simple rates: the cross terms of
   * the product, in points of nominal growth. Small, always positive here, and
   * the reason the bands sum to the total.
   */
  compounding: number;
}

export function growthPath(inputs: GrowthInputs): GrowthYear[] {
  const wap = WORKING_AGE.get(inputs.demographyVariant);
  if (!wap) throw new Error(`Unknown demography variant "${inputs.demographyVariant}"`);

  const out: GrowthYear[] = [];
  for (let year = WEO_MAX_YEAR + 1; year <= YEAR_END; year += 1) {
    const priorPop = wap.get(year - 1);
    const pop = wap.get(year);
    if (priorPop == null || pop == null) {
      throw new Error(`No working-age population for ${year}`);
    }

    const counter = year - WEO_MAX_YEAR;
    const employment = (pop / priorPop) * 100 - 100;
    const productivity = logisticGrowth(
      counter,
      inputs.productivityStart,
      inputs.productivityEnd,
    );
    const inflation = logisticGrowth(
      counter,
      inputs.inflationStart,
      inputs.inflationEnd,
      LOGISTIC_RATE,
      INFLATION_TURNING_POINT,
    );

    const realGrowth = (1 + employment / 100) * (1 + productivity / 100) * 100 - 100;
    const nominalGrowth = (1 + realGrowth / 100) * (1 + inflation / 100) * 100 - 100;

    out.push({
      year,
      employment,
      productivity,
      inflation,
      realGrowth,
      nominalGrowth,
      compounding: nominalGrowth - (employment + productivity + inflation),
    });
  }
  return out;
}

/**
 * The widget's opening state: Uganda at the Explorer defaults.
 *
 * Copied from DEFAULTS in packages/qcraft-engine/src/qcraft_engine/constants.py,
 * which is also what src/engine/mockAdapter.ts opens the Explorer on.
 *
 * Note on inflation_start. constants.py says 5.0 and the published TS engine
 * contract (SHARED/engine-api.md section 2) says 5.0, so 5.0 is what this
 * widget uses. The Uganda golden masters, however, were extracted from the
 * Excel workbook at inflation_start = 3.5, which is why their inflation column
 * is flat at 3.5 from 2030. The two disagree; see
 * .change-requests/INFLATION-DEFAULT-2026-08-26.md. The parity test pins this
 * model against the golden masters at 3.5, which is the parameter set those
 * fixtures actually represent.
 */
export const GROWTH_DEFAULTS: GrowthInputs = {
  demographyVariant: 'Medium',
  productivityStart: 5.0,
  productivityEnd: 1.2,
  inflationStart: 5.0,
  inflationEnd: 3.5,
};
