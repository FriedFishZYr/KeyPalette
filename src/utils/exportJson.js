// Versioned, editable design files. Validate before changing the active design.
import { isValidHex } from './colorUtils.js';

const VALID_LAYOUTS = ['60', '65', '75', 'tkl', 'full'];
const VALID_PROFILES = ['flat', 'sa', 'oem', 'cherry', 'dsa'];
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export function serializeColorway(state) {
  return {
    version: 3,
    name: state.colorwayName,
    layout: state.layout,
    caseColor: state.caseColor,
    caseFinish: state.caseFinish,
    profile: state.profile,
    legendColor: state.legendColor,
    legendPosition: state.legendPosition,
    keyColors: { ...state.keyColors },
    exportedAt: new Date().toISOString(),
  };
}

export function deserializeColorway(raw) {
  let data = raw;
  if (typeof raw === 'string') {
    try { data = JSON.parse(raw); }
    catch { throw new Error('This file could not be read. Choose a KeyPalette design file.'); }
  }
  if (!isRecord(data)) throw new Error('File does not contain a design.');
  if (![1, 2, 3].includes(data.version)) throw new Error('Unsupported design file version.');
  if (!VALID_LAYOUTS.includes(data.layout)) throw new Error('Unsupported or missing keyboard layout.');
  if (!isRecord(data.keyColors) || Object.values(data.keyColors).some((color) => typeof color !== 'string' || !isValidHex(color))) {
    throw new Error('The design contains invalid key colors.');
  }
  if (data.name != null && (typeof data.name !== 'string' || data.name.length > 80)) throw new Error('Design names must be text with at most 80 characters.');
  const caseColor = data.caseColor ?? '#1a1a1a';
  const caseFinish = data.caseFinish ?? 'matte';
  const profile = data.profile ?? 'flat';
  const legendColor = data.legendColor ?? 'auto';
  const legendPosition = data.legendPosition ?? 'top';
  if (typeof caseColor !== 'string' || !isValidHex(caseColor)) throw new Error('Invalid case color.');
  if (!['matte', 'gloss'].includes(caseFinish)) throw new Error('Unsupported case finish.');
  if (!VALID_PROFILES.includes(profile)) throw new Error('Unsupported keycap profile.');
  if (legendColor !== 'auto' && (typeof legendColor !== 'string' || !isValidHex(legendColor))) throw new Error('Invalid lettering color.');
  if (!['top', 'front'].includes(legendPosition)) throw new Error('Unsupported lettering position.');
  return { version: data.version, name: data.name?.trim() || 'Untitled', layout: data.layout,
    keyColors: Object.fromEntries(Object.entries(data.keyColors).map(([id, color]) => [id, color.toLowerCase()])),
    caseColor: caseColor.toLowerCase(), caseFinish, profile, legendColor, legendPosition };
}

export function downloadColorway(state) {
  const json = JSON.stringify(serializeColorway(state), null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugify(state.colorwayName)}-${state.layout}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Embedded browsers may hand the download off asynchronously. Keep the
  // blob alive until that handoff has had a chance to consume it.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function slugify(name) {
  return (name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'colorway';
}
