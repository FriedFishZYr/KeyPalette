import { test, expect } from 'vitest';
import { encodeShare, decodeShare, readShareToken, buildShareUrl } from '../src/utils/share.js';

const state = {
  colorwayName: 'Night Shift', layout: 'tkl', caseColor: '#123456', caseFinish: 'gloss', profile: 'sa',
  legendColor: '#ffffff', legendPosition: 'front',
  keyColors: Object.fromEntries(Array.from({ length: 87 }, (_, i) => [`k${i}`, `#${(i * 2654435).toString(16).padStart(6, '0').slice(-6)}`])),
};

test('a design survives the trip through a share token', async () => {
  const token = await encodeShare(state);
  expect(token.startsWith('z.')).toBe(true);
  const design = await decodeShare(token);
  expect(design.name).toBe('Night Shift');
  expect(design.layout).toBe('tkl');
  expect(design.profile).toBe('sa');
  expect(design.keyColors).toEqual(state.keyColors);
});

test('compressed tokens stay well inside URL limits for a full-size board', async () => {
  const token = await encodeShare({ ...state, layout: 'full' });
  expect(token.length).toBeLessThan(1500);
});

test('damaged or foreign tokens are rejected with a readable message', async () => {
  await expect(decodeShare('nope')).rejects.toThrow(/not a KeyPalette/);
  await expect(decodeShare('z.!!!')).rejects.toThrow(/damaged/);
  await expect(decodeShare('j.' + btoa('{"version":1}').replace(/=+$/, ''))).rejects.toThrow();
});

test('share urls are built from and read back out of the hash', () => {
  const base = { origin: 'https://example.test', pathname: '/app/', search: '' };
  const url = buildShareUrl('z.abc-_', base);
  expect(url).toBe('https://example.test/app/#d=z.abc-_');
  expect(readShareToken('#d=z.abc-_')).toBe('z.abc-_');
  expect(readShareToken('#other')).toBe(null);
  expect(readShareToken('')).toBe(null);
});
