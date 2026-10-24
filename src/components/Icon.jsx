// Inline stroke icons. 16px, currentColor, no dependency.
const PATHS = {
  undo: <><path d="M4 7h6.5a3.5 3.5 0 0 1 0 7H8" /><path d="M6.5 4.5 4 7l2.5 2.5" /></>,
  redo: <><path d="M12 7H5.5a3.5 3.5 0 0 0 0 7H8" /><path d="M9.5 4.5 12 7 9.5 9.5" /></>,
  help: <><circle cx="8" cy="8" r="6" /><path d="M6.4 6.3a1.7 1.7 0 0 1 3.2.7c0 1.1-1.6 1.4-1.6 2.4" /><path d="M8 11.4v.1" /></>,
  sun: <><circle cx="8" cy="8" r="2.8" /><path d="M8 1.8v1.4M8 12.8v1.4M1.8 8h1.4M12.8 8h1.4M3.6 3.6l1 1M11.4 11.4l1 1M3.6 12.4l1-1M11.4 4.6l1-1" /></>,
  moon: <path d="M13 9.6A5.3 5.3 0 0 1 6.4 3 5.3 5.3 0 1 0 13 9.6Z" />,
  more: <><circle cx="3.5" cy="8" r=".6" /><circle cx="8" cy="8" r=".6" /><circle cx="12.5" cy="8" r=".6" /></>,
  zoomIn: <><circle cx="7" cy="7" r="4.5" /><path d="m10.4 10.4 3.1 3.1M7 5v4M5 7h4" /></>,
  zoomOut: <><circle cx="7" cy="7" r="4.5" /><path d="m10.4 10.4 3.1 3.1M5 7h4" /></>,
};

export default function Icon({ name }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
