import { useState } from "react";
import BucketRow from "../components/BucketRow";
import ObjectPreview from "../components/ObjectPreview";
import ObjectRow from "../components/ObjectRow";
import PanelHeader from "../components/PanelHeader";
import { formatBytes } from "../utils/file";

export default function BucketScreen({ state, actions }) {
  const [thumbnailError, setThumbnailError] = useState(null);
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
    thumbnailUrl,
    thumbnailLoading,
    thumbnailKey,
    versionsLoading,
    versionsError,
    objectVersions,
    showVersions,
    selectedObject,
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
    setThumbnailLoading,
    setThumbnailKey,
    setThumbnailUrl,
    handleThumbnailPreview,
    handleViewVersions,
    setShowVersions,
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
          count={
            active ? `${active.files.length} in ${active.name}` : "0 objects"
          }
        />
        {!active ? (
          <p className="empty">Pick a bay to see its files.</p>
        ) : active.files.length === 0 ? (
          <p className="empty">This bay is empty.</p>
        ) : (
          active.files.map((obj) => {
            const isImageFile =
              /\.(jpe?g|png|webp)$/i.test(obj.key) &&
              !obj.key.startsWith("thumbnails/");

            return (
              <div className="cargo-item" key={obj.key}>
                <ObjectRow
                  object={{ ...obj, sizeLabel: formatBytes(obj.size) }}
                  selected={preview?.key === obj.key}
                  onOpen={() => openObject(obj, active.name)}
                  onDownload={() => downloadFile(active.name, obj.key)}
                  onDelete={() => deleteObject(active.name, obj.key)}
                />

                <div className="object-version-actions">
                  <button
                    type="button"
                    className="secondary"
                    disabled={versionsLoading}
                    onClick={() => handleViewVersions(active.name, obj.key)}
                  >
                    {versionsLoading
                      ? "Loading versions..."
                      : showVersions &&
                          selectedObject?.bucketName === active.name &&
                          selectedObject?.key === obj.key
                        ? "Hide versions"
                        : "View versions"}
                  </button>
                </div>

                {/* {versionsError?.key === `${active.name}/${obj.key}` && (
                  <p className="status err" role="alert">
                    {versionsError.message}
                  </p>
                )}

                {objectVersions[`${active.name}/${obj.key}`] && (
                  <div className="object-version-history">
                    <h4>Version History</h4>

                    {objectVersions[`${active.name}/${obj.key}`].length ===
                    0 ? (
                      <p className="empty">
                        No versions found for this object.
                      </p>
                    ) : (
                      objectVersions[`${active.name}/${obj.key}`].map(
                        (version) => (
                          <div
                            className="object-version-row"
                            key={version.versionId}
                          >
                            <div>
                              <strong>
                                {version.isLatest
                                  ? "Latest version"
                                  : "Previous version"}
                              </strong>
                              <p>
                                Version ID: {version.versionId ?? "Unavailable"}
                              </p>
                              <p>
                                Last modified:{" "}
                                {version.lastModified
                                  ? new Date(
                                      version.lastModified,
                                    ).toLocaleString()
                                  : "Unavailable"}
                              </p>
                            </div>

                            <span
                              className={
                                version.isLatest
                                  ? "version-badge latest"
                                  : "version-badge"
                              }
                            >
                              {version.isLatest ? "Latest" : "Old"}
                            </span>
                          </div>
                        ),
                      )
                    )}
                  </div>
                )} */}
                {showVersions && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold">
                          Object Version History
                        </h2>

                        <button
                          type="button"
                          onClick={() => setShowVersions(false)}
                          className="rounded-md border px-3 py-1.5"
                        >
                          Close
                        </button>
                      </div>

                      {selectedObject && (
                        <p className="mb-4 break-all text-sm text-gray-500">
                          {selectedObject.key}
                        </p>
                      )}

                      {versionsLoading && (
                        <p className="py-6 text-center">Loading versions...</p>
                      )}

                      {!versionsLoading && versionsError && (
                        <p
                          role="alert"
                          className="rounded-md bg-red-50 p-3 text-red-700"
                        >
                          {versionsError}
                        </p>
                      )}

                      {!versionsLoading &&
                        !versionsError &&
                        objectVersions.length === 0 && (
                          <p className="py-6 text-center text-gray-500">
                            No versions found for this object.
                          </p>
                        )}

                      {!versionsLoading && objectVersions.length > 0 && (
                        <div className="max-h-96 space-y-3 overflow-y-auto">
                          {objectVersions.map((version) => (
                            <div
                              key={version.versionId}
                              className="rounded-lg border p-4"
                            >
                              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                <span className="font-medium">Version</span>

                                <span
                                  className={`rounded-full px-2 py-1 text-xs ${
                                    version.isLatest
                                      ? "bg-green-100 text-green-700"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {version.isLatest ? "Latest" : "Previous"}
                                </span>
                              </div>

                              <p className="break-all text-sm">
                                <span className="font-medium">ID: </span>
                                {version.versionId || "N/A"}
                              </p>

                              <p className="mt-2 text-sm text-gray-500">
                                <span className="font-medium">
                                  Last modified:{" "}
                                </span>
                                {version.lastModified
                                  ? new Date(
                                      version.lastModified,
                                    ).toLocaleString()
                                  : "N/A"}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {thumbnailKey === obj.key && thumbnailUrl && (
                  <div className="thumbnail-preview">
                    <img
                      src={thumbnailUrl}
                      alt="Thumbnail preview"
                      style={{
                        maxWidth: 300,
                        maxHeight: 300,
                        objectFit: "contain",
                      }}
                    />
                  </div>
                )}

                {isImageFile && (
                  <>
                    <button
                      type="button"
                      className="secondary"
                      disabled={thumbnailLoading}
                      onClick={async () => {
                        if (thumbnailKey === obj.key && thumbnailUrl) {
                          setThumbnailUrl(null);
                          setThumbnailKey(null);
                          setThumbnailError(null);
                          return;
                        }

                        setThumbnailKey(obj.key);
                        setThumbnailUrl(null);
                        setThumbnailError(null);
                        setThumbnailLoading(true);

                        try {
                          const url = await handleThumbnailPreview(
                            obj,
                            active.name,
                          );
                          setThumbnailUrl(url);
                        } catch (error) {
                          console.error("Thumbnail preview failed:", error);
                          setThumbnailError({
                            key: obj.key,
                            message:
                              error.message || "Thumbnail preview failed",
                          });
                        } finally {
                          setThumbnailLoading(false);
                        }
                      }}
                    >
                      {thumbnailLoading && thumbnailKey === obj.key
                        ? "Loading thumbnail..."
                        : thumbnailKey === obj.key && thumbnailUrl
                          ? "Hide thumbnail"
                          : "Preview thumbnail"}
                    </button>
                    {thumbnailError?.key === obj.key && (
                      <p className="status err" role="alert">
                        {thumbnailError.message}
                      </p>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}
      </section>

      <ObjectPreview object={preview} />
    </div>
  );
}
