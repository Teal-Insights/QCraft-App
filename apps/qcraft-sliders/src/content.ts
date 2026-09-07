// The card text lives in content/inputs.md, which Teal edits. This is a tiny
// heading-based parser: `## [panel-id] Title`, then `### Section` blocks whose
// bodies are paragraphs separated by blank lines. Inline links are turned into
// anchors; nothing else is interpreted. Tokens like {{country}} are filled by
// the caller with `fill()`.
import raw from '../content/inputs.md?raw';

export const SECTIONS = ['What it is', 'Why it matters', 'How it enters the model', 'What the tool does with it', 'Read more'] as const;
export type SectionName = (typeof SECTIONS)[number];

export interface CardText {
  id: string;
  title: string;
  sections: Partial<Record<SectionName, string[]>>;
}

export function parseCards(md: string = raw): Map<string, CardText> {
  const cards = new Map<string, CardText>();
  let card: CardText | null = null;
  let section: SectionName | null = null;
  let para: string[] = [];
  const flush = () => {
    if (card && section && para.length) {
      (card.sections[section] ??= []).push(para.join(' '));
    }
    para = [];
  };
  for (const line of md.split(/\r?\n/)) {
    const h2 = line.match(/^## \[([a-z0-9-]+)\]\s+(.+?)\s*$/);
    const h3 = line.match(/^### (.+?)\s*$/);
    if (h2) { flush(); card = { id: h2[1], title: h2[2], sections: {} }; cards.set(card.id, card); section = null; continue; }
    if (h3) { flush(); section = (SECTIONS as readonly string[]).includes(h3[1]) ? (h3[1] as SectionName) : null; continue; }
    if (!card || !section) continue;
    if (line.trim() === '') { flush(); continue; }
    para.push(line.trim());
  }
  flush();
  return cards;
}

/** Replace {{token}} placeholders. Unknown tokens are left visible so they get noticed. */
export function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/** Render a paragraph with bare URLs and `text` spans turned into HTML. */
export function paragraphHtml(text: string): string {
  const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc
    .replace(/(https?:\/\/[^\s)]+)/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u.replace(/^https?:\/\//, '')}</a>`)
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}
