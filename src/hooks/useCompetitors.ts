import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchJson, postJson } from '../api/client';
import type {
  CompetitorHistoryResponse,
  CompetitorsResponse,
} from '../api/types';

const competitorsKey = ['competitors'] as const;
const historyKey = ['competitor-history'] as const;

/**
 * Current public stats. Short staleTime because the list changes the moment the
 * user adds or removes a channel, and the whole call costs 1 quota unit.
 */
export function useCompetitors() {
  return useQuery({
    queryKey: competitorsKey,
    queryFn: () => fetchJson<CompetitorsResponse>('/api/youtube/competitors'),
    staleTime: 5 * 60 * 1000,
  });
}

/** Recorded history. Only changes once a day, when the scheduled job runs. */
export function useCompetitorHistory(days: number) {
  return useQuery({
    queryKey: [...historyKey, days],
    queryFn: () =>
      fetchJson<CompetitorHistoryResponse>(
        `/api/youtube/competitor-history?days=${days}`,
      ),
    staleTime: 60 * 60 * 1000,
  });
}

function useInvalidateCompetitors() {
  const queryClient = useQueryClient();

  // Both queries are driven by the tracked list, so a change to it invalidates
  // the history too — otherwise a removed channel would linger in the chart.
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: competitorsKey }),
      queryClient.invalidateQueries({ queryKey: historyKey }),
    ]);
  };
}

export function useAddCompetitor() {
  const invalidate = useInvalidateCompetitors();

  return useMutation({
    mutationFn: (channel: string) =>
      postJson<{ channelId: string; channelName: string }>(
        '/api/youtube/competitors',
        { channel },
      ),
    onSuccess: invalidate,
  });
}

export function useRemoveCompetitor() {
  const invalidate = useInvalidateCompetitors();

  return useMutation({
    mutationFn: (channelId: string) =>
      fetchJson<{ removed: string }>(
        `/api/youtube/competitors?channelId=${encodeURIComponent(channelId)}`,
        { method: 'DELETE' },
      ),
    onSuccess: invalidate,
  });
}
