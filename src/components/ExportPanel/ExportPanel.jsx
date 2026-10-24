import { useRef, useState } from 'react';
import Dialog from '../Dialog.jsx';
import { exportPng, exportComparisonPng, exportSvg } from '../../utils/exportPng.js';
import { downloadColorway, deserializeColorway } from '../../utils/exportJson.js';
import { encodeShare, buildShareUrl } from '../../utils/share.js';
import styles from './ExportPanel.module.css';

const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

export default function ExportPanel({ state, actions, keyboardRef, comparisonRefB }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [transparent, setTransparent] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  // In comparison mode with a B board set, image exports include both boards.
  const comparing = Boolean(state.comparison?.active && state.comparison?.board);

  const run = async (label, task) => {
    setError('');
    setBusy(label);
    try {
      await task();
    } catch (e) {
      console.error(`${label} failed:`, e);
      setError(`${label} failed: ${e?.message || e}`);
    } finally {
      setBusy('');
    }
  };

  const handlePng = () => run('Image export', () => (comparing
    ? exportComparisonPng(keyboardRef.current, comparisonRefB?.current, state, { transparent })
    : exportPng(keyboardRef.current, state, { transparent })));
  const handleSvg = () => run('SVG export', () => exportSvg(keyboardRef.current, state, { transparent }));
  const handleJson = () => run('Design export', () => downloadColorway(state));

  const handleShare = () => run('Share link', async () => {
    const url = buildShareUrl(await encodeShare(state));
    setShareUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  });

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    // Reset so selecting the same file again still fires onChange.
    e.target.value = '';
    if (!file) return;
    await run('Opening the file', async () => {
      if (file.size > MAX_IMPORT_BYTES) throw new Error('This file is too large. Choose a design file under 2 MB.');
      const data = deserializeColorway(await file.text());
      actions.importColorway(data);
      close();
    });
  };

  const close = () => { setOpen(false); setShareUrl(''); setCopied(false); setError(''); };

  return (
    <>
      <button type="button" className={styles.download} onClick={() => setOpen(true)}>Share</button>
      {open && <Dialog title="Share or download" onClose={close}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Share a link</h3>
          <p className={styles.hint}>The whole design is encoded in the link itself, so nothing is uploaded. Anyone who opens it gets an editable copy.</p>
          <button type="button" className={styles.exportBtn} onClick={handleShare} disabled={busy !== ''}>
            {busy === 'Share link' ? 'Creating link…' : copied ? 'Link copied' : 'Copy share link'}
          </button>
          {shareUrl && (
            <input className={styles.shareUrl} readOnly value={shareUrl} aria-label="Share link"
              onFocus={(event) => event.target.select()} />
          )}
          <hr className={styles.divider} />
          <h3 className={styles.sectionTitle}>Download</h3>
          <div className={styles.row}>
            <button type="button" className={styles.exportBtn} onClick={handlePng} disabled={busy !== ''}>
              {busy === 'Image export' ? 'Preparing…' : comparing ? 'Comparison · PNG' : 'Image · PNG'}
            </button>
            <button type="button" className={styles.exportBtn} onClick={handleSvg} disabled={busy !== ''}>
              {busy === 'SVG export' ? 'Preparing…' : 'Image · SVG'}
            </button>
          </div>
          <label className={styles.option}>
            <input type="checkbox" checked={transparent} onChange={(event) => setTransparent(event.target.checked)} />
            Transparent background
          </label>
          <button type="button" className={styles.exportBtn} onClick={handleJson} disabled={busy !== ''}>
            {busy === 'Design export' ? 'Preparing…' : 'Editable design · JSON'}
          </button>
          <hr className={styles.divider} />
          <button type="button" className={styles.exportBtn} onClick={() => { setError(''); fileInputRef.current?.click(); }}>Open a design file…</button>
          <p className={styles.hint}>Opening a file replaces this design. Undo restores the previous version.</p>
          <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleFileChange} style={{ display: 'none' }} />
          {error && <p className={styles.error} role="alert">{error}</p>}
          <p className={styles.srOnly} role="status">{busy ? `${busy} in progress` : ''}</p>
        </div>
      </Dialog>}
    </>
  );
}
