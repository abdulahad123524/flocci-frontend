import { useCallback, useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

async function backupApiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export default function BackupScreen({ state, actions }) {
  const sourceBucketName = state.active?.name || "";

  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadBackups = useCallback(async () => {
    if (!sourceBucketName) {
      setBackups([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await backupApiRequest(
        `/backup/bucket/${encodeURIComponent(sourceBucketName)}`,
      );

      setBackups(Array.isArray(data.backups) ? data.backups : []);
    } catch (err) {
      setError(err.message || "Could not load backup history.");
    } finally {
      setLoading(false);
    }
  }, [sourceBucketName]);

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  const initializeBackup = async () => {
    setInitializing(true);
    setError("");
    setMessage("");

    try {
      const data = await backupApiRequest("/backup/initialize", {
        method: "POST",
      });

      setMessage(data.message || "Backup bucket is ready.");
    } catch (err) {
      setError(err.message || "Could not initialize backup storage.");
    } finally {
      setInitializing(false);
    }
  };

  const createBackup = async () => {
    console.log("Source bucket:", sourceBucketName);

    if (!sourceBucketName) {
      setError("Select a source bucket first.");
      return;
    }

    if (sourceBucketName === "flocci-backups") {
      setError(
        "Please select an original source bucket, not the backup bucket.",
      );
      return;
    }
    setCreating(true);
    setError("");
    setMessage("");

    try {
      const data = await backupApiRequest("/backup/bucket", {
        method: "POST",
        body: JSON.stringify({ sourceBucketName }),
      });

      setMessage(data.message || "Backup request completed.");
      await loadBackups();
    } catch (err) {
      console.error("Create backup error:", err);
      setError(err.message || "Backup creation failed.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="stage">
      <section className="panel schedule">
        <header>
          <h2>BACKUP CONTROLS</h2>
          <span className="count">
            {sourceBucketName || "No bucket selected"}
          </span>
        </header>

        <div className="form">
          <label>
            Select Bucket
            <select
              value={sourceBucketName}
              onChange={(e) => {
                const bucketName = e.target.value;

                const selectedBucket = state.buckets.find(
                  (bucket) => bucket.name === bucketName,
                );

                if (selectedBucket) {
                  actions.openBucket(selectedBucket);
                }
              }}
            >
              <option value="">Select a bucket</option>

              {state.buckets.map((bucket) => (
                <option key={bucket.name} value={bucket.name}>
                  {bucket.name}
                </option>
              ))}
            </select>
          </label>

          <p className="cap-note">
            Automatic scheduling and retention are not enabled yet.
          </p>

          <div className="backup-actions">
            <button
              type="button"
              onClick={initializeBackup}
              disabled={initializing || creating}
            >
              {initializing ? "Initializing..." : "Initialize Backup"}
            </button>

            <button
              type="button"
              onClick={createBackup}
              disabled={!sourceBucketName || creating || initializing}
            >
              {creating ? "Creating Backup..." : "Create Backup"}
            </button>

            <button
              type="button"
              onClick={loadBackups}
              disabled={!sourceBucketName || loading}
            >
              {loading ? "Refreshing..." : "Refresh History"}
            </button>
          </div>

          {message && (
            <p role="status" className="backup-success">
              {message}
            </p>
          )}

          {error && (
            <p role="alert" className="backup-error">
              {error}
            </p>
          )}
        </div>
      </section>

      <section className="panel snaps">
        <header>
          <h2>SNAPSHOTS</h2>
          <span className="count">{backups.length} found</span>
        </header>

        {loading && backups.length === 0 ? (
          <p className="cap-note">Loading backup history...</p>
        ) : backups.length === 0 ? (
          <p className="cap-note">No backups found for this bucket.</p>
        ) : (
          backups.map((backup, index) => {
            const id =
              backup.backupId ||
              backup.id ||
              backup.snapshotId ||
              `backup-${index}`;

            const when =
              backup.createdAt ||
              backup.timestamp ||
              backup.when ||
              "Date unavailable";

            const size = backup.size || backup.totalSize || "Size unavailable";

            const status = backup.status || backup.state || "completed";

            return (
              <div key={id} className="bay-row">
                <div className="row static">
                  <span className="stub" />
                  <span className="key">{id}</span>
                  <span className="meta">
                    {String(when)} · {String(size)}
                  </span>
                </div>

                <span className="seal">{String(status)}</span>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
