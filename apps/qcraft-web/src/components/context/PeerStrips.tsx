/**
 * The peer view every data panel gains: a scope picker and a stack of
 * distribution strips.
 *
 * The stack is a small multiple, so the rows share one x-domain wherever the
 * statistics are commensurate. That is what lets a reader see, in one look,
 * that a country's realised productivity growth and the growth the WEO forecast
 * implies are not the same number, and by how much. Rows on separate scales
 * would show two facts and no comparison.
 *
 * Scope belongs here rather than in each panel because it is the same question
 * everywhere ("compared with whom") and a user who picks their region on one
 * parameter should not have to pick it again on the next. The panels lift the
 * state so the choice survives moving between them, and so the rationale
 * sentence can name the group the user was actually looking at.
 */

import { useMemo } from 'react';

import { ContextChoice } from './ContextChoice';
import { DistributionStrip } from './DistributionStrip';
import {
  distribution,
  peerScopes,
  robustDomain,
  type Distribution,
  type PeerScope,
  type StatKey,
} from '../../context/peers';

export interface StripSpec {
  stat: StatKey;
  label: string;
  sublabel?: string;
  /** The sidebar setting to mark on this row, where one is on the same scale. */
  setting?: { value: number; label: string };
}

interface Props {
  iso3c: string;
  countryName: string;
  vintage: string;
  scope: PeerScope;
  onScopeChange: (scope: PeerScope) => void;
  strips: StripSpec[];
  /** Put every row on one axis. Only for statistics in the same units. */
  sharedDomain?: boolean;
  format: (value: number) => string;
  /** Rendered when no row has enough observations to draw. */
  emptyText: string;
}

export function PeerStrips({
  iso3c,
  countryName,
  vintage,
  scope,
  onScopeChange,
  strips,
  sharedDomain = false,
  format,
  emptyText,
}: Props) {
  const scopes = peerScopes(iso3c);

  const rows = useMemo(
    () =>
      strips
        .map((spec) => ({
          spec,
          dist: distribution(vintage, iso3c, scope, spec.stat),
        }))
        .filter((row): row is { spec: StripSpec; dist: Distribution } => !!row.dist),
    [strips, vintage, iso3c, scope],
  );

  /**
   * One domain across the stack, computed once so every row gets the same
   * scale and the same padding. Settings and this country's own values are
   * forced inside it: a marker pushed off the end of the axis is a marker a
   * reader cannot see.
   */
  const domain = useMemo((): [number, number] | undefined => {
    if (!sharedDomain || !rows.length) return undefined;
    return robustDomain(
      rows.flatMap((row) => row.dist.points.map((p) => p.value)),
      rows.flatMap((row) => [
        ...(row.spec.setting ? [row.spec.setting.value] : []),
        ...(row.dist.points.find((p) => p.iso3c === iso3c)
          ? [row.dist.points.find((p) => p.iso3c === iso3c)!.value]
          : []),
      ]),
    );
  }, [sharedDomain, rows, iso3c]);

  if (!rows.length) return <p className="dstrip__empty">{emptyText}</p>;

  return (
    <div className="dstack">
      {scopes.length > 1 && (
        <ContextChoice
          legend="Compared with"
          choices={scopes.map((s) => ({
            value: s.value,
            label: `${s.label} (${s.count})`,
          }))}
          value={scope}
          onChange={onScopeChange}
        />
      )}

      {rows.map(({ spec, dist }, index) => (
        <DistributionStrip
          key={spec.stat}
          // One axis per stack when the rows share a scale: repeating it three
          // times says "three charts" when the point is that it is one.
          showAxis={!sharedDomain || index === rows.length - 1}
          label={spec.label}
          sublabel={
            dist.missing
              ? `${spec.sublabel ?? ''}${spec.sublabel ? '. ' : ''}${dist.missing} in this group not covered`
              : spec.sublabel
          }
          distribution={dist}
          iso3c={iso3c}
          countryName={countryName}
          setting={spec.setting}
          domain={domain}
          format={format}
        />
      ))}
    </div>
  );
}
