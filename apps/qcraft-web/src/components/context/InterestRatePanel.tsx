import { releaseFor } from '../../content/modes';
import { useMemo, useState } from 'react';

import { LineChart } from '../LineChart';
import type { EngineResult } from '../../engine/types';
import type { ChartSeries } from '../../charts/types';
import { context as contextTheme } from '../../theme';
import { INTEREST_RATE_MODE_HELP } from '../../content/guidance';
import {
  contextCountryName,
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
  result: EngineResult | null;
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
  result,
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
  const baseline = result?.baselineContext;
  const interest = result?.interestContext;
  const boundary = result?.weoBoundaryYear;
  const live = result?.iso3c === iso3c && result.provenance.dataVintage === vintage;
  const observed = useMemo(() => new Map((live ? interest ?? [] : [])
    .filter(r => boundary != null && r.years <= boundary && Number.isFinite(r.nominal_interest_rate))
    .map(r => [r.years, r.nominal_interest_rate])), [live, interest, boundary]);
  const inflation = useMemo(() => new Map((live ? baseline ?? [] : [])
    .map(r => [r.years, r.gdp_deflator_growth_percent])), [live, baseline]);
  const paths = useMemo(() => interestRateApproaches(observed,
    new Map((baseline ?? []).map(r => [r.years, r.nominal_gdp_growth_percent])),
    inflation, longRunRealRate), [observed, baseline, inflation, longRunRealRate]);
  const observedReal = useMemo(() => fisherRealRate(observed, inflation), [observed, inflation]);
  const countryName = result?.countryName ?? peerCountry(iso3c)?.name ?? contextCountryName(iso3c);
  const chosen = APPROACHES.includes(mode as RateApproach)
    ? (mode as RateApproach)
    : APPROACHES[0];

  const series = useMemo((): ChartSeries[] => {
    if (!paths) return [];
    return [
      {
        key: 'observed',
        label: 'WEO effective rate',
        color: contextTheme.record,
        points: paths.record,
        emphasis: true,
      },
      {
        key: 'observed-real',
        label: 'WEO real rate (Fisher)',
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
      {countryName}&rsquo;s WEO effective rate is{' '}
      <strong>{fmt(paths.anchorRate)}</strong> in {paths.anchorYear}. Its normalized
      interest-growth differential, (r−g)/(1+g), is{' '}
      <strong>{fmt(paths.anchorDifferential)}</strong>. You have chosen <strong>{SHORT[chosen]}</strong>, which ends at{' '}
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
            {releaseFor(vintage, 'macrofiscal')}; usable WEO values through {boundary}. Estimates and projections are not separated from outturns here. The effective rate is derived in the workbook as
            interest expenditure divided by the SAME year&rsquo;s debt stock, not
            the prior year&rsquo;s, which is preserved for parity
            in the selected input. The three comparison rules use this selected run’s baseline growth and deflator path.
          </>
        ) : (
          'IMF World Economic Outlook: interest expenditure over the same ' +
          'year\u2019s gross general government debt, the workbook\u2019s own ' +
          'definition. An average rate on the whole stock, not a marginal rate ' +
          'on new borrowing. These peer statistics are pinned to 2029, not the selected Current endpoint.'
        )
      }
      footnote={
        view === 'peers' ? undefined : (
        <>
          The three paths are what each rule implies on the projection currently
          on screen. The constant-real approach holds the real rate at{' '}
          {longRunRealRate.toFixed(1)}%, the long-run real interest rate set in
          the sidebar (the workbook&rsquo;s Dashboard cell C29). The dashed
          record is the WEO real rate by the workbook&rsquo;s Fisher
          relation, nominal against the same year&rsquo;s deflator growth.

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
          subtitle="Percent. All three take the selected WEO rate through the usable horizon and part company after it."
          series={series}
          height={340}
          weoBoundaryYear={boundary ?? 0}
          // The whole observed series is WEO, back to 2001.
          historyStart={0}
          format={(v) => `${v.toFixed(1)}%`}
        />
      )}
    </ContextFrame>
  );
}
