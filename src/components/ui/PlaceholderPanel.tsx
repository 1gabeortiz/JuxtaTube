interface PlaceholderPanelProps {
  title: string;
  description: string;
}

/** Temporary stand-in for pages that get built in later phases. */
export function PlaceholderPanel({ title, description }: PlaceholderPanelProps) {
  return (
    <section>
      <h1 className="text-3xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-muted">{description}</p>

      <div className="mt-8 rounded-xl border border-dashed border-line bg-surface/50 p-12 text-center text-sm text-muted">
        Not built yet.
      </div>
    </section>
  );
}
