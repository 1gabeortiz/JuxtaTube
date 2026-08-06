import { formatExact, formatNumber } from '../../utils/formatNumber';

interface StatCardProps {
  label: string;
  value: number;
  hint?: string;
  /**
   * Overrides the compact number formatting. For values that carry a unit —
   * watch time in hours, say — where a bare "197" would be meaningless.
   */
  display?: string;
}

export function StatCard({ label, value, hint, display }: StatCardProps) {
  return (
    <div className="animate-rise rounded-xl border border-line bg-surface p-5">
      <p className="text-sm text-muted">{label}</p>

      {/* tabular-nums keeps digit widths equal so numbers line up across cards */}
      <p className="mt-2 font-mono text-3xl tabular-nums" title={formatExact(value)}>
        {display ?? formatNumber(value)}
      </p>

      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
