import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { isValidHex } from '../../utils/colorUtils.js';
import styles from './Toolbar.module.css';

// Picker + hex field used by the Case and Lettering tabs, so every color in
// the app is edited the same way. A drag or a typing session becomes one
// undo step via onBeginEdit/onEndEdit.
export default function InlineColorPicker({ color, onChange, onBeginEdit, onEndEdit, label = 'Hex', ariaLabel }) {
  const [draft, setDraft] = useState(color);
  const [synced, setSynced] = useState(color);
  if (synced !== color) {
    setSynced(color);
    setDraft(color);
  }
  const startDrag = () => {
    onBeginEdit?.();
    const end = () => {
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      onEndEdit?.();
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };
  return (
    <div className={styles.inlinePicker}>
      <div onPointerDown={startDrag} aria-label={ariaLabel}>
        <HexColorPicker color={color} onChange={onChange} />
      </div>
      <label className={styles.colorField}>
        <span>{label}</span>
        <input
          type="text"
          className={styles.input}
          value={draft}
          maxLength={7}
          aria-invalid={!isValidHex(draft)}
          onFocus={onBeginEdit}
          onBlur={() => { if (!isValidHex(draft)) setDraft(color); onEndEdit?.(); }}
          onChange={(event) => {
            const value = event.target.value;
            setDraft(value);
            if (isValidHex(value)) onChange(value.toLowerCase());
          }}
        />
      </label>
    </div>
  );
}
