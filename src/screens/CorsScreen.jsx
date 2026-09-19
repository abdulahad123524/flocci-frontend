export default function CorsScreen({ state, actions }) {
  const {
    buckets,
    corsBucketName,
    corsOrigins,
    corsHeaders,
    corsExposeHeaders,
    corsMaxAge,
    corsMethods,
    corsBusy,
    corsRules,
  } = state;
  const {
    setCorsBucketName,
    setCorsOrigins,
    setCorsHeaders,
    setCorsExposeHeaders,
    setCorsMaxAge,
    toggleCorsMethod,
    saveBucketCors,
    removeBucketCors,
  } = actions;

  return (
    <div className="stage">
      <section className="panel bays">
        <header>
          <h2>SET CORS</h2>
          <span className="count">PUT /bucket-cors</span>
        </header>
        {buckets.length === 0 ? (
          <p className="empty">Stamp a bay before you set CORS.</p>
        ) : (
          <form className="form" onSubmit={saveBucketCors}>
            <label>
              Bucket
              <select
                value={corsBucketName}
                onChange={(e) => setCorsBucketName(e.target.value)}
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
              Allowed origins
              <textarea
                value={corsOrigins}
                onChange={(e) => setCorsOrigins(e.target.value)}
                placeholder={"*\nor https://app.example.com"}
                rows={3}
              />
            </label>
            <label>
              Allowed headers
              <input
                value={corsHeaders}
                onChange={(e) => setCorsHeaders(e.target.value)}
                placeholder="*"
                autoComplete="off"
              />
            </label>
            <label>
              Expose headers
              <input
                value={corsExposeHeaders}
                onChange={(e) => setCorsExposeHeaders(e.target.value)}
                placeholder="ETag, x-amz-request-id"
                autoComplete="off"
              />
            </label>
            <label>
              Max age (seconds)
              <input
                type="number"
                min="0"
                value={corsMaxAge}
                onChange={(e) => setCorsMaxAge(e.target.value)}
              />
            </label>
            <fieldset className="method-set">
              <legend>Allowed methods</legend>
              {["GET", "HEAD", "PUT", "POST", "DELETE"].map((method) => (
                <label key={method} className="check">
                  <input
                    type="checkbox"
                    checked={corsMethods.includes(method)}
                    onChange={() => toggleCorsMethod(method)}
                  />
                  {method}
                </label>
              ))}
            </fieldset>
            <button
              className="primary"
              type="submit"
              disabled={corsBusy || !corsBucketName}
            >
              Save CORS
            </button>
            <button
              className="ghost"
              type="button"
              disabled={corsBusy || !corsBucketName || !corsRules.length}
              onClick={removeBucketCors}
            >
              Remove CORS
            </button>
          </form>
        )}
      </section>
      <section className="panel snaps">
        <header>
          <h2>RULES</h2>
          <span className="count">GET /bucket-cors</span>
        </header>
        {!corsBucketName ? (
          <p className="empty">Pick a bay to load CORS.</p>
        ) : corsRules.length === 0 ? (
          <p className="empty">No CORS rules on this bay.</p>
        ) : (
          corsRules.map((rule, index) => (
            <div key={index} className="cors-rule">
              <strong>Rule {index + 1}</strong>
              <p>
                <span>Origins</span>
                {(rule.AllowedOrigins || []).join(", ") || "-"}
              </p>
              <p>
                <span>Methods</span>
                {(rule.AllowedMethods || []).join(", ") || "-"}
              </p>
              <p>
                <span>Headers</span>
                {(rule.AllowedHeaders || []).join(", ") || "-"}
              </p>
              <p>
                <span>Expose</span>
                {(rule.ExposeHeaders || []).join(", ") || "-"}
              </p>
              <p>
                <span>Max age</span>
                {rule.MaxAgeSeconds ?? "-"}
              </p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
