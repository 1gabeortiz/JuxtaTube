import { useQuery } from '@tanstack/react-query';
import { fetchJson } from '../api/client';
import type {
  AnalyticsOverview,
  Demographics,
  TrafficSources,
} from '../api/types';

/**
 * Analytics data is cached for 30 minutes because the backend deliberately
 * excludes the last two days — YouTube has not finished processing them — so
 * refetching sooner cannot produce different numbers.
 */
const ANALYTICS_STALE_TIME = 30 * 60 * 1000;

/** Selectable windows, in days. */
export const RANGE_OPTIONS = [28, 90, 365] as const;

export type RangeOption = (typeof RANGE_OPTIONS)[number];

export function useAnalyticsOverview(days: RangeOption) {
  return useQuery({
    // days is part of the key so switching ranges fetches fresh data instead of
    // showing the previous window's numbers under a new label.
    queryKey: ['analytics', 'overview', days],
    queryFn: () =>
      fetchJson<AnalyticsOverview>(`/api/analytics/overview?days=${days}`),
    staleTime: ANALYTICS_STALE_TIME,
  });
}

export function useDemographics(days: RangeOption) {
  return useQuery({
    queryKey: ['analytics', 'demographics', days],
    queryFn: () =>
      fetchJson<Demographics>(`/api/analytics/demographics?days=${days}`),
    staleTime: ANALYTICS_STALE_TIME,
  });
}

export function useTrafficSources(days: RangeOption) {
  return useQuery({
    queryKey: ['analytics', 'traffic-sources', days],
    queryFn: () =>
      fetchJson<TrafficSources>(`/api/analytics/traffic-sources?days=${days}`),
    staleTime: ANALYTICS_STALE_TIME,
  });
}
