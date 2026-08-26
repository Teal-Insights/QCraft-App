/**
 * The one chart component. Every chart in the app is this, configured.
 *
 * Design decisions worth knowing before editing:
 *  - Responsive by ResizeObserver, not by a fixed viewBox scale, so text stays
 *    at a real pixel size instead of shrinking with the container.
 *  - Titles are takeaways, passed in by the caller. The subtitle carries units,
 *    so the y-axis does not need an axis title.
 *  - Direct labels at the line ends are SELECTIVE (`directLabel` per series) —
 *    seven labels on seven lines is a pile-up. Colliding labels are nudged apart
 *    vertically rather than dropped, so a labelled series is never silently
 *    unlabelled.
 *  - A legend renders whenever there are 2+ series, so identity is never carried
 *    by colour alone.
 *  - Crosshair + tooltip ship by default on every line chart.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

import type { ChartPoint, ChartSeries } from '../charts/types';
import { xTickFormat, yTickFormat } from '../charts/ticks';
import { chart as chartTheme, theme } from '../theme';

export type { ChartPoint, ChartSeries };

interface Props {
  title: string;
  subtitle?: string;
  series: ChartSeries[];
  height?: number;
  /** Draws the WEO history/forecast shading and boundary rule at this year. */
  weoBoundaryYear?: number;
  /**
   * First year of the shaded observed band. Defaults to the fixtures' own first
   * year, which is right for a chart whose whole record is WEO. A chart whose
   * record comes from somewhere else must say so: shading a World Bank series
   * as WEO data is a false claim about provenance, and these panels are read by
   * people deciding what to believe.
   */
  historyStart?: number;
  /** Draws a rule at y = 0 (for balances, which cross zero). */
  zeroLine?: boolean;
  /** Formats values in the tooltip and direct labels. */
  format?: (value: number) => string;
  /** Optional annotation pinned to a data point. */
  annotation?: { year: number; value: number; text: string; color?: string };
}

const defaultFormat = (v: number) => `${v.toFixed(1)}%`;

/** First year in the fixtures; the Shiny app shades from here. */
const HISTORY_START = 2009;

export function LineChart({
  title,
  subtitle,
  series,
  height = 380,
  weoBoundaryYear,
  historyStart = HISTORY_START,
  zeroLine = false,
  format = defaultFormat,
  annotation,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [width, setWidth] = useState(760);

  // Track the container width so the chart reflows with the layout. Falls back
  // to the initial state width when ResizeObserver reports 0 (hidden tab).
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

  const domains = useMemo(() => {
    const points = series.flatMap((s) => s.points);
    const years = d3.extent(points, (p) => p.year) as [number, number];
    const [lo, hi] = d3.extent(points, (p) => p.value) as [number, number];
    // 8% padding so lines and their end labels never graze the frame.
    const pad = Math.max((hi - lo) * 0.08, 0.5);
    return {
      years,
      values: [zeroLine ? Math.min(lo - pad, 0) : lo - pad, hi + pad] as [number, number],
    };
  }, [series, zeroLine]);

  useEffect(() => {
    const svg = svgRef.current;
    const wrap = wrapRef.current;
    if (!svg || !wrap) return;
    if (!series.length || !series.some((s) => s.points.length)) return;

    const { margin } = chartTheme;
    const innerW = Math.max(width - margin.left - margin.right, 10);
    const innerH = Math.max(height - margin.top - margin.bottom, 10);

    d3.select(svg).selectAll('*').remove();
    d3.select(wrap).selectAll('.chart__tooltip').remove();

    const root = d3.select(svg).attr('width', width).attr('height', height);
    const g = root
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain(domains.years).range([0, innerW]);
    const y = d3.scaleLinear().domain(domains.values).nice().range([innerH, 0]);

    // ── WEO history shading + boundary ──────────────────────────────────────
    // The shaded band says "this part is data, the rest is projection" without
    // a second legend entry.
    if (weoBoundaryYear != null && domains.years[0] <= weoBoundaryYear) {
      g.append('rect')
        .attr('x', x(Math.max(historyStart, domains.years[0])))
        .attr('y', 0)
        .attr('width', Math.max(x(weoBoundaryYear) - x(Math.max(historyStart, domains.years[0])), 0))
        .attr('height', innerH)
        .attr('fill', theme.surfaceSunken);
    }

    // ── Gridlines (recessive) ───────────────────────────────────────────────
    g.append('g')
      .attr('class', 'chart__grid')
      .selectAll('line')
      .data(y.ticks(6))
      .join('line')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('y1', (d) => y(d))
      .attr('y2', (d) => y(d))
      .attr('stroke', chartTheme.gridStroke)
      .attr('stroke-width', 1);

    if (zeroLine) {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerW)
        .attr('y1', y(0))
        .attr('y2', y(0))
        .attr('stroke', theme.textMuted)
        .attr('stroke-width', 1);
    }

    // ── Axes ────────────────────────────────────────────────────────────────
    const xAxis = g
      .append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(7).tickFormat(xTickFormat).tickSizeOuter(0));
    const yAxis = g
      .append('g')
      .call(d3.axisLeft(y).ticks(6).tickFormat(yTickFormat).tickSizeOuter(0));

    for (const axis of [xAxis, yAxis]) {
      axis.selectAll('text').attr('fill', chartTheme.axisText).attr('font-size', 11);
      axis.selectAll('path, line').attr('stroke', chartTheme.axisStroke);
    }

    // ── WEO boundary rule ───────────────────────────────────────────────────
    if (weoBoundaryYear != null && domains.years[0] <= weoBoundaryYear) {
      g.append('line')
        .attr('x1', x(weoBoundaryYear))
        .attr('x2', x(weoBoundaryYear))
        .attr('y1', 0)
        .attr('y2', innerH)
        .attr('stroke', theme.textMuted)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3');
      // Sits at the FOOT of the boundary rule, not the head: annotations are
      // pinned to data and data crowds the top of these charts, so a top-anchored
      // boundary label collides with them (it did — "Peak 51.4% in 2024" landed
      // straight on it). The bottom strip is always empty.
      g.append('text')
        .attr('x', x(weoBoundaryYear) + 5)
        .attr('y', innerH - 6)
        .attr('font-size', 9)
        .attr('font-weight', 700)
        .attr('letter-spacing', '0.06em')
        .attr('fill', theme.textMuted)
        .text(`WEO → ${weoBoundaryYear}`);
    }

    // ── Lines ───────────────────────────────────────────────────────────────
    const line = d3
      .line<ChartPoint>()
      .x((d) => x(d.year))
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    for (const s of series) {
      const path = g
        .append('path')
        .datum(s.points)
        .attr('fill', 'none')
        .attr('stroke', s.color)
        .attr('stroke-width', s.emphasis ? chartTheme.lineWidthEmphasis : chartTheme.lineWidth)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('d', line);
      if (s.dashed) path.attr('stroke-dasharray', '6,4');
    }

    // ── Direct labels, de-collided ──────────────────────────────────────────
    // Labels are placed at each series' final value, then pushed apart to a
    // minimum spacing. Dropping a label instead would make a labelled series
    // look unlabelled, which is worse than a small vertical offset.
    const labelled = series
      .filter((s) => s.directLabel && s.points.length)
      .map((s) => {
        const last = s.points[s.points.length - 1];
        return { color: s.color, text: format(last.value), y: y(last.value) };
      })
      .sort((a, b) => a.y - b.y);

    const MIN_GAP = 13;
    for (let i = 1; i < labelled.length; i += 1) {
      if (labelled[i].y - labelled[i - 1].y < MIN_GAP) {
        labelled[i].y = labelled[i - 1].y + MIN_GAP;
      }
    }
    for (const label of labelled) {
      g.append('text')
        .attr('x', innerW + 6)
        .attr('y', Math.min(Math.max(label.y, 8), innerH))
        .attr('dy', '0.32em')
        .attr('font-size', 11)
        .attr('font-weight', 600)
        .attr('fill', label.color)
        .text(label.text);
    }

    // ── Annotation on the data ──────────────────────────────────────────────
    if (annotation) {
      const ax = x(annotation.year);
      const ay = y(annotation.value);
      const color = annotation.color ?? theme.textSecondary;
      // Flip the callout to the left half when the anchor sits past midway,
      // so it never runs off the right edge.
      const flip = ax > innerW * 0.55;
      g.append('circle')
        .attr('cx', ax)
        .attr('cy', ay)
        .attr('r', 4)
        .attr('fill', theme.surfaceRaised)
        .attr('stroke', color)
        .attr('stroke-width', 2);
      g.append('text')
        .attr('x', flip ? ax - 10 : ax + 10)
        .attr('y', ay - 10)
        .attr('text-anchor', flip ? 'end' : 'start')
        .attr('font-size', 11)
        .attr('fill', theme.textSecondary)
        .text(annotation.text);
    }

    // ── Hover: crosshair + tooltip ──────────────────────────────────────────
    const hover = g.append('g').style('display', 'none').style('pointer-events', 'none');
    hover
      .append('line')
      .attr('class', 'chart__crosshair')
      .attr('y1', 0)
      .attr('y2', innerH)
      .attr('stroke', theme.textSecondary)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,3');

    const dots = hover
      .selectAll('circle')
      .data(series)
      .join('circle')
      .attr('r', 4)
      .attr('fill', (d) => d.color)
      .attr('stroke', theme.surfaceRaised)
      .attr('stroke-width', 2);

    const tooltip = d3
      .select(wrap)
      .append('div')
      .attr('class', 'chart__tooltip')
      .style('display', 'none');

    const byYear = series.map((s) => ({
      series: s,
      lookup: new Map(s.points.map((p) => [p.year, p.value])),
    }));

    const capture = g
      .append('rect')
      .attr('width', innerW)
      .attr('height', innerH)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair');

    capture
      .on('mousemove', function (event: MouseEvent) {
        const [mx] = d3.pointer(event, g.node());
        const year = Math.round(
          Math.min(Math.max(x.invert(mx), domains.years[0]), domains.years[1]),
        );
        const cx = x(year);

        const rows = byYear
          .map(({ series: s, lookup }) => ({ s, value: lookup.get(year) }))
          .filter((r): r is { s: ChartSeries; value: number } => r.value != null);
        if (!rows.length) return;

        hover.style('display', 'block');
        hover.select('.chart__crosshair').attr('x1', cx).attr('x2', cx);
        dots
          .attr('cx', cx)
          .attr('cy', (d) => {
            const v = byYear.find((b) => b.series.key === d.key)?.lookup.get(year);
            return v == null ? -100 : y(v);
          })
          .style('display', (d) =>
            byYear.find((b) => b.series.key === d.key)?.lookup.get(year) == null
              ? 'none'
              : 'block',
          );

        // Biggest value first so the tooltip reads in the same order the lines
        // stack on screen at the hovered year.
        rows.sort((a, b) => b.value - a.value);

        const flipLeft = cx + margin.left > width - 220;
        tooltip
          .style('display', 'block')
          .style('left', flipLeft ? 'auto' : `${cx + margin.left + 14}px`)
          .style('right', flipLeft ? `${width - cx - margin.left + 14}px` : 'auto')
          .style('top', `${margin.top + 8}px`)
          .html(
            `<div class="chart__tooltip-year">${year}${
              weoBoundaryYear != null && year <= weoBoundaryYear ? ' · WEO data' : ''
            }</div>` +
              rows
                .map(
                  (r) =>
                    `<div class="chart__tooltip-row">` +
                    `<span class="chart__tooltip-swatch" style="background:${r.s.color}"></span>` +
                    `<span class="chart__tooltip-label">${r.s.label}</span>` +
                    `<strong>${format(r.value)}</strong></div>`,
                )
                .join(''),
          );
      })
      .on('mouseleave', () => {
        hover.style('display', 'none');
        tooltip.style('display', 'none');
      });
  }, [
    series,
    width,
    height,
    domains,
    weoBoundaryYear,
    historyStart,
    zeroLine,
    format,
    annotation,
  ]);

  return (
    <figure className="chart">
      <figcaption className="chart__head">
        <h3 className="chart__title">{title}</h3>
        {subtitle && <p className="chart__subtitle">{subtitle}</p>}
      </figcaption>

      {series.length > 1 && (
        <ul className="chart__legend">
          {series.map((s) => (
            <li key={s.key} className="chart__legend-item">
              <span
                className="chart__legend-line"
                style={
                  // The swatch carries the dash as well as the colour, so the
                  // legend matches the mark for a reader who is going by
                  // pattern rather than hue.
                  s.dashed
                    ? {
                        background: `repeating-linear-gradient(90deg, ${s.color} 0 6px, transparent 6px 10px)`,
                      }
                    : { background: s.color }
                }
              />
              {s.label}
            </li>
          ))}
        </ul>
      )}

      <div ref={wrapRef} className="chart__plot">
        <svg ref={svgRef} role="img" aria-label={title} />
      </div>
    </figure>
  );
}
