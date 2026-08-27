/**
 * Demography module — population projections from UN WPP data.
 *
 * Extracts working-age (15-64) and total population for a country and demographic
 * variant, then computes year-over-year growth rates. Pure data lookup — no
 * logistic convergence or projection formulas.
 */

import type { DemographyInputRow, DemographyRow } from './types.js';
import { YEAR_START } from './constants.js';

/**
 * Compute demography outputs for a single country and variant.
 *
 * @param demographyData Long-format rows (iso3c, country, years, age_group, status, values).
 *   `age_group` must include "15-64" and "Total"; `values` are population in thousands.
 * @param iso3c 3-letter ISO country code (e.g. "UGA").
 * @param level Demographic variant — "Medium", "High", or "Low".
 * @returns 91 rows (2009–2099). Growth rates are null for 2009.
 */
export function demographyCountry(
  demographyData: readonly DemographyInputRow[],
  iso3c: string,
  level: string,
): DemographyRow[] {
  const filtered = demographyData.filter(
    (r) =>
      r.iso3c === iso3c &&
      r.status === level &&
      r.years >= YEAR_START &&
      (r.age_group === '15-64' || r.age_group === 'Total'),
  );
  if (filtered.length === 0) {
    throw new Error(`No data found for iso3c='${iso3c}' in demography_data`);
  }

  const countryName = filtered[0]!.country;

  // Pivot age groups to columns, keyed by year.
  const workingAge = new Map<number, number>();
  const total = new Map<number, number>();
  for (const row of filtered) {
    if (row.age_group === '15-64') workingAge.set(row.years, row.values);
    else total.set(row.years, row.values);
  }

  const years = [...new Set(filtered.map((r) => r.years))].sort((a, b) => a - b);

  return years.map((year, i): DemographyRow => {
    const wap = workingAge.get(year);
    const pop = total.get(year);
    if (wap === undefined || pop === undefined) {
      throw new Error(`Missing 15-64/Total population for iso3c='${iso3c}' year ${year}`);
    }
    // Growth is a shift over the *filtered* frame, so the first output year is null.
    const prevYear = years[i - 1];
    const prevWap = prevYear === undefined ? undefined : workingAge.get(prevYear);
    const prevPop = prevYear === undefined ? undefined : total.get(prevYear);

    return {
      years: year,
      working_age_population: wap,
      total_population: pop,
      demography_growth_working_age:
        prevWap === undefined ? null : (wap / prevWap) * 100 - 100,
      demography_growth_total: prevPop === undefined ? null : (pop / prevPop) * 100 - 100,
      iso3c,
      country: countryName,
    };
  });
}
