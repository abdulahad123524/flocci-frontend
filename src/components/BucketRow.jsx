export default function BucketRow({ bucket, active, onOpen, onDelete }) {
  return (
    <div className={`bay-row ${active ? "selected" : ""}`}>
      <button type="button" className="row" onClick={onOpen}>
        <span className="stub" />
        <span className="key">
          {bucket.name}
          {bucket.versioning ? (
            <span className={`ver-tag ${bucket.versioning === "Enabled" ? "on" : ""}`}>
              {bucket.versioning}
            </span>
          ) : null}
        </span>
        <span className="meta">{bucket.files.length} files</span>
      </button>
      <button type="button" className="delete-button" onClick={onDelete}>
        Delete
      </button>
    </div>
  );
}
