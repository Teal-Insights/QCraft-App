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
 */

import { useMemo } from 'react';

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
  endValue,
  inflationAssumption,
  inflationRecord,
  pathsAgree,
  pointsOf,
  productivityAssumption,
  productivityRecord,
  valueAt,
} from '../../context/model';
import { ContextFrame } from './ContextFrame';

export type RateKind = 'productivity' | 'inflation';

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
    source: SOURCES.productivity,
    footnote:
      'Between 2023 and 2029 the engine stops reading the World Bank series and ' +
      'back-calculates productivity as the residual of WEO real GDP growth and ' +
      'employment growth, so your start value first does work in 2030.',
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
  },
} as const;

interface Props {
  kind: RateKind;
  iso3c: string;
  start: number;
  end: number;
  startLabel: string;
  endLabel: string;
  slug: string;
}

export function RatePanel({
  kind,
  iso3c,
  start,
  end,
  startLabel,
  endLabel,
  slug,
}: Props) {
  const spec = KIND[kind];
  const available = hasContextData(iso3c);
  const countryName = contextCountryName(iso3c);

  const record = useMemo(
    () =>
      kind === 'productivity'
        ? productivityRecord(iso3c).filter((p) => p.year <= spec.recordEnd)
        : inflationRecord(iso3c),
    [kind, iso3c, spec.recordEnd],
  );

  const assumption = useMemo(
    () =>
      kind === 'productivity'
        ? productivityAssumption(start, end)
        : inflationAssumption(start, end),
    [kind, start, end],
  );

  /**
   * The path the charts on screen were computed with. Golden-master output, so
   * Uganda only; for any other country there is nothing truthful to draw and
   * the line is simply absent.
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
        label: 'Path this projection used',
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
      {showInForce &&
        ' The charts behind this panel were computed on the dashed grey path, not on yours.'}
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

  return (
    <ContextFrame
      slug={slug}
      title={spec.title}
      standfirst={`${spec.unit} for ${countryName}, in percent. ${spec.standfirstTail}`}
      caption={caption}
      source={
        <>
          {spec.source} Projected paths are engine output: {SOURCES.goldenMaster}
        </>
      }
      footnote={spec.footnote || showInForce ? footnote : undefined}
    >
      {available && (
        <LineChart
          title={`${countryName}: ${spec.unit.toLowerCase()}, record and assumption`}
          subtitle="Annual growth, percent."
          series={series}
          height={340}
          weoBoundaryYear={WEO_MAX_YEAR}
          historyStart={spec.shadeFrom}
          zeroLine
          format={(v) => `${v.toFixed(1)}%`}
        />
      )}
    </ContextFrame>
  );
}
