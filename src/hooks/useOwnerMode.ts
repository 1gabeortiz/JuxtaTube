import { useQueryClient } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { fetchJson } from '../api/client';
import { OWNER_KEY_HEADER } from '../api/headers';
import type { AuthStatus } from '../api/types';
import {
  clearOwnerKey,
  getOwnerKey,
  setOwnerKey,
  subscribeToOwnerKey,
} from '../lib/ownerKey';

export function useOwnerMode() {
  // useSyncExternalStore is the supported way to read mutable state that lives
  // outside React. Reading sessionStorage during render without it would not
  // re-render other components when the key changes.
  const key = useSyncExternalStore(subscribeToOwnerKey, getOwnerKey);
  const queryClient = useQueryClient();

  /** Returns false for a wrong key, so the form can say so. */
  async function unlock(candidate: string): Promise<boolean> {
    let status: AuthStatus;
    try {
      // Verified with an explicit header before being stored, so an incorrect
      // key never lands in sessionStorage. The status route reports owner as a
      // boolean rather than failing, so a wrong key is a 200 with owner false.
      status = await fetchJson<AuthStatus>('/api/auth/status', {
        headers: { [OWNER_KEY_HEADER]: candidate },
      });
    } catch {
      // Network or server failure. Indistinguishable from a bad key here, and
      // either way there is nothing worth storing.
      return false;
    }

    if (!status.owner) return false;

    setOwnerKey(candidate);
    // Every panel that failed with 401 is holding an error, not data. Refetching
    // is what turns the locked notices into real content.
    await queryClient.invalidateQueries();
    return true;
  }

  function lock(): void {
    clearOwnerKey();
    // clear, not invalidate: refetching would only 401 again, and this drops the
    // private data already sitting in the cache.
    queryClient.clear();
  }

  return { isUnlocked: key !== null, unlock, lock };
}
