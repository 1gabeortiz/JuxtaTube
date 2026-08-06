import { useState } from 'react';
import { isLocked, isNotConnected } from '../api/client';
import { ChartCard } from '../components/analytics/ChartCard';
import { TagChips } from '../components/content/TagChips';
import { TagCopyBox } from '../components/content/TagCopyBox';
import { TagFrequencyList } from '../components/content/TagFrequencyList';
import { ErrorCard } from '../components/ui/ErrorCard';
import { LockedNotice } from '../components/ui/LockedNotice';
import { useMyVideos } from '../hooks/useMyVideos';
import {
  useTagExplorer,
  useTagSuggestions,
  type ExplorerMode,
  type ExplorerSearch,
} from '../hooks/useTags';

const VIDEO_CHOICES = 25;

/** Official suggestions require OAuth, so this panel needs a connected channel. */
function TagSuggestionsPanel() {
  const [videoId, setVideoId] = useState<string | null>(null);

  const videos = useMyVideos(VIDEO_CHOICES);
  const suggestions = useTagSuggestions(videoId);

  const usedTags = new Set(
    (suggestions.data?.currentTags ?? []).map((tag) => tag.toLowerCase()),
  );

  return (
    <ChartCard
      title="Official tag suggestions"
      subtitle="What YouTube itself associates with one of your videos. Owner-only data, and free — it costs 1 quota unit."
    >
      <label className="block text-sm text-muted" htmlFor="video-select">
        Pick a video
      </label>
      <select
        id="video-select"
        value={videoId ?? ''}
        onChange={(event) => setVideoId(event.target.value || null)}
        disabled={videos.isPending}
        className="mt-2 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm disabled:opacity-50"
      >
        <option value="">
          {videos.isPending ? 'Loading your videos…' : 'Choose one of your uploads'}
        </option>
        {(videos.data?.videos ?? []).map((video) => (
          <option key={video.id} value={video.id}>
            {video.title}
          </option>
        ))}
      </select>

      <div className="mt-6">
        {suggestions.isPending && videoId !== null ? (
          <p className="text-sm text-muted">Asking YouTube…</p>
        ) : null}

        {suggestions.isError ? (
          isLocked(suggestions.error) ? (
            <p className="text-sm text-muted">
              Unlock owner mode from the header to see these. YouTube releases tag
              suggestions only to the video&rsquo;s owner.
            </p>
          ) : isNotConnected(suggestions.error) ? (
            <p className="text-sm text-muted">
              Connect your channel from the header to see these. YouTube releases
              tag suggestions only to the video&rsquo;s owner.
            </p>
          ) : (
            <ErrorCard
              message={suggestions.error.message}
              onRetry={() => void suggestions.refetch()}
            />
          )
        ) : null}

        {suggestions.data ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold">
                Suggested ({suggestions.data.suggestions.length})
              </h3>
              <p className="mt-1 mb-2 text-xs text-muted">
                Highlighted tags are ones you are not using yet.
              </p>
              <TagChips
                tags={suggestions.data.suggestions.map((item) => item.tag)}
                used={usedTags}
              />
              <TagCopyBox
                tags={suggestions.data.suggestions.map((item) => item.tag)}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold">
                Currently on this video ({suggestions.data.currentTags.length})
              </h3>
              <div className="mt-2">
                <TagChips
                  tags={suggestions.data.currentTags}
                  used={usedTags}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </ChartCard>
  );
}

/** Public tag research. Channel lookups are cheap; keyword searches are not. */
function TagExplorerPanel() {
  const [mode, setMode] = useState<ExplorerMode>('channel');
  const [input, setInput] = useState('');
  const [search, setSearch] = useState<ExplorerSearch | null>(null);

  const explorer = useTagExplorer(search);

  // Submitting explicitly, rather than searching as you type, is a cost decision:
  // in keyword mode every request spends 101 of 10,000 daily quota units.
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const query = input.trim();
    if (query) setSearch({ mode, query });
  }

  return (
    <ChartCard
      title="Tag explorer"
      subtitle="Which tags creators in your niche actually use, ranked by how many videos use them."
    >
      <form onSubmit={handleSubmit}>
        <div
          role="group"
          aria-label="Search mode"
          className="inline-flex rounded-lg border border-line bg-bg p-0.5"
        >
          {(['channel', 'keyword'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              aria-pressed={mode === option}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                mode === option
                  ? 'bg-accent font-semibold text-bg'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {option === 'channel' ? 'By channel' : 'By keyword'}
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs text-muted">
          {mode === 'channel' ? (
            <>
              Costs <span className="font-mono">3</span> of 10,000 daily quota
              units — effectively free. Accepts a channel ID or an @handle.
            </>
          ) : (
            <>
              Costs <span className="font-mono text-warning">101</span> quota
              units, because open-ended search is the one thing YouTube has no
              cheap endpoint for. About 100 searches a day is the ceiling, which
              is why this mode needs owner mode.
            </>
          )}
        </p>

        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              mode === 'channel' ? '@channelhandle or UC…' : 'beginner camera setup'
            }
            aria-label={mode === 'channel' ? 'Channel ID or handle' : 'Keyword'}
            className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={input.trim() === '' || explorer.isFetching}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {explorer.isFetching ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>

      <div className="mt-6">
        {explorer.isError ? (
          isLocked(explorer.error) ? (
            <LockedNotice
              what="Keyword search"
              reason="Each keyword search spends 101 of the 10,000 quota units YouTube grants this app per day, so an open endpoint could exhaust it in a few minutes. Channel search costs 3 units and stays open to everyone."
            />
          ) : (
            <ErrorCard
              message={explorer.error.message}
              onRetry={() => void explorer.refetch()}
            />
          )
        ) : null}

        {explorer.data ? (
          <>
            <p className="mb-3 text-xs text-muted">
              {explorer.data.tags.length} tags across{' '}
              {explorer.data.videosScanned} videos from{' '}
              <span className="text-ink">{explorer.data.query}</span>. Spent{' '}
              <span className="font-mono">{explorer.data.quotaCost}</span> quota
              units.
            </p>
            <TagCopyBox tags={explorer.data.tags.map((entry) => entry.tag)} />

            <div className="mt-6">
              <TagFrequencyList
                tags={explorer.data.tags}
                videosScanned={explorer.data.videosScanned}
              />
            </div>
          </>
        ) : null}

        {!explorer.data && !explorer.isError && search === null ? (
          <p className="text-sm text-muted">
            Search a channel or keyword to see results.
          </p>
        ) : null}
      </div>
    </ChartCard>
  );
}

export function TagsPage() {
  return (
    <section>
      <h1 className="text-3xl">Tags</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Two different questions about tags: what YouTube recommends for your own
        video, and what other creators in your niche are actually using.
      </p>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
        <TagSuggestionsPanel />
        <TagExplorerPanel />
      </div>
    </section>
  );
}
