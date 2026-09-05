/**
 * Guards that keep the app on the real engine.
 *
 * The Explorer served golden-master fixtures for its first two runs. That was
 * the right call while the TypeScript engine lived in another clone, and it is
 * the wrong thing to ship now: fixtures cannot respond to a slider, cannot
 * change country, and cannot tell two data vintages apart. A quiet reversion to
 * them would leave a mode switch that changes the label and nothing else.
 *
 * So the fixture is fenced off by test rather than by memory.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { engine } from '../src/engine/adapter';
import { MODES, MODE_IDS } from '../src/content/modes';

const SRC = fileURLToPath(new URL('../src', import.meta.url));

/**
 * Strip comments before scanning for copy.
 *
 * These files explain themselves at length, and several of them name a vintage
 * or quote the parity claim while doing it. A comment is not something a user
 * reads, so scanning raw text would flag the explanation rather than the
 * duplication it warns against.
 */
function withoutComments(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s\/\/.*$/gm, '');
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

describe('the app runs the real engine', () => {
  it('reports engine provenance, not fixture provenance', () => {
    // `run` needs a prepared context, which needs a fetch, so the seam itself is
    // what is asserted here: the app's engine is the one that has a `prepare`
    // step at all. A fixture has nothing to prepare.
    expect(typeof engine.prepare).toBe('function');
    expect(typeof engine.run).toBe('function');
  });

  it('offers all 175 countries in both modes, not one', () => {
    for (const mode of MODE_IDS) {
      const countries = engine.listCountries(mode);
      expect(countries.length, mode).toBe(175);
      expect(countries.map((c) => c.iso3c), mode).toContain('UGA');
      // Zambia is a live partner country and must be in the list even though its
      // source data currently blocks the projection: the tool says why.
      expect(countries.map((c) => c.iso3c), mode).toContain('ZMB');
    }
  });

  it('lists the same countries in both modes, under the same names', () => {
    const [current, verified] = MODE_IDS.map((m) =>
      engine.listCountries(m).map((c) => `${c.iso3c}:${c.name}`).sort(),
    );
    expect(current).toEqual(verified);
  });
});

describe('the fixture stays out of the app', () => {
  const files = sourceFiles(SRC);

  it('finds source files to check', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it('is imported by no module under src/', () => {
    const offenders = files.filter((path) => {
      if (path.endsWith(join('engine', 'mockAdapter.ts'))) return false;
      const text = readFileSync(path, 'utf8');
      return /from '.*mockAdapter'/.test(text) || /fixtureEngine/.test(text);
    });
    expect(offenders.map((f) => f.replace(SRC, 'src'))).toEqual([]);
  });

  it('is not re-exported through the adapter the app imports', () => {
    // The regression this catches, measured: re-exporting the fixture from
    // adapter.ts pulled a 257 KB chunk of golden-master CSV into dist, to serve
    // numbers no user ever sees. Components import ./engine/adapter, so anything
    // that module re-exports is in the bundle.
    const adapter = readFileSync(join(SRC, 'engine', 'adapter.ts'), 'utf8');
    expect(withoutComments(adapter)).not.toMatch(/from '\.\/mockAdapter'/);
  });
});

describe('mode copy is written in one place', () => {
  const files = sourceFiles(SRC).filter(
    (path) => !path.endsWith(join('content', 'modes.ts')),
  );

  it('states the parity claim nowhere but the mode registry', () => {
    // A second copy of this sentence is a second thing to send through the
    // wording gate, and the one that gets forgotten.
    const offenders = files.filter((path) =>
      /147 of 147|147\/147/.test(withoutComments(readFileSync(path, 'utf8'))),
    );
    expect(offenders.map((f) => f.replace(SRC, 'src'))).toEqual([]);
  });

  it('hard-codes a vintage id nowhere but the mode registry and the fixture', () => {
    const offenders = files.filter((path) => {
      // Adapter validates the raw payload's exact revision contract.
      if (path.endsWith(join('engine', 'qcraftAdapter.ts'))) return false;
      if (path.endsWith(join('engine', 'mockAdapter.ts'))) return false;
      // The adapter names the vintage directories in its data imports, which is
      // how it reaches index.json at build time; that is a path, not a claim.
      const text = withoutComments(readFileSync(path, 'utf8')).replace(
        /^import[\s\S]*?from '[^']*';$/gm,
        '',
      );
      return /weo-20\d\d-\d\d/.test(text);
    });
    expect(offenders.map((f) => f.replace(SRC, 'src'))).toEqual([]);
  });
});

describe('the two modes name different data', () => {
  it('does not point both modes at one vintage', () => {
    expect(MODES.current.vintage).not.toBe(MODES.verified.vintage);
    expect(MODES.current.vintageLabel).not.toBe(MODES.verified.vintageLabel);
  });
});
