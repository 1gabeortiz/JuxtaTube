import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CompetitorHistory } from '../../api/types';
import { formatNumber } from '../../utils/formatNumber';
import {
  AXIS_PROPS,
  CHART_COLORS,
  TOOLTIP_STYLE,
  seriesColor,
  tooltipNumber,
} from '../analytics/chartTheme';
import { EmptyChartState } from '../analytics/ChartCard';

export type GrowthMetric = 'subscriberCount' | 'viewCount';

interface CompetitorGrowthChartProps {
  histories: CompetitorHistory[];
  metric: GrowthMetric;
}

function shortDate(iso: string): string {
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return iso;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(timestamp);
}

/**
 * One line per tracked channel, built from snapshots this app recorded itself.
 *
 * Recharts needs one row per x-value with a field per series, while the API
 * returns one series per channel — so the data gets pivoted by date here.
 */
function pivotByDate(
  histories: CompetitorHistory[],
  metric: GrowthMetric,
): Record<string, string | number | null>[] {
  const byDate = new Map<string, Record<string, string | number | null>>();

  for (const history of histories) {
    for (const point of history.points) {
      const row = byDate.get(point.date) ?? { date: shortDate(point.date) };
      row[history.channelId] = point[metric];
      byDate.set(point.date, row);
    }
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, row]) => row);
}

export function CompetitorGrowthChart({
  histories,
  metric,
}: CompetitorGrowthChartProps) {
  const data = pivotByDate(histories, metric);

  if (data.length === 0) {
    return (
      <EmptyChartState message="No snapshots recorded yet. The daily job writes the first one within 24 hours." />
    );
  }

  return (
    <>
      {data.length === 1 ? (
        <p className="mb-3 text-xs text-muted">
          Only one day recorded so far, so this shows points rather than trend
          lines. YouTube publishes no history for channels you don&rsquo;t own, so
          the trend can only build from here forward.
        </p>
      ) : null}

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -4 }}>
          <CartesianGrid stroke={CHART_COLORS.line} vertical={false} />
          <XAxis dataKey="date" {...AXIS_PROPS} />
          <YAxis
            tickFormatter={(value: number) => formatNumber(value)}
            // Counts rarely start near zero, so scaling to the data makes small
            // week-to-week changes visible instead of flat lines at the top.
            domain={['auto', 'auto']}
            {...AXIS_PROPS}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={tooltipNumber} />
          <Legend wrapperStyle={{ fontSize: '0.75rem' }} />

          {histories.map((history, index) => (
            <Line
              key={history.channelId}
              type="monotone"
              dataKey={history.channelId}
              name={history.channelName}
              stroke={seriesColor(index)}
              strokeWidth={2}
              // Channels that hide their subscriber count produce null gaps;
              // connecting across them keeps the line readable.
              connectNulls
              dot={data.length === 1}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}
