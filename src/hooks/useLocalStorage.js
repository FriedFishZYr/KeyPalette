import { useState, useEffect, useCallback } from 'react';

export default function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : typeof defaultValue === 'function' ? defaultValue() : defaultValue;
    } catch {
      return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
    }
  });
  const [savedValue, setSavedValue] = useState(null);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      setSavedValue(value);
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, [key, value]);

  const remove = useCallback(() => {
    localStorage.removeItem(key);
    setValue(typeof defaultValue === 'function' ? defaultValue() : defaultValue);
  }, [key, defaultValue]);

  return [value, setValue, remove, saveError ? 'error' : savedValue === value ? 'saved' : 'saving'];
}
