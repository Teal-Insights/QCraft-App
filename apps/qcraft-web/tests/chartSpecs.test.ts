/**
 * The two registers, and the titles the briefing register computes.
 *
 * Two things need mechanical enforcement here.
 *
 * FIRST, that a computed title is actually computed. A title that names a
 * crossing year is a claim about the projection, and the failure mode that
 * matters on a ministry-facing tool is a sentence that reads like a finding but
 * is really a constant. So the crossing branches are exercised against
 * synthetic paths built to cross, and the assertion is on the year.
 *
 * SECOND, that the titles obey the house style. A register generates its prose
 * programmatically, so the ternaries themselves have to produce compliant
 * sentences: no em-dashes, and none of the three banned title shapes (tics 10,
 * 11 and 12 in context/style-guide-writing-AI.md). tests/copy.test.ts lints the
 * packet's prose the same way; this lints the register's.
 *
 * Set QCRAFT_WRITE_SVG=<dir> to also dump each chart's export SVG there, which
 * is how the visual QA loop looks at the printed figure rather than the screen.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { ENGINE_DEFAULTS, type EngineResult } from '../src/engine/adapter';
import { fixtureEngine } from '../src/engine/mockAdapter';
import { buildChartPlan } from '../src/charts/plan';
import { renderSpecSvg } from '../src/charts/svg';
import { buildCharts, overviewChart, specFor } from '../src/charts/specs';
import { CHART_REGISTERS } from '../src/charts/register';
import { baselineDebtTitle } from '../src/charts/titles';
import { envelope, thresholdFacts } from '../src/charts/facts';

const result = fixtureEngine.run(ENGINE_DEFAULTS);
const ctx = { result, params: ENGINE_DEFAULTS, defaults: ENGINE_DEFAULTS };
const charts = buildCharts(ctx);

const EM_DASH = '—';

/**
 * The three banned title shapes, as patterns.
 *
 * Tic 10, the appended-judgment tail: a clause telling the reader how to feel.
 * Tic 11, the participle tagline: the "X, made Y" marketing cadence.
 * Tic 12, compound assertion-amplification: ", and" plus a restatement.
 * Tic 12 cannot be caught by a pattern in general, so the proxy is the shape it
 * always takes in a title, a second independent clause after ", and".
 */
const BANNED_TITLE_SHAPES: Array<{ name: string; pattern: RegExp }> = [
  { name: 'appended-judgment tail (tic 10)', pattern: /,\s*(and that|which is exactly|and that's)/i },
  { name: 'participle tagline (tic 11)', pattern: /,\s*made\s+\w+\.?$/i },
  { name: 'compound assertion-amplification (tic 12)', pattern: /,\s*and\s+\w+\s+\w+/i },
];

/** Filler the style guide cuts outright. */
const BANNED_WORDS = [
  'genuinely',
  'simply',
  'straightforward',
  'clearly',
  'obviously',
  'robust',
  'seamless',
  'leverage',
  'delve',
];

function everySpec() {
  return charts.flatMap((chart) =>
    CHART_REGISTERS.flatMap((register) => {
      const spec = specFor(chart, register);
      return spec ? [{ chart, register, spec }] : [];
    }),
  );
}

/** Replace the baseline's debt path so a title branch can be forced. */
function withBaselineDebt(values: (year: number) => number): EngineResult {
  return {
    ...result,
    scenarios: result.scenarios.map((s) =>
      s.key === 'Baseline'
        ? { ...s, fiscal: s.fiscal.map((f) => ({ ...f, debt_to_gdp: values(f.year) })) }
        : s,
    ),
  };
}

describe('the register split', () => {
  it('gives every chart at least one register', () => {
    for (const chart of charts) {
      expect(chart.workbook ?? chart.briefing, `${chart.id} defines neither register`).toBeTruthy();
    }
  });

  it('keeps the workbook register free of the briefing decorations', () => {
    for (const chart of charts) {
      const spec = chart.workbook;
      if (!spec) continue;
      expect(spec.bands ?? [], `${chart.id} workbook has a band`).toHaveLength(0);
      expect(spec.thresholds ?? [], `${chart.id} workbook has a threshold`).toHaveLength(0);
      expect(spec.brackets ?? [], `${chart.id} workbook has a bracket`).toHaveLength(0);
      expect(spec.annotations ?? [], `${chart.id} workbook has a callout`).toHaveLength(0);
      expect(spec.series.some((s) => s.muted), `${chart.id} workbook mutes a series`).toBe(false);
    }
  });

  it('gives every briefing chart something that carries its message', () => {
    for (const chart of charts) {
      const spec = chart.briefing;
      if (!spec) continue;
      const decorated =
        (spec.bands?.length ?? 0) +
        (spec.thresholds?.length ?? 0) +
        (spec.brackets?.length ?? 0) +
        (spec.annotations?.length ?? 0) +
        spec.series.filter((s) => s.directLabel).length;
      expect(decorated, `${chart.id} briefing states its message nowhere`).toBeGreaterThan(0);
    }
  });

  it('carries a source line on every figure, in both registers', () => {
    for (const { chart, register, spec } of everySpec()) {
      expect(spec.source, `${chart.id} (${register}) has no source line`).toBeTruthy();
      expect(spec.source).toContain(result.provenance.dataVintage);
    }
  });

  it('labels the cover chart with real scenario paths, not envelope edges', () => {
    // The envelope is a per-year max and min across every scenario, so its
    // upper edge is whichever scenario is highest that year. A line labelled
    // "Hot unadapted" has to BE Hot unadapted in every year, not the
    // envelope that touches it at the horizon.
    const cover = overviewChart(ctx)?.briefing;
    expect(cover).toBeTruthy();
    for (const s of cover!.series) {
      const scenario = result.scenarios.find((x) => x.key === s.key);
      expect(scenario, `cover series ${s.key} names no scenario`).toBeTruthy();
      const truth = scenario!.fiscal.map((f) => f.debt_to_gdp);
      expect(s.points.map((p) => p.value)).toEqual(truth);
    }
  });

  it('gives the packet cover a chart of its own', () => {
    const cover = overviewChart(ctx);
    expect(cover?.briefing).toBeTruthy();
    // A cover figure is a takeaway by definition, so there is no workbook twin
    // to fall back to.
    expect(cover?.workbook).toBeUndefined();
  });
});

describe('computed titles', () => {
  it('names the crossing year when the path crosses the target', () => {
    // A path that sits under 50 through 2060 and above it after.
    const crossing = withBaselineDebt((year) => (year < 2061 ? 40 : 60));
    const title = baselineDebtTitle({
      countryName: 'Testland',
      points: crossing.scenarios[0]!.fiscal.map((f) => ({
        year: f.year,
        value: f.debt_to_gdp,
      })),
      target: 50,
      boundaryYear: crossing.weoBoundaryYear,
    });
    expect(title).toContain('2061');
    expect(title).toContain('passes');
  });

  it('says the path stays under when it never crosses', () => {
    const flat = withBaselineDebt(() => 30);
    const title = baselineDebtTitle({
      countryName: 'Testland',
      points: flat.scenarios[0]!.fiscal.map((f) => ({ year: f.year, value: f.debt_to_gdp })),
      target: 50,
      boundaryYear: flat.weoBoundaryYear,
    });
    expect(title).toContain('stays under');
    expect(title).not.toMatch(/\b(19|20)\d\d\b.*passes/);
  });

  it('drops the target entirely when the fiscal rule is off', () => {
    const off = buildCharts({
      result,
      params: { ...ENGINE_DEFAULTS, fiscal_rule: 'No' },
      defaults: ENGINE_DEFAULTS,
    });
    for (const chart of off) {
      const spec = chart.briefing;
      if (!spec) continue;
      expect(spec.thresholds ?? [], `${chart.id} drew a target with the rule off`).toHaveLength(0);
    }
    const debt = off.find((c) => c.id === 'baseline-debt');
    expect(debt?.briefing?.title).toContain('fiscal rule off');
  });

  it('ignores a target the run could not honour, and says so in the label', () => {
    // The fixture adapter serves one parameter set and reports what it ignored,
    // so a requested 30% target must not become a rule the chart draws at 30.
    const requested = { ...ENGINE_DEFAULTS, debt_target: 30 };
    const ignoredResult = fixtureEngine.run(requested);
    const built = buildCharts({
      result: ignoredResult,
      params: requested,
      defaults: ENGINE_DEFAULTS,
    });
    const rule = built.find((c) => c.id === 'baseline-debt')?.briefing?.thresholds?.[0];
    expect(rule?.value).toBe(ENGINE_DEFAULTS.debt_target);
    expect(rule?.label).toContain('as run');
  });
});

describe('title copy rules', () => {
  it('has no em-dash in any title or subtitle', () => {
    for (const { chart, register, spec } of everySpec()) {
      expect(spec.title.includes(EM_DASH), `${chart.id} (${register}) title`).toBe(false);
      expect(spec.subtitle?.includes(EM_DASH) ?? false, `${chart.id} (${register}) subtitle`).toBe(
        false,
      );
    }
  });

  it('avoids the three banned title shapes', () => {
    for (const { chart, register, spec } of everySpec()) {
      for (const { name, pattern } of BANNED_TITLE_SHAPES) {
        expect(pattern.test(spec.title), `${chart.id} (${register}) title uses the ${name}`).toBe(
          false,
        );
      }
    }
  });

  it('avoids the filler the style guide cuts', () => {
    for (const { chart, register, spec } of everySpec()) {
      const prose = `${spec.title} ${spec.subtitle ?? ''}`.toLowerCase();
      for (const word of BANNED_WORDS) {
        expect(prose.includes(word), `${chart.id} (${register}) uses "${word}"`).toBe(false);
      }
    }
  });
});

describe('the chart compiler', () => {
  it('draws the threshold, the band and the bracket the briefing spec asks for', () => {
    const fan = charts.find((c) => c.id === 'analysis-debt')?.briefing;
    expect(fan).toBeTruthy();
    const plan = buildChartPlan(fan!, { width: 900, height: 460 });

    // The band is the only filled path; every series path is stroked.
    const filled = plan.prims.filter((p) => p.kind === 'path' && p.fill && p.fill !== 'none');
    expect(filled).toHaveLength(1);

    const dashed = plan.prims.filter((p) => p.kind === 'line' && p.dash === '7,4');
    expect(dashed, 'the debt target rule').toHaveLength(1);

    const bracketLabel = plan.prims.find(
      (p) => p.kind === 'text' && p.text.includes('points of GDP'),
    );
    expect(bracketLabel, 'the spread bracket label').toBeTruthy();
  });

  it('keeps every path on the chart even when the register mutes it', () => {
    const fan = charts.find((c) => c.id === 'analysis-debt');
    const workbook = buildChartPlan(fan!.workbook!, { width: 900, height: 460 });
    const briefing = buildChartPlan(fan!.briefing!, { width: 900, height: 460 });
    const strokedPaths = (plan: ReturnType<typeof buildChartPlan>) =>
      plan.prims.filter((p) => p.kind === 'path' && p.stroke).length;
    // Muting removes emphasis, never a path. Dropping the middle scenarios
    // would change what the chart claims.
    expect(strokedPaths(briefing)).toBe(strokedPaths(workbook));
  });

  it('never truncates the value axis', () => {
    for (const { chart, register, spec } of everySpec()) {
      const plan = buildChartPlan(spec, { width: 800, height: 380 });
      if (plan.empty) continue;
      const values = spec.series.flatMap((s) => s.points.map((p) => p.value));
      const [lo, hi] = plan.y.domain() as [number, number];
      expect(Math.min(...values), `${chart.id} (${register}) clips its low end`).toBeGreaterThanOrEqual(lo);
      expect(Math.max(...values), `${chart.id} (${register}) clips its high end`).toBeLessThanOrEqual(hi);
    }
  });

  it('keeps a threshold inside the drawn range, so a rule is never clipped', () => {
    for (const { chart, register, spec } of everySpec()) {
      const plan = buildChartPlan(spec, { width: 800, height: 380 });
      for (const t of spec.thresholds ?? []) {
        const [lo, hi] = plan.y.domain() as [number, number];
        expect(t.value, `${chart.id} (${register}) clips its threshold`).toBeGreaterThanOrEqual(lo);
        expect(t.value).toBeLessThanOrEqual(hi);
      }
    }
  });
});

// ── The freeze visual pass ───────────────────────────────────────────────────
//
// Three defects found by looking at the built app rather than by reading it,
// each with the assertion that would have caught it. They are grouped because
// they share a cause: a chart is a picture, and a picture can contradict its
// own caption, hide its own label, or offer a key that cannot be used, while
// every type in the file still checks out.

describe('the caption agrees with the picture', () => {
  it('names the boundary year the chart actually shades', () => {
    // Syria's frozen-vintage band ends in 2010 against a release that runs to
    // 2029. The subtitle said "through 2029" for every country, and the anchor
    // notice above the chart points at that band by name.
    const early = { ...result, weoBoundaryYear: 2010 };
    const charts2010 = buildCharts({
      result: early,
      params: ENGINE_DEFAULTS,
      defaults: ENGINE_DEFAULTS,
    });
    const debt = charts2010.find((c) => c.id === 'baseline-debt');
    for (const register of CHART_REGISTERS) {
      const spec = specFor(debt!, register);
      expect(spec?.subtitle, register).toContain('through 2010');
      expect(spec?.subtitle, register).not.toContain('through 2029');
      expect(spec?.weoBoundaryYear, register).toBe(2010);
    }
  });
});

describe('the threshold label lands where nothing is drawn', () => {
  const rule = { value: 50, label: 'Your debt target, 50% of GDP' };
  const labelOf = (plan: ReturnType<typeof buildChartPlan>) =>
    plan.prims.find((p) => p.kind === 'text' && p.text === rule.label);
  const ruleY = (plan: ReturnType<typeof buildChartPlan>) =>
    plan.prims.find((p) => p.kind === 'line' && p.dash === '7,4');

  const planFor = (values: number[]) =>
    buildChartPlan(
      {
        id: 'test',
        title: 'test',
        series: [
          {
            key: 'a',
            label: 'a',
            color: '#123456',
            points: values.map((value, i) => ({ year: 2000 + i * 10, value })),
          },
        ],
        thresholds: [rule],
      },
      { width: 800, height: 380 },
    );

  it('goes below the rule when the data crowds the space above it', () => {
    // Uganda's shape: a path that ends just above a 50% target with nothing at
    // all below it. The label used to go above and the line ran through the
    // words, and the halo then broke the line for 390px of an 890px plot.
    const plan = planFor([51, 51.5, 52, 52.2]);
    const label = labelOf(plan);
    const line = ruleY(plan);
    expect(label, 'the threshold label').toBeTruthy();
    expect(label!.kind === 'text' && line!.kind === 'line' && label!.y > line!.y1).toBe(true);
  });

  it('goes above the rule when the data crowds the space below it', () => {
    const plan = planFor([48, 47.5, 47, 46.8]);
    const label = labelOf(plan);
    const line = ruleY(plan);
    expect(label!.kind === 'text' && line!.kind === 'line' && label!.y < line!.y1).toBe(true);
  });

  it('is drawn after the series, so its halo is not painted over', () => {
    const plan = planFor([51, 51.5, 52, 52.2]);
    const labelAt = plan.prims.findIndex((p) => p.kind === 'text' && p.text === rule.label);
    const lastPath = plan.prims.map((p) => p.kind).lastIndexOf('path');
    expect(labelAt).toBeGreaterThan(lastPath);
  });
});

describe('the legend can actually be used', () => {
  it('gives the muted band one entry rather than one per muted series', () => {
    // Four scenarios drawn in the same gray produced four identical gray
    // swatches against four different names, which invites a reader to match a
    // swatch to a line and then gives them no way to do it.
    const fan = charts.find((c) => c.id === 'analysis-debt')?.briefing;
    expect(fan).toBeTruthy();
    const mutedCount = fan!.series.filter((s) => s.muted).length;
    expect(mutedCount, 'the fixture has a muted band to collapse').toBeGreaterThan(1);

    const svg = renderSpecSvg(fan!, { withChrome: true });
    const swatches = svg.match(/<rect[^>]*height="3"[^>]*\/>/g) ?? [];
    expect(swatches).toHaveLength(fan!.series.length - mutedCount + 1);
    expect(svg).toContain(`The ${mutedCount} scenarios in between`);
    for (const s of fan!.series.filter((x) => x.muted)) {
      expect(svg, `${s.label} is inside the band, not a legend entry`).not.toContain(
        `>${s.label}</text>`,
      );
    }
  });

  it('still names every series when none of them is muted', () => {
    const workbook = charts.find((c) => c.id === 'analysis-debt')?.workbook;
    const svg = renderSpecSvg(workbook!, { withChrome: true });
    for (const s of workbook!.series) {
      expect(svg, s.label).toContain(`>${s.label}</text>`);
    }
  });
});

describe('the export renders the same picture', () => {
  it('serialises every spec without a DOM', () => {
    const written = process.env.QCRAFT_WRITE_SVG;
    if (written) mkdirSync(written, { recursive: true });

    for (const { chart, register, spec } of everySpec()) {
      const svg = renderSpecSvg(spec, { width: 820, withChrome: true });
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg).toContain('role="img"');
      // The takeaway title has to be IN the picture. A PNG of a briefing chart
      // with its message stripped off is a chart with no message left.
      expect(svg).toContain(spec.title.split(' ')[0]!);
      expect(svg).not.toContain(EM_DASH);
      if (written) writeFileSync(`${written}/${chart.id}-${register}.svg`, svg, 'utf8');
    }
  });

  it('emits the same decoration count as the on-screen plan', () => {
    for (const { spec } of everySpec()) {
      const plan = buildChartPlan(spec, { width: 820, height: spec.height ?? 380 });
      const svg = renderSpecSvg(spec, { width: 820, height: spec.height ?? 380 });
      const svgPaths = (svg.match(/<path /g) ?? []).length;
      const planPaths = plan.prims.filter((p) => p.kind === 'path').length;
      expect(svgPaths).toBe(planPaths);
    }
  });
});

describe('run facts', () => {
  it('reports no crossing rather than inventing one', () => {
    const flat = Array.from({ length: 20 }, (_, i) => ({ year: 2030 + i, value: 30 }));
    const facts = thresholdFacts(flat, 50, 2030);
    expect(facts?.crossing).toBeUndefined();
    expect(facts?.endsAbove).toBe(false);
  });

  it('builds an envelope only where every path has a value', () => {
    const a = [
      { year: 2030, value: 1 },
      { year: 2031, value: 2 },
    ];
    const b = [{ year: 2030, value: 5 }];
    const env = envelope([a, b]);
    expect(env?.lower).toEqual([{ year: 2030, value: 1 }]);
    expect(env?.upper).toEqual([{ year: 2030, value: 5 }]);
  });
});
