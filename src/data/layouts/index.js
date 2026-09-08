import layout60 from './layout-60.js';
import layout65 from './layout-65.js';
import layout75 from './layout-75.js';
import layoutTkl from './layout-tkl.js';
import layoutFull from './layout-full.js';
import layoutHhkb from './layout-hhkb.js';
import layout96 from './layout-96.js';
import layoutPlanck from './layout-planck.js';
import toIso from './iso.js';

// Key ids are shared across layouts wherever the physical key is the same, so
// colors survive switching layouts and JSON files stay portable.
const layouts = {
  '60': layout60,
  '65': layout65,
  '75': layout75,
  'tkl': layoutTkl,
  'full': layoutFull,
  '60-iso': toIso(layout60),
  '65-iso': toIso(layout65),
  '75-iso': toIso(layout75),
  'tkl-iso': toIso(layoutTkl),
  'full-iso': toIso(layoutFull),
  'hhkb': layoutHhkb,
  '96': layout96,
  'planck': layoutPlanck,
};

export default layouts;

// Display metadata for selectors and labels, in menu order.
export const LAYOUT_OPTIONS = [
  { id: '60', label: '60%', detail: 'Compact', group: 'ANSI' },
  { id: '65', label: '65%', detail: 'With arrows', group: 'ANSI' },
  { id: '75', label: '75%', detail: 'Compact function row', group: 'ANSI' },
  { id: 'tkl', label: 'TKL', detail: 'No numpad', group: 'ANSI' },
  { id: 'full', label: 'Full-size', detail: 'With numpad', group: 'ANSI' },
  { id: '60-iso', label: '60% ISO', detail: 'Compact', group: 'ISO' },
  { id: '65-iso', label: '65% ISO', detail: 'With arrows', group: 'ISO' },
  { id: '75-iso', label: '75% ISO', detail: 'Compact function row', group: 'ISO' },
  { id: 'tkl-iso', label: 'TKL ISO', detail: 'No numpad', group: 'ISO' },
  { id: 'full-iso', label: 'Full-size ISO', detail: 'With numpad', group: 'ISO' },
  { id: 'hhkb', label: 'HHKB', detail: 'Split backspace, blocked corners', group: 'Other' },
  { id: '96', label: '96%', detail: 'Compact full-size', group: 'Other' },
  { id: 'planck', label: 'Planck', detail: '40% ortholinear', group: 'Other' },
];

export function layoutLabel(id) {
  return LAYOUT_OPTIONS.find((option) => option.id === id)?.label ?? id;
}
