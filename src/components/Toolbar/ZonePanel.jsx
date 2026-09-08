import { ZONES } from '../../data/zones.js';
import layouts from '../../data/layouts/index.js';
import { DEFAULT_KEY_COLOR } from '../../hooks/useColorway.js';
import styles from './Toolbar.module.css';

const zoneEntries = [['all', { label: 'All keys' }], ...Object.entries(ZONES)];

export default function ZonePanel({ state, onSelectZone }) {
  const layoutKeys = layouts[state.layout] ?? [];

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Select key group</h3>
      <div className={styles.buttonGroup}>
        {zoneEntries.map(([key, { label }]) => {
          // Per-zone color summary (V3 §7): one swatch if every key in the zone
          // shares a color, the V2 mixed-stripe pattern otherwise. Zones absent
          // from the current layout (e.g. numpad on TKL) are disabled.
          const ids = layoutKeys.filter((k) => key === 'all' || k.zone === key).map((k) => k.id);
          const present = ids.length > 0;
          if (!present) return null;
          const colors = ids.map((id) => state.keyColors[id] ?? DEFAULT_KEY_COLOR);
          const allSame = present && colors.every((c) => c === colors[0]);
          const mixed = present && !allSame;

          // Highlight when this zone's keys are exactly the active selection,
          // so the selection language matches the canvas frame ring.
          const isSelected =
            present &&
            ids.length === state.selectedKeys.length &&
            ids.every((id) => state.selectedKeys.includes(id));

          return (
            <button
              key={key}
              type="button"
              className={`${styles.zonePill} ${isSelected ? styles.zonePillActive : ''}`}
              onClick={() => onSelectZone(key)}
              disabled={!present}
              aria-pressed={isSelected}
              title={key === 'alpha' ? 'Letters, punctuation, and space' : undefined}
            >
              <span
                className={`${styles.zoneDot} ${mixed ? styles.zoneDotMixed : ''}`}
                style={allSame ? { background: colors[0] } : undefined}
                aria-hidden="true"
              />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
