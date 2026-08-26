/**
 * The run manifest and the run-file round trip.
 *
 * The claim this file has to defend is the one the export packet rests on:
 * export a run, re-import the JSON, and you are looking at the same run. If the
 * round trip loses or alters a single parameter, the report and the app quietly
 * describe different projections.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { PARAM_FIELDS, paramLabel } from '../src/content/params';
import { engine, ENGINE_DEFAULTS, FIXTURE_VINTAGE } from '../src/engine/adapter';
import type { EngineParams } from '../src/engine/types';
import {
  buildRunManifest,
  cleanNotes,
  documentedRows,
  manifestRows,
  runFileStem,
  RUN_SCHEMA,
  type RationaleNotes,
} from '../src/run/manifest';
import { parseRun, serializeRun } from '../src/run/runFile';
import { APP_VERSION } from '../src/run/version';

const NOW = new Date('2026-08-26T09:30:00.000Z');

/** A run a Uganda analyst might actually set up, with rationale for each move. */
const CHANGED: EngineParams = {
  ...ENGINE_DEFAULTS,
  debt_target: 45,
  expenditure_rigidity: 0.4,
  inflation_end: 5,
};

const NOTES: RationaleNotes = {
  debt_target: 'Charter for Fiscal Responsibility ceiling, not the 50% default.',
  expenditure_rigidity: 'MoFPED expects development spending to absorb part of a shock.',
  inflation_end: 'BoU medium-term target rather than the engine default.',
};

const build = (params: EngineParams, notes: RationaleNotes = {}) =>
  buildRunManifest({
    params,
    defaults: ENGINE_DEFAULTS,
    notes,
    result: engine.run(params),
    now: NOW,
  });

const CONTEXT = { currentDefaults: ENGINE_DEFAULTS, currentVintage: FIXTURE_VINTAGE };

describe('APP_VERSION', () => {
  it('matches package.json, so exported reports are not mislabelled', () => {
    const pkg = JSON.parse(
      readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'),
    );
    expect(APP_VERSION).toBe(pkg.version);
  });
});

describe('buildRunManifest', () => {
  const manifest = build(CHANGED, NOTES);

  it('records country, data vintage, app version and timestamp', () => {
    expect(manifest.schema).toBe(RUN_SCHEMA);
    expect(manifest.country).toEqual({ iso3c: 'UGA', name: 'Uganda' });
    expect(manifest.dataVintage).toBe(FIXTURE_VINTAGE);
    expect(manifest.app.version).toBe(APP_VERSION);
    expect(manifest.generatedAt).toBe('2026-08-26T09:30:00.000Z');
  });

  it('records every parameter, none omitted', () => {
    for (const { key } of PARAM_FIELDS) {
      expect(manifest.params[key]).toBe(CHANGED[key]);
      expect(manifest.defaults[key]).toBe(ENGINE_DEFAULTS[key]);
    }
    expect(Object.keys(manifest.params).sort()).toEqual(
      PARAM_FIELDS.map((f) => f.key).sort(),
    );
  });

  it('carries the engine claim status into the artifact', () => {
    // The lesson from the LIC-DSF pack: a caveat that only lives in the app
    // does not travel with the file someone forwards.
    expect(manifest.engine.kind).toBe('fixture');
    expect(manifest.engine.ignoredParams.map((p) => p.label).sort()).toEqual(
      [
        paramLabel('debt_target'),
        paramLabel('expenditure_rigidity'),
        paramLabel('inflation_end'),
      ].sort(),
    );
  });

  it('serializes parameters in registry order, so two runs diff cleanly', () => {
    expect(Object.keys(manifest.params)).toEqual(PARAM_FIELDS.map((f) => f.key));
  });
});

describe('cleanNotes', () => {
  it('drops empty and whitespace-only notes', () => {
    expect(cleanNotes({ debt_target: '   ', fiscal_rule: '' })).toEqual({});
  });

  it('trims the notes it keeps', () => {
    expect(cleanNotes({ debt_target: '  ceiling  ' })).toEqual({ debt_target: 'ceiling' });
  });
});

describe('manifestRows', () => {
  const rows = manifestRows(build(CHANGED, NOTES));

  it('follows registry order, so the annex reads like the sidebar', () => {
    expect(rows.map((r) => r.key)).toEqual(PARAM_FIELDS.map((f) => f.key));
  });

  it('marks each parameter default or changed against its own default', () => {
    const changed = rows.filter((r) => r.state === 'changed').map((r) => r.key);
    expect(changed.sort()).toEqual(
      ['debt_target', 'expenditure_rigidity', 'inflation_end'].sort(),
    );
    const untouched = rows.find((r) => r.key === 'demography_variant')!;
    expect(untouched.state).toBe('default');
    expect(untouched.display).toBe(untouched.defaultDisplay);
  });

  it('attaches the rationale note to its parameter', () => {
    expect(rows.find((r) => r.key === 'debt_target')!.note).toBe(NOTES.debt_target);
    expect(rows.find((r) => r.key === 'fiscal_rule')!.note).toBeUndefined();
  });

  it('keeps a note whose value has gone back to default, and shows the state', () => {
    // Notes attach to a parameter, not to a change. Silently dropping the text
    // a user typed is the one behaviour worse than showing it beside "Default".
    const rowsBack = manifestRows(
      build(ENGINE_DEFAULTS, { debt_target: 'considered 45, kept the default' }),
    );
    const row = rowsBack.find((r) => r.key === 'debt_target')!;
    expect(row.state).toBe('default');
    expect(row.note).toBe('considered 45, kept the default');
    expect(documentedRows(rowsBack).map((r) => r.key)).toEqual(['debt_target']);
  });
});

describe('runFileStem', () => {
  it('is filename-safe and sorts a packet together', () => {
    expect(runFileStem(build(CHANGED))).toBe('qcraft-UGA-20260826-093000');
  });
});

describe('run file round trip', () => {
  it('restores the identical run', () => {
    const manifest = build(CHANGED, NOTES);
    const parsed = parseRun(serializeRun(manifest), CONTEXT);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.manifest.params).toEqual(manifest.params);
    expect(parsed.manifest.notes).toEqual(manifest.notes);
    expect(parsed.warnings).toEqual([]);
  });

  it('re-serializes byte-identically, so a round trip is verifiable', () => {
    const text = serializeRun(build(CHANGED, NOTES));
    const parsed = parseRun(text, CONTEXT);
    if (!parsed.ok) throw new Error(parsed.error);
    expect(serializeRun(parsed.manifest)).toBe(text);
  });

  it('reproduces the same engine result from the restored parameters', () => {
    const manifest = build(CHANGED, NOTES);
    const parsed = parseRun(serializeRun(manifest), CONTEXT);
    if (!parsed.ok) throw new Error(parsed.error);
    expect(engine.run(parsed.manifest.params)).toEqual(engine.run(manifest.params));
  });
});

describe('parseRun refuses a file it cannot fully restore', () => {
  const valid = () => JSON.parse(serializeRun(build(CHANGED, NOTES)));

  it('rejects non-JSON', () => {
    const r = parseRun('not json at all', CONTEXT);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/not valid JSON/);
  });

  it('rejects an unrecognised schema rather than guessing', () => {
    const r = parseRun(JSON.stringify({ ...valid(), schema: 'qcraft-run/99' }), CONTEXT);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/qcraft-run\/99/);
  });

  it('rejects a missing parameter, naming it as the sidebar names it', () => {
    const file = valid();
    delete file.params.debt_target;
    const r = parseRun(JSON.stringify(file), CONTEXT);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain(paramLabel('debt_target'));
  });

  it('rejects a parameter of the wrong type', () => {
    const file = valid();
    file.params.expenditure_rigidity = 'sticky';
    const r = parseRun(JSON.stringify(file), CONTEXT);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/must be a number/);
  });

  it('rejects a value outside the engine’s own enumeration', () => {
    const file = valid();
    file.params.interest_rate_mode = 'Constant nominal';
    const r = parseRun(JSON.stringify(file), CONTEXT);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/Nominal interest rate/);
  });

  it('rejects a NaN dressed up as a number', () => {
    const file = valid();
    file.params.debt_target = null;
    const r = parseRun(JSON.stringify(file), CONTEXT);
    expect(r.ok).toBe(false);
  });
});

describe('parseRun warns without refusing', () => {
  const valid = () => JSON.parse(serializeRun(build(CHANGED, NOTES)));

  it('flags a run exported by a different app version', () => {
    const file = valid();
    file.app.version = '0.1.0';
    const r = parseRun(JSON.stringify(file), CONTEXT);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.warnings.join(' ')).toMatch(/0\.1\.0/);
  });

  it('flags a run produced on a different data vintage', () => {
    const file = valid();
    file.dataVintage = 'weo-2026-04';
    const r = parseRun(JSON.stringify(file), CONTEXT);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.warnings.join(' ')).toMatch(/weo-2026-04/);
  });

  it('flags engine defaults that have moved since the export', () => {
    const file = valid();
    file.defaults.productivity_end = 1.5;
    const r = parseRun(JSON.stringify(file), CONTEXT);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.warnings.join(' ')).toContain(paramLabel('productivity_end'));
  });

  it('drops a note for a parameter this version does not have, and says so', () => {
    const file = valid();
    file.notes.carbon_price = 'from a later version of the app';
    const r = parseRun(JSON.stringify(file), CONTEXT);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.warnings.join(' ')).toContain('carbon_price');
    expect(r.manifest.notes).toEqual(NOTES);
  });
});
