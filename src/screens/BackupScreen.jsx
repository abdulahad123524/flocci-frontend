const BACKUP_SHOTS = [
  { id: "snap-1842", when: "Today 06:12", size: "2.1 GB", state: "sealed" },
  { id: "snap-1837", when: "Yesterday 02:00", size: "2.0 GB", state: "sealed" },
  { id: "snap-1829", when: "Sep 09 02:00", size: "1.9 GB", state: "sealed" },
];

export default function BackupScreen() {
  return (
    <div className="stage">
      <section className="panel schedule">
        <header>
          <h2>SCHEDULE</h2>
          <span className="count">daily 02:00 UTC</span>
        </header>
        <div className="form">
          <label>
            Cadence
            <select defaultValue="daily" disabled>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </label>
          <label>
            Retention
            <select defaultValue="30" disabled>
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
            </select>
          </label>
          <p className="cap-note">Controls are display-only.</p>
        </div>
      </section>
      <section className="panel snaps">
        <header>
          <h2>SNAPSHOTS</h2>
          <span className="count">{BACKUP_SHOTS.length} sealed</span>
        </header>
        {BACKUP_SHOTS.map((shot) => (
          <div key={shot.id} className="bay-row">
            <div className="row static">
              <span className="stub" />
              <span className="key">{shot.id}</span>
              <span className="meta">
                {shot.when} · {shot.size}
              </span>
            </div>
            <span className="seal">{shot.state}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
