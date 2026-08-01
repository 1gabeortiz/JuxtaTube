const UNITS = [
  { threshold: 1_000_000_000, suffix: 'B' },
  { threshold: 1_000_000, suffix: 'M' },
  { threshold: 1_000, suffix: 'K' },
] as const;

/**
 * Compact display form: 10800 -> "10.8K", 2484720 -> "2.5M".
 *
 * Keeps one decimal until the scaled value reaches 100, which matches how
 * YouTube itself renders counts. Dropping the decimal any earlier would round
 * 10,800 subscribers to a visibly wrong "11K".
 */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '—';

  const abs = Math.abs(value);
  if (abs < 1_000) return String(Math.round(value));

  for (const { threshold, suffix } of UNITS) {
    if (abs >= threshold) {
      const scaled = value / threshold;
      const digits = Math.abs(scaled) < 100 ? 1 : 0;
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
