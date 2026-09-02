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
