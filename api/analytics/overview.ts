import type {
  AnalyticsDayPoint,
  AnalyticsOverview,
  AnalyticsTotals,
} from '../../src/api/types.js';
import { parseDays, resolveDateRange } from '../_lib/dateRange.js';
import { jsonError, jsonOk, toErrorResponse } from '../_lib/respond.js';
import {
  analyticsReport,
  rowsToObjects,
  toNumber,
  toText,
} from '../_lib/youtubeAnalyticsApi.js';

/**
 * Day-by-day channel performance: views, watch time, and subscriber movement.
 *
 * Accepts `?days=N` (default 28, capped at 365).
 */
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
        metrics: 'views,estimatedMinutesWatched,subscribersGained,subscribersLost',
        dimensions: 'day',
        sort: 'day',
      });

      const days: AnalyticsDayPoint[] = rowsToObjects(report).map((row) => ({
        date: toText(row.day),
        views: toNumber(row.views),
        estimatedMinutesWatched: toNumber(row.estimatedMinutesWatched),
        subscribersGained: toNumber(row.subscribersGained),
        subscribersLost: toNumber(row.subscribersLost),
      }));

      const totals = days.reduce<AnalyticsTotals>(
        (sum, day) => ({
          views: sum.views + day.views,
          estimatedMinutesWatched:
            sum.estimatedMinutesWatched + day.estimatedMinutesWatched,
          subscribersGained: sum.subscribersGained + day.subscribersGained,
          subscribersLost: sum.subscribersLost + day.subscribersLost,
          netSubscribers:
            sum.netSubscribers + day.subscribersGained - day.subscribersLost,
        }),
        {
          views: 0,
          estimatedMinutesWatched: 0,
          subscribersGained: 0,
          subscribersLost: 0,
          netSubscribers: 0,
        },
      );

      const payload: AnalyticsOverview = {
        startDate: range.startDate,
        endDate: range.endDate,
        totals,
        days,
      };

      // 30 minutes is generous: the newest day in this range is already two days
      // old, so a fresher fetch could not return different numbers.
      return jsonOk(payload, 1800);
    } catch (error) {
      return toErrorResponse(error);
    }
  },
};
