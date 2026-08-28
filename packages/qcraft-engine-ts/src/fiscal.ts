/**
 * Fiscal projection module (`baseline_country` in Python).
 *
 * Computes the recursive fiscal projection: revenue, expenditure, debt dynamics,
 * fiscal rule feedback, and derived indicators for 2009–2099. Every projection-period
 * variable depends on prior-year state, so this is an explicit year-by-year loop
 * (domain rule #1) — never a vectorised shift/cumsum.
 */

import type {
  BaselineV1Row,
  FiscalRow,
  FiscalRuleSetting,
  InterestRateRow,
  MacroFiscalRow,
  Num,
} from './types.js';
import { YEAR_END, YEAR_START } from './constants.js';
import { mustGet, nanToNull } from './internal.js';
import { MissingDebtAnchorError, MissingMacrofiscalInputError } from './errors.js';

/**
 * The macrofiscal columns this module reads. The row it is handed carries more
 * than these (`interest_rate_percent` among them, which the interest rate module
 * consumes and this one does not), so a null is only this module's problem when
 * it lands in a column this module reads.
 */
const READS = [
  'revenue',
  'revenue_percent_gdp',
  'primary_expenditure',
  'primary_expenditure_percent_gdp',
  'primary_balance',
  'primary_balance_percent_gdp',
  'interest_expenditure',
  'interest_expenditure_percent_gdp',
  'total_expenditure',
  'overall_balance',
  'overall_balance_percent_gdp',
  'debt_to_gdp',
  'debt',
  'nominal_gdp',
] as const satisfies readonly (keyof MacroFiscalRow)[];

/** `null` coerces to 0 in JavaScript arithmetic, so it has to be caught by value. */
function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export interface FiscalOptions {
  /** Debt-to-GDP target for the fiscal rule. */
  debtTarget: number;
  /** "Yes" enables the fiscal rule feedback loop; "No" zeroes it. */
  fiscalRule: FiscalRuleSetting;
}

/**
 * Compute baseline fiscal projections for a single country.
 *
 * @param dataBaseline Output of `baselineV1`.
 * @param dataInterest Output of `interestRateCountry`.
 * @param dataMacrofiscal Historical (WEO-period) fiscal data.
 * @returns 91 rows (2009–2099) with 16 columns.
 */
export function baselineCountry(
  dataBaseline: readonly BaselineV1Row[],
  dataInterest: readonly InterestRateRow[],
  dataMacrofiscal: readonly MacroFiscalRow[],
  iso3c: string,
  options: FiscalOptions,
): FiscalRow[] {
  const { debtTarget, fiscalRule } = options;

  const macroCountry = dataMacrofiscal
    .filter((r) => r.iso3c === iso3c)
    .sort((a, b) => a.years - b.years);
  if (macroCountry.length === 0) {
    throw new Error(`No data found for iso3c='${iso3c}' in data_macrofiscal`);
  }
  const weoMaxYear = Math.max(...macroCountry.map((r) => r.years));

  // The projection carries debt forward from the last WEO year, so that year's
  // debt ratio is the one number without which nothing downstream is defined.
  // The workbook does not guard this either: `Baseline` row 36 anchors on its
  // last WEO column and reads `#VALUE!` all the way to 2099 when the column is
  // empty. Python raises here; without this check JavaScript coerced the null to
  // zero and drew a debt path pinned at the floor.
  const anchorRow = macroCountry.find((r) => r.years === weoMaxYear);
  if (anchorRow === undefined || !isNumber(anchorRow.debt_to_gdp)) {
    throw new MissingDebtAnchorError(iso3c, weoMaxYear);
  }

  // Only the years the projection actually reads. The fill loop below starts at
  // YEAR_START and stops at the last WEO year, and the workbook's own Baseline
  // sheet starts its axis at 2009 too, so a hole in 2001-2008 is not this
  // engine's business.
  const macroLookup = new Map<number, MacroFiscalRow>();
  for (const row of macroCountry) {
    if (row.years < YEAR_START || row.years > weoMaxYear) continue;
    for (const field of READS) {
      if (!isNumber(row[field])) {
        throw new MissingMacrofiscalInputError(iso3c, row.years, field);
      }
    }
    macroLookup.set(row.years, row);
  }

  const nominalGdpLookup = new Map<number, number>();
  const nominalGdpGrowthLookup = new Map<number, number>();
  const productivityGrowthLookup = new Map<number, number>();
  const inflationLookup = new Map<number, number>();
  const popGrowthLookup = new Map<number, number>();
  for (const row of dataBaseline) {
    if (row.years < YEAR_START || row.years > YEAR_END) continue;
    nominalGdpLookup.set(row.years, row.nominal_gdp);
    nominalGdpGrowthLookup.set(row.years, row.nominal_gdp_growth_percent);
    productivityGrowthLookup.set(row.years, row.labour_productivity_growth);
    inflationLookup.set(row.years, row.gdp_deflator_growth_percent);
    popGrowthLookup.set(row.years, row.population_growth);
  }

  const interestRateLookup = new Map<number, number>();
  for (const row of dataInterest) {
    if (row.years >= YEAR_START && row.years <= YEAR_END) {
      interestRateLookup.set(row.years, row.nominal_interest_rate);
    }
  }

  const years: number[] = [];
  for (let y = YEAR_START; y <= YEAR_END; y += 1) years.push(y);
  const n = years.length;

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
  const fiscalGap = new Array<Num>(n).fill(null);
  /** Applied to the FOLLOWING year's primary expenditure — additive in levels, not a rate. */
  const fiscalRuleValue = new Array<number>(n).fill(0);

  // --- WEO period: take fiscal aggregates straight from macrofiscal ---
  for (let i = 0; i < n; i += 1) {
    const year = years[i]!;
    if (year > weoMaxYear) break;

    const m = mustGet(macroLookup, year, 'macrofiscal');
    revenue[i] = m.revenue;
    revenuePct[i] = m.revenue_percent_gdp;
    primaryExp[i] = m.primary_expenditure;
    primaryExpPct[i] = m.primary_expenditure_percent_gdp;
    primaryBal[i] = m.primary_balance;
    primaryBalPct[i] = m.primary_balance_percent_gdp;
    interestExp[i] = m.interest_expenditure;
    interestExpPct[i] = m.interest_expenditure_percent_gdp;
    totalExp[i] = m.total_expenditure;
    overallBal[i] = m.overall_balance;
    overallBalPct[i] = m.overall_balance_percent_gdp;
    debtToGdp[i] = m.debt_to_gdp;
    debt[i] = m.debt;

    // DSPB: computed from 2010 onward (needs t-1 debt).
    if (i > 0) {
      const nomRate = mustGet(interestRateLookup, year, 'nominal_interest_rate');
      const gdpG = mustGet(nominalGdpGrowthLookup, year, 'nominal GDP growth');
      dspb[i] = ((debtToGdp[i - 1]! * (nomRate - gdpG)) / 100) / (1 + gdpG / 100);
    }

    const dspbVal = dspb[i]!;
    if (dspbVal !== null) {
      const ngdp = mustGet(nominalGdpLookup, year, 'nominal_gdp');
      const fg = ((primaryBalPct[i]! - dspbVal) / 100) * ngdp;

      // Fiscal gap is only reported from WEO_MAX_YEAR - 3 onward.
      if (year >= weoMaxYear - 3) fiscalGap[i] = fg;

      if (fiscalRule === 'No') {
        fiscalRuleValue[i] = 0.0;
      } else if (i > 0) {
        const rising = debtToGdp[i]! > debtToGdp[i - 1]!;
        const aboveTarget = debtToGdp[i]! > debtTarget;
        fiscalRuleValue[i] =
          (rising && aboveTarget) || (!rising && !aboveTarget) ? fg : 0.0;
      }
    }
  }

  // --- Recursive projection beyond WEO (explicit t-1 loop, domain rule #1) ---
  for (let i = 0; i < n; i += 1) {
    const year = years[i]!;
    if (year <= weoMaxYear) continue;

    const ngdp = mustGet(nominalGdpLookup, year, 'nominal_gdp');
    const ngdpGrowth = mustGet(nominalGdpGrowthLookup, year, 'nominal GDP growth');
    const prodGrowth = mustGet(productivityGrowthLookup, year, 'productivity growth');
    const infl = mustGet(inflationLookup, year, 'inflation');
    const popGrowth = mustGet(popGrowthLookup, year, 'population growth');
    const nomRate = mustGet(interestRateLookup, year, 'nominal_interest_rate');

    // Step 1: Revenue grows with nominal GDP.
    revenue[i] = revenue[i - 1]! * (1 + ngdpGrowth / 100);
    revenuePct[i] = (revenue[i]! / ngdp) * 100;

    // Step 2: Primary expenditure — MULTIPLICATIVE growth (1+a)(1+b)(1+c), then the
    // prior year's fiscal rule adjustment added in LEVELS (domain rule #2).
    primaryExp[i] =
      primaryExp[i - 1]! *
        (1 + prodGrowth / 100) *
        (1 + infl / 100) *
        (1 + popGrowth / 100) +
      fiscalRuleValue[i - 1]!;
    primaryExpPct[i] = (primaryExp[i]! / ngdp) * 100;

    // Step 3: Primary balance.
    primaryBal[i] = revenue[i]! - primaryExp[i]!;
    primaryBalPct[i] = (primaryBal[i]! / ngdp) * 100;

    // Step 4: Debt-to-GDP — the BASELINE applies the max(0, ...) floor (domain rule #3).
    const rawDebtToGdp =
      (debtToGdp[i - 1]! * (1 + nomRate / 100)) / (1 + ngdpGrowth / 100) -
      primaryBalPct[i]!;
    debtToGdp[i] = Math.max(0.0, rawDebtToGdp);

    // Step 5: Debt level.
    debt[i] = (debtToGdp[i]! / 100) * ngdp;

    // Step 6: Interest expenditure on prior-year debt at the current rate.
    interestExp[i] = (debt[i - 1]! * nomRate) / 100;
    interestExpPct[i] = (interestExp[i]! / ngdp) * 100;

    // Step 7: Total expenditure and overall balance.
    totalExp[i] = primaryExp[i]! + interestExp[i]!;
    overallBal[i] = revenue[i]! - totalExp[i]!;
    overallBalPct[i] = (overallBal[i]! / ngdp) * 100;

    // Step 8: Debt-stabilising primary balance.
    const dspbVal = ((debtToGdp[i - 1]! * (nomRate - ngdpGrowth)) / 100) /
      (1 + ngdpGrowth / 100);
    dspb[i] = dspbVal;

    // Step 9: Fiscal gap.
    const fg = ((primaryBalPct[i]! - dspbVal) / 100) * ngdp;
    fiscalGap[i] = fg;

    // Step 10: Fiscal rule value, applied to NEXT year's expenditure.
    if (fiscalRule === 'No') {
      fiscalRuleValue[i] = 0.0;
    } else {
      const rising = debtToGdp[i]! > debtToGdp[i - 1]!;
      const aboveTarget = debtToGdp[i]! > debtTarget;
      fiscalRuleValue[i] =
        (rising && aboveTarget) || (!rising && !aboveTarget) ? fg : 0.0;
    }
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
    fiscal_gap: fiscalGap[i] === null ? null : nanToNull(fiscalGap[i] as number),
  }));
}
