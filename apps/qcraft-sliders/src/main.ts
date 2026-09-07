import './style.css';
import * as d3 from 'd3';
import { makeChart } from './chart';
import {
  SERIES_LABEL, SHARED, debtSeries, horizon, loadCountry, loadIndex, reference, run, valueAt,
  type CountryIndex, type CountryRow, type Params, type SeriesKey,
} from './engine';
import { PANELS, type ControlValue, type PanelSpec } from './panels';
import { SECTIONS, fill, paragraphHtml, parseCards, type CardText } from './content';
import { NODE_CAPTION, chainSvg } from './chain';

const fmt1 = d3.format('.1f');
const CARDS = parseCards();

/** Engine provenance and the sibling pages, for the state strip and the footer. */
const ENGINE_REVISION = 'a6313ad7';
const LINKS = {
  explorer: 'https://teal-insights.github.io/QCraft-App/explorer/',
  companion: 'https://teal-insights.github.io/QCraft-App/guide/',
  imf: 'https://www.imf.org/en/topics/fiscal-policies/fiscal-risks/fiscal-risks-toolkit/fiscal-risks-toolkit-q-craft',
};

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

/**
 * URL switches, for deep links and headless checks:
 *   ?country=UGA       ISO3 code from the inputs archive (default UGA)
 *   &preset=teaching   label the reference settings as the Teaching preset (same values, generic wording)
 *   &try               open every panel at its suggested try value
 *   &on=Hot            show the toggle panels on the Hot path instead of Baseline
 *   &channel=N         open every panel on its Nth channel (0-based)
 *   &open              open every card's folded sections (for review and screenshots)
 */
const QUERY = new URLSearchParams(location.search);
const COUNTRY = (QUERY.get('country') ?? 'UGA').toUpperCase();
const PRESET = QUERY.get('preset') === 'teaching' ? 'teaching' : 'defaults';
const OPEN_AT_TRY = QUERY.has('try');
const OPEN_ON: SeriesKey = QUERY.get('on') === 'Hot' ? 'Hot' : 'Baseline';
const OPEN_CHANNEL = Math.max(0, Number(QUERY.get('channel') ?? 0) || 0);
const OPEN_ALL = QUERY.has('open');

interface Vars { country: string; lastWeoYear: number; firstLongRunYear: number; turningYear: number }

function settingsList(): string[] {
  return [
    `demography ${SHARED.demography_variant}`,
    `productivity ${fmt1(SHARED.productivity_start)} to ${fmt1(SHARED.productivity_end)} percent, turning point ${SHARED.productivity_turning_point}`,
    `inflation ${fmt1(SHARED.inflation_start)} to ${fmt1(SHARED.inflation_end)} percent`,
    'constant nominal interest rate',
    `debt target ${SHARED.debt_target} percent of GDP`,
    `fiscal rule ${SHARED.fiscal_rule === 'Yes' ? 'on' : 'off'}`,
    `expenditure rigidity ${fmt1(SHARED.expenditure_rigidity)}`,
  ];
}

function buildHeader(root: HTMLElement, index: CountryIndex, row: CountryRow, specs: PanelSpec[], vars: Vars | null) {
  const h = el('header', 'header');
  const top = el('div', 'header__top');
  const titles = el('div');
  titles.append(el('p', 'header__kicker', PRESET === 'teaching' ? 'Teal Insights · Q-CRAFT Explorer · Teaching preset' : 'Teal Insights · Q-CRAFT Explorer'));
  titles.append(el('h1', 'header__title', 'Q-CRAFT, one input at a time'));
  titles.append(el('p', 'header__lede', 'Each card changes one input of the IMF Q-CRAFT model, holds everything else at the reference settings, and shows what that input alone does to the debt path of any country in the Explorer’s data.'));
  top.append(titles);

  // Country selector: every country in the accepted Current-mode payload.
  const pick = el('div', 'picker');
  const lab = el('label', 'picker__label', 'Country');
  lab.htmlFor = 'country';
  const sel = el('select');
  sel.id = 'country';
  for (const c of index.countries) {
    const o = el('option', undefined, c.coverageStatus === 'unsupported' ? `${c.country} (not supported)` : c.coverageStatus === 'shorter' ? `${c.country} (WEO to ${c.weoMaxYear})` : c.country);
    o.value = c.iso3c;
    sel.append(o);
  }
  sel.value = row.iso3c;
  sel.addEventListener('change', () => {
    const q = new URLSearchParams(location.search);
    q.set('country', sel.value);
    location.assign(`${location.pathname}?${q.toString()}${location.hash}`);
  });
  pick.append(lab, sel);
  top.append(pick);
  h.append(top);

  // State strip: what is in force, always visible.
  const strip = el('dl', 'state');
  const add = (k: string, v: string) => { strip.append(el('dt', undefined, k)); strip.append(el('dd', undefined, v)); };
  add('Data', `Current mode, ${index.label}, revision ${index.dataRevision}, policy ${index.calculationPolicy}, input hash ${row.inputSha256.slice(0, 12)}`);
  add('Engine', `@qcraft/engine, TypeScript port of the IMF Q-CRAFT workbook, app source ${ENGINE_REVISION}`);
  add('Years', vars
    ? `WEO through ${vars.lastWeoYear}; long-run assumptions and climate effects from ${vars.firstLongRunYear}; charts 2023 to 2099`
    : 'not available');
  add('Reference settings', (PRESET === 'teaching'
    ? 'Teaching preset: the Explorer’s starting values, the same for every country (not a country calibration): '
    : 'The Explorer’s starting values, the same for every country (not a country calibration): ') + settingsList().join('; ') + '.');
  add('Lines', '');
  const legend = strip.lastElementChild as HTMLElement;
  legend.innerHTML = `<span><span class="swatch swatch--ref"></span>reference run</span> <span><span class="swatch swatch--run"></span>this run, one input changed</span> <span>Debt is general government gross debt, percent of GDP.</span>`;
  h.append(strip);
  root.append(h);

  if (specs.length) {
    const nav = el('nav', 'nav');
    nav.setAttribute('aria-label', 'Inputs');
    specs.forEach((p, i) => {
      const a = el('a', undefined, `${i + 1}. ${CARDS.get(p.id)?.title ?? p.title}`);
      a.href = `#${p.id}`;
      nav.append(a);
    });
    root.append(nav);
  }
}

interface PanelState { value: ControlValue; channel: number; scenario: SeriesKey }

/** The reference setting for this panel's control. */
function initialValue(spec: PanelSpec): ControlValue {
  const c = spec.control;
  if (c.kind === 'interest') return { ...c.shared };
  return c.shared;
}
function openingValue(spec: PanelSpec): ControlValue {
  if (!OPEN_AT_TRY) return initialValue(spec);
  const c = spec.control;
  if (c.kind === 'interest') return { ...c.try };
  return c.try;
}
function isReference(spec: PanelSpec, v: ControlValue): boolean {
  const c = spec.control;
  if (c.kind === 'interest') { const iv = v as { mode: string; rate: number }; return iv.mode === c.shared.mode && (iv.mode !== 'Real interest rate' || iv.rate === c.shared.rate); }
  return v === c.shared;
}

function caption(spec: PanelSpec, value: ControlValue, key: SeriesKey, refKey: SeriesKey): { html: string; flat: boolean } {
  const refRun = reference();
  const varRun = run(spec.params(value));
  const ref = debtSeries(refRun, refKey);
  const varied = debtSeries(varRun, key);
  const d50 = valueAt(varied, 2050) - valueAt(ref, 2050);
  const d99 = valueAt(varied, 2099) - valueAt(ref, 2099);
  const where = key === 'Baseline' ? 'on the Baseline path' : `under ${SERIES_LABEL[key]}`;
  if (Math.abs(d50) < 0.05 && Math.abs(d99) < 0.05) {
    return { html: `${spec.valueLabel(value)} is the reference setting, so this run sits on the reference ${where}. Move the control to see the difference.`, flat: true };
  }
  const dir = (d: number) => (d > 0 ? 'higher' : 'lower');
  const at99 = `<strong>${fmt1(Math.abs(d99))} points of GDP ${dir(d99)}</strong>`;
  const at50 = Math.abs(d50) < 0.05 ? 'no difference' : `${fmt1(Math.abs(d50))} points ${dir(d50)}`;
  const refLabel = spec.valueLabel(initialValue(spec));
  const v99 = valueAt(varied, 2099);
  const floorNote = v99 < 0 ? ' Climate paths carry no debt floor in Q-CRAFT, so a sustained surplus takes this path below zero.' : '';
  return {
    html: `${spec.valueLabel(value)} leaves debt ${at99} than the reference, ${refLabel.charAt(0).toLowerCase()}${refLabel.slice(1)}, by 2099, and ${at50} at 2050, ${where}. Debt in 2099: ${fmt1(v99)} versus ${fmt1(valueAt(ref, 2099))} percent of GDP.${floorNote}`,
    flat: false,
  };
}

function buildControl(spec: PanelSpec, state: PanelState, onChange: () => void): HTMLElement {
  const wrap = el('div', 'control');
  const c = spec.control;
  const stateTag = el('span', 'control__state');
  const syncTag = () => {
    const at = isReference(spec, state.value);
    stateTag.textContent = at ? 'at the reference setting' : 'changed from the reference';
    stateTag.className = at ? 'control__state' : 'control__state control__state--changed';
  };
  if (c.kind === 'select') {
    const label = el('label', 'control__label');
    label.textContent = 'Setting: ';
    const val = el('span', 'control__value');
    label.append(val);
    const sel = el('select');
    sel.id = `${spec.id}-control`; label.htmlFor = sel.id;
    for (const o of c.options) {
      const opt = el('option', undefined, o.label);
      opt.value = o.value;
      sel.append(opt);
    }
    sel.value = state.value as string;
    const sync = () => { val.textContent = c.options.find((o) => o.value === state.value)?.label ?? String(state.value); syncTag(); };
    sync();
    sel.addEventListener('change', () => { state.value = sel.value; sync(); onChange(); });
    wrap.append(label, sel, stateTag);
    wrap.append(actions(() => { state.value = c.try; sel.value = c.try; sync(); onChange(); }, () => { state.value = c.shared; sel.value = c.shared; sync(); onChange(); }, `Try ${c.options.find((o) => o.value === c.try)?.label}`));
  } else if (c.kind === 'range') {
    const label = el('label', 'control__label');
    label.textContent = 'Setting: ';
    const val = el('span', 'control__value');
    label.append(val);
    const row = el('div', 'control__row');
    const range = el('input');
    range.type = 'range'; range.min = String(c.min); range.max = String(c.max); range.step = String(c.step);
    range.id = `${spec.id}-control`; label.htmlFor = range.id;
    const num = el('input');
    num.type = 'number'; num.min = String(c.min); num.max = String(c.max); num.step = String(c.step);
    num.setAttribute('aria-label', `${spec.title}, typed value`);
    const sync = () => {
      const v = state.value as number;
      range.value = String(v); num.value = v.toFixed(c.decimals);
      val.textContent = `${v.toFixed(c.decimals)}${c.unit ? ' ' + c.unit : ''}`;
      syncTag();
    };
    sync();
    range.addEventListener('input', () => { state.value = Number(range.value); sync(); onChange(); });
    num.addEventListener('change', () => {
      const v = Math.min(c.max, Math.max(c.min, Number(num.value)));
      if (num.value.trim() === '' || !Number.isFinite(v)) { sync(); return; } // an emptied box commits nothing
      state.value = v; sync(); onChange();
    });
    const ends = el('div', 'control__range-ends');
    ends.append(el('span', undefined, String(c.min)), el('span', undefined, String(c.max)));
    row.append(range, num);
    wrap.append(label, row, ends, stateTag);
    wrap.append(actions(() => { state.value = c.try; sync(); onChange(); }, () => { state.value = c.shared; sync(); onChange(); }, `Try ${c.try.toFixed(c.decimals)}`));
  } else {
    const label = el('label', 'control__label');
    label.textContent = 'Approach: ';
    const val = el('span', 'control__value');
    label.append(val);
    const sel = el('select');
    sel.id = `${spec.id}-control`; label.htmlFor = sel.id;
    const modes: Params['interest_rate_mode'][] = ['Nominal interest rate', 'Real interest rate', 'Interest-growth differential'];
    const modeLabel: Record<string, string> = {
      'Nominal interest rate': 'Constant nominal rate',
      'Real interest rate': 'Constant real rate',
      'Interest-growth differential': 'Constant interest-growth differential',
    };
    for (const m of modes) { const o = el('option', undefined, modeLabel[m]); o.value = m; sel.append(o); }
    const rateLabel = el('label', 'control__label', 'Long-run real rate: ');
    const rateVal = el('span', 'control__value');
    rateLabel.append(rateVal);
    const row = el('div', 'control__row');
    const range = el('input'); range.type = 'range'; range.min = '-5'; range.max = '15'; range.step = '0.1';
    range.id = `${spec.id}-rate`; rateLabel.htmlFor = range.id;
    const num = el('input'); num.type = 'number'; num.min = '-5'; num.max = '15'; num.step = '0.1';
    num.setAttribute('aria-label', 'Long-run real rate, typed value');
    row.append(range, num);
    const iv = () => state.value as { mode: Params['interest_rate_mode']; rate: number };
    const sync = () => {
      sel.value = iv().mode; val.textContent = modeLabel[iv().mode];
      range.value = String(iv().rate); num.value = iv().rate.toFixed(1);
      const active = iv().mode === 'Real interest rate';
      rateVal.textContent = `${iv().rate.toFixed(1)} percent${active ? '' : ' (inactive under this approach)'}`;
      range.disabled = !active; num.disabled = !active;
      syncTag();
    };
    sync();
    sel.addEventListener('change', () => { iv().mode = sel.value as Params['interest_rate_mode']; sync(); onChange(); });
    range.addEventListener('input', () => { iv().rate = Number(range.value); sync(); onChange(); });
    num.addEventListener('change', () => { const v = Math.min(15, Math.max(-5, Number(num.value))); if (num.value.trim() !== '' && Number.isFinite(v)) { iv().rate = v; sync(); onChange(); } else sync(); });
    wrap.append(label, sel, rateLabel, row, stateTag);
    wrap.append(actions(() => { state.value = { ...c.try }; sync(); onChange(); }, () => { state.value = { ...c.shared }; sync(); onChange(); }, 'Try a constant real rate of 1.0'));
  }
  return wrap;
}

function actions(onTry: () => void, onReset: () => void, tryLabel: string): HTMLElement {
  const a = el('div', 'control__actions');
  const t = el('button', 'chip', tryLabel); t.type = 'button'; t.addEventListener('click', onTry);
  const r = el('button', 'chip chip--ghost', 'Back to reference'); r.type = 'button'; r.addEventListener('click', onReset);
  a.append(t, r);
  return a;
}

function cardSection(card: CardText | undefined, name: (typeof SECTIONS)[number], vars: Vars): HTMLElement[] {
  const paras = card?.sections[name];
  if (!paras || !paras.length) return [el('p', 'card__missing', `(${name}: not written yet in content/inputs.md)`)];
  return paras.map((p) => { const e = el('p'); e.innerHTML = paragraphHtml(fill(p, { ...vars })); return e; });
}

function buildPanel(root: HTMLElement, spec: PanelSpec, n: number, total: number, vars: Vars) {
  const card = CARDS.get(spec.id);
  const section = el('section', 'panel');
  section.id = spec.id;
  section.setAttribute('aria-labelledby', `${spec.id}-title`);
  const left = el('div', 'panel__left');
  left.append(el('p', 'panel__kicker', `Input ${n} of ${total}`));
  const h2 = el('h2', 'panel__title', card?.title ?? spec.title);
  h2.id = `${spec.id}-title`;
  left.append(h2);
  // Where this input enters: a strip across the top of the card.
  const chain = el('div', 'panel__chain');
  chain.innerHTML = chainSvg(spec.node, NODE_CAPTION[spec.node]);
  chain.append(el('p', 'panel__chain-caption', NODE_CAPTION[spec.node]));
  const what = el('div', 'panel__what');
  what.append(...cardSection(card, 'What it is', vars));
  left.append(what);
  const state: PanelState = {
    value: openingValue(spec),
    channel: Math.min(OPEN_CHANNEL, spec.channels.length - 1),
    scenario: spec.scenarioToggle ? OPEN_ON : 'Baseline',
  };

  const right = el('div', 'charts');
  const chartHead = el('div', 'chart__head');
  chartHead.append(el('p', 'chart__title', 'Debt-to-GDP, 2023 to 2099'));
  let scenarioSel: HTMLSelectElement | null = null;
  if (spec.scenarioToggle) {
    const sw = el('label', 'chart__switch');
    sw.append(el('span', undefined, 'Show on: '));
    scenarioSel = el('select');
    for (const [v, l] of [['Baseline', 'Baseline path (no climate shock)'], ['Hot', 'Hot climate path']] as const) {
      const o = el('option', undefined, l); o.value = v; scenarioSel.append(o);
    }
    sw.append(scenarioSel);
    scenarioSel.value = state.scenario;
    chartHead.append(sw);
  }
  right.append(chartHead);
  const mainBox = el('div', 'chart');
  right.append(mainBox);
  const cap = el('p', 'caption');
  cap.setAttribute('aria-live', 'polite');
  right.append(cap);
  const chan = el('div', 'channel');
  const chanHead = el('div', 'channel__head');
  const chanLabel = el('label', 'channel__label', 'Channel chart: ');
  const chanSel = el('select');
  chanSel.id = `${spec.id}-channel`; chanLabel.htmlFor = chanSel.id;
  spec.channels.forEach((ch, i) => { const o = el('option', undefined, ch.label); o.value = String(i); chanSel.append(o); });
  chanSel.value = String(state.channel);
  chanHead.append(chanLabel, chanSel);
  chan.append(chanHead);
  const chanBox = el('div', 'chart');
  chan.append(chanBox);
  right.append(chan);

  // The four folded sections sit under the control, in the left column.
  const more = el('div', 'card__more');
  for (const name of SECTIONS.slice(1)) {
    const d = el('details', 'card__section');
    if (OPEN_ALL) d.open = true;
    const s = el('summary', undefined, name);
    d.append(s, ...cardSection(card, name, vars));
    more.append(d);
  }

  section.append(chain, left, right);
  root.append(section);

  const { longRunStart } = horizon();
  const mainChart = makeChart(mainBox, { height: 330, yLabel: 'Debt, percent of GDP', longRunStart, markerLabel: true, endLabels: true, includeZero: true, title: `${card?.title ?? spec.title}: debt-to-GDP, reference run and this run` });
  const ch0 = spec.channels[state.channel];
  let channelChart = makeChart(chanBox, { height: 200, yLabel: ch0.yLabel, longRunStart, markerLabel: false, endLabels: true, decimals: ch0.decimals ?? 1, title: `${card?.title ?? spec.title}: ${ch0.label}` });

  const render = () => {
    const key = spec.scenarioToggle ? state.scenario : spec.series(state.value);
    const refKey = spec.refSeries ?? key;
    const refRun = reference();
    const varRun = run(spec.params(state.value));
    mainChart.update(debtSeries(refRun, refKey), debtSeries(varRun, key));
    const c = caption(spec, state.value, key, refKey);
    cap.innerHTML = c.html;
    cap.className = c.flat ? 'caption caption--flat' : 'caption';
    const ch = spec.channels[state.channel];
    const refSeries = ch.extract(refRun, refKey);
    const varSeries = ch.extract(varRun, key);
    if (ch.relative) {
      const refMap = new Map(refSeries.map((d) => [d.year, d.value]));
      channelChart.update(
        refSeries.map((d) => ({ year: d.year, value: 100 })),
        varSeries.map((d) => ({ year: d.year, value: (100 * d.value) / refMap.get(d.year)! })),
      );
    } else {
      channelChart.update(refSeries, varSeries);
    }
  };
  chanSel.addEventListener('change', () => {
    state.channel = Number(chanSel.value);
    chanBox.innerHTML = '';
    const ch = spec.channels[state.channel];
    channelChart = makeChart(chanBox, { height: 200, yLabel: ch.yLabel, longRunStart, markerLabel: false, endLabels: true, decimals: ch.decimals ?? 1, title: `${card?.title ?? spec.title}: ${ch.label}` });
    render();
  });
  scenarioSel?.addEventListener('change', () => { state.scenario = scenarioSel!.value as SeriesKey; render(); });
  left.append(buildControl(spec, state, render));
  left.append(el('p', 'panel__shown', spec.shownNote));
  left.append(more);
  render();
}

async function main() {
  const root = document.getElementById('app')!;
  const base = import.meta.env.BASE_URL;
  const index = await loadIndex(`${base}data/countries.json`);
  const row = index.countries.find((c) => c.iso3c === COUNTRY);
  if (!row) {
    buildHeader(root, index, { iso3c: COUNTRY, country: COUNTRY, coverageStatus: 'unsupported', coverageReason: null, weoMaxYear: null, sourceWeoMaxYear: 0, projectionStartYear: null, inputSha256: '' }, [], null);
    root.append(el('p', 'notice', `There is no country with the code ${COUNTRY} in this data revision. Pick one from the list.`));
    buildFooter(root, null);
    return;
  }
  document.title = `Q-CRAFT, one input at a time: ${row.country}`;
  let vars: Vars | null = null;
  let failure: string | null = null;
  try {
    await loadCountry(`${base}data/${index.dataRevision}/${row.iso3c}.json`);
    reference();
    const hz = horizon();
    vars = { country: row.country, lastWeoYear: hz.weoMaxYear, firstLongRunYear: hz.longRunStart, turningYear: hz.weoMaxYear + SHARED.productivity_turning_point };
  } catch (e) {
    failure = (e as Error).message;
  }
  const specs = vars ? PANELS : [];
  buildHeader(root, index, row, specs, vars);
  if (!vars) {
    const p = el('p', 'notice');
    p.textContent = `Q-CRAFT cannot run ${row.country} in Current mode with this data revision. ${row.coverageReason ?? failure ?? ''} The engine refuses rather than guessing, so there are no charts for this country. Pick another country from the list.`;
    root.append(p);
    buildFooter(root, null);
    return;
  }
  if (row.coverageStatus === 'shorter') {
    const p = el('p', 'notice notice--short');
    p.textContent = `${row.country}’s WEO inputs end at ${row.weoMaxYear}, earlier than the 2031 most countries reach in this release.${row.coverageReason && row.coverageReason.startsWith('Incomplete') ? ' ' + row.coverageReason : ''} Long-run assumptions and climate effects therefore begin in ${vars.firstLongRunYear}, and the turning point counts from ${vars.lastWeoYear}.`;
    root.append(p);
  }
  specs.forEach((spec, i) => buildPanel(root, spec, i + 1, specs.length, vars!));
  buildFooter(root, vars);
}

/** Provenance (when a run exists) and the attribution line in the companion's register, on every page state. */
function buildFooter(root: HTMLElement, vars: Vars | null) {
  const foot = el('footer', 'footer');
  if (vars) {
    const hp = reference().horizonPolicy!;
    foot.append(el('p', 'footer__provenance', `Numbers from @qcraft/engine (TypeScript port of the IMF Q-CRAFT workbook, app source ${ENGINE_REVISION}) on input revision ${hp.dataRevision}, policy ${hp.id}, input hash ${hp.inputSha256.slice(0, 12)}. Reference settings equal the engine defaults and the Explorer's starting values. Turning point ${SHARED.productivity_turning_point} years after ${hp.weoMaxYear} = ${vars.turningYear}. Card text: content/inputs.md.`));
  }
  const attribution = el('p', 'footer__attribution');
  attribution.append('Teal Insights · Independent implementation of the IMF’s Q-CRAFT. ');
  const link = (href: string, text: string) => { const a = el('a', undefined, text); a.href = href; return a; };
  attribution.append(link(LINKS.explorer, 'Q-CRAFT Explorer'), ' · ', link(LINKS.companion, 'Explorer companion'), ' · ', link(LINKS.imf, 'Official IMF materials'));
  foot.append(attribution);
  root.append(foot);
}

main().catch((e) => {
  const root = document.getElementById('app')!;
  root.textContent = `Could not start: ${(e as Error).message}`;
  console.error(e);
});
