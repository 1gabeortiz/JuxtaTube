/**
 * Recharts takes colors as prop values, not CSS classes, so it cannot use
 * Tailwind utilities. Referencing the same CSS variables the Tailwind theme
 * defines keeps one source of truth — change a token in index.css and both the
 * UI and the charts follow.
 */
export const CHART_COLORS = {
  accent: 'var(--color-accent)',
  positive: 'var(--color-positive)',
  warning: 'var(--color-warning)',
  muted: 'var(--color-muted)',
  line: 'var(--color-line)',
} as const;

export const AXIS_PROPS = {
  stroke: 'var(--color-muted)',
  fontSize: 11,
  tickLine: false,
} as const;

/**
 * Recharts types tooltip values as possibly undefined and possibly arrays, so
 * these accept `unknown` and narrow. Declaring the parameter as `number` would
 * not type-check against their formatter signature.
 */
export function tooltipNumber(value: unknown): string {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed.toLocaleString('en-US') : '—';
}

export function tooltipPercent(value: unknown): string {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? `${parsed.toFixed(1)}%` : '—';
}

/** Dark tooltip that matches the surface panels rather than Recharts' default white. */
export const TOOLTIP_STYLE = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-line)',
  borderRadius: '0.5rem',
  fontSize: '0.8rem',
  color: 'var(--color-ink)',
} as const;
