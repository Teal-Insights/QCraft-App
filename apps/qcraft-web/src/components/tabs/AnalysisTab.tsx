/**
 * Analysis tab — all seven paths on one axis.
 *
 * The point of this tab is the SPREAD: how far apart the climate scenarios pull
 * the debt path by end-of-horizon. So the headline card and the chart title both
 * state the spread, and the two scenarios that bound it are the ones that get
 * direct labels.
 */

import { LineChart } from '../LineChart';
import { StatCard } from '../StatCard';
import { TAB_GUIDANCE } from '../../content/guidance';
import type { EngineResult } from '../../engine/adapter';
import {
  CARD_YEAR,
  fiscalSeries,
  findScenario,
  fmtPct,
  scenarioSpread,
  valueAt,
} from '../../selectors';

/** Last projection year — where the scenarios are furthest apart. */
const HORIZON_YEAR = 2099;

export function AnalysisTab({ result }: { result: EngineResult }) {
  const spread = scenarioSpread(result, HORIZON_YEAR);
  const baseline = findScenario(result, 'Baseline');

  const title = spread
    ? `Climate scenarios spread Uganda’s ${HORIZON_YEAR} debt across ${spread.spread.toFixed(0)} points of GDP`
    : 'Debt-to-GDP under climate scenarios';

  // Label only the bounding scenarios plus the baseline; seven end-labels would
  // be a pile-up and the middle five are read off the legend and the tooltip.
  const directLabelKeys = spread
    ? ([spread.best.key, spread.worst.key, 'Baseline'] as const)
    : (['Baseline'] as const);

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
              detail={spread.worst.label}
              tone="negative"
            />
          </>
        )}
      </div>

      {spread && (
        <p className="tab__callout">
          By {HORIZON_YEAR} the gap between{' '}
          <strong>{spread.best.label}</strong> and{' '}
          <strong>{spread.worst.label}</strong> is{' '}
          <strong>{spread.spread.toFixed(1)} points of GDP</strong>. That gap is
          the climate-fiscal risk: the same country, the same fiscal rule, only
          the warming pathway differs.
        </p>
      )}

      <LineChart
        title={title}
        subtitle="Baseline in navy. Paris-Aligned, Moderate and High are separate damage pathways, each its own colour. The three 3°C scenarios share one colour, darkening as adaptation falls away. They are a family, not rungs on a single severity ladder."
        height={460}
        weoBoundaryYear={result.weoBoundaryYear}
        series={fiscalSeries(result, 'debt_to_gdp', {
          directLabelKeys: [...directLabelKeys],
        })}
      />
    </div>
  );
}
