/** Pure coverage check mirroring the Python rolling-profile input contract. */
import type { CountryInput } from './types.js';
import { CLIMATE_SCENARIOS, YEAR_END, YEAR_START } from './constants.js';

export const REQUIRED_MACRO = [
  'real_gdp', 'nominal_gdp', 'gdp_deflator', 'revenue', 'expenditure',
  'overall_balance', 'primary_balance', 'debt', 'real_gdp_growth_percent',
  'nominal_gdp_growth_percent', 'gdp_deflator_growth_percent', 'primary_expenditure',
  'interest_expenditure', 'total_expenditure', 'revenue_percent_gdp',
  'primary_expenditure_percent_gdp', 'primary_balance_percent_gdp',
  'overall_balance_percent_gdp', 'interest_expenditure_percent_gdp', 'debt_to_gdp',
] as const;
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function resolveHorizon(input: CountryInput) {
  const macro = new Map(input.macrofiscal.filter(r => r.iso3c === input.iso3c).map(r => [r.years, r]));
  const sourceWeoMaxYear = Math.max(0, ...[...macro.values()]
    .filter(r => REQUIRED_MACRO.some(k => finite(r[k]))).map(r => r.years));
  let horizon = YEAR_START - 1;
  let coverageReason: string | null = null;
  for (let year = YEAR_START; year <= sourceWeoMaxYear; year++) {
    const row = macro.get(year);
    const missing: string[] = REQUIRED_MACRO.filter(k => !finite(row?.[k]));
    if (!missing.length && !finite(row?.interest_rate_percent) && row?.debt !== 0) missing.push('interest_rate_percent');
    if (missing.length) {
      coverageReason = `Incomplete WEO inputs at ${year}: ${missing.join(', ')}.`;
      break;
    }
    if (row!.real_gdp! <= 0 || row!.nominal_gdp! <= 0 || row!.gdp_deflator! <= 0) {
      coverageReason = `Nonpositive GDP or deflator at ${year}.`;
      break;
    }
    horizon = year;
  }
  let unsupported = horizon < YEAR_START;
  const prod = new Map(input.productivity.filter(r => r.iso3c === input.iso3c && finite(r.productivity_level) && r.productivity_level > 0)
    .map(r => [r.years, r.productivity_level]));
  const wdiEnd = Math.min(Math.max(0, ...prod.keys()), horizon);
  if (!unsupported) for (let y = YEAR_START - 1; y <= wdiEnd; y++) {
    if (!prod.has(y)) { coverageReason = 'The WDI history needed for consecutive productivity growth is incomplete.'; unsupported = true; break; }
  }
  if (!unsupported && wdiEnd < YEAR_START - 1) {
    coverageReason = 'No usable WDI history at the start of the calculation.'; unsupported = true;
  }
  if (!unsupported) {
    const climate = new Map(input.climate.filter(r => r.iso3c === input.iso3c)
      .map(r => [`${r.climate_scenario}:${r.years}`, r.gdp_loss_percent]));
    outer: for (const scenario of CLIMATE_SCENARIOS) for (let y = horizon; y <= YEAR_END; y++) {
      const loss = climate.get(`${scenario}:${y}`);
      if (!finite(loss) || loss <= -100) {
        coverageReason = `No usable climate index for ${scenario} at calendar year ${y}.`;
        unsupported = true; break outer;
      }
    }
  }
  return {
    sourceWeoMaxYear,
    weoMaxYear: unsupported ? null : horizon,
    projectionStartYear: unsupported ? null : horizon + 1,
    climateStartYear: unsupported ? null : horizon + 1,
    climateAnchorYear: unsupported ? null : horizon,
    wdiLastYear: unsupported ? null : wdiEnd,
    coverageStatus: unsupported ? 'unsupported' as const : horizon < sourceWeoMaxYear ? 'shorter' as const : 'full' as const,
    coverageReason,
  };
}
