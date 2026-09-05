/**
 * Row shapes for the Q-CRAFT engine.
 *
 * Field names are deliberately identical to the Python/Polars column names in
 * `packages/qcraft-engine/tests/golden_masters/`, so a golden-master CSV row and
 * an engine row are the same object shape. Do not rename them.
 */

/** A nullable numeric cell. `null` mirrors a Polars null (and a blank CSV cell). */
export type Num = number | null;

// ── Raw inputs (what the exporter emits / the parquet holds) ──────────────────

/** Long-format UN WPP row: one (country, variant, age group, year) observation. */
export interface DemographyInputRow {
  iso3c: string;
  country: string;
  years: number;
  /** "15-64" (working age) or "Total"; other groups are ignored. */
  age_group: string;
  /** Demographic variant: "Medium" | "High" | "Low". */
  status: string;
  /** Population in thousands. */
  values: number;
}

/** WDI labour-productivity levels (GDP per employed person). `iso3c = "OED"` is the OECD aggregate. */
export interface ProductivityInputRow {
  iso3c: string;
  years: number;
  productivity_level: number;
}

/** GDP deflator index (e.g. 2015 = 100) used to derive historical inflation. */
export interface DeflatorInputRow {
  iso3c: string;
  country: string;
  years: number;
  gdp_deflator: number;
}

/** WEO-period macro inputs consumed by `baselineV1`. */
export interface MacroBaselineRow {
  iso3c: string;
  country: string;
  years: number;
  real_gdp: number;
  nominal_gdp: number;
  real_gdp_growth_percent: number;
  nominal_gdp_growth_percent: number;
  gdp_deflator_growth_percent: number;
}

/** WEO-period fiscal inputs consumed by `interestRateCountry` and `baselineCountry`. */
export interface MacroFiscalRow {
  iso3c: string;
  country: string;
  years: number;
  revenue: number;
  revenue_percent_gdp: number;
  primary_expenditure: number;
  primary_expenditure_percent_gdp: number;
  primary_balance: number;
  primary_balance_percent_gdp: number;
  interest_expenditure: number;
  interest_expenditure_percent_gdp: number;
  total_expenditure: number;
  overall_balance: number;
  overall_balance_percent_gdp: number;
  debt_to_gdp: number;
  debt: number;
  nominal_gdp: number;
  interest_rate_percent: number;
}

/** FADCP cumulative GDP loss (% of baseline GDP) per scenario. */
export interface ClimateInputRow {
  iso3c: string;
  climate_scenario: string;
  years: number;
  gdp_loss_percent: number;
}

/** Year-over-year labour-productivity growth shock (pp), zero through WEO_MAX_YEAR. */
export interface ClimateVariationRow {
  years: number;
  climate_variation: number;
}

/** Optional discrete revenue/expenditure shocks, in % of GDP. */
export interface RiskRow {
  years: number;
  revenue_risk: number;
  expenditure_risk: number;
}

// ── Module outputs ───────────────────────────────────────────────────────────

export interface DemographyRow {
  years: number;
  working_age_population: number;
  total_population: number;
  /** null in the first year (2009): no prior year to grow from. */
  demography_growth_working_age: Num;
  demography_growth_total: Num;
  iso3c: string;
  country: string;
}

export interface ProductivityRow {
  years: number;
  productivity_growth_rate_percent: number;
  productivity_level: number;
  productivity_level_oecd_percent: number;
}

export interface InflationRow {
  iso3c: string;
  country: string;
  years: number;
  inflation: number;
}

export interface BaselineV1Row {
  iso3c: string;
  country: string;
  years: number;
  working_age_population: number;
  employment_growth: number;
  labour_productivity_growth: number;
  gdp_deflator_growth_percent: number;
  real_gdp: number;
  real_gdp_growth_percent: number;
  nominal_gdp: number;
  nominal_gdp_growth_percent: number;
  population_growth: number;
}

export interface InterestRateRow {
  iso3c: string;
  country: string;
  years: number;
  nominal_interest_rate: number;
  inflation: number;
  nominal_gdp_growth_percent: number;
  real_interest_rate: number;
  interest_growth_differential: number;
}

export interface FiscalRow {
  years: number;
  revenue: number;
  revenue_percent_gdp: number;
  primary_expenditure: number;
  primary_expenditure_percent_gdp: number;
  primary_balance: number;
  primary_balance_percent_gdp: number;
  interest_expenditure: number;
  interest_expenditure_percent_gdp: number;
  total_expenditure: number;
  overall_balance: number;
  overall_balance_percent_gdp: number;
  debt_to_gdp: number;
  debt: number;
  /** null in 2009 (needs t-1 debt). */
  debt_stabilizing_primary_balance: Num;
  /** null before WEO_MAX_YEAR - 3, and wherever the computation is NaN. */
  fiscal_gap: Num;
}

export interface ClimateRow {
  years: number;
  revenue: number;
  revenue_percent_gdp: number;
  primary_expenditure: number;
  primary_expenditure_percent_gdp: number;
  primary_balance: number;
  primary_balance_percent_gdp: number;
  interest_expenditure: number;
  interest_expenditure_percent_gdp: number;
  total_expenditure: number;
  overall_balance: number;
  overall_balance_percent_gdp: number;
  debt_to_gdp: number;
  debt: number;
  debt_stabilizing_primary_balance: Num;
  labour_productivity_growth: number;
  real_gdp_growth_percent: number;
  nominal_gdp_growth_percent: number;
  nominal_gdp: number;
  real_gdp: number;
  employment_growth: number;
}

// ── Pipeline ─────────────────────────────────────────────────────────────────

export type InterestRateMode =
  | 'Nominal interest rate'
  | 'Interest-growth differential'
  | 'Real interest rate';

export type FiscalRuleSetting = 'Yes' | 'No';

/**
 * One raw macrofiscal row as stored in `macrofiscal.parquet`. Cells are nullable
 * because the WEO source is sparse; `buildMacro*` in `pipeline.ts` filters and
 * forward-fills exactly the way `data_loader.py` does.
 */
export interface MacroRawRow {
  iso3c: string;
  country: string;
  years: number;
  real_gdp: Num;
  nominal_gdp: Num;
  gdp_deflator: Num;
  revenue: Num;
  expenditure: Num;
  overall_balance: Num;
  primary_balance: Num;
  debt: Num;
  real_gdp_growth_percent: Num;
  nominal_gdp_growth_percent: Num;
  gdp_deflator_growth_percent: Num;
  primary_expenditure: Num;
  interest_expenditure: Num;
  total_expenditure: Num;
  revenue_percent_gdp: Num;
  primary_expenditure_percent_gdp: Num;
  primary_balance_percent_gdp: Num;
  overall_balance_percent_gdp: Num;
  interest_expenditure_percent_gdp: Num;
  debt_to_gdp: Num;
  interest_rate_percent: Num;
}

/**
 * Everything the engine needs for one country, as emitted by
 * `scripts/export_country_json.py`. Slices are raw: the engine derives the
 * module-specific inputs itself.
 */
/** Explicit input and timing identity for the rolling Current profile. */
export interface HorizonPolicy {
  id: 'current-full-weo-v1' | 'verified-workbook-v1';
  dataRevision: string;
  sourceVintage: string;
  sourceWeoMaxYear: number;
  weoMaxYear: number | null;
  projectionStartYear: number | null;
  climateStartYear: number | null;
  climateAnchorYear: number | null;
  wdiLastYear: number | null;
  coverageStatus: 'full' | 'shorter' | 'unsupported';
  coverageReason: string | null;
  /** SHA-256 of canonical raw country payload, excluding this policy object. */
  inputSha256: string;
}

export interface CountryInput {
  horizonPolicy?: HorizonPolicy;
  iso3c: string;
  country: string;
  /** UN WPP long format, all variants. */
  demography: DemographyInputRow[];
  /** WDI levels for this country plus the OECD aggregate (`iso3c = "OED"`). */
  productivity: ProductivityInputRow[];
  /** Raw WEO macrofiscal rows for this country. */
  macrofiscal: MacroRawRow[];
  /** FADCP GDP-loss rows for all six scenarios. */
  climate: ClimateInputRow[];
}

export interface PipelineParams {
  demography_variant: string;
  productivity_start: number;
  productivity_end: number;
  inflation_start: number;
  inflation_end: number;
  interest_rate_mode: InterestRateMode;
  /** Dashboard!C29: long-run real rate (%), used only under "Real interest rate". */
  long_run_interest_rate: number;
  /**
   * Productivity!J21: the logistic Turning Point timing parameter, in years
   * after the WEO boundary. Higher values shift the transition later. The guide
   * says it can be adjusted (footnote 7); the Rate (0.5) cannot.
   */
  productivity_turning_point: number;
  debt_target: number;
  fiscal_rule: FiscalRuleSetting;
  expenditure_rigidity: number;
}

export interface PipelineResult {
  horizonPolicy?: HorizonPolicy;
  demography: DemographyRow[];
  productivity: ProductivityRow[];
  inflation: InflationRow[];
  baseline_v1: BaselineV1Row[];
  interest_rate: InterestRateRow[];
  fiscal: FiscalRow[];
  /** One entry per name in `CLIMATE_SCENARIOS`. */
  climate: Record<string, ClimateRow[]>;
}
