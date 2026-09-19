export default function NavIcon({ id }) {
  if (id === "tags") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.6 13.4 12.7 5.5A2 2 0 0 0 11.3 5H5a2 2 0 0 0-2 2v6.3a2 2 0 0 0 .6 1.4l7.9 7.9a2 2 0 0 0 2.8 0l6.3-6.3a2 2 0 0 0 0-2.8Z" />
        <circle cx="7.5" cy="8.5" r="1.2" />
      </svg>
    );
  }
  if (id === "encrypt") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    );
  }
  if (id === "cors") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <ellipse cx="12" cy="12" rx="4" ry="9" />
      </svg>
    );
  }
  if (id === "block") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M7 7l10 10" />
      </svg>
    );
  }
  if (id === "storage") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="18" height="5" rx="1" />
        <rect x="3" y="10" width="18" height="5" rx="1" />
        <rect x="3" y="16" width="18" height="5" rx="1" />
      </svg>
    );
  }
  if (id === "backup") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 12a8 8 0 0 1 13.7-5.6" />
        <polyline points="17 4 18 7 15 7" />
        <path d="M20 12a8 8 0 0 1-13.7 5.6" />
        <polyline points="7 20 6 17 9 17" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 8h16l-1.2 11.2a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8L4 8Z" />
      <path d="M8 8V6.5A4 4 0 0 1 12 2.5 4 4 0 0 1 16 6.5V8" />
    </svg>
  );
}
