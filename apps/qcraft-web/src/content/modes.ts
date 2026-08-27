/**
 * The two data modes, and every IMF-facing sentence the Explorer says about them.
 *
 * ── Why this file exists ──────────────────────────────────────────────────────
 * The Explorer can run on two data vintages through one engine. Which vintage a
 * chart came from changes what the chart is: one reproduces the IMF's published
 * Excel workbook, the other reproduces the same method on newer inputs. A user
 * who cannot tell them apart cannot cite either.
 *
 * ── Why the copy lives here and nowhere else ──────────────────────────────────
 * Every string below is a claim about the IMF original, so all of it is one
 * review rather than a hunt through components. Nothing user-facing about modes,
 * vintages, provenance or coverage is written inline anywhere else in the app:
 * `tests/modes.test.ts` fails the build if the badge text drifts from the
 * wording agreed in the sprint's binding notes.
 *
 * ── Sources for the facts stated here ─────────────────────────────────────────
 *   DATA-NOTES.md sections 2, 6 and 7  vintages, what refreshes and what carries
 *                                      forward, the api.imf.org publication date
 *   VINTAGE-TOGGLE.md                  the vintage store layout; weo-2024-10 is
 *                                      frozen and parity is measured against it
 *   INTEGRATION-REPORT.md section 7.2  the eleven selectable countries whose
 *                                      climate slice is all zeros
 *   data/vintages/<id>/manifest.json   the label each vintage states about itself
 *   packages/qcraft-engine-ts/src/{constants,pipeline}.ts
 *                                      PROJ_START = 2030 and the climate
 *                                      variation held at zero through 2029
 *   docs/data-vintages.md              the FADCP vintage check and the 2030 memo
 */

/** Mode ids. These are stable: they travel in exported run JSON. */
export const MODE_IDS = ['current', 'verified'] as const;
export type ModeId = (typeof MODE_IDS)[number];

/**
 * The mode the app opens on.
 *
 * Current, not Verified. The tool's reason to exist alongside the workbook is
 * that the posted workbook ships a fixed WEO vintage that ages, so opening on
 * stale numbers would open on the problem. Verified is one click away, and the
 * switch is on screen wherever results are.
 */
export const DEFAULT_MODE: ModeId = 'current';

export interface SourceLine {
  /** What the series is, in the reader's terms. */
  dataset: string;
  /** Which release, named as its publisher names it. */
  vintage: string;
  /** When that release was published, or how it reached this vintage. */
  date: string;
  /** Optional qualifier: carried forward, derived, and so on. */
  note?: string;
}

export interface DataMode {
  id: ModeId;
  /** The word on the switch. */
  label: string;
  /** Vintage id, as `data/vintages/` names it. Travels in the run manifest. */
  vintage: string;
  /** The vintage's own label, from its manifest.json. */
  vintageLabel: string;
  /** One line, always on screen beside results. */
  summary: string;
  /**
   * The claim. Verified states the parity result; Current states the single way
   * it diverges from the workbook.
   */
  statement: string;
  /** The four input series, for the About the data panel. */
  sources: SourceLine[];
}

/**
 * The Verified badge, verbatim.
 *
 * BINDING, and not to be edited without Teal's sign-off. The sprint's reference
 * notes fix this wording ("baseline parity exact for 147/147 tested countries;
 * climate-scenario parity confirmed for ratio metrics ONLY", the word added by
 * the 2026-08-27 evening gate) and that resolution holds it in place until an
 * independent Excel recalculation confirms the post-fix climate parity. The climate derivation fix in `6b42136` moved
 * severe scenarios upward, so this wording is the safe side of the claim. Do not
 * strengthen it.
 */
export const VERIFIED_BADGE =
  'Matches the official IMF Excel workbook. Baseline parity verified for 147 of ' +
  '147 tested countries; climate-scenario parity confirmed for ratio metrics only.';

/**
 * The Current divergence note, one line.
 *
 * It names the one thing that changed (the input vintages) and the one
 * consequence that follows (results move off the workbook's cells). It does not
 * claim the newer numbers are better, because that is not a claim this tool is
 * in a position to make.
 */
export const CURRENT_DIVERGENCE =
  'Same engine, newer inputs: results will not match the published workbook ' +
  'cell for cell, because the workbook ships the October 2024 data vintage.';

/**
 * How the climate damage source is named, in two lengths.
 *
 * SHORT FORM, and "short form" is a defined term, not a judgment call. It is
 * fixed by the reference notes and quoted in docs/lane-reports/cc2-wording-gate.md
 * question 2: "FADCP Climate Dataset (Centorrino, Massetti and Tagklis, 2024),
 * building on Kahn et al. (2021)". The 2026-08-27 evening gate chose option (b)
 * there: keep this in the app, and ADD the precise chain to the About panel. It
 * names the layer that produces the numbers this tool reads, and it keeps the
 * authors' names on the work in every artifact that leaves the building.
 *
 * PRECISE CHAIN, below, for About the data only, where there is room to say that
 * the dataset and the damage layer are two pieces of work by overlapping
 * authors.
 *
 * Both live here for the same reason every other claim does: one edit, one
 * review, and no second copy to forget.
 */
export const FADCP_SHORT =
  'FADCP Climate Dataset (Centorrino, Massetti and Tagklis, 2024), building on ' +
  'Kahn et al. (2021)';

/** The one-line source credit an exported artifact carries. */
export const SOURCE_CREDIT =
  `Climate damage: ${FADCP_SHORT}. Macrofiscal data: IMF World Economic ` +
  'Outlook. Population: UN World Population Prospects.';

/**
 * The precise chain, for the About the data panel only.
 *
 * Three layers, because they are three pieces of work and the dataset is not
 * the temperature-to-GDP layer built on top of it.
 */
export const FADCP_CHAIN = {
  dataset: 'Massetti and Tagklis (2023)',
  damageLayer: 'Centorrino, Massetti and Tagklis (2024)',
  foundation: 'Kahn and others (2021)',
  sentence:
    'The dataset is Massetti and Tagklis (2023). The temperature-to-GDP damage ' +
    'layer this tool reads is Centorrino, Massetti and Tagklis (2024), building ' +
    'on Kahn and others (2021).',
} as const;

export const MODES: Record<ModeId, DataMode> = {
  current: {
    id: 'current',
    label: 'Current',
    vintage: 'weo-2026-04',
    vintageLabel: 'WEO April 2026 + UN WPP 2024',
    summary: 'Latest data. WEO April 2026 and UN population projections 2024.',
    statement: CURRENT_DIVERGENCE,
    sources: [
      {
        dataset: 'Macroeconomic and fiscal series',
        vintage: 'IMF World Economic Outlook, April 2026',
        date: 'Published 14 April 2026',
        note: 'Fetched from the IMF SDMX API, dataflow IMF.RES:WEO(9.0.0).',
      },
      {
        dataset: 'Population by age group',
        vintage: 'UN World Population Prospects, 2024 revision',
        date: 'Published 11 July 2024',
        note: 'Mid-year population by five-year age group, in thousands.',
      },
      {
        dataset: 'Climate GDP losses',
        vintage: 'FADCP Climate Dataset (2024)',
        date: 'Carried forward from the October 2024 vintage',
        note: 'The 2024 dataset is the current release. See About the data.',
      },
      {
        dataset: 'Labour productivity levels',
        vintage: 'World Bank World Development Indicators, 1991 to 2022',
        date: 'Carried forward from the October 2024 vintage',
        note:
          'The projection reads historical levels only, so this window is the ' +
          'one the engine consumes.',
      },
    ],
  },

  verified: {
    id: 'verified',
    label: 'Verified',
    vintage: 'weo-2024-10',
    vintageLabel: 'WEO October 2024 + UN WPP 2022',
    summary: 'The data the published IMF workbook ships.',
    statement: VERIFIED_BADGE,
    sources: [
      {
        dataset: 'Macroeconomic and fiscal series',
        vintage: 'IMF World Economic Outlook, October 2024',
        date: 'Published 22 October 2024',
        note: 'Read from the IMF Q-CRAFT workbook v10, which embeds this vintage.',
      },
      {
        dataset: 'Population by age group',
        vintage: 'UN World Population Prospects, 2022 revision',
        date: 'Published 11 July 2022',
        note: 'Read from the same workbook.',
      },
      {
        dataset: 'Climate GDP losses',
        vintage: 'FADCP Climate Dataset (2024)',
        date: 'Bundled with the workbook',
        note: 'Bundled with the workbook. The About the data panel names the full chain.',
      },
      {
        dataset: 'Labour productivity levels',
        vintage: 'World Bank World Development Indicators, 1991 to 2022',
        date: 'Bundled with the workbook',
      },
    ],
  },
};

export const modeById = (id: ModeId): DataMode => MODES[id];

/** True for a string that names a mode. Guards imported run JSON. */
export function isModeId(value: unknown): value is ModeId {
  return typeof value === 'string' && (MODE_IDS as readonly string[]).includes(value);
}

/** Resolve a vintage id back to its mode, for a run imported by vintage alone. */
export function modeForVintage(vintage: string): ModeId | null {
  const found = MODE_IDS.find((id) => MODES[id].vintage === vintage);
  return found ?? null;
}

// ── The About the data panel ─────────────────────────────────────────────────

/**
 * Plain-language copy for the About the data panel.
 *
 * Register: a friendly guide for intelligent people. It states what the model
 * uses, what it leaves out, and where the reader can check the claim. Strengths
 * and limitations are stated as a pair, per the honest-broker stance, and the
 * IMF material is named as authoritative rather than as competition.
 */
export const ABOUT = {
  lede:
    'Every number in this tool comes from four public data sources run through ' +
    'the Q-CRAFT method. This page says which release of each source you are ' +
    'looking at, where the climate damage estimates come from, and why climate ' +
    'impacts start in 2030.',

  modesHeading: 'Two modes, one engine',
  modesBody:
    'The projection method does not change between modes. Only the input data ' +
    'changes. Verified mode runs the data the published IMF workbook ships, so ' +
    'you can check this tool against the original. Current mode runs the latest ' +
    'releases of the same sources, so the analysis you take into a meeting is ' +
    'not built on data that has aged.',

  climateHeading: 'Where the climate damage estimates come from',
  climateBody:
    'Climate damages come from the FADCP Climate Dataset (Centorrino, Massetti ' +
    'and Tagklis, 2024), which builds on the temperature and growth work of ' +
    'Kahn and others (2021). For each country and scenario it gives one number ' +
    'per year: cumulative GDP loss against a no-warming path. The tool turns ' +
    'that into a labour productivity growth effect, which is the channel ' +
    'through which warming reaches the debt line.',
  /** The precise chain, stated where a reader has come to check the sourcing. */
  climateChain: FADCP_CHAIN.sentence,
  climateLimits:
    'The dataset is temperature-driven. Sea-level rise, individual disasters, ' +
    'tipping points and adaptation costs are outside it, so results read as a ' +
    'lower bound under those channels. For a small number of economies the ' +
    'dataset carries no estimate at all, and the tool says so on screen when you ' +
    'select one.',

  impactHeading: 'Why climate impacts start in 2030',
  impactBody:
    'The IMF method holds the projection to observed and forecast data through ' +
    '2029, then projects from 2030 to 2099. Climate effects apply only to the ' +
    'projected years, so 2030 is the first year a scenario moves away from the ' +
    'baseline. This tool keeps that convention in both modes, including Current ' +
    'mode, where the newer WEO release forecasts past 2029 and is truncated at ' +
    '2029 to hold the boundary. Keeping it is what makes the two tools ' +
    'comparable.',
  impactException:
    'A handful of countries have no WEO data that far out. For those the ' +
    'projection, and with it the climate scenarios, starts the year after their ' +
    'data stops. The shaded band on each chart shows where that boundary falls ' +
    'for the country you are looking at, so it is never further right than the ' +
    'data supports.',
  impactCaveat:
    'The convention was set when 2030 was six years out. It is worth revisiting ' +
    'as the window closes: docs/data-vintages.md records when and why.',

  notImfHeading: 'This is not an IMF product',
  notImfBody:
    'Q-CRAFT Explorer is not an IMF product. It is an independent open-source ' +
    'reimplementation by Teal Insights and NatureFinance. The IMF workbook and ' +
    'the IMF training materials remain the authoritative versions of the ' +
    'method. This tool is complementary to them, and Verified mode exists so ' +
    'you can hold it to that standard.',
} as const;

// ── Country coverage notices ─────────────────────────────────────────────────

/**
 * The climate-coverage notice.
 *
 * Required by the 2026-08-27 gate resolution: eleven selectable countries carry
 * an all-zero climate slice, so all six scenarios land exactly on the baseline
 * (INTEGRATION-REPORT.md section 7.2). Without this, a trainee who picks the
 * Maldives sees six lines on top of each other and reads it as "climate has no
 * fiscal effect here", which is the opposite of what the data means.
 *
 * The app derives the condition from the country's own data rather than from a
 * baked list, so it stays right when a vintage changes.
 */
export const NO_CLIMATE_DATA = {
  heading: 'No climate estimates for this economy',
  body:
    'The climate dataset has no coverage for this economy, so every scenario ' +
    'lands on the baseline. That is missing data, not an absence of risk. ' +
    'Sea-level rise and disaster damage are outside this model everywhere, and ' +
    'for small island and city economies those are usually the channels that ' +
    'matter most.',
  action: 'The baseline projection on this page is unaffected and can be used.',
} as const;

/**
 * The projection-unavailable notice.
 *
 * Two failure shapes, one message each. Both are honest about which one it is,
 * because "we cannot compute this" and "we computed something we do not trust"
 * are different things to a ministry.
 */
export const UNAVAILABLE = {
  heading: 'This country cannot be projected in this mode',
  missingInputs:
    'The source data for this country is missing values the projection needs, ' +
    'so the tool has nothing to draw. This is a gap in the published source ' +
    'data, not a setting you can change.',
  unreliable:
    'The source data for this country is missing government debt figures at the ' +
    'point the projection starts, so the debt path would begin from an anchor ' +
    'that does not exist. The tool stops rather than drawing a line nobody ' +
    'should cite.',
  tryOther:
    'Try the other data mode: coverage differs between vintages, and a country ' +
    'that fails in one release sometimes runs in the other.',
  checkingOther: 'Checking whether the other data mode can project it.',
  bothModes:
    'The other data mode cannot project it either, so this is a gap in the ' +
    'published source data rather than something a different release fixes. ' +
    'Every other country in the list is unaffected.',
} as const;

/** The one-line loading state, so the app never shows an empty chart frame. */
export const LOADING_TEXT = 'Loading country data';
