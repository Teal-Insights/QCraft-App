/**
 * Chart legend, as HTML rather than SVG.
 *
 * Identity is never carried by colour alone anywhere in this app (see the
 * relief rule in theme.ts): every chart that has more than one series ships a
 * legend and a hover tooltip listing all of them.
 */

interface Item {
  key: string;
  label: string;
  color: string;
  muted?: boolean;
}

export function Legend({ items }: { items: Item[] }) {
  return (
    <ul className="wlegend">
      {items.map((item) => (
        <li
          key={item.key}
          className="wlegend__item"
          style={item.muted ? { opacity: 0.55 } : undefined}
        >
          <span className="wlegend__line" style={{ background: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
