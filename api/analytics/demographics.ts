import type {
  AgeGenderSlice,
  CountrySlice,
  Demographics,
} from '../../src/api/types.js';
import { parseDays, resolveDateRange } from '../_lib/dateRange.js';
import { requireOwner } from '../_lib/requireOwner.js';
import { jsonError, jsonPrivate, toErrorResponse } from '../_lib/respond.js';
import {
  analyticsReport,
  rowsToObjects,
  toNumber,
  toText,
} from '../_lib/youtubeAnalyticsApi.js';

const TOP_COUNTRIES = 12;

/**
 * Who is watching: age/gender split, plus the top countries by views.
 *
 * These are two separate reports because the Analytics API cannot combine
 * `viewerPercentage` with view counts in one query — they are different metric
 * families. Running them in parallel keeps the route about as fast as one call.
 */
export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
      return jsonError('Method not allowed.', 405);
    }

    try {
      requireOwner(request);

      const url = new URL(request.url);
      const range = resolveDateRange(parseDays(url.searchParams.get('days')));

      const [ageGenderReport, countryReport] = await Promise.all([
        analyticsReport({
          startDate: range.startDate,
          endDate: range.endDate,
          metrics: 'viewerPercentage',
          dimensions: 'ageGroup,gender',
          sort: 'ageGroup',
        }),
        analyticsReport({
          startDate: range.startDate,
          endDate: range.endDate,
          metrics: 'views,estimatedMinutesWatched',
          dimensions: 'country',
          sort: '-views',
          maxResults: TOP_COUNTRIES,
        }),
      ]);

      const ageGender: AgeGenderSlice[] = rowsToObjects(ageGenderReport).map(
        (row) => ({
          ageGroup: toText(row.ageGroup),
          gender: toText(row.gender),
          viewerPercentage: toNumber(row.viewerPercentage),
        }),
      );

      const countries: CountrySlice[] = rowsToObjects(countryReport).map((row) => ({
        code: toText(row.country),
        views: toNumber(row.views),
        estimatedMinutesWatched: toNumber(row.estimatedMinutesWatched),
      }));

      const payload: Demographics = {
        startDate: range.startDate,
        endDate: range.endDate,
        ageGender,
        countries,
      };

      return jsonPrivate(payload, 1800);
    } catch (error) {
      return toErrorResponse(error);
    }
  },
};
