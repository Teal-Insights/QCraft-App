/**
 * Widget 3: how warming reaches the debt line.
 *
 * ── The one idea ──────────────────────────────────────────────────────────────
 * There is no climate term in the debt equation. People expect one, and its
 * absence is the single most common misreading of what Q-CRAFT does. Warming
 * reaches the debt ratio through exactly two doors that were already there:
 * it lowers g, and it moves the primary balance. This widget is those two doors
 * drawn one above the other.
 *
 * ── Why the layout is vertical ────────────────────────────────────────────────
 * The cause chart sits directly above the effect chart, sharing an x-axis span,
 * with a rule between them reading "which flows into". Vertical adjacency is
 * doing the work an arrow would do in a diagram: the growth deviation happens
 * first, the debt fan is what it becomes. Putting them side by side would say
 * "here are two charts about climate", which is a different and weaker claim.
 *
 * ── The default state ─────────────────────────────────────────────────────────
 * All six scenarios, at the engine's default rigidity of 1.0. The fan IS the
 * message, so it is what a trainer who never touches a control gets: six paths
 * pulling away from one baseline, spanning about 88 points of GDP by 2099. The
 * picker is a focus control, not a filter, so the fan never has to be assembled
 * by clicking.
 *
 * ── The control that carries the second idea ──────────────────────────────────
 * The rigidity slider. At 1.0 spending holds its baseline LEVEL while GDP is
 * smaller, so the expenditure ratio rises and the primary balance worsens: both
 * doors open. At 0.0 spending falls in step with GDP and the primary balance is
 * bit-for-bit the baseline's, so only the growth door is open and the fan
 * visibly narrows without closing. The residue is the whole point. Climate
 * would still reach the debt line through g even if a ministry could adjust
 * spending perfectly and instantly.
 *
 * Every number here is real Q-CRAFT output. See models/climateChannel.ts.
 */

import { useMemo, useState } from 'react';

import { AnimatedLineChart } from '../charts/AnimatedLineChart';
import type { WidgetSeries } from '../charts/types';
import { ChoiceGroup } from '../shell/ChoiceGroup';
import { Legend } from '../shell/Legend';
import { PredictFirst } from '../shell/PredictFirst';
import { Slider } from '../shell/Slider';
import { WidgetFrame } from '../shell/WidgetFrame';
import { transitionDuration } from '../shell/motion';
import { scenarioColor } from '../../selectors';
import { theme } from '../../theme';
import {
  DEFAULT_RIGIDITY,
  SCENARIO_DISPLAY_ORDER,
  SCENARIO_LABELS,
  YEAR_END,
  allChannelPaths,
  baselinePath,
  type ClimateScenario,
} from '../models/climateChannel';

/** "All" is a focus state, not a seventh scenario. */
type Focus = ClimateScenario | 'All';

const FOCUS_CHOICES: Array<{ value: Focus; label: string; color?: string; hint?: string }> = [
  { value: 'All', label: 'All six', hint: 'The fan. Every scenario against the baseline.' },
  ...SCENARIO_DISPLAY_ORDER.map((key) => ({
    value: key as Focus,
    label: SCENARIO_LABELS[key],
    color: scenarioColor(key),
  })),
];

const fmtPct = (v: number) => `${v.toFixed(1)}%`;
const fmtSigned = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}`;

export function ClimateChannelWidget() {
  const [rigidity, setRigidity] = useState(DEFAULT_RIGIDITY);
  const [focus, setFocus] = useState<Focus>('All');
  const [touched, setTouched] = useState(false);
  const duration = useMemo(transitionDuration, []);

  const baseline = useMemo(baselinePath, []);
  const paths = useMemo(() => allChannelPaths(rigidity), [rigidity]);
  /** The same scenarios with spending fully flexible: the growth door alone. */
  const growthOnly = useMemo(() => allChannelPaths(0), []);

  const isMuted = (key: ClimateScenario) => focus !== 'All' && focus !== key;

  const gdpSeries = useMemo<WidgetSeries[]>(
    () => [
      {
        key: 'Baseline',
        label: 'Baseline (no climate damage beyond the baseline)',
        color: theme.textMuted,
        points: baseline.map((row) => ({ year: row.year, value: 0 })),
      },
      ...paths.map((path) => ({
        key: path.key,
        label: path.label,
        color: scenarioColor(path.key),
        muted: isMuted(path.key),
        emphasis: focus === path.key,
        directLabel: focus === path.key,
        points: path.years.map((row) => ({ year: row.year, value: row.gdpShortfall })),
      })),
    ],
    [paths, baseline, focus],
  );

  const debtSeries = useMemo<WidgetSeries[]>(
    () => [
      {
        key: 'Baseline',
        label: SCENARIO_LABELS.Baseline,
        color: scenarioColor('Baseline'),
        emphasis: true,
        directLabel: true,
        points: baseline.map((row) => ({ year: row.year, value: row.debtToGdp })),
      },
      ...paths.map((path) => ({
        key: path.key,
        label: path.label,
        color: scenarioColor(path.key),
        muted: isMuted(path.key),
        emphasis: focus === path.key,
        directLabel: focus === path.key || focus === 'All',
        points: path.years.map((row) => ({ year: row.year, value: row.debtToGdp })),
      })),
    ],
    [paths, baseline, focus],
  );

  // ── The decomposition the caption and the strip both read from ────────────
  const endBaseline = baseline[baseline.length - 1].debtToGdp;
  const endOf = (list: typeof paths, key: ClimateScenario) => {
    const path = list.find((p) => p.key === key)!;
    return path.years[path.years.length - 1];
  };

  /** With all six on screen, the widest scenario is the one the numbers are about. */
  const subject: ClimateScenario =
    focus === 'All'
      ? paths.reduce((a, b) =>
          Math.abs(endOf(paths, b.key).debtToGdp - endBaseline) >
          Math.abs(endOf(paths, a.key).debtToGdp - endBaseline)
            ? b
            : a,
        ).key
      : focus;

  const gap = endOf(paths, subject).debtToGdp - endBaseline;
  const throughGrowth = endOf(growthOnly, subject).debtToGdp - endBaseline;
  const throughBalance = gap - throughGrowth;

  const ends = paths.map((p) => endOf(paths, p.key).debtToGdp);
  const fan = Math.max(...ends) - Math.min(...ends);

  return (
    <WidgetFrame
      title="Climate has no term of its own in the debt equation. It arrives through g and through the primary balance"
      standfirst={`Uganda under the six warming scenarios. The growth deviation on top is the cause, the debt fan below is what it becomes by ${YEAR_END}.`}
      controls={
        <>
          <ChoiceGroup
            legend="Focus"
            choices={FOCUS_CHOICES}
            value={focus}
            swatches
            onChange={(next: Focus) => {
              setTouched(true);
              setFocus(next);
            }}
          />
          <Slider
            id="rigidity"
            label="Expenditure rigidity"
            value={rigidity}
            min={0}
            max={1}
            step={0.05}
            format={(v) => v.toFixed(2)}
            hint="1.0 is sticky spending, the engine default. 0.0 is spending that falls in step with GDP."
            onChange={(next) => {
              setTouched(true);
              setRigidity(next);
            }}
          />

          <div className="wsplit">
            <span className="wsplit__item">
              <span className="wsplit__label">Through growth</span>
              <span className="wsplit__value wsplit__value--flat">
                {fmtSigned(throughGrowth)}
              </span>
            </span>
            <span className="wsplit__item">
              <span className="wsplit__label">Through the balance</span>
              <span className="wsplit__value wsplit__value--flat">
                {fmtSigned(throughBalance)}
              </span>
            </span>
            <span className="wsplit__item">
              <span className="wsplit__label">Fan at {YEAR_END}</span>
              <span className="wsplit__value wsplit__value--up">{fan.toFixed(0)}</span>
            </span>
          </div>
        </>
      }
      caption={caption({ subject, focus, rigidity, gap, throughGrowth, throughBalance, fan })}
      aside={
        <PredictFirst
          revealed={touched}
          question="If a government could cut spending perfectly in step with a smaller economy, would the climate scenarios still move the debt ratio?"
          answer="They would. Pull rigidity to zero: the fan narrows sharply but does not close, because slower growth still shrinks the denominator."
        />
      }
      footnote="The baseline runs the fiscal rule and the debt floor; the six climate scenarios run neither, which is the engine's own design. So part of the gap between the baseline and any scenario is that difference in treatment rather than damage. The comparison between scenarios, and the response to the rigidity slider, are unaffected."
      stageClassName="widget__stage--stacked"
    >
      <>
        <Legend
          items={gdpSeries.map((s) => ({
            key: s.key,
            label: s.label,
            color: s.color,
            muted: s.muted,
          }))}
        />

        <div className="wc-slot">
          <AnimatedLineChart
            series={gdpSeries}
            format={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`}
            duration={duration}
            zeroLine
            initialHeight={180}
            yLabel="1. The growth channel: real GDP against the baseline path"
            ariaLabel="Real GDP under six climate scenarios as a percentage deviation from the baseline path"
          />
        </div>

        <p className="widget__link">which flows into</p>

        <div className="wc-slot">
          <AnimatedLineChart
            series={debtSeries}
            format={fmtPct}
            duration={duration}
            yLabel="2. The debt line: debt to GDP"
            ariaLabel="Debt to GDP under the baseline and six climate scenarios"
          />
        </div>
      </>
    </WidgetFrame>
  );
}

/**
 * The dynamic caption.
 *
 * Two moving parts: which scenario the numbers are about, and where the
 * rigidity slider is. The rigidity branch is the one that carries the idea, so
 * it comes last and gets the plainest language.
 *
 * Paris-Aligned needs its own wording. It GAINS GDP against the baseline,
 * because the baseline already carries current-policy damage and a 1.5C world
 * carries less, so a caption written only for shortfalls would print a sentence
 * that contradicts its own chart.
 */
function caption({
  subject,
  focus,
  rigidity,
  gap,
  throughGrowth,
  throughBalance,
  fan,
}: {
  subject: ClimateScenario;
  focus: Focus;
  rigidity: number;
  gap: number;
  throughGrowth: number;
  throughBalance: number;
  fan: number;
}) {
  const name = SCENARIO_LABELS[subject];
  const lead =
    focus === 'All' ? (
      <>
        Six pathways, one baseline, and <strong>{fan.toFixed(0)} points of GDP</strong>{' '}
        between the best and worst debt outcome by {YEAR_END}. The widest of them,{' '}
        <strong>{name}</strong>,{' '}
      </>
    ) : (
      <>
        <strong>{name}</strong>{' '}
      </>
    );

  const direction =
    gap >= 0 ? (
      <>
        ends <strong>{gap.toFixed(1)} points above</strong> the baseline.
      </>
    ) : (
      <>
        ends <strong>{Math.abs(gap).toFixed(1)} points below</strong> the baseline, because
        the baseline already carries current-policy damage and this pathway carries less.
      </>
    );

  const channel =
    rigidity <= 0.001 ? (
      <>
        {' '}
        With rigidity at zero, spending falls in step with the economy and the primary
        balance is exactly the baseline's, so every one of those points came through
        growth. The gap did not close, and that is the point.
      </>
    ) : rigidity >= 0.999 ? (
      <>
        {' '}
        At the default rigidity of 1.00 spending holds its level while the economy is
        smaller, so both doors are open:{' '}
        <strong>{fmtSigned(throughGrowth)}</strong> points arrive through growth and{' '}
        <strong>{fmtSigned(throughBalance)}</strong> through the primary balance.
        {Math.abs(throughBalance) > 3 * Math.abs(throughGrowth) && (
          <>
            {' '}
            The budget door is much the wider of the two: a spending ratio that drifts up
            every year compounds into the stock faster than a slower denominator does.
          </>
        )}
      </>
    ) : (
      <>
        {' '}
        At rigidity <strong>{rigidity.toFixed(2)}</strong> the ministry absorbs{' '}
        {((1 - rigidity) * 100).toFixed(0)}% of the shortfall in spending, so the primary
        balance channel carries <strong>{fmtSigned(throughBalance)}</strong> points and
        growth carries <strong>{fmtSigned(throughGrowth)}</strong>.
      </>
    );

  return (
    <>
      {lead}
      {direction}
      {channel}
    </>
  );
}
