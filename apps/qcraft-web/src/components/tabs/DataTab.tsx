/**
 * Data tab: the numbers behind the charts, plus CSV export.
 *
 * This doubles as the data-table accessibility fallback for every chart in the
 * app: anything a line encodes is readable here as text.
 *
 * Export mirrors the Shiny app's two downloads (baseline only; all scenarios
 * stacked with a `scenario` column). Both now go through the same builder the
 * export packet uses, so a CSV downloaded here carries the same run manifest
 * below its data as one that came out of the packet. A forwarded spreadsheet
 * should not be the one copy of the numbers with no provenance attached.
 */

import { useMemo, useState } from 'react';

import { TAB_GUIDANCE } from '../../content/guidance';
import type { EngineParams, EngineResult, ScenarioKey } from '../../engine/adapter';
import type { PacketCharts } from '../../charts/register';
import {
  buildRunManifest,
  runFileStem,
  type RationaleNotes,
} from '../../run/manifest';
import {
  buildAllScenariosCsv,
  buildScenarioCsv,
  RESULT_COLUMNS as COLUMNS,
} from '../../export/resultsCsv';

interface Props {
  result: EngineResult;
  params: EngineParams;
  defaults: EngineParams;
  notes: RationaleNotes;
  /** The chart register in force, so an exported CSV's manifest records it. */
  charts: PacketCharts;
}

function download(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function DataTab({ result, params, defaults, notes, charts }: Props) {
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>('Baseline');
  const scenario = result.scenarios.find((s) => s.key === scenarioKey);

  const rows = useMemo(() => scenario?.fiscal ?? [], [scenario]);

  /** Stamped at the moment of the click, like the packet's. */
  const manifest = () =>
    buildRunManifest({ params, defaults, notes, charts, result, now: new Date() });

  const exportOne = () => {
    if (!scenario) return;
    const m = manifest();
    download(
      `${runFileStem(m)}-${scenario.key}.csv`,
      buildScenarioCsv(result, scenario.key, m),
    );
  };

  const exportAll = () => {
    const m = manifest();
    download(`${runFileStem(m)}-results.csv`, buildAllScenariosCsv(result, m));
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
