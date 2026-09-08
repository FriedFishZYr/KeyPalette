import layouts from '../../data/layouts/index.js';
import { PROFILES } from '../../data/profiles.js';
import KeyCap from './KeyCap.jsx';
import Case, { CaseFilter } from './Case.jsx';
import styles from './Keyboard.module.css';

const UNIT = 54;
const CASE_PADDING = 8;

export default function Keyboard({
  state,
  actions,
  svgRef,
  availableWidth = 0,
  availableHeight = 0,
  data = null,
  readOnly = false,
  boardId,
}) {
  // `data` lets this render an arbitrary colorway snapshot (comparison board B,
  // V3 §9) instead of the live state. readOnly disables selection/clicks/badge.
  const board = data ?? state;
  const keys = layouts[board.layout] ?? [];
  const selectedKeys = readOnly ? [] : state.selectedKeys;

  const maxX = Math.max(...keys.map((k) => k.x + k.w));
  const maxY = Math.max(...keys.map((k) => k.y + k.h));
  const boardW = maxX * UNIT;
  const boardH = maxY * UNIT;

  const svgW = boardW + CASE_PADDING * 2;
  const svgH = boardH + CASE_PADDING * 2;
  const filterId = `case-shadow-${boardId}`;
  const dishId = `key-dish-${boardId}`;
  const liftId = `key-lift-${boardId}`;

  // Active keycap profile (V3 §5). The dish gradient is declared once below
  // using this profile's strength, then mapped to each key's top surface.
  const profile = PROFILES[board.profile] ?? PROFILES.flat;

  // Scale-to-fit: shrink the board to fit the canvas region on either axis,
  // capped at 1 (never enlarge beyond native). Falls back to 1 until the
  // ResizeObserver in App has reported the region size.
  const fitScale =
    availableWidth > 0 && availableHeight > 0
      ? Math.min(1, availableWidth / svgW, availableHeight / svgH)
      : 1;

  // Hex badge (V2 §10): only when exactly one key is selected (never on a
  // read-only comparison board). Positioned as a percentage of the wrapper so
  // it tracks the key even when the SVG scales down.
  const selectedKey =
    selectedKeys.length === 1
      ? keys.find((k) => k.id === selectedKeys[0])
      : null;
  const badgeHex = selectedKey ? board.keyColors[selectedKey.id] ?? '#e0e0e0' : null;
  const badgeLeft = selectedKey
    ? (((selectedKey.x + selectedKey.w / 2) * UNIT + CASE_PADDING) / svgW) * 100
    : 0;
  const badgeTop = selectedKey
    ? (((selectedKey.y + selectedKey.h) * UNIT + CASE_PADDING) / svgH) * 100
    : 0;

  return (
    <div
      className={styles.boardWrap}
      ref={svgRef}
      data-board={boardId}

    >
    <svg
      className={styles.keyboard}
      width={svgW * fitScale}
      height={svgH * fitScale}
      viewBox={`${-CASE_PADDING} ${-CASE_PADDING} ${svgW} ${svgH}`}
    >
      <defs>
        <CaseFilter id={filterId} caseFinish={board.caseFinish} />
        {/* Dish overlay (V3 §5): a color-independent light→neutral→dark gradient
            declared once and reused by every key. Cylindrical = vertical
            (lighter top, darker bottom); spherical = radial (lighter center,
            darker edges). Strength comes from the active profile. */}
        {profile.dish === 'cylindrical' && (
          <linearGradient id={dishId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={profile.dishStrength} />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity={profile.dishStrength} />
          </linearGradient>
        )}
        {profile.dish === 'spherical' && (
          <radialGradient id={dishId} cx="50%" cy="42%" r="62%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={profile.dishStrength} />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity={profile.dishStrength} />
          </radialGradient>
        )}
        {/* Lifted shadow for selected keys */}
        <filter id={liftId} x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx={0} dy={3} stdDeviation={4} floodColor="#000" floodOpacity={0.3} />
        </filter>
      </defs>
      <Case
        width={boardW}
        height={boardH}
        caseColor={board.caseColor}
        caseFinish={board.caseFinish}
        filterId={filterId}
      />
      {keys.map((k) => (
        <KeyCap
          key={k.id}
          keyData={k}
          unit={UNIT}
          color={board.keyColors[k.id] ?? '#e0e0e0'}
          selected={selectedKeys.includes(k.id)}
          onClick={readOnly ? undefined : actions.toggleKeySelected}
          interactive={!readOnly}
          profile={profile}
          dishId={dishId}
          liftId={liftId}
          legendColor={board.legendColor}
          legendPosition={board.legendPosition}
        />
      ))}
    </svg>
      {selectedKey && (
        <button
          type="button"
          className={styles.hexBadge}
          data-selection-ring
          style={{ left: `${badgeLeft}%`, top: `${badgeTop}%` }}
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard?.writeText(badgeHex);
          }}
          title="Click to copy"
        >
          {badgeHex}
        </button>
      )}
    </div>
  );
}
