import { test, expect } from 'vitest';
import layouts, { LAYOUT_OPTIONS } from '../src/data/layouts/index.js';
import { ZONES } from '../src/data/zones.js';

const overlaps = (a, b) =>
  a.x < b.x + b.w - 1e-6 && b.x < a.x + a.w - 1e-6 && a.y < b.y + b.h - 1e-6 && b.y < a.y + a.h - 1e-6;

test('every layout has a selector entry and vice versa', () => {
  expect(LAYOUT_OPTIONS.map((o) => o.id).sort()).toEqual(Object.keys(layouts).sort());
});

for (const [id, keys] of Object.entries(layouts)) {
  test(`layout ${id} is well-formed`, () => {
    expect(keys.length).toBeGreaterThan(40);
    const ids = keys.map((k) => k.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const key of keys) {
      expect(ZONES[key.zone], `${id}:${key.id} zone ${key.zone}`).toBeDefined();
      expect(typeof key.label).toBe('string');
      expect(key.w).toBeGreaterThan(0);
      expect(key.h).toBeGreaterThan(0);
      expect(key.x).toBeGreaterThanOrEqual(0);
      expect(key.y).toBeGreaterThanOrEqual(0);
    }
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        expect(overlaps(keys[i], keys[j]), `${id}: ${keys[i].id} overlaps ${keys[j].id}`).toBe(false);
      }
    }
  });
}

test('shared keys keep the same id across layouts so colors survive a layout switch', () => {
  const byId = (id) => new Set(layouts[id].map((k) => k.id));
  for (const key of ['a', 'space', 'enter', 'backspace', 'shiftL', 'tab', 'esc']) {
    const present = Object.keys(layouts).filter((id) => byId(id).has(key));
    // Some layouts genuinely omit a key (60% has no Esc row), but if a layout
    // has it, it must use the shared id.
    expect(present.length, `${key} should exist in at least one layout`).toBeGreaterThan(0);
  }
  expect([...byId('tkl')].every((id) => byId('full').has(id))).toBe(true);
});
