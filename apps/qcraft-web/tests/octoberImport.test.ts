import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { engine, ENGINE_DEFAULTS } from '../src/engine/adapter';
import { clearCountryCache } from '../src/engine/countryData';
import { MODES, type ModeId } from '../src/content/modes';
import { parseCsv } from '../src/engine/csv';
import type { EngineResult } from '../src/engine/types';
import { buildRunManifest, type RunManifest } from '../src/run/manifest';
import { parseRun, replayWarnings, serializeRun } from '../src/run/runFile';

// Coverage dates are from the independent October source investigation. The
// accepted prior April payloads remain read-only test inputs.
const cases = parseCsv(readFileSync(new URL('./fixtures/october-import-cases.csv', import.meta.url), 'utf8'));
const CONTEXT = { currentDefaults: ENGINE_DEFAULTS, currentVintage: MODES.verified.vintage };
const readInput = (revision: string, iso3c: string) =>
  JSON.parse(readFileSync(new URL(`../../../data/vintages/${revision}/json/${iso3c}.json`, import.meta.url), 'utf8'));

beforeEach(() => {
  clearCountryCache();
  vi.stubGlobal('fetch', async (url: string) => {
    const path = String(url).split('data/')[1];
    return new Response(readFileSync(new URL(`../../../data/vintages/${path.replace(/\/([^/]+\.json)$/, '/json/$1')}`, import.meta.url), 'utf8'));
  });
});
afterEach(() => { clearCountryCache(); vi.unstubAllGlobals(); });

async function live(mode: ModeId = 'current', iso3c = 'UGA') {
  const context = await engine.prepare(mode, iso3c);
  const params = { ...ENGINE_DEFAULTS, iso3c };
  const outcome = engine.run(context, params);
  return { context, params, outcome };
}
async function saved(mode: ModeId = 'current', iso3c = 'UGA') {
  const { params, outcome } = await live(mode, iso3c);
  if (!outcome.ok) throw new Error(outcome.detail);
  const manifest = buildRunManifest({ params, defaults: ENGINE_DEFAULTS, notes: {}, result: outcome.result, now: new Date('2026-10-16T00:00:00Z') });
  return { manifest, result: outcome.result };
}
async function aprilFile(iso3c = 'UGA'): Promise<RunManifest> {
  const template = await saved();
  const prior = readInput('weo-2026-04-full-horizon-v1', iso3c);
  return { ...template.manifest, app: { ...template.manifest.app, version: '0.4.0' },
    country: { iso3c, name: prior.country }, params: { ...ENGINE_DEFAULTS, iso3c },
    dataVintage: prior.horizonPolicy.sourceVintage, dataRevision: prior.horizonPolicy.dataRevision,
    calculationPolicy: prior.horizonPolicy.id, inputSha256: prior.horizonPolicy.inputSha256,
    horizonPolicy: prior.horizonPolicy };
}
const parsed = (manifest: RunManifest) => parseRun(serializeRun(manifest), CONTEXT);

describe('October Current saved-run import matrix', () => {
  it('round trips exact October and Verified identities using their newly calculated country', async () => {
    for (const mode of ['current', 'verified'] as const) {
      const { manifest, result } = await saved(mode);
      const restored = parsed(manifest);
      expect(restored.ok).toBe(true); if (!restored.ok) continue;
      expect(restored.manifest).toEqual(manifest);
      expect(restored.warnings).toEqual([]);
      expect(replayWarnings(restored.manifest, result)).toEqual([]);
    }
  });

  it('round trips every runnable frozen Verified country with its original timing', async () => {
    const runnable: string[] = [];
    const earlyBoundary: string[] = [];
    for (const country of engine.listCountries('verified')) {
      const { params, outcome } = await live('verified', country.iso3c);
      if (!outcome.ok) continue;
      const manifest = buildRunManifest({ params, defaults: ENGINE_DEFAULTS, notes: {}, result: outcome.result, now: new Date('2026-10-16T00:00:00Z') });
      const restored = parsed(manifest);
      expect(restored.ok, country.iso3c).toBe(true);
      if (!restored.ok) continue;
      expect(restored.manifest, country.iso3c).toEqual(manifest);
      expect(restored.warnings, country.iso3c).toEqual([]);
      expect(replayWarnings(restored.manifest, outcome.result), country.iso3c).toEqual([]);
      runnable.push(country.iso3c);
      const timing = manifest.horizonPolicy!;
      if (timing.climateStartYear! > timing.projectionStartYear!) earlyBoundary.push(country.iso3c);
    }
    expect(runnable.length).toBeGreaterThan(0);
    expect(earlyBoundary.length).toBeGreaterThan(0);
  });

  it('restores explicit pre-mode, truncated April and full-horizon April lineage with changed-data warnings', async () => {
    const prior = await aprilFile();
    for (const kind of ['pre-mode', 'truncated', 'full-horizon']) {
      const file = structuredClone(prior);
      if (kind !== 'full-horizon') {
        delete file.horizonPolicy; delete file.calculationPolicy; delete file.inputSha256;
        if (kind === 'truncated') file.dataRevision = file.dataVintage;
        else { delete file.dataRevision; delete (file as Partial<RunManifest>).mode; }
      }
      const restored = parsed(file);
      expect(restored.ok, kind).toBe(true); if (!restored.ok) continue;
      expect(restored.manifest.mode, kind).toBe('current');
      expect(restored.manifest.params, kind).toEqual(prior.params);
      expect(restored.warnings.join(' '), kind).toContain('not the original');
      const recalculated = await live(restored.manifest.mode, restored.manifest.params.iso3c);
      expect(recalculated.outcome.ok).toBe(true);
      if (recalculated.outcome.ok) expect(replayWarnings(restored.manifest, recalculated.outcome.result).join(' ')).toContain('data vintage differs');
    }
  });

  it.each(cases)('restores prior $iso3c settings with the freshly calculated October coverage outcome', async row => {
    const prior = await aprilFile(row.iso3c);
    const restored = parsed(prior);
    expect(restored.ok).toBe(true); if (!restored.ok) return;
    expect(restored.warnings.join(' ')).toContain('not the original results');
    const calculated = await live(restored.manifest.mode, restored.manifest.params.iso3c);
    const timing = calculated.context.input.horizonPolicy!;
    expect(timing.coverageStatus).toBe(row.coverage_status);
    if (row.coverage_status === 'unsupported') {
      expect(calculated.outcome.ok).toBe(false);
      if (!calculated.outcome.ok) expect(calculated.outcome.detail).toContain('2009');
      // The existing import flow can restore settings into an explicit refusal,
      // and the same country remains available in frozen Verified mode.
      expect(engine.listCountries('verified').some(country => country.iso3c === row.iso3c)).toBe(true);
      expect((await live('verified', row.iso3c)).outcome.ok).toBe(true);
    } else {
      expect(calculated.outcome.ok).toBe(true);
      expect(String(timing.weoMaxYear)).toBe(row.weo_max_year);
      expect(String(timing.projectionStartYear)).toBe(row.projection_start_year);
      if (calculated.outcome.ok) {
        const warnings = replayWarnings(restored.manifest, calculated.outcome.result).join(' ');
        expect(warnings).toContain('input SHA-256 differs');
        if (row.coverage_status === 'shorter') expect(warnings).toContain('Timing changed: weoMaxYear');
      }
    }
  });

  it('refuses a conflicting country header before any settings are applied', async () => {
    const { manifest } = await saved();
    manifest.country.iso3c = 'KEN';
    const restored = parsed(manifest);
    expect(restored.ok).toBe(false);
    if (!restored.ok) expect(restored.error).toContain('country conflicts');
  });

  it('refuses internally inconsistent or out-of-bounds timing and source identity', async () => {
    const { manifest } = await saved();
    for (const corrupt of [
      (m: RunManifest) => { m.horizonPolicy!.projectionStartYear! += 1; },
      (m: RunManifest) => { m.horizonPolicy!.climateAnchorYear! -= 1; },
      (m: RunManifest) => { m.horizonPolicy!.sourceWeoMaxYear = -1; },
      (m: RunManifest) => { m.horizonPolicy!.weoMaxYear = 1000000; },
      (m: RunManifest) => { m.horizonPolicy!.sourceVintage = MODES.verified.vintage; },
      (m: RunManifest) => { m.mode = 'verified'; },
    ]) {
      const file = structuredClone(manifest); corrupt(file);
      expect(parsed(file).ok).toBe(false);
    }
  });

  it('compares coherent saved timing with the newly calculated country rather than trusting the file', async () => {
    const { manifest, result } = await saved('current', 'ALB');
    const peer = await saved();
    const fabricated = structuredClone(manifest);
    fabricated.horizonPolicy = { ...peer.manifest.horizonPolicy!, inputSha256: manifest.inputSha256! };
    const restored = parsed(fabricated);
    expect(restored.ok).toBe(true); if (!restored.ok) return;
    expect(replayWarnings(restored.manifest, result).join(' ')).toContain('Timing changed: weoMaxYear');
    expect(replayWarnings(restored.manifest, peer.result).join(' ')).toContain('calculated country differs');
  });

  it('warns for missing identity and for a self-consistent altered input hash', async () => {
    const { manifest, result } = await saved();
    const missing = structuredClone(manifest);
    delete missing.horizonPolicy; delete missing.dataRevision;
    delete missing.calculationPolicy; delete missing.inputSha256;
    const absent = parsed(missing);
    expect(absent.ok).toBe(true);
    if (absent.ok) {
      expect(absent.warnings.join(' ')).toContain('not an exact replay');
      expect(replayWarnings(absent.manifest, result).join(' ')).toContain('no input SHA-256');
    }
    const changed = structuredClone(manifest);
    changed.inputSha256 = '0'.repeat(64);
    changed.horizonPolicy!.inputSha256 = changed.inputSha256;
    const restored = parsed(changed);
    expect(restored.ok).toBe(true);
    if (restored.ok) expect(replayWarnings(restored.manifest, result).join(' ')).toContain('input SHA-256 differs');
    expect(replayWarnings(manifest, { ...result, iso3c: 'KEN' } as EngineResult).join(' ')).toContain('calculated country differs');
  });
});
