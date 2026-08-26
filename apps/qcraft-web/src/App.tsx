/**
 * Q-CRAFT Explorer shell: sidebar plus tabbed workspace.
 *
 * The whole app is one `useState` of `EngineParams` fed through the engine
 * adapter, plus one `useState` of the rationale notes attached to those
 * parameters. No data fetching, no router: this ships as a static bundle that
 * must work from a file:// open in a training room with no network.
 *
 * Notes live here rather than in the sidebar because they are run state, not
 * control state: the export packet and the report annex read them, and an
 * imported run restores them alongside the parameters.
 */

import { useMemo, useState } from 'react';

import { engine, type EngineParams } from './engine/adapter';
import type { ParamKey } from './content/params';
import type { PanelKey } from './context/panels';
import { ContextPanel } from './components/context/ContextPanel';
import type { RationaleNotes } from './run/manifest';
import { Sidebar } from './components/Sidebar';
import { ProvenanceNotice } from './components/ProvenanceNotice';
import { BaselineTab } from './components/tabs/BaselineTab';
import { AnalysisTab } from './components/tabs/AnalysisTab';
import { ClimateTab } from './components/tabs/ClimateTab';
import { DataTab } from './components/tabs/DataTab';
import { ExportTab } from './components/tabs/ExportTab';
import { MethodologyTab } from './components/tabs/MethodologyTab';
import { FEEDBACK_EMAIL, GITHUB_URL, GUIDE_URLS, INTRO_TEXT } from './content/guidance';

const TABS = [
  'Baseline',
  'Analysis',
  'Climate',
  'Data',
  'Export',
  'Methodology',
] as const;
type TabName = (typeof TABS)[number];

export default function App() {
  const defaults = useMemo(() => engine.defaults(), []);
  const countries = useMemo(() => engine.listCountries(), []);
  const [params, setParams] = useState<EngineParams>(defaults);
  const [notes, setNotes] = useState<RationaleNotes>({});
  const [tab, setTab] = useState<TabName>('Baseline');
  /**
   * The open parameter context panel, if any. It lives here rather than in the
   * sidebar because it renders in the workspace: the whole point is that the
   * control and its context share one visual field, which they cannot do if the
   * panel is inside the 320px column the control is in.
   */
  const [panel, setPanel] = useState<PanelKey | null>(null);

  const result = useMemo(() => engine.run(params), [params]);

  const patch = (next: Partial<EngineParams>) =>
    setParams((prev) => ({ ...prev, ...next }));

  const setNote = (key: ParamKey, note: string) =>
    setNotes((prev) => ({ ...prev, [key]: note }));

  /**
   * Reset returns the parameters to the engine defaults and keeps the notes.
   * The notes are the analyst's reasoning, not a side effect of the values, and
   * a control that silently deletes typed text is a control people stop
   * trusting. The annex shows the state beside each retained note.
   */
  const reset = () => setParams(defaults);

  return (
    <div className="app">
      <Sidebar
        params={params}
        defaults={defaults}
        countries={countries}
        notes={notes}
        onChange={patch}
        onNoteChange={setNote}
        onReset={reset}
        openPanel={panel}
        onOpenPanel={setPanel}
      />

      <main className="main">
        {/*
          The intro block and the fixture notice are orientation for the tabbed
          workspace, and while a context panel is open they are 330px of chrome
          between the sidebar control and the caption that explains it. The
          panel carries its own source line, so nothing here is lost by folding
          them away; what is gained is the thing the panel is for, which is the
          control and its context on one screen. scripts/context-qa.mjs fails
          the build if that stops being true.
        */}
        {!panel && (
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
          <p className="intro__links">
            {/*
              The teaching widgets are separate builds, not tabs, so the only
              way into them from here is a link. Relative, so it survives a
              file:// open and a deploy under a sub-path alike.
            */}
            Teaching widgets:{' '}
            <a href="./widgets/debt-dynamics/">The debt equation sandbox</a>
            {' | '}
            <a href="./widgets/growth/">Where growth comes from</a>
            {' | '}
            <a href="./widgets/climate-channel/">How warming reaches the debt line</a>
          </p>
        </div>
        )}

        {!panel && <ProvenanceNotice provenance={result.provenance} />}

        <div className="tabs" role="tablist" aria-label="Explorer views">
          {TABS.map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              id={`tab-${name}`}
              aria-selected={!panel && tab === name}
              aria-controls={`panel-${name}`}
              className={`tabs__tab${!panel && tab === name ? ' tabs__tab--active' : ''}`}
              onClick={() => {
                // Picking a tab is a way out of a context panel as well as a
                // way between views, so nobody can get stuck in one.
                setPanel(null);
                setTab(name);
              }}
            >
              {name}
            </button>
          ))}
        </div>

        {panel ? (
          <ContextPanel panel={panel} params={params} onClose={() => setPanel(null)} />
        ) : (
        <div
          className="panel"
          role="tabpanel"
          id={`panel-${tab}`}
          aria-labelledby={`tab-${tab}`}
        >
          {tab === 'Baseline' && <BaselineTab result={result} />}
          {tab === 'Analysis' && <AnalysisTab result={result} />}
          {tab === 'Climate' && <ClimateTab result={result} />}
          {tab === 'Data' && (
            <DataTab result={result} params={params} defaults={defaults} notes={notes} />
          )}
          {tab === 'Export' && (
            <ExportTab
              result={result}
              params={params}
              defaults={defaults}
              notes={notes}
              onImport={(nextParams, nextNotes) => {
                setParams(nextParams);
                setNotes(nextNotes);
              }}
            />
          )}
          {tab === 'Methodology' && <MethodologyTab />}
        </div>
        )}

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
