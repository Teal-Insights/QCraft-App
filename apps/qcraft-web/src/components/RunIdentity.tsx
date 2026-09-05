import type { EngineResult } from '../engine/types';
import { GUIDE_URLS } from '../content/guidance';

export function RunIdentity({ result }: { result: EngineResult | null }) {
  if (!result) return null;
  const h = result.horizonPolicy;
  return <div className="section-note" aria-label="Selected run timing">
    <strong>{result.countryName}:</strong> WEO estimates/projections through {result.weoBoundaryYear};{' '}
    long-run model from {h?.projectionStartYear ?? result.weoBoundaryYear + 1}.
    {h && <> Incremental climate comparison from {h.climateStartYear}, anchored at {h.climateAnchorYear}.
      {h.coverageStatus === 'shorter' && <> Shorter usable window: {h.coverageReason}.</>}</>}{' '}
    <a href={GUIDE_URLS.data}>Input and timing details</a>
    <details><summary>Exact selected input identity</summary>
      <p>Revision: <code>{result.provenance.dataRevision ?? 'not recorded'}</code>.<br />
        Policy: <code>{result.provenance.calculationPolicy ?? 'not recorded'}</code>.<br />
        Input SHA-256: <code style={{ overflowWrap: 'anywhere' }}>{result.provenance.inputSha256 ?? 'not recorded'}</code>.</p>
    </details>
  </div>;
}
