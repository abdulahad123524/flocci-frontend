export default function PanelHeader({ title, count, children }) {
  return (
    <header>
      <h2>{title}</h2>
      <span className="count">{count}</span>
      {children}
    </header>
  );
}
