/**
 * Static SVG renderer for the exported report.
 *
 * The on-screen chart is imperative D3 written into a live DOM inside a
 * `useEffect`, and it sizes itself from a ResizeObserver. None of that can be
 * serialized into a file: the chart only exists once it is mounted, visible and
 * measured, so serializing the live DOM would export whatever the user happened
 * to have on screen (or an empty box for the tabs they never opened).
 *
 * So the report renders the same series through this pure function instead. It
 * takes the same `ChartSeries` the screen takes and returns an SVG string, with
 * no DOM, which means it also runs under vitest and can be asserted on.
 *
 * The geometry deliberately mirrors LineChart.tsx: same margins, same scales,
 * same monotone curve, same WEO shading and boundary rule, same de-collided
 * direct labels. A reader should recognise the printed chart as the one they
 * were looking at. Where the two differ it is for print: a fixed width rather
 * than a measured one, and no crosshair, tooltip or hover state, because paper
 * has none.
 */

import * as d3 from 'd3';

import type { ChartPoint, ChartSeries } from '../charts/types';
import { xTickFormat, yTickFormat } from '../charts/ticks';
import { chart as chartTheme, fonts, theme } from '../theme';

export interface ChartSvgSpec {
  series: ChartSeries[];
  /** Rendered at this size, then scaled to the column by the report's CSS. */
  width?: number;
  height?: number;
  weoBoundaryYear?: number;
  /** First year of the shaded observed band. See LineChart's prop of the same name. */
  historyStart?: number;
  zeroLine?: boolean;
  format?: (value: number) => string;
  /** Accessible name. Charts in the report are `role="img"`, as in the app. */
  ariaLabel: string;
}

/** First year in the fixtures; the Shiny app shades from here. */
const HISTORY_START = 2009;

const defaultFormat = (v: number) => `${v.toFixed(1)}%`;

/** XML-escape. Series labels carry `+`, `°` and parentheses; text is not markup. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Trim float noise out of the path data; 2dp of a pixel is below print resolution. */
const round = (n: number) => Math.round(n * 100) / 100;

export function renderChartSvg({
  series,
  width = 700,
  height = 320,
  weoBoundaryYear,
  historyStart = HISTORY_START,
  zeroLine = false,
  format = defaultFormat,
  ariaLabel,
}: ChartSvgSpec): string {
  const drawable = series.filter((s) => s.points.length);
  if (!drawable.length) {
    // An empty chart says so rather than printing an axis around nothing.
    return (
      `<svg role="img" aria-label="${escapeXml(ariaLabel)}" viewBox="0 0 ${width} ${height}" ` +
      `xmlns="http://www.w3.org/2000/svg"><text x="12" y="24" font-size="12" ` +
      `fill="${theme.textSecondary}">No data for this chart.</text></svg>`
    );
  }

  const { margin } = chartTheme;
  const innerW = Math.max(width - margin.left - margin.right, 10);
  const innerH = Math.max(height - margin.top - margin.bottom, 10);

  const points = drawable.flatMap((s) => s.points);
  const years = d3.extent(points, (p) => p.year) as [number, number];
  const [lo, hi] = d3.extent(points, (p) => p.value) as [number, number];
  const pad = Math.max((hi - lo) * 0.08, 0.5);

  const x = d3.scaleLinear().domain(years).range([0, innerW]);
  const y = d3
    .scaleLinear()
    .domain([zeroLine ? Math.min(lo - pad, 0) : lo - pad, hi + pad])
    .nice()
    .range([innerH, 0]);

  const parts: string[] = [];
  const showBoundary = weoBoundaryYear != null && years[0] <= weoBoundaryYear;

  // WEO history shading: "this part is data, the rest is projection".
  if (showBoundary) {
    const from = x(Math.max(historyStart, years[0]));
    const to = x(weoBoundaryYear!);
    parts.push(
      `<rect x="${round(from)}" y="0" width="${round(Math.max(to - from, 0))}" ` +
        `height="${innerH}" fill="${theme.surfaceSunken}"/>`,
    );
  }

  // Gridlines, recessive.
  for (const tick of y.ticks(6)) {
    parts.push(
      `<line x1="0" x2="${innerW}" y1="${round(y(tick))}" y2="${round(y(tick))}" ` +
        `stroke="${chartTheme.gridStroke}" stroke-width="1"/>`,
    );
  }

  if (zeroLine) {
    parts.push(
      `<line x1="0" x2="${innerW}" y1="${round(y(0))}" y2="${round(y(0))}" ` +
        `stroke="${theme.textMuted}" stroke-width="1"/>`,
    );
  }

  // Axes: domain line, ticks, labels.
  parts.push(
    `<line x1="0" x2="${innerW}" y1="${innerH}" y2="${innerH}" ` +
      `stroke="${chartTheme.axisStroke}" stroke-width="1"/>`,
  );
  for (const tick of x.ticks(7)) {
    const px = round(x(tick));
    parts.push(
      `<line x1="${px}" x2="${px}" y1="${innerH}" y2="${innerH + 5}" ` +
        `stroke="${chartTheme.axisStroke}" stroke-width="1"/>` +
        `<text x="${px}" y="${innerH + 17}" text-anchor="middle" font-size="11" ` +
        `fill="${chartTheme.axisText}">${escapeXml(xTickFormat(tick))}</text>`,
    );
  }
  parts.push(
    `<line x1="0" x2="0" y1="0" y2="${innerH}" stroke="${chartTheme.axisStroke}" ` +
      `stroke-width="1"/>`,
  );
  for (const tick of y.ticks(6)) {
    const py = round(y(tick));
    parts.push(
      `<line x1="-5" x2="0" y1="${py}" y2="${py}" stroke="${chartTheme.axisStroke}" ` +
        `stroke-width="1"/>` +
        `<text x="-9" y="${py}" dy="0.32em" text-anchor="end" font-size="11" ` +
        `fill="${chartTheme.axisText}">${escapeXml(yTickFormat(tick))}</text>`,
    );
  }

  // The WEO boundary rule, labelled at its foot (see LineChart for why the foot).
  if (showBoundary) {
    const bx = round(x(weoBoundaryYear!));
    parts.push(
      `<line x1="${bx}" x2="${bx}" y1="0" y2="${innerH}" stroke="${theme.textMuted}" ` +
        `stroke-width="1" stroke-dasharray="3,3"/>` +
        `<text x="${bx + 5}" y="${innerH - 6}" font-size="9" font-weight="700" ` +
        `letter-spacing="0.06em" fill="${theme.textMuted}">WEO to ${weoBoundaryYear}</text>`,
    );
  }

  const line = d3
    .line<ChartPoint>()
    .x((d) => x(d.year))
    .y((d) => y(d.value))
    .curve(d3.curveMonotoneX);

  for (const s of drawable) {
    const d = line(s.points);
    if (!d) continue;
    parts.push(
      `<path fill="none" stroke="${s.color}" stroke-width="${
        s.emphasis ? chartTheme.lineWidthEmphasis : chartTheme.lineWidth
      }" stroke-linejoin="round" stroke-linecap="round"${
        s.dashed ? ' stroke-dasharray="6,4"' : ''
      } d="${d}"/>`,
    );
  }

  // Direct labels at each line's end, pushed apart to a minimum spacing rather
  // than dropped: a labelled series that renders unlabelled is the worse bug.
  const labelled = drawable
    .filter((s) => s.directLabel)
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
    parts.push(
      `<text x="${innerW + 6}" y="${round(Math.min(Math.max(label.y, 8), innerH))}" ` +
        `dy="0.32em" font-size="11" font-weight="600" fill="${label.color}">` +
        `${escapeXml(label.text)}</text>`,
    );
  }

  return (
    `<svg role="img" aria-label="${escapeXml(ariaLabel)}" ` +
    `viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" ` +
    `preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" ` +
    `font-family="${escapeXml(fonts.body)}">` +
    `<g transform="translate(${margin.left},${margin.top})">${parts.join('')}</g>` +
    `</svg>`
  );
}
