/**
 * The widgets' line chart. Hand-built D3, no wrapper library, matching
 * src/components/LineChart.tsx and the debt-projection-tool-v2 conventions.
 *
 * ── Why this is not LineChart ─────────────────────────────────────────────────
 * The Explorer's chart clears its SVG and redraws on every change
 * (`selectAll('*').remove()`). That is the right trade there: the parameters
 * move rarely and a full redraw is the simplest thing that is always correct.
 *
 * It is the wrong trade here. These widgets exist to be dragged, and the brief
 * is explicit that the animation IS the pedagogy: a line that jumps from one
 * shape to another shows a before and an after, while a line that MOVES shows
 * the mechanism doing the moving. So this chart keeps a stable DOM, joins on
 * series key, and transitions the path geometry, the y-axis and the end labels
 * together on one duration and one easing, so everything on screen moves as a
 * single object.
 *
 * The end labels count rather than cut, tweened through the intermediate
 * numbers. In a room, a number ticking from 36 to 51 is read as a consequence;
 * the same number replaced in place is read as a different chart.
 *
 * Path geometry is interpolated as a string. That is safe here and not in
 * general: every series in these widgets keeps a fixed year grid, so old and
 * new `d` strings have identical structure and their numbers pair up.
 */

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

import { chart as chartTheme, theme } from '../../theme';
import type { WidgetPoint, WidgetSeries } from './types';
import { useChartSize } from './useChartSize';

interface Props {
  series: WidgetSeries[];
  /** Starting height only. The chart then fills whatever its row gives it. */
  initialHeight?: number;
  /** Formats the y-axis, the end labels and the tooltip. */
  format?: (value: number) => string;
  /** Pin the y-axis so the eye measures movement against a fixed frame. */
  yDomain?: [number, number];
  /** Draw a rule at y = 0. Balances and deviations cross it. */
  zeroLine?: boolean;
  /** Milliseconds. The one duration everything on the chart shares. */
  duration?: number;
  /** A caption tied to the y-axis, since these charts carry no axis title. */
  yLabel?: string;
  /** Accessible name. The visible title lives in the widget frame, not here. */
  ariaLabel: string;
}

const MARGIN = { top: 14, right: 84, bottom: 28, left: 46 };
const DEFAULT_FORMAT = (v: number) => `${v.toFixed(1)}%`;
const EASE = d3.easeCubicOut;

/**
 * Tween a label's number from whatever it currently READS to a new value.
 *
 * The start value is parsed out of the element's own text rather than
 * remembered in a ref. A ref looked simpler and was wrong twice over: the tween
 * factory does not run until the transition starts a tick later, by which point
 * the ref holds the destination, and this effect can re-run mid-flight (the
 * legend appearing on first interaction resizes the plot, which is a genuine
 * re-render) leaving the second run to interpolate from the destination to the
 * destination. Both bugs look identical on screen: the number snaps instead of
 * counting, and no test catches it.
 *
 * Reading the DOM is also the honest statement of intent. The label should
 * count from what the audience can see to what it is about to say.
 */
function countTo(format: (value: number) => string) {
  return function (this: SVGTextElement, d: { value: number }) {
    const shown = Number.parseFloat(this.textContent ?? '');
    const from = Number.isFinite(shown) ? shown : d.value;
    const interpolate = d3.interpolateNumber(from, d.value);
    return (step: number) => {
      this.textContent = format(interpolate(step));
    };
  };
}

/** Create a child once and return it on every later pass. */
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

export function AnimatedLineChart({
  series,
  initialHeight = 300,
  format = DEFAULT_FORMAT,
  yDomain,
  zeroLine = false,
  duration = 450,
  yLabel,
  ariaLabel,
}: Props) {
  const { ref: wrapRef, width, height } = useChartSize({ width: 760, height: initialHeight });
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const wrap = wrapRef.current;
    if (!svg || !wrap) return;
    const points = series.flatMap((s) => s.points);
    if (!points.length) return;

    const innerW = Math.max(width - MARGIN.left - MARGIN.right, 10);
    const innerH = Math.max(height - MARGIN.top - MARGIN.bottom, 10);

    const root = d3.select(svg).attr('width', width).attr('height', height);
    const g = ensure<SVGGElement, SVGSVGElement>(root, 'g', 'wc__plot').attr(
      'transform',
      `translate(${MARGIN.left},${MARGIN.top})`,
    );

    const [yearLo, yearHi] = d3.extent(points, (p) => p.year) as [number, number];
    const x = d3.scaleLinear().domain([yearLo, yearHi]).range([0, innerW]);

    let domain = yDomain;
    if (!domain) {
      const [lo, hi] = d3.extent(points, (p) => p.value) as [number, number];
      const pad = Math.max((hi - lo) * 0.12, 0.5);
      domain = [zeroLine ? Math.min(lo - pad, 0) : lo - pad, hi + pad];
    }
    const y = d3.scaleLinear().domain(domain).nice().range([innerH, 0]);

    // Tick counts follow the plot, not a constant. The climate widget's cause
    // chart is deliberately short, and five y-ticks in 40px of height is an
    // unreadable stack of overlapping numbers.
    const yTicks = Math.max(Math.min(Math.floor(innerH / 40), 5), 2);
    const xTicks = Math.max(Math.floor(innerW / 90), 3);

    const t = d3.transition().duration(duration).ease(EASE);

    // ── Gridlines ───────────────────────────────────────────────────────────
    ensure<SVGGElement, SVGGElement>(g, 'g', 'wc__grid')
      .selectAll<SVGLineElement, number>('line')
      .data(y.ticks(yTicks), (d) => d as number)
      .join(
        (enter) =>
          enter
            .append('line')
            .attr('x1', 0)
            .attr('x2', innerW)
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

    // ── Zero rule ───────────────────────────────────────────────────────────
    const zero = ensure<SVGLineElement, SVGGElement>(g, 'line', 'wc__zero');
    if (zeroLine) {
      zero
        .attr('x1', 0)
        .attr('x2', innerW)
        .attr('stroke', theme.textSecondary)
        .attr('stroke-width', 1)
        .attr('opacity', 0.7)
        .transition(t)
        .attr('y1', y(0))
        .attr('y2', y(0));
    } else {
      zero.attr('opacity', 0);
    }

    // ── Lines ───────────────────────────────────────────────────────────────
    const line = d3
      .line<WidgetPoint>()
      .x((d) => x(d.year))
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    ensure<SVGGElement, SVGGElement>(g, 'g', 'wc__lines')
      .selectAll<SVGPathElement, WidgetSeries>('path')
      .data(series, (d) => d.key)
      .join(
        (enter) =>
          enter
            .append('path')
            .attr('fill', 'none')
            .attr('stroke-linejoin', 'round')
            .attr('stroke-linecap', 'round')
            .attr('d', (d) => line(d.points))
            .attr('opacity', 0),
        (update) => update,
        (exit) => exit.transition(t).attr('opacity', 0).remove(),
      )
      .attr('stroke', (d) => d.color)
      .attr('stroke-dasharray', (d) => (d.dashed ? '5,4' : null))
      .transition(t)
      .attr('opacity', (d) => (d.muted ? 0.32 : 1))
      .attr('stroke-width', (d) =>
        d.emphasis
          ? chartTheme.lineWidthEmphasis
          : d.muted
            ? 1.25
            : chartTheme.lineWidth,
      )
      .attr('d', (d) => line(d.points));

    // ── End labels, counted and de-collided ─────────────────────────────────
    // Same de-collision rule as the Explorer's chart: nudge apart rather than
    // drop, so a labelled series is never silently unlabelled.
    const labelled = series
      .filter((s) => s.directLabel && s.points.length)
      .map((s) => {
        const last = s.points[s.points.length - 1];
        return { key: s.key, color: s.color, value: last.value, y: y(last.value) };
      })
      .sort((a, b) => a.y - b.y);

    const MIN_GAP = 14;
    for (let i = 1; i < labelled.length; i += 1) {
      if (labelled[i].y - labelled[i - 1].y < MIN_GAP) {
        labelled[i].y = labelled[i - 1].y + MIN_GAP;
      }
    }

    ensure<SVGGElement, SVGGElement>(g, 'g', 'wc__labels')
      .selectAll<SVGTextElement, (typeof labelled)[number]>('text')
      .data(labelled, (d) => d.key)
      .join(
        (enter) =>
          enter
            .append('text')
            .attr('dy', '0.32em')
            .attr('font-size', 12)
            .attr('font-weight', 600)
            .attr('y', (d) => d.y)
            .text((d) => format(d.value)),
        (update) => update,
        (exit) => exit.remove(),
      )
      .attr('x', innerW + 8)
      .attr('fill', (d) => d.color)
      .transition(t)
      .attr('y', (d) => Math.min(Math.max(d.y, 8), innerH))
      .tween('value', countTo(format));

    // ── Hover: crosshair and tooltip ────────────────────────────────────────
    const hover = ensure<SVGGElement, SVGGElement>(g, 'g', 'wc__hover')
      .style('display', 'none')
      .style('pointer-events', 'none');
    ensure<SVGLineElement, SVGGElement>(hover, 'line', 'wc__crosshair')
      .attr('y1', 0)
      .attr('y2', innerH)
      .attr('stroke', theme.textSecondary)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,3');

    const dots = ensure<SVGGElement, SVGGElement>(hover, 'g', 'wc__dots')
      .selectAll<SVGCircleElement, WidgetSeries>('circle')
      .data(series, (d) => d.key)
      .join('circle')
      .attr('r', 4)
      .attr('fill', (d) => d.color)
      .attr('stroke', theme.surfaceRaised)
      .attr('stroke-width', 2);

    let tooltip = d3.select(wrap).select<HTMLDivElement>('.wc__tooltip');
    if (tooltip.empty()) {
      tooltip = d3
        .select(wrap)
        .append('div')
        .attr('class', 'wc__tooltip')
        .style('display', 'none');
    }

    const lookup = series.map((s) => ({
      series: s,
      byYear: new Map(s.points.map((p) => [p.year, p.value])),
    }));

    ensure<SVGRectElement, SVGGElement>(g, 'rect', 'wc__capture')
      .attr('width', innerW)
      .attr('height', innerH)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair')
      .on('mousemove', (event: MouseEvent) => {
        const [mx] = d3.pointer(event, g.node());
        const year = Math.round(Math.min(Math.max(x.invert(mx), yearLo), yearHi));
        const cx = x(year);
        const rows = lookup
          .map(({ series: s, byYear }) => ({ s, value: byYear.get(year) }))
          .filter((r): r is { s: WidgetSeries; value: number } => r.value != null);
        if (!rows.length) return;

        hover.style('display', 'block');
        hover.select('.wc__crosshair').attr('x1', cx).attr('x2', cx);
        dots
          .attr('cx', cx)
          .attr('cy', (d) => {
            const v = lookup.find((l) => l.series.key === d.key)?.byYear.get(year);
            return v == null ? -100 : y(v);
          })
          .style('display', (d) =>
            lookup.find((l) => l.series.key === d.key)?.byYear.get(year) == null
              ? 'none'
              : 'block',
          );

        rows.sort((a, b) => b.value - a.value);
        const flipLeft = cx + MARGIN.left > width - 200;
        tooltip
          .style('display', 'block')
          .style('left', flipLeft ? 'auto' : `${cx + MARGIN.left + 14}px`)
          .style('right', flipLeft ? `${width - cx - MARGIN.left + 14}px` : 'auto')
          .style('top', `${MARGIN.top}px`)
          .html(
            `<div class="wc__tooltip-year">${year}</div>` +
              rows
                .map(
                  (r) =>
                    '<div class="wc__tooltip-row">' +
                    `<span class="wc__tooltip-swatch" style="background:${r.s.color}"></span>` +
                    `<span class="wc__tooltip-label">${r.s.label}</span>` +
                    `<strong>${format(r.value)}</strong></div>`,
                )
                .join(''),
          );
      })
      .on('mouseleave', () => {
        hover.style('display', 'none');
        tooltip.style('display', 'none');
      });
  }, [series, width, height, format, yDomain, zeroLine, duration, wrapRef]);

  return (
    <div className="wc">
      {yLabel && <p className="wc__y-label">{yLabel}</p>}
      <div ref={wrapRef} className="wc__plot-wrap">
        <svg ref={svgRef} role="img" aria-label={ariaLabel} />
      </div>
    </div>
  );
}
