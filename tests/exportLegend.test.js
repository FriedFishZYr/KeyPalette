import { test, expect } from 'vitest';
import { collectZones, layoutLegend } from '../src/utils/exportPng.js';

test('legend lists each zone once with its distinct colors in first-seen order', () => {
  const zones = collectZones('60', { q: '#FF0000', w: '#ff0000', a: '#00ff00', tab: '#0000ff' });
  // Layout order: Q is the first typing key, E is the first untouched one, A comes later.
  const alpha = zones.find((z) => z.label === 'Typing keys');
  expect(alpha.colors).toEqual(['#ff0000', '#e0e0e0', '#00ff00']);
  // Backspace (row 0) precedes Tab in layout order.
  expect(zones.find((z) => z.label === 'Modifiers').colors).toEqual(['#e0e0e0', '#0000ff']);
  expect(zones.some((z) => z.label === 'Numpad')).toBe(false);
});

test('legend rows wrap to the available width and report their height', () => {
  const zones = [{ label: 'A', colors: Array.from({ length: 10 }, (_, i) => `#0000${i}0`) }, { label: 'B', colors: ['#111111'] }];
  const wide = layoutLegend(zones, 1000);
  const narrow = layoutLegend(zones, 200);
  expect(narrow.height).toBeGreaterThan(wide.height);
  expect(narrow.blocks[1].y).toBeGreaterThan(wide.blocks[1].y);
  expect(layoutLegend([], 500).height).toBe(0);
});
