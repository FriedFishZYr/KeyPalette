// Versioned, editable design files. Validate before changing the active design.
import layouts from '../data/layouts/index.js';
import { PROFILES } from '../data/profiles.js';
import { isValidHex } from './colorUtils.js';
import { downloadText, slugify } from './download.js';

export const FILE_VERSION = 3;
const SUPPORTED_VERSIONS = [1, 2, 3];
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export function serializeColorway(state) {
  return {
    version: FILE_VERSION,
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
  if (!SUPPORTED_VERSIONS.includes(data.version)) throw new Error('Unsupported design file version.');
  if (!layouts[data.layout]) throw new Error('Unsupported or missing keyboard layout.');
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
  if (!PROFILES[profile]) throw new Error('Unsupported keycap profile.');
  if (legendColor !== 'auto' && (typeof legendColor !== 'string' || !isValidHex(legendColor))) throw new Error('Invalid lettering color.');
  if (!['top', 'front'].includes(legendPosition)) throw new Error('Unsupported lettering position.');
  return { version: data.version, name: data.name?.trim() || 'Untitled', layout: data.layout,
    keyColors: Object.fromEntries(Object.entries(data.keyColors).map(([id, color]) => [id, color.toLowerCase()])),
    caseColor: caseColor.toLowerCase(), caseFinish, profile, legendColor, legendPosition };
}

export function downloadColorway(state) {
  const json = JSON.stringify(serializeColorway(state), null, 2);
  downloadText(json, `${slugify(state.colorwayName)}-${state.layout}.json`, 'application/json');
}
