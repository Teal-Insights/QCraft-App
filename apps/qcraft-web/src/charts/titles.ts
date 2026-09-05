/**
 * Computed takeaway titles.
 *
 * A title in the briefing register is a template plus facts from the run that
 * is on screen. Nothing here is a sentence with a number typed into it: every
 * figure a title states came out of `facts.ts`, so a title can never claim a
 * crossing year the projection did not produce.
 *
 * ── The shapes ────────────────────────────────────────────────────────────────
 *
 * Each function returns the strongest TRUE claim for the run it is given, which
 * means each one branches. Uganda's baseline never reaches its debt target, so
 * the honest title says it stays under rather than naming a crossing year. Eleven
 * of the selectable countries have no climate coverage in the FADCP dataset at
 * all, so the climate title has to say the data is missing rather than report a
 * 0.0% effect as a finding.
 *
 * ── House style ───────────────────────────────────────────────────────────────
 *
 * A chart title is a BLUF: it states the conclusion, it does not name the
 * variables. Sentence case, one clause, plain language. No em-dashes. Three
 * title shapes are banned outright by the style guide and none of them appear
 * here: the appended-judgment tail (tic 10), the participle tagline (tic 11),
 * and compound assertion-amplification, the ", and" clause that restates the
 * first clause bigger (tic 12, "worst in headings").
 *
 * Numbers are rounded to whole points in titles and carried to one decimal on
 * the chart's own labels. A title is read at a glance and "between 39% and 127%
 * of GDP" is the claim; the decimal belongs where the reader is measuring.
 */

import type { EngineResult } from '../engine/adapter';
import {
  fiscalExtremes,
  gdpShortfallExtremes,
  pathFacts,
  thresholdFacts,
  type ThresholdFacts,
} from './facts';
import type { ChartPoint } from './types';

/** Possessive that survives a country name already ending in s. */
export function possessive(name: string): string {
  return name.endsWith('s') ? `${name}’` : `${name}’s`;
}

const whole = (v: number) => `${Math.round(v)}`;

/**
 * The baseline debt path read against the debt target.
 *
 * The target is the model's own `debt_target` parameter, which the fiscal rule
 * tests every projection year. It is not a threshold invented for the chart, so
 * a title about crossing it is a title about the model.
 */
export function baselineDebtTitle(args: {
  countryName: string;
  points: ChartPoint[];
  /**
   * Absent when the fiscal rule is off, because the target is then inert and
   * the chart draws no rule for the title to be about. The title falls back to
   * the shape of the path itself.
   */
  target?: number;
  boundaryYear: number;
}): string {
  const { countryName, points, target, boundaryYear } = args;
  const facts = pathFacts(points, boundaryYear);
  if (!facts) return `Baseline debt path for ${countryName}`;

  const end = `${whole(facts.last.value)}% of GDP by ${facts.last.year}`;

  if (target == null) {
    const rise = facts.last.value - (facts.atBoundary?.value ?? facts.first.value);
    if (Math.abs(rise) < 1) {
      return `Baseline debt holds near ${end} with the fiscal rule off`;
    }
    return rise > 0
      ? `With the fiscal rule off, baseline debt climbs to ${end}`
      : `With the fiscal rule off, baseline debt falls to ${end}`;
  }

  const t: ThresholdFacts | undefined = thresholdFacts(points, target, boundaryYear);
  if (!t) return `Baseline debt path for ${countryName}`;

  if (t.endsAbove && t.crossing) {
    return `Baseline debt passes the ${whole(target)}% target in ${t.crossing.year}`;
  }
  if (t.endsAbove) {
    return `Baseline debt stays above the ${whole(target)}% target all the way to ${facts.last.year}`;
  }
  if (t.crossing) {
    return `Baseline debt falls back under the ${whole(target)}% target in ${t.crossing.year}`;
  }
  return `Baseline debt stays under the ${whole(target)}% target, reaching ${end}`;
}

/** Revenue against primary expenditure. The message is where they end up. */
export function revenueExpenditureTitle(args: {
  revenue: ChartPoint[];
  expenditure: ChartPoint[];
}): string {
  const rev = args.revenue[args.revenue.length - 1];
  const exp = args.expenditure[args.expenditure.length - 1];
  if (!rev || !exp) return 'Revenue and primary expenditure';

  const gap = exp.value - rev.value;
  if (Math.abs(gap) < 0.25) {
    return `Primary spending converges on revenue by ${exp.year}`;
  }
  if (gap > 0) {
    return `Primary spending still runs ${gap.toFixed(1)} points of GDP above revenue in ${exp.year}`;
  }
  return `Revenue runs ${Math.abs(gap).toFixed(1)} points of GDP above primary spending by ${exp.year}`;
}

/** The two balances. The message is what interest does to the overall balance. */
export function balancesTitle(args: {
  primary: ChartPoint[];
  overall: ChartPoint[];
}): string {
  const pb = args.primary[args.primary.length - 1];
  const ob = args.overall[args.overall.length - 1];
  if (!pb || !ob) return 'Primary and overall balance';

  const interest = pb.value - ob.value;
  if (pb.value >= 0 && ob.value < 0) {
    return `Interest of ${interest.toFixed(1)} points of GDP turns a primary surplus into an overall deficit`;
  }
  if (ob.value < 0) {
    return `The overall balance stays in deficit at ${Math.abs(ob.value).toFixed(1)} points of GDP in ${ob.year}`;
  }
  return `Both balances are in surplus by ${ob.year}`;
}

/**
 * The scenario fan compares the debt-ratio range across six modeled climate
 * scenarios, including Hot variants with different adaptation windows.
 */
export function scenarioSpreadTitle(args: {
  countryName: string;
  result: EngineResult;
  year: number;
}): string {
  const ex = fiscalExtremes(args.result, 'debt_to_gdp', args.year);
  if (!ex) return `Debt-to-GDP under climate scenarios, ${args.countryName}`;

  if (ex.spread < 1) {
    return `Climate scenarios move ${possessive(args.countryName)} ${args.year} debt by under a point of GDP`;
  }
  return (
    `Climate scenarios put ${possessive(args.countryName)} ${args.year} debt between ` +
    `${whole(ex.best.value)}% and ${whole(ex.worst.value)}% of GDP`
  );
}

/**
 * The growth drag: real GDP under each scenario as a deviation from baseline.
 *
 * The zero-coverage branch matters. The FADCP climate dataset has no slice for
 * eleven selectable economies, so every scenario returns the baseline path and
 * the deviation is flat zero. Reporting that as "0.0% smaller" would read as a
 * finding of no risk. It is a finding of no data, and the title says so. The
 * standing notice explaining the difference is CC-2's, next to the data
 * provenance; this title stays consistent with it and claims nothing more.
 */
export function growthDragTitle(args: {
  countryName: string;
  result: EngineResult;
  year: number;
}): string {
  const ex = gdpShortfallExtremes(args.result, args.year);
  if (!ex) return `Real GDP relative to baseline, ${args.countryName}`;

  if (Math.abs(ex.worst.value) < 0.05 && Math.abs(ex.best.value) < 0.05) {
    return `The climate dataset carries no growth effect for ${args.countryName}`;
  }
  if (ex.worst.value >= 0) {
    return `Every climate scenario leaves ${possessive(args.countryName)} economy at or above its baseline in ${args.year}`;
  }
  return (
    `${ex.worst.label} leaves the ${args.countryName} economy ` +
    `${Math.abs(ex.worst.value).toFixed(1)}% smaller in ${args.year}`
  );
}

/**
 * The one chart for the export packet cover.
 *
 * It has to carry the whole run in a single message: where the baseline sits
 * against the target, and how far the climate scenarios open that up.
 */
export function overviewTitle(args: {
  countryName: string;
  result: EngineResult;
  year: number;
  baselineAtHorizon?: number;
}): string {
  const ex = fiscalExtremes(args.result, 'debt_to_gdp', args.year);
  const base = args.baselineAtHorizon;
  if (!ex || base == null) return `Debt outlook for ${args.countryName}`;

  if (ex.spread < 1) {
    return `Climate scenarios leave ${possessive(args.countryName)} ${args.year} debt near its ${whole(base)}% baseline`;
  }
  // The named-scenario shape, set by the 2026-08-27 evening gate. "As much as"
  // read as a maximum over an open range; the scenarios are a family of six
  // pathways, not rungs on a ladder, so the title names the one it is quoting
  // and lets the reader see which pathway that number belongs to.
  return (
    `${possessive(args.countryName)} ${args.year} debt is ${whole(base)}% of GDP ` +
    `under baseline and ${whole(ex.worst.value)}% under ${ex.worst.label}`
  );
}
