/**
 * Q-CRAFT Explorer shell: sidebar plus tabbed workspace.
 *
 * The app is one `useState` of `EngineParams` and one `useState` of the data
 * mode, fed through the engine adapter, plus one `useState` of the rationale
 * notes attached to those parameters. No router: this ships as a static bundle.
 *
 * ── Two states, not one ───────────────────────────────────────────────────────
 * A run is a country, a parameter set AND a data mode. The mode picks which
 * vintage of the four input series the engine reads, so two runs with identical
 * parameters in different modes are different runs. That is why the mode sits
 * beside the parameters in state, is on screen above every tab, and travels in
 * the run manifest that every export carries.
 *
 * ── Loading ───────────────────────────────────────────────────────────────────
 * A country's inputs are fetched rather than bundled (175 countries x 2 vintages
 * is 84 MB), so selecting a country or switching mode is asynchronous. Running
 * the projection is not: once the inputs are in hand, every slider move re-runs
 * synchronously in about 3 ms. The two steps are `engine.prepare` and
 * `engine.run`, and the loading state below is only ever about the first.
 *
 * Notes live here rather than in the sidebar because they are run state, not
 * control state: the export packet and the report annex read them, and an
 * imported run restores them alongside the parameters.
 */

import { useEffect, useMemo, useState } from 'react';

import { engine, type CountryContext, type EngineParams } from './engine/adapter';
import { chartsForTab, type ChartTab } from './charts/specs';
import { useChartRegister } from './charts/useChartRegister';
import type { ParamKey } from './content/params';
import type { PanelKey } from './context/panels';
import { DEFAULT_MODE, MODES, type ModeId } from './content/modes';
import { ContextPanel } from './components/context/ContextPanel';
import type { RationaleNotes, RunAnnotations } from './run/manifest';
import { RegisterToggle } from './components/RegisterToggle';
import { overrideCount } from './components/ChartStack';
import { Sidebar } from './components/Sidebar';
import { ModeSwitch } from './components/ModeSwitch';
import {
  NoClimateDataNotice,
  ProjectionUnavailableNotice,
} from './components/CoverageNotices';
import { BaselineTab } from './components/tabs/BaselineTab';
import { AboutDataTab } from './components/tabs/AboutDataTab';
import { AnalysisTab } from './components/tabs/AnalysisTab';
import { ClimateTab } from './components/tabs/ClimateTab';
import { DataTab } from './components/tabs/DataTab';
import { ExportTab, type ImportState } from './components/tabs/ExportTab';
import { MethodologyTab } from './components/tabs/MethodologyTab';
import { LOADING_TEXT } from './content/modes';
import { FEEDBACK_EMAIL, GITHUB_URL, GUIDE_URLS, INTRO_TEXT } from './content/guidance';

const TABS = [
  'Baseline',
  'Analysis',
  'Climate',
  'Data',
  'Export',
  'Methodology',
  'About the data',
] as const;
type TabName = (typeof TABS)[number];

/** The mode a user is not in, for the "try the other one" affordance. */
const otherMode = (mode: ModeId): ModeId => (mode === 'current' ? 'verified' : 'current');

export default function App() {
  const defaults = useMemo(() => engine.defaults(), []);
  const [mode, setMode] = useState<ModeId>(DEFAULT_MODE);
  const countries = useMemo(() => engine.listCountries(mode), [mode]);
  const [params, setParams] = useState<EngineParams>(defaults);
  const [notes, setNotes] = useState<RationaleNotes>({});
  /**
   * The run's own label and the analyst's note.
   *
   * Held beside the per-parameter rationale rather than inside it, because they
   * answer a different question: the rationale says why a value was chosen, and
   * this says what the run was for. Both travel into every artifact.
   */
  const [annotations, setAnnotations] = useState<RunAnnotations>({});
  /**
   * The last import's outcome.
   *
   * Held here rather than inside the Export tab because importing a run for
   * another country makes the app refetch, and the tab panel renders a loading
   * line while it does. State inside the tab would be destroyed by that
   * unmount, taking the confirmation and every drift warning with it.
   */
  const [importState, setImportState] = useState<ImportState>({ kind: 'idle' });
  const [tab, setTab] = useState<TabName>('Baseline');
  const [panel, setPanel] = useState<PanelKey | null>(null);

  /**
   * The loaded country, or the reason it could not be loaded.
   *
   * `context` is null while a load is in flight, which is the only loading state
   * the app has. `loadError` covers the case where the payload itself will not
   * arrive (a missing file, an offline deploy), as distinct from a payload that
   * arrives and cannot be projected, which `engine.run` reports.
   */
  const [context, setContext] = useState<CountryContext | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setContext(null);
    setLoadError(null);

    engine
      .prepare(mode, params.iso3c)
      .then((next) => {
        // A country or mode change during the request makes this answer stale.
        if (live) setContext(next);
      })
      .catch((error: unknown) => {
        if (!live) return;
        setLoadError(error instanceof Error ? error.message : String(error));
      });

    return () => {
      live = false;
    };
  }, [mode, params.iso3c]);

  const outcome = useMemo(
    () => (context ? engine.run(context, params) : null),
    [context, params],
  );
  const result = outcome?.ok ? outcome.result : null;

  /**
   * Whether the OTHER mode can project this country.
   *
   * Coverage genuinely differs between vintages, so "try the other mode" is
   * sound advice in general and useless advice for a country that fails in both.
   * Zambia fails in both. Sending a trainee to click a switch that lands them on
   * the same wall is worse than saying so, and the check costs one fetch and one
   * 3 ms run, only ever after a country has already failed.
   */
  const [otherModeWorks, setOtherModeWorks] = useState<boolean | null>(null);

  useEffect(() => {
    if (!outcome || outcome.ok) {
      setOtherModeWorks(null);
      return;
    }
    let live = true;
    const target = otherMode(mode);
    engine
      .prepare(target, params.iso3c)
      .then((other) => {
        if (live) setOtherModeWorks(engine.run(other, params).ok);
      })
      .catch(() => {
        if (live) setOtherModeWorks(false);
      });
    return () => {
      live = false;
    };
    // Keyed on the country and the mode, not on the whole parameter object. A
    // block is a property of the source data rather than of the sliders, so
    // re-probing on every slider move would repeat a check that cannot change
    // its answer. `params` is read inside only to run the probe the same way the
    // real run is run.
  }, [outcome?.ok, mode, params.iso3c]);

  /**
   * Which register the charts are in. It lives here rather than in the sidebar
   * because it changes what the charts SAY, not what the model computes, and
   * putting it beside the debt target would tell a ministry reader that the two
   * are the same kind of switch.
   */
  const registers = useChartRegister();
  const chartTabs: Record<string, ChartTab> = {
    Baseline: 'Baseline',
    Analysis: 'Analysis',
    Climate: 'Climate',
  };
  const tabCharts =
    result != null && chartTabs[tab] != null
      ? chartsForTab({ result, params, defaults }, chartTabs[tab]!)
      : [];

  const patch = (next: Partial<EngineParams>) =>
    setParams((prev) => ({ ...prev, ...next }));

  const setNote = (key: ParamKey, note: string) =>
    setNotes((prev) => ({ ...prev, [key]: note }));

  /**
   * Reset returns the parameters to the engine defaults and keeps the notes.
   * The notes are the analyst's reasoning, not a side effect of the values, and
   * a control that silently deletes typed text is a control people stop
   * trusting. The annex shows the state beside each retained note.
   *
   * Mode is not a parameter and is not reset: it is the frame the whole run sits
   * in, and silently moving a user back to Current would change every number on
   * screen without them asking.
   */
  const reset = () => setParams(defaults);

  const openAbout = () => {
    setPanel(null);
    setTab('About the data');
  };

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
          The intro block is orientation for the tabbed workspace, and while a
          context panel is open it is 330px of chrome between the sidebar control
          and the caption that explains it. scripts/context-qa.mjs fails the
          build if that stops being true.

          The mode switch is NOT folded away with it. Which vintage produced a
          number is not orientation, it is part of the number.
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
            <a href="./widgets/debt-dynamics/">The debt dynamics equation sandbox</a>
            {' | '}
            <a href="./widgets/growth/">Where growth comes from</a>
            {' | '}
            <a href="./widgets/climate-channel/">How warming reaches the debt line</a>
          </p>
        </div>
        )}

        <ModeSwitch
          mode={mode}
          onChange={setMode}
          onAbout={openAbout}
          busy={context === null && loadError === null}
        />

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
          {/*
            About the data is the one tab that answers a question about the tool
            rather than about a country, so it renders whatever the load is
            doing. Every other tab needs numbers.
          */}
          {tab === 'About the data' ? (
            <AboutDataTab mode={mode} />
          ) : tab === 'Methodology' ? (
            <MethodologyTab mode={mode} />
          ) : loadError ? (
            <div className="notice notice--stop" role="alert">
              <p className="notice__lead">
                <strong>Country data could not be loaded.</strong> The Explorer
                fetches each country's inputs on demand, and this request did not
                arrive.
              </p>
              <p className="notice__source">{loadError}</p>
            </div>
          ) : !context || !outcome ? (
            <p className="loading" role="status">
              {LOADING_TEXT} ({MODES[mode].vintageLabel})
            </p>
          ) : !outcome.ok ? (
            <ProjectionUnavailableNotice
              countryName={context.countryName}
              mode={mode}
              block={outcome.block}
              detail={outcome.detail}
              otherMode={otherMode(mode)}
              otherModeWorks={otherModeWorks}
              onTryOtherMode={() => setMode(otherMode(mode))}
            />
          ) : (
            <>
              {!context.coverage.hasClimateData && (
                <NoClimateDataNotice countryName={context.countryName} />
              )}
              {tabCharts.length > 0 && (
                <RegisterToggle
                  value={registers.global}
                  onChange={registers.setGlobal}
                  overrideCount={overrideCount(tabCharts, registers)}
                  onClearOverrides={() => registers.setGlobal(registers.global)}
                />
              )}
              {tab === 'Baseline' && (
                <BaselineTab
                  result={result!}
                  params={params}
                  defaults={defaults}
                  registers={registers}
                />
              )}
              {tab === 'Analysis' && (
                <AnalysisTab
                  result={result!}
                  params={params}
                  defaults={defaults}
                  registers={registers}
                />
              )}
              {tab === 'Climate' && (
                <ClimateTab
                  result={result!}
                  params={params}
                  defaults={defaults}
                  registers={registers}
                />
              )}
              {tab === 'Data' && (
                <DataTab
                  result={result!}
                  params={params}
                  defaults={defaults}
                  notes={notes}
                  charts={registers.describe()}
                />
              )}
              {tab === 'Export' && (
                <ExportTab
                  result={result!}
                  params={params}
                  defaults={defaults}
                  notes={notes}
                  annotations={annotations}
                  onAnnotationsChange={setAnnotations}
                  importState={importState}
                  onImportState={setImportState}
                  charts={registers.describe()}
                  onImport={(nextParams, nextNotes, nextMode, nextAnnotations) => {
                    // A run file records its own mode. Restoring the parameters
                    // without it would reproduce the numbers from the wrong
                    // vintage, which is the failure this whole feature exists to
                    // prevent.
                    if (nextMode) setMode(nextMode);
                    setParams(nextParams);
                    setNotes(nextNotes);
                    setAnnotations(nextAnnotations);
                  }}
                />
              )}
            </>
          )}
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
