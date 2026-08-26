/**
 * Interest-rate approach: what each of the three rules implies for the rate the
 * projection charges on debt.
 *
 * This is the parameter with the largest effect and the least intuition behind
 * it. The three options are not degrees of the same thing, they are three
 * different quantities held fixed once the WEO forecast runs out: the nominal
 * rate, its gap to nominal GDP growth, or the real rate. Which one you freeze
 * decides whether r rises with growth, sits flat, or tracks inflation, and that
 * decides the debt path more than the debt target does.
 *
 * So the three get three hues and no ordinal ramp: nothing here is ranked.
 *
 * ── The limit of this panel, stated rather than hidden ────────────────────────
 * The differential and real approaches are functions of nominal GDP growth and
 * inflation, which come from the whole baseline. The fixture cannot recompute
 * the baseline, so all three paths are projected on the golden master's growth
 * and deflator path, which is the projection the app is currently drawing. That
 * makes the nominal approach an exact reproduction of the fixture and the other
 * two an exact answer to "what would this approach have given on this
 * projection". It does not make them a forecast for moved parameters, and the
 * source line says so.
 */

import { useMemo } from 'react';

import { LineChart } from '../LineChart';
import type { ChartSeries } from '../../charts/types';
import { context as contextTheme } from '../../theme';
import { INTEREST_RATE_MODE_HELP } from '../../content/guidance';
import {
  GOLDEN_MASTER_ISO3C,
  SOURCES,
  WEO_MAX_YEAR,
  contextCountryName,
  effectiveRate,
} from '../../context/sources';
import {
  LONG_RUN_REAL_RATE,
  endValue,
  interestRateApproaches,
  type RateApproach,
} from '../../context/model';
import { ContextFrame } from './ContextFrame';

const APPROACHES: RateApproach[] = [
  'Nominal interest rate',
  'Interest-growth differential',
  'Real interest rate',
];

/** Two words each, for the legend. The full rule is in the sidebar note. */
const SHORT: Record<RateApproach, string> = {
  'Nominal interest rate': 'Constant nominal',
  'Interest-growth differential': 'Constant differential',
  'Real interest rate': 'Constant real',
};

interface Props {
  iso3c: string;
  mode: string;
  slug: string;
}

export function InterestRatePanel({ iso3c, mode, slug }: Props) {
  // The driver series are golden-master output and exist for one country, so
  // the panel is drawn for that country whatever the sidebar says. Saying which
  // country matters more than silently relabelling the chart.
  const paths = useMemo(() => {
    const observed = effectiveRate(GOLDEN_MASTER_ISO3C);
    return observed ? interestRateApproaches(observed) : null;
  }, []);

  const countryName = contextCountryName(GOLDEN_MASTER_ISO3C);
  // The driver series exist for one country. If the sidebar is on another, the
  // panel says whose rate it is drawing rather than letting the title imply
  // it is the selected country's.
  const standInFor = iso3c === GOLDEN_MASTER_ISO3C ? null : contextCountryName(iso3c);
  const chosen = APPROACHES.includes(mode as RateApproach)
    ? (mode as RateApproach)
    : APPROACHES[0];

  const series = useMemo((): ChartSeries[] => {
    if (!paths) return [];
    return [
      {
        key: 'observed',
        label: 'Observed effective rate',
        color: contextTheme.record,
        points: paths.record,
        emphasis: true,
      },
      ...APPROACHES.map((approach): ChartSeries => ({
        key: approach,
        label: SHORT[approach],
        color: contextTheme.approach[approach],
        points: paths.projections[approach],
        emphasis: approach === chosen,
        directLabel: true,
      })),
    ];
  }, [paths, chosen]);

  const ends = useMemo(() => {
    if (!paths) return null;
    return Object.fromEntries(
      APPROACHES.map((a) => [a, endValue(paths.projections[a])]),
    ) as Record<RateApproach, number | null>;
  }, [paths]);

  const fmt = (v: number | null | undefined) =>
    v == null ? 'n/a' : `${v.toFixed(1)}%`;

  const caption = !paths ? (
    'No observed interest-rate series is bundled for this country.'
  ) : (
    <>
      {countryName}&rsquo;s effective rate was{' '}
      <strong>{fmt(paths.anchorRate)}</strong> in {paths.anchorYear}, running{' '}
      <strong>
        {Math.abs(paths.anchorDifferential).toFixed(1)} points{' '}
        {paths.anchorDifferential < 0 ? 'below' : 'above'}
      </strong>{' '}
      nominal GDP growth. You have chosen <strong>{SHORT[chosen]}</strong>, which ends at{' '}
      <strong>{fmt(ends?.[chosen])}</strong> in 2099 against{' '}
      {APPROACHES.filter((a) => a !== chosen)
        .map((a) => `${fmt(ends?.[a])} under ${SHORT[a].toLowerCase()}`)
        .join(' and ')}
      .
    </>
  );

  return (
    <ContextFrame
      slug={slug}
      title="Three ways to hold a rate fixed, and they do not converge"
      standfirst={INTEREST_RATE_MODE_HELP[chosen]}
      caption={caption}
      source={
        <>
          {SOURCES.macrofiscal} The effective rate is derived in the workbook as
          interest expenditure divided by the SAME year&rsquo;s debt stock, not
          the prior year&rsquo;s, which is preserved for parity
          (SHARED/DATA-NOTES.md section 5b). Projected paths are computed on the
          golden master&rsquo;s own growth and deflator path: {SOURCES.goldenMaster}
        </>
      }
      footnote={
        <>
          The three paths are what each rule implies on the projection currently
          on screen. The constant-real approach holds the real rate at{' '}
          {LONG_RUN_REAL_RATE.toFixed(1)}%, the engine&rsquo;s
          long_run_interest_rate default.
          {standInFor && (
            <>
              {' '}
              This chart is {countryName}, not {standInFor}: the growth and
              deflator path the approaches are projected on is bundled for{' '}
              {countryName} only.
            </>
          )}
        </>
      }
    >
      {paths && (
        <LineChart
          title={`${countryName}: the nominal rate on government debt under all three approaches`}
          subtitle="Percent. All three take the observed rate through the WEO horizon and part company after it."
          series={series}
          height={340}
          weoBoundaryYear={WEO_MAX_YEAR}
          // The whole observed series is WEO, back to 2001.
          historyStart={0}
          format={(v) => `${v.toFixed(1)}%`}
        />
      )}
    </ContextFrame>
  );
}
