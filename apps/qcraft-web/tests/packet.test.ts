/**
 * The parts of the packet that are new in this pass.
 *
 * What these defend, in order of how much damage the failure would do:
 *
 *  1. A chart cannot vanish from a document without anyone noticing. The old
 *     report partitioned figures by id prefix and dropped the rest in silence.
 *  2. A country with no climate data is never described as having a finding.
 *     Eleven selectable countries have an all-zero climate slice, and the
 *     computed titles would otherwise report a nil spread as the climate risk.
 *  3. The workbook says what the run was and what it may be used to claim,
 *     before it says any numbers.
 *  4. The archive a user downloads is a real archive.
 *
 * The .xlsx SERIALIZER is deliberately not tested here. Under Node, exceljs
 * resolves to its Node build, which is a different serializer from the browser
 * build that ships, so a passing test would be testing code no user runs.
 * `scripts/export-loop.mjs` exercises the real one in a real browser and opens
 * the result with openpyxl, which is the check worth having.
 */

import { describe, expect, it } from 'vitest';

import { ENGINE_DEFAULTS } from '../src/engine/adapter';
import { fixtureEngine } from '../src/engine/mockAdapter';
import type { EngineParams, EngineResult, ScenarioSeries } from '../src/engine/types';
import { buildRunManifest, type RunAnnotations } from '../src/run/manifest';
import { buildPacket, buildPacketZip, packetFooter } from '../src/export/packet';
import {
  BELOW_ZERO_NOTE,
  FIGURE_GROUPS,
  goesBelowZero,
  groupFigures,
  keyFigures,
  noClimateSignal,
  packetFigures,
  type PacketFigure,
} from '../src/export/figures';
import { buildReadme } from '../src/export/readme';
import { renderChartPackHtml } from '../src/export/chartPack';
import { renderReportHtml } from '../src/export/reportHtml';
import { buildWorkbookSpec, safeSheetName } from '../src/export/workbookSpec';
import { crc32, buildZip } from '../src/export/zip';

const NOW = new Date('2026-08-26T09:30:00.000Z');

const make = (
  params: EngineParams = ENGINE_DEFAULTS,
  annotations: RunAnnotations = {},
  transform: (result: EngineResult) => EngineResult = (r) => r,
) => {
  const result = transform(fixtureEngine.run(params));
  return {
    result,
    manifest: buildRunManifest({
      params,
      defaults: ENGINE_DEFAULTS,
      notes: { debt_target: 'The Charter ceiling.' },
      annotations,
      result,
      now: NOW,
    }),
  };
};

/** Force every climate scenario onto the baseline, as a zero-coverage country is. */
const flatten = (result: EngineResult): EngineResult => {
  const baseline = result.scenarios.find((s) => s.key === 'Baseline')!;
  return {
    ...result,
    countryName: 'Testland',
    scenarios: result.scenarios.map((s): ScenarioSeries =>
      s.key === 'Baseline' ? s : { ...s, fiscal: baseline.fiscal, gdp: baseline.gdp },
    ),
  };
};

/** Push every path below zero, as switching the fiscal rule off can. */
const sink = (result: EngineResult): EngineResult => ({
  ...result,
  scenarios: result.scenarios.map((s) => ({
    ...s,
    fiscal: s.fiscal.map((f) => ({ ...f, debt_to_gdp: f.debt_to_gdp - 200 })),
  })),
});

describe('no figure can be dropped in silence', () => {
  const { result } = make();

  it('puts every figure in exactly one section', () => {
    const figures = packetFigures(result);
    const sections = groupFigures(figures);
    const placed = sections.flatMap((s) => s.figures.map((f) => f.id));
    expect(placed.sort()).toEqual(figures.map((f) => f.id).sort());
  });

  it('keeps a figure whose group this build does not recognise', () => {
    const stranger = {
      ...packetFigures(result)[0],
      id: 'from-a-later-lane',
      group: 'not-a-group-yet',
    } as unknown as PacketFigure;

    const sections = groupFigures([...packetFigures(result), stranger]);
    const placed = sections.flatMap((s) => s.figures.map((f) => f.id));
    expect(placed).toContain('from-a-later-lane');
    expect(sections.at(-1)?.title).toBe('Other charts');
  });

  it('renders every figure into the report, section by section', () => {
    const { manifest } = make();
    const html = renderReportHtml({ manifest, result });
    for (const figure of packetFigures(result)) {
      expect(html, `${figure.id} is missing from the report`).toContain(`id="fig-${figure.id}"`);
    }
  });

  it('uses group names the report is willing to print as headings', () => {
    for (const group of FIGURE_GROUPS) {
      expect(group).toMatch(/^[a-z]+$/);
    }
  });
});

describe('a country with no climate data is not given a finding', () => {
  const { manifest, result } = make(ENGINE_DEFAULTS, {}, flatten);

  it('recognises the flat case', () => {
    expect(noClimateSignal(result)).toBe(true);
    expect(noClimateSignal(make().result)).toBe(false);
  });

  it('does not report a spread, in the report or in the key figures', () => {
    const html = renderReportHtml({ manifest, result });
    expect(html).not.toContain('That spread is the climate-fiscal risk');
    expect(html).not.toMatch(/spread of 0\.0 points/);
    expect(keyFigures(result).map((t) => t.value)).toContain('No signal');
  });

  it('says the data is missing rather than that the risk is absent', () => {
    const html = renderReportHtml({ manifest, result });
    expect(html).toContain('no coverage for this economy');
    expect(html).toContain('missing, not because there is no risk');
  });

  it('carries the same statement into the chart pack and the README', () => {
    const figures = packetFigures(result);
    expect(renderChartPackHtml({ manifest, result, figures })).toContain(
      'no coverage for this economy',
    );
    expect(buildReadme(manifest, result, figures)).toContain('no coverage for this economy');
  });
});

describe('a path below zero is explained rather than printed bare', () => {
  const { manifest, result } = make(ENGINE_DEFAULTS, {}, sink);

  it('recognises it', () => {
    expect(goesBelowZero(result)).toBe(true);
    expect(goesBelowZero(make().result)).toBe(false);
  });

  it('says what below zero means, without judging it', () => {
    const figures = packetFigures(result);
    const debt = figures.find((f) => f.id === 'scenario-debt')!;
    expect(debt.subtitle).toContain(BELOW_ZERO_NOTE);
    expect(renderReportHtml({ manifest, result })).toContain('net asset position');
  });

  it('marks the worst-outcome tile, which is the one read on its own', () => {
    const worst = keyFigures(result).find((t) => t.label.startsWith('Worst climate outcome'));
    expect(worst?.detail).toContain('net asset position');
  });
});

describe('the workbook spec', () => {
  const { manifest, result } = make(
    { ...ENGINE_DEFAULTS, debt_target: 45 },
    { label: 'A run', note: 'Why this run exists.' },
  );
  const spec = buildWorkbookSpec(manifest, result);
  const sheet = (name: string) => spec.sheets.find((s) => s.name === name)!;

  it('opens on a README, before any numbers', () => {
    expect(spec.sheets[0].name).toBe('README');
    expect(spec.sheets[0].table).toBeUndefined();
  });

  it('states the claim and the vintage on that first sheet', () => {
    const blocks = JSON.stringify(sheet('README').blocks);
    expect(blocks).toContain(manifest.dataVintage);
    expect(blocks).toContain('not an official IMF product');
    expect(blocks).toContain('Why this run exists.');
  });

  it('lists what every other sheet is for', () => {
    const readme = JSON.stringify(sheet('README').blocks);
    for (const other of spec.sheets.slice(1)) {
      expect(readme, `README does not mention ${other.name}`).toContain(other.name);
    }
  });

  it('carries the rationale on the assumptions sheet', () => {
    const rows = sheet('Assumptions').table!.rows;
    expect(rows.some((r) => r.includes('The Charter ceiling.'))).toBe(true);
  });

  it('gives the long series sheet a frozen header and a filter', () => {
    const table = sheet('Results (all series)').table!;
    expect(table.freezeHeader).toBe(true);
    expect(table.autoFilter).toBe(true);
    // Seven scenarios over the projection, so a filter is the point of it.
    expect(table.rows.length).toBeGreaterThan(600);
  });

  it('makes the wide sheets chartable: one column per scenario, years down', () => {
    const table = sheet('Debt by scenario').table!;
    expect(table.columns[0].header).toBe('Year');
    expect(table.columns).toHaveLength(result.scenarios.length + 1);
    expect(table.rows[0][0]).toBe(result.scenarios[0].fiscal[0].year);
  });

  it('keeps every sheet name inside what Excel accepts', () => {
    for (const s of spec.sheets) {
      expect(s.name.length).toBeLessThanOrEqual(31);
      expect(s.name).not.toMatch(/[[\]:*?/\\]/);
    }
    expect(safeSheetName('Debt: 2030/2099 [draft]?')).toBe('Debt 2030 2099 draft');
    expect(safeSheetName('   ')).toBe('Sheet');
    expect(safeSheetName('x'.repeat(40))).toHaveLength(31);
  });
});

describe('the archive', () => {
  it('agrees with a known CRC-32', () => {
    // The standard check value for "123456789".
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });

  it('is byte-identical for the same inputs and timestamp', async () => {
    const entries = [{ name: 'a.txt', bytes: new TextEncoder().encode('hello '.repeat(50)) }];
    const one = await buildZip(entries, NOW);
    const two = await buildZip(entries, NOW);
    expect(Array.from(one)).toEqual(Array.from(two));
  });

  it('starts with the local file header signature and ends with the end record', async () => {
    const zip = await buildZip([{ name: 'a.txt', bytes: new Uint8Array([1, 2, 3]) }], NOW);
    expect(Array.from(zip.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
    expect(Array.from(zip.slice(-22, -18))).toEqual([0x50, 0x4b, 0x05, 0x06]);
  });

  it('gathers the chart images into their own folder', async () => {
    const { manifest, result } = make();
    const artifacts = buildPacket(manifest, result, {
      rasterize: async () => new Uint8Array([137, 80, 78, 71]),
    });
    const zip = await buildPacketZip(artifacts, manifest);
    const text = new TextDecoder().decode(zip);
    expect(text).toContain('charts/');
    expect(text).toContain('READ-ME.txt');
  });
});

describe('a standalone chart carries its own provenance', () => {
  it('names the country, the mode, the vintage and the disclaimer', () => {
    const { manifest } = make();
    const footer = packetFooter(manifest);
    expect(footer).toContain(manifest.country.name);
    expect(footer).toContain(manifest.dataVintage);
    expect(footer).toContain('Not an official IMF product');
  });
});
