/**
 * Debt target: where debt actually is, and where this country has been.
 *
 * The target is a policy anchor and no source publishes the right one. What the
 * bundle does carry is the record a target is chosen against, and three rows of
 * it answer the three questions a finance ministry asks about an anchor:
 *
 *   where is debt heading    the WEO forecast at the last projected year
 *   where is it now          the last outturn year
 *   have we ever been there  the lowest ratio since 2001
 *
 * The third row is the one that turns a number into a conversation. A 50 percent
 * anchor reads differently to a country whose debt has not been below 45 since
 * 2011 than to one that was at 20 a decade ago, and the strip says which this
 * country is without anybody having to editorialise.
 *
 * All three rows share an axis, so the dashed setting rule reads as one vertical
 * thread through the stack: the anchor, held against the forecast, the outturn
 * and the floor at once.
 */

import { PEER_HISTORY_YEAR, PEER_WEO_YEAR } from '../../context/peers';
import type { PeerScope } from '../../context/peers';
import {
  distribution,
  peerScopeName,
  percentileOf,
  statValue,
} from '../../context/peers';
import { ContextFrame } from './ContextFrame';
import { PeerStrips } from './PeerStrips';
import { RationaleAction } from './RationaleAction';

interface Props {
  iso3c: string;
  countryName: string;
  vintage: string;
  target: number;
  scope: PeerScope;
  onScopeChange: (scope: PeerScope) => void;
  slug: string;
  note: string;
  onNoteChange: (note: string) => void;
}

const ratio = (value: number) => `${value.toFixed(0)}%`;

export function DebtTargetPanel({
  iso3c,
  countryName,
  vintage,
  target,
  scope,
  onScopeChange,
  slug,
  note,
  onNoteChange,
}: Props) {
  const setting = { value: target, label: `Your target ${ratio(target)}` };

  const forecast = statValue(vintage, iso3c, 'debt_weo_last');
  const lowest = statValue(vintage, iso3c, 'debt_hist_min');
  const forecastDist = distribution(vintage, iso3c, scope, 'debt_weo_last');
  const groupName = peerScopeName(iso3c, scope);

  const belowTarget = forecastDist
    ? forecastDist.points.filter((p) => p.value <= target).length
    : 0;
  const share = forecastDist
    ? Math.round((belowTarget / forecastDist.points.length) * 100)
    : 0;
  const place = forecastDist && forecast !== undefined
    ? Math.round(percentileOf(forecastDist, forecast))
    : undefined;

  const caption = !forecastDist ? (
    `No bundled debt record for ${iso3c}, so there is nothing to place a target against.`
  ) : (
    <>
      <strong>
        {belowTarget} of the {forecastDist.points.length}
      </strong>{' '}
      countries in {groupName} with a {PEER_WEO_YEAR} forecast are at or below{' '}
      <strong>{ratio(target)}</strong>, so {share}% of the group would already
      meet this target.{' '}
      {forecast !== undefined && (
        <>
          {countryName} is forecast at {ratio(forecast)}
          {place !== undefined && `, above ${place}% of the group`}.{' '}
        </>
      )}
      {lowest !== undefined && (
        <>
          The lowest this country has been since 2001 is{' '}
          <strong>{ratio(lowest)}</strong>.
        </>
      )}
    </>
  );

  const sentence = forecast === undefined || lowest === undefined
    ? `Target ${ratio(target)}. ${countryName} is forecast at ${forecast === undefined ? 'no bundled figure' : ratio(forecast)} for ${PEER_WEO_YEAR}.`
    : `Target ${ratio(target)} of GDP: ${share}% of ${groupName} are forecast below it by ${PEER_WEO_YEAR}, ${countryName} at ${ratio(forecast)}, lowest since 2001 ${ratio(lowest)}.`;

  return (
    <ContextFrame
      slug={slug}
      title="Nobody publishes the right target, so the question is where the target sits"
      standfirst={
        'Gross general government debt as a share of GDP. The dashed rule is ' +
        'your target, held against where debt is forecast to be, where it is ' +
        'now, and the lowest this country has managed since 2001.'
      }
      caption={caption}
      source={
        'IMF World Economic Outlook, gross general government debt over nominal ' +
        'GDP. Forecast values are WEO projections, not outturns.'
      }
      footnote={
        'No fiscal-rule ceiling is bundled with this app. Regional convergence ' +
        'criteria and national charters set real ceilings, and none of them is ' +
        'in the data this build ships, so none is drawn here.'
      }
      controls={
        <RationaleAction sentence={sentence} current={note} onWrite={onNoteChange} />
      }
    >
      <PeerStrips
        iso3c={iso3c}
        countryName={countryName}
        vintage={vintage}
        scope={scope}
        onScopeChange={onScopeChange}
        sharedDomain
        format={ratio}
        emptyText={`No bundled debt record for ${iso3c}.`}
        strips={[
          {
            stat: 'debt_weo_last',
            label: `Forecast for ${PEER_WEO_YEAR}`,
            sublabel: 'WEO projection',
            setting,
          },
          {
            stat: 'debt_hist_last',
            label: `Outturn, ${PEER_HISTORY_YEAR}`,
            sublabel: 'last year that is an outturn in both data vintages',
            setting,
          },
          {
            stat: 'debt_hist_min',
            label: 'Lowest since 2001',
            sublabel: 'the floor each country has actually reached',
            setting,
          },
        ]}
      />
    </ContextFrame>
  );
}
