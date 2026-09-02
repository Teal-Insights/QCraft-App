/**
 * Widget 3 model: how warming reaches the debt line.
 *
 * ── This one is not a mini-model at all ───────────────────────────────────────
 * Widgets 1 and 2 are allowed a simplification. This one is not: the brief
 * requires real scenario data, so every number here is real Q-CRAFT output from
 * the same golden masters the Explorer serves
 * (packages/qcraft-engine/tests/golden_masters/intermediate/).
 *
 * The GDP paths are read straight off the fixtures. Only the rigidity response
 * is recomputed, and it is recomputed with the engine's own recursion, ported
 * from packages/qcraft-engine/src/qcraft_engine/climate.py, phases 3 to 5:
 *
 *     primary_exp_with_baseline_pct = baseline_pexp_pct * nominal_gdp[i] / 100
 *     recalibration = baseline_pexp - primary_exp_with_baseline_pct
 *     primary_exp[i] = baseline_pexp - (1 - expenditure_rigidity) * recalibration
 *     ...
 *     debt_to_gdp[i] = debt_to_gdp[i-1] * (1 + nom_rate/100)
 *                      / (1 + nominal_gdp_growth[i]/100) - primary_bal_pct[i]
 *
 * ── Why this can be recomputed honestly ───────────────────────────────────────
 * Expenditure rigidity does not enter the GDP block. Phase 2 of the climate
 * module computes real and nominal GDP from the productivity shock alone, and
 * nothing downstream feeds back into it. So the fixture's `nominal_gdp` column
 * is the correct nominal GDP at EVERY rigidity, not only at the 1.0 the
 * fixtures were generated with, and the fiscal block above it is a pure
 * function of that column plus the baseline fiscal ratios and the interest path.
 *
 * The check that this is true rather than merely argued: at rigidity 1.0 the
 * recomputation reproduces all six climate golden masters exactly, worst
 * absolute difference 1.4e-13 on debt to GDP across 70 projection years, and at
 * rigidity 0.0 the primary balance ratio equals the baseline's to 4.3e-15.
 * tests/widgets.climateChannel.test.ts pins both ends.
 *
 * ── Domain rules observed ─────────────────────────────────────────────────────
 * Rule 1: explicit for-loop with a t-1 lookup, no vectorised recursion.
 * Rule 3: NO max(0, debt). This is climate scenario code and the floor is a
 *         baseline-only behaviour. The fixtures do not have it either.
 * Rule 4: rigidity 1.0 is STICKY, the worst case, and is the Explorer default.
 *         0.0 is fully flexible.
 *
 * ── When the TypeScript engine lands ──────────────────────────────────────────
 * This module reads fixtures directly rather than going through
 * src/engine/adapter.ts because the adapter's `EngineResult` carries the
 * Explorer's chart columns, not nominal GDP levels or the interest path, and
 * widening that seam for one widget would be the wrong trade. `runPipeline`
 * returns every column used here, so the swap is: replace `loadFixtures()` with
 * a call to the engine and leave the recursion untouched.
 */

import fiscalCsv from '../../../../../packages/qcraft-engine/tests/golden_masters/intermediate/fiscal/uganda.csv?raw';
import baselineV1Csv from '../../../../../packages/qcraft-engine/tests/golden_masters/intermediate/baseline_v1/uganda.csv?raw';
import interestCsv from '../../../../../packages/qcraft-engine/tests/golden_masters/intermediate/interest_rate/uganda.csv?raw';
import parisCsv from '../../../../../packages/qcraft-engine/tests/golden_masters/intermediate/climate/paris_uganda.csv?raw';
import moderateCsv from '../../../../../packages/qcraft-engine/tests/golden_masters/intermediate/climate/moderate_uganda.csv?raw';
import hotCsv from '../../../../../packages/qcraft-engine/tests/golden_masters/intermediate/climate/hot_uganda.csv?raw';
import hotAdaptedCsv from '../../../../../packages/qcraft-engine/tests/golden_masters/intermediate/climate/hot_adapted_uganda.csv?raw';
import hotUnadaptedCsv from '../../../../../packages/qcraft-engine/tests/golden_masters/intermediate/climate/hot_unadapted_uganda.csv?raw';
import highCsv from '../../../../../packages/qcraft-engine/tests/golden_masters/intermediate/climate/high_uganda.csv?raw';

import { num, parseCsv } from '../../engine/csv';
import {
  SCENARIO_DISPLAY_ORDER,
  SCENARIO_LABELS,
  type ClimateScenario,
} from '../../engine/types';

/** Last WEO year. Climate impacts and this recomputation start the year after. */
export const WEO_MAX_YEAR = 2029;
export const YEAR_END = 2099;

/** The Explorer default. Rule 4: 1.0 is sticky, which is the worst case. */
export const DEFAULT_RIGIDITY = 1.0;

const CLIMATE_CSV: Record<ClimateScenario, string> = {
  Paris: parisCsv,
  Moderate: moderateCsv,
  Hot: hotCsv,
  Hot_Adapted: hotAdaptedCsv,
  Hot_Unadapted: hotUnadaptedCsv,
  High: highCsv,
};

interface BaselineRow {
  /** Baseline primary expenditure, LCU billions. */
  primaryExpenditure: number;
  /** Baseline primary expenditure as a share of baseline nominal GDP. */
  primaryExpenditurePct: number;
  /** Baseline revenue ratio. Climate scenarios hold the ratio, not the level. */
  revenuePct: number;
  primaryBalancePct: number;
  debtToGdp: number;
  realGdp: number;
}

interface ScenarioFixture {
  /** Nominal GDP under the scenario. Independent of rigidity, see the note above. */
  nominalGdp: Map<number, number>;
  nominalGdpGrowth: Map<number, number>;
  realGdp: Map<number, number>;
  /** Labour productivity growth, which is where the climate shock enters. */
  productivityGrowth: Map<number, number>;
}

interface Fixtures {
  years: number[];
  baseline: Map<number, BaselineRow>;
  /** Nominal interest rate, percent, from the interest-rate module. */
  interestRate: Map<number, number>;
  baselineProductivityGrowth: Map<number, number>;
  scenarios: Map<ClimateScenario, ScenarioFixture>;
}

/** Parsed once at module load. The fixtures are static. */
const FIXTURES: Fixtures = (() => {
  const fiscalRows = parseCsv(fiscalCsv);
  const baselineV1Rows = parseCsv(baselineV1Csv);

  const baselineRealGdp = new Map(
    baselineV1Rows.map((row) => [num(row, 'years'), num(row, 'real_gdp')]),
  );
  const baselineProductivityGrowth = new Map(
    baselineV1Rows.map((row) => [
      num(row, 'years'),
      num(row, 'labour_productivity_growth'),
    ]),
  );

  const baseline = new Map<number, BaselineRow>();
  for (const row of fiscalRows) {
    const year = num(row, 'years');
    baseline.set(year, {
      primaryExpenditure: num(row, 'primary_expenditure'),
      primaryExpenditurePct: num(row, 'primary_expenditure_percent_gdp'),
      revenuePct: num(row, 'revenue_percent_gdp'),
      primaryBalancePct: num(row, 'primary_balance_percent_gdp'),
      debtToGdp: num(row, 'debt_to_gdp'),
      realGdp: baselineRealGdp.get(year) ?? 0,
    });
  }

  const interestRate = new Map(
    parseCsv(interestCsv).map((row) => [
      num(row, 'years'),
      num(row, 'nominal_interest_rate'),
    ]),
  );

  const scenarios = new Map<ClimateScenario, ScenarioFixture>();
  for (const key of SCENARIO_DISPLAY_ORDER) {
    const rows = parseCsv(CLIMATE_CSV[key]);
    scenarios.set(key, {
      nominalGdp: new Map(rows.map((r) => [num(r, 'years'), num(r, 'nominal_gdp')])),
      nominalGdpGrowth: new Map(
        rows.map((r) => [num(r, 'years'), num(r, 'nominal_gdp_growth_percent')]),
      ),
      realGdp: new Map(rows.map((r) => [num(r, 'years'), num(r, 'real_gdp')])),
      productivityGrowth: new Map(
        rows.map((r) => [num(r, 'years'), num(r, 'labour_productivity_growth')]),
      ),
    });
  }

  const years = fiscalRows
    .map((row) => num(row, 'years'))
    .filter((year) => year >= WEO_MAX_YEAR && year <= YEAR_END);

  return { years, baseline, interestRate, baselineProductivityGrowth, scenarios };
})();

export interface ChannelYear {
  year: number;
  debtToGdp: number;
  primaryBalancePct: number;
  /** Real GDP shortfall against the baseline path, percent. Zero or negative. */
  gdpShortfall: number;
  /**
   * How much of baseline productivity growth the warming shock removes this
   * year, in points. This is `climate_variation` in the engine, recovered by
   * differencing the scenario against the baseline.
   */
  productivityHit: number;
}

export interface ChannelPath {
  key: ClimateScenario;
  label: string;
  years: ChannelYear[];
}

/**
 * Recompute one scenario at a chosen expenditure rigidity.
 *
 * Explicit for-loop with a t-1 lookup on debt, per domain rule 1.
 */
export function channelPath(key: ClimateScenario, rigidity: number): ChannelPath {
  const fixture = FIXTURES.scenarios.get(key);
  if (!fixture) throw new Error(`No fixture for climate scenario "${key}"`);

  const years: ChannelYear[] = [];
  let priorDebt = FIXTURES.baseline.get(WEO_MAX_YEAR)!.debtToGdp;

  years.push({
    year: WEO_MAX_YEAR,
    debtToGdp: priorDebt,
    primaryBalancePct: FIXTURES.baseline.get(WEO_MAX_YEAR)!.primaryBalancePct,
    gdpShortfall: 0,
    productivityHit: 0,
  });

  for (let year = WEO_MAX_YEAR + 1; year <= YEAR_END; year += 1) {
    const base = FIXTURES.baseline.get(year);
    const nominalGdp = fixture.nominalGdp.get(year);
    const nominalGdpGrowth = fixture.nominalGdpGrowth.get(year);
    const realGdp = fixture.realGdp.get(year);
    const rate = FIXTURES.interestRate.get(year);
    if (
      base == null ||
      nominalGdp == null ||
      nominalGdpGrowth == null ||
      realGdp == null ||
      rate == null
    ) {
      throw new Error(`Incomplete fixture coverage for ${key} in ${year}`);
    }

    // Phase 3: expenditure recalibration. At rigidity 1.0 spending holds its
    // baseline LEVEL while GDP is smaller, so the ratio rises. At 0.0 it holds
    // its baseline RATIO, so the ratio does not move and this channel is shut.
    const expenditureAtBaselineRatio = (base.primaryExpenditurePct * nominalGdp) / 100;
    const recalibration = base.primaryExpenditure - expenditureAtBaselineRatio;
    const primaryExpenditure = base.primaryExpenditure - (1 - rigidity) * recalibration;

    // Phase 4: revenue holds its baseline ratio, so it falls with GDP in level.
    const revenue = (base.revenuePct / 100) * nominalGdp;

    // Phase 5: recursive fiscal. No debt floor (domain rule 3).
    const primaryBalancePct = ((revenue - primaryExpenditure) / nominalGdp) * 100;
    const debtToGdp =
      (priorDebt * (1 + rate / 100)) / (1 + nominalGdpGrowth / 100) - primaryBalancePct;

    years.push({
      year,
      debtToGdp,
      primaryBalancePct,
      gdpShortfall: base.realGdp > 0 ? (realGdp / base.realGdp - 1) * 100 : 0,
      productivityHit:
        (fixture.productivityGrowth.get(year) ?? 0) -
        (FIXTURES.baselineProductivityGrowth.get(year) ?? 0),
    });

    priorDebt = debtToGdp;
  }

  return { key, label: SCENARIO_LABELS[key], years };
}

/** The baseline path, which is the reference every scenario is read against. */
export function baselinePath(): ChannelYear[] {
  return FIXTURES.years.map((year) => {
    const row = FIXTURES.baseline.get(year)!;
    return {
      year,
      debtToGdp: row.debtToGdp,
      primaryBalancePct: row.primaryBalancePct,
      gdpShortfall: 0,
      productivityHit: 0,
    };
  });
}

/** All six scenarios at one rigidity, in the contract's display order. */
export function allChannelPaths(rigidity: number): ChannelPath[] {
  return SCENARIO_DISPLAY_ORDER.map((key) => channelPath(key, rigidity));
}

export { SCENARIO_DISPLAY_ORDER, SCENARIO_LABELS };
export type { ClimateScenario };
