// Saved-design store: defaults, lenient validation of what localStorage hands
// back, and backup helpers. File import stays strict (see exportJson.js); the
// store is forgiving so one bad value never wipes a whole design.
import layouts from '../data/layouts/index.js';
import { PROFILES } from '../data/profiles.js';
import { isValidHex } from './colorUtils.js';
import { downloadText, dateStamp } from './download.js';

export const STORAGE_KEY = 'keypalette-slots';
export const HISTORY_KEY = 'keypalette-color-history';
export const STORAGE_PREFIX = 'keypalette';
export const MAX_SLOTS = 5;
export const MAX_NAME_LENGTH = 80;

// Every key starts at and resets to this color. Kept in sync with the render
// fallback in Keyboard.jsx.
export const DEFAULT_KEY_COLOR = '#e0e0e0';
export const DEFAULT_CASE_COLOR = '#1a1a1a';

export const DEFAULT_STATE = Object.freeze({
  layout: 'tkl',
  caseColor: DEFAULT_CASE_COLOR,
  caseFinish: 'matte',
  keyColors: {},
  selectedKeys: [],
  activeColor: '#cccccc',
  colorwayName: 'Untitled',
  workspace: 'light',
  profile: 'flat', // "flat" (default, clean 2D) | "sa" | "oem" | "cherry" | "dsa"
  legendColor: 'auto', // "auto" | "#rrggbb"
  legendPosition: 'top', // "top" | "front"
});

export function buildInitialSlots() {
  return { active: 0, slots: [{ ...DEFAULT_STATE }] };
}

const isHex = (value) => typeof value === 'string' && isValidHex(value);
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

// Returns a clean slot plus whether any present-but-invalid value had to be
// dropped. Fields that are simply absent (older saves) take defaults silently.
export function sanitizeSlot(raw) {
  if (!isRecord(raw)) return { slot: { ...DEFAULT_STATE }, repaired: raw !== undefined };
  let repaired = false;
  const field = (key, valid, normalize = (value) => value) => {
    if (raw[key] === undefined) return DEFAULT_STATE[key];
    if (valid(raw[key])) return normalize(raw[key]);
    repaired = true;
    return DEFAULT_STATE[key];
  };
  const slot = {
    layout: field('layout', (v) => Boolean(layouts[v])),
    caseColor: field('caseColor', isHex, (v) => v.toLowerCase()),
    caseFinish: field('caseFinish', (v) => v === 'matte' || v === 'gloss'),
    profile: field('profile', (v) => Boolean(PROFILES[v])),
    legendColor: field('legendColor', (v) => v === 'auto' || isHex(v), (v) => (v === 'auto' ? v : v.toLowerCase())),
    legendPosition: field('legendPosition', (v) => v === 'top' || v === 'front'),
    colorwayName: field('colorwayName', (v) => typeof v === 'string' && v.length <= MAX_NAME_LENGTH, (v) => v.trim() || 'Untitled'),
    workspace: field('workspace', (v) => v === 'light' || v === 'dark'),
    activeColor: field('activeColor', (v) => v === null || isHex(v), (v) => (v === null ? null : v.toLowerCase())),
    keyColors: {},
    selectedKeys: [],
  };
  if (raw.keyColors !== undefined) {
    if (isRecord(raw.keyColors)) {
      for (const [id, color] of Object.entries(raw.keyColors)) {
        if (isHex(color)) slot.keyColors[id] = color.toLowerCase();
        else repaired = true;
      }
    } else {
      repaired = true;
    }
  }
  return { slot, repaired };
}

// Validates the whole persisted store. Always returns something usable.
export function normalizeStore(saved) {
  const usable = isRecord(saved) && Array.isArray(saved.slots);
  if (!usable || saved.slots.length === 0) {
    return { store: buildInitialSlots(), repaired: saved !== undefined && saved !== null && !usable };
  }
  const results = saved.slots.slice(0, MAX_SLOTS).map(sanitizeSlot);
  const slots = results.map((r) => r.slot);
  const active = Number.isInteger(saved.active) && saved.active >= 0 && saved.active < slots.length ? saved.active : 0;
  const repaired = results.some((r) => r.repaired) || saved.slots.length > MAX_SLOTS;
  return { store: { active, slots }, repaired };
}

// "Name copy", then "Name copy 2", … keeping within the name length limit.
export function nextCopyName(name, existingNames = []) {
  const base = `${(name || 'Untitled').trim()} copy`.slice(0, MAX_NAME_LENGTH - 3);
  const taken = new Set(existingNames);
  if (!taken.has(base)) return base;
  for (let n = 2; n < 100; n++) {
    const candidate = `${base} ${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  return base;
}

// Everything KeyPalette has stored in this browser, as one JSON file. `extra`
// lets callers include data that is only held in memory (e.g. unreadable raw
// storage captured at startup).
export function collectStorageBackup(extra = null) {
  const entries = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) entries[key] = localStorage.getItem(key);
    }
  } catch {
    // Storage unavailable: still return whatever the caller handed us.
  }
  return { app: 'KeyPalette', exportedAt: new Date().toISOString(), entries, extra };
}

export function downloadStorageBackup(extra = null) {
  const backup = collectStorageBackup(extra);
  downloadText(JSON.stringify(backup, null, 2), `keypalette-backup-${dateStamp()}.json`, 'application/json');
}
