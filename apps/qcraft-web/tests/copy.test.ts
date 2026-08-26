/**
 * Copy rules, enforced mechanically.
 *
 * The brief bans em-dashes in UI copy. Run 1 broke that rule in ten places
 * while build, typecheck, lint and tests were all green, because nothing was
 * checking. CLAUDE.md's stated philosophy is that discipline is enforced
 * mechanically rather than through prompts, so here is the mechanism.
 *
 * Scope is user-visible text: string and JSX literals in src, and the rendered
 * export report. Comments are exempt, since nobody reads them in a training
 * room. Stripping comments before searching is deliberately conservative: it
 * removes text from the search space, so the failure mode is a missed
 * violation, never a false alarm on a code comment.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { engine, ENGINE_DEFAULTS } from '../src/engine/adapter';
import { buildRunManifest } from '../src/run/manifest';
import { buildPacket } from '../src/export/packet';

const SRC = fileURLToPath(new URL('../src', import.meta.url));

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

  it('holds in the exported packet, which is the artifact that leaves the room', () => {
    const params = { ...ENGINE_DEFAULTS, debt_target: 45 };
    const result = engine.run(params);
    const manifest = buildRunManifest({
      params,
      defaults: ENGINE_DEFAULTS,
      notes: { debt_target: 'Charter for Fiscal Responsibility ceiling.' },
      result,
      now: new Date('2026-08-26T09:30:00.000Z'),
    });

    for (const artifact of buildPacket(manifest, result)) {
      expect(
        artifact.contents.includes(EM_DASH),
        `${artifact.filename} contains an em-dash`,
      ).toBe(false);
    }
  });
});
