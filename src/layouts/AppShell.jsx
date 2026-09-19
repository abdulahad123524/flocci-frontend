import Sidebar from "../components/navigation/Sidebar";
import ScreenHeader from "../components/layout/ScreenHeader";

export default function AppShell({
  items,
  view,
  onNavigate,
  stats,
  children,
}) {
  return (
    <div className="vault">
      <Sidebar items={items} activeId={view} onNavigate={onNavigate} />
      <main className="workspace">
        <ScreenHeader view={view} stats={stats} />
        {children}
      </main>
    </div>
  );
}
