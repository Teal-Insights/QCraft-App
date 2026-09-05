/**
 * Climate scenario module (`calc_climate_scenario` in Python).
 *
 * Recomputes the fiscal projection under climate-adjusted productivity growth. Called
 * once per scenario (six times per country). Recursive GDP and debt dynamics use an
 * explicit year-by-year loop (domain rule #1).
 *
 * Key domain rules encoded here:
 * - NO debt floor: climate scenarios may produce negative debt-to-GDP (rule #3).
 * - Employment growth, interest rate and inflation are unchanged from baseline.
 * - No fiscal rule feedback is applied inside a climate scenario.
 * - `expenditureRigidity` 1.0 = sticky (worst case), 0.0 = fully flexible (rule #4).
 */

import type {
  BaselineV1Row,
  ClimateRow,
  ClimateVariationRow,
  FiscalRow,
  InterestRateRow,
  Num,
  RiskRow,
} from './types.js';
import { YEAR_END, YEAR_START } from './constants.js';
import { mustGet } from './internal.js';

export interface ClimateOptions {
  /** Explicit first application year for the rolling profile; legacy callers retain inference. */
  climateStartYear?: number;
  /** 0.0 (flexible) to 1.0 (sticky, default). 1.0 keeps expenditure at baseline levels. */
  expenditureRigidity?: number;
  /** Optional discrete revenue/expenditure shocks, in % of GDP. */
  dataRisk?: readonly RiskRow[] | null;
}

/**
 * Compute climate-adjusted fiscal projections for one scenario.
 *
 * @param dataBaseline Output of `baselineCountry` (the fiscal module).
 * @param dataBaselineV1 Output of `baselineV1`.
 * @param dataInterest Output of `interestRateCountry`.
 * @param climateVariation Year-over-year productivity growth shock; zero through
 *   WEO_MAX_YEAR, which is how the function infers where projections begin.
 * @returns 91 rows (2009–2099) with 21 columns.
 */
export function calcClimateScenario(
  dataBaseline: readonly FiscalRow[],
  dataBaselineV1: readonly BaselineV1Row[],
  dataInterest: readonly InterestRateRow[],
  climateVariation: readonly ClimateVariationRow[],
  options: ClimateOptions = {},
): ClimateRow[] {
  const { expenditureRigidity = 1.0, dataRisk = null } = options;

  const inRange = <T extends { years: number }>(rows: readonly T[]): T[] =>
    rows
      .filter((r) => r.years >= YEAR_START && r.years <= YEAR_END)
      .sort((a, b) => a.years - b.years);

  const bv1 = inRange(dataBaselineV1);
  const fiscal = inRange(dataBaseline);
  const interest = inRange(dataInterest);
  const cv = [...climateVariation].sort((a, b) => a.years - b.years);

  // WEO_MAX_YEAR is the year before the first nonzero climate variation.
  const firstShock = cv.find((r) => r.climate_variation !== 0.0);
  const weoMaxYear = options.climateStartYear === undefined
    ? (firstShock === undefined ? 2029 : firstShock.years - 1)
    : options.climateStartYear - 1;

  const bv1Lookup = new Map<number, BaselineV1Row>();
  for (const row of bv1) bv1Lookup.set(row.years, row);

  const fiscalLookup = new Map<number, FiscalRow>();
  for (const row of fiscal) fiscalLookup.set(row.years, row);

  const interestLookup = new Map<number, number>();
  for (const row of interest) interestLookup.set(row.years, row.nominal_interest_rate);

  const cvLookup = new Map<number, number>();
  for (const row of cv) cvLookup.set(row.years, row.climate_variation);

  const riskRevLookup = new Map<number, number>();
  const riskExpLookup = new Map<number, number>();
  if (dataRisk) {
    for (const row of dataRisk) {
      riskRevLookup.set(row.years, row.revenue_risk);
      riskExpLookup.set(row.years, row.expenditure_risk);
    }
  }

  const years: number[] = [];
  for (let y = YEAR_START; y <= YEAR_END; y += 1) years.push(y);
  const n = years.length;

  // GDP arrays.
  const labourProdGrowth = new Array<number>(n).fill(0);
  const realGdpGrowth = new Array<number>(n).fill(0);
  const nominalGdpGrowth = new Array<number>(n).fill(0);
  const nominalGdp = new Array<number>(n).fill(0);
  const realGdp = new Array<number>(n).fill(0);
  const employmentGrowth = new Array<number>(n).fill(0);

  // Fiscal arrays.
  const revenue = new Array<number>(n).fill(0);
  const revenuePct = new Array<number>(n).fill(0);
  const primaryExp = new Array<number>(n).fill(0);
  const primaryExpPct = new Array<number>(n).fill(0);
  const primaryBal = new Array<number>(n).fill(0);
  const primaryBalPct = new Array<number>(n).fill(0);
  const interestExp = new Array<number>(n).fill(0);
  const interestExpPct = new Array<number>(n).fill(0);
  const totalExp = new Array<number>(n).fill(0);
  const overallBal = new Array<number>(n).fill(0);
  const overallBalPct = new Array<number>(n).fill(0);
  const debtToGdp = new Array<number>(n).fill(0);
  const debt = new Array<number>(n).fill(0);
  const dspb = new Array<Num>(n).fill(null);

  // --- WEO period: copy the baseline through unchanged ---
  for (let i = 0; i < n; i += 1) {
    const year = years[i]!;
    if (year > weoMaxYear) break;

    const bv = mustGet(bv1Lookup, year, 'baseline_v1');
    const fl = mustGet(fiscalLookup, year, 'fiscal baseline');

    labourProdGrowth[i] = bv.labour_productivity_growth;
    realGdpGrowth[i] = bv.real_gdp_growth_percent;
    nominalGdpGrowth[i] = bv.nominal_gdp_growth_percent;
    nominalGdp[i] = bv.nominal_gdp;
    realGdp[i] = bv.real_gdp;
    employmentGrowth[i] = bv.employment_growth;

    revenue[i] = fl.revenue;
    revenuePct[i] = fl.revenue_percent_gdp;
    primaryExp[i] = fl.primary_expenditure;
    primaryExpPct[i] = fl.primary_expenditure_percent_gdp;
    primaryBal[i] = fl.primary_balance;
    primaryBalPct[i] = fl.primary_balance_percent_gdp;
    interestExp[i] = fl.interest_expenditure;
    interestExpPct[i] = fl.interest_expenditure_percent_gdp;
    totalExp[i] = fl.total_expenditure;
    overallBal[i] = fl.overall_balance;
    overallBalPct[i] = fl.overall_balance_percent_gdp;
    debtToGdp[i] = fl.debt_to_gdp;
    debt[i] = fl.debt;

    // DSPB from 2010 onward.
    if (i > 0) {
      const nomRate = mustGet(interestLookup, year, 'nominal_interest_rate');
      const gdpG = nominalGdpGrowth[i]!;
      dspb[i] = ((debtToGdp[i - 1]! * (nomRate - gdpG)) / 100) / (1 + gdpG / 100);
    }
  }

  // --- Projection period: recursive, explicit t-1 loop ---
  for (let i = 0; i < n; i += 1) {
    const year = years[i]!;
    if (year <= weoMaxYear) continue;

    const bv = mustGet(bv1Lookup, year, 'baseline_v1');
    const fl = mustGet(fiscalLookup, year, 'fiscal baseline');
    const nomRate = mustGet(interestLookup, year, 'nominal_interest_rate');
    const variation = cvLookup.get(year) ?? 0.0;
    const inflation = bv.gdp_deflator_growth_percent;

    // Phase 1: shock productivity; employment is unchanged from baseline.
    employmentGrowth[i] = bv.employment_growth;
    labourProdGrowth[i] = bv.labour_productivity_growth + variation;

    // Phase 2: recompute GDP recursively.
    realGdpGrowth[i] =
      (1 + employmentGrowth[i]! / 100) * (1 + labourProdGrowth[i]! / 100) * 100 - 100;
    nominalGdpGrowth[i] =
      (1 + realGdpGrowth[i]! / 100) * (1 + inflation / 100) * 100 - 100;
    realGdp[i] = realGdp[i - 1]! * (1 + realGdpGrowth[i]! / 100);
    nominalGdp[i] = nominalGdp[i - 1]! * (1 + nominalGdpGrowth[i]! / 100);

    // Phase 3: expenditure recalibration. rigidity=1.0 holds the baseline LEVEL
    // (sticky, worst case); rigidity=0.0 holds the baseline SHARE of GDP.
    const baselinePexp = fl.primary_expenditure;
    const baselinePexpPct = fl.primary_expenditure_percent_gdp;
    const primaryExpWithBaselinePct = (baselinePexpPct * nominalGdp[i]!) / 100;
    const recalibration = baselinePexp - primaryExpWithBaselinePct;
    primaryExp[i] = baselinePexp - (1 - expenditureRigidity) * recalibration;

    // Phase 4: revenue holds the baseline ratio to GDP.
    revenuePct[i] = fl.revenue_percent_gdp;
    revenue[i] = (revenuePct[i]! / 100) * nominalGdp[i]!;

    if (dataRisk) {
      const revRisk = riskRevLookup.get(year) ?? 0.0;
      const expRisk = riskExpLookup.get(year) ?? 0.0;
      revenue[i] = revenue[i]! + (revRisk / 100) * nominalGdp[i]!;
      primaryExp[i] = primaryExp[i]! + (expRisk / 100) * nominalGdp[i]!;
      revenuePct[i] = (revenue[i]! / nominalGdp[i]!) * 100;
    }

    // Phase 5: recursive fiscal block — NO debt floor here (domain rule #3).
    primaryExpPct[i] = (primaryExp[i]! / nominalGdp[i]!) * 100;
    primaryBal[i] = revenue[i]! - primaryExp[i]!;
    primaryBalPct[i] = (primaryBal[i]! / nominalGdp[i]!) * 100;

    debtToGdp[i] =
      (debtToGdp[i - 1]! * (1 + nomRate / 100)) / (1 + nominalGdpGrowth[i]! / 100) -
      primaryBalPct[i]!;

    debt[i] = (debtToGdp[i]! / 100) * nominalGdp[i]!;

    interestExp[i] = (debt[i - 1]! * nomRate) / 100;
    interestExpPct[i] = (interestExp[i]! / nominalGdp[i]!) * 100;

    totalExp[i] = primaryExp[i]! + interestExp[i]!;
    overallBal[i] = revenue[i]! - totalExp[i]!;
    overallBalPct[i] = (overallBal[i]! / nominalGdp[i]!) * 100;

    dspb[i] =
      ((debtToGdp[i - 1]! * (nomRate - nominalGdpGrowth[i]!)) / 100) /
      (1 + nominalGdpGrowth[i]! / 100);
  }

  return years.map((year, i) => ({
    years: year,
    revenue: revenue[i]!,
    revenue_percent_gdp: revenuePct[i]!,
    primary_expenditure: primaryExp[i]!,
    primary_expenditure_percent_gdp: primaryExpPct[i]!,
    primary_balance: primaryBal[i]!,
    primary_balance_percent_gdp: primaryBalPct[i]!,
    interest_expenditure: interestExp[i]!,
    interest_expenditure_percent_gdp: interestExpPct[i]!,
    total_expenditure: totalExp[i]!,
    overall_balance: overallBal[i]!,
    overall_balance_percent_gdp: overallBalPct[i]!,
    debt_to_gdp: debtToGdp[i]!,
    debt: debt[i]!,
    debt_stabilizing_primary_balance: dspb[i]!,
    labour_productivity_growth: labourProdGrowth[i]!,
    real_gdp_growth_percent: realGdpGrowth[i]!,
    nominal_gdp_growth_percent: nominalGdpGrowth[i]!,
    nominal_gdp: nominalGdp[i]!,
    real_gdp: realGdp[i]!,
    employment_growth: employmentGrowth[i]!,
  }));
}
