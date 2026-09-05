/** The reference list, rendered from content/references.ts wherever it appears. */

import { REFERENCES } from '../content/references';

export function ReferenceList() {
  return (
    <ul className="source-list">
      {REFERENCES.map((r) => (
        <li key={r.key}>
          {r.authors} ({r.year}). <em>{r.url ? <a href={r.url} target="_blank" rel="noreferrer">{r.title}</a> : r.title}.</em> {r.publisher}.
        </li>
      ))}
    </ul>
  );
}
