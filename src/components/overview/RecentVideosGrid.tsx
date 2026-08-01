import type { VideoSummary } from '../../api/types';
import { formatAbsoluteDate, formatRelativeDate } from '../../utils/dateUtils';
import { formatExact, formatNumber } from '../../utils/formatNumber';
import { parseDuration } from '../../utils/parseDuration';

interface RecentVideosGridProps {
  videos: VideoSummary[];
}

export function RecentVideosGrid({ videos }: RecentVideosGridProps) {
  if (videos.length === 0) {
    return <p className="text-sm text-muted">No videos found on this channel.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}

function VideoCard({ video }: { video: VideoSummary }) {
  return (
    <a
      href={`https://www.youtube.com/watch?v=${video.id}`}
      target="_blank"
      // noreferrer also implies noopener, which stops the opened tab from
      // being able to script this one.
      rel="noreferrer"
      className="group animate-rise overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-accent/50"
    >
      <div className="relative aspect-video overflow-hidden bg-bg">
        <img
          src={video.thumbnailUrl}
          // Empty alt: the title sits right below, so announcing the thumbnail
          // separately would just repeat it for screen reader users.
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute right-2 bottom-2 rounded bg-bg/85 px-1.5 py-0.5 font-mono text-xs tabular-nums">
          {parseDuration(video.duration)}
        </span>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 text-sm leading-snug font-medium">{video.title}</h3>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span className="font-mono tabular-nums" title={`${formatExact(video.viewCount)} views`}>
            {formatNumber(video.viewCount)} views
          </span>
          <span className="font-mono tabular-nums" title={`${formatExact(video.likeCount)} likes`}>
            {formatNumber(video.likeCount)} likes
          </span>
          <time dateTime={video.publishedAt} title={formatAbsoluteDate(video.publishedAt)}>
            {formatRelativeDate(video.publishedAt)}
          </time>
        </div>
      </div>
    </a>
  );
}
