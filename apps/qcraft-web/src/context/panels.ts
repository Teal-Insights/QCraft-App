/**
 * The context registry: what sits behind the context button on each parameter.
 *
 * Two kinds of context, because two kinds of parameter.
 *
 *   A DATA parameter is one where a published source has a view. The UN
 *   publishes three population variants; the WEO publishes a deflator path; the
 *   World Bank publishes a productivity record. For these the honest thing is
 *   to show the record and let the user place their setting against it, so the
 *   button opens a panel.
 *
 *   A JUDGMENT parameter is one where no source has a view because the question
 *   is not empirical. Nobody publishes "the right debt target" or "how sticky
 *   spending should be". Showing a chart there would dress a policy choice as a
 *   measurement. For these the button reveals one line and a link to the
 *   teaching widget that builds the intuition instead.
 *
 * ── What changed in run 5 ─────────────────────────────────────────────────────
 * Two parameters moved from note to panel, and neither moved because a source
 * started publishing a view. Both moved because the bundle turned out to carry
 * the RECORD a judgment is made against, which is a different thing and is
 * labelled as one:
 *
 *   `debt_target` still has no published right answer. What the panel shows is
 *   where debt actually is across countries and where this country has been, so
 *   the anchor is chosen against the world rather than against nothing.
 *   No fiscal-rule ceiling is bundled; docs/parameter-data.md section 9 records
 *   why not.
 *
 *   `expenditure_rigidity` is the hardest case in the app. The engine's own
 *   algebra says rigidity is one minus the elasticity of primary expenditure to
 *   GDP, and the WEO history records that elasticity badly: precisely enough to
 *   bound it for a group of countries, nowhere near precisely enough to measure
 *   it for one. So the panel shows the bound and the scatter it came from, and
 *   it ranks nobody. docs/parameter-data.md section 7 is the working, including
 *   the gate this shipped behind.
 *
 * ── Figure naming, shared with the course ─────────────────────────────────────
 * `slug` is the figure identifier the course's M3 static figures use for the
 * same content, so a reader can move between the guide and the app without
 * having to work out which figure is which. The scheme is `fig-param-<param>`,
 * following the Quarto `fig-` label convention the guide already uses.
 *
 * SHARED carried no naming convention at the time this was written
 * (REFERENCE-NOTES.md records the intent, not the scheme), so this is a
 * proposal for lane 4 to adopt, recorded in MORNING-REPORT.md. If lane 4 has
 * already published something different, this file is the only place to change.
 */

import type { ParamKey } from '../content/params';

/** The panels, in the order their parameters appear in the sidebar. */
export type PanelKey =
  | 'demography'
  | 'productivity'
  | 'inflation'
  | 'interestRate'
  | 'debtTarget'
  | 'rigidity';

export interface DataContext {
  kind: 'panel';
  panel: PanelKey;
  /** Figure identifier, shared with the course's M3 static figures. */
  slug: string;
  /**
   * The teaching widget behind this parameter, where one exists.
   *
   * A panel shows the record; a widget builds the intuition. They are different
   * jobs, and `debt_target` and `expenditure_rigidity` want both: the record
   * says where other countries sit, and the widget says what the setting does
   * to the path. Held for Teal as MERGE-REPORT.md section 8.1 when these two
   * parameters moved from note to panel and the note's link went with them,
   * approved in the 2026-08-27 night held-item resolutions, and rendered in the
   * panel footer rather than the sidebar so it sits at the point of decision.
   */
  href?: string;
  linkText?: string;
}

export interface JudgmentContext {
  kind: 'note';
  /** One line. Not a summary of the parameter, but why no chart is offered. */
  text: string;
  /** The teaching widget that builds the intuition, relative to the app root. */
  href?: string;
  linkText?: string;
}

export type ParamContext = DataContext | JudgmentContext;

export const PARAM_CONTEXT: Partial<Record<ParamKey, ParamContext>> = {
  iso3c: {
    kind: 'note',
    text:
      'Selecting a country loads its WEO macroeconomic history and forecast and ' +
      'its UN population projections. Nothing is typed in by hand, so the ' +
      'country choice fixes the data vintage for the whole run.',
  },

  demography_variant: {
    kind: 'panel',
    panel: 'demography',
    slug: 'fig-param-demography',
  },

  productivity_start: {
    kind: 'panel',
    panel: 'productivity',
    slug: 'fig-param-productivity',
  },
  productivity_turning_point: {
    kind: 'panel',
    panel: 'productivity',
    slug: 'fig-param-productivity',
  },
  productivity_end: {
    kind: 'panel',
    panel: 'productivity',
    slug: 'fig-param-productivity',
  },

  inflation_start: {
    kind: 'panel',
    panel: 'inflation',
    slug: 'fig-param-inflation',
  },
  inflation_end: {
    kind: 'panel',
    panel: 'inflation',
    slug: 'fig-param-inflation',
  },

  long_run_interest_rate: {
    kind: 'panel',
    panel: 'interestRate',
    slug: 'fig-param-interest-rate',
  },
  interest_rate_mode: {
    kind: 'panel',
    panel: 'interestRate',
    slug: 'fig-param-interest-rate',
  },

  debt_target: {
    kind: 'panel',
    panel: 'debtTarget',
    slug: 'fig-param-debt-target',
    href: './widgets/debt-dynamics/',
    linkText: 'Open the debt dynamics equation sandbox',
  },

  fiscal_rule: {
    kind: 'note',
    text:
      'Turning the rule on lets the primary balance move toward the target ' +
      'instead of staying where the forecast leaves it. The sandbox shows how ' +
      'much of a debt path the primary balance can actually carry.',
    href: './widgets/debt-dynamics/',
    linkText: 'Open the debt dynamics equation sandbox',
  },

  expenditure_rigidity: {
    kind: 'panel',
    panel: 'rigidity',
    slug: 'fig-param-rigidity',
    href: './widgets/climate-channel/',
    linkText: 'Open how warming reaches the debt line',
  },
};

/**
 * The widget link a panel carries in its footer, or null.
 *
 * Read off `PARAM_CONTEXT` rather than written a second time, so a panel and
 * the parameter it belongs to cannot disagree about which widget teaches it.
 */
export function panelWidgetLink(
  panel: PanelKey,
): { href: string; linkText: string } | null {
  for (const key of PANEL_PARAMS[panel]) {
    const context = PARAM_CONTEXT[key];
    if (context?.kind === 'panel' && context.href && context.linkText) {
      return { href: context.href, linkText: context.linkText };
    }
  }
  return null;
}

/** Which parameters open the same panel, so the panel can name all of them. */
export const PANEL_PARAMS: Record<PanelKey, ParamKey[]> = {
  demography: ['demography_variant'],
  productivity: ['productivity_start', 'productivity_end', 'productivity_turning_point'],
  inflation: ['inflation_start', 'inflation_end'],
  interestRate: ['interest_rate_mode', 'long_run_interest_rate'],
  debtTarget: ['debt_target'],
  rigidity: ['expenditure_rigidity'],
};

export const PANEL_SLUG: Record<PanelKey, string> = {
  demography: 'fig-param-demography',
  productivity: 'fig-param-productivity',
  inflation: 'fig-param-inflation',
  interestRate: 'fig-param-interest-rate',
  debtTarget: 'fig-param-debt-target',
  rigidity: 'fig-param-rigidity',
};

/**
 * The parameter each panel writes a rationale sentence for. A panel that serves
 * two parameters (productivity, inflation) writes to the long-run one, because
 * that is the judgment the peer comparison bears on: the start value is anchored
 * by the forecast and the long-run value is not anchored by anything.
 */
export const PANEL_RATIONALE_PARAM: Record<PanelKey, ParamKey> = {
  demography: 'demography_variant',
  productivity: 'productivity_end',
  inflation: 'inflation_end',
  interestRate: 'interest_rate_mode',
  debtTarget: 'debt_target',
  rigidity: 'expenditure_rigidity',
};
