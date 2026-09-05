/**
 * Reading and writing the run JSON.
 *
 * The run JSON is the reproduction artifact: hand it back to the app and you
 * get the run the report describes. That only holds if the reader is strict, so
 * `parseRun` validates every parameter against the registry and the engine's own
 * enumerations, and REFUSES a file it cannot fully restore rather than
 * half-applying it. A partially restored run that still renders is the failure
 * mode worth engineering against: it looks like the report and is not.
 *
 * Strict about the payload, forgiving about the surroundings. A file exported by
 * a different app version, or against a different data vintage, still loads, but
 * every such difference comes back as a warning the UI shows. Those are facts a
 * ministry user should see, not reasons to refuse the file.
 */

import { DEFAULT_CHARTS, isPacketCharts } from '../charts/register';
import { PARAM_FIELDS, paramLabel, type ParamKey } from '../content/params';
import { DEFAULT_MODE, MODES, isModeId, modeForVintage } from '../content/modes';
import {
  DEMOGRAPHY_VARIANTS,
  FISCAL_RULE_CHOICES,
  INTEREST_RATE_MODES,
  type EngineParams,
} from '../engine/types';
import {
  cleanAnnotations,
  cleanNotes,
  RUN_SCHEMA,
  type RationaleNotes,
  type RunAnnotations,
  type RunManifest,
} from './manifest';
import { APP_VERSION } from './version';

export function serializeRun(manifest: RunManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export type ParseRunResult =
  | { ok: true; manifest: RunManifest; warnings: string[] }
  | { ok: false; error: string };

/** Allowed string values, keyed by parameter. Anything else is a hard refusal. */
const ENUMS: Partial<Record<ParamKey, readonly string[]>> = {
  demography_variant: DEMOGRAPHY_VARIANTS,
  interest_rate_mode: INTEREST_RATE_MODES,
  fiscal_rule: FISCAL_RULE_CHOICES,
};

/**
 * Parameters added after qcraft-run/1 files started circulating, with the app
 * version that added them. A file without one of these is an older export, not
 * a broken one: it restores at the Explorer default with a warning naming the
 * parameter, so the reader knows one input was filled in rather than recorded.
 */
const ADDED_IN: Partial<Record<ParamKey, string>> = {
  long_run_interest_rate: '0.3.0',
  productivity_turning_point: '0.3.0',
};

/** Parameters whose value is a finite number rather than one of a fixed set. */
const NUMERIC: ParamKey[] = [
  'productivity_start',
  'productivity_end',
  'productivity_turning_point',
  'long_run_interest_rate',
  'inflation_start',
  'inflation_end',
  'debt_target',
  'expenditure_rigidity',
];

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Validate a `params` object key by key. Returns the parameters or the first
 * problem, named in terms the user recognises from the sidebar.
 */
function readParams(
  raw: unknown,
  fill?: { defaults: EngineParams; filled: ParamKey[] },
): { params: EngineParams } | { error: string } {
  if (!isRecord(raw)) return { error: 'the file has no "params" object' };

  const out = {} as Record<ParamKey, unknown>;

  for (const { key } of PARAM_FIELDS) {
    let value = raw[key];
    if (value === undefined && fill && key in ADDED_IN) {
      // A parameter this app added after the file was written. Fill it with
      // the Explorer default and say so, rather than refuse a run that was
      // complete when it was exported.
      value = fill.defaults[key];
      fill.filled.push(key);
    }
    if (value === undefined) {
      return { error: `"${paramLabel(key)}" (${key}) is missing from the file` };
    }

    if (NUMERIC.includes(key)) {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return {
          error: `"${paramLabel(key)}" must be a number, but the file has ${JSON.stringify(value)}`,
        };
      }
    } else {
      if (typeof value !== 'string') {
        return {
          error: `"${paramLabel(key)}" must be text, but the file has ${JSON.stringify(value)}`,
        };
      }
      const allowed = ENUMS[key];
      if (allowed && !allowed.includes(value)) {
        return {
          error:
            `"${paramLabel(key)}" is ${JSON.stringify(value)}, which is not one of: ` +
            allowed.join(', '),
        };
      }
    }
    out[key] = value;
  }

  return { params: out as EngineParams };
}

/**
 * Read the notes. Unknown keys are dropped with a warning rather than refusing
 * the file: a note is annotation, and losing one should not cost the user the
 * run it annotates.
 */
function readNotes(raw: unknown, warnings: string[]): RationaleNotes {
  if (raw === undefined) return {};
  if (!isRecord(raw)) {
    warnings.push('The file’s "notes" section was not readable and was skipped.');
    return {};
  }

  const known = new Set<string>(PARAM_FIELDS.map((f) => f.key));
  const notes: RationaleNotes = {};
  const dropped: string[] = [];

  for (const [key, value] of Object.entries(raw)) {
    if (!known.has(key)) {
      dropped.push(key);
      continue;
    }
    if (typeof value !== 'string') {
      dropped.push(key);
      continue;
    }
    notes[key as ParamKey] = value;
  }

  if (dropped.length) {
    warnings.push(
      `${dropped.length} rationale note(s) did not match a parameter in this ` +
        `version of the app and were dropped: ${dropped.join(', ')}.`,
    );
  }
  return cleanNotes(notes);
}

/**
 * Read the run-level remarks.
 *
 * Absent is normal: every run file exported before this block predates it. A
 * present field of the wrong type is dropped with a warning rather than
 * refusing the file, on the same principle as a rationale note: an annotation is
 * annotation, and losing one should not cost the user the run it annotates.
 */
function readAnnotations(raw: unknown, warnings: string[]): RunAnnotations {
  if (raw === undefined) return {};
  if (!isRecord(raw)) {
    warnings.push('The file\u2019s "annotations" section was not readable and was skipped.');
    return {};
  }
  const out: RunAnnotations = {};
  for (const key of ['label', 'note'] as const) {
    const value = raw[key];
    if (value === undefined) continue;
    if (typeof value !== 'string') {
      warnings.push(`The run ${key} in this file was not text and was skipped.`);
      continue;
    }
    out[key] = value;
  }
  return cleanAnnotations(out);
}

/**
 * Parse a run JSON.
 *
 * `currentDefaults` and `currentVintage` are what the app is running now; they
 * are used only to raise warnings, never to alter what is restored. The restored
 * run is whatever the file says, and identity warnings distinguish restoration of settings from replay.
 */
export function parseRun(
  text: string,
  context: { currentDefaults: EngineParams; currentVintage: string },
): ParseRunResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    return {
      ok: false,
      error: `That file is not valid JSON (${(err as Error).message}).`,
    };
  }

  if (!isRecord(raw)) {
    return { ok: false, error: 'That file does not contain a Q-CRAFT run object.' };
  }
  if (raw.schema !== RUN_SCHEMA) {
    return {
      ok: false,
      error:
        `Expected a "${RUN_SCHEMA}" file but found ` +
        `${raw.schema === undefined ? 'no schema field' : JSON.stringify(raw.schema)}. ` +
        'Load a run JSON exported by Q-CRAFT Explorer.',
    };
  }

  const filled: ParamKey[] = [];
  const parsed = readParams(raw.params, { defaults: context.currentDefaults, filled });
  if ('error' in parsed) {
    return { ok: false, error: `This run file is incomplete: ${parsed.error}.` };
  }

  const warnings: string[] = [];
  if (filled.length) {
    warnings.push(
      `This run predates ${filled.length === 1 ? 'a parameter' : 'parameters'} this ` +
        `version of the app added (${filled
          .map((key) => `${paramLabel(key)}, added in ${ADDED_IN[key]}`)
          .join('; ')}). ` +
        `${filled.length === 1 ? 'It was' : 'They were'} restored at the Explorer ` +
        'default, which is the value the exporting version used.',
    );
  }
  const notes = readNotes(raw.notes, warnings);
  const annotations = readAnnotations(raw.annotations, warnings);

  const app = isRecord(raw.app) ? raw.app : {};
  if (typeof app.version === 'string' && app.version !== APP_VERSION) {
    warnings.push(
      `This run was exported by Q-CRAFT Explorer ${app.version}; you are ` +
        `running ${APP_VERSION}. The parameters were restored as recorded.`,
    );
  }

  // Defaults drift is worth naming: a parameter the file records as "changed
  // from 5.0" may be sitting on today's default, so the annex it was exported
  // with and the annex this app would produce disagree about what changed.
  const fileDefaults = readParams(raw.defaults, { defaults: context.currentDefaults, filled: [] });
  if ('params' in fileDefaults) {
    const drifted = PARAM_FIELDS.filter(
      ({ key }) => fileDefaults.params[key] !== context.currentDefaults[key],
    ).map(({ key }) => paramLabel(key));
    if (drifted.length) {
      warnings.push(
        `The Explorer defaults have changed since this run was exported ` +
          `(${drifted.join(', ')}). Which parameters count as "changed" may ` +
          'therefore differ from the exported report.',
      );
    }
  }

  /**
   * The mode the file was produced in.
   *
   * Files exported before modes existed carry only `dataVintage`, so the vintage
   * is the fallback and it recovers the mode exactly. Anything else falls back
   * to the app default and says so: restoring parameters against an unknown
   * vintage silently is how a reader ends up citing numbers the report never
   * showed.
   */
  let mode = isModeId(raw.mode) ? raw.mode : null;
  if (!mode && typeof raw.dataVintage === 'string') {
    mode = modeForVintage(raw.dataVintage);
    if (mode) {
      warnings.push(
        `This run file predates the data mode switch. Its vintage ` +
          `(${raw.dataVintage}) is ${MODES[mode].label} mode, which is what was ` +
          'restored.',
      );
    }
  }
  if (!mode) {
    mode = DEFAULT_MODE;
    warnings.push(
      `This run file does not say which data mode produced it, and its vintage ` +
        'is not one this app serves. It was opened in ' +
        `${MODES[DEFAULT_MODE].label} mode, so the numbers on screen may not be ` +
        'the ones in the exported report.',
    );
  }

  const expectedRevision = MODES[mode].dataRevision;
  if (raw.dataVintage !== MODES[mode].vintage) {
    warnings.push(`The saved vintage ${String(raw.dataVintage ?? 'unknown')} differs from the ${MODES[mode].label} data this app serves (${MODES[mode].vintage}). Settings can be restored, but these are not the original results.`);
  }
  if (mode === 'current' && raw.dataRevision === undefined) {
    warnings.push('This earlier Current run does not record the full-horizon revision. Earlier April 2026 runs truncated WEO at 2029. Settings are restored on the refreshed full WEO window, so the results may change; this is not an exact replay.');
  } else if (raw.dataRevision !== undefined && raw.dataRevision !== expectedRevision) {
    warnings.push(`Saved input revision ${String(raw.dataRevision)} differs from ${expectedRevision}. The settings are restored on available data, not the original input revision.`);
  }
  let horizonPolicy: RunManifest['horizonPolicy'];
  if (raw.horizonPolicy !== undefined) {
    if (!validHorizon(raw.horizonPolicy)) return { ok: false, error: 'The run has malformed input/timing identity. No settings were applied.' };
    horizonPolicy = raw.horizonPolicy;
  }
  for (const key of ['dataRevision', 'calculationPolicy', 'inputSha256'] as const) {
    if (raw[key] !== undefined && typeof raw[key] !== 'string') return { ok: false, error: `The run has an invalid ${key}. No settings were applied.` };
  }
  if (typeof raw.inputSha256 === 'string' && !/^[a-f0-9]{64}$/i.test(raw.inputSha256)) return { ok: false, error: 'The run input SHA-256 is malformed.' };
  if (horizonPolicy && ((raw.dataRevision != null && horizonPolicy.dataRevision !== raw.dataRevision) ||
      (raw.calculationPolicy != null && horizonPolicy.id !== raw.calculationPolicy) ||
      (raw.inputSha256 != null && horizonPolicy.inputSha256 !== raw.inputSha256))) {
    return { ok: false, error: 'The run contains conflicting input/timing identity fields. No settings were applied.' };
  }

  const manifest: RunManifest = {
    schema: RUN_SCHEMA,
    app: {
      name: typeof app.name === 'string' ? app.name : 'Q-CRAFT Explorer',
      version: typeof app.version === 'string' ? app.version : 'unknown',
    },
    generatedAt: typeof raw.generatedAt === 'string' ? raw.generatedAt : '',
    country: {
      iso3c:
        isRecord(raw.country) && typeof raw.country.iso3c === 'string'
          ? raw.country.iso3c
          : parsed.params.iso3c,
      name:
        isRecord(raw.country) && typeof raw.country.name === 'string'
          ? raw.country.name
          : parsed.params.iso3c,
    },
    mode,
    dataVintage: typeof raw.dataVintage === 'string' ? raw.dataVintage : 'unknown',
    dataRevision: typeof raw.dataRevision === 'string' ? raw.dataRevision : undefined,
    calculationPolicy: typeof raw.calculationPolicy === 'string' ? raw.calculationPolicy : undefined,
    inputSha256: typeof raw.inputSha256 === 'string' ? raw.inputSha256 : undefined,
    horizonPolicy,
    engine:
      isRecord(raw.engine) &&
      (raw.engine.kind === 'engine' || raw.engine.kind === 'fixture')
        ? {
            kind: raw.engine.kind,
            source: typeof raw.engine.source === 'string' ? raw.engine.source : 'unknown',
            ignoredParams: Array.isArray(raw.engine.ignoredParams)
              ? (raw.engine.ignoredParams as RunManifest['engine']['ignoredParams'])
              : [],
          }
        : { kind: 'fixture', source: 'unknown', ignoredParams: [] },
    params: parsed.params,
    defaults: 'params' in fileDefaults ? fileDefaults.params : context.currentDefaults,
    notes,
    annotations,
    // Additive to qcraft-run/1. A file written before the register existed
    // restores completely and falls back to the default, which is what it was
    // drawn with.
    charts: isPacketCharts(raw.charts)
      ? { register: raw.charts.register, overrides: raw.charts.overrides ?? {} }
      : DEFAULT_CHARTS,
  };

  return { ok: true, manifest, warnings };
}

function validHorizon(raw: unknown): raw is NonNullable<RunManifest['horizonPolicy']> {
  if (!isRecord(raw)) return false;
  if (!['current-full-weo-v1', 'verified-workbook-v1'].includes(String(raw.id)) ||
      !['full', 'shorter', 'unsupported'].includes(String(raw.coverageStatus))) return false;
  if (typeof raw.dataRevision !== 'string' || typeof raw.sourceVintage !== 'string' ||
      typeof raw.inputSha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(raw.inputSha256)) return false;
  if (raw.coverageReason !== null && typeof raw.coverageReason !== 'string') return false;
  if (!Number.isInteger(raw.sourceWeoMaxYear)) return false;
  return ['weoMaxYear', 'projectionStartYear', 'climateStartYear', 'climateAnchorYear', 'wdiLastYear']
    .every(key => raw[key] === null || Number.isInteger(raw[key]));
}

/** Compare against the imported country's newly loaded result, not the previous screen. */
export function replayWarnings(saved: RunManifest, result: import('../engine/types').EngineResult): string[] {
  const warnings: string[] = [];
  const pairs = [
    ['input revision', saved.dataRevision, result.provenance.dataRevision],
    ['calculation policy', saved.calculationPolicy, result.provenance.calculationPolicy],
    ['input SHA-256', saved.inputSha256 ?? saved.horizonPolicy?.inputSha256, result.provenance.inputSha256],
  ];
  for (const [label, before, after] of pairs) {
    if (!before) warnings.push(`The saved run has no ${label}; exact replay cannot be verified.`);
    else if (before !== after) warnings.push(`The ${label} differs from the saved run. These are recalculated results on the available model and inputs.`);
  }
  if (saved.horizonPolicy && result.horizonPolicy) {
    for (const key of ['weoMaxYear', 'projectionStartYear', 'climateStartYear', 'climateAnchorYear'] as const) {
      if (saved.horizonPolicy[key] !== result.horizonPolicy[key]) warnings.push(`Timing changed: ${key} was ${saved.horizonPolicy[key]}, now ${result.horizonPolicy[key]}.`);
    }
  } else warnings.push('Complete timing identity is unavailable; do not treat this import as verified replay.');
  return warnings;
}
