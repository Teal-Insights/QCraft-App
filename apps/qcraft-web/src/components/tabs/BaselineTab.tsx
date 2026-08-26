/**
 * Baseline tab — summary cards + the three baseline charts, mirroring the Shiny
 * Explorer's Baseline panel (debt-to-GDP; revenue vs expenditure; the two
 * balances).
 */

import { LineChart } from '../LineChart';
import { StatCard } from '../StatCard';
import { TAB_GUIDANCE } from '../../content/guidance';
import { series as palette } from '../../theme';
import type { EngineResult } from '../../engine/adapter';
import { CARD_YEAR, findScenario, fmtPct, valueAt } from '../../selectors';

export function BaselineTab({ result }: { result: EngineResult }) {
  const baseline = findScenario(result, 'Baseline');
  if (!baseline) return null;

  const debt2050 = valueAt(baseline, CARD_YEAR, 'debt_to_gdp');
  const revenue2050 = valueAt(baseline, CARD_YEAR, 'revenue_percent_gdp');
  const balance2050 = valueAt(baseline, CARD_YEAR, 'primary_balance_percent_gdp');

  const points = baseline.fiscal.map((f) => ({ year: f.year, value: f.debt_to_gdp }));
  const last = points[points.length - 1];
  const peak = points.reduce((a, b) => (b.value > a.value ? b : a), points[0]);
  const start = points.find((p) => p.year === result.weoBoundaryYear) ?? points[0];

  // Title states the finding, not the variable.
  const direction = last.value > start.value ? 'rises to' : 'settles at';
  const debtTitle = `Baseline debt ${direction} ${fmtPct(last.value)} of GDP by ${last.year}`;

  return (
    <div className="tab">
      <div className="tab__head">
        <h2 className="tab__title">Baseline projection — {result.countryName}</h2>
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
          value={debt2050 != null ? fmtPct(debt2050) : '—'}
        />
        <StatCard
          label={`Revenue (${CARD_YEAR}, % GDP)`}
          value={revenue2050 != null ? fmtPct(revenue2050) : '—'}
        />
        <StatCard
          label={`Primary balance (${CARD_YEAR}, % GDP)`}
          value={balance2050 != null ? fmtPct(balance2050) : '—'}
          tone={balance2050 != null && balance2050 < 0 ? 'negative' : 'neutral'}
        />
      </div>

      <LineChart
        title={debtTitle}
        subtitle={TAB_GUIDANCE.baseline.weo}
        height={400}
        weoBoundaryYear={result.weoBoundaryYear}
        series={[
          {
            key: 'Baseline',
            label: 'Baseline',
            color: palette.baseline,
            emphasis: true,
            directLabel: true,
            points,
          },
        ]}
        annotation={{
          year: peak.year,
          value: peak.value,
          text: `Peak ${fmtPct(peak.value)} in ${peak.year}`,
          color: palette.baseline,
        }}
      />

      <div className="chart-row">
        <LineChart
          title="Expenditure converges toward revenue as the fiscal rule bites"
          subtitle={TAB_GUIDANCE.baseline.revExp}
          height={320}
          weoBoundaryYear={result.weoBoundaryYear}
          series={[
            {
              key: 'revenue',
              label: 'Revenue',
              color: palette.duo[0],
              directLabel: true,
              points: baseline.fiscal.map((f) => ({
                year: f.year,
                value: f.revenue_percent_gdp,
              })),
            },
            {
              key: 'expenditure',
              label: 'Primary expenditure',
              color: palette.duo[1],
              directLabel: true,
              points: baseline.fiscal.map((f) => ({
                year: f.year,
                value: f.primary_expenditure_percent_gdp,
              })),
            },
          ]}
        />

        <LineChart
          title="Interest payments keep the overall balance in deficit"
          subtitle={TAB_GUIDANCE.baseline.balances}
          height={320}
          weoBoundaryYear={result.weoBoundaryYear}
          zeroLine
          series={[
            {
              key: 'primary',
              label: 'Primary balance',
              color: palette.duo[0],
              directLabel: true,
              points: baseline.fiscal.map((f) => ({
                year: f.year,
                value: f.primary_balance_percent_gdp,
              })),
            },
            {
              key: 'overall',
              label: 'Overall balance',
              color: palette.duo[1],
              directLabel: true,
              points: baseline.fiscal.map((f) => ({
                year: f.year,
                value: f.overall_balance_percent_gdp,
              })),
            },
          ]}
        />
      </div>
    </div>
  );
}
