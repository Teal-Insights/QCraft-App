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

import { PARAM_FIELDS, paramLabel, type ParamKey } from '../content/params';
import { DEFAULT_MODE, MODES, isModeId, modeForVintage } from '../content/modes';
import {
  DEMOGRAPHY_VARIANTS,
  FISCAL_RULE_CHOICES,
  INTEREST_RATE_MODES,
  type EngineParams,
} from '../engine/types';
import {
  cleanNotes,
  RUN_SCHEMA,
  type RationaleNotes,
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

/** Parameters whose value is a finite number rather than one of a fixed set. */
const NUMERIC: ParamKey[] = [
  'productivity_start',
  'productivity_end',
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
function readParams(raw: unknown): { params: EngineParams } | { error: string } {
  if (!isRecord(raw)) return { error: 'the file has no "params" object' };

  const out = {} as Record<ParamKey, unknown>;

  for (const { key } of PARAM_FIELDS) {
    const value = raw[key];
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
 * Parse a run JSON.
 *
 * `currentDefaults` and `currentVintage` are what the app is running now; they
 * are used only to raise warnings, never to alter what is restored. The restored
 * run is whatever the file says, so re-importing an export always reproduces
 * that export.
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

  const parsed = readParams(raw.params);
  if ('error' in parsed) {
    return { ok: false, error: `This run file is incomplete: ${parsed.error}.` };
  }

  const warnings: string[] = [];
  const notes = readNotes(raw.notes, warnings);

  const app = isRecord(raw.app) ? raw.app : {};
  if (typeof app.version === 'string' && app.version !== APP_VERSION) {
    warnings.push(
      `This run was exported by Q-CRAFT Explorer ${app.version}; you are ` +
        `running ${APP_VERSION}. The parameters were restored as recorded.`,
    );
  }

  if (typeof raw.dataVintage === 'string' && raw.dataVintage !== context.currentVintage) {
    warnings.push(
      `This run was produced on data vintage ${raw.dataVintage}; this app is ` +
        `serving ${context.currentVintage}. The numbers you see now may differ ` +
        'from the ones in the exported report.',
    );
  }

  // Defaults drift is worth naming: a parameter the file records as "changed
  // from 5.0" may be sitting on today's default, so the annex it was exported
  // with and the annex this app would produce disagree about what changed.
  const fileDefaults = readParams(raw.defaults);
  if ('params' in fileDefaults) {
    const drifted = PARAM_FIELDS.filter(
      ({ key }) => fileDefaults.params[key] !== context.currentDefaults[key],
    ).map(({ key }) => paramLabel(key));
    if (drifted.length) {
      warnings.push(
        `The engine defaults have changed since this run was exported ` +
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
  };

  return { ok: true, manifest, warnings };
}
