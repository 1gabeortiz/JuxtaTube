import { RecentVideosGrid } from '../components/overview/RecentVideosGrid';
import { StatCard } from '../components/overview/StatCard';
import { ErrorCard } from '../components/ui/ErrorCard';
import { StatCardSkeleton, VideoCardSkeleton } from '../components/ui/LoadingSkeletons';
import { useChannelOverview } from '../hooks/useChannelOverview';
import { useMyVideos } from '../hooks/useMyVideos';
import { formatAbsoluteDate } from '../utils/dateUtils';

const VIDEO_COUNT = 12;

export function OverviewPage() {
  // Two independent queries rather than one combined endpoint: the stat cards
  // can render as soon as channel data lands, without waiting on the video list.
  const channel = useChannelOverview();
  const videos = useMyVideos(VIDEO_COUNT);

  return (
    <section>
      <h1 className="text-3xl">{channel.data?.title ?? 'Overview'}</h1>
      <p className="mt-2 max-w-2xl text-muted">
        {channel.data
          ? `Channel created ${formatAbsoluteDate(channel.data.publishedAt)}.`
          : 'Live public stats for the channel, plus recent uploads and how they are performing.'}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {channel.isPending ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : null}

        {channel.data ? (
          <>
            <StatCard
              label="Subscribers"
              value={channel.data.subscriberCount}
              hint={channel.data.hiddenSubscriberCount ? 'Hidden on the channel' : undefined}
            />
            <StatCard label="Total views" value={channel.data.viewCount} />
            <StatCard label="Videos" value={channel.data.videoCount} />
          </>
        ) : null}
      </div>

      {channel.isError ? (
        <div className="mt-4">
          <ErrorCard
            message={channel.error.message}
            onRetry={() => void channel.refetch()}
          />
        </div>
      ) : null}

      <h2 className="mt-12 text-xl">Recent uploads</h2>

      <div className="mt-4">
        {videos.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <VideoCardSkeleton key={index} />
            ))}
          </div>
        ) : null}

        {videos.isError ? (
          <ErrorCard message={videos.error.message} onRetry={() => void videos.refetch()} />
        ) : null}

        {videos.data ? <RecentVideosGrid videos={videos.data.videos} /> : null}
      </div>
    </section>
  );
}
