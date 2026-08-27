/**
 * Methodology tab.
 *
 * Content is the Shiny Explorer's Methodology panel (apps/qcraft-app/app.py),
 * carried across so the two apps say the same thing to the same audience. The
 * pipeline stages, equations, scenario list, data sources, references and
 * technical notes are all that panel's copy.
 */

import { GUIDE_URLS } from '../../content/guidance';
import { MODES, type ModeId } from '../../content/modes';

function Equation({ children }: { children: React.ReactNode }) {
  return <div className="equation">{children}</div>;
}

export function MethodologyTab({ mode }: { mode: ModeId }) {
  return (
    <div className="tab tab--prose">
      <div className="tab__head">
        <h2 className="tab__title">Q-CRAFT model overview</h2>
        <a className="tab__guide" href={GUIDE_URLS.home} target="_blank" rel="noreferrer">
          Full companion guide →
        </a>
      </div>

      <p>
        The Quantitative Climate Risk Assessment Fiscal Tool (Q-CRAFT) projects
        long-term fiscal trajectories (2030–2099) under climate change scenarios
        for 175 countries. It combines UN population projections, IMF World
        Economic Outlook data, and the FADCP climate damage dataset to estimate how
        warming affects debt sustainability.
      </p>

      <h3>Pipeline architecture</h3>
      <p>The model runs a seven-stage pipeline for each country:</p>
      <ol>
        <li>
          <strong>Demography:</strong> working-age population growth from UN WPP
          (Medium/High/Low variants)
        </li>
        <li>
          <strong>Productivity:</strong> labour productivity convergence toward
          frontier
        </li>
        <li>
          <strong>Inflation:</strong> GDP deflator dynamics converging to
          long-run target
        </li>
        <li>
          <strong>Baseline GDP:</strong> real and nominal GDP combining the three
          drivers
        </li>
        <li>
          <strong>Interest rate:</strong> effective rate on government debt
        </li>
        <li>
          <strong>Fiscal:</strong> recursive debt dynamics with optional fiscal
          rule
        </li>
        <li>
          <strong>Climate:</strong> six warming scenarios applied as GDP growth
          shocks
        </li>
      </ol>

      <h3>Key equations</h3>

      <p>
        <strong>Real GDP growth</strong>
      </p>
      <Equation>real_g(t) = pop_growth(t) * prod_growth(t)</Equation>
      <p>
        Real GDP growth is the product of working-age population growth and
        labour productivity convergence.
      </p>

      <p>
        <strong>Nominal GDP</strong>
      </p>
      <Equation>nominal_g(t) = real_g(t) * deflator(t)</Equation>
      <p>
        Nominal GDP applies the GDP deflator to real GDP. The multiplicative
        structure ensures consistent compounding.
      </p>

      <p>
        <strong>Debt dynamics</strong>
      </p>
      <Equation>d(t) = d(t-1) * (1+r)/(1+g) - pb(t)</Equation>
      <p>
        The standard debt accumulation equation where d is debt-to-GDP, r is the
        effective interest rate, g is nominal GDP growth, and pb is the primary
        balance ratio. When the fiscal rule is active, primary expenditure
        adjusts to close the gap between current debt and the target ratio.
      </p>

      <p>
        <strong>Expenditure rule</strong>
      </p>
      <Equation>exp(t) = exp_base(t) * (1+a)*(1+b)*(1+c) + fiscal_adj</Equation>
      <p>
        Expenditure grows multiplicatively with its underlying drivers, then the
        fiscal rule adjustment is added in levels (not rates). Expenditure
        rigidity (0–1) controls how much spending resists adjustment: 1.0 = fully
        sticky.
      </p>

      <p>
        <strong>Climate impact</strong>
      </p>
      <Equation>GDP_climate(t) = GDP_baseline(t) * (1 + shock(t))</Equation>
      <p>
        Climate damage functions from the FADCP Climate Dataset (Centorrino,
        Massetti and Tagklis, 2024), which builds on Kahn et al. (2021), are
        applied as cumulative GDP level shocks. These propagate through the full
        fiscal framework, affecting revenue, expenditure, and debt.
      </p>

      <h3>Climate scenarios</h3>
      <ul>
        <li>
          <strong>Paris-Aligned (1.5°C):</strong> aggressive mitigation, net zero
          by 2050
        </li>
        <li>
          <strong>Moderate (2°C):</strong> current pledges trajectory
        </li>
        <li>
          <strong>Hot (3°C):</strong> insufficient policy action
        </li>
        <li>
          <strong>Hot + Adapted:</strong> 3°C with adaptation measures
        </li>
        <li>
          <strong>Hot + Unadapted:</strong> 3°C without adaptation (worst case
          for most countries)
        </li>
        <li>
          <strong>High (4°C+):</strong> worst-case warming pathway
        </li>
      </ul>

      <h3>Data sources</h3>
      <p>
        These are the releases behind the run on screen. They change with the
        data mode, so they are read from the same registry the mode switch reads
        rather than restated here. The other mode's releases, the climate dataset
        provenance and the 2030 convention are on the About the data tab.
      </p>
      <p className="section-note">
        <strong>{MODES[mode].label} mode:</strong> {MODES[mode].vintageLabel}
      </p>
      <ul>
        {MODES[mode].sources.map((source) => (
          <li key={source.dataset}>
            <strong>{source.dataset}: </strong>
            {source.vintage}. {source.date}.
          </li>
        ))}
      </ul>

      <h3>References</h3>
      <ul className="source-list">
        <li>
          Batini, N., di Serio, M., Fragetta, M., Melina, G., &amp; Waldron, A.
          (2024). <em>Building Blocks of a Climate-Fiscal Policy Framework.</em>{' '}
          IMF Working Paper.
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
          IMF Fiscal Affairs Department. <em>Q-CRAFT User Guide.</em> Internal
          methodology document.
        </li>
        <li>
          UN DESA (2024). <em>World Population Prospects 2024.</em> United
          Nations.
        </li>
      </ul>

      <h3>Technical notes</h3>
      <ul>
        <li>
          Fiscal recursion uses explicit year-by-year iteration (not vectorized)
          to ensure correct t-1 state dependence.
        </li>
        <li>
          Baseline debt is floored at zero. Climate scenarios do NOT apply this
          floor (debt can go negative under favorable conditions).
        </li>
        <li>
          Revenue-to-GDP ratios are held constant at the last WEO value
          throughout the projection period.
        </li>
        <li>
          175 countries are available (those with complete data across all four
          sources). A small number of them have source data too incomplete to
          project, and the tool says so rather than drawing a line.
        </li>
        <li>
          Observed and forecast data runs through 2029 and the projection runs
          2030 to 2099, so 2030 is the first year a climate scenario moves away
          from the baseline. Both data modes hold that boundary.
        </li>
      </ul>
    </div>
  );
}
