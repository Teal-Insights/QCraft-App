/**
 * Climate tab — the GDP channel that drives everything on the Analysis tab.
 *
 * Two charts, matching the Shiny Explorer: real GDP levels, then GDP rebased to
 * 100 at the WEO boundary. The index chart is the readable one — in levels the
 * scenarios are visually indistinguishable because they all compound from the
 * same base — so it states the damage in its title.
 */

import { LineChart } from '../LineChart';
import { TAB_GUIDANCE } from '../../content/guidance';
import type { EngineResult } from '../../engine/adapter';
import { fmtGdp, fmtIndex, gdpIndexSeries, gdpSeries } from '../../selectors';

const HORIZON_YEAR = 2099;

export function ClimateTab({ result }: { result: EngineResult }) {
  const baseYear = result.weoBoundaryYear;
  const indexSeries = gdpIndexSeries(result, baseYear, {
    directLabelKeys: ['Baseline', 'Paris', 'Hot_Unadapted'],
  });

  // How far the worst scenario's GDP sits below baseline at the horizon — the
  // damage the whole fiscal story rests on.
  const atHorizon = indexSeries
    .map((s) => ({
      label: s.label,
      key: s.key,
      value: s.points.find((p) => p.year === HORIZON_YEAR)?.value,
    }))
    .filter((s): s is { label: string; key: string; value: number } => s.value != null);

  const baselineIdx = atHorizon.find((s) => s.key === 'Baseline')?.value;
  const worst = atHorizon
    .filter((s) => s.key !== 'Baseline')
    .sort((a, b) => a.value - b.value)[0];

  const shortfall =
    baselineIdx != null && worst
      ? ((baselineIdx - worst.value) / baselineIdx) * 100
      : undefined;

  const indexTitle =
    shortfall != null && worst
      ? `${worst.label} leaves GDP ${shortfall.toFixed(0)}% below baseline by ${HORIZON_YEAR}`
      : `GDP index (${baseYear} = 100)`;

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
        title={indexTitle}
        subtitle={TAB_GUIDANCE.climate.index}
        height={420}
        weoBoundaryYear={result.weoBoundaryYear}
        format={fmtIndex}
        series={indexSeries}
      />

      <LineChart
        title="In levels the damage is invisible — every scenario compounds from the same base"
        subtitle="Real GDP, LCU billions. This is why the index above is the chart to read: exponential growth swamps the differences between scenarios."
        height={380}
        weoBoundaryYear={result.weoBoundaryYear}
        format={fmtGdp}
        series={gdpSeries(result, { directLabelKeys: ['Baseline'] })}
      />
    </div>
  );
}
