import { useEffect, useRef } from 'react';
import styles from './Dialog.module.css';

export default function Dialog({ title, onClose, children }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement;
    dialog.showModal();
    return () => { dialog.close(); trigger?.focus(); };
  }, []);
  return (
    <dialog ref={ref} className={styles.dialog} aria-label={title}
      onCancel={(event) => { event.preventDefault(); closeRef.current(); }}
      onClick={(event) => { if (event.target === event.currentTarget) closeRef.current(); }}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label={`Close ${title}`}>×</button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
