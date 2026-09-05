import { GUIDE_URLS, OFFICIAL } from '../../content/guidance';

export function StartTab({ onStart, onView }: {
  onStart: () => void;
  onView: (tab: 'Baseline' | 'Methodology' | 'Export') => void;
}) {
  return <div className="tab tab--prose">
    <h2 className="tab__title">Q-CRAFT: understand the model, then build a defensible comparison</h2>
    <p className="tab__lede">The Quantitative Climate Risk Assessment Fiscal Tool connects long-run
      macroeconomic assumptions to fiscal outcomes and climate risk. The IMF workbook is the authoritative
      implementation; this Explorer is an independent tool by Teal Insights and NatureFinance.</p>
    <ol>
      <li><strong>Debt dynamics.</strong> Interest, nominal GDP growth and the primary balance move the debt ratio.</li>
      <li><strong>A long-run fiscal projection.</strong> Demography and productivity determine real growth;
        prices, interest and fiscal assumptions determine revenue, spending and debt after the WEO window.</li>
      <li><strong>A climate overlay.</strong> Temperature-driven productivity changes flow through GDP,
        revenue and spending to primary balance and debt. An individual drought or flood needs separate analysis.</li>
    </ol>
    <div className="intro__links">
      <button type="button" className="button" onClick={onStart}>Start Uganda in Current</button>{' '}
      <button type="button" className="button button--ghost" onClick={() => onView('Baseline')}>Continue selected run</button>
    </div>
    <p>Start Uganda selects that country and Current mode while retaining your other settings and notes.
      Check the sidebar before interpreting the result. Reset is available there if you want the Explorer defaults.</p>
    <h3>One complete analytical pass</h3>
    <p>Read the baseline and its source boundary. Inspect the assumptions and write the reasons for choices.
      Change one setting for a comparison, then read the climate families. State the result and what the model
      leaves out. Save the packet and run JSON; reopen the JSON and check input and calculation identity.</p>
    <p><button className="button button--ghost button--small" onClick={() => onView('Methodology')}>Read the method</button>{' '}
      <button className="button button--ghost button--small" onClick={() => onView('Export')}>Save or reopen a run</button>{' '}
      <a href={GUIDE_URLS.run}>Full walkthrough</a></p>
    <h3>Choose the right comparison</h3>
    <p><strong>Current</strong> uses refreshed WEO and UN population inputs with the full usable WEO window;
      WDI and climate inputs are retained. Long-run assumptions and additional climate comparison begin the
      following year. <strong>Verified</strong> retains the frozen workbook data and timing for the tested parity
      comparison. Neither mode validates your assumptions or certifies a forecast.</p>
    <p><a href={OFFICIAL.workbook}>Download the official workbook</a>{' · '}
      <a href={OFFICIAL.guide}>Read the official User Guide</a>{' · '}
      <a href={GUIDE_URLS.home}>Explorer companion</a></p>
  </div>;
}
