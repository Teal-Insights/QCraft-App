/**
 * The two honest notices about what a country's data can and cannot support.
 *
 * ── Why these exist ───────────────────────────────────────────────────────────
 * Eleven of the 175 selectable countries carry an all-zero climate slice, so all
 * six scenarios land exactly on the baseline (INTEGRATION-REPORT.md section
 * 7.2). Without a word on screen, a trainee who picks the Maldives sees six
 * lines drawn on top of each other and reads it as "warming has no fiscal effect
 * here". The dataset is temperature-driven and simply does not cover those
 * economies, and sea-level rise, the channel that matters most for them, is
 * outside this model everywhere.
 *
 * Two more countries throw outright, and two have no debt figure at the year the
 * projection anchors on. Those get a different sentence, because "we cannot
 * compute this" and "we could draw something but you should not cite it" are
 * different statements to a ministry.
 *
 * Every word comes from src/content/modes.ts.
 */

import { MODES, NO_CLIMATE_DATA, UNAVAILABLE, type ModeId } from '../content/modes';
import type { ProjectionBlock } from '../engine/adapter';

export function NoClimateDataNotice({ countryName }: { countryName: string }) {
  return (
    <div className="notice notice--warn" role="status">
      <p className="notice__lead">
        <strong>{NO_CLIMATE_DATA.heading}.</strong> {NO_CLIMATE_DATA.body}
      </p>
      <p className="notice__params-lead">
        {NO_CLIMATE_DATA.action} Every scenario line for {countryName} lies on the
        baseline because the estimate is absent, not because it is zero.
      </p>
    </div>
  );
}

interface UnavailableProps {
  countryName: string;
  mode: ModeId;
  block: ProjectionBlock;
  detail: string;
  /** Offer to switch, since coverage differs between vintages. */
  onTryOtherMode: () => void;
  otherMode: ModeId;
}

export function ProjectionUnavailableNotice({
  countryName,
  mode,
  block,
  detail,
  onTryOtherMode,
  otherMode,
}: UnavailableProps) {
  const body =
    block === 'no-debt-anchor' ? UNAVAILABLE.unreliable : UNAVAILABLE.missingInputs;

  return (
    <div className="notice notice--stop" role="alert">
      <p className="notice__lead">
        <strong>{UNAVAILABLE.heading}.</strong> {body}
      </p>
      <p className="notice__params-lead">
        {countryName}, {MODES[mode].label} mode ({MODES[mode].vintageLabel}).
      </p>
      <p className="notice__params-lead">
        {UNAVAILABLE.tryOther}{' '}
        <button type="button" className="link-button" onClick={onTryOtherMode}>
          Try {MODES[otherMode].label} mode
        </button>
      </p>
      <p className="notice__source">Engine reported: {detail}</p>
    </div>
  );
}
