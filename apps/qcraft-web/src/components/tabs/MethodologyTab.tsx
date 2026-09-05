import { GUIDE_URLS, OFFICIAL, officialGuidePage } from '../../content/guidance';
import { MODES, type ModeId } from '../../content/modes';
import { SCENARIO_DESCRIPTIONS, SCENARIO_FAMILY_NOTE, SCENARIO_GUIDE_ORDER } from '../../content/scenarios';
import { SCENARIO_LABELS, type EngineResult } from '../../engine/types';
import { ReferenceList } from '../ReferenceList';

function Equation({ children }: { children: React.ReactNode }) {
  return <div className="equation">{children}</div>;
}

export function MethodologyTab({ mode, result }: { mode: ModeId; result: EngineResult | null }) {
  const h = result?.weoBoundaryYear;
  return (
    <div className="tab tab--prose">
      <div className="tab__head"><h2 className="tab__title">From debt dynamics to climate risk</h2>
        <a className="tab__guide" href={GUIDE_URLS.methodology}>Tool companion →</a></div>
      <p>Q-CRAFT is the IMF Fiscal Affairs Department’s Quantitative Climate Risk Assessment Fiscal Tool.
        Its three parts are debt accounting, a long-run macrofiscal baseline, and a temperature-driven
        productivity overlay. This independent Explorer implements the workbook equations and offers
        a separate rolling-window Current mode. <a href={OFFICIAL.workbook}>Official workbook</a>;{' '}
        <a href={OFFICIAL.guide}>official User Guide</a>.</p>
      <p className="section-note"><strong>{MODES[mode].label} mode.</strong>{' '}
        {h == null ? 'Select a supported country to see its usable WEO boundary.' :
          `${result!.countryName}: WEO estimates/projections through ${h}; long-run assumptions from ${result!.horizonPolicy?.projectionStartYear ?? h + 1}, incremental climate comparisons from ${result!.horizonPolicy?.climateStartYear ?? 'the recorded climate start'}.`}
        {' '}The WEO window is not an observed-history band or a climate-free counterfactual.</p>

      <h3 id="debt">1. Debt dynamics</h3>
      <Equation>dₜ = dₜ₋₁ × (1 + rₜ)/(1 + gₜ) − pbₜ</Equation>
      <p>Here d and pb are debt and primary balance as shares of GDP; r is the effective nominal interest
        rate and g is nominal GDP growth. Rates in these equations are fractions, not percentage-point
        inputs. The multiplier is (1+r)/(1+g) = 1 + (r−g)/(1+g). Its normalized interest-growth
        differential is (r−g)/(1+g), not the unadjusted r−g gap. A primary deficit adds to the debt ratio;
        interest and the GDP denominator also change it. <a href={officialGuidePage(28)}>Guide pp. 28–31 (PDF pp. 29–32)</a>.</p>
      <p>The baseline floors debt at zero; climate scenarios do not. This workbook asymmetry can affect
        scenario differences, especially when a favourable baseline reaches zero. The interest approaches
        hold a nominal rate, a normalized differential, or a real rate. The latter two reconstruct nominal
        rates using the prior year’s nominal growth or inflation, respectively.{' '}
        <a href={officialGuidePage(14)}>Guide pp. 14–15</a>; workbook Interest Rate rows 18–19.</p>

      <h3 id="growth">2. Long-run macrofiscal baseline</h3>
      <Equation>gᵣₑₐₗ,ₜ = (1 + eₜ)(1 + aₜ) − 1<br />gₙₒₘ,ₜ = (1 + gᵣₑₐₗ,ₜ)(1 + πₜ) − 1</Equation>
      <p>Employment growth e follows working-age population with a fixed employment relationship;
        a is labour productivity growth and π is GDP-deflator inflation. Real GDP therefore compounds
        employment and productivity; nominal GDP also compounds prices. Total population, rather than
        working-age population, enters spending growth. <a href={officialGuidePage(25)}>Guide pp. 25–27</a>;
        workbook Baseline Y7:Y14.</p>
      <Equation>aₜ = (1 + gᵣₑₐₗ,ₜ)/(1 + eₜ) − 1</Equation>
      <p>After the retained WDI productivity record ends, the bridge through H is a residual of WEO real
        GDP growth and the model’s employment growth. It is not an independently published IMF productivity
        forecast. It absorbs what that accounting relationship does not otherwise explain. The Context
        panel draws the selected run’s bridge. After H, the start/end controls govern convergence; the
        Turning Point is a timing parameter H plus the chosen years, not a claim of exact halfway convergence.
        The workbook uses an asymmetric logistic curve. <a href={officialGuidePage(12)}>Guide p. 12 and footnote 7</a>;
        workbook Baseline R12:X12 and Productivity B24. <a href={GUIDE_URLS.productivity}>Residual derivation and dated inputs</a>.</p>
      <Equation>Pₜ = Pₜ₋₁ × (1 + πₜ)(1 + aₜ)(1 + nₜ) + adjustmentₜ₋₁<br />PBₜ = Rₜ − Pₜ</Equation>
      <p>Primary expenditure P compounds inflation, productivity and total-population growth n, then adds
        the prior-year fiscal-rule adjustment in local-currency levels. Revenue R keeps its last WEO share
        of nominal GDP. Primary balance is derived from those two paths. With the rule enabled and a nonzero
        target, prior-year debt position and direction determine spending adjustment toward the target;
        the target is not a guaranteed attained endpoint. <a href={officialGuidePage(16)}>Guide pp. 16–17</a>;
        workbook Baseline Y28:Y29 and Y37:Y42.</p>

      <h3 id="climate">3. Climate overlay</h3>
      <Equation>Jₜ = 100 + cumulative GDP effectₜ<br />shockₜ = Jₜ/Jₜ₋₁ − 1<br />aᶜˡⁱᵐₜ = aₜ + shockₜ</Equation>
      <p>The climate input compares a scenario with a historical-temperature-trend reference. Its annual
        index change is added to productivity growth, then changes real and nominal GDP, revenue, the spending
        adjustment and hence primary balance and debt. There is no independent hand-entered primary-balance
        shock in this Explorer. With rigidity 1, each year’s primary spending stays at the baseline
        local-currency level; with rigidity 0, it keeps the baseline share of scenario GDP.{' '}
        <a href={officialGuidePage(18)}>Guide pp. 18–20</a> and <a href={officialGuidePage(33)}>pp. 33–36</a>;
        workbook Hot Y8:Y11 and Y27:Y35.</p>
      <p>Current uses calendar-dated changes only from H+1, anchored at H. It does not move the climate
        series or catch up changes inside the WEO window. The cumulative driver Jₜ/JH is not itself the
        model’s final GDP ratio: the workbook adds the annual effect to productivity growth before compounding
        GDP. Verified retains the frozen workbook timing. The Guide’s older WEO window ends in 2028;
        the November-dated workbook ends in 2029. <a href={GUIDE_URLS.data}>Timing and version comparison</a>.</p>
      <p>This long-run temperature model can help situate drought exposure, but does not simulate an
        individual drought or flood. Sea-level rise, discrete disasters, tipping points and adaptation
        investment costs need other analysis. Results are conditional comparisons, not probabilities,
        certified forecasts or guaranteed lower bounds. The model does not close wider feedback from debt
        into growth or borrowing costs. <a href={officialGuidePage(5)}>Guide pp. 5–6</a>.</p>
      <h3>Scenario families</h3>
      <ul>{SCENARIO_GUIDE_ORDER.map(key => <li key={key}><strong>{SCENARIO_LABELS[key]}:</strong>{' '}{SCENARIO_DESCRIPTIONS[key]}</li>)}</ul>
      <p>{SCENARIO_FAMILY_NOTE}</p>
      <h3>Use the model as a complete analytical workflow</h3>
      <p>Check the Baseline and its WEO boundary, inspect and justify the twelve settings, compare a
        declared assumption in Analysis, then examine the climate families. Record the question, rationale,
        finding and limitation. Export the packet and run JSON, then reopen the JSON and read any identity
        warnings before comparing numbers. <a href={GUIDE_URLS.run}>Full run walkthrough</a>;{' '}
        <a href={GUIDE_URLS.export}>export and replay limits</a>.</p>
      <h3>Sources</h3><ReferenceList />
    </div>
  );
}
