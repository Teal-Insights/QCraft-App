// A two-line chart: reference run in grey, varied run in the brand cyan, with a
// thin marker at the year the long-run assumptions begin. Rendered at the
// container's own pixel width so the type is true size, never scaled down.
//
// Reading values: the chart is ONE keyboard entry (tab to the chart, then left
// and right arrows move a year cursor; Home and End jump; Escape clears it).
// The pointer does the same by hovering. The readout sits in the top margin so
// it never covers the lines.
import * as d3 from 'd3';
import { CHART_END, CHART_START, type Point } from './engine';

export interface ChartOptions {
  height: number;
  yLabel: string;
  /** First long-run year: the marker sits here. */
  longRunStart: number;
  /** Show the "long-run assumptions begin" label on the marker. */
  markerLabel?: boolean;
  /** Label the 2099 end of each line with its value. */
  endLabels?: boolean;
  /** Force zero into the y domain (debt charts read better anchored at 0). */
  includeZero?: boolean;
  decimals?: number;
  /** Accessible name for the chart (what the lines are). */
  title: string;
  /** Names for the two lines, used in the readout. */
  refName?: string;
  runName?: string;
}

export interface Chart {
  update(ref: Point[], varied: Point[]): void;
}

const COLORS = {
  ref: getComputedStyle(document.documentElement).getPropertyValue('--ref-color').trim() || '#5C6770',
  run: getComputedStyle(document.documentElement).getPropertyValue('--run-color').trim() || '#0094BC',
  grid: '#D4D0CA',
  marker: '#5C6770',
  cursor: '#143E5A',
};

export function makeChart(container: HTMLElement, opts: ChartOptions): Chart {
  const margin = { top: 34, right: opts.endLabels ? 66 : 18, bottom: 36, left: 54 };
  const svg = d3.select(container).append('svg')
    .attr('tabindex', 0)
    .attr('role', 'img')
    .attr('aria-label', `${opts.title}. Use the left and right arrow keys to read values by year; Escape clears.`);
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
  const gridG = g.append('g').attr('class', 'grid');
  const xAxisG = g.append('g').attr('class', 'axis x');
  const yAxisG = g.append('g').attr('class', 'axis y');
  const markerG = g.append('g').attr('class', 'marker');
  const refPath = g.append('path').attr('fill', 'none').attr('stroke', COLORS.ref).attr('stroke-width', 2.25);
  const runPath = g.append('path').attr('fill', 'none').attr('stroke', COLORS.run).attr('stroke-width', 2.75);
  const refEnd = g.append('text').attr('class', 'end-label').attr('fill', COLORS.ref);
  const runEnd = g.append('text').attr('class', 'end-label').attr('fill', COLORS.run);
  const yLabel = g.append('text').attr('class', 'axis-label').attr('text-anchor', 'start');
  // Year cursor and readout.
  const cursorG = g.append('g').attr('class', 'cursor').style('display', 'none');
  const cursorLine = cursorG.append('line').attr('stroke', COLORS.cursor).attr('stroke-width', 1);
  const refDot = cursorG.append('circle').attr('r', 4.5).attr('fill', COLORS.ref).attr('stroke', '#fff').attr('stroke-width', 1.5);
  const runDot = cursorG.append('circle').attr('r', 5).attr('fill', COLORS.run).attr('stroke', '#fff').attr('stroke-width', 1.5);
  const readout = g.append('text').attr('class', 'readout').attr('text-anchor', 'end').style('display', 'none');
  const live = document.createElement('div');
  live.className = 'sr-only'; live.setAttribute('aria-live', 'polite');
  container.append(live);
  const hit = g.append('rect').attr('fill', 'transparent').style('cursor', 'crosshair');

  let last: { ref: Point[]; varied: Point[] } | null = null;
  let cursorYear: number | null = null;
  let x = d3.scaleLinear();
  let y = d3.scaleLinear();
  let w = 0; let h = 0;
  const fmt = d3.format(`.${opts.decimals ?? 1}f`);

  function showCursor() {
    if (!last || cursorYear === null) { cursorG.style('display', 'none'); readout.style('display', 'none'); return; }
    const r = last.ref.find((d) => d.year === cursorYear);
    const v = last.varied.find((d) => d.year === cursorYear);
    if (!r || !v) return;
    cursorG.style('display', null);
    cursorLine.attr('x1', x(cursorYear)).attr('x2', x(cursorYear)).attr('y1', 0).attr('y2', h);
    refDot.attr('cx', x(r.year)).attr('cy', y(r.value));
    runDot.attr('cx', x(v.year)).attr('cy', y(v.value));
    const same = Math.abs(v.value - r.value) < 0.05;
    const text = same
      ? `${cursorYear}: ${fmt(v.value)} (both runs)`
      : `${cursorYear}: ${opts.runName ?? 'this run'} ${fmt(v.value)}, ${opts.refName ?? 'reference'} ${fmt(r.value)}, difference ${v.value - r.value > 0 ? '+' : ''}${fmt(v.value - r.value)}`;
    readout.style('display', null).attr('x', w + margin.right - 8).attr('y', -14).text(text);
    live.textContent = text;
  }
  function setCursor(year: number | null) {
    cursorYear = year === null ? null : Math.max(CHART_START, Math.min(CHART_END, year));
    showCursor();
  }

  function render() {
    if (!last) return;
    const width = Math.max(320, container.clientWidth);
    const height = opts.height;
    svg.attr('width', width).attr('height', height).attr('viewBox', null);
    w = width - margin.left - margin.right;
    h = height - margin.top - margin.bottom;

    const all = [...last.ref, ...last.varied].map((d) => d.value);
    let lo = d3.min(all) ?? 0;
    let hi = d3.max(all) ?? 1;
    if (opts.includeZero) { lo = Math.min(0, lo); hi = Math.max(0, hi); }
    if (hi - lo < 1e-9) { hi = lo + 1; }
    const pad = (hi - lo) * 0.06;
    x = d3.scaleLinear().domain([CHART_START, CHART_END]).range([0, w]);
    y = d3.scaleLinear().domain([lo - (opts.includeZero && lo === 0 ? 0 : pad), hi + pad]).nice().range([h, 0]);

    gridG.selectAll('line').data(y.ticks(5)).join('line')
      .attr('x1', 0).attr('x2', w).attr('y1', (d) => y(d)).attr('y2', (d) => y(d))
      .attr('stroke', COLORS.grid).attr('stroke-width', 1);

    const ticks = [...[2023, 2040, 2050, 2060, 2070, 2080, 2090, 2099].filter((t) => Math.abs(t - opts.longRunStart) > 3), opts.longRunStart]
      .sort((a, b) => a - b);
    xAxisG.attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).tickValues(ticks).tickFormat(d3.format('d')).tickSize(5))
      .call((s) => s.select('.domain').attr('stroke', COLORS.grid))
      .call((s) => s.selectAll('.tick line').attr('stroke', COLORS.grid));
    yAxisG.call(d3.axisLeft(y).ticks(5).tickSize(0).tickPadding(8))
      .call((s) => s.select('.domain').remove());

    markerG.selectAll('*').remove();
    markerG.append('line')
      .attr('x1', x(opts.longRunStart)).attr('x2', x(opts.longRunStart)).attr('y1', 0).attr('y2', h)
      .attr('stroke', COLORS.marker).attr('stroke-width', 1).attr('stroke-dasharray', '3,3');
    if (opts.markerLabel) {
      markerG.append('text').attr('class', 'marker-label')
        .attr('x', x(opts.longRunStart) + 6).attr('y', 4).attr('dominant-baseline', 'hanging')
        .text(`long-run assumptions begin (${opts.longRunStart})`);
    }

    const line = d3.line<Point>().x((d) => x(d.year)).y((d) => y(d.value));
    // Animate only on data updates (not on resize), and only when the point
    // count is unchanged so the path interpolation is well defined.
    const dur = animate ? 260 : 0;
    const t = (sel: d3.Selection<SVGPathElement, unknown, null, undefined>) =>
      dur ? sel.transition().duration(dur).ease(d3.easeCubicOut) : sel;
    t(refPath).attr('d', line(last.ref));
    t(runPath).attr('d', line(last.varied));

    if (opts.endLabels) {
      const r = last.ref[last.ref.length - 1];
      const v = last.varied[last.varied.length - 1];
      let ry = y(r.value); let vy = y(v.value);
      const same = Math.abs(v.value - r.value) < 0.05;
      if (!same && Math.abs(ry - vy) < 16) { // keep the two labels apart
        const mid = (ry + vy) / 2;
        const sign = v.value >= r.value ? -1 : 1;
        vy = mid + 8 * sign; ry = mid - 8 * sign;
      }
      refEnd.attr('x', w + 8).attr('y', ry).attr('dominant-baseline', 'middle').text(same ? '' : fmt(r.value));
      runEnd.attr('x', w + 8).attr('y', vy).attr('dominant-baseline', 'middle').text(fmt(v.value));
    }
    yLabel.attr('x', -margin.left + 4).attr('y', -14).attr('dominant-baseline', 'auto').text(opts.yLabel);
    hit.attr('x', 0).attr('y', 0).attr('width', w).attr('height', h);
    animate = false;
    showCursor();
  }

  // Pointer: hover reads the nearest year; leaving clears.
  hit.on('pointermove', (ev: PointerEvent) => {
    const [px] = d3.pointer(ev, g.node() as SVGGElement);
    setCursor(Math.round(x.invert(px)));
  });
  hit.on('pointerleave', () => setCursor(null));
  // Keyboard: one tab stop per chart, arrows move the cursor.
  svg.on('keydown', (ev: KeyboardEvent) => {
    const start = cursorYear ?? opts.longRunStart;
    if (ev.key === 'ArrowRight') { setCursor(start + (ev.shiftKey ? 10 : 1)); ev.preventDefault(); }
    else if (ev.key === 'ArrowLeft') { setCursor(start - (ev.shiftKey ? 10 : 1)); ev.preventDefault(); }
    else if (ev.key === 'Home') { setCursor(CHART_START); ev.preventDefault(); }
    else if (ev.key === 'End') { setCursor(CHART_END); ev.preventDefault(); }
    else if (ev.key === 'Escape') { setCursor(null); (svg.node() as SVGSVGElement).blur(); }
  });
  svg.on('blur', () => setCursor(null));

  let animate = false;
  let rendered = false;
  const ro = new ResizeObserver(() => { animate = false; render(); });
  ro.observe(container);

  return {
    update(ref, varied) {
      animate = rendered && last !== null && last.ref.length === ref.length && last.varied.length === varied.length;
      last = { ref, varied };
      rendered = true;
      render();
    },
  };
}
