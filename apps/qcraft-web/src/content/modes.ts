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

import { PARAM_FIELDS } from './params';

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

/**
 * The four input series, named once.
 *
 * These strings key the source-line lookup the context panels use, so a panel
 * asking "which release of the population data am I drawing" and the About
 * table answering it are reading the same row.
 */
export const DATASET = {
  macrofiscal: 'Macroeconomic and fiscal series',
  demography: 'Population by age group',
  climate: 'Climate GDP losses',
  productivity: 'Labour productivity levels',
} as const;

export type DatasetKey = keyof typeof DATASET;

export interface SourceLine {
  /** What the series is, in the reader's terms. One of `DATASET`. */
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
  /** Exact staged input revision, distinct from its publisher vintage. */
  dataRevision: string;
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
  'Teal Insights verified baseline parity for 147 of 147 tested countries; ' +
  'climate-scenario parity confirmed for ratio metrics only. Reproduces the ' +
  'IMF Excel workbook.';

/**
 * The Current divergence note, one line.
 *
 * It names the one thing that changed (the input vintages) and the one
 * consequence that follows (results move off the workbook's cells). It does not
 * claim the newer numbers are better, because that is not a claim this tool is
 * in a position to make.
 */
export const CURRENT_DIVERGENCE =
  'Newer WEO and population inputs, with a rolling WEO horizon. Long-run assumptions ' +
  'and incremental climate comparisons begin after the usable WEO window. This ' +
  'Explorer extension is not the frozen workbook comparison.';

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
    dataRevision: 'weo-2026-04-full-horizon-v1',
    vintageLabel: 'WEO April 2026 + UN WPP 2024',
    summary: 'WEO April 2026 and UN WPP 2024. Full usable WEO window; retained WDI and climate inputs.',
    statement: CURRENT_DIVERGENCE,
    sources: [
      {
        dataset: DATASET.macrofiscal,
        vintage: 'IMF World Economic Outlook, April 2026',
        date: 'Published 14 April 2026',
        note: 'Fetched from the IMF SDMX API, dataflow IMF.RES:WEO(9.0.0).',
      },
      {
        dataset: DATASET.demography,
        vintage: 'UN World Population Prospects, 2024 revision',
        date: 'Published 11 July 2024',
        note: 'Mid-year population by five-year age group, in thousands.',
      },
      {
        dataset: DATASET.climate,
        vintage: 'FADCP Climate Dataset (2024)',
        date: 'Carried forward from the October 2024 vintage',
        note: 'Retained workbook climate inputs; calendar years are unchanged.',
      },
      {
        dataset: DATASET.productivity,
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
    dataRevision: 'weo-2024-10',
    vintageLabel: 'WEO October 2024 + UN WPP 2022',
    summary: 'The data the published IMF workbook ships.',
    statement: VERIFIED_BADGE,
    sources: [
      {
        dataset: DATASET.macrofiscal,
        vintage: 'IMF World Economic Outlook, October 2024',
        date: 'Published 22 October 2024',
        note:
          'Read from the IMF Q-CRAFT workbook (Dashboard: Version 1.0_11-15-2024), ' +
          'which embeds this vintage.',
      },
      {
        dataset: DATASET.demography,
        vintage: 'UN World Population Prospects, 2022 revision',
        date: 'Published 11 July 2022',
        note: 'Read from the same workbook.',
      },
      {
        dataset: DATASET.climate,
        vintage: 'FADCP Climate Dataset (2024)',
        date: 'Bundled with the workbook',
        note: 'Bundled with the workbook. The About the data panel names the full chain.',
      },
      {
        dataset: DATASET.productivity,
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

/**
 * How one input series names its release, in one vintage.
 *
 * The context panels state the release behind the record they draw, and that
 * release changes with the mode. Reading it off this registry is what keeps a
 * Current-mode panel from claiming the October 2024 vintage in its source line,
 * and it is why no vintage id or release name is written anywhere in
 * src/context/. Falls back to the series name for an unknown vintage, which is
 * a case only an imported run file can produce.
 */
export function releaseFor(vintage: string, dataset: DatasetKey): string {
  const mode = modeForVintage(vintage);
  if (!mode) return DATASET[dataset];
  const line = MODES[mode].sources.find((s) => s.dataset === DATASET[dataset]);
  return line?.vintage ?? DATASET[dataset];
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
    'The four input families have different release dates. Current refreshes WEO ' +
    'and UN population inputs while retaining the workbook WDI and climate slices. ' +
    'The selected run records its exact input revision and usable forecast boundary.',
  modesHeading: 'Two modes, two timing conventions',
  modesBody:
    'Verified preserves the workbook data and timing for the tested comparison. ' +
    'Current uses the full usable WEO window for the selected country, then applies ' +
    'long-run assumptions and incremental climate comparisons. This rolling boundary ' +
    'is an Explorer extension. Current is not a claim that every input is the latest ' +
    'available release, and the Verified badge is a scoped parity result, not IMF endorsement.',
  climateHeading: 'Where the climate damage estimates come from',
  climateBody:
    'The retained climate slice gives annual cumulative GDP effects relative to a ' +
    'reference in which temperatures follow their 1960–2014 trend. Q-CRAFT converts ' +
    'changes in that index into additions to labour productivity growth. The resulting ' +
    'GDP path changes revenue and the spending adjustment, which determine primary ' +
    'balance and debt. Paris can show a gain against this already-warming reference.',
  climateChain: FADCP_CHAIN.sentence,
  climateLimits:
    'This is a long-run temperature/productivity model. It does not simulate a ' +
    'particular drought or flood, sea-level rise, tipping points or adaptation costs. ' +
    'Omitted damaging channels can make the picture conservative, but neither GDP ' +
    'nor debt differences are guaranteed lower bounds. Parameter uncertainty and ' +
    'the absence of wider economic feedback also matter. Missing climate coverage ' +
    'is identified from the selected inputs; coincident scenario lines do not imply no risk.',
  impactHeading: 'Where the WEO window ends and the comparison begins',
  impactBody:
    'The October 2024 User Guide describes WEO through 2028; the subsequently dated ' +
    'workbook (Version 1.0_11-15-2024) carries it through 2029 and projects from 2030. ' +
    'Verified retains that workbook convention. Current keeps all usable WEO years ' +
    'through H. Long-run assumptions and additional climate effects begin in H+1. ' +
    'For Uganda in this Current revision, H is 2031 and the first such year is 2032.',
  impactException:
    'The climate input keeps its original calendar years. Current anchors its ' +
    'comparison at H and applies each annual change from H+1; it neither shifts ' +
    'the climate calendar nor catches up earlier changes. The result is an incremental ' +
    'comparison after the WEO window, not a measure of total climate damage since 2030.',
  impactCaveat:
    'WEO values include estimates and projections. The available payload does not ' +
    'identify a reliable last-outturn year, so the shaded WEO band is not labelled ' +
    'observed history. Nor is WEO a climate-free counterfactual.',
  anchorNote:
    'Current checks the inputs required to support a usable boundary. A shorter ' +
    'supported window is labelled with its actual H and reason; unsupported inputs ' +
    'produce no projection. Source years are retained even where the usable horizon ' +
    'is shorter. Read the selected-run boundary and coverage notice before interpreting a result.',

  /**
   * What the workbook offers that this tool does not yet. Data-driven: an item
   * tied to a parameter key drops off the moment that parameter is registered
   * in content/params.ts, so the list cannot go stale as features ship.
   * Neutral register throughout: the workbook is the canonical artefact, never
   * a legacy one.
   */
  workbookOnlyHeading: 'What the IMF workbook offers that this tool does not yet',
  workbookOnlyLede:
    'The workbook lets its user do the following. This tool does not, yet, and ' +
    'says so here rather than leaving the gap to be discovered in a meeting.',
  workbookOnly: [
    {
      text:
        'Replace the WEO, UN population and productivity series with your own ' +
        'estimates by pasting them into the blue cells of the Macrofiscal, ' +
        'Demography and Productivity worksheets, including DSA projections that ' +
        'run past 2029 (User Guide, sections II.A and II.B).',
    },
    {
      text:
        'Enter discrete fiscal risks and natural-disaster costs by hand on the ' +
        'Discrete Risks worksheet, per scenario, as a share of GDP, for revenue ' +
        'and primary expenditure from 2030 to 2099 (Read Me step 9; User Guide, ' +
        'section II.C).',
    },
    {
      text:
        'Set the long-run real interest rate used by the constant-real approach ' +
        '(Dashboard cell C29).',
      paramKey: 'long_run_interest_rate',
    },
    {
      text:
        'Adjust the workbook\u2019s Turning Point timing parameter for productivity ' +
        'convergence. Higher values shift the transition later (Productivity ' +
        'worksheet; User Guide footnote 7).',
      paramKey: 'productivity_turning_point',
    },
    {
      text:
        'Check the productivity level relative to the OECD, which the guide ' +
        'calls the key realism check on the productivity assumptions (Read Me ' +
        'step 3; User Guide, section II.B).',
    },
  ] as readonly WorkbookFeature[],

  notImfHeading: 'This is not an IMF product',
  notImfBody:
    'Q-CRAFT Explorer is not an IMF product. It is an independent open-source ' +
    'reimplementation by Teal Insights and NatureFinance. The IMF workbook and ' +
    'the IMF training materials remain the authoritative versions of the ' +
    'method. This tool is complementary to them, and Verified mode exists so ' +
    'you can hold it to that standard.',
} as const;

/** One thing the workbook offers. `paramKey` names the parameter that retires it. */
export interface WorkbookFeature {
  text: string;
  /** A key in content/params.ts. When registered, the item is no longer a gap. */
  paramKey?: string;
}

/** The gaps still open: every workbook feature whose parameter is not registered. */
export function workbookOnlyItems(): readonly WorkbookFeature[] {
  const registered = new Set<string>(PARAM_FIELDS.map((f) => f.key));
  return ABOUT.workbookOnly.filter(
    (item) => item.paramKey === undefined || !registered.has(item.paramKey),
  );
}

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
    'The climate dataset has no coverage for this economy (IMF User Guide, ' +
    'footnote 12), so every scenario lands on the baseline. That is missing ' +
    'data, not an absence of risk. ' +
    'Sea-level rise and disaster damage are outside this model everywhere, and ' +
    'for small island and city economies those are usually the channels that ' +
    'matter most.',
  action: 'The baseline projection on this page is unaffected and can be used.',
} as const;

/**
 * The anchor-shift notice.
 *
 * Teal's decision of 2026-08-28 on CC-6's change request: keep computing for a
 * country whose source stops reporting before the release ends, and name the
 * anchor year on screen wherever its results show.
 *
 * The wording says what happened and what follows from it, and stops there. The
 * comparison with the workbook is a longer thought and belongs where a reader
 * goes looking for it, which is `ABOUT.anchorNote`.
 *
 * Both years are the country's own, read off its data, so no list of country
 * codes is baked in anywhere and the notice stays right when a vintage changes.
 */
export const ANCHOR_SHIFT = {
  heading: 'This projection starts from an earlier year',
  /** The country's own sentence. Composed here so the wording stays in one file. */
  line: (countryName: string, anchorYear: number, sourceMaxYear: number): string =>
    `The source data stops reporting the figures this projection needs after ` +
    `${anchorYear}, although the release itself runs to ${sourceMaxYear}. So the ` +
    `projection for ${countryName} is anchored on ${anchorYear}, the last year ` +
    `usable, and every year after it follows the long-run model. The WEO window ` +
    `itself includes estimates and projections.`,
  action:
    'The shaded band on each chart shows where that boundary falls. About the ' +
    'data explains how this differs from the published Excel workbook.',
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
  // "Every other country in the list is unaffected" used to close this
  // sentence. It was not true: eight countries cannot be projected on the April
  // 2026 vintage and nine on the frozen one, for four different reasons, and
  // docs/country-coverage.md lists them. A notice that overstates how isolated a
  // gap is is the same kind of error as a chart drawn from a missing number.
  bothModes:
    'The other data mode cannot project it either, so this is a gap in the ' +
    'published source data rather than something a different release fixes. ' +
    'A small number of countries are affected; most of the list projects ' +
    'normally.',
  /**
   * Where to go from here.
   *
   * The screen this notice owns used to end at the notice, with the rest of
   * the workspace blank. That is the wrong shape for the moment it appears in:
   * somebody has just been told the tool will not draw their country, and the
   * one question they have next is which input is missing. The context panels
   * answer exactly that and are open to a blocked country by design, so the
   * notice names them rather than leaving the reader at a dead end.
   */
  whereNext:
    'The source data behind each parameter is still available: open Context ' +
    'beside any control in the sidebar to see what the published series does ' +
    'and does not carry for this country. About the data lists which countries ' +
    'are affected in each release, and why.',
} as const;

/** The one-line loading state, so the app never shows an empty chart frame. */
export const LOADING_TEXT = 'Loading country data';
