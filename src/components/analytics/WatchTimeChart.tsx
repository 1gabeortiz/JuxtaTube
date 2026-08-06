import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AnalyticsDayPoint } from '../../api/types';
import { formatNumber } from '../../utils/formatNumber';
import { minutesToHours } from '../../utils/formatWatchTime';
import { AXIS_PROPS, CHART_COLORS, TOOLTIP_STYLE } from './chartTheme';
import { EmptyChartState } from './ChartCard';

interface WatchTimeChartProps {
  days: AnalyticsDayPoint[];
}

/** "2026-07-07" -> "Jul 7", rendered in UTC to match YouTube's own day boundaries. */
function shortDate(iso: string): string {
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return iso;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(timestamp);
}

export function WatchTimeChart({ days }: WatchTimeChartProps) {
  if (days.length === 0) {
    return <EmptyChartState message="No activity in this range." />;
  }

  const data = days.map((day) => ({
    label: shortDate(day.date),
    views: day.views,
    hours: minutesToHours(day.estimatedMinutesWatched),
  }));

  // A long range crowds the axis, so show roughly a dozen labels regardless of
  // how many days are plotted.
  const tickInterval = Math.max(0, Math.floor(data.length / 12) - 1);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.accent} stopOpacity={0.35} />
            <stop offset="100%" stopColor={CHART_COLORS.accent} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="hoursFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.positive} stopOpacity={0.3} />
            <stop offset="100%" stopColor={CHART_COLORS.positive} stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid stroke={CHART_COLORS.line} vertical={false} />
        <XAxis dataKey="label" interval={tickInterval} {...AXIS_PROPS} />
        <YAxis tickFormatter={(value: number) => formatNumber(value)} {...AXIS_PROPS} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: '0.75rem' }} />

        <Area
          type="monotone"
          dataKey="views"
          name="Views"
          stroke={CHART_COLORS.accent}
          strokeWidth={2}
          fill="url(#viewsFill)"
        />
        <Area
          type="monotone"
          dataKey="hours"
          name="Watch time (hrs)"
          stroke={CHART_COLORS.positive}
          strokeWidth={2}
          fill="url(#hoursFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
