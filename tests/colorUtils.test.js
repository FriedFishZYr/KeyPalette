import { test } from 'vitest';
import assert from 'node:assert/strict';
import { contrastRatio, contrastText } from '../src/utils/colorUtils.js';

test('contrast ratio matches the WCAG extremes', () => {
  assert.equal(contrastRatio('#000000', '#ffffff'), 21);
  assert.equal(contrastRatio('#777777', '#777777'), 1);
});

test('auto lettering is dark on light and mid tones', () => {
  for (const hex of ['#ffffff', '#e0e0e0', '#cccccc', '#d4a24c', '#c8a96e', '#808080', '#ffcc00']) {
    assert.equal(contrastText(hex), '#000000', hex);
  }
});

test('auto lettering is light on dark tones', () => {
  for (const hex of ['#000000', '#1a1a1a', '#2e3440', '#5e4b8b', '#0000ff', '#b22222']) {
    assert.equal(contrastText(hex), '#ffffff', hex);
  }
});

test('the chosen lettering always has the better contrast', () => {
  for (let v = 0; v <= 255; v += 15) {
    const hex = `#${v.toString(16).padStart(2, '0').repeat(3)}`;
    const other = contrastText(hex) === '#000000' ? '#ffffff' : '#000000';
    assert.ok(contrastRatio(hex, contrastText(hex)) >= contrastRatio(hex, other), hex);
  }
});
