import { RANGE_OPTIONS, type RangeOption } from '../../hooks/useAnalytics';

interface RangeSelectorProps {
  value: RangeOption;
  onChange: (days: RangeOption) => void;
}

const LABELS: Record<RangeOption, string> = {
  28: '28 days',
  90: '90 days',
  365: '1 year',
};

export function RangeSelector({ value, onChange }: RangeSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Date range"
      className="inline-flex rounded-lg border border-line bg-surface p-0.5"
    >
      {RANGE_OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={option === value}
          className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
            option === value
              ? 'bg-accent font-semibold text-bg'
              : 'text-muted hover:text-ink'
          }`}
        >
          {LABELS[option]}
        </button>
      ))}
    </div>
  );
}
