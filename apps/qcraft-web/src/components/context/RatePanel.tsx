/**
 * Productivity and inflation: the record, and the assumption sitting against it.
 *
 * One component for both because the two parameters have the same shape (a
 * start value and a long-run value converging on the engine's logistic) and the
 * same question ("is that number like anything this country has done?"). What
 * differs is the source of the record and the turning point of the curve, both
 * of which are data.
 *
 * ── Three lines, and why the third is not decoration ──────────────────────────
 * THE RECORD is the published series. THE ASSUMPTION is what the sidebar
 * currently implies. IN FORCE is the path the projection on screen actually
 * used, drawn only when it differs from the assumption.
 *
 * That third line exists because the fixture-backed adapter cannot recompute:
 * moving a slider changes the assumption line and does not change the debt
 * charts. Rather than let the panel imply an influence the app does not have,
 * the panel draws both and names the gap. It also surfaces a real defect at the
 * default settings for inflation, where `constants.py` publishes a start of
 * 5.0 that the golden masters contradict. See
 * .change-requests/INFLATION-DEFAULT-2026-08-26.md.
 *
 * ── The second view, added in run 5 ───────────────────────────────────────────
 * The record view answers "is that number like anything this country has done".
 * The peers view answers "is it like anything anyone has done", which is the
 * question a user asks next and could not previously ask inside the tool.
 *
 * The rows are deliberately not one statistic. For productivity the bundle
 * carries three readings that disagree by more than a point of growth, and the
 * one closest to what the parameter sets is the WEO-implied residual rather than
 * either realised series. Showing one row would have meant choosing which
 * disagreement to hide. docs/parameter-data.md section 4.
 */

import { useMemo, useState } from 'react';

import { LineChart } from '../LineChart';
import type { ChartPoint, ChartSeries } from '../../charts/types';
import { context as contextTheme } from '../../theme';
import {
  GM_INFLATION,
  GM_PRODUCTIVITY_GROWTH,
  SOURCES,
  WDI_MAX_YEAR,
  WEO_MAX_YEAR,
  contextCountryName,
  hasContextData,
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
  inflationAssumption,
  inflationRecord,
  pathsAgree,
  pointsOf,
  turningPointYear,
  productivityAssumption,
  productivityRecord,
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
        sublabel: '2023 to 2029, the years the engine reads a residual',
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
      'growth for the implied row. Method in docs/parameter-data.md section 4.',
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
        sublabel: 'the year the record hands over to your assumption',
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
  const available = hasContextData(iso3c);
  /**
   * The record view is fixture-backed and covers three countries; the peer view
   * covers all 175. A country outside the fixture set opens on the view that
   * has something to show rather than on an empty chart.
   */
  const [view, setView] = useState<View>(available ? 'record' : 'peers');
  const countryName = peerCountry(iso3c)?.name ?? contextCountryName(iso3c);

  const record = useMemo(
    () =>
      kind === 'productivity'
        ? productivityRecord(iso3c).filter((p) => p.year <= spec.recordEnd)
        : inflationRecord(vintage, iso3c),
    [kind, vintage, iso3c, spec.recordEnd],
  );

  const assumption = useMemo(
    () =>
      kind === 'productivity'
        ? productivityAssumption(start, end, turningPoint)
        : inflationAssumption(start, end),
    [kind, start, end, turningPoint],
  );

  /**
   * The workbook's Turning Point timing marker, drawn on the
   * assumption path so the parameter has a place on the chart rather than only
   * a number in the sidebar. Productivity only; the inflation Turning Point is
   * the workbook's fixed 5.
   */
  const turningPointMarker = useMemo(() => {
    if (kind !== 'productivity' || turningPoint == null) return null;
    const year = turningPointYear(turningPoint);
    const value = valueAt(assumption, year);
    return value == null ? null : { year, value };
  }, [kind, turningPoint, assumption]);

  /**
   * The golden master's own path for this rate, drawn as a comparison when the
   * user's assumption departs from it. Golden-master output, so Uganda only and
   * frozen-vintage only; for any other country there is nothing truthful to
   * draw and the line is simply absent.
   *
   * Labelled as the master rather than as "the path this projection used",
   * which it stopped being the moment the app ran two vintages and let a user
   * move the sliders. The record line beside it IS the mode's own record.
   */
  const inForce = useMemo((): ChartPoint[] => {
    const master = kind === 'productivity' ? GM_PRODUCTIVITY_GROWTH : GM_INFLATION;
    return pointsOf(master, WEO_MAX_YEAR + 1, 2099);
  }, [kind]);

  const agrees = inForce.length > 0 && pathsAgree(assumption, inForce);
  const showInForce = inForce.length > 0 && !agrees;

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
      const bridge = pointsOf(GM_PRODUCTIVITY_GROWTH, spec.recordEnd, WEO_MAX_YEAR);
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
        label: 'Golden master, at Explorer defaults',
        color: contextTheme.inForce,
        points: inForce,
        dashed: true,
      });
    }

    out.push({
      key: 'assumption',
      label: 'Your assumption',
      color: contextTheme.chosen,
      points: assumption,
      emphasis: true,
      directLabel: true,
    });

    return out;
  }, [available, spec, record, showInForce, inForce, assumption]);

  const recordEndValue = endValue(record);
  const assumptionAt2050 = valueAt(assumption, 2050);
  const assumptionEnd = endValue(assumption);

  const caption = !available ? (
    `No bundled source data for ${iso3c}.`
  ) : (
    <>
      You have set {startLabel.toLowerCase()} to <strong>{start.toFixed(1)}%</strong> and{' '}
      {endLabel.toLowerCase()} to <strong>{end.toFixed(1)}%</strong>, which converges to{' '}
      <strong>{assumptionAt2050 == null ? 'n/a' : `${assumptionAt2050.toFixed(1)}%`}</strong>{' '}
      by 2050 and <strong>{assumptionEnd == null ? 'n/a' : `${assumptionEnd.toFixed(1)}%`}</strong>{' '}
      by 2099. {countryName}&rsquo;s last recorded year ran at{' '}
      <strong>{recordEndValue == null ? 'n/a' : `${recordEndValue.toFixed(1)}%`}</strong>.
      {turningPointMarker && (
        <>
          {' '}
          Turning Point: <strong>{turningPointMarker.year}</strong>, {turningPoint} years after{' '}
          {WEO_MAX_YEAR}. Higher values shift the transition later.
        </>
      )}
      {showInForce &&
        ' Projection charts use your selected assumptions. The dashed grey path is the golden-master comparison.'}
    </>
  );

  const footnote = (
    <>
      {spec.footnote}
      {showInForce && kind === 'inflation' && (
        <>
          {' '}
          The gap at the opening defaults is a known discrepancy between
          constants.py and the golden masters, not a rounding artefact. See
          .change-requests/INFLATION-DEFAULT-2026-08-26.md.
        </>
      )}
    </>
  );

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
          ? `${spec.unit} for ${countryName}, in percent. ${spec.standfirstTail}`
          : `Every country in the group as one tick. The band is the middle half, ` +
            `the rule is the median, and the dashed markers are your settings.`
      }
      caption={view === 'record' ? caption : peerCaption}
      source={
        view === 'record' ? (
          <>
            {spec.source(vintage)} Projected paths are engine output:{' '}
            {SOURCES.goldenMaster}
          </>
        ) : (
          spec.peerSource
        )
      }
      footnote={
        view === 'record' ? (spec.footnote || showInForce ? footnote : undefined) : undefined
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
      {view === 'record' ? (
        available && (
          <LineChart
            title={`${countryName}: ${spec.unit.toLowerCase()}, record and assumption`}
            subtitle="Annual growth, percent."
            series={series}
            height={340}
            weoBoundaryYear={WEO_MAX_YEAR}
            historyStart={spec.shadeFrom}
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
