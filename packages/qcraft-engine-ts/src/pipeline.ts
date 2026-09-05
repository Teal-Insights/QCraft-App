/**
 * Pipeline orchestration — the TypeScript counterpart of `qcraft_engine.data_loader`.
 *
 * The `build*` helpers reproduce the Polars input-shaping in `data_loader.py` exactly
 * (which rows get dropped, where nulls get forward-filled). They live here rather than
 * in the exporter so the JSON stays raw and the shaping rules have one home.
 */

import type {
  ClimateInputRow,
  ClimateVariationRow,
  CountryInput,
  DeflatorInputRow,
  MacroBaselineRow,
  MacroFiscalRow,
  MacroRawRow,
  PipelineParams,
  PipelineResult,
} from './types.js';
import { CLIMATE_SCENARIOS, DEFAULTS, PROJ_START, YEAR_END, YEAR_START } from './constants.js';
import { demographyCountry } from './demography.js';
import { productivityCountry } from './productivity.js';
import { inflationCountry } from './inflation.js';
import { baselineV1 } from './baselineV1.js';
import { interestRateCountry } from './interestRate.js';
import { baselineCountry } from './fiscal.js';
import { calcClimateScenario } from './climate.js';
import { resolveHorizon } from './horizon.js';

function byYear(a: { years: number }, b: { years: number }): number {
  return a.years - b.years;
}

/** Deflator input for `inflationCountry`: the deflator INDEX, not a growth rate. */
export function buildMacroDeflator(
  macrofiscal: readonly MacroRawRow[],
  iso3c: string,
): DeflatorInputRow[] {
  return macrofiscal
    .filter((r) => r.iso3c === iso3c && r.gdp_deflator !== null)
    .sort(byYear)
    .map((r) => ({
      iso3c: r.iso3c,
      country: r.country,
      years: r.years,
      gdp_deflator: r.gdp_deflator!,
    }));
}

/** Macro input for `baselineV1`. Drops rows with any null growth rate (the first year has no prior). */
export function buildMacroForBaseline(
  macrofiscal: readonly MacroRawRow[],
  iso3c: string,
): MacroBaselineRow[] {
  return macrofiscal
    .filter(
      (r) =>
        r.iso3c === iso3c &&
        r.real_gdp_growth_percent !== null &&
        r.nominal_gdp_growth_percent !== null &&
        r.gdp_deflator_growth_percent !== null,
    )
    .sort(byYear)
    .map((r) => ({
      iso3c: r.iso3c,
      country: r.country,
      years: r.years,
      real_gdp: r.real_gdp!,
      nominal_gdp: r.nominal_gdp!,
      real_gdp_growth_percent: r.real_gdp_growth_percent!,
      nominal_gdp_growth_percent: r.nominal_gdp_growth_percent!,
      gdp_deflator_growth_percent: r.gdp_deflator_growth_percent!,
    }));
}

/**
 * Macro input for `interestRateCountry` and `baselineCountry`.
 *
 * Drops rows with null `nominal_gdp`/`revenue` (truly missing data) but forward-fills
 * null `interest_rate_percent` so the year sequence stays contiguous.
 */
export function buildMacroForFiscal(
  macrofiscal: readonly MacroRawRow[],
  iso3c: string,
): MacroFiscalRow[] {
  const rows = macrofiscal
    .filter((r) => r.iso3c === iso3c && r.nominal_gdp !== null && r.revenue !== null)
    .sort(byYear);

  let carried: number | null = null;
  return rows.map((r) => {
    if (r.interest_rate_percent !== null) carried = r.interest_rate_percent;
    const rate = r.interest_rate_percent ?? carried ?? 0.0;
    return {
      iso3c: r.iso3c,
      country: r.country,
      years: r.years,
      revenue: r.revenue!,
      revenue_percent_gdp: r.revenue_percent_gdp!,
      primary_expenditure: r.primary_expenditure!,
      primary_expenditure_percent_gdp: r.primary_expenditure_percent_gdp!,
      primary_balance: r.primary_balance!,
      primary_balance_percent_gdp: r.primary_balance_percent_gdp!,
      interest_expenditure: r.interest_expenditure!,
      interest_expenditure_percent_gdp: r.interest_expenditure_percent_gdp!,
      total_expenditure: r.total_expenditure!,
      overall_balance: r.overall_balance!,
      overall_balance_percent_gdp: r.overall_balance_percent_gdp!,
      debt_to_gdp: r.debt_to_gdp!,
      debt: r.debt!,
      nominal_gdp: r.nominal_gdp!,
      interest_rate_percent: rate,
    };
  });
}

/**
 * Turn cumulative GDP-loss levels into the year-over-year productivity shock the
 * climate module expects.
 *
 * `gdp_index(t) = 100 + gdp_loss_percent(t)`, and
 * `climate_variation(t) = 100 * (gdp_index(t) / gdp_index(t-1) - 1)` — the year-over-year
 * PERCENT CHANGE of the GDP index, not an arithmetic first difference of index levels.
 * The shock is added to labour productivity growth, so it has to be a growth rate.
 * Variation is forced to zero through `weoMaxYear` because the climate module infers its
 * WEO boundary from the first nonzero entry.
 */
export function buildClimateVariation(
  climateData: readonly ClimateInputRow[],
  iso3c: string,
  scenario: string,
  weoMaxYear = 2029,
): ClimateVariationRow[] {
  const gdpLoss = new Map<number, number>();
  for (const row of climateData) {
    if (row.iso3c === iso3c && row.climate_scenario === scenario) {
      gdpLoss.set(row.years, row.gdp_loss_percent);
    }
  }

  const rows: ClimateVariationRow[] = [];
  let prevIndex = 100.0 + (gdpLoss.get(weoMaxYear) ?? 0.0);
  for (let year = YEAR_START; year <= YEAR_END; year += 1) {
    if (year <= weoMaxYear) {
      rows.push({ years: year, climate_variation: 0.0 });
    } else {
      const currentIndex = 100.0 + (gdpLoss.get(year) ?? 0.0);
      rows.push({ years: year, climate_variation: 100.0 * (currentIndex / prevIndex - 1.0) });
      prevIndex = currentIndex;
    }
  }
  return rows;
}

/**
 * Run the full Q-CRAFT pipeline for one country.
 *
 * @param input One country's raw slices (see `scripts/export_country_json.py`).
 * @param params Parameter overrides; anything omitted falls back to `DEFAULTS`.
 */
export function runPipeline(
  input: CountryInput,
  params: Partial<PipelineParams> = {},
): PipelineResult {
  const p: PipelineParams = { ...DEFAULTS, ...params };
  const { iso3c } = input;
  const rolling = input.horizonPolicy?.id === 'current-full-weo-v1';
  const horizon = rolling ? resolveHorizon(input) : undefined;
  if (horizon?.weoMaxYear === null) throw new Error(horizon.coverageReason ?? 'Unsupported Current inputs.');
  if (horizon) {
    for (const key of ['weoMaxYear', 'projectionStartYear', 'climateStartYear', 'climateAnchorYear', 'wdiLastYear'] as const) {
      if (input.horizonPolicy![key] !== horizon[key]) throw new Error(`Current input horizon metadata mismatch: ${key}.`);
    }
  }
  const macro = horizon ? input.macrofiscal.filter(r => r.years <= horizon.weoMaxYear!) : input.macrofiscal;
  const prodInput = horizon ? input.productivity.filter(r => r.iso3c !== iso3c || r.years <= horizon.weoMaxYear!) : input.productivity;

  // 1. Demography
  const demography = demographyCountry(input.demography, iso3c, p.demography_variant);

  // 2. Productivity
  const productivity = productivityCountry(prodInput, iso3c, {
    ...(horizon ? { weoMaxYear: horizon.weoMaxYear! } : {}),
    productivityStart: p.productivity_start,
    productivityEnd: p.productivity_end,
    turningPoint: p.productivity_turning_point,
  });

  // 3. Inflation
  const inflation = inflationCountry(buildMacroDeflator(macro, iso3c), iso3c, {
    inflationStart: p.inflation_start,
    inflationEnd: p.inflation_end,
  });

  // 4. Baseline V1
  const bv1 = baselineV1(
    demography,
    inflation,
    productivity,
    buildMacroForBaseline(macro, iso3c),
    iso3c,
    horizon?.wdiLastYear ?? undefined,
  );

  // 5. Interest rate
  const macroFull = buildMacroForFiscal(macro, iso3c);
  const interestRate = interestRateCountry(bv1, macroFull, iso3c, {
    selectRate: p.interest_rate_mode,
    longRunInterestRate: p.long_run_interest_rate,
  });

  // 6. Fiscal
  const fiscal = baselineCountry(bv1, interestRate, macroFull, iso3c, {
    debtTarget: p.debt_target,
    fiscalRule: p.fiscal_rule,
  });

  // 7. Climate scenarios
  const countryWeoMax = horizon?.weoMaxYear ?? Math.min(
    Math.max(...macroFull.map((r) => r.years)),
    PROJ_START - 1,
  );

  const climate: Record<string, ReturnType<typeof calcClimateScenario>> = {};
  for (const scenario of CLIMATE_SCENARIOS) {
    climate[scenario] = calcClimateScenario(
      fiscal,
      bv1,
      interestRate,
      buildClimateVariation(input.climate, iso3c, scenario, countryWeoMax),
      { expenditureRigidity: p.expenditure_rigidity,
        ...(horizon ? { climateStartYear: horizon.climateStartYear! } : {}) },
    );
  }

  return {
    ...(input.horizonPolicy ? { horizonPolicy: input.horizonPolicy } : {}),
    demography,
    productivity,
    inflation,
    baseline_v1: bv1,
    interest_rate: interestRate,
    fiscal,
    climate,
  };
}
