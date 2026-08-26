/**
 * Q-CRAFT Explorer shell — sidebar + tabbed workspace.
 *
 * The whole app is one `useState` of `EngineParams` fed through the engine
 * adapter. No data fetching, no router: this ships as a static bundle that must
 * work from a file:// open in a training room with no network.
 */

import { useMemo, useState } from 'react';

import { engine, type EngineParams } from './engine/adapter';
import { Sidebar } from './components/Sidebar';
import { ProvenanceNotice } from './components/ProvenanceNotice';
import { BaselineTab } from './components/tabs/BaselineTab';
import { AnalysisTab } from './components/tabs/AnalysisTab';
import { ClimateTab } from './components/tabs/ClimateTab';
import { DataTab } from './components/tabs/DataTab';
import { MethodologyTab } from './components/tabs/MethodologyTab';
import { FEEDBACK_EMAIL, GITHUB_URL, GUIDE_URLS, INTRO_TEXT } from './content/guidance';

const TABS = ['Baseline', 'Analysis', 'Climate', 'Data', 'Methodology'] as const;
type TabName = (typeof TABS)[number];

export default function App() {
  const defaults = useMemo(() => engine.defaults(), []);
  const countries = useMemo(() => engine.listCountries(), []);
  const [params, setParams] = useState<EngineParams>(defaults);
  const [tab, setTab] = useState<TabName>('Baseline');

  const result = useMemo(() => engine.run(params), [params]);

  const patch = (next: Partial<EngineParams>) =>
    setParams((prev) => ({ ...prev, ...next }));

  return (
    <div className="app">
      <Sidebar
        params={params}
        defaults={defaults}
        countries={countries}
        onChange={patch}
        onReset={() => setParams(defaults)}
      />

      <main className="main">
        <div className="intro">
          <p>{INTRO_TEXT}</p>
          <p className="intro__links">
            <a href={GUIDE_URLS.home} target="_blank" rel="noreferrer">
              Companion Guide
            </a>
            {' | '}
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              GitHub
            </a>
            {' | '}
            <a href={GUIDE_URLS.codesign} target="_blank" rel="noreferrer">
              Get Involved
            </a>
            {' | '}
            <a href={FEEDBACK_EMAIL}>Send Feedback</a>
          </p>
        </div>

        <ProvenanceNotice provenance={result.provenance} />

        <div className="tabs" role="tablist" aria-label="Explorer views">
          {TABS.map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              id={`tab-${name}`}
              aria-selected={tab === name}
              aria-controls={`panel-${name}`}
              className={`tabs__tab${tab === name ? ' tabs__tab--active' : ''}`}
              onClick={() => setTab(name)}
            >
              {name}
            </button>
          ))}
        </div>

        <div
          className="panel"
          role="tabpanel"
          id={`panel-${tab}`}
          aria-labelledby={`tab-${tab}`}
        >
          {tab === 'Baseline' && <BaselineTab result={result} />}
          {tab === 'Analysis' && <AnalysisTab result={result} />}
          {tab === 'Climate' && <ClimateTab result={result} />}
          {tab === 'Data' && <DataTab result={result} />}
          {tab === 'Methodology' && <MethodologyTab />}
        </div>

        <footer className="footer">
          <span>Q-CRAFT Explorer by Teal Insights &amp; NatureFinance</span>
          <span> | MIT Licensed | </span>
          <a href={GUIDE_URLS.home} target="_blank" rel="noreferrer">
            Companion Guide
          </a>
          {' | '}
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
          {' | '}
          <a href={FEEDBACK_EMAIL}>Send Feedback</a>
        </footer>
      </main>
    </div>
  );
}
