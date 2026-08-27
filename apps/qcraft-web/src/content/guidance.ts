/**
 * Parameter and tab guidance text.
 *
 * Sourcing rule: nothing here is written from scratch where the Shiny Explorer
 * already says it. Each entry notes where its wording comes from.
 *
 *  - Parameters the Shiny app exposes (country, demography, debt target, fiscal
 *    rule, rigidity): `help` is the app's own `param-help` paragraph, verbatim,
 *    from apps/qcraft-app/app.py.
 *  - Parameters this UI newly exposes (productivity, inflation, interest-rate
 *    approach): the Shiny app has no text for them because they were fixed
 *    inside the pipeline. `help` is condensed from the engine's own docstrings
 *    and the Methodology tab copy in app.py — cited per entry, so a reviewer can
 *    check the claim against the code rather than trust the summary.
 *
 * `guideUrl` values are copied from GUIDE_URLS in apps/qcraft-app/constants.py.
 */

const GUIDE_BASE = 'https://teal-insights.github.io/QCraft-App';

/** Copied from GUIDE_URLS in apps/qcraft-app/constants.py. */
export const GUIDE_URLS = {
  home: `${GUIDE_BASE}/`,
  codesign: `${GUIDE_BASE}/part3-codesign.html`,
  paramCountry: `${GUIDE_BASE}/part2-using.html#country-selection`,
  paramDemography: `${GUIDE_BASE}/part2-using.html#demography-variant`,
  paramDebtTarget: `${GUIDE_BASE}/part2-using.html#debt-target-of-gdp`,
  paramFiscalRule: `${GUIDE_BASE}/part2-using.html#fiscal-rule-yes-no`,
  paramRigidity: `${GUIDE_BASE}/part2-using.html#expenditure-rigidity-0.0---1.0`,
  tabBaseline: `${GUIDE_BASE}/part2-using.html#baseline-tab`,
  tabClimate: `${GUIDE_BASE}/part2-using.html#climate-tab`,
  tabAnalysis: `${GUIDE_BASE}/part2-using.html#analysis-tab`,
  tabData: `${GUIDE_BASE}/part2-using.html#data-tab`,
  methodology: `${GUIDE_BASE}/part1-policy.html#what-q-craft-computes`,
} as const;

/** Copied from apps/qcraft-app/constants.py. */
export const GITHUB_URL = 'https://github.com/Teal-Insights/QCraft-App';
export const FEEDBACK_EMAIL =
  'mailto:lte@tealinsights.com?subject=Q-CRAFT%20Explorer%20Feedback';

export interface ParamGuidance {
  /** Short tooltip body. One or two sentences — this is a hover, not a manual. */
  help: string;
  /** Deep link into the companion guide, where one exists for this parameter. */
  guideUrl?: string;
}

export const PARAM_GUIDANCE = {
  country: {
    // Verbatim from app.py, sidebar country `param-help`.
    help:
      '175 countries with complete WEO macroeconomic data and UN population ' +
      'projections. Data loads automatically when you select a country.',
    guideUrl: GUIDE_URLS.paramCountry,
  },

  demographyVariant: {
    // Verbatim from app.py, sidebar demography `param-help`.
    help: 'UN population projection. Medium = central estimate.',
    guideUrl: GUIDE_URLS.paramDemography,
  },

  debtTarget: {
    // Verbatim from app.py, sidebar debt-target `param-help`.
    help:
      'Target debt-to-GDP ratio. The fiscal rule adjusts the primary balance ' +
      'toward this level over time.',
    guideUrl: GUIDE_URLS.paramDebtTarget,
  },

  fiscalRule: {
    // Verbatim from app.py, sidebar fiscal-rule `param-help`.
    help: 'When Yes, applies fiscal consolidation toward the debt target.',
    guideUrl: GUIDE_URLS.paramFiscalRule,
  },

  expenditureRigidity: {
    // Verbatim from app.py, sidebar rigidity `param-help`.
    help:
      'How sticky is government spending? 1.0 = barely adjusts to shocks ' +
      '(worst case). 0.0 = fully flexible.',
    guideUrl: GUIDE_URLS.paramRigidity,
  },

  productivityStart: {
    // Newly exposed. From productivity_country()'s docstring in
    // qcraft_engine/productivity.py: "productivity_start: Starting growth rate
    // (%) for logistic convergence."
    help:
      'Labour productivity growth at the start of the projection, in percent. ' +
      'The projection converges from here toward the long-run rate along a ' +
      'logistic path.',
  },

  productivityEnd: {
    // Newly exposed. From productivity_country()'s docstring: "productivity_end:
    // Long-run convergence target growth rate (%)." Framing from the Methodology
    // tab in app.py: "Labour productivity convergence toward frontier".
    help:
      'The long-run labour productivity growth rate the projection converges ' +
      'to, in percent. Lower values mean slower catch-up toward the frontier.',
  },

  inflationStart: {
    // Newly exposed. From inflation_country()'s docstring in
    // qcraft_engine/inflation.py: "inflation_start: Starting inflation rate (%)
    // for logistic convergence."
    help:
      'GDP deflator growth at the start of the projection, in percent. ' +
      'Historical years use the deflator in the WEO data regardless of this ' +
      'setting.',
  },

  inflationEnd: {
    // Newly exposed. From inflation_country()'s docstring: "inflation_end:
    // Long-run inflation target (%)." Framing from the Methodology tab:
    // "GDP deflator dynamics converging to long-run target".
    help:
      'The long-run inflation target the GDP deflator converges to, in ' +
      'percent. It sets the nominal anchor for the whole projection.',
  },

  interestRateMode: {
    // Newly exposed. The three options and their behaviour are documented in
    // interest_rate_country() in qcraft_engine/interest_rate.py.
    help:
      'What is held fixed when projecting the rate on government debt past the ' +
      'WEO horizon: the nominal rate, its gap to nominal GDP growth, or the ' +
      'real rate. Which one you hold fixed drives the whole debt path.',
  },
} satisfies Record<string, ParamGuidance>;

/**
 * Per-option help for the interest-rate approach. Each description restates the
 * projection rule implemented in interest_rate_country()
 * (qcraft_engine/interest_rate.py); historical years always use the observed
 * WEO rate under all three.
 */
export const INTEREST_RATE_MODE_HELP: Record<string, string> = {
  'Nominal interest rate':
    'Constant nominal. The nominal rate holds at its last observed WEO value ' +
    'for every projection year.',
  'Interest-growth differential':
    'Constant differential. The gap between the interest rate and nominal GDP ' +
    'growth holds at its last observed value, so the rate moves with growth.',
  'Real interest rate':
    'Constant real. The real rate holds constant and the nominal rate is ' +
    'rebuilt from it each year using the previous year’s inflation.',
};

/**
 * Tab-level framing. Sourced from the Shiny app's own tab copy in app.py — the
 * Analysis lede and the Climate scenario explainer are that text, lightly
 * trimmed; the rest is the app's chart-context paragraphs.
 */
export const TAB_GUIDANCE = {
  baseline: {
    // From app.py, Baseline tab `chart-context` paragraphs.
    weo:
      'Shaded region shows WEO historical/forecast data (through 2029). The ' +
      'projection continues to 2099.',
    revExp:
      'Revenue is held constant as a share of GDP. Expenditure grows with ' +
      'population, productivity, and inflation.',
    balances:
      'Primary balance excludes interest payments. Overall balance includes ' +
      'them.',
    guideUrl: GUIDE_URLS.tabBaseline,
  },
  analysis: {
    // From app.py, Analysis tab lede.
    lede:
      'How does climate change affect long-term debt sustainability? Compare ' +
      'baseline fiscal projections against six climate scenarios.',
    guideUrl: GUIDE_URLS.tabAnalysis,
  },
  climate: {
    // From app.py, Climate tab `climate-explainer` and the GDP-index heading.
    explainer:
      'Paris-Aligned (1.5°C): aggressive mitigation limits warming. ' +
      'Moderate (2°C): current pledges trajectory. Hot (3°C): insufficient ' +
      'action. High (4°C+): worst-case warming.',
    index:
      'Relative GDP trajectories rebased to 100 to show divergence from ' +
      'baseline.',
    guideUrl: GUIDE_URLS.tabClimate,
  },
  data: {
    guideUrl: GUIDE_URLS.tabData,
  },
} as const;

/** Intro banner, verbatim from the `intro-banner` div in app.py. */
export const INTRO_TEXT =
  'Q-CRAFT Explorer is a free, open-source reimplementation of the IMF’s ' +
  'Quantitative Climate Risk Assessment Fiscal Tool (Q-CRAFT). It projects ' +
  'long-term fiscal outcomes under different climate scenarios for 175 ' +
  'countries. This is not an official IMF product. It is an initial version ' +
  'that aims for full parity with the original Excel tool.';
