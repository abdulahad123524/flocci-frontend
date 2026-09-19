export default function TagsScreen({ state, actions }) {
  const { buckets, tagBucket, bucketTags, tagKey, tagValue, tagBusy } = state;
  const { addBucketTag, setTagBucket, setTagKey, setTagValue, removeBucketTag } =
    actions;

  return (
    <div className="stage">
      <section className="panel bays">
        <header>
          <h2>SET TAG</h2>
          <span className="count">PUT /bucket-tags</span>
        </header>
        {buckets.length === 0 ? (
          <p className="empty">Stamp a bay before you tag it.</p>
        ) : (
          <form className="form" onSubmit={addBucketTag}>
            <label>
              Bucket
              <select
                value={tagBucket}
                onChange={(e) => setTagBucket(e.target.value)}
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
              Key
              <input
                value={tagKey}
                onChange={(e) => setTagKey(e.target.value)}
                placeholder="env"
                autoComplete="off"
              />
            </label>
            <label>
              Value
              <input
                value={tagValue}
                onChange={(e) => setTagValue(e.target.value)}
                placeholder="prod"
                autoComplete="off"
              />
            </label>
            <button
              className="primary"
              type="submit"
              disabled={tagBusy || !tagBucket}
            >
              Save tag
            </button>
          </form>
        )}
      </section>
      <section className="panel snaps">
        <header>
          <h2>TAGS</h2>
          <span className="count">
            {tagBucket ? `${bucketTags.length} on ${tagBucket}` : "GET /bucket-tags"}
          </span>
        </header>
        {!tagBucket ? (
          <p className="empty">Pick a bay to load its tags.</p>
        ) : bucketTags.length === 0 ? (
          <p className="empty">No tags on this bay yet.</p>
        ) : (
          bucketTags.map((tag) => {
            const key = tag.Key || tag.key;
            const value = tag.Value ?? tag.value ?? "";
            return (
              <div key={key} className="bay-row">
                <div className="row static">
                  <span className="stub" />
                  <span className="key">{key}</span>
                  <span className="meta">{value || "-"}</span>
                </div>
                <button
                  type="button"
                  className="delete-button"
                  disabled={tagBusy}
                  onClick={() => removeBucketTag(key)}
                >
                  Delete
                </button>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
