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
  fiscalSeries,
  findScenario,
  fmtPct,
  gdpShortfallSeries,
  scenarioColor,
  scenarioSpread,
  valueAt,
} from '../selectors';
import type { ChartSeries } from '../charts/types';
import type { EngineResult, ScenarioKey } from '../engine/types';
import { documentedRows, manifestRows, type RunManifest } from '../run/manifest';
import { series as palette } from '../theme';
import { renderChartSvg } from './chartSvg';
import { REPORT_STYLES } from './reportStyles';

/** Reporting years, matching the engine's own final golden master. */
export const REPORT_YEARS = [2030, 2050, 2075, 2099] as const;

const HORIZON = 2099;
const MID = 2050;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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

interface Figure {
  id: string;
  title: string;
  subtitle: string;
  series: ChartSeries[];
  height: number;
  weoBoundaryYear?: number;
  zeroLine?: boolean;
  format?: (v: number) => string;
}

/**
 * The figures the report carries: the baseline pair, then the scenario pair.
 *
 * Exported so the tests can assert what a report contains without parsing HTML,
 * and so the on-screen export panel can list the figures before you click.
 */
export function reportFigures(result: EngineResult): Figure[] {
  const baseline = findScenario(result, 'Baseline');
  const spread = scenarioSpread(result, HORIZON);
  const boundary = result.weoBoundaryYear;

  const figures: Figure[] = [];

  if (baseline) {
    const debtPoints = baseline.fiscal.map((f) => ({
      year: f.year,
      value: f.debt_to_gdp,
    }));
    const last = debtPoints[debtPoints.length - 1];
    const start =
      debtPoints.find((p) => p.year === boundary) ?? debtPoints[0];

    figures.push({
      id: 'baseline-debt',
      title: `Baseline debt ${
        last.value > start.value ? 'rises to' : 'settles at'
      } ${fmtPct(last.value)} of GDP by ${last.year}`,
      subtitle:
        'No climate damage applied. Shaded years are WEO history and forecast; ' +
        'the projection continues past the boundary.',
      height: 300,
      weoBoundaryYear: boundary,
      series: [
        {
          key: 'Baseline',
          label: 'Baseline',
          color: palette.baseline,
          emphasis: true,
          directLabel: true,
          points: debtPoints,
        },
      ],
    });

    figures.push({
      id: 'baseline-revexp',
      title: 'Revenue and primary expenditure under the baseline',
      subtitle:
        'Revenue is held constant as a share of GDP. Expenditure grows with ' +
        'population, productivity and inflation.',
      height: 260,
      weoBoundaryYear: boundary,
      series: [
        {
          key: 'revenue',
          label: 'Revenue',
          color: palette.duo[0],
          directLabel: true,
          points: baseline.fiscal.map((f) => ({
            year: f.year,
            value: f.revenue_percent_gdp,
          })),
        },
        {
          key: 'expenditure',
          label: 'Primary expenditure',
          color: palette.duo[1],
          directLabel: true,
          points: baseline.fiscal.map((f) => ({
            year: f.year,
            value: f.primary_expenditure_percent_gdp,
          })),
        },
      ],
    });
  }

  const directLabelKeys: ScenarioKey[] = spread
    ? [spread.best.key, spread.worst.key, 'Baseline']
    : ['Baseline'];

  figures.push({
    id: 'scenario-debt',
    title: spread
      ? `Climate scenarios spread ${HORIZON} debt across ${spread.spread.toFixed(0)} points of GDP`
      : 'Debt-to-GDP under climate scenarios',
    subtitle:
      'Baseline in navy. Paris-Aligned, Moderate and High are separate damage ' +
      'pathways, each its own colour; the three 3°C scenarios share one ' +
      'colour, darkening as adaptation falls away. They are a family, not rungs ' +
      'on a single severity ladder.',
    height: 340,
    weoBoundaryYear: result.weoBoundaryYear,
    series: fiscalSeries(result, 'debt_to_gdp', { directLabelKeys }),
  });

  figures.push({
    id: 'scenario-gdp',
    title: 'Climate damage as a share of baseline GDP',
    subtitle:
      'Each scenario’s real GDP measured against the baseline path, so ' +
      'growth is removed and only the damage remains. Baseline is the flat ' +
      'zero line.',
    height: 280,
    zeroLine: true,
    series: gdpShortfallSeries(result, {
      directLabelKeys: ['Paris', 'Hot_Unadapted'],
    }),
  });

  return figures;
}

function renderFigure(fig: Figure): string {
  const legend =
    fig.series.length > 1
      ? `<ul class="legend">${fig.series
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
    renderChartSvg({
      series: fig.series,
      height: fig.height,
      weoBoundaryYear: fig.weoBoundaryYear,
      zeroLine: fig.zeroLine,
      format: fig.format,
      ariaLabel: fig.title,
    }) +
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

  if (spread) {
    out.push(
      `Across the six climate pathways, ${HORIZON} debt ranges from ` +
        `${fmtPct(spread.best.value)} of GDP under ${spread.best.label} to ` +
        `${fmtPct(spread.worst.value)} under ${spread.worst.label}: a spread of ` +
        `${spread.spread.toFixed(1)} points of GDP. That spread is the ` +
        `climate-fiscal risk. The country, the data and the fiscal rule are the ` +
        `same in every one of those runs; only the warming pathway differs.`,
    );
  }

  const shortfalls = gdpShortfallSeries(result)
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
    out.push(
      `Real GDP in ${HORIZON} runs from ${best.value.toFixed(1)}% relative to ` +
        `the baseline path under ${best.label} to ${worst.value.toFixed(1)}% ` +
        `under ${worst.label}.`,
    );
  }

  return out;
}

function keyFigures(result: EngineResult): string {
  const baseline = findScenario(result, 'Baseline');
  const spread = scenarioSpread(result, HORIZON);
  const tiles: Array<{ label: string; value: string; detail?: string }> = [];

  const mid = baseline ? valueAt(baseline, MID, 'debt_to_gdp') : undefined;
  if (mid != null) {
    tiles.push({
      label: `Baseline debt, ${MID}`,
      value: fmtPct(mid),
      detail: 'Share of GDP, no climate damage',
    });
  }
  if (spread) {
    tiles.push({
      label: `Worst climate outcome, ${HORIZON}`,
      value: fmtPct(spread.worst.value),
      detail: spread.worst.label,
    });
    tiles.push({
      label: `Scenario spread, ${HORIZON}`,
      value: `${spread.spread.toFixed(1)} pts`,
      detail: `${spread.best.label} to ${spread.worst.label}`,
    });
  }

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
    return (
      `<tr${s.key === 'Baseline' ? ' class="is-baseline"' : ''}>` +
      `<th scope="row"><span class="swatch" style="display:inline-block;width:12px;` +
      `height:3px;border-radius:2px;margin-right:6px;background:${scenarioColor(
        s.key,
      )}"></span>${escapeHtml(s.label)}</th>` +
      cells +
      `<td>${gap == null ? 'n/a' : gap.toFixed(1)}</td></tr>`
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
      `the annex, on data vintage <code>${escapeHtml(manifest.dataVintage)}</code>.</p></div>`
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

export interface ReportInput {
  manifest: RunManifest;
  result: EngineResult;
}

export function renderReportHtml({ manifest, result }: ReportInput): string {
  const dateHuman = formatReportDate(manifest.generatedAt);
  const title = `${manifest.country.name}: long-term fiscal projections under climate scenarios`;
  const figures = reportFigures(result);
  const baselineFigures = figures.filter((f) => f.id.startsWith('baseline-'));
  const scenarioFigures = figures.filter((f) => f.id.startsWith('scenario-'));

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
  <p class="subtitle">Baseline and six climate pathways to ${HORIZON}</p>
  <dl class="titlemeta">
    <dt>Prepared with</dt><dd>${escapeHtml(manifest.app.name)} ${escapeHtml(manifest.app.version)}, an open-source reimplementation of the IMF’s Q-CRAFT methodology</dd>
    <dt>Country</dt><dd>${escapeHtml(manifest.country.name)} (<code>${escapeHtml(manifest.country.iso3c)}</code>)</dd>
    <dt>Data vintage</dt><dd><code>${escapeHtml(manifest.dataVintage)}</code></dd>
    <dt>Generated</dt><dd>${escapeHtml(dateHuman)} (<code>${escapeHtml(manifest.generatedAt)}</code>)</dd>
  </dl>
</header>

${statusBanner(manifest)}

<section>
  <h2>Summary of findings</h2>
  ${summaryParagraphs(result)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join('\n  ')}
  ${keyFigures(result)}
</section>

<section>
  <h2>Baseline projection</h2>
  <p>The baseline applies no climate damage. It is the reference every scenario below is measured against.</p>
  ${baselineFigures.map(renderFigure).join('\n  ')}
</section>

<section class="page-break">
  <h2>Climate scenarios</h2>
  <p>Six pathways, each applying its own path of climate damage to GDP growth and, through it, to the fiscal accounts.</p>
  ${scenarioFigures.map(renderFigure).join('\n  ')}
</section>

<section class="page-break">
  <h2>Key numbers</h2>
  ${keyNumbersTable(result)}
</section>

${annex(manifest)}

<footer class="docfoot">
  <p>Q-CRAFT Explorer is a free, open-source reimplementation of the IMF’s Quantitative Climate Risk Assessment Fiscal Tool, by Teal Insights and NatureFinance. <strong>This is not an official IMF product</strong> and nothing in this report is an IMF view.</p>
  <p>Verification status: baseline parity is exact for 147 of 147 tested countries. Climate-scenario parity is confirmed for ratio metrics only.</p>
  <p>Climate damage: FADCP Climate Dataset (Centorrino, Massetti and Tagklis, 2024), building on Kahn et al. (2021). Macrofiscal data: IMF World Economic Outlook. Population: UN World Population Prospects.</p>
  <p>Generated by ${escapeHtml(manifest.app.name)} ${escapeHtml(manifest.app.version)} on ${escapeHtml(dateHuman)}. Reproduce this run from the accompanying JSON file.</p>
</footer>
</main>
</body>
</html>
`;
}
