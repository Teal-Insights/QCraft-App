/**
 * The anchor-shift notice: what it says, when it says it, and where it travels.
 *
 * The engine anchors its projection on the last year that still carries nominal
 * GDP and revenue, not on the last year the source publishes a row for. For
 * most countries those are the same year and there is nothing to say. For six
 * they are not, and the workbook returns an error rather than a projection for
 * exactly those countries: `Macrofiscal` row 19 and `Baseline` row 36 are
 * unguarded, so a missing figure propagates. CC-6 raised the divergence as
 * `.change-requests/FISCAL-ANCHOR-2026-08-27.md` and Teal approved naming the
 * anchor year on screen on 2026-08-28.
 *
 * Two things are worth holding by test. First, that the condition is derived
 * and not a list: a vintage change has to be able to move which countries are
 * affected without anybody editing code. Second, that the sentence carries both
 * years, because "this starts from 2010" is only meaningful beside "and the
 * release runs to 2029".
 */

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { runPipeline, type CountryInput } from '@qcraft/engine';

import { ANCHOR_SHIFT, MODES } from '../src/content/modes';
import { readCoverage, type Coverage } from '../src/engine/countryData';
import {
  ENGINE_DEFAULTS,
  WEO_BOUNDARY_YEAR,
  anchorShiftOf,
  boundaryYearFor,
} from '../src/engine/qcraftAdapter';
import { toEngineResult, toPipelineParams } from '../src/engine/pipelineResult';
import { anchorNote } from '../src/export/figures';

const coverage = (weoMaxYear: number | null, sourceMaxYear: number | null): Coverage => ({
  hasClimateData: true,
  block: null,
  weoMaxYear,
  sourceMaxYear,
  historyGapYears: [],
});

describe('anchorShiftOf', () => {
  it('says nothing when the engine anchors on the source’s own last year', () => {
    expect(anchorShiftOf(coverage(2029, 2029))).toBeNull();
  });

  it('says nothing when the source itself simply ends early', () => {
    // Bolivia's shape. The workbook would anchor on 2026 too, so there is no
    // divergence to name and a notice here would explain nothing.
    expect(anchorShiftOf(coverage(2026, 2026))).toBeNull();
  });

  it('reports both years when the engine anchors earlier than the source ends', () => {
    expect(anchorShiftOf(coverage(2025, 2029))).toEqual({
      anchorYear: 2025,
      sourceMaxYear: 2029,
    });
  });

  it('says nothing when the country has no macrofiscal rows at all', () => {
    expect(anchorShiftOf(coverage(null, null))).toBeNull();
  });
});

describe('the sentence', () => {
  const line = ANCHOR_SHIFT.line('Ecuador', 2025, 2029);

  it('names the country and both years', () => {
    expect(line).toContain('Ecuador');
    expect(line).toContain('2025');
    expect(line).toContain('2029');
  });

  it('carries no em-dash', () => {
    expect(`${ANCHOR_SHIFT.heading} ${line} ${ANCHOR_SHIFT.action}`).not.toMatch(/—/);
  });
});

describe('anchorNote, the artifact-side sentence', () => {
  const base = {
    iso3c: 'ECU',
    countryName: 'Ecuador',
    scenarios: [],
    weoBoundaryYear: 2025,
    provenance: {
      kind: 'engine' as const,
      source: 'test',
      mode: 'current' as const,
      dataVintage: MODES.current.vintage,
      ignoredParams: [],
    },
  };

  it('is absent for an ordinary country, so no packet carries a note it does not need', () => {
    expect(anchorNote({ ...base, anchorShift: null })).toBeNull();
  });

  it('names the anchor year and the workbook divergence for a shifted one', () => {
    const note = anchorNote({
      ...base,
      anchorShift: { anchorYear: 2025, sourceMaxYear: 2029 },
    });
    expect(note).toContain('2025');
    expect(note).toContain('2029');
    expect(note).toContain('Excel workbook');
  });
});

// ── Against the real payloads ────────────────────────────────────────────────
//
// Skips loudly on a fresh clone, like tests/verifiedMode.test.ts, because the
// per-country payloads are gitignored build artifacts. Rebuild them with:
//
//   uv run --package qcraft-pipeline qcraft-pipeline run
//   uv run --package qcraft-pipeline python scripts/build_vintage_json.py weo-2024-10

const payloadPath = (vintage: string, iso3c: string) =>
  fileURLToPath(
    new URL(`../../../data/vintages/${vintage}/json/${iso3c}.json`, import.meta.url),
  );

const havePayloads =
  existsSync(payloadPath(MODES.current.vintage, 'ECU')) &&
  existsSync(payloadPath(MODES.current.vintage, 'UGA'));

const load = (vintage: string, iso3c: string) =>
  JSON.parse(readFileSync(payloadPath(vintage, iso3c), 'utf8')) as CountryInput;

describe.skipIf(!havePayloads)('the real vintages', () => {
  it('finds Ecuador anchor-shifted on the current vintage, at 2025', () => {
    const shift = anchorShiftOf(readCoverage(load(MODES.current.vintage, 'ECU')));
    expect(shift).toEqual({ anchorYear: 2025, sourceMaxYear: 2029 });
  });

  it('finds Uganda unshifted, so most of the list carries no notice', () => {
    expect(anchorShiftOf(readCoverage(load(MODES.current.vintage, 'UGA')))).toBeNull();
    expect(anchorShiftOf(readCoverage(load(MODES.verified.vintage, 'UGA')))).toBeNull();
  });

  it('finds Syria anchor-shifted by nineteen years on the frozen vintage', () => {
    // The case that makes the notice worth shipping: without it, a reader sees a
    // 2029 boundary and a projection anchored on 2010.
    const shift = anchorShiftOf(readCoverage(load(MODES.verified.vintage, 'SYR')));
    expect(shift).toEqual({ anchorYear: 2010, sourceMaxYear: 2029 });
  });

  it('carries the shift onto the result the app and the exports both read', () => {
    const input = load(MODES.current.vintage, 'ECU');
    const cover = readCoverage(input);
    const result = toEngineResult(runPipeline(input, toPipelineParams(ENGINE_DEFAULTS)), {
      iso3c: 'ECU',
      countryName: input.country,
      weoBoundaryYear: boundaryYearFor(cover.weoMaxYear),
      anchorShift: anchorShiftOf(cover),
      mode: 'current',
      dataVintage: MODES.current.vintage,
    });

    expect(result.anchorShift).toEqual({ anchorYear: 2025, sourceMaxYear: 2029 });
    // The chart's shaded boundary and the named anchor are the same year. If
    // they ever part company the chart is drawing projection as history.
    expect(result.weoBoundaryYear).toBe(2025);
    expect(result.weoBoundaryYear).toBeLessThan(WEO_BOUNDARY_YEAR);
    expect(anchorNote(result)).toContain('2025');
  });
});
