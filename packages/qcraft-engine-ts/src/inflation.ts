/**
 * Inflation module — GDP deflator growth with logistic convergence.
 *
 * Historical values are derived from the macrofiscal deflator index; projection years
 * converge logistically toward a user-specified long-run inflation target.
 */

import type { DeflatorInputRow, InflationRow } from './types.js';
import { YEAR_END, YEAR_START } from './constants.js';
import { logisticGrowth } from './internal.js';

export const LOGISTIC_RATE = 0.5;
export const LOGISTIC_TURNING_POINT = 5;

export interface InflationOptions {
  /** Starting inflation rate (%) for logistic convergence. */
  inflationStart?: number;
  /** Long-run inflation target (%). */
  inflationEnd?: number;
}

/**
 * Compute inflation (GDP deflator growth) for a single country.
 *
 * @param macrofiscalDeflator Rows of (iso3c, country, years, gdp_deflator), where the
 *   deflator is an index (e.g. 2015 = 100), not a growth rate.
 * @returns 91 rows (2009–2099).
 */
export function inflationCountry(
  macrofiscalDeflator: readonly DeflatorInputRow[],
  iso3c: string,
  options: InflationOptions = {},
): InflationRow[] {
  const { inflationStart = 3.5, inflationEnd = 3.5 } = options;

  const country = macrofiscalDeflator
    .filter((r) => r.iso3c === iso3c)
    .sort((a, b) => a.years - b.years);
  if (country.length === 0) {
    throw new Error(`No data found for iso3c='${iso3c}' in macrofiscal_deflator`);
  }
  const countryName = country[0]!.country;

  const deflator = new Map<number, number>();
  for (const row of country) deflator.set(row.years, row.gdp_deflator);

  // Last year for which macrofiscal-derived inflation is available.
  const weoMaxYear = Math.max(...deflator.keys());

  const rows: InflationRow[] = [];
  for (let year = YEAR_START; year <= YEAR_END; year += 1) {
    const current = deflator.get(year);
    const prior = deflator.get(year - 1);
    const inflation =
      year <= weoMaxYear && current !== undefined && prior !== undefined
        ? (current / prior) * 100 - 100
        : logisticGrowth(
            year - weoMaxYear,
            inflationStart,
            inflationEnd,
            LOGISTIC_RATE,
            LOGISTIC_TURNING_POINT,
          );
    rows.push({ iso3c, country: countryName, years: year, inflation });
  }
  return rows;
}
