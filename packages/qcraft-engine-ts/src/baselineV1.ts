/**
 * Baseline V1 module — core GDP projection engine.
 *
 * Computes employment growth, labour productivity (with WEO overlap back-calculation),
 * and recursive real/nominal GDP projections from 2009 through 2099. This is the
 * macroeconomic foundation consumed by the fiscal module.
 */

import type {
  BaselineV1Row,
  DemographyRow,
  InflationRow,
  MacroBaselineRow,
  ProductivityRow,
} from './types.js';
import { YEAR_END, YEAR_START } from './constants.js';
import { mustGet } from './internal.js';

/**
 * Compute baseline GDP projections for a single country.
 *
 * @param dataDemography Output of `demographyCountry`.
 * @param dataInflation Output of `inflationCountry`.
 * @param dataProductivity Output of `productivityCountry`.
 * @param macrofiscal WEO-period macro data; its last year defines WEO_MAX_YEAR.
 * @returns 91 rows (2009–2099).
 */
export function baselineV1(
  dataDemography: readonly DemographyRow[],
  dataInflation: readonly InflationRow[],
  dataProductivity: readonly ProductivityRow[],
  macrofiscal: readonly MacroBaselineRow[],
  iso3c: string,
): BaselineV1Row[] {
  const macroCountry = macrofiscal
    .filter((r) => r.iso3c === iso3c)
    .sort((a, b) => a.years - b.years);
  if (macroCountry.length === 0) {
    throw new Error(`No data found for iso3c='${iso3c}' in macrofiscal`);
  }
  const weoMaxYear = Math.max(...macroCountry.map((r) => r.years));

  // Key boundaries.
  const overlapStart = weoMaxYear - 6; // productivity back-calculation starts here
  const empWapStart = weoMaxYear - 7; // employment switches to WAP growth here

  const demoForCountry = dataDemography.filter((r) => r.iso3c === iso3c);
  if (demoForCountry.length === 0) {
    throw new Error(`No data found for iso3c='${iso3c}' in data_demography`);
  }
  const countryName = demoForCountry[0]!.country;

  // Build lookups from inputs.
  const wapLookup = new Map<number, number>();
  const totalPopLookup = new Map<number, number>();
  for (const row of [...dataDemography].sort((a, b) => a.years - b.years)) {
    wapLookup.set(row.years, row.working_age_population);
    totalPopLookup.set(row.years, row.total_population);
  }

  const inflationLookup = new Map<number, number>();
  for (const row of dataInflation) {
    if (row.years >= YEAR_START && row.years <= YEAR_END) {
      inflationLookup.set(row.years, row.inflation);
    }
  }

  const prodLookup = new Map<number, number>();
  for (const row of dataProductivity) {
    if (row.years >= YEAR_START && row.years <= YEAR_END) {
      prodLookup.set(row.years, row.productivity_growth_rate_percent);
    }
  }

  const macroLookup = new Map<number, MacroBaselineRow>();
  for (const row of macroCountry) macroLookup.set(row.years, row);

  const years: number[] = [];
  for (let y = YEAR_START; y <= YEAR_END; y += 1) years.push(y);

  const wapOut: number[] = [];
  const empGrowthOut: number[] = [];
  const prodGrowthOut: number[] = [];
  const deflatorGrowthOut: number[] = [];
  const realGdpOut: number[] = [];
  const realGdpGrowthOut: number[] = [];
  const nominalGdpOut: number[] = [];
  const nominalGdpGrowthOut: number[] = [];
  const popGrowthOut: number[] = [];

  // Explicit year-by-year loop: the post-WEO block reads GDP at t-1 (domain rule #1).
  for (let i = 0; i < years.length; i += 1) {
    const year = years[i]!;
    const prevYear = year - 1;
    const wap = mustGet(wapLookup, year, 'working_age_population');
    wapOut.push(wap);

    // --- Population growth from total population ---
    const prevPop = totalPopLookup.get(prevYear);
    const curPop = totalPopLookup.get(year);
    popGrowthOut.push(
      prevPop !== undefined && curPop !== undefined ? (curPop / prevPop) * 100 - 100 : 0.0,
    );

    if (year <= weoMaxYear) {
      // === WEO period: GDP levels/growth come straight from macrofiscal ===
      const m = mustGet(macroLookup, year, 'macrofiscal');
      realGdpOut.push(m.real_gdp);
      nominalGdpOut.push(m.nominal_gdp);
      realGdpGrowthOut.push(m.real_gdp_growth_percent);
      nominalGdpGrowthOut.push(m.nominal_gdp_growth_percent);
      deflatorGrowthOut.push(m.gdp_deflator_growth_percent);

      let empGrowth: number;
      let prodGrowth: number;

      if (year >= empWapStart) {
        // Employment = WAP growth (overlap and transition years).
        const prevWap = wapLookup.get(prevYear);
        empGrowth = prevWap !== undefined ? (wap / prevWap) * 100 - 100 : 0.0;

        if (year >= overlapStart) {
          // Productivity = back-calculated residual of real GDP growth.
          const rgdpG = m.real_gdp_growth_percent;
          prodGrowth = ((rgdpG / 100 - empGrowth / 100) / (1 + empGrowth / 100)) * 100;
        } else {
          prodGrowth = mustGet(prodLookup, year, 'productivity growth');
        }
      } else {
        // Early WEO: productivity from the module, employment = residual.
        prodGrowth = mustGet(prodLookup, year, 'productivity growth');
        const rgdpG = m.real_gdp_growth_percent;
        empGrowth = ((rgdpG / 100 - prodGrowth / 100) / (1 + prodGrowth / 100)) * 100;
      }

      empGrowthOut.push(empGrowth);
      prodGrowthOut.push(prodGrowth);
    } else {
      // === Post-WEO: projection period ===
      const prevWap = wapLookup.get(prevYear);
      const empGrowth = prevWap !== undefined ? (wap / prevWap) * 100 - 100 : 0.0;
      empGrowthOut.push(empGrowth);

      const prodGrowth = mustGet(prodLookup, year, 'productivity growth');
      prodGrowthOut.push(prodGrowth);

      const deflatorG = mustGet(inflationLookup, year, 'inflation');
      deflatorGrowthOut.push(deflatorG);

      const prevRealGdp = realGdpOut[i - 1]!;
      const realGdp = prevRealGdp * (1 + empGrowth / 100) * (1 + prodGrowth / 100);
      realGdpOut.push(realGdp);

      const realGdpG = (realGdp / prevRealGdp) * 100 - 100;
      realGdpGrowthOut.push(realGdpG);

      const prevNominalGdp = nominalGdpOut[i - 1]!;
      const nominalGdp = prevNominalGdp * (1 + realGdpG / 100) * (1 + deflatorG / 100);
      nominalGdpOut.push(nominalGdp);
      nominalGdpGrowthOut.push((nominalGdp / prevNominalGdp) * 100 - 100);
    }
  }

  return years.map((year, i) => ({
    iso3c,
    country: countryName,
    years: year,
    working_age_population: wapOut[i]!,
    employment_growth: empGrowthOut[i]!,
    labour_productivity_growth: prodGrowthOut[i]!,
    gdp_deflator_growth_percent: deflatorGrowthOut[i]!,
    real_gdp: realGdpOut[i]!,
    real_gdp_growth_percent: realGdpGrowthOut[i]!,
    nominal_gdp: nominalGdpOut[i]!,
    nominal_gdp_growth_percent: nominalGdpGrowthOut[i]!,
    population_growth: popGrowthOut[i]!,
  }));
}
