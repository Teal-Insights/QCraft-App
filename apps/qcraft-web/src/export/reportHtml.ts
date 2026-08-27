/**
 * The print-ready HTML report.
 *
 * ── What it is modelled on ────────────────────────────────────────────────────
 * Two things. The IMF FAD high-level summary for Uganda
 * (source-materials/2024_IMF-FAD_Uganda-C-PIMA-Summary.pdf) is the register a
 * ministry reader expects: a title block naming the work and who prepared it, a
 * disclaimer, then Summary of findings before any detail. That report is the
 * benchmark because it is where the September 2023 Q-CRAFT workshop results were
 * published, so this is the document the export sits next to on a desk.
 *
 * The LIC-DSF scenario tool's briefing pack is the structural model: headline
 * table, charts, then a provenance back page listing the inputs and the identity
 * of the run. Its hard-won rule is carried over intact: the claim status travels
 * INSIDE the artifact, because a pack is the thing most likely to be forwarded
 * to someone who never saw the app.
 *
 * ── What it will not do ───────────────────────────────────────────────────────
 * Every number below is read off the run being reported. The summary paragraph
 * is assembled from those numbers and never characterises them beyond what they
 * say. When the app is fixture-backed, the report says so at the top, in its
 * title block, in its status banner and in its annex, and lists the parameters
 * the numbers do not reflect. A report that quietly implies the sliders were
 * applied would be worse than no report.
 */

import {
  findScenario,
  fmtPct,
  gdpShortfallSeries,
  scenarioColor,
  scenarioSpread,
  valueAt,
} from '../selectors';
import type { SpecContext } from '../charts/specs';
import type { EngineResult } from '../engine/types';
import { MODES } from '../content/modes';
import {
  documentedRows,
  manifestRows,
  modeLine,
  modeStatement,
  type RunManifest,
} from '../run/manifest';
import { renderSpecSvg } from '../charts/svg';
import {
  DEFAULT_CHARTS,
  groupFigures,
  HORIZON,
  keyFigures as computeKeyFigures,
  MID,
  noClimateSignal,
  NO_SIGNAL_NOTE,
  packetFigures,
  REPORT_YEARS,
  type PacketCharts,
  type PacketFigure,
} from './figures';
import { REPORT_STYLES } from './reportStyles';

export { HORIZON, MID, REPORT_YEARS };

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** A GDP gap of -0.04 formats as "-0.0", which reads as a sign it does not have. */
const signedZero = (text: string) => (text === '-0.0' ? '0.0' : text);

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * "26 August 2026" from an ISO timestamp, in UTC.
 *
 * Hand-rolled rather than `toLocaleDateString`, so the date on the page is the
 * same date the manifest records no matter which machine or locale opened the
 * app. A report whose title block and manifest disagree by a day is a report
 * someone has to reconcile.
 */
export function formatReportDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/**
 * The figures the report carries.
 *
 * Kept as a named export because the tests and the on-screen export panel both
 * ask the report what it contains. The list itself lives in `figures.ts`, shared
 * with the chart pack, the chart PNGs and the workbook, so a title cannot say
 * one thing on a page and another on a slide.
 */
export const reportFigures = (
  ctx: SpecContext,
  charts: PacketCharts = DEFAULT_CHARTS,
): PacketFigure[] => packetFigures(ctx, charts);

function renderFigure(fig: PacketFigure): string {
  const legend =
    fig.spec.series.length > 1
      ? `<ul class="legend">${fig.spec.series
          .map(
            (s) =>
              `<li><span class="swatch" style="background:${s.color}"></span>` +
              `${escapeHtml(s.label)}</li>`,
          )
          .join('')}</ul>`
      : '';

  return (
    `<figure id="fig-${fig.id}">` +
    `<figcaption>` +
    `<p class="figure__title">${escapeHtml(fig.title)}</p>` +
    `<p class="figure__subtitle">${escapeHtml(fig.subtitle)}</p>` +
    `</figcaption>${legend}` +
    // Chrome off. The report lays out its own heading, subtitle and legend as
    // real HTML, which reflows, is selectable and is read as text. Drawing them
    // into the SVG as well would print each one twice.
    renderSpecSvg(fig.spec, { ariaLabel: fig.title }) +
    `</figure>`
  );
}

/**
 * The summary paragraph.
 *
 * Assembled entirely from values read off this run. It reports levels, the
 * range across scenarios and the GDP shortfall, and stops there: the tool
 * projects, it does not advise, and a sentence of interpretation written by the
 * exporter would be a claim nobody computed.
 */
export function summaryParagraphs(result: EngineResult): string[] {
  const baseline = findScenario(result, 'Baseline');
  const spread = scenarioSpread(result, HORIZON);
  const flat = noClimateSignal(result);
  const out: string[] = [];

  if (baseline) {
    const mid = valueAt(baseline, MID, 'debt_to_gdp');
    const end = valueAt(baseline, HORIZON, 'debt_to_gdp');
    if (mid != null && end != null) {
      out.push(
        `Under the baseline projection, with no climate damage applied, ` +
          `${result.countryName}’s debt reaches ${fmtPct(mid)} of GDP in ` +
          `${MID} and ${fmtPct(end)} by ${HORIZON}.`,
      );
    }
  }

  if (flat) {
    // A range and a spread here would read as a finding about the country. It
    // is a fact about the dataset, and the paragraph says which.
    out.push(
      `All six climate pathways return the baseline path for ` +
        `${result.countryName}. ${NO_SIGNAL_NOTE}`,
    );
  } else if (spread) {
    out.push(
      `Across the six climate pathways, ${HORIZON} debt ranges from ` +
        `${fmtPct(spread.best.value)} of GDP under ${spread.best.label} to ` +
        `${fmtPct(spread.worst.value)} under ${spread.worst.label}: a spread of ` +
        `${spread.spread.toFixed(1)} points of GDP. That spread is the ` +
        `climate-fiscal risk. The country, the data and the fiscal rule are the ` +
        `same in every one of those runs; only the warming pathway differs.`,
    );
  }

  const shortfalls = (flat ? [] : gdpShortfallSeries(result))
    .filter((s) => s.key !== 'Baseline')
    .map((s) => ({
      label: s.label,
      value: s.points.find((p) => p.year === HORIZON)?.value,
    }))
    .filter((s): s is { label: string; value: number } => s.value != null)
    .sort((a, b) => a.value - b.value);

  if (shortfalls.length) {
    const worst = shortfalls[0];
    const best = shortfalls[shortfalls.length - 1];
    // "0.4% relative to the baseline path" reads as 0.4% OF the baseline.
    const against = (v: number) =>
      `${Math.abs(v).toFixed(1)}% ${v < 0 ? 'below' : 'above'} the baseline path`;
    out.push(
      `Real GDP in ${HORIZON} ranges from ${against(best.value)} under ` +
        `${best.label} to ${against(worst.value)} under ${worst.label}.`,
    );
  }

  return out;
}

function keyFigures(result: EngineResult): string {
  const tiles = computeKeyFigures(result);
  if (!tiles.length) return '';
  return (
    `<div class="keyfigures">` +
    tiles
      .map(
        (t) =>
          `<div class="keyfigure">` +
          `<p class="keyfigure__label">${escapeHtml(t.label)}</p>` +
          `<p class="keyfigure__value">${escapeHtml(t.value)}</p>` +
          (t.detail ? `<p class="keyfigure__detail">${escapeHtml(t.detail)}</p>` : '') +
          `</div>`,
      )
      .join('') +
    `</div>`
  );
}

/** Debt-to-GDP at the reporting years, one row per scenario, plus the GDP gap. */
function keyNumbersTable(result: EngineResult): string {
  const shortfallByKey = new Map(
    gdpShortfallSeries(result).map((s) => [
      s.key,
      s.points.find((p) => p.year === HORIZON)?.value,
    ]),
  );

  const rows = result.scenarios.map((s) => {
    const cells = REPORT_YEARS.map((year) => {
      const v = valueAt(s, year, 'debt_to_gdp');
      return `<td>${v == null ? 'n/a' : v.toFixed(1)}</td>`;
    }).join('');
    const gap = shortfallByKey.get(s.key);
    const gapText = gap == null ? 'n/a' : signedZero(gap.toFixed(1));
    return (
      `<tr${s.key === 'Baseline' ? ' class="is-baseline"' : ''}>` +
      `<th scope="row"><span class="swatch" style="display:inline-block;width:12px;` +
      `height:3px;border-radius:2px;margin-right:6px;background:${scenarioColor(
        s.key,
      )}"></span>${escapeHtml(s.label)}</th>` +
      cells +
      `<td>${gapText}</td></tr>`
    );
  });

  return (
    `<table>` +
    `<caption>Gross public debt as a share of GDP at the engine’s reporting ` +
    `years, and real GDP in ${HORIZON} relative to the baseline path. ` +
    `All figures in percent.</caption>` +
    `<thead><tr><th scope="col">Scenario</th>` +
    REPORT_YEARS.map((y) => `<th scope="col">Debt/GDP ${y}</th>`).join('') +
    `<th scope="col">GDP vs baseline ${HORIZON}</th></tr></thead>` +
    `<tbody>${rows.join('')}</tbody></table>`
  );
}

/** The status banner: what these numbers are, stated before anyone reads them. */
function statusBanner(manifest: RunManifest): string {
  if (manifest.engine.kind === 'engine') {
    return (
      `<div class="status"><p><strong>Computed run.</strong> Every figure in ` +
      `this report was produced by the Q-CRAFT engine from the parameters in ` +
      `the annex, on data vintage <code>${escapeHtml(manifest.dataVintage)}</code>.</p>` +
      // The mode statement is the claim the app makes on screen. It travels
      // into the report verbatim, because the report is the artifact that gets
      // forwarded to someone who never saw the app.
      `<p><strong>${escapeHtml(modeLine(manifest))}.</strong> ` +
      `${escapeHtml(modeStatement(manifest))}</p></div>`
    );
  }

  const ignored = manifest.engine.ignoredParams;
  return (
    `<div class="status status--caution">` +
    `<p><strong>These figures were not recomputed from the parameters in this ` +
    `report.</strong> They are real Q-CRAFT output for ` +
    `${escapeHtml(manifest.country.name)}, computed by the Python engine at its ` +
    `default parameters and read from its golden-master test fixtures. The ` +
    `projection engine is not yet wired into this build of the application, so ` +
    `changing a parameter does not change the numbers.</p>` +
    (ignored.length
      ? `<p>${ignored.length === 1 ? 'One parameter was' : `${ignored.length} parameters were`} ` +
        `set away from the default and ${
          ignored.length === 1 ? 'is' : 'are'
        } therefore NOT reflected in the figures above:</p><ul>` +
        ignored
          .map(
            (p) =>
              `<li>${escapeHtml(p.label)}: set to <strong>${escapeHtml(
                p.requested,
              )}</strong>, figures show <strong>${escapeHtml(p.used)}</strong></li>`,
          )
          .join('') +
        `</ul>`
      : `<p>All parameters are at their engine defaults, so the figures match ` +
        `what the engine returns for this configuration.</p>`) +
    `</div>`
  );
}

/**
 * Free text to paragraphs.
 *
 * A run note is typed into a textarea, so it arrives with real newlines in it.
 * A blank line starts a paragraph and a single newline becomes a line break,
 * which is what someone who pressed Return meant. Everything is escaped first,
 * so the markup this produces is the only markup in the string.
 */
export function paragraphsFromText(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/**
 * The analyst's own words about the run, placed above the findings.
 *
 * Above rather than below because it is the only part of the report a human
 * wrote, and a reader who stops after the first page should have read it. With
 * no note the section is omitted: an empty heading claims a remark exists, and
 * the annex already names the parameters that carry no rationale, which is the
 * omission that matters.
 */
function analystNote(manifest: RunManifest): string {
  const note = manifest.annotations.note;
  if (!note) return '';
  return (
    `<section class="analystnote">` +
    `<h2>The analyst\u2019s note</h2>` +
    paragraphsFromText(note) +
    `</section>`
  );
}

/** The annex: every parameter, its state, and the user's rationale. */
function annex(manifest: RunManifest): string {
  const rows = manifestRows(manifest);
  const documented = documentedRows(rows);

  const paramRows = rows
    .map(
      (r) =>
        `<tr><th scope="row">${escapeHtml(r.label)}</th>` +
        `<td>${escapeHtml(r.display)}</td>` +
        `<td>${escapeHtml(r.defaultDisplay)}</td>` +
        `<td><span class="tag${
          r.state === 'changed' ? ' tag--changed' : ''
        }">${r.state === 'changed' ? 'Changed' : 'Default'}</span></td>` +
        `<td class="note">${r.note ? escapeHtml(r.note) : ''}</td></tr>`,
    )
    .join('');

  const lede = documented.length
    ? `${documented.length} of ${rows.length} parameters ${
        documented.length === 1 ? 'was' : 'were'
      } moved away from the engine default or annotated. The full set is listed ` +
      `so a reader can see what was left alone as well as what was changed.`
    : `Every parameter was left at its engine default. The full set is listed ` +
      `so that is visible rather than assumed.`;

  const undocumented = rows.filter((r) => r.state === 'changed' && !r.note);

  return (
    `<section class="annex page-break">` +
    `<h2>Annex: assumptions and rationale</h2>` +
    `<p>${escapeHtml(lede)}</p>` +
    `<table><thead><tr>` +
    `<th scope="col">Parameter</th><th scope="col">Value</th>` +
    `<th scope="col">Engine default</th><th scope="col">State</th>` +
    `<th scope="col">Rationale recorded by the analyst</th>` +
    `</tr></thead><tbody>${paramRows}</tbody></table>` +
    (undocumented.length
      ? `<p><em>${escapeHtml(
          `${undocumented.length} changed parameter${
            undocumented.length === 1 ? '' : 's'
          } carries no recorded rationale: ${undocumented
            .map((r) => r.label)
            .join(', ')}.`,
        )}</em></p>`
      : '') +
    `<h3>Run manifest</h3>` +
    `<dl>` +
    `<dt>Country</dt><dd>${escapeHtml(manifest.country.name)} ` +
    `(<code>${escapeHtml(manifest.country.iso3c)}</code>)</dd>` +
    `<dt>Data mode</dt><dd>${escapeHtml(modeLine(manifest))}</dd>` +
    `<dt>What that mode claims</dt><dd>${escapeHtml(modeStatement(manifest))}</dd>` +
    `<dt>Data vintage</dt><dd><code>${escapeHtml(manifest.dataVintage)}</code></dd>` +
    `<dt>Results basis</dt><dd>${escapeHtml(manifest.engine.source)}</dd>` +
    `<dt>Application</dt><dd>${escapeHtml(manifest.app.name)} ` +
    `${escapeHtml(manifest.app.version)}</dd>` +
    `<dt>Generated</dt><dd><code>${escapeHtml(manifest.generatedAt)}</code></dd>` +
    `</dl>` +
    `<h3>Reproducing this run</h3>` +
    `<p>The run JSON exported alongside this report carries every value in the ` +
    `table above. Load it with <strong>Import a run</strong> on the Export tab ` +
    `of Q-CRAFT Explorer and the application returns to this exact ` +
    `configuration, rationale notes included.</p>` +
    `</section>`
  );
}

/**
 * The colophon's source line, built from the mode registry.
 *
 * It used to be a hand-written sentence naming "IMF World Economic Outlook" and
 * "UN World Population Prospects" with no release, which is the one thing a
 * provenance line has to carry. Reading the registry means a report says which
 * release produced it, and says it the same way the app does.
 */
function modeSourcesLine(manifest: RunManifest): string {
  const sources = MODES[manifest.mode].sources
    .map((s) => `${escapeHtml(s.dataset)}: ${escapeHtml(s.vintage)}`)
    .join('. ');
  return `${sources}.`;
}

export interface ReportInput {
  manifest: RunManifest;
  result: EngineResult;
}

export function renderReportHtml({ manifest, result }: ReportInput): string {
  const dateHuman = formatReportDate(manifest.generatedAt);
  const title = `${manifest.country.name}: long-term fiscal projections under climate scenarios`;
  const figures = reportFigures(
    { result, params: manifest.params, defaults: manifest.defaults },
    manifest.charts,
  );
  // Partitioned on the figure's tab, not on the front of its id. The prefix
  // rule kept anything starting "baseline-" or "scenario-" and dropped the rest
  // in silence: the registry holds eleven charts, so that rule kept three and
  // lost eight. groupFigures guarantees every figure reaches exactly one
  // section.
  const sections = groupFigures(figures);

  // Keyed by CC-4's ChartTab values, which is what PacketFigure.tab carries.
  const leadIn: Record<string, string> = {
    Overview: 'One chart for the whole run.',
    Baseline:
      'The baseline applies no climate damage. It is the reference every scenario below is measured against.',
    Analysis:
      'Six pathways, each applying its own path of climate damage to GDP growth and, through it, to the fiscal accounts.',
    Climate: 'The channel from warming to the fiscal accounts, measured against the baseline path.',
  };

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(`Q-CRAFT scenario report: ${manifest.country.name}, ${dateHuman}`)}</title>
<meta name="generator" content="${escapeHtml(`${manifest.app.name} ${manifest.app.version}`)}">
<style>${REPORT_STYLES}</style>
</head>
<body>
<main class="doc">
<div class="printbar no-print"><button type="button" onclick="window.print()">Print or save as PDF</button></div>

<header class="titleblock">
  <p class="kicker">Q-CRAFT Explorer / Scenario report</p>
  <h1>${escapeHtml(title)}</h1>
  <p class="subtitle">${escapeHtml(manifest.annotations.label ?? `Baseline and six climate pathways to ${HORIZON}`)}</p>
  <dl class="titlemeta">
    <dt>Prepared with</dt><dd>${escapeHtml(manifest.app.name)} ${escapeHtml(manifest.app.version)}, an open-source reimplementation of the IMF’s Q-CRAFT methodology</dd>
    <dt>Country</dt><dd>${escapeHtml(manifest.country.name)} (<code>${escapeHtml(manifest.country.iso3c)}</code>)</dd>
    <dt>Data mode</dt><dd>${escapeHtml(modeLine(manifest))}</dd>
    <dt>Data vintage</dt><dd><code>${escapeHtml(manifest.dataVintage)}</code></dd>
    <dt>Generated</dt><dd>${escapeHtml(dateHuman)} (<code>${escapeHtml(manifest.generatedAt)}</code>)</dd>
  </dl>
</header>

${statusBanner(manifest)}

${analystNote(manifest)}

<section>
  <h2>Summary of findings</h2>
  ${summaryParagraphs(result)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join('\n  ')}
  ${keyFigures(result)}
</section>

${sections
  .map(
    (section) =>
      `<section>\n  <h2>${escapeHtml(section.title)}</h2>\n  ` +
      (leadIn[section.tab] ? `<p>${escapeHtml(leadIn[section.tab])}</p>\n  ` : '') +
      section.figures.map(renderFigure).join('\n  ') +
      `\n</section>`,
  )
  .join('\n\n')}

<section>
  <h2>Key numbers</h2>
  ${keyNumbersTable(result)}
</section>

${annex(manifest)}

<footer class="docfoot">
  <p>Q-CRAFT Explorer is a free, open-source reimplementation of the IMF’s Quantitative Climate Risk Assessment Fiscal Tool, by Teal Insights and NatureFinance. <strong>This is not an official IMF product</strong> and nothing in this report is an IMF view.</p>
  <p>${escapeHtml(modeLine(manifest))}. ${escapeHtml(modeStatement(manifest))}</p>
  <p>${modeSourcesLine(manifest)} Generated by ${escapeHtml(manifest.app.name)} ${escapeHtml(manifest.app.version)} on ${escapeHtml(dateHuman)}.</p>
</footer>
</main>
</body>
</html>
`;
}
