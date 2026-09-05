/**
 * The open context panel: a header naming which parameter it belongs to, a way
 * back to the tabs, and the panel itself.
 *
 * The panel replaces the tab strip and tab body rather than sitting above them.
 * The brief asks for the control and its context in one visual field, and the
 * only way to promise that on a laptop is to put nothing else in the field: the
 * sidebar is sticky on the left and this is everything on the right. Scrolling
 * between a slider and the chart it explains is exactly the failure the
 * teaching widgets were built to avoid, and it would be no better here.
 *
 * ── What this component owns, added in run 5 ──────────────────────────────────
 * The peer scope ("compared with whom") lives here rather than inside each
 * panel, so a user who picks their region on productivity still has it on
 * inflation. It is one question and it should be answered once.
 *
 * The rationale note is threaded through from the app for the same reason the
 * panels can write to it at all: a peer comparison is a reason for a value, and
 * the run already carries one free-text reason per parameter. Nothing new is
 * defined here. Panels compose a sentence and the user chooses to add it.
 */

import { useState } from 'react';

import { paramLabel, type ParamKey } from '../../content/params';
import type { ModeId } from '../../content/modes';
import { modeStamp } from '../ModeSwitch';
import type { EngineParams, EngineResult, CountryContext } from '../../engine/adapter';
import {
  PANEL_PARAMS,
  PANEL_RATIONALE_PARAM,
  PANEL_SLUG,
  type PanelKey,
} from '../../context/panels';
import type { RationaleNotes } from '../../run/manifest';
import type { PeerScope } from '../../context/peers';
import { DebtTargetPanel } from './DebtTargetPanel';
import { DemographyPanel } from './DemographyPanel';
import { InterestRatePanel } from './InterestRatePanel';
import { RatePanel } from './RatePanel';
import { RigidityPanel } from './RigidityPanel';
import { peerCountry } from '../../context/peers';

interface Props {
  panel: PanelKey;
  result: EngineResult | null;
  context: CountryContext | null;
  params: EngineParams;
  defaults: EngineParams;
  notes: RationaleNotes;
  onNoteChange: (key: ParamKey, note: string) => void;
  /** Which data vintage the result on screen was computed from. */
  vintage: string;
  /**
   * The data mode the run is in.
   *
   * Shown in the bar because the mode switch is not on screen while a panel is
   * open: the bar is 121px tall and it was pushing these panels' captions and
   * source lines below the fold on a 1440x900 laptop. The stamp is the compact
   * form of the same fact, at the cost of one line in a bar that already exists.
   * Without it a reader in Current mode has nothing on screen saying so, and the
   * record charts below are drawn from the frozen verification extract and
   * labelled as such, which is a difference worth being able to see.
   */
  mode: ModeId;
  countryName: string;
  onClose: () => void;
}

export function ContextPanel({
  panel,
  result,
  context,
  params,
  defaults,
  notes,
  onNoteChange,
  vintage,
  mode,
  countryName,
  onClose,
}: Props) {
  /**
   * Opens on the country's own region rather than on the world, because "how do
   * I compare with countries like mine" is the question people arrive with, and
   * the world view is one click away.
   */
  const [scope, setScope] = useState<PeerScope>(
    peerCountry(params.iso3c)?.region ? 'region' : 'world',
  );

  const slug = PANEL_SLUG[panel];
  const belongsTo = PANEL_PARAMS[panel].map((key: ParamKey) => paramLabel(key));
  const noteKey = PANEL_RATIONALE_PARAM[panel];
  const note = notes[noteKey] ?? '';
  const writeNote = (next: string) => onNoteChange(noteKey, next);
  const peers = { vintage, scope, onScopeChange: setScope, note, onNoteChange: writeNote };

  return (
    <div className="cpanel-shell">
      <div className="cpanel-shell__bar">
        <p className="cpanel-shell__kicker">
          Context for {belongsTo.join(' and ')}
        </p>
        <p className="cpanel-shell__mode">{modeStamp(mode)}</p>
        <button type="button" className="button button--ghost button--small" onClick={onClose}>
          Back to the charts
        </button>
      </div>

      {panel === 'demography' && (
        <DemographyPanel
          iso3c={params.iso3c}
          variant={params.demography_variant}
          slug={slug}
          {...peers}
        />
      )}

      {panel === 'productivity' && (
        <RatePanel
          result={result}
          context={context}
          kind="productivity"
          iso3c={params.iso3c}
          start={params.productivity_start}
          end={params.productivity_end}
          turningPoint={params.productivity_turning_point}
          startLabel={paramLabel('productivity_start')}
          endLabel={paramLabel('productivity_end')}
          slug={slug}
          {...peers}
        />
      )}

      {panel === 'inflation' && (
        <RatePanel
          result={result}
          context={context}
          kind="inflation"
          iso3c={params.iso3c}
          start={params.inflation_start}
          end={params.inflation_end}
          startLabel={paramLabel('inflation_start')}
          endLabel={paramLabel('inflation_end')}
          slug={slug}
          {...peers}
        />
      )}

      {panel === 'interestRate' && (
        <InterestRatePanel
          iso3c={params.iso3c}
          mode={params.interest_rate_mode}
          longRunRealRate={params.long_run_interest_rate}
          slug={slug}
          {...peers}
        />
      )}

      {panel === 'debtTarget' && (
        <DebtTargetPanel
          iso3c={params.iso3c}
          countryName={countryName}
          target={params.debt_target}
          fiscalRule={params.fiscal_rule}
          slug={slug}
          {...peers}
        />
      )}

      {panel === 'rigidity' && (
        <RigidityPanel
          iso3c={params.iso3c}
          countryName={countryName}
          rigidity={params.expenditure_rigidity}
          engineDefault={defaults.expenditure_rigidity}
          slug={slug}
          {...peers}
        />
      )}
    </div>
  );
}
