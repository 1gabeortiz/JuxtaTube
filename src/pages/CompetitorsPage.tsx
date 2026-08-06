import { useState } from 'react';
import { ChartCard } from '../components/analytics/ChartCard';
import { seriesColor } from '../components/analytics/chartTheme';
import { AddCompetitorForm } from '../components/competitors/AddCompetitorForm';
import { CompetitorCard } from '../components/competitors/CompetitorCard';
import {
  CompetitorGrowthChart,
  type GrowthMetric,
} from '../components/competitors/CompetitorGrowthChart';
import { ErrorCard } from '../components/ui/ErrorCard';
import { ChartSkeleton, StatCardSkeleton } from '../components/ui/LoadingSkeletons';
import { useCompetitorHistory, useCompetitors } from '../hooks/useCompetitors';

const HISTORY_DAYS = 90;

const METRIC_LABELS: Record<GrowthMetric, string> = {
  subscriberCount: 'Subscribers',
  viewCount: 'Total views',
};

export function CompetitorsPage() {
  const [metric, setMetric] = useState<GrowthMetric>('subscriberCount');

  const competitors = useCompetitors();
  const history = useCompetitorHistory(HISTORY_DAYS);

  const tracked = competitors.data?.competitors ?? [];

  return (
    <section>
      <h1 className="text-3xl">Competitors</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Public stats for channels in your niche, plus growth over time. YouTube
        exposes no history for channels you don&rsquo;t own, so this app records a
        snapshot every day and builds the trend itself.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <AddCompetitorForm
            trackedCount={tracked.length}
            maxTracked={competitors.data?.maxTracked ?? 50}
          />
        </div>

        <div className="lg:col-span-2">
          {competitors.isPending ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          ) : null}

          {competitors.isError ? (
            <ErrorCard
              message={competitors.error.message}
              onRetry={() => void competitors.refetch()}
            />
          ) : null}

          {competitors.data && tracked.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-surface/50 p-10 text-center">
              <p className="font-display text-lg">No channels tracked yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                Add a channel to start recording its stats. The first snapshot
                lands within a day, and the growth chart fills in from there.
              </p>
            </div>
          ) : null}

          {tracked.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {tracked.map((competitor, index) => (
                <CompetitorCard
                  key={competitor.channelId}
                  competitor={competitor}
                  color={seriesColor(index)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {tracked.length > 0 ? (
        <div className="mt-8">
          {history.isPending ? <ChartSkeleton /> : null}

          {history.isError ? (
            <ErrorCard
              message={history.error.message}
              onRetry={() => void history.refetch()}
            />
          ) : null}

          {history.data ? (
            <ChartCard
              title="Growth over time"
              subtitle={`Recorded daily since tracking began. Showing up to ${HISTORY_DAYS} days.`}
            >
              <div
                role="group"
                aria-label="Metric"
                className="mb-4 inline-flex rounded-lg border border-line bg-bg p-0.5"
              >
                {(Object.keys(METRIC_LABELS) as GrowthMetric[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setMetric(option)}
                    aria-pressed={option === metric}
                    className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                      option === metric
                        ? 'bg-accent font-semibold text-bg'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    {METRIC_LABELS[option]}
                  </button>
                ))}
              </div>

              <CompetitorGrowthChart
                histories={history.data.histories}
                metric={metric}
              />
            </ChartCard>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
