import { useRef, useState } from 'react';
import { exportPng, exportComparisonPng } from '../../utils/exportPng.js';
import { downloadColorway, deserializeColorway } from '../../utils/exportJson.js';
import styles from './ExportPanel.module.css';

export default function ExportPanel({ state, actions, keyboardRef, comparisonRefB }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
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
      const text = await file.text();
      const data = deserializeColorway(text);
      actions.importColorway(data);
    } catch (err) {
      setError(err?.message || 'Import failed.');
    }
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Export</h3>
      <button
        type="button"
        className={styles.exportBtn}
        onClick={handleExportPng}
        disabled={busy}
      >
        {busy ? 'Exporting…' : comparing ? 'Export PNG (A vs B)' : 'Export PNG'}
      </button>
      <div className={styles.row}>
        <button type="button" className={styles.exportBtn} onClick={handleExportJson}>
          Export JSON
        </button>
        <button type="button" className={styles.exportBtn} onClick={handleImportClick}>
          Import JSON
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}
