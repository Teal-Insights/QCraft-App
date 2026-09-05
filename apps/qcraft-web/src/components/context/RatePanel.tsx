import { releaseFor } from '../../content/modes';
import { useMemo, useState } from 'react';

import { LineChart } from '../LineChart';
import type { CountryContext, EngineResult } from '../../engine/types';
import { GUIDE_URLS } from '../../content/guidance';
import type { ChartPoint, ChartSeries } from '../../charts/types';
import { context as contextTheme } from '../../theme';
import {
  GOLDEN_MASTER_ISO3C,
  GOLDEN_MASTER_VINTAGE,
  GM_INFLATION,
  GM_PRODUCTIVITY_GROWTH,
  SOURCES,
  WDI_MAX_YEAR,
  WEO_MAX_YEAR,
  contextCountryName,
} from '../../context/sources';
import {
  distribution,
  peerCountry,
  peerScopeLabel,
  peerScopePhrase,
  percentileOf,
  placeInWords,
  statValue,
  type PeerScope,
} from '../../context/peers';
import {
  endValue,
  pathsAgree,
  pointsOf,
  growthOf,
  valueAt,
} from '../../context/model';
import { ContextFrame } from './ContextFrame';
import { ContextChoice } from './ContextChoice';
import { PeerStrips, type StripSpec } from './PeerStrips';
import { RationaleAction } from './RationaleAction';

export type RateKind = 'productivity' | 'inflation';

type View = 'record' | 'peers';

const VIEWS: Array<{ value: View; label: string }> = [
  { value: 'record', label: 'This country' },
  { value: 'peers', label: 'All countries' },
];

/**
 * Everything that differs between the two parameters, as data rather than as
 * branches scattered through the render.
 */
const KIND = {
  productivity: {
    unit: 'Labour productivity growth',
    title:
      'Your long-run productivity number is a claim about catch-up, and the ' +
      'record is the thing it has to be defended against',
    recordLabel: 'World Bank record',
    /**
     * The record stops in 2022 and the engine does not read it after that: from
     * 2023 to 2029 it back-calculates productivity as the residual of WEO real
     * GDP growth and employment growth (SHARED/DATA-NOTES.md section 6). That
     * is a genuinely different kind of number, so it gets its own label.
     */
    bridgeLabel: 'Implied by the WEO forecast',
    recordEnd: WDI_MAX_YEAR,
    /**
     * Shade only the back-calculated stretch. The World Bank years to its left
     * are not WEO data and must not be painted as if they were.
     */
    shadeFrom: WDI_MAX_YEAR + 1,
    standfirstTail:
      'The record to the left of the shaded band is World Bank; the shaded ' +
      'band is what the WEO forecast implies; everything past the rule is your ' +
      'assumption.',
    // A function of the vintage in both specs, so the call site is one shape.
    source: () => SOURCES.productivity,
    footnote:
      'Between 2023 and 2029 the engine stops reading the World Bank series and ' +
      'back-calculates productivity as the residual of WEO real GDP growth and ' +
      'employment growth, so your start value first does work in 2030.',
    /**
     * Ordered so the row the start value is anchored by comes first. The
     * residual is not a productivity forecast: it absorbs everything the model
     * does not otherwise explain, which is why the row says implied rather than
     * measured.
     */
    rows: [
      {
        stat: 'productivity_weo_residual',
        label: 'Implied by the WEO forecast',
        // How a caption names the row mid-sentence. The row label is a heading
        // and reads as one ("Realised, long run"); a sentence needs a noun
        // phrase, or the caption says "the median for median, 2014 to 2023".
        captionName: 'the growth the WEO forecast implies',
        sublabel: 'Pinned reference window, 2023 to 2029',
        marks: 'start',
      },
      {
        stat: 'productivity_hist_decade',
        label: 'Realised, last decade',
        captionName: 'realised growth over the last decade',
        sublabel: 'World Bank, 2013 to 2022',
        marks: null,
      },
      {
        stat: 'productivity_hist_long',
        label: 'Realised, long run',
        captionName: 'realised growth since 1992',
        sublabel: 'World Bank, 1992 to 2022',
        marks: 'end',
      },
    ],
    peerSource:
      'World Bank World Development Indicators for the realised rows, and IMF ' +
      'World Economic Outlook real GDP growth net of UN working-age population ' +
      'growth for the implied row. These peer statistics retain their stated windows; they are not recalculated for the selected full-horizon run.',
  },
  inflation: {
    unit: 'GDP deflator growth',
    title:
      'The nominal anchor for the whole projection, against what this economy ' +
      'has actually run',
    recordLabel: 'WEO record',
    bridgeLabel: null,
    recordEnd: WEO_MAX_YEAR,
    /** The whole record is WEO, so the band runs from the first year drawn. */
    shadeFrom: 0,
    standfirstTail:
      'The shaded band is WEO data, history and forecast together; everything ' +
      'past the rule is your assumption.',
    source: SOURCES.macrofiscal,
    footnote: null,
    /**
     * Two history windows because they differ by several points for the
     * countries this training serves: the long window carries the 2000s
     * commodity cycle, the short one is closer to the current regime.
     */
    rows: [
      {
        stat: 'inflation_weo_last',
        label: 'WEO forecast for 2029',
        captionName: 'the WEO forecast for 2029',
        sublabel: 'Pinned reference year; the selected Current window may end later',
        marks: 'start',
      },
      {
        stat: 'inflation_recent_median',
        label: 'Median, 2014 to 2023',
        captionName: 'deflator growth since 2014',
        sublabel: 'the recent regime',
        marks: 'end',
      },
      {
        stat: 'inflation_hist_median',
        label: 'Median, 2001 to 2023',
        captionName: 'deflator growth since 2001',
        sublabel: 'the whole WEO history',
        marks: null,
      },
    ],
    peerSource:
      'IMF World Economic Outlook, GDP deflator growth. The GDP deflator is ' +
      'not the consumer price index a central bank targets, so a country ' +
      'running a 5% CPI target will not generally show 5% here.',
  },
} as const;

interface Props {
  kind: RateKind;
  result: EngineResult | null;
  context: CountryContext | null;
  iso3c: string;
  start: number;
  end: number;
  /** Productivity only: the logistic Turning Point, years past the WEO boundary. */
  turningPoint?: number;
  startLabel: string;
  endLabel: string;
  slug: string;
  vintage: string;
  scope: PeerScope;
  onScopeChange: (scope: PeerScope) => void;
  note: string;
  onNoteChange: (note: string) => void;
}

export function RatePanel({
  kind,
  result,
  context,
  iso3c,
  start,
  end,
  turningPoint,
  startLabel,
  endLabel,
  slug,
  vintage,
  scope,
  onScopeChange,
  note,
  onNoteChange,
}: Props) {
  const spec = KIND[kind];
  const [view, setView] = useState<View>('record');
  const countryName = context?.countryName ?? peerCountry(iso3c)?.name ?? contextCountryName(iso3c);
  const boundary = result?.weoBoundaryYear;
  const rows = result?.baselineContext;
  const wdiEnd = result?.horizonPolicy?.wdiLastYear ?? WDI_MAX_YEAR;
  const live = result?.iso3c === iso3c && result.provenance.dataVintage === vintage;
  const record = useMemo(() => {
    if (!live || boundary == null) return [];
    if (kind === 'inflation') return (rows ?? [])
      .filter(r => r.years <= boundary && Number.isFinite(r.gdp_deflator_growth_percent))
      .map(r => ({ year: r.years, value: r.gdp_deflator_growth_percent }));
    const levels = new Map((context?.input.productivity ?? [])
      .filter(r => r.iso3c === iso3c).map(r => [r.years, r.productivity_level]));
    return growthOf(levels, 2001, wdiEnd);
  }, [live, boundary, kind, rows, context, iso3c, wdiEnd]);
  const selected = useMemo(() => (live ? rows ?? [] : [])
    .filter(r => Number.isFinite(kind === 'productivity' ? r.labour_productivity_growth : r.gdp_deflator_growth_percent))
    .map(r => ({ year: r.years, value: kind === 'productivity' ? r.labour_productivity_growth : r.gdp_deflator_growth_percent })),
  [live, rows, kind]);
  const assumption = useMemo(() => selected.filter(p => boundary != null && p.year > boundary), [selected, boundary]);
  const bridge = useMemo(() => kind === 'productivity' ? selected.filter(p => boundary != null && p.year > wdiEnd && p.year <= boundary) : [], [selected, boundary, wdiEnd, kind]);
  const available = record.length > 0 || selected.length > 0;
  const turningPointMarker = useMemo(() => {
    if (kind !== 'productivity' || turningPoint == null || boundary == null) return null;
    const year = boundary + turningPoint;
    const value = valueAt(assumption, year);
    return value == null ? null : { year, value };
  }, [kind, turningPoint, boundary, assumption]);
  const inForce = useMemo((): ChartPoint[] => {
    if (iso3c !== GOLDEN_MASTER_ISO3C || vintage !== GOLDEN_MASTER_VINTAGE) return [];
    return pointsOf(kind === 'productivity' ? GM_PRODUCTIVITY_GROWTH : GM_INFLATION, WEO_MAX_YEAR + 1, 2099);
  }, [kind, iso3c, vintage]);

  const agrees = inForce.length > 0 && pathsAgree(assumption, inForce);
  const showInForce = live && available && inForce.length > 0 && !agrees;

  const series = useMemo((): ChartSeries[] => {
    if (!available) return [];

    const out: ChartSeries[] = [
      {
        key: 'record',
        label: spec.recordLabel,
        color: contextTheme.record,
        points: record,
        emphasis: true,
      },
    ];

    // The WEO-implied bridge years, for productivity only.
    if (spec.bridgeLabel) {
      if (bridge.length) {
        out.push({
          key: 'bridge',
          label: spec.bridgeLabel,
          color: contextTheme.record,
          points: bridge,
          dashed: true,
        });
      }
    }

    if (showInForce) {
      out.push({
        key: 'in-force',
        label: 'Frozen Uganda workbook reference',
        color: contextTheme.inForce,
        points: inForce,
        dashed: true,
      });
    }

    out.push({
      key: 'assumption',
      label: 'Selected run after WEO',
      color: contextTheme.chosen,
      points: assumption,
      emphasis: true,
      directLabel: true,
    });

    return out;
  }, [available, spec, record, bridge, showInForce, inForce, assumption]);

  const recordEndValue = endValue(record);
  const assumptionAt2050 = valueAt(assumption, 2050);
  const assumptionEnd = endValue(assumption);

  const caption = !available ? (
    `Selected source/path data for ${iso3c} is unavailable or still loading.`
  ) : (
    <>
      You have set {startLabel.toLowerCase()} to <strong>{start.toFixed(1)}%</strong> and{' '}
      {endLabel.toLowerCase()} to <strong>{end.toFixed(1)}%</strong>, which converges to{' '}
      <strong>{assumptionAt2050 == null ? 'n/a' : `${assumptionAt2050.toFixed(1)}%`}</strong>{' '}
      by 2050 and <strong>{assumptionEnd == null ? 'n/a' : `${assumptionEnd.toFixed(1)}%`}</strong>{' '}
      by 2099. The last {kind === 'productivity' ? 'retained WDI growth value' : 'WEO deflator value'} is{' '}
      <strong>{recordEndValue == null ? 'n/a' : `${recordEndValue.toFixed(1)}%`}</strong>.
      {turningPointMarker && (
        <>
          {' '}
          Turning Point: <strong>{turningPointMarker.year}</strong>, {turningPoint} years after{' '}
          {boundary}. Higher values shift the transition later.
        </>
      )}
      {showInForce &&
        ' Projection charts use your selected assumptions. The dashed grey path is the golden-master comparison.'}
    </>
  );

  const footnote = <>
    {kind === 'productivity' ? `After WDI ends in ${wdiEnd}, the bridge through ${boundary ?? 'H'} is the selected run’s residual: (1 + real GDP growth)/(1 + employment growth) − 1. It is not a direct IMF productivity forecast. ` : 'WEO values include estimates and projections; no reliable outturn cutoff is available here. '}
    {`The long-run controls apply from ${boundary == null ? 'H+1' : boundary + 1}; their start value governs convergence rather than prescribing an exact first-year rate. `}
    <a href={GUIDE_URLS.productivity}>Method and source dates</a>.
    {showInForce && ' The additional grey line is the frozen Uganda workbook reference, not the selected run.'}
  </>;

  // ── The peer view ─────────────────────────────────────────────────────────
  const pct = (value: number) => `${value.toFixed(1)}%`;
  const settings: Record<'start' | 'end', { value: number; label: string }> = {
    start: { value: start, label: `Your start ${pct(start)}` },
    end: { value: end, label: `Your long run ${pct(end)}` },
  };
  const strips: StripSpec[] = spec.rows.map((row) => ({
    stat: row.stat,
    label: row.label,
    sublabel: row.sublabel,
    setting: row.marks ? settings[row.marks] : undefined,
  }));

  const groupName = peerScopeLabel(iso3c, scope);
  /** The row the long-run setting is marked on carries the peer caption. */
  const anchorRow = spec.rows.find((row) => row.marks === 'end') ?? spec.rows[0];
  const anchorDist = distribution(vintage, iso3c, scope, anchorRow.stat);
  const anchorValue = statValue(vintage, iso3c, anchorRow.stat);

  const peerCaption = !anchorDist ? (
    `The bundled reference set has too few observations in ${groupName} to draw a distribution.`
  ) : (
    <>
      Across {peerScopePhrase(iso3c, scope, anchorDist.points.length)}, the
      median for {anchorRow.captionName} is{' '}
      <strong>{pct(anchorDist.median)}</strong>, with a middle half running{' '}
      {pct(anchorDist.p25)} to {pct(anchorDist.p75)}.{' '}
      {anchorValue !== undefined && (
        <>
          {countryName} is at <strong>{pct(anchorValue)}</strong>,{' '}
          {placeInWords(percentileOf(anchorDist, anchorValue))} of the group.{' '}
        </>
      )}
      Your long-run setting of <strong>{pct(end)}</strong> sits{' '}
      {placeInWords(percentileOf(anchorDist, end))} of what those countries have
      recorded.
    </>
  );

  const sentence = anchorDist
    ? `${endLabel} ${pct(end)}: ${groupName} median ${pct(anchorDist.median)}, middle half ${pct(anchorDist.p25)} to ${pct(anchorDist.p75)}${anchorValue === undefined ? '' : `, ${countryName} at ${pct(anchorValue)}`}.`
    : `${endLabel} ${pct(end)}.`;

  return (
    <ContextFrame
      slug={slug}
      title={
        view === 'record'
          ? spec.title
          : `${spec.unit} across countries, with ${countryName} marked`
      }
      standfirst={
        view === 'record'
          ? `${spec.unit} for ${countryName}, in percent. WEO boundary ${boundary ?? 'unavailable'}; the line after it is read from the selected engine result.`
          : `Every country in the group as one tick. The band is the middle half, ` +
            `the rule is the median, and the dashed markers are your settings.`
      }
      caption={view === 'record' ? caption : peerCaption}
      source={view === 'record' ? <>{kind === 'productivity' ? SOURCES.productivity : `${releaseFor(vintage, 'macrofiscal')}; usable values through ${boundary}.`} Selected country inputs and baseline engine output. {showInForce && SOURCES.goldenMaster}</> : <>{spec.peerSource} Pinned reference statistics through 2029, not the refreshed run’s forecast endpoint.</>}
      footnote={view === 'record' ? footnote : undefined}
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
      {view === 'record' ? (
        available && (
          <LineChart
            title={`${countryName}: ${spec.unit.toLowerCase()}, record and assumption`}
            subtitle="Annual growth, percent."
            series={series}
            height={340}
            weoBoundaryYear={boundary ?? 0}
            historyStart={kind === 'productivity' ? wdiEnd + 1 : 0}
            zeroLine
            format={(v) => `${v.toFixed(1)}%`}
            annotations={
              turningPointMarker
                ? [
                    {
                      year: turningPointMarker.year,
                      value: turningPointMarker.value,
                      text: `Turning Point, ${turningPointMarker.year}`,
                      color: contextTheme.chosen,
                      place: 'above',
                    },
                  ]
                : undefined
            }
          />
        )
      ) : (
        <PeerStrips
          iso3c={iso3c}
          countryName={countryName}
          vintage={vintage}
          scope={scope}
          onScopeChange={onScopeChange}
          strips={strips}
          sharedDomain
          format={pct}
          emptyText={`No bundled reference data for ${iso3c}.`}
        />
      )}
    </ContextFrame>
  );
}
