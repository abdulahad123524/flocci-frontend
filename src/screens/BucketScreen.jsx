import BucketRow from "../components/BucketRow";
import ObjectPreview from "../components/ObjectPreview";
import ObjectRow from "../components/ObjectRow";
import PanelHeader from "../components/PanelHeader";
import { formatBytes } from "../utils/file";

export default function BucketScreen({ state, actions }) {
  const {
    inputRef,
    buckets,
    activeId,
    active,
    createName,
    createRegion,
    editName,
    editRegion,
    editNote,
    file,
    uploadBusy,
    drag,
    preview,
    copySource,
    copyTarget,
    versionBusy,
  } = state;
  const {
    createBucket,
    setCreateName,
    setCreateRegion,
    setCopySource,
    setCopyTarget,
    copyBucket,
    openBucket,
    deleteBucket,
    updateBucket,
    setEditName,
    setEditRegion,
    setEditNote,
    setVersioning,
    onFiles,
    setDrag,
    addFile,
    openObject,
    downloadFile,
    deleteObject,
  } = actions;

  return (
    <div className="yard">
      <section className="panel bays">
        <PanelHeader title="NEW BAY" count="create bucket" />
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

        <PanelHeader title="COPY BAY" count="copy objects" />
        {buckets.length < 2 ? (
          <p className="empty">Need two bays to copy cargo.</p>
        ) : (
          <form className="form" onSubmit={copyBucket}>
            <label>
              Source bucket
              <select
                value={copySource}
                onChange={(e) => {
                  setCopySource(e.target.value);
                  if (copyTarget === e.target.value) setCopyTarget("");
                }}
              >
                <option value="">select source</option>
                {buckets.map((bucket) => (
                  <option key={bucket.id} value={bucket.name}>
                    {bucket.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Target bucket
              <select
                value={copyTarget}
                onChange={(e) => setCopyTarget(e.target.value)}
              >
                <option value="">select target</option>
                {buckets
                  .filter((bucket) => bucket.name !== copySource)
                  .map((bucket) => (
                    <option key={bucket.id} value={bucket.name}>
                      {bucket.name}
                    </option>
                  ))}
              </select>
            </label>
            <button
              className="primary"
              type="submit"
              disabled={!copySource || !copyTarget}
            >
              Copy bay
            </button>
          </form>
        )}

        <PanelHeader title="BAYS" count={buckets.length} />
        {buckets.length === 0 ? (
          <p className="empty">No bays yet. Stamp one to start.</p>
        ) : (
          buckets.map((bucket) => (
            <BucketRow
              key={bucket.id}
              bucket={bucket}
              active={activeId === bucket.id}
              onOpen={() => openBucket(bucket)}
              onDelete={() => deleteBucket(bucket.name)}
            />
          ))
        )}
      </section>

      <section className="panel dock">
        <PanelHeader
          title="UPDATE BAY"
          count={active ? "selected" : "pick a bay"}
        />
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

        {active && (
          <>
            <PanelHeader title="VERSIONING" count="GET /bucket-versioning" />
            <dl className="version-data">
              <div>
                <dt>Bucket</dt>
                <dd>{active.name}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{active.versioning || "loading..."}</dd>
              </div>
              <div>
                <dt>MFA delete</dt>
                <dd>{active.mfaDelete || "-"}</dd>
              </div>
            </dl>
            <div className="version-box">
              <p>
                Keep prior object revisions when a file in {active.name} is
                replaced.
              </p>
              <button
                type="button"
                className={`toggle ${active.versioning === "Enabled" ? "on" : ""}`}
                disabled={versionBusy || !active.versioning}
                onClick={() =>
                  setVersioning(
                    active.versioning === "Enabled" ? "Suspended" : "Enabled",
                  )
                }
              >
                <i />
                {active.versioning === "Enabled" ? "Enabled" : "Off"}
              </button>
            </div>
          </>
        )}

        <PanelHeader title="ADD FILE" count={active ? active.name : "no bay"} />
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
            disabled={!active || !file || uploadBusy}
            aria-busy={uploadBusy}
            onClick={addFile}
          >
            {uploadBusy ? (
              <>
                <span className="button-spinner" aria-hidden="true" />
                Uploading...
              </>
            ) : (
              "Stow in bay"
            )}
          </button>
        </div>
      </section>

      <section className="panel manifest">
        <PanelHeader
          title="CARGO"
          count={active ? `${active.files.length} in ${active.name}` : "0 objects"}
        />
        {!active ? (
          <p className="empty">Pick a bay to see its files.</p>
        ) : active.files.length === 0 ? (
          <p className="empty">This bay is empty.</p>
        ) : (
          active.files.map((obj) => (
            <ObjectRow
              key={obj.key}
              object={{ ...obj, sizeLabel: formatBytes(obj.size) }}
              selected={preview?.key === obj.key}
              onOpen={() => openObject(obj, active.name)}
              onDownload={() => downloadFile(active.name, obj.key)}
              onDelete={() => deleteObject(active.name, obj.key)}
            />
          ))
        )}
      </section>

      <ObjectPreview object={preview} />
    </div>
  );
}
