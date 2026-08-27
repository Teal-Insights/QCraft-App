/**
 * Export tab: the packet, and the way back in.
 *
 * This is the capstone surface for the Uganda MoF training. A trainee sets
 * parameters, records why, exports the packet, and can hand the run file to a
 * colleague who loads it and sees the identical projection. The tab is built so
 * that whole loop is visible on one screen rather than spread across menus.
 *
 * Two deliberate choices:
 *
 *  - The assumptions table is shown BEFORE the export button, not after. It is
 *    what the annex will say, and the moment to notice a missing rationale is
 *    before the file is sent, not after.
 *  - Import reports its warnings rather than swallowing them. A run exported by
 *    a different app version, or against a different data vintage, still loads,
 *    because refusing it would help nobody; but the user is told, because
 *    "the numbers moved and I do not know why" is the outcome to prevent.
 */

import { useMemo, useRef, useState } from 'react';

import type { ParamKey } from '../../content/params';
import { MODES, type ModeId } from '../../content/modes';
import type { EngineParams, EngineResult } from '../../engine/adapter';
import {
  buildRunManifest,
  documentedRows,
  manifestRows,
  type RationaleNotes,
} from '../../run/manifest';
import { parseRun } from '../../run/runFile';
import {
  buildPacket,
  downloadArtifact,
  downloadPacket,
  type PacketArtifact,
} from '../../export/packet';

interface Props {
  result: EngineResult;
  params: EngineParams;
  defaults: EngineParams;
  notes: RationaleNotes;
  /**
   * Restore a run. The mode travels with the parameters because a run is a
   * country, a parameter set AND a vintage; restoring two of the three would
   * reproduce numbers the imported report never showed.
   */
  onImport: (params: EngineParams, notes: RationaleNotes, mode: ModeId) => void;
}

type ImportState =
  | { kind: 'idle' }
  | { kind: 'error'; message: string }
  | { kind: 'loaded'; filename: string; warnings: string[]; changed: number };

export function ExportTab({ result, params, defaults, notes, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [importState, setImportState] = useState<ImportState>({ kind: 'idle' });
  const [lastExport, setLastExport] = useState<string | null>(null);

  // Preview the annex with a stable timestamp so the table does not re-render on
  // a clock tick; the real export stamps its own time at the moment you click.
  const preview = useMemo(
    () =>
      buildRunManifest({
        params,
        defaults,
        notes,
        result,
        now: new Date(0),
      }),
    [params, defaults, notes, result],
  );

  const rows = manifestRows(preview);
  const documented = documentedRows(rows);
  const changedRows = rows.filter((r) => r.state === 'changed');
  const undocumented = changedRows.filter((r) => !r.note);

  /** Build the packet fresh, so `generatedAt` is when the user clicked. */
  const makePacket = (): PacketArtifact[] =>
    buildPacket(
      buildRunManifest({ params, defaults, notes, result, now: new Date() }),
      result,
    );

  const exportAll = () => {
    const packet = makePacket();
    downloadPacket(packet);
    setLastExport(packet.map((a) => a.filename).join(', '));
  };

  const exportOne = (kind: PacketArtifact['kind']) => {
    const artifact = makePacket().find((a) => a.kind === kind);
    if (!artifact) return;
    downloadArtifact(artifact);
    setLastExport(artifact.filename);
  };

  const openReport = () => {
    const report = makePacket().find((a) => a.kind === 'report');
    if (!report) return;
    const url = URL.createObjectURL(
      new Blob([report.contents], { type: report.mimeType }),
    );
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const handleFile = async (file: File) => {
    const parsed = parseRun(await file.text(), {
      currentDefaults: defaults,
      currentVintage: result.provenance.dataVintage,
    });

    if (!parsed.ok) {
      setImportState({ kind: 'error', message: parsed.error });
      return;
    }

    const changed = (Object.keys(defaults) as ParamKey[]).filter(
      (k) => parsed.manifest.params[k] !== params[k],
    ).length;

    onImport(parsed.manifest.params, parsed.manifest.notes, parsed.manifest.mode);
    setImportState({
      kind: 'loaded',
      filename: file.name,
      warnings: parsed.warnings,
      changed,
    });
  };

  return (
    <div className="tab">
      <div className="tab__head">
        <h2 className="tab__title">Export packet</h2>
      </div>
      <p className="tab__lede">
        Three files that document this run: a print-ready report, the results as
        CSV, and a run file that brings the whole configuration back. Everything
        is produced in your browser. Nothing is uploaded.
      </p>

      <h3 className="section-title">Assumptions this run will report</h3>
      <p className="section-note">
        {documented.length === 0
          ? 'Every parameter is at its engine default. The annex will list them all and say so.'
          : `${documented.length} of ${rows.length} parameters ${
              documented.length === 1 ? 'is' : 'are'
            } changed or annotated. The annex lists all ${rows.length} either way, so a reader sees what was left alone as well as what was moved.`}
      </p>

      {undocumented.length > 0 && (
        <p className="callout callout--warn">
          {undocumented.length === 1
            ? 'One changed parameter has no rationale: '
            : `${undocumented.length} changed parameters have no rationale: `}
          <strong>{undocumented.map((r) => r.label).join(', ')}</strong>. Add a
          line in the sidebar beside the parameter, or export as is and the annex
          will record that no rationale was given.
        </p>
      )}

      <div className="table-wrap">
        <table className="data-table data-table--annex">
          <caption className="visually-hidden">
            Parameters, values, engine defaults and recorded rationale
          </caption>
          <thead>
            <tr>
              <th scope="col">Parameter</th>
              <th scope="col">Value</th>
              <th scope="col">Engine default</th>
              <th scope="col">State</th>
              <th scope="col">Rationale</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className={r.state === 'changed' ? 'is-changed' : ''}>
                <th scope="row">{r.label}</th>
                <td>{r.display}</td>
                <td>{r.defaultDisplay}</td>
                <td>
                  <span className={`tag${r.state === 'changed' ? ' tag--changed' : ''}`}>
                    {r.state === 'changed' ? 'Changed' : 'Default'}
                  </span>
                </td>
                <td className="cell--note">{r.note ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="section-title">Export</h3>
      <p className="section-note">
        Every file in this packet is stamped{' '}
        <strong>{MODES[preview.mode].label} mode</strong> (
        {MODES[preview.mode].vintageLabel}), and carries what that mode claims.
      </p>
      <div className="export-actions">
        <button type="button" className="button button--primary" onClick={exportAll}>
          Export packet (3 files)
        </button>
        <button type="button" className="button button--ghost" onClick={openReport}>
          Preview the report
        </button>
      </div>
      <p className="section-note">
        Your browser may ask permission to download more than one file. The
        report opens in any browser; use its Print command to save a PDF.
      </p>

      <ul className="artifact-list">
        {buildPacket(preview, result).map((a) => (
          <li key={a.kind} className="artifact">
            <div>
              <p className="artifact__label">{a.label}</p>
              <p className="artifact__desc">{a.description}</p>
            </div>
            <button
              type="button"
              className="button button--small"
              onClick={() => exportOne(a.kind)}
            >
              Download
            </button>
          </li>
        ))}
      </ul>

      {lastExport && (
        <p className="section-note" role="status">
          Exported: {lastExport}
        </p>
      )}

      <h3 className="section-title">Import a run</h3>
      <p className="section-note">
        Load a run file exported here, from this or any other machine. Every
        parameter and every rationale note is restored exactly as recorded.
      </p>
      <div className="export-actions">
        <input
          ref={fileRef}
          id="run-import"
          className="visually-hidden"
          type="file"
          accept="application/json,.json"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            // Clear the input so re-importing the same file fires a change event.
            e.target.value = '';
          }}
        />
        <button
          type="button"
          className="button"
          onClick={() => fileRef.current?.click()}
        >
          Choose a run file
        </button>
      </div>

      {importState.kind === 'error' && (
        <p className="callout callout--error" role="alert">
          <strong>That run file was not loaded.</strong> {importState.message}
        </p>
      )}

      {importState.kind === 'loaded' && (
        <div className="callout callout--ok" role="status">
          <p>
            <strong>Loaded {importState.filename}.</strong>{' '}
            {importState.changed === 0
              ? 'The run it describes is the one already on screen.'
              : `${importState.changed} parameter${
                  importState.changed === 1 ? '' : 's'
                } changed to match it.`}
          </p>
          {importState.warnings.length > 0 && (
            <ul>
              {importState.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
