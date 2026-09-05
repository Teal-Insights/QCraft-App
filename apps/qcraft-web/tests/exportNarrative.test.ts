/** Semantic claims in forwardable exports, exercised on real country inputs. */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runPipeline, type CountryInput } from '@qcraft/engine';
import { MODES, type ModeId } from '../src/content/modes';
import { ENGINE_DEFAULTS, WEO_BOUNDARY_YEAR } from '../src/engine/qcraftAdapter';
import { toEngineResult, toPipelineParams } from '../src/engine/pipelineResult';
import { buildRunManifest } from '../src/run/manifest';
import { renderReportHtml } from '../src/export/reportHtml';
import { buildWorkbookSpec } from '../src/export/workbookSpec';
import { renderChartPackHtml } from '../src/export/chartPack';
import { buildReadme } from '../src/export/readme';
import { keyFigures, noClimateSignal, packetFigures } from '../src/export/figures';

const plain = (s: string) => s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const build = (mode: ModeId, iso3c = 'UGA') => {
  const vintage = MODES[mode].vintage;
  const input = JSON.parse(readFileSync(new URL(`../../../data/vintages/${vintage}/json/${iso3c}.json`, import.meta.url), 'utf8')) as CountryInput;
  const params = { ...ENGINE_DEFAULTS, iso3c };
  const result = toEngineResult(runPipeline(input, toPipelineParams(params)), {
    iso3c, countryName: input.country, weoBoundaryYear: WEO_BOUNDARY_YEAR,
    mode, dataVintage: vintage,
  });
  const manifest = buildRunManifest({ params, defaults: ENGINE_DEFAULTS, notes: {}, result, now: new Date('2026-09-05T00:00:00Z') });
  const figures = packetFigures({ result, params, defaults: ENGINE_DEFAULTS });
  const report = renderReportHtml({ manifest, result });
  const workbook = buildWorkbookSpec(manifest, result);
  const readme = buildReadme(manifest, result, figures);
  const chartPack = renderChartPackHtml({ manifest, result, figures });
  return { result, report, workbook, readme, chartPack, bodies: [report, JSON.stringify(workbook), readme, chartPack].map(plain) };
};

for (const mode of ['verified', 'current'] as const) {
  describe(`${mode} export narrative`, () => {
    const docs = build(mode);
    it('uses the historical temperature trend reference across standalone documents', () => {
      for (const text of docs.bodies) {
        expect(text).toContain('temperatures continue along their 1960-2014 trend');
        expect(text).not.toMatch(/no climate damage|applies no climate damage|Worst climate outcome|reproduce all of this/);
      }
    });
    it('distinguishes SSP paths and Hot adaptation windows instead of one warming ladder', () => {
      for (const body of [docs.report, docs.chartPack].map(plain)) {
        expect(body).toContain('median SSP3-7.0');
        expect(body).toContain('90th-percentile SSP3-7.0');
        expect(body).toContain('Hot adapted and Hot unadapted keep Hot’s temperatures');
        expect(body).toContain('30-year adaptation window to 20 and 50 years');
        expect(body).not.toContain('only the warming pathway differs');
        expect(body).not.toContain('That spread is the climate-fiscal risk');
      }
      expect(docs.result.scenarios.map(s => s.key)).toEqual(expect.arrayContaining(['Hot', 'Hot_Adapted', 'Hot_Unadapted']));
    });
    it('puts neutral channel scope next to findings without a total-risk or lower-bound claim', () => {
      const summary = plain(docs.report.split('<h2>Summary of findings</h2>')[1].split('</section>')[0]);
      for (const text of [summary, ...docs.bodies]) {
        expect(text).toContain('labour productivity and the fiscal accounts');
        expect(text).toContain('Sea-level rise, individual disasters, tipping points and adaptation spending costs');
        expect(text).toContain('selected scenarios, not total climate-fiscal risk');
        expect(text).not.toContain('lower bound');
      }
    });
    it('qualifies reproduction once in each reproduction section', () => {
      for (const text of [plain(docs.report), plain(JSON.stringify(docs.workbook.sheets[0])), plain(docs.readme)]) {
        expect(text.match(/compatible engine and matching input data/g)).toHaveLength(1);
        expect(text).toContain('Import restores the recorded settings and notes');
      }
    });
    it('labels the maximum as a modeled ratio across the six climate scenarios', () => {
      const tile = keyFigures(docs.result).find(t => t.label.startsWith('Highest modeled debt ratio'));
      expect(tile).toBeDefined();
      expect(tile?.detail).toContain('across the six climate scenarios');
    });
    it('defines workbook GDP deviation with both signs and the same reference', () => {
      const sheet = docs.workbook.sheets.find(s => s.name === 'GDP vs baseline');
      const text = JSON.stringify(sheet);
      expect(text).toContain('percentage difference from the baseline reference path');
      expect(text).toContain('Negative values are below that path; positive values are above it');
      expect(text).not.toContain('Growth is removed');
    });
    it('preserves no-signal interpretation in a real Maldives export', () => {
      const flat = build(mode, 'MDV');
      expect(noClimateSignal(flat.result)).toBe(true);
      for (const text of flat.bodies) expect(text).toContain('no coverage for this economy');
      expect(flat.report).not.toMatch(/spread of 0\.0 points/);
      expect(keyFigures(flat.result).some(t => t.label.startsWith('Highest modeled debt ratio'))).toBe(false);
    });
  });
}
