/**
 * The Analytics API reports watch time in minutes, which stops being readable
 * somewhere around a few thousand. These helpers scale it to whatever unit a
 * human would actually say out loud.
 */

/** 11836 -> "197 hrs". Whole hours once past a day, minutes below that. */
export function formatWatchTime(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '0 min';

  if (minutes < 60) return `${Math.round(minutes)} min`;

  const hours = minutes / 60;
  if (hours < 10) return `${hours.toFixed(1).replace(/\.0$/, '')} hrs`;

  return `${Math.round(hours).toLocaleString('en-US')} hrs`;
}

/** Hours as a plain number, for charting where the axis carries the unit. */
export function minutesToHours(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10;
}
