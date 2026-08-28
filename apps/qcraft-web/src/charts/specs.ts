/**
 * Every chart in the app, in both registers, built once.
 *
 * This module is the single place that decides what a chart shows. The screen
 * renders these specs and so does the export packet, which is the only way the
 * printed figure can be the figure the reader was looking at. It is also the
 * only way a per-chart register override can travel into an export: the export
 * asks for a chart by id and a register, and gets the same object the tab drew.
 *
 * ── What separates the registers ──────────────────────────────────────────────
 *
 * WORKBOOK specs name the variable in the title, draw every scenario at equal
 * weight, and annotate nothing. They are the IMF Excel workbook's charts and
 * the Shiny Explorer's charts, and improving them would defeat their purpose.
 *
 * BRIEFING specs carry one message. The title is computed from this run by
 * `titles.ts`. The paths that are not the message are muted. The claim in the
 * title is measured on the chart: a threshold rule for the target, an envelope
 * for the range of outcomes, a bracket for the gap, a callout on the point.
 *
 * ── One chart the registers disagree about ────────────────────────────────────
 *
 * `climate-drag` plots different quantities in the two registers, which no
 * other chart here does. The workbook register shows real GDP indexed to the
 * WEO boundary year, which is the Shiny Explorer's own view of the climate GDP
 * channel. The briefing register shows the deviation from baseline instead,
 * because the index cannot carry the message: Uganda's real GDP grows roughly
 * tenfold over the horizon, so a 6% climate shortfall is about a line width and
 * all seven paths sit on top of each other. Differencing against the baseline
 * removes the growth and leaves the damage, which is the quantity the whole
 * Analysis tab rests on. Both subtitles state exactly what is plotted, so
 * neither register can be mistaken for the other.
 */

import type { EngineParams, EngineResult, ScenarioKey } from '../engine/adapter';
import { TAB_GUIDANCE } from '../content/guidance';
import { chart as chartTheme, series as palette, theme } from '../theme';
import {
  fiscalSeries,
  findScenario,
  scenarioColor,
  fmtGdp,
  fmtIndex,
  fmtPct,
  gdpIndexSeries,
  gdpSeries,
  gdpShortfallSeries,
} from '../selectors';
import {
  HORIZON_YEAR,
  effectiveParams,
  envelope,
  fiscalExtremes,
  gdpShortfallExtremes,
  isParamInForce,
  pathFacts,
  thresholdFacts,
} from './facts';
import type { ChartRegister } from './register';
import type { ChartPoint, ChartSeries, ChartSpec } from './types';
import {
  balancesTitle,
  baselineDebtTitle,
  growthDragTitle,
  overviewTitle,
  possessive,
  revenueExpenditureTitle,
  scenarioSpreadTitle,
} from './titles';

export type ChartTab = 'Baseline' | 'Analysis' | 'Climate' | 'Overview';

export interface RegisteredChart {
  id: string;
  tab: ChartTab;
  /**
   * A chart can belong to one register only. The workbook register keeps every
   * chart the workbook produces, including ones that carry no message; the
   * briefing register keeps the money charts. `climate-gdp-levels` is workbook
   * only for exactly that reason, and `overview` is briefing only because a
   * packet cover is a takeaway by definition.
   */
  workbook?: ChartSpec;
  briefing?: ChartSpec;
  /** Rendered two to a row rather than full width. */
  half?: boolean;
}

export interface SpecContext {
  result: EngineResult;
  params: EngineParams;
  defaults: EngineParams;
}

export function specFor(
  chart: RegisteredChart,
  register: ChartRegister,
): ChartSpec | undefined {
  return register === 'briefing' ? chart.briefing : chart.workbook;
}

const fmtSignedPct = (v: number) =>
  `${Math.abs(v) < 0.05 ? '' : v > 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}%`;

const fmtPoints = (v: number) => `${v.toFixed(1)} points`;

/**
 * The figure's source line.
 *
 * Every figure carries where its numbers came from, so it still means something
 * when somebody screenshots it into a note: the tool, the producer, the data
 * vintage, and whether the run recomputed.
 *
 * It is deliberately short. `provenance.source` carries a repository path, which
 * belongs in the run manifest and the export annex where a reader is checking
 * reproducibility, not under a chart where it wraps to three lines on a
 * half-width panel and buries the vintage that actually matters.
 */
function sourceLine(result: EngineResult): string {
  const run =
    result.provenance.kind === 'fixture'
      ? ' Fixture run at engine defaults.'
      : '';
  return (
    `Q-CRAFT Explorer, Teal Insights. Data vintage ${result.provenance.dataVintage}.${run}`
  );
}

function points(series: { year: number; value: number }[]): ChartPoint[] {
  return series;
}

/**
 * The debt target rule, when there is one to draw.
 *
 * ── Two rules, both load-bearing ──────────────────────────────────────────────
 *
 * FIRST: this is the value the charted numbers were produced under, not the
 * sidebar's value when the two differ. A backend that cannot honour a setting
 * reports it in `provenance.ignoredParams`, and drawing the rule at a
 * requested-but-unused target would put a false claim on the chart. The label
 * says which it is.
 *
 * SECOND: with `fiscal_rule` set to No the target is inert. It enters the model
 * in exactly two places, both as the boolean `debt_to_gdp > debt_target`, and
 * both are skipped when the rule is off (packages/qcraft-engine-ts/src/fiscal.ts
 * lines 133 to 141 and 203 to 210). A dashed rule across a chart it is not
 * acting on invites the reader to take it for an external standard, which it is
 * not: Q-CRAFT has no debt ceiling, no threshold constant and no DSA benchmark
 * anywhere in the engine. So when the rule is off, no line.
 *
 * The label is "Your debt target" for the same reason. The number is the user's
 * policy anchor, usually out of a fiscal responsibility charter. It is never a
 * sustainable level and the chart must not imply one.
 */
interface TargetRule {
  value: number;
  label: string;
}

function debtTargetRule(ctx: SpecContext): TargetRule | undefined {
  const effective = effectiveParams(ctx.result, ctx.params, ctx.defaults);
  if (effective.fiscal_rule !== 'Yes') return undefined;
  const inForce = isParamInForce(ctx.result, 'debt_target');
  return {
    value: effective.debt_target,
    label: `${inForce ? 'Your debt target' : 'Debt target as run'}, ${effective.debt_target.toFixed(0)}% of GDP`,
  };
}

/** The first projection year the two paths come within `tol` of each other. */
function convergenceYear(
  a: ChartPoint[],
  b: ChartPoint[],
  tol: number,
  from: number,
): number | undefined {
  const byYear = new Map(b.map((p) => [p.year, p.value]));
  for (const p of a) {
    if (p.year <= from) continue;
    const other = byYear.get(p.year);
    if (other != null && Math.abs(p.value - other) <= tol) return p.year;
  }
  return undefined;
}

/* ── Baseline tab ───────────────────────────────────────────────────────────── */

function baselineCharts(ctx: SpecContext): RegisteredChart[] {
  const { result } = ctx;
  const baseline = findScenario(result, 'Baseline');
  if (!baseline) return [];

  const boundary = result.weoBoundaryYear;
  const source = sourceLine(result);
  const target = debtTargetRule(ctx);

  const debt = points(baseline.fiscal.map((f) => ({ year: f.year, value: f.debt_to_gdp })));
  const revenue = points(
    baseline.fiscal.map((f) => ({ year: f.year, value: f.revenue_percent_gdp })),
  );
  const expenditure = points(
    baseline.fiscal.map((f) => ({
      year: f.year,
      value: f.primary_expenditure_percent_gdp,
    })),
  );
  const primary = points(
    baseline.fiscal.map((f) => ({ year: f.year, value: f.primary_balance_percent_gdp })),
  );
  const overall = points(
    baseline.fiscal.map((f) => ({ year: f.year, value: f.overall_balance_percent_gdp })),
  );

  const debtLine = {
    key: 'Baseline',
    label: 'Baseline',
    color: palette.baseline,
    emphasis: true,
    points: debt,
  };

  // ── The debt path against the target ──────────────────────────────────────
  //
  // The facts here are the PROJECTION's, 2029 onward, not the whole record's.
  // The shape worth annotating lives there: the observed record already peaked
  // at 51.4% in 2024 for Uganda, and calling that a finding of the projection
  // would be wrong.
  const projection = pathFacts(
    debt.filter((p) => p.year >= boundary),
    boundary,
  );
  const cross = target ? thresholdFacts(debt, target.value, boundary) : undefined;

  // The callout goes on the crossing when there is one, because that is what
  // the title claims. With no crossing it goes on the low point of the
  // projection, which is the shape of the path the title cannot carry.
  const trough = projection?.trough;
  const troughInWindow =
    trough != null &&
    trough.year > boundary &&
    trough.year < (projection?.last.year ?? boundary);
  const briefingAnnotation = cross?.crossing && target
    ? {
        year: cross.crossing.year,
        value: target.value,
        text: `Crosses in ${cross.crossing.year}`,
        color: palette.baseline,
      }
    : troughInWindow
      ? {
          year: trough.year,
          value: trough.value,
          text: `Low of ${fmtPct(trough.value)} in ${trough.year}`,
          color: palette.baseline,
          place: 'below' as const,
        }
      : undefined;

  // With the rule off there is no target line, so the subtitle says why rather
  // than leaving a reader to wonder where it went.
  const ruleNote = target
    ? 'The dashed rule is the debt target you set. The fiscal rule adjusts spending toward it whenever debt is above it and rising.'
    : 'The fiscal rule is off in this run, so the debt target does nothing and no target line is drawn.';

  const debtChart: RegisteredChart = {
    id: 'baseline-debt',
    tab: 'Baseline',
    workbook: {
      id: 'baseline-debt',
      title: `Debt-to-GDP (%), ${result.countryName}`,
      subtitle: TAB_GUIDANCE.baseline.weo(boundary),
      height: 400,
      weoBoundaryYear: boundary,
      series: [{ ...debtLine, directLabel: true }],
      format: fmtPct,
      source,
    },
    briefing: {
      id: 'baseline-debt',
      title: baselineDebtTitle({
        countryName: result.countryName,
        points: debt,
        target: target?.value,
        boundaryYear: boundary,
      }),
      subtitle: `${TAB_GUIDANCE.baseline.weo(boundary)} ${ruleNote}`,
      height: 400,
      weoBoundaryYear: boundary,
      series: [{ ...debtLine, directLabel: true }],
      thresholds: target ? [{ value: target.value, label: target.label }] : undefined,
      annotations: briefingAnnotation ? [briefingAnnotation] : undefined,
      format: fmtPct,
      source,
    },
  };

  // ── Revenue against primary expenditure ───────────────────────────────────
  const revExpSeries = [
    {
      key: 'revenue',
      label: 'Revenue',
      color: palette.duo[0],
      directLabel: true,
      points: revenue,
    },
    {
      key: 'expenditure',
      label: 'Primary expenditure',
      color: palette.duo[1],
      directLabel: true,
      points: expenditure,
    },
  ];

  const lastRev = revenue[revenue.length - 1];
  const lastExp = expenditure[expenditure.length - 1];
  const revExpGap = lastRev && lastExp ? lastExp.value - lastRev.value : 0;
  const meetYear = convergenceYear(revenue, expenditure, 0.25, boundary);

  const revExpChart: RegisteredChart = {
    id: 'baseline-revexp',
    tab: 'Baseline',
    half: true,
    workbook: {
      id: 'baseline-revexp',
      title: 'Revenue and expenditure (% GDP)',
      subtitle: TAB_GUIDANCE.baseline.revExp,
      height: 320,
      weoBoundaryYear: boundary,
      series: revExpSeries,
      format: fmtPct,
      source,
    },
    briefing: {
      id: 'baseline-revexp',
      title: revenueExpenditureTitle({ revenue, expenditure }),
      subtitle: TAB_GUIDANCE.baseline.revExp,
      height: 320,
      weoBoundaryYear: boundary,
      series: revExpSeries,
      // A gap worth measuring gets a bracket. A gap that has closed gets a
      // callout on the year it closed, which is the finding in that case.
      brackets:
        Math.abs(revExpGap) >= 1 && lastRev && lastExp
          ? [
              {
                year: lastExp.year,
                from: lastRev.value,
                to: lastExp.value,
                label: fmtPoints(Math.abs(revExpGap)),
              },
            ]
          : undefined,
      annotations:
        Math.abs(revExpGap) < 1 && meetYear != null
          ? [
              {
                year: meetYear,
                value: revenue.find((p) => p.year === meetYear)?.value ?? 0,
                text: `Converge in ${meetYear}`,
              },
            ]
          : undefined,
      format: fmtPct,
      source,
    },
  };

  // ── The two balances ──────────────────────────────────────────────────────
  const balanceSeries = [
    {
      key: 'primary',
      label: 'Primary balance',
      color: palette.duo[0],
      directLabel: true,
      points: primary,
    },
    {
      key: 'overall',
      label: 'Overall balance',
      color: palette.duo[1],
      directLabel: true,
      points: overall,
    },
  ];

  const lastPb = primary[primary.length - 1];
  const lastOb = overall[overall.length - 1];
  const interestWedge = lastPb && lastOb ? lastPb.value - lastOb.value : 0;

  const balancesChart: RegisteredChart = {
    id: 'baseline-balances',
    tab: 'Baseline',
    half: true,
    workbook: {
      id: 'baseline-balances',
      title: 'Fiscal balances (% GDP)',
      subtitle: TAB_GUIDANCE.baseline.balances,
      height: 320,
      weoBoundaryYear: boundary,
      zeroLine: true,
      series: balanceSeries,
      format: fmtPct,
      source,
    },
    briefing: {
      id: 'baseline-balances',
      title: balancesTitle({ primary, overall }),
      subtitle: TAB_GUIDANCE.baseline.balances,
      height: 320,
      weoBoundaryYear: boundary,
      zeroLine: true,
      series: balanceSeries,
      // The wedge between the two balances IS the interest bill, so measuring
      // it on the chart is measuring the thing the title names.
      brackets:
        interestWedge >= 0.5 && lastPb && lastOb
          ? [
              {
                year: lastPb.year,
                from: lastOb.value,
                to: lastPb.value,
                label: fmtPoints(interestWedge),
              },
            ]
          : undefined,
      format: fmtPct,
      source,
    },
  };

  return [debtChart, revExpChart, balancesChart];
}

/* ── Analysis tab ───────────────────────────────────────────────────────────── */

/** The climate scenarios only. The baseline is what the range is read against. */
function climateKeys(result: EngineResult): ScenarioKey[] {
  return result.scenarios.map((s) => s.key).filter((k) => k !== 'Baseline');
}

function analysisCharts(ctx: SpecContext): RegisteredChart[] {
  const { result } = ctx;
  const boundary = result.weoBoundaryYear;
  const source = sourceLine(result);
  const target = debtTargetRule(ctx);

  const extremes = fiscalExtremes(result, 'debt_to_gdp', HORIZON_YEAR);
  const bounding = extremes ? [extremes.best.key, extremes.worst.key] : [];
  const muted = climateKeys(result).filter((k) => !bounding.includes(k));

  const fan = envelope(
    result.scenarios
      .filter((s) => s.key !== 'Baseline')
      .map((s) => s.fiscal.map((f) => ({ year: f.year, value: f.debt_to_gdp }))),
  );

  // ── The rest of the workbook's Output Scenarios sheet ─────────────────────
  //
  // The workbook charts six metrics by scenario (`Output Scenarios` charts 34
  // to 39); the app charted one. Four of the missing five are reachable from
  // `FiscalYear` as it stands, so they are restored here as workbook-register
  // charts. They carry no single message, which is why they have no briefing
  // twin: the briefing register keeps the money chart.
  //
  // The fifth, interest expenditure as a share of revenue, needs revenue in
  // LCU levels. `toFiscalYear` drops it, so that chart stays out of reach
  // without an adapter change. Recorded in the report rather than faked from
  // the ratios that are available.
  const SCENARIO_METRICS = [
    {
      id: 'analysis-prim-exp',
      metric: 'primary_expenditure_percent_gdp' as const,
      title: 'Primary expenditure by scenario (% GDP)',
      zeroLine: false,
    },
    {
      id: 'analysis-prim-balance',
      metric: 'primary_balance_percent_gdp' as const,
      title: 'Primary balance by scenario (% GDP)',
      zeroLine: true,
    },
    {
      id: 'analysis-overall-balance',
      metric: 'overall_balance_percent_gdp' as const,
      title: 'Overall balance by scenario (% GDP)',
      zeroLine: true,
    },
    {
      id: 'analysis-interest-exp',
      metric: 'interest_expenditure_percent_gdp' as const,
      title: 'Interest expenditure by scenario (% GDP)',
      zeroLine: false,
    },
  ];

  const scenarioMetricCharts: RegisteredChart[] = SCENARIO_METRICS.map((m) => ({
    id: m.id,
    tab: 'Analysis' as const,
    half: true,
    workbook: {
      id: m.id,
      title: m.title,
      subtitle:
        'Baseline plus all six climate scenarios, the same set the workbook’s ' +
        'Output Scenarios sheet charts.',
      height: 300,
      weoBoundaryYear: boundary,
      zeroLine: m.zeroLine,
      series: fiscalSeries(result, m.metric, { directLabelKeys: ['Baseline'] }),
      format: fmtPct,
      source,
    },
  }));

  const briefingSubtitle = extremes
    ? `The shaded range is every climate scenario. ${extremes.best.label} is the low edge, ` +
      `${extremes.worst.label} the high edge, and the baseline in navy is the same country ` +
      `with no climate shock. The four scenarios in gray sit inside the range.`
    : TAB_GUIDANCE.analysis.lede;

  return [
    {
      id: 'analysis-debt',
      tab: 'Analysis',
      workbook: {
        id: 'analysis-debt',
        title: `Debt-to-GDP (%) under climate scenarios, ${result.countryName}`,
        subtitle:
          'Baseline in navy. Paris-Aligned, Moderate and High are separate damage ' +
          'pathways, each its own colour. The three 3°C scenarios share one colour, ' +
          'darkening as adaptation falls away. They are a family, not rungs on a ' +
          'single severity ladder.',
        height: 460,
        weoBoundaryYear: boundary,
        series: fiscalSeries(result, 'debt_to_gdp', {
          directLabelKeys: extremes
            ? ([...bounding, 'Baseline'] as ScenarioKey[])
            : (['Baseline'] as ScenarioKey[]),
        }),
        format: fmtPct,
        source,
      },
      briefing: {
        id: 'analysis-debt',
        title: scenarioSpreadTitle({
          countryName: result.countryName,
          result,
          year: HORIZON_YEAR,
        }),
        subtitle: briefingSubtitle,
        height: 460,
        // One legend entry for the gray band, named rather than counted: these
        // four are what sits between the two edges the title is about, and the
        // subtitle says the same thing in the same words.
        mutedLabel: `The ${muted.length} scenarios in between`,
        weoBoundaryYear: boundary,
        series: fiscalSeries(result, 'debt_to_gdp', {
          directLabelKeys: extremes
            ? ([...bounding, 'Baseline'] as ScenarioKey[])
            : (['Baseline'] as ScenarioKey[]),
          mutedKeys: muted,
        }),
        bands: fan
          ? [
              {
                key: 'climate-range',
                label: 'Range across climate scenarios',
                lower: fan.lower,
                upper: fan.upper,
                color: chartTheme.bandFill,
                opacity: chartTheme.bandOpacity,
              },
            ]
          : undefined,
        thresholds: target ? [{ value: target.value, label: target.label }] : undefined,
        brackets: extremes
          ? [
              {
                year: HORIZON_YEAR,
                from: extremes.best.value,
                to: extremes.worst.value,
                label: `${extremes.spread.toFixed(0)} points of GDP`,
                color: theme.textPrimary,
              },
            ]
          : undefined,
        format: fmtPct,
        source,
      },
    },
    ...scenarioMetricCharts,
  ];
}

/* ── Climate tab ────────────────────────────────────────────────────────────── */

function climateCharts(ctx: SpecContext): RegisteredChart[] {
  const { result } = ctx;
  const boundary = result.weoBoundaryYear;
  const source = sourceLine(result);

  const extremes = gdpShortfallExtremes(result, HORIZON_YEAR);
  const bounding = extremes ? [extremes.best.key, extremes.worst.key] : [];
  const muted = climateKeys(result).filter((k) => !bounding.includes(k));

  const baseline = findScenario(result, 'Baseline');
  const baseByYear = new Map((baseline?.gdp ?? []).map((g) => [g.year, g.real_gdp]));
  const shortfallOf = (key: ScenarioKey): ChartPoint[] => {
    const s = findScenario(result, key);
    if (!s) return [];
    return s.gdp.flatMap((g) => {
      const base = baseByYear.get(g.year);
      if (base == null || base === 0) return [];
      return [{ year: g.year, value: (g.real_gdp / base - 1) * 100 }];
    });
  };

  const drag = envelope(climateKeys(result).map(shortfallOf));

  const dragChart: RegisteredChart = {
    id: 'climate-drag',
    tab: 'Climate',
    workbook: {
      id: 'climate-drag',
      title: `GDP index (${boundary} = 100), ${result.countryName}`,
      subtitle: TAB_GUIDANCE.climate.index,
      height: 400,
      weoBoundaryYear: boundary,
      series: gdpIndexSeries(result, boundary, { directLabelKeys: ['Baseline'] }),
      format: fmtIndex,
      source,
    },
    briefing: {
      id: 'climate-drag',
      title: growthDragTitle({
        countryName: result.countryName,
        result,
        year: HORIZON_YEAR,
      }),
      subtitle:
        'Real GDP under each scenario as a percentage deviation from the baseline ' +
        'path, so the chart shows the damage rather than the growth. Baseline is ' +
        'the flat zero line. This is the GDP damage that propagates into revenue, ' +
        'expenditure and debt on the Analysis tab.',
      height: 420,
      // Same collapse as the analysis chart: one entry for the gray band.
      mutedLabel: `The ${muted.length} scenarios in between`,
      weoBoundaryYear: boundary,
      zeroLine: true,
      series: gdpShortfallSeries(result, {
        directLabelKeys: bounding,
        mutedKeys: muted,
      }),
      bands: drag
        ? [
            {
              key: 'climate-range',
              label: 'Range across climate scenarios',
              lower: drag.lower,
              upper: drag.upper,
              color: chartTheme.bandFill,
              opacity: chartTheme.bandOpacity,
            },
          ]
        : undefined,
      // No callout. The title names the worst scenario and its number, the
      // direct label repeats the number at the line end, and a third copy at
      // the same point is clutter rather than emphasis.
      format: fmtSignedPct,
      source,
    },
  };

  // The Shiny Explorer leads its Climate panel with real GDP in levels. It
  // carries no message at this horizon, because a tenfold-growing series hides
  // a 6% shortfall inside its own line width, so it is a workbook chart only.
  const levelsChart: RegisteredChart = {
    id: 'climate-gdp-levels',
    tab: 'Climate',
    workbook: {
      id: 'climate-gdp-levels',
      title: `Real GDP (LCU billions), ${result.countryName}`,
      subtitle:
        'The Shiny Explorer’s levels view. Growth swamps the climate damage at ' +
        'this scale, which is why the briefing register plots the deviation from ' +
        'baseline instead.',
      height: 340,
      weoBoundaryYear: boundary,
      series: gdpSeries(result, { directLabelKeys: ['Baseline'] }),
      format: fmtGdp,
      source,
    },
  };

  return [dragChart, levelsChart];
}

/* ── The packet cover ───────────────────────────────────────────────────────── */

/**
 * One chart that carries the whole run.
 *
 * Baseline, the range every climate scenario opens up, and the debt target the
 * fiscal rule is working toward, on one axis. Briefing register only: a cover
 * figure is a takeaway by definition, and there is no workbook chart it
 * corresponds to.
 */
function overviewCharts(ctx: SpecContext): RegisteredChart[] {
  const { result } = ctx;
  const baseline = findScenario(result, 'Baseline');
  if (!baseline) return [];

  const boundary = result.weoBoundaryYear;
  const target = debtTargetRule(ctx);
  const extremes = fiscalExtremes(result, 'debt_to_gdp', HORIZON_YEAR);
  const baselineAtHorizon = baseline.fiscal.find((f) => f.year === HORIZON_YEAR)?.debt_to_gdp;

  const fan = envelope(
    result.scenarios
      .filter((s) => s.key !== 'Baseline')
      .map((s) => s.fiscal.map((f) => ({ year: f.year, value: f.debt_to_gdp }))),
  );

  const series: ChartSeries[] = [
    {
      key: 'Baseline',
      label: 'Baseline, no climate shock',
      color: palette.baseline,
      emphasis: true,
      directLabel: true,
      points: baseline.fiscal.map((f) => ({ year: f.year, value: f.debt_to_gdp })),
    },
  ];

  // The two coloured paths are the REAL scenario paths, read out of the result,
  // not the envelope's edges.
  //
  // The envelope is a per-year maximum and minimum across all six scenarios, so
  // its upper edge is whichever scenario is highest THAT year. Drawing that edge
  // and labelling it "Hot + Unadapted" would be a chart naming a scenario for a
  // path that is not that scenario, which is exactly the kind of quiet
  // untruth this tool cannot afford. The band stays the honest envelope,
  // unlabelled by scenario; the lines are the scenarios.
  if (extremes) {
    for (const end of [extremes.worst, extremes.best]) {
      const scenario = findScenario(result, end.key);
      if (!scenario) continue;
      series.push({
        key: end.key,
        label: end.label,
        color: scenarioColor(end.key),
        emphasis: false,
        directLabel: true,
        points: scenario.fiscal.map((f) => ({ year: f.year, value: f.debt_to_gdp })),
      });
    }
  }

  return [
    {
      id: 'overview',
      tab: 'Overview',
      briefing: {
        id: 'overview',
        title: overviewTitle({
          countryName: result.countryName,
          result,
          year: HORIZON_YEAR,
          baselineAtHorizon,
        }),
        subtitle:
          `Debt-to-GDP for ${result.countryName}. The shaded range spans every ` +
          `climate scenario in the run. The two coloured paths are the scenarios ` +
          `at its ends in ${HORIZON_YEAR}.` +
          (target ? ' The dashed rule is the debt target the fiscal rule works toward.' : ''),
        height: 420,
        weoBoundaryYear: boundary,
        series,
        bands: fan
          ? [
              {
                key: 'climate-range',
                label: 'Range across climate scenarios',
                lower: fan.lower,
                upper: fan.upper,
                color: chartTheme.bandFill,
                opacity: chartTheme.bandOpacity,
              },
            ]
          : undefined,
        thresholds: target ? [{ value: target.value, label: target.label }] : undefined,
        brackets: extremes
          ? [
              {
                year: HORIZON_YEAR,
                from: extremes.best.value,
                to: extremes.worst.value,
                label: `${extremes.spread.toFixed(0)} points of GDP`,
                color: theme.textPrimary,
              },
            ]
          : undefined,
        format: fmtPct,
        source: sourceLine(result),
      },
    },
  ];
}

/* ── Assembly ───────────────────────────────────────────────────────────────── */

/**
 * Every chart the app can draw, in tab order.
 *
 * The export packet walks this list. So does each tab, filtered to its own.
 * A chart added here appears in both places, which is the point.
 */
export function buildCharts(ctx: SpecContext): RegisteredChart[] {
  return [
    ...baselineCharts(ctx),
    ...analysisCharts(ctx),
    ...climateCharts(ctx),
    ...overviewCharts(ctx),
  ];
}

export function chartsForTab(ctx: SpecContext, tab: ChartTab): RegisteredChart[] {
  return buildCharts(ctx).filter((c) => c.tab === tab);
}

/** The single chart a packet cover uses. */
export function overviewChart(ctx: SpecContext): RegisteredChart | undefined {
  return overviewCharts(ctx)[0];
}

export interface ExportFigure {
  id: string;
  tab: ChartTab;
  register: ChartRegister;
  title: string;
  subtitle?: string;
  source?: string;
  spec: ChartSpec;
}

/**
 * Every figure an export should carry, for one register.
 *
 * This is the seam the export packet consumes. `charts/svg.ts` turns any of
 * these specs into a standalone SVG string with `renderSpecSvg(fig.spec, {
 * withChrome: true })`, which draws the takeaway title, the legend and the
 * source line into the picture so a PNG of it still says something.
 *
 * `overrides` carries the per-chart register choices from the screen, so an
 * export reproduces what the analyst was actually looking at rather than a
 * uniform view they never saw.
 *
 * Partition by `tab`, not by an id prefix. The ids name charts, and a report
 * that groups them by matching the start of a string quietly drops any chart
 * whose id does not begin with a blessed word.
 */
export function exportFigures(
  ctx: SpecContext,
  register: ChartRegister,
  overrides: Record<string, ChartRegister> = {},
): ExportFigure[] {
  return buildCharts(ctx).flatMap((chart) => {
    const wanted = overrides[chart.id] ?? register;
    const spec = specFor(chart, wanted);
    if (!spec) return [];
    return [
      {
        id: chart.id,
        tab: chart.tab,
        register: wanted,
        title: spec.title,
        subtitle: spec.subtitle,
        source: spec.source,
        spec,
      },
    ];
  });
}

export { HORIZON_YEAR, possessive };
