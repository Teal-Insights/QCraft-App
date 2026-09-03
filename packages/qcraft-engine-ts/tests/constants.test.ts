/**
 * Scenario labels are the IMF User Guide's names (Tim and Rahman, 2024,
 * section II.C). No temperature suffixes: the guide gives none except "below
 * 2°C" for Paris, and Hot is the 90th percentile of High's own SSP3-7.0 models,
 * so any degree ladder inverts the guide's ordering. CC-26, audit B finding 1.
 */

import { describe, expect, it } from 'vitest';

import { CLIMATE_SCENARIOS, SCENARIO_LABELS } from '../src/index.js';

describe('SCENARIO_LABELS', () => {
  it('are the User Guide’s six names', () => {
    expect(SCENARIO_LABELS).toEqual({
      Paris: 'Paris',
      Moderate: 'Moderate',
      High: 'High',
      Hot: 'Hot',
      Hot_Adapted: 'Hot adapted',
      Hot_Unadapted: 'Hot unadapted',
    });
  });

  it('label every scenario key', () => {
    for (const key of CLIMATE_SCENARIOS) expect(SCENARIO_LABELS[key]).toBeTruthy();
  });
});
