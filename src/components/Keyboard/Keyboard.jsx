import layouts from '../../data/layouts/index.js';
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
}) {
  const keys = layouts[state.layout] ?? [];

  const maxX = Math.max(...keys.map((k) => k.x + k.w));
  const maxY = Math.max(...keys.map((k) => k.y + k.h));
  const boardW = maxX * UNIT;
  const boardH = maxY * UNIT;

  const svgW = boardW + CASE_PADDING * 2;
  const svgH = boardH + CASE_PADDING * 2;
  const filterId = 'case-shadow';

  // Scale-to-fit: shrink the board to fit the canvas region on either axis,
  // capped at 1 (never enlarge beyond native). Falls back to 1 until the
  // ResizeObserver in App has reported the region size.
  const fitScale =
    availableWidth > 0 && availableHeight > 0
      ? Math.min(1, availableWidth / svgW, availableHeight / svgH)
      : 1;

  // Hex badge (V2 §10): only when exactly one key is selected. Positioned as a
  // percentage of the wrapper so it tracks the key even when the responsive
  // SVG scales down. Centered on the key's x-midpoint, 4px below it (CSS gap).
  const selectedKey =
    state.selectedKeys.length === 1
      ? keys.find((k) => k.id === state.selectedKeys[0])
      : null;
  const badgeHex = selectedKey ? state.keyColors[selectedKey.id] ?? '#e0e0e0' : null;
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
      style={{ transform: `scale(${fitScale})` }}
    >
    <svg
      className={styles.keyboard}
      width={svgW}
      height={svgH}
      viewBox={`${-CASE_PADDING} ${-CASE_PADDING} ${svgW} ${svgH}`}
    >
      <defs>
        <CaseFilter id={filterId} caseFinish={state.caseFinish} />
        {/* Subtle inner shadow for keycap depth */}
        <filter id="key-depth" x="-5%" y="-5%" width="110%" height="115%">
          <feComponentTransfer in="SourceAlpha" result="shadow-alpha">
            <feFuncA type="linear" slope="0.15" />
          </feComponentTransfer>
          <feOffset dx={0} dy={1.5} in="shadow-alpha" result="offset" />
          <feGaussianBlur in="offset" stdDeviation={1} result="blur" />
          <feComposite in="blur" in2="SourceGraphic" operator="in" result="inner" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="inner" />
          </feMerge>
        </filter>
        {/* Lifted shadow for selected keys */}
        <filter id="key-lift" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx={0} dy={3} stdDeviation={4} floodColor="#000" floodOpacity={0.3} />
        </filter>
      </defs>
      <Case
        width={boardW}
        height={boardH}
        caseColor={state.caseColor}
        caseFinish={state.caseFinish}
        filterId={filterId}
      />
      {keys.map((k) => (
        <KeyCap
          key={k.id}
          keyData={k}
          unit={UNIT}
          color={state.keyColors[k.id] ?? '#e0e0e0'}
          selected={state.selectedKeys.includes(k.id)}
          onClick={actions.toggleKeySelected}
        />
      ))}
    </svg>
      {selectedKey && (
        <button
          type="button"
          className={styles.hexBadge}
          style={{ left: `${badgeLeft}%`, top: `${badgeTop}%` }}
          onClick={() => navigator.clipboard?.writeText(badgeHex)}
          title="Click to copy"
        >
          {badgeHex}
        </button>
      )}
    </div>
  );
}
