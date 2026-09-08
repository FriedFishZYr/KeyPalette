// 96% / "1800 compact" — 99 keys, 19u × 6 rows. Full-size features (function
// row, arrows, numpad) with the nav cluster folded into the top row and the
// arrows tucked under a 1.75u right Shift.
const row = (y, keys) => keys.map(([id, label, x, w = 1, zone = 'alpha', h = 1]) => ({ id, label, x, y, w, h, zone }));

const layout96 = [
  ...row(0, [
    ['esc', 'Esc', 0, 1, 'function'],
    ['f1', 'F1', 1, 1, 'function'], ['f2', 'F2', 2, 1, 'function'], ['f3', 'F3', 3, 1, 'function'], ['f4', 'F4', 4, 1, 'function'],
    ['f5', 'F5', 5, 1, 'function'], ['f6', 'F6', 6, 1, 'function'], ['f7', 'F7', 7, 1, 'function'], ['f8', 'F8', 8, 1, 'function'],
    ['f9', 'F9', 9, 1, 'function'], ['f10', 'F10', 10, 1, 'function'], ['f11', 'F11', 11, 1, 'function'], ['f12', 'F12', 12, 1, 'function'],
    ['delete', 'Del', 13, 1, 'navigation'], ['home', 'Home', 14, 1, 'navigation'], ['end', 'End', 15, 1, 'navigation'],
    ['pgup', 'PgUp', 16, 1, 'navigation'], ['pgdn', 'PgDn', 17, 1, 'navigation'],
  ]),
  ...row(1, [
    ['grave', '`', 0, 1, 'number'],
    ['1', '1', 1, 1, 'number'], ['2', '2', 2, 1, 'number'], ['3', '3', 3, 1, 'number'], ['4', '4', 4, 1, 'number'],
    ['5', '5', 5, 1, 'number'], ['6', '6', 6, 1, 'number'], ['7', '7', 7, 1, 'number'], ['8', '8', 8, 1, 'number'],
    ['9', '9', 9, 1, 'number'], ['0', '0', 10, 1, 'number'], ['minus', '-', 11, 1, 'number'], ['equal', '=', 12, 1, 'number'],
    ['backspace', 'Backspace', 13, 2, 'modifier'],
    ['numlock', 'Num', 15, 1, 'numpad'], ['numSlash', '/', 16, 1, 'numpad'], ['numStar', '*', 17, 1, 'numpad'], ['numMinus', '-', 18, 1, 'numpad'],
  ]),
  ...row(2, [
    ['tab', 'Tab', 0, 1.5, 'modifier'],
    ['q', 'Q', 1.5], ['w', 'W', 2.5], ['e', 'E', 3.5], ['r', 'R', 4.5], ['t', 'T', 5.5], ['y', 'Y', 6.5],
    ['u', 'U', 7.5], ['i', 'I', 8.5], ['o', 'O', 9.5], ['p', 'P', 10.5], ['bracketL', '[', 11.5], ['bracketR', ']', 12.5],
    ['backslash', '\\', 13.5, 1.5],
    ['num7', '7', 15, 1, 'numpad'], ['num8', '8', 16, 1, 'numpad'], ['num9', '9', 17, 1, 'numpad'], ['numPlus', '+', 18, 1, 'numpad', 2],
  ]),
  ...row(3, [
    ['capslock', 'Caps Lock', 0, 1.75, 'modifier'],
    ['a', 'A', 1.75], ['s', 'S', 2.75], ['d', 'D', 3.75], ['f', 'F', 4.75], ['g', 'G', 5.75], ['h', 'H', 6.75],
    ['j', 'J', 7.75], ['k', 'K', 8.75], ['l', 'L', 9.75], ['semicolon', ';', 10.75], ['quote', "'", 11.75],
    ['enter', 'Enter', 12.75, 2.25, 'modifier'],
    ['num4', '4', 15, 1, 'numpad'], ['num5', '5', 16, 1, 'numpad'], ['num6', '6', 17, 1, 'numpad'],
  ]),
  ...row(4, [
    ['shiftL', 'Shift', 0, 2.25, 'modifier'],
    ['z', 'Z', 2.25], ['x', 'X', 3.25], ['c', 'C', 4.25], ['v', 'V', 5.25], ['b', 'B', 6.25], ['n', 'N', 7.25],
    ['m', 'M', 8.25], ['comma', ',', 9.25], ['period', '.', 10.25], ['slash', '/', 11.25],
    ['shiftR', 'Shift', 12.25, 1.75, 'modifier'],
    ['up', '↑', 14, 1, 'arrow'],
    ['num1', '1', 15, 1, 'numpad'], ['num2', '2', 16, 1, 'numpad'], ['num3', '3', 17, 1, 'numpad'], ['numEnter', 'Enter', 18, 1, 'numpad', 2],
  ]),
  ...row(5, [
    ['ctrlL', 'Ctrl', 0, 1.25, 'modifier'], ['winL', 'Win', 1.25, 1.25, 'modifier'], ['altL', 'Alt', 2.5, 1.25, 'modifier'],
    ['space', 'Space', 3.75, 6.25, 'alpha'],
    ['altR', 'Alt', 10, 1, 'modifier'], ['fn', 'Fn', 11, 1, 'modifier'], ['ctrlR', 'Ctrl', 12, 1, 'modifier'],
    ['left', '←', 13, 1, 'arrow'], ['down', '↓', 14, 1, 'arrow'], ['right', '→', 15, 1, 'arrow'],
    ['num0', '0', 16, 1, 'numpad'], ['numDot', '.', 17, 1, 'numpad'],
  ]),
];

export default layout96;
