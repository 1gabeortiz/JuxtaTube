import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AgeGenderSlice } from '../../api/types';
import {
  AXIS_PROPS,
  CHART_COLORS,
  TOOLTIP_STYLE,
  tooltipPercent,
} from './chartTheme';
import { EmptyChartState } from './ChartCard';

interface AgeGenderChartProps {
  slices: AgeGenderSlice[];
}

interface AgeRow {
  label: string;
  male: number;
  female: number;
  other: number;
}

/** "age25-34" -> "25–34", "age65-" -> "65+". */
function ageLabel(ageGroup: string): string {
  const range = ageGroup.replace(/^age/, '');
  return range.endsWith('-') ? `${range.slice(0, -1)}+` : range.replace('-', '–');
}

/**
 * Google returns one row per age/gender combination. Charting needs one row per
 * age group with genders as separate series, so the rows get pivoted.
 */
function pivotByAge(slices: AgeGenderSlice[]): AgeRow[] {
  const byAge = new Map<string, AgeRow>();

  for (const slice of slices) {
    const row = byAge.get(slice.ageGroup) ?? {
      label: ageLabel(slice.ageGroup),
      male: 0,
      female: 0,
      other: 0,
    };

    if (slice.gender === 'male') row.male = slice.viewerPercentage;
    else if (slice.gender === 'female') row.female = slice.viewerPercentage;
    else row.other = slice.viewerPercentage;

    byAge.set(slice.ageGroup, row);
  }

  // Sort by the raw key so "age13-17" precedes "age18-24" numerically.
  return [...byAge.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, row]) => row);
}

export function AgeGenderChart({ slices }: AgeGenderChartProps) {
  if (slices.length === 0) {
    return <EmptyChartState message="Not enough viewers to report demographics." />;
  }

  const data = pivotByAge(slices);
  const hasOther = data.some((row) => row.other > 0);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid stroke={CHART_COLORS.line} vertical={false} />
        <XAxis dataKey="label" {...AXIS_PROPS} />
        <YAxis unit="%" {...AXIS_PROPS} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={tooltipPercent} />
        <Legend wrapperStyle={{ fontSize: '0.75rem' }} />

        <Bar dataKey="male" name="Male" fill={CHART_COLORS.accent} radius={[3, 3, 0, 0]} />
        <Bar
          dataKey="female"
          name="Female"
          fill={CHART_COLORS.positive}
          radius={[3, 3, 0, 0]}
        />
        {hasOther ? (
          <Bar
            dataKey="other"
            name="Other"
            fill={CHART_COLORS.warning}
            radius={[3, 3, 0, 0]}
          />
        ) : null}
      </BarChart>
    </ResponsiveContainer>
  );
}
