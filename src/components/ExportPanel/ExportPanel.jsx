import { useRef, useState } from 'react';
import Dialog from '../Dialog.jsx';
import { exportPng, exportComparisonPng } from '../../utils/exportPng.js';
import { downloadColorway, deserializeColorway } from '../../utils/exportJson.js';
import styles from './ExportPanel.module.css';

export default function ExportPanel({ state, actions, keyboardRef, comparisonRefB }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef(null);

  // In comparison mode with a B board set, export both boards (V3 §11).
  const comparing = state.comparison?.active && state.comparison?.board;

  const handleExportPng = async () => {
    setError('');
    setBusy(true);
    try {
      if (comparing) {
        await exportComparisonPng(keyboardRef.current, comparisonRefB?.current, state);
      } else {
        await exportPng(keyboardRef.current, state);
      }
    } catch (e) {
      console.error('PNG export failed:', e);
      setError(`PNG export failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  const handleExportJson = () => {
    setError('');
    try {
      downloadColorway(state);
    } catch (e) {
      setError(`JSON export failed: ${e?.message || e}`);
    }
  };

  const handleImportClick = () => {
    setError('');
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    // Reset so selecting the same file again still fires onChange.
    e.target.value = '';
    if (!file) return;
    setError('');
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error('This file is too large. Choose a design file under 2 MB.');
      const text = await file.text();
      const data = deserializeColorway(text);
      actions.importColorway(data);
      setOpen(false);
    } catch (err) {
      setError(err?.message || 'Import failed.');
    }
  };

  return (
    <>
      <button type="button" className={styles.download} onClick={() => setOpen(true)}>Download</button>
      {open && <Dialog title="Download design" onClose={() => setOpen(false)}>
        <div className={styles.section}>
          <p className={styles.hint}>Save an image to share, or an editable design to reopen later.</p>
          <button type="button" className={styles.exportBtn} onClick={handleExportPng} disabled={busy}>
            {busy ? 'Preparing image…' : comparing ? 'Download comparison image · PNG' : 'Download image · PNG'}
          </button>
          <button type="button" className={styles.exportBtn} onClick={handleExportJson}>Download editable design · JSON</button>
          <hr className={styles.divider} />
          <button type="button" className={styles.exportBtn} onClick={handleImportClick}>Open a design file…</button>
          <p className={styles.hint}>Opening a file replaces this design. Undo restores the previous version.</p>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} style={{ display: 'none' }} />
          {error && <p className={styles.error} role="alert">{error}</p>}
        </div>
      </Dialog>}
    </>
  );
}
