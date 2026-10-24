import { useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb, isValidHex } from '../../utils/colorUtils.js';
import styles from './Toolbar.module.css';

export default function ColorPanel({
  activeColor,
  onPaint,
  onBeginEdit,
  onEndEdit,
  onResetSelected,
  selectionCount = 0,
  colorHistory = [],
  onClearHistory,
}) {
  // Direct apply: every picker change paints the selected keys. A drag or a
  // typing session is wrapped in onBeginEdit/onEndEdit so it is one undo step.
  // Mixed selection (V2 §10): activeColor is null when the selected keys hold
  // differing colors; the picker shows a neutral color until something is
  // picked, which then paints every selected key uniformly.
  const [format, setFormat] = useState('hex');
  const hasSelection = selectionCount > 0;
  const isMixed = activeColor === null;
  // With nothing selected the picker is idle and shows a neutral color rather
  // than whatever was last picked.
  const displayColor = (hasSelection && activeColor) || '#e0e0e0';
  const [hexInput, setHexInput] = useState(displayColor);
  // Reset the draft whenever the picker color changes from outside (a new
  // selection, undo, a preset) — derived during render, no effect needed.
  const [syncedColor, setSyncedColor] = useState(displayColor);
  if (syncedColor !== displayColor) {
    setSyncedColor(displayColor);
    setHexInput(displayColor);
  }
  const rgb = hexToRgb(displayColor);
  const hsl = rgbToHsl(rgb);

  // The last color painted in this edit session, handed to onEndEdit so Recent
  // records it without waiting for the state update to render.
  const lastPainted = useRef(null);
  const paint = (hex) => {
    lastPainted.current = hex;
    onPaint(hex);
  };
  const beginEdit = () => {
    lastPainted.current = null;
    onBeginEdit?.();
  };
  const endEdit = () => onEndEdit?.(lastPainted.current);

  const startDrag = () => {
    beginEdit();
    const end = () => {
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      endEdit();
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  const handleHexInput = (value) => {
    setHexInput(value);
    if (isValidHex(value)) paint(value.toLowerCase());
  };

  const handleRgbChange = (channel, raw) => {
    const v = Math.max(0, Math.min(255, parseInt(raw, 10) || 0));
    paint(rgbToHex({ ...rgb, [channel]: v }));
  };

  const handleHslChange = (channel, raw) => {
    const max = channel === 'h' ? 360 : 100;
    const v = Math.max(0, Math.min(max, parseInt(raw, 10) || 0));
    paint(rgbToHex(hslToRgb({ ...hsl, [channel]: v })));
  };

  const fieldEvents = { onFocus: beginEdit, onBlur: endEdit };

  return (
    <div className={styles.section}>
      <div className={styles.colorHeader}>
        <h3 className={styles.sectionTitle}>Keycap color</h3>
        {hasSelection && (
          <button type="button" className={styles.linkBtn} onClick={onResetSelected}
            title="Set the selected keys back to the default color">Reset to default</button>
        )}
      </div>
      {/* Same line in both states so the picker doesn't jump when a selection starts. */}
      <p className={hasSelection ? styles.liveNote : styles.emptyNote}>
        {hasSelection
          ? `Changes apply to ${selectionCount} ${selectionCount === 1 ? 'key' : 'keys'} as you pick.`
          : 'Select keys or a group to color them.'}
      </p>
      {/* Inert until something is selected: with nothing to paint, a picked
          color would just be replaced by the next selection's color. */}
      <div className={hasSelection ? styles.pickerArea : `${styles.pickerArea} ${styles.pickerIdle}`} inert={!hasSelection}>
        {hasSelection && isMixed ? (
          <>
            <div className={styles.mixedSwatch} aria-hidden="true" />
            <p className={styles.mixedNote}>Multiple colors · pick one to set them all</p>
          </>
        ) : (
          <div className={styles.currentSwatch} style={{ background: displayColor }} />
        )}
        <div onPointerDown={startDrag} aria-label="Keycap color picker">
          <HexColorPicker color={displayColor} onChange={paint} />
        </div>

        <div className={styles.colorInputs} data-format={format}>
          <label className={styles.colorField}>
            <span>Format</span>
            <select aria-label="Color format" className={styles.input} value={format} onChange={(event) => setFormat(event.target.value)}>
              <option value="hex">Hex</option><option value="rgb">RGB</option><option value="hsl">HSL</option>
            </select>
          </label>
          {format === 'hex' && <label className={styles.colorField}>
            <span>Hex</span>
            <input
              type="text"
              value={hexInput}
              onChange={(e) => handleHexInput(e.target.value)}
              maxLength={7}
              aria-invalid={!isValidHex(hexInput)}
              onFocus={beginEdit}
              onBlur={() => { if (!isValidHex(hexInput)) setHexInput(displayColor); endEdit(); }}
              className={styles.input}
            />
          </label>}

          {format === 'rgb' && <div className={styles.colorRow}>
            {['r', 'g', 'b'].map((ch) => (
              <label key={ch} className={styles.colorField}>
                <span>{ch.toUpperCase()}</span>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={rgb[ch]}
                  onChange={(e) => handleRgbChange(ch, e.target.value)}
                  {...fieldEvents}
                  className={styles.input}
                />
              </label>
            ))}
          </div>}

          {format === 'hsl' && <div className={styles.colorRow}>
            {[
              { ch: 'h', max: 360 },
              { ch: 's', max: 100 },
              { ch: 'l', max: 100 },
            ].map(({ ch, max }) => (
              <label key={ch} className={styles.colorField}>
                <span>{ch.toUpperCase()}</span>
                <input
                  type="number"
                  min={0}
                  max={max}
                  value={hsl[ch]}
                  onChange={(e) => handleHslChange(ch, e.target.value)}
                  {...fieldEvents}
                  className={styles.input}
                />
              </label>
            ))}
          </div>}
        </div>
      </div>

      {colorHistory.length > 0 && (
        <div className={styles.history}>
          <div className={styles.historyHeader}>
            <span className={styles.historyLabel}>Recent</span>
            <button
              type="button"
              className={styles.historyClear}
              onClick={onClearHistory}
            >
              Clear
            </button>
          </div>
          <div className={styles.historyStrip}>
            {colorHistory.map((hex) => (
              <button
                key={hex}
                type="button"
                className={styles.historySwatch}
                style={{ background: hex }}
                title={hasSelection ? `Paint selected keys ${hex}` : hex}
                aria-label={`Use color ${hex}`}
                disabled={!hasSelection}
                onClick={() => onPaint(hex)}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
