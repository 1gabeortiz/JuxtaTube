const UNITS = [
  { threshold: 1_000_000_000, suffix: 'B' },
  { threshold: 1_000_000, suffix: 'M' },
  { threshold: 1_000, suffix: 'K' },
] as const;

/**
 * Compact display form: 12500 -> "12.5K", 2484720 -> "2.5M".
 *
 * One decimal below 10 and none above it, so values stay a predictable width
 * in a grid of stat cards rather than jittering between "9.4K" and "948.2K".
 */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '—';

  const abs = Math.abs(value);
  if (abs < 1_000) return String(Math.round(value));

  for (const { threshold, suffix } of UNITS) {
    if (abs >= threshold) {
      const scaled = value / threshold;
      const digits = Math.abs(scaled) < 10 ? 1 : 0;
      return `${scaled.toFixed(digits).replace(/\.0$/, '')}${suffix}`;
    }
  }

  return String(Math.round(value));
}

/** Full grouped form for tooltips, e.g. "2,484,720". */
export function formatExact(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString('en-US');
}
