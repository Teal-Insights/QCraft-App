/**
 * Methodology tab.
 *
 * The pipeline stages and equations are the Shiny Explorer's Methodology
 * panel (apps/qcraft-app/app.py), carried across so the two apps say the same
 * thing. The scenario definitions and the references are read from
 * content/scenarios.ts and content/references.ts, which hold the IMF User
 * Guide's own text (Tim and Rahman, 2024), so this tab cannot describe the
 * method in words the guide does not use.
 */

import { GUIDE_URLS } from '../../content/guidance';
import { MODES, type ModeId } from '../../content/modes';
import {
  SCENARIO_DESCRIPTIONS,
  SCENARIO_FAMILY_NOTE,
  SCENARIO_GUIDE_ORDER,
} from '../../content/scenarios';
import { SCENARIO_LABELS } from '../../engine/types';
import { ReferenceList } from '../ReferenceList';

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
        The Quantitative Climate Risk Assessment Fiscal Tool (Q-CRAFT) is an
        Excel workbook by the IMF Fiscal Affairs Department that projects
        long-term fiscal trajectories (2030–2099) under climate change scenarios.
        It combines UN population projections, IMF World Economic Outlook data,
        World Bank productivity data and the FADCP Climate Dataset to estimate
        how warming affects debt sustainability. This tool reimplements that
        workbook for 175 countries.
      </p>

      <h3>Pipeline architecture</h3>
      <p>The model runs a seven-stage pipeline for each country:</p>
      <ol>
        <li>
          <strong>Demography:</strong> working-age population growth from UN WPP
          (Medium/High/Low variants)
        </li>
        <li>
          <strong>Productivity:</strong> labour productivity growth converging
          along a logistic path from the start rate to the end rate. The
          workbook&rsquo;s realism check is the productivity level relative to
          the OECD.
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
          <strong>Climate:</strong> six climate scenarios applied as shocks to
          productivity growth
        </li>
      </ol>

      <h3>Key equations</h3>

      <p>
        <strong>Real GDP growth</strong>
      </p>
      <Equation>real_g(t) = pop_growth(t) * prod_growth(t)</Equation>
      <p>
        Real GDP growth is the product of working-age population growth and
        labour productivity growth.
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
        balance ratio. When the fiscal rule is on, primary expenditure in the
        following year is cut by the fiscal gap whenever debt is above the
        target and rising, and loosened by it whenever debt is below the target
        and falling. The target is approached, never hit exactly (User Guide,
        section IV.A).
      </p>

      <p>
        <strong>Expenditure rule</strong>
      </p>
      <Equation>exp(t) = exp_base(t) * (1+a)*(1+b)*(1+c) + fiscal_adj</Equation>
      <p>
        Expenditure grows multiplicatively with its underlying drivers
        (inflation, productivity and population), then the prior year&rsquo;s
        fiscal rule adjustment is added in levels (not rates).
      </p>

      <p>
        <strong>Climate impact</strong>
      </p>
      <Equation>prod_growth_climate(t) = prod_growth(t) + shock(t)</Equation>
      <p>
        The FADCP Climate Dataset (Centorrino, Massetti and Tagklis, 2024),
        which updates Kahn et al. (2021), gives each country a GDP effect per
        scenario and year. The workbook turns it into a year-over-year change
        that is added to labour productivity growth, and that slower growth
        propagates through the full fiscal framework, affecting revenue,
        expenditure, and debt. Expenditure rigidity (0 to 1) applies to the
        climate scenarios only: 1.0 keeps primary expenditure at its baseline
        level, 0.0 keeps it at its baseline share of GDP.
      </p>

      <h3>Climate scenarios</h3>
      <p>
        The six scenarios and their definitions are the User Guide&rsquo;s
        (sections II.C and IV.B), in the order the guide gives them.
      </p>
      <ul>
        {SCENARIO_GUIDE_ORDER.map((key) => (
          <li key={key}>
            <strong>{SCENARIO_LABELS[key]}:</strong> {SCENARIO_DESCRIPTIONS[key]}
          </li>
        ))}
      </ul>
      <p>{SCENARIO_FAMILY_NOTE}</p>

      <h3>Data sources</h3>
      <p>
        These are the releases behind the run on screen. They change with the
        data mode, so they are read from the same registry the mode switch reads
        rather than restated here. The other mode&rsquo;s releases, the climate
        dataset provenance and the 2030 convention are on the About the data tab.
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
      <ReferenceList />

      <h3>Technical notes</h3>
      <ul>
        <li>
          Fiscal recursion uses explicit year-by-year iteration (not vectorized)
          to ensure correct t-1 state dependence.
        </li>
        <li>
          Baseline debt is floored at zero and the climate scenarios are not.
          That is the workbook&rsquo;s own construction (the Baseline sheet
          floors its debt row at zero, the scenario sheets do not), reproduced
          here, so scenario debt can go negative under favourable conditions.
        </li>
        <li>
          Revenue-to-GDP ratios are held constant at the last WEO value
          throughout the projection period.
        </li>
        <li>
          175 countries with WEO and UN coverage. Eleven of them have no climate
          estimate (User Guide footnote 12), so their six scenarios sit on the
          baseline and the tool says so. A small number have source data too
          incomplete to project, and the tool says that rather than drawing a
          line.
        </li>
        <li>
          The workbook&rsquo;s WEO series runs to 2029 and the IMF applies
          climate effects from 2030 by assumption, to separate long-term climate
          effects from near-term shocks (User Guide, section II.C). Both data
          modes hold that boundary.
        </li>
      </ul>
    </div>
  );
}
