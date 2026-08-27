/**
 * The one chart component. Every chart in the app is this, configured.
 *
 * Design decisions worth knowing before editing:
 *  - It draws nothing itself. `charts/plan.ts` compiles the spec into drawing
 *    primitives and this component paints them, which is how the export packet
 *    can render the identical picture with no DOM. Layout arithmetic does not
 *    belong here; if a decoration needs positioning, it needs positioning in
 *    the plan, where both renderers get it.
 *  - Responsive by ResizeObserver, not by a fixed viewBox scale, so text stays
 *    at a real pixel size instead of shrinking with the container.
 *  - Titles are takeaways, passed in by the caller. The subtitle carries units,
 *    so the y-axis does not need an axis title.
 *  - A legend renders whenever there are 2+ series, so identity is never carried
 *    by colour alone. Grayed-down series stay in it, in their muted stroke: the
 *    briefing register removes their emphasis, never their identity.
 *  - Crosshair + tooltip ship by default on every line chart, and the tooltip
 *    lists every series in its own colour, which is the relief that lets muted
 *    and low-contrast strokes be used at all.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

import type {
  ChartAnnotation,
  ChartBand,
  ChartBracket,
  ChartPoint,
  ChartSeries,
  ChartSpec,
  ChartThreshold,
} from '../charts/types';
import { buildChartPlan, defaultFormat, type ChartPrim } from '../charts/plan';
import { REGISTER_LABEL, type ChartRegister } from '../charts/register';
import { chart as chartTheme, theme } from '../theme';

export type { ChartPoint, ChartSeries };

interface Props {
  title: string;
  subtitle?: string;
  series: ChartSeries[];
  height?: number;
  bands?: ChartBand[];
  thresholds?: ChartThreshold[];
  brackets?: ChartBracket[];
  annotations?: ChartAnnotation[];
  /**
   * Single-annotation form, kept because the parameter context panels use it
   * and they are a different workstream's files. Merged into `annotations`.
   */
  annotation?: ChartAnnotation;
  /** Draws the WEO history/forecast shading and boundary rule at this year. */
  weoBoundaryYear?: number;
  /** First year of the shaded observed band. See ChartSpec for why it matters. */
  historyStart?: number;
  /** Draws a rule at y = 0 (for balances, which cross zero). */
  zeroLine?: boolean;
  /** Formats values in the tooltip and direct labels. */
  format?: (value: number) => string;
  /** Printed under the plot. Every figure carries where its numbers came from. */
  source?: string;
  legend?: boolean;

  /* Register control. Shown only when the caller can actually switch. */
  register?: ChartRegister;
  registers?: ChartRegister[];
  onRegisterChange?: (register: ChartRegister) => void;
  /** True when this chart is not following the global choice. */
  overridden?: boolean;
  onFollowGlobal?: () => void;
}

/** Paint one primitive into a d3 selection. */
function paint(g: d3.Selection<SVGGElement, unknown, null, undefined>, p: ChartPrim) {
  switch (p.kind) {
    case 'rect':
      g.append('rect')
        .attr('x', p.x)
        .attr('y', p.y)
        .attr('width', p.width)
        .attr('height', p.height)
        .attr('fill', p.fill)
        .attr('opacity', p.opacity ?? null);
      return;

    case 'line':
      g.append('line')
        .attr('x1', p.x1)
        .attr('x2', p.x2)
        .attr('y1', p.y1)
        .attr('y2', p.y2)
        .attr('stroke', p.stroke)
        .attr('stroke-width', p.width)
        .attr('stroke-dasharray', p.dash ?? null);
      return;

    case 'path':
      g.append('path')
        .attr('d', p.d)
        .attr('fill', p.fill ?? 'none')
        .attr('stroke', p.stroke ?? null)
        .attr('stroke-width', p.width ?? null)
        .attr('stroke-linejoin', p.stroke ? 'round' : null)
        .attr('stroke-linecap', p.stroke ? 'round' : null)
        .attr('stroke-dasharray', p.dash ?? null)
        .attr('opacity', p.opacity ?? null);
      return;

    case 'text':
      g.append('text')
        .attr('x', p.x)
        .attr('y', p.y)
        .attr('text-anchor', p.anchor ?? null)
        .attr('dy', p.dy ?? null)
        .attr('font-size', p.size)
        .attr('font-weight', p.weight ?? null)
        .attr('letter-spacing', p.letterSpacing ?? null)
        // Halo under the glyphs, so a callout stays readable where it has to
        // sit: on top of the line it is about.
        .attr('stroke', p.halo ?? null)
        .attr('stroke-width', p.halo ? 3 : null)
        .attr('stroke-linejoin', p.halo ? 'round' : null)
        .attr('paint-order', p.halo ? 'stroke' : null)
        .attr('fill', p.fill)
        .text(p.text);
      return;

    case 'circle':
      g.append('circle')
        .attr('cx', p.cx)
        .attr('cy', p.cy)
        .attr('r', p.r)
        .attr('fill', p.fill)
        .attr('stroke', p.stroke ?? null)
        .attr('stroke-width', p.width ?? null);
      return;
  }
}

export function LineChart({
  title,
  subtitle,
  series,
  height = 380,
  bands,
  thresholds,
  brackets,
  annotations,
  annotation,
  weoBoundaryYear,
  historyStart,
  zeroLine = false,
  format = defaultFormat,
  source,
  legend,
  register,
  registers,
  onRegisterChange,
  overridden,
  onFollowGlobal,
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

  const allAnnotations = useMemo(() => {
    const merged = [...(annotations ?? [])];
    if (annotation) merged.push(annotation);
    return merged;
  }, [annotations, annotation]);

  const spec = useMemo<ChartSpec>(
    () => ({
      id: title,
      title,
      subtitle,
      series,
      bands,
      thresholds,
      brackets,
      annotations: allAnnotations,
      weoBoundaryYear,
      historyStart,
      zeroLine,
      format,
      height,
    }),
    [
      title,
      subtitle,
      series,
      bands,
      thresholds,
      brackets,
      allAnnotations,
      weoBoundaryYear,
      historyStart,
      zeroLine,
      format,
      height,
    ],
  );

  const plan = useMemo(() => buildChartPlan(spec, { width, height }), [spec, width, height]);

  useEffect(() => {
    const svg = svgRef.current;
    const wrap = wrapRef.current;
    if (!svg || !wrap) return;

    d3.select(svg).selectAll('*').remove();
    d3.select(wrap).selectAll('.chart__tooltip').remove();
    if (plan.empty) return;

    const { margin, innerW, innerH, x, y } = plan;
    const root = d3.select(svg).attr('width', width).attr('height', height);
    const g = root
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    for (const prim of plan.prims) paint(g, prim);

    // ── Hover: crosshair + tooltip ──────────────────────────────────────────
    // Everything above is the picture, which the export renders identically.
    // Everything below is interaction, which paper has none of, so it lives
    // here rather than in the plan.
    const drawable = series.filter((s) => s.points.length);
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
      .data(drawable)
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

    const byYear = drawable.map((s) => ({
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
          Math.min(Math.max(x.invert(mx), plan.years[0]), plan.years[1]),
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
  }, [plan, series, width, height, weoBoundaryYear, format]);

  const showLegend = legend ?? series.length > 1;
  const showRegisterControl =
    register != null && registers != null && registers.length > 1 && onRegisterChange != null;

  return (
    <figure className="chart">
      <figcaption className="chart__head">
        <div className="chart__head-row">
          <h3 className="chart__title">{title}</h3>
          {showRegisterControl && (
            <div
              className="chart__register"
              role="radiogroup"
              aria-label={`Chart view for: ${title}`}
            >
              {registers.map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={register === r}
                  className={`chart__register-option${
                    register === r ? ' chart__register-option--on' : ''
                  }`}
                  onClick={() => onRegisterChange(r)}
                >
                  {REGISTER_LABEL[r]}
                </button>
              ))}
            </div>
          )}
        </div>
        {subtitle && <p className="chart__subtitle">{subtitle}</p>}
        {overridden && onFollowGlobal && (
          <p className="chart__override">
            This chart is set on its own.{' '}
            <button type="button" className="linkish" onClick={onFollowGlobal}>
              Follow the page setting
            </button>
          </p>
        )}
      </figcaption>

      {showLegend && (
        <ul className="chart__legend">
          {series.map((s) => (
            <li
              key={s.key}
              className={`chart__legend-item${s.muted ? ' chart__legend-item--muted' : ''}`}
            >
              <span
                className="chart__legend-line"
                style={
                  // The swatch carries the dash as well as the colour, so the
                  // legend matches the mark for a reader who is going by
                  // pattern rather than hue.
                  s.dashed
                    ? {
                        background: `repeating-linear-gradient(90deg, ${
                          s.muted ? chartTheme.mutedStroke : s.color
                        } 0 6px, transparent 6px 10px)`,
                      }
                    : { background: s.muted ? chartTheme.mutedStroke : s.color }
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

      {source && <p className="chart__source">{source}</p>}
    </figure>
  );
}

/** Render a whole spec, so a tab does not have to spread twelve props. */
export function SpecChart({
  spec,
  ...controls
}: {
  spec: ChartSpec;
  register?: ChartRegister;
  registers?: ChartRegister[];
  onRegisterChange?: (register: ChartRegister) => void;
  overridden?: boolean;
  onFollowGlobal?: () => void;
}) {
  return (
    <LineChart
      title={spec.title}
      subtitle={spec.subtitle}
      series={spec.series}
      height={spec.height}
      bands={spec.bands}
      thresholds={spec.thresholds}
      brackets={spec.brackets}
      annotations={spec.annotations}
      weoBoundaryYear={spec.weoBoundaryYear}
      historyStart={spec.historyStart}
      zeroLine={spec.zeroLine}
      format={spec.format}
      source={spec.source}
      legend={spec.legend}
      {...controls}
    />
  );
}
