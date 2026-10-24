import { useState } from 'react';
import LayoutSelector from './LayoutSelector.jsx';
import ZonePanel from './ZonePanel.jsx';
import ColorPanel from './ColorPanel.jsx';
import DesignPalette from './DesignPalette.jsx';
import InlineColorPicker from './InlineColorPicker.jsx';
import presets from '../../data/presets.js';
import { PROFILES, PROFILE_ORDER } from '../../data/profiles.js';
import styles from './Toolbar.module.css';

const TABS = ['Keycaps', 'Case', 'Lettering'];

// On phones `sheet` is { expanded, onToggle } and the toolbar becomes a bottom
// sheet: collapsed it shows only selection tools, expanded the full editor.
export default function Toolbar({ state, actions, slots = [], onExtractFromImage, sheet = null }) {
  const [tab, setTab] = useState('Keycaps');
  const count = state.selectedKeys.length;
  const legendIsAuto = state.legendColor === 'auto';
  const peek = sheet && !sheet.expanded;
  const summary = (
    <div className={styles.selectionSummary}>
      <span role="status">{count ? `Editing ${count} ${count === 1 ? 'key' : 'keys'}` : 'Select keys to start'}</span>
      <span className={styles.selectionActions}>
        {count === 1 && <button type="button" onClick={() => actions.selectSameColor(state.selectedKeys[0])}
          title="Select every key with this color">Same color</button>}
        {count > 0 && <button type="button" onClick={actions.clearSelection}>Clear</button>}
      </span>
    </div>
  );
  const selectionTools = <>
    <ZonePanel state={state} onSelectZone={actions.selectZone} />
    <DesignPalette state={state} onSelectColor={actions.selectByColor} />
  </>;
  const colorPanel = (
    <ColorPanel activeColor={state.activeColor} onPaint={actions.paintSelected}
      onBeginEdit={actions.beginEdit}
      onEndEdit={(hex) => { actions.endEdit(); actions.commitColor(hex); }}
      onResetSelected={actions.resetSelectedKeys}
      selectionCount={count} colorHistory={state.colorHistory} onClearHistory={actions.clearColorHistory} />
  );
  const sheetClass = sheet ? `${styles.sheet} ${peek ? styles.sheetPeek : ''}` : '';
  return (
    <aside className={`${styles.toolbar} ${sheetClass}`} aria-label="Keyboard editor">
      {sheet && (
        <button type="button" className={styles.sheetHandle} aria-expanded={sheet.expanded} onClick={sheet.onToggle}>
          <span className={styles.grabber} aria-hidden="true" />
          {sheet.expanded ? 'Done' : count ? `Choose a color for ${count} ${count === 1 ? 'key' : 'keys'}` : 'Colors, case and lettering'}
        </button>
      )}
      {peek ? (
        <div className={styles.peekBody}>
          {summary}
          {selectionTools}
        </div>
      ) : <>
      <div className={styles.toolbarHead}>
      <LayoutSelector current={state.layout} onSelect={actions.setLayout} />
      <div className={styles.editorTabs} role="tablist" aria-label="Edit keyboard">
        {TABS.map((label, index) => (
          <button key={label} type="button" role="tab" id={`editor-tab-${label}`}
            aria-selected={tab === label} aria-controls="editor-panel" tabIndex={tab === label ? 0 : -1}
            onClick={() => setTab(label)}
            onKeyDown={(event) => {
              const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
              if (!offset && !['Home', 'End'].includes(event.key)) return;
              event.preventDefault();
              const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + offset + TABS.length) % TABS.length;
              setTab(TABS[next]);
              document.getElementById(`editor-tab-${TABS[next]}`)?.focus();
            }}>{label}</button>
        ))}
      </div>
      </div>
      <div key={tab} id="editor-panel" role="tabpanel" aria-labelledby={`editor-tab-${tab}`} className={styles.editorPanel}>
        {tab === 'Keycaps' && <>
          {summary}
          {/* In the phone sheet the groups were just visible in the collapsed
              state, so the picker comes first once it is expanded. */}
          {!sheet && selectionTools}
          {colorPanel}
          {sheet && selectionTools}
          <button type="button" className={styles.extractBtn} onClick={onExtractFromImage}>Add colors from an image</button>
          <details className={styles.section}>
            <summary className={styles.profileSummary}>Keycap profile <span>{PROFILES[state.profile]?.label ?? 'Flat'}</span></summary>
            <div className={styles.segmented} role="group" aria-label="Keycap profile">
              {PROFILE_ORDER.map((id) => <button key={id} type="button"
                className={`${styles.segmentBtn} ${state.profile === id ? styles.segmentBtnActive : ''}`}
                aria-pressed={state.profile === id} onClick={() => actions.setProfile(id)}>{PROFILES[id].label}</button>)}
            </div>
            <p className={styles.help}>Flat shows solid colors. Other profiles add simulated keycap shading.</p>
          </details>
        </>}
        {tab === 'Case' && <>
          <h3 className={styles.sectionTitle}>Case color</h3>
          <p className={styles.help}>Changes apply to the whole case as you pick.</p>
          <InlineColorPicker color={state.caseColor} onChange={actions.setCaseColor}
            onBeginEdit={actions.beginEdit} onEndEdit={actions.endEdit} ariaLabel="Case color picker" />
          <h3 className={styles.sectionTitle}>Finish</h3>
          <div className={styles.segmented} role="group" aria-label="Case finish">
            {['matte', 'gloss'].map((finish) => <button type="button" key={finish}
              className={`${styles.segmentBtn} ${state.caseFinish === finish ? styles.segmentBtnActive : ''}`}
              aria-pressed={state.caseFinish === finish} onClick={() => actions.setCaseFinish(finish)}>{finish}</button>)}
          </div>
        </>}
        {tab === 'Lettering' && <>
          <h3 className={styles.sectionTitle}>Lettering color</h3>
          <p className={styles.help}>Auto picks light or dark text for each key. Custom uses one color everywhere.</p>
          <div className={styles.segmented} role="group" aria-label="Lettering color mode">
            <button type="button" className={`${styles.segmentBtn} ${legendIsAuto ? styles.segmentBtnActive : ''}`}
              aria-pressed={legendIsAuto} onClick={() => actions.setLegendColor('auto')}>Auto</button>
            <button type="button" className={`${styles.segmentBtn} ${!legendIsAuto ? styles.segmentBtnActive : ''}`}
              aria-pressed={!legendIsAuto} onClick={() => { if (legendIsAuto) actions.setLegendColor('#ffffff'); }}>Custom</button>
          </div>
          {!legendIsAuto && (
            <InlineColorPicker color={state.legendColor} onChange={actions.setLegendColor}
              onBeginEdit={actions.beginEdit} onEndEdit={actions.endEdit} ariaLabel="Lettering color picker" />
          )}
          <h3 className={styles.sectionTitle}>Position</h3>
          <div className={styles.segmented} role="group" aria-label="Lettering position">
            {['top', 'front'].map((position) => <button type="button" key={position}
              className={`${styles.segmentBtn} ${state.legendPosition === position ? styles.segmentBtnActive : ''}`}
              disabled={position === 'front' && state.profile === 'flat'} aria-pressed={state.legendPosition === position}
              onClick={() => actions.setLegendPosition(position)}>{position}</button>)}
          </div>
          {state.profile === 'flat' && <p className={styles.help}>Front lettering needs a shaded keycap profile.</p>}
        </>}
      </div>
      {state.comparison.active && <section className={styles.section} aria-label="Comparison reference">
        <h3 className={styles.sectionTitle}>Compare with</h3>
        <button type="button" className={styles.extractBtn} onClick={() => actions.setComparisonBoard(actions.snapshotCurrent())}>Snapshot of current design</button>
        <select className={styles.compareSelect} aria-label="Reference preset" value="" onChange={(event) => {
          const preset = presets[Number(event.target.value)];
          if (preset) actions.setComparisonBoard(actions.snapshotFromPreset(preset));
        }}>
          <option value="" disabled>Choose a preset…</option>
          {presets.map((preset, index) => <option key={preset.name} value={index}>{preset.name}</option>)}
        </select>
        <select className={styles.compareSelect} aria-label="Reference saved design" value="" onChange={(event) => {
          const slot = slots[Number(event.target.value)];
          if (slot) actions.setComparisonBoard(actions.snapshotFromSlot(slot));
        }}>
          <option value="" disabled>Choose a saved design…</option>
          {slots.map((slot, index) => <option key={index} value={index} disabled={slot.layout !== state.layout}>{slot.colorwayName || 'Untitled'}{slot.layout !== state.layout ? ' (different layout)' : ''}</option>)}
        </select>
        {state.comparison.board && <button type="button" className={styles.resetSelectedBtn} onClick={actions.clearComparisonBoard}>Clear reference</button>}
      </section>}
      </>}
    </aside>
  );
}
