import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { engine, ENGINE_DEFAULTS } from '../src/engine/adapter';
import type { CountryContext } from '../src/engine/types';
import { readCoverage } from '../src/engine/countryData';
import { MODES, type ModeId } from '../src/content/modes';
import { RatePanel } from '../src/components/context/RatePanel';
import { InterestRatePanel } from '../src/components/context/InterestRatePanel';
import { Sidebar } from '../src/components/Sidebar';
const noop = () => {};
function contextFor(mode: ModeId, iso3c: string): CountryContext {
  const input = JSON.parse(readFileSync(new URL(`../../../data/vintages/${MODES[mode].dataRevision}/json/${iso3c}.json`, import.meta.url), 'utf8'));
  return { input, mode, iso3c, countryName: input.country, coverage: readCoverage(input) };
}
const plain = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&');
describe('selected-run rate context', () => {
  for (const mode of ['current', 'verified'] as const) for (const iso3c of ['UGA', 'KEN']) {
    it(`uses ${iso3c} ${mode} timing and only offers a matching frozen reference`, () => {
      const context = contextFor(mode, iso3c);
      const params = { ...ENGINE_DEFAULTS, iso3c, productivity_turning_point: 10 };
      const outcome = engine.run(context, params);
      expect(outcome.ok).toBe(true); if (!outcome.ok) return;
      const result = outcome.result;
      const h = result.weoBoundaryYear;
      const panel = plain(renderToStaticMarkup(createElement(RatePanel, {
        kind: 'productivity', result, context, iso3c, start: params.productivity_start,
        end: params.productivity_end, turningPoint: params.productivity_turning_point,
        startLabel: 'Productivity start', endLabel: 'Long-run productivity',
        slug: 'productivity', vintage: MODES[mode].vintage, scope: 'region',
        onScopeChange: noop, note: '', onNoteChange: noop,
      })));
      const sidebar = plain(renderToStaticMarkup(createElement(Sidebar, {
        params, defaults: ENGINE_DEFAULTS, weoBoundaryYear: h,
        countries: [{ iso3c, name: context.countryName }], notes: {}, onChange: noop,
        onNoteChange: noop, onReset: noop, openPanel: 'productivity', onOpenPanel: noop,
      })));
      for (const text of [panel, sidebar]) {
        expect(text).toContain(`Turning Point: ${h + 10}, 10 years after ${h}`);
        expect(text).toContain('Higher values shift the transition later');
      }
      expect(panel).toContain(`bridge through ${h}`);
      expect(panel).toContain(context.countryName);
      expect(panel).toContain('not a direct IMF productivity forecast');
      if (mode !== 'verified' || iso3c !== 'UGA') expect(panel).not.toContain('Frozen Uganda workbook reference');
      const interest = plain(renderToStaticMarkup(createElement(InterestRatePanel, {
        iso3c, result, mode: params.interest_rate_mode, longRunRealRate: params.long_run_interest_rate,
        slug: 'interest', vintage: MODES[mode].vintage, scope: 'region', onScopeChange: noop, note: '', onNoteChange: noop,
      })));
      expect(interest).toContain(`${context.countryName}’s WEO effective rate`);
      const anchor = result.interestContext!.find(r => r.years === h)!;
      expect(interest).toContain(`${anchor.nominal_interest_rate.toFixed(1)}%`);
      expect(interest).toContain('normalized');
      expect(interest).not.toContain('golden master');
    });
  }
  it('does not substitute a reference when the selected input is absent', () => {
    const panel = plain(renderToStaticMarkup(createElement(RatePanel, {
      kind: 'productivity', result: null, context: null, iso3c: 'KEN', start: 5, end: 1.2,
      startLabel: 'Start', endLabel: 'End', slug: 'productivity', vintage: MODES.current.vintage,
      scope: 'region', onScopeChange: noop, note: '', onNoteChange: noop,
    })));
    expect(panel).toContain('unavailable or still loading');
    expect(panel).not.toContain('Uganda');
  });
});
