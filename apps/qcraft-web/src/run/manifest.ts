/**
 * The run manifest: everything needed to say what a set of numbers is, and to
 * produce them again.
 *
 * Modelled on the LIC-DSF scenario tool's briefing-pack manifest
 * (licdsf-scenario-tool/ui/export.py, output/.../briefing/manifest.json), which
 * carries workbook identity, the inputs applied, the generation timestamp and
 * the claim status inside the pack itself. The lesson taken from it, stated in
 * that repo's own comment: an export "is the artifact most likely to be
 * forwarded to someone who never saw the app, so the claim status has to travel
 * inside it". Hence `engine` below: kind, source, vintage and the list of
 * parameters the backend could not honour ride along in every artifact.
 *
 * ── What is and is not in here ────────────────────────────────────────────────
 * The manifest is BOTH the provenance record and the reproduction payload: the
 * exported run JSON is exactly this object. So it holds only primary values.
 * The annex table a reader sees (label / value / default / state / rationale) is
 * DERIVED by `manifestRows()` at render time rather than stored, because two
 * copies of the same fact in one file can disagree, and the one a reader trusts
 * would be the wrong one.
 *
 * `defaults` IS stored even though the app knows its own defaults, because the
 * engine's defaults can change between releases. A report that says a parameter
 * was changed has to say what it was changed FROM at the time it was exported.
 */

import {
  PARAM_FIELDS,
  paramField,
  type ParamKey,
  type ParamValue,
} from '../content/params';
import { MODES, type ModeId } from '../content/modes';
import type { EngineParams, EngineResult, Provenance } from '../engine/types';
import { APP_NAME, APP_VERSION } from './version';

/**
 * Schema id for the run JSON. Bump the number if the shape changes
 * incompatibly; `parseRun` refuses anything it does not recognise rather than
 * half-restoring a run.
 */
export const RUN_SCHEMA = 'qcraft-run/1';

/**
 * One-line rationale notes, keyed by parameter.
 *
 * Notes are attached to a parameter, not to a change, so a note survives the
 * user putting a value back to its default. The annex reports the value state
 * beside the note, so a retained note on a default value is visible as exactly
 * that rather than being silently dropped.
 */
export type RationaleNotes = Partial<Record<ParamKey, string>>;

export interface RunManifest {
  schema: typeof RUN_SCHEMA;
  app: { name: string; version: string };
  /** ISO 8601, UTC. */
  generatedAt: string;
  country: { iso3c: string; name: string };
  /**
   * Which data mode produced this run.
   *
   * Stored beside `dataVintage`, not instead of it. The vintage id is what a
   * rebuild needs; the mode is what a reader recognises, and it is the thing
   * that has to be restored when the file comes back in, or the app would
   * reproduce the parameters against the wrong data.
   */
  mode: ModeId;
  /** Vintage id of the input data, from the adapter's provenance. */
  dataVintage: string;
  engine: Pick<Provenance, 'kind' | 'source' | 'ignoredParams'>;
  /** Exactly what the engine was asked to run. */
  params: EngineParams;
  /** What the defaults were when this run was exported. */
  defaults: EngineParams;
  notes: RationaleNotes;
}

/** A parameter as a reader meets it: named, formatted, and placed against its default. */
export interface ManifestRow {
  key: ParamKey;
  label: string;
  group: string;
  value: ParamValue;
  display: string;
  defaultValue: ParamValue;
  defaultDisplay: string;
  state: 'default' | 'changed';
  /** The user's one-line rationale, if they wrote one. */
  note?: string;
}

export interface BuildManifestInput {
  params: EngineParams;
  defaults: EngineParams;
  notes: RationaleNotes;
  result: EngineResult;
  /** Injected so tests are deterministic and the timestamp is one decision. */
  now: Date;
}

/** Drop empty and whitespace-only notes; an empty note is not a rationale. */
export function cleanNotes(notes: RationaleNotes): RationaleNotes {
  const out: RationaleNotes = {};
  for (const { key } of PARAM_FIELDS) {
    const note = notes[key]?.trim();
    if (note) out[key] = note;
  }
  return out;
}

/** Every parameter, in registry order, with the params object rebuilt cleanly. */
function orderedParams(params: EngineParams): EngineParams {
  // Rebuilding key-by-key from the registry gives the serialized JSON a stable
  // key order, so two identical runs produce byte-identical files and a diff
  // between two runs shows only what actually differs.
  const out = {} as EngineParams;
  for (const { key } of PARAM_FIELDS) {
    // Each value is read from the same object under the same key, so the types
    // always line up; TypeScript cannot see that through a union-typed key.
    (out as Record<ParamKey, ParamValue>)[key] = params[key];
  }
  return out;
}

export function buildRunManifest({
  params,
  defaults,
  notes,
  result,
  now,
}: BuildManifestInput): RunManifest {
  return {
    schema: RUN_SCHEMA,
    app: { name: APP_NAME, version: APP_VERSION },
    generatedAt: now.toISOString(),
    country: { iso3c: result.iso3c, name: result.countryName },
    mode: result.provenance.mode,
    dataVintage: result.provenance.dataVintage,
    engine: {
      kind: result.provenance.kind,
      source: result.provenance.source,
      ignoredParams: result.provenance.ignoredParams,
    },
    params: orderedParams(params),
    defaults: orderedParams(defaults),
    notes: cleanNotes(notes),
  };
}

/**
 * The annex view. Derived, never stored.
 *
 * Rows come out in registry order, which is sidebar order, so a reader can walk
 * the annex and the app side by side.
 */
export function manifestRows(manifest: RunManifest): ManifestRow[] {
  /**
   * The country parameter is an ISO3 code, which is the right thing to store
   * and the wrong thing to print in a report a minister reads. Resolve it to
   * the country's name only where the manifest actually knows that name, so a
   * default belonging to a different country is never relabelled with this
   * one's.
   */
  const display = (key: ParamKey, value: ParamValue) => {
    if (key === 'iso3c' && value === manifest.country.iso3c) {
      return `${manifest.country.name} (${manifest.country.iso3c})`;
    }
    return paramField(key).format(value);
  };

  return PARAM_FIELDS.map(({ key, label, group }) => {
    const value = manifest.params[key];
    const defaultValue = manifest.defaults[key];
    return {
      key,
      label,
      group,
      value,
      display: display(key, value),
      defaultValue,
      defaultDisplay: display(key, defaultValue),
      state: value === defaultValue ? ('default' as const) : ('changed' as const),
      note: manifest.notes[key],
    };
  });
}

/** Rows a reader needs to look at: anything changed, plus anything annotated. */
export const documentedRows = (rows: ManifestRow[]) =>
  rows.filter((r) => r.state === 'changed' || r.note);

/**
 * Filename stem shared by the three artifacts, so a packet stays together in a
 * download folder sorted by name. Colons are illegal in filenames on Windows,
 * so the timestamp is compacted to YYYYMMDD-HHMMSS in UTC.
 */
export function runFileStem(manifest: RunManifest): string {
  const stamp = manifest.generatedAt.replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const [date, time] = stamp.split('T');
  return `qcraft-${manifest.country.iso3c}-${date}-${time.replace('Z', '')}`;
}

/**
 * The mode, as one line, for anything that reports a run outside the app.
 *
 * One function so the report header, the CSV trailer and the chart captions
 * cannot describe the same run three different ways.
 */
export function modeLine(manifest: RunManifest): string {
  const mode = MODES[manifest.mode];
  return `${mode.label} mode: ${mode.vintageLabel}`;
}

/** The claim that goes with that mode. */
export const modeStatement = (manifest: RunManifest): string =>
  MODES[manifest.mode].statement;
