import { useQuery } from '@tanstack/react-query';
import { fetchJson } from '../api/client';
import type { VideosResponse } from '../api/types';

export function useMyVideos(limit = 12) {
  return useQuery({
    // limit is part of the key so different page sizes cache separately
    // instead of overwriting each other.
    queryKey: ['videos', limit],
    queryFn: () => fetchJson<VideosResponse>(`/api/youtube/videos?limit=${limit}`),
    staleTime: 10 * 60 * 1000,
  });
}
