// Derives the ISO variant of an ANSI layout: a tall L-shaped Enter, a 1u key
// left of it on the home row (#), a 1.25u left Shift, and the extra key
// between Shift and Z. Row positions come from the ANSI keys themselves so
// this works for every board size.
export default function toIso(ansiKeys) {
  const backslash = ansiKeys.find((k) => k.id === 'backslash');
  const enter = ansiKeys.find((k) => k.id === 'enter');
  const shiftL = ansiKeys.find((k) => k.id === 'shiftL');
  if (!backslash || !enter || !shiftL) throw new Error('ISO conversion needs backslash, enter, and shiftL keys');
  const rest = ansiKeys.filter((k) => !['backslash', 'enter', 'shiftL'].includes(k.id));
  const x0 = shiftL.x; // left edge of the main block
  return [
    ...rest,
    { id: 'enter', label: 'Enter', x: x0 + 13.75, y: backslash.y, w: 1.25, h: 2, zone: 'modifier', shape: 'isoEnter', lip: 0.25 },
    { id: 'hash', label: '#', x: x0 + 12.75, y: enter.y, w: 1, h: 1, zone: 'alpha' },
    { id: 'shiftL', label: 'Shift', x: x0, y: shiftL.y, w: 1.25, h: 1, zone: 'modifier' },
    { id: 'backslash', label: '\\', x: x0 + 1.25, y: shiftL.y, w: 1, h: 1, zone: 'alpha' },
  ];
}
