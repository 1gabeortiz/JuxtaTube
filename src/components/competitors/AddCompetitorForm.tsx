import { useState } from 'react';
import { useAddCompetitor } from '../../hooks/useCompetitors';

interface AddCompetitorFormProps {
  trackedCount: number;
  maxTracked: number;
}

export function AddCompetitorForm({
  trackedCount,
  maxTracked,
}: AddCompetitorFormProps) {
  const [input, setInput] = useState('');
  const add = useAddCompetitor();

  const atLimit = trackedCount >= maxTracked;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const channel = input.trim();
    if (channel === '') return;

    add.mutate(channel, {
      // Clear only on success, so a rejected value stays visible to correct.
      onSuccess: () => setInput(''),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-surface p-5">
      <label className="block text-sm" htmlFor="competitor-input">
        Track a channel
      </label>
      <p className="mt-1 text-xs text-muted">
        Paste an @handle or a channel ID. Tracking every channel costs 1 quota
        unit total, because they are all fetched in one batched request.
      </p>

      <div className="mt-3 flex gap-2">
        <input
          id="competitor-input"
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="@channelhandle or UC…"
          disabled={atLimit}
          className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={input.trim() === '' || add.isPending || atLimit}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {add.isPending ? 'Adding…' : 'Track'}
        </button>
      </div>

      {atLimit ? (
        <p className="mt-2 text-xs text-warning">
          Tracking {maxTracked} channels, the maximum. Remove one to add another.
        </p>
      ) : null}

      {add.isError ? (
        <p className="mt-2 text-xs text-warning">{add.error.message}</p>
      ) : null}
    </form>
  );
}
