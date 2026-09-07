// One spec per user input. Each panel varies exactly one input against the shared
// settings; the engine does the rest. Ranges are the Explorer's displayed sidebar
// ranges (apps/qcraft-web/src/components/Sidebar.tsx; docs assumptions.md).
import { fieldSeries, horizon, index100, type Params, type Point, type Result, type SeriesKey } from './engine';
import type { ChainNode } from './chain';

export interface SelectControl {
  kind: 'select';
  options: { value: string; label: string }[];
  shared: string;
  try: string;
}
export interface RangeControl {
  kind: 'range';
  min: number; max: number; step: number;
  shared: number;
  try: number;
  unit: string;
  decimals: number;
}
export interface InterestControl {
  kind: 'interest';
  shared: { mode: Params['interest_rate_mode']; rate: number };
  try: { mode: Params['interest_rate_mode']; rate: number };
}
export type Control = SelectControl | RangeControl | InterestControl;
export type ControlValue = string | number | { mode: Params['interest_rate_mode']; rate: number };

export interface Channel {
  label: string;
  yLabel: string;
  decimals?: number;
  includeZero?: boolean;
  /** When true, the chart shows varied / reference x 100 against a flat 100. */
  relative?: boolean;
  extract: (result: Result, key: SeriesKey) => Point[];
}

export interface PanelSpec {
  id: string;
  title: string;
  /** Which node of the entry chain this input lights up (see chain.ts). */
  node: ChainNode;
  control: Control;
  /** Engine overrides for a control value. */
  params: (v: ControlValue) => Partial<Params>;
  /** Which output series the debt chart shows for this value. */
  series: (v: ControlValue) => SeriesKey;
  /** The reference series (grey). Usually the same as `series`. */
  refSeries?: SeriesKey;
  /** Offer a "show on Baseline / Hot" switch (the input acts on both paths). */
  scenarioToggle?: boolean;
  shownNote: string;
  /** Short name of the value, for the caption. */
  valueLabel: (v: ControlValue) => string;
  channels: Channel[];
}

const pct = (d = 1) => (v: number) => `${v.toFixed(d)} percent`;

const RULE_NOTE = 'With the fiscal rule on, the rule pulls Baseline debt back toward the 50 percent target, so most of this input shows up in the spending adjustment (see the channel chart). Climate paths carry no rule feedback, so switching to Hot shows the input with less offset.';

const realGdpRelative: Channel = {
  label: 'Real GDP, percent of the reference run',
  yLabel: 'Real GDP, reference run = 100',
  relative: true,
  extract: (r, k) => fieldSeries(r, k, 'real_gdp'),
};
const nominalGdpRelative: Channel = {
  label: 'Nominal GDP, percent of the reference run',
  yLabel: 'Nominal GDP, reference run = 100',
  relative: true,
  extract: (r, k) => fieldSeries(r, k, 'nominal_gdp'),
};
const realGdpIndex: Channel = {
  label: 'Real GDP, index last WEO year = 100',
  yLabel: 'Real GDP, last WEO year = 100',
  decimals: 0,
  extract: (r, k) => index100(fieldSeries(r, k, 'real_gdp')),
};
const productivityGrowth: Channel = {
  label: 'Labour productivity growth, percent per year',
  yLabel: 'Labour productivity growth, % per year',
  extract: (r, k) => fieldSeries(r, k, 'labour_productivity_growth'),
};
const inflationPath: Channel = {
  label: 'Inflation (GDP deflator growth), percent per year',
  yLabel: 'GDP deflator growth, % per year',
  extract: (r, k) => fieldSeries(r, k, 'inflation'),
};

const fiscalChannels: Channel[] = [
  {
    label: 'Primary expenditure, percent of GDP',
    yLabel: 'Primary expenditure, % of GDP',
    extract: (r, k) => fieldSeries(r, k, 'primary_expenditure_percent_gdp'),
  },
  {
    label: 'Primary balance, percent of GDP',
    yLabel: 'Primary balance, % of GDP',
    extract: (r, k) => fieldSeries(r, k, 'primary_balance_percent_gdp'),
  },
  {
    label: 'Interest expenditure, percent of GDP',
    yLabel: 'Interest expenditure, % of GDP',
    extract: (r, k) => fieldSeries(r, k, 'interest_expenditure_percent_gdp'),
  },
];

export const PANELS: PanelSpec[] = [
  {
    id: 'demography',
    node: 'growth',
    title: 'Demography variant',
    control: {
      kind: 'select',
      options: [{ value: 'Low', label: 'Low' }, { value: 'Medium', label: 'Medium' }, { value: 'High', label: 'High' }],
      shared: 'Medium', try: 'Low',
    },
    params: (v) => ({ demography_variant: v as string }),
    series: () => 'Baseline',
    scenarioToggle: true,
    shownNote: RULE_NOTE,
    valueLabel: (v) => `${v as string} demography`,
    channels: [
      {
        label: 'Working-age population growth, percent per year',
        yLabel: 'Working-age population growth, % per year',
        extract: (r, k) => fieldSeries(r, k, 'demography_growth_working_age'),
      },
      realGdpRelative,
      realGdpIndex,
      ...fiscalChannels.slice(0, 2),
    ],
  },
  {
    id: 'productivity-start',
    node: 'growth',
    title: 'Productivity growth, start',
    control: { kind: 'range', min: -5, max: 15, step: 0.1, shared: 5.0, try: 3.0, unit: '% per year', decimals: 1 },
    params: (v) => ({ productivity_start: v as number }),
    series: () => 'Baseline',
    scenarioToggle: true,
    shownNote: RULE_NOTE,
    valueLabel: (v) => `A start of ${pct(1)(v as number)}`,
    channels: [productivityGrowth, realGdpRelative, realGdpIndex, ...fiscalChannels.slice(0, 2)],
  },
  {
    id: 'productivity-end',
    node: 'growth',
    title: 'Productivity growth, long run',
    control: { kind: 'range', min: -5, max: 15, step: 0.1, shared: 1.2, try: 2.0, unit: '% per year', decimals: 1 },
    params: (v) => ({ productivity_end: v as number }),
    series: () => 'Baseline',
    scenarioToggle: true,
    shownNote: RULE_NOTE,
    valueLabel: (v) => `A long-run rate of ${pct(1)(v as number)}`,
    channels: [productivityGrowth, realGdpRelative, realGdpIndex, ...fiscalChannels.slice(0, 2)],
  },
  {
    id: 'turning-point',
    node: 'growth',
    title: 'Productivity turning point',
    control: { kind: 'range', min: 1, max: 70, step: 1, shared: 15, try: 30, unit: 'years', decimals: 0 },
    params: (v) => ({ productivity_turning_point: v as number }),
    series: () => 'Baseline',
    scenarioToggle: true,
    shownNote: RULE_NOTE,
    valueLabel: (v) => `A turning point of ${v as number} years (${horizon().weoMaxYear + (v as number)})`,
    channels: [productivityGrowth, realGdpRelative, realGdpIndex, ...fiscalChannels.slice(0, 2)],
  },
  {
    id: 'inflation-start',
    node: 'prices',
    title: 'Inflation, start',
    control: { kind: 'range', min: 0, max: 50, step: 0.1, shared: 5.0, try: 8.0, unit: '% per year', decimals: 1 },
    params: (v) => ({ inflation_start: v as number }),
    series: () => 'Baseline',
    scenarioToggle: true,
    shownNote: RULE_NOTE,
    valueLabel: (v) => `Starting inflation of ${pct(1)(v as number)}`,
    channels: [inflationPath, nominalGdpRelative, ...fiscalChannels],
  },
  {
    id: 'inflation-end',
    node: 'prices',
    title: 'Inflation, long run',
    control: { kind: 'range', min: 0, max: 50, step: 0.1, shared: 3.5, try: 6.0, unit: '% per year', decimals: 1 },
    params: (v) => ({ inflation_end: v as number }),
    series: () => 'Baseline',
    scenarioToggle: true,
    shownNote: RULE_NOTE,
    valueLabel: (v) => `Long-run inflation of ${pct(1)(v as number)}`,
    channels: [inflationPath, nominalGdpRelative, ...fiscalChannels],
  },
  {
    id: 'interest',
    node: 'interest',
    title: 'Interest-rate approach',
    control: {
      kind: 'interest',
      shared: { mode: 'Nominal interest rate', rate: 1.0 },
      try: { mode: 'Real interest rate', rate: 1.0 },
    },
    params: (v) => {
      const iv = v as { mode: Params['interest_rate_mode']; rate: number };
      return { interest_rate_mode: iv.mode, long_run_interest_rate: iv.rate };
    },
    series: () => 'Baseline',
    scenarioToggle: true,
    shownNote: RULE_NOTE,
    valueLabel: (v) => {
      const iv = v as { mode: Params['interest_rate_mode']; rate: number };
      if (iv.mode === 'Real interest rate') return `A constant real rate of ${pct(1)(iv.rate)}`;
      if (iv.mode === 'Interest-growth differential') return 'A constant interest-growth differential';
      return 'A constant nominal rate';
    },
    channels: [
      { label: 'Nominal interest rate on debt, percent per year', yLabel: 'Nominal interest rate, % per year', extract: (r, k) => fieldSeries(r, k, 'nominal_interest_rate') },
      { label: 'Real interest rate, percent per year', yLabel: 'Real interest rate, % per year', extract: (r, k) => fieldSeries(r, k, 'real_interest_rate') },
      fiscalChannels[2],
      fiscalChannels[0],
    ],
  },
  {
    id: 'debt-target',
    node: 'rule',
    title: 'Debt target',
    control: { kind: 'range', min: 0, max: 200, step: 1, shared: 50, try: 70, unit: '% of GDP', decimals: 0 },
    params: (v) => ({ debt_target: v as number }),
    series: () => 'Baseline',
    scenarioToggle: true,
    shownNote: 'Fiscal rule on. The rule loosens spending when debt is below the target and falling, so a higher target lets debt drift up toward it. Climate paths inherit the Baseline spending levels the rule produced, with no further feedback.',
    valueLabel: (v) => `A target of ${(v as number).toFixed(0)} percent of GDP`,
    channels: fiscalChannels,
  },
  {
    id: 'fiscal-rule',
    node: 'rule',
    title: 'Fiscal rule',
    control: { kind: 'select', options: [{ value: 'Yes', label: 'On (Yes)' }, { value: 'No', label: 'Off (No)' }], shared: 'Yes', try: 'No' },
    params: (v) => ({ fiscal_rule: v as 'Yes' | 'No' }),
    series: () => 'Baseline',
    scenarioToggle: true,
    shownNote: 'Debt target 50. Which way the rule works depends on where the last WEO year leaves the primary balance: with the rule off, a surplus widens as spending falls as a share of GDP and Baseline debt runs down (its floor is zero); a deficit does the opposite. Climate paths inherit the Baseline spending levels, with no further feedback.',
    valueLabel: (v) => ((v as string) === 'Yes' ? 'Fiscal rule on' : 'Fiscal rule off'),
    channels: fiscalChannels,
  },
  {
    id: 'rigidity',
    node: 'rigidity',
    title: 'Expenditure rigidity',
    control: { kind: 'range', min: 0, max: 1, step: 0.1, shared: 1.0, try: 0.0, unit: '', decimals: 1 },
    params: (v) => ({ expenditure_rigidity: v as number }),
    series: () => 'Hot',
    shownNote: 'Shown under the Hot scenario, where rigidity acts. The Baseline path is unaffected.',
    valueLabel: (v) => `Rigidity ${(v as number).toFixed(1)}`,
    channels: fiscalChannels,
  },
  {
    id: 'climate',
    node: 'climate',
    title: 'Climate scenario',
    control: {
      kind: 'select',
      options: [
        { value: 'Baseline', label: 'Baseline (no climate shock)' },
        { value: 'Paris', label: 'Paris' },
        { value: 'Moderate', label: 'Moderate' },
        { value: 'High', label: 'High' },
        { value: 'Hot', label: 'Hot' },
        { value: 'Hot_Adapted', label: 'Hot adapted' },
        { value: 'Hot_Unadapted', label: 'Hot unadapted' },
      ],
      shared: 'Baseline', try: 'Hot',
    },
    params: () => ({}),
    series: (v) => v as SeriesKey,
    refSeries: 'Baseline',
    shownNote: 'Reference is the Baseline path. Rigidity 1.0, so spending keeps its Baseline level while GDP is smaller. Paris can sit below the Baseline because the losses are measured against continued trend warming, not a world without warming.',
    valueLabel: (v) => {
      const k = v as SeriesKey;
      const label: Record<SeriesKey, string> = { Baseline: 'Baseline', Paris: 'Paris', Moderate: 'Moderate', High: 'High', Hot: 'Hot', Hot_Adapted: 'Hot adapted', Hot_Unadapted: 'Hot unadapted' };
      return `The ${label[k]} scenario`;
    },
    channels: [realGdpRelative, productivityGrowth, fiscalChannels[0], fiscalChannels[1]],
  },
];
