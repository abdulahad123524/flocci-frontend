export default function EncryptionScreen({ state, actions }) {
  const { buckets, encryptBucketName, encryption, encryptBusy } = state;
  const {
    enableBucketEncryption,
    setEncryptBucketName,
    removeBucketEncryption,
  } = actions;

  return (
    <div className="stage">
      <section className="panel bays">
        <header>
          <h2>LOCK BAY</h2>
          <span className="count">POST /encrypt-bucket</span>
        </header>
        {buckets.length === 0 ? (
          <p className="empty">Stamp a bay before you encrypt it.</p>
        ) : (
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              enableBucketEncryption();
            }}
          >
            <label>
              Bucket
              <select
                value={encryptBucketName}
                onChange={(e) => setEncryptBucketName(e.target.value)}
              >
                <option value="">select bucket</option>
                {buckets.map((bucket) => (
                  <option key={bucket.id} value={bucket.name}>
                    {bucket.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Algorithm
              <select value="AES256" disabled>
                <option value="AES256">AES256</option>
              </select>
            </label>
            <button
              className="primary"
              type="submit"
              disabled={encryptBusy || !encryptBucketName}
            >
              Enable encryption
            </button>
            <button
              className="ghost"
              type="button"
              disabled={
                encryptBusy || !encryptBucketName || !encryption?.encrypted
              }
              onClick={removeBucketEncryption}
            >
              Remove encryption
            </button>
          </form>
        )}
      </section>
      <section className="panel snaps">
        <header>
          <h2>ENCRYPTION</h2>
          <span className="count">GET /get-bucket-encryption</span>
        </header>
        {!encryptBucketName ? (
          <p className="empty">Pick a bay to load encryption.</p>
        ) : !encryption ? (
          <p className="empty">Loading encryption...</p>
        ) : (
          <dl className="version-data">
            <div>
              <dt>Bucket</dt>
              <dd>{encryption.bucketName}</dd>
            </div>
            <div>
              <dt>Encrypted</dt>
              <dd>{encryption.encrypted ? "yes" : "no"}</dd>
            </div>
            <div>
              <dt>Algorithm</dt>
              <dd>{encryption.algorithm || "-"}</dd>
            </div>
            <div>
              <dt>KMS key</dt>
              <dd>{encryption.kmsKeyId || "-"}</dd>
            </div>
            <div>
              <dt>Bucket key</dt>
              <dd>{encryption.bucketKeyEnabled ? "on" : "off"}</dd>
            </div>
          </dl>
        )}
      </section>
    </div>
  );
}
