/**
 * Register state: one global choice, with per-chart overrides.
 *
 * The global is what almost everyone uses, and it is remembered between
 * sessions because a person who reads these charts one way reads them that way
 * every time. The per-chart override exists because a single briefing figure
 * inside an otherwise workbook-shaped session is a real thing to want, and
 * making someone flip the whole page to get it is the kind of friction that
 * sends people back to the spreadsheet.
 *
 * Flipping the global clears the overrides. A global control that leaves some
 * charts behind is a control people stop trusting, and the per-chart note plus
 * its "follow the page setting" link is the way back.
 */

import { useCallback, useMemo, useState } from 'react';

import {
  DEFAULT_REGISTER,
  readStoredRegister,
  storeRegister,
  type ChartRegister,
  type PacketCharts,
} from './register';

export interface ChartRegisterState {
  global: ChartRegister;
  setGlobal: (register: ChartRegister) => void;
  /** What this chart is showing right now. */
  registerFor: (id: string) => ChartRegister;
  setFor: (id: string, register: ChartRegister) => void;
  isOverridden: (id: string) => boolean;
  followGlobal: (id: string) => void;
  /** For the export manifest: the global plus any chart that disagrees with it. */
  describe: () => PacketCharts;
  /**
   * Put the register back as a run file recorded it.
   *
   * Distinct from `setGlobal`, which clears the overrides by design: flipping
   * the page setting is a decision to look at everything one way, and a global
   * control that left some charts behind is one people stop trusting. Restoring
   * a run is the opposite operation. It has to reinstate the global AND the
   * exceptions together, or the reproduced document is not the document the run
   * file came with.
   */
  restore: (charts: PacketCharts) => void;
}

export function useChartRegister(initial?: ChartRegister): ChartRegisterState {
  const [global, setGlobalState] = useState<ChartRegister>(
    () => initial ?? (typeof window === 'undefined' ? DEFAULT_REGISTER : readStoredRegister()),
  );
  const [overrides, setOverrides] = useState<Record<string, ChartRegister>>({});

  const setGlobal = useCallback((register: ChartRegister) => {
    setGlobalState(register);
    setOverrides({});
    storeRegister(register);
  }, []);

  const registerFor = useCallback(
    (id: string) => overrides[id] ?? global,
    [overrides, global],
  );

  const setFor = useCallback(
    (id: string, register: ChartRegister) => {
      setOverrides((prev) => {
        if (register === global) {
          const next = { ...prev };
          delete next[id];
          return next;
        }
        return { ...prev, [id]: register };
      });
    },
    [global],
  );

  const isOverridden = useCallback((id: string) => overrides[id] != null, [overrides]);

  const followGlobal = useCallback((id: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const restore = useCallback((charts: PacketCharts) => {
    setGlobalState(charts.register);
    setOverrides({ ...charts.overrides });
    storeRegister(charts.register);
  }, []);

  const describe = useCallback(
    // Named `register` rather than `global` because this is the manifest's own
    // field name, and the run file reads better for it.
    (): PacketCharts => ({ register: global, overrides: { ...overrides } }),
    [global, overrides],
  );

  return useMemo(
    () => ({
      global,
      setGlobal,
      registerFor,
      setFor,
      isOverridden,
      followGlobal,
      describe,
      restore,
    }),
    [global, setGlobal, registerFor, setFor, isOverridden, followGlobal, describe, restore],
  );
}
