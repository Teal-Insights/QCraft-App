/**
 * Adapter for the columnar per-country JSON that the Lane 3 data pipeline emits at
 * `data/vintages/<vintage>/json/<ISO3>.json`.
 *
 * Two producers exist for per-country input and their shapes differ:
 *
 * - `scripts/export_country_json.py` (this lane) emits ROW-oriented slices — arrays of
 *   objects that are already `CountryInput`.
 * - The Lane 3 pipeline emits COLUMNAR slices — `{ years: [...], real_gdp: [...] }`, with
 *   demography nested under `variants` and climate under `scenarios`.
 *
 * The top-level keys are identical (`iso3c`, `country`, `macrofiscal`, `demography`,
 * `productivity`, `climate`), so the two are easy to mix up. This adapter converts the
 * columnar form so either producer can feed `runPipeline`.
 */

import type {
  ClimateInputRow,
  CountryInput,
  DemographyInputRow,
  MacroRawRow,
  Num,
  ProductivityInputRow,
} from './types.js';
import { OECD_ISO3C } from './productivity.js';

/** The columnar shape emitted by the Lane 3 vintage pipeline. */
export interface ColumnarCountryInput {
  iso3c: string;
  country: string;
  /** Vintage id, e.g. "weo-2026-04". Present in the Lane 3 output, unused by the engine. */
  vintage?: string;
  macrofiscal: { years: number[] } & Record<string, (number | null)[]>;
  demography: {
    years: number[];
    /** variant -> age group -> series, e.g. `variants.Medium['15-64']`. */
    variants: Record<string, Record<string, (number | null)[]>>;
  };
  productivity: { years: number[]; productivity_level: (number | null)[] };
  climate: {
    years: number[];
    /** scenario -> cumulative GDP loss (% of baseline). */
    scenarios: Record<string, (number | null)[]>;
  };
}

export interface AdapterOptions {
  /**
   * OECD (`iso3c = "OED"`) productivity levels. The columnar format carries only the
   * target country's series, but `productivityCountry` needs the OECD aggregate for
   * `productivity_level_oecd_percent`.
   */
  oecdProductivity?: readonly ProductivityInputRow[];
  /**
   * Proceed without the OECD series. `productivity_level_oecd_percent` then falls back to
   * an OECD level of 1.0 and is meaningless — do not chart it. Nothing else is affected:
   * no other module reads that column.
   */
  allowMissingOecd?: boolean;
}

const MACRO_COLUMNS = [
  'real_gdp', 'nominal_gdp', 'gdp_deflator', 'revenue', 'expenditure', 'overall_balance',
  'primary_balance', 'debt', 'real_gdp_growth_percent', 'nominal_gdp_growth_percent',
  'gdp_deflator_growth_percent', 'primary_expenditure', 'interest_expenditure',
  'total_expenditure', 'revenue_percent_gdp', 'primary_expenditure_percent_gdp',
  'primary_balance_percent_gdp', 'overall_balance_percent_gdp',
  'interest_expenditure_percent_gdp', 'debt_to_gdp', 'interest_rate_percent',
] as const;

/** Age groups the demography module reads; anything else in the file is ignored. */
const AGE_GROUPS = ['15-64', 'Total'] as const;

function at(series: readonly (number | null)[] | undefined, i: number): Num {
  const value = series?.[i];
  return value === undefined ? null : value;
}

/**
 * Convert Lane 3's columnar per-country JSON into the row-oriented `CountryInput` the
 * engine consumes.
 *
 * @throws if the OECD productivity series is neither supplied nor explicitly waived.
 */
export function fromColumnarCountryInput(
  source: ColumnarCountryInput,
  options: AdapterOptions = {},
): CountryInput {
  const { iso3c, country } = source;
  const { oecdProductivity, allowMissingOecd = false } = options;

  if (!oecdProductivity && !allowMissingOecd) {
    throw new Error(
      'Columnar input carries no OECD productivity series, which ' +
        'productivity_level_oecd_percent needs. Pass options.oecdProductivity, or set ' +
        'allowMissingOecd:true to accept a meaningless value in that one column.',
    );
  }

  const macrofiscal: MacroRawRow[] = source.macrofiscal.years.map((year, i) => {
    const row: Record<string, unknown> = { iso3c, country, years: year };
    for (const column of MACRO_COLUMNS) row[column] = at(source.macrofiscal[column], i);
    return row as unknown as MacroRawRow;
  });

  const demography: DemographyInputRow[] = [];
  for (const [status, ageGroups] of Object.entries(source.demography.variants)) {
    for (const ageGroup of AGE_GROUPS) {
      const series = ageGroups[ageGroup];
      if (!series) continue;
      source.demography.years.forEach((year, i) => {
        const value = series[i];
        // Population is never legitimately null; skip rather than inject a zero.
        if (value === null || value === undefined) return;
        demography.push({ iso3c, country, years: year, age_group: ageGroup, status, values: value });
      });
    }
  }

  const productivity: ProductivityInputRow[] = [];
  source.productivity.years.forEach((year, i) => {
    const value = source.productivity.productivity_level[i];
    if (value === null || value === undefined) return;
    productivity.push({ iso3c, years: year, productivity_level: value });
  });
  if (oecdProductivity) {
    for (const row of oecdProductivity) {
      productivity.push({ ...row, iso3c: OECD_ISO3C });
    }
  }

  const climate: ClimateInputRow[] = [];
  for (const [scenario, series] of Object.entries(source.climate.scenarios)) {
    source.climate.years.forEach((year, i) => {
      const value = series[i];
      if (value === null || value === undefined) return;
      climate.push({ iso3c, climate_scenario: scenario, years: year, gdp_loss_percent: value });
    });
  }

  return { iso3c, country, demography, productivity, macrofiscal, climate };
}

/** True when `input` carries the OECD series `productivity_level_oecd_percent` needs. */
export function hasOecdSeries(input: CountryInput): boolean {
  return input.productivity.some((r) => r.iso3c === OECD_ISO3C);
}
