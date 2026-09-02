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

import { SCENARIO_FAMILY_NOTE, scenarioLede } from './scenarios';

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
      'to, in percent. The workbook\u2019s realism check is the productivity ' +
      'level this implies relative to the OECD.',
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
    /**
     * From app.py, Baseline tab `chart-context` paragraphs, with one change
     * the Shiny app did not need: the boundary year is the chart's own.
     *
     * It used to read "through 2029" for every country. The shaded band is
     * drawn from `weoBoundaryYear`, which is where the source data for THIS
     * country actually stops, and for six countries that is not 2029: Syria's
     * frozen-vintage band ends in 2010. The subtitle said 2029 while the band
     * ended nineteen years earlier, and the anchor notice above the chart
     * points at that band by name. A caption that contradicts the picture it
     * captions is worse than no caption.
     */
    weo: (boundaryYear: number) =>
      `Shaded region shows WEO historical/forecast data (through ${boundaryYear}). ` +
      'The projection continues to 2099.',
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
    explainer: scenarioLede(),
    /** Why Hot is not a rung above High, from the User Guide. */
    family: SCENARIO_FAMILY_NOTE,
    index:
      'Relative GDP trajectories rebased to 100 to show divergence from ' +
      'baseline.',
    guideUrl: GUIDE_URLS.tabClimate,
  },
  data: {
    guideUrl: GUIDE_URLS.tabData,
  },
} as const;

/**
 * The sub-zero note, Teal's gate resolution 7 of 2026-08-27, verbatim.
 *
 * It lives here rather than in the export layer because it is chart copy and
 * both surfaces need it. `charts/specs.ts` builds one spec per chart per
 * register, and that spec is what the screen draws and what the packet
 * exports, so a note attached there reaches every surface by construction.
 * Attaching it in the export layer instead is how it came to be missing from
 * the screen entirely: see the CC-13 lane report.
 *
 * `export/figures.ts` re-exports it under its original name, because the
 * freeze copy gate and the packet tests both name it there.
 *
 * The second sentence is the reason the note is attached per chart rather than
 * per run. It says the baseline is held at zero and the climate scenarios are
 * not, which is true of the engine (`fiscal.ts` floors the baseline at zero,
 * `climate.ts` deliberately does not). Under a chart that draws the baseline
 * alone, that sentence describes lines the reader cannot see.
 *
 * The stronger range-of-validity caution is NOT here on purpose. Teal deferred
 * it to the next IMF-facing copy pass; docs/post-training-list.md section 2
 * records that. This lane ships the approved wording and does not strengthen
 * it.
 */
export const BELOW_ZERO_NOTE =
  'Values below zero mean the projection has repaid the whole debt stock and ' +
  'continues into a net asset position. The baseline path is held at zero; the ' +
  'climate scenarios are not, which is why only they go below it.';

/**
 * The one-clause form, for a headline figure with no room for the full note.
 *
 * The worst-outcome tile is read on its own more than anything else in the
 * packet, and with the fiscal rule off it reads minus 473 per cent. The export
 * has said this since CC-3. The screen's card showed the same number with the
 * scenario name beside it and nothing else, so the two surfaces explained the
 * same figure differently. Shared from here so they cannot drift again.
 */
export const BELOW_ZERO_TILE_CLAUSE = 'Below zero is a net asset position.';

/** Intro banner, verbatim from the `intro-banner` div in app.py. */
/**
 * The intro, in two pieces rather than one paragraph.
 *
 * Not a rewrite: every sentence below is the sentence that shipped, in the
 * order it shipped. What changed at the freeze is which of them is on screen
 * at all times. The four-line block cost 172px at the top of every visit, and
 * the measurement that decided it is blunt: with the block in place, 53 per
 * cent of the first chart's plot was visible on a 1440x900 laptop and less
 * than a fifth of it on a 1280x800 one. A tool whose output is a chart should
 * not open on a paragraph about itself.
 *
 * `INTRO_LEDE` stays visible. It carries the two facts a reader must not have
 * to click for: what this is, and that it is not an IMF product. The rest sits
 * one disclosure away, and `INTRO_TEXT` still exists as the whole paragraph,
 * so anything that quotes the intro entire still can.
 */
export const INTRO_LEDE =
  'Q-CRAFT Explorer is a free, open-source reimplementation of the IMF’s ' +
  'Quantitative Climate Risk Assessment Fiscal Tool (Q-CRAFT). This is not an ' +
  'official IMF product.';

export const INTRO_MORE =
  'It projects long-term fiscal outcomes under different climate scenarios for ' +
  '175 countries. It is an initial version that aims for full parity with the ' +
  'original Excel tool.';

export const INTRO_TEXT = `${INTRO_LEDE} ${INTRO_MORE}`;
