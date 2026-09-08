import { memo } from 'react';
import { contrastText, darken, lighten } from '../../utils/colorUtils.js';
import { keyPolygon, roundedPath, keyTopBox, keyBox } from '../../utils/keyShapes.js';
import styles from './Keyboard.module.css';

const GAP = 4;
const R_OUTER = 6;
const R_TOP = 4;

function KeyCap({
  keyData,
  unit,
  color,
  selected,
  onClick,
  onFocusKey,
  registerRef,
  tabIndex,
  profile,
  rowFromBottom = 0,
  dishId,
  liftId,
  legendColor = 'auto',
  legendPosition = 'top',
  interactive = true,
}) {
  const box = keyBox(keyData, unit, GAP);
  const isFlat = !!profile.flat;
  const inset = isFlat ? 0 : profile.inset;
  // Sculpted profiles show more front face the further back the row sits.
  const frontExtra = isFlat ? 0 : Math.round(profile.frontExtra * (1 + (profile.rowSlope ?? 0) * rowFromBottom));

  const outerPath = roundedPath(keyPolygon(keyData, unit, GAP), R_OUTER);
  const topInsets = { top: inset, side: inset, bottom: inset + frontExtra };
  const topPath = isFlat ? outerPath : roundedPath(keyPolygon(keyData, unit, GAP, topInsets), R_TOP);
  const topBox = keyTopBox(keyData, unit, GAP, topInsets);

  // Shading: walls sit in shadow, the front face catches a little more light,
  // and the top is lifted slightly so depth reads even on black caps.
  const wallColor = isFlat ? color : darken(color, profile.wallDarken);
  const frontColor = isFlat ? color : darken(color, profile.frontDarken);
  const topColor = isFlat ? color : lighten(color, profile.topLift);

  // Legend color: "auto" picks per-key contrast (white on dark caps, black on
  // light), otherwise a fixed hex for every legend.
  const labelColor = legendColor === 'auto' ? contrastText(color) : legendColor;

  // Legend placement. Flat keeps the bottom-left placement; shaded profiles
  // center the legend on the top surface, or on the front face when
  // legendPosition is "front".
  const baseFont = box.w < 40 ? 9 : 11;
  const onFront = !isFlat && legendPosition === 'front';
  let label;
  if (isFlat) {
    label = { x: box.x + 6, y: box.y + box.h - 8, anchor: 'start', baseline: 'auto', font: baseFont };
  } else if (onFront) {
    label = {
      x: box.x + box.w / 2, y: box.y + box.h - (inset + frontExtra) / 2 - 0.5,
      anchor: 'middle', baseline: 'central', font: Math.max(6, baseFont - 3),
    };
  } else {
    label = { x: topBox.x + topBox.w / 2, y: topBox.y + topBox.h / 2, anchor: 'middle', baseline: 'central', font: baseFont };
  }

  const handleClick = (e) => {
    // Stop the click reaching the canvas background handler, which clears the
    // selection — without this, selecting a key would instantly deselect it.
    e.stopPropagation();
    onClick?.(keyData.id, { additive: e.shiftKey, sameColor: e.altKey });
  };

  return (
    <g
      className={interactive ? styles.keycap : undefined}
      onClick={interactive ? handleClick : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? tabIndex : undefined}
      aria-label={interactive ? `${keyData.label} key, ${color}` : undefined}
      aria-pressed={interactive ? selected : undefined}
      onFocus={interactive ? () => onFocusKey?.(keyData.id) : undefined}
      ref={interactive ? (el) => registerRef?.(keyData.id, el) : undefined}
      onKeyDown={interactive ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleClick(event);
        }
      } : undefined}
    >
      {!isFlat && (
        /* Soft contact shadow under the cap. */
        <path d={outerPath} className={styles.keyShadow} transform="translate(0 2)" />
      )}
      {/* Sidewall (or the whole flat cap): keeps the key border and the lift
          shadow when selected. */}
      <path
        d={outerPath}
        fill={wallColor}
        filter={selected ? `url(#${liftId})` : undefined}
        className={styles.keyRect}
      />
      {!isFlat && (
        <>
          {/* Front face — the band below the top surface. */}
          <rect
            x={box.x + inset}
            y={box.y + box.h - inset - frontExtra}
            width={box.w - inset * 2}
            height={frontExtra + inset - 1}
            rx={2}
            fill={frontColor}
          />
          {/* Top surface — the key's true color, slightly lifted. */}
          <path d={topPath} fill={topColor} />
          {/* Dish overlay — a color-independent light→dark gradient declared
              once in Keyboard's <defs>, mapped to each top surface's bbox. */}
          <path d={topPath} fill={`url(#${dishId})`} pointerEvents="none" />
          {/* Top-edge highlight. */}
          <line
            x1={topBox.x + 4}
            y1={topBox.y + 0.5}
            x2={topBox.x + topBox.w - 4}
            y2={topBox.y + 0.5}
            className={styles.topEdge}
          />
        </>
      )}
      {/* Hover affordance: a faint accent ring, only when not selected so it
          stays visually distinct from the solid selection ring. */}
      {interactive && !selected && (
        <path d={roundedPath(keyPolygon(keyData, unit, GAP, { top: -1, side: -1, bottom: -1 }), R_OUTER + 1)} data-hover-ring className={styles.hoverRing} />
      )}
      {/* Selection frame: a bg-colored halo just outside a 2px accent ring, so
          the selection reads over any keycap color and either theme. */}
      {selected && (
        <>
          <path d={roundedPath(keyPolygon(keyData, unit, GAP, { top: -2.5, side: -2.5, bottom: -2.5 }), R_OUTER + 2.5)} data-selection-ring className={styles.selectionHalo} />
          <path d={roundedPath(keyPolygon(keyData, unit, GAP, { top: -1, side: -1, bottom: -1 }), R_OUTER + 1)} data-selection-ring className={styles.selectionRing} />
        </>
      )}
      <text
        x={label.x}
        y={label.y}
        className={styles.keyLabel}
        fill={labelColor}
        fontSize={label.font}
        textAnchor={label.anchor}
        dominantBaseline={label.baseline}
      >
        {keyData.label}
      </text>
    </g>
  );
}

export default memo(KeyCap);
