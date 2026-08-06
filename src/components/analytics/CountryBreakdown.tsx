import type { CountrySlice } from '../../api/types';
import { formatNumber } from '../../utils/formatNumber';
import { formatWatchTime } from '../../utils/formatWatchTime';
import { EmptyChartState } from './ChartCard';

interface CountryBreakdownProps {
  countries: CountrySlice[];
}

let regionNames: Intl.DisplayNames | null = null;

/** "US" -> "United States", falling back to the raw code if unavailable. */
function countryName(code: string): string {
  try {
    regionNames ??= new Intl.DisplayNames(['en'], { type: 'region' });
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * A ranked list with proportional bars rather than a chart.
 *
 * Country names are long and a dozen of them make an unreadable axis, while a
 * list stays scannable and shows exact numbers alongside the visual comparison.
 */
export function CountryBreakdown({ countries }: CountryBreakdownProps) {
  if (countries.length === 0) {
    return <EmptyChartState message="No geographic data in this range." />;
  }

  const maxViews = Math.max(...countries.map((country) => country.views));

  return (
    <ol className="space-y-3">
      {countries.map((country) => (
        <li key={country.code}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{countryName(country.code)}</span>
            <span
              className="shrink-0 font-mono tabular-nums text-muted"
              title={`${country.views.toLocaleString('en-US')} views · ${formatWatchTime(country.estimatedMinutesWatched)}`}
            >
              {formatNumber(country.views)}
            </span>
          </div>

          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.max(2, (country.views / maxViews) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
