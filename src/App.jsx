import { useRef, useState, useEffect } from 'react';
import useColorway from './hooks/useColorway.js';
import Keyboard from './components/Keyboard/Keyboard.jsx';
import ComparisonView from './components/ComparisonView/ComparisonView.jsx';
import Toolbar from './components/Toolbar/Toolbar.jsx';
import EditorHeader from './components/EditorHeader.jsx';
import ImagePaletteModal from './components/ImagePaletteModal/ImagePaletteModal.jsx';
import styles from './App.module.css';

export default function App() {
  const { state, slots, activeSlot, actions, saveStatus, canUndo, canRedo } = useColorway();
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const keyboardRef = useRef(null);
  const boardRefB = useRef(null);

  // Scale-to-fit: measure the canvas region's content box so Keyboard can
  // shrink the board to fit without clipping (capped at 1x). No new colorway
  // state — this is derived purely from container size + current layout.
  const mainRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setCanvasSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Escape clears the current selection (V3 §4); the hex badge dismisses with
  // it since it only renders for a single-key selection.
  useEffect(() => {
    const onKeyDown = (e) => {
      const target = e.target;
      if (document.querySelector('dialog[open]') || target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      if (e.key === 'Escape') actions.clearSelection();
      if ((e.metaKey || e.ctrlKey) && !e.altKey) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (e.shiftKey) actions.redo(); else actions.undo();
        } else if (e.key.toLowerCase() === 'y' && !e.metaKey) {
          e.preventDefault(); actions.redo();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [actions]);

  return (
    <div className={styles.app} data-workspace={state.workspace}>
      <EditorHeader state={state} slots={slots} activeSlot={activeSlot} actions={actions}
        saveStatus={saveStatus} canUndo={canUndo} canRedo={canRedo}
        keyboardRef={keyboardRef} comparisonRefB={boardRefB} />
      <div className={styles.workspace}>
      <Toolbar
        state={state}
        actions={actions}
        slots={slots}
        onExtractFromImage={() => setImageModalOpen(true)}
      />
      <main className={styles.main}>
        <div className={styles.canvas} ref={mainRef} onClick={actions.clearSelection}>
        {state.comparison.active ? (
          <ComparisonView
            state={state}
            actions={actions}
            keyboardRef={keyboardRef}
            boardRefB={boardRefB}
            availableWidth={canvasSize.width}
            availableHeight={canvasSize.height}
          />
        ) : (
          <Keyboard
            state={state}
            actions={actions}
            svgRef={keyboardRef}
            boardId="a"
            availableWidth={canvasSize.width}
            availableHeight={canvasSize.height}
          />
        )}
        </div>
        <div className={styles.canvasHint}>
          {state.comparison.active ? 'Current design is editable · Reference is a snapshot' : 'Click a key or choose a group · Shift-click to select more · Esc to clear'}
        </div>
      </main>
      </div>
      {imageModalOpen && (
        <ImagePaletteModal
          onSelectColor={(hex) => {
            actions.setActiveColor(hex);
            actions.addColorsToHistory([hex]);
            setImageModalOpen(false);
          }}
          onApplyAll={(hexes) => {
            actions.addColorsToHistory(hexes);
            setImageModalOpen(false);
          }}
          onClose={() => setImageModalOpen(false)}
        />
      )}
    </div>
  );
}
