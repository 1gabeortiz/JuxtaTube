import { useEffect, useState } from 'react';
import { YOUTUBE_TAG_LIMIT, packTags } from '../../utils/packTags';

interface TagCopyBoxProps {
  /** Ranked tags. Highest-value ones must come first — packing is greedy. */
  tags: string[];
}

/**
 * Builds a ready-to-paste tag string that fits YouTube's 500-character field,
 * and copies it to the clipboard.
 *
 * The text is shown rather than hidden behind the button so it stays usable when
 * the Clipboard API is unavailable — it needs a secure context, so a plain-HTTP
 * host would otherwise leave the feature dead with no way out.
 */
export function TagCopyBox({ tags }: TagCopyBoxProps) {
  const packed = packTags(tags);
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(packed.text);
      setCopied(true);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }

  if (packed.tags.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg border border-line bg-bg p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">
          <span className="text-ink">{packed.tags.length}</span> tags ·{' '}
          <span className="font-mono tabular-nums">
            {packed.characterCount}/{YOUTUBE_TAG_LIMIT}
          </span>{' '}
          characters
          {packed.omitted > 0 ? ` · ${packed.omitted} didn't fit` : null}
        </p>

        <button
          type="button"
          onClick={() => void handleCopy()}
          className="rounded-lg border border-line px-3 py-1.5 text-xs transition-colors hover:bg-surface"
        >
          {copied ? 'Copied' : 'Copy tags'}
        </button>
      </div>

      <textarea
        readOnly
        value={packed.text}
        rows={3}
        aria-label="Tags ready to paste into YouTube"
        onFocus={(event) => event.target.select()}
        className="mt-2 w-full resize-y rounded border border-line bg-surface p-2 font-mono text-xs text-muted"
      />

      {failed ? (
        <p className="mt-2 text-xs text-warning">
          Clipboard access was blocked. Select the text above and copy it manually.
        </p>
      ) : null}
    </div>
  );
}
