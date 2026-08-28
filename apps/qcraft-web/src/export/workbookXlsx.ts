/**
 * The workbook spec, serialized to a real .xlsx.
 *
 * ── Thin on purpose ───────────────────────────────────────────────────────────
 * Everything worth asserting about the workbook is in `workbookSpec.ts`, which
 * is a plain object and runs in vitest with no library at all. This file is the
 * adapter: it walks the spec and calls exceljs. Keeping the split means a change
 * to what the workbook says is tested, and a change to how it is encoded is
 * reviewed, and neither pretends to be the other.
 *
 * ── Why exceljs, and why it is loaded late ────────────────────────────────────
 * SheetJS's registry build is stuck at 0.18.5, which carries a high-severity
 * prototype-pollution advisory with no upgrade path from npm, and it silently
 * drops bold header rows, cell fills and frozen panes because those are
 * paid-tier features. Measured, not assumed: a bold header set through the
 * community build comes back `bold: False`. Three of the things this workbook
 * needs, gone without an error.
 *
 * A hand-rolled OOXML writer also works and is 84 times smaller. It was built
 * and it passed openpyxl. It is not what ships four days before a ministry
 * training, because openpyxl is lenient and Excel is not, and nothing available
 * here could prove Excel opens it.
 *
 * So: exceljs, behind a dynamic import. The lazy chunk is about 256 kB gzipped
 * and the main bundle does not grow by a byte, which means a user who never
 * exports a workbook never downloads one.
 *
 * ── Two things exceljs will lie to you about ──────────────────────────────────
 * `writeBuffer()` is typed as returning an ArrayBuffer and returns a Uint8Array
 * subclass in the browser. Never reach for its `.buffer`: it is pooled and can
 * be larger than the view.
 *
 * Its output is not byte-deterministic across engines. The packet's zip is
 * therefore reproducible for its text artifacts and not for the workbook, which
 * is why nothing here or in the manifest publishes a workbook checksum.
 */

import type ExcelJSNamespace from 'exceljs';

import { brand } from '../theme';
import type { SheetBlock, SheetSpec, WorkbookSpec } from './workbookSpec';

/** Header row, and the accent behind it. Brand navy, white text. */
const HEADER_FILL = `FF${brand.navy.slice(1).toUpperCase()}`;
const CAUTION_COLOUR = 'FF8C2A1F';
const MUTED_COLOUR = `FF${brand.gray.slice(1).toUpperCase()}`;

type Worksheet = ExcelJSNamespace.Worksheet;

/**
 * Write the prose above a table.
 *
 * A README sheet is all blocks and no table, and an assumptions sheet is a few
 * blocks then a rectangle. Returns the next free row so the table knows where it
 * starts.
 */
function writeBlocks(sheet: Worksheet, blocks: SheetBlock[]): number {
  let row = 1;

  for (const block of blocks) {
    if (block.kind === 'blank') {
      row += 1;
      continue;
    }

    const cell = sheet.getCell(row, 1);

    if (block.kind === 'pair') {
      cell.value = block.label;
      cell.font = { bold: true };
      const value = sheet.getCell(row, 2);
      value.value = block.value;
      // Long values wrap inside the merged span rather than running across the
      // sheet and colliding with the next column of a table below.
      value.alignment = { wrapText: true, vertical: 'top' };
      sheet.mergeCells(row, 2, row, 7);
      row += 1;
      continue;
    }

    cell.value = block.text;
    // Prose is merged across the sheet width and wrapped, because a paragraph in
    // one unmerged cell is a paragraph nobody can read.
    sheet.mergeCells(row, 1, row, 7);
    cell.alignment = { wrapText: true, vertical: 'top' };

    if (block.kind === 'title') {
      cell.font = { bold: true, size: 14 };
    } else if (block.kind === 'heading') {
      cell.font = { bold: true, size: 11 };
    } else if (block.kind === 'caution') {
      cell.font = { bold: true, color: { argb: CAUTION_COLOUR } };
    } else {
      cell.font = { color: { argb: MUTED_COLOUR } };
    }

    // Wrapped text needs a row height or Excel shows one line and hides the
    // rest, which for a claim sentence is the worst possible truncation.
    sheet.getRow(row).height = estimateHeight(block.text);
    row += 1;
  }

  return row;
}

/** About 110 characters to a merged line at this width. */
const estimateHeight = (text: string) => Math.min(15 * Math.ceil(text.length / 110), 120);

function writeSheet(sheet: Worksheet, spec: SheetSpec): void {
  const firstTableRow = writeBlocks(sheet, spec.blocks);
  const table = spec.table;
  if (!table) {
    sheet.getColumn(1).width = 26;
    sheet.getColumn(2).width = 90;
    return;
  }

  const headerRow = firstTableRow;

  table.columns.forEach((column, i) => {
    const cell = sheet.getCell(headerRow, i + 1);
    cell.value = column.header;
    sheet.getColumn(i + 1).width = column.width;
  });

  const header = sheet.getRow(headerRow);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
  header.alignment = { wrapText: true, vertical: 'middle' };
  header.height = 30;

  table.rows.forEach((values, r) => {
    const rowIndex = headerRow + 1 + r;
    values.forEach((value, c) => {
      if (value === null || value === undefined || value === '') return;
      const cell = sheet.getCell(rowIndex, c + 1);
      cell.value = value;
      const column = table.columns[c];
      if (column?.numFmt && typeof value === 'number') cell.numFmt = column.numFmt;
      if (column?.wrap) cell.alignment = { wrapText: true, vertical: 'top' };
    });
  });

  if (table.freezeHeader) {
    // Freeze below the header AND above nothing horizontally: the first column
    // of every table here is the label you need while scrolling right.
    sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: headerRow }];
  }

  if (table.autoFilter && table.rows.length) {
    sheet.autoFilter = {
      from: { row: headerRow, column: 1 },
      to: { row: headerRow, column: table.columns.length },
    };
  }
}

export async function toXlsx(spec: WorkbookSpec): Promise<Uint8Array> {
  const ExcelJS = (await import('exceljs')) as unknown as typeof ExcelJSNamespace;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = spec.creator;
  workbook.lastModifiedBy = spec.creator;
  workbook.title = spec.title;

  for (const sheetSpec of spec.sheets) {
    writeSheet(workbook.addWorksheet(sheetSpec.name), sheetSpec);
  }

  const buffer = (await workbook.xlsx.writeBuffer()) as unknown as Uint8Array;
  // Copied rather than handed on: in the browser this is a pooled Buffer shim
  // whose backing ArrayBuffer can outlive and outsize the view.
  return new Uint8Array(buffer);
}
