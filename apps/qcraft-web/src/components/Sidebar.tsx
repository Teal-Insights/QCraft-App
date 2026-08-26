/**
 * Parameter sidebar.
 *
 * Replicates the Shiny Explorer's five controls (country, demography variant,
 * debt target, fiscal rule, expenditure rigidity) and adds the five that were
 * previously fixed inside the pipeline: productivity start and long run,
 * inflation start and end, and the interest-rate approach.
 *
 * Every control opens on the engine default. See ENGINE_DEFAULTS in
 * src/engine/mockAdapter.ts, which cites DEFAULTS in
 * packages/qcraft-engine/src/qcraft_engine/constants.py.
 *
 * ── Assumption provenance ─────────────────────────────────────────────────────
 * Every parameter states whether it is still on the engine default or has been
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
 */

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
  FEEDBACK_EMAIL,
  INTEREST_RATE_MODE_HELP,
  PARAM_GUIDANCE,
} from '../content/guidance';
import { formatParam, type ParamKey } from '../content/params';
import type { RationaleNotes } from '../run/manifest';
import { InfoTip } from './InfoTip';

interface Props {
  params: EngineParams;
  countries: CountryOption[];
  defaults: EngineParams;
  notes: RationaleNotes;
  onChange: (patch: Partial<EngineParams>) => void;
  onNoteChange: (key: ParamKey, note: string) => void;
  onReset: () => void;
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
  /** Formatted engine default, shown when the value has been moved off it. */
  defaultDisplay: string;
  rationale: string;
  onRationaleChange: (note: string) => void;
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
        <span
          className={`tag${changed ? ' tag--changed' : ''}`}
          title={
            changed
              ? `Changed from the engine default of ${defaultDisplay}`
              : 'Still at the engine default'
          }
        >
          {changed ? 'Changed' : 'Default'}
        </span>
        <InfoTip text={help} href={guideUrl} label={label} />
      </div>
      {children}
      {note && <p className="field__note">{note}</p>}
      {changed && (
        <p className="field__provenance">Engine default: {defaultDisplay}</p>
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
            maxLength={200}
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
}: Props) {
  const changedKeys = (Object.keys(defaults) as ParamKey[]).filter(
    (k) => params[k] !== defaults[k],
  );
  const isDirty = changedKeys.length > 0;
  const undocumented = changedKeys.filter((k) => !notes[k]?.trim());

  /** Props every Field needs to render its own provenance row. */
  const provenance = (key: ParamKey) => ({
    paramKey: key,
    changed: params[key] !== defaults[key],
    defaultDisplay: formatParam(key, defaults[key]),
    rationale: notes[key] ?? '',
    onRationaleChange: (note: string) => onNoteChange(key, note),
  });

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
        {...provenance('iso3c')}
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
        {...provenance('demography_variant')}
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
        {...provenance('productivity_start')}
        help={PARAM_GUIDANCE.productivityStart.help}
      >
        <input
          id="prod-start"
          className="control"
          type="number"
          step={0.1}
          min={-5}
          max={15}
          value={params.productivity_start}
          onChange={(e) => onChange({ productivity_start: Number(e.target.value) })}
        />
      </Field>

      <Field
        label="Productivity growth, long run (%)"
        htmlFor="prod-end"
        {...provenance('productivity_end')}
        help={PARAM_GUIDANCE.productivityEnd.help}
      >
        <input
          id="prod-end"
          className="control"
          type="number"
          step={0.1}
          min={-5}
          max={15}
          value={params.productivity_end}
          onChange={(e) => onChange({ productivity_end: Number(e.target.value) })}
        />
      </Field>

      <Field
        label="Inflation, start (%)"
        htmlFor="infl-start"
        {...provenance('inflation_start')}
        help={PARAM_GUIDANCE.inflationStart.help}
      >
        <input
          id="infl-start"
          className="control"
          type="number"
          step={0.1}
          min={0}
          max={50}
          value={params.inflation_start}
          onChange={(e) => onChange({ inflation_start: Number(e.target.value) })}
        />
      </Field>

      <Field
        label="Inflation, long run (%)"
        htmlFor="infl-end"
        {...provenance('inflation_end')}
        help={PARAM_GUIDANCE.inflationEnd.help}
      >
        <input
          id="infl-end"
          className="control"
          type="number"
          step={0.1}
          min={0}
          max={50}
          value={params.inflation_end}
          onChange={(e) => onChange({ inflation_end: Number(e.target.value) })}
        />
      </Field>

      <Field
        label="Interest-rate approach"
        htmlFor="interest-mode"
        {...provenance('interest_rate_mode')}
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
        {...provenance('debt_target')}
        help={PARAM_GUIDANCE.debtTarget.help}
        guideUrl={PARAM_GUIDANCE.debtTarget.guideUrl}
      >
        <input
          id="debt-target"
          className="control"
          type="number"
          step={1}
          min={0}
          max={200}
          value={params.debt_target}
          onChange={(e) => onChange({ debt_target: Number(e.target.value) })}
        />
      </Field>

      <Field
        label="Fiscal rule"
        htmlFor="fiscal-rule"
        {...provenance('fiscal_rule')}
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

      <Field
        label="Expenditure rigidity"
        htmlFor="rigidity"
        {...provenance('expenditure_rigidity')}
        help={PARAM_GUIDANCE.expenditureRigidity.help}
        guideUrl={PARAM_GUIDANCE.expenditureRigidity.guideUrl}
        note={
          params.expenditure_rigidity >= 0.5
            ? `${params.expenditure_rigidity.toFixed(1)}: spending is sticky, it barely adjusts to shocks.`
            : `${params.expenditure_rigidity.toFixed(1)}: spending is flexible, it absorbs shocks.`
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
            ? `${changedKeys.length} of ${Object.keys(defaults).length} parameters changed from the engine defaults.`
            : 'All parameters are at the engine defaults.'}
        </p>
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
          Reset to engine defaults
        </button>
        <a className="sidebar__feedback" href={FEEDBACK_EMAIL}>
          Send feedback
        </a>
      </div>
    </aside>
  );
}
