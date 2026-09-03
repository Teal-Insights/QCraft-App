/**
 * Widget 2: where growth comes from.
 *
 * ── The one idea ──────────────────────────────────────────────────────────────
 * Nominal GDP growth is not an assumption you set. It is an assembly of three
 * things you set separately, and the assembly is a product rather than a sum.
 * More workers, times more output per worker, times higher prices. Every
 * projection in the Explorer stands on that skeleton, and the debt equation
 * next door takes its g straight from it.
 *
 * ── Why a stacked chart with a fourth band ────────────────────────────────────
 * The bands are the three inputs plus the compounding term, and they sum to the
 * total exactly. See models/growthPath.ts: (1+e)(1+p)(1+pi) - 1 exceeds
 * e + p + pi, and hiding that residual inside one of the other bands would make
 * the chart a lie about a rule the engine is strict on. Naming it turns the
 * error into the lesson.
 *
 * ── The default state ─────────────────────────────────────────────────────────
 * Uganda, Medium variant, Explorer defaults, 2030 to 2099. That default already
 * tells the whole story without a single drag: nominal growth of about 13% in
 * 2030 falls to about 5% by 2099, and the reason is legible in the bands. The
 * productivity band collapses as its logistic converges, the employment band
 * thins as the demographic dividend closes, and what is left at the end is
 * mostly the inflation target. Anyone who has ever wondered why long-horizon
 * debt projections turn upward late in the century is looking at the answer.
 *
 * The demography selector is the control worth pressing in a room. It is the
 * only one of the five that a ministry cannot legislate, and under the UN WPP
 * Low variant Uganda's working-age population starts SHRINKING in the 2090s,
 * which pushes that band below the zero line.
 */

import { useMemo, useState } from 'react';

import { StackedAreaChart, type StackBand, type StackRow } from '../charts/StackedAreaChart';
import { ChoiceGroup } from '../shell/ChoiceGroup';
import { Legend } from '../shell/Legend';
import { PredictFirst } from '../shell/PredictFirst';
import { Slider } from '../shell/Slider';
import { WidgetFrame } from '../shell/WidgetFrame';
import { transitionDuration } from '../shell/motion';
import { brand, series as palette } from '../../theme';
import {
  DEMOGRAPHY_VARIANTS,
  GROWTH_DEFAULTS,
  growthPath,
  type DemographyVariant,
  type GrowthInputs,
} from '../models/growthPath';

/**
 * Band colours. Not the scenario palette, which encodes something else
 * entirely, and not brand chrome: these are four categorical data slots. The
 * three hues are the documented data-viz palette slots already validated on the
 * light surface in theme.ts; compounding takes a near-neutral because it is a
 * residual and should read as one, not as a fourth driver.
 */
const BANDS: StackBand[] = [
  { key: 'employment', label: 'More workers', color: '#4a3aa7' },
  { key: 'productivity', label: 'More output per worker', color: '#2a78d6' },
  { key: 'inflation', label: 'Higher prices', color: '#eb6834' },
  { key: 'compounding', label: 'Compounding', color: brand.line },
];

const TOTAL = {
  key: 'nominalGrowth',
  label: 'Nominal GDP growth',
  color: palette.baseline,
};

const VARIANT_CHOICES = DEMOGRAPHY_VARIANTS.map((value) => ({
  value,
  label: value,
  hint:
    value === 'Medium'
      ? 'The UN WPP central fertility projection. The Explorer default.'
      : value === 'High'
        ? 'Higher fertility: more workers arriving through the whole century.'
        : 'Lower fertility: the working-age population peaks and then shrinks.',
}));

const fmtPct = (v: number) => `${v.toFixed(1)}%`;
const fmtPoints = (v: number) => `${v.toFixed(1)}`;

export function GrowthWidget() {
  const [inputs, setInputs] = useState<GrowthInputs>(GROWTH_DEFAULTS);
  const [touched, setTouched] = useState(false);
  const duration = useMemo(transitionDuration, []);

  const path = useMemo(() => growthPath(inputs), [inputs]);

  const set = (patch: Partial<GrowthInputs>) => {
    setTouched(true);
    setInputs((prev) => ({ ...prev, ...patch }));
  };

  const rows = useMemo<StackRow[]>(
    () =>
      path.map((year) => ({
        year: year.year,
        employment: year.employment,
        productivity: year.productivity,
        inflation: year.inflation,
        compounding: year.compounding,
        nominalGrowth: year.nominalGrowth,
      })),
    [path],
  );

  const first = path[0];
  const last = path[path.length - 1];

  return (
    <WidgetFrame
      title="Growth is not one assumption, it is three multiplied together"
      standfirst="Uganda's nominal GDP growth from 2030 to 2099, built from the working-age population, output per worker and prices. The debt dynamics equation takes its g from exactly this."
      controls={
        <>
          <ChoiceGroup
            legend="Demography"
            choices={VARIANT_CHOICES}
            value={inputs.demographyVariant}
            onChange={(demographyVariant: DemographyVariant) => set({ demographyVariant })}
          />
          <Slider
            id="prod-start"
            label="Productivity, 2030"
            value={inputs.productivityStart}
            min={0}
            max={10}
            step={0.1}
            hint="Where the logistic transition starts."
            onChange={(productivityStart) => set({ productivityStart })}
          />
          <Slider
            id="prod-end"
            label="Productivity, long run"
            value={inputs.productivityEnd}
            min={0}
            max={6}
            step={0.1}
            hint="What it converges to. The band's shape is that convergence."
            onChange={(productivityEnd) => set({ productivityEnd })}
          />
          <Slider
            id="infl-start"
            label="Inflation, 2030"
            value={inputs.inflationStart}
            min={0}
            max={15}
            step={0.5}
            onChange={(inflationStart) => set({ inflationStart })}
          />
          <Slider
            id="infl-end"
            label="Inflation, long run"
            value={inputs.inflationEnd}
            min={0}
            max={15}
            step={0.5}
            hint="Usually the central bank's target."
            onChange={(inflationEnd) => set({ inflationEnd })}
          />

          <div className="wsplit">
            <span className="wsplit__item">
              <span className="wsplit__label">Growth in {first.year}</span>
              <span className="wsplit__value wsplit__value--flat">
                {fmtPct(first.nominalGrowth)}
              </span>
            </span>
            <span className="wsplit__item">
              <span className="wsplit__label">Growth in {last.year}</span>
              <span className="wsplit__value wsplit__value--flat">
                {fmtPct(last.nominalGrowth)}
              </span>
            </span>
          </div>
        </>
      }
      caption={caption(inputs.demographyVariant, first, last)}
      aside={
        <PredictFirst
          revealed={touched}
          question="By the end of the century, which adds more to Uganda's nominal growth: extra workers, or higher output per worker?"
          answer="Neither, on the default assumptions. Both fade to about a point, and most of what is left is the inflation target."
        />
      }
      footnote="Real growth is the workers band times the productivity band. Nominal growth adds prices on top, which is why it is the larger number and why it, not real growth, is the g in the debt dynamics equation."
    >
      <Legend items={[...BANDS, TOTAL].map((b) => ({ ...b, key: b.key }))} />
      <StackedAreaChart
        rows={rows}
        bands={BANDS}
        total={TOTAL}
        duration={duration}
        format={fmtPct}
        yLabel="Contribution to nominal GDP growth, percentage points"
        ariaLabel="Stacked contributions of employment, productivity, inflation and compounding to Uganda's nominal GDP growth, 2030 to 2099"
      />
    </WidgetFrame>
  );
}

/**
 * The dynamic caption.
 *
 * Built from the first and last year of whatever is currently on screen, and
 * from the one comparison a reader cannot make by eye: which band is doing the
 * most work at the end. The demography branch fires only when the working-age
 * band has actually gone negative, because that is the moment the sentence has
 * something new to say.
 */
function caption(
  variant: DemographyVariant,
  first: ReturnType<typeof growthPath>[number],
  last: ReturnType<typeof growthPath>[number],
) {
  const shrinking = last.employment < 0;
  const largest = ([
    ['workers', last.employment],
    ['output per worker', last.productivity],
    ['prices', last.inflation],
  ] as const).reduce((a, b) => (b[1] > a[1] ? b : a));

  return (
    <>
      In <strong>{first.year}</strong> nominal growth is{' '}
      <strong>{fmtPct(first.nominalGrowth)}</strong>: {fmtPoints(first.employment)} points
      from more workers, {fmtPoints(first.productivity)} from output per worker and{' '}
      {fmtPoints(first.inflation)} from prices. By <strong>{last.year}</strong> it is{' '}
      <strong>{fmtPct(last.nominalGrowth)}</strong>, and{' '}
      <strong>{largest[0]}</strong> is the largest piece left.{' '}
      {shrinking ? (
        <>
          On the {variant} variant Uganda's working-age population is{' '}
          <strong>shrinking</strong> by then, so that band sits below the line and takes{' '}
          {fmtPoints(Math.abs(last.employment))} points off growth rather than adding
          them.
        </>
      ) : (
        <>
          The demographic dividend has thinned to{' '}
          {fmtPoints(last.employment)} points but has not turned negative on the {variant}{' '}
          variant.
        </>
      )}
    </>
  );
}
