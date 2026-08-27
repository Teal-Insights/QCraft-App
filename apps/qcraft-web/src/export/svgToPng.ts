/**
 * A chart SVG to PNG bytes, in the browser, at twice screen resolution.
 *
 * ── What makes this harder than it looks ──────────────────────────────────────
 * An SVG loaded through `img.src` is an ISOLATED DOCUMENT. It does not inherit
 * the page's stylesheets and it does not fetch external subresources, so the
 * app's font stack never applies and a webfont URL inside the SVG is never even
 * requested. Both were measured rather than assumed: with no embedded face the
 * raster came out bit-identical to one asking for a family that exists nowhere,
 * and a local server logged zero requests for a font the SVG referenced by URL.
 *
 * So the face has to travel inside the SVG, and the SVG's own font-family has to
 * be replaced rather than extended. That replacement is also what keeps the
 * licence clean: the app names Söhne and Tiempos, which are per-user licensed
 * Klim faces whose files never touch this repository, and no Klim name reaches
 * the PNG path at all. What ships is a subset of Inter, SIL OFL 1.1, in
 * `src/assets/fonts/` with its licence beside it.
 *
 * ── The bug worth naming ──────────────────────────────────────────────────────
 * `btoa(svg)` is wrong here in a way that hides. It wants a binary string, and
 * a real chart SVG carries `Söhne` (U+00F6) in its font-family and `3°C`
 * (U+00B0) in its aria-label. Both are Latin-1, so `btoa` does not throw: it
 * emits Latin-1 bytes that are not valid UTF-8, and `img.decode()` then rejects
 * with EncodingError. It passes a test written with ASCII labels and fails on
 * every real export. Hence `utf8ToBase64`.
 *
 * ── Why a white rectangle ─────────────────────────────────────────────────────
 * `renderChartSvg` paints no background of its own, so an unpainted canvas
 * exports with alpha 0 and the chart takes on whatever a slide is standing on.
 * Measured: the top-left pixel is [0,0,0,0] without the fill.
 */

import interBold from '../assets/fonts/Inter-Bold.qcraft.woff2?inline';
import interRegular from '../assets/fonts/Inter-Regular.qcraft.woff2?inline';
import interSemiBold from '../assets/fonts/Inter-SemiBold.qcraft.woff2?inline';

/**
 * The raster-only family name. Deliberately not a real family name: it cannot
 * collide with anything installed on the viewing machine, so a fallback shows up
 * as a fallback instead of quietly rendering in a face that happens to be there.
 */
const FAMILY = 'QCraftChartSans';

/**
 * Three weights, not two. `chartSvg.ts` sets the WEO boundary label to weight
 * 700, and a browser with only 400 and 600 available renders SemiBold rather
 * than synthesising a bold: no warning, half a pixel of difference, and a label
 * that is not the weight the chart asked for.
 */
const FONT_CSS =
  `@font-face{font-family:${FAMILY};font-style:normal;font-weight:400;src:url(${interRegular}) format('woff2');}` +
  `@font-face{font-family:${FAMILY};font-style:normal;font-weight:600;src:url(${interSemiBold}) format('woff2');}` +
  `@font-face{font-family:${FAMILY};font-style:normal;font-weight:700;src:url(${interBold}) format('woff2');}`;

/** UTF-8 then base64, chunked so a long SVG does not blow the argument limit. */
function utf8ToBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

/**
 * Retype the SVG to the embedded family and inline the faces.
 *
 * The root `<svg>` carries the only `font-family` attribute `renderChartSvg`
 * emits, so replacing the first one is enough. The empty-chart branch emits
 * none at all, which is why there is a second path rather than a regex that
 * quietly matches nothing.
 */
export function withEmbeddedFonts(svg: string): string {
  const family = `font-family="${FAMILY}, sans-serif"`;
  const retyped = svg.includes('font-family=')
    ? svg.replace(/font-family="[^"]*"/, family)
    : svg.replace(/<svg\b/, `<svg ${family}`);
  return retyped.replace(/<svg\b[^>]*>/, (tag) => `${tag}<style>${FONT_CSS}</style>`);
}

export interface RasterOptions {
  /** Device scale. 2 is the brief; 1 is enough for a test. */
  scale?: number;
  /** Painted before the chart. Pass null for transparency, which slides dislike. */
  background?: string | null;
}

export interface RasterResult {
  bytes: Uint8Array;
  width: number;
  height: number;
}

/**
 * Rasterize one chart SVG.
 *
 * Scaling happens in `drawImage`'s destination size rather than by rewriting the
 * SVG's width and height. Measured bit-identical, and it is a genuine vector
 * rasterization at the target size rather than an upscale of a 1x bitmap, which
 * is visibly softer.
 */
export async function svgToPng(
  svg: string,
  { scale = 2, background = '#FFFFFF' }: RasterOptions = {},
): Promise<RasterResult> {
  const viewBox = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  if (!viewBox) throw new Error('svgToPng: the SVG has no viewBox, so it has no size');

  const width = Number(viewBox[1]);
  const height = Number(viewBox[2]);

  const image = new Image();
  image.src = `data:image/svg+xml;base64,${utf8ToBase64(withEmbeddedFonts(svg))}`;
  // decode() rejects on a malformed SVG, where onload would need a separate
  // error path. The SVG's own font loading is part of what it waits for, so
  // there is nothing to await on document.fonts: that governs the page, not
  // this isolated document.
  await image.decode();

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('svgToPng: this browser gave no 2d canvas context');

  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result ? resolve(result) : reject(new Error('svgToPng: the canvas produced no PNG')),
      'image/png',
    );
  });

  return {
    bytes: new Uint8Array(await blob.arrayBuffer()),
    width: canvas.width,
    height: canvas.height,
  };
}

/** The shape `buildPacket` wants: bytes only. */
export const rasterizeSvg = async (svg: string, options: { scale: number }): Promise<Uint8Array> =>
  (await svgToPng(svg, options)).bytes;
