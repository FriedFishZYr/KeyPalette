import { contrastText } from '../../utils/colorUtils.js';
import styles from './Keyboard.module.css';

const GAP = 4;

export default function KeyCap({ keyData, unit, color, selected, onClick }) {
  // Legend color follows the keycap (V3 §6 "auto"): white on dark caps, black
  // on light caps, so it stays readable on any color — fixes invisible legends
  // on black/dark keycaps.
  const labelColor = contrastText(color);

  const x = keyData.x * unit + GAP / 2;
  const y = keyData.y * unit + GAP / 2;
  const w = keyData.w * unit - GAP;
  const h = keyData.h * unit - GAP;

  const handleClick = (e) => {
    // Stop the click reaching the canvas background handler, which clears the
    // selection (V3 §4) — without this, selecting a key would instantly
    // deselect it.
    e.stopPropagation();
    onClick(keyData.id, e.shiftKey);
  };

  return (
    <g className={styles.keycap} onClick={handleClick}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        ry={6}
        fill={color}
        filter={selected ? 'url(#key-lift)' : 'url(#key-depth)'}
        className={styles.keyRect}
      />
      {/* Hover affordance (V3 §3): a faint accent ring, only when not selected
          so it stays visually distinct from the solid selection ring. */}
      {!selected && (
        <rect
          x={x - 1}
          y={y - 1}
          width={w + 2}
          height={h + 2}
          rx={7}
          ry={7}
          className={styles.hoverRing}
        />
      )}
      {/* Selection frame (V3 §3): a bg-colored halo just outside a 2px accent
          ring, so the selection reads over any keycap color and either theme.
          Feedback lives entirely in the frame — the fill is never altered. */}
      {selected && (
        <>
          <rect
            x={x - 2.5}
            y={y - 2.5}
            width={w + 5}
            height={h + 5}
            rx={8.5}
            ry={8.5}
            data-selection-ring
            className={styles.selectionHalo}
          />
          <rect
            x={x - 1}
            y={y - 1}
            width={w + 2}
            height={h + 2}
            rx={7}
            ry={7}
            data-selection-ring
            className={styles.selectionRing}
          />
        </>
      )}
      <text
        x={x + 6}
        y={y + h - 8}
        className={styles.keyLabel}
        fill={labelColor}
        fontSize={w < 40 ? 9 : 11}
      >
        {keyData.label}
      </text>
    </g>
  );
}
