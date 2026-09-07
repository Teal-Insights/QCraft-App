// "Where this input enters": a small inline SVG of the three-part chain
// (inputs to g, r and pb; the debt equation; the climate overlay). Each panel
// lights one node. Built once per panel from the same template; text is real
// SVG text so it scales with the page and stays readable.
export type ChainNode = 'growth' | 'prices' | 'interest' | 'rule' | 'debt' | 'climate' | 'rigidity';

interface Box { id: ChainNode; x: number; w: number; l1: string; l2: string }

const ROW1: Box[] = [
  { id: 'growth', x: 0, w: 168, l1: 'Demography, productivity', l2: 'growth g' },
  { id: 'prices', x: 180, w: 128, l1: 'Inflation', l2: 'prices, nominal GDP' },
  { id: 'interest', x: 320, w: 138, l1: 'Interest approach', l2: 'interest rate r' },
  { id: 'rule', x: 470, w: 158, l1: 'Debt target, fiscal rule', l2: 'primary balance pb' },
];
const DEBT: Box = { id: 'debt', x: 668, w: 196, l1: 'Debt equation', l2: 'debt(t) from r, g and pb' };
const CLIMATE: Box = { id: 'climate', x: 904, w: 150, l1: 'Climate scenario', l2: 'GDP loss via productivity' };
const RIGID: Box = { id: 'rigidity', x: 1066, w: 134, l1: 'Rigidity', l2: 'spending under climate' };

const BOX_H = 44;
const W = 1200;

function box(b: Box, on: boolean): string {
  const cls = on ? 'chain__box chain__box--on' : 'chain__box';
  return `<g class="${cls}"><rect x="${b.x}" y="0" width="${b.w}" height="${BOX_H}" rx="4"/>` +
    `<text x="${b.x + b.w / 2}" y="18" text-anchor="middle" class="chain__l1">${b.l1}</text>` +
    `<text x="${b.x + b.w / 2}" y="35" text-anchor="middle" class="chain__l2">${b.l2}</text></g>`;
}
function arrow(x1: number, x2: number, y = BOX_H / 2): string {
  return `<line x1="${x1}" y1="${y}" x2="${x2 - 6}" y2="${y}" class="chain__arrow"/><path d="M${x2 - 6},${y - 4} L${x2},${y} L${x2 - 6},${y + 4} Z" class="chain__head"/>`;
}

export function chainSvg(on: ChainNode, caption: string): string {
  const parts: string[] = [];
  for (const b of ROW1) parts.push(box(b, b.id === on));
  parts.push(box(DEBT, on === 'debt'));
  parts.push(box(CLIMATE, on === 'climate'));
  parts.push(box(RIGID, on === 'rigidity'));
  // Row 1 boxes feed the debt equation: one bracket line below them.
  const y2 = BOX_H + 10;
  parts.push(`<path d="M${ROW1[0].x + 4},${BOX_H} V${y2} H${DEBT.x + 24} V${BOX_H}" class="chain__bracket"/>`);
  parts.push(`<path d="M${DEBT.x + 20},${BOX_H + 2} L${DEBT.x + 24},${BOX_H - 4} L${DEBT.x + 28},${BOX_H + 2} Z" class="chain__head"/>`);
  // Climate overlay feeds the debt equation too (from the right).
  parts.push(arrow(CLIMATE.x, DEBT.x + DEBT.w + 4).replace('class="chain__arrow"', 'class="chain__arrow"'));
  parts.push(`<path d="M${DEBT.x + DEBT.w + 8},${BOX_H / 2 - 4} L${DEBT.x + DEBT.w + 2},${BOX_H / 2} L${DEBT.x + DEBT.w + 8},${BOX_H / 2 + 4} Z" class="chain__head"/>`);
  parts.push(`<line x1="${CLIMATE.x + CLIMATE.w}" y1="${BOX_H / 2}" x2="${RIGID.x}" y2="${BOX_H / 2}" class="chain__arrow"/>`);
  parts.push(`<text x="${(ROW1[0].x + ROW1[3].x + ROW1[3].w) / 2}" y="${y2 + 16}" text-anchor="middle" class="chain__label">inputs to g, r and pb</text>`);
  parts.push(`<text x="${CLIMATE.x + (RIGID.x + RIGID.w - CLIMATE.x) / 2}" y="${y2 + 16}" text-anchor="middle" class="chain__label">climate overlay (scenarios only)</text>`);
  return `<svg class="chain" viewBox="0 0 ${W} ${y2 + 22}" role="img" aria-label="${caption}"><title>${caption}</title>${parts.join('')}</svg>`;
}

export const NODE_CAPTION: Record<ChainNode, string> = {
  growth: 'This input enters through growth g, then the debt equation.',
  prices: 'This input enters through prices and nominal GDP, then the debt equation.',
  interest: 'This input sets the interest path r, then the debt equation.',
  rule: 'This input sets the primary balance pb through the rule, then the debt equation.',
  debt: 'The debt equation.',
  climate: 'This input is the climate overlay: a GDP loss through productivity, then the debt equation.',
  rigidity: 'This input acts inside the climate overlay: spending under a smaller GDP, then the debt equation.',
};
