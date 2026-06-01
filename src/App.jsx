import { useRef, useState, useEffect } from 'react';
import useColorway from './hooks/useColorway.js';
import Keyboard from './components/Keyboard/Keyboard.jsx';
import ComparisonView from './components/ComparisonView/ComparisonView.jsx';
import Toolbar from './components/Toolbar/Toolbar.jsx';
import WorkspaceToggle from './components/WorkspaceToggle.jsx';
import ImagePaletteModal from './components/ImagePaletteModal/ImagePaletteModal.jsx';
import styles from './App.module.css';

export default function App() {
  const { state, slots, actions } = useColorway();
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
      if (e.key === 'Escape') actions.clearSelection();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [actions]);

  return (
    <div className={styles.app} data-workspace={state.workspace}>
      <WorkspaceToggle workspace={state.workspace} onToggle={actions.setWorkspace} />
      <Toolbar
        state={state}
        actions={actions}
        slots={slots}
        keyboardRef={keyboardRef}
        comparisonRefB={boardRefB}
        onExtractFromImage={() => setImageModalOpen(true)}
      />
      <main className={styles.main} ref={mainRef} onClick={actions.clearSelection}>
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
      </main>
      {imageModalOpen && (
        <ImagePaletteModal
          onSelectColor={(hex) => {
            actions.setActiveColor(hex);
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
