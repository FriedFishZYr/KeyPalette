// Only design changes enter history. Selection, picker drafts, and workspace
// preferences remain live; each saved design owns its own session history.
const FIELDS = ['layout', 'keyColors', 'caseColor', 'caseFinish', 'profile',
  'legendColor', 'legendPosition', 'colorwayName'];
const LIMIT = 50;

const snapshot = (slot) => Object.fromEntries(FIELDS.map((key) => [key, slot[key]]));
const equal = (a, b) => JSON.stringify(snapshot(a)) === JSON.stringify(snapshot(b));
const empty = () => ({ past: [], future: [] });

export function initialHistory(present) {
  return { present, histories: {}, grouping: false, recorded: false };
}

// Removing a design shifts every later design down one index, so their
// histories move with them. The active design stays active unless it was the
// one removed, in which case its nearest neighbour takes over. The last
// remaining design cannot be removed.
function deleteSlot(state, index) {
  const { slots, active } = state.present;
  if (!Number.isInteger(index) || index < 0 || index >= slots.length || slots.length <= 1) return state;
  const nextSlots = slots.filter((_, i) => i !== index);
  const nextActive = active > index ? active - 1 : Math.min(active, nextSlots.length - 1);
  const histories = {};
  for (const [key, value] of Object.entries(state.histories)) {
    const i = Number(key);
    if (i === index) continue;
    histories[i > index ? i - 1 : i] = value;
  }
  return {
    present: { ...state.present, active: nextActive, slots: nextSlots },
    histories, grouping: false, recorded: false,
  };
}

export function designHistoryReducer(state, action) {
  if (action.type === 'begin') return { ...state, grouping: true, recorded: false };
  if (action.type === 'end') return { ...state, grouping: false, recorded: false };
  if (action.type === 'deleteSlot') return deleteSlot(state, action.index);
  const index = state.present.active;
  const history = state.histories[index] ?? empty();
  if (action.type === 'undo' || action.type === 'redo') {
    const undo = action.type === 'undo';
    const source = undo ? history.past : history.future;
    if (!source.length) return state;
    const current = state.present.slots[index];
    const target = source.at(-1);
    const selectedKeys = current.layout === target.layout ? current.selectedKeys : [];
    const colors = selectedKeys.map((id) => target.keyColors[id] ?? '#e0e0e0');
    const activeColor = colors.length
      ? colors.every((color) => color === colors[0]) ? colors[0] : null
      : current.activeColor;
    const slots = [...state.present.slots];
    slots[index] = { ...current, ...target, selectedKeys, activeColor };
    const next = undo
      ? { past: source.slice(0, -1), future: [...history.future, snapshot(current)] }
      : { past: [...history.past, snapshot(current)], future: source.slice(0, -1) };
    return { present: { ...state.present, slots }, histories: { ...state.histories, [index]: next }, grouping: false, recorded: false };
  }
  if (action.type !== 'update') return state;
  const present = typeof action.update === 'function' ? action.update(state.present) : action.update;
  if (present === state.present) return state;
  if (present.active !== index) {
    return { ...state, present, grouping: false, recorded: false };
  }
  const before = state.present.slots[index];
  const after = present.slots[index];
  if (equal(before, after)) return { ...state, present };
  const past = state.grouping && state.recorded
    ? history.past : [...history.past, snapshot(before)].slice(-LIMIT);
  return {
    ...state, present,
    histories: { ...state.histories, [index]: { past, future: [] } },
    recorded: state.grouping,
  };
}
