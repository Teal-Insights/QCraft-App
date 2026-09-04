/** The timing parameter must follow the selected value without a midpoint claim. */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Sidebar } from '../src/components/Sidebar';
import { RatePanel } from '../src/components/context/RatePanel';
import { ENGINE_DEFAULTS } from '../src/engine/adapter';
import { PARAM_GUIDANCE } from '../src/content/guidance';
import { ABOUT } from '../src/content/modes';

const noop = () => {};

describe('Turning Point teaching copy', () => {
  for (const [turningPoint, year] of [[10, 2039], [15, 2044], [20, 2049]]) {
    it(`shows the selected ${turningPoint}-year marker in both teaching surfaces`, () => {
      const sidebar = renderToStaticMarkup(createElement(Sidebar, {
        params: { ...ENGINE_DEFAULTS, productivity_turning_point: turningPoint },
        countries: [{ iso3c: 'UGA', name: 'Uganda' }],
        defaults: ENGINE_DEFAULTS, notes: {}, onChange: noop, onNoteChange: noop,
        onReset: noop, openPanel: 'productivity', onOpenPanel: noop,
      }));
      const panel = renderToStaticMarkup(createElement(RatePanel, {
        kind: 'productivity', iso3c: 'UGA', start: 5, end: 1.2, turningPoint,
        startLabel: 'Productivity start', endLabel: 'Long-run productivity',
        slug: 'productivity', vintage: 'weo-2024-10', scope: 'region',
        onScopeChange: noop, note: '', onNoteChange: noop,
      }));
      for (const html of [sidebar, panel]) {
        const text = html.replace(/<[^>]+>/g, '');
        expect(text).toContain(`Turning Point: ${year}, ${turningPoint} years after 2029`);
        expect(text).toContain('Higher values shift the transition later');
        expect(text).not.toMatch(/halfway|half-way|midpoint|fastest/i);
      }
    });
  }

  it('keeps help and capability descriptions free of the false midpoint claim', () => {
    const text = PARAM_GUIDANCE.productivityTurningPoint.help + JSON.stringify(ABOUT);
    expect(text).not.toMatch(/halfway|half-way|midpoint|fastest/i);
    expect(PARAM_GUIDANCE.productivityTurningPoint.help).toContain('Higher values');
  });
});
