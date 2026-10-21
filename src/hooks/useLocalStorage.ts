import { useCallback, useEffect, useRef, useState } from 'react';

type SetValue<T> = (value: T | ((prev: T) => T)) => void;

interface Options<T> {
  /** Runtime guard for persisted data. Invalid/corrupt values fall back to `initialValue`. */
  validate?: (value: unknown) => value is T;
}

/**
 * In-memory fallback used when localStorage is unavailable (Safari private mode,
 * disabled storage, sandboxed iframes) or a write fails (quota exceeded).
 */
const memoryStore = new Map<string, string>();

let storageAvailable: boolean | null = null;
function hasLocalStorage(): boolean {
  if (storageAvailable !== null) return storageAvailable;
  try {
    const probe = '__fsa_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return storageAvailable;
}

function readRaw(key: string): string | null {
  if (hasLocalStorage()) {
    try {
      return window.localStorage.getItem(key) ?? memoryStore.get(key) ?? null;
    } catch {
      /* fall through to memory */
    }
  }
  return memoryStore.get(key) ?? null;
}

function writeRaw(key: string, raw: string): boolean {
  memoryStore.set(key, raw);
  if (!hasLocalStorage()) return false;
  try {
    window.localStorage.setItem(key, raw);
    return true;
  } catch (err) {
    console.warn(`[useLocalStorage] Failed to persist "${key}" — keeping in memory.`, err);
    return false;
  }
}

function removeRaw(key: string): void {
  memoryStore.delete(key);
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function resolveInitial<T>(initial: T | (() => T)): T {
  return typeof initial === 'function' ? (initial as () => T)() : initial;
}

function decode<T>(raw: string | null, fallback: () => T, validate?: (v: unknown) => v is T): T {
  if (raw === null) return fallback();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (validate && !validate(parsed)) {
      console.warn('[useLocalStorage] Persisted value failed validation — using initial value.');
      return fallback();
    }
    return parsed as T;
  } catch {
    return fallback();
  }
}

/**
 * Type-safe, reactive localStorage binding.
 * - Writes synchronously on every update (no debounce → no data loss on tab close).
 * - Seeds storage with `initialValue` on first run so the key always exists.
 * - Syncs across tabs/windows through the native `storage` event.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
  options: Options<T> = {},
): [T, SetValue<T>, () => void] {
  const { validate } = options;
  const initialRef = useRef(initialValue);
  const validateRef = useRef(validate);
  validateRef.current = validate;

  const [value, setValue] = useState<T>(() => {
    const raw = readRaw(key);
    const decoded = decode(raw, () => resolveInitial(initialRef.current), validate);
    if (raw === null) writeRaw(key, JSON.stringify(decoded));
    return decoded;
  });

  // Always-current ref so functional updates compose correctly even when batched.
  const valueRef = useRef(value);
  valueRef.current = value;

  const set: SetValue<T> = useCallback(
    (next) => {
      const resolved = typeof next === 'function' ? (next as (prev: T) => T)(valueRef.current) : next;
      valueRef.current = resolved;
      writeRaw(key, JSON.stringify(resolved));
      setValue(resolved);
    },
    [key],
  );

  const reset = useCallback(() => {
    removeRaw(key);
    const fresh = resolveInitial(initialRef.current);
    valueRef.current = fresh;
    writeRaw(key, JSON.stringify(fresh));
    setValue(fresh);
  }, [key]);

  // Cross-tab synchronisation.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.storageArea !== window.localStorage || (e.key !== key && e.key !== null)) return;
      // e.key === null means localStorage.clear() was called in another tab.
      const next = decode(e.key === null ? null : e.newValue, () => resolveInitial(initialRef.current), validateRef.current);
      if (e.newValue !== null) memoryStore.set(key, e.newValue);
      valueRef.current = next;
      setValue(next);
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);

  return [value, set, reset];
}
