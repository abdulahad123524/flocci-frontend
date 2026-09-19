import { getNavItem } from "../../config/navigation";

export default function ScreenHeader({ view, stats }) {
  const item = getNavItem(view);

  return (
    <header className="mast">
      <div>
        <p className="kicker">{item.kicker}</p>
        <h1>{item.title}</h1>
      </div>
      <dl className="ticket">
        {stats.map(({ label, value }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
        <dt>Status</dt>
        <dd className="live">
          <i />
          ui only
        </dd>
      </dl>
    </header>
  );
}
