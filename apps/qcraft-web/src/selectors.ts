/**
 * Shaping helpers between `EngineResult` and the chart components.
 *
 * These are the only place that knows both the engine's field names and the
 * chart's `ChartSeries` shape, so a rename on either side lands in one file.
 */

import type { ChartSeries } from './components/LineChart';
import { series as palette } from './theme';
import {
  WARMING_ORDER,
  type EngineResult,
  type FiscalYear,
  type ScenarioKey,
  type ScenarioSeries,
} from './engine/adapter';

/** The year the Shiny app's summary cards read from. */
export const CARD_YEAR = 2050;

export type FiscalMetric = keyof Omit<FiscalYear, 'year'>;

/**
 * Colour for a scenario. Baseline gets brand navy; the six climate scenarios
 * index the warming ramp by their position in WARMING_ORDER, so the colour
 * always encodes warming severity rather than array order.
 */
export function scenarioColor(key: ScenarioKey): string {
  if (key === 'Baseline') return palette.baseline;
  const rank = WARMING_ORDER.indexOf(key);
  return palette.warming[rank] ?? palette.baseline;
}

export function findScenario(
  result: EngineResult,
  key: ScenarioKey,
): ScenarioSeries | undefined {
  return result.scenarios.find((s) => s.key === key);
}

export function valueAt(
  scenario: ScenarioSeries | undefined,
  year: number,
  metric: FiscalMetric,
): number | undefined {
  return scenario?.fiscal.find((f) => f.year === year)?.[metric];
}

/** Every scenario as a chart series for one fiscal metric. */
export function fiscalSeries(
  result: EngineResult,
  metric: FiscalMetric,
  options: { directLabelKeys?: ScenarioKey[] } = {},
): ChartSeries[] {
  const directLabels = new Set<ScenarioKey>(options.directLabelKeys ?? []);
  return result.scenarios.map((s) => ({
    key: s.key,
    label: s.label,
    color: scenarioColor(s.key),
    emphasis: s.key === 'Baseline',
    directLabel: directLabels.has(s.key),
    points: s.fiscal.map((f) => ({ year: f.year, value: f[metric] })),
  }));
}

/** Every scenario's real GDP path. */
export function gdpSeries(
  result: EngineResult,
  options: { directLabelKeys?: ScenarioKey[] } = {},
): ChartSeries[] {
  const directLabels = new Set<ScenarioKey>(options.directLabelKeys ?? []);
  return result.scenarios.map((s) => ({
    key: s.key,
    label: s.label,
    color: scenarioColor(s.key),
    emphasis: s.key === 'Baseline',
    directLabel: directLabels.has(s.key),
    points: s.gdp.map((g) => ({ year: g.year, value: g.real_gdp })),
  }));
}

/**
 * GDP rebased so every scenario reads 100 in `baseYear`, matching the Shiny
 * app's "GDP Index (2029 = 100)" chart. All scenarios are divided by the
 * BASELINE's base-year GDP — which is what the Shiny app does — so the index
 * shows divergence from the baseline path, not each scenario's own growth.
 */
export function gdpIndexSeries(
  result: EngineResult,
  baseYear: number,
  options: { directLabelKeys?: ScenarioKey[] } = {},
): ChartSeries[] {
  const baseline = findScenario(result, 'Baseline');
  const baseValue = baseline?.gdp.find((g) => g.year === baseYear)?.real_gdp;
  if (!baseValue) return [];
  return gdpSeries(result, options).map((s) => ({
    ...s,
    points: s.points.map((p) => ({ year: p.year, value: (p.value / baseValue) * 100 })),
  }));
}

/**
 * The Analysis tab's headline number: the gap in debt-to-GDP between the best
 * and worst climate outcome in a given year. This spread is the climate-fiscal
 * risk, so the chart title states it rather than naming the variable.
 */
export function scenarioSpread(result: EngineResult, year: number) {
  const values = result.scenarios
    .filter((s) => s.key !== 'Baseline')
    .map((s) => ({ key: s.key, label: s.label, value: valueAt(s, year, 'debt_to_gdp') }))
    .filter((v): v is { key: ScenarioKey; label: string; value: number } => v.value != null);

  if (!values.length) return undefined;

  const sorted = [...values].sort((a, b) => a.value - b.value);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  return { best, worst, spread: worst.value - best.value, year };
}

export const fmtPct = (v: number) => `${v.toFixed(1)}%`;
export const fmtIndex = (v: number) => v.toFixed(0);

/** Real GDP is in LCU billions and spans four orders of magnitude by 2099. */
export const fmtGdp = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0);
