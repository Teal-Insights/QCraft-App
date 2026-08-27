/**
 * The export packet.
 *
 * What these tests defend, in order of how much damage the failure would do:
 *
 *  1. The report never claims the numbers responded to parameters that were not
 *     applied. This is the failure that would put a wrong figure in front of a
 *     ministry audience with a Teal Insights title block on it.
 *  2. Every figure in the report is read off the run being reported, not
 *     recomputed or rounded into something else.
 *  3. The rationale a user typed reaches all three artifacts.
 *  4. Free text cannot break the file it lands in (HTML, SVG or CSV).
 */

import { describe, expect, it } from 'vitest';

import { paramLabel } from '../src/content/params';
import { CURRENT_DIVERGENCE, MODES, VERIFIED_BADGE } from '../src/content/modes';
import { ENGINE_DEFAULTS } from '../src/engine/adapter';
import { fixtureEngine } from '../src/engine/mockAdapter';
import type { EngineParams } from '../src/engine/types';
import {
  buildRunManifest,
  type RationaleNotes,
  type RunAnnotations,
} from '../src/run/manifest';
import { parseRun } from '../src/run/runFile';
import { buildPacket, type PacketArtifact } from '../src/export/packet';
import { renderChartSvg } from '../src/export/chartSvg';
import {
  escapeHtml,
  formatReportDate,
  renderReportHtml,
  reportFigures,
  REPORT_YEARS,
  summaryParagraphs,
} from '../src/export/reportHtml';
import { buildAllScenariosCsv, csvCell, RESULT_COLUMNS } from '../src/export/resultsCsv';
import { fiscalSeries, findScenario, valueAt } from '../src/selectors';

const NOW = new Date('2026-08-26T09:30:00.000Z');

const CHANGED: EngineParams = {
  ...ENGINE_DEFAULTS,
  debt_target: 45,
  expenditure_rigidity: 0.4,
};

const NOTES: RationaleNotes = {
  debt_target: 'Charter for Fiscal Responsibility ceiling, agreed with MoFPED.',
  expenditure_rigidity: 'Development budget can absorb part of a shock, per the MTEF.',
};

const make = (
  params: EngineParams = CHANGED,
  notes: RationaleNotes = NOTES,
  annotations: RunAnnotations = {},
) => {
  const result = fixtureEngine.run(params);
  const manifest = buildRunManifest({
    params,
    defaults: ENGINE_DEFAULTS,
    notes,
    annotations,
    result,
    now: NOW,
  });
  return { result, manifest };
};

/** A text artifact's body. A binary artifact has none and is asked separately. */
const textOf = async (artifact: PacketArtifact): Promise<string> => {
  const payload = await artifact.build();
  if (payload.encoding !== 'text') {
    throw new Error(`${artifact.filename} is bytes, not text`);
  }
  return payload.text;
};

describe('the packet', () => {
  const { manifest, result } = make();
  const packet = buildPacket(manifest, result);

  it('is the six documents, in reading order', () => {
    expect(packet.map((a) => a.kind)).toEqual([
      'readme',
      'report',
      'workbook',
      'chart-pack',
      'results',
      'run',
    ]);
  });

  it('leaves the chart images out when nothing can rasterize them', () => {
    // There is no canvas under vitest, so the packet omits the images rather
    // than listing an artifact whose build() is guaranteed to throw.
    expect(packet.some((a) => a.needsBrowser)).toBe(false);
  });

  it('adds one chart image per figure once a rasterizer is supplied', () => {
    const withImages = buildPacket(manifest, result, {
      rasterize: async () => new Uint8Array([1, 2, 3]),
    });
    const images = withImages.filter((a) => a.kind === 'chart-image');
    expect(images).toHaveLength(reportFigures(result).length);
    expect(images.every((a) => a.needsBrowser)).toBe(true);
  });

  it('names the documents off one stem so they sort together', () => {
    expect(packet.filter((a) => a.kind !== 'readme').map((a) => a.filename)).toEqual([
      'qcraft-UGA-20260826-093000-report.html',
      'qcraft-UGA-20260826-093000.xlsx',
      'qcraft-UGA-20260826-093000-chart-pack.html',
      'qcraft-UGA-20260826-093000-results.csv',
      'qcraft-UGA-20260826-093000-run.json',
    ]);
  });

  it('closes the loop: the run file in the packet restores the run', async () => {
    const runFile = packet.find((a) => a.kind === 'run')!;
    const parsed = parseRun(await textOf(runFile), {
      currentDefaults: ENGINE_DEFAULTS,
      currentVintage: manifest.dataVintage,
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.manifest.params).toEqual(manifest.params);
    expect(parsed.manifest.notes).toEqual(manifest.notes);
    expect(parsed.manifest.annotations).toEqual(manifest.annotations);
  });

  it('puts the user’s rationale in every text artifact', async () => {
    for (const artifact of packet.filter((a) => a.kind !== 'workbook')) {
      expect(await textOf(artifact)).toContain('Charter for Fiscal Responsibility');
    }
  });

  it('carries the run label and the analyst’s note into every text artifact', async () => {
    const annotated = make(CHANGED, NOTES, {
      label: 'Tighter ceiling, FY2025/26 planning',
      note: 'Run for the Fiscal Risk Statement annex.',
    });
    for (const artifact of buildPacket(annotated.manifest, annotated.result).filter(
      (a) => a.kind !== 'workbook',
    )) {
      const body = await textOf(artifact);
      expect(body, `${artifact.filename} lost the run label`).toContain(
        'Tighter ceiling, FY2025/26 planning',
      );
      expect(body, `${artifact.filename} lost the analyst note`).toContain(
        'Run for the Fiscal Risk Statement annex.',
      );
    }
  });
});

describe('the report tells the truth about what produced its numbers', () => {
  it('states plainly that a fixture-backed run was not recomputed', () => {
    const { manifest, result } = make();
    const html = renderReportHtml({ manifest, result });
    expect(html).toContain('were not recomputed from the parameters');
  });

  it('lists each parameter the figures do not reflect, with both values', () => {
    const { manifest, result } = make();
    const html = renderReportHtml({ manifest, result });
    // 45% of GDP was requested; the figures are the 50% default run.
    expect(html).toContain(paramLabel('debt_target'));
    expect(html).toContain('45% of GDP');
    expect(html).toContain('50% of GDP');
  });

  it('says so when nothing was changed, rather than staying silent', () => {
    const { manifest, result } = make(ENGINE_DEFAULTS, {});
    const html = renderReportHtml({ manifest, result });
    expect(html).toContain('All parameters are at their engine defaults');
  });

  it('drops the caution entirely once the engine reports a computed run', () => {
    const { manifest, result } = make(ENGINE_DEFAULTS, {});
    const computed = {
      ...manifest,
      engine: { ...manifest.engine, kind: 'engine' as const, ignoredParams: [] },
    };
    const html = renderReportHtml({ manifest: computed, result });
    expect(html).toContain('Computed run');
    expect(html).not.toContain('were not recomputed from the parameters');
  });

  it('carries the binding verification wording and claims no more', () => {
    const { manifest, result } = make();
    const html = renderReportHtml({ manifest, result });
    // The fixture manifest is a Verified-mode run, so the report states the
    // Verified badge verbatim. Asserted against the registry constant rather
    // than a copy of the sentence: two copies of a claim about the IMF original
    // is exactly what a wording gate cannot police.
    expect(manifest.mode).toBe('verified');
    expect(html).toContain(escapeReportHtml(VERIFIED_BADGE));
    expect(html).toContain('not an official IMF product');
  });

  it('states the divergence note instead when the run is in Current mode', () => {
    const { manifest, result } = make();
    const html = renderReportHtml({
      manifest: { ...manifest, mode: 'current', dataVintage: MODES.current.vintage },
      result,
    });
    // A Current-mode report must never carry "matches the official IMF Excel
    // workbook": the whole point of the divergence note is that it does not.
    expect(html).toContain(escapeReportHtml(CURRENT_DIVERGENCE));
    expect(html).not.toContain('147 of 147');
  });

  it('attributes climate damage to the FADCP dataset, not to NGFS', () => {
    // SHARED/REFERENCE-NOTES.md names FADCP (Centorrino, Massetti and Tagklis,
    // 2024) as binding and calls the NGFS attribution an error being fixed.
    const { manifest, result } = make();
    const html = renderReportHtml({ manifest, result });
    expect(html).toContain('FADCP Climate Dataset');
    expect(html).not.toContain('NGFS');
  });
});

describe('report numbers come off the run', () => {
  const { manifest, result } = make();
  const html = renderReportHtml({ manifest, result });

  it('reports debt-to-GDP at each reporting year for every scenario', () => {
    for (const scenario of result.scenarios) {
      for (const year of REPORT_YEARS) {
        const v = valueAt(scenario, year, 'debt_to_gdp');
        expect(v).toBeDefined();
        expect(html).toContain(`<td>${v!.toFixed(1)}</td>`);
      }
    }
  });

  it('never prints a negative zero in the key-numbers table', () => {
    // Moderate's 2099 GDP gap rounds to -0.04, which formatted as "-0.0": a
    // sign on a number that does not have one.
    expect(html).not.toContain('>-0.0<');
  });

  it('says above or below the baseline rather than "relative to" it', () => {
    // "0.4% relative to the baseline path" reads as 0.4% OF the baseline.
    const gdpSentence = summaryParagraphs(result).find((p) => p.includes('Real GDP'))!;
    expect(gdpSentence).toMatch(/above the baseline path/);
    expect(gdpSentence).toMatch(/below the baseline path/);
    expect(gdpSentence).not.toContain('%  relative to');
  });

  it('forces a page break only for the annex, not around every section', () => {
    // Forcing one before each section left two printed pages nearly empty.
    // One element carries the class; the other match is the rule that defines
    // it in the inlined stylesheet.
    expect(html.match(/class="[^"]*page-break/g)).toHaveLength(1);
    expect(html).toContain('class="annex page-break"');
  });

  it('keeps the printed report to the pages its content needs', () => {
    // The annex table at screen padding filled the printed page to the
    // millimetre and pushed the last footer line onto a page of its own.
    // Tighter print cells pull it back; footer paragraphs still never split.
    expect(html).toContain('th, td { padding: 4px 7px; }');
    expect(html).toContain('.docfoot p { break-inside: avoid; }');
  });

  it('quotes the baseline levels the summary paragraph claims', () => {
    const baseline = findScenario(result, 'Baseline')!;
    const [first] = summaryParagraphs(result);
    expect(first).toContain(valueAt(baseline, 2050, 'debt_to_gdp')!.toFixed(1));
    expect(first).toContain(valueAt(baseline, 2099, 'debt_to_gdp')!.toFixed(1));
  });

  it('carries the manifest identity in the title block', () => {
    expect(html).toContain('weo-2024-10');
    expect(html).toContain('2026-08-26T09:30:00.000Z');
    expect(html).toContain('26 August 2026');
    expect(html).toContain('Uganda');
  });

  it('renders four figures: the baseline pair and the scenario pair', () => {
    expect(reportFigures(result).map((f) => f.id)).toEqual([
      'baseline-debt',
      'baseline-revexp',
      'scenario-debt',
      'scenario-gdp',
    ]);
    for (const fig of reportFigures(result)) {
      expect(html).toContain(`id="fig-${fig.id}"`);
    }
  });

  it('ships print rules so browser print-to-PDF is the intended output', () => {
    expect(html).toContain('@page');
    expect(html).toContain('break-before: page');
    expect(html).toContain('print-color-adjust: exact');
  });

  it('is self-contained: no external stylesheet, script or font fetch', () => {
    expect(html).not.toMatch(/<link\b/);
    expect(html).not.toMatch(/<script\b/);
    expect(html).not.toContain('@font-face');
    expect(html).not.toMatch(/https?:\/\/(?!www\.w3\.org)/);
  });
});

describe('every parameter reaches the annex', () => {
  const { manifest, result } = make();
  const html = renderReportHtml({ manifest, result });

  it('lists what was left alone as well as what was changed', () => {
    expect(html).toContain(paramLabel('demography_variant'));
    expect(html).toContain('>Default</span>');
    expect(html).toContain('>Changed</span>');
  });

  it('names changed parameters that carry no rationale', () => {
    const { manifest: m2, result: r2 } = make(CHANGED, {
      debt_target: 'documented',
    });
    expect(renderReportHtml({ manifest: m2, result: r2 })).toContain(
      'carries no recorded rationale',
    );
  });
});

describe('static chart SVG', () => {
  const { result } = make();
  const series = fiscalSeries(result, 'debt_to_gdp', { directLabelKeys: ['Baseline'] });

  it('draws one path per series, with no DOM', () => {
    const svg = renderChartSvg({ series, ariaLabel: 'Debt to GDP' });
    expect(svg.match(/<path /g)).toHaveLength(series.length);
    expect(svg).toContain('viewBox="0 0 700 320"');
    expect(svg).toContain('role="img"');
  });

  it('draws axis ticks and the WEO boundary when asked', () => {
    const svg = renderChartSvg({
      series,
      ariaLabel: 'Debt to GDP',
      weoBoundaryYear: result.weoBoundaryYear,
    });
    expect(svg).toContain(`WEO to ${result.weoBoundaryYear}`);
    expect(svg).toContain('stroke-dasharray="3,3"');
    expect(svg).toMatch(/<text[^>]*>2050<\/text>/);
  });

  it('says there is no data rather than drawing an empty frame', () => {
    expect(renderChartSvg({ series: [], ariaLabel: 'Nothing' })).toContain(
      'No data for this chart',
    );
  });

  it('escapes series labels, which carry + and ° and quotes', () => {
    const svg = renderChartSvg({
      series: [
        {
          key: 'x',
          label: 'Hot + Unadapted',
          color: '#000',
          directLabel: true,
          points: [
            { year: 2030, value: 1 },
            { year: 2040, value: 2 },
          ],
        },
      ],
      ariaLabel: 'A "quoted" & <tagged> label',
    });
    expect(svg).toContain('aria-label="A &quot;quoted&quot; &amp; &lt;tagged&gt; label"');
  });
});

describe('results CSV', () => {
  const { manifest, result } = make();
  const csv = buildAllScenariosCsv(result, manifest);
  const lines = csv.split('\n');

  it('leads with a clean data rectangle, so it parses as a table', () => {
    expect(lines[0]).toBe(['scenario', ...RESULT_COLUMNS.map((c) => c.key)].join(','));
    const dataRows = lines.slice(1, lines.indexOf(''));
    const expected = result.scenarios.reduce((n, s) => n + s.fiscal.length, 0);
    expect(dataRows).toHaveLength(expected);
    for (const row of dataRows) {
      expect(row.split(',')).toHaveLength(RESULT_COLUMNS.length + 1);
    }
  });

  it('appends the run manifest below the data, caveat included', () => {
    expect(csv).toContain('Run manifest');
    expect(csv).toContain('weo-2024-10');
    expect(csv).toContain('NOT RECOMPUTED');
    expect(csv).toContain('Parameters the results do NOT reflect');
  });

  it('quotes free text so a comma in a rationale cannot shift a column', () => {
    const { manifest: m2, result: r2 } = make(CHANGED, {
      debt_target: 'Ceiling, per the Charter; "agreed" in July',
    });
    const text = buildAllScenariosCsv(r2, m2);
    expect(text).toContain('"Ceiling, per the Charter; ""agreed"" in July"');
    expect(csvCell('plain')).toBe('plain');
  });
});

describe('escaping and formatting helpers', () => {
  it('escapes HTML so a rationale note cannot inject markup', () => {
    const { manifest, result } = make(CHANGED, {
      debt_target: '<script>alert("x")</script> & more',
    });
    const html = renderReportHtml({ manifest, result });
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; more');
  });

  it('escapes the ampersand first, so entities are not double-escaped wrong', () => {
    expect(escapeHtml('a & <b> "c"')).toBe('a &amp; &lt;b&gt; &quot;c&quot;');
  });

  it('formats the report date in UTC, matching the manifest timestamp', () => {
    expect(formatReportDate('2026-08-26T23:30:00.000Z')).toBe('26 August 2026');
    expect(formatReportDate('not a date')).toBe('not a date');
  });
});

/**
 * The report escapes its text before writing it, so an assertion on raw copy has
 * to escape too. Same rules as `escapeHtml` in src/export/reportHtml.ts.
 */
function escapeReportHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
