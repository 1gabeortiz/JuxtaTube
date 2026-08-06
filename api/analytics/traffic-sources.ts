import type { TrafficSourceSlice, TrafficSources } from '../../src/api/types.js';
import { parseDays, resolveDateRange } from '../_lib/dateRange.js';
import { jsonError, jsonOk, toErrorResponse } from '../_lib/respond.js';
import {
  analyticsReport,
  rowsToObjects,
  toNumber,
  toText,
} from '../_lib/youtubeAnalyticsApi.js';

/**
 * Readable names for Google's traffic source enum.
 *
 * Anything not listed falls back to a generic prettifier, so a source Google
 * adds later still renders sensibly instead of shouting NEW_SOURCE_TYPE at the
 * user.
 */
const SOURCE_LABELS: Record<string, string> = {
  ADVERTISING: 'Advertising',
  ANNOTATION: 'Annotations',
  CAMPAIGN_CARD: 'Campaign cards',
  END_SCREEN: 'End screens',
  EXT_URL: 'External sites',
  HASHTAGS: 'Hashtags',
  IMMERSIVE: 'Immersive',
  LIVE_REDIRECT: 'Live redirects',
  NO_LINK_EMBEDDED: 'Embedded players',
  NO_LINK_OTHER: 'Direct or unknown',
  NOTIFICATION: 'Notifications',
  PLAYLIST: 'Playlists',
  PRODUCT_PAGE: 'Product pages',
  PROMOTED: 'Promoted',
  RELATED_VIDEO: 'Suggested videos',
  SHORTS: 'Shorts feed',
  SOUND_PAGE: 'Sound pages',
  SUBSCRIBER: 'Subscriptions feed',
  VIDEO_REMIXES: 'Remixes',
  YT_CHANNEL: 'Channel pages',
  YT_OTHER_PAGE: 'Other YouTube pages',
  YT_PLAYLIST_PAGE: 'Playlist pages',
  YT_SEARCH: 'YouTube search',
};

function labelFor(source: string): string {
  const known = SOURCE_LABELS[source];
  if (known) return known;

  const words = source.toLowerCase().replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Where views came from, ranked by view count. */
export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
      return jsonError('Method not allowed.', 405);
    }

    try {
      const url = new URL(request.url);
      const range = resolveDateRange(parseDays(url.searchParams.get('days')));

      const report = await analyticsReport({
        startDate: range.startDate,
        endDate: range.endDate,
        metrics: 'views,estimatedMinutesWatched',
        dimensions: 'insightTrafficSourceType',
        sort: '-views',
      });

      const sources: TrafficSourceSlice[] = rowsToObjects(report).map((row) => {
        const source = toText(row.insightTrafficSourceType);
        return {
          source,
          label: labelFor(source),
          views: toNumber(row.views),
          estimatedMinutesWatched: toNumber(row.estimatedMinutesWatched),
        };
      });

      const payload: TrafficSources = {
        startDate: range.startDate,
        endDate: range.endDate,
        sources,
      };

      return jsonOk(payload, 1800);
    } catch (error) {
      return toErrorResponse(error);
    }
  },
};
