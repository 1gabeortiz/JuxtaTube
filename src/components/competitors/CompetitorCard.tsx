import type { Competitor } from '../../api/types';
import { useRemoveCompetitor } from '../../hooks/useCompetitors';
import { useOwnerMode } from '../../hooks/useOwnerMode';
import { formatNumber } from '../../utils/formatNumber';

interface CompetitorCardProps {
  competitor: Competitor;
  /** Matches the channel's line color in the growth chart. */
  color: string;
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="font-mono text-lg tabular-nums">
        {value === null ? '—' : formatNumber(value)}
      </p>
    </div>
  );
}

export function CompetitorCard({ competitor, color }: CompetitorCardProps) {
  const remove = useRemoveCompetitor();
  const { isUnlocked } = useOwnerMode();

  return (
    <div className="animate-rise rounded-xl border border-line bg-surface p-5">
      <div className="flex items-start gap-3">
        {/* Color chip ties this card to its line in the chart below. */}
        <span
          aria-hidden="true"
          className="mt-1.5 size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />

        {competitor.thumbnailUrl ? (
          <img
            src={competitor.thumbnailUrl}
            alt=""
            loading="lazy"
            className="size-10 shrink-0 rounded-full"
          />
        ) : null}

        <div className="min-w-0 flex-1">
          <p className="truncate font-display font-semibold" title={competitor.channelName}>
            {competitor.channelName}
          </p>
          <a
            href={`https://www.youtube.com/channel/${competitor.channelId}`}
            target="_blank"
            rel="noreferrer noopener"
            className="text-xs text-muted underline-offset-2 hover:underline"
          >
            View on YouTube
          </a>
        </div>

        {isUnlocked ? (
          <button
            type="button"
            onClick={() => remove.mutate(competitor.channelId)}
            disabled={remove.isPending}
            aria-label={`Stop tracking ${competitor.channelName}`}
            className="shrink-0 rounded-lg border border-line px-2 py-1 text-xs text-muted transition-colors hover:border-warning hover:text-warning disabled:opacity-50"
          >
            {remove.isPending ? '…' : 'Remove'}
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat
          label={competitor.hiddenSubscriberCount ? 'Subs (hidden)' : 'Subscribers'}
          value={competitor.hiddenSubscriberCount ? null : competitor.subscriberCount}
        />
        <Stat label="Views" value={competitor.viewCount} />
        <Stat label="Videos" value={competitor.videoCount} />
      </div>

      {remove.isError ? (
        <p className="mt-3 text-xs text-warning">{remove.error.message}</p>
      ) : null}
    </div>
  );
}
