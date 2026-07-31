import { useQuery } from '@tanstack/react-query';
import { fetchJson } from '../api/client';
import type { ChannelOverview } from '../api/types';

export function useChannelOverview() {
  return useQuery({
    queryKey: ['channel', 'overview'],
    queryFn: () => fetchJson<ChannelOverview>('/api/youtube/channel-overview'),
    // Subscriber and view counts move slowly, and every refetch spends quota.
    staleTime: 10 * 60 * 1000,
  });
}
