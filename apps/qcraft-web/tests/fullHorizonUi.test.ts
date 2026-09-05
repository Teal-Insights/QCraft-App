import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { engine, ENGINE_DEFAULTS } from '../src/engine/adapter';
import { readCoverage } from '../src/engine/countryData';
import { MODES, type ModeId } from '../src/content/modes';
import { buildRunManifest, identityRows } from '../src/run/manifest';
import { parseRun, replayWarnings, serializeRun } from '../src/run/runFile';
import { buildAllScenariosCsv } from '../src/export/resultsCsv';
import { buildWorkbookSpec } from '../src/export/workbookSpec';
import { toXlsx } from '../src/export/workbookXlsx';
import { renderReportHtml } from '../src/export/reportHtml';
import { renderChartPackHtml } from '../src/export/chartPack';
import { buildReadme } from '../src/export/readme';
import { packetFigures } from '../src/export/figures';
import { MethodologyTab } from '../src/components/tabs/MethodologyTab';
import { RunIdentity } from '../src/components/RunIdentity';

function run(mode: ModeId, iso3c = 'UGA') {
  const input = JSON.parse(readFileSync(new URL(`../../../data/vintages/${MODES[mode].dataRevision}/json/${iso3c}.json`, import.meta.url), 'utf8'));
  const params = { ...ENGINE_DEFAULTS, iso3c };
  const outcome = engine.run({ input, mode, iso3c, countryName: input.country, coverage: readCoverage(input.horizonPolicy?.weoMaxYear == null ? input : { ...input, macrofiscal: input.macrofiscal.filter((r: { years: number }) => r.years <= input.horizonPolicy.weoMaxYear) }) }, params);
  if (!outcome.ok) throw new Error(`${iso3c}: ${outcome.detail}`);
  const result = outcome.result;
  const manifest = buildRunManifest({ params, result, defaults: ENGINE_DEFAULTS, notes: { debt_target: 'Declared teaching comparison, not a national target.' }, now: new Date('2026-09-05T00:00:00Z') });
  return { result, manifest, params };
}
const current = run('current');
const verified = run('verified');
const parse = (text: string) => parseRun(text, { currentDefaults: ENGINE_DEFAULTS, currentVintage: MODES.verified.vintage });
const plain = (s: string) => s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ');

describe('full horizon input and replay identity', () => {
  it('round trips every selected identity field without falsely warning about the previously active mode', () => {
    for (const { manifest, result } of [current, verified, run('current', 'ZMB')]) {
      const parsed = parse(serializeRun(manifest));
      expect(parsed.ok).toBe(true); if (!parsed.ok) continue;
      expect(parsed.manifest).toEqual(manifest);
      expect(parsed.warnings).toEqual([]);
      expect(replayWarnings(parsed.manifest, result)).toEqual([]);
    }
  });
  it('warns for old April 2026 files even though the source vintage string matches', () => {
    const old = { ...current.manifest };
    delete old.dataRevision; delete old.calculationPolicy; delete old.inputSha256; delete old.horizonPolicy;
    const parsed = parse(serializeRun(old));
    expect(parsed.ok).toBe(true); if (!parsed.ok) return;
    expect(parsed.warnings.join(' ')).toContain('truncated WEO at 2029');
    expect(parsed.warnings.join(' ')).toContain('not an exact replay');
    expect(replayWarnings(parsed.manifest, current.result).join(' ')).toContain('no input SHA-256');
  });
  it('detects changed data despite matching vintage, and rejects conflicting identities before applying settings', () => {
    const changed = { ...current.manifest, inputSha256: '0'.repeat(64) };
    expect(parse(serializeRun(changed)).ok).toBe(false);
    const consistentChanged = { ...changed, horizonPolicy: { ...changed.horizonPolicy!, inputSha256: changed.inputSha256 } };
    const parsed = parse(serializeRun(consistentChanged));
    expect(parsed.ok).toBe(true); if (!parsed.ok) return;
    expect(replayWarnings(parsed.manifest, current.result).join(' ')).toContain('input SHA-256 differs');
  });
  it('renders actual supported horizon, method qualifications and local official links', () => {
    const { result } = current;
    const method = renderToStaticMarkup(createElement(MethodologyTab, { mode: 'current', result }));
    const identity = renderToStaticMarkup(createElement(RunIdentity, { result }));
    expect(plain(identity)).toContain(`through ${result.horizonPolicy!.weoMaxYear}`);
    expect(plain(identity)).toContain(`from ${result.horizonPolicy!.climateStartYear}`);
    expect(method).toContain('../guide/resources/imf-qcraft-tool-v10.xlsx');
    expect(method).toContain('../guide/resources/imf-qcraft-user-guide-v10.pdf');
    expect(plain(method)).toContain('(1+r)/(1+g) = 1 + (r−g)/(1+g)');
    expect(plain(method)).toContain('no independent hand-entered primary-balance shock');
    expect(plain(method)).toContain('does not simulate an individual drought or flood');
  });
  it('travels consistently into CSV, workbook, report, chart pack and read-me', async () => {
    const { manifest, result, params } = current;
    const figures = packetFigures({ result, params, defaults: ENGINE_DEFAULTS });
    const workbook = buildWorkbookSpec(manifest, result);
    const bodies = [buildAllScenariosCsv(result, manifest), JSON.stringify(workbook),
      renderReportHtml({ result, manifest }), renderChartPackHtml({ result, manifest, figures }),
      buildReadme(manifest, result, figures)];
    for (const [label, value] of identityRows(manifest)) for (const text of bodies) {
      expect(plain(text), label).toContain(value);
      expect(plain(text), label).toContain(label);
    }
    const ExcelJS = await import('exceljs');
    const xlsx = new ExcelJS.Workbook();
    await xlsx.xlsx.load((await toXlsx(workbook)).buffer as ArrayBuffer);
    const readme = xlsx.worksheets[0];
    for (const [label, value] of identityRows(manifest)) {
      const row = Array.from({ length: readme.rowCount }, (_, i) => readme.getRow(i + 1)).find(r => r.getCell(1).value === label);
      expect(row, label).toBeDefined();
      expect(row!.getCell(2).value).toBe(value);
      expect(row!.height).toBeGreaterThan(15);
    }
  });
});
