/**
 * Baseline tab: summary cards plus the three baseline charts.
 *
 * The charts themselves are defined in `charts/specs.ts`, in both registers, and
 * rendered by `ChartStack`. This file holds only what is particular to the tab:
 * its heading, its guide link, and the three summary cards the Shiny Explorer
 * shows at 2050.
 */

import { ChartStack } from '../ChartStack';
import { StatCard } from '../StatCard';
import { TAB_GUIDANCE } from '../../content/guidance';
import type { EngineParams, EngineResult } from '../../engine/adapter';
import { chartsForTab } from '../../charts/specs';
import type { ChartRegisterState } from '../../charts/useChartRegister';
import { CARD_YEAR, findScenario, fmtPct, valueAt } from '../../selectors';

interface Props {
  result: EngineResult;
  params: EngineParams;
  defaults: EngineParams;
  registers: ChartRegisterState;
}

export function BaselineTab({ result, params, defaults, registers }: Props) {
  const baseline = findScenario(result, 'Baseline');
  if (!baseline) return null;

  const debt2050 = valueAt(baseline, CARD_YEAR, 'debt_to_gdp');
  const revenue2050 = valueAt(baseline, CARD_YEAR, 'revenue_percent_gdp');
  const balance2050 = valueAt(baseline, CARD_YEAR, 'primary_balance_percent_gdp');

  const charts = chartsForTab({ result, params, defaults }, 'Baseline');

  return (
    <div className="tab">
      <div className="tab__head">
        <h2 className="tab__title">Baseline projection: {result.countryName}</h2>
        <a
          className="tab__guide"
          href={TAB_GUIDANCE.baseline.guideUrl}
          target="_blank"
          rel="noreferrer"
        >
          How to interpret these results →
        </a>
      </div>

      <div className="cards">
        <StatCard
          label={`Debt-to-GDP (${CARD_YEAR})`}
          value={debt2050 != null ? fmtPct(debt2050) : 'n/a'}
        />
        <StatCard
          label={`Revenue (${CARD_YEAR}, % GDP)`}
          value={revenue2050 != null ? fmtPct(revenue2050) : 'n/a'}
        />
        <StatCard
          label={`Primary balance (${CARD_YEAR}, % GDP)`}
          value={balance2050 != null ? fmtPct(balance2050) : 'n/a'}
          tone={balance2050 != null && balance2050 < 0 ? 'negative' : 'neutral'}
        />
      </div>

      <ChartStack charts={charts} registers={registers} />
    </div>
  );
}
