import { useEffect, useState } from 'react';
import Dialog from './Dialog.jsx';
import AboutDialog from './AboutDialog.jsx';
import ExportPanel from './ExportPanel/ExportPanel.jsx';
import WorkspaceToggle from './WorkspaceToggle.jsx';
import Icon from './Icon.jsx';
import presets from '../data/presets.js';
import { layoutLabel } from '../data/layouts/index.js';
import { MAX_SLOTS, MAX_NAME_LENGTH } from '../utils/designStore.js';
import styles from './EditorHeader.module.css';

// "Saving…" only shows once a write has been pending for a moment, so quick
// edits don't flicker the status text.
function useSettledStatus(status, delay = 600) {
  const [shown, setShown] = useState(status);
  useEffect(() => {
    const timer = setTimeout(() => setShown(status), status === 'saving' ? delay : 0);
    return () => clearTimeout(timer);
  }, [status, delay]);
  return shown;
}

const STATUS_TEXT = {
  saved: 'Saved in this browser',
  saving: 'Saving…',
  error: 'Couldn’t save · download a backup',
};

export default function EditorHeader({
  state, slots, activeSlot, actions, saveStatus, canUndo, canRedo,
  keyboardRef, comparisonRefB, notice, onDismissNotice,
}) {
  const [panel, setPanel] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const status = useSettledStatus(saveStatus);
  const closePanel = () => { setPanel(null); setConfirmDelete(null); };

  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <span className={styles.brand}>
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="22" height="22" />
          KeyPalette
        </span>
        <div className={styles.project}>
          <input aria-label="Design name" value={state.colorwayName} placeholder="Untitled" maxLength={MAX_NAME_LENGTH}
            onFocus={actions.beginEdit} onChange={(event) => actions.renameDesign(event.target.value)}
            onBlur={() => { if (!state.colorwayName.trim()) actions.renameDesign('Untitled'); actions.endEdit(); }}
            onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} />
          <span className={status === 'error' ? styles.error : styles.status} role="status">{STATUS_TEXT[status]}</span>
        </div>
        <div className={styles.history} role="group" aria-label="Edit history">
          <button type="button" className={styles.iconBtn} disabled={!canUndo} onClick={actions.undo}
            aria-label="Undo" title="Undo (⌘/Ctrl Z)"><Icon name="undo" /></button>
          <button type="button" className={styles.iconBtn} disabled={!canRedo} onClick={actions.redo}
            aria-label="Redo" title="Redo (⌘/Ctrl Shift Z)"><Icon name="redo" /></button>
        </div>
        <nav className={styles.nav} aria-label="Design actions">
          <button type="button" className={styles.navBtn} onClick={() => setPanel('designs')}>My designs</button>
          <button type="button" className={styles.navBtn} onClick={() => setPanel('presets')}>Presets</button>
          <button type="button" className={styles.navBtn} onClick={actions.toggleComparison} aria-pressed={state.comparison.active}>
            {state.comparison.active ? 'Exit comparison' : 'Compare'}
          </button>
          <ExportPanel state={state} actions={actions} keyboardRef={keyboardRef} comparisonRefB={comparisonRefB} />
          <span className={styles.divider} aria-hidden="true" />
          <button type="button" className={styles.iconBtn} aria-label="About KeyPalette" title="About and shortcuts"
            onClick={() => setPanel('about')}><Icon name="help" /></button>
          <WorkspaceToggle className={styles.iconBtn} workspace={state.workspace} onToggle={actions.setWorkspace} />
        </nav>
      </div>
      {notice && (
        <div className={`${styles.notice} ${notice.tone === 'warning' ? styles.noticeWarning : ''}`} role="status">
          <span className={styles.noticeText}>{notice.text}</span>
          {notice.actionLabel && <button type="button" onClick={notice.onAction}>{notice.actionLabel}</button>}
          <button type="button" className={styles.iconBtn} aria-label="Dismiss notice" onClick={onDismissNotice}>×</button>
        </div>
      )}
      {panel === 'presets' && (
        <Dialog title="Start with a preset" onClose={closePanel}>
          <p className={styles.hint}>Replaces the current key and case colors. You can undo this.</p>
          <div className={styles.presetGrid}>
            {presets.map((preset) => (
              <button type="button" key={preset.name} className={styles.preset}
                onClick={() => { actions.applyPreset(preset); closePanel(); }}>
                <span className={styles.swatches} aria-hidden="true">
                  {[preset.zones.alpha, preset.zones.modifier, preset.caseColor].map((color, index) => <span key={index} style={{ background: color }} />)}
                </span>
                {preset.name}
              </button>
            ))}
          </div>
        </Dialog>
      )}
      {panel === 'designs' && (
        <Dialog title="My designs" onClose={closePanel}>
          <p className={styles.hint}>Saved on this browser and device. Download an editable design to keep a backup.</p>
          <ul className={styles.designList}>
            {slots.map((slot, index) => {
              const name = slot.colorwayName || 'Untitled';
              const current = activeSlot === index;
              return (
                <li key={index} className={styles.designRow}>
                  {confirmDelete === index ? (
                    <div className={styles.confirm} role="group" aria-label={`Delete ${name}?`}>
                      <span>Delete “{name}”? This can’t be undone.</span>
                      <button type="button" className={styles.danger}
                        onClick={() => { actions.deleteSlot(index); setConfirmDelete(null); }}>Delete</button>
                      <button type="button" onClick={() => setConfirmDelete(null)}>Keep</button>
                    </div>
                  ) : (
                    <>
                      <button type="button" className={styles.designOpen} aria-pressed={current}
                        onClick={() => { actions.loadSlot(index); closePanel(); }}>
                        <span className={styles.designName}>{name}</span>
                        <span className={styles.status}>{current ? 'Current · ' : ''}{layoutLabel(slot.layout)}</span>
                      </button>
                      <button type="button" className={styles.rowAction} disabled={slots.length >= MAX_SLOTS}
                        aria-label={`Duplicate ${name}`} onClick={() => actions.duplicateSlot(index)}>Duplicate</button>
                      <button type="button" className={styles.rowAction} disabled={slots.length <= 1}
                        aria-label={`Delete ${name}`} onClick={() => setConfirmDelete(index)}>Delete</button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
          <div className={styles.designFooter}>
            <button type="button" disabled={slots.length >= MAX_SLOTS}
              onClick={() => { actions.createSlot(); closePanel(); }}>+ New design</button>
            <span className={styles.hint}>{slots.length} of {MAX_SLOTS} designs used</span>
          </div>
        </Dialog>
      )}
      {panel === 'about' && <AboutDialog onClose={closePanel} />}
    </header>
  );
}
