import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import useLocalStorage from './useLocalStorage.js';
import layouts from '../data/layouts/index.js';
import { designHistoryReducer, initialHistory } from '../utils/designHistory.js';
import {
  DEFAULT_STATE, DEFAULT_KEY_COLOR, DEFAULT_CASE_COLOR, MAX_SLOTS, STORAGE_KEY, HISTORY_KEY,
  buildInitialSlots, normalizeStore, nextCopyName,
} from '../utils/designStore.js';

export { DEFAULT_KEY_COLOR, MAX_SLOTS };

// Recently-used colors, persisted separately from the slot store.
const MAX_HISTORY = 16;
const EMPTY_HISTORY = [];

function computeActiveColor(selectedKeys, keyColors, currentActiveColor) {
  if (selectedKeys.length === 0) return currentActiveColor;
  const first = keyColors[selectedKeys[0]] ?? DEFAULT_KEY_COLOR;
  for (let i = 1; i < selectedKeys.length; i++) {
    const c = keyColors[selectedKeys[i]] ?? DEFAULT_KEY_COLOR;
    if (c !== first) return null;
  }
  return first;
}

const replaceActive = (store, slot) => ({
  ...store,
  slots: store.slots.map((s, i) => (i === store.active ? slot : s)),
});

const zoneKeyColors = (layoutKeys, preset) => {
  const keyColors = {};
  for (const k of layoutKeys) {
    const zoneColor = preset.zones[k.zone];
    if (zoneColor) keyColors[k.id] = zoneColor;
  }
  return keyColors;
};

export default function useColorway() {
  const [persistedStore, persistStore, saveStatus, unreadableStore] = useLocalStorage(STORAGE_KEY, buildInitialSlots);
  // Validate once, leniently: invalid values fall back to defaults and the
  // fact that something was dropped is surfaced so the UI can offer a backup.
  const [normalized] = useState(() => normalizeStore(persistedStore));
  const [history, dispatch] = useReducer(designHistoryReducer, normalized.store, initialHistory);
  const store = history.present;
  const setStore = useCallback((update) => dispatch({ type: 'update', update }), []);
  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);
  const beginEdit = useCallback(() => dispatch({ type: 'begin' }), []);
  const endEdit = useCallback(() => dispatch({ type: 'end' }), []);
  useEffect(() => { persistStore(store); }, [store, persistStore]);

  const [colorHistory, setColorHistory] = useLocalStorage(HISTORY_KEY, EMPTY_HISTORY);

  // Comparison is session-only — deliberately NOT persisted, so it lives in
  // component state rather than the localStorage slot store.
  const [comparison, setComparison] = useState({ active: false, board: null });

  const { active, slots } = store;
  const slot = slots[active] ?? { ...DEFAULT_STATE };
  // colorHistory lives in its own localStorage key but is surfaced on the
  // state object so consumers can read it like any other field.
  const state = { ...slot, comparison, colorHistory };

  // Always points at the latest committed state so event handlers can read
  // fresh values without re-creating callbacks on every render.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  const pushToHistory = useCallback(
    (hex) => {
      if (!hex) return;
      const h = hex.toLowerCase();
      setColorHistory((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        return [h, ...list.filter((c) => c !== h)].slice(0, MAX_HISTORY);
      });
    },
    [setColorHistory],
  );

  // Prepend a batch of colors (e.g. an extracted palette) in order, so the
  // first entry ends up leftmost. De-dupes within the batch and against
  // existing history, then caps at MAX_HISTORY.
  const addColorsToHistory = useCallback(
    (hexes) => {
      if (!Array.isArray(hexes) || hexes.length === 0) return;
      const batch = [...new Set(hexes.filter(Boolean).map((h) => h.toLowerCase()))];
      if (batch.length === 0) return;
      setColorHistory((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        const rest = list.filter((c) => !batch.includes(c));
        return [...batch, ...rest].slice(0, MAX_HISTORY);
      });
    },
    [setColorHistory],
  );

  const clearColorHistory = useCallback(() => setColorHistory([]), [setColorHistory]);

  const update = useCallback(
    (patch) => setStore((p) => replaceActive(p, { ...p.slots[p.active], ...patch })),
    [setStore],
  );

  const setLayout = useCallback((layout) => update({ layout, selectedKeys: [] }), [update]);
  const renameDesign = useCallback((colorwayName) => update({ colorwayName }), [update]);
  const setActiveColor = useCallback((activeColor) => update({ activeColor }), [update]);

  const applyColorToSelected = useCallback(() => {
    setStore((p) => {
      const cur = p.slots[p.active];
      if (cur.activeColor == null || cur.selectedKeys.length === 0) return p;
      const keyColors = { ...cur.keyColors };
      for (const id of cur.selectedKeys) keyColors[id] = cur.activeColor;
      return replaceActive(p, { ...cur, keyColors });
    });
    // Record the applied color once, reading the value synchronously from the
    // ref so it doesn't depend on the (async) setStore updater running first.
    const { activeColor, selectedKeys } = stateRef.current;
    if (activeColor != null && selectedKeys.length > 0) pushToHistory(activeColor);
  }, [setStore, pushToHistory]);

  const toggleKeySelected = useCallback(
    (keyId, additive) => {
      setStore((p) => {
        const cur = p.slots[p.active];
        let selectedKeys;
        if (additive) {
          selectedKeys = cur.selectedKeys.includes(keyId)
            ? cur.selectedKeys.filter((id) => id !== keyId)
            : [...cur.selectedKeys, keyId];
        } else {
          selectedKeys = [keyId];
        }
        const activeColor = computeActiveColor(selectedKeys, cur.keyColors, cur.activeColor);
        return replaceActive(p, { ...cur, selectedKeys, activeColor });
      });
    },
    [setStore],
  );

  // Select every key that currently shares keyId's color — handy for
  // recoloring an accent set that isn't a single zone.
  const selectSameColor = useCallback(
    (keyId, additive = false) => {
      setStore((p) => {
        const cur = p.slots[p.active];
        const target = cur.keyColors[keyId] ?? DEFAULT_KEY_COLOR;
        const layoutKeys = layouts[cur.layout] ?? [];
        const matching = layoutKeys
          .filter((k) => (cur.keyColors[k.id] ?? DEFAULT_KEY_COLOR) === target)
          .map((k) => k.id);
        const selectedKeys = additive ? [...new Set([...cur.selectedKeys, ...matching])] : matching;
        const activeColor = computeActiveColor(selectedKeys, cur.keyColors, cur.activeColor);
        return replaceActive(p, { ...cur, selectedKeys, activeColor });
      });
    },
    [setStore],
  );

  // Clears the current selection. Used by background clicks and the Escape
  // key; because the hex badge only renders for a single selection, clearing
  // also dismisses the badge.
  const clearSelection = useCallback(() => {
    setStore((p) => {
      const cur = p.slots[p.active];
      if (cur.selectedKeys.length === 0) return p;
      return replaceActive(p, { ...cur, selectedKeys: [] });
    });
  }, [setStore]);

  const selectZone = useCallback(
    (zoneKey) => {
      setStore((p) => {
        const cur = p.slots[p.active];
        const layoutKeys = layouts[cur.layout] ?? [];
        const selectedKeys = layoutKeys.filter((k) => zoneKey === 'all' || k.zone === zoneKey).map((k) => k.id);
        const activeColor = computeActiveColor(selectedKeys, cur.keyColors, cur.activeColor);
        return replaceActive(p, { ...cur, selectedKeys, activeColor });
      });
    },
    [setStore],
  );

  const setCaseColor = useCallback((caseColor) => update({ caseColor }), [update]);
  const setCaseFinish = useCallback((caseFinish) => update({ caseFinish }), [update]);
  const setWorkspace = useCallback((workspace) => update({ workspace }), [update]);
  const setProfile = useCallback((profile) => update({ profile }), [update]);
  const setLegendColor = useCallback((legendColor) => update({ legendColor }), [update]);
  const setLegendPosition = useCallback((legendPosition) => update({ legendPosition }), [update]);

  const resetSelectedKeys = useCallback(() => {
    setStore((p) => {
      const cur = p.slots[p.active];
      if (cur.selectedKeys.length === 0) return p;
      const keyColors = { ...cur.keyColors };
      for (const id of cur.selectedKeys) keyColors[id] = DEFAULT_KEY_COLOR;
      const activeColor = computeActiveColor(cur.selectedKeys, keyColors, cur.activeColor);
      return replaceActive(p, { ...cur, keyColors, activeColor });
    });
  }, [setStore]);

  // Wipes keyColors and caseColor only. Leaves layout, workspace, colorwayName,
  // caseFinish, selectedKeys, and the saved slot list untouched.
  const resetAll = useCallback(() => {
    setStore((p) => {
      const cur = p.slots[p.active];
      const keyColors = {};
      const activeColor = computeActiveColor(cur.selectedKeys, keyColors, cur.activeColor);
      return replaceActive(p, { ...cur, keyColors, caseColor: DEFAULT_CASE_COLOR, activeColor });
    });
  }, [setStore]);

  // Overwrites keyColors, caseColor, and caseFinish from a preset. Zone colors
  // are mapped onto every key in the current layout that belongs to that zone.
  const applyPreset = useCallback(
    (preset) => {
      setStore((p) => {
        const cur = p.slots[p.active];
        const keyColors = zoneKeyColors(layouts[cur.layout] ?? [], preset);
        const activeColor = computeActiveColor(cur.selectedKeys, keyColors, cur.activeColor);
        return replaceActive(p, {
          ...cur, keyColors, caseColor: preset.caseColor, caseFinish: preset.caseFinish, activeColor,
        });
      });
    },
    [setStore],
  );

  // Applies a validated colorway (file import or shared link) onto the active
  // slot, overwriting layout, case, key colors, name, and the visual fields.
  // deserializeColorway default-fills profile/legendColor/legendPosition for
  // older files, so they're always present here. Selection is cleared.
  const importColorway = useCallback(
    (data) => {
      setStore((p) => {
        const cur = p.slots[p.active];
        const keyColors = { ...data.keyColors };
        return replaceActive(p, {
          ...cur,
          layout: data.layout,
          caseColor: data.caseColor ?? cur.caseColor,
          caseFinish: data.caseFinish ?? cur.caseFinish,
          profile: data.profile ?? cur.profile ?? 'flat',
          legendColor: data.legendColor ?? cur.legendColor ?? 'auto',
          legendPosition: data.legendPosition ?? cur.legendPosition ?? 'top',
          keyColors,
          colorwayName: data.name ?? cur.colorwayName,
          selectedKeys: [],
          activeColor: computeActiveColor([], keyColors, cur.activeColor),
        });
      });
    },
    [setStore],
  );

  // ── Slot management ─────────────────────────────────────────────────────
  const loadSlot = useCallback(
    (index) => setStore((p) => (index >= 0 && index < p.slots.length ? { ...p, active: index } : p)),
    [setStore],
  );

  const createSlot = useCallback(
    (initial = null) => {
      setStore((p) => {
        if (p.slots.length >= MAX_SLOTS) return p;
        const fresh = {
          ...DEFAULT_STATE,
          colorwayName: `Design ${p.slots.length + 1}`,
          workspace: p.slots[p.active].workspace,
          ...(initial ?? {}),
          selectedKeys: [],
        };
        return { active: p.slots.length, slots: [...p.slots, fresh] };
      });
    },
    [setStore],
  );

  const duplicateSlot = useCallback(
    (index) => {
      setStore((p) => {
        const source = p.slots[index];
        if (!source || p.slots.length >= MAX_SLOTS) return p;
        const copy = {
          ...source,
          keyColors: { ...source.keyColors },
          colorwayName: nextCopyName(source.colorwayName, p.slots.map((s) => s.colorwayName)),
          selectedKeys: [],
        };
        return { active: p.slots.length, slots: [...p.slots, copy] };
      });
    },
    [setStore],
  );

  const deleteSlot = useCallback((index) => dispatch({ type: 'deleteSlot', index }), []);

  // A design from a share link: a new slot when there is room, otherwise an
  // undoable replacement of the active design. Returns whether it was new.
  const slotCountRef = useRef(slots.length);
  useEffect(() => {
    slotCountRef.current = slots.length;
  });
  const openShared = useCallback(
    (data) => {
      const asNew = slotCountRef.current < MAX_SLOTS;
      if (asNew) {
        createSlot({
          layout: data.layout, caseColor: data.caseColor, caseFinish: data.caseFinish, profile: data.profile,
          legendColor: data.legendColor, legendPosition: data.legendPosition, keyColors: { ...data.keyColors },
          colorwayName: data.name,
        });
      } else {
        importColorway(data);
      }
      return asNew;
    },
    [createSlot, importColorway],
  );

  // ── Comparison ──────────────────────────────────────────────────────────
  // A read-only board "B" snapshot, rendered next to the live board "A".

  const snapshotCurrent = useCallback(() => {
    const s = stateRef.current;
    return {
      name: s.colorwayName,
      layout: s.layout,
      caseColor: s.caseColor,
      caseFinish: s.caseFinish,
      profile: s.profile,
      legendColor: s.legendColor,
      legendPosition: s.legendPosition,
      keyColors: { ...s.keyColors },
    };
  }, []);

  // Snapshot built from a zone-based preset, mapped onto A's current layout.
  // Inherits A's profile/legend so the comparison differs only in colors.
  const snapshotFromPreset = useCallback((preset) => {
    const s = stateRef.current;
    return {
      name: preset.name,
      layout: s.layout,
      caseColor: preset.caseColor,
      caseFinish: preset.caseFinish,
      profile: s.profile,
      legendColor: s.legendColor,
      legendPosition: s.legendPosition,
      keyColors: zoneKeyColors(layouts[s.layout] ?? [], preset),
    };
  }, []);

  const snapshotFromSlot = useCallback(
    (slotData) => ({
      name: slotData.colorwayName ?? 'Saved',
      layout: slotData.layout,
      caseColor: slotData.caseColor,
      caseFinish: slotData.caseFinish,
      profile: slotData.profile ?? 'flat',
      legendColor: slotData.legendColor ?? 'auto',
      legendPosition: slotData.legendPosition ?? 'top',
      keyColors: { ...slotData.keyColors },
    }),
    [],
  );

  const toggleComparison = useCallback(() => setComparison((c) => ({ ...c, active: !c.active })), []);
  const setComparisonBoard = useCallback((snapshot) => setComparison({ active: true, board: snapshot }), []);
  const clearComparisonBoard = useCallback(() => setComparison((c) => ({ ...c, board: null })), []);

  const actions = useMemo(
    () => ({
      undo, redo, beginEdit, endEdit, renameDesign,
      setLayout, setActiveColor, applyColorToSelected, toggleKeySelected, selectSameColor,
      clearSelection, selectZone, setCaseColor, setCaseFinish, setWorkspace,
      setProfile, setLegendColor, setLegendPosition,
      resetSelectedKeys, resetAll, applyPreset, importColorway,
      addColorsToHistory, clearColorHistory,
      loadSlot, createSlot, duplicateSlot, deleteSlot, openShared,
      snapshotCurrent, snapshotFromPreset, snapshotFromSlot,
      toggleComparison, setComparisonBoard, clearComparisonBoard,
    }),
    [
      undo, redo, beginEdit, endEdit, renameDesign,
      setLayout, setActiveColor, applyColorToSelected, toggleKeySelected, selectSameColor,
      clearSelection, selectZone, setCaseColor, setCaseFinish, setWorkspace,
      setProfile, setLegendColor, setLegendPosition,
      resetSelectedKeys, resetAll, applyPreset, importColorway,
      addColorsToHistory, clearColorHistory,
      loadSlot, createSlot, duplicateSlot, deleteSlot, openShared,
      snapshotCurrent, snapshotFromPreset, snapshotFromSlot,
      toggleComparison, setComparisonBoard, clearComparisonBoard,
    ],
  );

  return {
    state, slots, activeSlot: active, actions, saveStatus,
    canUndo: (history.histories[active]?.past.length ?? 0) > 0,
    canRedo: (history.histories[active]?.future.length ?? 0) > 0,
    storageIssues: { unreadable: unreadableStore, repaired: normalized.repaired },
  };
}
