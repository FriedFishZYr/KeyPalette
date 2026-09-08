import Keyboard from '../Keyboard/Keyboard.jsx';
import styles from './ComparisonView.module.css';

// V3 §9: two boards side by side (same layout). A is the live, editable
// colorway; B is a read-only snapshot. The scale-to-fit shell (§2) keeps both
// visible — we split the measured canvas region between the two boards and let
// each Keyboard scale itself to its share. Narrow regions stack A over B (§11).
const GAP = 24;
const LABEL_H = 26;
const STACK_BELOW = 880;

export default function ComparisonView({
  state,
  actions,
  keyboardRef,
  boardRefB,
  availableWidth = 0,
  availableHeight = 0,
}) {
  const b = state.comparison.board;
  const stacked = availableWidth > 0 && availableWidth < STACK_BELOW;

  const perW = stacked ? availableWidth : Math.max(0, (availableWidth - GAP) / 2);
  const perH = stacked
    ? Math.max(0, (availableHeight - GAP) / 2 - LABEL_H)
    : Math.max(0, availableHeight - LABEL_H);

  return (
    <div className={`${styles.comparison} ${stacked ? styles.stacked : ''}`}>
      <div className={styles.board}>
        <div className={styles.label}>Current · {state.colorwayName || 'Untitled'}</div>
        <Keyboard
          state={state}
          actions={actions}
          svgRef={keyboardRef}
          boardId="a"
          availableWidth={perW}
          availableHeight={perH}
        />
      </div>
      <div className={styles.board}>
        <div className={styles.label}>Reference{b ? ` · ${b.name || 'Untitled'}` : ''}</div>
        {b ? (
          <Keyboard
            state={state}
            data={b}
            readOnly
            svgRef={boardRefB}
            boardId="b"
            availableWidth={perW}
            availableHeight={perH}
          />
        ) : (
          <div className={styles.empty}>
            Choose a reference under “Compare with” in the editor.
          </div>
        )}
      </div>
    </div>
  );
}
