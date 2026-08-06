import { useQuery } from '@tanstack/react-query';
import { fetchJson } from '../api/client';
import type { TagExplorerResult, TagSuggestions } from '../api/types';

/** Suggestions for a given video are stable for hours. */
const SUGGESTIONS_STALE_TIME = 60 * 60 * 1000;

/**
 * A full day, deliberately. Keyword lookups cost 100 quota units, so caching is
 * the difference between a usable tool and one that burns the daily budget.
 */
const EXPLORER_STALE_TIME = 24 * 60 * 60 * 1000;

export function useTagSuggestions(videoId: string | null) {
  return useQuery({
    queryKey: ['tag-suggestions', videoId],
    queryFn: () =>
      fetchJson<TagSuggestions>(
        `/api/youtube/tag-suggestions?videoId=${encodeURIComponent(videoId ?? '')}`,
      ),
    // Nothing to fetch until a video is picked.
    enabled: videoId !== null,
    staleTime: SUGGESTIONS_STALE_TIME,
  });
}

export type ExplorerMode = 'channel' | 'keyword';

export interface ExplorerSearch {
  mode: ExplorerMode;
  query: string;
}

export function useTagExplorer(search: ExplorerSearch | null) {
  return useQuery({
    queryKey: ['tag-explorer', search?.mode, search?.query],
    queryFn: () => {
      const param = search?.mode === 'keyword' ? 'keyword' : 'channel';
      return fetchJson<TagExplorerResult>(
        `/api/youtube/tag-explorer?${param}=${encodeURIComponent(search?.query ?? '')}`,
      );
    },
    // Only runs on explicit submit — a keyword search costs real quota, so it
    // must never fire from typing.
    enabled: search !== null,
    staleTime: EXPLORER_STALE_TIME,
  });
}
