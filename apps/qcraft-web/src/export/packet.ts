/**
 * The export packet: three files, one click.
 *
 * Building the artifacts is separated from downloading them so the whole packet
 * can be produced and asserted on in a test with no browser. `buildPacket` is
 * pure; only `downloadArtifact` touches the DOM.
 *
 * Three files rather than one archive. A zip would need a new dependency and
 * would hide the contents behind an extra step, and each of these three is
 * independently useful: the report is what gets read and printed, the CSV is
 * what gets pasted into a spreadsheet, and the JSON is what comes back into the
 * app. They share a filename stem so they sort together in a downloads folder.
 */

import type { EngineResult } from '../engine/types';
import { runFileStem, type RunManifest } from '../run/manifest';
import { serializeRun } from '../run/runFile';
import { renderReportHtml } from './reportHtml';
import { buildAllScenariosCsv } from './resultsCsv';

export type ArtifactKind = 'report' | 'results' | 'run';

export interface PacketArtifact {
  kind: ArtifactKind;
  filename: string;
  mimeType: string;
  contents: string;
  /** Shown in the UI beside the download. */
  label: string;
  description: string;
}

export function buildPacket(
  manifest: RunManifest,
  result: EngineResult,
): PacketArtifact[] {
  const stem = runFileStem(manifest);

  return [
    {
      kind: 'report',
      filename: `${stem}-report.html`,
      mimeType: 'text/html;charset=utf-8',
      contents: renderReportHtml({ manifest, result }),
      label: 'Scenario report (HTML)',
      description:
        'Title block, baseline and scenario charts, key numbers, and the ' +
        'assumptions annex. Open it in a browser and use Print to get a PDF.',
    },
    {
      kind: 'results',
      filename: `${stem}-results.csv`,
      mimeType: 'text/csv;charset=utf-8',
      contents: buildAllScenariosCsv(result, manifest),
      label: 'Results (CSV)',
      description:
        'Every scenario, every year, every fiscal series, with the run ' +
        'manifest appended below the data.',
    },
    {
      kind: 'run',
      filename: `${stem}-run.json`,
      mimeType: 'application/json;charset=utf-8',
      contents: serializeRun(manifest),
      label: 'Run file (JSON)',
      description:
        'The run itself. Import it here to restore these parameters and ' +
        'rationale notes exactly.',
    },
  ];
}

/** Trigger one download. Browser-only. */
export function downloadArtifact(artifact: PacketArtifact): void {
  const blob = new Blob([artifact.contents], { type: artifact.mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = artifact.filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking in the same tick can cancel the download in some browsers, so let
  // the navigation start first.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Download the whole packet.
 *
 * Staggered: browsers rate-limit programmatic downloads and will silently drop
 * the second and third if they arrive in the same tick. 250 ms apart is enough
 * for Chrome and Firefox, and the user still experiences it as one click.
 */
export function downloadPacket(
  artifacts: PacketArtifact[],
  schedule: (fn: () => void, ms: number) => void = (fn, ms) =>
    void setTimeout(fn, ms),
): void {
  artifacts.forEach((artifact, i) => {
    if (i === 0) downloadArtifact(artifact);
    else schedule(() => downloadArtifact(artifact), i * 250);
  });
}
