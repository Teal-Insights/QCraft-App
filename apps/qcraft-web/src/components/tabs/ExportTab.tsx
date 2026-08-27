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
 *
 * The packet downloads as one zip. It is now five documents plus a PNG per
 * chart, and browsers rate-limit programmatic downloads: at that size Chrome
 * raises a "download multiple files" prompt and the tail goes missing, which in
 * a training room means most of a packet and no way to tell which part is
 * absent. Every piece stays individually downloadable underneath it, so the
 * archive is the default rather than the only route.
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
  type RunAnnotations,
} from '../../run/manifest';
import { parseRun } from '../../run/runFile';
import {
  buildPacket,
  downloadArtifact,
  downloadPacketZip,
  payloadBlob,
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
  onImport: (
    params: EngineParams,
    notes: RationaleNotes,
    mode: ModeId,
    annotations: RunAnnotations,
  ) => void;
  /** The run's own label and the analyst's note. */
  annotations: RunAnnotations;
  onAnnotationsChange: (annotations: RunAnnotations) => void;
  /** The last import's outcome, held above this component. See ImportState. */
  importState: ImportState;
  onImportState: (state: ImportState) => void;
}

/**
 * What the last import did.
 *
 * Held by App rather than here, because importing a run for a different country
 * or a different mode makes the app refetch, and while that is in flight the tab
 * panel renders a loading line instead of this component. Local state would be
 * destroyed by that unmount, which is exactly the case where the user most needs
 * the message: the confirmation would vanish, and so would every warning
 * `parseRun` raised about a version or vintage the file does not match.
 */
export type ImportState =
  | { kind: 'idle' }
  | { kind: 'error'; message: string }
  | { kind: 'loaded'; filename: string; warnings: string[]; changed: number };

/** Building a workbook or eight PNGs is not instant, so the button says so. */
type BusyState = { busy: false } | { busy: true; label: string };

/**
 * The rasterizer, loaded on first use.
 *
 * `svgToPng` carries three subset Inter faces inlined as data URIs, about 47 kB,
 * and a user who never exports an image should never download them. The
 * indirection also keeps `buildPacket` able to LIST the chart images without
 * loading anything, so the panel is complete before the first click.
 */
const rasterize = async (svg: string, options: { scale: number }) =>
  (await import('../../export/svgToPng')).rasterizeSvg(svg, options);

export function ExportTab({
  result,
  params,
  defaults,
  notes,
  annotations,
  onAnnotationsChange,
  importState,
  onImportState: setImportState,
  onImport,
}: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [lastExport, setLastExport] = useState<string | null>(null);
  const [busy, setBusy] = useState<BusyState>({ busy: false });
  const [failure, setFailure] = useState<string | null>(null);

  // Preview the annex with a stable timestamp so the table does not re-render on
  // a clock tick; the real export stamps its own time at the moment you click.
  const preview = useMemo(
    () =>
      buildRunManifest({
        params,
        defaults,
        notes,
        annotations,
        result,
        now: new Date(0),
      }),
    [params, defaults, notes, annotations, result],
  );

  /**
   * The packet as a list, for the panel below the button.
   *
   * Built off the stable preview manifest, so the list does not churn on a clock
   * tick, and with the rasterizer attached so the chart images are listed as
   * what they are rather than appearing only after a click.
   */
  const artifacts = useMemo(
    () => buildPacket(preview, result, { rasterize }),
    [preview, result],
  );

  const rows = manifestRows(preview);
  const documented = documentedRows(rows);
  const changedRows = rows.filter((r) => r.state === 'changed');
  const undocumented = changedRows.filter((r) => !r.note);

  /** Build the packet fresh, so `generatedAt` is when the user clicked. */
  const makePacket = (): PacketArtifact[] =>
    buildPacket(
      buildRunManifest({
        params,
        defaults,
        notes,
        annotations,
        result,
        now: new Date(),
      }),
      result,
      // The rasterizer is what makes the chart PNGs possible, and it only
      // exists in a browser. Passing it here rather than importing it inside
      // the packet keeps `buildPacket` runnable under vitest.
      { rasterize },
    );

  /**
   * Run one export, with the button reporting what it is doing.
   *
   * Every path funnels through here so a failure surfaces as a message rather
   * than an unhandled rejection in a console nobody in a training room is
   * looking at.
   */
  const run = async (label: string, work: () => Promise<string>) => {
    setBusy({ busy: true, label });
    setFailure(null);
    try {
      setLastExport(await work());
    } catch (error) {
      setFailure((error as Error).message);
    } finally {
      setBusy({ busy: false });
    }
  };

  const exportAll = () =>
    run('Building the packet', async () => {
      const manifest = buildRunManifest({
        params,
        defaults,
        notes,
        annotations,
        result,
        now: new Date(),
      });
      return downloadPacketZip(buildPacket(manifest, result, { rasterize }), manifest);
    });

  const exportOne = (id: string) =>
    run('Building the file', async () => {
      const artifact = makePacket().find((a) => a.id === id);
      if (!artifact) throw new Error('That file is not part of this packet.');
      await downloadArtifact(artifact);
      return artifact.filename;
    });

  /** Open a document artifact in a new tab, which is how you get to Print. */
  const openInTab = (id: string) =>
    run('Opening', async () => {
      const artifact = makePacket().find((a) => a.id === id);
      if (!artifact) throw new Error('That document is not part of this packet.');
      const url = URL.createObjectURL(payloadBlob(artifact, await artifact.build()));
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      return artifact.filename;
    });

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

    onImport(
      parsed.manifest.params,
      parsed.manifest.notes,
      parsed.manifest.mode,
      parsed.manifest.annotations,
    );
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

      <h3 className="section-title">About this run</h3>
      <p className="section-note">
        Two optional lines that travel into every file. The label names the run
        wherever it is listed; the note is what you would say handing it to a
        colleague. Neither is filled in for you, and an artifact says nothing
        rather than pretending you wrote something.
      </p>
      <div className="runmeta">
        <label className="runmeta__field" htmlFor="run-label">
          <span className="runmeta__label">Label for this run</span>
          <input
            id="run-label"
            type="text"
            maxLength={120}
            value={annotations.label ?? ''}
            placeholder="Tighter ceiling, FY2025/26 planning"
            onChange={(e) =>
              onAnnotationsChange({ ...annotations, label: e.target.value })
            }
          />
        </label>
        <label className="runmeta__field" htmlFor="run-note">
          <span className="runmeta__label">The analyst’s note</span>
          <textarea
            id="run-note"
            rows={4}
            value={annotations.note ?? ''}
            placeholder="What question this run was asked, and what you would tell a reader about the answer."
            onChange={(e) =>
              onAnnotationsChange({ ...annotations, note: e.target.value })
            }
          />
        </label>
      </div>

      <h3 className="section-title">Export</h3>
      <p className="section-note">
        Every file in this packet is stamped{' '}
        <strong>{MODES[preview.mode].label} mode</strong> (
        {MODES[preview.mode].vintageLabel}), and carries what that mode claims.
      </p>
      <div className="export-actions">
        <button
          type="button"
          className="button button--primary"
          onClick={() => void exportAll()}
          disabled={busy.busy}
        >
          {busy.busy ? `${busy.label}…` : `Download the packet (${artifacts.length} files, one zip)`}
        </button>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => void openInTab('report')}
          disabled={busy.busy}
        >
          Preview the report
        </button>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => void openInTab('chart-pack')}
          disabled={busy.busy}
        >
          Preview the chart pack
        </button>
      </div>
      <p className="section-note">
        One archive, so nothing goes missing on the way down. Everything is
        produced in your browser. Nothing is uploaded. The report and the chart
        pack open in any browser; use Print to save either as a PDF.
      </p>

      {failure && (
        <p className="callout callout--error" role="alert">
          <strong>That export did not finish.</strong> {failure}
        </p>
      )}

      <ul className="artifact-list">
        {artifacts.map((a) => (
          <li key={a.id} className="artifact">
            <div>
              <p className="artifact__label">{a.label}</p>
              <p className="artifact__desc">{a.description}</p>
            </div>
            <button
              type="button"
              className="button button--small"
              onClick={() => void exportOne(a.id)}
              disabled={busy.busy}
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
