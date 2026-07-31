// Placeholder shells until the /api/youtube/channel-overview route exists.
const STAT_SLOTS = [
  { label: 'Subscribers' },
  { label: 'Total views' },
  { label: 'Videos' },
];

export function OverviewPage() {
  return (
    <section>
      <h1 className="text-3xl">Overview</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Live public stats for the channel, plus the most recent uploads and how they are
        performing.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STAT_SLOTS.map(({ label }) => (
          <div key={label} className="rounded-xl border border-line bg-surface p-5">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 font-mono text-3xl tabular-nums text-ink">—</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-line bg-surface/50 p-12 text-center text-sm text-muted">
        Waiting on the YouTube Data API connection.
      </div>
    </section>
  );
}
