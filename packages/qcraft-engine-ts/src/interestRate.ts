/**
 * Interest rate projection module.
 *
 * Projects the nominal interest rate on government debt under three user-selectable
 * approaches, then derives the real interest rate and the interest-growth differential.
 * Not recursive: all inputs are fully determined by baselineV1.
 */

import type {
  BaselineV1Row,
  InterestRateMode,
  InterestRateRow,
  MacroFiscalRow,
} from './types.js';
import { YEAR_END, YEAR_START } from './constants.js';
import { mustGet } from './internal.js';

export interface InterestRateOptions {
  /** Projection approach. */
  selectRate?: InterestRateMode;
  /** Long-run real rate assumption (%), used only in "Real interest rate" mode. */
  longRunInterestRate?: number;
}

/**
 * Compute interest rate projections for a single country.
 *
 * @param dfBaselineV1 Output of `baselineV1`.
 * @param macrofiscal Historical macrofiscal rows carrying `interest_rate_percent`.
 * @returns 91 rows (2009–2099).
 */
export function interestRateCountry(
  dfBaselineV1: readonly BaselineV1Row[],
  macrofiscal: readonly MacroFiscalRow[],
  iso3c: string,
  options: InterestRateOptions = {},
): InterestRateRow[] {
  const { selectRate = 'Nominal interest rate', longRunInterestRate = 1.0 } = options;

  const countryFiltered = dfBaselineV1.filter((r) => r.iso3c === iso3c);
  if (countryFiltered.length === 0) {
    throw new Error(`No data found for iso3c='${iso3c}' in df_baseline_v1`);
  }
  const countryName = countryFiltered[0]!.country;

  const macroCountry = macrofiscal
    .filter((r) => r.iso3c === iso3c)
    .sort((a, b) => a.years - b.years);
  if (macroCountry.length === 0) {
    throw new Error(`No data found for iso3c='${iso3c}' in macrofiscal`);
  }
  const weoMaxYear = Math.max(...macroCountry.map((r) => r.years));

  const histRate = new Map<number, number>();
  for (const row of macroCountry) histRate.set(row.years, row.interest_rate_percent);

  // Anchor value from the last macrofiscal year.
  const baseNominalRate = mustGet(histRate, weoMaxYear, 'interest_rate_percent');

  const gdpGrowthLookup = new Map<number, number>();
  const inflationLookup = new Map<number, number>();
  for (const row of countryFiltered) {
    if (row.years >= YEAR_START && row.years <= YEAR_END) {
      gdpGrowthLookup.set(row.years, row.nominal_gdp_growth_percent);
      inflationLookup.set(row.years, row.gdp_deflator_growth_percent);
    }
  }

  // Base interest-growth differential at the anchor year (used by IGD mode).
  const anchorGdpGrowth = mustGet(gdpGrowthLookup, weoMaxYear, 'nominal GDP growth');
  const baseIgd =
    ((baseNominalRate / 100 - anchorGdpGrowth / 100) / (1 + anchorGdpGrowth / 100)) * 100;

  const rows: InterestRateRow[] = [];
  for (let year = YEAR_START; year <= YEAR_END; year += 1) {
    const inflation = mustGet(inflationLookup, year, 'inflation');
    const gdpGrowth = mustGet(gdpGrowthLookup, year, 'nominal GDP growth');

    let nominalRate: number;
    if (year <= weoMaxYear) {
      nominalRate = mustGet(histRate, year, 'interest_rate_percent');
    } else if (selectRate === 'Nominal interest rate') {
      nominalRate = baseNominalRate;
    } else if (selectRate === 'Interest-growth differential') {
      // Uses the previous year's GDP growth (t-1 lag).
      const prevGdpGrowth = mustGet(gdpGrowthLookup, year - 1, 'nominal GDP growth');
      nominalRate = (1 + prevGdpGrowth / 100) * (1 + baseIgd / 100) * 100 - 100;
    } else if (selectRate === 'Real interest rate') {
      // Uses the previous year's inflation (t-1 lag).
      const prevInflation = mustGet(inflationLookup, year - 1, 'inflation');
      nominalRate =
        (1 + longRunInterestRate / 100) * (1 + prevInflation / 100) * 100 - 100;
    } else {
      throw new Error(`Unknown select_rate: ${String(selectRate)}`);
    }

    rows.push({
      iso3c,
      country: countryName,
      years: year,
      nominal_interest_rate: nominalRate,
      inflation,
      nominal_gdp_growth_percent: gdpGrowth,
      // Fisher equation.
      real_interest_rate:
        ((nominalRate / 100 - inflation / 100) / (1 + inflation / 100)) * 100,
      interest_growth_differential:
        ((nominalRate / 100 - gdpGrowth / 100) / (1 + gdpGrowth / 100)) * 100,
    });
  }
  return rows;
}
