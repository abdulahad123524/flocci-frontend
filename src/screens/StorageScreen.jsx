const STORAGE_TIERS = [
  { name: "Standard", used: "1.4 TB", share: 58, note: "hot objects" },
  { name: "Infrequent", used: "680 GB", share: 28, note: "cool lane" },
  { name: "Archive", used: "320 GB", share: 14, note: "deep hold" },
];

export default function StorageScreen() {
  return (
    <div className="stage">
      <section className="panel capacity">
        <header>
          <h2>CAPACITY</h2>
          <span className="count">2.4 TB used</span>
        </header>
        <div className="cap-body">
          <div className="cap-bar" aria-hidden="true">
            <i style={{ width: "24%" }} />
          </div>
          <p className="cap-note">10 TB provisioned · 76% free</p>
          <div className="cell-map">
            {Array.from({ length: 48 }, (_, index) => (
              <span
                key={index}
                className={`cell ${index < 12 ? "hot" : index < 26 ? "warm" : ""}`}
              />
            ))}
          </div>
        </div>
      </section>
      <section className="panel tiers">
        <header>
          <h2>TIERS</h2>
          <span className="count">ui mock</span>
        </header>
        {STORAGE_TIERS.map((tier) => (
          <div key={tier.name} className="tier-row">
            <div>
              <strong>{tier.name}</strong>
              <span>{tier.note}</span>
            </div>
            <em>{tier.used}</em>
            <b>{tier.share}%</b>
          </div>
        ))}
      </section>
    </div>
  );
}
