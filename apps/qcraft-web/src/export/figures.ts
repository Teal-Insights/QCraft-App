/**
 * The figures every artifact draws from.
 *
 * ── Why this is one list ──────────────────────────────────────────────────────
 * The packet now produces the same chart four ways: inline in the HTML report,
 * as a standalone PNG, on a page of the chart pack, and named in the workbook's
 * README sheet. Before this file the report owned its own figure list, so a
 * fifth surface would have meant a fifth copy of the same titles and the same
 * series selection, and the first time one of them drifted a reader would have
 * two charts with the same name and different messages.
 *
 * So the figure list is the source and the artifacts are renderings of it.
 *
 * ── Computed titles ───────────────────────────────────────────────────────────
 * Every title states the message and is computed from the run, never canned.
 * "Baseline debt rises to 52.2% of GDP by 2099" is a claim this run supports;
 * "Debt-to-GDP under the baseline" names an axis and leaves the reader to find
 * the point. The template is ours, the numbers are the engine's, and nothing in
 * a title is an interpretation the numbers do not carry.
 *
 * The one case that needs care is a country with no climate signal at all.
 * Eleven selectable countries carry an all-zero FADCP slice (INTEGRATION-REPORT
 * section 7.2), so their six scenarios lie exactly on the baseline. A computed
 * title would say the scenarios spread debt across 0 points of GDP, which is
 * arithmetically true and reads as a finding about the country when it is a fact
 * about the dataset. `noClimateSignal` catches that case and the titles and
 * captions say what is actually going on.
 *
 * ── Extension point, for CC-4 ─────────────────────────────────────────────────
 * `packetFigures()` returns the figures the export layer knows how to draw with
 * `renderChartSvg`. CC-4 owns the takeaway chart components and the register
 * toggle; anything it wants in the packet joins by returning a `PacketFigure`
 * from `extraFigures`, which is spread in below the built-in set and needs no
 * change here. docs/export-contract.md states the shape.
 */

import type { ChartSeries } from '../charts/types';
import type { EngineResult, ScenarioKey } from '../engine/types';
import {
  fiscalSeries,
  findScenario,
  fmtPct,
  gdpShortfallSeries,
  scenarioSpread,
  valueAt,
} from '../selectors';
import { series as palette } from '../theme';

/** Reporting years, matching the engine's own final golden master. */
export const REPORT_YEARS = [2030, 2050, 2075, 2099] as const;

export const HORIZON = 2099;
export const MID = 2050;

/**
 * Below this, a difference in debt-to-GDP is not a difference. Chosen at one
 * hundredth of a percentage point because that is the precision every table in
 * the packet prints at: a spread that rounds to 0.00 in the table must not be
 * described as a spread in a title above it.
 */
const NEGLIGIBLE_PP = 0.005;

/**
 * Which tab a figure belongs to, which is also the section it prints under.
 *
 * These are CC-4's `ChartTab` values, copied exactly from
 * `src/charts/specs.ts` on `feat/takeaway-charts`, so that folding in their
 * chart registry at merge time is a rename of the producer and nothing else.
 *
 * Note for whoever merges: `docs/CC4-CHART-SEAM.md` section 4 tabulates the
 * cover tab as "Cover" and the code calls it `Overview`. The code is what
 * `exportFigures` actually returns, so `Overview` is what this file matches.
 *
 * `Overview` is a single figure standing for the whole run, and sorts first.
 * Any value outside this list still reaches the reader: see `groupFigures`,
 * which is written so a figure cannot be dropped for carrying a tab this build
 * has not heard of.
 */
export const FIGURE_TABS = ['Overview', 'Baseline', 'Analysis', 'Climate'] as const;
export type FigureTab = (typeof FIGURE_TABS)[number];

export interface PacketFigure {
  id: string;
  /**
   * The section this figure prints under.
   *
   * Named explicitly rather than inferred from the id. The report used to
   * partition on whether the id started with "baseline-" or "scenario-" and
   * silently dropped anything matching neither, so adding a chart with a new
   * name removed it from every document without a word. On CC-4's twelve-chart
   * registry that rule keeps three and drops nine.
   *
   * The field is called `tab` and carries `ChartTab` values because that is what
   * CC-4's `ExportFigure` carries. Same name, same strings, so the consumers
   * below need no change when the producer is swapped.
   */
  tab: FigureTab;
  /** The takeaway, computed from this run. One message. */
  title: string;
  /** What the chart shows and how to read it. */
  subtitle: string;
  series: ChartSeries[];
  height: number;
  weoBoundaryYear?: number;
  zeroLine?: boolean;
  format?: (v: number) => string;
}

/**
 * True when every climate scenario sits on the baseline.
 *
 * Tested on debt rather than on GDP because debt is what the headline figures
 * report, and tested across the whole horizon rather than at 2099 alone so a
 * path that diverges and returns is not mistaken for a flat one.
 */
export function noClimateSignal(result: EngineResult): boolean {
  const baseline = findScenario(result, 'Baseline');
  if (!baseline) return false;

  const baselineByYear = new Map(baseline.fiscal.map((f) => [f.year, f.debt_to_gdp]));
  const climate = result.scenarios.filter((s) => s.key !== 'Baseline');
  if (!climate.length) return false;

  return climate.every((s) =>
    s.fiscal.every((f) => {
      const base = baselineByYear.get(f.year);
      return base == null || Math.abs(f.debt_to_gdp - base) < NEGLIGIBLE_PP;
    }),
  );
}

/**
 * True when any scenario's debt path goes below zero.
 *
 * The engine floors the BASELINE at zero and deliberately does not floor the
 * climate scenarios (an intentional asymmetry, recorded as a domain rule in
 * CLAUDE.md). With the fiscal rule switched off, which is a control the sidebar
 * exposes, a strong primary surplus can repay the whole stock and keep going:
 * Uganda at the QA parameter set reaches minus 131 percent of GDP by 2099.
 *
 * That is the model's own arithmetic, not a defect, and this function does not
 * suppress it. It exists so an exported chart does not present a net asset
 * position with no explanation, in a document whose other charts are about
 * fiscal risk. A reader who sees minus 131 percent and no note is entitled to
 * think something broke.
 */
export function goesBelowZero(result: EngineResult): boolean {
  return result.scenarios.some((s) => s.fiscal.some((f) => f.debt_to_gdp < 0));
}

/**
 * Stated as arithmetic, with no judgment attached. Whether the packet should
 * say more than this is a methodology call, and it is raised with Teal rather
 * than settled here.
 */
export const BELOW_ZERO_NOTE =
  'Values below zero mean the projection has repaid the whole debt stock and ' +
  'continues into a net asset position. The baseline path is held at zero; the ' +
  'climate scenarios are not, which is why only they go below it.';

/**
 * The plain-language reason a no-signal country shows six flat lines.
 *
 * Content follows the 2026-08-27 gate resolution on zero-climate countries: say
 * that the data is missing, say that missing data is not the same as no risk,
 * and name the channels the model leaves out. CC-2 owns the app's own notice and
 * its exact wording goes through Teal with the other IMF-facing copy; this is
 * the artifact-side statement of the same fact, kept here so an exported chart
 * cannot travel without it.
 */
export const NO_SIGNAL_NOTE =
  'The climate dataset has no coverage for this economy, so every scenario ' +
  'returns the baseline path. The scenarios show no effect because the data is ' +
  'missing, not because there is no risk. Sea-level rise and disaster losses ' +
  'are outside this model in every country.';

/**
 * Figures grouped into document sections by their tab, in section order, with
 * nothing lost.
 *
 * The invariant this function exists to hold: every figure handed in comes back
 * out in exactly one section. A figure whose tab is not one this build knows
 * about lands in a trailing "Other charts" section rather than disappearing. A
 * chart missing from a report is invisible; a chart under a dull heading is a
 * five-minute fix someone can actually see.
 */
export function groupFigures(
  figures: PacketFigure[],
): Array<{ tab: string; title: string; figures: PacketFigure[] }> {
  const titles: Record<FigureTab, string> = {
    Overview: 'The run at a glance',
    Baseline: 'Baseline projection',
    Analysis: 'Climate scenarios',
    Climate: 'How warming reaches the fiscal accounts',
  };

  const known = new Set<string>(FIGURE_TABS);
  const sections = FIGURE_TABS.map((tab) => ({
    tab: tab as string,
    title: titles[tab],
    figures: figures.filter((f) => f.tab === tab),
  }));

  const rest = figures.filter((f) => !known.has(f.tab));
  if (rest.length) sections.push({ tab: 'Other', title: 'Other charts', figures: rest });

  return sections.filter((section) => section.figures.length);
}

export function packetFigures(
  result: EngineResult,
  extraFigures: PacketFigure[] = [],
): PacketFigure[] {
  const baseline = findScenario(result, 'Baseline');
  const spread = scenarioSpread(result, HORIZON);
  const boundary = result.weoBoundaryYear;
  const flat = noClimateSignal(result);
  const belowZero = goesBelowZero(result);
  /** Appended to the debt figures' subtitles, never to a title. */
  const belowZeroSuffix = belowZero ? ` ${BELOW_ZERO_NOTE}` : '';

  const figures: PacketFigure[] = [];

  if (baseline) {
    const debtPoints = baseline.fiscal.map((f) => ({
      year: f.year,
      value: f.debt_to_gdp,
    }));
    const last = debtPoints[debtPoints.length - 1];
    const start = debtPoints.find((p) => p.year === boundary) ?? debtPoints[0];

    figures.push({
      id: 'baseline-debt',
      tab: 'Baseline',
      title: `Baseline debt ${
        last.value > start.value ? 'rises to' : 'settles at'
      } ${fmtPct(last.value)} of GDP by ${last.year}`,
      subtitle:
        'No climate damage applied. Shaded years are WEO history and forecast; ' +
        'the projection continues past the boundary.' +
        belowZeroSuffix,
      height: 300,
      weoBoundaryYear: boundary,
      series: [
        {
          key: 'Baseline',
          label: 'Baseline',
          color: palette.baseline,
          emphasis: true,
          directLabel: true,
          points: debtPoints,
        },
      ],
    });

    figures.push({
      id: 'baseline-revexp',
      tab: 'Baseline',
      title: 'Revenue and primary expenditure under the baseline',
      subtitle:
        'Revenue is held constant as a share of GDP. Expenditure grows with ' +
        'population, productivity and inflation.',
      height: 260,
      weoBoundaryYear: boundary,
      series: [
        {
          key: 'revenue',
          label: 'Revenue',
          color: palette.duo[0],
          directLabel: true,
          points: baseline.fiscal.map((f) => ({
            year: f.year,
            value: f.revenue_percent_gdp,
          })),
        },
        {
          key: 'expenditure',
          label: 'Primary expenditure',
          color: palette.duo[1],
          directLabel: true,
          points: baseline.fiscal.map((f) => ({
            year: f.year,
            value: f.primary_expenditure_percent_gdp,
          })),
        },
      ],
    });
  }

  const directLabelKeys: ScenarioKey[] = spread
    ? [spread.best.key, spread.worst.key, 'Baseline']
    : ['Baseline'];

  figures.push({
    id: 'scenario-debt',
    tab: 'Analysis',
    title: flat
      ? `Every climate scenario returns the baseline path for ${result.countryName}`
      : spread
        ? `Climate scenarios spread ${HORIZON} debt across ${spread.spread.toFixed(0)} points of GDP`
        : 'Debt-to-GDP under climate scenarios',
    subtitle: flat
      ? NO_SIGNAL_NOTE
      : 'Baseline in navy. Paris-Aligned, Moderate and High are separate damage ' +
        'pathways, each its own colour; the three 3°C scenarios share one ' +
        'colour, darkening as adaptation falls away. They are a family, not rungs ' +
        'on a single severity ladder.' +
        belowZeroSuffix,
    height: 340,
    weoBoundaryYear: result.weoBoundaryYear,
    series: fiscalSeries(result, 'debt_to_gdp', { directLabelKeys }),
  });

  figures.push({
    id: 'scenario-gdp',
    tab: 'Climate',
    title: flat
      ? 'No climate damage is applied to GDP, because the dataset carries none'
      : 'Climate damage as a share of baseline GDP',
    subtitle: flat
      ? NO_SIGNAL_NOTE
      : 'Each scenario’s real GDP measured against the baseline path, so ' +
        'growth is removed and only the damage remains. Baseline is the flat ' +
        'zero line.',
    height: 280,
    zeroLine: true,
    series: gdpShortfallSeries(result, {
      directLabelKeys: ['Paris', 'Hot_Unadapted'],
    }),
  });

  return [...figures, ...extraFigures];
}

/**
 * The three numbers a reader keeps.
 *
 * Shared by the report's key-figure tiles, the workbook's results sheet header
 * and the chart pack cover, so all three say the same thing about the same run.
 */
export interface KeyFigure {
  label: string;
  value: string;
  detail?: string;
}

export function keyFigures(result: EngineResult): KeyFigure[] {
  const baseline = findScenario(result, 'Baseline');
  const spread = scenarioSpread(result, HORIZON);
  const tiles: KeyFigure[] = [];

  const mid = baseline ? valueAt(baseline, MID, 'debt_to_gdp') : undefined;
  if (mid != null) {
    tiles.push({
      label: `Baseline debt, ${MID}`,
      value: fmtPct(mid),
      detail: 'Share of GDP, no climate damage',
    });
  }

  if (spread && noClimateSignal(result)) {
    // Reporting a worst case and a spread here would put two numbers on a page
    // that a reader would take as findings about the country. They are the
    // baseline, twice, and zero.
    tiles.push({
      label: `Climate scenarios, ${HORIZON}`,
      value: 'No signal',
      detail: 'The climate dataset has no coverage for this economy',
    });
    return tiles;
  }

  if (spread) {
    tiles.push({
      label: `Worst climate outcome, ${HORIZON}`,
      value: fmtPct(spread.worst.value),
      detail:
        spread.worst.value < 0
          ? `${spread.worst.label}. Below zero is a net asset position.`
          : spread.worst.label,
    });
    tiles.push({
      label: `Scenario spread, ${HORIZON}`,
      value: `${spread.spread.toFixed(1)} pts`,
      detail: `${spread.best.label} to ${spread.worst.label}`,
    });
  }

  return tiles;
}
