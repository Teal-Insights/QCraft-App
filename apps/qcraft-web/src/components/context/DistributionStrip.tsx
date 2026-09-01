/**
 * One row of a distribution: every country in the peer set as a tick, the
 * middle half as a band, and this country marked and named.
 *
 * A strip rather than a histogram because the question is "where am I", not
 * "what shape is the world". A histogram answers the second and makes a reader
 * hunt for their own bar; a strip puts the country on the same line as the
 * distribution it belongs to, and a label on it.
 *
 * Two markers, and they are different claims, so they are drawn differently.
 * The country mark is a fact about the record. The setting mark is what the
 * user has typed into the sidebar, drawn as a rule with a caret so it reads as
 * an intention rather than an observation. Where a statistic is not on the same
 * scale as any parameter, the caller passes no setting and the rule is absent.
 *
 * Several of these stack into a small-multiple view. When they do, the caller
 * passes one shared `domain` so the rows are comparable, which is the whole
 * reason to stack them.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

import { brand, context as contextTheme, theme } from '../../theme';
import { robustDomain, type Distribution } from '../../context/peers';

interface Props {
  /** What this row measures, in words a reader can hold. */
  label: string;
  /** Second line: the window or vintage the statistic is read over. */
  sublabel?: string;
  distribution: Distribution;
  /** The country to mark, and the name to write beside it. */
  iso3c: string;
  countryName: string;
  /** The sidebar setting, where it lives on this scale. */
  setting?: { value: number; label: string };
  /** Shared across a small-multiple stack; computed from the data when absent. */
  domain?: [number, number];
  format: (value: number) => string;
  /**
   * Draw the axis. Rows in a shared-domain stack turn it off except for the
   * last, which is what makes the stack read as one chart with one scale
   * instead of three charts that happen to line up.
   */
  showAxis?: boolean;
}

/**
 * Geometry, written as absolute offsets rather than derived from an inner
 * height, because three things have to clear each other in a 100-pixel row: the
 * setting caret above the strip, the country label below it, and the axis below
 * that. Deriving them from a single inner height is how the country label ended
 * up printed over the tick labels.
 */
const MARGIN = { top: 26, right: 24, left: 24 };
/** Half-height of a peer tick, measured from the strip's centre line. */
const TICK = 11;
/** Centre line of the strip, from the top of the svg. */
const MID = MARGIN.top + TICK + 4;
/** Baseline of the country label, below the strip. */
const COUNTRY_LABEL_Y = MID + TICK + 17;
/** Top of the axis group. */
const AXIS_Y = MID + TICK + 26;

export function DistributionStrip({
  label,
  sublabel,
  distribution,
  iso3c,
  countryName,
  setting,
  domain,
  format,
  showAxis = true,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [width, setWidth] = useState(700);
  const [hovered, setHovered] = useState<string | null>(null);

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

  const own = distribution.points.find((p) => p.iso3c === iso3c);

  const extent = useMemo((): [number, number] => {
    if (domain) return domain;
    return robustDomain(
      distribution.points.map((p) => p.value),
      [...(setting ? [setting.value] : []), ...(own ? [own.value] : [])],
    );
  }, [domain, distribution, setting, own]);

  /** Countries the axis cannot reach, pinned to its edges and counted. */
  const beyond = distribution.points.filter(
    (p) => p.value < extent[0] || p.value > extent[1],
  ).length;
  const hoveredPoint = distribution.points.find((p) => p.iso3c === hovered);
  /** Rows without an axis end just under the country label. */
  const height = showAxis ? AXIS_Y + 22 : COUNTRY_LABEL_Y + 8;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const innerW = Math.max(width - MARGIN.left - MARGIN.right, 10);
    // The group is translated horizontally only, so every y below is the
    // absolute offset the geometry constants declare.
    const mid = MID;

    d3.select(svg).selectAll('*').remove();
    const g = d3
      .select(svg)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${MARGIN.left},0)`);

    const x = d3.scaleLinear().domain(extent).range([0, innerW]);

    // ── The middle half, drawn behind everything ───────────────────────────
    g.append('rect')
      .attr('x', x(distribution.p25))
      .attr('y', mid - TICK - 3)
      .attr('width', Math.max(x(distribution.p75) - x(distribution.p25), 1))
      .attr('height', (TICK + 3) * 2)
      .attr('fill', brand.soft)
      .attr('opacity', 0.75);

    // The median rule runs past the ticks at both ends, so it stays findable
    // inside a pile-up rather than reading as one more country.
    g.append('line')
      .attr('x1', x(distribution.median))
      .attr('x2', x(distribution.median))
      .attr('y1', mid - TICK - 7)
      .attr('y2', mid + TICK + 7)
      .attr('stroke', theme.textSecondary)
      .attr('stroke-width', 1.5);

    // ── One tick per country ───────────────────────────────────────────────
    // Low opacity so a pile-up reads as density rather than as one thick mark.
    // Countries past the end of the axis are clamped to it, and the arrowheads
    // below say they are past it rather than at it.
    const place = (value: number) => x(Math.min(Math.max(value, extent[0]), extent[1]));

    g.append('g')
      .selectAll('line')
      .data(distribution.points.filter((p) => p.iso3c !== iso3c))
      .join('line')
      .attr('x1', (p) => place(p.value))
      .attr('x2', (p) => place(p.value))
      .attr('y1', mid - TICK)
      .attr('y2', mid + TICK)
      .attr('stroke', (p) =>
        p.iso3c === hovered ? contextTheme.comparator[0] : theme.textSecondary,
      )
      .attr('stroke-width', (p) => (p.iso3c === hovered ? 2.5 : 1.25))
      .attr('opacity', (p) => (p.iso3c === hovered ? 1 : 0.4));

    for (const [edge, count, direction] of [
      [
        extent[0],
        distribution.points.filter((p) => p.value < extent[0]).length,
        -1,
      ],
      [
        extent[1],
        distribution.points.filter((p) => p.value > extent[1]).length,
        1,
      ],
    ] as const) {
      if (!count) continue;
      const ex = x(edge) + direction * 3;
      g.append('path')
        .attr('d', `M${ex},${mid - 5} L${ex + direction * 7},${mid} L${ex},${mid + 5} Z`)
        .attr('fill', theme.textSecondary)
        .attr('opacity', 0.8)
        .append('title')
        .text(`${count} beyond the axis`);
    }

    // ── The setting the user has chosen ────────────────────────────────────
    if (setting && setting.value >= extent[0] && setting.value <= extent[1]) {
      const sx = x(setting.value);
      g.append('line')
        .attr('x1', sx)
        .attr('x2', sx)
        .attr('y1', mid - TICK - 9)
        .attr('y2', mid + TICK + 3)
        .attr('stroke', contextTheme.chosen)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3 2');
      g.append('path')
        .attr('d', `M${sx - 4},${mid - TICK - 9} L${sx + 4},${mid - TICK - 9} L${sx},${mid - TICK - 3} Z`)
        .attr('fill', contextTheme.chosen);
      g.append('text')
        .attr('x', sx)
        .attr('y', mid - TICK - 14)
        .attr('text-anchor', sx > innerW - 60 ? 'end' : sx < 60 ? 'start' : 'middle')
        .attr('fill', contextTheme.chosen)
        .attr('font-size', 11)
        .text(setting.label);
    }

    // ── This country ───────────────────────────────────────────────────────
    if (own) {
      const ox = place(own.value);
      g.append('line')
        .attr('x1', ox)
        .attr('x2', ox)
        .attr('y1', mid - TICK - 3)
        .attr('y2', mid + TICK + 3)
        .attr('stroke', contextTheme.record)
        .attr('stroke-width', 3);
      g.append('circle')
        .attr('cx', ox)
        .attr('cy', mid + TICK + 3)
        .attr('r', 3)
        .attr('fill', contextTheme.record);
      g.append('text')
        .attr('x', ox)
        .attr('y', COUNTRY_LABEL_Y)
        .attr('text-anchor', ox > innerW - 70 ? 'end' : ox < 70 ? 'start' : 'middle')
        .attr('fill', contextTheme.record)
        .attr('font-size', 11.5)
        .attr('font-weight', 600)
        .text(`${countryName} ${format(own.value)}`);
    }

    // ── Axis ───────────────────────────────────────────────────────────────
    if (showAxis) {
      const axis = d3
        .axisBottom(x)
        .ticks(Math.max(3, Math.floor(innerW / 110)))
        .tickFormat((v) => format(Number(v)))
        .tickSize(0);
      const axisG = g.append('g').attr('transform', `translate(0,${AXIS_Y})`).call(axis);
      axisG.select('.domain').remove();
      axisG
        .selectAll('text')
        .attr('fill', theme.textSecondary)
        .attr('font-size', 10.5);
    }

    // ── Hit area, so a reader can ask who a tick is ────────────────────────
    g.append('rect')
      .attr('x', 0)
      .attr('y', mid - TICK - 8)
      .attr('width', innerW)
      .attr('height', (TICK + 8) * 2)
      .attr('fill', 'transparent')
      .on('mousemove', (event: MouseEvent) => {
        const [px] = d3.pointer(event);
        const target = x.invert(px);
        let best: string | null = null;
        let bestDistance = Infinity;
        for (const point of distribution.points) {
          const distance = Math.abs(place(point.value) - x(target));
          if (distance < bestDistance) {
            bestDistance = distance;
            best = point.iso3c;
          }
        }
        setHovered(bestDistance <= 8 ? best : null);
      })
      .on('mouseleave', () => setHovered(null));
  }, [width, height, extent, distribution, iso3c, countryName, setting, format, own, hovered, showAxis]);

  return (
    <div className="dstrip" ref={wrapRef}>
      <div className="dstrip__head">
        <span className="dstrip__label">{label}</span>
        {(sublabel || beyond > 0) && (
          <span className="dstrip__sublabel">
            {[sublabel, beyond ? `${beyond} beyond the axis` : null]
              .filter(Boolean)
              .join('. ')}
          </span>
        )}
        <span className="dstrip__readout" aria-live="polite">
          {hoveredPoint
            ? `${hoveredPoint.name} ${format(hoveredPoint.value)}`
            : `median ${format(distribution.median)}`}
        </span>
      </div>
      <svg
        ref={svgRef}
        role="img"
        aria-label={stripDescription(label, distribution, own, format, beyond)}
      />
    </div>
  );
}

/**
 * The alt text. A screen-reader user gets the same three facts a sighted reader
 * takes off the strip: the middle, the middle half, and where this country is.
 */
function stripDescription(
  label: string,
  dist: Distribution,
  own: { name: string; value: number } | undefined,
  format: (value: number) => string,
  beyond: number,
): string {
  const spread =
    `${dist.points.length} countries. Median ${format(dist.median)}, ` +
    `middle half ${format(dist.p25)} to ${format(dist.p75)}.`;
  const here = own ? ` ${own.name} is at ${format(own.value)}.` : '';
  const pinned = beyond ? ` ${beyond} sit beyond the axis and are drawn at its edge.` : '';
  return `${label}. ${spread}${here}${pinned}`;
}
