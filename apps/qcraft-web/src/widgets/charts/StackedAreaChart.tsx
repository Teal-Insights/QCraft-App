/**
 * The growth widget's stacked contribution chart. Hand-built D3.
 *
 * ── Why a diverging stack ─────────────────────────────────────────────────────
 * `d3.stackOffsetDiverging` rather than the default. Under the UN WPP Low
 * variant Uganda's working-age population SHRINKS after the 2080s, so the
 * employment contribution turns negative. The default offset would fold that
 * band back on top of the positive ones and quietly overstate growth in exactly
 * the case a finance ministry most needs to see clearly. Diverging stacks the
 * negative band below zero where it belongs.
 *
 * ── Why the total is drawn as a line on top ───────────────────────────────────
 * The bands sum to nominal growth by construction (the compounding band exists
 * for precisely that reason, see models/growthPath.ts), so the line is
 * redundant arithmetically. It is not redundant visually: it is the quantity
 * the widget is about, and without it the eye reads four bands rather than one
 * total made of four parts.
 *
 * Transitions work the same way as AnimatedLineChart: stable DOM, one shared
 * duration and easing, string interpolation of the area geometry, which is safe
 * because the year grid never changes.
 */

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

import { chart as chartTheme, theme } from '../../theme';
import { useChartSize } from './useChartSize';

export interface StackBand {
  key: string;
  label: string;
  color: string;
}

export type StackRow = { year: number } & Record<string, number>;

interface Props {
  rows: StackRow[];
  bands: StackBand[];
  total: { key: string; label: string; color: string };
  /** Starting height only. The chart then fills whatever its row gives it. */
  initialHeight?: number;
  duration?: number;
  format?: (value: number) => string;
  yLabel?: string;
  ariaLabel: string;
}

const MARGIN = { top: 14, right: 84, bottom: 28, left: 46 };
const DEFAULT_FORMAT = (v: number) => `${v.toFixed(1)}%`;
const EASE = d3.easeCubicOut;

function ensure<T extends d3.BaseType, P extends d3.BaseType>(
  parent: d3.Selection<P, unknown, null, undefined>,
  tag: string,
  className: string,
): d3.Selection<T, unknown, null, undefined> {
  return parent
    .selectAll<T, unknown>(`.${className}`)
    .data([null])
    .join(tag as string)
    .attr('class', className) as unknown as d3.Selection<T, unknown, null, undefined>;
}

export function StackedAreaChart({
  rows,
  bands,
  total,
  initialHeight = 300,
  duration = 450,
  format = DEFAULT_FORMAT,
  yLabel,
  ariaLabel,
}: Props) {
  const { ref: wrapRef, width, height } = useChartSize({ width: 760, height: initialHeight });
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const wrap = wrapRef.current;
    if (!svg || !wrap || !rows.length) return;

    const innerW = Math.max(width - MARGIN.left - MARGIN.right, 10);
    const innerH = Math.max(height - MARGIN.top - MARGIN.bottom, 10);

    const root = d3.select(svg).attr('width', width).attr('height', height);
    const g = ensure<SVGGElement, SVGSVGElement>(root, 'g', 'wc__plot').attr(
      'transform',
      `translate(${MARGIN.left},${MARGIN.top})`,
    );

    const stacked = d3
      .stack<StackRow>()
      .keys(bands.map((b) => b.key))
      .offset(d3.stackOffsetDiverging)(rows);

    const [yearLo, yearHi] = d3.extent(rows, (r) => r.year) as [number, number];
    const x = d3.scaleLinear().domain([yearLo, yearHi]).range([0, innerW]);

    const lo = Math.min(0, d3.min(stacked, (layer) => d3.min(layer, (p) => p[0])) ?? 0);
    const hi = Math.max(
      d3.max(stacked, (layer) => d3.max(layer, (p) => p[1])) ?? 0,
      d3.max(rows, (r) => r[total.key]) ?? 0,
    );
    const y = d3
      .scaleLinear()
      .domain([lo - Math.max(hi * 0.04, 0.2), hi * 1.06])
      .nice()
      .range([innerH, 0]);

    // Tick counts follow the plot, not a constant. The climate widget's cause
    // chart is deliberately short, and five y-ticks in 40px of height is an
    // unreadable stack of overlapping numbers.
    const yTicks = Math.max(Math.min(Math.floor(innerH / 40), 5), 2);
    const xTicks = Math.max(Math.floor(innerW / 90), 3);

    const t = d3.transition().duration(duration).ease(EASE);

    ensure<SVGGElement, SVGGElement>(g, 'g', 'wc__grid')
      .selectAll<SVGLineElement, number>('line')
      .data(y.ticks(yTicks), (d) => d as number)
      .join(
        (enter) =>
          enter
            .append('line')
            .attr('x1', 0)
            .attr('y1', (d) => y(d))
            .attr('y2', (d) => y(d))
            .attr('stroke', chartTheme.gridStroke)
            .attr('opacity', 0),
        (update) => update,
        (exit) => exit.transition(t).attr('opacity', 0).remove(),
      )
      .transition(t)
      .attr('x2', innerW)
      .attr('y1', (d) => y(d))
      .attr('y2', (d) => y(d))
      .attr('opacity', 1);

    // ── Bands ───────────────────────────────────────────────────────────────
    const area = d3
      .area<d3.SeriesPoint<StackRow>>()
      .x((d) => x(d.data.year))
      .y0((d) => y(d[0]))
      .y1((d) => y(d[1]))
      .curve(d3.curveMonotoneX);

    const colorByKey = new Map(bands.map((b) => [b.key, b.color]));

    ensure<SVGGElement, SVGGElement>(g, 'g', 'wc__bands')
      .selectAll<SVGPathElement, d3.Series<StackRow, string>>('path')
      .data(stacked, (d) => d.key)
      .join(
        (enter) =>
          enter
            .append('path')
            .attr('d', area)
            .attr('opacity', 0),
        (update) => update,
        (exit) => exit.transition(t).attr('opacity', 0).remove(),
      )
      .attr('fill', (d) => colorByKey.get(d.key) ?? theme.textMuted)
      .attr('stroke', theme.surfaceRaised)
      .attr('stroke-width', 0.5)
      .transition(t)
      .attr('opacity', 1)
      .attr('d', area);

    // ── Zero rule, which the Low variant actually crosses ───────────────────
    ensure<SVGLineElement, SVGGElement>(g, 'line', 'wc__zero')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('stroke', theme.textSecondary)
      .attr('stroke-width', 1)
      .transition(t)
      .attr('y1', y(0))
      .attr('y2', y(0));

    // ── Total line ──────────────────────────────────────────────────────────
    const line = d3
      .line<StackRow>()
      .x((d) => x(d.year))
      .y((d) => y(d[total.key]))
      .curve(d3.curveMonotoneX);

    ensure<SVGPathElement, SVGGElement>(g, 'path', 'wc__total')
      .datum(rows)
      .attr('fill', 'none')
      .attr('stroke', total.color)
      .attr('stroke-width', chartTheme.lineWidthEmphasis)
      .attr('stroke-linejoin', 'round')
      .transition(t)
      .attr('d', line);

    // ── Axes ────────────────────────────────────────────────────────────────
    const xAxis = ensure<SVGGElement, SVGGElement>(g, 'g', 'wc__x-axis').attr(
      'transform',
      `translate(0,${innerH})`,
    );
    xAxis.call(
      d3
        .axisBottom(x)
        .ticks(xTicks)
        .tickFormat(d3.format('d'))
        .tickSizeOuter(0),
    );
    const yAxis = ensure<SVGGElement, SVGGElement>(g, 'g', 'wc__y-axis');
    yAxis
      .transition(t)
      .call(
        d3
          .axisLeft(y)
          .ticks(yTicks)
          .tickFormat((d) => format(d as number))
          .tickSizeOuter(0),
      );
    for (const axis of [xAxis, yAxis]) {
      axis.selectAll('text').attr('fill', chartTheme.axisText).attr('font-size', 11);
      axis.selectAll('path, line').attr('stroke', chartTheme.axisStroke);
    }

    // ── The one end label: nominal growth at the end of the century ─────────
    const endRow = rows[rows.length - 1];
    const endValue = endRow[total.key];

    ensure<SVGTextElement, SVGGElement>(g, 'text', 'wc__total-label')
      .attr('x', innerW + 8)
      .attr('dy', '0.32em')
      .attr('font-size', 12)
      .attr('font-weight', 600)
      .attr('fill', total.color)
      .transition(t)
      .attr('y', y(endValue))
      .tween('value', function (this: SVGTextElement) {
        // Counts from what the label currently reads, for the same reason as
        // AnimatedLineChart: see countTo() there. A remembered previous value
        // is stale by the time the transition starts.
        const shown = Number.parseFloat(this.textContent ?? '');
        const from = Number.isFinite(shown) ? shown : endValue;
        const interpolate = d3.interpolateNumber(from, endValue);
        return (step: number) => {
          this.textContent = format(interpolate(step));
        };
      });

    // ── Hover ───────────────────────────────────────────────────────────────
    const hover = ensure<SVGGElement, SVGGElement>(g, 'g', 'wc__hover')
      .style('display', 'none')
      .style('pointer-events', 'none');
    ensure<SVGLineElement, SVGGElement>(hover, 'line', 'wc__crosshair')
      .attr('y1', 0)
      .attr('y2', innerH)
      .attr('stroke', theme.textSecondary)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,3');

    let tooltip = d3.select(wrap).select<HTMLDivElement>('.wc__tooltip');
    if (tooltip.empty()) {
      tooltip = d3
        .select(wrap)
        .append('div')
        .attr('class', 'wc__tooltip')
        .style('display', 'none');
    }

    const byYear = new Map(rows.map((r) => [r.year, r]));

    ensure<SVGRectElement, SVGGElement>(g, 'rect', 'wc__capture')
      .attr('width', innerW)
      .attr('height', innerH)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair')
      .on('mousemove', (event: MouseEvent) => {
        const [mx] = d3.pointer(event, g.node());
        const year = Math.round(Math.min(Math.max(x.invert(mx), yearLo), yearHi));
        const row = byYear.get(year);
        if (!row) return;
        hover.style('display', 'block');
        hover.select('.wc__crosshair').attr('x1', x(year)).attr('x2', x(year));

        const cx = x(year);
        const flipLeft = cx + MARGIN.left > width - 220;
        tooltip
          .style('display', 'block')
          .style('left', flipLeft ? 'auto' : `${cx + MARGIN.left + 14}px`)
          .style('right', flipLeft ? `${width - cx - MARGIN.left + 14}px` : 'auto')
          .style('top', `${MARGIN.top}px`)
          .html(
            `<div class="wc__tooltip-year">${year}</div>` +
              [...bands]
                .reverse()
                .map(
                  (band) =>
                    '<div class="wc__tooltip-row">' +
                    `<span class="wc__tooltip-swatch" style="background:${band.color}"></span>` +
                    `<span class="wc__tooltip-label">${band.label}</span>` +
                    `<strong>${format(row[band.key])}</strong></div>`,
                )
                .join('') +
              '<div class="wc__tooltip-row wc__tooltip-row--total">' +
              `<span class="wc__tooltip-swatch" style="background:${total.color}"></span>` +
              `<span class="wc__tooltip-label">${total.label}</span>` +
              `<strong>${format(row[total.key])}</strong></div>`,
          );
      })
      .on('mouseleave', () => {
        hover.style('display', 'none');
        tooltip.style('display', 'none');
      });
  }, [rows, bands, total, width, height, duration, format, wrapRef]);

  return (
    <div className="wc">
      {yLabel && <p className="wc__y-label">{yLabel}</p>}
      <div ref={wrapRef} className="wc__plot-wrap">
        <svg ref={svgRef} role="img" aria-label={ariaLabel} />
      </div>
    </div>
  );
}
