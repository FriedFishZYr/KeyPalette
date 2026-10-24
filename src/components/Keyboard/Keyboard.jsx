import { useCallback, useMemo, useRef, useState } from 'react';
import layouts from '../../data/layouts/index.js';
import { PROFILES } from '../../data/profiles.js';
import { DEFAULT_KEY_COLOR } from '../../utils/designStore.js';
import KeyCap from './KeyCap.jsx';
import Case, { CaseFilter } from './Case.jsx';
import styles from './Keyboard.module.css';

const UNIT = 54;
const CASE_PADDING = 8;

const overlapsRow = (a, b) => a.y < b.y + b.h && b.y < a.y + a.h;

// Arrow-key navigation: left/right pick the nearest key in the same row,
// up/down the nearest key in the closest row in that direction.
function nextKeyId(keys, currentId, direction) {
  const cur = keys.find((k) => k.id === currentId);
  if (!cur) return keys[0]?.id ?? null;
  const cx = cur.x + cur.w / 2;
  const cy = cur.y + cur.h / 2;
  let best = null;
  let bestScore = Infinity;
  for (const k of keys) {
    if (k.id === cur.id) continue;
    const kx = k.x + k.w / 2;
    const ky = k.y + k.h / 2;
    let score;
    if (direction === 'left' || direction === 'right') {
      if (!overlapsRow(cur, k)) continue;
      const dx = direction === 'left' ? cx - kx : kx - cx;
      if (dx <= 0) continue;
      score = dx + Math.abs(ky - cy);
    } else {
      const dy = direction === 'up' ? cy - ky : ky - cy;
      if (dy <= 0.25) continue;
      score = dy * 10 + Math.abs(kx - cx);
    }
    if (score < bestScore) {
      bestScore = score;
      best = k;
    }
  }
  return best?.id ?? currentId;
}

function rowEdgeKeyId(keys, currentId, edge) {
  const cur = keys.find((k) => k.id === currentId);
  if (!cur) return keys[0]?.id ?? null;
  const row = keys.filter((k) => overlapsRow(cur, k));
  row.sort((a, b) => a.x - b.x);
  return (edge === 'first' ? row[0] : row[row.length - 1])?.id ?? currentId;
}

export default function Keyboard({
  state,
  actions,
  svgRef,
  availableWidth = 0,
  availableHeight = 0,
  data = null,
  readOnly = false,
  boardId,
  minScale = 0,
}) {
  // `data` lets this render an arbitrary colorway snapshot (comparison board
  // B) instead of the live state. readOnly disables selection/clicks/badge.
  const board = data ?? state;
  const keys = layouts[board.layout] ?? [];
  const liveSelection = state.selectedKeys;
  const selectedKeys = readOnly ? [] : liveSelection;
  const selectedSet = useMemo(() => new Set(readOnly ? [] : liveSelection), [readOnly, liveSelection]);

  const maxX = Math.max(0, ...keys.map((k) => k.x + k.w));
  const maxY = Math.max(0, ...keys.map((k) => k.y + k.h));
  const lastRow = Math.max(0, ...keys.map((k) => k.y));
  const boardW = maxX * UNIT;
  const boardH = maxY * UNIT;

  const svgW = boardW + CASE_PADDING * 2;
  const svgH = boardH + CASE_PADDING * 2;
  const filterId = `case-shadow-${boardId}`;
  const dishId = `key-dish-${boardId}`;

  // Active keycap profile. The dish gradient is declared once below using
  // this profile's strength, then mapped to each key's top surface.
  const profile = PROFILES[board.profile] ?? PROFILES.flat;

  // Scale-to-fit: shrink the board to fit the canvas region on either axis,
  // capped at 1 (never enlarge beyond native). `minScale` keeps keys tappable
  // on narrow screens, where the canvas scrolls instead. Falls back to 1 until
  // the ResizeObserver in App has reported the region size.
  const fitScale =
    availableWidth > 0 && availableHeight > 0
      ? Math.max(minScale, Math.min(1, availableWidth / svgW, availableHeight / svgH))
      : 1;

  // Roving tabindex: the board is one tab stop; arrow keys move between keys.
  const [focusId, setFocusId] = useState(null);
  const focusTarget = keys.some((k) => k.id === focusId) ? focusId : keys[0]?.id;
  const keyRefs = useRef(new Map());
  const registerRef = useCallback((id, el) => {
    if (el) keyRefs.current.set(id, el);
    else keyRefs.current.delete(id);
  }, []);
  const onFocusKey = useCallback((id) => setFocusId(id), []);
  const onKeyClick = useCallback(
    (id, { additive, sameColor }) => {
      if (sameColor) actions.selectSameColor(id, additive);
      else actions.toggleKeySelected(id, additive);
    },
    [actions],
  );
  const onBoardKeyDown = (event) => {
    const direction = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[event.key];
    // Start from whichever key actually holds focus (robust to programmatic
    // focus), falling back to the roving target.
    let current = focusTarget;
    for (const [id, el] of keyRefs.current) {
      if (el === document.activeElement) { current = id; break; }
    }
    let target = null;
    if (direction) target = nextKeyId(keys, current, direction);
    else if (event.key === 'Home' || event.key === 'End') target = rowEdgeKeyId(keys, current, event.key === 'Home' ? 'first' : 'last');
    if (!target) return;
    event.preventDefault();
    setFocusId(target);
    keyRefs.current.get(target)?.focus();
  };

  // Hex badge: only when exactly one key is selected (never on a read-only
  // comparison board). Positioned as a percentage of the wrapper so it tracks
  // the key even when the SVG scales down.
  const selectedKey = selectedKeys.length === 1 ? keys.find((k) => k.id === selectedKeys[0]) : null;
  const badgeHex = selectedKey ? board.keyColors[selectedKey.id] ?? DEFAULT_KEY_COLOR : null;
  const badgeLeft = selectedKey ? (((selectedKey.x + selectedKey.w / 2) * UNIT + CASE_PADDING) / svgW) * 100 : 0;
  const badgeTop = selectedKey ? (((selectedKey.y + selectedKey.h) * UNIT + CASE_PADDING) / svgH) * 100 : 0;
  const [copied, setCopied] = useState(false);
  const copyBadge = (event) => {
    event.stopPropagation();
    navigator.clipboard?.writeText(badgeHex)?.then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }).catch(() => {});
  };

  return (
    <div className={styles.boardWrap} ref={svgRef} data-board={boardId}>
      <svg
        className={styles.keyboard}
        width={svgW * fitScale}
        height={svgH * fitScale}
        viewBox={`${-CASE_PADDING} ${-CASE_PADDING} ${svgW} ${svgH}`}
        role={readOnly ? 'img' : 'group'}
        aria-label={readOnly ? `${board.name || 'Reference'} keyboard preview` : 'Keyboard. Tab to a key, then use the arrow keys to move between keys.'}
        onKeyDown={readOnly ? undefined : onBoardKeyDown}
      >
        <defs>
          <CaseFilter id={filterId} caseFinish={board.caseFinish} />
          {/* Dish overlay: a color-independent light→neutral→dark gradient
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
        </defs>
        <Case
          width={boardW}
          height={boardH}
          caseColor={board.caseColor}
          caseFinish={board.caseFinish}
          filterId={filterId}
          boardId={boardId}
          plate={!profile.flat}
        />
        {keys.map((k) => (
          <KeyCap
            key={k.id}
            keyData={k}
            unit={UNIT}
            color={board.keyColors[k.id] ?? DEFAULT_KEY_COLOR}
            selected={selectedSet.has(k.id)}
            onClick={readOnly ? undefined : onKeyClick}
            onFocusKey={readOnly ? undefined : onFocusKey}
            registerRef={readOnly ? undefined : registerRef}
            tabIndex={k.id === focusTarget ? 0 : -1}
            interactive={!readOnly}
            profile={profile}
            rowFromBottom={lastRow - k.y}
            dishId={dishId}
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
          onClick={copyBadge}
          title="Click to copy"
        >
          {copied ? 'Copied' : badgeHex}
        </button>
      )}
    </div>
  );
}
