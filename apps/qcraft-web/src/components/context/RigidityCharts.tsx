/**
 * The two charts behind expenditure rigidity, which is the only parameter in the
 * app whose honest answer is a range.
 *
 * `ReadingsChart` puts several defensible readings of the same historical record
 * on one axis with their confidence intervals. They are individually precise and
 * they disagree, and showing them together is the only way to say that without
 * saying it in a footnote nobody reads.
 *
 * `RigidityScatter` shows one country's own record: how far spending moved in
 * the years output moved, both measured against that country's own average. The
 * two reference lines are the parameter's own endpoints, so a reader can see
 * directly that their country's cloud does not sit on either. Fitting a line
 * through it is done in the browser and is deliberately drawn thin: the point of
 * the chart is the width of the cloud, not the slope of the line.
 *
 * Neither chart ranks countries on rigidity. docs/parameter-data.md section 7.2
 * is why: per-country slopes carry a median standard error of 0.29 on a
 * parameter defined over a range of one, and 73 of 186 countries fall outside
 * that range before anyone interprets them.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

import { context as contextTheme, theme } from '../../theme';
import type { RigidityPoint, RigidityReading } from '../../context/peers';

// ── The readings ─────────────────────────────────────────────────────────────

const READINGS_MARGIN = { top: 34, right: 34, bottom: 36, left: 236 };
const READING_ROW = 26;

interface ReadingsProps {
  readings: RigidityReading[];
  /** The sidebar setting, drawn as an intention against the estimates. */
  setting: number;
  /** The engine default, drawn because it sits outside every reading. */
  engineDefault: number;
}

export function ReadingsChart({ readings, setting, engineDefault }: ReadingsProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [width, setWidth] = useState(700);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width ?? 0;
      if (next > 0) setWidth(next);
    });
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  const height = READINGS_MARGIN.top + READINGS_MARGIN.bottom + readings.length * READING_ROW;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !readings.length) return;

    const innerW = Math.max(width - READINGS_MARGIN.left - READINGS_MARGIN.right, 10);
    const innerH = readings.length * READING_ROW;

    d3.select(svg).selectAll('*').remove();
    const g = d3
      .select(svg)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${READINGS_MARGIN.left},${READINGS_MARGIN.top})`);

    // The parameter's own range is always on screen, whatever the estimates do,
    // because "this interval runs off the end of what the control accepts" is
    // information rather than a drawing problem.
    const lo = Math.min(-0.05, ...readings.map((r) => r.low));
    const hi = Math.max(1.05, ...readings.map((r) => r.high), setting, engineDefault);
    const x = d3.scaleLinear().domain([lo, hi]).range([0, innerW]);
    const y = d3
      .scaleBand<string>()
      .domain(readings.map((r) => r.reading))
      .range([0, innerH])
      .padding(0.35);

    // The band the control actually accepts.
    g.append('rect')
      .attr('x', x(0))
      .attr('y', -4)
      .attr('width', x(1) - x(0))
      .attr('height', innerH + 4)
      .attr('fill', theme.surfaceSunken);

    for (const [value, label, color] of [
      [0, 'Spending follows GDP', theme.textMuted],
      [1, `Engine default ${engineDefault.toFixed(1)}`, theme.textSecondary],
    ] as const) {
      g.append('line')
        .attr('x1', x(value))
        .attr('x2', x(value))
        .attr('y1', -4)
        .attr('y2', innerH)
        .attr('stroke', color)
        .attr('stroke-width', 1);
      g.append('text')
        .attr('x', x(value))
        .attr('y', innerH + 26)
        .attr('text-anchor', value === 0 ? 'start' : 'end')
        .attr('fill', color)
        .attr('font-size', 10.5)
        .text(label);
    }

    // Each reading: the interval, then the estimate.
    const rows = g
      .append('g')
      .selectAll('g')
      .data(readings)
      .join('g')
      .attr('transform', (r) => `translate(0,${(y(r.reading) ?? 0) + y.bandwidth() / 2})`);

    rows
      .append('line')
      .attr('x1', (r) => x(r.low))
      .attr('x2', (r) => x(r.high))
      .attr('stroke', contextTheme.record)
      .attr('stroke-width', 2)
      .attr('opacity', 0.45);
    rows
      .append('circle')
      .attr('cx', (r) => x(r.rigidity))
      .attr('r', 4)
      .attr('fill', contextTheme.record);
    rows
      .append('text')
      .attr('x', -10)
      .attr('dy', '0.34em')
      .attr('text-anchor', 'end')
      .attr('fill', theme.textPrimary)
      .attr('font-size', 11.5)
      .text((r) => r.reading);

    // The user's setting, last so it sits over everything. When it coincides
    // with the engine default the two marks land on the same pixel, which is
    // itself the message, so the label says both rather than one hiding the
    // other.
    const atDefault = Math.abs(setting - engineDefault) < 1e-9;
    g.append('line')
      .attr('x1', x(setting))
      .attr('x2', x(setting))
      .attr('y1', -14)
      .attr('y2', innerH)
      .attr('stroke', contextTheme.chosen)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3 2');
    g.append('text')
      .attr('x', x(setting))
      .attr('y', -19)
      .attr('text-anchor', x(setting) > innerW - 90 ? 'end' : x(setting) < 90 ? 'start' : 'middle')
      .attr('fill', contextTheme.chosen)
      .attr('font-size', 11)
      .text(
        atDefault
          ? `Your setting ${setting.toFixed(1)}, still the default`
          : `Your setting ${setting.toFixed(1)}`,
      );

    const axis = d3.axisBottom(x).ticks(6).tickSize(0).tickFormat(d3.format('.1f'));
    const axisG = g.append('g').attr('transform', `translate(0,${innerH + 4})`).call(axis);
    axisG.select('.domain').remove();
    axisG.selectAll('text').attr('fill', theme.textSecondary).attr('font-size', 10.5);
  }, [width, height, readings, setting, engineDefault]);

  return (
    <div className="rigidity-chart" ref={wrapRef}>
      <svg
        ref={svgRef}
        role="img"
        aria-label={
          `Implied expenditure rigidity under ${readings.length} readings of the ` +
          `historical record, from ${Math.min(...readings.map((r) => r.rigidity)).toFixed(2)} ` +
          `to ${Math.max(...readings.map((r) => r.rigidity)).toFixed(2)}. ` +
          `The setting is ${setting.toFixed(1)} and the engine default is ${engineDefault.toFixed(1)}.`
        }
      />
    </div>
  );
}

// ── One country's own record ─────────────────────────────────────────────────

export interface CountryFit {
  slope: number;
  standardError: number;
  rSquared: number;
  observations: number;
}

/**
 * Country-demeaned least squares on the growth pairs, which is the same
 * estimator the pooled readings use, run on one country. It is reported with
 * its standard error and never without, because for most countries the standard
 * error is the finding.
 */
export function fitCountry(points: RigidityPoint[]): CountryFit | undefined {
  if (points.length < 6) return undefined;
  const n = points.length;
  const meanX = d3.mean(points, (p) => p.gdpGrowth) ?? 0;
  const meanY = d3.mean(points, (p) => p.expenditureGrowth) ?? 0;
  let sxx = 0;
  let sxy = 0;
  for (const p of points) {
    const dx = p.gdpGrowth - meanX;
    sxx += dx * dx;
    sxy += dx * (p.expenditureGrowth - meanY);
  }
  if (sxx <= 1e-9) return undefined;
  const slope = sxy / sxx;
  let ssRes = 0;
  let ssTot = 0;
  for (const p of points) {
    const predicted = meanY + slope * (p.gdpGrowth - meanX);
    ssRes += (p.expenditureGrowth - predicted) ** 2;
    ssTot += (p.expenditureGrowth - meanY) ** 2;
  }
  return {
    slope,
    standardError: Math.sqrt(ssRes / (n - 2) / sxx),
    rSquared: ssTot > 1e-9 ? 1 - ssRes / ssTot : Number.NaN,
    observations: n,
  };
}

const SCATTER_MARGIN = { top: 22, right: 96, bottom: 40, left: 56 };

interface ScatterProps {
  points: RigidityPoint[];
  countryName: string;
  fit?: CountryFit;
  height?: number;
}

export function RigidityScatter({
  points,
  countryName,
  fit,
  height = 300,
}: ScatterProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [width, setWidth] = useState(700);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width ?? 0;
      if (next > 0) setWidth(next);
    });
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  /** Deviations from the country's own average, which is what the fit uses. */
  const deviations = useMemo(() => {
    const meanX = d3.mean(points, (p) => p.gdpGrowth) ?? 0;
    const meanY = d3.mean(points, (p) => p.expenditureGrowth) ?? 0;
    return points.map((p) => ({
      ...p,
      x: p.gdpGrowth - meanX,
      y: p.expenditureGrowth - meanY,
    }));
  }, [points]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !deviations.length) return;

    const innerW = Math.max(width - SCATTER_MARGIN.left - SCATTER_MARGIN.right, 10);
    const innerH = height - SCATTER_MARGIN.top - SCATTER_MARGIN.bottom;

    d3.select(svg).selectAll('*').remove();
    const g = d3
      .select(svg)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${SCATTER_MARGIN.left},${SCATTER_MARGIN.top})`);

    // One symmetric span on both axes, so a 45 degree line is 45 degrees. An
    // elasticity read off a chart with two different scales is read wrong.
    const span =
      Math.max(
        d3.max(deviations, (p) => Math.abs(p.x)) ?? 1,
        d3.max(deviations, (p) => Math.abs(p.y)) ?? 1,
      ) * 1.08;
    const x = d3.scaleLinear().domain([-span, span]).range([0, innerW]);
    const y = d3.scaleLinear().domain([-span, span]).range([innerH, 0]);

    const drawAxis = (
      axis: d3.Axis<d3.NumberValue>,
      transform: string,
    ) => {
      const rendered = g.append('g').attr('transform', transform).call(axis);
      rendered.select('.domain').remove();
      rendered.selectAll('line').attr('stroke', theme.ruleCool).attr('opacity', 0.7);
      rendered.selectAll('text').attr('fill', theme.textSecondary).attr('font-size', 10.5);
    };
    drawAxis(d3.axisBottom(x).ticks(5).tickSize(-innerH), `translate(0,${innerH})`);
    drawAxis(d3.axisLeft(y).ticks(5).tickSize(-innerW), 'translate(0,0)');

    // ── The two endpoints of the parameter, as lines ───────────────────────
    // Their end labels are placed first and their positions kept, so the fitted
    // line's label can be pushed clear of them. A country whose spending barely
    // moves has a fit almost exactly on the rigidity 1.0 line, which is the
    // most interesting case and the one where the labels would collide.
    const labelled: number[] = [];
    const reference = (slope: number, label: string) => {
      const ly = y(span * slope);
      g.append('line')
        .attr('x1', x(-span))
        .attr('y1', y(-span * slope))
        .attr('x2', x(span))
        .attr('y2', ly)
        .attr('stroke', theme.textSecondary)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4 3');
      g.append('text')
        .attr('x', innerW + 6)
        .attr('y', ly)
        .attr('dy', '0.34em')
        .attr('fill', theme.textSecondary)
        .attr('font-size', 10.5)
        .text(label);
      labelled.push(ly);
    };
    reference(0, 'rigidity 1.0');
    reference(1, 'rigidity 0.0');

    // ── The country's years ────────────────────────────────────────────────
    g.append('g')
      .selectAll('circle')
      .data(deviations)
      .join('circle')
      .attr('cx', (p) => x(p.x))
      .attr('cy', (p) => y(p.y))
      .attr('r', 4)
      .attr('fill', (p) => (p.weakYear ? contextTheme.chosen : contextTheme.record))
      .attr('opacity', 0.75)
      .append('title')
      .text(
        (p) =>
          `${p.year}: GDP ${p.gdpGrowth.toFixed(1)}%, primary spending ${p.expenditureGrowth.toFixed(1)}%`,
      );

    // ── The fit, drawn thin on purpose ─────────────────────────────────────
    if (fit) {
      const fy = y(span * fit.slope);
      g.append('line')
        .attr('x1', x(-span))
        .attr('y1', y(-span * fit.slope))
        .attr('x2', x(span))
        .attr('y2', fy)
        .attr('stroke', contextTheme.comparator[0])
        .attr('stroke-width', 1.5);
      let labelY = fy;
      while (labelled.some((other) => Math.abs(other - labelY) < 13)) labelY -= 13;
      g.append('text')
        .attr('x', innerW + 6)
        .attr('y', labelY)
        .attr('dy', '0.34em')
        .attr('fill', contextTheme.comparator[0])
        .attr('font-size', 10.5)
        .text(`${countryName} fit`);
    }

    g.append('text')
      .attr('x', innerW / 2)
      .attr('y', innerH + 34)
      .attr('text-anchor', 'middle')
      .attr('fill', theme.textSecondary)
      .attr('font-size', 11)
      .text('GDP growth, points away from this country’s own average');
    g.append('text')
      .attr('transform', `rotate(-90) translate(${-innerH / 2},${-42})`)
      .attr('text-anchor', 'middle')
      .attr('fill', theme.textSecondary)
      .attr('font-size', 11)
      .text('Primary spending growth, points from average');
  }, [width, height, deviations, fit, countryName]);

  return (
    <div className="rigidity-chart" ref={wrapRef}>
      <svg
        ref={svgRef}
        role="img"
        aria-label={
          `${countryName}: ${points.length} years of GDP growth against primary ` +
          `expenditure growth, both as deviations from the country average` +
          (fit
            ? `. The fitted slope is ${fit.slope.toFixed(2)} with a standard error of ${fit.standardError.toFixed(2)} and an R squared of ${fit.rSquared.toFixed(2)}.`
            : '.')
        }
      />
    </div>
  );
}
