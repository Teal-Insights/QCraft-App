/**
 * Stylesheet for the exported report, inlined into the HTML file.
 *
 * Inlined, not linked: the report has to open from a USB stick in a room with
 * no network and still look like itself. Same reason there are no webfonts.
 * Family NAMES come from the brand theme and fall through to system stacks, per
 * the tokens file's fontLicense note (never commit or publish font files).
 *
 * The print rules are the point of the file. A ministry user's route to a PDF is
 * the browser's own print dialog, so the printed page is the deliverable, not a
 * degraded version of the screen: A4 with real margins, figures and tables that
 * do not split across a page boundary, headings that do not strand themselves at
 * the foot of one, and colour that survives (browsers drop background fills when
 * printing unless print-color-adjust says otherwise, which would take the WEO
 * history shading and the status banner with it).
 */

import { brand, fonts, theme } from '../theme';

export const REPORT_STYLES = `
:root {
  --ink: ${theme.textPrimary};
  --muted: ${theme.textSecondary};
  --rule: ${theme.rule};
  --rule-cool: ${theme.ruleCool};
  --accent: ${theme.accent};
  --anchor: ${theme.anchor};
  --surface: ${theme.surface};
  --raised: ${theme.surfaceRaised};
  --sunken: ${theme.surfaceSunken};
  --card: ${theme.surfaceAccent};
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  background: var(--surface);
  color: var(--ink);
  font-family: ${fonts.body};
  font-size: 15px;
  line-height: 1.55;
}
.doc {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 44px 64px;
  background: var(--raised);
}
h1, h2, h3 { font-family: ${fonts.accent}; font-weight: 600; }
h1 { font-size: 30px; line-height: 1.2; margin: 6px 0 8px; }
h2 {
  font-size: 20px;
  margin: 34px 0 10px;
  padding-bottom: 6px;
  border-bottom: 2px solid var(--anchor);
}
h3 { font-size: 15px; margin: 22px 0 8px; }
p { margin: 0 0 10px; }
a { color: var(--anchor); }

.kicker {
  font-family: ${fonts.kicker};
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 0;
}
.titleblock { border-bottom: 3px solid var(--anchor); padding-bottom: 16px; }
.titleblock .subtitle { color: var(--muted); font-size: 16px; margin-bottom: 14px; }
.titlemeta {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 2px 16px;
  margin: 0;
  font-size: 12.5px;
}
.titlemeta dt { color: var(--muted); }
.titlemeta dd { margin: 0; }
.titlemeta dd code { font-family: ${fonts.mono}; font-size: 12px; }

.status {
  border-left: 4px solid var(--accent);
  background: var(--sunken);
  padding: 12px 16px;
  margin: 20px 0 0;
  font-size: 13.5px;
}
.status--caution { border-left-color: #8c2a1f; }
.status p:last-child { margin-bottom: 0; }
.status ul { margin: 6px 0 0; padding-left: 20px; }

.keyfigures {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 16px 0 20px;
}
.keyfigure {
  background: var(--card);
  border-radius: 4px;
  padding: 12px 14px;
}
.keyfigure__label {
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 4px;
}
.keyfigure__value { font-size: 26px; font-weight: 600; margin: 0; line-height: 1.1; }
.keyfigure__detail { font-size: 12px; color: var(--muted); margin: 2px 0 0; }

figure { margin: 22px 0; }
figure figcaption { margin-bottom: 6px; }
.figure__title { font-family: ${fonts.medium}; font-size: 15px; font-weight: 600; margin: 0; }
.figure__subtitle { font-size: 12.5px; color: var(--muted); margin: 3px 0 0; }
.legend { display: flex; flex-wrap: wrap; gap: 6px 16px; margin: 8px 0; padding: 0; list-style: none; font-size: 12px; }
.legend li { display: flex; align-items: center; gap: 6px; }
.legend .swatch { width: 14px; height: 3px; border-radius: 2px; display: inline-block; }
figure svg { width: 100%; height: auto; display: block; }

table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 10px 0 4px; }
caption { text-align: left; font-size: 12.5px; color: var(--muted); padding-bottom: 6px; }
th, td { text-align: right; padding: 6px 8px; border-bottom: 1px solid var(--rule-cool); }
th:first-child, td:first-child { text-align: left; }
thead th { border-bottom: 1.5px solid var(--anchor); font-family: ${fonts.medium}; font-size: 12px; }
tbody tr.is-baseline td { background: var(--sunken); font-weight: 600; }
td.note { text-align: left; color: var(--muted); font-style: italic; }
.tag {
  display: inline-block;
  font-size: 10.5px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 1px 6px;
  border-radius: 9px;
  border: 1px solid var(--rule);
  color: var(--muted);
}
.tag--changed { border-color: ${brand.cyan}; color: ${brand.navy}; background: ${brand.pale}; }

.annex dl { display: grid; grid-template-columns: max-content 1fr; gap: 3px 16px; margin: 0 0 14px; font-size: 13px; }
.annex dt { color: var(--muted); }
.annex dd { margin: 0; }
.annex code { font-family: ${fonts.mono}; font-size: 12px; }

.docfoot {
  margin-top: 34px;
  padding-top: 12px;
  border-top: 1px solid var(--rule);
  font-size: 11.5px;
  color: var(--muted);
}
.docfoot p { margin: 0 0 6px; }

.printbar { text-align: right; margin: 0 0 -18px; }
.printbar button {
  font: inherit;
  font-size: 13px;
  padding: 6px 14px;
  border: 1px solid var(--anchor);
  border-radius: 3px;
  background: var(--anchor);
  color: #fff;
  cursor: pointer;
}

@page { size: A4; margin: 15mm 14mm 16mm; }

@media print {
  html, body { background: #fff; }
  body { font-size: 10.5pt; line-height: 1.45; }
  .doc { max-width: none; padding: 0; background: #fff; }
  .no-print { display: none !important; }
  h1 { font-size: 21pt; }
  h2 { font-size: 14pt; break-after: avoid; }
  h3 { font-size: 11pt; break-after: avoid; }
  /* Tighter cells in print. The annex table is ten rows and at screen padding
     it fills the page to the millimetre, pushing the last line of the footer
     onto a page of its own. */
  th, td { padding: 4px 7px; }
  figure, table, .keyfigures, .status, .keyfigure { break-inside: avoid; }
  .docfoot p { break-inside: avoid; }
  tr, li { break-inside: avoid; }
  thead { display: table-header-group; }
  .page-break { break-before: page; }
  a { color: inherit; text-decoration: none; }
  /* Browsers drop background fills when printing unless told otherwise, which
     would take the WEO history shading, the status banner and the baseline row
     highlight with it. */
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;
