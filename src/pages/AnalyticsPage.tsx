import { useState } from 'react';
import { isLocked, isNotConnected } from '../api/client';
import { AgeGenderChart } from '../components/analytics/AgeGenderChart';
import { ChartCard } from '../components/analytics/ChartCard';
import { CountryBreakdown } from '../components/analytics/CountryBreakdown';
import { RangeSelector } from '../components/analytics/RangeSelector';
import { TrafficSourcesChart } from '../components/analytics/TrafficSourcesChart';
import { WatchTimeChart } from '../components/analytics/WatchTimeChart';
import { StatCard } from '../components/overview/StatCard';
import { ErrorCard } from '../components/ui/ErrorCard';
import { ChartSkeleton, StatCardSkeleton } from '../components/ui/LoadingSkeletons';
import { LockedNotice } from '../components/ui/LockedNotice';
import {
  useAnalyticsOverview,
  useDemographics,
  useTrafficSources,
  type RangeOption,
} from '../hooks/useAnalytics';
import { formatAbsoluteDate } from '../utils/dateUtils';
import { formatWatchTime } from '../utils/formatWatchTime';

/**
 * A missing connection is a state to explain, not an error to apologize for, so
 * it gets its own panel.
 */
function NotConnectedNotice() {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface/50 p-10 text-center">
      <p className="font-display text-lg">Connect your channel to see analytics</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Watch time, audience demographics, and traffic sources are private to the
        channel owner, so YouTube only releases them to an authorized account. Use
        the <span className="text-ink">Connect channel</span> button in the header.
      </p>
    </div>
  );
}

export function AnalyticsPage() {
  const [days, setDays] = useState<RangeOption>(28);

  const overview = useAnalyticsOverview(days);
  const demographics = useDemographics(days);
  const traffic = useTrafficSources(days);

  // Any one of the three reveals either state; they all need the same key and
  // the same token. Locked is checked first because it fails earlier — a locked
  // request never gets far enough to discover whether a channel is connected.
  const locked =
    isLocked(overview.error) || isLocked(demographics.error) || isLocked(traffic.error);

  const notConnected =
    isNotConnected(overview.error) ||
    isNotConnected(demographics.error) ||
    isNotConnected(traffic.error);

  const totals = overview.data?.totals;

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl">Analytics</h1>
          <p className="mt-2 max-w-2xl text-muted">
            {overview.data
              ? `${formatAbsoluteDate(overview.data.startDate)} – ${formatAbsoluteDate(overview.data.endDate)}. YouTube finalizes data a couple of days late, so the range ends there.`
              : 'Private performance data for your channel, straight from the YouTube Analytics API.'}
          </p>
        </div>

        {locked || notConnected ? null : (
          <RangeSelector value={days} onChange={setDays} />
        )}
      </div>

      {locked ? (
        <div className="mt-8">
          <LockedNotice what="This channel's analytics" />
        </div>
      ) : notConnected ? (
        <div className="mt-8">
          <NotConnectedNotice />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {overview.isPending ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : null}

            {totals ? (
              <>
                <StatCard label="Views" value={totals.views} />
                <StatCard
                  label="Watch time"
                  value={totals.estimatedMinutesWatched}
                  display={formatWatchTime(totals.estimatedMinutesWatched)}
                />
                <StatCard
                  label="Net subscribers"
                  value={totals.netSubscribers}
                  display={`${totals.netSubscribers >= 0 ? '+' : ''}${totals.netSubscribers}`}
                  hint={`${totals.subscribersGained} gained, ${totals.subscribersLost} lost`}
                />
              </>
            ) : null}
          </div>

          <div className="mt-8 space-y-6">
            {overview.isPending ? <ChartSkeleton /> : null}

            {overview.isError && !isNotConnected(overview.error) ? (
              <ErrorCard
                message={overview.error.message}
                onRetry={() => void overview.refetch()}
              />
            ) : null}

            {overview.data ? (
              <ChartCard
                title="Views and watch time"
                subtitle="Daily totals across the selected range."
              >
                <WatchTimeChart days={overview.data.days} />
              </ChartCard>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-2">
              {demographics.isPending ? (
                <>
                  <ChartSkeleton />
                  <ChartSkeleton />
                </>
              ) : null}

              {demographics.data ? (
                <>
                  <ChartCard
                    title="Age and gender"
                    subtitle="Share of views. Only viewers signed in to Google are counted, so this covers a subset of your audience."
                  >
                    <AgeGenderChart slices={demographics.data.ageGender} />
                  </ChartCard>

                  <ChartCard title="Top countries" subtitle="Ranked by views.">
                    <CountryBreakdown countries={demographics.data.countries} />
                  </ChartCard>
                </>
              ) : null}
            </div>

            {demographics.isError && !isNotConnected(demographics.error) ? (
              <ErrorCard
                message={demographics.error.message}
                onRetry={() => void demographics.refetch()}
              />
            ) : null}

            {traffic.isPending ? <ChartSkeleton /> : null}

            {traffic.isError && !isNotConnected(traffic.error) ? (
              <ErrorCard
                message={traffic.error.message}
                onRetry={() => void traffic.refetch()}
              />
            ) : null}

            {traffic.data ? (
              <ChartCard
                title="Traffic sources"
                subtitle="How viewers found these videos."
              >
                <TrafficSourcesChart sources={traffic.data.sources} />
              </ChartCard>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
