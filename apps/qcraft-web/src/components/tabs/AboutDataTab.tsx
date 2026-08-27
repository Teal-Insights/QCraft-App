/**
 * About the data.
 *
 * One page that answers the four questions a user has to be able to answer
 * before citing anything this tool produces: which release of each source am I
 * looking at, where do the climate damage numbers come from, why do the
 * scenarios only move after 2030, and whose tool is this.
 *
 * The per-mode source tables are rendered from the same registry the mode switch
 * and the export packet read, so the panel cannot drift from what the badge
 * says. Copy is in src/content/modes.ts.
 */

import { ABOUT, MODES, MODE_IDS, type DataMode, type ModeId } from '../../content/modes';
import { GITHUB_URL, GUIDE_URLS } from '../../content/guidance';

function SourceTable({ mode, active }: { mode: DataMode; active: boolean }) {
  return (
    <div className={`about__mode${active ? ' about__mode--active' : ''}`}>
      <h4 className="about__mode-title">
        {mode.label} mode
        {active ? <span className="about__mode-flag">You are here</span> : null}
      </h4>
      <p className="about__mode-vintage">{mode.vintageLabel}</p>
      <p className="about__mode-statement">{mode.statement}</p>
      <table className="about__table">
        <thead>
          <tr>
            <th scope="col">Series</th>
            <th scope="col">Release</th>
            <th scope="col">Date</th>
          </tr>
        </thead>
        <tbody>
          {mode.sources.map((source) => (
            <tr key={source.dataset}>
              <th scope="row">{source.dataset}</th>
              <td>
                {source.vintage}
                {source.note ? <span className="about__note">{source.note}</span> : null}
              </td>
              <td>{source.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AboutDataTab({ mode }: { mode: ModeId }) {
  return (
    <div className="tab tab--prose">
      <div className="tab__head">
        <h2 className="tab__title">About the data</h2>
        <a className="tab__guide" href={GUIDE_URLS.home} target="_blank" rel="noreferrer">
          Full companion guide →
        </a>
      </div>

      <p className="tab__lede">{ABOUT.lede}</p>

      <h3>{ABOUT.modesHeading}</h3>
      <p>{ABOUT.modesBody}</p>

      <div className="about__modes">
        {MODE_IDS.map((id) => (
          <SourceTable key={id} mode={MODES[id]} active={id === mode} />
        ))}
      </div>

      <h3>{ABOUT.climateHeading}</h3>
      <p>{ABOUT.climateBody}</p>
      <p>{ABOUT.climateChain}</p>
      <p>{ABOUT.climateLimits}</p>

      <h3>{ABOUT.impactHeading}</h3>
      <p>{ABOUT.impactBody}</p>
      <p>{ABOUT.impactException}</p>
      <p>{ABOUT.impactCaveat}</p>

      <h3>{ABOUT.notImfHeading}</h3>
      <p>{ABOUT.notImfBody}</p>

      <h3>Checking any of this</h3>
      <ul className="source-list">
        <li>
          Every number, the pipeline that fetched the data and the tests that pin
          it are in the{' '}
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">
            public repository
          </a>
          .
        </li>
        <li>
          Massetti, E., &amp; Tagklis, F. (2023).{' '}
          <em>The FADCP Climate Dataset.</em> IMF Fiscal Affairs Department.
        </li>
        <li>
          Centorrino, S., Massetti, E., &amp; Tagklis, F. (2024).{' '}
          <em>
            Temperature and GDP: the damage layer of the FADCP Climate Dataset.
          </em>{' '}
          IMF Fiscal Affairs Department.
        </li>
        <li>
          Kahn, M.E., Mohaddes, K., Ng, R.N.C., Pesaran, M.H., Raissi, M., &amp;
          Yang, J.-C. (2021).{' '}
          <em>
            Long-Term Macroeconomic Effects of Climate Change: A Cross-Country
            Analysis.
          </em>{' '}
          Energy Economics, 104.
        </li>
        <li>
          The vintage record for each release, including the checksum of every
          raw download, is committed at{' '}
          <code>data/vintages/&lt;vintage&gt;/manifest.json</code>.
        </li>
        <li>
          The reasoning behind the climate dataset vintage and the 2030
          convention is written up in <code>docs/data-vintages.md</code>.
        </li>
      </ul>
    </div>
  );
}
