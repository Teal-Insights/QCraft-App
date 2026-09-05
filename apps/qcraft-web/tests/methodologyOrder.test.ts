/**
 * The Methodology tab's scenario list (CC-28).
 *
 * Teal's call, 2026-09-03: where the six scenarios are listed with their
 * definitions, they read in the User Guide's order (sections II.C and IV.B):
 * Paris, Moderate, High, Hot, Hot adapted, Hot unadapted. Legends and charts
 * keep SCENARIO_DISPLAY_ORDER, which orders the Hot family by adaptation speed
 * so the lightness ramp reads. Both orders are pinned here so neither drifts
 * into the other's place.
 */

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { MethodologyTab } from '../src/components/tabs/MethodologyTab';
import { SCENARIO_GUIDE_ORDER } from '../src/content/scenarios';
import { SCENARIO_DISPLAY_ORDER, SCENARIO_LABELS } from '../src/engine/types';

describe('the Methodology tab lists the six in the guide’s reading order', () => {
  it('defines the guide order as Paris, Moderate, High, Hot, Hot adapted, Hot unadapted', () => {
    expect(SCENARIO_GUIDE_ORDER).toEqual([
      'Paris',
      'Moderate',
      'High',
      'Hot',
      'Hot_Adapted',
      'Hot_Unadapted',
    ]);
  });

  it('keeps the legend order by adaptation speed within the Hot family', () => {
    expect(SCENARIO_DISPLAY_ORDER).toEqual([
      'Paris',
      'Moderate',
      'High',
      'Hot_Adapted',
      'Hot',
      'Hot_Unadapted',
    ]);
  });

  it('renders the Climate scenarios list in the guide order', () => {
    const html = renderToStaticMarkup(createElement(MethodologyTab, { mode: 'verified', result: null }));
    const positions = SCENARIO_GUIDE_ORDER.map((key) =>
      html.indexOf(`<strong>${SCENARIO_LABELS[key]}:</strong>`),
    );
    for (const p of positions) expect(p).toBeGreaterThan(-1);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });
});
