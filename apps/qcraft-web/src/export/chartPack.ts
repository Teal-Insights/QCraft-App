/**
 * The chart pack: every takeaway chart, one document, print-to-PDF clean.
 *
 * ── What it is for ────────────────────────────────────────────────────────────
 * The report is a document with charts in it. This is the charts, with just
 * enough words around each one to be read standing up: the message as a title,
 * how to read it as a subtitle, and the run's identity in the footer. It is what
 * gets printed and handed round a table, and what a fiscal risk statement's
 * annex is built from.
 *
 * ── Why the print CSS is the interesting part ─────────────────────────────────
 * A ministry user's route to a PDF is the browser's own Print dialog, so the
 * printed page is the deliverable and every rule below was measured rather than
 * assumed. The findings that shaped it, in the order they cost the most:
 *
 *  - The page box is 210mm by 279mm, which is A4's width and US Letter's height.
 *    Declaring `size: A4` repaginates on Letter: the same six charts came out as
 *    three pages on A4 and four on Letter. The intersection gives byte-identical
 *    pagination on both, so a reader in Kampala and a reader in Washington are
 *    looking at the same document.
 *
 *  - Chrome ships with "Background graphics" unchecked. Any CSS background is
 *    simply not printed: the legend swatches measured zero pixels. The WEO
 *    history band survives regardless, because it is an SVG `rect` with a fill
 *    rather than a CSS background. So `print-color-adjust` is needed for the
 *    swatches, and the on-screen hint does NOT need to ask anyone to tick a box.
 *
 *  - `break-inside: avoid` on the figure is what keeps a caption with its chart.
 *    `break-after: avoid` on the caption alone is not enough: the break simply
 *    moves to the seam between the legend and the plot. Three of six figures
 *    split with the caption rule alone, none with both.
 *
 *  - `break-inside: avoid` is dropped by the spec when a block cannot fit a
 *    page, and a too-tall figure then splits AND wastes the page it skipped. So
 *    the plot is capped by width derived from its own aspect ratio. Not by
 *    height: `preserveAspectRatio="meet"` letterboxes rather than shrinking, so
 *    a max-height leaves the chart floating in a band.
 *
 *  - Defining `@page` margin boxes in both the top and the bottom row removes
 *    Chrome's own date and URL stamp. Firefox and WebKit do not implement margin
 *    boxes at all, which is why the on-screen hint mentions their checkbox.
 *
 *  - Every rule between 0.3px and 1.5px prints as the same hairline, and the
 *    sub-pixel values land on different antialiasing phases, so 0.3px prints
 *    HEAVIER than 1px. Rules are 1px and weight is carried by colour.
 */

import type { EngineResult } from '../engine/types';
import {
  documentedRows,
  manifestRows,
  modeLine,
  modeStatement,
  type RunManifest,
} from '../run/manifest';
import { SOURCE_CREDIT } from '../content/modes';
import { fonts, theme } from '../theme';
import { renderSpecSvg } from '../charts/svg';
import { noClimateSignal, type PacketFigure } from './figures';
import { escapeHtml, formatReportDate, paragraphsFromText } from './reportHtml';

/**
 * Escape a string for a CSS `content:` value.
 *
 * A hex escape is not an option here. A `\2014` in a content string swallows
 * the space that follows it, so "Explorer \2014 chart pack" prints with the
 * dash jammed against the next word. Use literal characters, escaping only the
 * quote and the backslash.
 */
const cssString = (value: string) => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

/** One aspect for every plot in the pack, so the two-up budget is deterministic. */
const PLOT = { width: 700, height: 320 } as const;

export function chartPackStyles(headerLabel: string, runLabel: string): string {
  return `
:root{
  --qc-ink:${theme.textPrimary}; --qc-muted:${theme.textSecondary};
  --qc-rule:${theme.rule}; --qc-accent:${theme.accent}; --qc-anchor:${theme.anchor};
  --qc-sunken:${theme.surfaceSunken}; --qc-card:${theme.surfaceAccent};
  /* Must match the renderSpecSvg viewBox. Drives the two-up height budget. */
  --qc-plot-w:${PLOT.width}; --qc-plot-h:${PLOT.height}; --qc-plot-max-h:84mm;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:#fff;color:var(--qc-ink);
  font-family:${fonts.body};font-size:15px;line-height:1.55}
.chartpack{max-width:860px;margin:0 auto;padding:32px 36px 48px}
.chartpack__head{border-bottom:2px solid var(--qc-anchor);padding-bottom:12px;margin-bottom:8px}
.chartpack__kicker{font-family:${fonts.kicker};font-size:11px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--qc-accent);margin:0}
.chartpack__head h1{font-family:${fonts.accent};font-weight:600;font-size:28px;
  line-height:1.15;margin:4px 0 6px}
.chartpack__meta{color:var(--qc-muted);font-size:12.5px;margin:0}
.chartpack__claim{margin:10px 0 0;padding:9px 12px;border-left:3px solid var(--qc-accent);
  background:var(--qc-sunken);font-size:12px}
.chartpack__claim p{margin:0}
.printhint{margin:16px 0 0;padding:9px 12px;border-left:3px solid var(--qc-accent);
  background:var(--qc-card);font-size:12.5px}
.printbar{text-align:right;margin:0 0 -10px}
.printbar button{font:inherit;font-size:13px;padding:6px 14px;border:1px solid var(--qc-anchor);
  border-radius:3px;background:var(--qc-anchor);color:#fff;cursor:pointer}
.note{margin:18px 0 0;font-size:13px}
.note h2{font-family:${fonts.accent};font-size:15px;margin:0 0 4px}
.assumptions{margin:18px 0 22px;font-size:12.5px}
.assumptions h2{font-family:${fonts.accent};font-size:15px;margin:0 0 4px}
.assumptions table{width:100%;border-collapse:collapse;font-size:12px;margin:6px 0 0}
.assumptions th,.assumptions td{text-align:left;padding:4px 8px;
  border-bottom:1px solid var(--qc-rule);vertical-align:top}
.assumptions thead th{font-family:${fonts.medium};font-size:11px;
  border-bottom:1px solid var(--qc-anchor)}
.assumptions td.num{text-align:right;white-space:nowrap}
.chartfig{margin:0 0 26px}
.chartfig figcaption{margin:0 0 6px}
.figure__title{font-family:${fonts.medium};font-size:15px;font-weight:600;margin:0}
.figure__subtitle{font-size:12.5px;color:var(--qc-muted);margin:3px 0 0}
.figure__source{font-size:10.5px;color:var(--qc-muted);margin:5px 0 0}
.legend{display:flex;flex-wrap:wrap;gap:5px 14px;margin:0 0 6px;padding:0;
  list-style:none;font-size:12px}
.legend li{display:flex;align-items:center;gap:6px}
.legend .swatch{width:14px;height:3px;border-radius:2px;display:inline-block;flex:none}
.chartfig__plot>svg{width:100%;height:auto;display:block}
.packfoot{margin-top:26px;padding-top:10px;border-top:1px solid var(--qc-rule);
  font-size:11px;color:var(--qc-muted)}
.packfoot p{margin:0 0 5px}

/* 210mm by 279mm is A4's width and Letter's height. Declaring the intersection
   makes the pagination identical on both; size:A4 repaginates on Letter.
   Margin boxes are Chromium-only, and the other engines drop them silently,
   which is the right degradation. Defining a box in the top row AND the bottom
   row also removes Chrome's own date and URL stamp. */
@page{
  size:210mm 279mm;
  margin:16mm 13mm 16mm;
  @top-left{content:"${cssString(headerLabel)}";font-family:${fonts.body};font-size:7.5pt;color:${theme.textSecondary}}
  @top-right{content:"${cssString(runLabel)}";font-family:${fonts.body};font-size:7.5pt;color:${theme.textSecondary}}
  @bottom-left{content:"Computed in the browser. Nothing uploaded.";font-family:${fonts.body};font-size:7.5pt;color:${theme.textMuted}}
  @bottom-right{content:counter(page) " / " counter(pages);font-family:${fonts.body};font-size:7.5pt;color:${theme.textSecondary}}
}

@media print{
  /* print-color-adjust inherits, so :root is enough and the universal selector
     is waste. Without it the legend swatches print blank under Chrome's default
     settings. The -webkit- twin stays: Firefox does not support it, WebKit
     still wants it. */
  :root{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  html,body{background:#fff}
  body{font-size:10.5pt;line-height:1.42;-webkit-font-smoothing:auto;text-rendering:auto}
  .chartpack{max-width:none;margin:0;padding:0}
  .no-print{display:none!important}
  a{color:inherit;text-decoration:none}
  .chartpack__head{margin-bottom:6mm;padding-bottom:3mm;border-bottom-width:1.5pt;
    break-after:avoid;page-break-after:avoid}
  .chartpack__head h1{font-size:19pt}
  .chartpack__meta{font-size:8.5pt}
  .chartpack__claim{font-size:8pt;margin-bottom:5mm}

  .chartfig{break-inside:avoid;page-break-inside:avoid;margin:0 0 9mm}
  .chartfig:last-child{margin-bottom:0}
  .chartfig figcaption,.legend,.chartfig__plot{break-inside:avoid;page-break-inside:avoid}
  .chartfig figcaption,.legend{break-after:avoid;page-break-after:avoid}
  .legend li{break-inside:avoid}
  p,li,figcaption{orphans:3;widows:3}

  /* width:100% with height:auto is the only pair that fills the column and
     keeps the aspect. Cap by max-width derived from the aspect, never by
     max-height: preserveAspectRatio is "meet", so a height cap letterboxes
     instead of shrinking. */
  .chartfig__plot>svg{
    width:100%;
    height:auto;
    display:block;
    max-width:calc(var(--qc-plot-max-h) * var(--qc-plot-w) / var(--qc-plot-h));
    margin-inline:auto;
  }

  .assumptions{break-inside:avoid;page-break-inside:avoid;font-size:8.5pt;margin:0 0 7mm}
  .assumptions h2{font-size:11pt;break-after:avoid;page-break-after:avoid}
  .assumptions table{font-size:8pt}
  .assumptions th,.assumptions td{padding:2.5px 6px}
  .assumptions tr{break-inside:avoid;page-break-inside:avoid}
  .assumptions thead{display:table-header-group}
  .figure__title{font-size:11pt;line-height:1.25;text-wrap:pretty;margin:0}
  .figure__subtitle{font-size:8.5pt;line-height:1.32;text-wrap:pretty;margin:2px 0 0}
  .figure__source{font-size:7.5pt;margin:3px 0 0}
  .legend{font-size:8pt;gap:3px 12px;margin:0 0 4px}
  .legend .swatch{width:12px;height:3px}

  /* Everything from 0.3px to 1.5px prints as one hairline, and the sub-pixel
     values land on different antialiasing phases, so 0.3px prints heavier than
     1px. Never below 1px; vary weight with colour. */
  hr,.packfoot{border-top:1px solid var(--qc-rule)}
}
`;
}

function renderPackFigure(figure: PacketFigure, sourceLine: string): string {
  return (
    `<figure class="chartfig" id="fig-${escapeHtml(figure.id)}">` +
    `<div class="chartfig__plot">` +
    // Chrome on, and no HTML caption around it. The SVG draws its own title,
    // subtitle, legend and source line, so a page of the pack is a page of
    // whole pictures: cut one out and it still says what it is. Laying the same
    // four things out in HTML as well would print each of them twice.
    //
    // One width and one height for every plot in the pack. The report varies
    // figure heights for reading on screen; the pack does not, because the
    // two-up page budget is only deterministic if every plot is one shape.
    renderSpecSvg(
      { ...figure.spec, source: sourceLine },
      {
        width: PLOT.width,
        height: PLOT.height,
        ariaLabel: figure.title,
        withChrome: true,
      },
    ) +
    `</div>` +
    `</figure>`
  );
}

/**
 * What the run assumed, and why, on the same sheet as the charts.
 *
 * A chart pack is the piece most likely to end up as an annex, detached from
 * the report that carried one. So the assumptions travel with the charts.
 *
 * Only the rows a reader has to look at, which is anything changed or anything
 * annotated. The report lists all ten because the report is the document of
 * record; repeating that here cost most of the first page and pushed the charts
 * back a page, and the pack's job is the charts. The count of untouched
 * parameters is stated rather than dropped, so a reader can see that the rest
 * exist and where to find them, and the sentence says so in as many words.
 */
function assumptionsBlock(manifest: RunManifest): string {
  const rows = manifestRows(manifest);
  const documented = documentedRows(rows);
  const untouched = rows.length - documented.length;

  const lede = documented.length
    ? `${documented.length} of ${rows.length} parameters ${
        documented.length === 1 ? 'was' : 'were'
      } changed or annotated and ${
        documented.length === 1 ? 'is' : 'are'
      } listed here. The other ${untouched} sat at the engine default; the ` +
      'exported report lists all ten either way.'
    : `Every parameter was left at its engine default. The exported report ` +
      'lists all ten.';

  const table = documented.length
    ? `<table><thead><tr>` +
      `<th scope="col">Parameter</th><th scope="col">Value</th>` +
      `<th scope="col">Engine default</th>` +
      `<th scope="col">Rationale recorded by the analyst</th>` +
      `</tr></thead><tbody>${documented
        .map(
          (r) =>
            `<tr><th scope="row">${escapeHtml(r.label)}</th>` +
            `<td class="num">${escapeHtml(r.display)}</td>` +
            `<td class="num">${escapeHtml(r.defaultDisplay)}</td>` +
            `<td>${r.note ? escapeHtml(r.note) : ''}</td></tr>`,
        )
        .join('')}</tbody></table>`
    : '';

  return (
    `<section class="assumptions">` +
    `<h2>What this run assumed</h2>` +
    `<p>${escapeHtml(lede)}</p>` +
    table +
    `</section>`
  );
}

export interface ChartPackInput {
  manifest: RunManifest;
  result: EngineResult;
  figures: PacketFigure[];
}

export function renderChartPackHtml({ manifest, result, figures }: ChartPackInput): string {
  const dateHuman = formatReportDate(manifest.generatedAt);
  const headerLabel = 'Q-CRAFT Explorer chart pack';
  const runLabel = `${manifest.country.name} · ${dateHuman}`;
  const sourceLine =
    `${manifest.country.name} · ${modeLine(manifest)} · data vintage ` +
    `${manifest.dataVintage} · ${manifest.app.name} ${manifest.app.version}`;

  const title = manifest.annotations.label
    ? manifest.annotations.label
    : `${manifest.country.name}: the charts`;

  const note = manifest.annotations.note
    ? `<section class="note"><h2>The analyst’s note</h2>${paragraphsFromText(
        manifest.annotations.note,
      )}</section>`
    : '';

  const coverage = noClimateSignal(result)
    ? `<div class="chartpack__claim"><p>${escapeHtml(
        'The climate dataset has no coverage for this economy, so every scenario ' +
          'chart below lies on the baseline. That is missing data, not an absence ' +
          'of risk.',
      )}</p></div>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(`Q-CRAFT chart pack: ${manifest.country.name}, ${dateHuman}`)}</title>
<meta name="generator" content="${escapeHtml(`${manifest.app.name} ${manifest.app.version}`)}">
<style>${chartPackStyles(headerLabel, runLabel)}</style>
</head>
<body>
<main class="chartpack">
<div class="printbar no-print"><button type="button" onclick="window.print()">Print or save as PDF</button></div>

<header class="chartpack__head">
  <p class="chartpack__kicker">Q-CRAFT Explorer / Chart pack</p>
  <h1>${escapeHtml(title)}</h1>
  <p class="chartpack__meta">${escapeHtml(
    `${manifest.country.name} (${manifest.country.iso3c}) · ${modeLine(manifest)} · ` +
      `data vintage ${manifest.dataVintage} · ${dateHuman}`,
  )}</p>
  <div class="chartpack__claim"><p>${escapeHtml(modeStatement(manifest))}</p></div>
</header>

<p class="printhint no-print">Print, then Save as PDF. A4 and US Letter both fit as they are. If your browser is not Chrome, switch off "Headers and footers" in the print dialog.</p>

${coverage}
${note}
${assumptionsBlock(manifest)}

${figures.map((figure) => renderPackFigure(figure, sourceLine)).join('\n')}

<footer class="packfoot">
  <p>Q-CRAFT Explorer is a free, open-source reimplementation of the IMF’s Quantitative Climate Risk Assessment Fiscal Tool, by Teal Insights and NatureFinance. <strong>This is not an official IMF product</strong> and nothing in this pack is an IMF view.</p>
  <p>${escapeHtml(SOURCE_CREDIT)}</p>
</footer>
</main>
</body>
</html>
`;
}
