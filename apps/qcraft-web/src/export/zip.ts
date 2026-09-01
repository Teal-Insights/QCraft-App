/**
 * A ZIP writer, in about a hundred lines and with no dependency.
 *
 * ── Why the packet needs one now ──────────────────────────────────────────────
 * Run 2's packet was three files and downloaded them 250 ms apart, because
 * browsers rate-limit programmatic downloads. The full packet is five documents
 * plus one PNG per chart, and at that size the stagger stops being a trick that
 * works: Chrome raises its "download multiple files" prompt, Firefox drops the
 * tail, and a user in a training room ends up with four of eight files and no
 * way to tell which four.
 *
 * ── Why not a library ─────────────────────────────────────────────────────────
 * `CompressionStream('deflate-raw')` is native in every browser this app
 * targets and in Node 18 and later, which leaves the archive format itself:
 * local headers, a central directory, an end record, and CRC-32. That is this
 * file. The alternative was a dependency in the critical path of the artifact a
 * ministry keeps, to do something the platform already does.
 *
 * ── What it deliberately does not do ──────────────────────────────────────────
 * No ZIP64, no encryption, no directory entries, no timestamps beyond the one
 * the caller passes. Entries are under 4 GB and there are fewer than twenty of
 * them, so the 32-bit fields in the classic format are not close to their
 * limits. If either assumption ever changes, this file should be replaced rather
 * than extended.
 */

/** CRC-32, table-driven. The table is built once at module load. */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipEntry {
  /** Path inside the archive. Forward slashes, no leading slash. */
  name: string;
  bytes: Uint8Array;
}

/**
 * DEFLATE one buffer.
 *
 * Falls back to storing the bytes uncompressed where `CompressionStream` is
 * missing. A slightly larger archive that opens everywhere beats a smaller one
 * that throws, and the ZIP format carries the method per entry, so a mixed
 * archive is still a valid archive.
 */
async function deflate(bytes: Uint8Array): Promise<{ method: 0 | 8; data: Uint8Array }> {
  const Compression = (globalThis as { CompressionStream?: typeof CompressionStream })
    .CompressionStream;
  if (!Compression) return { method: 0, data: bytes };

  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new Compression('deflate-raw'));
  const deflated = new Uint8Array(await new Response(stream).arrayBuffer());

  // Incompressible input can come back larger than it went in. Storing it is
  // both smaller and faster to read.
  return deflated.length < bytes.length ? { method: 8, data: deflated } : { method: 0, data: bytes };
}

/**
 * MS-DOS date and time, which is what the classic header carries.
 *
 * Read in UTC, not local time. The DOS fields have no timezone, so a local-time
 * reading makes the same packet produce a different archive in Kampala and in
 * Washington, and the determinism the caller is promised quietly stops holding.
 * UTC costs a reader nothing: the run's own ISO timestamp is inside the packet,
 * in the manifest, where a date is meant to be read.
 */
function dosStamp(date: Date): { time: number; date: number } {
  // The DOS epoch starts in 1980 and the field has no room for anything earlier.
  const year = Math.max(date.getUTCFullYear(), 1980);
  return {
    time:
      (date.getUTCHours() << 11) |
      (date.getUTCMinutes() << 5) |
      Math.floor(date.getUTCSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate(),
  };
}

/** Little-endian writer over a growing byte list. */
class ByteSink {
  private readonly chunks: Uint8Array[] = [];
  length = 0;

  push(bytes: Uint8Array): void {
    this.chunks.push(bytes);
    this.length += bytes.length;
  }

  u16(value: number): void {
    this.push(new Uint8Array([value & 0xff, (value >>> 8) & 0xff]));
  }

  u32(value: number): void {
    this.push(
      new Uint8Array([
        value & 0xff,
        (value >>> 8) & 0xff,
        (value >>> 16) & 0xff,
        (value >>> 24) & 0xff,
      ]),
    );
  }

  concat(): Uint8Array {
    const out = new Uint8Array(this.length);
    let offset = 0;
    for (const chunk of this.chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }
}

const utf8 = (text: string) => new TextEncoder().encode(text);

/**
 * Build a ZIP archive.
 *
 * `modified` is injected rather than read from the clock so an archive of the
 * same inputs is byte-identical run to run, which is what makes a packet
 * diffable and a test assertable. The packet passes the run's own timestamp.
 */
export async function buildZip(entries: ZipEntry[], modified: Date): Promise<Uint8Array> {
  const stamp = dosStamp(modified);
  const body = new ByteSink();
  const central = new ByteSink();

  for (const entry of entries) {
    const name = utf8(entry.name);
    const crc = crc32(entry.bytes);
    const { method, data } = await deflate(entry.bytes);
    const offset = body.length;

    // Local file header.
    body.u32(0x04034b50);
    body.u16(20); // version needed
    body.u16(0x0800); // flags: names and comments are UTF-8
    body.u16(method);
    body.u16(stamp.time);
    body.u16(stamp.date);
    body.u32(crc);
    body.u32(data.length);
    body.u32(entry.bytes.length);
    body.u16(name.length);
    body.u16(0); // extra field length
    body.push(name);
    body.push(data);

    // Central directory record for the same entry.
    central.u32(0x02014b50);
    central.u16(20); // version made by
    central.u16(20); // version needed
    central.u16(0x0800);
    central.u16(method);
    central.u16(stamp.time);
    central.u16(stamp.date);
    central.u32(crc);
    central.u32(data.length);
    central.u32(entry.bytes.length);
    central.u16(name.length);
    central.u16(0); // extra
    central.u16(0); // comment
    central.u16(0); // disk number
    central.u16(0); // internal attributes
    central.u32(0); // external attributes
    central.u32(offset);
    central.push(name);
  }

  const out = new ByteSink();
  out.push(body.concat());
  const centralBytes = central.concat();
  out.push(centralBytes);

  // End of central directory.
  out.u32(0x06054b50);
  out.u16(0); // this disk
  out.u16(0); // disk with the central directory
  out.u16(entries.length);
  out.u16(entries.length);
  out.u32(centralBytes.length);
  out.u32(body.length);
  out.u16(0); // comment length

  return out.concat();
}
