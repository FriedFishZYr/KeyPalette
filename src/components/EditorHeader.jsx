import { useState } from 'react';
import Dialog from './Dialog.jsx';
import ExportPanel from './ExportPanel/ExportPanel.jsx';
import WorkspaceToggle from './WorkspaceToggle.jsx';
import presets from '../data/presets.js';
import styles from './EditorHeader.module.css';

export default function EditorHeader({ state, slots, activeSlot, actions, saveStatus, canUndo, canRedo, keyboardRef, comparisonRefB }) {
  const [panel, setPanel] = useState(null);
  return (
    <header className={styles.header}>
      <span className={styles.brand}>KeyPalette</span>
      <div className={styles.project}>
        <input aria-label="Design name" value={state.colorwayName} placeholder="Untitled" maxLength={80}
          onFocus={actions.beginEdit} onChange={(event) => actions.renameDesign(event.target.value)}
          onBlur={() => { if (!state.colorwayName.trim()) actions.renameDesign('Untitled'); actions.endEdit(); }}
          onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} />
        <span className={saveStatus === 'error' ? styles.error : styles.status} role="status">
          {saveStatus === 'error' ? 'Couldn’t save · download a backup' : saveStatus === 'saving' ? 'Saving…' : 'Saved in this browser'}
        </span>
      </div>
      <div className={styles.history} role="group" aria-label="Edit history">
        <button type="button" disabled={!canUndo} onClick={actions.undo} title="Undo (⌘/Ctrl Z)">Undo</button>
        <button type="button" disabled={!canRedo} onClick={actions.redo} title="Redo (⌘/Ctrl Shift Z)">Redo</button>
      </div>
      <nav className={styles.nav} aria-label="Design actions">
        <button type="button" onClick={() => setPanel('designs')}>My designs</button>
        <button type="button" onClick={() => setPanel('presets')}>Presets</button>
        <button type="button" onClick={actions.toggleComparison} aria-pressed={state.comparison.active}>
          {state.comparison.active ? 'Exit comparison' : 'Compare'}
        </button>
        <ExportPanel state={state} actions={actions} keyboardRef={keyboardRef} comparisonRefB={comparisonRefB} />
        <WorkspaceToggle workspace={state.workspace} onToggle={actions.setWorkspace} />
      </nav>
      {panel === 'presets' && (
        <Dialog title="Start with a preset" onClose={() => setPanel(null)}>
          <p className={styles.hint}>Replaces the current key and case colors. You can undo this.</p>
          <div className={styles.presetGrid}>
            {presets.map((preset) => (
              <button type="button" key={preset.name} className={styles.preset}
                onClick={() => { actions.applyPreset(preset); setPanel(null); }}>
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
        <Dialog title="My designs" onClose={() => setPanel(null)}>
          <p className={styles.hint}>Saved on this browser and device. Download an editable design to keep a backup.</p>
          <div className={styles.designList}>
            {slots.map((slot, index) => (
              <button type="button" key={index} aria-pressed={activeSlot === index}
                onClick={() => { actions.loadSlot(index); setPanel(null); }}>
                <span>{slot.colorwayName || 'Untitled'}</span><span className={styles.status}>{activeSlot === index ? 'Current' : slot.layout === 'tkl' ? 'TKL' : slot.layout === 'full' ? 'Full-size' : `${slot.layout}%`}</span>
              </button>
            ))}
            <button type="button" disabled={slots.length >= 5}
              onClick={() => { actions.createSlot(); setPanel(null); }}>+ New design</button>
          </div>
          <p className={styles.hint}>{slots.length} of 5 designs used</p>
        </Dialog>
      )}
    </header>
  );
}
