/**
 * The honesty banner.
 *
 * A user in a ministry finance office must never have to guess whether the line
 * on screen responds to the slider they just moved. While the app is
 * fixture-backed, this states plainly what the numbers are and lists every
 * parameter the backend could not honour.
 *
 * It is driven entirely by `EngineResult.provenance`, so it disappears by itself
 * the moment the real engine is wired in and starts reporting kind: 'engine'.
 * Nothing has to be remembered or removed.
 */

import type { Provenance } from '../engine/adapter';

export function ProvenanceNotice({ provenance }: { provenance: Provenance }) {
  if (provenance.kind === 'engine') return null;

  const { ignoredParams } = provenance;

  return (
    <div className="notice" role="status">
      <p className="notice__lead">
        <strong>Fixture data.</strong> These are real Q-CRAFT results for Uganda,
        computed by the Python engine at its default parameters and read from its
        golden-master test fixtures. The projection engine is not yet wired into
        this build, so the charts do not recompute.
      </p>
      {ignoredParams.length > 0 ? (
        <div className="notice__params">
          <p className="notice__params-lead">
            {ignoredParams.length === 1
              ? 'One parameter you changed is not reflected in the charts below:'
              : `${ignoredParams.length} parameters you changed are not reflected in the charts below:`}
          </p>
          <ul>
            {ignoredParams.map((p) => (
              <li key={p.label}>
                <span className="notice__param-name">{p.label}</span>
                <span className="notice__param-values">
                  you set <strong>{p.requested}</strong>; charts show{' '}
                  <strong>{p.used}</strong>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="notice__params-lead">
          All parameters are at their engine defaults, so the charts below match
          what the engine would return for this configuration.
        </p>
      )}
      <p className="notice__source">Source: {provenance.source}</p>
    </div>
  );
}
