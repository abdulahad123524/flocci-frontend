export default function ObjectRow({ object, selected, onOpen, onDownload, onDelete }) {
  return (
    <div className={`bay-row ${selected ? "selected" : ""}`}>
      <button type="button" className={`row ${selected ? "selected" : ""}`} onClick={onOpen}>
        <span className="stub" />
        <span className="key">{object.key}</span>
        <span className="meta">{object.sizeLabel}</span>
      </button>
      <div className="row-actions">
        <button type="button" className="download-button" onClick={onDownload}>
          Download
        </button>
        <button type="button" className="delete-button" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}
