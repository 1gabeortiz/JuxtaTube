interface ErrorCardProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorCard({ message, onRetry }: ErrorCardProps) {
  return (
    <div className="rounded-xl border border-warning/40 bg-warning/5 p-6" role="alert">
      <p className="font-display font-semibold text-warning">Couldn&rsquo;t load this data</p>
      <p className="mt-2 text-sm text-muted">{message}</p>

      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg border border-line px-3 py-2 text-sm transition-colors hover:bg-surface"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
