/**
 * Date-range handling for Analytics API requests.
 *
 * The Analytics API expects YYYY-MM-DD strings and interprets them in the
 * channel's own timezone. We build them from UTC parts rather than local time so
 * a request made late at night in the Americas doesn't ask for tomorrow's data.
 */

const DEFAULT_DAYS = 28;
const MAX_DAYS = 365;

/** Number of days YouTube typically lags before analytics are finalized. */
const REPORTING_LAG_DAYS = 2;

export interface DateRange {
  startDate: string;
  endDate: string;
  days: number;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseDays(raw: string | null): number {
  if (raw === null) return DEFAULT_DAYS;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) return DEFAULT_DAYS;

  return Math.min(parsed, MAX_DAYS);
}

/**
 * A range ending a couple of days back, because YouTube has not finished
 * processing the most recent days. Including them would draw a chart that
 * appears to collapse to zero at the right edge, which looks like a crash in
 * the channel rather than a reporting delay.
 */
export function resolveDateRange(days: number): DateRange {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - REPORTING_LAG_DAYS);

  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  return { startDate: toIsoDate(start), endDate: toIsoDate(end), days };
}
