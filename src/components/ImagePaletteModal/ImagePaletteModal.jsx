import { useState, useRef, useEffect } from 'react';
import { extractPalette } from '../../utils/extractPalette.js';
import styles from './ImagePaletteModal.module.css';
import Dialog from '../Dialog.jsx';

export default function ImagePaletteModal({ onSelectColor, onApplyAll, onClose, selectionCount = 0 }) {
  const [thumbUrl, setThumbUrl] = useState(null);
  const [palette, setPalette] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Revoke the thumbnail's object URL when it changes or on unmount.
  useEffect(() => {
    return () => {
      if (thumbUrl) URL.revokeObjectURL(thumbUrl);
    };
  }, [thumbUrl]);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG, JPG, or WEBP).');
      setStatus('error');
      return;
    }
    setThumbUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setStatus('loading');
    setError('');
    setPalette([]);
    try {
      const colors = await extractPalette(file);
      setPalette(colors);
      setStatus('done');
    } catch {
      setError('Could not read that image. Try a different file.');
      setStatus('error');
    }
  };

  const onInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <Dialog title="Add colors from an image" onClose={onClose}>
        <div className={styles.body}>
          <div className={styles.left}>
            <button
              type="button"
              className={styles.dropZone}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
            >
              {thumbUrl ? (
                <img src={thumbUrl} alt="Uploaded preview" className={styles.thumb} />
              ) : (
                <span className={styles.dropHint}>
                  Drop an image here, or click to browse
                </span>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={onInputChange}
              className={styles.fileInput}
            />
          </div>

          <div className={styles.right}>
            {status === 'idle' && (
              <p className={styles.hint}>
                Choose a PNG, JPG, or WebP image. Its main colors appear here.
              </p>
            )}
            {status === 'loading' && <p className={styles.hint} role="status">Reading colors…</p>}
            {status === 'error' && <p className={styles.errorText} role="alert">{error}</p>}
            {status === 'done' && (
              <p className={styles.hint} role="status">
                {selectionCount
                  ? `Click a color to paint the ${selectionCount} selected ${selectionCount === 1 ? 'key' : 'keys'}, or add them all to Recent.`
                  : 'Add these to Recent, then select keys to use them. Clicking one adds just that color.'}
              </p>
            )}
            {status === 'done' && (
              <div className={styles.swatchRow}>
                {palette.map((hex, i) => (
                  <button
                    key={`${hex}-${i}`}
                    type="button"
                    className={styles.swatch}
                    style={{ background: hex }}
                    title={hex}
                    aria-label={selectionCount ? `Paint selected keys ${hex}` : `Add ${hex} to Recent`}
                    onClick={() => onSelectColor(hex)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          {status === 'done' && palette.length > 0 && (
            <button
              type="button"
              className={styles.applyAllBtn}
              onClick={() => onApplyAll(palette)}
            >
              Add all to Recent
            </button>
          )}
        </div>
    </Dialog>
  );
}
