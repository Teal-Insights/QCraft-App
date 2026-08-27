/**
 * Demography variant: what the UN's three variants actually mean for this
 * country, and how that compares with somewhere else.
 *
 * The chart is population growth rather than population level because growth is
 * what the engine consumes: working-age growth becomes employment growth in the
 * production function, and total population growth is what primary spending
 * grows with. A level chart would be prettier and would answer a question
 * nobody asks of this parameter.
 *
 * Colour does two jobs at once here, which is usually a mistake and is not one:
 * the selected country's three variants take an ordinal ramp (Low to High is a
 * real ordering, so the reader should see the order in the colour), and each
 * comparator takes its own hue and is drawn at the Medium variant only. Nine
 * lines would be unreadable; five is fine, and the legend names the variant on
 * every comparator so the two encodings cannot be confused.
 *
 * ── The second view, added in run 5 ───────────────────────────────────────────
 * The comparator picker compares this country with two others the fixture set
 * happens to carry. The peer view compares it with every country the Explorer
 * can select, on the two things the variant choice decides: how fast the
 * working-age population grows at mid-horizon, and how much the choice between
 * Low and High is worth.
 *
 * The distribution is drawn on the Medium variant for every country, because a
 * distribution mixing variants would be a comparison of choices rather than of
 * countries. What moves with the sidebar is the marker: it sits at this
 * country's own value under the variant in force, so picking Low walks the
 * marker off the country mark by exactly what that choice costs.
 */

import { useMemo, useState } from 'react';

import { LineChart } from '../LineChart';
import type { ChartSeries } from '../../charts/types';
import { context as contextTheme } from '../../theme';
import {
  CONTEXT_COUNTRIES,
  SOURCES,
  contextCountryName,
  hasContextData,
  type DemographyMeasure,
} from '../../context/sources';
import { valueAt, variantGrowth, variantSpreadAt, variantsDivergeAfter } from '../../context/model';
import {
  PEER_DEMOGRAPHY_YEAR,
  distribution,
  peerCountry,
  peerScopeName,
  percentileOf,
  placeInWords,
  statValue,
  type PeerScope,
  type StatKey,
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

/** Which bundled column holds this country's own growth under each variant. */
const VARIANT_STAT: Record<Variant, StatKey> = {
  Low: 'demography_wa_growth_low',
  Medium: 'demography_wa_growth',
  High: 'demography_wa_growth_high',
};

/** Ordered Low to High, which is the order the colour ramp encodes. */
const VARIANTS = ['Low', 'Medium', 'High'] as const;
type Variant = (typeof VARIANTS)[number];

const MEASURES: Array<{ value: DemographyMeasure; label: string }> = [
  { value: 'working_age', label: 'Working age, 15 to 64' },
  { value: 'total', label: 'Total population' },
];

const MEASURE_ROLE: Record<DemographyMeasure, string> = {
  working_age:
    'Working-age growth becomes employment growth in the projection, so it is ' +
    'the channel that moves GDP.',
  total:
    'Total population growth is what primary spending grows with, so it is the ' +
    'channel that moves expenditure.',
};

/** The year captions read a mid-horizon comparison off. */
const COMPARISON_YEAR = 2050;

interface Props {
  iso3c: string;
  variant: string;
  slug: string;
  vintage: string;
  scope: PeerScope;
  onScopeChange: (scope: PeerScope) => void;
  note: string;
  onNoteChange: (note: string) => void;
}

export function DemographyPanel({
  iso3c,
  variant,
  slug,
  vintage,
  scope,
  onScopeChange,
  note,
  onNoteChange,
}: Props) {
  const [measure, setMeasure] = useState<DemographyMeasure>('working_age');
  const [comparators, setComparators] = useState<string[]>(() =>
    // Opens with one comparator rather than none, because the panel's second
    // question ("is this normal?") cannot be asked of a single country, and
    // opens with one rather than two so the selected country stays the subject.
    CONTEXT_COUNTRIES.filter((c) => c.iso3c !== iso3c)
      .slice(0, 1)
      .map((c) => c.iso3c),
  );

  const available = hasContextData(iso3c);
  const [view, setView] = useState<View>(available ? 'record' : 'peers');
  const countryName = peerCountry(iso3c)?.name ?? contextCountryName(iso3c);
  const chosen = (VARIANTS as readonly string[]).includes(variant)
    ? (variant as Variant)
    : 'Medium';

  const series = useMemo((): ChartSeries[] => {
    if (!available) return [];

    const own: ChartSeries[] = VARIANTS.map((v) => ({
      key: `${iso3c}-${v}`,
      label: `${countryName}, ${v}`,
      color: contextTheme.variant[v],
      points: variantGrowth(iso3c, measure, v),
      emphasis: v === chosen,
      directLabel: v === chosen,
    }));

    const others: ChartSeries[] = comparators.map((other, i) => ({
      key: `${other}-Medium`,
      label: `${contextCountryName(other)}, Medium`,
      color: contextTheme.comparator[i % contextTheme.comparator.length],
      points: variantGrowth(other, measure, 'Medium'),
      directLabel: true,
    }));

    return [...own, ...others];
  }, [available, iso3c, countryName, measure, chosen, comparators]);

  const diverge = variantsDivergeAfter(iso3c, measure);
  const spread = variantSpreadAt(iso3c, measure, COMPARISON_YEAR);
  const chosenPoints = series.find((s) => s.key === `${iso3c}-${chosen}`)?.points ?? [];
  const chosenAt = valueAt(chosenPoints, COMPARISON_YEAR);

  const measureLabel = measure === 'working_age' ? 'working-age' : 'total';

  const caption = !available ? (
    `No bundled population data for ${iso3c}. The context set covers ` +
    `${CONTEXT_COUNTRIES.map((c) => c.name).join(', ')}.`
  ) : (
    <>
      On the {chosen} variant {countryName}&rsquo;s {measureLabel} population grows{' '}
      <strong>{chosenAt == null ? 'n/a' : `${chosenAt.toFixed(2)}%`}</strong> in{' '}
      {COMPARISON_YEAR}, and the three variants are{' '}
      <strong>{spread == null ? 'n/a' : `${spread.toFixed(2)} points`}</strong> apart
      that year.{' '}
      {diverge != null &&
        `Your choice changes nothing before ${diverge + 1}: everyone in that ` +
          `population is already born.`}
    </>
  );

  // ── The peer view ─────────────────────────────────────────────────────────
  const pct = (value: number) => `${value.toFixed(2)}%`;
  const points = (value: number) => `${value.toFixed(2)}`;
  const ownAtVariant = statValue(vintage, iso3c, VARIANT_STAT[chosen]);
  const groupName = peerScopeName(iso3c, scope);
  const growthDist = distribution(vintage, iso3c, scope, 'demography_wa_growth');
  const spreadDist = distribution(vintage, iso3c, scope, 'demography_variant_spread');
  const ownSpread = statValue(vintage, iso3c, 'demography_variant_spread');

  const peerCaption = !growthDist ? (
    `The bundled reference set has too few observations in ${groupName} to draw a distribution.`
  ) : (
    <>
      On the Medium variant, working-age growth in {PEER_DEMOGRAPHY_YEAR} has a
      median of <strong>{pct(growthDist.median)}</strong> across{' '}
      {growthDist.points.length} countries in {groupName}.{' '}
      {ownAtVariant !== undefined && (
        <>
          {countryName} on the {chosen} variant is at{' '}
          <strong>{pct(ownAtVariant)}</strong>,{' '}
          {placeInWords(percentileOf(growthDist, ownAtVariant))} of the group.{' '}
        </>
      )}
      {ownSpread !== undefined && spreadDist && (
        <>
          Choosing between Low and High is worth{' '}
          <strong>{points(ownSpread)} points</strong> of growth here, against a
          group median of {points(spreadDist.median)} points.
        </>
      )}
    </>
  );

  const sentence =
    ownAtVariant === undefined || !growthDist
      ? `Demography variant ${chosen}.`
      : `${chosen} variant: ${countryName} working-age growth ${pct(ownAtVariant)} in ${PEER_DEMOGRAPHY_YEAR}, against the ${groupName} median of ${pct(growthDist.median)} on Medium.`;

  return (
    <ContextFrame
      slug={slug}
      title={
        view === 'record'
          ? `The UN publishes three futures, and they only part company after ${
              diverge != null ? diverge : 'the estimate period'
            }`
          : `Where ${countryName} sits on the growth the variant choice decides`
      }
      standfirst={
        view === 'record'
          ? `Population growth under each variant. ${MEASURE_ROLE[measure]}`
          : `Working-age growth in ${PEER_DEMOGRAPHY_YEAR}, one tick per country, ` +
            `every country on its Medium variant. The dashed marker is this ` +
            `country on the variant you have chosen.`
      }
      caption={view === 'record' ? caption : peerCaption}
      source={SOURCES.demography}
      controls={
        <>
          <ContextChoice legend="View" choices={VIEWS} value={view} onChange={setView} />
          {view === 'record' ? (
            <>
              <ContextChoice
                legend="Measure"
                choices={MEASURES}
                value={measure}
                onChange={setMeasure}
              />
              <ContextChoice
                legend="Compare with"
                multiple
                choices={CONTEXT_COUNTRIES.filter((c) => c.iso3c !== iso3c).map((c) => ({
                  value: c.iso3c,
                  label: c.name,
                }))}
                value={comparators}
                onChange={setComparators}
              />
            </>
          ) : (
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
          countryName={countryName}
          vintage={vintage}
          scope={scope}
          onScopeChange={onScopeChange}
          format={pct}
          emptyText={`No bundled population data for ${iso3c}.`}
          strips={[
            {
              stat: 'demography_wa_growth',
              label: `Working-age growth in ${PEER_DEMOGRAPHY_YEAR}`,
              sublabel: 'Medium variant, every country',
              setting:
                ownAtVariant === undefined
                  ? undefined
                  : {
                      value: ownAtVariant,
                      label: `${countryName} on ${chosen}`,
                    },
            },
            {
              stat: 'demography_variant_spread',
              label: 'What the variant choice is worth',
              sublabel: `High minus Low, in points of growth at ${PEER_DEMOGRAPHY_YEAR}`,
            },
          ]}
        />
      )}
      {view === 'record' && available && (
        <LineChart
          title={`${countryName} population growth, UN Low, Medium and High variants`}
          subtitle="Annual growth, percent. Comparator countries are shown at the Medium variant."
          series={series}
          height={340}
          zeroLine
          format={(v) => `${v.toFixed(2)}%`}
          annotation={
            diverge != null && chosenPoints.length
              ? {
                  year: diverge,
                  value: valueAt(chosenPoints, diverge) ?? 0,
                  text: `Variants identical to ${diverge}`,
                }
              : undefined
          }
        />
      )}
    </ContextFrame>
  );
}
