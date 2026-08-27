/**
 * Copy rules, enforced mechanically.
 *
 * The brief bans em-dashes in UI copy. Run 1 broke that rule in ten places
 * while build, typecheck, lint and tests were all green, because nothing was
 * checking. CLAUDE.md's stated philosophy is that discipline is enforced
 * mechanically rather than through prompts, so here is the mechanism.
 *
 * Scope is user-visible text: string and JSX literals in src, the HTML entry
 * points, and the rendered export report. Comments are exempt, since nobody
 * reads them in a training room. Stripping comments before searching is
 * deliberately conservative: it removes text from the search space, so the
 * failure mode is a missed violation, never a false alarm on a code comment.
 *
 * The HTML entry points were added after run 4 found an em-dash sitting in
 * index.html's meta description, where it had survived every pass: the source
 * scan did not read .html, and a dist/ grep was never part of the loop. That is
 * the exact failure mode SHARED/REFERENCE-NOTES.md warns about for the site QA
 * gate, so the gate now lives in the test suite rather than in a habit.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { ENGINE_DEFAULTS } from '../src/engine/adapter';
import { fixtureEngine } from '../src/engine/mockAdapter';
import { buildRunManifest } from '../src/run/manifest';
import { buildPacket } from '../src/export/packet';

const SRC = fileURLToPath(new URL('../src', import.meta.url));
const APP_ROOT = fileURLToPath(new URL('..', import.meta.url));

/** Every HTML entry point Vite builds, from vite.config.ts's `input`. */
const HTML_ENTRIES = [
  'index.html',
  'widgets/debt-dynamics/index.html',
  'widgets/growth/index.html',
  'widgets/climate-channel/index.html',
];

const EM_DASH = '—';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

/** Remove block comments, then whole-line `//` and `*` comment lines. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      return !t.startsWith('//') && !t.startsWith('*');
    })
    .join('\n');
}

describe('no em-dashes in UI copy', () => {
  it('holds across every source file', () => {
    const offenders = sourceFiles(SRC)
      .map((path) => ({ path, code: stripComments(readFileSync(path, 'utf8')) }))
      .filter(({ code }) => code.includes(EM_DASH))
      .map(({ path, code }) => {
        const line = code
          .split('\n')
          .find((l) => l.includes(EM_DASH))
          ?.trim();
        return `${path.slice(SRC.length + 1)}: ${line}`;
      });

    expect(offenders).toEqual([]);
  });

  it('holds in every HTML entry point, meta tags included', () => {
    const offenders = HTML_ENTRIES.filter((name) =>
      readFileSync(join(APP_ROOT, name), 'utf8').includes(EM_DASH),
    );
    expect(offenders).toEqual([]);
  });

  it('holds in the exported packet, which is the artifact that leaves the room', async () => {
    const params = { ...ENGINE_DEFAULTS, debt_target: 45 };
    const result = fixtureEngine.run(params);
    const manifest = buildRunManifest({
      params,
      defaults: ENGINE_DEFAULTS,
      notes: { debt_target: 'Charter for Fiscal Responsibility ceiling.' },
      annotations: {
        label: 'Charter ceiling test',
        note: 'A run note, so the sweep covers the free-text path too.',
      },
      result,
      now: new Date('2026-08-26T09:30:00.000Z'),
    });

    for (const artifact of buildPacket(manifest, result)) {
      const payload = await artifact.build();
      // The workbook is a zip of compressed XML, so a grep over its bytes
      // proves nothing either way. Its strings come from workbookSpec.ts,
      // which the source sweep above already covers.
      if (payload.encoding !== 'text') continue;
      expect(
        payload.text.includes(EM_DASH),
        `${artifact.filename} contains an em-dash`,
      ).toBe(false);
    }
  });
});
