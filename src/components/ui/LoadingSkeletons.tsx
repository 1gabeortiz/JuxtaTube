function Shimmer({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-line ${className}`} />;
}

/**
 * Skeletons rather than spinners: they reserve the same space the real content
 * will occupy, so the page doesn't jump when data arrives.
 */
export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <Shimmer className="h-4 w-24" />
      <Shimmer className="mt-3 h-8 w-32" />
    </div>
  );
}

export function VideoCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <Shimmer className="aspect-video w-full rounded-none" />
      <div className="p-4">
        <Shimmer className="h-4 w-full" />
        <Shimmer className="mt-2 h-4 w-2/3" />
        <Shimmer className="mt-4 h-3 w-1/2" />
      </div>
    </div>
  );
}
