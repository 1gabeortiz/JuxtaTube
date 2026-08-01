const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

const DIVISIONS = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
] as const;

/** "2026-04-26T02:45:25Z" -> "3 months ago". */
export function formatRelativeDate(iso: string): string {
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return '';

  let duration = (timestamp - Date.now()) / 1000;
  for (const { amount, unit } of DIVISIONS) {
    if (Math.abs(duration) < amount) {
      return relativeFormatter.format(Math.round(duration), unit);
    }
    duration /= amount;
  }

  return '';
}

/**
 * "2026-04-26T02:45:25Z" -> "Apr 26, 2026".
 *
 * Rendered in UTC on purpose. YouTube timestamps are UTC, and converting to a
 * local timezone shifts early-morning ones onto the previous day — a channel
 * created 2015-03-28T03:41Z would otherwise display as Mar 27 in the Americas.
 */
export function formatAbsoluteDate(iso: string): string {
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return '';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(timestamp);
}
