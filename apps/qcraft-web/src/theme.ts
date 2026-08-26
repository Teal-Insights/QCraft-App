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
 * Replacement rationale: the six climate scenarios are ORDINAL, not nominal —
 * Paris (1.5C) < Moderate (2C) < the three 3C variants < High (4C+) is a
 * warming-severity sequence, and reordering it would change the meaning. Ordinal
 * data takes a single-hue ramp so the reader sees the order in the colour. The
 * warm hue is doing semantic work here (hotter = darker/redder).
 *
 * `warming` below is a 6-step OKLCH ramp at hue 30 deg, L 0.755 -> 0.435 in equal
 * 0.064 steps, C 0.115 -> 0.135. Validated as an ordinal ramp against surface
 * #FAFAF7: lightness monotone PASS, adjacent dL >= 0.06 PASS, light-end contrast
 * 2.19:1 PASS (>= 2:1 floor), single hue (spread 1 deg) PASS.
 *
 * `baseline` is brand navy — a deliberately different family from the ramp so
 * the reference path never reads as "one of the scenarios".
 *
 * `duo` is the two-series categorical pair used on the Baseline tab
 * (revenue/expenditure, primary/overall balance). Validated categorical against
 * #FAFAF7: worst-pair normal-vision dE 33.6, CVD dE 24.7, both >= 3:1 contrast.
 * Hexes are documented slots 1 and 2 of the data-viz reference palette.
 */
export const series = {
  baseline: brand.navy,
  warming: [
    '#ef9384',
    '#e37968',
    '#d55d4d',
    '#c34535',
    '#a93527',
    '#8c2a1f',
  ] as const,
  duo: ['#2a78d6', '#eb6834'] as const,
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
