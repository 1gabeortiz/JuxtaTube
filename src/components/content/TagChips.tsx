interface TagChipsProps {
  tags: string[];
  /**
   * Lowercased tags already on the video. Matching chips are dimmed so the ones
   * that would actually be new stand out — the whole point of the comparison.
   */
  used?: Set<string>;
}

export function TagChips({ tags, used }: TagChipsProps) {
  if (tags.length === 0) {
    return <p className="text-sm text-muted">None.</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const alreadyUsed = used?.has(tag.toLowerCase()) ?? false;

        return (
          <li
            key={tag}
            className={`rounded-full border px-3 py-1 text-xs ${
              alreadyUsed
                ? 'border-line text-muted'
                : 'border-accent/50 bg-accent/10 text-ink'
            }`}
            title={alreadyUsed ? 'Already on this video' : 'Not yet used'}
          >
            {tag}
          </li>
        );
      })}
    </ul>
  );
}
