import layouts from '../../data/layouts/index.js';
import { DEFAULT_KEY_COLOR } from '../../hooks/useColorway.js';
import styles from './Toolbar.module.css';

// Every color on the board, most-used first. Clicking one selects all keys in
// that color so the picker recolors them together; Shift adds to the selection.
export default function DesignPalette({ state, onSelectColor }) {
  const counts = new Map();
  for (const k of layouts[state.layout] ?? []) {
    const color = state.keyColors[k.id] ?? DEFAULT_KEY_COLOR;
    counts.set(color, (counts.get(color) ?? 0) + 1);
  }
  const colors = [...counts].sort((a, b) => b[1] - a[1]);
  const selected = new Set(state.selectedKeys);
  const isGroupSelected = (color) => state.selectedKeys.length > 0 && (layouts[state.layout] ?? [])
    .every((k) => selected.has(k.id) === ((state.keyColors[k.id] ?? DEFAULT_KEY_COLOR) === color));

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>In this design</h3>
      <div className={styles.paletteStrip}>
        {colors.map(([color, count]) => (
          <button
            key={color}
            type="button"
            className={`${styles.paletteSwatch} ${isGroupSelected(color) ? styles.paletteSwatchActive : ''}`}
            style={{ background: color }}
            aria-pressed={isGroupSelected(color)}
            aria-label={`Select ${count} ${count === 1 ? 'key' : 'keys'} in ${color}`}
            title={`${color} · ${count} ${count === 1 ? 'key' : 'keys'}\nClick to select · Shift-click to add`}
            onClick={(event) => onSelectColor(color, event.shiftKey)}
          />
        ))}
      </div>
    </div>
  );
}
