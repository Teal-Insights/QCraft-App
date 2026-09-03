/**
 * The two data modes: the claims they make, and the checks that keep them true.
 *
 * These are copy tests as much as code tests, and that is the point. The Verified
 * badge is a claim about the IMF original, fixed in the sprint's binding notes
 * and held there by the 2026-08-27 gate resolution until an independent Excel
 * recalculation confirms the post-fix climate parity. A refactor that "tidies"
 * that sentence changes what the tool tells a ministry, so it fails here.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  ABOUT,
  CURRENT_DIVERGENCE,
  DEFAULT_MODE,
  FADCP_SHORT,
  MODES,
  MODE_IDS,
  NO_CLIMATE_DATA,
  SOURCE_CREDIT,
  UNAVAILABLE,
  VERIFIED_BADGE,
  isModeId,
  modeForVintage,
} from '../src/content/modes';

const EM_DASH = '—';

/** Every user-facing string this module ships. */
function allCopy(): string[] {
  const strings: string[] = [
    VERIFIED_BADGE,
    CURRENT_DIVERGENCE,
    ...Object.values(ABOUT).flatMap((value) =>
      typeof value === 'string' ? [value] : value.map((item) => item.text),
    ),
    ...Object.values(NO_CLIMATE_DATA),
    ...Object.values(UNAVAILABLE),
  ];
  for (const id of MODE_IDS) {
    const mode = MODES[id];
    strings.push(mode.label, mode.vintageLabel, mode.summary, mode.statement);
    for (const source of mode.sources) {
      strings.push(source.dataset, source.vintage, source.date);
      if (source.note) strings.push(source.note);
    }
  }
  return strings;
}

describe('the Verified badge', () => {
  it('is the exact wording the sprint fixed, to the character', () => {
    // Written out here rather than compared to itself: the assertion IS the
    // agreed sentence, so a change to modes.ts has to be made twice, on purpose.
    expect(VERIFIED_BADGE).toBe(
      'Teal Insights verified baseline parity for 147 of 147 tested countries; ' +
        'climate-scenario parity confirmed for ratio metrics only. Reproduces ' +
        'the IMF Excel workbook.',
    );
  });

  it('does not claim more than 147 countries or more than ratio metrics', () => {
    // The two ways this claim could quietly grow.
    expect(VERIFIED_BADGE).toContain('147 of 147 tested countries');
    // "only" is load-bearing, added by the 2026-08-27 evening gate: without it
    // the sentence reads as if ratio metrics were an example rather than the
    // limit of what was confirmed.
    expect(VERIFIED_BADGE).toContain('ratio metrics only');
    expect(VERIFIED_BADGE).not.toMatch(/all countries|every country|full parity|exact parity/i);
  });

  it('is what Verified mode actually says on screen', () => {
    expect(MODES.verified.statement).toBe(VERIFIED_BADGE);
  });
});

describe('the Current divergence note', () => {
  it('is one line', () => {
    expect(CURRENT_DIVERGENCE.split('\n')).toHaveLength(1);
  });

  it('names the cause and the consequence, and claims nothing about accuracy', () => {
    expect(CURRENT_DIVERGENCE).toContain('will not match the published workbook');
    // Newer data is not, on this tool's evidence, better data. Saying so would
    // be a claim about the IMF's vintage that nobody here has tested.
    expect(CURRENT_DIVERGENCE).not.toMatch(/more accurate|better|improved|corrects/i);
  });

  it('is what Current mode actually says on screen', () => {
    expect(MODES.current.statement).toBe(CURRENT_DIVERGENCE);
  });
});

describe('mode registry', () => {
  it('opens on Current, with Verified available', () => {
    // "Defaults to Current with Verified one click away" — the posted workbook
    // ships a vintage that ages, so opening on the frozen one opens on the
    // problem this tool exists to solve.
    expect(DEFAULT_MODE).toBe('current');
    expect(MODE_IDS).toEqual(['current', 'verified']);
  });

  it('points each mode at the vintage store directory of the same name', () => {
    expect(MODES.current.vintage).toBe('weo-2026-04');
    expect(MODES.verified.vintage).toBe('weo-2024-10');
  });

  it('agrees with what each vintage index says about itself', () => {
    for (const id of MODE_IDS) {
      const index = JSON.parse(
        readFileSync(
          fileURLToPath(
            new URL(
              `../../../data/vintages/${MODES[id].vintage}/json/index.json`,
              import.meta.url,
            ),
          ),
          'utf8',
        ),
      ) as { vintage: string; label: string; count: number };

      expect(index.vintage, id).toBe(MODES[id].vintage);
      // The label a mode shows is the label the vintage recorded when it was
      // built. Drift here would mislabel every export.
      expect(index.label, id).toBe(MODES[id].vintageLabel);
      expect(index.count, id).toBe(175);
    }
  });

  it('names four input series per mode', () => {
    for (const id of MODE_IDS) {
      expect(MODES[id].sources).toHaveLength(4);
    }
  });

  it('recovers a mode from a vintage id, and refuses an unknown one', () => {
    expect(modeForVintage('weo-2024-10')).toBe('verified');
    expect(modeForVintage('weo-2026-04')).toBe('current');
    expect(modeForVintage('weo-2019-04')).toBeNull();
  });

  it('guards imported run files against an unknown mode', () => {
    expect(isModeId('current')).toBe(true);
    expect(isModeId('verified')).toBe(true);
    expect(isModeId('latest')).toBe(false);
    expect(isModeId(undefined)).toBe(false);
    expect(isModeId(2)).toBe(false);
  });
});

describe('mode copy', () => {
  it('carries no em-dash anywhere', () => {
    // Workspace rule, and this file is user-facing copy that reaches the browser
    // as a React string, which a dist/ grep does not catch.
    for (const text of allCopy()) {
      expect(text, JSON.stringify(text)).not.toContain(EM_DASH);
    }
  });

  it('attributes climate damages to the FADCP dataset, never to NGFS', () => {
    const joined = allCopy().join(' ') + ' ' + Object.values(ABOUT).join(' ');
    expect(joined).toContain('FADCP Climate Dataset');
    expect(joined).not.toContain('NGFS');
  });

  it('keeps the binding short form in app copy and the chain in About', () => {
    // The 2026-08-27 evening gate answered question 2 of
    // docs/lane-reports/cc2-wording-gate.md, which DEFINES the short form:
    // "FADCP Climate Dataset (Centorrino, Massetti and Tagklis, 2024), building
    // on Kahn et al. (2021)". Teal took option (b) there: keep that in the app,
    // and ADD the precise chain to About. So the credit line keeps the authors'
    // names, and only the three-layer breakdown is About's alone.
    expect(FADCP_SHORT).toBe(
      'FADCP Climate Dataset (Centorrino, Massetti and Tagklis, 2024), ' +
        'building on Kahn et al. (2021)',
    );
    expect(SOURCE_CREDIT).toContain(FADCP_SHORT);
    expect(SOURCE_CREDIT).toContain('Centorrino');

    // The chain, and only the chain, is the About panel's addition.
    expect(SOURCE_CREDIT).not.toContain('Massetti and Tagklis (2023)');
    expect(ABOUT.climateBody).not.toContain('Massetti and Tagklis (2023)');
    expect(ABOUT.climateChain).toContain('Massetti and Tagklis (2023)');
    expect(ABOUT.climateChain).toContain('Centorrino, Massetti and Tagklis (2024)');
    expect(ABOUT.climateChain).toContain('Kahn and others (2021)');
  });

  it('says the 2030 convention holds in both modes', () => {
    expect(ABOUT.impactBody).toContain('2030');
    expect(ABOUT.impactBody).toContain('2029');
    expect(ABOUT.impactBody).toContain('both modes');
  });

  it('states that this is not an IMF product and that the IMF material is authoritative', () => {
    expect(ABOUT.notImfBody).toContain('not an IMF product');
    expect(ABOUT.notImfBody).toMatch(/authoritative/);
  });

  it('tells a user with no climate coverage that the gap is data, not safety', () => {
    expect(NO_CLIMATE_DATA.body).toContain('missing data, not an absence of risk');
    expect(NO_CLIMATE_DATA.body).toMatch(/sea-level rise/i);
  });
});
