/**
 * Expenditure rigidity: what the record supports, and why it is not a number.
 *
 * Every other context panel puts a published series in front of a control.
 * Nobody publishes rigidity, so this one puts the evidence in front of the
 * control instead, and the evidence is a range.
 *
 * The engine's own algebra makes the target exact. `climate.py` holds primary
 * expenditure at `PE_base * (1 + (1 - rigidity) * g)` for a proportional GDP
 * shock, so rigidity is one minus the elasticity of primary expenditure to GDP.
 * The WEO history records that elasticity for every country. It records it
 * badly for any one country and usefully for a group, so the panel opens on the
 * group and offers the country's own years as the second view rather than the
 * first.
 *
 * Two views, one visual field each:
 *
 *   THE RECORD    six readings of the same history with their intervals. They
 *                 are individually precise and they disagree, which is the
 *                 honest width of what can be claimed.
 *   THIS COUNTRY  the country's own years as a cloud between the parameter's two
 *                 endpoints, with its fitted slope and the standard error that
 *                 says how little the slope means.
 *
 * The engine default of 1.0 is drawn on the readings chart because it sits above
 * every reading. The module that implements it calls 1.0 the sticky worst case
 * in its own docstring, so a user meeting that fact inside the tool is meeting
 * the design rather than a criticism of it.
 *
 * This panel shipped behind a gate to Teal on the wording of what it claims.
 * docs/parameter-data.md section 7.5 carries the gate and the options.
 */

import { useMemo, useState } from 'react';

import {
  peerCountry,
  rigidityPoints,
  rigidityReadings,
  rigiditySpan,
} from '../../context/peers';
import { panelWidgetLink } from '../../context/panels';
import { ContextFrame } from './ContextFrame';
import { ContextChoice } from './ContextChoice';
import { RationaleAction } from './RationaleAction';
import { ReadingsChart, RigidityScatter, fitCountry } from './RigidityCharts';

type View = 'record' | 'country';

const VIEWS: Array<{ value: View; label: string }> = [
  { value: 'record', label: 'What the record supports' },
  { value: 'country', label: 'This country’s own years' },
];

interface Props {
  iso3c: string;
  countryName: string;
  vintage: string;
  rigidity: number;
  engineDefault: number;
  slug: string;
  note: string;
  onNoteChange: (note: string) => void;
}

const fixed = (value: number) => value.toFixed(2);

export function RigidityPanel({
  iso3c,
  countryName,
  vintage,
  rigidity,
  engineDefault,
  slug,
  note,
  onNoteChange,
}: Props) {
  const [view, setView] = useState<View>('record');
  /**
   * World or the country's own region. Not the subregion, and not a
   * similarity band: the pooled estimate needs enough countries to be worth
   * reading, and the regional sets are already thin enough that Oceania's
   * intervals carry no information.
   */
  const [scope, setScope] = useState<'World' | 'region'>('World');

  const country = peerCountry(iso3c);
  const scopeName = scope === 'World' ? 'World' : (country?.region ?? 'World');
  const readings = rigidityReadings(vintage, scopeName);
  const span = rigiditySpan(readings);

  const points = useMemo(() => rigidityPoints(vintage, iso3c), [vintage, iso3c]);
  const fit = useMemo(() => fitCountry(points), [points]);

  const scopeChoices: Array<{ value: 'World' | 'region'; label: string }> = country?.region
    ? [
        { value: 'World', label: 'All countries' },
        { value: 'region', label: country.region },
      ]
    : [{ value: 'World', label: 'All countries' }];

  const recordCaption = !span ? (
    'No pooled estimate is available for this data vintage.'
  ) : (
    <>
      Six readings of the same history put implied rigidity between{' '}
      <strong>{fixed(span.low)}</strong> and <strong>{fixed(span.high)}</strong> for{' '}
      {scopeName === 'World' ? 'all countries' : scopeName}. Each reading is
      precise and they disagree, so the record supports a range rather than a
      number. Your setting is <strong>{rigidity.toFixed(1)}</strong>, and the
      engine default of {engineDefault.toFixed(1)} sits above every reading.
    </>
  );

  const countryCaption = !fit ? (
    `The bundle carries too few usable years for ${countryName} to fit anything.`
  ) : (
    <>
      Across {fit.observations} years, {countryName}&rsquo;s spending moved{' '}
      <strong>{fit.slope.toFixed(2)}</strong> points for each point its economy
      moved, which implies a rigidity of{' '}
      <strong>{(1 - fit.slope).toFixed(2)}</strong>. The standard error on that
      slope is <strong>{fit.standardError.toFixed(2)}</strong> and it explains{' '}
      {(fit.rSquared * 100).toFixed(0)}% of the variation, so one country&rsquo;s
      record cannot settle this. That is what makes it a judgment.
    </>
  );

  const sentence = span
    ? `Rigidity ${rigidity.toFixed(1)}. The WEO record for ${scopeName === 'World' ? 'all countries' : scopeName} implies ${fixed(span.low)} to ${fixed(span.high)} across six readings; the engine default is ${engineDefault.toFixed(1)}.`
    : `Rigidity ${rigidity.toFixed(1)}, set as a judgment: no bundled series measures it.`;

  return (
    <ContextFrame
      slug={slug}
      widgetLink={panelWidgetLink('rigidity')}
      title={
        view === 'record'
          ? 'The record supports a range for rigidity, not a number'
          : `${countryName}’s own years do not pin rigidity down`
      }
      standfirst={
        view === 'record'
          ? 'Rigidity is one minus how far primary spending moves when GDP moves. ' +
            'Each row asks that of the WEO record a different defensible way.'
          : 'Every year since 2001, plotted against this country’s own average. ' +
            'The two dashed lines are what the control’s endpoints would look like.'
      }
      caption={view === 'record' ? recordCaption : countryCaption}
      source={
        'IMF World Economic Outlook, primary expenditure and nominal GDP, 2001 ' +
        'to 2023. Computed for this app, not published by the IMF: pooled ' +
        'least squares with country means removed and standard errors clustered ' +
        'by country. Method and caveats in docs/parameter-data.md section 7.'
      }
      footnote={
        'Co-movement is not a response. These estimates mix discretionary policy ' +
        'with automatic stabilisers, and spending and output are decided ' +
        'together. They bound the parameter for a group of countries. They do ' +
        'not measure it for one.'
      }
      controls={
        <>
          <ContextChoice legend="View" choices={VIEWS} value={view} onChange={setView} />
          {view === 'record' && scopeChoices.length > 1 && (
            <ContextChoice
              legend="Estimated over"
              choices={scopeChoices}
              value={scope}
              onChange={setScope}
            />
          )}
          <RationaleAction sentence={sentence} current={note} onWrite={onNoteChange} />
        </>
      }
    >
      {view === 'record' ? (
        <ReadingsChart
          readings={readings}
          setting={rigidity}
          engineDefault={engineDefault}
        />
      ) : (
        <RigidityScatter points={points} countryName={countryName} fit={fit} />
      )}
    </ContextFrame>
  );
}
