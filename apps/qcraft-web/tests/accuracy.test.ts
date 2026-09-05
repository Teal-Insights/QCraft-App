/**
 * Accuracy gates from the 2026-09-02 audit (CC-26).
 *
 * The Explorer may say only what the IMF Q-CRAFT workbook and the User Guide
 * v1.0 (Tim and Rahman, 2024) say. These tests pin the sentences the audit
 * found wrong, so the fixes cannot drift back: scenario names and definitions,
 * the citations, and the phrases that misattributed the method.
 *
 * The source sweep mirrors copy.test.ts: user-visible literals in src, with
 * comments stripped, so a banned phrase in a comment is not a failure and a
 * banned phrase in copy always is.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { CLIMATE_SCENARIOS, SCENARIO_LABELS } from '../src/engine/types';
import {
  ADAPTATION_WINDOW_YEARS,
  SCENARIO_DESCRIPTIONS,
  SCENARIO_FAMILY_NOTE,
} from '../src/content/scenarios';
import { REFERENCES } from '../src/content/references';

const SRC = fileURLToPath(new URL('../src', import.meta.url));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      return !t.startsWith('//') && !t.startsWith('*');
    })
    .join('\n');
}

/** Lines of UI copy across src, comments removed, tagged with their file. */
function copyLines(): Array<{ file: string; line: string }> {
  return sourceFiles(SRC).flatMap((path) =>
    stripComments(readFileSync(path, 'utf8'))
      .split('\n')
      .map((line) => ({ file: path.slice(SRC.length + 1), line })),
  );
}

const offenders = (pattern: RegExp) =>
  copyLines()
    .filter(({ line }) => pattern.test(line))
    .map(({ file, line }) => `${file}: ${line.trim()}`);

describe('scenario names are the User Guide’s six (audit B, finding 1)', () => {
  it('uses the guide’s names with no temperature suffixes', () => {
    expect(SCENARIO_LABELS).toEqual({
      Baseline: 'Baseline',
      Paris: 'Paris',
      Moderate: 'Moderate',
      High: 'High',
      Hot: 'Hot',
      Hot_Adapted: 'Hot adapted',
      Hot_Unadapted: 'Hot unadapted',
    });
  });

  it('carries no temperature claim anywhere in UI copy', () => {
    // The guide states one temperature, for Paris ("below 2°C"), and none for
    // the others. Hot is the 90th percentile of High's SSP, so any suffix that
    // ranks them by degrees inverts the guide.
    expect(offenders(/Paris-Aligned|1\.5°C|4°C\+|\(2°C\)|\(3°C\)|Hot \+ /)).toEqual([]);
  });
});

describe('scenario definitions are the guide’s (audit B, finding 2)', () => {
  it('describes every scenario in the guide’s own terms', () => {
    for (const key of CLIMATE_SCENARIOS) {
      expect(SCENARIO_DESCRIPTIONS[key].length).toBeGreaterThan(40);
    }
    expect(SCENARIO_DESCRIPTIONS.Paris).toContain('SSP1-2.6');
    expect(SCENARIO_DESCRIPTIONS.Paris).toContain('below 2°C');
    expect(SCENARIO_DESCRIPTIONS.Moderate).toContain('SSP2-4.5');
    expect(SCENARIO_DESCRIPTIONS.Moderate).toContain('1960-2014');
    expect(SCENARIO_DESCRIPTIONS.High).toContain('SSP3-7.0');
    expect(SCENARIO_DESCRIPTIONS.Hot).toContain('90th percentile');
    expect(SCENARIO_DESCRIPTIONS.Hot_Adapted).toContain('20 years');
    expect(SCENARIO_DESCRIPTIONS.Hot_Unadapted).toContain('50 years');
  });

  it('states the adaptation windows the guide gives: 30, 20 and 50 years', () => {
    expect(ADAPTATION_WINDOW_YEARS).toEqual({ Hot: 30, Hot_Adapted: 20, Hot_Unadapted: 50 });
  });

  it('explains why Hot is not a rung above High', () => {
    expect(SCENARIO_FAMILY_NOTE).toContain('SSP3-7.0');
    expect(SCENARIO_FAMILY_NOTE).toContain('90th percentile');
    expect(SCENARIO_FAMILY_NOTE).toContain('median');
  });

  it('has swept out the NGFS-style phrases', () => {
    expect(
      offenders(/net zero by 2050|current pledges|worst-case warming|insufficient (policy )?action|with adaptation measures|without adaptation/i),
    ).toEqual([]);
  });
});

describe('citations are real (audit B, findings 3, 4 and 9)', () => {
  const all = REFERENCES.map((r) => `${r.authors} (${r.year}). ${r.title}. ${r.publisher}`).join('\n');

  it('cites the User Guide by its authors, not as an internal document', () => {
    expect(all).toContain('Tim, T. and Rahman, J.');
    expect(all).toContain(
      'Climate Change Fiscal Risks: User Guide for the Quantitative Climate Risk Assessment Fiscal Tool (Q-CRAFT), Version 1.0',
    );
    expect(all).not.toMatch(/internal/i);
  });

  it('attributes the workbook to the IMF Fiscal Affairs Department', () => {
    expect(all).toMatch(/IMF Fiscal Affairs Department \(2024\)\. Quantitative Climate Risk Assessment Fiscal Tool/);
  });

  it('gives Centorrino, Massetti and Tagklis (2024) its real title', () => {
    expect(all).toContain('Climate Effects on GDP Growth: Updated Estimates of Kahn et al. (2021)');
  });

  it('no longer cites Batini et al. or an invented title anywhere', () => {
    expect(offenders(/Batini|Internal methodology|Temperature and GDP: the damage layer/)).toEqual([]);
  });
});

// ── Block 2: honesty toward the workbook (audit B, findings 5 to 22) ─────────

import { ABOUT, NO_CLIMATE_DATA, VERIFIED_BADGE, MODES, workbookOnlyItems } from '../src/content/modes';
import { EXPLORER_DEFAULTS_NOTE, PARAM_GUIDANCE } from '../src/content/guidance';
import { PARAM_FIELDS, paramField } from '../src/content/params';

describe('the counterfactual is trend warming (finding 5)', () => {
  it('names the 1960-2014 trend path the losses are measured against', () => {
    expect(ABOUT.climateBody).toContain('1960-2014');
    expect(offenders(/no-warming/)).toEqual([]);
  });
});

describe('the Verified badge names the verifier (finding 6)', () => {
  it('says who verified and what was reproduced', () => {
    expect(VERIFIED_BADGE.startsWith('Teal Insights verified')).toBe(true);
    expect(VERIFIED_BADGE).toContain('Reproduces the IMF Excel workbook');
    expect(VERIFIED_BADGE).not.toMatch(/official/);
  });
});

describe('defaults are the Explorer’s, and say so (finding 7)', () => {
  it('never calls a starting value an engine default in copy', () => {
    expect(offenders(/engine default/i)).toEqual([]);
  });

  it('distinguishes Explorer starting values from reviewed country assumptions', () => {
    expect(EXPLORER_DEFAULTS_NOTE).toContain('not a reviewed country calibration');
    expect(EXPLORER_DEFAULTS_NOTE).toContain('the same for every country');
  });
});

describe('About the data lists what the workbook offers that this tool does not yet (finding 8)', () => {
  it('has the heading the audit asked for', () => {
    expect(ABOUT.workbookOnlyHeading).toBe(
      'What the IMF workbook offers that this tool does not yet',
    );
  });

  it('drops an item the moment its parameter is registered, and never before', () => {
    const registered = new Set<string>(PARAM_FIELDS.map((f) => f.key));
    const listed = workbookOnlyItems();
    for (const item of ABOUT.workbookOnly) {
      const shipped = item.paramKey !== undefined && registered.has(item.paramKey);
      expect(listed.includes(item)).toBe(!shipped);
    }
  });

  it('names the own-data paste, the Discrete Risks worksheet and the OECD realism check', () => {
    const text = workbookOnlyItems().map((i) => i.text).join(' ');
    expect(text).toContain('blue');
    expect(text).toContain('Discrete Risks');
    expect(text).toContain('OECD');
  });
});

describe('minor wording (findings 10 to 22)', () => {
  it('states the country count with the eleven-country climate gap', () => {
    expect(offenders(/complete data across all four/)).toEqual([]);
    expect(NO_CLIMATE_DATA.body).toContain('footnote 12');
  });

  it('describes rigidity as the guide does and files it under climate scenarios', () => {
    expect(PARAM_GUIDANCE.expenditureRigidity.help).toContain('does not adjust');
    expect(offenders(/barely adjusts/)).toEqual([]);
    expect(paramField('expenditure_rigidity').group).toBe('Climate scenarios');
  });

  it('describes the debt target as a level held near, approached not hit', () => {
    expect(PARAM_GUIDANCE.debtTarget.help).toContain('approached');
    expect(offenders(/toward this level over time/)).toEqual([]);
  });

  it('quotes the workbook’s own version string', () => {
    const notes = MODES.verified.sources.map((s) => s.note ?? '').join(' ');
    expect(notes).toContain('Version 1.0_11-15-2024');
    expect(offenders(/workbook v10/)).toEqual([]);
  });

  it('says scenarios, not pathways, for the six', () => {
    expect(offenders(/\bpathways\b/)).toEqual([]);
  });

  it('calls the 2029 debt ratio a forecast', () => {
    expect(offenders(/ended 2029 at/)).toEqual([]);
  });

  it('attributes the floor asymmetry to the workbook, not to the engine', () => {
    expect(offenders(/engine.s own design/)).toEqual([]);
  });
});

// ── Block 3: the frozen inputs become parameters (audit A, F1 and F5) ────────

import { PARAM_CONTEXT, PANEL_PARAMS } from '../src/context/panels';

describe('the long-run real rate and the Turning Point are parameters', () => {
  it('registers the real rate with its unit and under the growth assumptions', () => {
    const field = paramField('long_run_interest_rate');
    expect(field.label).toBe('Long-run real interest rate');
    expect(field.group).toBe('Growth assumptions');
    expect(field.format(2.5)).toBe('2.5% real, long run');
  });

  it('registers the Turning Point in years, beside productivity', () => {
    const field = paramField('productivity_turning_point');
    expect(field.label).toBe('Productivity turning point');
    expect(field.group).toBe('Growth assumptions');
    expect(field.format(15)).toBe('15 years');
    const keys = PARAM_FIELDS.map((f) => f.key);
    expect(keys.indexOf('productivity_turning_point')).toBe(keys.indexOf('productivity_end') + 1);
    expect(keys.indexOf('long_run_interest_rate')).toBe(keys.indexOf('interest_rate_mode') + 1);
  });

  it('opens the same context panels as the parameters they belong to', () => {
    expect(PARAM_CONTEXT.long_run_interest_rate).toMatchObject({ kind: 'panel', panel: 'interestRate' });
    expect(PARAM_CONTEXT.productivity_turning_point).toMatchObject({ kind: 'panel', panel: 'productivity' });
    expect(PANEL_PARAMS.interestRate).toContain('long_run_interest_rate');
    expect(PANEL_PARAMS.productivity).toContain('productivity_turning_point');
  });

  it('retires the two items from the workbook-only list', () => {
    const text = workbookOnlyItems().map((i) => i.text).join(' ');
    expect(workbookOnlyItems()).toHaveLength(3);
    expect(text).not.toContain('C29');
    expect(text).not.toContain('Turning Point');
  });
});

import { ENGINE_DEFAULTS } from '../src/engine/adapter';
import { fixtureEngine } from '../src/engine/mockAdapter';
import { buildRunManifest } from '../src/run/manifest';
import { manifestTrailer } from '../src/export/resultsCsv';
import { renderReportHtml } from '../src/export/reportHtml';

describe('the two parameters travel into every export', () => {
  const params = { ...ENGINE_DEFAULTS, interest_rate_mode: 'Real interest rate' as const, long_run_interest_rate: 2.5, productivity_turning_point: 10 };
  const result = fixtureEngine.run(params);
  const manifest = buildRunManifest({
    params,
    defaults: ENGINE_DEFAULTS,
    notes: {},
    result,
    now: new Date('2026-09-02T12:00:00.000Z'),
  });

  it('appear in the results CSV trailer with their values', () => {
    const csv = manifestTrailer(manifest).join('\n');
    expect(csv).toContain('Long-run real interest rate');
    expect(csv).toContain('2.5% real, long run');
    expect(csv).toContain('Productivity turning point');
    expect(csv).toContain('10 years');
  });

  it('appear in the report annex with their values', () => {
    const html = renderReportHtml({ manifest, result });
    expect(html).toContain('Long-run real interest rate');
    expect(html).toContain('2.5% real, long run');
    expect(html).toContain('Productivity turning point');
    expect(html).toContain('10 years');
  });
});
