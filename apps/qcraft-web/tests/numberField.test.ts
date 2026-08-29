/**
 * The numeric-field guard (HCD audit F-3 and F-2, CC-16 micro-fixes A4 and A5).
 *
 * F-3: clearing a number input fed `Number('')`, which is 0, into the engine,
 * so an analyst mid-retype watched every headline recompute at zero
 * productivity and the box rerender "0" under their cursor (audit shot
 * 12b-emptied). The guard treats an emptied or unparseable draft as
 * not-yet-a-value: nothing commits, the projection keeps the last valid value.
 *
 * F-2 (partial, A5): 999 typed into a max-15 field recomputed silently and was
 * badged like a legitimate choice (audit shot 12d-999-recompute). The engine
 * behavior is unchanged here by design (the stale-state hold is v2.1); what
 * ships now is the flag beside the field naming the declared range.
 */

import { describe, expect, it } from 'vitest';

import {
  emptyFlagText,
  outOfRange,
  parseDraft,
  rangeFlagText,
} from '../src/components/numberField';

describe('parseDraft: what the user typed, or not-yet-a-value', () => {
  it('treats an emptied field as no value, never as zero', () => {
    // The audit reproduction: Number('') === 0 was the defect.
    expect(parseDraft('')).toBeNull();
  });

  it('treats whitespace as no value (Number("  ") is also 0)', () => {
    expect(parseDraft('   ')).toBeNull();
  });

  it('keeps a deliberate zero as a value', () => {
    expect(parseDraft('0')).toBe(0);
  });

  it('parses ordinary decimals and negatives', () => {
    expect(parseDraft('4')).toBe(4);
    expect(parseDraft('4.5')).toBe(4.5);
    expect(parseDraft('-3')).toBe(-3);
  });

  it('rejects drafts that are not a finite number', () => {
    expect(parseDraft('abc')).toBeNull();
    expect(parseDraft('-')).toBeNull();
    expect(parseDraft('1e999')).toBeNull();
  });
});

describe('outOfRange: the declared bounds, inclusive', () => {
  it('flags the audit case: 999 in a max-15 field', () => {
    expect(outOfRange(999, -5, 15)).toBe(true);
  });

  it('accepts both bounds as legitimate settings', () => {
    expect(outOfRange(15, -5, 15)).toBe(false);
    expect(outOfRange(-5, -5, 15)).toBe(false);
  });

  it('flags just past either bound', () => {
    expect(outOfRange(15.1, -5, 15)).toBe(true);
    expect(outOfRange(-5.1, -5, 15)).toBe(true);
  });

  it('does not flag values inside the range', () => {
    expect(outOfRange(5, -5, 15)).toBe(false);
    expect(outOfRange(0, 0, 200)).toBe(false);
  });
});

describe('flag copy: factual, names the fact, no scolding', () => {
  it('names the declared range and what the projection is doing', () => {
    expect(rangeFlagText(999, -5, 15)).toBe(
      'Outside the range this field accepts (-5 to 15). The projection is still computed with 999.',
    );
  });

  it('says an emptied field keeps the last value live', () => {
    expect(emptyFlagText('5')).toBe(
      'No value yet. The projection keeps the last value, 5.',
    );
  });

  it('carries no em-dash anywhere (house style)', () => {
    for (const s of [rangeFlagText(999, -5, 15), emptyFlagText('5')]) {
      expect(s.includes('—')).toBe(false);
    }
  });
});
