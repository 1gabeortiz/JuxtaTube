/**
 * Holds the owner key for the current tab.
 *
 * sessionStorage rather than localStorage: the key is gone when the tab closes,
 * which is the safer default for something typed on a machine that might not be
 * the owner's. It also survives a page reload, so unlocking is not lost to a
 * stray refresh.
 *
 * This is a hand-rolled external store rather than React state because two
 * unrelated components need it — the header button and the locked notices on
 * individual pages — and the API client, which is a plain module, has to read it
 * on every request. Context would solve the first problem but not the second.
 */

const STORAGE_KEY = 'juxtatube:owner-key';

const listeners = new Set<() => void>();

function readStorage(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage access throws outright in some privacy modes. Treating that as
    // "locked" degrades to a read-only app rather than a crashed one.
    return null;
  }
}

let current: string | null = null;
let loaded = false;

/**
 * Reading is deferred to first use rather than done at module load, so importing
 * this file never touches the DOM. useSyncExternalStore compares snapshots by
 * identity, and a string is compared by value, so returning the cached value is
 * stable across renders.
 */
export function getOwnerKey(): string | null {
  if (!loaded) {
    current = readStorage();
    loaded = true;
  }
  return current;
}

function emit(): void {
  for (const listener of listeners) listener();
}

export function setOwnerKey(key: string): void {
  current = key;
  loaded = true;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, key);
  } catch {
    // Not fatal: the key still works for this page's lifetime, it just will not
    // survive a reload.
  }
  emit();
}

export function clearOwnerKey(): void {
  current = null;
  loaded = true;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do — the in-memory value is already cleared.
  }
  emit();
}

export function subscribeToOwnerKey(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
