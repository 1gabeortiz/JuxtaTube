import { requireEnv } from './env.js';
import { getValidAccessToken } from './getAccessToken.js';

const ANALYTICS_ENDPOINT = 'https://youtubeanalytics.googleapis.com/v2/reports';

export class AnalyticsApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`YouTube Analytics API responded with ${status}`);
    this.name = 'AnalyticsApiError';
    this.status = status;
  }
}

/**
 * The reports endpoint returns a table, not objects: a list of column headers
 * plus rows of raw values. Callers turn it into objects with `rowsToObjects`.
 */
export interface AnalyticsColumnHeader {
  name: string;
  columnType: 'DIMENSION' | 'METRIC';
  dataType: string;
}

export interface AnalyticsReportResponse {
  columnHeaders: AnalyticsColumnHeader[];
  rows?: (string | number)[][];
}

export interface ReportQuery {
  startDate: string;
  endDate: string;
  metrics: string;
  dimensions?: string;
  sort?: string;
  maxResults?: number;
}

/**
 * Runs one Analytics API report for the owner's channel.
 *
 * `ids` names the channel explicitly rather than using `channel==MINE`. That is
 * deliberate: if the stored token belongs to a different channel than
 * YT_CHANNEL_ID, Google rejects the request outright instead of silently
 * returning some other channel's numbers. Wrong data is far worse than an error.
 */
export async function analyticsReport(
  query: ReportQuery,
): Promise<AnalyticsReportResponse> {
  const accessToken = await getValidAccessToken();

  const url = new URL(ANALYTICS_ENDPOINT);
  url.searchParams.set('ids', `channel==${requireEnv('YT_CHANNEL_ID')}`);
  url.searchParams.set('startDate', query.startDate);
  url.searchParams.set('endDate', query.endDate);
  url.searchParams.set('metrics', query.metrics);
  if (query.dimensions) url.searchParams.set('dimensions', query.dimensions);
  if (query.sort) url.searchParams.set('sort', query.sort);
  if (query.maxResults) url.searchParams.set('maxResults', String(query.maxResults));

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    console.error('[analytics]', response.status, await response.text());
    throw new AnalyticsApiError(response.status);
  }

  return (await response.json()) as AnalyticsReportResponse;
}

/**
 * Turns the tabular response into keyed objects using the column headers.
 *
 * Values stay as Google sent them — dimensions are strings, metrics are numbers
 * — so each route maps them into its own typed shape afterwards.
 */
export function rowsToObjects(
  report: AnalyticsReportResponse,
): Record<string, string | number>[] {
  const names = report.columnHeaders.map((header) => header.name);

  return (report.rows ?? []).map((row) => {
    const entry: Record<string, string | number> = {};
    names.forEach((name, index) => {
      entry[name] = row[index] ?? 0;
    });
    return entry;
  });
}

export function toNumber(value: string | number | undefined): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toText(value: string | number | undefined): string {
  return value === undefined ? '' : String(value);
}
