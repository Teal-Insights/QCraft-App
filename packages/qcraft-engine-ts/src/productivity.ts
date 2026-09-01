/**
 * Productivity module — labour productivity growth with logistic convergence.
 *
 * Computes a long-run trajectory of labour productivity growth (GDP per employed
 * person) from 2009 to 2099. Historical growth comes from WDI data, WEO-period years
 * use `productivityStart` as a placeholder (overwritten by baselineV1), and projection
 * years use a logistic convergence function.
 *
 * Also computes the cumulative productivity level and productivity relative to OECD.
 */

import type { ProductivityInputRow, ProductivityRow } from './types.js';
import { YEAR_END, YEAR_START } from './constants.js';
import { logisticGrowth } from './internal.js';

export const LOGISTIC_RATE = 0.5;
export const LOGISTIC_TURNING_POINT = 15;
export const OECD_ISO3C = 'OED';

export interface ProductivityOptions {
  /** Starting growth rate (%) for logistic convergence. */
  productivityStart?: number;
  /** Long-run convergence target growth rate (%). */
  productivityEnd?: number;
  /** Last year of WEO/macrofiscal data (typically 2029). */
  weoMaxYear?: number;
  /** Annual OECD productivity growth rate (%) used to project the OECD level. */
  oecdGrowthRate?: number;
}

/**
 * Compute productivity outputs for a single country.
 *
 * @param productivityData WDI levels for the target country, plus optionally the OECD
 *   aggregate under `iso3c = "OED"` for the relative-level column.
 * @returns 91 rows (2009–2099).
 */
export function productivityCountry(
  productivityData: readonly ProductivityInputRow[],
  iso3c: string,
  options: ProductivityOptions = {},
): ProductivityRow[] {
  const {
    productivityStart = 5.0,
    productivityEnd = 1.2,
    weoMaxYear = 2029,
    oecdGrowthRate = 1.1,
  } = options;

  // --- Extract country historical data ---
  const countryData = productivityData
    .filter((r) => r.iso3c === iso3c)
    .sort((a, b) => a.years - b.years);
  if (countryData.length === 0) {
    throw new Error(`No data found for iso3c='${iso3c}' in productivity_data`);
  }
  const lastWdiYear = Math.max(...countryData.map((r) => r.years));

  // Historical levels lookup (includes pre-2009 years, needed for the 2009 growth rate).
  const histLevels = new Map<number, number>();
  for (const row of countryData) histLevels.set(row.years, row.productivity_level);

  const years: number[] = [];
  for (let y = YEAR_START; y <= YEAR_END; y += 1) years.push(y);

  const growthList: number[] = [];
  const levelList: number[] = [];

  for (const year of years) {
    const histLevel = histLevels.get(year);
    if (year <= lastWdiYear && histLevel !== undefined) {
      // Historical: growth from consecutive levels.
      const prior = histLevels.get(year - 1);
      growthList.push(prior === undefined ? 0.0 : (histLevel / prior) * 100 - 100);
      levelList.push(histLevel);
    } else if (year <= weoMaxYear) {
      // WEO placeholder: baselineV1 back-calculates the real value later.
      const prevLevel = levelList.at(-1) ?? histLevels.get(lastWdiYear)!;
      growthList.push(productivityStart);
      levelList.push(prevLevel * (1 + productivityStart / 100));
    } else {
      // Projection: logistic convergence.
      const growth = logisticGrowth(
        year - weoMaxYear,
        productivityStart,
        productivityEnd,
        LOGISTIC_RATE,
        LOGISTIC_TURNING_POINT,
      );
      growthList.push(growth);
      levelList.push(levelList.at(-1)! * (1 + growth / 100));
    }
  }

  // --- OECD relative level ---
  const oecdHist = new Map<number, number>();
  for (const row of productivityData
    .filter((r) => r.iso3c === OECD_ISO3C)
    .sort((a, b) => a.years - b.years)) {
    oecdHist.set(row.years, row.productivity_level);
  }

  const oecdLevels: number[] = [];
  for (const year of years) {
    const known = oecdHist.get(year);
    if (known !== undefined) oecdLevels.push(known);
    else if (oecdLevels.length > 0) {
      oecdLevels.push(oecdLevels.at(-1)! * (1 + oecdGrowthRate / 100));
    } else oecdLevels.push(1.0); // fallback when no OECD data at all
  }

  return years.map((year, i) => {
    const oecd = oecdLevels[i]!;
    return {
      years: year,
      productivity_growth_rate_percent: growthList[i]!,
      productivity_level: levelList[i]!,
      productivity_level_oecd_percent: oecd > 0 ? (levelList[i]! / oecd) * 100 : 0.0,
    };
  });
}
