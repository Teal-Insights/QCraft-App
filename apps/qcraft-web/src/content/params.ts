/**
 * The parameter registry: one ordered list of every user-settable parameter,
 * with the label and value formatting used wherever a parameter is named.
 *
 * Before this file there were two label lists — the Sidebar's JSX and the mock
 * adapter's `describeIgnoredParams` — and they had already drifted ("Inflation
 * (start)" vs "Inflation - start (%)"). A run manifest that is meant to be read
 * next to the app cannot have the app calling a parameter one thing and the
 * export calling it another, so the list lives here and everything reads it.
 *
 * Consumers: Sidebar (labels + provenance chips), mockAdapter (the
 * ignored-parameter disclosure), the run manifest, and the report annex.
 *
 * Key order is the order a reader meets these parameters in the sidebar and in
 * the "Assumptions and rationale" annex. Keep the two the same.
 */

import type { EngineParams } from '../engine/types';

export type ParamKey = keyof EngineParams;

/** Every EngineParams value is one of these; `format` takes the union. */
export type ParamValue = EngineParams[ParamKey];

export type ParamGroup = 'Country and data' | 'Growth assumptions' | 'Fiscal policy';

export interface ParamField {
  key: ParamKey;
  /** How this parameter is named everywhere: sidebar, manifest, annex, report. */
  label: string;
  group: ParamGroup;
  /** Rendered value, for the manifest and the annex table. */
  format: (value: ParamValue) => string;
}

/** Percentages carry one decimal so "5" and "5.0" never read as two settings. */
const pct = (value: ParamValue) => `${Number(value).toFixed(1)}%`;
const asIs = (value: ParamValue) => String(value);

export const PARAM_FIELDS: readonly ParamField[] = [
  { key: 'iso3c', label: 'Country', group: 'Country and data', format: asIs },
  {
    key: 'demography_variant',
    label: 'Demography variant',
    group: 'Country and data',
    format: asIs,
  },
  {
    key: 'productivity_start',
    label: 'Productivity growth, start',
    group: 'Growth assumptions',
    format: pct,
  },
  {
    key: 'productivity_end',
    label: 'Productivity growth, long run',
    group: 'Growth assumptions',
    format: pct,
  },
  {
    key: 'inflation_start',
    label: 'Inflation, start',
    group: 'Growth assumptions',
    format: pct,
  },
  {
    key: 'inflation_end',
    label: 'Inflation, long run',
    group: 'Growth assumptions',
    format: pct,
  },
  {
    key: 'interest_rate_mode',
    label: 'Interest-rate approach',
    group: 'Growth assumptions',
    format: asIs,
  },
  {
    key: 'debt_target',
    label: 'Debt target',
    group: 'Fiscal policy',
    format: (v) => `${Number(v).toFixed(0)}% of GDP`,
  },
  { key: 'fiscal_rule', label: 'Fiscal rule', group: 'Fiscal policy', format: asIs },
  {
    key: 'expenditure_rigidity',
    label: 'Expenditure rigidity',
    group: 'Fiscal policy',
    format: (v) => Number(v).toFixed(1),
  },
] as const;

const BY_KEY = new Map(PARAM_FIELDS.map((f) => [f.key, f]));

/**
 * Look up a field. Throws on an unknown key rather than returning undefined:
 * every caller here is naming a parameter for a document a ministry reader will
 * keep, and a silently unlabelled row is worse than a build failure.
 */
export function paramField(key: ParamKey): ParamField {
  const field = BY_KEY.get(key);
  if (!field) throw new Error(`No parameter field registered for "${key}"`);
  return field;
}

export const paramLabel = (key: ParamKey) => paramField(key).label;

export const formatParam = (key: ParamKey, value: ParamValue) =>
  paramField(key).format(value);
