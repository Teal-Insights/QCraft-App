/**
 * The two chart registers.
 *
 * The Explorer has two audiences for the same numbers and they want different
 * pictures.
 *
 *   WORKBOOK. Somebody who has the IMF Excel workbook open, or who ran the
 *   Shiny Explorer last year, and needs to see that this tool produces the same
 *   thing. Titles name the variable, every scenario is drawn at equal weight,
 *   the legend carries identity, nothing is annotated. Recognition is the whole
 *   job, so the app must not improve it.
 *
 *   BRIEFING. Somebody writing a fiscal risk statement or a note for the people
 *   who sign off on one. One message per chart, stated in a title computed from
 *   the run, everything that is not the message grayed down, the message
 *   measured on the chart rather than asserted in the caption.
 *
 * Neither replaces the other. The workbook register is why nothing familiar
 * disappears; the briefing register is why the output is usable as it stands.
 *
 * The choice is global with a per-chart override, and it travels into the
 * exports, so a packet says which register produced its figures.
 */

export const CHART_REGISTERS = ['workbook', 'briefing'] as const;

export type ChartRegister = (typeof CHART_REGISTERS)[number];

export const REGISTER_LABEL: Record<ChartRegister, string> = {
  workbook: 'Workbook',
  briefing: 'Briefing',
};

/** Shown on the global control, one line each. */
export const REGISTER_HELP: Record<ChartRegister, string> = {
  workbook:
    'The charts as the IMF Excel workbook and the Shiny Explorer draw them. ' +
    'Every scenario at equal weight, titles that name the variable.',
  briefing:
    'One message per chart, in a title computed from this run, with the ' +
    'supporting paths grayed down. The version that goes into a fiscal risk ' +
    'statement.',
};

export const DEFAULT_REGISTER: ChartRegister = 'workbook';

/** Where the global choice is remembered between sessions. */
export const REGISTER_STORAGE_KEY = 'qcraft.chartRegister';

export function isChartRegister(value: unknown): value is ChartRegister {
  return typeof value === 'string' && (CHART_REGISTERS as readonly string[]).includes(value);
}

/**
 * Read the remembered register.
 *
 * Wrapped because this app must open from a `file://` URL in a training room,
 * and some browsers throw on `localStorage` there rather than returning null.
 * A storage failure has to leave the app working on the default.
 */
export function readStoredRegister(): ChartRegister {
  try {
    const raw = window.localStorage.getItem(REGISTER_STORAGE_KEY);
    return isChartRegister(raw) ? raw : DEFAULT_REGISTER;
  } catch {
    return DEFAULT_REGISTER;
  }
}

export function storeRegister(register: ChartRegister): void {
  try {
    window.localStorage.setItem(REGISTER_STORAGE_KEY, register);
  } catch {
    // Remembering the choice is a convenience. Losing it is not a failure.
  }
}

/**
 * The register choice as it travels: the global, plus any chart set apart.
 *
 * Lives here rather than in the export layer because both the run manifest and
 * the packet need it, and neither should have to depend on the other to name
 * it.
 */
export interface PacketCharts {
  register: ChartRegister;
  overrides: Record<string, ChartRegister>;
}

export const DEFAULT_CHARTS: PacketCharts = {
  register: DEFAULT_REGISTER,
  overrides: {},
};

/** True for a value shaped like a stored register choice. Guards imported run JSON. */
export function isPacketCharts(value: unknown): value is PacketCharts {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { register?: unknown; overrides?: unknown };
  if (!isChartRegister(candidate.register)) return false;
  if (candidate.overrides == null) return true;
  if (typeof candidate.overrides !== 'object') return false;
  return Object.values(candidate.overrides as Record<string, unknown>).every(isChartRegister);
}
