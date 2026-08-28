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
 * A third notice, added at the freeze on Teal's 2026-08-28 decision, names the
 * anchor year for a country whose source stops reporting before the release
 * ends. That one is informational rather than a warning: the projection is
 * sound, it simply rests on an older anchor than the reader would assume, and
 * the workbook would not compute it at all. It carries no severity modifier for
 * that reason. See .change-requests/FISCAL-ANCHOR-2026-08-27.md.
 *
 * Every word comes from src/content/modes.ts.
 */

import {
  ANCHOR_SHIFT,
  MODES,
  NO_CLIMATE_DATA,
  UNAVAILABLE,
  type ModeId,
} from '../content/modes';
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

/**
 * The anchor-shift notice.
 *
 * Rendered wherever results are, beside the climate-coverage notice, because
 * the anchor year is a property of every number on every tab and not of one
 * chart.
 */
export function AnchorShiftNotice({
  countryName,
  anchorYear,
  sourceMaxYear,
}: {
  countryName: string;
  anchorYear: number;
  sourceMaxYear: number;
}) {
  return (
    <div className="notice" role="status">
      <p className="notice__lead">
        <strong>{ANCHOR_SHIFT.heading}.</strong>{' '}
        {ANCHOR_SHIFT.line(countryName, anchorYear, sourceMaxYear)}
      </p>
      <p className="notice__params-lead">{ANCHOR_SHIFT.action}</p>
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
  /**
   * Whether the other mode can actually project this country. `null` while the
   * check is still running: an offer that has not been checked yet is made
   * without a promise attached to it.
   */
  otherModeWorks: boolean | null;
}

export function ProjectionUnavailableNotice({
  countryName,
  mode,
  block,
  detail,
  onTryOtherMode,
  otherMode,
  otherModeWorks,
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

      {otherModeWorks === true && (
        <p className="notice__params-lead">
          {countryName} does run in {MODES[otherMode].label} mode (
          {MODES[otherMode].vintageLabel}).{' '}
          <button type="button" className="link-button" onClick={onTryOtherMode}>
            Switch to {MODES[otherMode].label} mode
          </button>
        </p>
      )}

      {otherModeWorks === false && (
        <p className="notice__params-lead">{UNAVAILABLE.bothModes}</p>
      )}

      {otherModeWorks === null && (
        <p className="notice__params-lead">{UNAVAILABLE.checkingOther}</p>
      )}

      <p className="notice__source">Engine reported: {detail}</p>
    </div>
  );
}

/**
 * What to do when a country will not project.
 *
 * A separate block below the notice rather than another paragraph inside it:
 * the notice is the bad news and this is the way on, and running them together
 * makes the way on read as more bad news. It also stops the workspace ending
 * in blank space, which is what a blocked country used to look like.
 */
export function BlockedNextSteps({ onAbout }: { onAbout: () => void }) {
  return (
    <div className="nextsteps">
      <p className="nextsteps__lead">{UNAVAILABLE.whereNext}</p>
      <p className="nextsteps__actions">
        <button type="button" className="link-button" onClick={onAbout}>
          Open About the data
        </button>
      </p>
    </div>
  );
}
