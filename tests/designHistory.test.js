import { test } from 'vitest';
import assert from 'node:assert/strict';
import { initialHistory, designHistoryReducer as reduce } from '../src/utils/designHistory.js';

const design = () => ({ layout: 'tkl', keyColors: {}, caseColor: '#1a1a1a', caseFinish: 'matte', profile: 'flat', legendColor: 'auto', legendPosition: 'top', colorwayName: 'Untitled', selectedKeys: ['KeyA'], activeColor: '#e0e0e0', workspace: 'dark' });
const initial = () => initialHistory({ active: 0, slots: [design(), design()] });
const edit = (state, patch) => reduce(state, { type: 'update', update: (present) => ({ ...present, slots: present.slots.map((slot, index) => index === present.active ? { ...slot, ...patch } : slot) }) });
const switchTo = (state, index) => reduce(state, { type: 'update', update: (present) => ({ ...present, active: index }) });

test('undo restores a color edit while preserving selection and workspace', () => {
  let state = edit(initial(), { keyColors: { KeyA: '#ff0000' } });
  state = edit(state, { selectedKeys: ['KeyA', 'KeyB'], workspace: 'light', activeColor: '#0000ff' });
  state = reduce(state, { type: 'undo' });
  assert.deepEqual(state.present.slots[0].keyColors, {});
  assert.deepEqual(state.present.slots[0].selectedKeys, ['KeyA', 'KeyB']);
  assert.equal(state.present.slots[0].workspace, 'light');
  assert.equal(state.present.slots[0].activeColor, '#e0e0e0');
  state = reduce(state, { type: 'redo' });
  assert.equal(state.present.slots[0].keyColors.KeyA, '#ff0000');
  assert.equal(state.present.slots[0].activeColor, null);
});

test('selection and picker drafts do not create history or discard redo', () => {
  let state = edit(initial(), { selectedKeys: ['KeyB'], activeColor: '#123456' });
  assert.deepEqual(state.histories, {});
  state = edit(state, { caseColor: '#ffffff' });
  state = reduce(state, { type: 'undo' });
  state = edit(state, { selectedKeys: [], activeColor: '#987654' });
  assert.equal(state.histories[0].future.length, 1);
  state = edit(state, { caseFinish: 'gloss' });
  assert.equal(state.histories[0].future.length, 0);
});

test('one continuous edit creates one undo step; a later edit remains separate', () => {
  let state = reduce(initial(), { type: 'begin' });
  state = edit(state, { caseColor: '#111111' });
  state = edit(state, { caseColor: '#222222' });
  state = edit(state, { caseColor: '#333333' });
  state = reduce(state, { type: 'end' });
  assert.equal(state.histories[0].past.length, 1);
  state = edit(state, { caseFinish: 'gloss' });
  state = reduce(state, { type: 'undo' });
  assert.equal(state.present.slots[0].caseColor, '#333333');
  state = reduce(state, { type: 'undo' });
  assert.equal(state.present.slots[0].caseColor, '#1a1a1a');
});

test('each saved design has independent undo and redo', () => {
  let state = edit(initial(), { caseColor: '#ffffff' });
  state = switchTo(state, 1);
  state = edit(state, { caseColor: '#ff0000' });
  state = reduce(state, { type: 'undo' });
  assert.equal(state.present.slots[1].caseColor, '#1a1a1a');
  assert.equal(state.present.slots[0].caseColor, '#ffffff');
  state = switchTo(state, 0);
  state = reduce(state, { type: 'undo' });
  assert.equal(state.present.slots[0].caseColor, '#1a1a1a');
  state = switchTo(state, 1);
  state = reduce(state, { type: 'redo' });
  assert.equal(state.present.slots[1].caseColor, '#ff0000');
});

test('layout changes and preset/import-sized edits restore as one step', () => {
  let state = edit(initial(), { layout: '60', selectedKeys: [], keyColors: { KeyA: '#123456' }, caseColor: '#234567', colorwayName: 'Imported' });
  state = reduce(state, { type: 'undo' });
  assert.equal(state.present.slots[0].layout, 'tkl');
  assert.equal(state.present.slots[0].colorwayName, 'Untitled');
  assert.deepEqual(state.present.slots[0].keyColors, {});
  assert.deepEqual(state.present.slots[0].selectedKeys, []);
});

test('history is bounded and unchanged designs do not add steps', () => {
  let state = initial();
  for (let i = 0; i < 60; i++) state = edit(state, { colorwayName: `Design ${i}` });
  assert.equal(state.histories[0].past.length, 50);
  state = edit(state, { colorwayName: 'Design 59' });
  assert.equal(state.histories[0].past.length, 50);
  for (let i = 0; i < 51; i++) state = reduce(state, { type: 'undo' });
  assert.equal(state.present.slots[0].colorwayName, 'Design 9');
});

test('deleting a design shifts later histories down and keeps a sensible active design', () => {
  let state = initialHistory({ active: 0, slots: [design(), design(), design()] });
  state = edit(state, { caseColor: '#111111' });
  state = switchTo(state, 2);
  state = edit(state, { caseColor: '#222222' });
  state = reduce(state, { type: 'deleteSlot', index: 1 });
  assert.equal(state.present.slots.length, 2);
  assert.equal(state.present.active, 1);
  assert.equal(state.histories[1].past.length, 1);
  state = reduce(state, { type: 'undo' });
  assert.equal(state.present.slots[1].caseColor, '#1a1a1a');
  // Deleting the active, last design falls back to its neighbour.
  state = reduce(state, { type: 'deleteSlot', index: 1 });
  assert.equal(state.present.active, 0);
  assert.equal(state.present.slots[0].caseColor, '#111111');
  // The last remaining design and out-of-range indexes are ignored.
  assert.equal(reduce(state, { type: 'deleteSlot', index: 0 }), state);
  assert.equal(reduce(state, { type: 'deleteSlot', index: 5 }), state);
});
