import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchJson, postJson } from '../api/client';
import type { AuthStatus } from '../api/types';
import { requestAuthCode } from '../lib/googleIdentity';

export const authStatusKey = ['auth', 'status'] as const;

/**
 * Whether the owner's channel is connected.
 *
 * staleTime is 0 — unlike YouTube stats, this value is cheap to fetch and its
 * accuracy drives which UI the user sees, so it should never be served stale.
 */
export function useAuthStatus() {
  return useQuery({
    queryKey: authStatusKey,
    queryFn: () => fetchJson<AuthStatus>('/api/auth/status'),
    staleTime: 0,
  });
}

export function useConnectChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new Error('Missing VITE_GOOGLE_CLIENT_ID.');
      }

      const code = await requestAuthCode(clientId);
      return postJson<AuthStatus>('/api/auth/callback', { code });
    },
    // Connecting unlocks every private route at once, so clear the whole cache
    // rather than naming each query that just became available.
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

export function useDisconnectChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => postJson<AuthStatus>('/api/auth/disconnect'),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
