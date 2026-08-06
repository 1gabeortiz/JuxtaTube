import type { TagFrequency } from '../../api/types';

interface TagFrequencyListProps {
  tags: TagFrequency[];
  /** Videos scanned, so a count can be shown as a share of the sample. */
  videosScanned: number;
}

export function TagFrequencyList({ tags, videosScanned }: TagFrequencyListProps) {
  if (tags.length === 0) {
    return (
      <p className="text-sm text-muted">
        No tags found. Many channels leave tags empty, and YouTube only exposes
        them when the creator filled them in.
      </p>
    );
  }

  const maxCount = tags[0]?.count ?? 1;

  return (
    <ol className="space-y-2.5">
      {tags.map((entry) => (
        <li key={entry.tag}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{entry.tag}</span>
            <span
              className="shrink-0 font-mono tabular-nums text-xs text-muted"
              title={`Used in ${entry.count} of ${videosScanned} videos scanned`}
            >
              {entry.count}
            </span>
          </div>

          <div className="mt-1 h-1 overflow-hidden rounded-full bg-bg">
            <div
              className="h-full rounded-full bg-positive"
              style={{ width: `${Math.max(2, (entry.count / maxCount) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
