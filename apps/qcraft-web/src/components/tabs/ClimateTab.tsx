/**
 * Climate tab: the GDP channel that drives everything on the Analysis tab.
 *
 * The two registers plot different quantities here, which no other chart does.
 * The workbook register shows the Shiny Explorer's own views, real GDP in
 * levels and the same series indexed to the WEO boundary year. The briefing
 * register shows the deviation from baseline, because the index cannot carry
 * the message: real GDP grows roughly tenfold over the horizon, so a 6% climate
 * shortfall is about a line width and all seven paths sit on top of each other.
 * `charts/specs.ts` carries the full note and both subtitles say what is
 * plotted.
 */

import { ChartStack } from '../ChartStack';
import { TAB_GUIDANCE } from '../../content/guidance';
import type { EngineParams, EngineResult } from '../../engine/adapter';
import { chartsForTab } from '../../charts/specs';
import type { ChartRegisterState } from '../../charts/useChartRegister';

interface Props {
  result: EngineResult;
  params: EngineParams;
  defaults: EngineParams;
  registers: ChartRegisterState;
}

export function ClimateTab({ result, params, defaults, registers }: Props) {
  const charts = chartsForTab({ result, params, defaults }, 'Climate');

  return (
    <div className="tab">
      <div className="tab__head">
        <h2 className="tab__title">Climate GDP impact</h2>
        <a
          className="tab__guide"
          href={TAB_GUIDANCE.climate.guideUrl}
          target="_blank"
          rel="noreferrer"
        >
          How to interpret these results →
        </a>
      </div>
      <p className="tab__lede">{TAB_GUIDANCE.climate.explainer}</p>

      <ChartStack charts={charts} registers={registers} />
    </div>
  );
}
