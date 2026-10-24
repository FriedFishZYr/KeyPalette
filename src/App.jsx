import { useRef, useState, useEffect, useCallback } from 'react';
import useColorway from './hooks/useColorway.js';
import Keyboard from './components/Keyboard/Keyboard.jsx';
import ComparisonView from './components/ComparisonView/ComparisonView.jsx';
import Toolbar from './components/Toolbar/Toolbar.jsx';
import EditorHeader from './components/EditorHeader.jsx';
import ImagePaletteModal from './components/ImagePaletteModal/ImagePaletteModal.jsx';
import Onboarding from './components/Onboarding.jsx';
import Icon from './components/Icon.jsx';
import useMediaQuery from './hooks/useMediaQuery.js';
import presets from './data/presets.js';
import { downloadStorageBackup } from './utils/designStore.js';
import { decodeShare, readShareToken } from './utils/share.js';

const ONBOARDED_KEY = 'keypalette-onboarded';
const NARROW_QUERY = '(max-width: 768px)';
// Zoomed in on narrow screens, the board keeps this scale so keys are easy to
// tap and the canvas scrolls. Otherwise the whole board fits the width.
const NARROW_ZOOM_SCALE = 0.72;

const readFlag = (key) => { try { return localStorage.getItem(key) === '1'; } catch { return false; } };
const writeFlag = (key) => { try { localStorage.setItem(key, '1'); } catch { /* storage unavailable */ } };
import styles from './App.module.css';

// Startup notice when saved data had to be repaired or set aside.
function storageNotice(issues) {
  if (issues.unreadable) {
    return {
      tone: 'warning',
      text: 'Saved designs couldn’t be read, so KeyPalette started fresh. The unreadable data was kept aside.',
      actionLabel: 'Download it',
      onAction: () => downloadStorageBackup({ unreadable: issues.unreadable }),
    };
  }
  if (issues.repaired) {
    return {
      tone: 'warning',
      text: 'Some saved values were invalid and have been reset to defaults.',
      actionLabel: 'Download backup',
      onAction: () => downloadStorageBackup(),
    };
  }
  return null;
}

export default function App() {
  const { state, slots, activeSlot, actions, saveStatus, canUndo, canRedo, storageIssues } = useColorway();
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const keyboardRef = useRef(null);
  const boardRefB = useRef(null);
  const narrow = useMediaQuery(NARROW_QUERY);
  const [zoomed, setZoomed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const zoomActive = narrow && zoomed;

  // First-run guidance: shown on a blank board until dismissed or used.
  const [onboarded, setOnboarded] = useState(() => readFlag(ONBOARDED_KEY));
  const boardIsBlank = Object.keys(state.keyColors).length === 0 && slots.length === 1;
  const showOnboarding = !onboarded && boardIsBlank;
  const finishOnboarding = useCallback(() => { writeFlag(ONBOARDED_KEY); setOnboarded(true); }, []);
  useEffect(() => {
    if (!onboarded && !boardIsBlank) writeFlag(ONBOARDED_KEY);
  }, [onboarded, boardIsBlank]);

  // One notice at a time; timed notices clear themselves unless replaced.
  const [notice, setNotice] = useState(() => storageNotice(storageIssues));
  const showNotice = useCallback((next, timeoutMs = 0) => {
    setNotice(next);
    if (timeoutMs > 0) setTimeout(() => setNotice((current) => (current === next ? null : current)), timeoutMs);
  }, []);
  const dismissNotice = useCallback(() => setNotice(null), []);

  // Scale-to-fit: measure the canvas region's content box so Keyboard can
  // shrink the board to fit without clipping (capped at 1x). No new colorway
  // state — this is derived purely from container size + current layout.
  const mainRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setCanvasSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Escape clears the current selection; the hex badge dismisses with it since
  // it only renders for a single-key selection. Undo/redo shortcuts live here
  // too, but never while typing in a field or while a dialog is open.
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

  // Designs arriving in the URL hash open as a new design (or replace the
  // current one, undoably, when all slots are used). The hash is cleared right
  // away so reloads and StrictMode's double effect don't import twice.
  useEffect(() => {
    const openFromHash = async () => {
      const token = readShareToken(window.location.hash);
      if (!token) return;
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      try {
        const data = await decodeShare(token);
        const asNew = actions.openShared(data);
        showNotice({
          text: `Opened shared design “${data.name}”${asNew ? ' as a new design.' : ' in place of the current design. Undo restores the previous version.'}`,
        }, 10000);
      } catch (e) {
        showNotice({ tone: 'warning', text: `This link couldn’t be opened. ${e?.message || ''}` }, 12000);
      }
    };
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, [actions, showNotice]);

  return (
    <div className={styles.app} data-workspace={state.workspace}>
      <EditorHeader state={state} slots={slots} activeSlot={activeSlot} actions={actions}
        saveStatus={saveStatus} canUndo={canUndo} canRedo={canRedo}
        keyboardRef={keyboardRef} comparisonRefB={boardRefB}
        notice={notice} onDismissNotice={dismissNotice} />
      <div className={styles.workspace}>
      <Toolbar
        state={state}
        actions={actions}
        slots={slots}
        onExtractFromImage={() => setImageModalOpen(true)}
        sheet={narrow ? { expanded: sheetOpen, onToggle: () => setSheetOpen((open) => !open) } : null}
      />
      <main className={styles.main}>
        <div className={zoomActive ? `${styles.canvas} ${styles.canvasZoomed}` : styles.canvas}
          ref={mainRef} onClick={actions.clearSelection}>
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
            minScale={zoomActive ? NARROW_ZOOM_SCALE : 0}
          />
        )}
        </div>
        {narrow && !state.comparison.active && (
          <button type="button" className={styles.zoomBtn} onClick={() => setZoomed((value) => !value)}
            aria-pressed={zoomed} aria-label={zoomed ? 'Fit board to screen' : 'Zoom in on board'}>
            <Icon name={zoomed ? 'zoomOut' : 'zoomIn'} />
            {zoomed ? 'Fit' : 'Zoom'}
          </button>
        )}
        {showOnboarding && (
          <Onboarding
            onTryPreset={() => { actions.applyPreset(presets[Math.floor(Math.random() * presets.length)]); finishOnboarding(); }}
            onDismiss={finishOnboarding}
          />
        )}
        <div className={styles.canvasHint}>
          {state.comparison.active
            ? 'Current design is editable · Reference is a snapshot'
            : narrow
              ? zoomActive ? 'Tap a key or choose a group · Scroll sideways to see the whole board' : 'Tap a key or choose a group'
              : 'Click a key or choose a group · Shift-click to select more · Esc to clear'}
        </div>
      </main>
      </div>
      {imageModalOpen && (
        <ImagePaletteModal
          selectionCount={state.selectedKeys.length}
          onSelectColor={(hex) => {
            actions.paintSelected(hex);
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
