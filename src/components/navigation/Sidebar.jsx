import NavIcon from "../NavIcon";

export default function Sidebar({ items, activeId, onNavigate }) {
  return (
    <aside className="sidebar">
      <p className="brand">FLOCI</p>
      <nav className="nav" aria-label="Vault sections">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-item ${activeId === item.id ? "active" : ""}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-index">{item.index}</span>
            <span className="nav-icon">
              <NavIcon id={item.id} />
            </span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
      <p className="nav-foot">UI only</p>
    </aside>
  );
}
