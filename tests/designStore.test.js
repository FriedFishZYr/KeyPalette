import { test, expect } from 'vitest';
import { sanitizeSlot, normalizeStore, nextCopyName, DEFAULT_STATE, MAX_SLOTS } from '../src/utils/designStore.js';

const good = {
  layout: '65', caseColor: '#ABCDEF', caseFinish: 'gloss', profile: 'sa', legendColor: '#FFFFFF',
  legendPosition: 'front', colorwayName: ' Night ', workspace: 'light', activeColor: null,
  keyColors: { a: '#AA0000', b: '#00bb00' }, selectedKeys: ['a'],
};

test('valid saved designs pass through with colors normalised and selection cleared', () => {
  const { slot, repaired } = sanitizeSlot(good);
  expect(repaired).toBe(false);
  expect(slot.caseColor).toBe('#abcdef');
  expect(slot.keyColors).toEqual({ a: '#aa0000', b: '#00bb00' });
  expect(slot.colorwayName).toBe('Night');
  expect(slot.selectedKeys).toEqual([]);
  expect(slot.activeColor).toBe(null);
});

test('invalid values fall back to defaults one field at a time and are reported', () => {
  const { slot, repaired } = sanitizeSlot({
    ...good, layout: 'nope', caseFinish: 'chrome', profile: 42, legendColor: 'red',
    keyColors: { a: '#123456', b: 'blue', c: 7 },
  });
  expect(repaired).toBe(true);
  expect(slot.layout).toBe(DEFAULT_STATE.layout);
  expect(slot.caseFinish).toBe('matte');
  expect(slot.profile).toBe('flat');
  expect(slot.legendColor).toBe('auto');
  expect(slot.keyColors).toEqual({ a: '#123456' });
  expect(slot.caseColor).toBe('#abcdef');
});

test('older saves without V3 fields take defaults without counting as repairs', () => {
  const { slot, repaired } = sanitizeSlot({ layout: 'tkl', keyColors: { q: '#ffffff' }, caseColor: '#111111' });
  expect(repaired).toBe(false);
  expect(slot.profile).toBe('flat');
  expect(slot.legendPosition).toBe('top');
  expect(slot.colorwayName).toBe('Untitled');
});

test('a store that is not a store becomes a fresh one', () => {
  expect(normalizeStore(undefined).store.slots).toHaveLength(1);
  expect(normalizeStore(undefined).repaired).toBe(false);
  expect(normalizeStore(42).repaired).toBe(true);
  expect(normalizeStore({ slots: [] }).repaired).toBe(false);
  const many = normalizeStore({ active: 9, slots: Array.from({ length: 7 }, () => ({ ...good })) });
  expect(many.store.slots).toHaveLength(MAX_SLOTS);
  expect(many.store.active).toBe(0);
  expect(many.repaired).toBe(true);
});

test('copy names stay unique and within the length limit', () => {
  expect(nextCopyName('Night', ['Night'])).toBe('Night copy');
  expect(nextCopyName('Night', ['Night', 'Night copy'])).toBe('Night copy 2');
  expect(nextCopyName('x'.repeat(80), []).length).toBeLessThanOrEqual(80);
  expect(nextCopyName('', [])).toBe('Untitled copy');
});
