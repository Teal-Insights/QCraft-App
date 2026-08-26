/**
 * Climate tab — the GDP channel that drives everything on the Analysis tab.
 *
 * Chart order is deliberate. The Shiny Explorer leads with real GDP in levels
 * and follows with the same series rebased to 2029 = 100. Neither shows the
 * climate damage: Uganda's GDP grows roughly tenfold over the horizon, so a 6%
 * shortfall is about a line width and all seven paths sit on top of each other.
 * Rebasing to 100 does not help, because an index of a tenfold-growing series
 * still runs to ~1,000 and is dominated by growth, not damage.
 *
 * So the lead chart here is the deviation from baseline, which removes growth
 * and leaves only the damage. The index chart follows for parity with the Shiny
 * app, subtitled for what it actually shows — the growth path — rather than the
 * divergence it cannot resolve.
 */

import { LineChart } from '../LineChart';
import { TAB_GUIDANCE } from '../../content/guidance';
import type { EngineResult } from '../../engine/adapter';
import { fmtIndex, gdpIndexSeries, gdpShortfallSeries } from '../../selectors';

const HORIZON_YEAR = 2099;

const fmtSignedPct = (v: number) =>
  `${Math.abs(v) < 0.05 ? '' : v > 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}%`;

export function ClimateTab({ result }: { result: EngineResult }) {
  const baseYear = result.weoBoundaryYear;

  const shortfall = gdpShortfallSeries(result, {
    directLabelKeys: ['Paris', 'Hot_Unadapted'],
  });

  // Worst scenario at the horizon — the damage the fiscal story rests on.
  const worst = shortfall
    .filter((s) => s.key !== 'Baseline')
    .map((s) => ({
      label: s.label,
      value: s.points.find((p) => p.year === HORIZON_YEAR)?.value,
    }))
    .filter((s): s is { label: string; value: number } => s.value != null)
    .sort((a, b) => a.value - b.value)[0];

  const shortfallTitle = worst
    ? `${worst.label} costs Uganda ${Math.abs(worst.value).toFixed(1)}% of GDP by ${HORIZON_YEAR}`
    : 'Real GDP relative to baseline';

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

      <LineChart
        title={shortfallTitle}
        subtitle="Real GDP under each scenario, as a percentage deviation from the baseline path. Baseline is the flat zero line. This is the GDP damage that propagates into revenue, expenditure, and debt on the Analysis tab."
        height={420}
        weoBoundaryYear={result.weoBoundaryYear}
        zeroLine
        format={fmtSignedPct}
        series={shortfall}
      />

      <LineChart
        title={`Every scenario still grows roughly tenfold by ${HORIZON_YEAR}`}
        subtitle={`Real GDP indexed to ${baseYear} = 100 — the Shiny Explorer's view. Growth swamps the climate damage at this scale, which is why the deviation chart above is the one to read for scenario differences.`}
        height={380}
        weoBoundaryYear={result.weoBoundaryYear}
        format={fmtIndex}
        series={gdpIndexSeries(result, baseYear, { directLabelKeys: ['Baseline'] })}
      />
    </div>
  );
}
