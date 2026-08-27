/**
 * Q-CRAFT Explorer theme.
 *
 * ── Provenance ────────────────────────────────────────────────────────────────
 *
 * CHROME (surfaces, ink, rules, accent) — values copied verbatim from the Teal
 * Insights brand token file:
 *
 *   /Users/teal_mac_mini_25/Dropbox/lte-workbench/brand/tealbrand/tokens.json
 *   tokens.json version 1.0.0
 *   source.master:   templates/making-sovereign-analysis-usable-2026-07-23.pptx
 *   source.issue:    TEA-1118
 *   source.measured: 2026-07-23
 *   read on 2026-08-26 by the lane-2 UI build
 *
 * Nothing here is invented: every `brand.*` hex below is a literal copy of a
 * value under `color` in that file. If the token file moves or changes, re-copy
 * — do not hand-edit toward "close enough".
 *
 * FONTS — family NAMES only, per tokens.json `fontLicense`:
 *   "Family NAMES are canon and live here. Font FILES are per-user licensed:
 *    never commit them, never publish them, never vendor them into a repo."
 * So we name Söhne / Tiempos Headline and fall through to system stacks. No
 * @font-face, no webfont fetch, no font files in this repo. On a machine
 * without the licensed families installed the app renders in the system stack,
 * which is the intended graceful degradation.
 *
 * DATA COLOURS (series, ramps) are a separate concern from brand chrome and are
 * defined below under `series`. See the note there for why they are not the
 * engine's `COLORS` dict.
 */

/** Literal copies of tokens.json → `color`. */
export const brand = {
  cyan: '#0094BC',
  navy: '#143E5A',
  gray: '#5C6770',
  ink: '#2A2A2A',
  line: '#D4D0CA',
  card: '#E6F4F8',
  ivory: '#FAFAF7',
  pale: '#F2F8FA',
  soft: '#D7E3EC',
  white: '#FFFFFF',
  grayLight: '#9A9A9A',
  onNavyText: '#9FB8C9',
  onNavyKicker: '#7BAFD4',
} as const;

/**
 * Font stacks. Family names from tokens.json → `font`; the fallbacks are ours.
 * `body` covers running text and chart labels; `accent` is the serif display
 * face used for tab headings so the app reads as a Teal Insights artifact
 * rather than a generic dashboard.
 */
export const fonts = {
  body: "'Söhne', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  medium:
    "'Söhne Kräftig', 'Söhne', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  kicker:
    "'Söhne Schmal Kräftig', 'Söhne', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  accent:
    "'Tiempos Headline Semibold', 'Tiempos Headline', Georgia, 'Times New Roman', serif",
  mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
} as const;

/**
 * Semantic roles used by components and charts. Chrome roles map onto `brand`;
 * this indirection means a token refresh touches `brand` only.
 */
export const theme = {
  surface: brand.ivory,
  surfaceRaised: brand.white,
  surfaceSunken: brand.pale,
  surfaceAccent: brand.card,
  textPrimary: brand.ink,
  textSecondary: brand.gray,
  textMuted: brand.grayLight,
  rule: brand.line,
  ruleCool: brand.soft,
  accent: brand.cyan,
  anchor: brand.navy,
} as const;

/**
 * ── Data colours ──────────────────────────────────────────────────────────────
 *
 * These are NOT from tokens.json. Brand tokens govern chrome; series colour is
 * an encoding decision with its own correctness bar (colour-vision separation,
 * lightness band, contrast on the surface).
 *
 * We do not reuse `qcraft_engine.constants.COLORS` — the Shiny app's series
 * palette — because it does not clear that bar. Validated on 2026-08-26 against
 * the light surface:
 *
 *   #2C3E50,#27AE60,#3498DB,#E67E22,#9B59B6,#E74C3C,#C0392B
 *     FAIL normal-vision separation: Hot+Unadapted (#E74C3C) vs High (#C0392B)
 *          measure ΔE 9.0 (OKLab x100) — below the 15 floor. On the Analysis
 *          tab those two lines are the whole point of the chart and they are
 *          near-indistinguishable.
 *     FAIL chroma floor: baseline #2C3E50 reads as gray, not a hue.
 *
 * Replacement structure — COMPOSITE, not one ramp. The engine contract
 * (SHARED/engine-api.md section 7) is explicit that the six scenarios are not a
 * single severity ladder:
 *
 *   "Do not present the six as a single ordered severity scale, and don't apply
 *    a sequential colour ramp implying one. Group Hot / Hot_Adapted /
 *    Hot_Unadapted as a family and treat Paris / Moderate / High as separate
 *    pathways."
 *
 * It is right on the domain: High (4C+) ends BELOW Hot (3C) for Uganda because
 * the two come from different IPCC SSP scenarios, so warming order and outcome
 * order genuinely disagree. So:
 *
 *   `pathway`   — three distinct hues for the three standalone pathways. Nothing
 *                 about their colours implies a rank.
 *   `hotFamily` — one hue in three lightness steps for the 3C family, because
 *                 adaptation IS a real ordering within it (Adapted -> Hot ->
 *                 Unadapted is progressively less adaptation against the same
 *                 damage). Reading the family as a group and the steps as an
 *                 order is exactly what the data supports.
 *
 * Validation on 2026-08-26, light surface #FAFAF7:
 *   hotFamily as an ordinal ramp .... all four checks PASS (monotone L,
 *     adjacent dL >= 0.06, light end 2.19:1, single hue)
 *   cross-family set {baseline, Paris, Moderate, High, hotFamily mid} under the
 *     harder --pairs all test .... CVD dE 8.4 (>= 8 target) PASS,
 *     normal-vision dE 15.1 (>= 15 floor) PASS
 *
 * Two caveats recorded rather than papered over:
 *   - `baseline` (brand navy) sits outside the categorical lightness band
 *     (L 0.349) and below the chroma floor, i.e. it reads as near-neutral. That
 *     is deliberate: it is the reference line, not a series. A neutral anchor is
 *     what the coloured scenarios should be read AGAINST, and it is drawn at
 *     3px emphasis. It still clears every separation gate against every scenario
 *     hue (worst 15.1 normal-vision).
 *   - Paris `#1baf7a` sits at 2.69:1 on the light surface, under the 3:1 mark
 *     bar. The relief rule applies and is satisfied: every chart ships a legend,
 *     a hover tooltip listing all series, and the Data tab as a table view.
 *
 * `duo` is the two-series categorical pair used on the Baseline tab
 * (revenue/expenditure, primary/overall balance). Validated categorical against
 * #FAFAF7: worst-pair normal-vision dE 33.6, CVD dE 24.7, both >= 3:1 contrast.
 * Hexes are documented slots 1 and 2 of the data-viz reference palette.
 */
export const series = {
  /** The no-climate-shock reference path. Neutral by design. */
  baseline: brand.navy,

  /** Three standalone IPCC SSP pathways: distinct hues, no implied rank. */
  pathway: {
    Paris: '#1baf7a',
    Moderate: '#2a78d6',
    High: '#4a3aa7',
  },

  /** The 3C family — one hue, light to dark as adaptation falls away. */
  hotFamily: {
    Hot_Adapted: '#ef9384',
    Hot: '#cc5141',
    Hot_Unadapted: '#8c2a1f',
  },

  duo: ['#2a78d6', '#eb6834'] as const,
} as const;

/**
 * ── Parameter context panels ──────────────────────────────────────────────────
 *
 * A separate encoding problem from the scenario charts, so a separate slot set.
 * The panels never draw a climate scenario, so nothing here has to agree with
 * `series` above; each panel ships its own legend and its own axis.
 *
 * Every value below is a documented slot of the data-viz reference palette
 * except the two neutrals, which are called out. Validated 2026-08-26 against
 * the light surface #FAFAF7 with the palette validator:
 *
 *   `variant` as an ordinal ramp .... all four checks PASS (monotone L,
 *     adjacent dL >= 0.06, light end #6aa3e4 at 2.52:1, hue spread 3 degrees)
 *   every cross-family pair, i.e. each `variant` step against both
 *     `comparator` hues and the two comparators against each other, under
 *     --pairs all .... worst CVD dE 16.2, worst normal-vision dE 28.1, both
 *     clear of the 8 target and the 15 floor
 *   `approach` under --pairs all .... every check PASS with no WARN
 *     (worst CVD dE 13.0, worst normal dE 16.3, all three >= 3:1)
 *
 * Two relief obligations recorded rather than papered over:
 *   - `comparator.b` (#eda100) sits at 2.07:1 on the light surface, under the
 *     3:1 mark bar. Darkening it clears contrast but collapses its separation
 *     from #008300 under protanopia (dE 16.2 -> 3.0 at #b87a00), which is the
 *     worse failure. The relief rule applies and is satisfied: every panel
 *     ships a legend, direct labels on the line ends, and a hover tooltip
 *     listing all series.
 *   - `variant.low` (#6aa3e4) at 2.52:1 is the light end of an ordinal ramp,
 *     which the ordinal check gates at 2:1 rather than 3:1. Same relief.
 *
 * `record` reuses brand navy for the same reason `series.baseline` does: it is
 * the observed series that the assumption lines are read AGAINST, so it is
 * deliberately outside the categorical band and below the chroma floor. It
 * still clears every separation gate against every hue it shares a chart with
 * (worst normal-vision dE 15.1).
 */
export const context = {
  /**
   * The three UN variants. An ordinal ramp, not three hues, because Low to High
   * is a real ordering (fertility), and a reader should see the order in the
   * colour without consulting the legend.
   */
  variant: {
    Low: '#6aa3e4',
    Medium: '#2a78d6',
    High: '#17406f',
  },

  /** Comparator countries. Assigned in this order, never cycled. */
  comparator: ['#eda100', '#008300'] as const,

  /** The observed record. Neutral by design. */
  record: brand.navy,

  /** The path the user's own setting implies. */
  chosen: '#eb6834',

  /**
   * What the charted projection actually used, when that differs from the
   * user's setting. Neutral and dashed: it is a reference, not a series, and
   * the dash is the secondary encoding that keeps it legible without colour.
   */
  inForce: brand.grayLight,

  /** The three interest-rate approaches. Three rules, not a ladder, so three hues. */
  approach: {
    'Nominal interest rate': '#2a78d6',
    'Interest-growth differential': '#eb6834',
    'Real interest rate': '#4a3aa7',
  },
} as const;

/** Chart geometry shared by every D3 chart so they stack visually. */
export const chart = {
  margin: { top: 28, right: 76, bottom: 34, left: 52 },
  gridStroke: theme.ruleCool,
  axisStroke: theme.rule,
  axisText: theme.textSecondary,
  lineWidth: 2,
  lineWidthEmphasis: 3,
} as const;
