export default function BlockScreen({ state, actions }) {
  const {
    buckets,
    blockBucketName,
    blockAccess,
    blockPolicy,
    blockBusy,
    blockFlags,
  } = state;
  const {
    setBlockBucketName,
    toggleBlockAll,
    toggleBlockFlag,
    saveBlockAccess,
    removeBlockAccess,
  } = actions;

  return (
    <div className="stage">
      <section className="panel bays">
        <header>
          <h2>SET BLOCK</h2>
          <span className="count">PUT /bucket-block-access</span>
        </header>
        {buckets.length === 0 ? (
          <p className="empty">Stamp a bay before you set block access.</p>
        ) : (
          <form className="form" onSubmit={saveBlockAccess}>
            <label>
              Bucket
              <select
                value={blockBucketName}
                onChange={(e) => setBlockBucketName(e.target.value)}
              >
                <option value="">select bucket</option>
                {buckets.map((bucket) => (
                  <option key={bucket.id} value={bucket.name}>
                    {bucket.name}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="method-set">
              <legend>Public access</legend>
              <label className="check">
                <input
                  type="checkbox"
                  checked={Object.values(blockPolicy).every(Boolean)}
                  onChange={toggleBlockAll}
                />
                Block all public access
              </label>
            </fieldset>
            <fieldset className="method-set">
              <legend>Settings</legend>
              {blockFlags.map((flag) => (
                <label key={flag.key} className="check block-check">
                  <input
                    type="checkbox"
                    checked={Boolean(blockPolicy[flag.key])}
                    onChange={() => toggleBlockFlag(flag.key)}
                  />
                  <span>
                    {flag.label}
                    <small>{flag.hint}</small>
                  </span>
                </label>
              ))}
            </fieldset>
            <button
              className="primary"
              type="submit"
              disabled={blockBusy || !blockBucketName}
            >
              Save block access
            </button>
            <button
              className="ghost"
              type="button"
              disabled={
                blockBusy || !blockBucketName || !blockAccess?.configured
              }
              onClick={removeBlockAccess}
            >
              Remove block access
            </button>
          </form>
        )}
      </section>
      <section className="panel snaps">
        <header>
          <h2>POLICY</h2>
          <span className="count">GET /bucket-block-access</span>
        </header>
        {!blockBucketName ? (
          <p className="empty">Pick a bay to load block access.</p>
        ) : !blockAccess ? (
          <p className="empty">Loading block access...</p>
        ) : (
          <dl className="version-data block-data">
            <div>
              <dt>Bucket</dt>
              <dd>{blockAccess.bucketName}</dd>
            </div>
            <div>
              <dt>Configured</dt>
              <dd>{blockAccess.configured ? "yes" : "no"}</dd>
            </div>
            <div>
              <dt>Block all</dt>
              <dd>{blockAccess.blockAll ? "on" : "off"}</dd>
            </div>
            {blockFlags.map((flag) => (
              <div key={flag.key}>
                <dt>{flag.label}</dt>
                <dd>
                  {blockAccess.policy?.[flag.key] ? "blocked" : "allowed"}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </div>
  );
}
