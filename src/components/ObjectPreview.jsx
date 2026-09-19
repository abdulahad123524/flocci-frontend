export default function ObjectPreview({ object }) {
  if (!object) return null;

  return (
    <section className="panel preview">
      <header>
        <h2>{object.key}</h2>
        <span className="count">{object.type}</span>
      </header>
      {object.text ? (
        <pre>{object.text}</pre>
      ) : object.dataUrl ? (
        <img src={object.dataUrl} alt={object.key} />
      ) : (
        <p className="empty">No preview for this object.</p>
      )}
    </section>
  );
}
