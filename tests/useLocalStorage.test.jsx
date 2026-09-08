// @vitest-environment jsdom
import { test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useLocalStorage, { readStored } from '../src/hooks/useLocalStorage.js';

beforeEach(() => localStorage.clear());
afterEach(() => { vi.useRealTimers(); delete document.visibilityState; });

test('unreadable data is set aside under a backup key instead of being overwritten', () => {
  localStorage.setItem('k', '{not json');
  const { value, recovery } = readStored('k', () => ({ fresh: true }));
  expect(value).toEqual({ fresh: true });
  expect(recovery.raw).toBe('{not json');
  expect(recovery.key.startsWith('k.unreadable-')).toBe(true);
  expect(localStorage.getItem(recovery.key)).toBe('{not json');
});

test('readable data is returned as-is and defaults apply when nothing is stored', () => {
  localStorage.setItem('k', '[1,2]');
  expect(readStored('k', 0)).toEqual({ value: [1, 2], recovery: null });
  expect(readStored('missing', () => 'd')).toEqual({ value: 'd', recovery: null });
});

test('writes are debounced and the status reflects them', () => {
  vi.useFakeTimers();
  const { result } = renderHook(() => useLocalStorage('k', 0, { debounceMs: 100 }));
  expect(result.current[2]).toBe('saved');
  act(() => result.current[1](1));
  expect(result.current[2]).toBe('saving');
  expect(localStorage.getItem('k')).toBe(null);
  act(() => { vi.advanceTimersByTime(100); });
  expect(localStorage.getItem('k')).toBe('1');
  expect(result.current[2]).toBe('saved');
});

test('a pending write is flushed when the page is hidden', () => {
  vi.useFakeTimers();
  const { result } = renderHook(() => useLocalStorage('k', 0, { debounceMs: 1000 }));
  act(() => result.current[1]({ a: 1 }));
  expect(localStorage.getItem('k')).toBe(null);
  act(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(localStorage.getItem('k')).toBe('{"a":1}');
  expect(result.current[2]).toBe('saved');
});

test('a failed write reports an error instead of throwing', () => {
  vi.useFakeTimers();
  const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  const { result } = renderHook(() => useLocalStorage('k', 0, { debounceMs: 10 }));
  act(() => result.current[1](2));
  act(() => { vi.advanceTimersByTime(10); });
  expect(result.current[2]).toBe('error');
  setItem.mockRestore();
});
