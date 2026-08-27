/**
 * The export packet: one archive, or any piece of it on its own.
 *
 * ── What changed from run 2, and why ──────────────────────────────────────────
 * Run 2's packet was three text files downloaded 250 ms apart. The full packet
 * is five documents plus one PNG per chart, and the stagger does not survive
 * that: browsers raise a "download multiple files" prompt around the fourth and
 * quietly drop some of the tail. A user in a training room would end up with
 * most of a packet and no way to tell which part was missing.
 *
 * So the primary artifact is now a single .zip, and every piece stays
 * individually downloadable underneath it. Run 2's comment argued against an
 * archive on the grounds that it needs a dependency and hides the contents
 * behind a step. The first half stopped being true (`zip.ts` is the platform's
 * own DEFLATE plus the archive format) and the second is answered by keeping
 * both routes rather than choosing.
 *
 * ── Text and bytes ────────────────────────────────────────────────────────────
 * Three of the artifacts are text and three are binary, so `build()` returns a
 * payload that says which it is, and it is async because the workbook needs a
 * lazily-imported library and a PNG needs a canvas. Building is still separated
 * from downloading: everything here runs under vitest with no DOM except the
 * chart images, which say so in `needsBrowser` and are simply absent from a
 * packet built without a rasterizer.
 */

import type { EngineResult } from '../engine/types';
import { modeLine, runFileStem, type RunManifest } from '../run/manifest';
import { serializeRun } from '../run/runFile';
import { renderChartPackHtml } from './chartPack';
import { renderChartSvg } from './chartSvg';
import { packetFigures, type PacketFigure } from './figures';
import { renderReportHtml } from './reportHtml';
import { buildAllScenariosCsv } from './resultsCsv';
import { buildReadme } from './readme';
import { buildWorkbookSpec } from './workbookSpec';
import { toXlsx } from './workbookXlsx';
import { buildZip, type ZipEntry } from './zip';

export type ArtifactKind =
  | 'report'
  | 'workbook'
  | 'results'
  | 'run'
  | 'chart-pack'
  | 'chart-image'
  | 'readme';

export type PacketPayload =
  | { encoding: 'text'; text: string }
  | { encoding: 'bytes'; bytes: Uint8Array };

export interface PacketArtifact {
  /** Unique within one packet. A chart image carries its figure id. */
  id: string;
  kind: ArtifactKind;
  filename: string;
  mimeType: string;
  /** Shown in the UI beside the download. */
  label: string;
  description: string;
  /** True when producing this needs a canvas, so a headless build skips it. */
  needsBrowser: boolean;
  build: () => Promise<PacketPayload>;
}

/**
 * Turns an SVG string into PNG bytes. Supplied by the browser layer; see
 * `svgToPng.ts`. Injected rather than imported so this module stays testable in
 * Node and so a caller can rasterize a different way without touching the packet.
 */
export type SvgRasterizer = (svg: string, options: { scale: number }) => Promise<Uint8Array>;

export interface PacketOptions {
  rasterize?: SvgRasterizer;
  /**
   * Figures beyond the built-in set. CC-4's takeaway charts join the packet
   * through here: a `PacketFigure` gets a page in the chart pack and a PNG of
   * its own, with no change to this file. See docs/export-contract.md.
   */
  extraFigures?: PacketFigure[];
  /** Device scale for the chart PNGs. 2 is the brief; 1 is enough for a test. */
  imageScale?: number;
}

const text = (value: string): PacketPayload => ({ encoding: 'text', text: value });
const bytes = (value: Uint8Array): PacketPayload => ({ encoding: 'bytes', bytes: value });

/** A figure id to a filename fragment: lowercase, hyphens, nothing surprising. */
const slug = (id: string) =>
  id
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'chart';

export function buildPacket(
  manifest: RunManifest,
  result: EngineResult,
  options: PacketOptions = {},
): PacketArtifact[] {
  const stem = runFileStem(manifest);
  const figures = packetFigures(result, options.extraFigures);
  const scale = options.imageScale ?? 2;

  const artifacts: PacketArtifact[] = [
    {
      id: 'readme',
      kind: 'readme',
      filename: 'READ-ME.txt',
      mimeType: 'text/plain;charset=utf-8',
      label: 'Read me first',
      description:
        'What is in the packet, what the numbers may be used to claim, and ' +
        'which file to open first.',
      needsBrowser: false,
      build: async () => text(buildReadme(manifest, result, figures)),
    },
    {
      id: 'report',
      kind: 'report',
      filename: `${stem}-report.html`,
      mimeType: 'text/html;charset=utf-8',
      label: 'Scenario report (HTML)',
      description:
        'Title block, baseline and scenario charts, key numbers, and the ' +
        'assumptions annex. Open it in a browser and use Print to get a PDF.',
      needsBrowser: false,
      build: async () => text(renderReportHtml({ manifest, result })),
    },
    {
      id: 'workbook',
      kind: 'workbook',
      filename: `${stem}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      label: 'Workbook (Excel)',
      description:
        'Six sheets: what the run assumed and why, the key numbers, debt and ' +
        'GDP by scenario ready to chart, and every series in full. Keep working ' +
        'in it.',
      needsBrowser: false,
      build: async () => bytes(await toXlsx(buildWorkbookSpec(manifest, result))),
    },
    {
      id: 'chart-pack',
      kind: 'chart-pack',
      filename: `${stem}-chart-pack.html`,
      mimeType: 'text/html;charset=utf-8',
      label: 'Chart pack (print to PDF)',
      description:
        'Every chart, one per page, with its caption and the run’s identity in ' +
        'the footer. Built to print cleanly from the browser’s own Print dialog.',
      needsBrowser: false,
      build: async () => text(renderChartPackHtml({ manifest, result, figures })),
    },
    {
      id: 'results',
      kind: 'results',
      filename: `${stem}-results.csv`,
      mimeType: 'text/csv;charset=utf-8',
      label: 'Results (CSV)',
      description:
        'Every scenario, every year, every fiscal series, with the run ' +
        'manifest appended below the data.',
      needsBrowser: false,
      build: async () => text(buildAllScenariosCsv(result, manifest)),
    },
    {
      id: 'run',
      kind: 'run',
      filename: `${stem}-run.json`,
      mimeType: 'application/json;charset=utf-8',
      label: 'Run file (JSON)',
      description:
        'The run itself. Import it here to restore these parameters, rationale ' +
        'notes and mode exactly.',
      needsBrowser: false,
      build: async () => text(serializeRun(manifest)),
    },
  ];

  const rasterize = options.rasterize;
  if (rasterize) {
    for (const figure of figures) {
      artifacts.push({
        id: `chart-image:${figure.id}`,
        kind: 'chart-image',
        filename: `${stem}-chart-${slug(figure.id)}.png`,
        mimeType: 'image/png',
        label: figure.title,
        description: 'The chart on its own, at twice screen resolution, for a slide or a memo.',
        needsBrowser: true,
        build: async () =>
          bytes(
            await rasterize(
              renderChartSvg({
                series: figure.series,
                height: figure.height,
                weoBoundaryYear: figure.weoBoundaryYear,
                zeroLine: figure.zeroLine,
                format: figure.format,
                ariaLabel: figure.title,
                caption: { title: figure.title, footer: packetFooter(manifest) },
              }),
              { scale },
            ),
          ),
      });
    }
  }

  return artifacts;
}

/**
 * The one line every standalone chart carries.
 *
 * A PNG is the most detachable thing in the packet: it lands in a slide with no
 * report, no README and no manifest around it. So the country, the mode, the
 * vintage and the standing disclaimer are drawn into the image itself, where
 * they cannot be separated from the chart they describe.
 */
export function packetFooter(manifest: RunManifest): string {
  return (
    `${manifest.country.name} · ${modeLine(manifest)} · data vintage ` +
    `${manifest.dataVintage} · ${manifest.app.name} ${manifest.app.version} · ` +
    'Not an official IMF product'
  );
}

/** Filename of the one-file packet. */
export const packetZipName = (manifest: RunManifest) => `${runFileStem(manifest)}-packet.zip`;

/**
 * Build every artifact and pack them into one archive.
 *
 * The archive's own timestamp is the run's `generatedAt` rather than the clock,
 * so the archive does not change just because it was built later or in a
 * different timezone. That makes the text artifacts reproducible byte for byte.
 *
 * It does NOT make the whole archive reproducible: exceljs does not serialize
 * deterministically, and two engines produce two different workbooks from the
 * same spec. Nothing here or in the manifest publishes a packet checksum, and
 * nothing should until that stops being true.
 */
export async function buildPacketZip(
  artifacts: PacketArtifact[],
  manifest: RunManifest,
): Promise<Uint8Array> {
  const entries: ZipEntry[] = [];
  const encoder = new TextEncoder();

  for (const artifact of artifacts) {
    const payload = await artifact.build();
    entries.push({
      // Charts get their own folder: a packet opened in a file manager should
      // read as a document set with the images gathered, not as twelve siblings.
      name: artifact.kind === 'chart-image' ? `charts/${artifact.filename}` : artifact.filename,
      bytes: payload.encoding === 'text' ? encoder.encode(payload.text) : payload.bytes,
    });
  }

  return buildZip(entries, new Date(manifest.generatedAt));
}

/** A payload as a Blob, ready for a download or an object URL. */
export function payloadBlob(artifact: PacketArtifact, payload: PacketPayload): Blob {
  return new Blob(
    [payload.encoding === 'text' ? payload.text : (payload.bytes as BlobPart)],
    { type: artifact.mimeType },
  );
}

/** Trigger one download. Browser-only. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking in the same tick can cancel the download in some browsers, so let
  // the navigation start first.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Build one artifact and download it. */
export async function downloadArtifact(artifact: PacketArtifact): Promise<void> {
  const payload = await artifact.build();
  downloadBlob(payloadBlob(artifact, payload), artifact.filename);
}

/** Build the whole packet and download it as one archive. */
export async function downloadPacketZip(
  artifacts: PacketArtifact[],
  manifest: RunManifest,
): Promise<string> {
  const zip = await buildPacketZip(artifacts, manifest);
  const filename = packetZipName(manifest);
  downloadBlob(new Blob([zip as BlobPart], { type: 'application/zip' }), filename);
  return filename;
}
