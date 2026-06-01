import { useCallback, useMemo, useRef } from 'react';
import useLocalStorage from './useLocalStorage.js';
import layouts from '../data/layouts/index.js';

const DEFAULT_STATE = {
  layout: 'tkl',
  caseColor: '#1a1a1a',
  caseFinish: 'matte',
  keyColors: {},
  selectedKeys: [],
  activeColor: '#cccccc',
  colorwayName: 'Untitled',
  workspace: 'dark',
};

const STORAGE_KEY = 'keypalette-slots';
const MAX_SLOTS = 5;

// Section 4: recently-used colors, persisted separately from the slot store.
const HISTORY_KEY = 'keypalette-color-history';
const MAX_HISTORY = 16;
const EMPTY_HISTORY = [];

// Per V2 spec section 3: every key starts at and resets to this color.
// Kept in sync with the render fallback in Keyboard.jsx.
export const DEFAULT_KEY_COLOR = '#e0e0e0';
const DEFAULT_CASE_COLOR = '#1a1a1a';

function computeActiveColor(selectedKeys, keyColors, currentActiveColor) {
  if (selectedKeys.length === 0) return currentActiveColor;
  const first = keyColors[selectedKeys[0]] ?? DEFAULT_KEY_COLOR;
  for (let i = 1; i < selectedKeys.length; i++) {
    const c = keyColors[selectedKeys[i]] ?? DEFAULT_KEY_COLOR;
    if (c !== first) return null;
  }
  return first;
}

function buildInitialSlots() {
  return { active: 0, slots: [{ ...DEFAULT_STATE }] };
}

export default function useColorway() {
  const [store, setStore] = useLocalStorage(STORAGE_KEY, buildInitialSlots);

  const [colorHistory, setColorHistory] = useLocalStorage(HISTORY_KEY, EMPTY_HISTORY);

  // Lazily normalise: if store was built by the factory, call it
  const normalised = typeof store === 'function' ? store() : store;
  const { active, slots } = normalised;
  const slot = slots[active] ?? { ...DEFAULT_STATE };
  // colorHistory lives in its own localStorage key but is surfaced on the
  // state object so consumers can read it like any other field.
  const state = { ...slot, colorHistory };

  // Always points at the latest committed state so event handlers can read
  // fresh values without re-creating callbacks on every render.
  const stateRef = useRef(state);
  stateRef.current = state;

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

  const clearColorHistory = useCallback(() => {
    setColorHistory([]);
  }, [setColorHistory]);

  const update = useCallback(
    (patch) => {
      setStore((prev) => {
        const p = typeof prev === 'function' ? prev() : prev;
        const newSlots = [...p.slots];
        newSlots[p.active] = { ...newSlots[p.active], ...patch };
        return { ...p, slots: newSlots };
      });
    },
    [setStore],
  );

  const setLayout = useCallback(
    (layout) => update({ layout, selectedKeys: [] }),
    [update],
  );

  const setActiveColor = useCallback(
    (activeColor) => update({ activeColor }),
    [update],
  );

  const applyColorToSelected = useCallback(() => {
    setStore((prev) => {
      const p = typeof prev === 'function' ? prev() : prev;
      const cur = p.slots[p.active];
      if (cur.activeColor == null) return p;
      const keyColors = { ...cur.keyColors };
      for (const id of cur.selectedKeys) {
        keyColors[id] = cur.activeColor;
      }
      const newSlots = [...p.slots];
      newSlots[p.active] = { ...cur, keyColors };
      return { ...p, slots: newSlots };
    });
    // Record the applied color once, reading the value synchronously from the
    // ref so it doesn't depend on the (async) setStore updater running first.
    const { activeColor, selectedKeys } = stateRef.current;
    if (activeColor != null && selectedKeys.length > 0) {
      pushToHistory(activeColor);
    }
  }, [setStore, pushToHistory]);

  const toggleKeySelected = useCallback(
    (keyId, additive) => {
      setStore((prev) => {
        const p = typeof prev === 'function' ? prev() : prev;
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
        const newSlots = [...p.slots];
        newSlots[p.active] = { ...cur, selectedKeys, activeColor };
        return { ...p, slots: newSlots };
      });
    },
    [setStore],
  );

  // Clears the current selection (V3 §4). Used by background clicks and the
  // Escape key; because the hex badge only renders for a single selection,
  // clearing also dismisses the badge.
  const clearSelection = useCallback(() => {
    setStore((prev) => {
      const p = typeof prev === 'function' ? prev() : prev;
      const cur = p.slots[p.active];
      if (cur.selectedKeys.length === 0) return p;
      const activeColor = computeActiveColor([], cur.keyColors, cur.activeColor);
      const newSlots = [...p.slots];
      newSlots[p.active] = { ...cur, selectedKeys: [], activeColor };
      return { ...p, slots: newSlots };
    });
  }, [setStore]);

  const selectZone = useCallback(
    (zoneKey) => {
      setStore((prev) => {
        const p = typeof prev === 'function' ? prev() : prev;
        const cur = p.slots[p.active];
        const layoutKeys = layouts[cur.layout] ?? [];
        const selectedKeys = layoutKeys.filter((k) => k.zone === zoneKey).map((k) => k.id);
        const activeColor = computeActiveColor(selectedKeys, cur.keyColors, cur.activeColor);
        const newSlots = [...p.slots];
        newSlots[p.active] = { ...cur, selectedKeys, activeColor };
        return { ...p, slots: newSlots };
      });
    },
    [setStore],
  );

  const setCaseColor = useCallback(
    (caseColor) => update({ caseColor }),
    [update],
  );

  const setCaseFinish = useCallback(
    (caseFinish) => update({ caseFinish }),
    [update],
  );

  const setWorkspace = useCallback(
    (workspace) => update({ workspace }),
    [update],
  );

  const resetSelectedKeys = useCallback(() => {
    setStore((prev) => {
      const p = typeof prev === 'function' ? prev() : prev;
      const cur = p.slots[p.active];
      if (cur.selectedKeys.length === 0) return p;
      const keyColors = { ...cur.keyColors };
      for (const id of cur.selectedKeys) {
        keyColors[id] = DEFAULT_KEY_COLOR;
      }
      const activeColor = computeActiveColor(cur.selectedKeys, keyColors, cur.activeColor);
      const newSlots = [...p.slots];
      newSlots[p.active] = { ...cur, keyColors, activeColor };
      return { ...p, slots: newSlots };
    });
  }, [setStore]);

  // Wipes keyColors and caseColor only. Leaves layout, workspace, colorwayName,
  // caseFinish, selectedKeys, and the saved slot list untouched.
  const resetAll = useCallback(() => {
    setStore((prev) => {
      const p = typeof prev === 'function' ? prev() : prev;
      const cur = p.slots[p.active];
      const keyColors = {};
      const activeColor = computeActiveColor(cur.selectedKeys, keyColors, cur.activeColor);
      const newSlots = [...p.slots];
      newSlots[p.active] = {
        ...cur,
        keyColors,
        caseColor: DEFAULT_CASE_COLOR,
        activeColor,
      };
      return { ...p, slots: newSlots };
    });
  }, [setStore]);

  // Overwrites keyColors, caseColor, and caseFinish from a preset. Zone colors
  // are mapped onto every key in the current layout that belongs to that zone.
  const applyPreset = useCallback(
    (preset) => {
      setStore((prev) => {
        const p = typeof prev === 'function' ? prev() : prev;
        const cur = p.slots[p.active];
        const layoutKeys = layouts[cur.layout] ?? [];
        const keyColors = {};
        for (const k of layoutKeys) {
          const zoneColor = preset.zones[k.zone];
          if (zoneColor) keyColors[k.id] = zoneColor;
        }
        const activeColor = computeActiveColor(cur.selectedKeys, keyColors, cur.activeColor);
        const newSlots = [...p.slots];
        newSlots[p.active] = {
          ...cur,
          keyColors,
          caseColor: preset.caseColor,
          caseFinish: preset.caseFinish,
          activeColor,
        };
        return { ...p, slots: newSlots };
      });
    },
    [setStore],
  );

  // Applies a validated imported colorway (V2 §9) onto the active slot,
  // overwriting layout, case, key colors, and name. Selection is cleared.
  const importColorway = useCallback(
    (data) => {
      setStore((prev) => {
        const p = typeof prev === 'function' ? prev() : prev;
        const cur = p.slots[p.active];
        const keyColors = { ...data.keyColors };
        const selectedKeys = [];
        const activeColor = computeActiveColor(selectedKeys, keyColors, cur.activeColor);
        const newSlots = [...p.slots];
        newSlots[p.active] = {
          ...cur,
          layout: data.layout,
          caseColor: data.caseColor ?? cur.caseColor,
          caseFinish: data.caseFinish ?? cur.caseFinish,
          keyColors,
          colorwayName: data.name ?? cur.colorwayName,
          selectedKeys,
          activeColor,
        };
        return { ...p, slots: newSlots };
      });
    },
    [setStore],
  );

  // Slot management
  const saveSlot = useCallback(
    (index, name) => {
      setStore((prev) => {
        const p = typeof prev === 'function' ? prev() : prev;
        const newSlots = [...p.slots];
        if (index < MAX_SLOTS) {
          newSlots[index] = { ...p.slots[p.active], colorwayName: name };
        }
        return { ...p, slots: newSlots };
      });
    },
    [setStore],
  );

  const loadSlot = useCallback(
    (index) => {
      setStore((prev) => {
        const p = typeof prev === 'function' ? prev() : prev;
        if (index >= 0 && index < p.slots.length) {
          return { ...p, active: index };
        }
        return p;
      });
    },
    [setStore],
  );

  const createSlot = useCallback(() => {
    setStore((prev) => {
      const p = typeof prev === 'function' ? prev() : prev;
      if (p.slots.length >= MAX_SLOTS) return p;
      const newSlots = [...p.slots, { ...DEFAULT_STATE }];
      return { active: newSlots.length - 1, slots: newSlots };
    });
  }, [setStore]);

  const actions = useMemo(
    () => ({
      setLayout,
      setActiveColor,
      applyColorToSelected,
      toggleKeySelected,
      clearSelection,
      selectZone,
      setCaseColor,
      setCaseFinish,
      setWorkspace,
      resetSelectedKeys,
      resetAll,
      applyPreset,
      importColorway,
      addColorsToHistory,
      clearColorHistory,
      saveSlot,
      loadSlot,
      createSlot,
    }),
    [
      setLayout, setActiveColor, applyColorToSelected, toggleKeySelected,
      clearSelection, selectZone, setCaseColor, setCaseFinish, setWorkspace,
      resetSelectedKeys, resetAll, applyPreset, importColorway,
      addColorsToHistory, clearColorHistory,
      saveSlot, loadSlot, createSlot,
    ],
  );

  return { state, slots, activeSlot: active, actions };
}
