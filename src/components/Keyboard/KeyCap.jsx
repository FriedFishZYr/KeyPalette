import { contrastText, shadeTowardContrast } from '../../utils/colorUtils.js';
import styles from './Keyboard.module.css';

const GAP = 4;

export default function KeyCap({
  keyData,
  unit,
  color,
  selected,
  onClick,
  profile,
  legendColor = 'auto',
  legendPosition = 'top',
}) {
  const x = keyData.x * unit + GAP / 2;
  const y = keyData.y * unit + GAP / 2;
  const w = keyData.w * unit - GAP;
  const h = keyData.h * unit - GAP;

  // Profile shading (V3 §5): non-flat profiles render a layered cap — a shaded
  // sidewall (full footprint) with a smaller top surface inset from it, more
  // sidewall at the front (`frontExtra`) for a slight downward viewing angle.
  // Flat (the default) short-circuits to a single rounded rect (clean 2D).
  const isFlat = !!profile.flat;
  const inset = isFlat ? 0 : profile.inset;
  const frontExtra = isFlat ? 0 : profile.frontExtra;
  const topX = x + inset;
  const topY = y + inset;
  const topW = w - inset * 2;
  const topH = h - inset * 2 - frontExtra;
  const sidewallColor = isFlat ? color : shadeTowardContrast(color, profile.wallDarken);

  // Legend color (V3 §6): "auto" picks per-key contrast (white on dark caps,
  // black on light), otherwise a fixed hex for every legend.
  const labelColor = legendColor === 'auto' ? contrastText(color) : legendColor;

  // Legend placement. Flat keeps V2 parity (bottom-left, left-aligned). The 3D
  // profiles use the V3 treatment: centered on the top surface, or on the
  // front sidewall band (smaller font) when legendPosition is "front".
  const baseFont = w < 40 ? 9 : 11;
  const onFront = !isFlat && legendPosition === 'front';
  let labelX;
  let labelY;
  let labelAnchor;
  let labelBaseline;
  let labelFont;
  if (isFlat) {
    labelX = x + 6;
    labelY = y + h - 8;
    labelAnchor = 'start';
    labelBaseline = 'auto';
    labelFont = baseFont;
  } else if (onFront) {
    labelX = x + w / 2;
    labelY = y + h - (inset + frontExtra) / 2;
    labelAnchor = 'middle';
    labelBaseline = 'central';
    labelFont = Math.max(6, baseFont - 3);
  } else {
    labelX = topX + topW / 2;
    labelY = topY + topH / 2;
    labelAnchor = 'middle';
    labelBaseline = 'central';
    labelFont = baseFont;
  }

  const handleClick = (e) => {
    // Stop the click reaching the canvas background handler, which clears the
    // selection (V3 §4) — without this, selecting a key would instantly
    // deselect it.
    e.stopPropagation();
    onClick(keyData.id, e.shiftKey);
  };

  return (
    <g className={styles.keycap} onClick={handleClick}>
      {isFlat ? (
        /* Flat (default): a single rounded rect in the true color, V2 border,
           lift shadow when selected. */
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={6}
          ry={6}
          fill={color}
          filter={selected ? 'url(#key-lift)' : undefined}
          className={styles.keyRect}
        />
      ) : (
        <>
          {/* Sidewall — full footprint, shaded for depth; keeps the V2 key
              border and the lift shadow when selected. */}
          <rect
            x={x}
            y={y}
            width={w}
            height={h}
            rx={6}
            ry={6}
            fill={sidewallColor}
            filter={selected ? 'url(#key-lift)' : undefined}
            className={styles.keyRect}
          />
          {/* Top surface — the key's true color. */}
          <rect x={topX} y={topY} width={topW} height={topH} rx={4} ry={4} fill={color} />
          {/* Dish overlay — a color-independent light→dark gradient declared
              once in Keyboard's <defs>, mapped to each top surface's bbox. */}
          <rect
            x={topX}
            y={topY}
            width={topW}
            height={topH}
            rx={4}
            ry={4}
            fill="url(#key-dish)"
            pointerEvents="none"
          />
          {/* Top-edge highlight on the top surface. */}
          <line
            x1={topX + 4}
            y1={topY + 0.5}
            x2={topX + topW - 4}
            y2={topY + 0.5}
            className={styles.topEdge}
          />
        </>
      )}
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
          The ring wraps the outer sidewall rect, so it's unaffected by the
          inset top surface. */}
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
        x={labelX}
        y={labelY}
        className={styles.keyLabel}
        fill={labelColor}
        fontSize={labelFont}
        textAnchor={labelAnchor}
        dominantBaseline={labelBaseline}
      >
        {keyData.label}
      </text>
    </g>
  );
}
