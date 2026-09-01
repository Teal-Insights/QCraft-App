/**
 * Summary stat tile. Replaces the Shiny `value_box`.
 *
 * No sparkline, no icon: these are single read-outs and the number should be
 * the loudest thing in the tile.
 */

interface Props {
  label: string;
  value: string;
  /** Sub-line under the value — context, not a second metric. */
  detail?: string;
  tone?: 'neutral' | 'negative';
}

export function StatCard({ label, value, detail, tone = 'neutral' }: Props) {
  return (
    <div className={`card card--${tone}`}>
      <p className="card__label">{label}</p>
      <p className="card__value">{value}</p>
      {detail && <p className="card__detail">{detail}</p>}
    </div>
  );
}
