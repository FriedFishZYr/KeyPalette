import { useEffect, useId, useRef } from 'react';
import styles from './Dialog.module.css';

// Native <dialog> wrapper: modal, focus returns to the opener on close, and
// Escape / backdrop click both close it. Escape is handled explicitly as well
// as via `cancel` so it works even where the browser skips the cancel event.
export default function Dialog({ title, onClose, children, wide = false }) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
      if (opener && typeof opener.focus === 'function') opener.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${wide ? styles.wide : ''}`}
      aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); }
      }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className={styles.content}>
        <header className={styles.header}>
          <h2 id={titleId}>{title}</h2>
          <button type="button" onClick={onClose} aria-label={`Close ${title}`}>×</button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
