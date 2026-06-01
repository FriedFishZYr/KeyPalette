import { useState } from 'react';
import LayoutSelector from './LayoutSelector.jsx';
import ZonePanel from './ZonePanel.jsx';
import ColorPanel from './ColorPanel.jsx';
import ExportPanel from '../ExportPanel/ExportPanel.jsx';
import presets from '../../data/presets.js';
import { PROFILES, PROFILE_ORDER } from '../../data/profiles.js';
import { DEFAULT_KEY_COLOR } from '../../hooks/useColorway.js';
import styles from './Toolbar.module.css';

const LEGEND_POSITIONS = ['top', 'front'];

const RESET_ALL_PROMPT =
  'Reset every key to the default color and the case to black?\n\n' +
  'Layout, workspace, and saved slots are kept.';

const CASE_FINISHES = ['matte', 'gloss'];

export default function Toolbar({
  state,
  actions,
  slots = [],
  keyboardRef,
  comparisonRefB,
  onExtractFromImage,
}) {
  // Presets collapse to keep the (now 16-strong) list from crowding the panel.
  const [presetsOpen, setPresetsOpen] = useState(false);
  // Profile and Legends collapse the same way (V3.1) for visual coherence.
  const [profileOpen, setProfileOpen] = useState(false);
  const [legendsOpen, setLegendsOpen] = useState(false);

  const comparison = state.comparison;

  const handleResetAll = () => {
    if (window.confirm(RESET_ALL_PROMPT)) {
      actions.resetAll();
    }
  };

  const handlePreset = (preset) => {
    const hasCustomColors = Object.values(state.keyColors).some(
      (c) => c !== DEFAULT_KEY_COLOR,
    );
    if (
      !hasCustomColors ||
      window.confirm(
        `Load the "${preset.name}" preset? This replaces your current key colors and case.`,
      )
    ) {
      actions.applyPreset(preset);
    }
  };

  return (
    <aside className={styles.toolbar}>
      <LayoutSelector current={state.layout} onSelect={actions.setLayout} />
      <div className={styles.section}>
        <button
          type="button"
          className={styles.sectionToggle}
          onClick={() => setPresetsOpen((v) => !v)}
          aria-expanded={presetsOpen}
        >
          <span className={styles.sectionTitle}>Presets</span>
          <span className={styles.sectionMeta}>
            <span className={styles.sectionCount}>{presets.length}</span>
            <span className={styles.sectionChevron} aria-hidden="true">
              {presetsOpen ? '▾' : '▸'}
            </span>
          </span>
        </button>
        {presetsOpen && (
          <div className={styles.presetGroup}>
            {presets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                className={styles.presetPill}
                onClick={() => handlePreset(preset)}
              >
                <span className={styles.presetDots} aria-hidden="true">
                  <span className={styles.presetDot} style={{ background: preset.zones.alpha }} />
                  <span className={styles.presetDot} style={{ background: preset.zones.modifier }} />
                  <span className={styles.presetDot} style={{ background: preset.caseColor }} />
                </span>
                {preset.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <ZonePanel state={state} onSelectZone={actions.selectZone} />
      <ColorPanel
        activeColor={state.activeColor}
        onColorChange={actions.setActiveColor}
        onApply={actions.applyColorToSelected}
        onResetSelected={actions.resetSelectedKeys}
        hasSelection={state.selectedKeys.length > 0}
        colorHistory={state.colorHistory}
        onClearHistory={actions.clearColorHistory}
      />
      <button
        type="button"
        className={styles.extractBtn}
        onClick={onExtractFromImage}
      >
        Extract from image
      </button>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Case</h3>
        <div className={styles.caseColorRow}>
          <input
            type="color"
            className={styles.caseSwatch}
            value={state.caseColor}
            onChange={(e) => actions.setCaseColor(e.target.value)}
            aria-label="Case color"
            title="Case color"
          />
          <span className={styles.caseHex}>{state.caseColor}</span>
        </div>
        <div className={styles.segmented} role="group" aria-label="Case finish">
          {CASE_FINISHES.map((finish) => (
            <button
              key={finish}
              type="button"
              className={`${styles.segmentBtn} ${state.caseFinish === finish ? styles.segmentBtnActive : ''}`}
              onClick={() => actions.setCaseFinish(finish)}
              aria-pressed={state.caseFinish === finish}
            >
              {finish}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.section}>
        <button
          type="button"
          className={styles.sectionToggle}
          onClick={() => setProfileOpen((v) => !v)}
          aria-expanded={profileOpen}
        >
          <span className={styles.sectionTitle}>Profile</span>
          <span className={styles.sectionMeta}>
            <span className={styles.sectionCount}>
              {PROFILES[state.profile]?.label ?? 'Flat'}
            </span>
            <span className={styles.sectionChevron} aria-hidden="true">
              {profileOpen ? '▾' : '▸'}
            </span>
          </span>
        </button>
        {profileOpen && (
          <div className={styles.buttonGroup} role="group" aria-label="Keycap profile">
            {PROFILE_ORDER.map((id) => (
              <button
                key={id}
                type="button"
                className={`${styles.btn} ${state.profile === id ? styles.btnActive : ''}`}
                onClick={() => actions.setProfile(id)}
                aria-pressed={state.profile === id}
              >
                {PROFILES[id].label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className={styles.section}>
        <button
          type="button"
          className={styles.sectionToggle}
          onClick={() => setLegendsOpen((v) => !v)}
          aria-expanded={legendsOpen}
        >
          <span className={styles.sectionTitle}>Legends</span>
          <span className={styles.sectionMeta}>
            <span className={styles.sectionCount}>
              {state.legendColor === 'auto' ? 'Auto' : state.legendColor} · {state.legendPosition}
            </span>
            <span className={styles.sectionChevron} aria-hidden="true">
              {legendsOpen ? '▾' : '▸'}
            </span>
          </span>
        </button>
        {legendsOpen && (
          <>
            <div className={styles.caseColorRow}>
              <input
                type="color"
                className={styles.caseSwatch}
                value={state.legendColor === 'auto' ? '#cccccc' : state.legendColor}
                onChange={(e) => actions.setLegendColor(e.target.value)}
                aria-label="Legend color"
                title="Legend color"
              />
              <button
                type="button"
                className={`${styles.autoBtn} ${state.legendColor === 'auto' ? styles.autoBtnActive : ''}`}
                onClick={() => actions.setLegendColor('auto')}
                aria-pressed={state.legendColor === 'auto'}
                title="Auto-contrast legend per key"
              >
                Auto
              </button>
            </div>
            <div className={styles.segmented} role="group" aria-label="Legend position">
              {LEGEND_POSITIONS.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  className={`${styles.segmentBtn} ${state.legendPosition === pos ? styles.segmentBtnActive : ''}`}
                  onClick={() => actions.setLegendPosition(pos)}
                  aria-pressed={state.legendPosition === pos}
                >
                  {pos}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Comparison</h3>
        <div className={styles.segmented} role="group" aria-label="Comparison mode">
          <button
            type="button"
            className={`${styles.segmentBtn} ${comparison.active ? styles.segmentBtnActive : ''}`}
            onClick={actions.toggleComparison}
            aria-pressed={comparison.active}
          >
            {comparison.active ? 'Comparing A / B' : 'Compare A / B'}
          </button>
        </div>
        {comparison.active && (
          <div className={styles.compareControls}>
            <span className={styles.compareHint}>Set B from</span>
            <button
              type="button"
              className={styles.extractBtn}
              onClick={() => actions.setComparisonBoard(actions.snapshotCurrent())}
            >
              Duplicate A
            </button>
            <select
              className={styles.compareSelect}
              value=""
              onChange={(e) => {
                const idx = Number(e.target.value);
                if (presets[idx]) {
                  actions.setComparisonBoard(actions.snapshotFromPreset(presets[idx]));
                }
                e.target.value = '';
              }}
            >
              <option value="" disabled>
                Load preset…
              </option>
              {presets.map((p, i) => (
                <option key={p.name} value={i}>
                  {p.name}
                </option>
              ))}
            </select>
            {slots.length > 0 && (
              <div className={styles.buttonGroup}>
                {slots.map((sl, i) => {
                  const match = sl.layout === state.layout;
                  return (
                    <button
                      key={i}
                      type="button"
                      className={styles.btn}
                      disabled={!match}
                      title={match ? 'Load this slot into B' : 'Different layout'}
                      onClick={() => actions.setComparisonBoard(actions.snapshotFromSlot(sl))}
                    >
                      {sl.colorwayName || `Slot ${i + 1}`}
                    </button>
                  );
                })}
              </div>
            )}
            {comparison.board && (
              <button
                type="button"
                className={styles.resetSelectedBtn}
                onClick={actions.clearComparisonBoard}
              >
                Clear B
              </button>
            )}
          </div>
        )}
      </div>
      <ExportPanel
        state={state}
        actions={actions}
        keyboardRef={keyboardRef}
        comparisonRefB={comparisonRefB}
      />
      <div className={styles.dangerSection}>
        <button
          type="button"
          className={styles.resetAllBtn}
          onClick={handleResetAll}
        >
          Reset All
        </button>
      </div>
    </aside>
  );
}
