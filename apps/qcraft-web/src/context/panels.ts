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
export type PanelKey = 'demography' | 'productivity' | 'inflation' | 'interestRate';

export interface DataContext {
  kind: 'panel';
  panel: PanelKey;
  /** Figure identifier, shared with the course's M3 static figures. */
  slug: string;
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

  interest_rate_mode: {
    kind: 'panel',
    panel: 'interestRate',
    slug: 'fig-param-interest-rate',
  },

  debt_target: {
    kind: 'note',
    text:
      'No source publishes the right debt target. It is a policy anchor, often ' +
      'set in a fiscal responsibility charter, and what it does to the path is ' +
      'the thing to understand before choosing one.',
    href: './widgets/debt-dynamics/',
    linkText: 'Open the debt equation sandbox',
  },

  fiscal_rule: {
    kind: 'note',
    text:
      'Turning the rule on lets the primary balance move toward the target ' +
      'instead of staying where the forecast leaves it. The sandbox shows how ' +
      'much of a debt path the primary balance can actually carry.',
    href: './widgets/debt-dynamics/',
    linkText: 'Open the debt equation sandbox',
  },

  expenditure_rigidity: {
    kind: 'note',
    text:
      'Rigidity is the valve between a climate shock and the deficit. At 1.0 ' +
      'spending does not adjust and the whole revenue loss lands on the ' +
      'balance; at 0.0 spending absorbs it.',
    href: './widgets/climate-channel/',
    linkText: 'Open how warming reaches the debt line',
  },
};

/** Which parameters open the same panel, so the panel can name all of them. */
export const PANEL_PARAMS: Record<PanelKey, ParamKey[]> = {
  demography: ['demography_variant'],
  productivity: ['productivity_start', 'productivity_end'],
  inflation: ['inflation_start', 'inflation_end'],
  interestRate: ['interest_rate_mode'],
};

export const PANEL_SLUG: Record<PanelKey, string> = {
  demography: 'fig-param-demography',
  productivity: 'fig-param-productivity',
  inflation: 'fig-param-inflation',
  interestRate: 'fig-param-interest-rate',
};
