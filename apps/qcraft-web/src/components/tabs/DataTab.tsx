/**
 * Data tab — the numbers behind the charts, plus CSV export.
 *
 * This doubles as the data-table accessibility fallback for every chart in the
 * app: anything a line encodes is readable here as text.
 *
 * Export mirrors the Shiny app's two downloads (baseline only; all scenarios
 * stacked with a `scenario` column) and is built client-side with a Blob — there
 * is no server in this build.
 */

import { useMemo, useState } from 'react';

import { TAB_GUIDANCE } from '../../content/guidance';
import type { EngineResult, ScenarioKey } from '../../engine/adapter';

const COLUMNS = [
  { key: 'year', label: 'Year', digits: 0 },
  { key: 'debt_to_gdp', label: 'Debt/GDP (%)', digits: 2 },
  { key: 'revenue_percent_gdp', label: 'Revenue (% GDP)', digits: 2 },
  { key: 'primary_expenditure_percent_gdp', label: 'Prim. exp. (% GDP)', digits: 2 },
  { key: 'primary_balance_percent_gdp', label: 'Prim. balance (% GDP)', digits: 2 },
  { key: 'interest_expenditure_percent_gdp', label: 'Interest (% GDP)', digits: 2 },
  { key: 'overall_balance_percent_gdp', label: 'Overall balance (% GDP)', digits: 2 },
] as const;

function download(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function DataTab({ result }: { result: EngineResult }) {
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>('Baseline');
  const scenario = result.scenarios.find((s) => s.key === scenarioKey);

  const rows = useMemo(() => scenario?.fiscal ?? [], [scenario]);

  const exportOne = () => {
    if (!scenario) return;
    const header = COLUMNS.map((c) => c.key).join(',');
    const body = scenario.fiscal
      .map((f) => COLUMNS.map((c) => f[c.key]).join(','))
      .join('\n');
    download(`qcraft_${result.iso3c}_${scenario.key}.csv`, `${header}\n${body}`);
  };

  const exportAll = () => {
    const header = ['scenario', ...COLUMNS.map((c) => c.key)].join(',');
    const body = result.scenarios
      .flatMap((s) => s.fiscal.map((f) => [s.key, ...COLUMNS.map((c) => f[c.key])].join(',')))
      .join('\n');
    download(`qcraft_${result.iso3c}_all_scenarios.csv`, `${header}\n${body}`);
  };

  return (
    <div className="tab">
      <div className="tab__head">
        <h2 className="tab__title">Data explorer</h2>
        <a
          className="tab__guide"
          href={TAB_GUIDANCE.data.guideUrl}
          target="_blank"
          rel="noreferrer"
        >
          About the data →
        </a>
      </div>

      <div className="data-controls">
        <label className="data-controls__label" htmlFor="data-scenario">
          Scenario
        </label>
        <select
          id="data-scenario"
          className="control"
          value={scenarioKey}
          onChange={(e) => setScenarioKey(e.target.value as ScenarioKey)}
        >
          {result.scenarios.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <button type="button" className="button" onClick={exportOne}>
          Download this scenario (CSV)
        </button>
        <button type="button" className="button" onClick={exportAll}>
          Download all scenarios (CSV)
        </button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <caption className="visually-hidden">
            {scenario?.label} fiscal projection for {result.countryName}, {rows[0]?.year} to{' '}
            {rows[rows.length - 1]?.year}
          </caption>
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th key={c.key} scope="col">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.year}>
                {COLUMNS.map((c) => (
                  <td key={c.key}>{row[c.key].toFixed(c.digits)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
