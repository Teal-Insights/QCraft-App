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
 */

import { paramLabel, type ParamKey } from '../../content/params';
import type { EngineParams } from '../../engine/adapter';
import { PANEL_PARAMS, PANEL_SLUG, type PanelKey } from '../../context/panels';
import { DemographyPanel } from './DemographyPanel';
import { InterestRatePanel } from './InterestRatePanel';
import { RatePanel } from './RatePanel';

interface Props {
  panel: PanelKey;
  params: EngineParams;
  onClose: () => void;
}

export function ContextPanel({ panel, params, onClose }: Props) {
  const slug = PANEL_SLUG[panel];
  const belongsTo = PANEL_PARAMS[panel].map((key: ParamKey) => paramLabel(key));

  return (
    <div className="cpanel-shell">
      <div className="cpanel-shell__bar">
        <p className="cpanel-shell__kicker">
          Context for {belongsTo.join(' and ')}
        </p>
        <button type="button" className="button button--ghost button--small" onClick={onClose}>
          Back to the charts
        </button>
      </div>

      {panel === 'demography' && (
        <DemographyPanel
          iso3c={params.iso3c}
          variant={params.demography_variant}
          slug={slug}
        />
      )}

      {panel === 'productivity' && (
        <RatePanel
          kind="productivity"
          iso3c={params.iso3c}
          start={params.productivity_start}
          end={params.productivity_end}
          startLabel={paramLabel('productivity_start')}
          endLabel={paramLabel('productivity_end')}
          slug={slug}
        />
      )}

      {panel === 'inflation' && (
        <RatePanel
          kind="inflation"
          iso3c={params.iso3c}
          start={params.inflation_start}
          end={params.inflation_end}
          startLabel={paramLabel('inflation_start')}
          endLabel={paramLabel('inflation_end')}
          slug={slug}
        />
      )}

      {panel === 'interestRate' && (
        <InterestRatePanel
          iso3c={params.iso3c}
          mode={params.interest_rate_mode}
          slug={slug}
        />
      )}
    </div>
  );
}
