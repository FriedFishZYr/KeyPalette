import test from 'node:test';
import assert from 'node:assert/strict';
import { deserializeColorway, serializeColorway } from '../src/utils/exportJson.js';

const legacy = { version: 1, name: 'Old design', layout: 'tkl', keyColors: { KeyA: '#AABBCC' } };

test('legacy files receive defaults and normalized colors', () => {
  const design = deserializeColorway(JSON.stringify(legacy));
  assert.equal(design.profile, 'flat');
  assert.equal(design.legendColor, 'auto');
  assert.equal(design.caseColor, '#1a1a1a');
  assert.equal(design.keyColors.KeyA, '#aabbcc');
});

test('current editable designs round-trip without losing visual properties', () => {
  const state = { colorwayName: 'Night', layout: '65', caseColor: '#123456', caseFinish: 'gloss', keyColors: { KeyA: '#abcdef' }, profile: 'sa', legendColor: '#ffffff', legendPosition: 'front' };
  const restored = deserializeColorway(JSON.stringify(serializeColorway(state)));
  assert.equal(restored.name, state.colorwayName);
  for (const field of ['layout', 'caseColor', 'caseFinish', 'keyColors', 'profile', 'legendColor', 'legendPosition']) assert.deepEqual(restored[field], state[field]);
});

test('malformed or unsupported designs are rejected before use', () => {
  for (const raw of ['{broken', 'null', '[]',
    { ...legacy, version: 99 }, { ...legacy, layout: 'unknown' },
    { ...legacy, keyColors: [] }, { ...legacy, keyColors: { KeyA: 123 } },
    { ...legacy, keyColors: { KeyA: 'red' } }, { ...legacy, name: {} },
    { ...legacy, caseColor: '#zzz' }, { ...legacy, profile: 'unknown' },
    { ...legacy, legendColor: 42 }, { ...legacy, legendPosition: 'side' },
    { ...legacy, caseFinish: 'metal' },
  ]) assert.throws(() => deserializeColorway(raw));
});
