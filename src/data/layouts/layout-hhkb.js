// HHKB-style 60% — 60 keys, 15u × 5 rows: split backspace, Control on the
// home row, split right Shift with Fn, and blockers either side of the
// bottom row.
const row = (y, keys) => keys.map(([id, label, x, w = 1, zone = 'alpha']) => ({ id, label, x, y, w, h: 1, zone }));

const layoutHhkb = [
  ...row(0, [
    ['esc', 'Esc', 0, 1, 'function'],
    ['1', '1', 1, 1, 'number'], ['2', '2', 2, 1, 'number'], ['3', '3', 3, 1, 'number'], ['4', '4', 4, 1, 'number'],
    ['5', '5', 5, 1, 'number'], ['6', '6', 6, 1, 'number'], ['7', '7', 7, 1, 'number'], ['8', '8', 8, 1, 'number'],
    ['9', '9', 9, 1, 'number'], ['0', '0', 10, 1, 'number'], ['minus', '-', 11, 1, 'number'], ['equal', '=', 12, 1, 'number'],
    ['backslash', '\\', 13, 1], ['grave', '`', 14, 1, 'number'],
  ]),
  ...row(1, [
    ['tab', 'Tab', 0, 1.5, 'modifier'],
    ['q', 'Q', 1.5], ['w', 'W', 2.5], ['e', 'E', 3.5], ['r', 'R', 4.5], ['t', 'T', 5.5], ['y', 'Y', 6.5],
    ['u', 'U', 7.5], ['i', 'I', 8.5], ['o', 'O', 9.5], ['p', 'P', 10.5], ['bracketL', '[', 11.5], ['bracketR', ']', 12.5],
    ['backspace', 'Delete', 13.5, 1.5, 'modifier'],
  ]),
  ...row(2, [
    ['ctrlL', 'Ctrl', 0, 1.75, 'modifier'],
    ['a', 'A', 1.75], ['s', 'S', 2.75], ['d', 'D', 3.75], ['f', 'F', 4.75], ['g', 'G', 5.75], ['h', 'H', 6.75],
    ['j', 'J', 7.75], ['k', 'K', 8.75], ['l', 'L', 9.75], ['semicolon', ';', 10.75], ['quote', "'", 11.75],
    ['enter', 'Enter', 12.75, 2.25, 'modifier'],
  ]),
  ...row(3, [
    ['shiftL', 'Shift', 0, 2.25, 'modifier'],
    ['z', 'Z', 2.25], ['x', 'X', 3.25], ['c', 'C', 4.25], ['v', 'V', 5.25], ['b', 'B', 6.25], ['n', 'N', 7.25],
    ['m', 'M', 8.25], ['comma', ',', 9.25], ['period', '.', 10.25], ['slash', '/', 11.25],
    ['shiftR', 'Shift', 12.25, 1.75, 'modifier'], ['fn', 'Fn', 14, 1, 'modifier'],
  ]),
  ...row(4, [
    ['winL', 'OS', 1.5, 1, 'modifier'], ['altL', 'Alt', 2.5, 1.5, 'modifier'],
    ['space', 'Space', 4, 6, 'alpha'],
    ['altR', 'Alt', 10, 1.5, 'modifier'], ['winR', 'OS', 11.5, 1, 'modifier'],
  ]),
];

export default layoutHhkb;
