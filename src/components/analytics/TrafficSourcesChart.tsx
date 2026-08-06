import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TrafficSourceSlice } from '../../api/types';
import { formatNumber } from '../../utils/formatNumber';
import {
  AXIS_PROPS,
  CHART_COLORS,
  TOOLTIP_STYLE,
  tooltipNumber,
} from './chartTheme';
import { EmptyChartState } from './ChartCard';

interface TrafficSourcesChartProps {
  sources: TrafficSourceSlice[];
}

const MAX_BARS = 8;

export function TrafficSourcesChart({ sources }: TrafficSourcesChartProps) {
  if (sources.length === 0) {
    return <EmptyChartState message="No traffic source data in this range." />;
  }

  // Already sorted by views on the server. Trimming the long tail keeps the
  // labels legible; the omitted sources are rounding errors by definition.
  const data = sources.slice(0, MAX_BARS).map((source) => ({
    label: source.label,
    views: source.views,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, bottom: 0, left: 44 }}
      >
        <CartesianGrid stroke={CHART_COLORS.line} horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(value: number) => formatNumber(value)}
          {...AXIS_PROPS}
        />
        <YAxis type="category" dataKey="label" width={110} {...AXIS_PROPS} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={tooltipNumber} />
        <Bar dataKey="views" name="Views" fill={CHART_COLORS.accent} radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
