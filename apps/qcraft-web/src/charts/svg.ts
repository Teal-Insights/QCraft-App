/**
 * Primitives to an SVG string.
 *
 * The whole of this module is a switch over `ChartPrim`. It holds no layout
 * arithmetic, because the layout already happened in `plan.ts`, which the
 * on-screen chart compiles from the same spec. That is the point: the printed
 * chart is the chart the reader was looking at, by construction rather than by
 * two implementations agreeing to stay in step.
 *
 * Pure, DOM-free, so it runs under vitest and in a Node export step alike.
 */

import { buildChartPlan, round, type ChartPrim } from './plan';
import type { ChartSpec } from './types';
import { chart as chartTheme, fonts, theme } from '../theme';

const MUTED = chartTheme.mutedStroke;

/** XML-escape. Series labels carry `+`, `°` and parentheses; text is not markup. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function primToSvg(p: ChartPrim): string {
  switch (p.kind) {
    case 'rect':
      return (
        `<rect x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" ` +
        `fill="${p.fill}"${p.opacity != null ? ` opacity="${p.opacity}"` : ''}/>`
      );

    case 'line':
      return (
        `<line x1="${p.x1}" x2="${p.x2}" y1="${p.y1}" y2="${p.y2}" ` +
        `stroke="${p.stroke}" stroke-width="${p.width}"` +
        `${p.dash ? ` stroke-dasharray="${p.dash}"` : ''}/>`
      );

    case 'path':
      return (
        `<path d="${p.d}" fill="${p.fill ?? 'none'}"` +
        `${p.stroke ? ` stroke="${p.stroke}"` : ''}` +
        `${p.width != null ? ` stroke-width="${p.width}"` : ''}` +
        `${p.stroke ? ' stroke-linejoin="round" stroke-linecap="round"' : ''}` +
        `${p.dash ? ` stroke-dasharray="${p.dash}"` : ''}` +
        `${p.opacity != null ? ` opacity="${p.opacity}"` : ''}/>`
      );

    case 'text':
      return (
        `<text x="${p.x}" y="${p.y}"` +
        `${p.anchor ? ` text-anchor="${p.anchor}"` : ''}` +
        `${p.dy ? ` dy="${p.dy}"` : ''}` +
        ` font-size="${p.size}"` +
        `${p.weight ? ` font-weight="${p.weight}"` : ''}` +
        `${p.letterSpacing ? ` letter-spacing="${p.letterSpacing}"` : ''}` +
        `${p.halo ? ` stroke="${p.halo}" stroke-width="3" stroke-linejoin="round" paint-order="stroke"` : ''}` +
        ` fill="${p.fill}">${escapeXml(p.text)}</text>`
      );

    case 'circle':
      return (
        `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" fill="${p.fill}"` +
        `${p.stroke ? ` stroke="${p.stroke}"` : ''}` +
        `${p.width != null ? ` stroke-width="${p.width}"` : ''}/>`
      );
  }
}

export interface RenderSvgOptions {
  /** Rendered at this size, then scaled to the column by the report's CSS. */
  width?: number;
  height?: number;
  /** Accessible name. Charts in the report are `role="img"`, as in the app. */
  ariaLabel?: string;
  /**
   * Draw the title, subtitle, legend and source line inside the SVG.
   *
   * On screen those are HTML around the plot, which is right there: real text
   * that reflows, is selectable, and is read by a screen reader as text. In an
   * export they have to be part of the picture, because a PNG of a chart with
   * its takeaway title stripped off is a chart with no message left. The
   * report's HTML already lays out its own headings, so it leaves this off; the
   * per-chart PNG and the chart pack turn it on.
   */
  withChrome?: boolean;
}

/** Rough advance width. No DOM here to measure with, so estimate and pad. */
const textWidth = (text: string, size: number) => text.length * size * 0.55;

/**
 * Wrap on whole words at an estimated width. Crude, and good enough: the only
 * wrapped text in an exported chart is the title and the subtitle, both of them
 * short, both of them at a fixed render width.
 */
function wrap(text: string, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (current && textWidth(next, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Render one spec to a standalone SVG string.
 *
 * With `withChrome` the plot is pushed down by however many lines the title and
 * subtitle need and the legend and source line are drawn under it, so the
 * returned SVG is the whole figure rather than the plot area alone.
 */
export function renderSpecSvg(spec: ChartSpec, options: RenderSvgOptions = {}): string {
  const width = options.width ?? 700;
  const plotHeight = options.height ?? spec.height ?? 320;
  const ariaLabel = options.ariaLabel ?? spec.title;

  const TITLE_SIZE = 15;
  const SUB_SIZE = 11;
  const LEGEND_SIZE = 11;
  const SOURCE_SIZE = 10;

  const chrome = options.withChrome === true;
  const textMax = width - 24;

  const titleLines = chrome ? wrap(spec.title, TITLE_SIZE, textMax) : [];
  const subLines = chrome && spec.subtitle ? wrap(spec.subtitle, SUB_SIZE, textMax) : [];

  /**
   * The legend keeps the grayed-down series.
   *
   * On screen a muted line's identity is recoverable from the hover tooltip,
   * which lists every series at the hovered year in its own colour. Paper has
   * no hover. Dropping the muted entries from an exported legend would leave
   * four unidentifiable gray lines on the page, so they stay, in the muted
   * stroke, exactly as the screen shows them.
   */
  const legendItems =
    chrome && spec.legend !== false ? spec.series.filter((s) => s.points.length) : [];

  /**
   * Muted series get ONE entry between them, not one each.
   *
   * The briefing climate chart draws four scenarios in the same gray so the
   * eye goes to the two edges. Listing them separately produced four identical
   * gray swatches against four different names, which is a legend a reader
   * cannot use: it invites them to match a swatch to a line and then gives
   * them no way to do it. The band is one thing on the chart, so it is one
   * thing in the legend, and the count says how many paths are inside it.
   *
   * The subtitle is where the four are named, and it already names them.
   */
  const named = legendItems.filter((s) => !s.muted);
  const mutedCount = legendItems.length - named.length;
  const entries: Array<{ label: string; color: string }> = named.map((s) => ({
    label: s.label,
    color: s.color,
  }));
  if (mutedCount === 1) {
    const only = legendItems.find((s) => s.muted)!;
    entries.push({ label: only.label, color: MUTED });
  } else if (mutedCount > 1) {
    entries.push({
      label: spec.mutedLabel ?? `${mutedCount} more, in gray`,
      color: MUTED,
    });
  }

  // Decided on what actually gets drawn, which is the collapsed entry list.
  const showLegend = entries.length > 1;

  // Lay the legend out first: with seven scenarios it wraps, and the head has
  // to be tall enough for however many rows that takes.
  const legendRows: Array<Array<{ label: string; color: string; x: number }>> = [];
  if (showLegend) {
    let row: Array<{ label: string; color: string; x: number }> = [];
    let lx = 12;
    for (const s of entries) {
      const w = 19 + textWidth(s.label, LEGEND_SIZE) + 18;
      if (row.length && lx + w > width - 12) {
        legendRows.push(row);
        row = [];
        lx = 12;
      }
      row.push({ label: s.label, color: s.color, x: lx });
      lx += w;
    }
    if (row.length) legendRows.push(row);
  }

  const headHeight = chrome
    ? 10 + titleLines.length * (TITLE_SIZE + 4) + (subLines.length ? 4 : 0) +
      subLines.length * (SUB_SIZE + 3) +
      (showLegend ? legendRows.length * (LEGEND_SIZE + 6) + 8 : 0) + 8
    : 0;
  const footHeight = chrome && spec.source ? SOURCE_SIZE + 14 : 0;
  const height = headHeight + plotHeight + footHeight;

  const plan = buildChartPlan(spec, { width, height: plotHeight });

  const head: string[] = [];
  if (chrome) {
    let cursor = 10 + TITLE_SIZE;
    for (const lineText of titleLines) {
      head.push(
        `<text x="12" y="${cursor}" font-size="${TITLE_SIZE}" font-weight="600" ` +
          `font-family="${escapeXml(fonts.accent)}" fill="${theme.anchor}">` +
          `${escapeXml(lineText)}</text>`,
      );
      cursor += TITLE_SIZE + 4;
    }
    if (subLines.length) cursor += 4;
    for (const lineText of subLines) {
      head.push(
        `<text x="12" y="${cursor}" font-size="${SUB_SIZE}" fill="${theme.textSecondary}">` +
          `${escapeXml(lineText)}</text>`,
      );
      cursor += SUB_SIZE + 3;
    }
    if (showLegend) {
      cursor += 8;
      for (const row of legendRows) {
        for (const item of row) {
          head.push(
            `<rect x="${round(item.x)}" y="${round(cursor - LEGEND_SIZE * 0.5)}" width="14" ` +
              `height="3" rx="1.5" fill="${item.color}"/>`,
          );
          head.push(
            `<text x="${round(item.x + 19)}" y="${cursor}" font-size="${LEGEND_SIZE}" ` +
              `fill="${theme.textSecondary}">${escapeXml(item.label)}</text>`,
          );
        }
        cursor += LEGEND_SIZE + 6;
      }
    }
  }

  const foot =
    chrome && spec.source
      ? `<text x="12" y="${round(height - 6)}" font-size="${SOURCE_SIZE}" ` +
        `fill="${theme.textMuted}">${escapeXml(spec.source)}</text>`
      : '';

  const body = plan.empty
    ? `<text x="12" y="${headHeight + 24}" font-size="12" ` +
      `fill="${theme.textSecondary}">No data for this chart.</text>`
    : `<g transform="translate(${plan.margin.left},${headHeight + plan.margin.top})">` +
      `${plan.prims.map(primToSvg).join('')}</g>`;

  // A chart exported on its own is composited onto whatever the receiving
  // document uses as a page colour, so a chrome'd SVG paints its own ground.
  // Embedded in the report it inherits the surrounding card and paints nothing.
  const ground = chrome
    ? `<rect x="0" y="0" width="${width}" height="${round(height)}" fill="${theme.surfaceRaised}"/>`
    : '';

  return (
    `<svg role="img" aria-label="${escapeXml(ariaLabel)}" ` +
    `viewBox="0 0 ${width} ${round(height)}" width="${width}" height="${round(height)}" ` +
    `preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" ` +
    `font-family="${escapeXml(fonts.body)}">` +
    `${ground}${head.join('')}${body}${foot}` +
    `</svg>`
  );
}
