import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const formatBytes = (n = 0) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

const isBucketName = (name) =>
  /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(name) && !name.includes("..");

const readFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    if (
      file.type.startsWith("text/") ||
      /\.(txt|json|md|csv)$/i.test(file.name)
    ) {
      reader.onload = () =>
        resolve({ text: String(reader.result), dataUrl: null });
      reader.readAsText(file);
    } else if (file.type.startsWith("image/")) {
      reader.onload = () =>
        resolve({ text: null, dataUrl: String(reader.result) });
      reader.readAsDataURL(file);
    } else {
      resolve({ text: null, dataUrl: null });
    }
  });

export default function App() {
  const inputRef = useRef(null);
  const [buckets, setBuckets] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [createName, setCreateName] = useState("");
  const [createRegion, setCreateRegion] = useState("us-east-1");
  const [editName, setEditName] = useState("");
  const [editRegion, setEditRegion] = useState("us-east-1");
  const [editNote, setEditNote] = useState("");
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  const active = useMemo(
    () => buckets.find((b) => b.id === activeId) || null,
    [buckets, activeId],
  );

  const loadBuckets = async () => {
    try {
      const res = await fetch("/api/buckets");
      const data = await res.json().catch(() => ({}));

      console.log("data", data);
      if (!res.ok) return;
      setBuckets(
        (data.buckets || []).map((bucket) => ({
          id: bucket.name,
          name: bucket.name,
          region: "us-east-1",
          note: "",
          files: [],
        })),
      );
    } catch {
      // Keep local list if listing is not available yet
    }
  };

  useEffect(() => {
    loadBuckets();
  }, []);

  const loadFiles = async (bucketName) => {
    const res = await fetch(
      `/api/objects?bucket=${encodeURIComponent(bucketName)}`,
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Could not list files");
    const files = (data.objects || []).map((obj) => ({
      key: obj.key,
      size: obj.size,
      type: "application/octet-stream",
    }));
    setBuckets((list) =>
      list.map((b) => (b.name === bucketName ? { ...b, files } : b)),
    );
    return files;
  };

  const openBucket = async (bucket) => {
    setActiveId(bucket.id);
    setEditName(bucket.name);
    setEditRegion(bucket.region);
    setEditNote(bucket.note);
    setPreview(null);
    setFile(null);
    setError("");
    setStatus(`Opened ${bucket.name}`);
    try {
      await loadFiles(bucket.name);
    } catch (err) {
      setError(err.message);
    }
  };

  const createBucket = (e) => {
    e.preventDefault();
    const name = createName.trim().toLowerCase();
    setError("");
    if (!isBucketName(name)) {
      setError("Bucket name: 3-63 chars, lowercase, numbers, dots or hyphens.");
      return;
    }
    if (buckets.some((b) => b.name === name)) {
      setError("That bay already exists.");
      return;
    }

    fetch("/api/create-bucket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bucketName: name }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || "Could not create bucket");
        }
        const bucket = {
          id: name,
          name,
          region: createRegion,
          note: "",
          files: [],
        };
        setBuckets((list) =>
          list.some((b) => b.name === name) ? list : [bucket, ...list],
        );
        setCreateName("");
        setActiveId(name);
        setEditName(name);
        setEditRegion(createRegion);
        setEditNote("");
        setPreview(null);
        setFile(null);
        setStatus(`Bay stamped: ${name}`);
        loadFiles(name).catch(() => {});
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      });
  };

  const updateBucket = (e) => {
    e.preventDefault();
    if (!active) return;
    const name = editName.trim().toLowerCase();
    setError("");
    if (!isBucketName(name)) {
      setError("Bucket name: 3-63 chars, lowercase, numbers, dots or hyphens.");
      return;
    }
    if (buckets.some((b) => b.name === name && b.id !== active.id)) {
      setError("Another bay already uses that name.");
      return;
    }
    setBuckets((list) =>
      list.map((b) =>
        b.id === active.id
          ? { ...b, name, region: editRegion, note: editNote.trim() }
          : b,
      ),
    );
    setStatus(`Bay updated: ${name}`);
  };

  const deleteBucket = async (bucketName) => {
    setError("");
    try {
      const res = await fetch("/api/delete-bucket", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucketName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not delete bucket");
      setBuckets((list) => list.filter((b) => b.name !== bucketName));
      if (activeId === bucketName) {
        setActiveId(null);
        setPreview(null);
        setEditName("");
        setEditNote("");
      }
      setStatus(`Bay scrapped: ${bucketName}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const onFiles = (list) => {
    const next = list?.[0];
    if (next) setFile(next);
  };

  const addFile = async () => {
    if (!active || !file) return;
    setError("");
    try {
      const content = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          resolve(String(reader.result).split(",")[1] || "");
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          content,
          contentType: file.type || "application/octet-stream",
          bucketName: active.name,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Upload failed");

      const previewData = await readFile(file);
      const entry = {
        key: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        ...previewData,
      };
      setBuckets((list) =>
        list.map((b) =>
          b.id === active.id
            ? {
                ...b,
                files: [entry, ...b.files.filter((f) => f.key !== file.name)],
              }
            : b,
        ),
      );
      setStatus(`Stowed ${file.name} in ${active.name}`);
      setFile(null);
      setPreview(entry);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="vault">
      <header className="mast">
        <div>
          <p className="kicker">Yard ledger</p>
          <h1>FLOCI VAULT</h1>
        </div>
        <dl className="ticket">
          <dt>Open bay</dt>
          <dd>{active ? active.name : "none selected"}</dd>
          <dt>Bays on lot</dt>
          <dd>{buckets.length}</dd>
          <dt>Status</dt>
          <dd className="live">
            <i />
            ui only
          </dd>
        </dl>
      </header>

      <div className="yard">
        <section className="panel bays">
          <header>
            <h2>NEW BAY</h2>
            <span className="count">create bucket</span>
          </header>
          <form className="form" onSubmit={createBucket}>
            <label>
              Bucket name
              <input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="photos-2026"
                autoComplete="off"
              />
            </label>
            <label>
              Region
              <select
                value={createRegion}
                onChange={(e) => setCreateRegion(e.target.value)}
              >
                <option value="us-east-1">us-east-1</option>
                <option value="us-west-2">us-west-2</option>
                <option value="eu-west-1">eu-west-1</option>
                <option value="ap-south-1">ap-south-1</option>
              </select>
            </label>
            <button className="primary" type="submit">
              Stamp bay
            </button>
          </form>

          <header className="subhead">
            <h2>BAYS</h2>
            <span className="count">{buckets.length}</span>
          </header>
          {buckets.length === 0 ? (
            <p className="empty">No bays yet. Stamp one to start.</p>
          ) : (
            buckets.map((bucket) => (
              <div
                key={bucket.id}
                className={`bay-row ${activeId === bucket.id ? "selected" : ""}`}
              >
                <button
                  type="button"
                  className="row"
                  onClick={() => openBucket(bucket)}
                >
                  <span className="stub" />
                  <span className="key">{bucket.name}</span>
                  <span className="meta">{bucket.files.length} files</span>
                </button>
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => deleteBucket(bucket.name)}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </section>

        <section className="panel dock">
          <header>
            <h2>UPDATE BAY</h2>
            <span className="count">{active ? "selected" : "pick a bay"}</span>
          </header>
          {active ? (
            <form className="form" onSubmit={updateBucket}>
              <label>
                Bucket name
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoComplete="off"
                />
              </label>
              <label>
                Region
                <select
                  value={editRegion}
                  onChange={(e) => setEditRegion(e.target.value)}
                >
                  <option value="us-east-1">us-east-1</option>
                  <option value="us-west-2">us-west-2</option>
                  <option value="eu-west-1">eu-west-1</option>
                  <option value="ap-south-1">ap-south-1</option>
                </select>
              </label>
              <label>
                Dock note
                <input
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="optional label"
                />
              </label>
              <button className="primary" type="submit">
                Save bay
              </button>
            </form>
          ) : (
            <p className="empty">Select a bay before you edit it.</p>
          )}

          <header className="subhead">
            <h2>ADD FILE</h2>
            <span className="count">{active ? active.name : "no bay"}</span>
          </header>
          <div
            className={`drop ${drag ? "active" : ""} ${!active ? "locked" : ""}`}
            onClick={() => active && inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              if (active) setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              if (active) onFiles(e.dataTransfer.files);
            }}
          >
            <div>
              <strong>{active ? "LOADING BAY" : "CLOSED"}</strong>
              <p>
                {active
                  ? `Drop cargo into ${active.name}`
                  : "Open a bay first, then drop a file"}
              </p>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            hidden
            onChange={(e) => onFiles(e.target.files)}
          />
          {file && (
            <p className="file-chip">
              {file.name} · {formatBytes(file.size)}
            </p>
          )}
          <div className="actions">
            <button
              className="primary"
              type="button"
              disabled={!active || !file}
              onClick={addFile}
            >
              Stow in bay
            </button>
          </div>
        </section>

        <section className="panel manifest">
          <header>
            <h2>CARGO</h2>
            <span className="count">
              {active
                ? `${active.files.length} in ${active.name}`
                : "0 objects"}
            </span>
          </header>
          {!active ? (
            <p className="empty">Pick a bay to see its files.</p>
          ) : active.files.length === 0 ? (
            <p className="empty">This bay is empty.</p>
          ) : (
            active.files.map((obj) => (
              <button
                key={obj.key}
                type="button"
                className={`row ${preview?.key === obj.key ? "selected" : ""}`}
                onClick={async () => {
                  if (obj.text || obj.dataUrl) {
                    setPreview(obj);
                    return;
                  }
                  try {
                    const res = await fetch(
                      `/api/objects/${encodeURIComponent(obj.key)}?bucket=${encodeURIComponent(active.name)}`,
                    );
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message);
                    setPreview({
                      key: data.key,
                      type: data.contentType,
                      text: data.text,
                      dataUrl: data.dataUrl,
                    });
                  } catch (err) {
                    setError(err.message);
                  }
                }}
              >
                <span className="stub" />
                <span className="key">{obj.key}</span>
                <span className="meta">{formatBytes(obj.size)}</span>
              </button>
            ))
          )}
        </section>

        {preview && (
          <section className="panel preview">
            <header>
              <h2>{preview.key}</h2>
              <span className="count">{preview.type}</span>
            </header>
            {preview.text ? (
              <pre>{preview.text}</pre>
            ) : preview.dataUrl ? (
              <img src={preview.dataUrl} alt={preview.key} />
            ) : (
              <p className="empty">No preview for this object.</p>
            )}
          </section>
        )}
      </div>

      <p className={`status ${error ? "err" : ""}`}>{error || status}</p>
    </div>
  );
}
