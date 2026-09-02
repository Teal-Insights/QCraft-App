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
 *
 * ── The second view, added in run 5 ───────────────────────────────────────────
 * The record view is Uganda-only, because the growth and deflator paths the
 * three approaches are projected on are golden-master output. The peer view is
 * not: the effective rate and its gap to nominal GDP growth are computed for
 * every country straight out of WEO, so the "where do I sit" question is
 * answerable for all 175 even while the projection question is answerable for
 * one.
 *
 * There is no dashed setting marker on these rows, because the parameter is a
 * choice among three rules rather than a number on this axis. What the strips
 * carry instead is the fact that decides which rule matters: the rate-growth
 * differential is negative for roughly nine countries in ten, so the three
 * approaches are three answers to how long that stays true.
 */

import { useMemo, useState } from 'react';

import { LineChart } from '../LineChart';
import type { ChartSeries } from '../../charts/types';
import { context as contextTheme } from '../../theme';
import { INTEREST_RATE_MODE_HELP } from '../../content/guidance';
import {
  GM_DEFLATOR_GROWTH,
  GM_NOMINAL_GDP_GROWTH,
  GOLDEN_MASTER_ISO3C,
  GOLDEN_MASTER_VINTAGE,
  SOURCES,
  WEO_MAX_YEAR,
  contextCountryName,
  effectiveRate,
} from '../../context/sources';
import {
  endValue,
  fisherRealRate,
  interestRateApproaches,
  type RateApproach,
} from '../../context/model';
import {
  PEER_WEO_YEAR,
  distribution,
  peerCountry,
  peerScopeLabel,
  peerScopePhrase,
  percentileOf,
  placeInWords,
  statValue,
  type PeerScope,
} from '../../context/peers';
import { ContextFrame } from './ContextFrame';
import { ContextChoice } from './ContextChoice';
import { PeerStrips } from './PeerStrips';
import { RationaleAction } from './RationaleAction';

type View = 'record' | 'peers';

const VIEWS: Array<{ value: View; label: string }> = [
  { value: 'record', label: 'This country' },
  { value: 'peers', label: 'All countries' },
];

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
  /** Dashboard!C29: the real rate the constant-real approach holds, in percent. */
  longRunRealRate: number;
  slug: string;
  vintage: string;
  scope: PeerScope;
  onScopeChange: (scope: PeerScope) => void;
  note: string;
  onNoteChange: (note: string) => void;
}

export function InterestRatePanel({
  iso3c,
  mode,
  longRunRealRate,
  slug,
  vintage,
  scope,
  onScopeChange,
  note,
  onNoteChange,
}: Props) {
  const [view, setView] = useState<View>('record');
  // The driver series are golden-master output and exist for one country, so
  // the panel is drawn for that country whatever the sidebar says. Saying which
  // country matters more than silently relabelling the chart.
  const paths = useMemo(() => {
    // The golden master's vintage, not the mode's, and deliberately. The three
    // approaches are projected on the master's growth and deflator path, so the
    // observed rate they anchor on has to come from the same release or the
    // curves belong to neither. The source line below names the release, so a
    // reader in Current mode can see that this record view is the frozen one.
    // The peer view beside it is mode-correct for all 175 countries.
    const observed = effectiveRate(GOLDEN_MASTER_VINTAGE, GOLDEN_MASTER_ISO3C);
    return observed
      ? interestRateApproaches(observed, GM_NOMINAL_GDP_GROWTH, GM_DEFLATOR_GROWTH, longRunRealRate)
      : null;
  }, [longRunRealRate]);

  /**
   * The observed real rate by the workbook's Fisher relation, drawn so the
   * constant-real assumption is set against a record rather than a blank.
   */
  const observedReal = useMemo(() => {
    const observed = effectiveRate(GOLDEN_MASTER_VINTAGE, GOLDEN_MASTER_ISO3C);
    return observed ? fisherRealRate(observed, GM_DEFLATOR_GROWTH) : [];
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
      {
        key: 'observed-real',
        label: 'Observed real rate (Fisher)',
        color: contextTheme.record,
        points: observedReal,
        dashed: true,
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
  }, [paths, chosen, observedReal]);

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

  // ── The peer view ─────────────────────────────────────────────────────────
  const pct = (value: number) => `${value.toFixed(1)}%`;
  const points = (value: number) => `${value.toFixed(1)}`;
  const peerName = peerCountry(iso3c)?.name ?? contextCountryName(iso3c);
  const groupName = peerScopeLabel(iso3c, scope);
  const rateDist = distribution(vintage, iso3c, scope, 'interest_rate_weo_last');
  const gapDist = distribution(
    vintage,
    iso3c,
    scope,
    'interest_growth_differential_weo_last',
  );
  const ownRate = statValue(vintage, iso3c, 'interest_rate_weo_last');
  const ownGap = statValue(
    vintage,
    iso3c,
    'interest_growth_differential_weo_last',
  );
  const belowZero = gapDist
    ? gapDist.points.filter((p) => p.value < 0).length
    : 0;

  const peerCaption = !rateDist ? (
    `The bundled reference set has too few observations in ${groupName} to draw a distribution.`
  ) : (
    <>
      At {PEER_WEO_YEAR} the effective rate has a median of{' '}
      <strong>{pct(rateDist.median)}</strong> across{' '}
      {peerScopePhrase(iso3c, scope, rateDist.points.length)}.{' '}
      {ownRate !== undefined && (
        <>
          {peerName} is at <strong>{pct(ownRate)}</strong>,{' '}
          {placeInWords(percentileOf(rateDist, ownRate))} of the group.{' '}
        </>
      )}
      {gapDist && (
        <>
          The rate stays below nominal growth in{' '}
          <strong>
            {belowZero} of the {gapDist.points.length}
          </strong>
          {ownGap !== undefined && `, and by ${points(-ownGap)} points here`}, so
          the approach you pick is a choice about how long that lasts.
        </>
      )}
    </>
  );

  const sentence =
    ownRate === undefined || !rateDist
      ? `Interest-rate approach: ${chosen}.`
      : `${chosen}: ${peerName}'s effective rate is ${pct(ownRate)} at ${PEER_WEO_YEAR} against the ${groupName} median of ${pct(rateDist.median)}${ownGap === undefined ? '' : `, ${points(ownGap)} points versus growth`}.`;

  return (
    <ContextFrame
      slug={slug}
      title={
        view === 'record'
          ? 'Three ways to hold a rate fixed, and they do not converge'
          : `What ${peerName} is paying, against everyone else`
      }
      standfirst={
        view === 'record'
          ? INTEREST_RATE_MODE_HELP[chosen]
          : `Interest expenditure over the debt stock at ${PEER_WEO_YEAR}, and the ` +
            `same rate measured against nominal GDP growth. One tick per country.`
      }
      caption={view === 'record' ? caption : peerCaption}
      source={
        view === 'record' ? (
          <>
            {SOURCES.macrofiscal(GOLDEN_MASTER_VINTAGE)} The effective rate is derived in the workbook as
            interest expenditure divided by the SAME year&rsquo;s debt stock, not
            the prior year&rsquo;s, which is preserved for parity
            (SHARED/DATA-NOTES.md section 5b). Projected paths are computed on the
            golden master&rsquo;s own growth and deflator path: {SOURCES.goldenMaster}
          </>
        ) : (
          'IMF World Economic Outlook: interest expenditure over the same ' +
          'year\u2019s gross general government debt, the workbook\u2019s own ' +
          'definition. An average rate on the whole stock, not a marginal rate ' +
          'on new borrowing.'
        )
      }
      footnote={
        view === 'peers' ? undefined : (
        <>
          The three paths are what each rule implies on the projection currently
          on screen. The constant-real approach holds the real rate at{' '}
          {longRunRealRate.toFixed(1)}%, the long-run real interest rate set in
          the sidebar (the workbook&rsquo;s Dashboard cell C29). The dashed
          record is the observed real rate by the workbook&rsquo;s Fisher
          relation, nominal against the same year&rsquo;s deflator growth.
          {standInFor && (
            <>
              {' '}
              This chart is {countryName}, not {standInFor}: the growth and
              deflator path the approaches are projected on is bundled for{' '}
              {countryName} only.
            </>
          )}
        </>
        )
      }
      controls={
        <>
          <ContextChoice legend="View" choices={VIEWS} value={view} onChange={setView} />
          {view === 'peers' && (
            <RationaleAction
              sentence={sentence}
              current={note}
              onWrite={onNoteChange}
            />
          )}
        </>
      }
    >
      {view === 'peers' && (
        <PeerStrips
          iso3c={iso3c}
          countryName={peerName}
          vintage={vintage}
          scope={scope}
          onScopeChange={onScopeChange}
          format={pct}
          emptyText={`No bundled interest record for ${iso3c}.`}
          strips={[
            {
              stat: 'interest_rate_weo_last',
              label: `Effective rate on debt, ${PEER_WEO_YEAR}`,
              sublabel: 'interest bill over the debt stock',
            },
            {
              stat: 'interest_growth_differential_weo_last',
              label: 'Rate minus nominal GDP growth',
              sublabel: 'below zero means growth is outrunning the interest bill',
            },
          ]}
        />
      )}
      {view === 'record' && paths && (
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
