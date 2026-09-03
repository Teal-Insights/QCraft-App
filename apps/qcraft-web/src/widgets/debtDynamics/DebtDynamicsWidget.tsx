/**
 * Widget 1: the debt equation sandbox.
 *
 * ── The one idea ──────────────────────────────────────────────────────────────
 * A debt ratio moves for two reasons and only two. The budget is one of them.
 * The other is the snowball, d * (r - g) / (1 + g), which runs whether or not
 * anyone decides anything, and which most people meeting the debt equation for
 * the first time do not know is there. Everything on this screen exists to make
 * that second term visible: the arithmetic strip names it, the caption narrates
 * its sign, and the presets walk it from favourable to neutral.
 *
 * ── The default state ─────────────────────────────────────────────────────────
 * Uganda at the engine's own numbers, and the default has a message of its own:
 * Uganda's nominal growth of about 10% runs ahead of its 8% borrowing cost, so
 * the snowball is working FOR the country, and a standing primary deficit of
 * half a point of GDP still leaves the ratio drifting down. That is not the
 * story most people expect the debt equation to tell, which is why it is the
 * one the widget opens on. A trainer who never touches a control has still
 * taught something true.
 *
 * The vulnerability is the same fact read the other way, and it is one drag
 * away: that comfortable margin is made of inflation, and the caption changes
 * its tune the moment growth falls to the interest rate.
 */

import { useMemo, useState } from 'react';

import { AnimatedLineChart } from '../charts/AnimatedLineChart';
import type { WidgetSeries } from '../charts/types';
import { Legend } from '../shell/Legend';
import { PredictFirst } from '../shell/PredictFirst';
import { Slider } from '../shell/Slider';
import { WidgetFrame } from '../shell/WidgetFrame';
import { transitionDuration } from '../shell/motion';
import { series as palette, theme } from '../../theme';
import {
  DEBT_PRESETS,
  START_YEAR,
  UGANDA_LIKE,
  debtPath,
  steadyState,
  type DebtInputs,
} from '../models/debtPath';

const fmtPct = (v: number) => `${v.toFixed(1)}%`;
const fmtPoints = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}`;

/** Rounded to one decimal so the caption never reads "0.0 points of difference". */
const round1 = (v: number) => Math.round(v * 10) / 10;

export function DebtDynamicsWidget() {
  const [inputs, setInputs] = useState<DebtInputs>(UGANDA_LIKE);
  /**
   * The path as it stood before the first interaction. Drawn dashed from that
   * moment on, so a change is read against something rather than remembered.
   */
  const [touched, setTouched] = useState(false);
  const duration = useMemo(transitionDuration, []);

  const path = useMemo(() => debtPath(inputs), [inputs]);
  const opening = useMemo(() => debtPath(UGANDA_LIKE), []);

  const set = (patch: Partial<DebtInputs>) => {
    setTouched(true);
    setInputs((prev) => ({ ...prev, ...patch }));
  };

  /**
   * The y-axis is anchored at zero and grows in steps of twenty, rather than
   * fitting itself to the current path.
   *
   * An auto-fitted axis is the wrong default for a widget whose whole job is to
   * show a change: rescale the frame on every drag and the line barely moves
   * while the numbers beside it do, which is the opposite of the thing being
   * taught. A fixed floor of 60 keeps Uganda's default path filling most of the
   * frame while leaving room for an adverse differential to climb into.
   */
  const yDomain = useMemo<[number, number]>(() => {
    const peak = Math.max(...path.map((row) => row.debtToGdp), inputs.initialDebt);
    const floor = Math.min(...path.map((row) => row.debtToGdp), 0);
    return [Math.floor(Math.min(floor, 0) / 20) * 20, Math.max(60, Math.ceil((peak * 1.06) / 20) * 20)];
  }, [path, inputs.initialDebt]);

  const chartSeries = useMemo<WidgetSeries[]>(() => {
    const current: WidgetSeries = {
      key: 'path',
      label: 'Debt to GDP on these assumptions',
      color: palette.baseline,
      emphasis: true,
      directLabel: true,
      points: path.map((row) => ({ year: row.year, value: row.debtToGdp })),
    };
    if (!touched) return [current];
    return [
      {
        key: 'opening',
        label: 'Where you started (Uganda-like)',
        color: theme.textMuted,
        dashed: true,
        points: opening.map((row) => ({ year: row.year, value: row.debtToGdp })),
      },
      current,
    ];
  }, [path, opening, touched]);

  // The decomposition, read at the first projected year. Year one is chosen
  // over an average because it is the year a reader can check by hand against
  // the numbers on the sliders.
  const first = path[1];
  const net = first.snowball + first.primaryBalanceEffect;
  const differential = round1(inputs.growthRate - inputs.interestRate);
  const settle = steadyState(inputs);
  const endValue = path[path.length - 1].debtToGdp;

  return (
    <WidgetFrame
      title="A debt ratio moves for two reasons, and only one of them is the budget"
      standfirst={`Uganda's debt path from ${START_YEAR}, on an interest rate, a growth rate and a primary balance that you set. Nothing else is in the equation.`}
      controls={
        <>
          <Slider
            id="interest"
            label="Interest rate, r"
            value={inputs.interestRate}
            min={0}
            max={20}
            step={0.5}
            hint="Nominal, the average paid on the whole debt stock."
            onChange={(interestRate) => set({ interestRate })}
          />
          <Slider
            id="growth"
            label="GDP growth, g"
            value={inputs.growthRate}
            min={0}
            max={20}
            step={0.5}
            hint="Nominal, so it carries inflation as well as real growth."
            onChange={(growthRate) => set({ growthRate })}
          />
          <Slider
            id="balance"
            label="Primary balance"
            value={inputs.primaryBalance}
            min={-8}
            max={8}
            step={0.25}
            format={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`}
            hint="Of GDP. Revenue less spending, before interest. Negative is a deficit."
            onChange={(primaryBalance) => set({ primaryBalance })}
          />
          <Slider
            id="initial"
            label={`Debt in ${START_YEAR}`}
            value={inputs.initialDebt}
            min={0}
            max={140}
            step={1}
            format={(v) => `${v.toFixed(0)}%`}
            hint="Of GDP, where the path starts. Uganda's WEO forecast for 2029 is 36%."
            onChange={(initialDebt) => set({ initialDebt })}
          />

          <div className="wchoice">
            <span className="wchoice__legend">Try</span>
            <div className="wchoice__options">
              {DEBT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  title={preset.hint}
                  className="wchoice__option"
                  onClick={() => {
                    setTouched(true);
                    setInputs(preset.inputs);
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="wsplit">
            <span className="wsplit__item">
              <span className="wsplit__label">Snowball, pp</span>
              <span className={`wsplit__value ${valueClass(first.snowball)}`}>
                {fmtPoints(first.snowball)}
              </span>
            </span>
            <span className="wsplit__item">
              <span className="wsplit__label">Budget, pp</span>
              <span className={`wsplit__value ${valueClass(first.primaryBalanceEffect)}`}>
                {fmtPoints(first.primaryBalanceEffect)}
              </span>
            </span>
            <span className="wsplit__item">
              <span className="wsplit__label">Net, year one</span>
              <span className={`wsplit__value ${valueClass(net)}`}>{fmtPoints(net)}</span>
            </span>
          </div>
        </>
      }
      caption={caption({ inputs, differential, first, net, endValue, settle })}
      aside={
        <PredictFirst
          revealed={touched}
          question="With the budget exactly balanced, can the debt ratio still climb on its own?"
          answer="It can. Set the primary balance to zero and the line still moves, because the snowball is not part of the budget."
        />
      }
      footnote={`The three rates are held constant across the ${path.length - 1} years, which no real projection does. That is the simplification: it is what makes the snowball legible. The recursion itself is the engine's own, from the climate module.`}
    >
      {chartSeries.length > 1 && (
        <Legend
          items={chartSeries.map((s) => ({ key: s.key, label: s.label, color: s.color }))}
        />
      )}
      <AnimatedLineChart
        series={chartSeries}
        format={fmtPct}
        duration={duration}
        yDomain={yDomain}
        yLabel="Debt to GDP, percent"
        ariaLabel="Debt to GDP over thirty years on the chosen interest rate, growth rate and primary balance"
      />
    </WidgetFrame>
  );
}

function valueClass(value: number): string {
  if (Math.abs(value) < 0.005) return 'wsplit__value--flat';
  return value > 0 ? 'wsplit__value--up' : 'wsplit__value--down';
}

/**
 * The dynamic caption.
 *
 * It is built from the three quantities on screen and stops there. It says what
 * the arithmetic did; it does not say whether that is good, because the tool
 * projects and does not advise, and because a room of finance officials will
 * decide that faster than a caption can.
 *
 * The branch order matters: the sign of the differential is the first thing to
 * establish, because it decides whether the rest of the sentence is a warning
 * or a reassurance.
 */
function caption({
  inputs,
  differential,
  first,
  net,
  endValue,
  settle,
}: {
  inputs: DebtInputs;
  differential: number;
  first: { snowball: number; primaryBalanceEffect: number };
  net: number;
  endValue: number;
  settle: number | undefined;
}) {
  const surplus = inputs.primaryBalance > 0.001;
  const balanced = Math.abs(inputs.primaryBalance) <= 0.001;
  const budgetWord = balanced
    ? 'the budget exactly balanced'
    : surplus
      ? `a primary surplus of ${inputs.primaryBalance.toFixed(2)}% of GDP`
      : `a primary deficit of ${Math.abs(inputs.primaryBalance).toFixed(2)}% of GDP`;

  const endClause = (
    <>
      {' '}
      Thirty years of that leaves the ratio at <strong>{endValue.toFixed(1)}%</strong>
      {settle !== undefined && Math.abs(settle - endValue) > 1
        ? `, still heading toward the ${settle.toFixed(0)}% it settles at if nothing changes.`
        : '.'}
    </>
  );

  if (differential === 0) {
    return (
      <>
        Interest and growth are both{' '}
        <strong>{inputs.interestRate.toFixed(1)}%</strong>, so the snowball is exactly
        zero and the ratio moves by the budget alone: {budgetWord} shifts it{' '}
        <strong>{fmtPoints(net)}</strong> points a year, every year, whatever the debt
        level.
        {endClause}
      </>
    );
  }

  if (differential < 0) {
    const covered = first.primaryBalanceEffect < -first.snowball;
    return (
      <>
        r exceeds g by <strong>{Math.abs(differential).toFixed(1)} points</strong>: the
        ratio rises <strong>{fmtPoints(first.snowball)}</strong> points in the first year
        on the snowball alone, before the budget does anything.{' '}
        {covered ? (
          <>
            {capitalise(budgetWord)} more than covers it, so the ratio still falls, and it
            has to keep covering it every year to go on doing so.
          </>
        ) : (
          <>
            {capitalise(budgetWord)} adds{' '}
            <strong>{fmtPoints(first.primaryBalanceEffect)}</strong>, for a net{' '}
            <strong>{fmtPoints(net)}</strong> points, and the snowball grows with the
            stock.
          </>
        )}
        {endClause}
      </>
    );
  }

  return (
    <>
      g exceeds r by <strong>{differential.toFixed(1)} points</strong>: growth erodes the
      ratio by <strong>{fmtPoints(first.snowball)}</strong> points in the first year on
      its own, so {budgetWord} still leaves a net{' '}
      <strong>{fmtPoints(net)}</strong>. The margin is doing the work, not the budget.
      {endClause}
    </>
  );
}

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
