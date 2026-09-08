import { useState, useEffect, useCallback, useRef } from 'react';

const DEBOUNCE_MS = 250;

const resolveDefault = (defaultValue) =>
  typeof defaultValue === 'function' ? defaultValue() : defaultValue;

// Reads a stored JSON value. Unreadable data is never thrown away: it is
// copied to a timestamped backup key and returned as `recovery` so the UI can
// offer it for download instead of silently overwriting it.
export function readStored(key, defaultValue) {
  let raw;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return { value: resolveDefault(defaultValue), recovery: null };
  }
  if (raw === null) return { value: resolveDefault(defaultValue), recovery: null };
  try {
    return { value: JSON.parse(raw), recovery: null };
  } catch {
    const backupKey = `${key}.unreadable-${Date.now()}`;
    try {
      localStorage.setItem(backupKey, raw);
    } catch {
      // Out of quota: the raw text is still returned in memory.
    }
    return { value: resolveDefault(defaultValue), recovery: { key: backupKey, raw } };
  }
}

// Debounced localStorage-backed state. Returns [value, setValue, status,
// recovery] where status is "saved" | "saving" | "error". Pending writes are
// flushed when the page is hidden or the hook unmounts, so a quick tab close
// never loses the last edit.
export default function useLocalStorage(key, defaultValue, { debounceMs = DEBOUNCE_MS } = {}) {
  const [initial] = useState(() => readStored(key, defaultValue));
  const [value, setValue] = useState(initial.value);
  const [saved, setSaved] = useState(initial.value);
  const [failed, setFailed] = useState(false);
  const pending = useRef(null);

  const write = useCallback(
    (next) => {
      try {
        localStorage.setItem(key, JSON.stringify(next));
        return true;
      } catch {
        return false;
      }
    },
    [key],
  );

  useEffect(() => {
    if (value === saved) return undefined;
    const timer = setTimeout(() => {
      pending.current = null;
      const ok = write(value);
      setFailed(!ok);
      if (ok) setSaved(value);
    }, debounceMs);
    pending.current = { timer, value };
    return () => clearTimeout(timer);
  }, [value, saved, write, debounceMs]);

  useEffect(() => {
    const flush = () => {
      const p = pending.current;
      if (!p) return;
      clearTimeout(p.timer);
      pending.current = null;
      if (write(p.value)) setSaved(p.value);
      else setFailed(true);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
      flush();
    };
  }, [write]);

  const status = failed ? 'error' : value === saved ? 'saved' : 'saving';
  return [value, setValue, status, initial.recovery];
}
