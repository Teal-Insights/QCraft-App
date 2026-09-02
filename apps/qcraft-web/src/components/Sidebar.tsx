/**
 * Parameter sidebar.
 *
 * Replicates the Shiny Explorer's five controls (country, demography variant,
 * debt target, fiscal rule, expenditure rigidity) and adds the five that were
 * previously fixed inside the pipeline: productivity start and long run,
 * inflation start and end, and the interest-rate approach.
 *
 * Every control opens on the Explorer default. See ENGINE_DEFAULTS in
 * src/engine/mockAdapter.ts, which cites DEFAULTS in
 * packages/qcraft-engine/src/qcraft_engine/constants.py.
 *
 * ── Assumption provenance ─────────────────────────────────────────────────────
 * Every parameter states whether it is still on the Explorer default or has been
 * changed, and a changed parameter opens a one-line rationale field beside its
 * guidance text. That field is not decoration: it is the input to the
 * "Assumptions and rationale" annex of the exported report, which is what turns
 * a projection into something a ministry can defend in a fiscal risk statement.
 * The prompt for it therefore asks the question a reviewer would ask ("Why this
 * value?"), not "notes".
 *
 * A note stays visible once written even if the value goes back to its default,
 * so text a user typed is never silently discarded; the annex shows the state
 * beside it.
 *
 * ── Parameter context ─────────────────────────────────────────────────────────
 * Every parameter carries a Context button beside its label. For parameters a
 * published source has a view on it opens a panel in the workspace to the right,
 * so the control and the record are in one visual field and moving the control
 * moves the panel. For parameters that are a policy judgment it expands one line
 * in place, pointing at the teaching widget rather than at a chart that would
 * dress a choice as a measurement. The registry deciding which is which is
 * src/context/panels.ts.
 */

import { useState } from 'react';

import {
  DEMOGRAPHY_VARIANTS,
  FISCAL_RULE_CHOICES,
  INTEREST_RATE_MODES,
  type CountryOption,
  type DemographyVariant,
  type EngineParams,
  type FiscalRuleChoice,
  type InterestRateMode,
} from '../engine/adapter';
import {
  EXPLORER_DEFAULTS_NOTE,
  FEEDBACK_EMAIL,
  INTEREST_RATE_MODE_HELP,
  PARAM_GUIDANCE,
} from '../content/guidance';
import {
  RATIONALE_MAX_LENGTH,
  formatParam,
  type ParamKey,
} from '../content/params';
import { PARAM_CONTEXT, type PanelKey } from '../context/panels';
import type { RationaleNotes } from '../run/manifest';
import { ContextButton } from './context/ContextButton';
import { InfoTip } from './InfoTip';
import { NumberField } from './numberField';

interface Props {
  params: EngineParams;
  countries: CountryOption[];
  defaults: EngineParams;
  notes: RationaleNotes;
  onChange: (patch: Partial<EngineParams>) => void;
  onNoteChange: (key: ParamKey, note: string) => void;
  onReset: () => void;
  /** Which context panel the workspace is showing, if any. */
  openPanel: PanelKey | null;
  onOpenPanel: (panel: PanelKey | null) => void;
}

interface FieldProps {
  label: string;
  help: string;
  guideUrl?: string;
  htmlFor: string;
  children: React.ReactNode;
  /** Rendered under the control, like the Shiny app's `param-help` paragraphs. */
  note?: string;
  /** Which parameter this field sets, for the provenance row and the rationale. */
  paramKey: ParamKey;
  changed: boolean;
  /** Formatted Explorer default, shown when the value has been moved off it. */
  defaultDisplay: string;
  rationale: string;
  onRationaleChange: (note: string) => void;
  /** True when this field's context panel is the one on screen. */
  contextOpen: boolean;
  onContextToggle: () => void;
  /** Rendered under the control when this is a judgment parameter. */
  contextNote?: React.ReactNode;
}

function Field({
  label,
  help,
  guideUrl,
  htmlFor,
  children,
  note,
  paramKey,
  changed,
  defaultDisplay,
  rationale,
  onRationaleChange,
  contextOpen,
  onContextToggle,
  contextNote,
}: FieldProps) {
  // The rationale field opens when the value is changed, and stays open while
  // there is text in it, so a note is never hidden by putting a value back.
  const showRationale = changed || rationale.length > 0;
  const rationaleId = `${htmlFor}-rationale`;

  return (
    <div className={`field${changed ? ' field--changed' : ''}`}>
      <div className="field__label-row">
        <label className="field__label" htmlFor={htmlFor}>
          {label}
        </label>
        {/*
          The badge appears only when the value has moved.

          It used to read "Default" on every row, which put nine identical
          all-caps tags down a 300px sidebar and squeezed the label column hard
          enough that "Demography variant" and "Productivity growth, long run
          (%)" wrapped with an orphaned word. The label is the most important
          text in the row and it was getting the least space.

          Nothing is lost. The resting state is stated once, in the summary line
          at the foot of the sidebar ("All parameters are at the engine
          defaults"), and in full in the export annex, which lists every
          parameter with its state whether it moved or not. What is left here is
          the one thing that carries information at a glance: which rows the
          analyst has touched.
        */}
        {changed && (
          <span
            className="tag tag--changed"
            title={`Changed from the Explorer default of ${defaultDisplay}`}
          >
            Changed
          </span>
        )}
        <InfoTip text={help} href={guideUrl} label={label} />
        <ContextButton
          label={label}
          open={contextOpen}
          kind={PARAM_CONTEXT[paramKey]?.kind === 'panel' ? 'panel' : 'note'}
          onClick={onContextToggle}
        />
      </div>
      {children}
      {note && <p className="field__note">{note}</p>}
      {contextNote}
      {changed && (
        <p className="field__provenance">Explorer default: {defaultDisplay}</p>
      )}
      {showRationale && (
        <div className="rationale">
          <label className="rationale__label" htmlFor={rationaleId}>
            Why this value?
          </label>
          <input
            id={rationaleId}
            className="rationale__input"
            type="text"
            maxLength={RATIONALE_MAX_LENGTH}
            placeholder="One line, for the report annex"
            value={rationale}
            onChange={(e) => onRationaleChange(e.target.value)}
            data-param={paramKey}
          />
        </div>
      )}
    </div>
  );
}

export function Sidebar({
  params,
  countries,
  defaults,
  notes,
  onChange,
  onNoteChange,
  onReset,
  openPanel,
  onOpenPanel,
}: Props) {
  // Which judgment parameter has its one-line context expanded. Local to the
  // sidebar because, unlike the panel, nothing outside it needs to know.
  const [openNote, setOpenNote] = useState<ParamKey | null>(null);
  const changedKeys = (Object.keys(defaults) as ParamKey[]).filter(
    (k) => params[k] !== defaults[k],
  );
  const isDirty = changedKeys.length > 0;
  const undocumented = changedKeys.filter((k) => !notes[k]?.trim());

  /**
   * Everything a Field derives from its parameter key: the provenance row, the
   * rationale binding, and the context affordance. One helper rather than three
   * spreads, so a new per-parameter concern lands in one place.
   */
  const forParam = (key: ParamKey) => {
    const ctx = PARAM_CONTEXT[key];
    const isPanel = ctx?.kind === 'panel';
    const open = isPanel ? openPanel === ctx.panel : openNote === key;

    return {
      paramKey: key,
      changed: params[key] !== defaults[key],
      defaultDisplay: formatParam(key, defaults[key]),
      rationale: notes[key] ?? '',
      onRationaleChange: (note: string) => onNoteChange(key, note),
      contextOpen: open,
      onContextToggle: () => {
        if (isPanel) {
          // Opening a panel closes any expanded note, and vice versa: two
          // kinds of context showing at once is two answers to one question.
          setOpenNote(null);
          onOpenPanel(open ? null : ctx.panel);
        } else {
          onOpenPanel(null);
          setOpenNote(open ? null : key);
        }
      },
      contextNote:
        ctx && ctx.kind === 'note' && open ? (
          <div className="ctxnote">
            <p className="ctxnote__text">{ctx.text}</p>
            {ctx.href && (
              <a className="ctxnote__link" href={ctx.href}>
                {ctx.linkText}
              </a>
            )}
          </div>
        ) : undefined,
    };
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__head">
        <h1 className="sidebar__title">Q-CRAFT Explorer</h1>
        <p className="sidebar__subtitle">Based on the IMF’s Q-CRAFT methodology</p>
        <p className="sidebar__attribution">by Teal Insights &amp; NatureFinance</p>
      </div>

      <Field
        label="Country"
        htmlFor="country"
        {...forParam('iso3c')}
        help={PARAM_GUIDANCE.country.help}
        guideUrl={PARAM_GUIDANCE.country.guideUrl}
        note={
          countries.length === 1
            ? 'Fixture data covers Uganda only until the projection engine is wired in.'
            : undefined
        }
      >
        <select
          id="country"
          className="control"
          value={params.iso3c}
          onChange={(e) => onChange({ iso3c: e.target.value })}
        >
          {countries.map((c) => (
            <option key={c.iso3c} value={c.iso3c}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Demography variant"
        htmlFor="demography"
        {...forParam('demography_variant')}
        help={PARAM_GUIDANCE.demographyVariant.help}
        guideUrl={PARAM_GUIDANCE.demographyVariant.guideUrl}
      >
        <select
          id="demography"
          className="control"
          value={params.demography_variant}
          onChange={(e) =>
            onChange({ demography_variant: e.target.value as DemographyVariant })
          }
        >
          {DEMOGRAPHY_VARIANTS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </Field>

      <h2 className="sidebar__section">Growth assumptions</h2>

      <Field
        label="Productivity growth, start (%)"
        htmlFor="prod-start"
        {...forParam('productivity_start')}
        help={PARAM_GUIDANCE.productivityStart.help}
      >
        <NumberField
          id="prod-start"
          step={0.1}
          min={-5}
          max={15}
          value={params.productivity_start}
          onCommit={(v) => onChange({ productivity_start: v })}
        />
      </Field>

      <Field
        label="Productivity growth, long run (%)"
        htmlFor="prod-end"
        {...forParam('productivity_end')}
        help={PARAM_GUIDANCE.productivityEnd.help}
      >
        <NumberField
          id="prod-end"
          step={0.1}
          min={-5}
          max={15}
          value={params.productivity_end}
          onCommit={(v) => onChange({ productivity_end: v })}
        />
      </Field>

      <Field
        label="Inflation, start (%)"
        htmlFor="infl-start"
        {...forParam('inflation_start')}
        help={PARAM_GUIDANCE.inflationStart.help}
      >
        <NumberField
          id="infl-start"
          step={0.1}
          min={0}
          max={50}
          value={params.inflation_start}
          onCommit={(v) => onChange({ inflation_start: v })}
        />
      </Field>

      <Field
        label="Inflation, long run (%)"
        htmlFor="infl-end"
        {...forParam('inflation_end')}
        help={PARAM_GUIDANCE.inflationEnd.help}
      >
        <NumberField
          id="infl-end"
          step={0.1}
          min={0}
          max={50}
          value={params.inflation_end}
          onCommit={(v) => onChange({ inflation_end: v })}
        />
      </Field>

      <Field
        label="Interest-rate approach"
        htmlFor="interest-mode"
        {...forParam('interest_rate_mode')}
        help={PARAM_GUIDANCE.interestRateMode.help}
        note={INTEREST_RATE_MODE_HELP[params.interest_rate_mode]}
      >
        <select
          id="interest-mode"
          className="control"
          value={params.interest_rate_mode}
          onChange={(e) =>
            onChange({ interest_rate_mode: e.target.value as InterestRateMode })
          }
        >
          {INTEREST_RATE_MODES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </Field>

      <h2 className="sidebar__section">Fiscal policy</h2>

      <Field
        label="Debt target (% GDP)"
        htmlFor="debt-target"
        {...forParam('debt_target')}
        help={PARAM_GUIDANCE.debtTarget.help}
        guideUrl={PARAM_GUIDANCE.debtTarget.guideUrl}
      >
        <NumberField
          id="debt-target"
          step={1}
          min={0}
          max={200}
          value={params.debt_target}
          onCommit={(v) => onChange({ debt_target: v })}
        />
      </Field>

      <Field
        label="Fiscal rule"
        htmlFor="fiscal-rule"
        {...forParam('fiscal_rule')}
        help={PARAM_GUIDANCE.fiscalRule.help}
        guideUrl={PARAM_GUIDANCE.fiscalRule.guideUrl}
      >
        <select
          id="fiscal-rule"
          className="control"
          value={params.fiscal_rule}
          onChange={(e) => onChange({ fiscal_rule: e.target.value as FiscalRuleChoice })}
        >
          {FISCAL_RULE_CHOICES.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </Field>

      <h2 className="sidebar__section">Climate scenarios</h2>

      <Field
        label="Expenditure rigidity"
        htmlFor="rigidity"
        {...forParam('expenditure_rigidity')}
        help={PARAM_GUIDANCE.expenditureRigidity.help}
        guideUrl={PARAM_GUIDANCE.expenditureRigidity.guideUrl}
        note={
          params.expenditure_rigidity >= 0.5
            ? `${params.expenditure_rigidity.toFixed(1)}: spending holds close to its baseline level as climate slows growth.`
            : `${params.expenditure_rigidity.toFixed(1)}: spending moves toward its baseline share of GDP as climate slows growth.`
        }
      >
        <input
          id="rigidity"
          className="control control--range"
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={params.expenditure_rigidity}
          onChange={(e) => onChange({ expenditure_rigidity: Number(e.target.value) })}
        />
      </Field>

      <div className="sidebar__foot">
        <p className="sidebar__state">
          {isDirty
            ? `${changedKeys.length} of ${Object.keys(defaults).length} parameters changed from the Explorer defaults.`
            : 'All parameters are at the Explorer defaults.'}
        </p>
        <p className="sidebar__state">{EXPLORER_DEFAULTS_NOTE}</p>
        {undocumented.length > 0 && (
          <p className="sidebar__state sidebar__state--warn">
            {undocumented.length === 1
              ? '1 changed parameter has no rationale note. The report annex will say so.'
              : `${undocumented.length} changed parameters have no rationale note. The report annex will say so.`}
          </p>
        )}
        <button
          type="button"
          className="button button--ghost"
          onClick={onReset}
          disabled={!isDirty}
        >
          Reset to Explorer defaults
        </button>
        <a className="sidebar__feedback" href={FEEDBACK_EMAIL}>
          Send feedback
        </a>
      </div>
    </aside>
  );
}
