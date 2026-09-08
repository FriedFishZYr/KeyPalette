// Planck-style 40% ortholinear — 47 keys on a 12 × 4 grid with a 2u space.
const row = (y, keys) => keys.map(([id, label, x, w = 1, zone = 'alpha']) => ({ id, label, x, y, w, h: 1, zone }));

const layoutPlanck = [
  ...row(0, [
    ['tab', 'Tab', 0, 1, 'modifier'],
    ['q', 'Q', 1], ['w', 'W', 2], ['e', 'E', 3], ['r', 'R', 4], ['t', 'T', 5], ['y', 'Y', 6],
    ['u', 'U', 7], ['i', 'I', 8], ['o', 'O', 9], ['p', 'P', 10],
    ['backspace', 'Bksp', 11, 1, 'modifier'],
  ]),
  ...row(1, [
    ['esc', 'Esc', 0, 1, 'function'],
    ['a', 'A', 1], ['s', 'S', 2], ['d', 'D', 3], ['f', 'F', 4], ['g', 'G', 5], ['h', 'H', 6],
    ['j', 'J', 7], ['k', 'K', 8], ['l', 'L', 9], ['semicolon', ';', 10], ['quote', "'", 11],
  ]),
  ...row(2, [
    ['shiftL', 'Shift', 0, 1, 'modifier'],
    ['z', 'Z', 1], ['x', 'X', 2], ['c', 'C', 3], ['v', 'V', 4], ['b', 'B', 5], ['n', 'N', 6],
    ['m', 'M', 7], ['comma', ',', 8], ['period', '.', 9], ['slash', '/', 10],
    ['enter', 'Enter', 11, 1, 'modifier'],
  ]),
  ...row(3, [
    ['hyper', 'Hyper', 0, 1, 'modifier'], ['ctrlL', 'Ctrl', 1, 1, 'modifier'], ['altL', 'Alt', 2, 1, 'modifier'],
    ['winL', 'OS', 3, 1, 'modifier'], ['fn', 'Lower', 4, 1, 'modifier'],
    ['space', 'Space', 5, 2, 'alpha'],
    ['fn2', 'Raise', 7, 1, 'modifier'],
    ['left', '←', 8, 1, 'arrow'], ['down', '↓', 9, 1, 'arrow'], ['up', '↑', 10, 1, 'arrow'], ['right', '→', 11, 1, 'arrow'],
  ]),
];

export default layoutPlanck;
