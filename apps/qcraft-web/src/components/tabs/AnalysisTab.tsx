/**
 * Analysis tab: all seven paths on one axis.
 *
 * The point of this tab is the SPREAD, so the cards state the two ends of it
 * and the briefing register measures it on the chart with a bracket at the
 * horizon.
 *
 * The spread callout under the cards shows only in the briefing register. In
 * the workbook register the job is recognition, and an editorial paragraph
 * telling the reader what the chart means is not part of what the workbook
 * produces.
 */

import { ChartStack } from '../ChartStack';
import { StatCard } from '../StatCard';
import { BELOW_ZERO_TILE_CLAUSE, TAB_GUIDANCE } from '../../content/guidance';
import type { EngineParams, EngineResult } from '../../engine/adapter';
import { HORIZON_YEAR, chartsForTab } from '../../charts/specs';
import type { ChartRegisterState } from '../../charts/useChartRegister';
import { CARD_YEAR, findScenario, fmtPct, scenarioSpread, valueAt } from '../../selectors';

interface Props {
  result: EngineResult;
  params: EngineParams;
  defaults: EngineParams;
  registers: ChartRegisterState;
}

export function AnalysisTab({ result, params, defaults, registers }: Props) {
  const spread = scenarioSpread(result, HORIZON_YEAR);
  const baseline = findScenario(result, 'Baseline');
  const charts = chartsForTab({ result, params, defaults }, 'Analysis');

  const fan = charts.find((c) => c.id === 'analysis-debt');
  const fanRegister = fan ? registers.registerFor(fan.id) : 'workbook';

  return (
    <div className="tab">
      <div className="tab__head">
        <h2 className="tab__title">Scenario comparison</h2>
        <a
          className="tab__guide"
          href={TAB_GUIDANCE.analysis.guideUrl}
          target="_blank"
          rel="noreferrer"
        >
          How to interpret these results →
        </a>
      </div>
      <p className="tab__lede">{TAB_GUIDANCE.analysis.lede}</p>

      <div className="cards">
        <StatCard
          label={`Baseline debt (${CARD_YEAR})`}
          value={
            baseline
              ? fmtPct(valueAt(baseline, CARD_YEAR, 'debt_to_gdp') ?? Number.NaN)
              : 'n/a'
          }
          detail={
            baseline
              ? `${HORIZON_YEAR}: ${fmtPct(valueAt(baseline, HORIZON_YEAR, 'debt_to_gdp') ?? Number.NaN)}`
              : undefined
          }
        />
        {spread && (
          <>
            <StatCard
              label={`Best climate outcome (${HORIZON_YEAR})`}
              value={fmtPct(spread.best.value)}
              detail={spread.best.label}
            />
            <StatCard
              label={`Worst climate outcome (${HORIZON_YEAR})`}
              value={fmtPct(spread.worst.value)}
              // The same clause the exported key figures have carried since
              // CC-3. Without it this card showed minus 473 per cent of GDP
              // with only a scenario name beside it, while the report built
              // from the same run explained it.
              detail={
                spread.worst.value < 0
                  ? `${spread.worst.label}. ${BELOW_ZERO_TILE_CLAUSE}`
                  : spread.worst.label
              }
              tone="negative"
            />
          </>
        )}
      </div>

      {spread && fanRegister === 'briefing' && (
        <p className="tab__callout">
          By {HORIZON_YEAR} the gap between <strong>{spread.best.label}</strong> and{' '}
          <strong>{spread.worst.label}</strong> is{' '}
          <strong>{spread.spread.toFixed(1)} points of GDP</strong>. That gap is the
          climate-fiscal risk: the same country, the same fiscal rule, only the warming
          pathway differs.
        </p>
      )}

      <ChartStack charts={charts} registers={registers} />
    </div>
  );
}
